"use server";

import { revalidatePath } from "next/cache";
import { requireOperator } from "@/lib/auth";
import { potwierdzWplate } from "@/lib/data-abonament";

/**
 * Potwierdzenie wpłaty z panelu operatora.
 *
 * Zastępuje ręczne zapytanie curlem. Uprawnienie sprawdzamy tu jeszcze raz,
 * bo akcja serwerowa jest osobnym punktem wejścia i nie wystarczy, że strona
 * z przyciskiem jest chroniona.
 */
export async function potwierdzZamowienie(orderId: string): Promise<{ ok: boolean; blad?: string }> {
  await requireOperator();

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { ok: false, blad: "Niepoprawny numer zamówienia." };

  const blad = await potwierdzWplate(orderId);
  if (blad) return { ok: false, blad };

  revalidatePath("/operator");
  return { ok: true };
}
