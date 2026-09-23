import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Strona internetowa jest osobną usługą, nie częścią abonamentu CRM.
 *
 * Kto płaci tylko za system, widzi w ustawieniach opis dodatku i przycisk
 * „chcę stronę". Konfiguracja, edycja treści i publiczny adres włączają się
 * dopiero po włączeniu dodatku dla biura.
 *
 * Ceny są tutaj w jednym miejscu: zmiana tych liczb zmienia je na stronie,
 * w cenniku i w panelu.
 */
export const SITE_ADDON = {
  monthly: 199,
  yearly: 1990,
  setup: 990,
  /** Ile stron ofert wchodzi w cenę bez dopłat. */
  offersLimit: "bez limitu ofert",
};

export type AddonState = {
  active: boolean;
  since: string | null;
  requestedAt: string | null;
};

export async function getAddonState(agencyId: string): Promise<AddonState> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("agencies")
    .select("site_addon, site_addon_since, site_addon_requested_at")
    .eq("id", agencyId)
    .maybeSingle();

  return {
    active: data?.site_addon === true,
    since: (data?.site_addon_since as string) ?? null,
    requestedAt: (data?.site_addon_requested_at as string) ?? null,
  };
}

/** Lista tego, co wchodzi w dodatek. Używana w panelu i w cenniku. */
export const SITE_ADDON_INCLUDES: [string, string][] = [
  ["Osiem wzorów do wyboru", "Zmieniasz wzór jednym kliknięciem, bez przepisywania treści. Kolory i logo dopasowujemy do Waszej marki."],
  ["Oferty prosto z systemu", "Oferta oznaczona „na stronę” pojawia się na niej w ciągu minuty, ze zdjęciami po obróbce i znakiem wodnym biura."],
  ["Formularze wpadające do CRM", "Zapytanie o ofertę, zgłoszenie nieruchomości i zlecenie poszukiwania tworzą kontakt i zadanie dla konkretnego agenta."],
  ["Własna domena", "Podpinamy Waszą domenę razem z certyfikatem. Do tego czasu strona działa pod adresem w naszej domenie."],
  ["Zespół i poradnik", "Agenci sami uzupełniają swoje profile, a Wy dodajecie wpisy, które pozycjonują stronę w Google."],
  ["Hosting, kopie i aktualizacje", "Bez serwera, bez wtyczek i bez pilnowania aktualizacji. To jest część usługi."],
];
