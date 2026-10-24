"use server";

import { portalFtp } from "@/lib/ftp/portale";
import { wyslijNaPortalFtp } from "@/lib/ftp/eksport";
import { opisDoZapisu } from "@/lib/opis-html";
import { idZBiura } from "@/lib/agency-ids";
import { mozeUsunac } from "@/lib/uprawnienia";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { maV49 } from "@/lib/schemat";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { uruchomAutomatyzacje } from "@/lib/automatyzacje";
import { formatPln } from "@/lib/format";
import { PROPERTY_TYPES, type PropertyDealKind, type PropertyStatus, type PropertyType } from "@/lib/types";
import { DETAIL_PREFIX, detailFieldsFor, PIETRO_NA_LICZBE } from "@/lib/property-fields";
import { sanitizePhotos } from "@/lib/property-photos";
import { getAgencySettings } from "@/lib/agency-settings";
import { PHOTO_BUCKET } from "@/lib/storage";
import { removeFiles } from "@/lib/storage-server";
import { after } from "next/server";
import { poNowejOfercie, poZmianieEtapuOferty } from "@/lib/zdarzenia";

function intOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseInt(String(v ?? "").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Piętro wybiera się z listy w brzmieniu portali („Suterena", „Parter", „> 10",
 * „Poddasze"), ale w bazie trzymamy liczbę, bo po piętrze filtrujemy listy
 * i liczy je wyceniarka. Tutaj tłumaczymy jedno na drugie.
 */
function pietroOrNull(v: FormDataEntryValue | null): number | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  if (raw in PIETRO_NA_LICZBE) return PIETRO_NA_LICZBE[raw];
  return intOrNull(raw);
}

function floatOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(v ?? "").replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

function propertyFromForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    deal_kind: String(formData.get("deal_kind") ?? "sprzedaz") as PropertyDealKind,
    property_type: String(formData.get("property_type") ?? "mieszkanie") as PropertyType,
    status: String(formData.get("status") ?? "aktywna") as PropertyStatus,
    city: String(formData.get("city") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    lat: floatOrNull(formData.get("lat")),
    lng: floatOrNull(formData.get("lng")),
    price_pln: intOrNull(formData.get("price")),
    area_m2: floatOrNull(formData.get("area")),
    rooms: intOrNull(formData.get("rooms")),
    floor: pietroOrNull(formData.get("floor")),
    // 8500 znaków to limit, który przyjmują portale.
    // Opis z edytora to HTML; czyścimy go tu drugi raz, bo formularz można wysłać z pominięciem edytora.
    description: opisDoZapisu(String(formData.get("description") ?? "").slice(0, 60000)).slice(0, 20000) || null,
    owner_client_id: String(formData.get("owner_client_id") ?? "") || null,
  };
}

/** Pola z v17. Wydzielone, bo bez migracji trzeba je pominąć (patrz insertProperty). */
function extraFromForm(formData: FormData) {
  const txt = (k: string) => String(formData.get(k) ?? "").trim() || null;
  let features: Record<string, boolean> = {};
  try {
    const raw = String(formData.get("features") ?? "");
    if (raw) features = JSON.parse(raw);
  } catch {
    features = {};
  }
  return {
    headline: txt("headline"),
    market: txt("market"),
    ownership: txt("ownership"),
    building_type: txt("building_type"),
    condition_std: txt("condition_std"),
    heating: txt("heating"),
    available_from: txt("available_from"),
    floors_total: intOrNull(formData.get("floors_total")),
    year_built: intOrNull(formData.get("year_built")),
    plot_area_m2: floatOrNull(formData.get("plot_area_m2")),
    admin_fee_pln: floatOrNull(formData.get("admin_fee_pln")),
    deposit_pln: floatOrNull(formData.get("deposit_pln")),
    features,
    export_to_web: formData.get("export_to_web") === "1",
    export_to_portals: formData.get("export_to_portals") === "1",
    export_address_mode: txt("export_address_mode") ?? "ulica",
  };
}

/**
 * Pola zależne od typu nieruchomości. Bierzemy tylko te, które słownik
 * przewiduje dla wybranego typu i rodzaju transakcji - formularz z przeglądarki
 * nie może dorzucić własnych kluczy, a zmiana typu w edycji czyści pola,
 * które do niego nie pasują.
 */
function detailsFromForm(formData: FormData, type: PropertyType, dealKind: PropertyDealKind) {
  const out: Record<string, unknown> = {};
  for (const f of detailFieldsFor(type, dealKind)) {
    const name = DETAIL_PREFIX + f.key;
    if (f.kind === "multi") {
      const picked = formData.getAll(name).map((v) => String(v)).filter(Boolean);
      if (picked.length) out[f.key] = picked;
      continue;
    }
    if (f.kind === "bool") {
      if (formData.get(name) === "1") out[f.key] = true;
      continue;
    }
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) continue;
    if (f.kind === "number") {
      const num = floatOrNull(raw);
      if (num != null) out[f.key] = num;
      continue;
    }
    if (f.kind === "date") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) out[f.key] = raw;
      continue;
    }
    out[f.key] = raw.slice(0, 500);
  }
  // Opis po angielsku nie jest polem ze słownika (ma własne miejsce w kroku
  // Opis), ale zapisujemy go razem z resztą pól zależnych od typu.
  const en = String(formData.get("description_en") ?? "").trim();
  if (en) out.opis_en = en.slice(0, 8500);
  // Rozbicie adresu z podpowiedzi (lib/geocode.ts). Dzielnicę wpisujemy, gdy
  // agent jej nie podał; ulica i numer osobno są potrzebne portalom.
  const pole = (k: string) => String(formData.get(k) ?? "").trim().slice(0, 120);
  if (!out.dzielnica && pole("district")) out.dzielnica = pole("district");
  if (formData.get("portale_ftp_pole") === "1") {
    out.portale_ftp = formData.getAll("portal_ftp").map(String).filter((p) => portalFtp(p)).slice(0, 10);
  }
  if (pole("street_name")) out.adres_ulica = pole("street_name");
  if (pole("house_number")) out.adres_numer = pole("house_number");
  if (pole("postcode")) out.adres_kod = pole("postcode");
  return out;
}

/**
 * Nazwa oferty: miasto i ulica. Agent jej nie wpisuje, bo przy ręcznym
 * nazywaniu lista ofert w biurze robi się nieczytelna („mieszkanie Nowak").
 * Ulicę bierzemy z podpowiedzi adresu, a gdy agent wpisał adres z palca -
 * z pierwszych członów tego, co wpisał.
 */
function buildTitle(f: ReturnType<typeof propertyFromForm>, street: string): string {
  const ulica = street || ulicaZAdresu(f.address, f.city);
  const gdzie = [f.city, ulica].filter(Boolean).join(", ");
  if (gdzie) return gdzie;
  const typeLabel =
    PROPERTY_TYPES.find((t) => t.value === f.property_type)?.label ?? "Nieruchomość";
  return [typeLabel, f.area_m2 ? `${f.area_m2} m2` : ""].filter(Boolean).join(", ");
}

/** Z „327, Królowej Jadwigi, Chełm, Kraków, ..." robi „Królowej Jadwigi 327". */
function ulicaZAdresu(address: string | null, city: string | null): string {
  if (!address) return "";
  const czesci = address.split(",").map((c) => c.trim()).filter(Boolean);
  if (!czesci.length) return "";
  const bezMiasta = czesci.filter((c) => !city || c.toLowerCase() !== city.toLowerCase());
  const numer = /^\d+[A-Za-z]?$/.test(bezMiasta[0] ?? "") ? bezMiasta.shift() : null;
  const nazwa = bezMiasta[0] ?? "";
  return [nazwa, numer].filter(Boolean).join(" ");
}

/** Człon URL pod stronę www: mieszkanie-sprzedaz-47m2-krakow-soltysowska. */
function buildSlug(f: ReturnType<typeof propertyFromForm>, offerNo: string | null): string {
  const parts = [
    f.property_type,
    f.deal_kind,
    f.area_m2 ? `${Math.round(f.area_m2)}m2` : "",
    f.city ?? "",
    f.address ?? "",
    offerNo ?? "",
  ];
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Wynik zapisu. Kreator zamyka się tylko przy powodzeniu. */
export type SaveResult = { ok: true; portal?: { ok: boolean; teksty: string[] } } | { ok: false; error: string };

/**
 * Eksport na portale przy zapisie oferty (krok Publikacja w kreatorze).
 * Zaznaczone = publikuj albo zaktualizuj, odznaczone przy aktywnym ogłoszeniu
 * = dezaktywuj. Pole `otodom_pole` mówi, że kreator pokazał tę opcję: bez niego
 * (biuro niepołączone) niczego nie ruszamy.
 */
/**
 * Portale przez FTP dostają pełny plik biura, więc po zapisie oferty wysyłamy
 * go na nowo do każdego portalu, na którym oferta była albo ma być. Wysyłka
 * trwa (zdjęcia), dlatego idzie po odpowiedzi, a agent nie czeka.
 */
function eksportFtp(agencyId: string | null, userId: string, formData: FormData) {
  if (!agencyId || formData.get("portale_ftp_pole") !== "1") return;
  const przed = String(formData.get("portale_ftp_przed") ?? "").split(",").filter(Boolean);
  const portale = new Set([...przed, ...formData.getAll("portal_ftp").map(String)].filter((p) => portalFtp(p)));
  for (const p of portale) after(() => wyslijNaPortalFtp(agencyId, p, userId).then(() => undefined));
}

async function eksportPortali(user: { id: string; agency_id: string | null; role: string }, id: string, formData: FormData): Promise<{ ok: boolean; teksty: string[] } | undefined> {
  if (formData.get("otodom_pole") !== "1" || !user.agency_id) return undefined;
  const { publikujNaOtodom, zmienStanOtodom, ogloszenieOferty } = await import("@/lib/otodom/ogloszenia");
  const chce = formData.get("export_otodom") === "1";
  const obecne = await ogloszenieOferty(id);
  if (chce) {
    const r = await publikujNaOtodom(user.agency_id, user.id, id, formData.get("otodom_exact") === "1");
    if (r.ok) await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "portal_publikacja", rodzaj: "oferta", id, opis: "Wysłano na Otodom z kreatora oferty", meta: { portal: "otodom" } });
    return r.ok ? { ok: true, teksty: [r.komunikat] } : { ok: false, teksty: r.bledy };
  }
  if (obecne?.advert_uuid && ["active", "new", "wysylanie"].includes(obecne.status ?? "")) {
    const r = await zmienStanOtodom(user.agency_id, user.id, id, "deactivate");
    return r.ok ? { ok: true, teksty: [r.komunikat] } : { ok: false, teksty: r.bledy };
  }
  return undefined;
}

/**
 * Świadectwo energetyczne (kolumny z v23). Zapisujemy je osobnym, opcjonalnym
 * zapytaniem: bez migracji v23 błąd tutaj nie może zablokować zapisu oferty.
 */
async function saveEnergyCert(
  admin: ReturnType<typeof createSupabaseAdmin>,
  id: string,
  agencyId: string | null,
  formData: FormData,
): Promise<void> {
  if (!formData.has("energy_cert_status")) return;
  const status = String(formData.get("energy_cert_status") ?? "");
  const until = String(formData.get("energy_cert_valid_until") ?? "");
  await admin
    .from("properties")
    .update({
      energy_cert_status: ["posiada", "w_przygotowaniu", "zwolniona"].includes(status) ? status : null,
      energy_ep: floatOrNull(formData.get("energy_ep")),
      energy_cert_valid_until: /^\d{4}-\d{2}-\d{2}$/.test(until) ? until : null,
    })
    .eq("id", id)
    .eq("agency_id", agencyId);
}

/**
 * Pola zależne od typu (kolumna details z v31). Osobny, opcjonalny zapis:
 * bez migracji błąd tutaj nie może zablokować zapisania oferty.
 */
async function saveDetails(
  admin: ReturnType<typeof createSupabaseAdmin>,
  id: string,
  agencyId: string | null,
  formData: FormData,
  type: PropertyType,
  dealKind: PropertyDealKind,
): Promise<void> {
  await admin
    .from("properties")
    .update({ details: detailsFromForm(formData, type, dealKind) })
    .eq("id", id)
    .eq("agency_id", agencyId);
}

export async function createProperty(formData: FormData): Promise<SaveResult> {
  const user = await requireUser();
  const fields = propertyFromForm(formData);
  fields.title = buildTitle(fields, String(formData.get("street") ?? "").trim());
  if (!fields.title) {
    return { ok: false, error: "Uzupełnij adres oferty." };
  }

  const admin = createSupabaseAdmin();
  fields.owner_client_id = await idZBiura(admin, "clients", fields.owner_client_id, user.agency_id);
  const extra = extraFromForm(formData);

  // Numer oferty per biuro i rok, np. SP/2026/001. Prefiks z ustawień biura,
  // żeby inne biura nie dostawały numerów „SP". Gdy brak funkcji z v17,
  // pomijamy numer, żeby zapis się nie wywalił.
  const settings = await getAgencySettings(user.agency_id, user.agency?.name);
  const year = new Date().getFullYear();
  let offerNo: string | null = null;
  if (settings.options.auto_numbering) {
    const { data: noData } = await admin.rpc("next_offer_no", {
      p_agency: user.agency_id,
      p_year: year,
    });
    if (typeof noData === "number") {
      offerNo = `${settings.options.offer_prefix}/${year}/${String(noData).padStart(3, "0")}`;
    }
  }

  // Zdjęcia wgrane w kreatorze. Przepuszczamy tylko pliki z folderu biura.
  let photos: ReturnType<typeof sanitizePhotos> = [];
  try {
    photos = user.agency_id
      ? sanitizePhotos(JSON.parse(String(formData.get("photos") ?? "[]")), user.agency_id)
      : [];
  } catch {
    photos = [];
  }

  const full = {
    agent_id: user.id,
    agency_id: user.agency_id,
    ...fields,
    ...extra,
    photos,
    offer_no: offerNo,
    slug: buildSlug(fields, offerNo),
    web_published_at: extra.export_to_web ? new Date().toISOString() : null,
  };

  let { data, error } = await admin.from("properties").insert(full).select("id").single();

  // Brak migracji v17 = nieznane kolumny. Zapisujemy wtedy sam rdzeń oferty,
  // żeby agent nie stracił wprowadzonych danych podstawowych.
  if (error) {
    const retry = await admin
      .from("properties")
      .insert({ agent_id: user.id, agency_id: user.agency_id, ...fields })
      .select("id")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (!data) {
    return {
      ok: false,
      error: `Nie udało się zapisać oferty: ${error?.message ?? "nieznany błąd"}`,
    };
  }
  await saveEnergyCert(admin, data.id, user.agency_id, formData);
  await saveDetails(admin, data.id, user.agency_id, formData, fields.property_type, fields.deal_kind);

  const nowaId = data.id as string;
  // Wynik eksportu nowej oferty widać na jej karcie (status i ewentualne braki).
  await eksportPortali(user, nowaId, formData);
  eksportFtp(user.agency_id, user.id, formData);
  after(() => poNowejOfercie(user, nowaId));
  revalidatePath("/app/nieruchomosci");
  redirect(`/app/nieruchomosci/${nowaId}`);
}

/**
 * Edycja oferty z kreatora: wszystkie pola, udogodnienia, publikacja i zdjęcia.
 * Pliki zdjęć usunięte w edycji kasujemy z magazynu dopiero po udanym zapisie.
 */
export async function updateProperty(id: string, formData: FormData): Promise<SaveResult> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const fields = propertyFromForm(formData);
  fields.title = buildTitle(fields, String(formData.get("street") ?? "").trim());
  if (!fields.title) {
    return { ok: false, error: "Uzupełnij adres oferty." };
  }

  const admin = createSupabaseAdmin();
  fields.owner_client_id = await idZBiura(admin, "clients", fields.owner_client_id, user.agency_id);
  const { data: before } = await admin
    .from("properties")
    .select("photos, export_to_web, web_published_at, price_pln, title")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!before) return { ok: false, error: "Nie znaleziono oferty." };

  let photos: ReturnType<typeof sanitizePhotos> = [];
  try {
    photos = sanitizePhotos(JSON.parse(String(formData.get("photos") ?? "[]")), user.agency_id);
  } catch {
    photos = (before.photos ?? []) as ReturnType<typeof sanitizePhotos>;
  }

  const extra = extraFromForm(formData);
  const now = new Date().toISOString();
  const full = {
    ...fields,
    ...extra,
    photos,
    // Data publikacji na stronie ustawiana przy pierwszym włączeniu eksportu.
    web_published_at: extra.export_to_web ? before.web_published_at ?? now : null,
    updated_at: now,
    // Autor zmiany dla historii ceny (v49). Bez migracji kolumny nie ma,
    // a nieznana kolumna odrzuciłaby cały zapis oferty.
    ...((await maV49()) ? { edited_by: user.id } : {}),
  };

  let { error } = await admin.from("properties").update(full).eq("id", id).eq("agency_id", user.agency_id);
  if (error) {
    // Brak kolumn z v17: zapisujemy przynajmniej rdzeń oferty.
    const retry = await admin
      .from("properties")
      .update({ ...fields, updated_at: now })
      .eq("id", id)
      .eq("agency_id", user.agency_id);
    error = retry.error;
    if (error) return { ok: false, error: `Nie udało się zapisać zmian: ${error.message}` };
  } else {
    const keep = new Set(photos.flatMap((p) => [p.path, p.original_path]).filter(Boolean));
    const dropped = ((before.photos ?? []) as { path?: string; original_path?: string }[])
      .flatMap((p) => [p.path, p.original_path])
      .filter((p): p is string => !!p && !keep.has(p) && p.startsWith(`${user.agency_id}/`));
    await removeFiles(PHOTO_BUCKET, [...new Set(dropped)]);
  }

  await saveEnergyCert(admin, id, user.agency_id, formData);
  await saveDetails(admin, id, user.agency_id, formData, fields.property_type, fields.deal_kind);

  const staraCena = before.price_pln == null ? null : Number(before.price_pln);
  const nowaCena = fields.price_pln == null ? null : Number(fields.price_pln);
  if (staraCena !== nowaCena) {
    await zapiszZdarzenie({
      agencyId: user.agency_id,
      actorId: user.id,
      akcja: "zmiana_ceny",
      rodzaj: "oferta",
      id,
      opis: `Cena „${fields.title}": ${staraCena == null ? "brak" : formatPln(staraCena)} → ${nowaCena == null ? "brak" : formatPln(nowaCena)}`,
    });
    // Reguły „cena oferty spadła" i podobne: odpalamy po zapisie, nie przed,
    // żeby automatyzacja nie widziała starej ceny.
    const agencyId = user.agency_id;
    after(() =>
      uruchomAutomatyzacje(agencyId, {
        zdarzenie: "zmiana_ceny_oferty",
        ofertaId: id,
        staraCena,
        nowaCena,
        autorId: user.id,
      }),
    );
  }

  const portal = await eksportPortali(user, id, formData);
  eksportFtp(user.agency_id, user.id, formData);

  revalidatePath(`/app/nieruchomosci/${id}`);
  revalidatePath("/app/nieruchomosci");
  return { ok: true, portal };
}

export async function setPropertyStatus(
  id: string,
  status: PropertyStatus,
): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const { data: zmieniona } = await admin
    .from("properties")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .select("details")
    .maybeSingle();
  // Sprzedana albo zarchiwizowana oferta znika z portali FTP przy następnym pliku.
  const portaleFtp = (zmieniona?.details as Record<string, unknown> | null)?.portale_ftp;
  if (user.agency_id && Array.isArray(portaleFtp)) {
    const agencyId = user.agency_id;
    for (const p of portaleFtp.map(String).filter((x) => portalFtp(x))) after(() => wyslijNaPortalFtp(agencyId, p, user.id).then(() => undefined));
  }
  revalidatePath(`/app/nieruchomosci/${id}`);
  revalidatePath("/app/nieruchomosci");
}

export async function deleteProperty(id: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();

  // Zdjęcia oferty kasujemy razem z nią, inaczej zostałyby w magazynie na zawsze.
  const { data: prop } = await admin
    .from("properties")
    .select("photos, agent_id, title")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  // Agent usuwa tylko swoje oferty; cudze CEO albo menedżer.
  if (!prop || !mozeUsunac(user, prop)) redirect(`/app/nieruchomosci/${id}`);

  const { error } = await admin.from("properties").delete().eq("id", id).eq("agency_id", user.agency_id);
  if (!error && prop && user.agency_id) {
    await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "oferta_usunieta", rodzaj: "oferta", opis: `Usunięto ofertę: ${prop.title ?? "bez tytułu"}` });
    const files = ((prop.photos ?? []) as { path?: string; original_path?: string }[])
      .flatMap((p) => [p.path, p.original_path])
      .filter((p): p is string => !!p && p.startsWith(`${user.agency_id}/`));
    await removeFiles(PHOTO_BUCKET, [...new Set(files)]);
  }
  revalidatePath("/app/nieruchomosci");
  redirect("/app/nieruchomosci");
}

/** Powiąż/odłącz klienta-właściciela oferty. */
export async function setPropertyOwner(
  propertyId: string,
  clientId: string | null,
): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  if (clientId && !(await idZBiura(admin, "clients", clientId, user.agency_id))) return;
  await admin
    .from("properties")
    .update({ owner_client_id: clientId, updated_at: new Date().toISOString() })
    .eq("id", propertyId)
    .eq("agency_id", user.agency_id);
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}

/**
 * Sprawdza, że oferta należy do biura zalogowanego użytkownika.
 * Tabela property_interests nie ma kolumny agency_id, więc bez tego ktoś
 * z innego biura mógłby modyfikować powiązania, znając identyfikator oferty.
 */
async function ownsProperty(
  admin: ReturnType<typeof createSupabaseAdmin>,
  propertyId: string,
  agencyId: string | null,
): Promise<boolean> {
  if (!agencyId) return false;
  const { data } = await admin
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("agency_id", agencyId)
    .maybeSingle();
  return !!data;
}

/** Dodaj klienta jako zainteresowanego ofertą (kupujący/najemca). */
export async function addPropertyInterest(
  propertyId: string,
  clientId: string,
): Promise<void> {
  const user = await requireUser();
  if (!clientId) return;
  const admin = createSupabaseAdmin();
  if (!(await ownsProperty(admin, propertyId, user.agency_id))) return;
  if (!(await idZBiura(admin, "clients", clientId, user.agency_id))) return;
  await admin
    .from("property_interests")
    .upsert(
      { property_id: propertyId, client_id: clientId },
      { onConflict: "property_id,client_id", ignoreDuplicates: true },
    );
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}

export async function removePropertyInterest(
  propertyId: string,
  clientId: string,
): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  if (!(await ownsProperty(admin, propertyId, user.agency_id))) return;
  await admin
    .from("property_interests")
    .delete()
    .eq("property_id", propertyId)
    .eq("client_id", clientId);
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}

/** Rola powiązanego klienta: właściciel przy sprzedaży, wynajmujący przy najmie. */
export async function setPropertyOwnerRole(propertyId: string, role: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("properties")
    .update({ owner_role: role, updated_at: new Date().toISOString() })
    .eq("id", propertyId)
    .eq("agency_id", user.agency_id);
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}

/**
 * Zakłada klienta i od razu przypina go do oferty. Agent stojący u klienta
 * nie musi przełączać się do modułu Klienci, żeby dopisać właściciela.
 */
export async function attachNewOwner(
  propertyId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("owner_name") ?? "").trim();
  if (!name) return;
  const phone = String(formData.get("owner_phone") ?? "").trim() || null;
  const role = String(formData.get("owner_role") ?? "wlasciciel");

  const admin = createSupabaseAdmin();
  const { data: client } = await admin
    .from("clients")
    .insert({
      agent_id: user.id,
      agency_id: user.agency_id,
      name,
      phone,
      type: role === "wynajmujacy" ? "wynajmujacy" : "sprzedajacy",
      status: "w_kontakcie",
      last_contact_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (client) {
    await admin
      .from("properties")
      .update({ owner_client_id: client.id, owner_role: role, updated_at: new Date().toISOString() })
      .eq("id", propertyId)
      .eq("agency_id", user.agency_id);
  }

  revalidatePath(`/app/nieruchomosci/${propertyId}`);
  revalidatePath("/app/klienci");
}

/** Etap procesu obsługi oferty (pasek na karcie). */
export async function setProcessStage(propertyId: string, stage: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("properties")
    .update({
      process_stage: stage,
      process_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId)
    .eq("agency_id", user.agency_id);
  if (!error) after(() => poZmianieEtapuOferty(user, propertyId, stage));
  revalidatePath(`/app/nieruchomosci/${propertyId}`);
}
