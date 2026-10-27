import sharp from "sharp";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createSupabaseAdmin } from "./supabase/admin";
import { PHOTO_BUCKET, publicAssetUrl } from "./storage";
import { ensureBucket } from "./storage-server";
import { MAX_PHOTOS } from "./property-photos";
import type { PropertyPhoto } from "./types";

/**
 * Pobieranie zdjęć ofert z poprzedniego systemu (v54).
 *
 * Import zapisuje tylko adresy zdjęć w `import_photo_urls`. Same pliki
 * ściągamy partiami, bo biuro z trzystoma ofertami ma kilka tysięcy zdjęć,
 * a jedno wywołanie serwera ma limit czasu. Kreator importu woła partię po
 * partii i pokazuje postęp.
 *
 * Adresy pochodzą z cudzego pliku, więc serwer nie może pobrać czegoś
 * z sieci wewnętrznej: sprawdzamy, dokąd prowadzi nazwa, i nie idziemy za
 * przekierowaniami bez ponownego sprawdzenia.
 */

const MAX_BAJTOW = 15 * 1024 * 1024;
const NA_PARTIE = 12;

function prywatny(ip: string): boolean {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    return v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:") && prywatny(v.slice(7));
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function bezpiecznyAdres(u: URL): Promise<boolean> {
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  if (u.username || u.password) return false;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) return false;
  if (isIP(host)) return !prywatny(host);
  try {
    const adresy = await lookup(host, { all: true });
    return adresy.length > 0 && adresy.every((a) => !prywatny(a.address));
  } catch {
    return false;
  }
}

async function pobierz(adres: string): Promise<Buffer | null> {
  let url: URL;
  try {
    url = new URL(adres);
  } catch {
    return null;
  }
  for (let skok = 0; skok < 4; skok++) {
    if (!(await bezpiecznyAdres(url))) return null;
    const odp = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(12_000), headers: { "User-Agent": "AgentSpace-import/1.0" } }).catch(() => null);
    if (!odp) return null;
    if (odp.status >= 300 && odp.status < 400) {
      const dalej = odp.headers.get("location");
      if (!dalej) return null;
      url = new URL(dalej, url);
      continue;
    }
    if (!odp.ok || !/^image\//.test(odp.headers.get("content-type") ?? "image/")) return null;
    if (Number(odp.headers.get("content-length") ?? 0) > MAX_BAJTOW) return null;
    const bufor = Buffer.from(await odp.arrayBuffer());
    return bufor.length > MAX_BAJTOW ? null : bufor;
  }
  return null;
}

/** Ile zdjęć czeka jeszcze na pobranie w biurze. `null` przed v54. */
export async function zdjeciaWKolejce(agencyId: string): Promise<number | null> {
  const { data, error } = await createSupabaseAdmin().from("properties").select("import_photo_urls").eq("agency_id", agencyId).neq("import_photo_urls", "[]").limit(2000);
  if (error) return null;
  return ((data ?? []) as { import_photo_urls: string[] }[]).reduce((a, p) => a + (p.import_photo_urls?.length ?? 0), 0);
}

/** Jedna partia: do kilkunastu zdjęć z kolejnych ofert. Zwraca, ile pobrano, ile odpadło i ile zostało. */
export async function pobierzPartieZdjec(agencyId: string): Promise<{ pobrane: number; nieudane: number; zostalo: number }> {
  const admin = createSupabaseAdmin();
  if (await ensureBucket(PHOTO_BUCKET)) return { pobrane: 0, nieudane: 0, zostalo: (await zdjeciaWKolejce(agencyId)) ?? 0 };
  const { data } = await admin
    .from("properties")
    .select("id, photos, import_photo_urls")
    .eq("agency_id", agencyId)
    .neq("import_photo_urls", "[]")
    .order("created_at")
    .limit(NA_PARTIE);
  let pobrane = 0;
  let nieudane = 0;
  let budzet = NA_PARTIE;

  for (const p of (data ?? []) as { id: string; photos: PropertyPhoto[] | null; import_photo_urls: string[] }[]) {
    if (budzet <= 0) break;
    const kolejka = [...(p.import_photo_urls ?? [])];
    const teraz = kolejka.splice(0, budzet);
    budzet -= teraz.length;
    const zdjecia = [...(p.photos ?? [])];

    const wyniki = await Promise.all(
      teraz.map(async (adres) => {
        const surowe = await pobierz(adres);
        if (!surowe) return null;
        try {
          const obraz = sharp(surowe).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true });
          const { data: jpg, info } = await obraz.jpeg({ quality: 85 }).toBuffer({ resolveWithObject: true });
          const path = `${agencyId}/import/${crypto.randomUUID()}.jpg`;
          const { error } = await admin.storage.from(PHOTO_BUCKET).upload(path, jpg, { contentType: "image/jpeg" });
          if (error) return null;
          return { path, url: publicAssetUrl(PHOTO_BUCKET, path), export: true, print: true, width: info.width, height: info.height } as PropertyPhoto;
        } catch {
          return null;
        }
      }),
    );
    for (const w of wyniki) {
      if (w && zdjecia.length < MAX_PHOTOS) {
        zdjecia.push(w);
        pobrane++;
      } else nieudane++;
    }
    await admin.from("properties").update({ photos: zdjecia, import_photo_urls: kolejka }).eq("id", p.id).eq("agency_id", agencyId);
  }

  return { pobrane, nieudane, zostalo: (await zdjeciaWKolejce(agencyId)) ?? 0 };
}
