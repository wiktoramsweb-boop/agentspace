import { requireUser } from "@/lib/auth";
import { maModul } from "@/lib/role";
import { rozliczenieMiesiaca } from "@/lib/data-zasady-prowizji";
import { csv, poprawnyMiesiac } from "@/lib/koszty-model";
import { todayPL } from "@/lib/datetime";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { ROZLICZAJACY } from "@/lib/uprawnienia";

/** Rozliczenie prowizji za miesiąc w CSV: kto ile dostaje z każdej transakcji. */
export async function GET(request: Request) {
  const user = await requireUser();
  if (!user.agency_id || !ROZLICZAJACY.includes(user.role) || !maModul({ id: user.id, role: user.role, permissions: user.permissions }, "prowizje")) {
    return new Response("Brak uprawnień do rozliczenia prowizji.", { status: 403 });
  }
  const m = new URL(request.url).searchParams.get("m");
  const miesiac = poprawnyMiesiac(m) ? m : todayPL().slice(0, 7);
  const [rok, mc] = miesiac.split("-").map(Number);
  const r = await rozliczenieMiesiaca(user.agency_id, rok, mc);

  const tresc = csv(
    ["Data zamknięcia", "Transakcja", "Oddział", "Agent", "Prowizja brutto", "Prowizja netto", "Agent prowadzący", "Współagenci", "Menedżer", "Nadprowizja", "Sieć", "Zostaje biuru"],
    r.wiersze.map((w) => [
      w.zamknieta.slice(0, 10),
      w.tytul,
      w.oddzial,
      w.agentImie,
      w.brutto,
      w.netto,
      w.agent,
      w.wspolni.reduce((a, s) => a + s.kwota, 0),
      w.menedzerImie,
      w.menedzer,
      w.siec,
      w.biuro,
    ]),
  );
  await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "eksport", rodzaj: "eksport", opis: `Eksport rozliczenia prowizji ${miesiac}` });
  return new Response(tresc, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rozliczenie-prowizji-${miesiac}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
