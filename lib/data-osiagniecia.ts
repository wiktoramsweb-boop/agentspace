import { createSupabaseAdmin } from "./supabase/admin";
import { policzMape, type Liczniki, type Mapa } from "./osiagniecia";
import { moduly, type Uprawnienia } from "./role";

type Osoba = { id: string; role: string; agency_id: string | null; permissions?: Uprawnienia | null };

/** Liczniki do mapy programu. Brak tabeli (stara migracja) daje po prostu zero. */
export async function mapaProgramu(user: Osoba): Promise<Mapa> {
  const admin = createSupabaseAdmin();
  const id = user.id;
  const ile = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const zarzad = user.role === "owner" || user.role === "manager";

  const [klienci, notatki, klienciZTerminem, klienciDalej, oferty, zdjecia, poszukiwania, dzialania, polaczenia, spotkania, dokumenty, transakcje, zamkniete, sesje, oceny, cel, ai, zaproszenia] =
    await Promise.all([
      ile(admin.from("clients").select("id", { count: "exact", head: true }).eq("agent_id", id)),
      ile(admin.from("client_notes").select("id", { count: "exact", head: true }).eq("agent_id", id)),
      ile(admin.from("clients").select("id", { count: "exact", head: true }).eq("agent_id", id).not("next_contact_at", "is", null)),
      ile(admin.from("clients").select("id", { count: "exact", head: true }).eq("agent_id", id).in("status", ["negocjacje", "zamkniety"])),
      ile(admin.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", id)),
      admin.from("properties").select("photos").eq("agent_id", id).limit(500),
      ile(admin.from("searches").select("id", { count: "exact", head: true }).eq("agent_id", id)),
      ile(admin.from("activities").select("id", { count: "exact", head: true }).eq("created_by", id)),
      ile(admin.from("activities").select("id", { count: "exact", head: true }).eq("kind", "polaczenie").eq("status", "wykonane").contains("assignee_ids", [id])),
      ile(admin.from("activities").select("id", { count: "exact", head: true }).eq("kind", "spotkanie").contains("assignee_ids", [id])),
      ile(admin.from("documents").select("id", { count: "exact", head: true }).eq("uploaded_by", id)),
      ile(admin.from("deals").select("id", { count: "exact", head: true }).eq("agent_id", id)),
      ile(admin.from("deals").select("id", { count: "exact", head: true }).eq("agent_id", id).eq("status", "zamkniety")),
      ile(admin.from("training_sessions").select("id", { count: "exact", head: true }).eq("agent_id", id).eq("status", "completed")),
      admin.from("session_scores").select("overall").eq("agent_id", id).order("overall", { ascending: false }).limit(1),
      ile(admin.from("goals").select("id", { count: "exact", head: true }).eq("agent_id", id)),
      admin.from("rate_events").select("key").eq("user_id", id).in("key", ["ai:szybki_wpis", "ai:asystent_czat", "ai:asystent_pisze", "ai:dopasowanie_ai"]).limit(2000),
      zarzad && user.agency_id ? ile(admin.from("invitations").select("id", { count: "exact", head: true }).eq("agency_id", user.agency_id)) : Promise.resolve(0),
    ]);

  // Sprawy doradcy. Bez tabeli kredytów (stare biuro) zostaje zero.
  const [sprawy, decyzje] = await Promise.all([
    ile(admin.from("credit_cases").select("id", { count: "exact", head: true }).eq("advisor_id", id)),
    ile(admin.from("credit_cases").select("id", { count: "exact", head: true }).eq("advisor_id", id).in("stage", ["decyzja", "umowa"])),
  ]);

  const kluczeAi = (ai.data ?? []).map((r: { key: string }) => r.key);
  const zAi = (k: string) => kluczeAi.filter((x) => x === k).length;

  const l: Liczniki = {
    klienci,
    notatki,
    klienciZTerminem,
    klienciDalej,
    oferty,
    ofertyZeZdjeciami: (zdjecia.data ?? []).filter((p: { photos: unknown }) => Array.isArray(p.photos) && p.photos.length > 0).length,
    poszukiwania,
    dzialania,
    polaczeniaWykonane: polaczenia,
    spotkania,
    dokumenty,
    transakcje,
    transakcjeZamkniete: zamkniete,
    sesje,
    najlepszaOcena: Number(oceny.data?.[0]?.overall ?? 0),
    cel,
    szybkiWpis: zAi("ai:szybki_wpis"),
    asystentCzat: zAi("ai:asystent_czat"),
    asystentPisze: zAi("ai:asystent_pisze"),
    dopasowanieAi: zAi("ai:dopasowanie_ai"),
    zaproszenia,
    sprawyKredytowe: sprawy,
    decyzjeKredytowe: decyzje,
  };
  return policzMape(l, zarzad, moduly(user as Parameters<typeof moduly>[0]));
}
