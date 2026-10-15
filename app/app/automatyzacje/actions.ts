"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakTabeli, komunikatMigracji } from "@/lib/migracja";
import { zapiszZdarzenie } from "@/lib/dziennik";
import {
  AKCJE,
  SZABLONY_REGUL,
  ZDARZENIA,
  akcjeDlaZdarzenia,
  type Akcja,
  type WarunkiReguly,
  type Zdarzenie,
} from "@/lib/automatyzacje-model";

type Wynik = { ok: true; id?: string } | { ok: false; error: string };

/** Reguły biura ustawia CEO, dyrektor albo menedżer. */
async function wymagajZarzadzania() {
  const user = await requireUser();
  if (!user.agency_id) throw new Error("Konto nie jest przypisane do biura.");
  if (!["owner", "director", "manager"].includes(user.role)) {
    throw new Error("Automatyzacje ustawia CEO, dyrektor albo menedżer.");
  }
  return user;
}

/**
 * Oczyszcza regułę z formularza. Akcje i warunki przychodzą z przeglądarki,
 * więc przepuszczamy tylko znane pola i rozsądne wartości: reguła zapisana
 * z błędem wywracałaby się później przy każdym zdarzeniu.
 */
function oczysc(trigger: string, warunki: WarunkiReguly, akcje: Akcja[]): { trigger: Zdarzenie; warunki: WarunkiReguly; akcje: Akcja[] } | string {
  if (!ZDARZENIA.some((z) => z.id === trigger)) return "Nieznane zdarzenie.";
  const z = trigger as Zdarzenie;
  const dozwolone = akcjeDlaZdarzenia(z);

  const w: WarunkiReguly = {};
  const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 20) : undefined);
  if (lista(warunki.statusNa)?.length) w.statusNa = lista(warunki.statusNa);
  if (lista(warunki.typKlienta)?.length) w.typKlienta = lista(warunki.typKlienta);
  if (lista(warunki.zrodlo)?.length) w.zrodlo = lista(warunki.zrodlo);
  if (lista(warunki.etapNa)?.length) w.etapNa = lista(warunki.etapNa);
  if (lista(warunki.rodzajOferty)?.length) w.rodzajOferty = lista(warunki.rodzajOferty);
  if (warunki.kierunekCeny && ["obnizka", "podwyzka", "dowolna"].includes(warunki.kierunekCeny)) w.kierunekCeny = warunki.kierunekCeny;
  if (Number(warunki.minZmianaProcent) > 0) w.minZmianaProcent = Math.min(90, Number(warunki.minZmianaProcent));
  if (z === "klient_bez_kontaktu" || z === "oferta_bez_prezentacji") {
    const dni = Math.round(Number(warunki.dni));
    if (!(dni >= 1 && dni <= 365)) return "Podaj liczbę dni od 1 do 365.";
    w.dni = dni;
  }

  if (!Array.isArray(akcje) || akcje.length === 0) return "Dodaj co najmniej jedną akcję.";
  if (akcje.length > 6) return "Jedna reguła może mieć najwyżej sześć akcji.";
  const tekst = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const out: Akcja[] = [];
  for (const a of akcje) {
    if (!dozwolone.includes(a.typ)) return `Akcja „${AKCJE.find((x) => x.typ === a.typ)?.nazwa ?? a.typ}" nie pasuje do tego zdarzenia.`;
    switch (a.typ) {
      case "zadanie":
        if (!tekst(a.tytul, 200)) return "Zadanie musi mieć tytuł.";
        out.push({
          typ: "zadanie",
          rodzaj: a.rodzaj === "polaczenie" ? "polaczenie" : "zadanie",
          tytul: tekst(a.tytul, 200),
          opis: tekst(a.opis, 1000) || undefined,
          za_dni: Math.max(0, Math.min(365, Math.round(Number(a.za_dni) || 0))),
          godzina: /^\d{2}:\d{2}$/.test(a.godzina ?? "") ? a.godzina : "09:00",
          priorytet: a.priorytet && ["niski", "normalny", "wysoki"].includes(a.priorytet) ? a.priorytet : "normalny",
          dla: a.dla,
        });
        break;
      case "powiadomienie":
        if (!tekst(a.tytul, 200)) return "Powiadomienie musi mieć tytuł.";
        if (!Array.isArray(a.dla) || !a.dla.length) return "Wybierz, kto ma dostać powiadomienie.";
        out.push({ typ: "powiadomienie", tytul: tekst(a.tytul, 200), tresc: tekst(a.tresc, 600) || undefined, dla: a.dla.slice(0, 6), mail: Boolean(a.mail) });
        break;
      case "przypisz":
        out.push({ typ: "przypisz", osoby: Array.isArray(a.osoby) ? a.osoby.filter((x) => typeof x === "string").slice(0, 50) : [], tylkoBezOpiekuna: a.tylkoBezOpiekuna !== false });
        break;
      case "status_klienta":
        out.push({ typ: "status_klienta", status: tekst(a.status, 40) });
        break;
      case "etap_oferty":
        out.push({ typ: "etap_oferty", etap: tekst(a.etap, 40) });
        break;
      case "mail_do_klienta":
        if (!tekst(a.temat, 200) || !tekst(a.tresc, 5000)) return "Mail do klienta musi mieć temat i treść.";
        out.push({ typ: "mail_do_klienta", temat: tekst(a.temat, 200), tresc: tekst(a.tresc, 5000), wymagajZgody: a.wymagajZgody !== false });
        break;
    }
  }
  return { trigger: z, warunki: w, akcje: out };
}

export async function zapiszRegule(input: {
  id?: string | null;
  nazwa: string;
  trigger: string;
  warunki: WarunkiReguly;
  akcje: Akcja[];
  wlaczona?: boolean;
}): Promise<Wynik> {
  let user;
  try {
    user = await wymagajZarzadzania();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const nazwa = String(input.nazwa ?? "").trim().slice(0, 120);
  if (!nazwa) return { ok: false, error: "Nazwij regułę, żeby zespół wiedział, skąd biorą się zadania." };
  const c = oczysc(input.trigger, input.warunki ?? {}, input.akcje ?? []);
  if (typeof c === "string") return { ok: false, error: c };

  const admin = createSupabaseAdmin();
  const wiersz = {
    agency_id: user.agency_id,
    name: nazwa,
    trigger: c.trigger,
    trigger_config: c.warunki,
    actions: c.akcje,
    enabled: input.wlaczona !== false,
    updated_at: new Date().toISOString(),
  };
  const res = input.id
    ? await admin.from("automation_rules").update(wiersz).eq("id", input.id).eq("agency_id", user.agency_id).select("id").maybeSingle()
    : await admin.from("automation_rules").insert({ ...wiersz, created_by: user.id }).select("id").maybeSingle();
  if (res.error) return { ok: false, error: brakTabeli(res.error) ? komunikatMigracji() : res.error.message };

  await zapiszZdarzenie({
    agencyId: user.agency_id!,
    actorId: user.id,
    akcja: input.id ? "automatyzacja_zmiana" : "automatyzacja_nowa",
    rodzaj: "automatyzacja",
    id: res.data?.id as string,
    opis: `${input.id ? "Zmieniono" : "Dodano"} automatyzację „${nazwa}"`,
  });
  revalidatePath("/app/automatyzacje");
  return { ok: true, id: res.data?.id as string };
}

export async function wlaczSzablon(klucz: string): Promise<Wynik> {
  const s = SZABLONY_REGUL.find((x) => x.klucz === klucz);
  if (!s) return { ok: false, error: "Nie ma takiego szablonu." };
  return zapiszRegule({ nazwa: s.nazwa, trigger: s.trigger, warunki: s.trigger_config, akcje: s.actions });
}

export async function przelaczRegule(id: string, wlaczona: boolean): Promise<Wynik> {
  let user;
  try {
    user = await wymagajZarzadzania();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const { error } = await createSupabaseAdmin()
    .from("automation_rules")
    .update({ enabled: wlaczona, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agency_id", user.agency_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/automatyzacje");
  return { ok: true };
}

export async function usunRegule(id: string): Promise<Wynik> {
  let user;
  try {
    user = await wymagajZarzadzania();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("automation_rules").select("name").eq("id", id).eq("agency_id", user.agency_id).maybeSingle();
  const { error } = await admin.from("automation_rules").delete().eq("id", id).eq("agency_id", user.agency_id);
  if (error) return { ok: false, error: error.message };
  await zapiszZdarzenie({
    agencyId: user.agency_id!,
    actorId: user.id,
    akcja: "automatyzacja_usunieta",
    rodzaj: "automatyzacja",
    id,
    opis: `Usunięto automatyzację „${data?.name ?? ""}"`,
  });
  revalidatePath("/app/automatyzacje");
  return { ok: true };
}
