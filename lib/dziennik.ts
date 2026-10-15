import { createSupabaseAdmin } from "./supabase/admin";

/**
 * Dziennik zdarzeń biura (audyt).
 *
 * Odpowiada na pytanie, które właściciel zadaje zawsze po fakcie: kto usunął
 * tego klienta, kto obniżył cenę, kto przepisał ofertę na siebie. Bez dziennika
 * jedyną odpowiedzią jest „nie wiadomo".
 *
 * Zapisujemy opis czynności, a nie kopię danych: dziennik nie ma się stać
 * drugą bazą danych osobowych. Nigdy nie rzuca.
 */

export type Zdarzenie = {
  agencyId: string;
  actorId: string | null;
  akcja: string;
  rodzaj?: "klient" | "oferta" | "transakcja" | "faktura" | "koszt" | "osoba" | "dokument" | "automatyzacja" | "eksport" | "ustawienia" | "lead" | "poszukiwanie";
  id?: string | null;
  opis: string;
  meta?: Record<string, unknown>;
};

export async function zapiszZdarzenie(z: Zdarzenie): Promise<void> {
  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from("audit_log").insert({
      agency_id: z.agencyId,
      actor_id: z.actorId,
      action: z.akcja,
      entity_type: z.rodzaj ?? null,
      entity_id: z.id ?? null,
      summary: z.opis.slice(0, 400),
      meta: z.meta ?? null,
    });
    if (error && !/audit_log/.test(error.message)) console.error("dziennik:", error.message);
  } catch (err) {
    console.error("dziennik:", err);
  }
}
