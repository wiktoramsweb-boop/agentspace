"use server";

import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { postepTeorii } from "@/lib/data-teoria";
import { ITEM_BLEDOW, TESTY, itemRozdzialu, itemTestu, maTeorie, nowaListaBledow, ocenTeorie, pytanieTeorii, rozdzialTeorii, type ZakresTestu } from "@/lib/techniki/teoria";

type Wynik<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const BRAK = "Teoria wymaga migracji lib/SETUP-v56-akademia.sql w Supabase.";
const ZAKRESY: ZakresTestu[] = ["m1", "m2", "m3", "egzamin", "bledy"];

async function osoba() {
  const user = await requireModul("coach");
  if (!maTeorie(user.agency_id)) throw new Error("Teoria jest dostępna tylko w Spectrze.");
  return user as typeof user & { agency_id: string };
}

export async function oznaczRozdzial(id: string, przeczytany = true): Promise<Wynik> {
  const user = await osoba().catch((e: Error) => e);
  if (user instanceof Error) return { ok: false, error: user.message };
  if (!rozdzialTeorii(id)) return { ok: false, error: "Nie ma takiego rozdziału." };
  const teraz = new Date().toISOString();
  const { error } = await createSupabaseAdmin()
    .from("academy_progress")
    .upsert(
      { agency_id: user.agency_id, profile_id: user.id, item: itemRozdzialu(id), kind: "lekcja", passed: przeczytany, passed_at: przeczytany ? teraz : null, updated_at: teraz },
      { onConflict: "profile_id,item" },
    );
  if (error) return { ok: false, error: /academy_progress/.test(error.message) ? BRAK : error.message };
  revalidatePath("/app/techniki");
  return { ok: true };
}

/** Odpowiedź na jedno pytanie w teście modułu: poprawna dopiero po wyborze. */
export async function sprawdzPytanie(id: string, wybrana: number): Promise<Wynik<{ dobrze: boolean; poprawna: number; wyjasnienie: string }>> {
  const user = await osoba().catch((e: Error) => e);
  if (user instanceof Error) return { ok: false, error: user.message };
  const q = pytanieTeorii(id);
  if (!q) return { ok: false, error: "Nie ma takiego pytania." };
  return { ok: true, dobrze: wybrana === q.poprawna, poprawna: q.poprawna, wyjasnienie: q.wyjasnienie };
}

export type Omowienie = { id: string; poprawna: number; wyjasnienie: string; dobrze: boolean };

/**
 * Oddanie testu. Zapisuje najlepszy i ostatni wynik oraz listę pytań do
 * powtórki: dochodzą nowe błędy, a znikają pytania, na które padła dobra odpowiedź.
 */
export async function oddajTest(zakres: ZakresTestu, odpowiedzi: { id: string; wybrana: number }[]): Promise<Wynik<{ wynik: number; max: number; zaliczony: boolean; omowienie: Omowienie[]; doPowtorki: number }>> {
  const user = await osoba().catch((e: Error) => e);
  if (user instanceof Error) return { ok: false, error: user.message };
  if (!ZAKRESY.includes(zakres)) return { ok: false, error: "Nie ma takiego testu." };
  if (!Array.isArray(odpowiedzi) || !odpowiedzi.length || odpowiedzi.length > 60) return { ok: false, error: "Brak odpowiedzi." };
  const czyste = odpowiedzi.map((o) => ({ id: String(o.id), wybrana: Number(o.wybrana) })).filter((o) => pytanieTeorii(o.id));

  const postep = await postepTeorii(user.agency_id, user.id);
  if (!postep.ready) return { ok: false, error: BRAK };
  const o = ocenTeorie(czyste);
  const prog = zakres === "bledy" ? o.max : Math.round((TESTY[zakres].prog / TESTY[zakres].ile) * o.max);
  const zaliczony = o.wynik >= prog;
  const bledy = nowaListaBledow(postep.bledy, o.bledne, o.dobre);
  const teraz = new Date().toISOString();
  const admin = createSupabaseAdmin();

  const wiersze: Record<string, unknown>[] = [{ agency_id: user.agency_id, profile_id: user.id, item: ITEM_BLEDOW, kind: "teoria", passed: bledy.length === 0, last_answers: bledy, updated_at: teraz }];
  if (zakres !== "bledy") {
    const byl = postep.testy[itemTestu(zakres)];
    wiersze.push({
      agency_id: user.agency_id,
      profile_id: user.id,
      item: itemTestu(zakres),
      kind: "sprawdzian",
      passed: Boolean(byl?.zaliczony) || zaliczony,
      best_score: Math.max(byl?.najlepszy ?? 0, o.wynik),
      last_score: o.wynik,
      max_score: o.max,
      attempts: (byl?.podejscia ?? 0) + 1,
      last_answers: o.bledne,
      ...(zaliczony && !byl?.zaliczony ? { passed_at: teraz } : {}),
      updated_at: teraz,
    });
  }
  // Osobno, bo wiersze mają różne kolumny: wspólny upsert wstawiłby null w brakujące.
  for (const w of wiersze) {
    const { error } = await admin.from("academy_progress").upsert(w, { onConflict: "profile_id,item" });
    if (error) return { ok: false, error: /academy_progress/.test(error.message) ? BRAK : error.message };
  }
  revalidatePath("/app/techniki");

  const omowienie = czyste.map((x) => {
    const q = pytanieTeorii(x.id)!;
    return { id: q.id, poprawna: q.poprawna, wyjasnienie: q.wyjasnienie, dobrze: x.wybrana === q.poprawna };
  });
  return { ok: true, wynik: o.wynik, max: o.max, zaliczony, omowienie, doPowtorki: bledy.length };
}
