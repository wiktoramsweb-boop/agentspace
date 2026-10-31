import { Resend } from "resend";
import { gosciaBlokujemy } from "./demo/straz";
import { createSupabaseAdmin } from "./supabase/admin";
import { escapeHtml } from "./html";
import { formatPln } from "./format";
import { oprawaMaila } from "./mail";
import { APP_URL } from "./supabase/config";
import { oddzialOsob, oddzialyBiura } from "./oddzialy";

/**
 * „Tydzień w biurze”: poniedziałkowy mail dla właściciela.
 *
 * Właściciel większego biura nie przegląda modułów po kolei. Ten mail ma dać
 * w dwie minuty odpowiedź na trzy pytania: ile zarobiliśmy, czy zespół
 * pracował i co się pali. Dlatego lista „wymaga uwagi” jest na górze,
 * a liczby niżej.
 */

type Osoba = { id: string; full_name: string | null; role: string };

export type TydzienBiura = {
  od: string;
  prowizjeTydzien: number;
  transakcjeZamkniete: number;
  transakcjeWToku: number;
  noweLeady: number;
  leadyBezTelefonu: number;
  leadyBezOpiekuna: number;
  noweOferty: number;
  ludzie: { id: string; imie: string; telefony: number; prezentacje: number; prowizje: number }[];
  bezAktywnosci: string[];
  kredytyWToku: number;
  kredytyStoja: number;
  wiadomosciBezOdpowiedzi: number;
  /** Wyniki oddziałów (tylko w wersji dla całego biura, gdy biuro ma oddziały). */
  oddzialy: { nazwa: string; telefony: number; prezentacje: number; prowizje: number }[];
};

const DZIEN = 86_400_000;

/** `tylko`: wersja dla kierownika oddziału, liczona wyłącznie z tych osób. */
export async function tydzienBiura(agencyId: string, now = new Date(), tylko?: string[]): Promise<TydzienBiura> {
  const admin = createSupabaseAdmin();
  const od = new Date(now.getTime() - 7 * DZIEN).toISOString();
  const dobaTemu = new Date(now.getTime() - DZIEN).toISOString();

  const [prof, dzialania, zamkniete, wToku, leady, oferty, kredyty, dostepy] = await Promise.all([
    admin.from("profiles").select("id, full_name, role").eq("agency_id", agencyId),
    admin.from("activities").select("kind, assignee_ids, created_by").eq("agency_id", agencyId).eq("status", "wykonane").gte("completed_at", od).limit(5000),
    admin.from("deals").select("agent_id, commission_pln").eq("agency_id", agencyId).eq("status", "zamkniety").gte("closed_at", od),
    admin.from("deals").select("agent_id").eq("agency_id", agencyId).eq("status", "w_toku").limit(1000),
    admin.from("leads").select("agent_id, status, created_at").eq("agency_id", agencyId).gte("created_at", new Date(now.getTime() - 30 * DZIEN).toISOString()).limit(5000),
    admin.from("properties").select("agent_id").eq("agency_id", agencyId).gte("created_at", od).limit(1000),
    // Bez migracji v53 zapytanie zwraca błąd: wtedy po prostu zero spraw.
    admin.from("credit_cases").select("stage, updated_at").eq("agency_id", agencyId).limit(1000),
    admin.from("client_portal_access").select("id").eq("agency_id", agencyId).is("revoked_at", null).limit(1000),
  ]);

  const wZakresie = (id: string | null | undefined) => !tylko || (id != null && tylko.includes(id));
  const zespol = ((prof.data ?? []) as Osoba[]).filter((p) => !["credit_advisor", "rental_manager"].includes(p.role) && wZakresie(p.id));
  const ludzie = new Map(zespol.map((p) => [p.id, { id: p.id, imie: p.full_name ?? "Osoba", telefony: 0, prezentacje: 0, prowizje: 0 }]));

  for (const a of (dzialania.data ?? []) as { kind: string; assignee_ids: string[] | null; created_by: string | null }[]) {
    const kto = a.assignee_ids?.length ? a.assignee_ids : a.created_by ? [a.created_by] : [];
    for (const id of kto) {
      const l = ludzie.get(id);
      if (!l) continue;
      if (a.kind === "polaczenie") l.telefony++;
      if (a.kind === "spotkanie") l.prezentacje++;
    }
  }
  let prowizjeTydzien = 0;
  const zamknieteW = ((zamkniete.data ?? []) as { agent_id: string | null; commission_pln: number | null }[]).filter((d) => wZakresie(d.agent_id));
  for (const d of zamknieteW) {
    prowizjeTydzien += d.commission_pln ?? 0;
    const l = d.agent_id ? ludzie.get(d.agent_id) : undefined;
    if (l) l.prowizje += d.commission_pln ?? 0;
  }

  const listaLeadow = ((leady.data ?? []) as { agent_id: string | null; status: string; created_at: string }[]).filter((l) => wZakresie(l.agent_id));
  // Kredyty i portal liczymy tylko dla całego biura: nie mają przypisania do oddziału.
  const kredytyLista = kredyty.error || tylko ? [] : ((kredyty.data ?? []) as { stage: string; updated_at: string }[]);
  const aktywne = kredytyLista.filter((k) => k.stage !== "umowa" && k.stage !== "odrzucone");

  // Wątek czeka na biuro, gdy ostatnie słowo należy do klienta i minęła doba.
  let wiadomosciBezOdpowiedzi = 0;
  const idDostepow = ((dostepy.data ?? []) as { id: string }[]).map((d) => d.id);
  if (idDostepow.length && !tylko) {
    const { data: wiad } = await admin
      .from("client_portal_messages")
      .select("access_id, autor, created_at")
      .in("access_id", idDostepow)
      .gte("created_at", new Date(now.getTime() - 30 * DZIEN).toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);
    const ostatnia = new Map<string, { autor: string; created_at: string }>();
    for (const m of (wiad ?? []) as { access_id: string; autor: string; created_at: string }[]) {
      if (!ostatnia.has(m.access_id)) ostatnia.set(m.access_id, m);
    }
    wiadomosciBezOdpowiedzi = [...ostatnia.values()].filter((m) => m.autor === "klient" && m.created_at < dobaTemu).length;
  }

  const oddzialyWyniki: TydzienBiura["oddzialy"] = [];
  if (!tylko) {
    const { lista: oddz } = await oddzialyBiura(agencyId);
    if (oddz.length) {
      const gdzie = await oddzialOsob(agencyId);
      for (const o of oddz) {
        const os = [...ludzie.values()].filter((l) => gdzie.get(l.id) === o.id);
        oddzialyWyniki.push({
          nazwa: o.name,
          telefony: os.reduce((a, l) => a + l.telefony, 0),
          prezentacje: os.reduce((a, l) => a + l.prezentacje, 0),
          prowizje: os.reduce((a, l) => a + l.prowizje, 0),
        });
      }
    }
  }

  const lista = [...ludzie.values()].sort((a, b) => b.prowizje - a.prowizje || b.telefony + b.prezentacje - (a.telefony + a.prezentacje));
  return {
    od,
    prowizjeTydzien,
    transakcjeZamkniete: zamknieteW.length,
    transakcjeWToku: ((wToku.data ?? []) as { agent_id: string | null }[]).filter((d) => wZakresie(d.agent_id)).length,
    noweLeady: listaLeadow.filter((l) => l.created_at >= od).length,
    leadyBezTelefonu: listaLeadow.filter((l) => l.status === "nowy" && l.created_at < dobaTemu).length,
    leadyBezOpiekuna: listaLeadow.filter((l) => !l.agent_id && l.status === "nowy").length,
    noweOferty: ((oferty.data ?? []) as { agent_id: string | null }[]).filter((o) => wZakresie(o.agent_id)).length,
    ludzie: lista,
    bezAktywnosci: lista.filter((l) => l.telefony + l.prezentacje === 0 && zespol.find((p) => p.id === l.id)?.role !== "owner").map((l) => l.imie),
    kredytyWToku: aktywne.length,
    kredytyStoja: aktywne.filter((k) => k.updated_at < od).length,
    wiadomosciBezOdpowiedzi,
    oddzialy: oddzialyWyniki,
  };
}

/** 1 lead, 3 leady, 5 leadów. */
function ile(n: number, [jeden, kilka, wiele]: [string, string, string]): string {
  const d = n % 10, s = n % 100;
  return `${n} ${n === 1 ? jeden : d >= 2 && d <= 4 && (s < 12 || s > 14) ? kilka : wiele}`;
}

/** Punkty „wymaga uwagi” z linkiem tam, gdzie się to załatwia. */
export function doUwagi(t: TydzienBiura): { tekst: string; href: string }[] {
  const out: { tekst: string; href: string }[] = [];
  if (t.leadyBezTelefonu) out.push({ tekst: `${ile(t.leadyBezTelefonu, ["lead czeka", "leady czekają", "leadów czeka"])} ponad dobę na pierwszy telefon`, href: "/app/leady" });
  if (t.leadyBezOpiekuna) out.push({ tekst: `${ile(t.leadyBezOpiekuna, ["nowy lead nie ma", "nowe leady nie mają", "nowych leadów nie ma"])} opiekuna`, href: "/app/leady" });
  if (t.wiadomosciBezOdpowiedzi) out.push({ tekst: `${ile(t.wiadomosciBezOdpowiedzi, ["klient czeka", "klientów czeka", "klientów czeka"])} ponad dobę na odpowiedź w portalu`, href: "/app/wiadomosci" });
  if (t.kredytyStoja) out.push({ tekst: `${ile(t.kredytyStoja, ["sprawa kredytowa", "sprawy kredytowe", "spraw kredytowych"])} bez ruchu od tygodnia`, href: "/app/kredyty" });
  if (t.bezAktywnosci.length) out.push({ tekst: `Bez telefonu i prezentacji w tym tygodniu: ${t.bezAktywnosci.join(", ")}`, href: "/app/zespol" });
  return out;
}

function html(nazwa: string, t: TydzienBiura, oddzial = false): string {
  const fmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });
  const okres = `${fmt.format(new Date(t.od))} – ${fmt.format(new Date())}`;
  const uwaga = doUwagi(t);
  const kafel = (etykieta: string, wartosc: string) =>
    `<td style="padding:12px;background:#f4f4f5;border-radius:8px;vertical-align:top;"><div style="font-size:12px;color:#71717a;">${etykieta}</div><div style="font-size:20px;font-weight:600;">${wartosc}</div></td>`;
  const odstep = `<td style="width:10px;"></td>`;

  return oprawaMaila(`
    <div style="font-family:-apple-system,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b;">
      <h1 style="font-size:22px;margin:0 0 4px;">${oddzial ? "Tydzień w oddziale" : "Tydzień w biurze"}: ${escapeHtml(nazwa)}</h1>
      <p style="color:#71717a;margin:0 0 20px;">${okres}</p>

      ${
        uwaga.length
          ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <strong style="color:#92400e;">Wymaga uwagi</strong>
        <ul style="margin:8px 0 0;padding-left:18px;color:#78350f;line-height:1.6;">
          ${uwaga.map((u) => `<li><a href="${APP_URL}${u.href}" style="color:#78350f;">${escapeHtml(u.tekst)}</a></li>`).join("")}
        </ul>
      </div>`
          : `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;margin-bottom:20px;color:#065f46;">Nic się nie pali: leady obdzwonione, klienci w portalu mają odpowiedzi.</div>`
      }

      <table style="width:100%;border-collapse:collapse;margin-bottom:10px;"><tr>
        ${kafel("Prowizje z tygodnia", formatPln(t.prowizjeTydzien))}${odstep}${kafel("Zamknięte transakcje", String(t.transakcjeZamkniete))}${odstep}${kafel("Transakcje w toku", String(t.transakcjeWToku))}
      </tr></table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:22px;"><tr>
        ${kafel("Nowe leady", String(t.noweLeady))}${odstep}${kafel("Nowe oferty", String(t.noweOferty))}${odstep}${kafel("Kredyty w toku", String(t.kredytyWToku))}
      </tr></table>

      ${
        t.oddzialy.length
          ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:22px;">
        <tr style="color:#71717a;font-size:12px;text-align:left;">
          <th style="padding:6px 0;font-weight:500;">Oddział</th><th style="padding:6px 0;font-weight:500;text-align:right;">Telefony</th><th style="padding:6px 0;font-weight:500;text-align:right;">Prezentacje</th><th style="padding:6px 0;font-weight:500;text-align:right;">Prowizje</th>
        </tr>
        ${t.oddzialy.map((o) => `<tr style="border-top:1px solid #e4e4e7;"><td style="padding:8px 0;font-weight:600;">${escapeHtml(o.nazwa)}</td><td style="text-align:right;">${o.telefony}</td><td style="text-align:right;">${o.prezentacje}</td><td style="text-align:right;">${o.prowizje ? formatPln(o.prowizje) : "–"}</td></tr>`).join("")}
      </table>`
          : ""
      }

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="color:#71717a;font-size:12px;text-align:left;">
          <th style="padding:6px 0;font-weight:500;">Osoba</th><th style="padding:6px 0;font-weight:500;text-align:right;">Telefony</th><th style="padding:6px 0;font-weight:500;text-align:right;">Prezentacje</th><th style="padding:6px 0;font-weight:500;text-align:right;">Prowizje</th>
        </tr>
        ${t.ludzie
          .map(
            (l) =>
              `<tr style="border-top:1px solid #e4e4e7;"><td style="padding:8px 0;">${escapeHtml(l.imie)}</td><td style="text-align:right;">${l.telefony}</td><td style="text-align:right;">${l.prezentacje}</td><td style="text-align:right;">${l.prowizje ? formatPln(l.prowizje) : "–"}</td></tr>`,
          )
          .join("")}
      </table>

      <p style="margin-top:26px;">
        <a href="${APP_URL}/app/raporty" style="background:#10b981;color:#09090b;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:600;">Otwórz raporty</a>
      </p>
      <p style="color:#a1a1aa;font-size:12px;margin-top:22px;">AgentSpace · wysyłamy co poniedziałek rano do ${oddzial ? "kierownika oddziału" : "właściciela biura"}.</p>
    </div>`);
}

/**
 * Wysyła mail do właścicieli biura, a kierownikom oddziałów wersję ich
 * oddziału. `tylkoDo`: podgląd na jeden adres, tylko wersja dla biura.
 * Zwraca liczbę wysłanych.
 */
export async function wyslijTydzienBiura(agencyId: string, tylkoDo?: string): Promise<number> {
  const key = process.env.RESEND_API_KEY;
  if (!key || (await gosciaBlokujemy())) return 0;
  const admin = createSupabaseAdmin();
  const { data: ag } = await admin.from("agencies").select("name, is_demo").eq("id", agencyId).maybeSingle();
  if (!ag || (ag.is_demo && !tylkoDo)) return 0;
  const { data: prof } = await admin.from("profiles").select("id, email, role").eq("agency_id", agencyId);
  const osoby = (prof ?? []) as { id: string; email: string | null; role: string }[];
  const adresy = tylkoDo ? [tylkoDo] : osoby.filter((o) => o.role === "owner").map((o) => o.email).filter((e): e is string => Boolean(e));

  const resend = new Resend(key);
  const nadawca = process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>";
  const temat = (prefiks: string, nazwa: string, t: TydzienBiura) =>
    `${prefiks}: ${nazwa}${doUwagi(t).length ? ` · ${ile(doUwagi(t).length, ["sprawa", "sprawy", "spraw"])} do uwagi` : ""}`;
  let wyslane = 0;

  if (adresy.length) {
    const t = await tydzienBiura(agencyId);
    for (const to of adresy) {
      const { error } = await resend.emails.send({ from: nadawca, to, subject: temat("Tydzień w biurze", ag.name as string, t), html: html(ag.name as string, t) });
      if (!error) wyslane++;
    }
  }
  if (tylkoDo) return wyslane;

  const { lista: oddzialy } = await oddzialyBiura(agencyId);
  const gdzie = oddzialy.length ? await oddzialOsob(agencyId) : new Map<string, string | null>();
  for (const o of oddzialy) {
    const kierownik = osoby.find((p) => p.id === o.manager_id);
    // Właściciel dostaje już pełną wersję, nie dublujemy mu skrzynki.
    if (!kierownik?.email || kierownik.role === "owner") continue;
    const ids = osoby.filter((p) => gdzie.get(p.id) === o.id).map((p) => p.id);
    if (!ids.length) continue;
    const t = await tydzienBiura(agencyId, new Date(), ids);
    const { error } = await resend.emails.send({ from: nadawca, to: kierownik.email, subject: temat("Tydzień w oddziale", o.name, t), html: html(o.name, t, true) });
    if (!error) wyslane++;
  }
  return wyslane;
}
