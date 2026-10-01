import { nowyDokument } from "./pdf-kit";
import { wMiejscowniku, zwany } from "./polszczyzna";
import {
  dataPL,
  KLAUZULA_FOTO,
  rolaPodpisu,
  wierszStrony,
  type ProtokolData,
} from "./protokol";

/** Protokół zdawczo-odbiorczy jako gotowy plik PDF. */
export async function generujProtokolPdf(d: ProtokolData, stopka?: string): Promise<Uint8Array> {
  const sprzedaz = d.kierunek === "sprzedaz";
  const a = await nowyDokument({
    tytulPliku: `Protokół zdawczo-odbiorczy - ${d.lokalAdres || "lokal"}`,
    stopka,
    // Przy sprzedaży węższy margines: protokół podpisuje się u notariusza
    // i ma się zmieścić na jednej kartce.
    margines: sprzedaz ? 44 : undefined,
  });
  const CONTENT_W = a.szerokosc;
  const wydanie = d.kierunek === "wydanie";
  // Protokół po sprzedaży ma się zmieścić na jednej stronie: agent podpisuje go
  // u notariusza, a nie w biurze, więc im mniej kartek, tym lepiej.
  const ciasno = sprzedaz;

  a.tytul("Protokół zdawczo-odbiorczy", { ciasno });

  const czynnosc = sprzedaz ? "przekazania" : wydanie ? "przejęcia - przekazania" : "zwrotu";
  a.tekst(
    `Spisany w dniu **${dataPL(d.date)}** r. w ${wMiejscowniku(d.city)} na okoliczność ${czynnosc} ` +
      `lokalu mieszkalnego przy **${d.lokalAdres || "…………………………………"}**, w związku z zawarciem umowy ` +
      `${d.umowaRodzaj || "najmu"} wyżej wymienionego lokalu z dnia **${dataPL(d.umowaData)}** r.`,
    { gapAfter: ciasno ? 6 : 10 },
  );

  a.tekst("Pomiędzy:", { gapAfter: ciasno ? 2 : 4 });
  a.ramka(
    [
      ...d.zdajacy.filter((s) => s.name.trim() || d.zdajacy.length === 1).map(wierszStrony),
      `- ${zwany(d.zdajacy.map((x) => x.name))} w dalszej treści **${rolaPodpisu(d.zdajacy, "zdajacy", d.kierunek)}**,`,
    ],
    { gapAfter: ciasno ? 4 : 6, ciasno },
  );
  a.tekst("a", { gapAfter: ciasno ? 3 : 6 });
  a.ramka(
    [
      ...d.przejmujacy.filter((s) => s.name.trim() || d.przejmujacy.length === 1).map(wierszStrony),
      `- ${zwany(d.przejmujacy.map((x) => x.name))} w dalszej treści ${d.przejmujacy.length > 1 ? "łącznie " : ""}**${rolaPodpisu(d.przejmujacy, "przejmujacy", d.kierunek)}**,`,
    ],
    { gapAfter: ciasno ? 6 : 16, ciasno },
  );

  // ── §1 Liczniki ──────────────────────────────────────────────────────
  a.paragraf(
    `§ 1. Stany liczników na dzień ${sprzedaz ? "przekazania" : wydanie ? "wydania" : "zwrotu"} lokalu`,
    { ciasno },
  );
  a.tabela(
    [
      { naglowek: "Rodzaj licznika", szer: CONTENT_W * 0.42 },
      { naglowek: "Numer licznika", szer: CONTENT_W * 0.28 },
      { naglowek: "Stan licznika", szer: CONTENT_W * 0.3, align: "right" },
    ],
    d.liczniki.map((l) => [
      l.rodzaj,
      l.numer,
      [l.stan, l.jednostka].filter(Boolean).join(" "),
    ]),
    // Przy sprzedaży pomijamy pasek „MEDIA": to 22 punkty wysokości,
    // a dokument ma się zmieścić na jednej stronie.
    { tytul: ciasno ? undefined : "MEDIA", gapAfter: ciasno ? 8 : 18, minWysokosc: ciasno ? 16 : undefined },
  );

  // ── §2 Klucze ────────────────────────────────────────────────────────
  a.paragraf("§ 2. Przekazane przedmioty i klucze", { ciasno });
  a.tabela(
    [
      { naglowek: "Przekazane klucze i przedmioty", szer: CONTENT_W * 0.76 },
      { naglowek: "Ilość", szer: CONTENT_W * 0.24, align: "center" },
    ],
    d.klucze.map((k) => [k.nazwa, k.ilosc]),
    { gapAfter: ciasno ? 8 : 18, minWysokosc: ciasno ? 16 : undefined },
  );

  // ── §3 Uwagi ─────────────────────────────────────────────────────────
  a.paragraf("§ 3. Uwagi", { ciasno });
  let nr = 1;
  if (d.klauzulaFoto && !sprzedaz) {
    a.tekst(`**${nr}.** ${KLAUZULA_FOTO}`, { gapAfter: 8 });
    nr++;
  }
  for (const u of d.uwagi.filter((x) => x.trim())) {
    a.tekst(`**${nr}.** ${u.trim()}`, { gapAfter: ciasno ? 5 : 8 });
    nr++;
  }
  // Puste linie na dopiski ustępują miejsca podpisom. Przy sprzedaży dokument
  // ma zmieścić się na jednej kartce, a podpisów nie da się pominąć, więc
  // rysujemy tyle linii, ile naprawdę zostało miejsca.
  const miejsceNaPodpisy = ciasno ? 62 : 96;
  const ileLinii = ciasno
    ? Math.max(0, Math.min(d.pustychUwag, Math.floor((a.wolneMiejsce() - miejsceNaPodpisy - 18) / 22)))
    : d.pustychUwag;
  if (ileLinii > 0) {
    a.tekst(`**${nr}.**`, { gapAfter: 2 });
    a.liniePuste(ileLinii);
  }

  a.podpisy(
    { rola: rolaPodpisu(d.zdajacy, "zdajacy", d.kierunek), osoby: d.zdajacy.map((s) => s.name.trim()) },
    { rola: rolaPodpisu(d.przejmujacy, "przejmujacy", d.kierunek), osoby: d.przejmujacy.map((s) => s.name.trim()) },
    { ciasno },
  );

  return a.zapisz();
}
