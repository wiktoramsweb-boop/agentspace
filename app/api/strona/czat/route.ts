import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSiteBySlug } from "@/lib/site/config";
import { brakKredytow } from "@/lib/kredyty";
import { hitLimit, visitorKey } from "@/lib/rate-limit";
import { odpowiedzCzatu, promptCzatu, telefonZTekstu } from "@/lib/ai/czat-strony";
import { zapiszBlad } from "@/lib/blad";
import { cyfryTelefonu } from "@/lib/leady-import";

/**
 * Czat na publicznej stronie biura.
 *
 * Endpoint otwarty dla każdego, więc trzy zabezpieczenia naraz: pułapka na
 * roboty, limit na adres IP i pula kredytów biura. Bez nich pierwszy skrypt,
 * który go znajdzie, wydaje cudze pieniądze na model językowy.
 */

export const maxDuration = 30;

const MAX_ZNAKOW = 600;
const MAX_TUR = 20;
/** Tyle wiadomości z jednego adresu na godzinę. Człowiek nie napisze więcej. */
const LIMIT_NA_IP = 30;

type Wiadomosc = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let body: { slug?: string; wiadomosci?: Wiadomosc[]; website?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Złe dane." }, { status: 400 });
  }

  // Pułapka: pole ukryte w formularzu, które wypełniają tylko roboty.
  if (body.website) return Response.json({ odpowiedz: "Dziękuję." });

  const slug = String(body.slug ?? "");
  const wiadomosci = (body.wiadomosci ?? [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .slice(-MAX_TUR)
    .map((m) => ({ role: m.role, content: String(m.content ?? "").slice(0, MAX_ZNAKOW) }))
    .filter((m) => m.content.trim().length > 0);

  if (!slug || wiadomosci.length === 0) {
    return Response.json({ error: "Brak treści." }, { status: 400 });
  }

  const klucz = await visitorKey();
  if (await hitLimit(`czat:${klucz}`, LIMIT_NA_IP, 3600)) {
    return Response.json(
      { odpowiedz: "Napisz do nas proszę przez formularz kontaktowy, oddzwonimy." },
      { status: 429 },
    );
  }

  const site = await getSiteBySlug(slug);
  if (!site || !site.published) {
    return Response.json({ error: "Nie ma takiej strony." }, { status: 404 });
  }

  // Czat płaci z puli biura, którego jest stroną. Bez agenta w sesji
  // przekazujemy samo biuro: limit dzienny osoby tu nie obowiązuje.
  if (await brakKredytow({ id: site.agencyId, agency_id: site.agencyId }, "czat_strony")) {
    return Response.json({
      odpowiedz: "Napisz do nas proszę przez formularz kontaktowy, oddzwonimy najszybciej jak się da.",
    });
  }

  const admin = createSupabaseAdmin();
  const { data: agencja } = await admin
    .from("agencies")
    .select("name")
    .eq("id", site.agencyId)
    .maybeSingle();

  const system = promptCzatu({
    nazwa: (agencja?.name as string) ?? site.content.heroKick ?? "biuro nieruchomości",
    oNas: `${site.content.aboutTitle}. ${site.content.aboutBody}`.slice(0, 1200),
    miasto: site.contact.addressCity || null,
  });

  try {
    const wynik = await odpowiedzCzatu(system, wiadomosci);
    const telefon = telefonZTekstu(wynik.telefon);

    // Lead zapisujemy dopiero przy prawdziwym numerze, nie przy deklaracji
    // modelu, że kontakt jest zebrany. Lead bez numeru to tylko hałas na liście.
    if (telefon) {
      const rozmowa = wiadomosci
        .map((m) => `${m.role === "user" ? "Klient" : "Asystent"}: ${m.content}`)
        .join("\n")
        .slice(0, 4000);

      await admin.from("leads").insert({
        agency_id: site.agencyId,
        name: wynik.imie?.slice(0, 120) ?? null,
        phone: telefon,
        phone_digits: cyfryTelefonu(telefon),
        city: site.contact.addressCity || null,
        message: [wynik.potrzeba, "", "Zapis rozmowy:", rozmowa].filter(Boolean).join("\n").slice(0, 6000),
        source: "czat na stronie",
        status: "nowy",
        submitted_at: new Date().toISOString(),
      });
    }

    return Response.json({ odpowiedz: wynik.odpowiedz, zapisany: Boolean(telefon) });
  } catch (err) {
    await zapiszBlad("strona/czat", err, { agencyId: site.agencyId });
    return Response.json({
      odpowiedz: "Coś mi się zacięło. Zadzwońcie proszę albo napiszcie przez formularz kontaktowy.",
    });
  }
}
