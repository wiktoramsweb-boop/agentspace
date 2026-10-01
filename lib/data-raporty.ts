import { createSupabaseAdmin } from "./supabase/admin";
import {
  CLIENT_SOURCES,
  CLIENT_STATUSES,
  PROCESS_STAGES,
  type ProcessStage,
} from "./types";

/**
 * Liczby dla właściciela biura.
 *
 * To nie są te same statystyki co na pulpicie agenta. Agent pyta „co mam dziś
 * zrobić", a właściciel pyta o cztery inne rzeczy i tylko na nie odpowiadamy:
 *   1. Ile zarobimy w tym kwartale?
 *   2. Gdzie sypie się lejek?
 *   3. Skąd faktycznie przychodzą pieniądze?
 *   4. Kto pracuje, a kto tylko wygląda na zajętego?
 *
 * Wszystko liczymy w kodzie, a nie w bazie: zbiory w biurze są małe (setki ofert,
 * tysiące działań), a dzięki temu nie trzeba pisać widoków SQL i migracji przy
 * każdej zmianie definicji wskaźnika.
 */

export type Okres = "miesiac" | "kwartal" | "rok" | "wszystko";

export const OKRESY: { value: Okres; label: string }[] = [
  { value: "miesiac", label: "Ten miesiąc" },
  { value: "kwartal", label: "Ten kwartał" },
  { value: "rok", label: "Ten rok" },
  { value: "wszystko", label: "Od początku" },
];

/** Początek okresu. Null znaczy „nie filtrujemy po dacie". */
export function poczatekOkresu(okres: Okres, teraz = new Date()): Date | null {
  const r = teraz.getFullYear();
  if (okres === "miesiac") return new Date(r, teraz.getMonth(), 1);
  if (okres === "kwartal") return new Date(r, Math.floor(teraz.getMonth() / 3) * 3, 1);
  if (okres === "rok") return new Date(r, 0, 1);
  return null;
}

/**
 * Szansa domknięcia na danym etapie obsługi oferty. Liczby są z doświadczenia
 * biura, nie z modelu - stoją tutaj świadomie w jednym miejscu, żeby dało się
 * je poprawić, gdy biuro zobaczy własne dane. Prognoza bez nich byłaby sumą
 * wszystkiego, co w toku, czyli liczbą bez wartości.
 */
export const SZANSA_ETAPU: Record<ProcessStage, number> = {
  przyjeta: 0.1,
  male_zainteresowanie: 0.1,
  liczne_prezentacje: 0.25,
  zlozona_oferta: 0.5,
  oplata_rezerwacyjna: 0.8,
  umowa_przedwstepna: 0.95,
  wygrana: 1,
};

export type RaportPieniadze = {
  zamknieteSzt: number;
  zamknietePln: number;
  sredniaProwizja: number;
  wTokuSzt: number;
  wTokuPln: number;
  prognozaPln: number;
  przepadloSzt: number;
  skutecznosc: number | null;
  sredniDniDoZamkniecia: number | null;
};

export type SzczebelLejka = {
  etap: string;
  label: string;
  ile: number;
  /** Ile procent z poprzedniego szczebla doszło tutaj. */
  przejscie: number | null;
};

export type ZrodloWiersz = {
  zrodlo: string;
  label: string;
  kontakty: number;
  transakcje: number;
  prowizja: number;
  konwersja: number | null;
};

export type AgentWiersz = {
  id: string;
  name: string;
  telefony: number;
  spotkania: number;
  nowychKontaktow: number;
  nowychOfert: number;
  transakcje: number;
  prowizja: number;
  /** Ile telefonów przypada na jedną transakcję. Null, gdy brak transakcji. */
  telefonowNaTransakcje: number | null;
};

export type RaportWlasciciela = {
  okres: Okres;
  od: string | null;
  pieniadze: RaportPieniadze;
  lejekOfert: SzczebelLejka[];
  lejekKlientow: SzczebelLejka[];
  zrodla: ZrodloWiersz[];
  zespol: AgentWiersz[];
  tempo: { tydzien: string; dzialania: number }[];
  /** Prowizja zamknięta miesiąc po miesiącu, ostatnie 12 miesięcy. */
  przychodMiesiacami: { miesiac: string; pln: number; szt: number }[];
};

const ZRODLA_MAP = Object.fromEntries(CLIENT_SOURCES.map((z) => [z.value, z.label]));

function pln(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

export async function getRaportWlasciciela(
  agencyId: string,
  okres: Okres,
): Promise<RaportWlasciciela> {
  const admin = createSupabaseAdmin();
  const od = poczatekOkresu(okres);
  const odIso = od?.toISOString() ?? null;

  const [profilesRes, dealsRes, clientsRes, propsRes, actsRes] = await Promise.all([
    admin.from("profiles").select("id, full_name").eq("agency_id", agencyId),
    admin.from("deals").select("*").eq("agency_id", agencyId),
    admin.from("clients").select("id, agent_id, status, source, created_at").eq("agency_id", agencyId),
    admin
      .from("properties")
      .select("id, agent_id, status, process_stage, created_at")
      .eq("agency_id", agencyId),
    admin
      .from("activities")
      .select("id, kind, status, assignee_ids, due_at, created_at")
      .eq("agency_id", agencyId),
  ]);

  type DealRow = {
    id: string; agent_id: string; client_id: string | null; status: string;
    commission_pln: number | null; closed_at: string | null; created_at: string;
    property_id: string | null;
  };
  const wszystkieDeals = (dealsRes.data ?? []) as DealRow[];
  const clients = (clientsRes.data ?? []) as {
    id: string; agent_id: string; status: string; source: string | null; created_at: string;
  }[];
  const props = (propsRes.data ?? []) as {
    id: string; agent_id: string; status: string; process_stage: string | null; created_at: string;
  }[];
  const acts = (actsRes.data ?? []) as {
    id: string; kind: string; status: string; assignee_ids: string[] | null;
    due_at: string | null; created_at: string;
  }[];
  const profile = (profilesRes.data ?? []) as { id: string; full_name: string | null }[];

  /** Transakcja należy do okresu po dacie zamknięcia, a gdy jej nie ma - po dacie utworzenia. */
  const wOkresie = (iso: string | null | undefined) => !odIso || (iso != null && iso >= odIso);

  // ── 1. Pieniądze ────────────────────────────────────────────────────────
  const zamkniete = wszystkieDeals.filter(
    (d) => d.status === "zamkniety" && wOkresie(d.closed_at ?? d.created_at),
  );
  const przepadlo = wszystkieDeals.filter(
    (d) => d.status === "przepadl" && wOkresie(d.closed_at ?? d.created_at),
  );
  // Transakcje w toku bierzemy wszystkie, niezależnie od okresu: pipeline to
  // stan na dziś, a nie zdarzenie z przeszłości.
  const wToku = wszystkieDeals.filter((d) => d.status === "w_toku");

  const etapOferty = new Map(props.map((p) => [p.id, (p.process_stage ?? "przyjeta") as ProcessStage]));
  const prognoza = wToku.reduce((suma, d) => {
    const etap = d.property_id ? etapOferty.get(d.property_id) : undefined;
    const szansa = etap ? (SZANSA_ETAPU[etap] ?? 0.25) : 0.25;
    return suma + pln(d.commission_pln) * szansa;
  }, 0);

  const dniDoZamkniecia = zamkniete
    .filter((d) => d.closed_at)
    .map((d) => (new Date(d.closed_at!).getTime() - new Date(d.created_at).getTime()) / 86400000)
    .filter((n) => n >= 0);

  const zamknietePln = zamkniete.reduce((s, d) => s + pln(d.commission_pln), 0);
  const rozstrzygniete = zamkniete.length + przepadlo.length;

  const pieniadze: RaportPieniadze = {
    zamknieteSzt: zamkniete.length,
    zamknietePln,
    sredniaProwizja: zamkniete.length ? Math.round(zamknietePln / zamkniete.length) : 0,
    wTokuSzt: wToku.length,
    wTokuPln: wToku.reduce((s, d) => s + pln(d.commission_pln), 0),
    prognozaPln: Math.round(prognoza),
    przepadloSzt: przepadlo.length,
    skutecznosc: rozstrzygniete ? Math.round((zamkniete.length / rozstrzygniete) * 100) : null,
    sredniDniDoZamkniecia: dniDoZamkniecia.length
      ? Math.round(dniDoZamkniecia.reduce((a, b) => a + b, 0) / dniDoZamkniecia.length)
      : null,
  };

  // ── 2. Lejek ofert ──────────────────────────────────────────────────────
  // Etapy są kolejne, więc oferta na etapie „Rezerwacja" przeszła też przez
  // wszystkie wcześniejsze. Liczymy skumulowanie, inaczej lejek pokazywałby
  // tylko to, gdzie oferty akurat stoją.
  const ofertyOkresu = props.filter((p) => wOkresie(p.created_at));
  const indeksEtapu = new Map(PROCESS_STAGES.map((s, i) => [s.value, i]));
  const lejekOfert: SzczebelLejka[] = PROCESS_STAGES.map((s, i) => {
    const ile = ofertyOkresu.filter((p) => {
      const idx = indeksEtapu.get((p.process_stage ?? "przyjeta") as ProcessStage) ?? 0;
      return idx >= i;
    }).length;
    return { etap: s.value, label: s.short, ile, przejscie: null };
  });
  for (let i = 1; i < lejekOfert.length; i++) {
    const poprzedni = lejekOfert[i - 1].ile;
    lejekOfert[i].przejscie = poprzedni ? Math.round((lejekOfert[i].ile / poprzedni) * 100) : null;
  }

  // ── 3. Lejek klientów ───────────────────────────────────────────────────
  const klienciOkresu = clients.filter((c) => wOkresie(c.created_at));
  const lejekKlientow: SzczebelLejka[] = CLIENT_STATUSES.map((s) => ({
    etap: s.value,
    label: s.label,
    ile: klienciOkresu.filter((c) => c.status === s.value).length,
    przejscie: null,
  }));

  // ── 4. Źródła: nie ile ich jest, tylko ile z nich pieniędzy ────────────
  const dealPoKliencie = new Map<string, DealRow[]>();
  for (const d of zamkniete) {
    if (!d.client_id) continue;
    dealPoKliencie.set(d.client_id, [...(dealPoKliencie.get(d.client_id) ?? []), d]);
  }
  const zrodlaMapa = new Map<string, ZrodloWiersz>();
  for (const c of klienciOkresu) {
    const klucz = c.source ?? "brak";
    const w =
      zrodlaMapa.get(klucz) ??
      {
        zrodlo: klucz,
        label: ZRODLA_MAP[klucz] ?? (klucz === "brak" ? "Nie podano" : klucz),
        kontakty: 0, transakcje: 0, prowizja: 0, konwersja: null,
      };
    w.kontakty++;
    for (const d of dealPoKliencie.get(c.id) ?? []) {
      w.transakcje++;
      w.prowizja += pln(d.commission_pln);
    }
    zrodlaMapa.set(klucz, w);
  }
  const zrodla = [...zrodlaMapa.values()]
    .map((w) => ({
      ...w,
      konwersja: w.kontakty ? Math.round((w.transakcje / w.kontakty) * 100) : null,
    }))
    .sort((a, b) => b.prowizja - a.prowizja || b.kontakty - a.kontakty);

  // ── 5. Zespół: aktywność obok wyniku ────────────────────────────────────
  const dzialaniaOkresu = acts.filter((a) => wOkresie(a.due_at ?? a.created_at));
  const zespol: AgentWiersz[] = profile
    .map((p) => {
      const moje = dzialaniaOkresu.filter((a) => (a.assignee_ids ?? []).includes(p.id));
      const telefony = moje.filter((a) => a.kind === "polaczenie" && a.status === "wykonane").length;
      const transakcje = zamkniete.filter((d) => d.agent_id === p.id);
      return {
        id: p.id,
        name: p.full_name ?? "Bez nazwy",
        telefony,
        spotkania: moje.filter((a) => a.kind === "spotkanie" && a.status === "wykonane").length,
        nowychKontaktow: klienciOkresu.filter((c) => c.agent_id === p.id).length,
        nowychOfert: ofertyOkresu.filter((o) => o.agent_id === p.id).length,
        transakcje: transakcje.length,
        prowizja: transakcje.reduce((s, d) => s + pln(d.commission_pln), 0),
        telefonowNaTransakcje: transakcje.length ? Math.round(telefony / transakcje.length) : null,
      };
    })
    .sort((a, b) => b.prowizja - a.prowizja || b.telefony - a.telefony);

  // ── 6. Tempo: ostatnie 12 tygodni ───────────────────────────────────────
  const tempo: { tydzien: string; dzialania: number }[] = [];
  const dzis = new Date();
  for (let i = 11; i >= 0; i--) {
    const koniec = new Date(dzis.getTime() - i * 7 * 86400000);
    const start = new Date(koniec.getTime() - 7 * 86400000);
    tempo.push({
      tydzien: `${String(start.getDate()).padStart(2, "0")}.${String(start.getMonth() + 1).padStart(2, "0")}`,
      dzialania: acts.filter((a) => {
        const kiedy = new Date(a.due_at ?? a.created_at);
        return kiedy >= start && kiedy < koniec && a.status === "wykonane";
      }).length,
    });
  }

  // ── 7. Przychód miesiąc po miesiącu, zawsze 12 miesięcy wstecz ─────────
  // Niezależnie od wybranego okresu: właściciel patrzy na trend, a trend
  // widać dopiero na dłuższym kawałku niż jeden kwartał.
  const MIESIACE = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
  const przychodMiesiacami: { miesiac: string; pln: number; szt: number }[] = [];
  const teraz = new Date();
  for (let i = 11; i >= 0; i--) {
    const m = new Date(teraz.getFullYear(), teraz.getMonth() - i, 1);
    const nast = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const wMiesiacu = wszystkieDeals.filter((d) => {
      if (d.status !== "zamkniety") return false;
      const kiedy = new Date(d.closed_at ?? d.created_at);
      return kiedy >= m && kiedy < nast;
    });
    przychodMiesiacami.push({
      miesiac: `${MIESIACE[m.getMonth()]} ${String(m.getFullYear()).slice(2)}`,
      pln: wMiesiacu.reduce((su, d) => su + pln(d.commission_pln), 0),
      szt: wMiesiacu.length,
    });
  }

  return {
    okres,
    od: odIso,
    przychodMiesiacami,
    pieniadze,
    lejekOfert,
    lejekKlientow,
    zrodla,
    zespol,
    tempo,
  };
}
