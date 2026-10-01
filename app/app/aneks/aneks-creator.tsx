"use client";

import { useState } from "react";
import { Select } from "../components/select";
import { Pole, Sekcja, PrzyciskDodaj, PrzyciskUsun, PasekAkcji, pole } from "../dokumenty-wzory/klocki";
import { generujAneksPdf, type DanePrzedsiebiorcy } from "@/lib/aneks-pdf";
import { pobierzPdf, drukujPdf } from "@/lib/pdf-kit";
import {
  domyslnyAneks, pustyZleceniodawca, RODZAJE_ANEKSU, zmianaAneksu,
  type AneksData, type Zleceniodawca,
} from "@/lib/aneks";

export function AneksCreator({
  city, firma, stopka,
}: {
  city: string;
  firma: DanePrzedsiebiorcy;
  stopka?: string;
}) {
  const [d, setD] = useState<AneksData>(() => domyslnyAneks(city));
  const [pracuje, setPracuje] = useState<false | "zapis" | "druk">(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [gotowe, setGotowe] = useState<string | null>(null);

  function set<K extends keyof AneksData>(k: K, v: AneksData[K]) {
    setD((p) => ({ ...p, [k]: v }));
    setGotowe(null);
  }

  async function zrob(tryb: "zapis" | "druk") {
    setBlad(null);
    setGotowe(null);
    setPracuje(tryb);
    try {
      const bytes = await generujAneksPdf(d, firma, stopka);
      if (tryb === "zapis") {
        const nazwa = `Aneks ${d.umowaNr || ""} - ${d.zleceniodawcy[0]?.name || "umowa"}`
          .replace(/[\\/:*?"<>|]/g, "-")
          .trim();
        pobierzPdf(bytes, nazwa);
        setGotowe("Plik zapisany w folderze pobranych.");
      } else {
        drukujPdf(bytes);
      }
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się przygotować dokumentu.");
    } finally {
      setPracuje(false);
    }
  }

  function zmienZleceniodawce(i: number, patch: Partial<Zleceniodawca>) {
    const n = [...d.zleceniodawcy];
    n[i] = { ...n[i], ...patch };
    set("zleceniodawcy", n);
  }

  const podglad = zmianaAneksu(d);

  return (
    <div className="space-y-5">
      <Sekcja tytul="Umowa, której dotyczy aneks">
        <div className="grid gap-4 sm:grid-cols-2">
          <Pole label="Numer umowy" value={d.umowaNr} onChange={(v) => set("umowaNr", v)} placeholder="04/03/2025" />
          <Pole label="Data zawarcia umowy" type="date" value={d.umowaData} onChange={(v) => set("umowaData", v)} />
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Przedmiot umowy</label>
            <Select
              aria-label="Przedmiot umowy"
              value={d.przedmiot}
              onChange={(e) => set("przedmiot", e.target.value)}
              options={["sprzedaży nieruchomości", "najmu nieruchomości", "kupna nieruchomości", "wynajmu nieruchomości"]}
              placeholder=""
            />
          </div>
          <Pole label="Data aneksu" type="date" value={d.aneksData} onChange={(v) => set("aneksData", v)} />
          <Pole label="Miejscowość" value={d.city} onChange={(v) => set("city", v)} />
        </div>
      </Sekcja>

      <Sekcja
        tytul="Zleceniodawca"
        opis="Dane biura wchodzą automatycznie z Ustawień firmy, więc uzupełniasz tylko drugą stronę."
        akcja={
          <PrzyciskDodaj onClick={() => set("zleceniodawcy", [...d.zleceniodawcy, pustyZleceniodawca()])}>
            Dodaj osobę
          </PrzyciskDodaj>
        }
      >
        <div className="space-y-4">
          {d.zleceniodawcy.map((z, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Osoba {i + 1}
                </span>
                {d.zleceniodawcy.length > 1 && (
                  <PrzyciskUsun
                    onClick={() => set("zleceniodawcy", d.zleceniodawcy.filter((_, j) => j !== i))}
                  />
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Pole label="Imię i nazwisko" value={z.name} onChange={(v) => zmienZleceniodawce(i, { name: v })} placeholder="Witold Niewitała" />
                <Pole label="PESEL" value={z.pesel} onChange={(v) => zmienZleceniodawce(i, { pesel: v })} placeholder="54061602354" maxLength={11} />
                <Pole label="Dokument tożsamości" value={z.docNumber} onChange={(v) => zmienZleceniodawce(i, { docNumber: v })} placeholder="DGH 177614" />
                <Pole label="Adres zamieszkania" value={z.address} onChange={(v) => zmienZleceniodawce(i, { address: v })} placeholder="ul. Zręczyce 225, 32-420 Zręczyce" />
              </div>
            </div>
          ))}
        </div>
      </Sekcja>

      <Sekcja tytul="Co zmieniamy" opis="Wybierz rodzaj zmiany, a treść paragrafu ułoży się sama.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-slate-500">Rodzaj zmiany</label>
            <Select
              aria-label="Rodzaj zmiany"
              value={d.rodzaj}
              onChange={(e) => set("rodzaj", e.target.value as AneksData["rodzaj"])}
              options={RODZAJE_ANEKSU.map((r) => ({
                value: r.value,
                label: r.label,
                hint: r.paragraf ? `zmienia ${r.paragraf}` : undefined,
              }))}
              placeholder=""
            />
          </div>

          {d.rodzaj === "termin" && (
            <>
              <Pole label="Współpraca od" type="date" value={d.terminOd} onChange={(v) => set("terminOd", v)} />
              <Pole label="Współpraca do" type="date" value={d.terminDo} onChange={(v) => set("terminDo", v)} />
            </>
          )}

          {(d.rodzaj === "prowizja" || d.rodzaj === "cena") && (
            <div className="sm:col-span-2">
              <Pole
                label={d.rodzaj === "prowizja" ? "Nowe wynagrodzenie" : "Nowa cena ofertowa"}
                value={d.nowaWartosc}
                onChange={(v) => set("nowaWartosc", v)}
                placeholder={d.rodzaj === "prowizja" ? "2,5% ceny sprzedaży brutto" : "749 000 zł"}
              />
            </div>
          )}

          {d.rodzaj === "wlasny" && (
            <>
              <Pole label="Który paragraf" value={d.wlasnyParagraf} onChange={(v) => set("wlasnyParagraf", v)} placeholder="§3.2" />
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-slate-500">Nowe brzmienie</label>
                <textarea
                  rows={3}
                  value={d.wlasnaTresc}
                  onChange={(e) => set("wlasnaTresc", e.target.value)}
                  placeholder="Wpisz pełną treść paragrafu po zmianie."
                  className={pole}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Tak zabrzmi § 1 aneksu
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-800">
            Strony zgodnie zmieniają treść <strong>{podglad.paragraf}</strong> Umowy, który otrzymuje
            nowe brzmienie: „{podglad.tresc}”
          </p>
        </div>
      </Sekcja>

      <Sekcja
        tytul="Dodatkowe postanowienia"
        opis="Każde trafi do dokumentu jako osobny paragraf. Zwykle niepotrzebne."
        akcja={<PrzyciskDodaj onClick={() => set("dodatkowe", [...d.dodatkowe, ""])}>Dodaj paragraf</PrzyciskDodaj>}
      >
        {d.dodatkowe.length === 0 ? (
          <p className="text-sm text-slate-500">
            Brak. Aneks będzie zawierał samą zmianę i zdanie o tym, że reszta umowy zostaje bez zmian.
          </p>
        ) : (
          <div className="space-y-2">
            {d.dodatkowe.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  rows={2}
                  value={t}
                  onChange={(e) => {
                    const n = [...d.dodatkowe];
                    n[i] = e.target.value;
                    set("dodatkowe", n);
                  }}
                  placeholder="Treść dodatkowego postanowienia."
                  className={pole}
                />
                <PrzyciskUsun onClick={() => set("dodatkowe", d.dodatkowe.filter((_, j) => j !== i))} />
              </div>
            ))}
          </div>
        )}
      </Sekcja>

      <PasekAkcji
        onZapisz={() => zrob("zapis")}
        onDrukuj={() => zrob("druk")}
        pracuje={pracuje}
        blad={blad}
        gotowe={gotowe}
      />
    </div>
  );
}
