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
import { powiadomOZamowieniu } from "@/lib/data-abonament";
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
    status: "czeka_na_wplate",
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

  // Świadectwo opłacamy z góry: realizator dostaje zlecenie dopiero po
  // zaksięgowaniu wpłaty (potwierdzWplate w panelu operatora). Zamówienie
  // trafia na tę samą listę rozliczeń co abonamenty, z fakturą i przelewem.
  const { data: zam, error: bladZam } = await admin
    .from("subscription_orders")
    .insert({
      agency_id: user.agency_id,
      created_by: user.id,
      kind: "swiadectwo",
      plan: numer,
      period: "jednorazowo",
      agents: 1,
      amount_grosz: Math.round(cena.netto * 100),
      note: adresZamowienia(z).slice(0, 200),
    })
    .select("id")
    .single();
  if (bladZam || !zam) {
    await zapiszBlad("swiadectwa/zamowienie", bladZam ?? new Error("brak wiersza"), { agencyId: user.agency_id });
    return { ok: false, error: "Nie udało się zapisać zamówienia do rozliczenia. Spróbuj ponownie." };
  }
  await powiadomOZamowieniu(zam.id as string, user.agency_id);
  const wyslano = true;

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
