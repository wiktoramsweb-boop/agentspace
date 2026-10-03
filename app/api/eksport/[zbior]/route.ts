import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { maModul } from "@/lib/role";
import { todayPL } from "@/lib/datetime";
import { ZBIORY, doCsv, nazwaPliku, type Zbior } from "@/lib/eksport-csv";

/**
 * Eksport danych biura do CSV.
 *
 * Dane wychodzą zawsze z zakresu CAŁEGO biura, więc wymagamy roli, która
 * widzi całe biuro. Agent nie wynosi stąd bazy kolegów - do swoich danych
 * ma listy w aplikacji.
 *
 * Eksport działa też po wygaśnięciu abonamentu. To jest celowe: biuro, które
 * rezygnuje, musi móc zabrać swoje dane. Odcięcie ich byłoby dokładnie tym
 * lock-inem, którego obiecujemy nie robić.
 */

type Kolumna = { klucz: string; naglowek: string };

const SCHEMAT: Record<Zbior, { tabela: string; kolumny: Kolumna[] }> = {
  klienci: {
    tabela: "clients",
    kolumny: [
      { klucz: "name", naglowek: "Imię i nazwisko" },
      { klucz: "type", naglowek: "Typ" },
      { klucz: "status", naglowek: "Status" },
      { klucz: "phone", naglowek: "Telefon" },
      { klucz: "email", naglowek: "Email" },
      { klucz: "city", naglowek: "Miasto" },
      { klucz: "address", naglowek: "Adres" },
      { klucz: "budget_pln", naglowek: "Budżet (zł)" },
      { klucz: "property", naglowek: "Nieruchomość" },
      { klucz: "notes", naglowek: "Notatki" },
      { klucz: "last_contact_at", naglowek: "Ostatni kontakt" },
      { klucz: "next_contact_at", naglowek: "Następny kontakt" },
      { klucz: "created_at", naglowek: "Dodano" },
    ],
  },
  nieruchomosci: {
    tabela: "properties",
    kolumny: [
      { klucz: "title", naglowek: "Nazwa" },
      { klucz: "deal_kind", naglowek: "Rodzaj" },
      { klucz: "property_type", naglowek: "Typ" },
      { klucz: "status", naglowek: "Status" },
      { klucz: "city", naglowek: "Miasto" },
      { klucz: "address", naglowek: "Adres" },
      { klucz: "price_pln", naglowek: "Cena (zł)" },
      { klucz: "area_m2", naglowek: "Powierzchnia (m2)" },
      { klucz: "rooms", naglowek: "Pokoje" },
      { klucz: "floor", naglowek: "Piętro" },
      { klucz: "description", naglowek: "Opis" },
      { klucz: "created_at", naglowek: "Dodano" },
    ],
  },
  transakcje: {
    tabela: "deals",
    kolumny: [
      { klucz: "title", naglowek: "Transakcja" },
      { klucz: "status", naglowek: "Status" },
      { klucz: "transaction_value_pln", naglowek: "Wartość transakcji (zł)" },
      { klucz: "commission_pln", naglowek: "Prowizja biura (zł)" },
      { klucz: "commission_seller_pln", naglowek: "Prowizja od sprzedającego (zł)" },
      { klucz: "commission_buyer_pln", naglowek: "Prowizja od kupującego (zł)" },
      { klucz: "commission_landlord_pln", naglowek: "Prowizja od wynajmującego (zł)" },
      { klucz: "commission_tenant_pln", naglowek: "Prowizja od najemcy (zł)" },
      { klucz: "extras_pln", naglowek: "Dodatki (zł)" },
      { klucz: "agent_split_pct", naglowek: "Udział agenta (%)" },
      { klucz: "agent_earnings_pln", naglowek: "Zarobek agenta (zł)" },
      { klucz: "expected_close", naglowek: "Planowane zamknięcie" },
      { klucz: "created_at", naglowek: "Dodano" },
    ],
  },
  leady: {
    tabela: "leads",
    kolumny: [
      { klucz: "name", naglowek: "Imię i nazwisko" },
      { klucz: "phone", naglowek: "Telefon" },
      { klucz: "email", naglowek: "Email" },
      { klucz: "city", naglowek: "Miasto" },
      { klucz: "source", naglowek: "Źródło" },
      { klucz: "campaign", naglowek: "Kampania" },
      { klucz: "ad_name", naglowek: "Reklama" },
      { klucz: "platform", naglowek: "Platforma" },
      { klucz: "message", naglowek: "Wiadomość" },
      { klucz: "created_at", naglowek: "Dodano" },
    ],
  },
  dzialania: {
    tabela: "activities",
    kolumny: [
      { klucz: "subject", naglowek: "Temat" },
      { klucz: "kind", naglowek: "Rodzaj" },
      { klucz: "status", naglowek: "Status" },
      { klucz: "priority", naglowek: "Priorytet" },
      { klucz: "purpose", naglowek: "Cel" },
      { klucz: "description", naglowek: "Opis" },
      { klucz: "due_at", naglowek: "Termin" },
      { klucz: "completed_at", naglowek: "Zrobione" },
      { klucz: "created_at", naglowek: "Dodano" },
    ],
  },
};

function jestZbiorem(x: string): x is Zbior {
  return (ZBIORY as readonly string[]).includes(x);
}

export async function GET(_req: Request, { params }: { params: Promise<{ zbior: string }> }) {
  const { zbior } = await params;
  if (!jestZbiorem(zbior)) {
    return new Response("Nieznany zbiór danych.", { status: 404 });
  }

  const user = await requireUser();
  if (!user.agency_id) return new Response("Konto nie jest przypisane do biura.", { status: 403 });

  // Eksport obejmuje całe biuro, więc wymaga uprawnienia do ustawień firmy.
  // To ten sam próg, co dane firmy i abonament: decyzja właściciela, nie agenta.
  if (!maModul({ id: user.id, role: user.role, permissions: user.permissions }, "ustawienia")) {
    return new Response("Brak uprawnień do eksportu danych biura.", { status: 403 });
  }

  const { tabela, kolumny } = SCHEMAT[zbior];
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from(tabela)
    .select(kolumny.map((k) => k.klucz).join(","))
    .eq("agency_id", user.agency_id)
    .order("created_at", { ascending: false })
    .limit(20000);

  if (error) {
    console.error(`Eksport ${zbior}:`, error);
    return new Response("Nie udało się odczytać danych.", { status: 500 });
  }

  const csv = doCsv(kolumny, (data ?? []) as unknown as Record<string, unknown>[]);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nazwaPliku(zbior, todayPL())}"`,
      "cache-control": "no-store",
    },
  });
}
