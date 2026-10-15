import { createSupabaseAdmin } from "./supabase/admin";
import { uruchomAutomatyzacje } from "./automatyzacje";
import { zapiszZdarzenie } from "./dziennik";
import { getAgencySettings, matchTolerance } from "./agency-settings";
import { getActiveSearches } from "./data-searches";
import { findSearchesForProperty } from "./matching";
import { CLIENT_STATUSES, PROCESS_STAGES, type Property } from "./types";

/**
 * Jedno miejsce, w którym zdarzenie w CRM uruchamia wszystko, co ma się
 * po nim stać: wpis w dzienniku, automatyzacje biura, powiadomienia.
 *
 * Akcje serwera wołają te funkcje po udanym zapisie. Dzięki temu dodanie
 * kolejnej reakcji na „klient wszedł w negocjacje" to zmiana tutaj, a nie
 * w pięciu miejscach, z których jedno zawsze zostanie pominięte.
 * Żadna z funkcji nie rzuca.
 */

type Kto = { id: string; agency_id: string | null };

const etykietaStatusu = (s: string) => CLIENT_STATUSES.find((x) => x.value === s)?.label ?? s;
const etykietaEtapu = (s: string) => PROCESS_STAGES.find((x) => x.value === s)?.label ?? s;

export async function poNowymKliencie(user: Kto, klientId: string, nazwa?: string | null): Promise<void> {
  if (!user.agency_id) return;
  await zapiszZdarzenie({
    agencyId: user.agency_id,
    actorId: user.id,
    akcja: "nowy_klient",
    rodzaj: "klient",
    id: klientId,
    opis: `Dodano klienta${nazwa ? ` „${nazwa}"` : ""}`,
  });
  await uruchomAutomatyzacje(user.agency_id, { zdarzenie: "nowy_klient", klientId, autorId: user.id });
}

export async function poZmianieStatusuKlienta(
  user: Kto,
  klientId: string,
  status: string,
  nazwa?: string | null,
): Promise<void> {
  if (!user.agency_id) return;
  await zapiszZdarzenie({
    agencyId: user.agency_id,
    actorId: user.id,
    akcja: "status_klienta",
    rodzaj: "klient",
    id: klientId,
    opis: `${nazwa ? `„${nazwa}": ` : ""}status zmieniony na „${etykietaStatusu(status)}"`,
  });
  await uruchomAutomatyzacje(user.agency_id, {
    zdarzenie: "zmiana_statusu_klienta",
    klientId,
    statusKlienta: status,
    autorId: user.id,
  });
}

/**
 * Nowa oferta: reguły „nowa oferta" i, osobno dla każdego poszukiwania,
 * reguły „oferta pasuje do poszukiwania". Bierzemy tylko pełne trafienia,
 * nie „prawie pasuje": powiadomienie o ofercie za drogiej o 9% to szum.
 */
export async function poNowejOfercie(user: Kto, ofertaId: string): Promise<void> {
  if (!user.agency_id) return;
  const agencyId = user.agency_id;
  try {
    const admin = createSupabaseAdmin();
    const { data: oferta } = await admin.from("properties").select("*").eq("id", ofertaId).maybeSingle();
    if (!oferta) return;
    await zapiszZdarzenie({
      agencyId,
      actorId: user.id,
      akcja: "nowa_oferta",
      rodzaj: "oferta",
      id: ofertaId,
      opis: `Dodano ofertę „${oferta.title ?? "bez tytułu"}"`,
    });
    await uruchomAutomatyzacje(agencyId, { zdarzenie: "nowa_oferta", ofertaId, autorId: user.id });

    const [poszukiwania, ustawienia] = await Promise.all([
      getActiveSearches(agencyId),
      getAgencySettings(agencyId),
    ]);
    const trafienia = findSearchesForProperty(oferta as Property, poszukiwania, matchTolerance(ustawienia))
      .filter(({ match }) => match.fits)
      .slice(0, 30);
    for (const { search } of trafienia) {
      await uruchomAutomatyzacje(agencyId, {
        zdarzenie: "oferta_pasuje_do_poszukiwania",
        ofertaId,
        klientId: search.client_id ?? null,
        poszukiwanieId: search.id,
        // Powiadomić trzeba opiekuna kupującego, a nie opiekuna oferty.
        opiekunId: search.agent_id ?? null,
        autorId: user.id,
      });
    }
  } catch (err) {
    console.error("poNowejOfercie:", err);
  }
}

export async function poZmianieEtapuOferty(user: Kto, ofertaId: string, etap: string, tytul?: string | null): Promise<void> {
  if (!user.agency_id) return;
  await zapiszZdarzenie({
    agencyId: user.agency_id,
    actorId: user.id,
    akcja: "etap_oferty",
    rodzaj: "oferta",
    id: ofertaId,
    opis: `${tytul ? `„${tytul}": ` : ""}etap zmieniony na „${etykietaEtapu(etap)}"`,
  });
  await uruchomAutomatyzacje(user.agency_id, {
    zdarzenie: "zmiana_etapu_oferty",
    ofertaId,
    etapOferty: etap,
    autorId: user.id,
  });
}

/** Działanie oznaczone jako wykonane: jeśli to prezentacja, odpalamy reguły. */
export async function poWykonanymDzialaniu(user: Kto, dzialanieId: string): Promise<void> {
  if (!user.agency_id) return;
  try {
    const admin = createSupabaseAdmin();
    const { data: d } = await admin
      .from("activities")
      .select("purpose, status, property_id, client_id, completed_at")
      .eq("id", dzialanieId)
      .eq("agency_id", user.agency_id)
      .maybeSingle();
    if (!d || d.status !== "wykonane" || d.purpose !== "prezentacja" || !d.property_id) return;
    await uruchomAutomatyzacje(
      user.agency_id,
      {
        zdarzenie: "prezentacja_wykonana",
        ofertaId: d.property_id,
        klientId: d.client_id ?? null,
        autorId: user.id,
      },
      dzialanieId,
    );
  } catch (err) {
    console.error("poWykonanymDzialaniu:", err);
  }
}

export async function poNowymLeadzie(agencyId: string, leadId: string, autorId?: string | null): Promise<void> {
  await uruchomAutomatyzacje(agencyId, { zdarzenie: "nowy_lead", leadId, autorId: autorId ?? null });
}

export async function poZamknieciuTransakcji(user: Kto, transakcjaId: string, tytul?: string | null): Promise<void> {
  if (!user.agency_id) return;
  await zapiszZdarzenie({
    agencyId: user.agency_id,
    actorId: user.id,
    akcja: "transakcja_zamknieta",
    rodzaj: "transakcja",
    id: transakcjaId,
    opis: `Zamknięto transakcję${tytul ? ` „${tytul}"` : ""}`,
  });
  await uruchomAutomatyzacje(user.agency_id, {
    zdarzenie: "transakcja_zamknieta",
    transakcjaId,
    autorId: user.id,
  });
}
