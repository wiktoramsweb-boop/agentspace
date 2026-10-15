import { ImageResponse } from "next/og.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wczytajFont, napisNaKrzywe } from "./ttf.mjs";

/**
 * Generator kompletu plików marki AgentSpace.
 *
 * Uruchamiany ręcznie: `node scripts/marka/generuj.mjs`. Trzymamy go w repo,
 * bo poprzedni komplet powstał doraźnie i przy kolejnej zmianie znaku nie było
 * czego uruchomić ponownie.
 */

const TU = path.dirname(fileURLToPath(import.meta.url));
const KORZEN = path.resolve(TU, "../..");
const MARKA = path.join(KORZEN, "public/marka");
const PUBLIC = path.join(KORZEN, "public");

const KOLORY = {
  gradientOd: "#10b981",
  gradientDo: "#06b6d4",
  zielen: "#10b981",
  atrament: "#0b1220",
  ciemneTlo: "#07090c",
  bialy: "#ffffff",
};

/* ---------- znak ---------- */

/*
 * Bryła domu w układzie 0-100. Obrys o grubości 6 z zaokrąglonym łączeniem
 * zaokrągla wszystkie narożniki, ale rozszerza kształt na zewnątrz o 3, więc
 * wejście jest w ścieżce o te 3 szersze z każdej strony i o 3 wyższe.
 */
const BRYLA =
  "M 50 29.3 L 80.5 54 L 72.3 54 L 72.3 76.6 L 60.6 76.6 L 60.6 59.9 " +
  "L 39.6 59.9 L 39.6 76.6 L 27.9 76.6 L 27.9 54 L 19.5 54 Z";

const KROPKA_NA_KALENICY = { cy: 27.6, r: 2.9, srodek: 52.15 };
/*
 * W wersjach jednobarwnych kropka nie ma czym się odróżnić od bryły, więc
 * unosi się ponad kalenicę i zostaje czytelna dzięki prześwitowi.
 */
const KROPKA_UNIESIONA = { cy: 21.4, r: 2.9, srodek: 49.05 };

/*
 * Obrys zaokrąglający rozszerza bryłę o 3 na każdą stronę, więc bez korekty
 * dom byłby o dziesiątą część większy niż w znaku, od którego wyszliśmy,
 * i okap dotykałby krawędzi kafelka.
 */
const KOREKTA_SKALI = 0.91;

function znakTresc(domKolor, kropkaKolor, uniesiona = false) {
  const k = uniesiona ? KROPKA_UNIESIONA : KROPKA_NA_KALENICY;
  return (
    `<g transform="translate(50 50) scale(${KOREKTA_SKALI}) translate(-50 -50)">` +
    `<g transform="translate(0 ${(50 - k.srodek).toFixed(2)})">` +
    `<path d="${BRYLA}" fill="${domKolor}" stroke="${domKolor}" stroke-width="6" ` +
    `stroke-linejoin="round"/>` +
    `<circle cx="50" cy="${k.cy}" r="${k.r}" fill="${kropkaKolor}"/></g></g>`
  );
}

function gradientDefs(id) {
  return (
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${KOLORY.gradientOd}"/>` +
    `<stop offset="1" stop-color="${KOLORY.gradientDo}"/></linearGradient></defs>`
  );
}

/** Znak w kwadracie 0-100, opcjonalnie na kafelku. */
function znakSvg({ tlo, gradient, dom, kropka, uniesiona }) {
  const id = "as";
  const defs = gradient ? gradientDefs(id) : "";
  const kafelek = gradient
    ? `<rect width="100" height="100" rx="22.6" fill="url(#${id})"/>`
    : tlo
      ? `<rect width="100" height="100" rx="22.6" fill="${tlo}"/>`
      : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ` +
    `role="img" aria-label="AgentSpace">${defs}${kafelek}` +
    `${znakTresc(dom, kropka, uniesiona)}</svg>`
  );
}

const ZNAKI = {
  "znak-gradient": { gradient: true, dom: KOLORY.atrament, kropka: KOLORY.bialy },
  "znak-kafelek-ciemny": { tlo: KOLORY.ciemneTlo, dom: KOLORY.bialy, kropka: KOLORY.zielen },
  "znak-kafelek-bialy": { tlo: KOLORY.bialy, dom: KOLORY.zielen, kropka: KOLORY.bialy },
  "znak-zielony": { dom: KOLORY.zielen, kropka: KOLORY.zielen, uniesiona: true },
  "znak-bialy": { dom: KOLORY.bialy, kropka: KOLORY.bialy, uniesiona: true },
  "znak-czarny": { dom: KOLORY.atrament, kropka: KOLORY.atrament, uniesiona: true },
};

/* ---------- napis ---------- */

const font = wczytajFont(path.join(TU, "Sora-SemiBold.ttf"));

/** Prostokąt obejmujący ścieżkę, liczony z jej własnych współrzędnych. */
function ramka(d) {
  const liczby = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < liczby.length; i += 2) {
    minX = Math.min(minX, liczby[i]); maxX = Math.max(maxX, liczby[i]);
    minY = Math.min(minY, liczby[i + 1]); maxY = Math.max(maxY, liczby[i + 1]);
  }
  return { minX, maxX, minY, maxY, szer: maxX - minX, wys: maxY - minY };
}

function napis(rozmiar) {
  const n = napisNaKrzywe(font, "AgentSpace", rozmiar, 0);
  return { d: n.d, ...ramka(n.d) };
}

/* ---------- układy z napisem ---------- */

const BOK = 160;      // bok kafelka znaku w układach
const MARGINES = 44;

function poziomy({ gradient, tloKafelka, domKolor, kropkaKolor, uniesiona, tekstKolor, tlo }) {
  const t = napis(BOK * 0.60);
  const odstep = BOK * 0.30;
  const szer = MARGINES * 2 + BOK + odstep + t.szer;
  const wys = MARGINES * 2 + BOK;
  const tekstY = MARGINES + BOK / 2 - (t.minY + t.maxY) / 2;
  const id = "as";
  const defs = gradient ? gradientDefs(id) : "";
  const kafelek = gradient
    ? `<rect width="${BOK}" height="${BOK}" rx="${BOK * 0.226}" fill="url(#${id})"/>`
    : tloKafelka
      ? `<rect width="${BOK}" height="${BOK}" rx="${BOK * 0.226}" fill="${tloKafelka}"/>`
      : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${szer.toFixed(0)} ${wys}" ` +
    `role="img" aria-label="AgentSpace">${defs}` +
    (tlo ? `<rect width="${szer.toFixed(0)}" height="${wys}" fill="${tlo}"/>` : "") +
    `<g transform="translate(${MARGINES} ${MARGINES})">${kafelek}` +
    `<g transform="scale(${BOK / 100})">${znakTresc(domKolor, kropkaKolor, uniesiona)}</g></g>` +
    `<path transform="translate(${(MARGINES + BOK + odstep).toFixed(1)} ${tekstY.toFixed(1)})" ` +
    `d="${t.d}" fill="${tekstKolor}"/></svg>`
  );
}

function pionowy({ gradient, tloKafelka, domKolor, kropkaKolor, uniesiona, tekstKolor, tlo }) {
  const bok = 200;
  const t = napis(bok * 0.42);
  const odstep = bok * 0.26;
  const szer = Math.max(bok, t.szer) + MARGINES * 2;
  const wys = MARGINES * 2 + bok + odstep + t.wys;
  const id = "as";
  const defs = gradient ? gradientDefs(id) : "";
  const kafelekX = (szer - bok) / 2;
  const kafelek = gradient
    ? `<rect width="${bok}" height="${bok}" rx="${bok * 0.226}" fill="url(#${id})"/>`
    : tloKafelka
      ? `<rect width="${bok}" height="${bok}" rx="${bok * 0.226}" fill="${tloKafelka}"/>`
      : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${szer.toFixed(0)} ${wys.toFixed(0)}" ` +
    `role="img" aria-label="AgentSpace">${defs}` +
    (tlo ? `<rect width="${szer.toFixed(0)}" height="${wys.toFixed(0)}" fill="${tlo}"/>` : "") +
    `<g transform="translate(${kafelekX.toFixed(1)} ${MARGINES})">${kafelek}` +
    `<g transform="scale(${bok / 100})">${znakTresc(domKolor, kropkaKolor, uniesiona)}</g></g>` +
    `<path transform="translate(${((szer - t.szer) / 2 - t.minX).toFixed(1)} ` +
    `${(MARGINES + bok + odstep - t.minY).toFixed(1)})" d="${t.d}" fill="${tekstKolor}"/></svg>`
  );
}

const NA_GRADIENCIE = { gradient: true, domKolor: KOLORY.atrament, kropkaKolor: KOLORY.bialy };
const UKLADY = {
  "poziome-gradient-tekst-ciemny": poziomy({ ...NA_GRADIENCIE, tekstKolor: KOLORY.atrament }),
  "poziome-gradient-tekst-bialy": poziomy({ ...NA_GRADIENCIE, tekstKolor: KOLORY.bialy }),
  "poziome-na-bialym-tle": poziomy({ ...NA_GRADIENCIE, tekstKolor: KOLORY.atrament, tlo: KOLORY.bialy }),
  "poziome-na-ciemnym-tle": poziomy({ ...NA_GRADIENCIE, tekstKolor: KOLORY.bialy, tlo: KOLORY.ciemneTlo }),
  "poziome-bialy": poziomy({ domKolor: KOLORY.bialy, kropkaKolor: KOLORY.bialy, uniesiona: true, tekstKolor: KOLORY.bialy }),
  "poziome-czarny": poziomy({ domKolor: KOLORY.atrament, kropkaKolor: KOLORY.atrament, uniesiona: true, tekstKolor: KOLORY.atrament }),
  "poziome-zielony": poziomy({ domKolor: KOLORY.zielen, kropkaKolor: KOLORY.zielen, uniesiona: true, tekstKolor: KOLORY.zielen }),
  "pionowe-gradient-tekst-ciemny": pionowy({ ...NA_GRADIENCIE, tekstKolor: KOLORY.atrament }),
  "pionowe-gradient-tekst-bialy": pionowy({ ...NA_GRADIENCIE, tekstKolor: KOLORY.bialy }),
  "pionowe-na-bialym-tle": pionowy({ ...NA_GRADIENCIE, tekstKolor: KOLORY.atrament, tlo: KOLORY.bialy }),
  "pionowe-na-ciemnym-tle": pionowy({ ...NA_GRADIENCIE, tekstKolor: KOLORY.bialy, tlo: KOLORY.ciemneTlo }),
};

/* ---------- zapis ---------- */

/*
 * Rasteryzator czyta rozmiar z atrybutów, nie z viewBox, i bez nich odmawia
 * wczytania pliku. Dlatego wstrzykujemy je zarówno przy zapisie .svg,
 * jak i przed każdym renderem do PNG.
 */
function zWymiarami(svg, szer, wys) {
  return svg.replace("<svg ", `<svg width="${szer}" height="${wys}" `);
}

function wymiaryZViewBox(svg) {
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  return [Math.round(w), Math.round(h)];
}

function zapiszSvg(plik, svg) {
  const [w, h] = wymiaryZViewBox(svg);
  fs.writeFileSync(plik, zWymiarami(svg, w, h) + "\n");
}

async function png(svg, szer, wys, plik) {
  const zrodlo = zWymiarami(svg, szer, wys);
  const r = new ImageResponse(
    {
      type: "div",
      props: {
        style: { width: "100%", height: "100%", display: "flex", background: "transparent" },
        children: [{
          type: "img",
          props: { src: `data:image/svg+xml;base64,${Buffer.from(zrodlo).toString("base64")}`,
                   width: szer, height: wys },
        }],
      },
    },
    { width: szer, height: wys },
  );
  fs.writeFileSync(plik, Buffer.from(await r.arrayBuffer()));
}

fs.mkdirSync(MARKA, { recursive: true });
let zapisanych = 0;

for (const [nazwa, opcje] of Object.entries(ZNAKI)) {
  const svg = znakSvg(opcje);
  zapiszSvg(path.join(MARKA, `${nazwa}.svg`), svg);
  zapisanych++;
  for (const px of [64, 128, 256, 512, 1024]) {
    await png(svg, px, px, path.join(MARKA, `${nazwa}-${px}.png`));
    zapisanych++;
  }
}

/* Wersja dziedzicząca kolor po rodzicu: pieczątki, druk jednobarwny. */
zapiszSvg(
  path.join(MARKA, "znak-mono.svg"),
  znakSvg({ dom: "currentColor", kropka: "currentColor", uniesiona: true }),
);
zapisanych++;

for (const [nazwa, svg] of Object.entries(UKLADY)) {
  zapiszSvg(path.join(MARKA, `${nazwa}.svg`), svg);
  zapisanych++;
  const [w, h] = wymiaryZViewBox(svg);
  await png(svg, w, h, path.join(MARKA, `${nazwa}.png`));
  await png(svg, w * 2, h * 2, path.join(MARKA, `${nazwa}@2x.png`));
  zapisanych += 2;
}

/* Ikony aplikacji biorą ten sam znak, żeby nie rozjechały się z marką. */
const ikona = znakSvg(ZNAKI["znak-gradient"]);
await png(ikona, 192, 192, path.join(PUBLIC, "icon-192.png"));
await png(ikona, 512, 512, path.join(PUBLIC, "icon-512.png"));
await png(ikona, 500, 500, path.join(PUBLIC, "logo.png"));
zapisanych += 3;

/*
 * Ikony, które Next podaje sam: karta przeglądarki, ekran główny iPhone'a
 * i favicon.ico dla starszych czytników. Leżą w app/, nie w public/,
 * bo tam szuka ich Next przy budowaniu znaczników <link rel="icon">.
 */
const APP = path.join(KORZEN, "app");
await png(ikona, 512, 512, path.join(APP, "icon.png"));
await png(ikona, 180, 180, path.join(APP, "apple-icon.png"));

/*
 * Plik ICO może trzymać w środku zwykłe PNG (od Windows Vista), więc nie
 * potrzebujemy osobnego konwertera: nagłówek, katalog obrazów i same PNG.
 */
const rozmiaryIco = [16, 32, 48];
const obrazy = [];
for (const px of rozmiaryIco) {
  const tmp = path.join(TU, `.ico-${px}.png`);
  await png(ikona, px, px, tmp);
  obrazy.push(fs.readFileSync(tmp));
  fs.unlinkSync(tmp);
}
const naglowek = Buffer.alloc(6);
naglowek.writeUInt16LE(0, 0);
naglowek.writeUInt16LE(1, 2);
naglowek.writeUInt16LE(obrazy.length, 4);
const katalog = Buffer.alloc(16 * obrazy.length);
let przesuniecie = 6 + katalog.length;
obrazy.forEach((dane, i) => {
  const px = rozmiaryIco[i];
  const o = i * 16;
  katalog.writeUInt8(px >= 256 ? 0 : px, o);
  katalog.writeUInt8(px >= 256 ? 0 : px, o + 1);
  katalog.writeUInt8(0, o + 2);
  katalog.writeUInt8(0, o + 3);
  katalog.writeUInt16LE(1, o + 4);
  katalog.writeUInt16LE(32, o + 6);
  katalog.writeUInt32LE(dane.length, o + 8);
  katalog.writeUInt32LE(przesuniecie, o + 12);
  przesuniecie += dane.length;
});
fs.writeFileSync(path.join(APP, "favicon.ico"), Buffer.concat([naglowek, katalog, ...obrazy]));
zapisanych += 3;

console.log(`gotowe, plików: ${zapisanych}`);
