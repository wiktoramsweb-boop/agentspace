import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { WzorSlug } from "@/lib/wzory/themes";

/**
 * Konfiguracja strony internetowej biura.
 *
 * Teksty i kolory siedzą w JSON-ach, bo każdy wzór ma trochę inny zestaw
 * sekcji. Kod zawsze czyta je przez `siteConfig()`, które dokłada sensowne
 * wartości domyślne, więc strona działa od pierwszej sekundy po włączeniu,
 * jeszcze zanim ktokolwiek cokolwiek wpisze.
 */

export type SiteBrand = {
  officeName: string;
  claim: string;
  /** Kolor wiodący; nadpisuje akcent motywu. Puste = kolor wzoru. */
  accent: string;
  /** Ścieżka logo w magazynie plików biura (bucket agency-assets). */
  logoPath: string | null;
  /** Zdjęcie w nagłówku strony głównej. */
  heroPath: string | null;
};

export type SiteContent = {
  heroKick: string;
  heroTitle: string;
  heroLead: string;
  aboutTitle: string;
  aboutBody: string;
  /** Cztery liczby na stronie głównej: wartość, sufiks, podpis. */
  stats: { value: string; label: string }[];
  /** Trzy powody, dla których warto: tytuł i opis. */
  reasons: { title: string; body: string }[];
  ctaTitle: string;
  ctaLead: string;
  /** Opinie klientów pokazywane na przewijanym pasku. */
  reviews: { text: string; who: string; what: string }[];
};

export type SiteContact = {
  phone: string;
  email: string;
  addressLine: string;
  addressCity: string;
  hours: string;
  nip: string;
  facebook: string;
  instagram: string;
};

export type SiteConfig = {
  agencyId: string;
  slug: string;
  template: WzorSlug;
  published: boolean;
  domain: string | null;
  domainStatus: string;
  /** Czy biuro ma wykupiony dodatek „strona www". */
  addon: boolean;
  brand: SiteBrand;
  content: SiteContent;
  contact: SiteContact;
};

export const DEFAULT_CONTENT: SiteContent = {
  heroKick: "Biuro nieruchomości",
  heroTitle: "Sprzedajemy mieszkania tak, jak sami chcielibyśmy je kupować",
  heroLead:
    "Wycena z cen transakcyjnych, zdjęcia od fotografa i jeden opiekun od pierwszej rozmowy do przekazania kluczy.",
  aboutTitle: "Kim jesteśmy",
  aboutBody:
    "Jesteśmy biurem nieruchomości z Krakowa. Prowadzimy sprzedaż i najem mieszkań, domów oraz lokali. Każdą sprawę prowadzi jedna osoba od początku do końca, bo tak po prostu wychodzi lepiej.",
  stats: [
    { value: "128", label: "transakcji w zeszłym roku" },
    { value: "21 dni", label: "mediana czasu sprzedaży" },
    { value: "98%", label: "ceny ofertowej średnio" },
    { value: "4,9", label: "ocena w Google" },
  ],
  reasons: [
    {
      title: "Wycena z twardych danych",
      body: "Pokazujemy ceny transakcyjne z Twojej okolicy, a nie ofertowe z portali. Różnica potrafi sięgać dziesięciu procent.",
    },
    {
      title: "Materiały w cenie",
      body: "Sesja zdjęciowa, rzut i spacer 3D robimy zawsze, niezależnie od wartości nieruchomości.",
    },
    {
      title: "Jeden opiekun",
      body: "Ta sama osoba wycenia, pokazuje, negocjuje i jest przy akcie notarialnym. Nie przekazujemy klientów dalej.",
    },
  ],
  ctaTitle: "Porozmawiajmy o Twojej nieruchomości",
  ctaLead: "Wycena jest bezpłatna i nie zobowiązuje Cię do podpisania umowy. Odpowiadamy tego samego dnia roboczego.",
  reviews: [],
};

export const DEFAULT_BRAND: SiteBrand = {
  officeName: "",
  claim: "Nieruchomości",
  accent: "",
  logoPath: null,
  heroPath: null,
};

export const DEFAULT_CONTACT: SiteContact = {
  phone: "",
  email: "",
  addressLine: "",
  addressCity: "",
  hours: "Poniedziałek do piątku, 9:00 do 17:00",
  nip: "",
  facebook: "",
  instagram: "",
};

/** Adres strony z nazwy biura: „Spectra Nieruchomości" → „spectra-nieruchomosci". */
export function slugify(input: string): string {
  const map: Record<string, string> = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
  return input
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

type Row = {
  agency_id: string;
  slug: string | null;
  template: string | null;
  published: boolean | null;
  domain: string | null;
  domain_status?: string | null;
  brand: Partial<SiteBrand> | null;
  content: Partial<SiteContent> | null;
  contact: Partial<SiteContact> | null;
};

function shape(row: Row | null, agencyId: string, fallbackName: string, addon: boolean): SiteConfig {
  return {
    agencyId,
    slug: row?.slug ?? slugify(fallbackName || "biuro"),
    template: ((row?.template ?? "kamienica") as WzorSlug),
    published: row?.published ?? false,
    domain: row?.domain ?? null,
    domainStatus: row?.domain_status ?? "brak",
    addon,
    brand: { ...DEFAULT_BRAND, officeName: fallbackName, ...(row?.brand ?? {}) },
    content: { ...DEFAULT_CONTENT, ...(row?.content ?? {}) },
    contact: { ...DEFAULT_CONTACT, ...(row?.contact ?? {}) },
  };
}

/** Konfiguracja dla panelu (po identyfikatorze biura). */
export async function getSiteConfig(agencyId: string, agencyName: string): Promise<SiteConfig> {
  const admin = createSupabaseAdmin();
  const [{ data }, { data: agency }] = await Promise.all([
    admin.from("site_config").select("*").eq("agency_id", agencyId).maybeSingle(),
    admin.from("agencies").select("site_addon").eq("id", agencyId).maybeSingle(),
  ]);
  return shape((data as Row) ?? null, agencyId, agencyName, agency?.site_addon === true);
}

/**
 * Konfiguracja dla strony publicznej. Zwraca null, gdy strony nie ma, nie jest
 * opublikowana albo biuro nie ma już wykupionego dodatku: wtedy adres pokazuje
 * zwykłe „nie znaleziono", a nie pustą stronę biura.
 */
export async function getSiteBySlug(slug: string): Promise<SiteConfig | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("site_config").select("*").eq("slug", slug).maybeSingle();
  if (!data) return null;

  const { data: agency } = await admin
    .from("agencies")
    .select("name, site_addon")
    .eq("id", data.agency_id)
    .maybeSingle();

  const site = shape(data as Row, data.agency_id as string, (agency?.name as string) ?? "Biuro", agency?.site_addon === true);
  return site.addon ? site : null;
}

/** Adres strony po własnej domenie biura (używane w middleware). */
export async function getSlugByDomain(domain: string): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("site_config")
    .select("slug, published")
    .eq("domain", domain.toLowerCase())
    .maybeSingle();
  return data?.published ? ((data.slug as string) ?? null) : null;
}

export async function listPublishedSlugs(): Promise<string[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("site_config").select("slug").eq("published", true);
  return (data ?? []).map((r) => r.slug as string).filter(Boolean);
}
