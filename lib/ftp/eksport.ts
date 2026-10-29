import sharp from "sharp";
import { createSupabaseAdmin } from "../supabase/admin";
import { odszyfruj } from "../szyfr";
import { jednostkiUrzedowe } from "../geocode";
import { zapiszZdarzenie } from "../dziennik";
import { opisBleduFtp, wyslijPlikFtp, wyslijPlikiFtp, type DaneFtp } from "./klient";
import { portalFtp } from "./portale";
import { dokumentNoe, nazwaZdjecia, polaOferty, type AgentNoe, type OfertaDoPliku, type OfertaNoe, type Urzedowe, type ZdjecieNoe } from "./noe";
import { dokumentTo, ofertaTo, type OfertaTo } from "./tabelaofert";
import { spakuj } from "../zip";
import { todayPL } from "../datetime";

/** Portale FTP, które biuro ma skonfigurowane (do kreatora oferty). Bez tabeli v51 pusto. */
export async function portaleFtpBiura(agencyId: string | null | undefined): Promise<{ id: string; nazwa: string }[]> {
  if (!agencyId) return [];
  const { data } = await createSupabaseAdmin().from("portal_ftp").select("portal").eq("agency_id", agencyId).eq("aktywny", true);
  return (data ?? []).map((w) => portalFtp(w.portal as string)).filter((p): p is NonNullable<typeof p> => Boolean(p)).map((p) => ({ id: p.id, nazwa: p.nazwa }));
}

export type WynikWysylki = { ok: true; ofert: number; pominiete: { id: string; tytul: string; bledy: string[] }[] } | { ok: false; blad: string };

/** Oferty zaznaczone do danego portalu, które mają sens na portalu (nie sprzedane, nie w archiwum). */
export const naPortal = (portal: string, o: { status?: string | null; details?: Record<string, unknown> | null }) =>
  (o.status === "aktywna" || o.status === "zarezerwowana") && Array.isArray(o.details?.portale_ftp) && (o.details!.portale_ftp as unknown[]).includes(portal);

async function zdjecieJpg(url: string, bok = 1920): Promise<Buffer | null> {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) return null;
  const wej = Buffer.from(await r.arrayBuffer());
  // Portal przyjmuje jpg, png i gif. Nasze zdjęcia bywają w webp, więc zawsze robimy jpg.
  return sharp(wej).rotate().resize({ width: bok, height: bok, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
}

/**
 * Pełny eksport biura na portal przez FTP. Kolejność: najpierw zdjęcia,
 * których portal jeszcze nie ma, na końcu plik z ofertami. Portal czyta plik
 * od razu po wgraniu, więc zdjęcia muszą już na niego czekać.
 */
export async function wyslijNaPortalFtp(agencyId: string, portal: string, kto: string | null): Promise<WynikWysylki> {
  const opis = portalFtp(portal);
  if (!opis) return { ok: false, blad: "Nieznany portal." };
  const admin = createSupabaseAdmin();
  const { data: kfg } = await admin.from("portal_ftp").select("*").eq("agency_id", agencyId).eq("portal", portal).maybeSingle();
  if (!kfg) return { ok: false, blad: "Biuro nie ma zapisanych danych FTP tego portalu." };

  // Dwie wysyłki naraz (zapis oferty i przycisk w ustawieniach) wgrałyby dwa pliki.
  if (kfg.wysylka_start && Date.now() - Date.parse(kfg.wysylka_start) < 4 * 60_000) return { ok: false, blad: "Wysyłka już trwa. Wynik zobaczysz za chwilę." };
  await admin.from("portal_ftp").update({ wysylka_start: new Date().toISOString() }).eq("id", kfg.id);

  const ftp: DaneFtp = { host: kfg.host, port: kfg.port, login: kfg.login, haslo: odszyfruj(kfg.haslo_enc), katalog: kfg.katalog, secure: kfg.secure };
  const zakoncz = async (zmiany: Record<string, unknown>) => {
    await admin.from("portal_ftp").update({ wysylka_start: null, ...zmiany }).eq("id", kfg.id);
  };

  try {
    const { data: wszystkie, error: bladOfert } = await admin
      .from("properties")
      .select("*")
      .eq("agency_id", agencyId)
      .in("status", ["aktywna", "zarezerwowana"])
      .limit(2000);
    // Pusty plik pełnego eksportu zdejmuje z portalu wszystko, więc błąd odczytu nie może udawać zera ofert.
    if (bladOfert) throw new Error(`Nie udało się odczytać ofert: ${bladOfert.message}`);
    const oferty = (wszystkie ?? []).filter((o) => naPortal(portal, o));

    const idAgentow = [...new Set(oferty.map((o) => o.agent_id as string))];
    const { data: profile } = idAgentow.length
      ? await admin.from("profiles").select("id, full_name, email, phone").in("id", idAgentow)
      : { data: [] };
    const agenci = new Map<string, AgentNoe>(
      (profile ?? []).map((p) => [p.id as string, { id: p.id as string, imie: (p.full_name as string) || "Agent", email: (p.email as string) ?? null, telefon: (p.phone as string) ?? null }]),
    );

    const doPliku: OfertaDoPliku[] = [];
    const pominiete: { id: string; tytul: string; bledy: string[] }[] = [];
    const zdjeciaDoWyslania = new Map<string, string>();
    const prowadzacy = new Set<string>();
    // Jednostki ustalamy raz na ofertę i zapisujemy: Nominatim pozwala na jedno zapytanie na sekundę.
    const urzedowe = async (o: Record<string, unknown> & { id: string; lat: number | null; lng: number | null }): Promise<Urzedowe> => {
      const det = (o.details ?? {}) as Record<string, unknown>;
      const u: Urzedowe = { wojewodztwo: (det.adres_wojewodztwo as string) ?? null, powiat: (det.adres_powiat as string) ?? null, gmina: (det.adres_gmina as string) ?? null };
      if ((u.wojewodztwo && u.powiat && u.gmina) || o.lat == null || o.lng == null) return u;
      const j = await jednostkiUrzedowe(o.lat, o.lng).catch(() => null);
      if (j) await admin.from("properties").update({ details: { ...det, adres_wojewodztwo: j.wojewodztwo, adres_powiat: j.powiat, adres_gmina: j.gmina } }).eq("id", o.id);
      await new Promise((r) => setTimeout(r, 1100));
      return j ?? u;
    };

    if (opis.paczka === "zip") {
      const { data: ag } = await admin.from("agencies").select("name").eq("id", agencyId).maybeSingle();
      const doPaczki: { dzial: { tab: string; typ: string }; xml: string }[] = [];
      const pliki: { nazwa: string; dane: Uint8Array }[] = [];
      const pominieteZip: { id: string; tytul: string; bledy: string[] }[] = [];
      for (const o of oferty) {
        const u = await urzedowe(o);
        const g = agenci.get(o.agent_id as string);
        // Portal sugeruje do 10 zdjęć i 10 rzutów na ofertę; mniejszy rozmiar trzyma paczkę w rozsądnej wadze.
        const fotki = ((o.photos ?? []) as { url: string; export?: boolean; plan?: boolean }[]).filter((p) => p.url && p.export !== false);
        const wybrane = [...fotki.filter((p) => !p.plan).slice(0, 10), ...fotki.filter((p) => p.plan).slice(0, 10)];
        const zdj = wybrane.map((p) => ({ plik: nazwaZdjecia(p.url), rzut: Boolean(p.plan), url: p.url }));
        const w = ofertaTo(o as OfertaTo, u, g ? { imie: g.imie, email: g.email, telefon: g.telefon } : null, zdj, todayPL());
        if (!w.ok) {
          pominieteZip.push({ id: o.id as string, tytul: (o.title as string) ?? "Oferta", bledy: w.bledy });
          continue;
        }
        doPaczki.push(w);
        for (const z of zdj) {
          const dane = await zdjecieJpg(z.url, 1600).catch(() => null);
          if (dane) pliki.push({ nazwa: z.plik, dane: new Uint8Array(dane) });
        }
      }
      const teraz = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Warsaw" }).slice(0, 19);
      const xml = dokumentTo(doPaczki, (ag?.name as string) ?? "Biuro nieruchomości", teraz);
      const paczka = spakuj([{ nazwa: "oferty.xml", dane: new TextEncoder().encode(xml) }, ...pliki]);
      const znacznik = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
      await wyslijPlikFtp(ftp, `agentspace_${znacznik}.zip`, Buffer.from(paczka));
      await zakoncz({ ostatnia_wysylka_at: new Date().toISOString(), ostatnio_ofert: doPaczki.length, ostatni_blad: null, ostatni_test_ok: true, ostatnie_bledy: pominieteZip });
      await zapiszZdarzenie({
        agencyId,
        actorId: kto,
        akcja: "portal_ftp_wysylka",
        opis: `Wysłano ${doPaczki.length} ofert na ${opis.nazwa}${pominieteZip.length ? `, ${pominieteZip.length} pominiętych` : ""}`,
        meta: { portal, ofert: doPaczki.length, zdjec: pliki.length, pominiete: pominieteZip.length },
      });
      return { ok: true, ofert: doPaczki.length, pominiete: pominieteZip };
    }

    for (const o of oferty) {
      const u = await urzedowe(o);
      const g = agenci.get(o.agent_id as string);
      const w = polaOferty(o as OfertaNoe, u, Boolean(g?.telefon && g?.email));
      if (!w.ok) {
        pominiete.push({ id: o.id as string, tytul: (o.title as string) ?? "Oferta", bledy: w.bledy });
        continue;
      }
      const zdjecia: ZdjecieNoe[] = ((o.photos ?? []) as { url: string; export?: boolean; plan?: boolean }[])
        .filter((p) => p.url && p.export !== false)
        .map((p) => {
          const plik = nazwaZdjecia(p.url);
          zdjeciaDoWyslania.set(plik, p.url);
          return { plik, rzut: Boolean(p.plan) };
        });
      doPliku.push({ pola: w.pola, lat: o.lat, lng: o.lng, zdjecia });
      prowadzacy.add(o.agent_id as string);
    }

    const juzSa = new Set<string>(Array.isArray(kfg.zdjecia_wyslane) ? (kfg.zdjecia_wyslane as string[]) : []);
    const nowe = [...zdjeciaDoWyslania].filter(([plik]) => !juzSa.has(plik));
    const { wyslane } = nowe.length
      ? await wyslijPlikiFtp(ftp, nowe.map(([nazwa, url]) => ({ nazwa, dane: () => zdjecieJpg(url) })))
      : { wyslane: [] as string[] };
    wyslane.forEach((p) => juzSa.add(p));

    const xml = dokumentNoe([...prowadzacy].map((id) => agenci.get(id)!), doPliku);
    const znacznik = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
    await wyslijPlikFtp(ftp, `agentspace_${znacznik}.xml`, Buffer.from(xml, "utf8"));

    await zakoncz({
      ostatnia_wysylka_at: new Date().toISOString(),
      ostatnio_ofert: doPliku.length,
      ostatni_blad: null,
      ostatni_test_ok: true,
      ostatnie_bledy: pominiete,
      zdjecia_wyslane: [...juzSa].slice(-5000),
    });
    await zapiszZdarzenie({
      agencyId,
      actorId: kto,
      akcja: "portal_ftp_wysylka",
      opis: `Wysłano ${doPliku.length} ofert na ${opis.nazwa}${pominiete.length ? `, ${pominiete.length} pominiętych` : ""}`,
      meta: { portal, ofert: doPliku.length, zdjec: wyslane.length, pominiete: pominiete.length },
    });
    return { ok: true, ofert: doPliku.length, pominiete };
  } catch (e) {
    const blad = opisBleduFtp(e);
    await zakoncz({ ostatni_blad: blad, ostatni_test_ok: false });
    return { ok: false, blad };
  }
}
