import { nowyDokument, CONTENT_W } from "./pdf-kit";
import { formatPln } from "./format";
import { OKRESY, SZANSA_ETAPU, type RaportWlasciciela } from "./data-raporty";
import { PROCESS_STAGES } from "./types";

/**
 * Raport właściciela jako plik PDF.
 *
 * Ten sam układ co na ekranie i ta sama kolejność czterech pytań, bo raport
 * najczęściej idzie na spotkanie zespołu albo do wspólnika, a wtedy liczy się,
 * żeby obaj patrzyli na to samo.
 */
export async function generujRaportPdf(
  r: RaportWlasciciela,
  nazwaBiura: string,
  stopka?: string,
): Promise<Uint8Array> {
  const a = await nowyDokument({ tytulPliku: `Raport ${nazwaBiura}`, stopka });
  const okresLabel = OKRESY.find((o) => o.value === r.okres)?.label ?? "";
  const dzis = new Date().toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" });

  a.tytul(`Raport biura: ${okresLabel.toLowerCase()}`);
  a.tekst(`**${nazwaBiura}** · stan na ${dzis}`, { align: "center", size: 9.5, gapAfter: 18 });

  // ── 1. Pieniądze ──────────────────────────────────────────────────────
  a.tekst("**1. Ile zarobimy**", { size: 11.5, gapAfter: 8 });
  a.kafelki(
    [
      { label: "Prowizja zamknięta", value: formatPln(r.pieniadze.zamknietePln), sub: `${r.pieniadze.zamknieteSzt} transakcji` },
      { label: "W toku", value: formatPln(r.pieniadze.wTokuPln), sub: `${r.pieniadze.wTokuSzt} transakcji` },
      { label: "Prognoza", value: formatPln(r.pieniadze.prognozaPln), sub: "ważona etapem" },
      { label: "Skuteczność", value: r.pieniadze.skutecznosc != null ? `${r.pieniadze.skutecznosc}%` : "-", sub: `${r.pieniadze.przepadloSzt} przepadło` },
    ],
    { gapAfter: 10 },
  );
  a.kafelki(
    [
      { label: "Średnia prowizja", value: formatPln(r.pieniadze.sredniaProwizja) },
      { label: "Średni czas do zamknięcia", value: r.pieniadze.sredniDniDoZamkniecia != null ? `${r.pieniadze.sredniDniDoZamkniecia} dni` : "-" },
    ],
    { gapAfter: 14 },
  );
  a.tekst(
    "Prognoza nie jest sumą wszystkiego w toku. Każdą transakcję mnożymy przez szansę przypisaną " +
      `etapowi obsługi oferty: ${PROCESS_STAGES.map((s) => `${s.short} ${Math.round(SZANSA_ETAPU[s.value] * 100)}%`).join(", ")}.`,
    { size: 8.5, gapAfter: 18 },
  );

  // ── Przychód miesiącami ───────────────────────────────────────────────
  a.zarezerwuj(170);
  a.tekst("**Prowizja miesiąc po miesiącu**", { size: 10.5, gapAfter: 10 });
  a.slupki(
    r.przychodMiesiacami.map((m) => ({
      etykieta: m.miesiac,
      wartosc: m.pln,
      opis: m.pln > 0 ? `${Math.round(m.pln / 1000)}k` : "",
    })),
    { gapAfter: 16 },
  );

  // ── 2. Lejek ──────────────────────────────────────────────────────────
  a.zarezerwuj(230);
  a.tekst("**2. Gdzie sypie się lejek**", { size: 11.5, gapAfter: 10 });
  const maxOfert = Math.max(...r.lejekOfert.map((s) => s.ile), 1);
  for (const s of r.lejekOfert) {
    a.pasek(
      s.przejscie != null ? `${s.label}  (${s.przejscie}% dalej)` : s.label,
      String(s.ile),
      s.ile / maxOfert,
    );
  }
  a.odstep(14);

  // ── 3. Źródła ─────────────────────────────────────────────────────────
  a.zarezerwuj(180);
  a.tekst("**3. Skąd przychodzą pieniądze**", { size: 11.5, gapAfter: 10 });
  if (r.zrodla.length) {
    a.tabela(
      [
        { naglowek: "Źródło", szer: CONTENT_W * 0.34 },
        { naglowek: "Kontakty", szer: CONTENT_W * 0.15, align: "right" },
        { naglowek: "Transakcje", szer: CONTENT_W * 0.16, align: "right" },
        { naglowek: "Konwersja", szer: CONTENT_W * 0.15, align: "right" },
        { naglowek: "Prowizja", szer: CONTENT_W * 0.2, align: "right" },
      ],
      r.zrodla.map((z) => [
        z.label,
        String(z.kontakty),
        String(z.transakcje),
        z.konwersja != null ? `${z.konwersja}%` : "-",
        formatPln(z.prowizja),
      ]),
      { gapAfter: 18 },
    );
  } else {
    a.tekst("Brak danych o źródłach kontaktów w tym okresie.", { size: 9.5, gapAfter: 18 });
  }

  // ── 4. Zespół ─────────────────────────────────────────────────────────
  a.zarezerwuj(180);
  a.tekst("**4. Kto pracuje**", { size: 11.5, gapAfter: 10 });
  a.tabela(
    [
      { naglowek: "Agent", szer: CONTENT_W * 0.26 },
      { naglowek: "Tel.", szer: CONTENT_W * 0.1, align: "right" },
      { naglowek: "Spotk.", szer: CONTENT_W * 0.1, align: "right" },
      { naglowek: "Kontakty", szer: CONTENT_W * 0.12, align: "right" },
      { naglowek: "Oferty", szer: CONTENT_W * 0.1, align: "right" },
      { naglowek: "Trans.", szer: CONTENT_W * 0.1, align: "right" },
      { naglowek: "Prowizja", szer: CONTENT_W * 0.22, align: "right" },
    ],
    r.zespol.map((z) => [
      z.name,
      String(z.telefony),
      String(z.spotkania),
      String(z.nowychKontaktow),
      String(z.nowychOfert),
      String(z.transakcje),
      formatPln(z.prowizja),
    ]),
    { gapAfter: 16 },
  );

  // ── Tempo ─────────────────────────────────────────────────────────────
  a.zarezerwuj(150);
  a.tekst("**Tempo pracy biura, ostatnie 12 tygodni**", { size: 10.5, gapAfter: 10 });
  a.slupki(
    r.tempo.map((t) => ({ etykieta: t.tydzien, wartosc: t.dzialania, opis: String(t.dzialania) })),
    { wysokosc: 80 },
  );
  a.tekst("Wykonane działania tydzień po tygodniu. Spadek widać tu wcześniej niż w prowizjach.", {
    size: 8.5,
  });

  return a.zapisz();
}
