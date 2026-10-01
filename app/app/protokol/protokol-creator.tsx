"use client";

import { useState } from "react";
import { Select } from "../components/select";
import { Pole, Sekcja, PrzyciskDodaj, PrzyciskUsun, PasekAkcji, pole } from "../dokumenty-wzory/klocki";
import { generujProtokolPdf } from "@/lib/protokol-pdf";
import { pobierzPdf, drukujPdf } from "@/lib/pdf-kit";
import {
  domyslneDane, pustaStrona, JEDNOSTKI, KIERUNKI, KLUCZE_PODPOWIEDZI, LICZNIKI_PODPOWIEDZI,
  KLAUZULA_FOTO, type ProtokolData, type Strona,
} from "@/lib/protokol";

export function ProtokolCreator({ city, stopka }: { city: string; stopka?: string }) {
  const [d, setD] = useState<ProtokolData>(() => domyslneDane(city));
  const [pracuje, setPracuje] = useState<false | "zapis" | "druk">(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [gotowe, setGotowe] = useState<string | null>(null);

  function set<K extends keyof ProtokolData>(k: K, v: ProtokolData[K]) {
    setD((p) => ({ ...p, [k]: v }));
    setGotowe(null);
  }

  function nazwaPliku() {
    const adres = d.lokalAdres.trim() || "lokal";
    const co = d.kierunek === "wydanie" ? "wydanie" : "zwrot";
    return `Protokół zdawczo-odbiorczy (${co}) - ${adres}`.replace(/[\\/:*?"<>|]/g, "-");
  }

  async function zrob(tryb: "zapis" | "druk") {
    setBlad(null);
    setGotowe(null);
    setPracuje(tryb);
    try {
      const bytes = await generujProtokolPdf(d, stopka);
      if (tryb === "zapis") {
        pobierzPdf(bytes, nazwaPliku());
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

  return (
    <div className="space-y-5">
      <Sekcja tytul="Podstawa" opis="Dane, które trafią do pierwszego akapitu protokołu.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Rodzaj protokołu</label>
            <Select
              aria-label="Rodzaj protokołu"
              value={d.kierunek}
              onChange={(e) => {
                const k = e.target.value as ProtokolData["kierunek"];
                // Przy sprzedaży zmienia się rodzaj umowy w zdaniu wstępnym,
                // a klauzula o zdjęciach dotyczy tylko najmu.
                setD((p) => ({
                  ...p,
                  kierunek: k,
                  umowaRodzaj: k === "sprzedaz" ? "sprzedaży" : p.umowaRodzaj === "sprzedaży" ? "najmu okazjonalnego" : p.umowaRodzaj,
                  klauzulaFoto: k === "sprzedaz" ? false : p.klauzulaFoto,
                  pustychUwag: k === "sprzedaz" ? 1 : p.pustychUwag,
                }));
                setGotowe(null);
              }}
              options={KIERUNKI.map((k) => ({ value: k.value, label: k.label }))}
              placeholder=""
            />
          </div>
          <Pole label="Data spisania" type="date" value={d.date} onChange={(v) => set("date", v)} />
          <Pole label="Miejscowość" value={d.city} onChange={(v) => set("city", v)} placeholder="Kraków" />
          <Pole
            label="Adres lokalu"
            value={d.lokalAdres}
            onChange={(v) => set("lokalAdres", v)}
            placeholder="ul. Piastów 69/24, 31-483 Kraków"
          />
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Rodzaj umowy</label>
            <Select
              aria-label="Rodzaj umowy"
              value={d.umowaRodzaj}
              onChange={(e) => set("umowaRodzaj", e.target.value)}
              options={
                d.kierunek === "sprzedaz"
                  ? ["sprzedaży", "przedwstępnej sprzedaży", "deweloperskiej"]
                  : ["najmu okazjonalnego", "najmu", "najmu instytucjonalnego", "użyczenia"]
              }
              placeholder=""
            />
          </div>
          <Pole label="Data zawarcia umowy" type="date" value={d.umowaData} onChange={(v) => set("umowaData", v)} />
        </div>
      </Sekcja>

      <ListaStron
        tytul={
          d.kierunek === "sprzedaz" ? "Sprzedający" : d.kierunek === "wydanie" ? "Zdający lokal" : "Przejmujący lokal"
        }
        opis="Zwykle właściciel lokalu. Możesz dodać więcej osób, jeśli właścicieli jest kilku."
        osoby={d.zdajacy}
        onChange={(v) => set("zdajacy", v)}
      />

      <ListaStron
        tytul={
          d.kierunek === "sprzedaz" ? "Kupujący" : d.kierunek === "wydanie" ? "Przejmujący lokal" : "Zdający lokal"
        }
        opis="Przy dwóch i więcej osobach dokument sam odmieni nazwy stron."
        osoby={d.przejmujacy}
        onChange={(v) => set("przejmujacy", v)}
      />

      <Sekcja
        tytul="§ 1. Stany liczników"
        opis="Dodaj tyle wierszy, ile liczników jest w lokalu. Pusty wiersz zostanie na wydruku do dopisania ręcznie."
        akcja={
          <PrzyciskDodaj
            onClick={() => set("liczniki", [...d.liczniki, { rodzaj: "", numer: "", stan: "", jednostka: "" }])}
          >
            Dodaj licznik
          </PrzyciskDodaj>
        }
      >
        <div className="space-y-2">
          {d.liczniki.map((l, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
              <div className="min-w-[180px] flex-[2]">
                <input
                  list="liczniki-podpowiedzi"
                  value={l.rodzaj}
                  onChange={(e) => {
                    const n = [...d.liczniki];
                    n[i] = { ...l, rodzaj: e.target.value };
                    set("liczniki", n);
                  }}
                  placeholder="Rodzaj licznika"
                  className={pole}
                />
              </div>
              <div className="min-w-[120px] flex-1">
                <input
                  value={l.numer}
                  onChange={(e) => {
                    const n = [...d.liczniki];
                    n[i] = { ...l, numer: e.target.value };
                    set("liczniki", n);
                  }}
                  placeholder="Numer"
                  className={pole}
                />
              </div>
              <div className="min-w-[90px] flex-1">
                <input
                  value={l.stan}
                  onChange={(e) => {
                    const n = [...d.liczniki];
                    n[i] = { ...l, stan: e.target.value };
                    set("liczniki", n);
                  }}
                  placeholder="Stan"
                  className={pole}
                />
              </div>
              <div className="w-28">
                <Select
                  aria-label="Jednostka"
                  value={l.jednostka}
                  onChange={(e) => {
                    const n = [...d.liczniki];
                    n[i] = { ...l, jednostka: e.target.value };
                    set("liczniki", n);
                  }}
                  options={[...JEDNOSTKI]}
                  placeholder="jedn."
                />
              </div>
              <PrzyciskUsun onClick={() => set("liczniki", d.liczniki.filter((_, j) => j !== i))} />
            </div>
          ))}
          <datalist id="liczniki-podpowiedzi">
            {LICZNIKI_PODPOWIEDZI.map((p) => <option key={p} value={p} />)}
          </datalist>
        </div>
      </Sekcja>

      <Sekcja
        tytul="§ 2. Przekazane klucze i przedmioty"
        opis="Domyślne pozycje możesz usunąć albo zmienić. Pusty wiersz zostawia miejsce na wydruku."
        akcja={
          <PrzyciskDodaj onClick={() => set("klucze", [...d.klucze, { nazwa: "", ilosc: "" }])}>
            Dodaj pozycję
          </PrzyciskDodaj>
        }
      >
        <div className="space-y-2">
          {d.klucze.map((k, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <input
                  list="klucze-podpowiedzi"
                  value={k.nazwa}
                  onChange={(e) => {
                    const n = [...d.klucze];
                    n[i] = { ...k, nazwa: e.target.value };
                    set("klucze", n);
                  }}
                  placeholder="Nazwa klucza lub przedmiotu"
                  className={pole}
                />
              </div>
              <div className="w-24">
                <input
                  value={k.ilosc}
                  onChange={(e) => {
                    const n = [...d.klucze];
                    n[i] = { ...k, ilosc: e.target.value };
                    set("klucze", n);
                  }}
                  placeholder="szt."
                  className={pole}
                />
              </div>
              <PrzyciskUsun onClick={() => set("klucze", d.klucze.filter((_, j) => j !== i))} />
            </div>
          ))}
          <datalist id="klucze-podpowiedzi">
            {KLUCZE_PODPOWIEDZI.map((p) => <option key={p} value={p} />)}
          </datalist>
        </div>
      </Sekcja>

      <Sekcja
        tytul="§ 3. Uwagi"
        akcja={<PrzyciskDodaj onClick={() => set("uwagi", [...d.uwagi, ""])}>Dodaj uwagę</PrzyciskDodaj>}
      >
        {d.kierunek !== "sprzedaz" && (
        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 p-3.5 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
          <input
            type="checkbox"
            checked={d.klauzulaFoto}
            onChange={(e) => set("klauzulaFoto", e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-emerald-500"
          />
          <span>
            <span className="font-medium text-slate-900">Klauzula o dokumentacji fotograficznej</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500">{KLAUZULA_FOTO}</span>
          </span>
        </label>
        )}

        <div className="space-y-2">
          {d.uwagi.map((u, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                value={u}
                rows={2}
                onChange={(e) => {
                  const n = [...d.uwagi];
                  n[i] = e.target.value;
                  set("uwagi", n);
                }}
                placeholder="Np. rysa na blacie kuchennym, zgłoszona i zaakceptowana przy przekazaniu."
                className={pole}
              />
              <PrzyciskUsun onClick={() => set("uwagi", d.uwagi.filter((_, j) => j !== i))} />
            </div>
          ))}
        </div>

        <div className="mt-4 max-w-xs">
          <Pole
            label="Pustych linii na dopiski"
            type="number"
            value={String(d.pustychUwag)}
            onChange={(v) => set("pustychUwag", Math.max(0, Math.min(10, parseInt(v, 10) || 0)))}
            hint="Zostaną na wydruku, żeby dało się coś dopisać długopisem na miejscu."
          />
        </div>
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

function ListaStron({
  tytul, opis, osoby, onChange,
}: {
  tytul: string;
  opis: string;
  osoby: Strona[];
  onChange: (v: Strona[]) => void;
}) {
  function zmien(i: number, patch: Partial<Strona>) {
    const n = [...osoby];
    n[i] = { ...n[i], ...patch };
    onChange(n);
  }
  return (
    <Sekcja
      tytul={tytul}
      opis={opis}
      akcja={<PrzyciskDodaj onClick={() => onChange([...osoby, pustaStrona()])}>Dodaj osobę</PrzyciskDodaj>}
    >
      <div className="space-y-4">
        {osoby.map((o, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Osoba {i + 1}
              </span>
              {osoby.length > 1 && (
                <PrzyciskUsun onClick={() => onChange(osoby.filter((_, j) => j !== i))} />
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Pole label="Imię i nazwisko" value={o.name} onChange={(v) => zmien(i, { name: v })} placeholder="imię i nazwisko" />
              <Pole label="Adres zamieszkania" value={o.address} onChange={(v) => zmien(i, { address: v })} placeholder="ul. Piastów 69/24, 31-483 Kraków" />
              <Pole label="Seria i numer dowodu" value={o.docNumber} onChange={(v) => zmien(i, { docNumber: v })} placeholder="ABC 123456" />
              <Pole label="PESEL" value={o.pesel} onChange={(v) => zmien(i, { pesel: v })} placeholder="11 cyfr" maxLength={11} />
            </div>
          </div>
        ))}
      </div>
    </Sekcja>
  );
}
