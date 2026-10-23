"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
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
