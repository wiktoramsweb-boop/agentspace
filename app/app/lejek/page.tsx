import { redirect } from "next/navigation";

/** Lejek to tablica klientów. Własny adres, żeby miał stałe miejsce w menu. */
export default function LejekPage() {
  redirect("/app/klienci?widok=tablica");
}
