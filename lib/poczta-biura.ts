import { escapeHtml } from "./html";
import { getAgencySettings } from "./agency-settings";

/**
 * Mail do klienta biura, wysłany w imieniu biura.
 *
 * Różni się od `lib/mail.ts`: tamten to poczta AgentSpace do naszych
 * użytkowników, z naszym logo. Klient biura nieruchomości nie wie, czym jest
 * AgentSpace, więc dostaje list podpisany nazwą biura, z logo biura, a jego
 * odpowiedź trafia prosto do skrzynki agenta (Reply-To), nie do nas.
 *
 * Adres nadawcy zostaje nasz (zweryfikowana domena w Resend), bo wysyłka
 * z domeny biura wymagałaby wpisów DNS po stronie każdego biura.
 */

export type MailBiura = {
  agencyId: string;
  agencyName?: string | null;
  do: string;
  temat: string;
  /** Treść zwykłym tekstem. Puste linie dzielą akapity. */
  tresc: string;
  /** Agent, do którego mają wracać odpowiedzi. */
  odpowiedzDo?: string | null;
  podpis?: { imie?: string | null; telefon?: string | null } | null;
};

export type WynikWysylki = { ok: true; id: string | null } | { ok: false; error: string };

const ADRES_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Wyciąga sam adres z „Nazwa <adres@domena>". */
function adresNadawcy(): string {
  const env = process.env.RESEND_FROM ?? "AgentSpace <powiadomienia@agentspace.pl>";
  const m = env.match(/<([^>]+)>/);
  return (m ? m[1] : env).trim();
}

/** Nazwa nadawcy bez znaków, które psują nagłówek From. */
function nazwaNadawcy(n: string): string {
  return n.replace(/["<>\r\n]/g, "").trim().slice(0, 70) || "Biuro nieruchomości";
}

export async function wyslijMailBiura(m: MailBiura): Promise<WynikWysylki> {
  const klucz = process.env.RESEND_API_KEY;
  if (!klucz) return { ok: false, error: "Wysyłka maili nie jest skonfigurowana (brak klucza Resend)." };
  const do_ = m.do.trim();
  if (!ADRES_EMAIL.test(do_)) return { ok: false, error: "Nieprawidłowy adres e-mail odbiorcy." };
  const temat = m.temat.trim().slice(0, 200);
  const tresc = m.tresc.trim();
  if (!temat || !tresc) return { ok: false, error: "Mail musi mieć temat i treść." };

  const ustawienia = await getAgencySettings(m.agencyId, m.agencyName);
  const firma = ustawienia.company;
  const nazwa = nazwaNadawcy(firma.name || m.agencyName || "Biuro nieruchomości");

  const akapity = tresc
    .split(/\n{2,}/)
    .map((a) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#1f2937;">${escapeHtml(a).replace(/\n/g, "<br>")}</p>`)
    .join("");

  const podpis = [m.podpis?.imie, m.podpis?.telefon, nazwa].filter(Boolean).map((t) => escapeHtml(String(t)));
  const stopkaFirmy = [firma.street, [firma.postal_code, firma.city].filter(Boolean).join(" "), firma.www]
    .filter(Boolean)
    .map((t) => escapeHtml(String(t)))
    .join(" · ");

  const logo = ustawienia.logoUrl
    ? `<img src="${escapeHtml(ustawienia.logoUrl)}" alt="${escapeHtml(nazwa)}" style="display:block;max-height:44px;max-width:200px;border:0;margin:0 0 24px;">`
    : `<p style="margin:0 0 24px;font-size:16px;font-weight:600;color:#0f172a;">${escapeHtml(nazwa)}</p>`;

  const html = `<!doctype html>
<html lang="pl"><body style="margin:0;padding:0;background:#f6f7f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;">
        <tr><td style="padding:32px 32px 8px;">${logo}${akapity}</td></tr>
        <tr><td style="padding:8px 32px 28px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">${podpis.join("<br>")}</p>
        </td></tr>
        ${stopkaFirmy ? `<tr><td style="padding:16px 32px;border-top:1px solid #eef0f3;"><p style="margin:0;font-size:12px;color:#9ca3af;">${stopkaFirmy}</p></td></tr>` : ""}
      </table>
    </td></tr>
  </table>
</body></html>`;

  const tekst = `${tresc}\n\n${[m.podpis?.imie, m.podpis?.telefon, nazwa].filter(Boolean).join("\n")}`;

  try {
    const { Resend } = await import("resend");
    const res = await new Resend(klucz).emails.send({
      from: `${nazwa} <${adresNadawcy()}>`,
      to: do_,
      subject: temat,
      html,
      text: tekst,
      ...(m.odpowiedzDo && ADRES_EMAIL.test(m.odpowiedzDo) ? { replyTo: m.odpowiedzDo } : {}),
    });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data?.id ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Nieznany błąd wysyłki." };
  }
}
