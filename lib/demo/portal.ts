import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { nowyToken } from "@/lib/portal-klienta";

/**
 * Portal klienta w biurze demo: jeden sprzedający z otwartym portalem,
 * działaniami pokazanymi klientowi i krótką rozmową z opiekunem. Odświeżenie
 * demo kasuje klientów razem z dostępami, więc bez tego pokaz portalu
 * zaczynał się od pustego ekranu.
 */
const NOTATKI = [
  "Para z dzieckiem, pytali o szkołę i komunikację. Wracają z decyzją w ciągu kilku dni.",
  "Klient inwestycyjny, interesował go czynsz i stan instalacji. Poprosił o koszty utrzymania.",
  "Kupujący chcą obejrzeć mieszkanie drugi raz, z rodzicami.",
];

const ROZMOWA: { autor: "klient" | "agent"; tresc: string; godzinTemu: number }[] = [
  { autor: "agent", tresc: "Dzień dobry, w sobotę były dwie prezentacje. Opisy są w zakładce „Moja sprawa”.", godzinTemu: 50 },
  { autor: "klient", tresc: "Dziękuję! Czy ci państwo z dzieckiem coś jeszcze mówili o cenie?", godzinTemu: 47 },
  { autor: "agent", tresc: "Pytali, czy jest pole do negocjacji. Powiedziałem, że rozmawiamy po drugiej prezentacji. Umówiłem ją na czwartek.", godzinTemu: 46 },
  { autor: "klient", tresc: "Super, to czekam na informację po czwartku.", godzinTemu: 20 },
];

export async function zasiejPortalDemo(agencyId: string, now = new Date()): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const godz = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

  // Istniejący dostęp zostaje (link mógł już pójść do kogoś na pokazie).
  const { data: jest } = await admin
    .from("client_portal_access")
    .select("id, client_id, created_by")
    .eq("agency_id", agencyId)
    .eq("rodzaj", "sprzedajacy")
    .is("revoked_at", null)
    .order("created_at", { ascending: true })
    .limit(1);
  type Dostep = { id: string; client_id: string; created_by: string | null };
  let dostep = jest?.[0] as Dostep | undefined;
  let propertyId: string | null = null;

  if (dostep) {
    const { data: pp } = await admin.from("client_portal_properties").select("property_id").eq("access_id", dostep.id).limit(1);
    propertyId = (pp?.[0]?.property_id as string | undefined) ?? null;
  } else {
    const { data: klient } = await admin.from("clients").select("id, agent_id").eq("agency_id", agencyId).eq("type", "sprzedajacy").order("created_at").limit(1);
    const { data: oferta } = await admin.from("properties").select("id, agent_id").eq("agency_id", agencyId).neq("status", "sfinalizowana").order("created_at").limit(1);
    if (!klient?.[0] || !oferta?.[0]) return null;
    const { data: nowy } = await admin
      .from("client_portal_access")
      .insert({ agency_id: agencyId, client_id: klient[0].id, token: nowyToken(), rodzaj: "sprzedajacy", created_by: oferta[0].agent_id, last_seen_at: godz(20) })
      .select("id, client_id, created_by")
      .single();
    if (!nowy) return null;
    dostep = nowy as Dostep;
    propertyId = oferta[0].id as string;
    await admin.from("client_portal_properties").insert({ access_id: dostep!.id, property_id: propertyId });
  }
  if (!dostep || !propertyId) return null;

  const { data: ofe } = await admin.from("properties").select("agent_id").eq("id", propertyId).maybeSingle();
  const opiekun = (ofe?.agent_id as string | null) ?? dostep.created_by;

  // Działania widoczne dla klienta: dwie odbyte prezentacje, sesja zdjęciowa i najbliższa prezentacja.
  await admin.from("activities").delete().eq("agency_id", agencyId).eq("property_id", propertyId).eq("client_visible", true);
  const dzien = (d: number, h: number) => {
    const x = new Date(now);
    x.setDate(x.getDate() + d);
    x.setHours(h, 0, 0, 0);
    return x.toISOString();
  };
  const wpis = (d: number, h: number, kind: string, purpose: string | null, note: string | null, zrobione: boolean) => ({
    agency_id: agencyId,
    created_by: opiekun,
    kind,
    purpose,
    subject: purpose === "sesja_foto" ? "Sesja zdjęciowa" : "Prezentacja",
    status: zrobione ? "wykonane" : "zaplanowane",
    priority: "normalny",
    due_at: dzien(d, h),
    client_id: dostep!.client_id,
    property_id: propertyId,
    assignee_ids: opiekun ? [opiekun] : [],
    include_in_report: true,
    client_visible: true,
    client_note: note,
    ...(zrobione ? { completed_at: dzien(d, h) } : {}),
  });
  await admin.from("activities").insert([
    wpis(-9, 11, "spotkanie", "sesja_foto", "Zdjęcia i rzut gotowe, ogłoszenie poszło na portale.", true),
    wpis(-3, 12, "spotkanie", "prezentacja", NOTATKI[0], true),
    wpis(-3, 14, "spotkanie", "prezentacja", NOTATKI[1], true),
    wpis(-1, 18, "polaczenie", null, "Kupujący z soboty dopytywali o koszty czynszu, przesłałem rozliczenie ze wspólnoty.", true),
    wpis(2, 17, "spotkanie", "prezentacja", NOTATKI[2], false),
  ]);

  await admin.from("client_portal_messages").delete().eq("access_id", dostep.id);
  await admin.from("client_portal_messages").insert(
    ROZMOWA.map((m) => ({ access_id: dostep!.id, property_id: propertyId, autor: m.autor, tresc: m.tresc, created_at: godz(m.godzinTemu), read_at: godz(m.godzinTemu - 1) })),
  );
  return dostep.id;
}
