"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { maV49 } from "@/lib/schemat";
import { CLIENT_STATUSES, PROCESS_STAGES } from "@/lib/types";
import { poZmianieEtapuOferty, poZmianieStatusuKlienta } from "@/lib/zdarzenia";

type Kolejnosc = { id: string; pos: number }[];

/**
 * Przeniesienie karty na tablicy. Zwraca komunikat błędu albo null.
 *
 * Zmiana kolumny to zmiana statusu (klient) albo etapu (oferta), więc
 * uruchamia te same automatyzacje i ten sam wpis w dzienniku co zmiana
 * z karty. Sama zmiana kolejności w kolumnie niczego nie uruchamia.
 */
async function zapiszKolejnosc(tabela: "clients" | "properties", agencyId: string, kolejnosc: Kolejnosc) {
  if (!(await maV49()) || !kolejnosc.length) return;
  const admin = createSupabaseAdmin();
  // Najwyżej jedna kolumna kart, więc kilkadziesiąt zapisów w skrajnym przypadku.
  await Promise.all(
    kolejnosc.slice(0, 200).map((k) =>
      Number.isFinite(k.pos)
        ? admin.from(tabela).update({ kanban_pos: k.pos }).eq("id", k.id).eq("agency_id", agencyId)
        : null,
    ),
  );
}

export async function przeniesKlienta(id: string, status: string, kolejnosc: Kolejnosc): Promise<string | null> {
  const user = await requireUser();
  if (!user.agency_id) return "Konto nie jest przypisane do biura.";
  if (!CLIENT_STATUSES.some((s) => s.value === status)) return "Nieznany status.";
  const admin = createSupabaseAdmin();
  const { data: przed } = await admin
    .from("clients")
    .select("status, name")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!przed) return "Nie znaleziono klienta.";

  if (przed.status !== status) {
    const { error } = await admin
      .from("clients")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("agency_id", user.agency_id);
    if (error) return `Nie udało się zapisać: ${error.message}`;
    after(() => poZmianieStatusuKlienta(user, id, status, przed.name as string));
  }
  await zapiszKolejnosc("clients", user.agency_id, kolejnosc);
  revalidatePath("/app/klienci");
  return null;
}

export async function przeniesOferte(id: string, etap: string, kolejnosc: Kolejnosc): Promise<string | null> {
  const user = await requireUser();
  if (!user.agency_id) return "Konto nie jest przypisane do biura.";
  if (!PROCESS_STAGES.some((s) => s.value === etap)) return "Nieznany etap.";
  const admin = createSupabaseAdmin();
  const { data: przed } = await admin
    .from("properties")
    .select("process_stage, title")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!przed) return "Nie znaleziono oferty.";

  if ((przed.process_stage ?? "przyjeta") !== etap) {
    const teraz = new Date().toISOString();
    const { error } = await admin
      .from("properties")
      .update({ process_stage: etap, process_changed_at: teraz, updated_at: teraz })
      .eq("id", id)
      .eq("agency_id", user.agency_id);
    if (error) return `Nie udało się zapisać: ${error.message}`;
    after(() => poZmianieEtapuOferty(user, id, etap, przed.title as string));
  }
  await zapiszKolejnosc("properties", user.agency_id, kolejnosc);
  revalidatePath("/app/nieruchomosci");
  return null;
}
