"use server";

import { revalidatePath } from "next/cache";
import { requireOwner, requireModul } from "@/lib/auth";
import { brakKredytow } from "@/lib/kredyty";
import { zapiszBlad } from "@/lib/blad";
import { BladImportu, portal, zLinku, zTekstu, type ZOgloszenia } from "@/lib/import-ogloszenia";
import { getAgencySettings, saveAgencySettings } from "@/lib/agency-settings";
import { poprawnyKolor } from "@/lib/agency-settings-shared";

/** Kolor ofertówki dla całego biura. Zmienia go tylko CEO, bo to wygląd marki. */
export async function zapiszKolorOfertowki(kolor: string): Promise<{ ok: boolean; blad?: string }> {
  const user = await requireOwner();
  if (!user.agency_id) return { ok: false, blad: "Brak biura." };
  const s = await getAgencySettings(user.agency_id, user.agency?.name);
  const blad = await saveAgencySettings(user.agency_id, { options: { ...s.options, offer_color: poprawnyKolor(kolor) } });
  if (blad) return { ok: false, blad };
  revalidatePath("/app/ofertowka");
  return { ok: true };
}

/**
 * Uzupełnienie ofertówki z ogłoszenia: link do portalu albo wklejona treść.
 * Otodom nie kosztuje kredytów (czytamy dane wprost), resztę porządkuje AI.
 */
export async function importujOgloszenie(wejscie: { link?: string; tekst?: string }): Promise<{ ok: true; dane: ZOgloszenia } | { ok: false; blad: string }> {
  const user = await requireModul("nieruchomosci");
  const link = (wejscie.link ?? "").trim().slice(0, 600);
  const tekst = (wejscie.tekst ?? "").trim().slice(0, 15000);
  try {
    if (link) {
      const potrzebujeAi = portal(link) !== "otodom.pl";
      if (potrzebujeAi && (await brakKredytow(user, "import_ogloszenia"))) {
        return { ok: false, blad: "Brak kredytów AI na import z tego portalu albo funkcja jest wyłączona w demo. Link z Otodom działa bez kredytów." };
      }
      return { ok: true, dane: (await zLinku(link)).dane };
    }
    if (tekst.length < 40) return { ok: false, blad: "Wklej link albo całą treść ogłoszenia (co najmniej kilka zdań)." };
    if (await brakKredytow(user, "import_ogloszenia")) {
      return { ok: false, blad: "Brak kredytów AI albo funkcja jest wyłączona w demo." };
    }
    return { ok: true, dane: await zTekstu(tekst, "wklejona treść") };
  } catch (err) {
    if (err instanceof BladImportu) return { ok: false, blad: err.message };
    await zapiszBlad("ofertowka/import", err, { agencyId: user.agency_id });
    return { ok: false, blad: "Nie udało się odczytać ogłoszenia. Spróbuj wkleić treść ręcznie." };
  }
}
