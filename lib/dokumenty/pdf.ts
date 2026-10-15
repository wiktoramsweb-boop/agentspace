import { nowyDokument } from "../pdf-kit";
import type { Dokument } from "./silnik";

/** „1. treść" → „**1.** treść", tak jak w umowie rezerwacyjnej i aneksie. */
function ustep(s: string): string {
  return s.replace(/^(\d+)\.\s/, "**$1.** ");
}

type Podpis = { rola: string; osoby: string[] };

/** Pod linią „Data" nie ma czyjegoś nazwiska, więc bez podpowiedzi „(imię i nazwisko)". */
function bezPodpowiedzi(p: Podpis): Podpis {
  return /^data\b/i.test(p.rola) && !p.osoby.some(Boolean) ? { ...p, osoby: [" "] } : p;
}

/** Jeden renderer dla wszystkich wzorów: treść składa wzór, tu tylko układ. */
export async function generujDokumentPdf(dok: Dokument, stopka?: string): Promise<Uint8Array> {
  const a = await nowyDokument({ tytulPliku: dok.tytul, stopka });

  // Pisma (zgłoszenie, żądanie, pełnomocnictwo) zaczynają się od miejscowości
  // i daty w prawym górnym rogu, nad tytułem, jak każde pismo urzędowe.
  const wstep = [...dok.wstep];
  if (wstep[0] && /^[^*]+, dnia /.test(wstep[0])) {
    a.tekst(wstep.shift()!, { align: "right", gapAfter: 18 });
  }
  a.tytul(dok.tytul);
  wstep.forEach((w, i) => {
    const ostatni = i === wstep.length - 1;
    if (w === "a") a.tekst("a", { gapAfter: 6 });
    else if (w.includes("(dalej:")) a.ramka(w.split("\n"), { gapAfter: ostatni ? 14 : 6 });
    else {
      const linie = w.split("\n");
      linie.forEach((l, j) => a.tekst(l, { gapAfter: j === linie.length - 1 ? (ostatni ? 14 : 8) : 0 }));
    }
  });

  for (const p of dok.paragrafy) {
    if (p.tytul) a.paragraf(p.tytul);
    for (const u of p.ustepy) a.tekst(ustep(u), { gapAfter: 7 });
  }
  a.odstep(6);
  a.podpisy(bezPodpowiedzi(dok.podpisy[0]), bezPodpowiedzi(dok.podpisy[1]));

  for (const z of dok.dodatki ?? []) {
    a.zarezerwuj(10_000);
    a.tytul(z.tytul, { ciasno: true });
    for (const t of z.akapity) if (t.trim()) a.tekst(ustep(t), { gapAfter: 8 });
    if (z.podpisy) {
      a.odstep(4);
      a.podpisy(bezPodpowiedzi(z.podpisy[0]), bezPodpowiedzi(z.podpisy[1]));
    }
  }

  return a.zapisz();
}
