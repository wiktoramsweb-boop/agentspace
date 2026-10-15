"use server";

import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakTabeli, komunikatMigracji } from "@/lib/migracja";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { brutto, KATEGORIE_KOSZTOW } from "@/lib/koszty-model";
import { todayPL } from "@/lib/datetime";

type Wynik = { ok: true } | { ok: false; error: string };

const KAT = new Set(KATEGORIE_KOSZTOW.map((k) => k.v));
const tekst = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max);
const kwota = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};
const stawka = (v: FormDataEntryValue | null): number | null => {
  const s = String(v ?? "");
  return s === "zw" || s === "" ? null : Number.isFinite(Number(s)) ? Number(s) : null;
};

function blad(error: { message?: string } | null): Wynik {
  if (!error) return { ok: true };
  return { ok: false, error: brakTabeli(error) ? komunikatMigracji() : "Nie udało się zapisać." };
}

/** Pola wspólne kosztu i stałego kosztu. Kwotę można podać netto albo brutto. */
function polaKosztu(f: FormData): { ok: false; error: string } | { ok: true; v: Record<string, unknown> } {
  const name = tekst(f.get("name"));
  if (!name) return { ok: false, error: "Wpisz, za co jest koszt." };
  const vat = stawka(f.get("vat"));
  const ile = kwota(f.get("amount"));
  if (!(ile > 0) || ile > 10_000_000) return { ok: false, error: "Podaj kwotę." };
  const jakBrutto = f.get("mode") === "brutto";
  const net = jakBrutto ? Math.round((ile / (1 + (vat ?? 0) / 100)) * 100) / 100 : ile;
  const category = tekst(f.get("category"), 40);
  return {
    ok: true,
    v: {
      name,
      vendor: tekst(f.get("vendor")) || null,
      category: KAT.has(category) ? category : "inne",
      net_pln: net,
      vat_rate: vat,
      gross_pln: jakBrutto ? ile : brutto(net, vat),
    },
  };
}

export async function dodajKoszt(f: FormData): Promise<Wynik> {
  const user = await requireModul("faktury");
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const p = polaKosztu(f);
  if (!p.ok) return p;
  const data = tekst(f.get("cost_date"), 10);
  const paid = f.get("paid") === "on";
  const { error } = await createSupabaseAdmin()
    .from("agency_costs")
    .insert({
      ...p.v,
      agency_id: user.agency_id,
      invoice_no: tekst(f.get("invoice_no"), 80) || null,
      cost_date: /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : todayPL(),
      paid,
      paid_at: paid ? todayPL() : null,
      note: tekst(f.get("note"), 500) || null,
      created_by: user.id,
    });
  if (!error) {
    await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "koszt_dodany", rodzaj: "koszt", opis: `Dodano koszt: ${p.v.name} (${p.v.gross_pln} zł brutto)` });
    revalidatePath("/app/finanse");
  }
  return blad(error);
}

export async function oplacKoszt(id: string, oplacony: boolean): Promise<Wynik> {
  const user = await requireModul("faktury");
  const { error } = await createSupabaseAdmin()
    .from("agency_costs")
    .update({ paid: oplacony, paid_at: oplacony ? todayPL() : null })
    .eq("id", id)
    .eq("agency_id", user.agency_id);
  revalidatePath("/app/finanse");
  return blad(error);
}

export async function usunKoszt(id: string): Promise<Wynik> {
  const user = await requireModul("faktury");
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("agency_costs").select("name, gross_pln").eq("id", id).eq("agency_id", user.agency_id).maybeSingle();
  if (!data) return { ok: false, error: "Nie znaleziono kosztu." };
  const { error } = await admin.from("agency_costs").delete().eq("id", id).eq("agency_id", user.agency_id);
  if (!error && user.agency_id) {
    await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "koszt_usuniety", rodzaj: "koszt", opis: `Usunięto koszt: ${data.name} (${data.gross_pln} zł brutto)` });
  }
  revalidatePath("/app/finanse");
  return blad(error);
}

export async function dodajStalyKoszt(f: FormData): Promise<Wynik> {
  const user = await requireModul("faktury");
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const p = polaKosztu(f);
  if (!p.ok) return p;
  const dzien = Math.round(Number(f.get("day_of_month")));
  const { error } = await createSupabaseAdmin()
    .from("agency_cost_schedules")
    .insert({ ...p.v, agency_id: user.agency_id, day_of_month: dzien >= 1 && dzien <= 28 ? dzien : 1, created_by: user.id });
  revalidatePath("/app/finanse");
  return blad(error);
}

export async function przelaczStalyKoszt(id: string, aktywny: boolean): Promise<Wynik> {
  const user = await requireModul("faktury");
  const { error } = await createSupabaseAdmin()
    .from("agency_cost_schedules")
    .update({ active: aktywny })
    .eq("id", id)
    .eq("agency_id", user.agency_id);
  revalidatePath("/app/finanse");
  return blad(error);
}

export async function usunStalyKoszt(id: string): Promise<Wynik> {
  const user = await requireModul("faktury");
  // Wygenerowane wcześniej koszty zostają (schedule_id → null), bo to już
  // zaksięgowana historia, a nie część harmonogramu.
  const { error } = await createSupabaseAdmin()
    .from("agency_cost_schedules")
    .delete()
    .eq("id", id)
    .eq("agency_id", user.agency_id);
  revalidatePath("/app/finanse");
  return blad(error);
}

/** Wypłata prowizji agentowi. `kwota` null cofa oznaczenie. */
export async function oznaczWyplate(dealId: string, kwotaWyplaty: number | null): Promise<Wynik> {
  const user = await requireModul("faktury");
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (kwotaWyplaty != null && !(kwotaWyplaty >= 0 && kwotaWyplaty < 10_000_000)) return { ok: false, error: "Nieprawidłowa kwota." };
  const admin = createSupabaseAdmin();
  const { data: deal } = await admin.from("deals").select("id, title").eq("id", dealId).eq("agency_id", user.agency_id).maybeSingle();
  if (!deal) return { ok: false, error: "Nie znaleziono transakcji." };
  const { error } = await admin
    .from("deals")
    .update(kwotaWyplaty == null ? { agent_paid_at: null, agent_paid_pln: null } : { agent_paid_at: new Date().toISOString(), agent_paid_pln: kwotaWyplaty })
    .eq("id", dealId)
    .eq("agency_id", user.agency_id);
  if (!error) {
    await zapiszZdarzenie({
      agencyId: user.agency_id,
      actorId: user.id,
      akcja: kwotaWyplaty == null ? "wyplata_cofnieta" : "wyplata_prowizji",
      rodzaj: "transakcja",
      id: dealId,
      opis: kwotaWyplaty == null ? `Cofnięto wypłatę prowizji: ${deal.title}` : `Wypłacono prowizję ${kwotaWyplaty} zł: ${deal.title}`,
    });
  }
  revalidatePath("/app/finanse");
  return blad(error);
}
