"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DNI_PROBNE } from "@/lib/abonament-cennik";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { hitLimit, visitorKey } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/html";

export type AuthResult = { error: string } | undefined;

/**
 * Mail do operatora o nowym biurze.
 *
 * Rejestracja jest na kod, ale kod nie mówi, kto i kiedy go użył. Bez tego
 * maila pierwszą informacją o nowym koncie byłoby zużycie AI na rachunku.
 * Błąd wysyłki nie przerywa rejestracji - konto już istnieje.
 */
async function powiadomONowymBiurze(dane: {
  agencyName: string;
  fullName: string;
  email: string;
  phone: string;
}): Promise<void> {
  const klucz = process.env.RESEND_API_KEY;
  if (!klucz) return;
  try {
    const { Resend } = await import("resend");
    await new Resend(klucz).emails.send({
      from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
      to: process.env.NOTIFICATION_EMAIL ?? "nieruchomoscispectra@gmail.com",
      subject: `Nowe biuro w AgentSpace: ${dane.agencyName}`,
      html: `
        <div style="font-family:-apple-system,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="color:#10b981;margin:0 0 16px;">Nowe biuro założyło konto</h2>
          <p style="margin:0 0 6px;"><strong>${escapeHtml(dane.agencyName)}</strong></p>
          <p style="margin:0 0 6px;">${escapeHtml(dane.fullName)}</p>
          <p style="margin:0 0 6px;">${escapeHtml(dane.email)}</p>
          <p style="margin:0 0 16px;">${escapeHtml(dane.phone || "bez telefonu")}</p>
          <p style="color:#71717a;font-size:13px;">Okres próbny startuje od teraz.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Powiadomienie o nowym biurze:", err);
  }
}

/**
 * Rejestracja właściciela biura: tworzy usera, agencję i profil owner,
 * następnie loguje.
 */
export async function signUpOwner(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const agencyName = String(formData.get("agencyName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || fullName.length < 2) return { error: "Podaj imię i nazwisko" };
  if (!agencyName || agencyName.length < 2) return { error: "Podaj nazwę biura" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Niepoprawny email" };
  if (password.length < 8) return { error: "Hasło min. 8 znaków" };

  // Boty wypełniają ukryte pole. Udajemy błąd ogólny, żeby nie podpowiadać.
  if (String(formData.get("website") ?? "")) return { error: "Nie udało się utworzyć konta. Spróbuj ponownie." };

  // Rejestracja na zaproszenie.
  //
  // Każde założone biuro dostaje pulę AI na koszt operatora, więc konto nie
  // może powstawać bez jego wiedzy. Kod ustawiamy w zmiennej SIGNUP_CODE i
  // podajemy biuru przy rozmowie. Bez ustawionej zmiennej rejestracja jest
  // otwarta - tak zostaje w środowisku lokalnym i testowym.
  const wymaganyKod = process.env.SIGNUP_CODE;
  if (wymaganyKod) {
    const podany = String(formData.get("inviteCode") ?? "").trim();
    if (podany.toLowerCase() !== wymaganyKod.toLowerCase()) {
      return { error: "Niepoprawny kod zaproszenia. Dostaniesz go od nas przy rozmowie." };
    }
  }

  // Każde konto dostaje AI na koszt operatora, więc ograniczamy zakładanie
  // biur z jednego adresu (np. bot w pętli).
  if (await hitLimit(`signup:ip:${await visitorKey()}`, 3, 24 * 3600)) {
    return { error: "Zbyt wiele rejestracji z tego adresu. Spróbuj jutro albo napisz do nas." };
  }

  const admin = createSupabaseAdmin();

  // 1. Utwórz usera (bez maila potwierdzającego - od razu aktywny)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr || !created.user) {
    if (createErr?.message?.toLowerCase().includes("already")) {
      return { error: "Ten email jest już zarejestrowany. Zaloguj się." };
    }
    return { error: "Nie udało się utworzyć konta. Spróbuj ponownie." };
  }

  const userId = created.user.id;

  // 2. Agencja
  //
  // Nowe biuro dostaje okres próbny (migracja v37). Gdy migracji jeszcze nie
  // ma, PostgREST odrzuca nieznane kolumny, więc powtarzamy zapis bez nich:
  // rejestracja nie może się wywalić tylko dlatego, że ktoś nie odpalił SQL.
  const trial = {
    trial_ends_at: new Date(Date.now() + DNI_PROBNE * 86_400_000).toISOString(),
    subscription_status: "trial",
  };
  let { data: agency, error: agencyErr } = await admin
    .from("agencies")
    .insert({ name: agencyName, owner_id: userId, ...trial })
    .select()
    .single();

  if (agencyErr) {
    ({ data: agency, error: agencyErr } = await admin
      .from("agencies")
      .insert({ name: agencyName, owner_id: userId })
      .select()
      .single());
  }

  if (agencyErr || !agency) {
    await admin.auth.admin.deleteUser(userId); // rollback
    return { error: "Nie udało się utworzyć biura. Spróbuj ponownie." };
  }

  // 3. Profil owner
  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    agency_id: agency.id,
    full_name: fullName,
    email,
    phone: phone || null,
    role: "owner",
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    await admin.from("agencies").delete().eq("id", agency.id);
    return { error: "Nie udało się dokończyć rejestracji. Spróbuj ponownie." };
  }

  // 4. Powiadom operatora. Bez tego nowe biuro powstaje bez jego wiedzy,
  //    a to on płaci za zużycie AI i on wystawia fakturę.
  await powiadomONowymBiurze({ agencyName, fullName, email, phone });

  // 5. Zaloguj (ustawia cookie sesji)
  const supabase = await createSupabaseServerClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) return { error: "Konto utworzone, ale logowanie nie powiodło się. Zaloguj się ręcznie." };

  redirect("/app");
}

/**
 * Logowanie email/hasło.
 */
export async function signIn(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Podaj email i hasło" };

  // Ochrona przed zgadywaniem haseł: 20 prób na godzinę na adres e-mail.
  if (await hitLimit(`login:${email}`, 20, 3600)) {
    return { error: "Zbyt wiele prób logowania. Odczekaj chwilę albo zresetuj hasło." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Niepoprawny email lub hasło" };

  redirect("/app");
}

/**
 * Wylogowanie.
 */
export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Przyjęcie zaproszenia: agent ustawia hasło, tworzy konto w agencji.
 */
export async function acceptInvitation(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const token = String(formData.get("token") ?? "");
  const fullNameInput = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!token) return { error: "Brak tokenu zaproszenia" };
  if (!fullNameInput || fullNameInput.length < 2) return { error: "Podaj imię i nazwisko" };
  if (password.length < 8) return { error: "Hasło min. 8 znaków" };

  const admin = createSupabaseAdmin();

  const { data: invitation } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (!invitation) return { error: "Zaproszenie nieważne lub już wykorzystane" };
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: "Zaproszenie wygasło. Poproś właściciela o nowe." };
  }

  const email = invitation.email.toLowerCase();
  const fullName = fullNameInput || invitation.full_name || "";

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr || !created.user) {
    if (createErr?.message?.toLowerCase().includes("already")) {
      return { error: "Ten email ma już konto. Zaloguj się." };
    }
    return { error: "Nie udało się utworzyć konta. Spróbuj ponownie." };
  }

  const userId = created.user.id;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    agency_id: invitation.agency_id,
    full_name: fullName,
    email,
    phone: phone || null,
    role: invitation.role ?? "agent",
    // Menedżera przypisujemy tylko agentom.
    manager_id: (invitation.role ?? "agent") === "agent" ? (invitation.manager_id ?? null) : null,
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    return { error: "Nie udało się dokończyć rejestracji." };
  }

  await admin.from("invitations").update({ status: "accepted" }).eq("id", invitation.id);

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect("/app");
}
