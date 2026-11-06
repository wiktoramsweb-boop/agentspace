"use server";

import { escapeHtml } from "@/lib/html";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ROLE, oczyscUprawnienia, type Uprawnienia } from "@/lib/role";
import { APP_URL } from "@/lib/supabase/config";
import { sendAgencyMonthlyReport } from "@/lib/report";
import { wyslijTydzienBiura } from "@/lib/raport-tygodniowy";
import { type UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/role";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { oprawaMaila, NADAWCA } from "@/lib/mail";
import { kodQrSvg } from "@/lib/qr";

const VALID_ROLES = ROLE.map((r) => r.id);

export type ZespolResult =
  | { error?: string; success?: string; link?: string; qr?: string; emailSent?: boolean }
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

/** Podgląd poniedziałkowego „Tygodnia w biurze” na email właściciela. */
export async function sendWeeklyReportNow(_prev: ZespolResult, _formData: FormData): Promise<ZespolResult> {
  const owner = await requireOwner();
  const ile = owner.email ? await wyslijTydzienBiura(owner.agency_id!, owner.email) : 0;
  if (!ile) return { error: "Nie udało się wysłać podsumowania (sprawdź konfigurację email)." };
  return { success: `Tydzień w biurze wysłany na ${owner.email}.` };
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

  const mail = await wyslijZaproszenie({ email, link, role, zapraszajacy: owner.full_name, biuro: owner.agency?.name ?? null });

  revalidatePath("/app/zespol");
  return {
    success: mail.ok
      ? `Zaproszenie wysłane mailem do ${email}. Możesz też pokazać kod QR albo wysłać link.`
      : `Zaproszenie utworzone, ale mail nie wyszedł: ${mail.powod} Pokaż kod QR albo wyślij link.`,
    link,
    qr: await kodQrSvg(link),
    emailSent: mail.ok,
  };
}

/** Ponowne wysłanie maila z oczekującym zaproszeniem (np. po naprawie poczty). */
export async function wyslijPonownieZaproszenie(invitationId: string): Promise<{ ok: boolean; komunikat: string }> {
  const owner = await requireOwner();
  const { data: inv } = await createSupabaseAdmin()
    .from("invitations")
    .select("email, role, token")
    .eq("id", invitationId)
    .eq("agency_id", owner.agency_id!)
    .eq("status", "pending")
    .maybeSingle();
  if (!inv) return { ok: false, komunikat: "Nie ma takiego zaproszenia." };
  const mail = await wyslijZaproszenie({
    email: inv.email,
    link: `${APP_URL}/zaproszenie/${inv.token}`,
    role: (inv.role ?? "agent") as UserRole,
    zapraszajacy: owner.full_name,
    biuro: owner.agency?.name ?? null,
  });
  return mail.ok ? { ok: true, komunikat: `Wysłane ponownie do ${inv.email}.` } : { ok: false, komunikat: `Mail nie wyszedł: ${mail.powod}` };
}

/**
 * Mail z zaproszeniem. Zwraca powód porażki po ludzku, bo „nie wyszło” bez
 * przyczyny kończyło się ręcznym kopiowaniem linków bez wiedzy, co naprawić.
 */
async function wyslijZaproszenie({ email, link, role, zapraszajacy, biuro }: { email: string; link: string; role: UserRole; zapraszajacy: string | null; biuro: string | null }): Promise<{ ok: boolean; powod: string }> {
  const klucz = process.env.RESEND_API_KEY;
  if (!klucz) return { ok: false, powod: "poczta nie jest skonfigurowana (brak klucza Resend)." };
  try {
    const { error } = await new Resend(klucz).emails.send({
      from: NADAWCA,
      to: email,
      subject: `${zapraszajacy ?? "Twoje biuro"} zaprasza Cię do AgentSpace`,
      html: oprawaMaila(`
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#14171a;font-weight:600;">Zaproszenie do zespołu</h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3d4349;">
            <strong>${escapeHtml(zapraszajacy ?? "Właściciel biura")}</strong> zaprasza Cię do
            <strong>${escapeHtml(biuro ?? "biura")}</strong> w AgentSpace, w roli <strong>${escapeHtml(ROLE_LABELS[role])}</strong>.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="border-radius:12px;background:#0b7a55;">
              <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Dołącz do zespołu</a>
            </td></tr>
          </table>
          <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#64748b;">Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:</p>
          <p style="margin:0 0 14px;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${link}" style="color:#0b7a55;">${link}</a></p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">Link działa 14 dni. Jeśli to pomyłka, zignoruj tę wiadomość.</p>
      `),
    });
    if (!error) return { ok: true, powod: "" };
    console.error("Invite email error:", error);
    if (/domain is not verified/i.test(error.message)) return { ok: false, powod: "domena wysyłająca maile nie jest zweryfikowana w Resend (rekord DKIM w DNS)." };
    if (/rate|limit|quota/i.test(error.message)) return { ok: false, powod: "przekroczony limit wysyłki maili, spróbuj za chwilę." };
    return { ok: false, powod: `${error.message}.` };
  } catch (err) {
    console.error("Invite email error:", err);
    return { ok: false, powod: "błąd połączenia z pocztą." };
  }
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
 * Domyślnie dane trafiają do puli biura (`agent_id` puste) i czekają tam na
 * przypisanie. Można też od razu wskazać osobę, która je przejmie.
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

  // Kto przejmuje dorobek. Puste pole oznacza pulę biura: rekordy zostają
  // w systemie bez opiekuna i czekają na przypisanie. To sensowniejsze niż
  // zmuszanie do wskazania osoby w momencie, w którym ktoś odchodzi.
  const wskazany = String(formData.get("przejmujacy") ?? "").trim();
  let przejmujacy: string | null = null;

  if (wskazany) {
    if (wskazany === agentId) return { error: "Nie można przepisać danych na osobę, którą usuwasz." };
    const { data: kandydat } = await admin
      .from("profiles")
      .select("id, agency_id")
      .eq("id", wskazany)
      .maybeSingle();
    if (!kandydat || kandydat.agency_id !== owner.agency_id) {
      return { error: "Wskazana osoba nie należy do Twojego biura." };
    }
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
    const bezNiego = (d.assignee_ids ?? []).filter((x) => x !== agentId);
    // Do puli trafia pusta lista, a wtedy działanie znajdziesz filtrem
    // „bez opiekuna" na liście działań.
    const nowe = przejmujacy ? [...new Set([...bezNiego, przejmujacy])] : bezNiego;
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
      // Przełożonego mają tylko stanowiska pracujące pod menedżerem.
      ...(role !== "agent" && role !== "trainee" ? { manager_id: null } : {}),
    })
    .eq("id", memberId);

  if (owner.agency_id && member.role !== role) {
    const { data: kto } = await admin.from("profiles").select("full_name").eq("id", memberId).maybeSingle();
    await zapiszZdarzenie({
      agencyId: owner.agency_id, actorId: owner.id, akcja: "zmiana_roli", rodzaj: "osoba", id: memberId,
      opis: `Zmiana roli: ${kto?.full_name ?? "osoba"}, ${ROLE_LABELS[member.role as UserRole] ?? member.role} → ${ROLE_LABELS[role]}`,
    });
  }
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

/**
 * Indywidualne uprawnienia osoby (v38).
 *
 * Rola daje zestaw domyślny, a tutaj CEO dokłada albo odbiera pojedynczy
 * moduł. Zapisujemy tylko faktyczne odstępstwa, żeby po zmianie roli
 * uprawnienia poszły za nową rolą, a nie zostały zamrożone na starej.
 */
export async function setMemberPermissions(
  memberId: string,
  uprawnienia: Uprawnienia | null,
): Promise<RoleActionResult> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();

  const { data: member } = await admin
    .from("profiles")
    .select("id, agency_id, role")
    .eq("id", memberId)
    .maybeSingle();
  if (!member || member.agency_id !== owner.agency_id) return { error: "Nie znaleziono osoby." };

  // CEO zawsze ma pełny dostęp. Gdyby dało się go obciąć, biuro mogłoby
  // zostać bez nikogo, kto wejdzie w ustawienia i to odkręci.
  if (member.role === "owner") {
    return { error: "CEO ma pełny dostęp i nie da się go ograniczyć." };
  }

  const { error } = await admin
    .from("profiles")
    .update({ permissions: oczyscUprawnienia(member.role, uprawnienia) })
    .eq("id", memberId);
  if (error) {
    return { error: "Nie udało się zapisać. Uruchom migrację v38 (lib/SETUP-v38-role.sql)." };
  }
  if (owner.agency_id) {
    const { data: kto } = await admin.from("profiles").select("full_name").eq("id", memberId).maybeSingle();
    await zapiszZdarzenie({ agencyId: owner.agency_id, actorId: owner.id, akcja: "zmiana_uprawnien", rodzaj: "osoba", id: memberId, opis: `Zmieniono uprawnienia: ${kto?.full_name ?? "osoba"}` });
  }

  revalidatePath("/app/zespol");
  revalidatePath(`/app/zespol/${memberId}`);
  revalidatePath("/app", "layout");
  return {};
}
