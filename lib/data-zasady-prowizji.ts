import { createSupabaseAdmin } from "./supabase/admin";
import { netto, oczyscProgi, rozliczTransakcje, udzialZProgow, ZASADY_PUSTE, type RozliczenieTransakcji, type ZasadyProwizji } from "./zasady-prowizji";

/** Zasady biura. `ready=false` przed migracją v54. */
export async function getZasadyProwizji(agencyId: string | null): Promise<{ ready: boolean; zasady: ZasadyProwizji }> {
  if (!agencyId) return { ready: true, zasady: ZASADY_PUSTE };
  const { data, error } = await createSupabaseAdmin()
    .from("commission_rules")
    .select("progi, manager_override_pct, network_fee_pct, network_name")
    .eq("agency_id", agencyId)
    .maybeSingle();
  if (error) return { ready: false, zasady: ZASADY_PUSTE };
  if (!data) return { ready: true, zasady: ZASADY_PUSTE };
  return {
    ready: true,
    zasady: {
      progi: oczyscProgi(data.progi),
      nadprowizjaMenedzera: Number(data.manager_override_pct) || 0,
      oplataSieci: Number(data.network_fee_pct) || 0,
      nazwaSieci: (data.network_name as string | null) ?? null,
    },
  };
}

/** Prowizja netto biura z zamkniętych transakcji agenta od 1 stycznia. */
export async function netoAgentaOdPoczatkuRoku(agencyId: string, agentId: string): Promise<number> {
  const rok = new Date().getFullYear();
  const { data } = await createSupabaseAdmin()
    .from("deals")
    .select("commission_pln")
    .eq("agency_id", agencyId)
    .eq("agent_id", agentId)
    .eq("status", "zamkniety")
    .gte("closed_at", new Date(rok, 0, 1).toISOString());
  return Math.round(netto(((data ?? []) as { commission_pln: number | null }[]).reduce((a, d) => a + (d.commission_pln ?? 0), 0)));
}

/**
 * Udział, który formularz transakcji podpowiada agentowi: z progów biura,
 * jeśli są ustawione, inaczej z profilu osoby.
 */
export async function domyslnyUdzial(osoba: { id: string; agency_id: string | null; default_split_pct?: number | null }): Promise<{ pct: number; zProgu: boolean; neto: number }> {
  const profil = osoba.default_split_pct || 50;
  if (!osoba.agency_id) return { pct: profil, zProgu: false, neto: 0 };
  const { zasady } = await getZasadyProwizji(osoba.agency_id);
  if (!zasady.progi.length) return { pct: profil, zProgu: false, neto: 0 };
  const neto = await netoAgentaOdPoczatkuRoku(osoba.agency_id, osoba.id);
  const zProgow = udzialZProgow(zasady.progi, neto);
  return zProgow == null ? { pct: profil, zProgu: false, neto } : { pct: zProgow, zProgu: true, neto };
}

export type PodzialWidok = { id: string; profileId: string; imie: string; rola: string; pct: number; kwota: number };

export async function podzialyTransakcji(agencyId: string, dealId: string): Promise<{ ready: boolean; lista: PodzialWidok[] }> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.from("deal_splits").select("id, profile_id, rola, pct, kwota_pln").eq("agency_id", agencyId).eq("deal_id", dealId).order("created_at");
  if (error) return { ready: false, lista: [] };
  const wiersze = (data ?? []) as { id: string; profile_id: string; rola: string; pct: number; kwota_pln: number }[];
  const { data: prof } = wiersze.length ? await admin.from("profiles").select("id, full_name").in("id", wiersze.map((w) => w.profile_id)) : { data: [] };
  const imiona = new Map(((prof ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? "Osoba"]));
  return {
    ready: true,
    lista: wiersze.map((w) => ({ id: w.id, profileId: w.profile_id, imie: imiona.get(w.profile_id) ?? "Osoba", rola: w.rola, pct: Number(w.pct), kwota: w.kwota_pln })),
  };
}

export type WierszRozliczenia = RozliczenieTransakcji & {
  dealId: string;
  tytul: string;
  zamknieta: string;
  agentId: string;
  agentImie: string;
  menedzerId: string | null;
  menedzerImie: string | null;
  oddzial: string | null;
};

export type Rozliczenie = {
  ready: boolean;
  zasady: ZasadyProwizji;
  wiersze: WierszRozliczenia[];
  /** Do wypłaty per osoba: prowadzący + współagent + nadprowizja. */
  osoby: { id: string; imie: string; jakoAgent: number; jakoWspolny: number; nadprowizja: number; razem: number }[];
  oddzialy: { nazwa: string; brutto: number; biuro: number }[];
  suma: { brutto: number; netto: number; wyplaty: number; siec: number; biuro: number };
};

/** Rozliczenie miesiąca: transakcje zamknięte w danym miesiącu (1–12). */
export async function rozliczenieMiesiaca(agencyId: string, rok: number, miesiac: number): Promise<Rozliczenie> {
  const admin = createSupabaseAdmin();
  const od = new Date(rok, miesiac - 1, 1).toISOString();
  const doo = new Date(rok, miesiac, 1).toISOString();
  const [{ ready, zasady }, deals, prof, br] = await Promise.all([
    getZasadyProwizji(agencyId),
    admin
      .from("deals")
      .select("id, title, agent_id, commission_pln, extras_pln, agent_earnings_pln, closed_at")
      .eq("agency_id", agencyId)
      .eq("status", "zamkniety")
      .gte("closed_at", od)
      .lt("closed_at", doo)
      .order("closed_at"),
    admin.from("profiles").select("*").eq("agency_id", agencyId),
    admin.from("branches").select("id, name, manager_id").eq("agency_id", agencyId),
  ]);
  const ludzie = new Map(((prof.data ?? []) as { id: string; full_name: string | null; manager_id: string | null; branch_id?: string | null }[]).map((p) => [p.id, p]));
  const oddzialy = br.error ? [] : ((br.data ?? []) as { id: string; name: string; manager_id: string | null }[]);
  const lista = (deals.data ?? []) as { id: string; title: string; agent_id: string; commission_pln: number | null; extras_pln: number | null; agent_earnings_pln: number | null; closed_at: string }[];

  const { data: sp, error: spErr } = lista.length && ready
    ? await admin.from("deal_splits").select("deal_id, profile_id, rola, pct").in("deal_id", lista.map((d) => d.id))
    : { data: [], error: null };
  const podzialy = spErr ? [] : ((sp ?? []) as { deal_id: string; profile_id: string; rola: string; pct: number }[]);

  const imie = (id: string | null | undefined) => (id ? ludzie.get(id)?.full_name ?? "Osoba" : null);
  // Nadprowizję dostaje przypisany menedżer agenta, a gdy go nie ma, kierownik jego oddziału.
  const menedzerAgenta = (agentId: string): string | null => {
    const a = ludzie.get(agentId);
    if (a?.manager_id && a.manager_id !== agentId) return a.manager_id;
    const kier = oddzialy.find((o) => o.id === a?.branch_id)?.manager_id ?? null;
    return kier && kier !== agentId ? kier : null;
  };

  const wiersze: WierszRozliczenia[] = lista.map((d) => {
    const menedzerId = menedzerAgenta(d.agent_id);
    const r = rozliczTransakcje({
      brutto: d.commission_pln ?? 0,
      dodatki: d.extras_pln ?? 0,
      agentZarobek: d.agent_earnings_pln ?? 0,
      podzialy: podzialy.filter((s) => s.deal_id === d.id).map((s) => ({ profileId: s.profile_id, rola: s.rola, pct: Number(s.pct) })),
      zasady,
      maMenedzera: Boolean(menedzerId),
    });
    return {
      ...r,
      dealId: d.id,
      tytul: d.title,
      zamknieta: d.closed_at,
      agentId: d.agent_id,
      agentImie: imie(d.agent_id) ?? "Osoba",
      menedzerId: r.menedzer ? menedzerId : null,
      menedzerImie: r.menedzer ? imie(menedzerId) : null,
      oddzial: oddzialy.find((o) => o.id === ludzie.get(d.agent_id)?.branch_id)?.name ?? null,
    };
  });

  const osoby = new Map<string, { id: string; imie: string; jakoAgent: number; jakoWspolny: number; nadprowizja: number; razem: number }>();
  const dodaj = (id: string, pole: "jakoAgent" | "jakoWspolny" | "nadprowizja", kwota: number) => {
    if (!kwota) return;
    const o = osoby.get(id) ?? { id, imie: imie(id) ?? "Osoba", jakoAgent: 0, jakoWspolny: 0, nadprowizja: 0, razem: 0 };
    o[pole] += kwota;
    o.razem += kwota;
    osoby.set(id, o);
  };
  for (const w of wiersze) {
    dodaj(w.agentId, "jakoAgent", w.agent);
    for (const s of w.wspolni) dodaj(s.profileId, "jakoWspolny", s.kwota);
    if (w.menedzerId) dodaj(w.menedzerId, "nadprowizja", w.menedzer);
  }

  const wgOddzialu = new Map<string, { nazwa: string; brutto: number; biuro: number }>();
  if (oddzialy.length) {
    for (const w of wiersze) {
      const k = w.oddzial ?? "Bez oddziału";
      const o = wgOddzialu.get(k) ?? { nazwa: k, brutto: 0, biuro: 0 };
      o.brutto += w.brutto;
      o.biuro += w.biuro;
      wgOddzialu.set(k, o);
    }
  }

  const suma = wiersze.reduce(
    (a, w) => ({
      brutto: a.brutto + w.brutto,
      netto: a.netto + w.netto,
      wyplaty: a.wyplaty + w.agent + w.wspolni.reduce((x, s) => x + s.kwota, 0) + w.menedzer,
      siec: a.siec + w.siec,
      biuro: a.biuro + w.biuro,
    }),
    { brutto: 0, netto: 0, wyplaty: 0, siec: 0, biuro: 0 },
  );

  return {
    ready,
    zasady,
    wiersze,
    osoby: [...osoby.values()].sort((a, b) => b.razem - a.razem),
    oddzialy: [...wgOddzialu.values()].sort((a, b) => b.brutto - a.brutto),
    suma,
  };
}
