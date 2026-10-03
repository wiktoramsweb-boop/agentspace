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
