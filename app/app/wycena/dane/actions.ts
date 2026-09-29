"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { importGusPriceLevels } from "@/lib/wycena/import-gus";
import { importRcnCsv } from "@/lib/wycena/import-rcn";
import { normalizeCity } from "@/lib/wycena/poziomy";

/**
 * Zarządzanie danymi rynkowymi wyceny.
 *
 * Tylko właściciel: import zmienia podstawę, na której agenci podają klientom
 * kwoty, więc nie jest to operacja dla każdego użytkownika.
 */

export type ActionResult = { ok: boolean; message: string; details?: string[] };

/** Pobranie średnich cen transakcyjnych z Banku Danych Lokalnych GUS. */
export async function importFromGus(): Promise<ActionResult> {
  await requireOwner();

  const thisYear = new Date().getFullYear();
  // GUS publikuje dane z opóźnieniem, więc sięgamy kilka lat wstecz
  // i tak bierzemy najświeższy dostępny rocznik.
  const years = [thisYear, thisYear - 1, thisYear - 2, thisYear - 3];

  const res = await importGusPriceLevels(years);
  revalidatePath("/app/wycena/dane");

  return {
    ok: res.ok,
    message: res.message,
    details: [
      ...res.variablesFound.slice(0, 5).map((v) => `Zmienna ${v.id}: ${v.name}`),
      ...res.errors,
    ],
  };
}

/** Import wypisu z Rejestru Cen Nieruchomości w formacie CSV. */
export async function importRcnFile(formData: FormData): Promise<ActionResult> {
  const user = await requireOwner();

  const file = formData.get("plik");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Wybierz plik CSV." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { ok: false, message: "Plik jest większy niż 20 MB. Podziel go na części." };
  }

  const tag = String(formData.get("etykieta") ?? "").trim() || "rcn";
  const csv = await file.text();

  // Import należy do biura, które go wgrało. Dane jednego biura nie trafiają
  // do wycen innego - inaczej jeden zepsuty plik psułby wyniki wszystkim.
  const res = await importRcnCsv(csv, tag, user.agency_id);
  revalidatePath("/app/wycena/dane");

  return {
    ok: res.imported > 0,
    message:
      res.imported > 0
        ? `Zaimportowano ${res.imported} transakcji z ${res.parsed} wierszy.`
        : `Nie zaimportowano nic z ${res.parsed} wierszy. Sprawdź, czy plik ma kolumny z powierzchnią, ceną i datą.`,
    details: res.errors.slice(0, 12),
  };
}

/** Ręczne wpisanie poziomu cen, na przykład z kwartalnego raportu NBP. */
export async function addPriceLevel(formData: FormData): Promise<ActionResult> {
  await requireOwner();

  const city = normalizeCity(String(formData.get("miasto") ?? "").trim());
  const price = Number(String(formData.get("cena") ?? "").replace(/\s/g, "").replace(",", "."));
  const period = String(formData.get("okres") ?? "").trim();
  const market = String(formData.get("rynek") ?? "").trim() || null;

  if (!city) return { ok: false, message: "Podaj miasto." };
  if (!Number.isFinite(price) || price <= 0) return { ok: false, message: "Podaj cenę za metr." };
  if (!/^\d{4}(-Q[1-4])?$/.test(period)) {
    return { ok: false, message: "Okres podaj jako rok (2026) albo kwartał (2026-Q2)." };
  }

  // Koniec okresu: rok albo kwartał. Po tym sortujemy, szukając najświeższej wartości.
  const year = Number(period.slice(0, 4));
  const quarter = period.includes("-Q") ? Number(period.slice(-1)) : 4;
  const periodEnd = new Date(Date.UTC(year, quarter * 3, 0)).toISOString().slice(0, 10);

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("market_price_levels").upsert(
    {
      source: "reczne",
      source_ref: `${city}:${period}:${market ?? "-"}`,
      city,
      property_type: "mieszkanie",
      market,
      period,
      period_end: periodEnd,
      price_per_m2: price,
    },
    { onConflict: "source,city,property_type,market,period" },
  );

  if (error) return { ok: false, message: `Nie udało się zapisać: ${error.message}` };

  revalidatePath("/app/wycena/dane");
  return { ok: true, message: `Zapisano ${city}: ${price.toLocaleString("pl-PL")} zł/m² za okres ${period}.` };
}
