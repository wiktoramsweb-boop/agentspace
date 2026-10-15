import { createSupabaseAdmin } from "./supabase/admin";

export type ZmianaCeny = {
  id: string;
  stara: number | null;
  nowa: number | null;
  kiedy: string;
  kto: string | null;
  /** Zmiana z akceptacji propozycji ceny przez właściciela w portalu klienta. */
  zPortalu: boolean;
};

/**
 * Historia ceny oferty, od ceny wyjściowej do dziś.
 * `null` oznacza brak migracji v49: karta wtedy się nie pokazuje.
 */
export async function historiaCeny(propertyId: string, agencyId: string): Promise<ZmianaCeny[] | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("property_price_history")
    .select("id, old_price_pln, new_price_pln, changed_by, changed_at")
    .eq("property_id", propertyId)
    .eq("agency_id", agencyId)
    .order("changed_at", { ascending: true })
    .limit(200);
  if (error) return null;
  const wiersze = data ?? [];

  const ids = [...new Set(wiersze.map((w) => w.changed_by).filter(Boolean))] as string[];
  const [{ data: ludzie }, { data: propozycje }] = await Promise.all([
    ids.length
      ? admin.from("profiles").select("id, full_name").in("id", ids)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    // Zgoda właściciela w portalu zmienia cenę bez zalogowanej osoby. Łączymy
    // taką zmianę z zaakceptowaną propozycją po cenie i czasie decyzji.
    admin
      .from("client_price_proposals")
      .select("cena_proponowana, decided_at, status")
      .eq("property_id", propertyId)
      .eq("status", "zaakceptowana"),
  ]);
  const imiona = new Map((ludzie ?? []).map((p) => [p.id as string, p.full_name as string | null]));

  return wiersze.map((w) => {
    const nowa = w.new_price_pln == null ? null : Number(w.new_price_pln);
    const zPortalu =
      !w.changed_by &&
      (propozycje ?? []).some(
        (p) =>
          Number(p.cena_proponowana) === nowa &&
          p.decided_at &&
          Math.abs(Date.parse(p.decided_at as string) - Date.parse(w.changed_at as string)) < 5 * 60_000,
      );
    return {
      id: w.id as string,
      stara: w.old_price_pln == null ? null : Number(w.old_price_pln),
      nowa,
      kiedy: w.changed_at as string,
      kto: w.changed_by ? imiona.get(w.changed_by as string) ?? "Osoba spoza biura" : null,
      zPortalu,
    };
  });
}
