import { createSupabaseAdmin } from "./supabase/admin";
import { zapiszBlad } from "./blad";
import { addDaysKey, todayPL } from "./datetime";
import { getInvoiceNumberSuggestion } from "./data-invoices";
import { kolejnaData, sumyFaktury, type InvoiceItem, type TrybCen } from "./invoice";

/**
 * Faktury cykliczne.
 *
 * Biura wystawiają co miesiąc te same dokumenty: zarządzanie najmem, stała
 * obsługa, abonament. Harmonogram robi to za nie, z własną numeracją i datami.
 *
 * Wzorzec jest kopią danych, a nie odwołaniem do konkretnej faktury: tamta
 * może zostać poprawiona albo usunięta, a harmonogram ma dalej wystawiać to,
 * co ustalono przy jego zakładaniu.
 */

export type WzorzecFaktury = {
  sellerKey: string;
  buyerName: string;
  buyerAddress: string;
  buyerCity: string;
  buyerPostcode: string;
  buyerNip: string;
  buyerPesel: string;
  place: string;
  paymentMethod: string;
  items: InvoiceItem[];
  pricesMode: TrybCen;
  description: string;
  issuer: string;
};

export type Harmonogram = {
  id: string;
  nazwa: string;
  co_miesiecy: number;
  dzien_miesiaca: number;
  dni_platnosci: number;
  nastepne: string;
  aktywny: boolean;
  wzorzec: WzorzecFaktury;
  ostatnie_wystawienie: string | null;
};

/** Harmonogramy biura, najbliższe najpierw. */
export async function harmonogramy(agencyId: string): Promise<Harmonogram[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("invoice_schedules")
    .select("*")
    .eq("agency_id", agencyId)
    .order("nastepne", { ascending: true });
  return (data ?? []) as Harmonogram[];
}

/**
 * Wystawia faktury ze wszystkich harmonogramów, których termin już minął.
 * Zwraca liczbę wystawionych dokumentów.
 *
 * Odporne na przerwy: jeżeli zadanie nie chodziło przez trzy miesiące,
 * każdy zaległy okres zostanie wystawiony osobno, a nie zlany w jeden.
 */
export async function wystawZaplanowaneFaktury(): Promise<number> {
  const admin = createSupabaseAdmin();
  const dzis = todayPL();

  const { data, error } = await admin
    .from("invoice_schedules")
    .select("*")
    .eq("aktywny", true)
    .lte("nastepne", dzis);

  if (error) {
    // Brak tabeli (migracja nieuruchomiona) nie jest awarią wartą alarmu.
    if (!String(error.message).includes("does not exist")) {
      await zapiszBlad("cron/faktury-cykliczne", error.message);
    }
    return 0;
  }

  let wystawione = 0;
  for (const h of (data ?? []) as (Harmonogram & { agency_id: string; created_by: string | null })[]) {
    try {
      let termin = h.nastepne;
      // Pętla z twardym sufitem: gdyby data w bazie była z przeszłości
      // o lata, nie chcemy wystawić stu faktur jednym przebiegiem.
      let kroki = 0;
      while (termin <= dzis && kroki < 24) {
        const w = h.wzorzec;
        const numer = await getInvoiceNumberSuggestion(h.agency_id);
        const tryb: TrybCen = w.pricesMode === "brutto" ? "brutto" : "netto";
        const sumy = sumyFaktury(w.items ?? [], tryb);

        const { data: nowa, error: bladZapisu } = await admin
          .from("invoices")
          .insert({
            agency_id: h.agency_id,
            created_by: h.created_by,
            number: numer,
            seller_key: w.sellerKey,
            buyer_name: w.buyerName,
            buyer_address: w.buyerAddress,
            buyer_city: w.buyerCity,
            buyer_postcode: w.buyerPostcode,
            buyer_nip: w.buyerNip,
            buyer_pesel: w.buyerPesel,
            place: w.place,
            issue_date: termin,
            sale_date: termin,
            payment_date: addDaysKey(termin, h.dni_platnosci),
            payment_method: w.paymentMethod,
            items: w.items,
            prices_mode: tryb,
            total_pln: sumy.brutto,
            net_pln: sumy.netto,
            vat_pln: sumy.vat,
            description: w.description,
            issuer: w.issuer,
            doc_type: "faktura",
          })
          .select("id")
          .single();

        if (bladZapisu) throw new Error(bladZapisu.message);

        wystawione++;
        termin = kolejnaData(termin, h.co_miesiecy || 1, h.dzien_miesiaca || 1);
        kroki++;

        await admin
          .from("invoice_schedules")
          .update({
            nastepne: termin,
            ostatnie_wystawienie: dzis,
            ostatnia_faktura_id: nowa?.id ?? null,
          })
          .eq("id", h.id);
      }
    } catch (err) {
      await zapiszBlad("cron/faktury-cykliczne", err, { agencyId: h.agency_id });
    }
  }

  return wystawione;
}
