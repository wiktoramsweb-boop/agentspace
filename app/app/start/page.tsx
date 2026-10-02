import { requireUser } from "@/lib/auth";
import { getPrzewodnik } from "@/lib/data-przewodnik";
import { PrzewodnikWidok } from "./widok";

export const metadata = { title: "Jak zacząć" };

/** Prowadzenie nowego biura krok po kroku. Sam widok jest w `widok.tsx`. */
export default async function StartPage() {
  const user = await requireUser();
  const p = await getPrzewodnik(user);
  return <PrzewodnikWidok p={p} czyCeo={user.role === "owner"} />;
}
