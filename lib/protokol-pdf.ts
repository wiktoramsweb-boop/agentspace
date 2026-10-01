import { nowyDokument, CONTENT_W } from "./pdf-kit";
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
  const a = await nowyDokument({
    tytulPliku: `Protokół zdawczo-odbiorczy - ${d.lokalAdres || "lokal"}`,
    stopka,
  });

  const wydanie = d.kierunek === "wydanie";
  a.tytul("Protokół zdawczo-odbiorczy");

  const czynnosc = wydanie ? "przejęcia - przekazania" : "zwrotu";
  a.tekst(
    `Spisany w dniu **${dataPL(d.date)}** r. w ${wMiejscowniku(d.city)} na okoliczność ${czynnosc} ` +
      `lokalu mieszkalnego przy **${d.lokalAdres || "…………………………………"}**, w związku z zawarciem umowy ` +
      `${d.umowaRodzaj || "najmu"} wyżej wymienionego lokalu z dnia **${dataPL(d.umowaData)}** r.`,
    { gapAfter: 10 },
  );

  a.tekst("Pomiędzy:", { gapAfter: 4 });
  a.ramka(
    [
      ...d.zdajacy.filter((s) => s.name.trim() || d.zdajacy.length === 1).map(wierszStrony),
      `- ${zwany(d.zdajacy.map((x) => x.name))} w dalszej treści **${rolaPodpisu(d.zdajacy, "zdajacy")}**,`,
    ],
    { gapAfter: 6 },
  );
  a.tekst("a", { gapAfter: 6 });
  a.ramka(
    [
      ...d.przejmujacy.filter((s) => s.name.trim() || d.przejmujacy.length === 1).map(wierszStrony),
      `- ${zwany(d.przejmujacy.map((x) => x.name))} w dalszej treści ${d.przejmujacy.length > 1 ? "łącznie " : ""}**${rolaPodpisu(d.przejmujacy, "przejmujacy")}**,`,
    ],
    { gapAfter: 16 },
  );

  // ── §1 Liczniki ──────────────────────────────────────────────────────
  a.paragraf(`§ 1. Stany liczników na dzień ${wydanie ? "wydania" : "zwrotu"} lokalu`);
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
    { tytul: "MEDIA", gapAfter: 18 },
  );

  // ── §2 Klucze ────────────────────────────────────────────────────────
  a.paragraf("§ 2. Przekazane przedmioty i klucze");
  a.tabela(
    [
      { naglowek: "Przekazane klucze i przedmioty", szer: CONTENT_W * 0.76 },
      { naglowek: "Ilość", szer: CONTENT_W * 0.24, align: "center" },
    ],
    d.klucze.map((k) => [k.nazwa, k.ilosc]),
    { gapAfter: 18 },
  );

  // ── §3 Uwagi ─────────────────────────────────────────────────────────
  a.paragraf("§ 3. Uwagi");
  let nr = 1;
  if (d.klauzulaFoto) {
    a.tekst(`**${nr}.** ${KLAUZULA_FOTO}`, { gapAfter: 8 });
    nr++;
  }
  for (const u of d.uwagi.filter((x) => x.trim())) {
    a.tekst(`**${nr}.** ${u.trim()}`, { gapAfter: 8 });
    nr++;
  }
  if (d.pustychUwag > 0) {
    a.tekst(`**${nr}.**`, { gapAfter: 2 });
    a.liniePuste(d.pustychUwag);
  }

  a.podpisy(
    { rola: rolaPodpisu(d.zdajacy, "zdajacy"), osoby: d.zdajacy.map((s) => s.name.trim()) },
    { rola: rolaPodpisu(d.przejmujacy, "przejmujacy"), osoby: d.przejmujacy.map((s) => s.name.trim()) },
  );

  return a.zapisz();
}
