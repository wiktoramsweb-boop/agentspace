import { createSupabaseAdmin } from "./supabase/admin";
import { stanDostepu, type StanDostepu } from "./abonament-cennik";
import { poczatekMiesiaca } from "./kredyty-cennik";
import { APP_TZ } from "./datetime";

/**
 * Dane do panelu operatora.
 *
 * Celowo NIE pobieramy stąd niczego z danych klientów biur: ani nazwisk,
 * ani telefonów, ani treści notatek. Operator ma widzieć stan konta i to,
 * czy system działa, a nie bazę cudzego biura. Do diagnozy wystarczą liczby.
 */

export type BiuroWPanelu = {
  id: string;
  nazwa: string;
  zalozone: string;
  dostep: StanDostepu;
  plan: string | null;
  okres: string | null;
  konczySie: string | null;
  demo: boolean;
  osob: number;
  kredytyZuzyte: number;
  ostatniaAktywnosc: string | null;
  zamowieniaOczekujace: number;
};

export type ZamowienieOperatora = {
  id: string;
  agencyId: string;
  biuro: string;
  kind: string;
  plan: string;
  period: string;
  credits: number;
  amount_grosz: number;
  status: string;
  created_at: string;
};

function poczatekMiesiacaPL(): string {
  return poczatekMiesiaca(APP_TZ);
}

/** Która data realnie opisuje koniec dostępu danego biura. */
function koniecDostepu(a: Record<string, unknown>): string | null {
  // `probny` zostaje true także po wygaśnięciu okresu próbnego, więc to ono,
  // a nie `powod`, mówi, którą datę pokazać.
  const stan = stanDostepu(a as Parameters<typeof stanDostepu>[0]);
  if (stan.probny) return (a.trial_ends_at as string) ?? null;
  return (a.subscription_ends_at as string) ?? null;
}

/** Lista wszystkich biur ze stanem konta. */
export async function biuraWPanelu(): Promise<BiuroWPanelu[]> {
  const admin = createSupabaseAdmin();

  const { data: agencje, error } = await admin
    .from("agencies")
    .select(
      "id, name, created_at, is_demo, subscription_status, subscription_plan, subscription_period, subscription_ends_at, trial_ends_at",
    )
    .order("created_at", { ascending: false });
  if (error || !agencje) return [];

  const ids = agencje.map((a) => a.id as string);
  if (ids.length === 0) return [];

  // Trzy zapytania zbiorcze zamiast trzech na każde biuro.
  const [{ data: profile }, { data: zdarzenia }, { data: zamowienia }] = await Promise.all([
    admin.from("profiles").select("agency_id").in("agency_id", ids),
    admin
      .from("rate_events")
      .select("agency_id, credits, created_at")
      .in("agency_id", ids)
      .gte("created_at", poczatekMiesiacaPL()),
    admin.from("subscription_orders").select("agency_id, status").in("agency_id", ids),
  ]);

  const osobWBiurze = new Map<string, number>();
  for (const p of profile ?? []) {
    const k = p.agency_id as string;
    osobWBiurze.set(k, (osobWBiurze.get(k) ?? 0) + 1);
  }

  const kredyty = new Map<string, number>();
  const ostatnie = new Map<string, string>();
  for (const z of zdarzenia ?? []) {
    const k = z.agency_id as string;
    kredyty.set(k, (kredyty.get(k) ?? 0) + ((z.credits as number) ?? 1));
    const data = z.created_at as string;
    if (!ostatnie.has(k) || data > ostatnie.get(k)!) ostatnie.set(k, data);
  }

  const oczekujace = new Map<string, number>();
  for (const z of zamowienia ?? []) {
    if (z.status === "oplacone") continue;
    const k = z.agency_id as string;
    oczekujace.set(k, (oczekujace.get(k) ?? 0) + 1);
  }

  return agencje.map((a) => ({
    id: a.id as string,
    nazwa: (a.name as string) ?? "Bez nazwy",
    zalozone: a.created_at as string,
    dostep: stanDostepu(a),
    plan: (a.subscription_plan as string) ?? null,
    okres: (a.subscription_period as string) ?? null,
    // Data końca zależy od tego, CO się kończy. Przy abonamencie bez daty
    // (biuro sprzed v37) pokazywanie starego triala sugerowało, że dostęp
    // wygasł 59 dni temu, choć konto jest czynne.
    konczySie: koniecDostepu(a),
    demo: Boolean(a.is_demo),
    osob: osobWBiurze.get(a.id as string) ?? 0,
    kredytyZuzyte: kredyty.get(a.id as string) ?? 0,
    ostatniaAktywnosc: ostatnie.get(a.id as string) ?? null,
    zamowieniaOczekujace: oczekujace.get(a.id as string) ?? 0,
  }));
}

/** Zamówienia czekające na potwierdzenie wpłaty, ze wszystkich biur. */
export async function zamowieniaDoRozliczenia(): Promise<ZamowienieOperatora[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("subscription_orders")
    .select("id, agency_id, kind, plan, period, credits, amount_grosz, status, created_at")
    .neq("status", "oplacone")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];

  const ids = [...new Set(data.map((z) => z.agency_id as string))];
  const { data: agencje } = await admin.from("agencies").select("id, name").in("id", ids);
  const nazwy = new Map((agencje ?? []).map((a) => [a.id as string, (a.name as string) ?? "Bez nazwy"]));

  return data.map((z) => ({
    id: z.id as string,
    agencyId: z.agency_id as string,
    biuro: nazwy.get(z.agency_id as string) ?? "Bez nazwy",
    kind: (z.kind as string) ?? "abonament",
    plan: (z.plan as string) ?? "",
    period: (z.period as string) ?? "",
    credits: (z.credits as number) ?? 0,
    amount_grosz: (z.amount_grosz as number) ?? 0,
    status: (z.status as string) ?? "nowe",
    created_at: z.created_at as string,
  }));
}

/* ───────────── Szczegóły biura i zdrowie systemu (panel operatora) ───────────── */

export type OsobaBiura = { id: string; imie: string; email: string | null; rola: string; od: string; ostatnio: string | null; kredyty: number };

export type SzczegolyBiura = {
  biuro: Record<string, unknown>;
  dostep: StanDostepu;
  osoby: OsobaBiura[];
  liczby: { etykieta: string; wartosc: number }[];
  kredytyWgOperacji: { operacja: string; kredyty: number }[];
  zdarzenia: { kiedy: string; co: string; kto: string | null }[];
  zamowienia: { id: string; opis: string; status: string; kiedy: string; kwota: number }[];
  ustawienia: string[];
  wejscia: { kiedy: string }[];
};

/** Liczba wierszy tabeli dla biura. GET z limitem 1, bo HEAD na brakującej tabeli nie zwraca błędu. */
async function ileWierszy(tabela: string, agencyId: string): Promise<number> {
  const { count, error } = await createSupabaseAdmin()
    .from(tabela)
    .select("id", { count: "exact" })
    .eq("agency_id", agencyId)
    .limit(1);
  return error ? 0 : (count ?? 0);
}

export async function szczegolyBiura(id: string): Promise<SzczegolyBiura | null> {
  const admin = createSupabaseAdmin();
  const { data: biuro } = await admin.from("agencies").select("*").eq("id", id).maybeSingle();
  if (!biuro) return null;

  const od = poczatekMiesiacaPL();
  const [{ data: ludzie }, { data: zuzycie }, { data: dziennik }, { data: zam }, { data: ust }, { data: wejscia }, liczby] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, role, created_at").eq("agency_id", id).order("created_at"),
    admin.from("rate_events").select("user_id, key, credits, created_at").eq("agency_id", id).gte("created_at", od).limit(5000),
    admin.from("audit_log").select("created_at, summary, actor_id").eq("agency_id", id).order("created_at", { ascending: false }).limit(15),
    admin.from("subscription_orders").select("id, kind, plan, period, credits, amount_grosz, status, created_at").eq("agency_id", id).order("created_at", { ascending: false }).limit(10),
    admin.from("agency_settings").select("options").eq("agency_id", id).maybeSingle(),
    admin.from("rate_events").select("created_at").eq("key", `operator:wejscie:${id}`).order("created_at", { ascending: false }).limit(10),
    Promise.all(
      [
        ["Klienci", "clients"],
        ["Oferty", "properties"],
        ["Leady", "leads"],
        ["Transakcje", "deals"],
        ["Rozmowy AI Coach", "training_sessions"],
        ["Zadania", "tasks"],
        ["Faktury", "invoices"],
      ].map(async ([etykieta, tabela]) => ({ etykieta, wartosc: await ileWierszy(tabela, id) })),
    ),
  ]);

  const ostatnio = new Map<string, string>();
  const kredytyOsoby = new Map<string, number>();
  const wgOperacji = new Map<string, number>();
  for (const z of zuzycie ?? []) {
    const u = z.user_id as string | null;
    const c = (z.credits as number) ?? 1;
    if (u) {
      kredytyOsoby.set(u, (kredytyOsoby.get(u) ?? 0) + c);
      if (!ostatnio.has(u) || (z.created_at as string) > ostatnio.get(u)!) ostatnio.set(u, z.created_at as string);
    }
    const k = String(z.key ?? "").replace(/^ai:/, "");
    if (k.startsWith("ai") || String(z.key).startsWith("ai:")) wgOperacji.set(k, (wgOperacji.get(k) ?? 0) + c);
  }
  const imiona = new Map((ludzie ?? []).map((p) => [p.id as string, (p.full_name as string) ?? (p.email as string) ?? "?"]));

  return {
    biuro,
    dostep: stanDostepu(biuro),
    osoby: (ludzie ?? []).map((p) => ({
      id: p.id as string,
      imie: (p.full_name as string) ?? "Bez nazwiska",
      email: (p.email as string) ?? null,
      rola: p.role as string,
      od: p.created_at as string,
      ostatnio: ostatnio.get(p.id as string) ?? null,
      kredyty: kredytyOsoby.get(p.id as string) ?? 0,
    })),
    liczby,
    kredytyWgOperacji: [...wgOperacji.entries()].map(([operacja, kredyty]) => ({ operacja, kredyty })).sort((a, b) => b.kredyty - a.kredyty),
    zdarzenia: (dziennik ?? []).map((d) => ({ kiedy: d.created_at as string, co: d.summary as string, kto: imiona.get(d.actor_id as string) ?? null })),
    zamowienia: (zam ?? []).map((z) => ({
      id: z.id as string,
      opis: `${z.kind === "kredyty" ? `Kredyty ${z.credits}` : `Pakiet ${z.plan}`} · ${z.period ?? ""}`,
      status: z.status as string,
      kiedy: z.created_at as string,
      kwota: Number(z.amount_grosz ?? 0) / 100,
    })),
    ustawienia: Object.keys((ust?.options as Record<string, unknown> | null) ?? {}),
    wejscia: (wejscia ?? []).map((w) => ({ kiedy: w.created_at as string })),
  };
}

export type ZdrowieSystemu = {
  bledy24h: number;
  bledy7d: number;
  ostatnieBledy: { kiedy: string; gdzie: string; wiadomosc: string }[];
  aktywni7d: number;
  rozmowy7d: number;
  kredyty7d: number;
};

export async function zdrowieSystemu(): Promise<ZdrowieSystemu> {
  const admin = createSupabaseAdmin();
  const d1 = new Date(Date.now() - 86_400_000).toISOString();
  const d7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [{ data: bledy }, { data: zuz }, { count: rozmowy }] = await Promise.all([
    admin.from("app_errors").select("created_at, gdzie, wiadomosc").gte("created_at", d7).order("created_at", { ascending: false }).limit(200),
    admin.from("rate_events").select("user_id, credits, key").gte("created_at", d7).like("key", "ai:%").limit(10000),
    admin.from("training_sessions").select("id", { count: "exact" }).gte("started_at", d7).limit(1),
  ]);
  const b = bledy ?? [];
  return {
    bledy24h: b.filter((x) => (x.created_at as string) >= d1).length,
    bledy7d: b.length,
    ostatnieBledy: b.slice(0, 12).map((x) => ({ kiedy: x.created_at as string, gdzie: x.gdzie as string, wiadomosc: x.wiadomosc as string })),
    aktywni7d: new Set((zuz ?? []).map((z) => z.user_id).filter(Boolean)).size,
    rozmowy7d: rozmowy ?? 0,
    kredyty7d: (zuz ?? []).reduce((s, z) => s + ((z.credits as number) ?? 1), 0),
  };
}
