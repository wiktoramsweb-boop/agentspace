import { brakKredytow, brakKredytowResponse } from "@/lib/kredyty";
import { getCurrentUser } from "@/lib/auth";
import { COACH_MODEL } from "@/lib/ai/client";
import { odpowiedzJson, type SchematJson } from "@/lib/ai/struktura";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { todayPL } from "@/lib/datetime";
import { SCHEMAT_WPISU, systemWpisu, kwota, poprawnaData, poprawnaGodzina, znajdzKlienta, type KandydatKlienta } from "@/lib/szybki-wpis";

export const maxDuration = 45;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Nie zalogowano" }, { status: 401 });
  if (await brakKredytow(user, "szybki_wpis")) return brakKredytowResponse();

  let body: { transcript?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Złe dane" }, { status: 400 });
  }
  const transcript = (body.transcript ?? "").trim().slice(0, 6000);
  if (transcript.length < 8) return Response.json({ error: "Powiedz albo wpisz kilka zdań relacji." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "AI niedostępne (brak ANTHROPIC_API_KEY)." }, { status: 503 });

  const dzis = todayPL();
  try {
    const w = await odpowiedzJson<Record<string, unknown>>({
      model: COACH_MODEL,
      maxTokens: 1200,
      system: systemWpisu(dzis),
      schemat: SCHEMAT_WPISU as unknown as SchematJson,
      messages: [{ role: "user", content: transcript }],
    });

    const s = (k: string) => (typeof w[k] === "string" ? (w[k] as string).trim() : "");
    const sp = (w.spotkanie ?? {}) as { jest?: boolean; data?: string; godzina?: string; temat?: string };
    const dataSp = sp.jest ? poprawnaData(sp.data, dzis) : null;
    const zadania = (Array.isArray(w.zadania) ? (w.zadania as { tytul?: string; termin?: string }[]) : [])
      .map((z) => ({ tytul: String(z.tytul ?? "").trim().slice(0, 160), termin: poprawnaData(z.termin, dzis) ?? "" }))
      .filter((z) => z.tytul)
      .slice(0, 6);

    // Czy ten klient już jest w bazie: agent szuka wśród swoich, zarząd w całym biurze.
    const admin = createSupabaseAdmin();
    let q = admin.from("clients").select("id, name, phone").eq("agency_id", user.agency_id).limit(3000);
    if (!["owner", "director", "manager"].includes(user.role)) q = q.eq("agent_id", user.id);
    const { data: klienci } = await q;
    const traf = znajdzKlienta(s("client_name"), s("phone"), (klienci ?? []) as KandydatKlienta[]);

    return Response.json({
      data: {
        clientName: s("client_name"),
        phone: s("phone"),
        email: s("email"),
        clientType: s("client_type") || "inny",
        clientStatus: s("client_status") || "w_kontakcie",
        budget: kwota(s("budget_pln")),
        address: s("address"),
        city: s("city"),
        createProperty: Boolean(w.create_property) && Boolean(s("address")),
        propertyTitle: s("property_title"),
        propertyArea: Number(s("property_area").replace(",", ".")) || null,
        propertyRooms: Math.round(Number(s("property_rooms"))) || null,
        propertyPrice: kwota(s("property_price")),
        dealKind: s("deal_kind") === "wynajem" ? "wynajem" : "sprzedaz",
        meeting: dataSp ? { date: dataSp, time: poprawnaGodzina(sp.godzina) ?? "", subject: (sp.temat ?? "").trim().slice(0, 160) || "Spotkanie" } : null,
        tasks: zadania,
        nextContact: poprawnaData(s("nastepny_kontakt"), dzis) ?? "",
        note: s("note") || transcript,
        existing: traf ? { id: traf.klient.id, name: traf.klient.name, by: traf.po } : null,
      },
    });
  } catch (err) {
    console.error("quick-entry parse error:", err);
    return Response.json({ error: "Nie udało się przetworzyć. Spróbuj jeszcze raz." }, { status: 503 });
  }
}
