"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { potwierdzWplate } from "@/lib/data-abonament";
import { hitLimit, visitorKey } from "@/lib/rate-limit";
import {
  NAZWA_CIASTKA,
  danePoprawne,
  nowaSesja,
  panelSkonfigurowany,
  sesjaWazna,
} from "@/lib/operator-auth";

export type WynikLogowania = { error: string } | undefined;

/**
 * Logowanie do panelu operatora.
 *
 * Komunikat o błędzie jest zawsze ten sam, niezależnie od tego, czy pomylony
 * został login, czy hasło. Próby ograniczamy po adresie, bo to jedyne drzwi
 * do widoku wszystkich biur.
 */
export async function zalogujOperatora(
  _prev: WynikLogowania,
  formData: FormData,
): Promise<WynikLogowania> {
  if (!panelSkonfigurowany()) {
    return { error: "Panel nie jest skonfigurowany." };
  }

  if (await hitLimit(`operator:login:${await visitorKey()}`, 10, 15 * 60)) {
    return { error: "Zbyt wiele prób. Spróbuj za kwadrans." };
  }

  const login = String(formData.get("login") ?? "");
  const haslo = String(formData.get("haslo") ?? "");

  if (!danePoprawne(login, haslo)) {
    return { error: "Niepoprawne dane logowania." };
  }

  const { wartosc, maxAge } = nowaSesja();
  (await cookies()).set(NAZWA_CIASTKA, wartosc, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/operator",
    maxAge,
  });

  redirect("/operator");
}

export async function wylogujOperatora(): Promise<void> {
  (await cookies()).delete({ name: NAZWA_CIASTKA, path: "/operator" });
  redirect("/operator/login");
}

/**
 * Potwierdzenie wpłaty z panelu.
 *
 * Sprawdzamy sesję jeszcze raz: akcja serwerowa jest osobnym punktem wejścia
 * i nie wystarczy, że strona z przyciskiem jest chroniona.
 */
export async function potwierdzZamowienie(orderId: string): Promise<{ ok: boolean; blad?: string }> {
  if (!(await sesjaWazna())) return { ok: false, blad: "Sesja wygasła. Zaloguj się ponownie." };
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { ok: false, blad: "Niepoprawny numer zamówienia." };

  const blad = await potwierdzWplate(orderId);
  if (blad) return { ok: false, blad };

  revalidatePath("/operator");
  return { ok: true };
}
