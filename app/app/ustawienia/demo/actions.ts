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

/** Zakłada konta agentów, bez nich nie ma zespołu, rankingu ani prowizji per agent. */
export async function zalozZespol(): Promise<Wynik> {
  const user = await requireOwner();
  if (!user.agency_id) return { ok: false, message: "Brak biura." };

  const blokada = await upewnijSieZeToDemo(user.agency_id);
  if (blokada) return { ok: false, message: blokada };

  const { utworzonych, pominietych } = await utworzZespolDemo(user.agency_id);
  revalidatePath("/app/ustawienia/demo");

  return {
    ok: utworzonych > 0 || pominietych.length === 0,
    message:
      utworzonych > 0
        ? `Dodano ${utworzonych} osób do zespołu.`
        : "Zespół już istnieje, nic nie trzeba było dodawać.",
    szczegoly: pominietych,
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
