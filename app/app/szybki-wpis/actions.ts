"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { todayPL, warsawToIso, isDateKey } from "@/lib/datetime";
import { poprawnaGodzina } from "@/lib/szybki-wpis";
import type { ClientStatus, ClientType } from "@/lib/types";

export type QuickEntryPayload = {
  clientName: string;
  phone: string;
  email: string;
  clientType: ClientType;
  clientStatus: ClientStatus;
  budget: number | null;
  address: string;
  city: string;
  createProperty: boolean;
  propertyTitle: string;
  propertyArea: number | null;
  propertyRooms: number | null;
  propertyPrice: number | null;
  dealKind: "sprzedaz" | "wynajem";
  meeting: { date: string; time: string; subject: string } | null;
  tasks: { tytul: string; termin: string }[];
  nextContact: string;
  note: string;
  /** Klient z bazy, do którego dopisujemy. null = nowy klient. */
  existingId: string | null;
};

export type WynikWpisu = { ok: true; clientId: string; podsumowanie: string[] } | { ok: false; blad: string };

const KOLEJNOSC: ClientStatus[] = ["nowy", "w_kontakcie", "oglada", "negocjacje", "zamkniety", "stracony"];

/**
 * Zapis szybkiego wpisu: klient (nowy albo istniejący), notatka, nieruchomość,
 * spotkanie w kalendarzu i zadania. Każdy krok sprawdzamy, a na końcu mówimy
 * agentowi dokładnie, co powstało, zamiast cicho przekierować.
 */
export async function createQuickEntry(p: QuickEntryPayload): Promise<WynikWpisu> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, blad: "Konto nie jest przypisane do biura." };
  const name = p.clientName.trim().slice(0, 120);
  if (!name) return { ok: false, blad: "Podaj imię i nazwisko klienta." };

  const admin = createSupabaseAdmin();
  const teraz = new Date().toISOString();
  const dzis = todayPL();
  const nastepny = isDateKey(p.nextContact) ? warsawToIso(p.nextContact, "09:00") : null;
  const podsumowanie: string[] = [];

  let clientId: string;
  if (p.existingId) {
    // Istniejący klient: uzupełniamy tylko puste pola, niczego nie nadpisujemy.
    let q = admin.from("clients").select("id, phone, email, address, city, budget_pln, status").eq("id", p.existingId).eq("agency_id", user.agency_id);
    if (!["owner", "director", "manager"].includes(user.role)) q = q.eq("agent_id", user.id);
    const { data: k } = await q.maybeSingle();
    if (!k) return { ok: false, blad: "Nie znaleziono tego klienta w Twojej bazie. Zapisz jako nowego." };
    const zmiany: Record<string, unknown> = { last_contact_at: teraz, updated_at: teraz };
    if (!k.phone && p.phone.trim()) zmiany.phone = p.phone.trim();
    if (!k.email && p.email.trim()) zmiany.email = p.email.trim();
    if (!k.address && p.address.trim()) zmiany.address = p.address.trim();
    if (!k.city && p.city.trim()) zmiany.city = p.city.trim();
    if (!k.budget_pln && p.budget) zmiany.budget_pln = p.budget;
    // Status tylko do przodu: relacja z kawy nie cofa negocjacji do „w kontakcie”.
    if (KOLEJNOSC.indexOf(p.clientStatus) > KOLEJNOSC.indexOf(k.status as ClientStatus) && KOLEJNOSC.indexOf(k.status as ClientStatus) < 4) zmiany.status = p.clientStatus;
    if (nastepny) zmiany.next_contact_at = nastepny;
    const { error } = await admin.from("clients").update(zmiany).eq("id", k.id);
    if (error) return { ok: false, blad: `Nie udało się zaktualizować klienta: ${error.message}` };
    clientId = k.id as string;
    podsumowanie.push(`Dopisano do klienta ${name}`);
  } else {
    const { data: c, error } = await admin
      .from("clients")
      .insert({
        agent_id: user.id,
        agency_id: user.agency_id,
        name,
        phone: p.phone.trim() || null,
        email: p.email.trim() || null,
        type: p.clientType,
        status: p.clientStatus,
        budget_pln: p.budget,
        address: p.address.trim() || null,
        city: p.city.trim() || null,
        notes: p.note.trim() || null,
        last_contact_at: teraz,
        next_contact_at: nastepny,
      })
      .select("id")
      .single();
    if (error || !c) return { ok: false, blad: `Nie udało się dodać klienta: ${error?.message ?? "brak odpowiedzi"}` };
    clientId = c.id as string;
    podsumowanie.push(`Nowy klient: ${name}`);
  }

  if (p.note.trim()) {
    const { error } = await admin.from("client_notes").insert({ client_id: clientId, agent_id: user.id, content: p.note.trim().slice(0, 4000) });
    if (!error) podsumowanie.push("Notatka w historii klienta");
  }

  let propertyId: string | null = null;
  if (p.createProperty && p.address.trim()) {
    // Ta sama nieruchomość tego klienta nie powstaje drugi raz.
    const { data: jest } = await admin.from("properties").select("id").eq("agency_id", user.agency_id).eq("owner_client_id", clientId).ilike("address", p.address.trim()).limit(1);
    if (jest?.length) {
      propertyId = jest[0].id as string;
    } else {
      const { data: nier, error } = await admin
        .from("properties")
        .insert({
          agent_id: user.id,
          agency_id: user.agency_id,
          title: p.propertyTitle.trim() || `Nieruchomość ${p.address.trim()}`,
          deal_kind: p.dealKind,
          property_type: "mieszkanie",
          status: "aktywna",
          address: p.address.trim(),
          city: p.city.trim() || null,
          area_m2: p.propertyArea,
          rooms: p.propertyRooms,
          price_pln: p.propertyPrice,
          owner_client_id: clientId,
        })
        .select("id")
        .single();
      if (!error && nier) {
        propertyId = nier.id as string;
        podsumowanie.push(`Nieruchomość: ${p.address.trim()}`);
      }
    }
  }

  const dzialania: Record<string, unknown>[] = [];
  if (p.meeting && isDateKey(p.meeting.date)) {
    const godzina = poprawnaGodzina(p.meeting.time);
    dzialania.push({
      agency_id: user.agency_id,
      created_by: user.id,
      kind: "spotkanie",
      subject: p.meeting.subject.trim().slice(0, 160) || "Spotkanie",
      status: "zaplanowane",
      priority: "normalny",
      due_at: warsawToIso(p.meeting.date, godzina ?? "10:00"),
      client_id: clientId,
      property_id: propertyId,
      assignee_ids: [user.id],
      include_in_report: true,
    });
  }
  for (const z of p.tasks.filter((t) => t.tytul.trim()).slice(0, 6)) {
    dzialania.push({
      agency_id: user.agency_id,
      created_by: user.id,
      kind: "zadanie",
      subject: z.tytul.trim().slice(0, 160),
      status: "zaplanowane",
      priority: "normalny",
      due_at: warsawToIso(isDateKey(z.termin) ? z.termin : dzis, "09:00"),
      client_id: clientId,
      property_id: propertyId,
      assignee_ids: [user.id],
      include_in_report: false,
    });
  }
  if (dzialania.length) {
    const { error } = await admin.from("activities").insert(dzialania);
    if (error) podsumowanie.push(`Spotkania i zadania nie zapisały się (${error.message})`);
    else {
      if (p.meeting) podsumowanie.push(`Spotkanie w kalendarzu: ${p.meeting.date.split("-").reverse().join(".")}${p.meeting.time ? ` o ${p.meeting.time}` : ""}`);
      const ileZadan = dzialania.length - (p.meeting ? 1 : 0);
      if (ileZadan) podsumowanie.push(`Zadania: ${ileZadan}`);
    }
  }

  revalidatePath("/app/klienci");
  revalidatePath("/app/nieruchomosci");
  revalidatePath("/app/kalendarz");
  revalidatePath("/app/dzialania");
  revalidatePath("/app");
  return { ok: true, clientId, podsumowanie };
}
