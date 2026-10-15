import { createSupabaseAdmin } from "./supabase/admin";
import { maV49 } from "./schemat";
import { todayPL, warsawToIso, addDaysKey } from "./datetime";
import { powiadom } from "./powiadomienia";
import { wyslijMail } from "./mail";
import { wyslijMailBiura } from "./poczta-biura";
import { nieobecnosciWDniu } from "./zastepstwa";
import { rozwinZastepce, type Nieobecnosc } from "./zastepstwa-model";
import {
  kluczZdarzenia,
  spelniaWarunki,
  terminZadania,
  wypelnij,
  ZDARZENIA_CZASOWE,
  type Akcja,
  type Kontekst,
  type Odbiorca,
  type WarunkiReguly,
  type Zdarzenie,
} from "./automatyzacje-model";
import { adresZMiastem } from "./adres";

/**
 * Silnik automatyzacji. Opis reguł i warunków w `automatyzacje-model.ts`.
 *
 * Zasady wykonania:
 *  - nigdy nie rzuca: reguła, która się wywróci, nie może zablokować zapisu
 *    klienta czy oferty, który ją wywołał,
 *  - każda reguła działa raz na zdarzenie (tabela automation_runs z unikalnym
 *    kluczem), więc ponowny zapis tego samego nie mnoży zadań,
 *  - zmiany zrobione przez automatyzację nie odpalają kolejnych automatyzacji,
 *    żeby dwie reguły nie przerzucały klienta między statusami w kółko,
 *  - zadanie dla osoby na urlopie dostaje jej zastępca.
 */

type Regula = {
  id: string;
  agency_id: string;
  name: string;
  trigger: Zdarzenie;
  trigger_config: WarunkiReguly;
  actions: Akcja[];
  created_by: string | null;
  runs_count: number;
};

type Admin = ReturnType<typeof createSupabaseAdmin>;

type Osoba = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  manager_id: string | null;
  phone: string | null;
};

type Srodowisko = {
  admin: Admin;
  agencyId: string;
  nazwaBiura: string | null;
  nieobecnosci: Nieobecnosc[];
  ludzie: Map<string, Osoba>;
};

/** Wynik jednej akcji: czy się udała i co zrobiła, do dziennika reguły. */
type WynikAkcji = { ok: boolean; opis: string };
const ok = (opis: string): WynikAkcji => ({ ok: true, opis });
const nie = (opis: string): WynikAkcji => ({ ok: false, opis });

const ZAMKNIETE_KLIENTA = ["zamkniety", "stracony"];

/** Uzupełnia kontekst o dane rekordu: nazwę, opiekuna, status, cenę. */
async function wzbogac(admin: Admin, agencyId: string, k: Kontekst): Promise<Kontekst> {
  const out: Kontekst = { ...k };
  if (k.klientId) {
    const { data: c } = await admin
      .from("clients")
      .select("name, status, type, source, agent_id")
      .eq("id", k.klientId)
      .eq("agency_id", agencyId)
      .maybeSingle();
    if (c) {
      out.nazwaKlienta ??= c.name;
      out.statusKlienta ??= c.status;
      out.typKlienta ??= c.type;
      out.zrodlo ??= c.source;
      out.opiekunId ??= c.agent_id;
    }
  }
  if (k.ofertaId) {
    const { data: p } = await admin
      .from("properties")
      .select("title, address, city, price_pln, deal_kind, process_stage, agent_id")
      .eq("id", k.ofertaId)
      .eq("agency_id", agencyId)
      .maybeSingle();
    if (p) {
      out.nazwaOferty ??= p.title;
      out.adresOferty ??= adresZMiastem(p.address, p.city) || p.title;
      out.nowaCena ??= p.price_pln == null ? null : Number(p.price_pln);
      out.rodzajOferty ??= p.deal_kind;
      out.etapOferty ??= p.process_stage ?? "przyjeta";
      // Przy ofercie opiekunem jest opiekun oferty, chyba że zdarzenie
      // dotyczy klienta (wtedy pierwszeństwo ma opiekun klienta, ustawiony wyżej).
      out.opiekunId ??= p.agent_id;
    }
  }
  if (k.leadId) {
    const { data: l } = await admin
      .from("leads")
      .select("name, source, agent_id")
      .eq("id", k.leadId)
      .eq("agency_id", agencyId)
      .maybeSingle();
    if (l) {
      out.nazwaKlienta ??= l.name;
      out.zrodlo ??= l.source;
      out.opiekunId ??= l.agent_id;
    }
  }
  if (k.transakcjaId) {
    const { data: d } = await admin
      .from("deals")
      .select("title, agent_id, client_id, property_id")
      .eq("id", k.transakcjaId)
      .eq("agency_id", agencyId)
      .maybeSingle();
    if (d) {
      out.nazwaOferty ??= d.title;
      out.opiekunId ??= d.agent_id;
      out.klientId ??= d.client_id;
      out.ofertaId ??= d.property_id;
    }
  }
  return out;
}

async function srodowisko(admin: Admin, agencyId: string): Promise<Srodowisko> {
  const [{ data: ludzie }, { data: biuro }, nieobecnosci] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, role, manager_id, phone").eq("agency_id", agencyId),
    admin.from("agencies").select("name").eq("id", agencyId).maybeSingle(),
    nieobecnosciWDniu(agencyId),
  ]);
  return {
    admin,
    agencyId,
    nazwaBiura: biuro?.name ?? null,
    nieobecnosci,
    ludzie: new Map(((ludzie ?? []) as Osoba[]).map((p) => [p.id, p])),
  };
}

/** Zamienia „opiekun", „CEO" itd. na konkretne osoby, z uwzględnieniem zastępstw. */
function rozwinOdbiorce(o: Odbiorca, k: Kontekst, s: Srodowisko, regula: Regula): string[] {
  const zZastepstwem = (id: string | null | undefined) => {
    const kto = rozwinZastepce(id, s.nieobecnosci);
    return kto && s.ludzie.has(kto) ? [kto] : [];
  };
  switch (o.kto) {
    case "opiekun":
      // Rekord bez opiekuna (pula biura): zadanie idzie do autora reguły,
      // żeby nie zawisło na nikim.
      return zZastepstwem(k.opiekunId ?? regula.created_by);
    case "autor":
      return zZastepstwem(k.autorId ?? regula.created_by);
    case "ceo":
      return [...s.ludzie.values()].filter((p) => p.role === "owner" || p.role === "director").map((p) => p.id);
    case "menedzer_opiekuna": {
      const m = k.opiekunId ? s.ludzie.get(k.opiekunId)?.manager_id : null;
      return zZastepstwem(m);
    }
    case "osoba":
      return zZastepstwem(o.id);
  }
}

function adresRekordu(k: Kontekst): string {
  if (k.klientId) return `/app/klienci/${k.klientId}`;
  if (k.ofertaId) return `/app/nieruchomosci/${k.ofertaId}`;
  if (k.leadId) return `/app/leady`;
  if (k.transakcjaId) return `/app/prowizje/${k.transakcjaId}`;
  return "/app";
}

async function wykonajAkcje(a: Akcja, k: Kontekst, s: Srodowisko, regula: Regula): Promise<WynikAkcji> {
  const { admin, agencyId } = s;
  const agent = k.opiekunId ? s.ludzie.get(k.opiekunId)?.full_name ?? null : null;
  const tekst = (t: string | undefined) => wypelnij(t ?? "", k, { agent, biuro: s.nazwaBiura });

  switch (a.typ) {
    case "zadanie": {
      const [dla] = rozwinOdbiorce(a.dla, k, s, regula);
      if (!dla) return nie("zadanie: brak osoby, której można je dać");
      const termin = terminZadania(todayPL(), a.za_dni, a.godzina);
      let klient: { name: string | null; phone: string | null; email: string | null } | null = null;
      if (k.klientId) {
        const { data } = await admin.from("clients").select("name, phone, email").eq("id", k.klientId).maybeSingle();
        klient = data;
      }
      const tytul = tekst(a.tytul) || "Zadanie z automatyzacji";
      const { error } = await admin.from("activities").insert({
        agency_id: agencyId,
        created_by: regula.created_by ?? dla,
        kind: a.rodzaj === "polaczenie" ? "polaczenie" : "zadanie",
        purpose: a.rodzaj === "polaczenie" ? "rozmowa_aktualizacyjna" : "inne",
        subject: tytul.slice(0, 200),
        description: [tekst(a.opis), `Utworzone automatycznie przez regułę „${regula.name}".`].filter(Boolean).join("\n\n"),
        status: "zaplanowane",
        priority: a.priorytet ?? "normalny",
        due_at: warsawToIso(termin.dzien, termin.godzina),
        client_id: k.klientId ?? null,
        property_id: k.ofertaId ?? null,
        contact_name: klient?.name ?? null,
        contact_phone: klient?.phone ?? null,
        contact_email: klient?.email ?? null,
        assignee_ids: [dla],
        include_in_report: false,
      });
      if (error) return nie(`zadanie: ${error.message}`);
      await powiadom(agencyId, [dla], {
        rodzaj: "zadanie",
        tytul: tytul,
        tresc: `Nowe zadanie na ${termin.dzien === todayPL() ? "dziś" : termin.dzien}. Reguła: ${regula.name}.`,
        adres: adresRekordu(k),
        push: termin.dzien === todayPL(),
      });
      return ok(`zadanie dla: ${s.ludzie.get(dla)?.full_name ?? dla}`);
    }

    case "powiadomienie": {
      const ids = [...new Set(a.dla.flatMap((o) => rozwinOdbiorce(o, k, s, regula)))];
      if (!ids.length) return nie("powiadomienie: brak odbiorców");
      const tytul = tekst(a.tytul) || regula.name;
      const tresc = tekst(a.tresc);
      await powiadom(agencyId, ids, { rodzaj: "automatyzacja", tytul, tresc, adres: adresRekordu(k) });
      if (a.mail) {
        await Promise.all(
          ids.map((id) => {
            const email = s.ludzie.get(id)?.email;
            if (!email) return null;
            return wyslijMail({
              do: email,
              temat: tytul,
              naglowek: tytul,
              akapity: [tresc || `Reguła „${regula.name}" zadziałała.`],
              przycisk: { tekst: "Otwórz w AgentSpace", adres: `https://agentspace.pl${adresRekordu(k)}` },
            });
          }),
        );
      }
      return ok(`powiadomienie do ${ids.length} os.`);
    }

    case "przypisz": {
      const tabela = k.klientId ? "clients" : k.ofertaId ? "properties" : k.leadId ? "leads" : null;
      const id = k.klientId ?? k.ofertaId ?? k.leadId;
      if (!tabela || !id) return nie("przypisz: brak rekordu");
      if (a.tylkoBezOpiekuna && k.opiekunId) return ok("przypisz: rekord ma już opiekuna, bez zmian");
      // Kandydaci obecni dziś w pracy. Gdy wszyscy są na urlopie, bierzemy
      // pełną listę: lepiej przypisać komuś, kto wróci, niż nikomu.
      // Pusta lista w regule znaczy „cały zespół sprzedaży": agenci i menedżerowie.
      // Gdy biuro ich nie ma (jednoosobowe), zostaje właściciel.
      const zespol = [...s.ludzie.values()].filter((p) => p.role === "agent" || p.role === "manager").map((p) => p.id);
      const kandydaci = a.osoby.length
        ? a.osoby
        : zespol.length
          ? zespol
          : [...s.ludzie.values()].filter((p) => p.role === "owner").map((p) => p.id);
      const obecni = kandydaci.filter((o) => s.ludzie.has(o) && !s.nieobecnosci.some((n) => n.agent_id === o));
      const pula = obecni.length ? obecni : kandydaci.filter((o) => s.ludzie.has(o));
      if (!pula.length) return nie("przypisz: brak dostępnych osób");
      const obciazenie = await Promise.all(
        pula.map(async (o) => {
          const { count } = await admin
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("agency_id", agencyId)
            .eq("agent_id", o)
            .not("status", "in", `(${ZAMKNIETE_KLIENTA.join(",")})`);
          return { o, n: count ?? 0 };
        }),
      );
      obciazenie.sort((x, y) => x.n - y.n);
      const wybrany = obciazenie[0].o;
      const { error } = await admin.from(tabela).update({ agent_id: wybrany }).eq("id", id).eq("agency_id", agencyId);
      if (error) return nie(`przypisz: ${error.message}`);
      k.opiekunId = wybrany;
      await powiadom(agencyId, [wybrany], {
        rodzaj: tabela === "leads" ? "lead" : "info",
        tytul: tabela === "leads" ? `Nowy lead dla Ciebie: ${k.nazwaKlienta ?? ""}`.trim() : `Przypisano Ci: ${k.nazwaKlienta ?? k.nazwaOferty ?? "rekord"}`,
        tresc: `Reguła „${regula.name}" wybrała Cię jako osobę z najmniejszą liczbą otwartych spraw.`,
        adres: adresRekordu(k),
        pilne: tabela === "leads",
      });
      return ok(`przypisano: ${s.ludzie.get(wybrany)?.full_name ?? wybrany}`);
    }

    case "status_klienta": {
      if (!k.klientId) return nie("status: brak klienta");
      const { error } = await admin
        .from("clients")
        .update({ status: a.status, updated_at: new Date().toISOString() })
        .eq("id", k.klientId)
        .eq("agency_id", agencyId);
      return error ? nie(`status: ${error.message}`) : ok(`status: ${a.status}`);
    }

    case "etap_oferty": {
      if (!k.ofertaId) return nie("etap: brak oferty");
      const teraz = new Date().toISOString();
      const { error } = await admin
        .from("properties")
        .update({ process_stage: a.etap, process_changed_at: teraz, updated_at: teraz })
        .eq("id", k.ofertaId)
        .eq("agency_id", agencyId);
      return error ? nie(`etap: ${error.message}`) : ok(`etap: ${a.etap}`);
    }

    case "mail_do_klienta": {
      if (!k.klientId) return nie("mail: brak klienta");
      const { data: c } = await admin
        .from("clients")
        .select("email, name, marketing_consent")
        .eq("id", k.klientId)
        .eq("agency_id", agencyId)
        .maybeSingle();
      if (!c?.email) return nie("mail: klient nie ma adresu e-mail");
      if (a.wymagajZgody !== false && !(await maZgodeNaMail(admin, k.klientId, Boolean(c.marketing_consent)))) {
        return nie("mail: brak zgody klienta na kontakt mailowy");
      }
      const opiekun = k.opiekunId ? s.ludzie.get(k.opiekunId) : null;
      const temat = tekst(a.temat);
      const tresc = tekst(a.tresc);
      const wynik = await wyslijMailBiura({
        agencyId,
        agencyName: s.nazwaBiura,
        do: c.email,
        temat,
        tresc,
        odpowiedzDo: opiekun?.email ?? null,
        podpis: { imie: opiekun?.full_name ?? null, telefon: opiekun?.phone ?? null },
      });
      await admin.from("client_messages").insert({
        agency_id: agencyId,
        client_id: k.klientId,
        author_id: opiekun?.id ?? regula.created_by,
        channel: "mail",
        direction: "wyslana",
        subject: temat.slice(0, 300),
        body: tresc.slice(0, 20000),
        sent_at: new Date().toISOString(),
        status: wynik.ok ? "wyslana" : "blad",
        provider_id: wynik.ok ? wynik.id : null,
        error: wynik.ok ? null : wynik.error,
        to_address: c.email,
      });
      return wynik.ok ? ok(`mail wysłany do ${c.email}`) : nie(`mail: ${wynik.error}`);
    }
  }
}

/**
 * Zgoda na kontakt mailowy: najnowszy wpis z rejestru zgód (v49), a gdy
 * rejestru jeszcze nie ma, stare pole `marketing_consent` z karty klienta.
 */
async function maZgodeNaMail(admin: Admin, klientId: string, zgodaZKarty: boolean): Promise<boolean> {
  const { data, error } = await admin
    .from("client_consents")
    .select("granted")
    .eq("client_id", klientId)
    .eq("kind", "marketing_mail")
    .order("recorded_at", { ascending: false })
    .limit(1);
  if (error || !data?.length) return zgodaZKarty;
  return Boolean(data[0].granted);
}

async function wykonajRegule(r: Regula, k: Kontekst, s: Srodowisko, znacznikCzasu?: string | null): Promise<void> {
  const { admin, agencyId } = s;
  const klucz = kluczZdarzenia(k, znacznikCzasu);
  const { data: run, error } = await admin
    .from("automation_runs")
    .insert({
      agency_id: agencyId,
      rule_id: r.id,
      dedupe_key: klucz,
      entity_type: k.klientId ? "klient" : k.ofertaId ? "oferta" : k.leadId ? "lead" : k.transakcjaId ? "transakcja" : null,
      entity_id: k.klientId ?? k.ofertaId ?? k.leadId ?? k.transakcjaId ?? null,
      status: "w_toku",
    })
    .select("id")
    .single();
  // 23505: ta reguła już zadziałała na to zdarzenie.
  if (error || !run) return;

  const wyniki: WynikAkcji[] = [];
  for (const a of r.actions ?? []) {
    try {
      wyniki.push(await wykonajAkcje(a, k, s, r));
    } catch (err) {
      wyniki.push(nie(`${a.typ}: ${err instanceof Error ? err.message : "błąd"}`));
    }
  }
  const blad = wyniki.some((w) => !w.ok);

  await Promise.all([
    admin
      .from("automation_runs")
      .update({ status: blad ? "czesciowo" : "ok", detail: wyniki.map((w) => w.opis).join(" · ").slice(0, 800) })
      .eq("id", run.id),
    admin
      .from("automation_rules")
      .update({ runs_count: (r.runs_count ?? 0) + 1, last_run_at: new Date().toISOString() })
      .eq("id", r.id),
  ]);
}

/**
 * Wywołanie po zdarzeniu w aplikacji. Wołamy po zapisie, nigdy przed.
 * `znacznikCzasu` rozróżnia powtórzenia tego samego zdarzenia, np. klient
 * dwa razy w życiu wchodzący w negocjacje.
 */
export async function uruchomAutomatyzacje(
  agencyId: string | null | undefined,
  kontekst: Kontekst,
  znacznikCzasu?: string | null,
): Promise<void> {
  if (!agencyId || kontekst.zAutomatyzacji) return;
  try {
    if (!(await maV49())) return;
    const admin = createSupabaseAdmin();
    const { data: reguly, error } = await admin
      .from("automation_rules")
      .select("id, agency_id, name, trigger, trigger_config, actions, created_by, runs_count")
      .eq("agency_id", agencyId)
      .eq("enabled", true)
      .eq("trigger", kontekst.zdarzenie);
    if (error || !reguly?.length) return;

    const k = await wzbogac(admin, agencyId, kontekst);
    const pasujace = (reguly as Regula[]).filter((r) => spelniaWarunki(r.trigger_config ?? {}, k));
    if (!pasujace.length) return;

    const s = await srodowisko(admin, agencyId);
    for (const r of pasujace) {
      await wykonajRegule(r, { ...k }, s, znacznikCzasu ?? new Date().toISOString().slice(0, 16));
    }
  } catch (err) {
    console.error("automatyzacje:", err);
  }
}

/**
 * Reguły czasowe, raz dziennie z crona. Klient bez kontaktu od N dni,
 * oferta bez prezentacji od N dni. Klucz zawiera datę ostatniego kontaktu
 * albo ostatniej prezentacji, więc reguła działa raz na „okres ciszy".
 */
export async function uruchomAutomatyzacjeCzasowe(): Promise<{ biur: number; regul: number }> {
  if (!(await maV49())) return { biur: 0, regul: 0 };
  const admin = createSupabaseAdmin();
  const { data: reguly } = await admin
    .from("automation_rules")
    .select("id, agency_id, name, trigger, trigger_config, actions, created_by, runs_count")
    .eq("enabled", true)
    .in("trigger", ZDARZENIA_CZASOWE);
  if (!reguly?.length) return { biur: 0, regul: 0 };

  const poBiurze = new Map<string, Regula[]>();
  for (const r of reguly as Regula[]) {
    poBiurze.set(r.agency_id, [...(poBiurze.get(r.agency_id) ?? []), r]);
  }

  const dzis = todayPL();
  for (const [agencyId, lista] of poBiurze) {
    try {
      const s = await srodowisko(admin, agencyId);
      for (const r of lista) {
        const dni = Math.max(1, Math.round(r.trigger_config?.dni ?? 14));
        const granica = warsawToIso(addDaysKey(dzis, -dni), "00:00") ?? new Date().toISOString();

        if (r.trigger === "klient_bez_kontaktu") {
          let q = admin
            .from("clients")
            .select("id, name, status, type, source, agent_id, last_contact_at, created_at")
            .eq("agency_id", agencyId)
            .not("status", "in", `(${ZAMKNIETE_KLIENTA.join(",")})`)
            .or(`last_contact_at.lt.${granica},and(last_contact_at.is.null,created_at.lt.${granica})`)
            .limit(200);
          if (r.trigger_config?.statusNa?.length) q = q.in("status", r.trigger_config.statusNa);
          const { data: klienci } = await q;
          for (const c of klienci ?? []) {
            const ostatni = (c.last_contact_at ?? c.created_at) as string;
            const k: Kontekst = {
              zdarzenie: "klient_bez_kontaktu",
              klientId: c.id,
              nazwaKlienta: c.name,
              statusKlienta: c.status,
              typKlienta: c.type,
              zrodlo: c.source,
              opiekunId: c.agent_id,
              dni: Math.floor((Date.now() - Date.parse(ostatni)) / 86_400_000),
            };
            if (!spelniaWarunki(r.trigger_config ?? {}, k)) continue;
            await wykonajRegule(r, k, s, ostatni);
          }
        }

        if (r.trigger === "oferta_bez_prezentacji") {
          const { data: oferty } = await admin
            .from("properties")
            .select("id, title, address, city, price_pln, deal_kind, process_stage, agent_id, created_at")
            .eq("agency_id", agencyId)
            .eq("status", "aktywna")
            .lt("created_at", granica)
            .limit(200);
          for (const p of oferty ?? []) {
            const { data: ost } = await admin
              .from("activities")
              .select("completed_at, due_at")
              .eq("agency_id", agencyId)
              .eq("property_id", p.id)
              .eq("purpose", "prezentacja")
              .eq("status", "wykonane")
              .order("completed_at", { ascending: false })
              .limit(1);
            const ostatnia = (ost?.[0]?.completed_at ?? ost?.[0]?.due_at ?? null) as string | null;
            if (ostatnia && ostatnia > granica) continue;
            const k: Kontekst = {
              zdarzenie: "oferta_bez_prezentacji",
              ofertaId: p.id,
              nazwaOferty: p.title,
              adresOferty: adresZMiastem(p.address, p.city) || p.title,
              nowaCena: p.price_pln == null ? null : Number(p.price_pln),
              rodzajOferty: p.deal_kind,
              etapOferty: p.process_stage ?? "przyjeta",
              opiekunId: p.agent_id,
              dni: Math.floor((Date.now() - Date.parse(ostatnia ?? (p.created_at as string))) / 86_400_000),
            };
            if (!spelniaWarunki(r.trigger_config ?? {}, k)) continue;
            await wykonajRegule(r, k, s, ostatnia ?? (p.created_at as string));
          }
        }
      }
    } catch (err) {
      console.error("automatyzacje czasowe:", agencyId, err);
    }
  }
  return { biur: poBiurze.size, regul: reguly.length };
}
