import { createSupabaseAdmin } from "./supabase/admin";
import { CLIENT_TYPE_LABELS } from "./types";
import { ETAPY_LEJKA } from "./priorytety";
import { priorytetyDnia } from "./data-priorytety";
import { formatPln } from "./format";
import { formatDatePL } from "./datetime";

type Osoba = { id: string; role: string; agency_id: string | null; full_name?: string | null };

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * Kontekst ekranu dla asystenta AI: co agent ma teraz przed oczami.
 *
 * Bierzemy dane z bazy po adresie, a nie z przeglądarki, żeby asystent nie
 * dostał niczego, czego ta osoba nie może zobaczyć. Cudzy klient trafia tu bez
 * telefonu, maila i notatek, a kwot transakcji nie podajemy wcale.
 */
export async function kontekstAsystenta(user: Osoba, sciezka: string): Promise<string> {
  if (!user.agency_id) return "";
  const admin = createSupabaseAdmin();
  const zarzadza = user.role === "owner" || user.role === "manager";

  const klient = sciezka.match(new RegExp(`^/app/klienci/(${UUID})`));
  if (klient) {
    const { data: c } = await admin.from("clients").select("*").eq("id", klient[1]).eq("agency_id", user.agency_id).maybeSingle();
    if (!c) return "Agent jest na karcie klienta, do której nie ma dostępu.";
    const swoj = zarzadza || c.agent_id === user.id;
    const linie = [
      `Ekran: karta klienta „${c.name}”.`,
      `Typ: ${CLIENT_TYPE_LABELS[c.type] ?? c.type}. Etap: ${ETAPY_LEJKA.find((e) => e.value === c.status)?.label ?? c.status}.`,
      c.budget_pln ? `Budżet: ${formatPln(c.budget_pln)}.` : null,
      c.property ? `Czego szuka / co ma: ${String(c.property).slice(0, 300)}.` : null,
      c.city ? `Miasto: ${c.city}.` : null,
      c.last_contact_at ? `Ostatni kontakt: ${formatDatePL(c.last_contact_at)}.` : "Jeszcze nie było kontaktu.",
      c.next_contact_at ? `Zaplanowany kontakt: ${formatDatePL(c.next_contact_at)}.` : null,
    ];
    if (swoj) {
      if (c.notes) linie.push(`Opis: ${String(c.notes).slice(0, 600)}`);
      const { data: notatki } = await admin
        .from("client_notes")
        .select("content, created_at")
        .eq("client_id", c.id)
        .order("created_at", { ascending: false })
        .limit(5);
      for (const n of notatki ?? []) linie.push(`Notatka ${formatDatePL(n.created_at)}: ${String(n.content).slice(0, 400)}`);
    } else {
      linie.push("To klient innego agenta, szczegóły kontaktu i notatki są ukryte.");
    }
    return linie.filter(Boolean).join("\n");
  }

  const oferta = sciezka.match(new RegExp(`^/app/nieruchomosci/(${UUID})`));
  if (oferta) {
    const { data: p } = await admin.from("properties").select("*").eq("id", oferta[1]).eq("agency_id", user.agency_id).maybeSingle();
    if (!p) return "Agent jest na karcie oferty, do której nie ma dostępu.";
    return [
      `Ekran: oferta „${p.title}”.`,
      `Rodzaj: ${p.property_type}, ${p.deal_kind}. Status: ${p.status}.`,
      p.address || p.city ? `Adres: ${[p.address, p.city].filter(Boolean).join(", ")}.` : null,
      p.price_pln ? `Cena: ${formatPln(p.price_pln)}.` : null,
      p.area_m2 ? `Metraż: ${p.area_m2} m².` : null,
      p.rooms ? `Pokoje: ${p.rooms}.` : null,
      p.floor != null ? `Piętro: ${p.floor}.` : null,
      p.description ? `Opis: ${String(p.description).slice(0, 1500)}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // Każdy inny ekran: najpilniejsze sprawy dnia, żeby „co mam dziś zrobić” miało odpowiedź.
  const { sprawy } = await priorytetyDnia(user.id, 5);
  if (sprawy.length === 0) return `Ekran: ${sciezka}. Agent nie ma jeszcze aktywnych klientów.`;
  return [
    `Ekran: ${sciezka}. Najpilniejsze sprawy agenta na dziś:`,
    ...sprawy.map(
      (s, i) =>
        `${i + 1}. ${s.name} (${CLIENT_TYPE_LABELS[s.type] ?? s.type}, etap ${ETAPY_LEJKA.find((e) => e.value === s.status)?.label ?? s.status}, ocena ${s.ocena.wynik}/100): ${s.ocena.powod}.`,
    ),
  ].join("\n");
}
