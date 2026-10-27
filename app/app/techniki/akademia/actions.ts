"use server";

import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { naProbie } from "@/lib/proba";
import { postepAkademii } from "@/lib/data-akademia";
import { ocen, sprawdzian, stanAkademii, WSZYSTKIE_LEKCJE } from "@/lib/techniki/akademia";

type Wynik<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const BRAK = "Akademia wymaga migracji lib/SETUP-v56-akademia.sql w Supabase.";

async function osoba() {
  const user = await requireModul("coach");
  if (!user.agency_id) throw new Error("Brak biura.");
  if (naProbie(user).naProbie) throw new Error("Akademia jest dla klientów abonamentowych.");
  return user as typeof user & { agency_id: string };
}

/** Lekcja przerobiona (albo cofnięcie oznaczenia). Tylko w otwartym module. */
export async function oznaczLekcje(lekcjaId: string, zrobiona = true): Promise<Wynik> {
  const user = await osoba().catch((e: Error) => e);
  if (user instanceof Error) return { ok: false, error: user.message };
  if (!WSZYSTKIE_LEKCJE.some((l) => l.id === lekcjaId)) return { ok: false, error: "Nie ma takiej lekcji." };
  const { ready, wpisy } = await postepAkademii(user.agency_id, user.id);
  if (!ready) return { ok: false, error: BRAK };
  const modul = stanAkademii(wpisy).moduly.find((m) => m.lekcje.some((l) => l.id === lekcjaId));
  if (!modul?.otwarty) return { ok: false, error: "Ten moduł otworzy się po zaliczeniu poprzedniego sprawdzianu." };

  const { error } = await createSupabaseAdmin()
    .from("academy_progress")
    .upsert(
      { agency_id: user.agency_id, profile_id: user.id, item: lekcjaId, kind: "lekcja", passed: zrobiona, passed_at: zrobiona ? new Date().toISOString() : null, updated_at: new Date().toISOString() },
      { onConflict: "profile_id,item" },
    );
  if (error) return { ok: false, error: /academy_progress/.test(error.message) ? BRAK : error.message };
  revalidatePath("/app/techniki");
  return { ok: true };
}

/**
 * Sprawdzenie jednej odpowiedzi w trakcie sprawdzianu. Poprawna odpowiedź
 * nie trafia do przeglądarki z góry, tylko po wybraniu, razem z wyjaśnieniem.
 */
export async function sprawdzOdpowiedz(sprId: string, nr: number, wybrana: number): Promise<Wynik<{ dobrze: boolean; poprawna: number; wyjasnienie: string; technika: string | null }>> {
  const user = await osoba().catch((e: Error) => e);
  if (user instanceof Error) return { ok: false, error: user.message };
  const p = sprawdzian(sprId)?.pytania[nr];
  if (!p) return { ok: false, error: "Nie ma takiego pytania." };
  return { ok: true, dobrze: wybrana === p.poprawna, poprawna: p.poprawna, wyjasnienie: p.wyjasnienie, technika: p.technika ?? null };
}

/** Oddanie sprawdzianu: ocena na serwerze, zapis najlepszego wyniku i podejścia. */
export async function oddajSprawdzian(sprId: string, odpowiedzi: number[]): Promise<Wynik<{ wynik: number; max: number; zaliczony: boolean; pierwszyRaz: boolean; bledne: number[] }>> {
  const user = await osoba().catch((e: Error) => e);
  if (user instanceof Error) return { ok: false, error: user.message };
  const s = sprawdzian(sprId);
  if (!s) return { ok: false, error: "Nie ma takiego sprawdzianu." };
  if (!Array.isArray(odpowiedzi) || odpowiedzi.length !== s.pytania.length) return { ok: false, error: "Odpowiedz na wszystkie pytania." };
  const { ready, wpisy } = await postepAkademii(user.agency_id, user.id);
  if (!ready) return { ok: false, error: BRAK };
  const stan = stanAkademii(wpisy);
  const dostepny = [...stan.moduly.map((m) => m.sprawdzian), stan.egzamin].find((x) => x.id === sprId)?.dostepny;
  if (!dostepny) return { ok: false, error: "Ten sprawdzian otworzy się po przerobieniu lekcji z modułu." };

  const o = ocen(s, odpowiedzi.map((x) => Number(x)));
  const byl = wpisy.find((w) => w.item === sprId);
  const pierwszyRaz = o.zaliczony && !byl?.passed;
  const teraz = new Date().toISOString();
  const { error } = await createSupabaseAdmin()
    .from("academy_progress")
    .upsert(
      {
        agency_id: user.agency_id,
        profile_id: user.id,
        item: sprId,
        kind: "sprawdzian",
        passed: Boolean(byl?.passed) || o.zaliczony,
        best_score: Math.max(byl?.best ?? 0, o.wynik),
        last_score: o.wynik,
        max_score: s.pytania.length,
        attempts: (byl?.attempts ?? 0) + 1,
        last_answers: odpowiedzi,
        ...(pierwszyRaz ? { passed_at: teraz } : {}),
        updated_at: teraz,
      },
      { onConflict: "profile_id,item" },
    );
  if (error) return { ok: false, error: /academy_progress/.test(error.message) ? BRAK : error.message };
  revalidatePath("/app/techniki");
  return { ok: true, wynik: o.wynik, max: s.pytania.length, zaliczony: o.zaliczony, pierwszyRaz, bledne: o.bledne };
}
