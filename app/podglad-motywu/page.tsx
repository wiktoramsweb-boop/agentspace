import { notFound } from "next/navigation";
import { ThemePreview } from "./theme-preview";

/**
 * Podgląd jasnego motywu aplikacji. Tylko tryb deweloperski (na produkcji 404),
 * bo to narzędzie do pracy nad wyglądem, nie część produktu.
 */
export default function PodgladMotywuPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ThemePreview />;
}
