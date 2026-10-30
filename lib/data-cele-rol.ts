import { createSupabaseAdmin } from "./supabase/admin";
import { celeStanowiska, tempo, type CeleStanowiska, type Miernik } from "./cele-rol";
import { poczatekMiesiacaPL } from "./kredyty";
import { todayPL } from "./datetime";
import type { ProfileWithAgency } from "./types";

export type WynikMiernika = Miernik & { cel: number; teraz: number; procent: number; zaPlanem: boolean };
export type WidokCelow = Omit<CeleStanowiska, "mierniki"> & { mierniki: WynikMiernika[]; dzien: number; dniWMiesiacu: number };

const ile = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

async function wartosci(user: ProfileWithAgency, od: string): Promise<Record<string, number>> {
  const admin = createSupabaseAdmin();
  const a = user.agency_id ?? "";
  if (user.role === "credit_advisor") {
    const { data: sprawy } = await admin.from("credit_cases").select("id, amount_pln, bank_commission_pln, signed_at").eq("advisor_id", user.id);
    const lista = (sprawy ?? []) as { id: string; amount_pln: number | null; bank_commission_pln: number | null; signed_at: string | null }[];
    const ids = lista.map((s) => s.id);
    const podpisane = lista.filter((s) => s.signed_at && s.signed_at >= od);
    const { data: wnioski } = ids.length ? await admin.from("credit_applications").select("submitted_at, decided_at, status").in("case_id", ids) : { data: [] };
    const w = (wnioski ?? []) as { submitted_at: string | null; decided_at: string | null; status: string }[];
    return {
      wnioski: w.filter((x) => x.submitted_at && x.submitted_at >= od).length,
      decyzje: w.filter((x) => x.status === "pozytywna" && x.decided_at && x.decided_at >= od).length,
      umowy: podpisane.length,
      wolumen: podpisane.reduce((s, x) => s + Number(x.amount_pln ?? 0), 0),
      prowizja: podpisane.reduce((s, x) => s + Number(x.bank_commission_pln ?? 0), 0),
    };
  }
  if (user.role === "trainee") {
    const { data: oceny } = await admin.from("session_scores").select("overall").eq("agent_id", user.id).gte("created_at", od);
    const lista = ((oceny ?? []) as { overall: number | null }[]).map((o) => o.overall).filter((x): x is number => x != null);
    const [sesje, lekcje] = await Promise.all([
      ile(admin.from("training_sessions").select("id", { count: "exact", head: true }).eq("agent_id", user.id).eq("status", "completed").gte("started_at", od)),
      ile(admin.from("academy_progress").select("id", { count: "exact", head: true }).eq("profile_id", user.id).eq("kind", "lekcja").eq("passed", true).gte("updated_at", od)),
    ]);
    return { sesje, lekcje, srednia_ocena: lista.length ? Math.round((lista.reduce((x, y) => x + y, 0) / lista.length) * 10) / 10 : 0 };
  }
  const [{ data: deale }, oferty, klienci] = await Promise.all([
    admin.from("deals").select("commission_pln").eq("agency_id", a).eq("status", "zamkniety").gte("closed_at", od),
    ile(admin.from("properties").select("id", { count: "exact", head: true }).eq("agency_id", a).gte("created_at", od)),
    ile(admin.from("clients").select("id", { count: "exact", head: true }).eq("agency_id", a).gte("created_at", od)),
  ]);
  const d = (deale ?? []) as { commission_pln: number | null }[];
  return { prowizje_biura: d.reduce((s, x) => s + Number(x.commission_pln ?? 0), 0), transakcje_biura: d.length, nowe_oferty: oferty, nowi_klienci: klienci };
}

export async function widokCelow(user: ProfileWithAgency): Promise<WidokCelow | null> {
  const def = celeStanowiska(user.role);
  if (!def) return null;
  const dzis = todayPL();
  const dzien = Number(dzis.slice(8, 10));
  const dniWMiesiacu = new Date(Number(dzis.slice(0, 4)), Number(dzis.slice(5, 7)), 0).getDate();
  const [w, { data: cele }] = await Promise.all([
    wartosci(user, poczatekMiesiacaPL()),
    createSupabaseAdmin().from("role_targets").select("klucz, cel").eq("profile_id", user.id),
  ]);
  const mapa = new Map(((cele ?? []) as { klucz: string; cel: number }[]).map((c) => [c.klucz, Number(c.cel)]));
  return {
    ...def,
    dzien,
    dniWMiesiacu,
    mierniki: def.mierniki.map((m) => {
      const cel = mapa.get(m.klucz) ?? m.domyslnie;
      const teraz = w[m.klucz] ?? 0;
      // Ocena to poziom, nie suma: nie rośnie z dniami, więc bez tempa miesiąca.
      const t = m.jednostka === "ocena" ? tempo(cel, teraz, dniWMiesiacu, dniWMiesiacu) : tempo(cel, teraz, dzien, dniWMiesiacu);
      return { ...m, cel, teraz, ...t };
    }),
  };
}
