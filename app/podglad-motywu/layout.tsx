import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";

/**
 * Podgląd motywu to narzędzie wewnętrzne: audyt kontrastu, demo dokumentów
 * i testy przetwarzania zdjęć. Nie jest częścią produktu, więc wymaga
 * zalogowania. Wcześniej strona była publiczna i każdy mógł obejrzeć
 * przykładowe dokumenty wraz z danymi firmy.
 */
export const metadata = { robots: { index: false, follow: false } };

export default async function PodgladMotywuLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
