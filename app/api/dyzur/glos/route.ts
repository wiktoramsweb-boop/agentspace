import { after } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakKredytow } from "@/lib/kredyty";
import { cyfryTelefonu } from "@/lib/leady-import";
import { poNowymLeadzie } from "@/lib/zdarzenia";
import { zapiszBlad } from "@/lib/blad";
import {
  biuroPoNumerze,
  podpisTwilioOk,
  promptDyzuru,
  stanDoParametru,
  stanZParametru,
  turaDyzuru,
  twiml,
  twimlKoniec,
  twimlRozmowa,
  type StanDyzuru,
} from "@/lib/dyzur";

/**
 * Dyżur AI: adres, który Twilio woła przy połączeniu i po każdej wypowiedzi.
 * Bez parametru `s` to początek rozmowy (powitanie), z nim kolejna tura.
 */

export const maxDuration = 30;

const MAX_TUR = 8;
const POZEGNANIE = "Dziękuję, przekażę agentowi. Oddzwoni najszybciej, jak to możliwe. Do usłyszenia.";

function publicznyAdres(req: Request): string {
  const u = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? u.host;
  const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  return `${proto}://${host}${u.pathname}${u.search}`;
}

export async function POST(req: Request) {
  const params: Record<string, string> = {};
  try {
    (await req.formData()).forEach((v, k) => (params[k] = String(v)));
  } catch {
    return new Response("Złe zapytanie", { status: 400 });
  }

  const token = process.env.TWILIO_AUTH_TOKEN ?? "";
  const adres = publicznyAdres(req);
  if (!podpisTwilioOk(adres, params, req.headers.get("x-twilio-signature"), token)) {
    return new Response("Brak podpisu Twilio", { status: 403 });
  }

  const u = new URL(adres);
  const stan = stanZParametru(u.searchParams.get("s"));
  const dzwoniacy = params.From && params.From !== "anonymous" ? params.From : null;
  const admin = createSupabaseAdmin();

  // ── Początek rozmowy ──
  if (!stan) {
    const biuro = await biuroPoNumerze(params.To ?? "");
    if (!biuro || !biuro.cfg.wlaczony) {
      return twiml(twimlKoniec("Dzień dobry. Nie możemy teraz odebrać. Prosimy o kontakt później. Do usłyszenia."));
    }
    if (await brakKredytow({ id: biuro.agencyId, agency_id: biuro.agencyId }, "dyzur_tura")) {
      return twiml(twimlKoniec("Dzień dobry. Agent oddzwoni najszybciej, jak to możliwe. Do usłyszenia."));
    }
    const nowy: StanDyzuru = { a: biuro.agencyId, l: null, h: [[1, biuro.cfg.powitanie]] };
    return twiml(twimlRozmowa(biuro.cfg.powitanie, `${u.pathname}?s=${stanDoParametru(nowy)}`));
  }

  // ── Kolejna tura ──
  const powiedzial = (params.SpeechResult ?? "").trim().slice(0, 500);
  const historia: StanDyzuru["h"] = powiedzial ? [...stan.h, [0, powiedzial]] : stan.h;
  if (!powiedzial) {
    // Cisza: jedno ponowne pytanie, potem pożegnanie.
    const ostatnia = stan.h[stan.h.length - 1];
    if (ostatnia?.[1] === "Przepraszam, nie usłyszałam. Czy może Pan albo Pani powtórzyć?") return twiml(twimlKoniec(POZEGNANIE));
    const pytanie = "Przepraszam, nie usłyszałam. Czy może Pan albo Pani powtórzyć?";
    return twiml(twimlRozmowa(pytanie, `${u.pathname}?s=${stanDoParametru({ ...stan, h: [...stan.h, [1, pytanie]] })}`));
  }

  const { data: ag } = await admin.from("agencies").select("name").eq("id", stan.a).maybeSingle();
  const { data: ust } = await admin.from("agency_settings").select("options").eq("agency_id", stan.a).maybeSingle();
  const cfg = (ust?.options as { dyzur?: { nazwa?: string; informacje?: string; opiekun_id?: string | null } } | null)?.dyzur ?? {};

  if (await brakKredytow({ id: stan.a, agency_id: stan.a }, "dyzur_tura")) return twiml(twimlKoniec(POZEGNANIE));

  let tura;
  try {
    tura = await turaDyzuru(
      promptDyzuru({ nazwa: cfg.nazwa || (ag?.name as string) || "biuro nieruchomości", informacje: cfg.informacje ?? "", telefon: dzwoniacy }),
      historia.map(([kto, tekst]) => ({ role: kto === 0 ? ("user" as const) : ("assistant" as const), content: tekst })),
    );
  } catch (e) {
    await zapiszBlad("dyzur", e).catch(() => {});
    return twiml(twimlKoniec(POZEGNANIE));
  }

  const pelna: StanDyzuru["h"] = [...historia, [1, tura.odpowiedz]];
  const linia = ([kto, t]: [0 | 1, string]) => `${kto === 0 ? "Dzwoniący" : "Dyżur AI"}: ${t}`;
  const NAGLOWEK = "Zapis rozmowy (Dyżur AI):";
  const sklej = (zapis: string) => [tura.potrzeba ?? "Rozmowa z Dyżurem AI", "", NAGLOWEK, zapis].join("\n").slice(0, 6000);

  // Lead zakładamy przy pierwszej wypowiedzi i uzupełniamy w kolejnych:
  // gdy dzwoniący się rozłączy, agent i tak ma numer i to, co zdążył powiedzieć.
  let leadId = stan.l;
  if (!leadId) {
    const { data: lead } = await admin
      .from("leads")
      .insert({
        agency_id: stan.a,
        agent_id: cfg.opiekun_id ?? null,
        name: tura.imie?.slice(0, 120) ?? null,
        phone: dzwoniacy,
        phone_digits: cyfryTelefonu(dzwoniacy),
        message: sklej(pelna.map(linia).join("\n")),
        source: "Dyżur AI (telefon)",
        status: "nowy",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();
    leadId = (lead?.id as string) ?? null;
    if (leadId) after(() => poNowymLeadzie(stan.a, leadId as string));
  } else {
    // Do zapisu w leadzie dopisujemy tylko nową wymianę: w adresie wozimy już tylko końcówkę rozmowy.
    const { data: byl } = await admin.from("leads").select("message").eq("id", leadId).eq("agency_id", stan.a).maybeSingle();
    const dotad = String(byl?.message ?? "").split(`${NAGLOWEK}\n`)[1] ?? "";
    const nowe = [linia([0, powiedzial]), linia([1, tura.odpowiedz])].join("\n");
    await admin
      .from("leads")
      .update({ ...(tura.imie ? { name: tura.imie.slice(0, 120) } : {}), message: sklej([dotad, nowe].filter(Boolean).join("\n")), updated_at: new Date().toISOString() })
      .eq("id", leadId)
      .eq("agency_id", stan.a);
  }

  const tur = (stan.t ?? 0) + 1;
  if (tura.koniec || tur >= MAX_TUR) return twiml(twimlKoniec(tura.koniec ? tura.odpowiedz : POZEGNANIE));
  // Twilio ma limit długości adresu: modelowi wystarczy końcówka rozmowy.
  const kontekst = pelna.slice(-6).map(([kto, t]) => [kto, t.slice(0, 250)] as [0 | 1, string]);
  return twiml(twimlRozmowa(tura.odpowiedz, `${u.pathname}?s=${stanDoParametru({ a: stan.a, l: leadId, h: kontekst, t: tur })}`));
}
