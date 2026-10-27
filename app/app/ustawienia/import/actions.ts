"use server";

import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { dopasujOsobe, kluczTelefonu, linkiZdjec, liczba, statusOferty, typKlienta } from "@/lib/import-mapowanie";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { pobierzPartieZdjec } from "@/lib/import-zdjec";
import { gosciaBlokujemy } from "@/lib/demo/straz";
import { escapeHtml } from "@/lib/html";
import { Resend } from "resend";

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
  /** Ile zdjęć czeka na pobranie z poprzedniego systemu. */
  zdjecDoPobrania?: number;
};

type Admin = ReturnType<typeof createSupabaseAdmin>;

/** Kolumny z v54 (ID z poprzedniego systemu, kolejka zdjęć). Bez nich import działa jak dawniej. */
async function maV54(admin: Admin): Promise<boolean> {
  const { error } = await admin.from("properties").select("external_id").limit(1);
  return !error;
}

async function zespol(admin: Admin, agencyId: string) {
  const { data } = await admin.from("profiles").select("id, email, full_name").eq("agency_id", agencyId);
  return (data ?? []) as { id: string; email: string | null; full_name: string | null }[];
}

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
  const v54 = await maV54(admin);
  const ludzie = await zespol(admin, user.agency_id);
  const { data: surowiKlienci } = await admin
    .from("clients")
    .select(v54 ? "phone, email, external_id" : "phone, email")
    .eq("agency_id", user.agency_id);
  const istniejacy = (surowiKlienci ?? []) as unknown as { phone: string | null; email: string | null; external_id?: string | null }[];
  const zewnetrzne = new Set(((istniejacy ?? []) as { external_id?: string | null }[]).map((k) => k.external_id).filter(Boolean));

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
    const zewn = tekst(w.external_id, 80);
    if ((telefon && telefony.has(telefon)) || (mail && maile.has(mail)) || (zewn && zewnetrzne.has(zewn))) {
      pominiete++;
      return;
    }
    if (telefon) telefony.add(telefon);
    if (mail) maile.add(mail);

    if (zewn) zewnetrzne.add(zewn);
    doZapisu.push({
      agency_id: user.agency_id,
      agent_id: dopasujOsobe(w.agent ?? "", ludzie) ?? user.id,
      ...(v54 && zewn ? { external_id: zewn } : {}),
      name,
      phone: tekst(w.phone, 40),
      email: mail || null,
      address: tekst(w.address, 300),
      budget_pln: liczba(w.budget_pln ?? ""),
      notes: tekst(w.notes, 4000),
      source: tekst(w.source, 80) ?? "import",
      status: "nowy",
      type: typKlienta(w.type ?? ""),
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

  if (dodane) await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "import", rodzaj: "klient", opis: `Import klientów z pliku: ${dodane} dodanych, ${pominiete} pominiętych` });
  revalidatePath("/app/klienci");
  return { dodane, pominiete, bledy };
}

export async function importujOferty(
  wiersze: Record<string, string>[],
  opcje: { aktywne?: boolean } = {},
): Promise<WynikImportu> {
  const user = await requireModul("ustawienia");
  if (!user.agency_id) return { dodane: 0, pominiete: 0, bledy: ["Brak biura."] };

  const admin = createSupabaseAdmin();
  const paczka = wiersze.slice(0, MAX_WIERSZY);

  const v54 = await maV54(admin);
  const ludzie = await zespol(admin, user.agency_id);
  const { data: suroweOferty } = await admin
    .from("properties")
    .select(v54 ? "title, address, external_id" : "title, address")
    .eq("agency_id", user.agency_id);
  const istniejace = (suroweOferty ?? []) as unknown as { title: string | null; address: string | null; external_id?: string | null }[];
  const zewnetrzne = new Set(((istniejace ?? []) as { external_id?: string | null }[]).map((k) => k.external_id).filter(Boolean));
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
    const zewn = tekst(w.external_id, 80);
    if (klucze.has(klucz) || (zewn && zewnetrzne.has(zewn))) {
      pominiete++;
      return;
    }
    klucze.add(klucz);
    if (zewn) zewnetrzne.add(zewn);
    const zdjecia = v54 ? linkiZdjec(w.photos ?? "") : [];
    const opiekun = dopasujOsobe(w.agent ?? "", ludzie) ?? user.id;

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
      agent_id: opiekun,
      // Domyślnie archiwum, a nie strona biura: agent ma przejrzeć oferty.
      // Biuro, które przenosi całą bazę, wybiera w kreatorze „od razu aktywne”.
      status: statusOferty(w.status ?? "", opcje.aktywne ? "aktywna" : "archiwum"),
      ...(v54 ? { external_id: zewn, import_photo_urls: zdjecia } : {}),
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

  const zdjecDoPobrania = doZapisu.reduce((a, o) => a + ((o.import_photo_urls as string[] | undefined)?.length ?? 0), 0);
  if (dodane) await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "import", rodzaj: "oferta", opis: `Import ofert z pliku: ${dodane} dodanych, ${pominiete} pominiętych, ${zdjecDoPobrania} zdjęć do pobrania` });
  revalidatePath("/app/nieruchomosci");
  return { dodane, pominiete, bledy, zdjecDoPobrania };
}

/** Kolejna partia zdjęć z poprzedniego systemu. Kreator woła ją, dopóki coś zostało. */
export async function pobierzZdjeciaImportu(): Promise<{ pobrane: number; nieudane: number; zostalo: number }> {
  const user = await requireModul("ustawienia");
  if (!user.agency_id) return { pobrane: 0, nieudane: 0, zostalo: 0 };
  const w = await pobierzPartieZdjec(user.agency_id);
  if (w.pobrane) revalidatePath("/app/nieruchomosci");
  return w;
}

/**
 * „Przenieście nam bazę”: zgłoszenie migracji, które obsługujemy ręcznie.
 * Zapisujemy je w bazie i wysyłamy powiadomienie do zespołu AgentSpace.
 */
export async function zglosMigracje(fd: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireModul("ustawienia");
  if (!user.agency_id) return { ok: false, error: "Brak biura." };
  const system = tekst(fd.get("system"), 80);
  if (!system) return { ok: false, error: "Napisz, z jakiego programu przechodzicie." };
  const oferty = liczba(String(fd.get("oferty") ?? ""));
  const klienci = liczba(String(fd.get("klienci") ?? ""));
  const notatka = tekst(fd.get("notatka"), 2000);
  const link = tekst(fd.get("link"), 500);
  const telefon = tekst(fd.get("telefon"), 40);

  const { error } = await createSupabaseAdmin()
    .from("migration_requests")
    .insert({
      agency_id: user.agency_id,
      created_by: user.id,
      system,
      offers_count: oferty,
      clients_count: klienci,
      note: [notatka, link ? `Pliki: ${link}` : null, telefon ? `Telefon: ${telefon}` : null].filter(Boolean).join("\n") || null,
    });
  if (error) return { ok: false, error: /migration_requests/.test(error.message) ? "Zgłoszenie wymaga migracji lib/SETUP-v54-oddzialy-prowizje.sql." : error.message };

  const key = process.env.RESEND_API_KEY;
  const doNas = process.env.NOTIFICATION_EMAIL;
  if (key && doNas && !(await gosciaBlokujemy())) {
    await new Resend(key).emails
      .send({
        from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
        to: doNas,
        replyTo: user.email ?? undefined,
        subject: `Migracja bazy: ${user.agency?.name ?? "biuro"} z ${system}`,
        html: `<p><b>${escapeHtml(user.agency?.name ?? "")}</b> (${escapeHtml(user.full_name ?? "")}, ${escapeHtml(user.email ?? "")}${telefon ? `, ${escapeHtml(telefon)}` : ""})</p>
<p>System: ${escapeHtml(system)}<br/>Oferty: ${oferty ?? "?"} · Klienci: ${klienci ?? "?"}</p>
${link ? `<p>Pliki: ${escapeHtml(link)}</p>` : ""}${notatka ? `<p>${escapeHtml(notatka).replace(/\n/g, "<br/>")}</p>` : ""}`,
      })
      .catch(() => null);
  }
  await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "migracja_zgloszona", rodzaj: "ustawienia", opis: `Zgłoszenie przeniesienia bazy z ${system}` });
  return { ok: true };
}
