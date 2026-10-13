/**
 * Czytanie plików CSV z eksportów innych systemów.
 *
 * Plik celowo BEZ importów, żeby dało się go sprawdzić testem w gołym node
 * (`npm run test:import`). To jest kod, który dostaje cudze dane w nieznanym
 * formacie, więc musi znieść wszystko, co wyjdzie z Excela i z ASARI.
 *
 * Trzy rzeczy, przez które naiwny `split(",")` tu nie wystarcza:
 * 1. Polski Excel zapisuje CSV ze średnikiem, bo przecinek jest separatorem
 *    dziesiętnym. Zgadujemy separator z pierwszej linii.
 * 2. Pola bywają w cudzysłowach i mają w środku separatory, cudzysłowy
 *    (podwojone) i znaki końca linii, np. notatka z kilku akapitów.
 * 3. Excel zapisuje plik ze znacznikiem BOM, który bez usunięcia wkleja się
 *    do nazwy pierwszej kolumny i psuje dopasowanie nagłówków.
 */

/** Separator zgadnięty z pierwszego wiersza: wygrywa ten, który dzieli go na najwięcej pól. */
export function wykryjSeparator(pierwszaLinia: string): string {
  const kandydaci = [";", ",", "\t", "|"];
  let najlepszy = ";";
  let ile = 0;
  for (const k of kandydaci) {
    // Liczymy tylko separatory POZA cudzysłowami.
    let w = 0;
    let n = 0;
    for (let i = 0; i < pierwszaLinia.length; i++) {
      const z = pierwszaLinia[i];
      if (z === '"') w ^= 1;
      else if (!w && z === k) n++;
    }
    if (n > ile) {
      ile = n;
      najlepszy = k;
    }
  }
  return najlepszy;
}

/** Wiersze pliku jako tablice pól. Pierwszy wiersz to zwykle nagłówki. */
export function czytajCsv(tresc: string, separator?: string): string[][] {
  // BOM z Excela.
  const tekst = tresc.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const sep = separator ?? wykryjSeparator(tekst.split("\n")[0] ?? "");

  const wiersze: string[][] = [];
  let pola: string[] = [];
  let pole = "";
  let wCudzyslowie = false;

  for (let i = 0; i < tekst.length; i++) {
    const z = tekst[i];

    if (wCudzyslowie) {
      if (z === '"') {
        // Podwojony cudzysłów w środku pola to jeden znak cudzysłowu.
        if (tekst[i + 1] === '"') {
          pole += '"';
          i++;
        } else wCudzyslowie = false;
      } else pole += z;
      continue;
    }

    if (z === '"') wCudzyslowie = true;
    else if (z === sep) {
      pola.push(pole);
      pole = "";
    } else if (z === "\n") {
      pola.push(pole);
      wiersze.push(pola);
      pola = [];
      pole = "";
    } else pole += z;
  }

  if (pole !== "" || pola.length > 0) {
    pola.push(pole);
    wiersze.push(pola);
  }

  // Puste linie na końcu pliku nie są wierszami danych.
  return wiersze.filter((w) => w.some((p) => p.trim() !== ""));
}

/** Wiersze jako obiekty, kluczowane nagłówkami z pierwszego wiersza. */
export function czytajCsvZNaglowkami(tresc: string): { naglowki: string[]; wiersze: Record<string, string>[] } {
  const surowe = czytajCsv(tresc);
  if (surowe.length === 0) return { naglowki: [], wiersze: [] };

  const naglowki = surowe[0].map((n) => n.trim());
  const wiersze = surowe.slice(1).map((w) => {
    const o: Record<string, string> = {};
    naglowki.forEach((n, i) => {
      o[n] = (w[i] ?? "").trim();
    });
    return o;
  });
  return { naglowki, wiersze };
}
