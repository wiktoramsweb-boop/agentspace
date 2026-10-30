import { createSupabaseAdmin } from "./supabase/admin";
import { osobyWZakresie } from "./szkolenie-zakres";
import type { ProfileWithAgency } from "./types";

/** Historia treningów: własna albo zespołu, zależnie od zakresu danych osoby. */

export type FiltrySesji = { osoba: string; scenariusz: string; wynik: string; stan: string; okres: string };

export type WierszSesji = {
  id: string;
  osoba: { id: string; name: string; avatar: string | null };
  tytul: string;
  klient: string | null;
  data: string;
  ukonczona: boolean;
  wynik: number | null;
};

const ZAKRES_WYNIKU: Record<string, [number, number]> = { slabe: [1, 4], srednie: [5, 7], dobre: [8, 10] };

export async function historiaSesji(user: ProfileWithAgency, f: FiltrySesji) {
  const admin = createSupabaseAdmin();
  const osoby = await osobyWZakresie(user);
  const ids = osoby.map((o) => o.id);
  const wybrane = f.osoba && ids.includes(f.osoba) ? [f.osoba] : ids;

  let q = admin.from("training_sessions").select("id, agent_id, scenario_title, personality, status, started_at, score:session_scores(overall)").in("agent_id", wybrane).order("started_at", { ascending: false }).limit(500);
  if (f.scenariusz) q = q.eq("scenario_title", f.scenariusz);
  if (f.stan === "ukonczone") q = q.eq("status", "completed");
  if (f.stan === "niedokonczone") q = q.eq("status", "in_progress");
  const dni = Number(f.okres);
  if (dni > 0) q = q.gte("started_at", new Date(Date.now() - dni * 86_400_000).toISOString());
  const { data } = await q;

  const mapa = new Map(osoby.map((o) => [o.id, o]));
  let wiersze: WierszSesji[] = ((data ?? []) as unknown as { id: string; agent_id: string; scenario_title: string | null; personality: string | null; status: string; started_at: string; score: { overall: number | null } | { overall: number | null }[] | null }[]).map((s) => {
    const ocena = Array.isArray(s.score) ? s.score[0] : s.score;
    const o = mapa.get(s.agent_id);
    return { id: s.id, osoba: { id: s.agent_id, name: o?.name ?? "Osoba", avatar: o?.avatar ?? null }, tytul: s.scenario_title ?? "Sesja treningowa", klient: s.personality, data: s.started_at, ukonczona: s.status === "completed", wynik: ocena?.overall ?? null };
  });
  const zakres = ZAKRES_WYNIKU[f.wynik];
  if (zakres) wiersze = wiersze.filter((w) => w.wynik != null && w.wynik >= zakres[0] && w.wynik <= zakres[1]);

  const oceny = wiersze.map((w) => w.wynik).filter((x): x is number => x != null);
  const statystyki = {
    sesje: wiersze.length,
    srednia: oceny.length ? Math.round((oceny.reduce((a, b) => a + b, 0) / oceny.length) * 10) / 10 : null,
    najlepsza: oceny.length ? Math.max(...oceny) : null,
    osoby: new Set(wiersze.map((w) => w.osoba.id)).size,
  };

  // Lista scenariuszy do filtra: z całego zakresu, nie z bieżącego wyniku.
  const { data: tytuly } = await admin.from("training_sessions").select("scenario_title").in("agent_id", ids).order("started_at", { ascending: false }).limit(1000);
  const scenariusze = [...new Set(((tytuly ?? []) as { scenario_title: string | null }[]).map((t) => t.scenario_title).filter((t): t is string => Boolean(t)))].sort((a, b) => a.localeCompare(b, "pl"));

  return { wiersze, statystyki, scenariusze, osoby: osoby.map((o) => ({ id: o.id, name: o.name })), zespol: ids.length > 1 };
}
