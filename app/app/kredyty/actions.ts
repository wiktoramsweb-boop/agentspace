"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { wyslijPushDoKlienta } from "@/lib/push";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { powiadom } from "@/lib/powiadomienia";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { zakresDanych } from "@/lib/role";
import { sprawaKredytowa } from "@/lib/data-kredyty";
import { BANKI, bankPoId, STATUSY_WNIOSKU, statusWniosku, type Finanse } from "@/lib/banki";
import { domyslneDokumenty, etapKredytu, ETAPY_KREDYTU, RODZAJE_KREDYTU, type Dokument, type EtapKredytu } from "@/lib/kredyt-etapy";

type Wynik = { ok: true; id?: string } | { ok: false; error: string };

const kwota = (v: unknown): number | null => {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};
const zl = (n: number | null) => (n ? `${n.toLocaleString("pl-PL")} zł` : "");

async function wpis(caseId: string, agencyId: string, autor: string, kind: "etap" | "notatka", text: string) {
  await createSupabaseAdmin().from("credit_case_events").insert({ case_id: caseId, agency_id: agencyId, author_id: autor, kind, text: text.slice(0, 1000) });
}

/**
 * Agent przekazuje klienta doradcy kredytowemu biura. Doradca dostaje
 * powiadomienie, a sprawa startuje z listą dokumentów pod rodzaj kredytu.
 */
export async function przekazDoradcy(d: { clientId: string; advisorId: string; rodzaj: string; kwota: string; propertyId?: string | null; notatka: string; polecilId?: string | null }): Promise<Wynik> {
  const user = await requireModul("kredyty");
  if (!user.agency_id) return { ok: false, error: "Brak biura." };
  const admin = createSupabaseAdmin();

  const { data: klient } = await admin.from("clients").select("id, name, agent_id").eq("id", d.clientId).eq("agency_id", user.agency_id).maybeSingle();
  if (!klient) return { ok: false, error: "Nie ma takiego klienta." };
  if (zakresDanych(user) === "wlasne" && klient.agent_id !== user.id && user.role !== "credit_advisor") return { ok: false, error: "To nie Twój klient." };

  const { data: doradca } = await admin.from("profiles").select("id, full_name").eq("id", d.advisorId).eq("agency_id", user.agency_id).eq("role", "credit_advisor").maybeSingle();
  if (!doradca) return { ok: false, error: "Wybierz doradcę kredytowego z zespołu." };
  if (d.propertyId) {
    const { data: n } = await admin.from("properties").select("id").eq("id", d.propertyId).eq("agency_id", user.agency_id).maybeSingle();
    if (!n) return { ok: false, error: "Nie ma takiej nieruchomości." };
  }
  const rodzaj = RODZAJE_KREDYTU.some((r) => r.id === d.rodzaj) ? d.rodzaj : "hipoteczny";
  const suma = kwota(d.kwota);
  // Polecający wskazany przez doradcę musi być z tego biura.
  let polecil: { id: string; full_name: string | null } | null = null;
  if (d.polecilId) {
    const { data: p } = await admin.from("profiles").select("id, full_name").eq("id", d.polecilId).eq("agency_id", user.agency_id).maybeSingle();
    polecil = p;
  }

  const { data: sprawa, error } = await admin
    .from("credit_cases")
    .insert({
      agency_id: user.agency_id,
      client_id: klient.id,
      property_id: d.propertyId || null,
      referred_by: polecil?.id ?? (user.role === "credit_advisor" ? null : user.id),
      advisor_id: doradca.id,
      stage: "nowe",
      rodzaj,
      amount_pln: suma,
      note: d.notatka.trim().slice(0, 1000) || null,
      documents: domyslneDokumenty(rodzaj),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !sprawa) {
    return { ok: false, error: /credit_cases/.test(error?.message ?? "") ? "Uruchom w Supabase lib/SETUP-v53-doradca-kredytowy.sql." : "Nie udało się przekazać klienta." };
  }

  await wpis(sprawa.id, user.agency_id, user.id, "etap", `${user.full_name ?? "Agent"} przekazał(a) klienta doradcy${d.notatka.trim() ? `: ${d.notatka.trim()}` : "."}`);
  if (polecil && polecil.id !== user.id) {
    await powiadom(user.agency_id, [polecil.id], { rodzaj: "kredyt", tytul: `Twój klient jest u doradcy: ${klient.name}`, tresc: "Widzisz postęp kredytu w module Kredyty.", adres: `/app/kredyty/${sprawa.id}` });
  }
  if (doradca.id !== user.id) {
    await powiadom(user.agency_id, [doradca.id], {
      rodzaj: "kredyt",
      tytul: `Nowy klient do kredytu: ${klient.name}`,
      tresc: [`Od: ${user.full_name ?? "agent"}`, zl(suma), d.notatka.trim()].filter(Boolean).join(" · "),
      adres: `/app/kredyty/${sprawa.id}`,
      pilne: true,
    });
  }
  await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "kredyt_przekazany", rodzaj: "klient", id: klient.id, opis: `Klient ${klient.name} przekazany doradcy ${doradca.full_name ?? ""}` });

  revalidatePath("/app/kredyty");
  revalidatePath(`/app/klienci/${klient.id}`);
  return { ok: true, id: sprawa.id };
}

/** Doradca zakłada sprawę dla własnego klienta (spoza poleceń biura). */
export async function nowaSprawaDoradcy(d: { imie: string; telefon: string; email: string; rodzaj: string; kwota: string; notatka: string; advisorId?: string; polecilId?: string }): Promise<Wynik> {
  const user = await requireModul("kredyty");
  if (!user.agency_id) return { ok: false, error: "Brak biura." };
  const imie = d.imie.trim().slice(0, 120);
  if (imie.length < 2) return { ok: false, error: "Podaj imię i nazwisko klienta." };
  const admin = createSupabaseAdmin();
  // Klient polecony zostaje u agenta, który go polecił: tak samo jak po przekazaniu z karty.
  const { data: opiekun } = d.polecilId ? await admin.from("profiles").select("id").eq("id", d.polecilId).eq("agency_id", user.agency_id).maybeSingle() : { data: null };
  const { data: klient, error } = await admin
    .from("clients")
    .insert({ agency_id: user.agency_id, agent_id: opiekun?.id ?? user.id, name: imie, phone: d.telefon.trim() || null, email: d.email.trim() || null, type: "kupujacy", status: "nowy" })
    .select("id")
    .single();
  if (error || !klient) return { ok: false, error: "Nie udało się zapisać klienta." };
  return przekazDoradcy({ clientId: klient.id, advisorId: user.role === "credit_advisor" ? user.id : d.advisorId ?? "", rodzaj: d.rodzaj, kwota: d.kwota, notatka: d.notatka, polecilId: opiekun?.id ?? null });
}

async function dostep(id: string) {
  const user = await requireModul("kredyty");
  const s = await sprawaKredytowa(user, id);
  return s ? { user, s: s.sprawa } : null;
}

/** Zmiana etapu. Druga strona (agent albo doradca) dostaje powiadomienie. */
export async function zmienEtap(id: string, etap: EtapKredytu): Promise<Wynik> {
  const d = await dostep(id);
  if (!d || !ETAPY_KREDYTU.some((e) => e.id === etap)) return { ok: false, error: "Brak dostępu." };
  const { user, s } = d;
  const teraz = new Date().toISOString();
  await createSupabaseAdmin()
    .from("credit_cases")
    .update({ stage: etap, updated_at: teraz, ...(etap === "decyzja" ? { decision_at: teraz } : {}), ...(etap === "umowa" ? { signed_at: teraz } : {}) })
    .eq("id", id)
    .eq("agency_id", user.agency_id!);
  const nazwa = etapKredytu(etap).nazwa;
  await wpis(id, user.agency_id!, user.id, "etap", `Etap: ${nazwa}`);
  const odbiorcy = [s.polecajacy?.id, s.doradca?.id, s.client.agent_id].filter((x): x is string => Boolean(x) && x !== user.id);
  await powiadom(user.agency_id!, odbiorcy, {
    rodzaj: "kredyt",
    tytul: `Kredyt ${s.client.name}: ${nazwa}`,
    tresc: etap === "decyzja" ? "Bank wydał pozytywną decyzję. Można planować umowę przyrzeczoną." : etap === "odrzucone" ? "Sprawa kredytowa zamknięta bez kredytu. Sprawdź, czy transakcja jest zagrożona." : null,
    adres: `/app/kredyty/${id}`,
    pilne: etap === "decyzja" || etap === "odrzucone" || etap === "umowa",
  });
  // Klient z portalem dostaje krótką informację, bez kwot i nazw banków.
  if (etap !== "odrzucone") {
    const agencyId = user.agency_id!;
    after(async () => {
      const { data: dostepy } = await createSupabaseAdmin().from("client_portal_access").select("id, token").eq("agency_id", agencyId).eq("client_id", s.client.id).is("revoked_at", null);
      for (const dd of (dostepy ?? []) as { id: string; token: string }[]) {
        await wyslijPushDoKlienta(dd.id, { title: "Twój kredyt", body: etapKredytu(etap).dlaKlienta, url: `/klient/${dd.token}`, tag: `kredyt-${id}`, icon: `/klient/${dd.token}/ikona?r=192` });
      }
    });
  }

  revalidatePath("/app/kredyty");
  revalidatePath(`/app/kredyty/${id}`);
  revalidatePath(`/app/klienci/${s.client.id}`);
  return { ok: true };
}

export async function zapiszDaneSprawy(id: string, f: { rodzaj: string; kwota: string; bank: string; prowizja: string; zaPolecenie: string; notatka: string }): Promise<Wynik> {
  const d = await dostep(id);
  if (!d) return { ok: false, error: "Brak dostępu." };
  await createSupabaseAdmin()
    .from("credit_cases")
    .update({
      rodzaj: RODZAJE_KREDYTU.some((r) => r.id === f.rodzaj) ? f.rodzaj : d.s.rodzaj,
      amount_pln: kwota(f.kwota),
      bank: f.bank.trim().slice(0, 80) || null,
      bank_commission_pln: kwota(f.prowizja),
      referral_fee_pln: kwota(f.zaPolecenie),
      note: f.notatka.trim().slice(0, 1000) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("agency_id", d.user.agency_id!);
  revalidatePath(`/app/kredyty/${id}`);
  revalidatePath("/app/kredyty");
  return { ok: true };
}

export async function zapiszDokumenty(id: string, dokumenty: Dokument[]): Promise<Wynik> {
  const d = await dostep(id);
  if (!d) return { ok: false, error: "Brak dostępu." };
  const czyste = dokumenty
    .filter((x) => x && typeof x.nazwa === "string" && x.nazwa.trim())
    .slice(0, 40)
    .map((x) => ({ nazwa: x.nazwa.trim().slice(0, 120), jest: Boolean(x.jest) }));
  await createSupabaseAdmin().from("credit_cases").update({ documents: czyste, updated_at: new Date().toISOString() }).eq("id", id).eq("agency_id", d.user.agency_id!);
  revalidatePath(`/app/kredyty/${id}`);
  return { ok: true };
}

export async function dodajNotatke(id: string, tekst: string): Promise<Wynik> {
  const d = await dostep(id);
  const t = tekst.trim();
  if (!d) return { ok: false, error: "Brak dostępu." };
  if (t.length < 2) return { ok: false, error: "Napisz notatkę." };
  await wpis(id, d.user.agency_id!, d.user.id, "notatka", t);
  await createSupabaseAdmin().from("credit_cases").update({ updated_at: new Date().toISOString() }).eq("id", id);
  const odbiorcy = [d.s.polecajacy?.id, d.s.doradca?.id].filter((x): x is string => Boolean(x) && x !== d.user.id);
  await powiadom(d.user.agency_id!, odbiorcy, { rodzaj: "kredyt", tytul: `Notatka w kredycie: ${d.s.client.name}`, tresc: t.slice(0, 140), adres: `/app/kredyty/${id}` });
  revalidatePath(`/app/kredyty/${id}`);
  return { ok: true };
}

const BRAK_V59 = "Uruchom w Supabase lib/SETUP-v59-kredyty-cele.sql.";
const liczbaDz = (v: unknown): number | null => {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Nowy wniosek: klik w bank. Ten sam bank drugi raz nie wchodzi. */
export async function dodajWniosek(id: string, bank: string): Promise<Wynik> {
  const d = await dostep(id);
  if (!d) return { ok: false, error: "Brak dostępu." };
  if (!BANKI.some((b) => b.id === bank)) return { ok: false, error: "Nieznany bank." };
  const { error } = await createSupabaseAdmin().from("credit_applications").insert({ case_id: id, agency_id: d.user.agency_id, bank, amount_pln: d.s.amount_pln, created_by: d.user.id });
  if (error) return { ok: false, error: error.code === "23505" ? "Ten bank jest już na liście." : BRAK_V59 };
  await wpis(id, d.user.agency_id!, d.user.id, "etap", `Dodano bank: ${bankPoId(bank).nazwa}`);
  if (d.s.stage === "nowe") await zmienEtap(id, "analiza");
  revalidatePath(`/app/kredyty/${id}`);
  return { ok: true };
}

export async function zmienWniosek(
  id: string,
  wniosekId: string,
  f: { status?: string; kwota?: string; marza?: string; oprocentowanie?: string; rata?: string; prowizja?: string; notatka?: string },
): Promise<Wynik> {
  const d = await dostep(id);
  if (!d) return { ok: false, error: "Brak dostępu." };
  const admin = createSupabaseAdmin();
  const { data: byl } = await admin.from("credit_applications").select("bank, status").eq("id", wniosekId).eq("case_id", id).maybeSingle();
  if (!byl) return { ok: false, error: "Nie ma takiego wniosku." };
  const teraz = new Date().toISOString();
  const zmiana: Record<string, unknown> = { updated_at: teraz };
  if (f.kwota !== undefined) zmiana.amount_pln = liczbaDz(f.kwota);
  if (f.marza !== undefined) zmiana.margin_pct = liczbaDz(f.marza);
  if (f.oprocentowanie !== undefined) zmiana.rate_pct = liczbaDz(f.oprocentowanie);
  if (f.rata !== undefined) zmiana.installment_pln = liczbaDz(f.rata);
  if (f.prowizja !== undefined) zmiana.commission_pln = liczbaDz(f.prowizja);
  if (f.notatka !== undefined) zmiana.note = f.notatka.trim().slice(0, 500) || null;
  const nowy = f.status && STATUSY_WNIOSKU.some((s) => s.id === f.status) ? f.status : null;
  if (nowy) {
    zmiana.status = nowy;
    if (nowy === "zlozony") zmiana.submitted_at = teraz;
    if (nowy === "pozytywna" || nowy === "negatywna") zmiana.decided_at = teraz;
  }
  const { error } = await admin.from("credit_applications").update(zmiana).eq("id", wniosekId).eq("case_id", id);
  if (error) return { ok: false, error: BRAK_V59 };
  if (nowy && nowy !== byl.status) {
    await wpis(id, d.user.agency_id!, d.user.id, "etap", `${bankPoId(byl.bank).nazwa}: ${statusWniosku(nowy).nazwa}`);
    // Etap sprawy idzie za wnioskami, żeby doradca nie klikał tego samego dwa razy.
    const wczesniej = ["nowe", "analiza", "dokumenty"].includes(d.s.stage);
    if (nowy === "pozytywna" && d.s.stage !== "umowa") await zmienEtap(id, "decyzja");
    else if (["zlozony", "analiza", "dosylka"].includes(nowy) && wczesniej) await zmienEtap(id, "wniosek");
    await admin.from("credit_cases").update({ updated_at: teraz, bank: nowy === "pozytywna" ? bankPoId(byl.bank).nazwa : d.s.bank }).eq("id", id);
  }
  revalidatePath(`/app/kredyty/${id}`);
  return { ok: true };
}

export async function usunWniosek(id: string, wniosekId: string): Promise<Wynik> {
  const d = await dostep(id);
  if (!d) return { ok: false, error: "Brak dostępu." };
  await createSupabaseAdmin().from("credit_applications").delete().eq("id", wniosekId).eq("case_id", id);
  revalidatePath(`/app/kredyty/${id}`);
  return { ok: true };
}

export async function zapiszFinanse(id: string, f: Record<keyof Finanse, string>): Promise<Wynik> {
  const d = await dostep(id);
  if (!d) return { ok: false, error: "Brak dostępu." };
  const finanse = Object.fromEntries((["cena", "wklad", "dochod", "zobowiazania", "lat", "oprocentowanie"] as const).map((k) => [k, liczbaDz(f[k])]));
  const { error } = await createSupabaseAdmin().from("credit_cases").update({ finanse, updated_at: new Date().toISOString() }).eq("id", id).eq("agency_id", d.user.agency_id!);
  if (error) return { ok: false, error: BRAK_V59 };
  revalidatePath(`/app/kredyty/${id}`);
  return { ok: true };
}

export async function zapiszKrok(id: string, krok: string, data: string): Promise<Wynik> {
  const d = await dostep(id);
  if (!d) return { ok: false, error: "Brak dostępu." };
  const { error } = await createSupabaseAdmin()
    .from("credit_cases")
    .update({ next_step: krok.trim().slice(0, 200) || null, next_step_at: /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agency_id", d.user.agency_id!);
  if (error) return { ok: false, error: BRAK_V59 };
  revalidatePath(`/app/kredyty/${id}`);
  return { ok: true };
}
