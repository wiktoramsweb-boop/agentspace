import { createSupabaseAdmin } from "./supabase/admin";
import { DOC_BUCKET } from "./storage";
import type { Tryb, TypObiektu } from "./swiadectwa";

export type ZamowienieSwiadectwa = {
  numer: string;
  data: string;
  status: string;
  adres: string;
  typ: TypObiektu;
  tryb: Tryb;
  cena: { netto: number; brutto: number };
  agentId: string;
  agent: string | null;
  propertyId: string | null;
};

/**
 * Zamówienia świadectw biura. Każde zamówienie to folder w Storage
 * (zdjęcia, karta PDF, zamowienie.json), więc funkcja działa bez migracji.
 * Agent widzi swoje, CEO i menedżer całe biuro.
 */
export async function zamowieniaSwiadectw(user: { id: string; role: string; agency_id: string | null }): Promise<ZamowienieSwiadectwa[]> {
  if (!user.agency_id) return [];
  const store = createSupabaseAdmin().storage.from(DOC_BUCKET);
  const { data: foldery } = await store.list(`${user.agency_id}/swiadectwa`, { limit: 200, sortBy: { column: "name", order: "desc" } });
  const wynik = await Promise.all(
    (foldery ?? [])
      .filter((f) => /^SW-\d{8}-[0-9A-F]{6}$/.test(f.name))
      .slice(0, 60)
      .map(async (f) => {
        const { data } = await store.download(`${user.agency_id}/swiadectwa/${f.name}/zamowienie.json`);
        if (!data) return null;
        try {
          return JSON.parse(await data.text()) as ZamowienieSwiadectwa;
        } catch {
          return null;
        }
      }),
  );
  const zarzad = user.role === "owner" || user.role === "manager";
  return wynik.filter((z): z is ZamowienieSwiadectwa => !!z && (zarzad || z.agentId === user.id)).sort((a, b) => b.numer.localeCompare(a.numer));
}
