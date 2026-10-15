"use server";

import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getAgencySettings } from "@/lib/agency-settings";
import { ukryjKontakt } from "@/lib/uprawnienia";
import { nieobecnosciWDniu } from "@/lib/zastepstwa";
import { maV49 } from "@/lib/schemat";
import { wzor } from "@/lib/dokumenty";
import type { Dane, Strona } from "@/lib/dokumenty/silnik";
import { adresZMiastem } from "@/lib/adres";

type Wynik<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function zlozAdres(ulica?: string | null, kod?: string | null, miasto?: string | null): string {
  const m = [kod, miasto].filter(Boolean).join(" ");
  return [ulica, m].filter(Boolean).join(", ");
}

/**
 * Dane klienta do umowy. Przy włączonym ukrywaniu kontaktów agent dostaje
 * tylko imię i nazwisko cudzego klienta: PESEL i adres z umowy to te same
 * dane, które ustawienie ma chronić.
 */
export async function klientDoDokumentu(id: string): Promise<Wynik<{ strona: Strona; ukryte: boolean }>> {
  const user = await requireModul("dokumenty");
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const admin = createSupabaseAdmin();
  const { data: c } = await admin
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!c) return { ok: false, error: "Nie znaleziono klienta." };

  const settings = await getAgencySettings(user.agency_id, user.agency?.name);
  const nieobecni = await nieobecnosciWDniu(user.agency_id);
  const zastepowani = nieobecni.filter((n) => n.substitute_id === user.id).map((n) => n.agent_id);
  const ukryte = ukryjKontakt(user, settings.options.hide_contacts, c, zastepowani);

  const imie = String(c.name ?? "").trim() || [c.first_name, c.last_name].filter(Boolean).join(" ");
  const dokument = String(c.id_document ?? "").trim();
  const strona: Strona = ukryte
    ? { imie, pesel: "", dokument: "dowod", nrDokumentu: "", adres: "" }
    : {
        imie,
        pesel: String(c.pesel ?? ""),
        dokument: /paszport/i.test(dokument) ? "paszport" : "dowod",
        nrDokumentu: dokument.replace(/^(dowód|dowod|paszport)\s*:?\s*/i, ""),
        adres: zlozAdres(c.address, c.postal_code, c.city),
        telefon: c.phone ?? "",
        email: c.email ?? "",
      };
  return { ok: true, strona, ukryte };
}

/** Pola oferty, które wzory umieją przejąć (adres, cena, metraż…). */
export async function ofertaDoDokumentu(id: string): Promise<Wynik<{ pola: Record<string, string> }>> {
  const user = await requireModul("dokumenty");
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const { data: p } = await createSupabaseAdmin()
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!p) return { ok: false, error: "Nie znaleziono oferty." };

  const n = (v: unknown) => (v == null || v === "" ? "" : String(v));
  const najem = p.deal_kind === "wynajem";
  return {
    ok: true,
    pola: {
      adres: adresZMiastem(p.address, p.city),
      cena: najem ? "" : n(p.price_pln),
      czynsz: najem ? n(p.price_pln) : "",
      kaucja: n(p.deposit_pln),
      metraz: n(p.area_m2),
      pokoje: n(p.rooms),
      numerOferty: n(p.offer_no),
      miasto: n(p.city),
    },
  };
}

/**
 * Po zapisaniu PDF-a przy kliencie lub ofercie dopisujemy, z jakiego wzoru
 * powstał i z jakimi danymi. Dzięki temu da się go później otworzyć do
 * poprawki zamiast wypełniać od zera. Bez migracji v49 po prostu pomijamy.
 */
export async function oznaczWzor(docId: string, wzorId: string, dane: Dane): Promise<Wynik> {
  const user = await requireModul("dokumenty");
  if (!wzor(wzorId)) return { ok: false, error: "Nieznany wzór." };
  if (!(await maV49())) return { ok: true };
  const json = JSON.stringify(dane);
  if (json.length > 60_000) return { ok: true };
  await createSupabaseAdmin()
    .from("documents")
    .update({ template: wzorId, form_data: dane })
    .eq("id", docId)
    .eq("agency_id", user.agency_id);
  return { ok: true };
}

/** Dane z dokumentu zapisanego wcześniej z tego samego wzoru. */
export async function daneZapisanegoDokumentu(docId: string): Promise<Wynik<{ wzorId: string; dane: Dane }>> {
  const user = await requireModul("dokumenty");
  if (!(await maV49())) return { ok: false, error: "Ta funkcja wymaga migracji v49." };
  const { data } = await createSupabaseAdmin()
    .from("documents")
    .select("template, form_data")
    .eq("id", docId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!data?.template || !data.form_data) return { ok: false, error: "Ten dokument nie powstał z wzoru." };
  return { ok: true, wzorId: data.template as string, dane: data.form_data as Dane };
}
