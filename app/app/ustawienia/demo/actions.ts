"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { utworzZespolDemo, wyczyscDemo, zasiejDemo } from "@/lib/demo/zasiew";

/**
 * Sterowanie kontem demo.
 *
 * Wszystko za rolą właściciela i dodatkowo za sprawdzeniem, czy biuro ma
 * mało prawdziwych danych. Pomyłka oznaczałaby skasowanie bazy pracującego
 * biura, więc wolę jedno sprawdzenie za dużo.
 */

export type Wynik = { ok: boolean; message: string; szczegoly?: string[] };

const PROG_PRAWDZIWYCH_OFERT = 5;

async function upewnijSieZeToDemo(agencyId: string): Promise<string | null> {
  const admin = createSupabaseAdmin();

  const { data: agency } = await admin.from("agencies").select("is_demo").eq("id", agencyId).maybeSingle();
  if (agency?.is_demo) return null;

  const { data: oferty } = await admin
    .from("properties")
    .select("offer_no")
    .eq("agency_id", agencyId)
    .limit(100);

  const prawdziwe = (oferty ?? []).filter((o) => !(o.offer_no ?? "").startsWith("DEMO-")).length;
  if (prawdziwe > PROG_PRAWDZIWYCH_OFERT) {
    return `To biuro ma ${prawdziwe} prawdziwych ofert, więc nie wygląda na konto demo. Operacja skasowałaby te dane, dlatego jej nie wykonuję.`;
  }
  return null;
}

/**
 * Buduje zespół demo: zakłada brakujące konta i usuwa te, których nie ma
 * już w składzie. Bez profili nie ma rankingu ani prowizji per osoba.
 */
export async function zalozZespol(): Promise<Wynik> {
  const user = await requireOwner();
  if (!user.agency_id) return { ok: false, message: "Brak biura." };

  const blokada = await upewnijSieZeToDemo(user.agency_id);
  if (blokada) return { ok: false, message: blokada };

  const { utworzonych, usunietych, pominietych } = await utworzZespolDemo(user.agency_id);

  // Usunięcie profilu kasuje kaskadą jego klientów i oferty, więc po zmianie
  // składu zespołu dane trzeba złożyć od nowa. Robimy to od razu, zamiast
  // zostawiać konto w połowicznym stanie.
  const w = usunietych > 0 || utworzonych > 0 ? await zasiejDemo(user.agency_id) : null;
  revalidatePath("/app", "layout");

  const czesci: string[] = [];
  if (usunietych > 0) czesci.push(`usunięto ${usunietych} nieaktualnych kont`);
  if (utworzonych > 0) czesci.push(`dodano ${utworzonych} osób`);

  return {
    ok: true,
    message: czesci.length > 0 ? `Zespół gotowy: ${czesci.join(", ")}.` : "Zespół jest już aktualny.",
    szczegoly: [
      ...(w ? [`Dane odtworzone: ${w.dzialania} działań, ${w.oferty} ofert, ${w.klienci} klientów.`] : []),
      ...pominietych,
    ],
  };
}

/** Wypełnia biuro danymi liczonymi od dzisiaj. */
export async function odswiezDane(): Promise<Wynik> {
  const user = await requireOwner();
  if (!user.agency_id) return { ok: false, message: "Brak biura." };

  const blokada = await upewnijSieZeToDemo(user.agency_id);
  if (blokada) return { ok: false, message: blokada };

  const w = await zasiejDemo(user.agency_id);
  revalidatePath("/app", "layout");

  return {
    ok: true,
    message: "Dane odświeżone.",
    szczegoly: [
      `Klienci: ${w.klienci}`,
      `Oferty: ${w.oferty}`,
      `Transakcje: ${w.transakcje}`,
      `Działania w kalendarzu: ${w.dzialania}`,
      `Cele agentów: ${w.cele}`,
      `Wpisy dziennika: ${w.wpisyDziennika}`,
      ...(w.brakMigracji
        ? ["UWAGA: uruchom migrację lib/SETUP-v30-konto-demo.sql, inaczej dane nie będą odświeżać się same."]
        : []),
    ],
  };
}

/** Czyści dane demo. Konta zespołu zostają, żeby nie zakładać ich od nowa. */
export async function wyczysc(): Promise<Wynik> {
  const user = await requireOwner();
  if (!user.agency_id) return { ok: false, message: "Brak biura." };

  const blokada = await upewnijSieZeToDemo(user.agency_id);
  if (blokada) return { ok: false, message: blokada };

  await wyczyscDemo(user.agency_id);
  revalidatePath("/app", "layout");
  return { ok: true, message: "Dane demo usunięte. Konta zespołu zostały." };
}
