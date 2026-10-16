import { createSupabaseAdmin } from "./supabase/admin";
import { todayPL } from "./datetime";
import { ocenKlienta, type EtapKlienta, type Ocena, type SygnalyKlienta } from "./priorytety";
import type { Client } from "./types";

export type SprawaDnia = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: string;
  status: EtapKlienta;
  budget_pln: number | null;
  property: string | null;
  city: string | null;
  next_contact_at: string | null;
  last_contact_at: string | null;
  ostatniaNotatka: { tresc: string; kiedy: string } | null;
  spotkanieNajblizsze: string | null;
  oferta: { id: string; title: string } | null;
  transakcjaId: string | null;
  ocena: Ocena;
};

const AKTYWNE = "(zamkniety,stracony)";

/**
 * Sprawy na dziś dla jednej osoby: aktywni klienci ocenieni po etapie,
 * historii kontaktu, spotkaniach i transakcjach, posortowani od najpilniejszej.
 */
export async function priorytetyDnia(userId: string, limit = 8): Promise<{ sprawy: SprawaDnia[]; aktywnych: number }> {
  const admin = createSupabaseAdmin();
  const { data: klienciRaw } = await admin
    .from("clients")
    .select("*")
    .eq("agent_id", userId)
    .not("status", "in", AKTYWNE)
    .order("updated_at", { ascending: false })
    .limit(400);
  const klienci = (klienciRaw ?? []) as Client[];
  if (klienci.length === 0) return { sprawy: [], aktywnych: 0 };

  const ids = klienci.map((c) => c.id);
  const teraz = new Date().toISOString();
  const [notatki, dzialania, oferty, transakcje] = await Promise.all([
    admin.from("client_notes").select("client_id, content, created_at").in("client_id", ids).order("created_at", { ascending: false }).limit(3000),
    admin.from("activities").select("client_id, kind, status, due_at, started_at").in("client_id", ids).neq("status", "anulowane").limit(3000),
    admin.from("properties").select("id, title, owner_client_id, status").in("owner_client_id", ids).neq("status", "archiwum"),
    admin.from("deals").select("id, client_id, expected_close").in("client_id", ids).eq("status", "w_toku"),
  ]);

  const poKliencie = <T extends { client_id?: string | null; owner_client_id?: string | null }>(rows: T[] | null, pole: "client_id" | "owner_client_id") => {
    const m = new Map<string, T[]>();
    for (const r of rows ?? []) {
      const k = r[pole];
      if (!k) continue;
      const l = m.get(k);
      if (l) l.push(r);
      else m.set(k, [r]);
    }
    return m;
  };
  const notatkiM = poKliencie(notatki.data as { client_id: string; content: string; created_at: string }[] | null, "client_id");
  const dzialaniaM = poKliencie(dzialania.data as { client_id: string; kind: string; status: string; due_at: string | null; started_at: string | null }[] | null, "client_id");
  const ofertyM = poKliencie(oferty.data as { id: string; title: string; owner_client_id: string }[] | null, "owner_client_id");
  const transakcjeM = poKliencie(transakcje.data as { id: string; client_id: string; expected_close: string | null }[] | null, "client_id");

  const dzis = todayPL();
  const sprawy = klienci.map((c): SprawaDnia => {
    const n = notatkiM.get(c.id) ?? [];
    const d = dzialaniaM.get(c.id) ?? [];
    const o = ofertyM.get(c.id) ?? [];
    const t = transakcjeM.get(c.id) ?? [];
    const kiedy = (a: { due_at: string | null; started_at: string | null }) => a.due_at ?? a.started_at;
    const przyszleSpotkania = d
      .filter((a) => a.kind === "spotkanie" && a.status === "zaplanowane" && (kiedy(a) ?? "") >= `${dzis}T00:00`)
      .map((a) => kiedy(a) as string)
      .sort();
    const sygnaly: SygnalyKlienta = {
      status: c.status as EtapKlienta,
      type: c.type,
      budget_pln: c.budget_pln,
      phone: c.phone,
      email: c.email,
      next_contact_at: c.next_contact_at,
      last_contact_at: c.last_contact_at,
      created_at: c.created_at,
      notatek: n.length,
      polaczenWykonanych: d.filter((a) => a.kind === "polaczenie" && a.status === "wykonane").length,
      spotkanWykonanych: d.filter((a) => a.kind === "spotkanie" && (a.status === "wykonane" || (kiedy(a) ?? teraz) < teraz)).length,
      spotkanieNajblizsze: przyszleSpotkania[0] ?? null,
      ofert: o.length,
      transakcjaWToku: t.length > 0,
      transakcjaTermin: t.find((x) => x.expected_close)?.expected_close ?? null,
    };
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      type: c.type,
      status: c.status as EtapKlienta,
      budget_pln: c.budget_pln,
      property: c.property,
      city: c.city,
      next_contact_at: c.next_contact_at,
      last_contact_at: c.last_contact_at,
      ostatniaNotatka: n[0] ? { tresc: n[0].content.slice(0, 280), kiedy: n[0].created_at } : null,
      spotkanieNajblizsze: sygnaly.spotkanieNajblizsze,
      oferta: o[0] ? { id: o[0].id, title: o[0].title } : null,
      transakcjaId: t[0]?.id ?? null,
      ocena: ocenKlienta(sygnaly, dzis),
    };
  });

  sprawy.sort((a, b) => b.ocena.pilnosc - a.ocena.pilnosc);
  return { sprawy: sprawy.slice(0, limit), aktywnych: klienci.length };
}
