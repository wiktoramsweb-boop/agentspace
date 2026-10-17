"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { DOC_BUCKET } from "@/lib/storage";
import { signUploads, type SignedUpload } from "@/lib/storage-server";
import { escapeHtml } from "@/lib/html";
import { oprawaMaila } from "@/lib/mail";
import { zapiszBlad } from "@/lib/blad";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { todayPL } from "@/lib/datetime";
import { kartaZamowieniaPdf } from "@/lib/swiadectwa-pdf";
import {
  CENY_OBIEKTU,
  GRUPY_PLIKOW,
  TRYBY,
  adresZamowienia,
  bledyZamowienia,
  cenaZamowienia,
  oczyscZamowienie,
  type GrupaPlikow,
  type Zamowienie,
} from "@/lib/swiadectwa";

type Wynik<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const MAX_PLIKOW = 20;
const MAX_BAJTOW = 25 * 1024 * 1024;
const folder = (agencyId: string, numer: string) => `${agencyId}/swiadectwa/${numer}`;

/** Krok 1: numer zamówienia i podpisane linki do wgrania zdjęć. */
export async function przygotujZamowienie(pliki: { grupa: GrupaPlikow; nazwa: string; rozmiar: number }[]): Promise<Wynik<{ numer: string; uploads: SignedUpload[] }>> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  for (const g of Object.keys(GRUPY_PLIKOW) as GrupaPlikow[]) {
    if (pliki.filter((p) => p.grupa === g).length > MAX_PLIKOW) return { ok: false, error: `${GRUPY_PLIKOW[g].nazwa}: maksymalnie ${MAX_PLIKOW} plików.` };
  }
  const zaDuzy = pliki.find((p) => p.rozmiar > MAX_BAJTOW);
  if (zaDuzy) return { ok: false, error: `Plik ${zaDuzy.nazwa} ma więcej niż 25 MB.` };
  if (!pliki.some((p) => p.grupa === "budynek")) return { ok: false, error: "Dodaj zdjęcie budynku z zewnątrz." };

  const numer = `SW-${todayPL().replace(/-/g, "")}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const res = await signUploads(DOC_BUCKET, folder(user.agency_id, numer), pliki.map((p) => ({ ext: (p.nazwa.split(".").pop() ?? "").toLowerCase() })));
  if (res.error) return { ok: false, error: res.error };
  return { ok: true, numer, uploads: res.uploads };
}

/** Krok 2: zapis zamówienia, karta PDF i mail do realizatora. */
export async function zlozZamowienie(
  numer: string,
  dane: Partial<Zamowienie>,
  pliki: { grupa: GrupaPlikow; path: string; nazwa: string; rozmiar: number }[],
): Promise<Wynik<{ wyslano: boolean }>> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (!/^SW-\d{8}-[0-9A-F]{6}$/.test(numer)) return { ok: false, error: "Złe zamówienie." };

  const prefiks = `${folder(user.agency_id, numer)}/`;
  const swoje = pliki.filter((p) => typeof p.path === "string" && p.path.startsWith(prefiks) && p.grupa in GRUPY_PLIKOW);
  const z = oczyscZamowienie(dane);
  const bledy = bledyZamowienia(z, swoje.filter((p) => p.grupa === "budynek").length);
  if (bledy.length) return { ok: false, error: bledy[0] };

  const admin = createSupabaseAdmin();
  if (z.propertyId) {
    const { data } = await admin.from("properties").select("id").eq("id", z.propertyId).eq("agency_id", user.agency_id).maybeSingle();
    if (!data) z.propertyId = null;
  }
  const biuro = user.agency?.name ?? "Biuro";
  const cena = cenaZamowienia(z.typ, z.tryb);
  const data = todayPL();

  const pdf = await kartaZamowieniaPdf({ numer, data, biuro, zamawiajacy: user.full_name ?? "agent", z, pliki: swoje.map((p) => ({ grupa: p.grupa, nazwa: p.nazwa })) });
  const store = admin.storage.from(DOC_BUCKET);
  const sciezkaPdf = `${prefiks}zamowienie.pdf`;
  const zapis = {
    numer,
    data,
    status: "przekazane",
    adres: adresZamowienia(z),
    typ: z.typ,
    tryb: z.tryb,
    cena,
    agentId: user.id,
    agent: user.full_name,
    propertyId: z.propertyId,
    dane: z,
    pliki: swoje,
  };
  const [up1, up2] = await Promise.all([
    store.upload(sciezkaPdf, pdf, { contentType: "application/pdf", upsert: true }),
    // Bucket dokumentów nie przyjmuje application/json, więc zapis idzie jako zwykły tekst.
    store.upload(`${prefiks}zamowienie.json`, JSON.stringify(zapis), { contentType: "text/plain", upsert: true }),
  ]);
  if (up1.error || up2.error) return { ok: false, error: `Nie udało się zapisać zamówienia: ${(up1.error ?? up2.error)?.message}` };

  // Mail do realizatora: karta PDF w załączniku i linki do zdjęć ważne 30 dni.
  let wyslano = false;
  const klucz = process.env.RESEND_API_KEY;
  if (klucz) {
    try {
      const linki = await Promise.all(
        swoje.map(async (p) => {
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
        subject: `Świadectwo energetyczne ${numer}: ${adresZamowienia(z)} (${TRYBY[z.tryb].nazwa})`,
        attachments: [{ filename: `${numer}.pdf`, content: Buffer.from(pdf).toString("base64") }],
        html: oprawaMaila(`
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
            <h2 style="color:#0b1220;margin:0 0 8px;">Nowe zamówienie świadectwa energetycznego</h2>
            <p style="font-size:15px;color:#3f3f46;margin:0 0 4px;"><strong>${escapeHtml(adresZamowienia(z))}</strong></p>
            <p style="font-size:14px;color:#3f3f46;margin:0 0 12px;">${escapeHtml(CENY_OBIEKTU[z.typ].nazwa)} · ${escapeHtml(z.powierzchnia)} m² · ${escapeHtml(TRYBY[z.tryb].nazwa)} (${escapeHtml(TRYBY[z.tryb].opis)}) · ${cena.netto} zł netto</p>
            <p style="font-size:14px;color:#3f3f46;margin:0 0 12px;">Kontakt w sprawie świadectwa: ${escapeHtml(z.imie)}, ${escapeHtml(z.telefon)}, ${escapeHtml(z.email)}</p>
            <p style="font-size:14px;color:#3f3f46;margin:0 0 12px;">Zamawia: ${escapeHtml(user.full_name ?? "agent")}, ${escapeHtml(biuro)}. Pełna karta zamówienia w załączniku PDF.</p>
            ${lista}
            <p style="font-size:12px;color:#71717a;margin-top:18px;">Linki do plików są ważne 30 dni. Numer zamówienia: ${escapeHtml(numer)}.</p>
          </div>`),
      });
      wyslano = true;
    } catch (err) {
      await zapiszBlad("swiadectwa/mail", err, { agencyId: user.agency_id });
    }
  }

  await zapiszZdarzenie({
    agencyId: user.agency_id,
    actorId: user.id,
    akcja: "swiadectwo_zamowione",
    opis: `Zamówienie świadectwa ${numer}: ${adresZamowienia(z)}, ${cena.netto} zł netto`,
    meta: { numer, netto: cena.netto, tryb: z.tryb, typ: z.typ },
  });
  revalidatePath("/app/swiadectwa");
  return { ok: true, wyslano };
}

/** Link do karty PDF zamówienia z własnego biura. */
export async function linkDoKarty(numer: string): Promise<string | null> {
  const user = await requireUser();
  if (!user.agency_id || !/^SW-\d{8}-[0-9A-F]{6}$/.test(numer)) return null;
  const { data } = await createSupabaseAdmin().storage.from(DOC_BUCKET).createSignedUrl(`${folder(user.agency_id, numer)}/zamowienie.pdf`, 120, { download: `${numer}.pdf` });
  return data?.signedUrl ?? null;
}
