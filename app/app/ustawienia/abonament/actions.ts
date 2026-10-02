"use server";

import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { zamowKredyty, zamowStrone, zlozZamowienie } from "@/lib/data-abonament";
import type { Okres } from "@/lib/abonament-cennik";

export type WynikZamowienia = { ok: true; id: string } | { ok: false; error: string };

/**
 * Wszystkie zakupy biura idą przez moduł „abonament”. Domyślnie ma go tylko
 * CEO, ale może go nadać na przykład dyrektorowi albo księgowej, bo to on
 * decyduje, kto w biurze zaciąga zobowiązania.
 */
async function kupujacy() {
  const user = await requireModul("abonament");
  if (!user.agency_id) throw new Error("Konto nie jest przypisane do biura.");
  return user;
}

export async function zamowAbonament(planId: string, okres: Okres): Promise<WynikZamowienia> {
  const user = await kupujacy();
  const wynik = await zlozZamowienie({
    agencyId: user.agency_id!,
    userId: user.id,
    planId,
    okres,
  });
  if (wynik.ok) revalidatePath("/app/ustawienia/abonament");
  return wynik;
}

export async function zamowStroneWww(okres: Okres): Promise<WynikZamowienia> {
  const user = await kupujacy();
  const wynik = await zamowStrone({ agencyId: user.agency_id!, userId: user.id, okres });
  if (wynik.ok) revalidatePath("/app/ustawienia/abonament");
  return wynik;
}

export async function zamowPakietKredytow(pakietId: string): Promise<WynikZamowienia> {
  const user = await kupujacy();
  const wynik = await zamowKredyty({ agencyId: user.agency_id!, userId: user.id, pakietId });
  if (wynik.ok) revalidatePath("/app/ustawienia/abonament");
  return wynik;
}
