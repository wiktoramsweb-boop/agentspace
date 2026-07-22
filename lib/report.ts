import { Resend } from "resend";
import { createSupabaseAdmin } from "./supabase/admin";
import {
  getAgencyStats,
  getTeamRanking,
  getAgencyCategoryAverages,
} from "./data";
import { getAgencyCommissionByAgent } from "./data-platform";
import { formatPln } from "./format";

/**
 * Buduje i wysyła miesięczny raport dla właściciela agencji.
 * Zwraca true jeśli wysłano.
 */
export async function sendAgencyMonthlyReport(agencyId: string): Promise<boolean> {
  const admin = createSupabaseAdmin();

  const { data: agency } = await admin
    .from("agencies")
    .select("*")
    .eq("id", agencyId)
    .single();

  // Email właściciela: z profilu ownera (role=owner w agencji)
  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("agency_id", agencyId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  const ownerEmail = ownerProfile?.email;
  if (!agency || !ownerEmail) return false;

  const [stats, ranking, categories, commissions] = await Promise.all([
    getAgencyStats(agencyId),
    getTeamRanking(agencyId),
    getAgencyCategoryAverages(agencyId),
    getAgencyCommissionByAgent(agencyId),
  ]);

  const totalCommission = Object.values(commissions).reduce((a, b) => a + b, 0);
  const strongest = categories[0];
  const weakest = categories[categories.length - 1];
  const topAgent = ranking.find((a) => a.avgScore != null);
  const notTraining = ranking.filter((a) => a.role !== "owner" && a.sessionsThisWeek === 0);

  const monthName = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(
    new Date(),
  );

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return false;

  const html = `
    <div style="font-family:-apple-system,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b;">
      <h1 style="color:#10b981;font-size:22px;margin:0 0 4px;">Raport miesięczny — ${agency.name}</h1>
      <p style="color:#71717a;margin:0 0 24px;">${monthName}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:12px;background:#f4f4f5;border-radius:8px;">
            <div style="font-size:12px;color:#71717a;">Prowizje zespołu</div>
            <div style="font-size:22px;font-weight:600;">${formatPln(totalCommission)}</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:12px;background:#f4f4f5;border-radius:8px;">
            <div style="font-size:12px;color:#71717a;">Średni wynik AI</div>
            <div style="font-size:22px;font-weight:600;">${stats.avgTeamScore ?? "—"}/10</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:12px;background:#f4f4f5;border-radius:8px;">
            <div style="font-size:12px;color:#71717a;">Sesje treningowe</div>
            <div style="font-size:22px;font-weight:600;">${stats.totalSessions}</div>
          </td>
        </tr>
      </table>

      ${strongest && weakest ? `
      <p style="font-size:15px;line-height:1.6;">
        Najmocniejszy obszar zespołu: <strong>${strongest.label}</strong> (${strongest.avg}/10).<br/>
        Do poprawy: <strong>${weakest.label}</strong> (${weakest.avg}/10) — rozważ wspólne szkolenie.
      </p>` : ""}

      ${topAgent ? `<p style="font-size:15px;">🏆 Najlepszy agent: <strong>${topAgent.full_name ?? topAgent.email}</strong> (${topAgent.avgScore}/10)</p>` : ""}

      ${notTraining.length > 0 ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <strong style="color:#b45309;">⚠ Nie trenowali w tym tygodniu:</strong>
        <span style="color:#78350f;">${notTraining.map((a) => a.full_name ?? a.email).join(", ")}</span>
      </div>` : ""}

      <p style="margin-top:28px;">
        <a href="https://agentspace.pl/app/zespol" style="background:#10b981;color:#09090b;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">
          Otwórz panel zespołu →
        </a>
      </p>

      <p style="color:#a1a1aa;font-size:12px;margin-top:24px;">AgentSpace · raport wysłany automatycznie</p>
    </div>`;

  try {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
      to: ownerEmail,
      subject: `📊 Raport miesięczny — ${agency.name} (${monthName})`,
      html,
    });
    return true;
  } catch (err) {
    console.error("Monthly report email error:", err);
    return false;
  }
}
