import { requireUser } from "@/lib/auth";
import { maModul } from "@/lib/role";
import { maV49 } from "@/lib/schemat";
import { kosztyMiesiaca, wyplatyAgentow } from "@/lib/data-finanse";
import { csv, nazwaKategorii, poprawnyMiesiac } from "@/lib/koszty-model";
import { todayPL } from "@/lib/datetime";

/**
 * Koszty i wypłaty prowizji za miesiąc, w CSV dla księgowej. Sprzedaż
 * (faktury) wychodzi osobno z /api/eksport/ewidencja, w układzie rejestru.
 */
export async function GET(request: Request) {
  const user = await requireUser();
  if (!user.agency_id) return new Response("Konto nie jest przypisane do biura.", { status: 403 });
  if (!maModul({ id: user.id, role: user.role, permissions: user.permissions }, "faktury")) {
    return new Response("Brak uprawnień do finansów.", { status: 403 });
  }
  const url = new URL(request.url);
  const m = url.searchParams.get("m");
  const miesiac = poprawnyMiesiac(m) ? m : todayPL().slice(0, 7);
  const co = url.searchParams.get("co") === "wyplaty" ? "wyplaty" : "koszty";

  let tresc: string;
  if (co === "koszty") {
    const { koszty } = await kosztyMiesiaca(user.agency_id, miesiac);
    tresc = csv(
      ["Data", "Kategoria", "Za co", "Kontrahent", "Nr faktury", "Netto", "VAT %", "Brutto", "Opłacony", "Data zapłaty", "Uwagi"],
      [...koszty]
        .sort((a, b) => a.cost_date.localeCompare(b.cost_date))
        .map((k) => [k.cost_date, nazwaKategorii(k.category), k.name, k.vendor, k.invoice_no, k.net_pln, k.vat_rate == null ? "zw" : String(k.vat_rate), k.gross_pln, k.paid ? "tak" : "nie", k.paid_at, k.note]),
    );
  } else {
    const w = await wyplatyAgentow(user.agency_id, miesiac, await maV49());
    tresc = csv(
      ["Data zamknięcia", "Transakcja", "Agent", "Prowizja biura", "Należne agentowi", "Wypłacono", "Data wypłaty"],
      w.map((x) => [x.closed_at.slice(0, 10), x.title, x.agentName, x.commission_pln, x.agent_earnings_pln, x.agent_paid_pln, x.agent_paid_at?.slice(0, 10) ?? ""]),
    );
  }

  const nazwa = `${co === "koszty" ? "koszty" : "wyplaty-prowizji"}-${miesiac}.csv`;
  return new Response(tresc, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nazwa}"`,
      "Cache-Control": "no-store",
    },
  });
}
