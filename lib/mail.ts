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
// Obrazki prosto z www: część programów pocztowych nie podąża za przekierowaniem.
const ADRES_GRAFIK = "https://www.agentspace.pl";

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

/**
 * Firmowa oprawa każdego maila z AgentSpace: logo (sygnet z napisem) na górze,
 * treść na białej karcie, stopka z adresem. Wszystkie maile systemowe idą
 * przez tę funkcję, żeby odbiorca od pierwszego spojrzenia wiedział, od kogo
 * jest wiadomość, i żeby nie wyglądała jak phishing.
 *
 * `tresc` to gotowy HTML środka (bez <html> i <body>).
 */
export function oprawaMaila(tresc: string): string {
  return `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding:0 4px 18px;">
          <a href="${ADRES_APLIKACJI}" style="text-decoration:none;"><img src="${ADRES_GRAFIK}/marka/poziome-na-bialym-tle.png" alt="AgentSpace" width="168" style="display:block;border:0;height:auto;"></a>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e2e3dd;border-top:4px solid #0b7a55;border-radius:14px;padding:28px 28px 24px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#14171a;">
          ${tresc}
        </td></tr>
        <tr><td style="padding:16px 6px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:10px;vertical-align:middle;"><img src="${ADRES_GRAFIK}/marka/znak-gradient-64.png" alt="" width="22" height="22" style="display:block;border:0;border-radius:5px;"></td>
            <td style="vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;color:#7a8087;">AgentSpace, program dla biur nieruchomości · <a href="${ADRES_APLIKACJI}" style="color:#0b7a55;text-decoration:none;">agentspace.pl</a></td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function szablon(m: Mail): string {
  const akapity = m.akapity
    .map((t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3d4349;">${escapeHtml(t)}</p>`)
    .join("");

  const przycisk = m.przycisk
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
         <tr><td style="border-radius:12px;background:#0b7a55;">
           <a href="${m.przycisk.adres}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(m.przycisk.tekst)}</a>
         </td></tr>
       </table>`
    : "";

  const stopka = m.stopka
    ? `<p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">${escapeHtml(m.stopka)}</p>`
    : "";

  return oprawaMaila(`
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#14171a;font-weight:600;">${escapeHtml(m.naglowek)}</h1>
          ${akapity}${przycisk}${stopka}`);
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
