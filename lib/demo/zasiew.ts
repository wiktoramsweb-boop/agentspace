import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ZESPOL } from "./dane";
import {
  generujCele,
  generujDziennik,
  generujFaktury,
  generujLeady,
  generujPoszukiwania,
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
  leady: number;
  poszukiwania: number;
  faktury: number;
};

/** Zapis w porcjach: tysiąc działań w jednym żądaniu potrafi się wywrócić. */
async function wstawPorcjami(
  tabela: string,
  wiersze: Record<string, unknown>[],
  rozmiar = 400,
): Promise<number> {
  const admin = createSupabaseAdmin();
  let zapisanych = 0;
  for (let i = 0; i < wiersze.length; i += rozmiar) {
    const { data, error } = await admin
      .from(tabela)
      .insert(wiersze.slice(i, i + rozmiar))
      .select("id");
    if (error) {
      console.error(`Zapis do ${tabela}, porcja ${Math.floor(i / rozmiar) + 1}:`, error.message);
      continue;
    }
    zapisanych += (data ?? []).length;
  }
  return zapisanych;
}

async function wyczysc(agencyId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  // Kolejność ma znaczenie przez klucze obce: najpierw to, co się odwołuje.
  await admin.from("invoices").delete().eq("agency_id", agencyId);
  await admin.from("leads").delete().eq("agency_id", agencyId);
  await admin.from("searches").delete().eq("agency_id", agencyId);
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

  // Dane dostają WSZYSCY, razem z właścicielem.
  //
  // Na pokazie prowadzący loguje się jako właściciel, a kalendarz, cele
  // i pulpit pokazują domyślnie dane zalogowanej osoby. Gdy właściciel nie
  // miał własnych działań, widział pusty kalendarz i komunikat „brak
  // wykonanych telefonów", mimo pełnej bazy.
  const wszyscy = zespol.map((p) => p.id);

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
  const iloscDzialan = await wstawPorcjami("activities", dzialania);

  const cele = generujCele(
    agencyId,
    zespol.map((p) => ({
      id: p.id,
      // Właściciel zwykle nie ma ustawionego celu, a bez niego moduł Cele
      // na jego koncie jest pusty. Na pokazie to akurat ten ekran, który
      // najczęściej się otwiera.
      celMiesieczny: p.monthly_goal_pln || (p.role === "owner" ? 20000 : 12000),
    })),
  );
  const zapisaneCele = (await admin.from("goals").upsert(cele, { onConflict: "agent_id" }).select("id")) as {
    data: { id: string }[] | null;
  };

  const dziennik = generujDziennik(los, agencyId, wszyscy, now);
  const iloscDziennika = await wstawPorcjami("daily_logs", dziennik);

  // Nowsze moduły też muszą mieć co pokazać. Każdy zasiew osobno, bo brak
  // migracji ma zabrać tylko ten jeden moduł, a nie wywrócić całe demo.
  const iloscLeadow = await wstawPorcjami("leads", generujLeady(los, agencyId, wszyscy, now));
  const iloscPoszukiwan = await wstawPorcjami(
    "searches",
    generujPoszukiwania(los, agencyId, wszyscy, listaKlientow),
  );
  const ceo = zespol.find((p) => p.role === "owner") ?? zespol[0];
  const iloscFaktur = await wstawPorcjami(
    "invoices",
    generujFaktury(los, agencyId, ceo.id, transakcje, now),
  );

  // Dane firmy i sprzedawca na fakturach: bez nich demo wygląda jak konto,
  // którego nikt nie skonfigurował, a to pierwsze, co widać na pokazie.
  await admin.from("agency_settings").upsert(
    {
      agency_id: agencyId,
      company: {
        name: "Biuro Demo Nieruchomości",
        street: "ul. Przykładowa 12/3",
        postal_code: "00-001",
        city: "Warszawa",
        country: "Polska",
        phone: "+48 600 100 200",
        email: "kontakt@biurodemo.pl",
        nip: "1234567890",
        www: "https://biurodemo.pl",
      },
      sellers: [
        {
          key: "firma",
          name: "Biuro Demo Nieruchomości sp. z o.o.",
          address: "ul. Przykładowa 12/3",
          city: "Warszawa",
          postcode: "00-001",
          nip: "1234567890",
          bank: "Przykładowy Bank",
          account: "00 0000 0000 0000 0000 0000 0000",
          brand: true,
        },
      ],
    },
    { onConflict: "agency_id" },
  );

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
    dzialania: iloscDzialan,
    cele: (zapisaneCele.data ?? []).length,
    wpisyDziennika: iloscDziennika,
    leady: iloscLeadow,
    poszukiwania: iloscPoszukiwan,
    faktury: iloscFaktur,
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
export async function utworzZespolDemo(
  agencyId: string,
): Promise<{ utworzonych: number; usunietych: number; pominietych: string[] }> {
  const admin = createSupabaseAdmin();

  const { data: istniejace } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("agency_id", agencyId);

  const chcianeNazwiska = new Set(ZESPOL.map((os) => `${os.imie} ${os.nazwisko}`));

  // Sprzątamy konta demo, których nie ma już w składzie. Dzięki temu zmiana
  // listy nazwisk w kodzie przebudowuje zespół, zamiast dokładać ludzi obok
  // starych. Ruszamy WYŁĄCZNIE adresy @demo.agentspace.pl, więc prawdziwe
  // konta są bezpieczne.
  let usunietych = 0;
  for (const p of istniejace ?? []) {
    const email = (p.email ?? "") as string;
    const imie = ((p.full_name ?? "") as string).trim();
    if (!email.endsWith("@demo.agentspace.pl")) continue;
    if (chcianeNazwiska.has(imie)) continue;

    await admin.from("profiles").delete().eq("id", p.id);
    await admin.auth.admin.deleteUser(p.id as string).catch(() => {});
    usunietych++;
  }

  const juzSa = new Set(
    (istniejace ?? [])
      .filter((p) => chcianeNazwiska.has(((p.full_name ?? "") as string).trim()))
      .map((p) => ((p.full_name ?? "") as string).trim()),
  );

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

  return { utworzonych, usunietych, pominietych };
}
