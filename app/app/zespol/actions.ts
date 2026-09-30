"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { APP_URL } from "@/lib/supabase/config";
import { sendAgencyMonthlyReport } from "@/lib/report";
import { ROLE_LABELS, type UserRole } from "@/lib/types";

const VALID_ROLES: UserRole[] = ["owner", "manager", "agent"];

export type ZespolResult =
  | { error?: string; success?: string; link?: string; emailSent?: boolean }
  | undefined;

/**
 * Manualne wysłanie raportu miesięcznego na email właściciela (podgląd).
 */
export async function sendMonthlyReportNow(
  _prev: ZespolResult,
  _formData: FormData,
): Promise<ZespolResult> {
  const owner = await requireOwner();
  const ok = await sendAgencyMonthlyReport(owner.agency_id!);
  if (!ok) return { error: "Nie udało się wysłać raportu (sprawdź konfigurację email)." };
  return { success: `Raport wysłany na ${owner.email}.` };
}

/**
 * Zaproszenie do zespołu z rolą (CEO / Menedżer / Agent).
 * Dla agenta można z góry przypisać menedżera. Tworzy rekord invitation i wysyła email z linkiem.
 */
export async function inviteAgent(
  _prev: ZespolResult,
  formData: FormData,
): Promise<ZespolResult> {
  const owner = await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleRaw = String(formData.get("role") ?? "agent").trim();
  const role: UserRole = (VALID_ROLES as string[]).includes(roleRaw) ? (roleRaw as UserRole) : "agent";
  const fullName = String(formData.get("fullName") ?? "").trim();
  const managerIdRaw = String(formData.get("managerId") ?? "").trim();
  // Menedżera przypisujemy tylko agentom.
  const managerId = role === "agent" && managerIdRaw ? managerIdRaw : null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Niepoprawny email" };

  const admin = createSupabaseAdmin();

  // Czy już jest w zespole?
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("agency_id", owner.agency_id!)
    .eq("email", email)
    .maybeSingle();
  if (existing) return { error: "Ta osoba jest już w Twoim zespole." };

  // Walidacja menedżera (musi być w tej agencji i mieć rolę menedżera lub CEO).
  if (managerId) {
    const { data: mgr } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", managerId)
      .eq("agency_id", owner.agency_id!)
      .maybeSingle();
    if (!mgr || (mgr.role !== "manager" && mgr.role !== "owner")) {
      return { error: "Wybrany menedżer jest nieprawidłowy." };
    }
  }

  // Usuń stare pending zaproszenia dla tego emaila w tej agencji
  await admin
    .from("invitations")
    .delete()
    .eq("agency_id", owner.agency_id!)
    .eq("email", email)
    .eq("status", "pending");

  const { data: invitation, error } = await admin
    .from("invitations")
    .insert({
      agency_id: owner.agency_id!,
      email,
      role,
      manager_id: managerId,
      full_name: fullName || null,
      invited_by: owner.id,
    })
    .select("token")
    .single();

  if (error || !invitation) return { error: "Nie udało się utworzyć zaproszenia." };

  const link = `${APP_URL}/zaproszenie/${invitation.token}`;

  // Spróbuj wysłać email (jeśli Resend skonfigurowany). Bez zweryfikowanej domeny
  // Resend dostarcza tylko na adres właściciela konta - dlatego zawsze zwracamy
  // też link do ręcznego wysłania.
  let emailSent = false;
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const { error: sendError } = await resend.emails.send({
        from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
        to: email,
        subject: `${owner.full_name ?? "Twój szef"} zaprasza Cię do AgentSpace`,
        html: `
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
            <h2 style="color:#10b981;">Zaproszenie do zespołu</h2>
            <p style="color:#3f3f46;font-size:15px;line-height:1.6;">
              <strong>${owner.full_name ?? "Właściciel biura"}</strong> zaprasza Cię do
              <strong>${owner.agency?.name ?? "biura"}</strong> w AgentSpace - platformie do
              treningu sprzedaży nieruchomości z AI, w roli <strong>${ROLE_LABELS[role]}</strong>.
            </p>
            <p style="margin:28px 0;">
              <a href="${link}" style="background:#10b981;color:#09090b;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">
                Dołącz do zespołu →
              </a>
            </p>
            <p style="color:#71717a;font-size:13px;">Link ważny 14 dni. Jeśli to pomyłka - zignoruj tę wiadomość.</p>
          </div>
        `,
      });
      emailSent = !sendError;
      if (sendError) console.error("Invite email error:", sendError);
    } catch (err) {
      console.error("Invite email error:", err);
    }
  }

  revalidatePath("/app/zespol");
  return {
    success: emailSent
      ? `Zaproszenie wysłane mailem do ${email}. Link masz też poniżej.`
      : `Zaproszenie utworzone. Mail nie wyszedł - skopiuj link poniżej i wyślij agentowi.`,
    link,
    emailSent,
  };
}

/**
 * Usuwa agenta z zespołu (profil + konto auth).
 */
/** Co dana osoba trzyma w systemie. Pokazujemy to przed usunięciem. */
export type DorobekAgenta = {
  klienci: number;
  oferty: number;
  transakcje: number;
  zadania: number;
};

export async function policzDorobek(agentId: string): Promise<DorobekAgenta> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();

  const licz = async (tabela: string) => {
    const { count } = await admin
      .from(tabela)
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("agency_id", owner.agency_id!);
    return count ?? 0;
  };

  const [klienci, oferty, transakcje, zadania] = await Promise.all([
    licz("clients"),
    licz("properties"),
    licz("deals"),
    licz("tasks"),
  ]);

  return { klienci, oferty, transakcje, zadania };
}

export type UsuniecieResult = { error?: string } | undefined;

/**
 * Usuwa osobę z zespołu, przepisując jej dorobek na kogoś innego.
 *
 * UWAGA na klucze obce: `clients`, `properties`, `deals`, `tasks` i notatki
 * mają `on delete cascade` na profilu. Samo skasowanie profilu zabierało więc
 * ze sobą całą bazę klientów i ofert tej osoby. Dlatego NAJPIERW przepisujemy
 * dane na przejmującego, a dopiero potem kasujemy profil.
 *
 * To, co jest ściśle osobiste (sesje AI Coacha, cele, dziennik wyników,
 * subskrypcje powiadomień), znika razem z osobą i tak ma być.
 */
export async function removeAgent(agentId: string, formData: FormData): Promise<UsuniecieResult> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();

  const { data: agent } = await admin
    .from("profiles")
    .select("id, agency_id, role")
    .eq("id", agentId)
    .single();

  if (!agent || agent.agency_id !== owner.agency_id) return { error: "Nie ma takiej osoby w Twoim biurze." };
  if (agent.role === "owner") return { error: "Nie można usunąć właściciela biura." };

  // Kto przejmuje dorobek. Domyślnie właściciel, który wykonuje operację.
  const wskazany = String(formData.get("przejmujacy") ?? "").trim();
  let przejmujacy = owner.id;

  if (wskazany && wskazany !== owner.id) {
    const { data: kandydat } = await admin
      .from("profiles")
      .select("id, agency_id")
      .eq("id", wskazany)
      .maybeSingle();
    if (!kandydat || kandydat.agency_id !== owner.agency_id) {
      return { error: "Wskazana osoba nie należy do Twojego biura." };
    }
    if (kandydat.id === agentId) return { error: "Nie można przepisać danych na osobę, którą usuwasz." };
    przejmujacy = kandydat.id;
  }

  for (const tabela of ["clients", "properties", "deals", "tasks"]) {
    const { error } = await admin
      .from(tabela)
      .update({ agent_id: przejmujacy })
      .eq("agent_id", agentId)
      .eq("agency_id", owner.agency_id!);
    if (error) return { error: `Nie udało się przepisać danych (${tabela}): ${error.message}` };
  }

  // Działania trzymają przypisanych w tablicy, więc nie łapie ich klucz obcy.
  // Bez tego w kalendarzu zostałyby zadania przypisane do nikogo.
  const { data: dzialania } = await admin
    .from("activities")
    .select("id, assignee_ids")
    .eq("agency_id", owner.agency_id!)
    .contains("assignee_ids", [agentId]);

  for (const d of (dzialania ?? []) as { id: string; assignee_ids: string[] | null }[]) {
    const nowe = [...new Set((d.assignee_ids ?? []).map((x) => (x === agentId ? przejmujacy : x)))];
    await admin.from("activities").update({ assignee_ids: nowe }).eq("id", d.id);
  }

  await admin.from("profiles").delete().eq("id", agentId);
  await admin.auth.admin.deleteUser(agentId).catch(() => {});

  revalidatePath("/app/zespol");
  // Bez tego strona usuniętej osoby renderuje się jeszcze raz, profilu już
  // nie ma i użytkownik ląduje na stronie „nie znaleziono".
  redirect("/app/zespol");
}

/**
 * Anuluje pending zaproszenie.
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();
  await admin
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("agency_id", owner.agency_id!);
  revalidatePath("/app/zespol");
}

export type RoleActionResult = { error?: string } | undefined;

/**
 * Nadaje rolę członkowi zespołu (CEO only). Nie pozwala zdegradować ostatniego CEO.
 * Zmiana na CEO/Menedżera czyści przypisanie do menedżera (oni nie mają przełożonego).
 */
export async function setMemberRole(memberId: string, role: UserRole): Promise<RoleActionResult> {
  const owner = await requireOwner();
  if (!(VALID_ROLES as string[]).includes(role)) return { error: "Nieprawidłowa rola." };

  const admin = createSupabaseAdmin();

  const { data: member } = await admin
    .from("profiles")
    .select("id, agency_id, role")
    .eq("id", memberId)
    .maybeSingle();
  if (!member || member.agency_id !== owner.agency_id) return { error: "Nie znaleziono osoby." };

  // Ochrona: nie da się zdegradować ostatniego CEO.
  if (member.role === "owner" && role !== "owner") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", owner.agency_id!)
      .eq("role", "owner");
    if ((count ?? 0) <= 1) return { error: "To jedyny CEO - najpierw ustaw kogoś innego jako CEO." };
  }

  await admin
    .from("profiles")
    .update({
      role,
      // CEO i Menedżer nie mają przełożonego.
      ...(role !== "agent" ? { manager_id: null } : {}),
    })
    .eq("id", memberId);

  revalidatePath("/app/zespol");
  revalidatePath(`/app/zespol/${memberId}`);
  return {};
}

/**
 * Przypisuje agenta do menedżera (CEO only). managerId=null → brak przełożonego.
 */
export async function assignManager(agentId: string, managerId: string | null): Promise<RoleActionResult> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();

  const { data: agent } = await admin
    .from("profiles")
    .select("id, agency_id, role")
    .eq("id", agentId)
    .maybeSingle();
  if (!agent || agent.agency_id !== owner.agency_id) return { error: "Nie znaleziono agenta." };
  if (agent.role !== "agent") return { error: "Menedżera można przypisać tylko agentowi." };
  if (managerId === agentId) return { error: "Nie można przypisać agenta do samego siebie." };

  if (managerId) {
    const { data: mgr } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", managerId)
      .eq("agency_id", owner.agency_id!)
      .maybeSingle();
    if (!mgr || (mgr.role !== "manager" && mgr.role !== "owner")) {
      return { error: "Wybrany menedżer jest nieprawidłowy." };
    }
  }

  const { error } = await admin.from("profiles").update({ manager_id: managerId }).eq("id", agentId);
  if (error) {
    // Najczęstsza przyczyna: brak kolumny manager_id → nieuruchomiony SETUP-v13-role.sql.
    return { error: "Nie udało się zapisać. Uruchom w Supabase migrację SETUP-v13 (kolumna manager_id)." };
  }
  revalidatePath("/app/zespol");
  revalidatePath(`/app/zespol/${agentId}`);
  return {};
}

/**
 * Ustawia tygodniowy limit rozmów AI Coach dla członka zespołu (CEO only).
 * limit=null → bez limitu; liczba >=0 → maksymalna liczba rozmów na tydzień.
 */
export async function setWeeklyLimit(memberId: string, limit: number | null): Promise<RoleActionResult> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();

  const { data: member } = await admin
    .from("profiles")
    .select("id, agency_id")
    .eq("id", memberId)
    .maybeSingle();
  if (!member || member.agency_id !== owner.agency_id) return { error: "Nie znaleziono osoby." };

  const clean = limit == null || Number.isNaN(limit) ? null : Math.max(0, Math.min(999, Math.round(limit)));
  await admin.from("profiles").update({ weekly_ai_limit: clean }).eq("id", memberId);
  revalidatePath("/app/zespol");
  return {};
}

/**
 * Dane profilu członka zespołu (CEO): stanowisko, telefon i opis.
 * Zdjęcie każdy wgrywa sobie sam w Ustawieniach, żeby CEO nie musiał
 * zbierać plików od całego biura.
 */
export async function updateMemberProfile(
  memberId: string,
  patch: { jobTitle: string; phone: string; bio: string },
): Promise<RoleActionResult> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();

  const { data: member } = await admin
    .from("profiles")
    .select("id, agency_id")
    .eq("id", memberId)
    .maybeSingle();
  if (!member || member.agency_id !== owner.agency_id) return { error: "Nie znaleziono osoby." };

  const { error } = await admin
    .from("profiles")
    .update({
      job_title: patch.jobTitle.trim().slice(0, 80) || null,
      phone: patch.phone.trim().slice(0, 40) || null,
      bio: patch.bio.trim().slice(0, 600) || null,
    })
    .eq("id", memberId);
  if (error) return { error: "Nie udało się zapisać. Uruchom w Supabase migrację SETUP-v24." };

  revalidatePath("/app/zespol");
  revalidatePath(`/app/zespol/${memberId}`);
  return {};
}
