"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type ZespolResult = { error?: string; success?: string } | undefined;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://agentspace.pl";

/**
 * Zaproszenie agenta: tworzy rekord invitation i wysyła email z linkiem.
 */
export async function inviteAgent(
  _prev: ZespolResult,
  formData: FormData,
): Promise<ZespolResult> {
  const owner = await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

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
      role: "agent",
      invited_by: owner.id,
    })
    .select("token")
    .single();

  if (error || !invitation) return { error: "Nie udało się utworzyć zaproszenia." };

  const link = `${APP_URL}/zaproszenie/${invitation.token}`;

  // Wyślij email (jeśli Resend skonfigurowany)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
        to: email,
        subject: `${owner.full_name ?? "Twój szef"} zaprasza Cię do AgentSpace`,
        html: `
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
            <h2 style="color:#10b981;">Zaproszenie do zespołu</h2>
            <p style="color:#3f3f46;font-size:15px;line-height:1.6;">
              <strong>${owner.full_name ?? "Właściciel biura"}</strong> zaprasza Cię do
              <strong>${owner.agency?.name ?? "biura"}</strong> w AgentSpace — platformie do
              treningu sprzedaży nieruchomości z AI.
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
    } catch (err) {
      console.error("Invite email error:", err);
      // Zaproszenie utworzone — link można skopiować z panelu mimo braku maila
    }
  }

  revalidatePath("/app/zespol");
  return { success: `Zaproszenie wysłane do ${email}.` };
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
