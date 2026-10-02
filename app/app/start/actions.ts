"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { getAgencySettings, saveAgencySettings } from "@/lib/agency-settings";

/**
 * Pominięcie przewodnika.
 *
 * Zapisujemy w opcjach biura, a nie przy koncie, bo decyzja dotyczy całego
 * biura: to CEO ustawia firmę i to on stwierdza, że nie potrzebuje
 * prowadzenia za rękę.
 */
export async function pomijPrzewodnik(): Promise<{ ok: boolean; error?: string }> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const { options } = await getAgencySettings(owner.agency_id, owner.agency?.name);
  const err = await saveAgencySettings(owner.agency_id, {
    options: { ...options, onboarding_skipped: true },
  });
  if (err) return { ok: false, error: err };

  revalidatePath("/app", "layout");
  return { ok: true };
}
