"use server";

import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { kluczTelefonu, liczba } from "@/lib/import-mapowanie";

/**
 * Zapis zaimportowanych rekordów.
 *
 * Plik czyta i mapuje przeglądarka, bo to pozwala pokazać podgląd przed
 * zapisem. Tutaj przychodzą już gotowe wiersze, ale NIE ufamy im: limit
 * liczby, przycinanie długości i własne rozpoznanie duplikatów po stronie
 * serwera, bo przeglądarkę da się obejść.
 */

const MAX_WIERSZY = 2000;

export type WynikImportu = {
  dodane: number;
  pominiete: number;
  bledy: string[];
};

function tekst(v: unknown, maks = 300): string | null {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, maks) : null;
}

export async function importujKlientow(
  wiersze: Record<string, string>[],
): Promise<WynikImportu> {
  const user = await requireModul("ustawienia");
  if (!user.agency_id) return { dodane: 0, pominiete: 0, bledy: ["Brak biura."] };

  const admin = createSupabaseAdmin();
  const paczka = wiersze.slice(0, MAX_WIERSZY);

  // Duplikaty liczymy względem tego, co JUŻ jest w biurze, a nie tylko
  // w pliku: import puszczony drugi raz nie ma podwoić bazy.
  const { data: istniejacy } = await admin
    .from("clients")
    .select("phone, email")
    .eq("agency_id", user.agency_id);

  const telefony = new Set(
    (istniejacy ?? []).map((k) => kluczTelefonu(String(k.phone ?? ""))).filter(Boolean),
  );
  const maile = new Set(
    (istniejacy ?? []).map((k) => String(k.email ?? "").toLowerCase()).filter(Boolean),
  );

  const doZapisu: Record<string, unknown>[] = [];
  const bledy: string[] = [];
  let pominiete = 0;

  paczka.forEach((w, i) => {
    const name = tekst(w.name, 200);
    if (!name) {
      pominiete++;
      if (bledy.length < 5) bledy.push(`Wiersz ${i + 2}: brak imienia i nazwiska.`);
      return;
    }

    const telefon = kluczTelefonu(w.phone ?? "");
    const mail = String(w.email ?? "").trim().toLowerCase();
    if ((telefon && telefony.has(telefon)) || (mail && maile.has(mail))) {
      pominiete++;
      return;
    }
    if (telefon) telefony.add(telefon);
    if (mail) maile.add(mail);

    doZapisu.push({
      agency_id: user.agency_id,
      agent_id: user.id,
      name,
      phone: tekst(w.phone, 40),
      email: mail || null,
      address: tekst(w.address, 300),
      budget_pln: liczba(w.budget_pln ?? ""),
      notes: tekst(w.notes, 4000),
      source: tekst(w.source, 80) ?? "import",
      status: "nowy",
      type: "inny",
    });
  });

  let dodane = 0;
  // Porcjami, bo jeden insert z dwoma tysiącami wierszy potrafi przekroczyć
  // limit zapytania, a wtedy przepada cały import zamiast jednej paczki.
  for (let i = 0; i < doZapisu.length; i += 200) {
    const czesc = doZapisu.slice(i, i + 200);
    const { error } = await admin.from("clients").insert(czesc);
    if (error) {
      if (bledy.length < 5) bledy.push(`Nie zapisano ${czesc.length} wierszy: ${error.message}`);
      continue;
    }
    dodane += czesc.length;
  }

  revalidatePath("/app/klienci");
  return { dodane, pominiete, bledy };
}

export async function importujOferty(
  wiersze: Record<string, string>[],
): Promise<WynikImportu> {
  const user = await requireModul("ustawienia");
  if (!user.agency_id) return { dodane: 0, pominiete: 0, bledy: ["Brak biura."] };

  const admin = createSupabaseAdmin();
  const paczka = wiersze.slice(0, MAX_WIERSZY);

  const { data: istniejace } = await admin
    .from("properties")
    .select("title, address")
    .eq("agency_id", user.agency_id);
  const klucze = new Set(
    (istniejace ?? []).map((p) => `${String(p.title ?? "").toLowerCase()}|${String(p.address ?? "").toLowerCase()}`),
  );

  const doZapisu: Record<string, unknown>[] = [];
  const bledy: string[] = [];
  let pominiete = 0;

  paczka.forEach((w, i) => {
    const title = tekst(w.title, 200);
    if (!title) {
      pominiete++;
      if (bledy.length < 5) bledy.push(`Wiersz ${i + 2}: brak nazwy oferty.`);
      return;
    }

    const adres = tekst(w.address, 300);
    const klucz = `${title.toLowerCase()}|${String(adres ?? "").toLowerCase()}`;
    if (klucze.has(klucz)) {
      pominiete++;
      return;
    }
    klucze.add(klucz);

    const najem = /wynajem|najem/i.test(String(w.deal_kind ?? ""));

    doZapisu.push({
      agency_id: user.agency_id,
      created_by: user.id,
      title,
      city: tekst(w.city, 120),
      address: adres,
      price_pln: liczba(w.price_pln ?? ""),
      area_m2: liczba(w.area_m2 ?? ""),
      rooms: liczba(w.rooms ?? ""),
      floor: liczba(w.floor ?? ""),
      description: tekst(w.description, 8000),
      offer_no: tekst(w.offer_no, 60),
      deal_kind: najem ? "wynajem" : "sprzedaz",
      // Importowane oferty lądują w archiwum, a nie na stronie biura: agent
      // ma je przejrzeć i sam zdecydować, co wraca do sprzedaży.
      status: "archiwum",
      property_type: "mieszkanie",
    });
  });

  let dodane = 0;
  for (let i = 0; i < doZapisu.length; i += 200) {
    const czesc = doZapisu.slice(i, i + 200);
    const { error } = await admin.from("properties").insert(czesc);
    if (error) {
      if (bledy.length < 5) bledy.push(`Nie zapisano ${czesc.length} wierszy: ${error.message}`);
      continue;
    }
    dodane += czesc.length;
  }

  revalidatePath("/app/nieruchomosci");
  return { dodane, pominiete, bledy };
}
