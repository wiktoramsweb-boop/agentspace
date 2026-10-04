import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { escapeHtml } from "@/lib/html";
import { zapiszBlad } from "@/lib/blad";
import { formatMoney, opisRodzaju } from "@/lib/invoice";

/**
 * Wysyłka faktury mailem do nabywcy.
 *
 * PDF powstaje w przeglądarce (lib/invoice-pdf.ts) i przychodzi tu gotowy.
 * Serwer go nie składa, bo generator korzysta z czcionek pobieranych przez
 * `fetch` z katalogu publicznego, a przerabianie tego na stronę serwera
 * znaczyłoby drugi generator do utrzymania.
 *
 * Serwer sprawdza natomiast rzeczy, których nie można zostawić przeglądarce:
 * czy użytkownik ma moduł faktur, czy faktura należy do JEGO biura i czy
 * załącznik nie jest absurdalnie duży.
 */

/** Rozsądny sufit dla faktury. Typowa ma 30-60 kB, więc 4 MB to i tak bardzo dużo. */
const MAX_PDF_BAJTOW = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await requireModul("faktury");
  if (!user.agency_id) return Response.json({ error: "Brak biura." }, { status: 403 });

  let body: { invoiceId?: unknown; email?: unknown; pdf?: unknown; wiadomosc?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Oczekiwano JSON." }, { status: 400 });
  }

  const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId : "";
  const email = (typeof body.email === "string" ? body.email : "").trim();
  const pdfBase64 = typeof body.pdf === "string" ? body.pdf : "";
  const wiadomosc = (typeof body.wiadomosc === "string" ? body.wiadomosc : "").slice(0, 2000);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Niepoprawny adres email." }, { status: 400 });
  }
  if (!pdfBase64) return Response.json({ error: "Brak pliku PDF." }, { status: 400 });
  // Base64 jest o jedną trzecią większy od danych źródłowych.
  if (pdfBase64.length * 0.75 > MAX_PDF_BAJTOW) {
    return Response.json({ error: "Plik jest za duży." }, { status: 413 });
  }

  const admin = createSupabaseAdmin();
  const { data: faktura } = await admin
    .from("invoices")
    .select("id, agency_id, number, doc_type, total_pln, payment_date, buyer_name")
    .eq("id", invoiceId)
    .maybeSingle();

  // Sprawdzenie przynależności do biura, a nie samo istnienie dokumentu:
  // bez tego znajomość cudzego id wystarczyłaby, żeby rozesłać czyjąś fakturę.
  if (!faktura || faktura.agency_id !== user.agency_id) {
    return Response.json({ error: "Nie ma takiej faktury." }, { status: 404 });
  }

  const klucz = process.env.RESEND_API_KEY;
  if (!klucz) return Response.json({ error: "Wysyłka maili nie jest skonfigurowana." }, { status: 503 });

  const rodzaj = opisRodzaju(faktura.doc_type as never);
  const nazwaPliku = `${rodzaj.nazwa}-${String(faktura.number).replaceAll("/", "-")}.pdf`;

  try {
    const { Resend } = await import("resend");
    const { error } = await new Resend(klucz).emails.send({
      from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
      to: email,
      replyTo: user.email ?? undefined,
      subject: `${rodzaj.tytul} nr ${faktura.number}`,
      attachments: [{ filename: nazwaPliku, content: pdfBase64 }],
      html: `
        <div style="font-family:-apple-system,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b;">
          <p style="margin:0 0 14px;">Dzień dobry,</p>
          <p style="margin:0 0 14px;">
            w załączniku przesyłamy ${escapeHtml(rodzaj.tytul.toLowerCase())} nr
            <strong>${escapeHtml(String(faktura.number))}</strong>
            na kwotę <strong>${formatMoney(Number(faktura.total_pln) || 0)} zł</strong>${
              faktura.payment_date
                ? `, z terminem płatności <strong>${escapeHtml(String(faktura.payment_date))}</strong>`
                : ""
            }.
          </p>
          ${wiadomosc ? `<p style="margin:0 0 14px;white-space:pre-wrap;">${escapeHtml(wiadomosc)}</p>` : ""}
          <p style="margin:0;color:#52525b;">
            Pozdrawiam,<br>${escapeHtml(user.full_name ?? "")}
          </p>
        </div>
      `,
    });

    if (error) {
      await zapiszBlad("faktury/wysylka", error.message ?? "błąd wysyłki", { agencyId: user.agency_id });
      return Response.json({ error: "Nie udało się wysłać wiadomości." }, { status: 502 });
    }
  } catch (err) {
    await zapiszBlad("faktury/wysylka", err, { agencyId: user.agency_id });
    return Response.json({ error: "Nie udało się wysłać wiadomości." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
