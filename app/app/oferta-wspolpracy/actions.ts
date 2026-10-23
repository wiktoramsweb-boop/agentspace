"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { getAgencySettings, saveAgencySettings } from "@/lib/agency-settings";
import { poprawnyKolor } from "@/lib/agency-settings-shared";
import { wzorZUstawien, type WzorOferty } from "@/lib/oferta-wzor";

/** Wzór oferty i kolor biura ustawia CEO raz dla całego zespołu. */
export async function zapiszWzorOferty(wzor: WzorOferty, kolor: string): Promise<{ ok: boolean; blad?: string }> {
  const user = await requireOwner();
  if (!user.agency_id) return { ok: false, blad: "Brak biura." };
  const s = await getAgencySettings(user.agency_id, user.agency?.name);
  const blad = await saveAgencySettings(user.agency_id, {
    options: { ...s.options, oferta_wzor: wzorZUstawien(wzor), offer_color: poprawnyKolor(kolor) },
  });
  if (blad) return { ok: false, blad };
  revalidatePath("/app/oferta-wspolpracy");
  revalidatePath("/app/ofertowka");
  return { ok: true };
}
