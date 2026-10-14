import { escapeHtml } from "./html";

/**
 * Wysyłka maili w jednej, firmowej oprawie.
 *
 * Powstało, bo maile z resetem hasła szły szablonem Supabase: po angielsku,
 * podpisane „Supabase Auth", z ich stopką. Klient biura nieruchomości dostaje
 * wtedy wiadomość od firmy, o której nigdy nie słyszał, i słusznie uznaje, że
 * coś jest nie tak.
 *
 * Każdy mail z aplikacji ma wyglądać tak samo i być po polsku.
 */

const ADRES_APLIKACJI = "https://agentspace.pl";

export type Mail = {
  do: string;
  temat: string;
  naglowek: string;
  /** Akapity treści. Każdy trafia do osobnego <p>. */
  akapity: string[];
  przycisk?: { tekst: string; adres: string };
  /** Drobny druk pod przyciskiem, np. jak długo działa link. */
  stopka?: string;
};

function szablon(m: Mail): string {
  const akapity = m.akapity
    .map((t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(t)}</p>`)
    .join("");

  const przycisk = m.przycisk
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
         <tr><td style="border-radius:12px;background:#10b981;">
           <a href="${m.przycisk.adres}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(m.przycisk.tekst)}</a>
         </td></tr>
       </table>`
    : "";

  const stopka = m.stopka
    ? `<p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">${escapeHtml(m.stopka)}</p>`
    : "";

  return `<!doctype html>
<html lang="pl"><body style="margin:0;padding:0;background:#f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#07090c;padding:22px 32px;">
          <img src="${ADRES_APLIKACJI}/marka/poziome-na-ciemnym-tle.png" alt="AgentSpace" width="180" style="display:block;border:0;">
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0b1220;font-weight:600;">${escapeHtml(m.naglowek)}</h1>
          ${akapity}${przycisk}${stopka}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">AgentSpace, system dla biur nieruchomości. <a href="${ADRES_APLIKACJI}" style="color:#10b981;text-decoration:none;">agentspace.pl</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Zwraca true, gdy mail poszedł. Nigdy nie rzuca: brak poczty nie może wywrócić akcji. */
export async function wyslijMail(m: Mail): Promise<boolean> {
  const klucz = process.env.RESEND_API_KEY;
  if (!klucz) return false;

  try {
    const { Resend } = await import("resend");
    const { error } = await new Resend(klucz).emails.send({
      from: process.env.RESEND_FROM ?? "AgentSpace <powiadomienia@agentspace.pl>",
      to: m.do,
      subject: m.temat,
      html: szablon(m),
    });
    return !error;
  } catch {
    return false;
  }
}
