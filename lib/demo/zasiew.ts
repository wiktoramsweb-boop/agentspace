import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ZESPOL } from "./dane";
import {
  generujCele,
  generujDziennik,
  generujDzialania,
  generujKlientow,
  generujOferty,
  utworzLosowanie,
  ziarnoDnia,
} from "./dane";

/**
 * Wypełnianie konta demo danymi.
 *
 * Używane w dwóch miejscach: ze skryptu w terminalu przy pierwszym
 * uruchomieniu oraz automatycznie po zalogowaniu, gdy dane się zestarzeją.
 * To drugie jest ważniejsze: pokaz może się odbyć za dwa miesiące, a wtedy
 * kalendarz zapełniony „na trzy tygodnie w przód" byłby już pusty.
 *
 * Zawsze czyścimy i piszemy od nowa. Konto demo jest po to, żeby wyglądać
 * tak samo za każdym razem, więc to, co ktoś naklikał w trakcie poprzedniego
 * pokazu, ma zniknąć.
 */

export type WynikZasiewu = {
  /** true, gdy nie udało się oznaczyć biura jako demo (migracja v30). */
  brakMigracji: boolean;
  klienci: number;
  oferty: number;
  transakcje: number;
  dzialania: number;
  cele: number;
  wpisyDziennika: number;
};

async function wyczysc(agencyId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  // Kolejność ma znaczenie przez klucze obce: najpierw to, co się odwołuje.
  await admin.from("activities").delete().eq("agency_id", agencyId);
  await admin.from("deals").delete().eq("agency_id", agencyId);
  await admin.from("properties").delete().eq("agency_id", agencyId);
  await admin.from("clients").delete().eq("agency_id", agencyId);
  await admin.from("daily_logs").delete().eq("agency_id", agencyId);
  await admin.from("goals").delete().eq("agency_id", agencyId);
}

export async function zasiejDemo(agencyId: string, now = new Date()): Promise<WynikZasiewu> {
  const admin = createSupabaseAdmin();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role, monthly_goal_pln")
    .eq("agency_id", agencyId);

  const zespol = (profile ?? []) as { id: string; full_name: string | null; role: string; monthly_goal_pln: number | null }[];
  if (zespol.length === 0) throw new Error("To biuro nie ma żadnego użytkownika.");

  // Właściciel bywa jedynym kontem na starcie. Agenci dostają dane w pierwszej
  // kolejności, bo to ich pulpity pokazujemy na spotkaniu.
  const agenci = zespol.filter((p) => p.role !== "owner").map((p) => p.id);
  const wszyscy = agenci.length > 0 ? agenci : zespol.map((p) => p.id);

  await wyczysc(agencyId);

  const los = utworzLosowanie(ziarnoDnia(now));

  const klienci = (await admin
    .from("clients")
    .insert(generujKlientow(los, agencyId, wszyscy, now))
    .select("id")) as { data: { id: string }[] | null };

  const oferty = (await admin
    .from("properties")
    .insert(generujOferty(los, agencyId, wszyscy, now))
    .select("id, price_pln, title, agent_id, updated_at, status")) as {
    data: { id: string; price_pln: number; title: string; agent_id: string; updated_at: string; status: string }[] | null;
  };

  const listaKlientow = klienci.data ?? [];
  const listaOfert = oferty.data ?? [];

  // Transakcje robimy ze sfinalizowanych ofert: niosą prawdziwą cenę końcową,
  // a przy okazji dają panelowi właściciela prowizje per agent.
  const sfinalizowane = listaOfert.filter((o) => o.status === "sfinalizowana");
  const transakcje = sfinalizowane.map((o, i) => ({
    agency_id: agencyId,
    agent_id: o.agent_id,
    client_id: listaKlientow[i % Math.max(1, listaKlientow.length)]?.id ?? null,
    property_id: o.id,
    title: `[DEMO] ${o.title}`,
    transaction_value_pln: o.price_pln,
    commission_pln: Math.round((o.price_pln * los.between(0.018, 0.028)) / 100) * 100,
    agent_split_pct: 50,
    status: "zamkniety",
    closed_at: o.updated_at,
  }));
  const zapisaneTransakcje = (await admin.from("deals").insert(transakcje).select("id")) as {
    data: { id: string }[] | null;
  };

  const dzialania = generujDzialania(los, agencyId, wszyscy, listaKlientow, listaOfert, now);
  const zapisaneDzialania = (await admin.from("activities").insert(dzialania).select("id")) as {
    data: { id: string }[] | null;
  };

  const cele = generujCele(
    agencyId,
    zespol
      .filter((p) => p.role !== "owner" || agenci.length === 0)
      .map((p) => ({ id: p.id, celMiesieczny: p.monthly_goal_pln || 12000 })),
  );
  const zapisaneCele = (await admin.from("goals").upsert(cele, { onConflict: "agent_id" }).select("id")) as {
    data: { id: string }[] | null;
  };

  const dziennik = generujDziennik(los, agencyId, wszyscy, now);
  const zapisanyDziennik = (await admin
    .from("daily_logs")
    .upsert(dziennik, { onConflict: "agent_id,log_date" })
    .select("id")) as { data: { id: string }[] | null };

  // Brak tych kolumn oznacza nieuruchomioną migrację v30. Dane i tak się
  // zapiszą, tylko automatyczne odświeżanie nie ruszy - mówimy o tym wprost.
  const { error: znacznikErr } = await admin
    .from("agencies")
    .update({ is_demo: true, demo_refreshed_at: new Date().toISOString() })
    .eq("id", agencyId);

  return {
    brakMigracji: Boolean(znacznikErr),
    klienci: listaKlientow.length,
    oferty: listaOfert.length,
    transakcje: (zapisaneTransakcje.data ?? []).length,
    dzialania: (zapisaneDzialania.data ?? []).length,
    cele: (zapisaneCele.data ?? []).length,
    wpisyDziennika: (zapisanyDziennik.data ?? []).length,
  };
}

export async function wyczyscDemo(agencyId: string): Promise<void> {
  await wyczysc(agencyId);
  const admin = createSupabaseAdmin();
  await admin.from("agencies").update({ demo_refreshed_at: null }).eq("id", agencyId);
}

/** Po ilu godzinach dane uznajemy za nieświeże i wartę odświeżenia. */
const SWIEZOSC_H = 12;

/**
 * Odświeżenie danych konta demo, jeśli się zestarzały.
 *
 * Wołane przy wejściu do aplikacji. Dzięki temu nie trzeba pamiętać
 * o uruchomieniu skryptu przed spotkaniem z klientem.
 */
export async function odswiezDemoJesliTrzeba(agency: {
  id: string;
  is_demo?: boolean | null;
  demo_refreshed_at?: string | null;
}): Promise<boolean> {
  if (!agency.is_demo) return false;

  const ostatnio = agency.demo_refreshed_at ? new Date(agency.demo_refreshed_at).getTime() : 0;
  if (Date.now() - ostatnio < SWIEZOSC_H * 3600 * 1000) return false;

  try {
    await zasiejDemo(agency.id);
    return true;
  } catch (err) {
    // Pokaz nie może się wywrócić przez nieudane odświeżenie danych.
    console.error("Odświeżanie konta demo nie powiodło się:", err);
    return false;
  }
}


/**
 * Konta zespołu w biurze demo.
 *
 * profiles.id ma klucz obcy do auth.users, więc bez kont nie da się pokazać
 * zespołu, rankingu ani prowizji per agent. Hasła są losowe i nigdzie nie
 * zapisywane: na pokazie logujesz się jako właściciel, a te konta istnieją
 * po to, żeby dane miały właścicieli.
 */
export async function utworzZespolDemo(agencyId: string): Promise<{ utworzonych: number; pominietych: string[] }> {
  const admin = createSupabaseAdmin();

  const { data: istniejace } = await admin.from("profiles").select("full_name").eq("agency_id", agencyId);
  const juzSa = new Set((istniejace ?? []).map((p) => (p.full_name ?? "").trim()));

  const pominietych: string[] = [];
  let utworzonych = 0;

  for (const os of ZESPOL) {
    const pelneImie = `${os.imie} ${os.nazwisko}`;
    if (juzSa.has(pelneImie)) continue;

    const email =
      `${os.imie}.${os.nazwisko}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ł/g, "l")
        .replace(/[^a-z.]/g, "") + "@demo.agentspace.pl";

    const haslo = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "").slice(0, 32);

    const { data: user, error } = await admin.auth.admin.createUser({
      email,
      password: haslo,
      email_confirm: true,
      user_metadata: { demo: true },
    });

    if (error || !user?.user) {
      pominietych.push(`${pelneImie}: ${error?.message ?? "nie udało się utworzyć konta"}`);
      continue;
    }

    const { error: profilErr } = await admin.from("profiles").insert({
      id: user.user.id,
      agency_id: agencyId,
      full_name: pelneImie,
      email,
      role: os.rola,
      monthly_goal_pln: os.celMiesieczny,
    });

    if (profilErr) {
      pominietych.push(`${pelneImie}: ${profilErr.message}`);
      continue;
    }
    utworzonych++;
  }

  return { utworzonych, pominietych };
}
