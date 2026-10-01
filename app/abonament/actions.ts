"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { zlozZamowienie } from "@/lib/data-abonament";
import type { Okres } from "@/lib/abonament-cennik";

export type WynikZamowienia = { ok: true; id: string } | { ok: false; error: string };

/**
 * Zamówienie abonamentu składa CEO. Agent nie może zobowiązać biura do
 * płatności, nawet jeśli trafi na ten ekran po wygaśnięciu dostępu.
 */
export async function zamow(planId: string, okres: Okres): Promise<WynikZamowienia> {
  const user = await requireUser();
  if (user.role !== "owner") {
    return { ok: false, error: "Abonament może wykupić tylko właściciel biura." };
  }
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const wynik = await zlozZamowienie({
    agencyId: user.agency_id,
    userId: user.id,
    planId,
    okres,
  });
  if (wynik.ok) revalidatePath("/abonament");
  return wynik;
}
