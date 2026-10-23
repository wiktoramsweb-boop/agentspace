import { createSupabaseAdmin } from "./supabase/admin";
import { DOC_BUCKET } from "./storage";
import { escapeHtml } from "./html";
import { oprawaMaila } from "./mail";
import { zapiszBlad } from "./blad";
import { CENY_OBIEKTU, GRUPY_PLIKOW, TRYBY, adresZamowienia, type GrupaPlikow, type Zamowienie } from "./swiadectwa";

type Zapis = {
  numer: string;
  status: string;
  cena: { netto: number; brutto: number };
  agent: string | null;
  dane: Zamowienie;
  pliki: { grupa: GrupaPlikow; path: string; nazwa: string; rozmiar: number }[];
};

/**
 * Przekazanie opłaconego zamówienia świadectwa do realizatora.
 *
 * Wołane z potwierdzenia wpłaty, nigdy przy samym zamówieniu: realizator
 * zaczyna pracę dopiero za pieniądze, które już są na koncie. Termin (24 h
 * albo standard) liczy się od tej chwili, i tak też piszemy biuru.
 */
export async function przekazDoRealizatora(agencyId: string, numer: string): Promise<string | null> {
  if (!/^SW-\d{8}-[0-9A-F]{6}$/.test(numer)) return "Zły numer zamówienia świadectwa.";
  const admin = createSupabaseAdmin();
  const store = admin.storage.from(DOC_BUCKET);
  const prefiks = `${agencyId}/swiadectwa/${numer}/`;
  const [{ data: plik }, { data: pdf }, { data: biuro }] = await Promise.all([
    store.download(`${prefiks}zamowienie.json`),
    store.download(`${prefiks}zamowienie.pdf`),
    admin.from("agencies").select("name").eq("id", agencyId).maybeSingle(),
  ]);
  if (!plik) return "Nie ma danych zamówienia w magazynie plików.";
  const zapis = JSON.parse(await plik.text()) as Zapis;
  const z = zapis.dane;

  const klucz = process.env.RESEND_API_KEY;
  if (klucz) {
    try {
      const linki = await Promise.all(
        zapis.pliki.map(async (p) => {
          const { data: s } = await store.createSignedUrl(p.path, 60 * 60 * 24 * 30, { download: p.nazwa });
          return { ...p, url: s?.signedUrl ?? null };
        }),
      );
      const lista = (Object.keys(GRUPY_PLIKOW) as GrupaPlikow[])
        .map((g) => {
          const pl = linki.filter((l) => l.grupa === g && l.url);
          if (!pl.length) return "";
          return `<p style="margin:14px 0 4px;font-weight:600;color:#0b1220;">${escapeHtml(GRUPY_PLIKOW[g].nazwa)}</p>${pl.map((l) => `<a href="${escapeHtml(l.url)}" style="display:block;color:#047857;font-size:14px;">${escapeHtml(l.nazwa)}</a>`).join("")}`;
        })
        .join("");
      const { Resend } = await import("resend");
      await new Resend(klucz).emails.send({
        from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
        to: process.env.SWIADECTWA_EMAIL ?? process.env.NOTIFICATION_EMAIL ?? "nieruchomoscispectra@gmail.com",
        replyTo: z.email,
        subject: `Świadectwo energetyczne ${numer} (opłacone): ${adresZamowienia(z)} (${TRYBY[z.tryb].nazwa})`,
        attachments: pdf ? [{ filename: `${numer}.pdf`, content: Buffer.from(await pdf.arrayBuffer()).toString("base64") }] : [],
        html: oprawaMaila(`
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
            <h2 style="color:#0b1220;margin:0 0 8px;">Opłacone zamówienie świadectwa energetycznego</h2>
            <p style="font-size:15px;color:#3f3f46;margin:0 0 4px;"><strong>${escapeHtml(adresZamowienia(z))}</strong></p>
            <p style="font-size:14px;color:#3f3f46;margin:0 0 12px;">${escapeHtml(CENY_OBIEKTU[z.typ].nazwa)} · ${escapeHtml(z.powierzchnia)} m² · ${escapeHtml(TRYBY[z.tryb].nazwa)} (${escapeHtml(TRYBY[z.tryb].opis)}) · ${zapis.cena.netto} zł netto, wpłata zaksięgowana</p>
            <p style="font-size:14px;color:#3f3f46;margin:0 0 12px;">Kontakt w sprawie świadectwa: ${escapeHtml(z.imie)}, ${escapeHtml(z.telefon)}, ${escapeHtml(z.email)}</p>
            <p style="font-size:14px;color:#3f3f46;margin:0 0 12px;">Zamawia: ${escapeHtml(zapis.agent ?? "agent")}, ${escapeHtml(biuro?.name ?? "biuro")}. Termin realizacji liczy się od teraz. Pełna karta zamówienia w załączniku PDF.</p>
            ${lista}
            <p style="font-size:12px;color:#71717a;margin-top:18px;">Linki do plików są ważne 30 dni. Numer zamówienia: ${escapeHtml(numer)}.</p>
          </div>`),
      });
    } catch (err) {
      await zapiszBlad("swiadectwa/mail", err, { agencyId });
      return "Wpłata zapisana, ale mail do realizatora nie wyszedł. Sprawdź dziennik błędów.";
    }
  }

  const nowy = { ...zapis, status: "przekazane", oplacone: new Date().toISOString() };
  await store.upload(`${prefiks}zamowienie.json`, JSON.stringify(nowy), { contentType: "text/plain", upsert: true });
  return null;
}
