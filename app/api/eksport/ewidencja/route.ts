import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { maModul } from "@/lib/role";
import { todayPL } from "@/lib/datetime";
import { doCsv } from "@/lib/eksport-csv";
import {
  STAWKI_VAT,
  opisRodzaju,
  podsumowanieVat,
  sumyFaktury,
  type InvoiceItem,
  type StawkaVat,
  type TrybCen,
} from "@/lib/invoice";

/**
 * Ewidencja sprzedaży dla księgowej.
 *
 * Jeden wiersz na dokument, z rozbiciem na stawki w osobnych kolumnach -
 * tak, jak wygląda rejestr sprzedaży, który księgowa i tak musi złożyć
 * u siebie. Pełnego JPK_V7 celowo nie generujemy: składa go księgowa ze
 * swojego programu i to ona odpowiada za jego poprawność.
 *
 * Proformy NIE wchodzą do zestawienia. Proforma nie jest fakturą, nie rodzi
 * obowiązku podatkowego i wrzucenie jej do ewidencji byłoby błędem, który
 * wyszedłby dopiero przy kontroli.
 *
 * Korekty wchodzą i mają własny wiersz z numerem dokumentu pierwotnego.
 */

const STAWKI_W_KOLUMNACH: StawkaVat[] = ["23", "8", "5", "0", "zw", "np"];

function pierwszyDzienMiesiaca(dzis: string): string {
  return `${dzis.slice(0, 7)}-01`;
}

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user.agency_id) return new Response("Konto nie jest przypisane do biura.", { status: 403 });
  if (!maModul({ id: user.id, role: user.role, permissions: user.permissions }, "faktury")) {
    return new Response("Brak uprawnień do faktur.", { status: 403 });
  }

  const url = new URL(request.url);
  const dzis = todayPL();
  const od = url.searchParams.get("od") || pierwszyDzienMiesiaca(dzis);
  const doDnia = url.searchParams.get("do") || dzis;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(od) || !/^\d{4}-\d{2}-\d{2}$/.test(doDnia)) {
    return new Response("Niepoprawny zakres dat.", { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("invoices")
    .select(
      "number, doc_type, issue_date, sale_date, payment_date, buyer_name, buyer_nip, items, prices_mode, total_pln, paid_pln, corrects_invoice_id",
    )
    .eq("agency_id", user.agency_id)
    .gte("issue_date", od)
    .lte("issue_date", doDnia)
    .order("issue_date", { ascending: true });

  if (error) {
    console.error("Eksport ewidencji:", error);
    return new Response("Nie udało się odczytać faktur.", { status: 500 });
  }

  const faktury = (data ?? []).filter((f) => (f.doc_type ?? "faktura") !== "proforma");

  // Numery dokumentów pierwotnych dla korekt - księgowa musi wiedzieć,
  // co dana korekta poprawia, a samo id z bazy nic jej nie mówi.
  const idKorygowanych = faktury
    .map((f) => f.corrects_invoice_id as string | null)
    .filter((x): x is string => Boolean(x));
  const numeryPierwotnych = new Map<string, string>();
  if (idKorygowanych.length > 0) {
    const { data: pierwotne } = await admin
      .from("invoices")
      .select("id, number")
      .in("id", [...new Set(idKorygowanych)]);
    for (const p of pierwotne ?? []) numeryPierwotnych.set(p.id as string, p.number as string);
  }

  const kolumny = [
    { klucz: "numer", naglowek: "Numer" },
    { klucz: "rodzaj", naglowek: "Rodzaj" },
    { klucz: "koryguje", naglowek: "Koryguje dokument" },
    { klucz: "wystawiono", naglowek: "Data wystawienia" },
    { klucz: "sprzedaz", naglowek: "Data sprzedaży" },
    { klucz: "termin", naglowek: "Termin płatności" },
    { klucz: "nabywca", naglowek: "Nabywca" },
    { klucz: "nip", naglowek: "NIP nabywcy" },
    ...STAWKI_W_KOLUMNACH.flatMap((s) => [
      { klucz: `netto_${s}`, naglowek: `Netto ${s}` },
      { klucz: `vat_${s}`, naglowek: `VAT ${s}` },
    ]),
    { klucz: "netto", naglowek: "Razem netto" },
    { klucz: "vat", naglowek: "Razem VAT" },
    { klucz: "brutto", naglowek: "Razem brutto" },
    { klucz: "zaplacono", naglowek: "Zapłacono" },
  ];

  const wiersze = faktury.map((f) => {
    const items = (f.items ?? []) as InvoiceItem[];
    const tryb: TrybCen = f.prices_mode === "brutto" ? "brutto" : "netto";
    const wgStawek = podsumowanieVat(items, tryb);
    const sumy = sumyFaktury(items, tryb);

    const wiersz: Record<string, unknown> = {
      numer: f.number,
      rodzaj: opisRodzaju(f.doc_type as never).nazwa,
      koryguje: f.corrects_invoice_id
        ? (numeryPierwotnych.get(f.corrects_invoice_id as string) ?? "")
        : "",
      wystawiono: f.issue_date,
      sprzedaz: f.sale_date,
      termin: f.payment_date,
      nabywca: f.buyer_name,
      nip: f.buyer_nip,
      netto: sumy.netto,
      vat: sumy.vat,
      brutto: sumy.brutto,
      zaplacono: f.paid_pln ?? 0,
    };
    for (const s of STAWKI_W_KOLUMNACH) {
      const w = wgStawek.find((x) => x.stawka === s);
      wiersz[`netto_${s}`] = w ? w.netto : "";
      wiersz[`vat_${s}`] = w ? w.vat : "";
    }
    return wiersz;
  });

  // Wiersz sumujący: księgowa i tak go policzy, ale zgodność sum to pierwsza
  // rzecz, którą sprawdzi, więc lepiej, żeby był w pliku.
  if (wiersze.length > 0) {
    const suma: Record<string, unknown> = { numer: "RAZEM", rodzaj: "", koryguje: "" };
    for (const k of ["netto", "vat", "brutto", "zaplacono"]) {
      suma[k] = Math.round(wiersze.reduce((a, w) => a + (Number(w[k]) || 0), 0) * 100) / 100;
    }
    for (const s of STAWKI_W_KOLUMNACH) {
      for (const pole of [`netto_${s}`, `vat_${s}`]) {
        const v = Math.round(wiersze.reduce((a, w) => a + (Number(w[pole]) || 0), 0) * 100) / 100;
        suma[pole] = v === 0 ? "" : v;
      }
    }
    wiersze.push(suma as (typeof wiersze)[number]);
  }

  const csv = doCsv(kolumny, wiersze);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ewidencja-sprzedazy-${od}_${doDnia}.csv"`,
      "cache-control": "no-store",
    },
  });
}
