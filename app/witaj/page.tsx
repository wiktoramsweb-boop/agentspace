import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { DEMO_EMAIL } from "@/lib/demo/tryb";
import { Samouczek } from "./samouczek";

export const metadata: Metadata = {
  title: "Witaj w AgentSpace",
  robots: { index: false, follow: false },
};

/**
 * Samouczek po założeniu konta i po wejściu do demo.
 *
 * Poza layoutem /app celowo: pełny ekran bez menu, jedna rzecz naraz.
 * Wszystko tu jest pokazem na przykładowej sprawie i niczego nie zapisuje,
 * więc działa tak samo dla gościa demo, któremu zapis jest zablokowany.
 */
export default async function WitajPage() {
  const user = await requireUser();
  const imie = (user.full_name ?? "").trim().split(/\s+/)[0] || null;
  return (
    <Samouczek
      imie={user.email?.toLowerCase() === DEMO_EMAIL ? null : imie}
      ceo={user.role === "owner"}
      demo={user.email?.toLowerCase() === DEMO_EMAIL}
      biuro={user.agency?.name ?? "Twoje biuro"}
    />
  );
}
