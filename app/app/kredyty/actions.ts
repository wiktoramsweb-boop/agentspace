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
export async function przekazDoradcy(d: { clientId: string; advisorId: string; rodzaj: string; kwota: string; propertyId?: string | null; notatka: string }): Promise<Wynik> {
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

  const { data: sprawa, error } = await admin
    .from("credit_cases")
    .insert({
      agency_id: user.agency_id,
      client_id: klient.id,
      property_id: d.propertyId || null,
      referred_by: user.role === "credit_advisor" ? null : user.id,
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
export async function nowaSprawaDoradcy(d: { imie: string; telefon: string; email: string; rodzaj: string; kwota: string; notatka: string; advisorId?: string }): Promise<Wynik> {
  const user = await requireModul("kredyty");
  if (!user.agency_id) return { ok: false, error: "Brak biura." };
  const imie = d.imie.trim().slice(0, 120);
  if (imie.length < 2) return { ok: false, error: "Podaj imię i nazwisko klienta." };
  const admin = createSupabaseAdmin();
  const { data: klient, error } = await admin
    .from("clients")
    .insert({ agency_id: user.agency_id, agent_id: user.id, name: imie, phone: d.telefon.trim() || null, email: d.email.trim() || null, type: "kupujacy", status: "nowy" })
    .select("id")
    .single();
  if (error || !klient) return { ok: false, error: "Nie udało się zapisać klienta." };
  return przekazDoradcy({ clientId: klient.id, advisorId: user.role === "credit_advisor" ? user.id : d.advisorId ?? "", rodzaj: d.rodzaj, kwota: d.kwota, notatka: d.notatka });
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
