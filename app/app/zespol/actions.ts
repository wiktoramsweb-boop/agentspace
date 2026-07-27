"use server";

import { revalidatePath } from "next/cache";
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
  // Resend dostarcza tylko na adres właściciela konta — dlatego zawsze zwracamy
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
              <strong>${owner.agency?.name ?? "biura"}</strong> w AgentSpace — platformie do
              treningu sprzedaży nieruchomości z AI, w roli <strong>${ROLE_LABELS[role]}</strong>.
            </p>
            <p style="margin:28px 0;">
              <a href="${link}" style="background:#10b981;color:#09090b;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">
                Dołącz do zespołu →
              </a>
            </p>
            <p style="color:#71717a;font-size:13px;">Link ważny 14 dni. Jeśli to pomyłka — zignoruj tę wiadomość.</p>
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
      : `Zaproszenie utworzone. Mail nie wyszedł — skopiuj link poniżej i wyślij agentowi.`,
    link,
    emailSent,
  };
}

/**
 * Usuwa agenta z zespołu (profil + konto auth).
 */
export async function removeAgent(agentId: string): Promise<void> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();

  // Weryfikacja: agent należy do agencji ownera i nie jest samym ownerem
  const { data: agent } = await admin
    .from("profiles")
    .select("id, agency_id, role")
    .eq("id", agentId)
    .single();

  if (!agent || agent.agency_id !== owner.agency_id || agent.role === "owner") {
    return;
  }

  await admin.from("profiles").delete().eq("id", agentId);
  await admin.auth.admin.deleteUser(agentId).catch(() => {});
  revalidatePath("/app/zespol");
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
    if ((count ?? 0) <= 1) return { error: "To jedyny CEO — najpierw ustaw kogoś innego jako CEO." };
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

  await admin.from("profiles").update({ manager_id: managerId }).eq("id", agentId);
  revalidatePath("/app/zespol");
  revalidatePath(`/app/zespol/${agentId}`);
  return {};
}
