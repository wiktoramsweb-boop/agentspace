"use client";

import { useState } from "react";
import { generujProtokolPdf } from "@/lib/protokol-pdf";
import { generujAneksPdf } from "@/lib/aneks-pdf";
import { domyslneDane } from "@/lib/protokol";
import { domyslnyAneks } from "@/lib/aneks";
import { generujRaportPdf } from "@/lib/raport-pdf";
import { PRZYKLADOWY_RAPORT } from "./przykladowy-raport";

/**
 * Podgląd gotowych dokumentów PDF bez logowania i bez wypełniania formularza.
 * Narzędzie robocze: przy zmianie składu dokumentu widać efekt od razu,
 * zamiast klikać przez cały kreator i pobierać plik na dysk.
 */
export function PodgladDokumentow() {
  const [url, setUrl] = useState<string | null>(null);
  const [co, setCo] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);

  async function pokaz(nazwa: string, fn: () => Promise<Uint8Array>) {
    setBlad(null);
    try {
      const bytes = await fn();
      const blob = new Blob([bytes.slice() as BlobPart], { type: "application/pdf" });
      if (url) URL.revokeObjectURL(url);
      setUrl(URL.createObjectURL(blob));
      setCo(`${nazwa} · ${Math.round(bytes.length / 1024)} kB`);
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się wygenerować.");
    }
  }

  function protokol(kierunek: "wydanie" | "sprzedaz" = "wydanie") {
    const d = domyslneDane("Kraków");
    d.kierunek = kierunek;
    if (kierunek === "sprzedaz") {
      d.umowaRodzaj = "sprzedaży";
      d.klauzulaFoto = false;
      d.pustychUwag = 1;
    }
    d.lokalAdres = "ul. Piastów 69/24, 31-483 Kraków";
    d.umowaData = "2026-08-28";
    d.date = "2026-08-28";
    d.zdajacy = [{ name: "Maria Przykładowa", address: "ul. Piastów 69/24, 31-483 Kraków", docNumber: "ABC 123456", pesel: "00000000000" }];
    d.przejmujacy = [
      { name: "Jan Testowy", address: "ul. Przykładowa 12/3, 31-000 Kraków", docNumber: "DEF 654321", pesel: "00000000000" },
      { name: "Piotr Testowy", address: "ul. Przykładowa 12/3, 31-000 Kraków", docNumber: "GHI 112233", pesel: "00000000000" },
    ];
    d.liczniki = [
      { rodzaj: "Energia elektryczna", numer: "72311904", stan: "14 208", jednostka: "kWh" },
      { rodzaj: "Woda zimna", numer: "A19-443201", stan: "182,431", jednostka: "m³" },
      { rodzaj: "Woda ciepła", numer: "A19-443202", stan: "96,115", jednostka: "m³" },
      { rodzaj: "Gaz", numer: "G4-88120", stan: "2 041", jednostka: "m³" },
      { rodzaj: "", numer: "", stan: "", jednostka: "" },
    ];
    d.klucze = [
      { nazwa: "Główny klucz do lokalu", ilosc: "2" },
      { nazwa: "Klucz do śmietnika", ilosc: "1" },
      { nazwa: "Klucz do skrzynki pocztowej", ilosc: "1" },
      { nazwa: "Klucz do klatki schodowej", ilosc: "2" },
      { nazwa: "Klucz do piwnicy", ilosc: "1" },
      { nazwa: "Pilot do bramy", ilosc: "1" },
      { nazwa: "", ilosc: "" },
    ];
    d.uwagi = ["Rysa na blacie kuchennym przy zlewie, zgłoszona i zaakceptowana przy wydaniu."];
    return generujProtokolPdf(d, "Agencja Nieruchomości Spectra s.c. · NIP 6772516327 · Kraków");
  }

  function aneks() {
    const d = domyslnyAneks("Kraków");
    d.umowaNr = "12/09/2026";
    d.umowaData = "2026-09-12";
    d.aneksData = "2026-10-01";
    d.terminOd = "2026-10-01";
    d.terminDo = "2026-12-31";
    d.zleceniodawcy = [{
      name: "Jan Testowy", pesel: "00000000000",
      docNumber: "ABC 123456", address: "ul. Piastów 69/24, 31-483 Kraków",
    }];
    d.przedsiebiorca =
      "Agencja Nieruchomości Spectra s.c. Wiktor Szostek, Krystian Sławęta, NIP: 6772516327, z siedzibą w 30-002 Kraków, ul. Zbożowa 2/1";
    return generujAneksPdf(
      d,
      { nazwa: "Agencja Nieruchomości Spectra s.c. Wiktor Szostek, Krystian Sławęta", nip: "6772516327", adres: "30-002 Kraków, ul. Zbożowa 2/1" },
      "Agencja Nieruchomości Spectra s.c. · NIP 6772516327 · Kraków",
    );
  }

  return (
    <div data-kontrast-pomijaj className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">Dokumenty PDF</h2>
      <p className="mt-0.5 text-sm text-slate-500">
        Podgląd składu bez przechodzenia przez kreator.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => pokaz("Protokół: najem", () => protokol("wydanie"))}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          Protokół: najem
        </button>
        <button
          type="button"
          onClick={() => pokaz("Protokół: sprzedaż", () => protokol("sprzedaz"))}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Protokół: sprzedaż
        </button>
        <button
          type="button"
          onClick={() => pokaz("Aneks do umowy", aneks)}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          Aneks do umowy
        </button>
        <button
          type="button"
          onClick={() => pokaz("Raport biura", () =>
            generujRaportPdf(PRZYKLADOWY_RAPORT, "Agencja Nieruchomości Spectra", "Spectra · raport wygenerowany w AgentSpace"),
          )}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Raport biura
        </button>
        {co && <span className="text-sm text-slate-500">{co}</span>}
        {blad && <span className="text-sm text-red-600">{blad}</span>}
      </div>
      {url && (
        <iframe
          title="Podgląd dokumentu"
          src={`${url}#view=FitH`}
          className="mt-4 h-[760px] w-full rounded-xl border border-slate-200"
        />
      )}
    </div>
  );
}
