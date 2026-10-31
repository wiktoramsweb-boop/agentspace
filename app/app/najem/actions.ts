"use server";

import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { konfigBiura } from "@/lib/data-najem";
import { randomBytes } from "node:crypto";
import { powiadomWlasciciela } from "@/lib/data-wlasciciel";
import { ETAPY_NAJMU, FORMY_UMOWY, MODELE_ROZLICZEN, RODZAJE_OPLAT, ROLE_STRON, TYPY_NAJMU, USLUGI, type Konfig } from "@/lib/najem-model";

type Wynik = { ok: true; id?: string } | { ok: false; error: string };

const BRAK = "Uruchom w Supabase lib/SETUP-v60-najem.sql.";
const txt = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max) || null;
const num = (v: unknown): number | null => {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return String(v ?? "").trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};
const data = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "")) ? String(v) : null);

async function dostep() {
  const user = await requireModul("najem");
  if (!user.agency_id) throw new Error("Brak biura");
  return { user, agencyId: user.agency_id, admin: createSupabaseAdmin() };
}

async function mojLokal(id: string) {
  const d = await dostep();
  const { data: l } = await d.admin.from("rental_units").select("id, adres, etap").eq("id", id).eq("agency_id", d.agencyId).maybeSingle();
  return l ? { ...d, lokal: l } : null;
}

const odswiez = (id?: string) => {
  revalidatePath("/app/najem");
  if (id) revalidatePath(`/app/najem/${id}`);
};

export async function nowyLokal(f: Record<string, string>): Promise<Wynik> {
  const { user, agencyId, admin } = await dostep();
  const adres = txt(f.address, 200);
  if (!adres) return { ok: false, error: "Podaj adres lokalu." };
  const k = await konfigBiura(agencyId);
  const { data: l, error } = await admin
    .from("rental_units")
    .insert({
      agency_id: agencyId,
      opiekun_id: user.id,
      adres,
      miasto: txt(f.city, 80),
      lat: num(f.lat),
      lng: num(f.lng),
      pow: num(f.pow),
      pokoje: num(f.pokoje),
      typ_najmu: TYPY_NAJMU.some((t) => t.id === f.typ) ? f.typ : k.typy[0],
      model: MODELE_ROZLICZEN.some((m) => m.id === f.model) ? f.model : k.modele[0],
      prowizja_pct: k.prowizjaPct,
      oplata_startowa: k.oplataStartowa,
      limit_napraw: k.limitNapraw,
      czynsz_oczekiwany: num(f.czynsz),
      czynsz_min: num(f.czynszMin),
    })
    .select("id")
    .single();
  if (error || !l) return { ok: false, error: BRAK };
  const wlasciciel = txt(f.wlasciciel, 120);
  if (wlasciciel) await admin.from("rental_parties").insert({ unit_id: l.id, agency_id: agencyId, rola: "wlasciciel", nazwa: wlasciciel, telefon: txt(f.telefon, 30), email: txt(f.email, 120) });
  await zapiszZdarzenie({ agencyId, actorId: user.id, akcja: "najem_lokal", rodzaj: "oferta", id: l.id, opis: `Nowy lokal w zarządzaniu: ${adres}` });
  odswiez();
  return { ok: true, id: l.id };
}

/** Karta lokalu: tylko pola z tej listy, formularz nie dopisze niczego spoza niej. */
export async function zapiszLokal(id: string, f: Record<string, string>, ankieta?: Record<string, string>, liczniki?: Record<string, string>): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d) return { ok: false, error: "Nie znaleziono lokalu." };
  const zmiana: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("kw" in f) zmiana.kw = txt(f.kw, 40);
  if ("pow" in f) zmiana.pow = num(f.pow);
  if ("pokoje" in f) zmiana.pokoje = num(f.pokoje);
  if ("typ_najmu" in f && TYPY_NAJMU.some((t) => t.id === f.typ_najmu)) zmiana.typ_najmu = f.typ_najmu;
  if ("model" in f && MODELE_ROZLICZEN.some((m) => m.id === f.model)) zmiana.model = f.model;
  for (const k of ["prowizja_pct", "oplata_startowa", "czynsz_oczekiwany", "czynsz_min", "limit_napraw", "oplaty_admin"]) if (k in f) zmiana[k] = num(f[k]);
  if ("parking_w_podstawie" in f) zmiana.parking_w_podstawie = f.parking_w_podstawie === "1";
  if ("umowa_od" in f) zmiana.umowa_od = data(f.umowa_od);
  if ("notatka" in f) zmiana.notatka = txt(f.notatka, 2000);
  if (ankieta) zmiana.ankieta = Object.fromEntries(Object.entries(ankieta).slice(0, 30).map(([k, v]) => [k.slice(0, 40), String(v).slice(0, 300)]));
  if (liczniki) zmiana.liczniki = Object.fromEntries(Object.entries(liczniki).slice(0, 30).map(([k, v]) => [k.slice(0, 40), String(v).slice(0, 80)]));
  const { error } = await d.admin.from("rental_units").update(zmiana).eq("id", id);
  if (error) return { ok: false, error: "Nie udało się zapisać." };
  odswiez(id);
  return { ok: true };
}

export async function zmienEtapLokalu(id: string, etap: string): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d || !ETAPY_NAJMU.some((e) => e.id === etap)) return { ok: false, error: "Nie znaleziono lokalu." };
  await d.admin.from("rental_units").update({ etap, updated_at: new Date().toISOString() }).eq("id", id);
  odswiez(id);
  return { ok: true };
}

export async function przeniesLokal(id: string, etap: string, kolejnosc: { id: string; pos: number }[]): Promise<string | null> {
  const w = await zmienEtapLokalu(id, etap);
  if (!w.ok) return w.error;
  const { admin, agencyId } = await dostep();
  await Promise.all(kolejnosc.slice(0, 200).map((k) => (Number.isFinite(k.pos) ? admin.from("rental_units").update({ kanban_pos: k.pos }).eq("id", k.id).eq("agency_id", agencyId) : null)));
  return null;
}

export async function oznaczKrok(id: string, krok: string, gotowe: boolean): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d) return { ok: false, error: "Nie znaleziono lokalu." };
  const { data: l } = await d.admin.from("rental_units").select("kroki").eq("id", id).single();
  await d.admin.from("rental_units").update({ kroki: { ...(l?.kroki ?? {}), [krok.slice(0, 40)]: gotowe } }).eq("id", id);
  odswiez(id);
  return { ok: true };
}

export async function dodajStrone(id: string, f: Record<string, string>): Promise<Wynik> {
  const d = await mojLokal(id);
  const nazwa = txt(f.nazwa, 120);
  if (!d || !nazwa) return { ok: false, error: "Podaj imię i nazwisko albo nazwę." };
  const rola = ROLE_STRON.some((r) => r.id === f.rola) ? f.rola : "najemca";
  await d.admin.from("rental_parties").insert({ unit_id: id, agency_id: d.agencyId, rola, nazwa, telefon: txt(f.telefon, 30), email: txt(f.email, 120), uwagi: txt(f.uwagi, 500) });
  odswiez(id);
  return { ok: true };
}

export async function usunStrone(id: string, stronaId: string): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d) return { ok: false, error: "Nie znaleziono lokalu." };
  await d.admin.from("rental_parties").delete().eq("id", stronaId).eq("unit_id", id);
  await zapiszZdarzenie({ agencyId: d.agencyId, actorId: d.user.id, akcja: "najem_strona_usunieta", rodzaj: "oferta", id, opis: `Usunięto stronę przy lokalu ${d.lokal.adres}` });
  odswiez(id);
  return { ok: true };
}

/** Nowa umowa najmu. Poprzednia aktywna zostaje w historii, a lokal przechodzi na „Wynajęte”. */
export async function zapiszNajem(id: string, f: Record<string, string>): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d) return { ok: false, error: "Nie znaleziono lokalu." };
  const od = data(f.od);
  const czynsz = num(f.czynsz);
  if (!od || !czynsz) return { ok: false, error: "Podaj datę początku i czynsz." };
  await d.admin.from("rental_tenancies").update({ aktywny: false }).eq("unit_id", id).eq("aktywny", true);
  const { error } = await d.admin.from("rental_tenancies").insert({
    unit_id: id,
    agency_id: d.agencyId,
    forma: FORMY_UMOWY.some((x) => x.id === f.forma) ? f.forma : "zwykly",
    od,
    do_dnia: data(f.do_dnia),
    czynsz,
    parking: num(f.parking) ?? 0,
    oplaty: num(f.oplaty) ?? 0,
    kaucja: num(f.kaucja) ?? 0,
    dzien_platnosci: Math.min(28, Math.max(1, num(f.dzien) ?? 10)),
  });
  if (error) return { ok: false, error: "Nie udało się zapisać umowy." };
  await d.admin.from("rental_units").update({ etap: "wynajete", updated_at: new Date().toISOString() }).eq("id", id);
  await zapiszZdarzenie({ agencyId: d.agencyId, actorId: d.user.id, akcja: "najem_umowa", rodzaj: "oferta", id, opis: `Nowa umowa najmu: ${d.lokal.adres}` });
  odswiez(id);
  return { ok: true };
}

export async function zmienNajem(id: string, najemId: string, f: { us?: string; kaucja_stan?: string; zakoncz?: boolean; do_dnia?: string }): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d) return { ok: false, error: "Nie znaleziono lokalu." };
  const zmiana: Record<string, unknown> = {};
  if (f.us !== undefined) zmiana.us_zgloszono = data(f.us);
  if (f.kaucja_stan && ["pobrana", "zwrocona", "rozliczona"].includes(f.kaucja_stan)) zmiana.kaucja_stan = f.kaucja_stan;
  if (f.zakoncz) {
    zmiana.aktywny = false;
    zmiana.do_dnia = data(f.do_dnia) ?? new Date().toISOString().slice(0, 10);
  }
  await d.admin.from("rental_tenancies").update(zmiana).eq("id", najemId).eq("unit_id", id);
  if (f.zakoncz) await d.admin.from("rental_units").update({ etap: "koniec", updated_at: new Date().toISOString() }).eq("id", id);
  odswiez(id);
  return { ok: true };
}

export async function zapiszWplate(id: string, miesiac: string, f: Record<string, string>): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d || !/^\d{4}-\d{2}$/.test(miesiac)) return { ok: false, error: "Nie znaleziono lokalu." };
  const { error } = await d.admin.from("rental_payments").upsert(
    { unit_id: id, agency_id: d.agencyId, miesiac, czynsz: num(f.czynsz) ?? 0, oplaty: num(f.oplaty) ?? 0, koszty: num(f.koszty) ?? 0, koszty_opis: txt(f.koszty_opis, 300), przekazano: data(f.przekazano), updated_at: new Date().toISOString() },
    { onConflict: "unit_id,miesiac" },
  );
  if (error) return { ok: false, error: "Nie udało się zapisać wpłaty." };
  odswiez(id);
  return { ok: true };
}

export async function dodajZdarzenie(id: string, f: Record<string, string>): Promise<Wynik> {
  const d = await mojLokal(id);
  const tytul = txt(f.tytul, 200);
  if (!d || !tytul) return { ok: false, error: "Opisz zgłoszenie." };
  const koszt = num(f.koszt);
  const { data: l } = await d.admin.from("rental_units").select("limit_napraw").eq("id", id).single();
  // Koszt ponad limit z umowy czeka na decyzję właściciela w jego portalu.
  const zgoda = koszt != null && l?.limit_napraw != null && koszt > Number(l.limit_napraw) ? "oczekuje" : "nie_dotyczy";
  const pelny = { unit_id: id, agency_id: d.agencyId, rodzaj: ["usterka", "przeglad", "zdarzenie"].includes(f.rodzaj) ? f.rodzaj : "usterka", tytul, koszt, termin: data(f.termin), autor_id: d.user.id };
  const { error } = await d.admin.from("rental_events").insert({ ...pelny, zgoda });
  if (error) await d.admin.from("rental_events").insert(pelny);
  if (zgoda === "oczekuje") await powiadomWlasciciela(id, `Koszt do akceptacji: ${tytul}`);
  odswiez(id);
  return { ok: true };
}

export async function zmienZdarzenie(id: string, zdarzenieId: string, stan: string): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d || !["otwarte", "w_toku", "zamkniete"].includes(stan)) return { ok: false, error: "Nie znaleziono." };
  await d.admin.from("rental_events").update({ stan }).eq("id", zdarzenieId).eq("unit_id", id);
  odswiez(id);
  return { ok: true };
}

/** Oferta biura. Zmienia ją szef, bo to warunki handlowe całej firmy. */
export async function zapiszKonfig(k: Konfig): Promise<Wynik> {
  const { user, agencyId, admin } = await dostep();
  if (user.role !== "owner" && user.role !== "director") return { ok: false, error: "Warunki zmienia CEO albo dyrektor." };
  const lista = (v: unknown, dozwolone: { id: string }[]) => (Array.isArray(v) ? v.filter((x) => dozwolone.some((d) => d.id === x)) : []);
  const config: Konfig = {
    prowizjaPct: Math.min(100, Math.max(0, Number(k.prowizjaPct) || 0)),
    oplataStartowa: Math.max(0, Number(k.oplataStartowa) || 0),
    limitNapraw: Math.max(0, Number(k.limitNapraw) || 0),
    przegladyRok: Math.min(12, Math.max(0, Number(k.przegladyRok) || 0)),
    dzienRozliczenia: Math.min(28, Math.max(1, Number(k.dzienRozliczenia) || 10)),
    dniNaZastrzezenia: Math.min(60, Math.max(0, Number(k.dniNaZastrzezenia) || 0)),
    modele: lista(k.modele, MODELE_ROZLICZEN),
    typy: lista(k.typy, TYPY_NAJMU),
    formy: lista(k.formy, FORMY_UMOWY),
    uslugi: lista(k.uslugi, USLUGI),
  };
  if (!config.modele.length || !config.typy.length || !config.formy.length) return { ok: false, error: "Zostaw co najmniej jeden model, typ i formę umowy." };
  const { error } = await admin.from("rental_settings").upsert({ agency_id: agencyId, config, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: BRAK };
  await zapiszZdarzenie({ agencyId, actorId: user.id, akcja: "najem_ustawienia", rodzaj: "ustawienia", opis: "Zmiana warunków zarządzania najmem" });
  revalidatePath("/app/najem");
  return { ok: true };
}

const BRAK_V61 = "Uruchom w Supabase lib/SETUP-v61-najem-portal.sql.";

/** Rachunek z danego miesiąca: każdy osobno, bo media co miesiąc są inne. */
export async function dodajOplate(id: string, f: Record<string, string>): Promise<Wynik> {
  const d = await mojLokal(id);
  const kwota = num(f.kwota);
  if (!d || !kwota || !/^\d{4}-\d{2}$/.test(f.miesiac ?? "")) return { ok: false, error: "Podaj miesiąc i kwotę." };
  const { error } = await d.admin.from("rental_charges").insert({
    unit_id: id,
    agency_id: d.agencyId,
    miesiac: f.miesiac,
    okres_mies: Math.min(12, Math.max(1, num(f.okres_mies) ?? 1)),
    rodzaj: RODZAJE_OPLAT.some((r) => r.id === f.rodzaj) ? f.rodzaj : "inne",
    kwota,
    najemca_placi: f.najemca_placi === "1",
    biuro_oplaca: f.biuro_oplaca === "1",
    odczyt: num(f.odczyt),
    opis: txt(f.opis, 200),
  });
  if (error) return { ok: false, error: BRAK_V61 };
  odswiez(id);
  return { ok: true };
}

export async function usunOplate(id: string, oplataId: string): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d) return { ok: false, error: "Nie znaleziono lokalu." };
  await d.admin.from("rental_charges").delete().eq("id", oplataId).eq("unit_id", id);
  odswiez(id);
  return { ok: true };
}

/** Właściciel widzi miesiąc dopiero po tym kliknięciu, żeby nie oglądał niegotowych liczb. */
export async function opublikujMiesiac(id: string, miesiac: string, tak: boolean): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d || !/^\d{4}-\d{2}$/.test(miesiac)) return { ok: false, error: "Nie znaleziono lokalu." };
  const { error } = await d.admin.from("rental_payments").upsert({ unit_id: id, agency_id: d.agencyId, miesiac, opublikowano: tak ? new Date().toISOString() : null }, { onConflict: "unit_id,miesiac" });
  if (error) return { ok: false, error: BRAK_V61 };
  if (tak) await powiadomWlasciciela(id, `Rozliczenie za ${miesiac.slice(5)}/${miesiac.slice(0, 4)} jest gotowe`);
  odswiez(id);
  return { ok: true };
}

/** Dostęp właściciela. Istniejący link tej osoby dostaje nowy lokal zamiast drugiego linku. */
export async function wlaczPortal(id: string, nazwa: string): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d) return { ok: false, error: "Nie znaleziono lokalu." };
  const nazwaCz = txt(nazwa, 120);
  if (!nazwaCz) return { ok: false, error: "Dodaj właściciela w zakładce Strony." };
  const { data: byl, error: e1 } = await d.admin.from("rental_owner_access").select("id, unit_ids").eq("agency_id", d.agencyId).eq("nazwa", nazwaCz).is("revoked_at", null).maybeSingle();
  if (e1) return { ok: false, error: BRAK_V61 };
  if (byl) await d.admin.from("rental_owner_access").update({ unit_ids: [...new Set([...(byl.unit_ids as string[]), id])] }).eq("id", byl.id);
  else await d.admin.from("rental_owner_access").insert({ agency_id: d.agencyId, token: randomBytes(24).toString("base64url"), nazwa: nazwaCz, unit_ids: [id], created_by: d.user.id });
  await zapiszZdarzenie({ agencyId: d.agencyId, actorId: d.user.id, akcja: "najem_portal", rodzaj: "oferta", id, opis: `Portal właściciela włączony: ${d.lokal.adres}` });
  odswiez(id);
  return { ok: true };
}

export async function wylaczPortal(id: string, dostepId: string): Promise<Wynik> {
  const d = await mojLokal(id);
  if (!d) return { ok: false, error: "Nie znaleziono lokalu." };
  await d.admin.from("rental_owner_access").update({ revoked_at: new Date().toISOString() }).eq("id", dostepId).eq("agency_id", d.agencyId);
  await zapiszZdarzenie({ agencyId: d.agencyId, actorId: d.user.id, akcja: "najem_portal_stop", rodzaj: "oferta", id, opis: `Portal właściciela wyłączony: ${d.lokal.adres}` });
  odswiez(id);
  return { ok: true };
}

export async function odpiszWlascicielowi(id: string, dostepId: string, tresc: string): Promise<Wynik> {
  const d = await mojLokal(id);
  const t = txt(tresc, 2000);
  if (!d || !t) return { ok: false, error: "Napisz wiadomość." };
  const { data: a } = await d.admin.from("rental_owner_access").select("id").eq("id", dostepId).eq("agency_id", d.agencyId).maybeSingle();
  if (!a) return { ok: false, error: "Nie znaleziono dostępu." };
  await d.admin.from("rental_owner_messages").insert({ access_id: dostepId, agency_id: d.agencyId, autor: "biuro", autor_id: d.user.id, tresc: t });
  await d.admin.from("rental_owner_messages").update({ read_at: new Date().toISOString() }).eq("access_id", dostepId).eq("autor", "wlasciciel").is("read_at", null);
  odswiez(id);
  return { ok: true };
}
