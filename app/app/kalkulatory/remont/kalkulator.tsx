"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "../../components/select";
import { pole, PrzyciskDodaj, PrzyciskUsun, Sekcja } from "../../dokumenty-wzory/klocki";
import {
  geometria, nowePomieszczenie, nowyKosztorys, policz, pozycjeDla, POZYCJE, STANDARDY, TYPY, ukladMieszkania, wlaczona, ZAKRESY, zaokr,
  type Kosztorys, type Pomieszczenie, type TypPomieszczenia,
} from "@/lib/remont";
import { generujKosztorysPdf } from "@/lib/remont-pdf";
import { pobierzPdf, drukujPdf } from "@/lib/pdf-kit";
import { usunKosztorys, zapiszKosztorys, type ZapisanyKosztorys } from "./actions";

export type OfertaRemont = { id: string; nazwa: string; metraz: number | null; pokoje: number | null };

// Wąskie pola (ilość, cena) bez „w-full” z klocków: inaczej pole rozciągało
// się na całą linię, przykrywało checkbox i nie dało się nic zaznaczyć.
const waskie = pole.replace("w-full", "");

const zl = (n: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(n)) + " zł";
const liczbaZ = (s: string) => {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function KalkulatorRemontu({
  oferty, zapisane, v49, wczytany, startOferta, biuro, stopka,
}: {
  oferty: OfertaRemont[];
  zapisane: ZapisanyKosztorys[];
  v49: boolean;
  wczytany: { id: string; dane: Kosztorys; propertyId: string | null } | null;
  startOferta?: string;
  biuro: { nazwa: string; agent: string; telefon?: string; email?: string };
  stopka: string;
}) {
  const router = useRouter();
  const start = oferty.find((o) => o.id === startOferta);
  const [k, setK] = useState<Kosztorys>(() => {
    if (wczytany) return { ...nowyKosztorys(), ...wczytany.dane };
    const n = nowyKosztorys(start?.metraz ?? 50, start?.pokoje ?? 2);
    return start ? { ...n, adres: start.nazwa } : n;
  });
  const [ofertaId, setOfertaId] = useState(wczytany?.propertyId ?? start?.id ?? "");
  const [id, setId] = useState(wczytany?.id ?? "");
  const [szybkoM, setSzybkoM] = useState(String(start?.metraz ?? 50));
  const [szybkoP, setSzybkoP] = useState(String(start?.pokoje ?? 2));
  const [otwarte, setOtwarte] = useState<string | null>(null);
  const [cennik, setCennik] = useState(false);
  const [pracuje, setPracuje] = useState<false | "pdf" | "druk">(false);
  const [zapis, startZapis] = useTransition();
  const [komunikat, setKomunikat] = useState<{ ok: boolean; t: string } | null>(null);

  const wynik = useMemo(() => policz(k), [k]);

  function zmien(patch: Partial<Kosztorys>) {
    setK((p) => ({ ...p, ...patch }));
    setKomunikat(null);
  }
  function zmienPom(pid: string, patch: Partial<Pomieszczenie>) {
    setK((p) => ({ ...p, pomieszczenia: p.pomieszczenia.map((x) => (x.id === pid ? { ...x, ...patch } : x)) }));
    setKomunikat(null);
  }

  function rozloz(m: number, pokoje: number) {
    zmien({ pomieszczenia: ukladMieszkania(m, pokoje) });
  }

  function wybierzOferte(oid: string) {
    setOfertaId(oid);
    const o = oferty.find((x) => x.id === oid);
    if (!o) return;
    setSzybkoM(String(o.metraz ?? ""));
    setSzybkoP(String(o.pokoje ?? ""));
    zmien({ adres: o.nazwa, pomieszczenia: ukladMieszkania(o.metraz ?? 50, o.pokoje ?? 2) });
  }

  // Wybór zakresu resetuje ręczne odznaczenia: agent zmienia zakres właśnie po to,
  // żeby zobaczyć inny wariant, a nie mieszankę starego i nowego.
  function ustawZakres(z: Kosztorys["zakres"]) {
    zmien({ zakres: z, pomieszczenia: k.pomieszczenia.map((p) => ({ ...p, wybor: {} })) });
  }

  async function pdf(tryb: "pdf" | "druk") {
    setPracuje(tryb);
    setKomunikat(null);
    try {
      const bytes = await generujKosztorysPdf(k, biuro, stopka);
      if (tryb === "pdf") pobierzPdf(bytes, `${k.tytul || "Kosztorys remontu"}${k.adres ? ` - ${k.adres}` : ""}`.replace(/[\\/:*?"<>|]/g, "-"));
      else drukujPdf(bytes);
    } catch (e) {
      setKomunikat({ ok: false, t: e instanceof Error ? e.message : "Nie udało się przygotować PDF." });
    } finally {
      setPracuje(false);
    }
  }

  function zapisz() {
    startZapis(async () => {
      const r = await zapiszKosztorys(k, { id: id || undefined, propertyId: ofertaId || null });
      if (!r.ok) return setKomunikat({ ok: false, t: r.error });
      setId(r.id);
      setKomunikat({ ok: true, t: "Kosztorys zapisany." });
      router.refresh();
    });
  }

  const stawki = `VAT ${Math.round(wynik.stawkaRobocizna * 100)}% robocizna, ${Math.round(wynik.stawkaMaterialy * 100)}% materiały`;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0 space-y-5">
        <Sekcja tytul="Mieszkanie">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-slate-500" htmlFor="rem-tytul">Tytuł</label>
              <input id="rem-tytul" value={k.tytul} onChange={(e) => zmien({ tytul: e.target.value })} className={pole} maxLength={120} />
            </div>
            {oferty.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm text-slate-500">Z oferty</label>
                <Select
                  aria-label="Oferta"
                  value={ofertaId}
                  onChange={(e) => wybierzOferte(e.target.value)}
                  options={oferty.map((o) => ({ value: o.id, label: o.nazwa, hint: o.metraz ? `${o.metraz} m²` : undefined }))}
                  placeholder="Wybierz ofertę…"
                />
              </div>
            )}
            <div className={oferty.length > 0 ? "" : "sm:col-span-2"}>
              <label className="mb-1.5 block text-sm text-slate-500" htmlFor="rem-adres">Adres</label>
              <input id="rem-adres" value={k.adres} onChange={(e) => zmien({ adres: e.target.value })} className={pole} maxLength={160} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3">
            <div className="w-28">
              <label className="mb-1 block text-xs text-slate-500" htmlFor="rem-m">Metraż (m²)</label>
              <input id="rem-m" inputMode="decimal" value={szybkoM} onChange={(e) => setSzybkoM(e.target.value)} className={pole} />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs text-slate-500" htmlFor="rem-p">Pokoje</label>
              <input id="rem-p" inputMode="numeric" value={szybkoP} onChange={(e) => setSzybkoP(e.target.value)} className={pole} />
            </div>
            <button
              type="button"
              onClick={() => rozloz(liczbaZ(szybkoM), liczbaZ(szybkoP))}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              Rozłóż na pomieszczenia
            </button>
            <p className="basis-full text-xs text-slate-400">Typowy układ z metrażu i liczby pokoi. Każde pomieszczenie możesz potem poprawić.</p>
          </div>
        </Sekcja>

        <Sekcja tytul="Zakres i standard">
          <p className="mb-2 text-sm font-medium text-slate-700">Zakres prac</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {ZAKRESY.map((z) => (
              <Kafel key={z.v} aktywny={k.zakres === z.v} onClick={() => ustawZakres(z.v)} tytul={z.l} opis={z.opis} />
            ))}
          </div>
          <p className="mb-2 mt-5 text-sm font-medium text-slate-700">Standard wykończenia</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {STANDARDY.map((s) => (
              <Kafel key={s.v} aktywny={k.standard === s.v} onClick={() => zmien({ standard: s.v })} tytul={s.l} opis={s.opis} />
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm text-slate-500">Materiały kupuje</label>
              <Select
                aria-label="Materiały kupuje"
                value={k.materialy}
                onChange={(e) => zmien({ materialy: e.target.value === "inwestor" ? "inwestor" : "wykonawca" })}
                options={[{ value: "wykonawca", label: "Ekipa (VAT 8%)" }, { value: "inwestor", label: "Właściciel (VAT 23%)" }]}
                placeholder=""
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-500" htmlFor="rem-rez">Rezerwa (%)</label>
              <input id="rem-rez" inputMode="numeric" value={String(k.rezerwaProc)} onChange={(e) => zmien({ rezerwaProc: Math.min(50, liczbaZ(e.target.value)) })} className={pole} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-500" htmlFor="rem-h">Wysokość pomieszczeń (m)</label>
              <input id="rem-h" inputMode="decimal" value={String(k.wysokosc)} onChange={(e) => zmien({ wysokosc: Math.min(5, liczbaZ(e.target.value)) || 2.6 })} className={pole} />
            </div>
          </div>
        </Sekcja>

        <Sekcja
          tytul="Pomieszczenia"
          opis="Kliknij pomieszczenie, żeby zobaczyć pozycje. Ilości liczą się z metrażu, ale każdą możesz wpisać ręcznie."
        >
          <div className="space-y-3">
            {k.pomieszczenia.map((pom) => (
              <PomieszczenieKarta
                key={pom.id}
                pom={pom}
                k={k}
                suma={wynik.pomieszczenia.find((x) => x.id === pom.id)?.netto ?? 0}
                otwarte={otwarte === pom.id}
                onPrzelacz={() => setOtwarte(otwarte === pom.id ? null : pom.id)}
                onZmiana={(patch) => zmienPom(pom.id, patch)}
                onUsun={() => zmien({ pomieszczenia: k.pomieszczenia.filter((x) => x.id !== pom.id) })}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {TYPY.map((t) => (
              <PrzyciskDodaj key={t.v} onClick={() => zmien({ pomieszczenia: [...k.pomieszczenia, nowePomieszczenie(t.v, t.v === "lazienka" ? 5 : t.v === "balkon" ? 4 : 12)] })}>
                {t.l}
              </PrzyciskDodaj>
            ))}
          </div>
        </Sekcja>

        <Sekcja
          tytul="Cennik"
          opis="Ceny netto za jednostkę przy standardzie „Standard”. Zmień je na stawki Twoich ekip, a kosztorys przeliczy się od razu."
          akcja={
            <button type="button" onClick={() => setCennik((c) => !c)} className="text-sm font-medium text-emerald-700 hover:underline">
              {cennik ? "Zwiń" : "Pokaż cennik"}
            </button>
          }
        >
          {cennik ? (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400">
                    <th className="px-2 py-1 font-medium">Pozycja</th>
                    <th className="px-2 py-1 font-medium">Jedn.</th>
                    <th className="px-2 py-1 text-right font-medium">Robocizna</th>
                    <th className="px-2 py-1 text-right font-medium">Materiał</th>
                  </tr>
                </thead>
                <tbody>
                  {POZYCJE.map((p) => {
                    const c = k.ceny[p.id];
                    const ustaw = (pole: "r" | "m", v: string) =>
                      zmien({ ceny: { ...k.ceny, [p.id]: { r: c?.r ?? p.r, m: c?.m ?? p.m, [pole]: liczbaZ(v) } } });
                    return (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-2 py-1.5 text-slate-700">{p.nazwa}</td>
                        <td className="px-2 py-1.5 text-slate-400">{p.jedn}</td>
                        <td className="px-2 py-1.5 text-right">
                          <input aria-label={`Robocizna: ${p.nazwa}`} inputMode="decimal" value={String(c?.r ?? p.r)} onChange={(e) => ustaw("r", e.target.value)} className={`${waskie} w-24 py-1.5 text-right`} />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <input aria-label={`Materiał: ${p.nazwa}`} inputMode="decimal" value={String(c?.m ?? p.m)} onChange={(e) => ustaw("m", e.target.value)} className={`${waskie} w-24 py-1.5 text-right`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {Object.keys(k.ceny).length > 0 && (
                <button type="button" onClick={() => zmien({ ceny: {} })} className="mt-3 px-2 text-sm text-slate-500 hover:text-slate-800">
                  Przywróć ceny domyślne
                </button>
              )}
              <p className="mt-2 px-2 text-xs text-slate-400">Zmieniona cena obowiązuje we wszystkich standardach, bo to już Twoja stawka, a nie średnia rynkowa.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {Object.keys(k.ceny).length > 0 ? `Zmienione ceny: ${Object.keys(k.ceny).length}.` : "Średnie ceny rynkowe 2026 dla dużego miasta."}
            </p>
          )}
        </Sekcja>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Szacowany koszt</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{zl(wynik.brutto)}</p>
          <p className="mt-1 text-sm text-slate-500">
            {zl(wynik.naMetr)} za m² · ok. {wynik.tygodnie} {wynik.tygodnie === 1 ? "tydzień" : wynik.tygodnie < 5 ? "tygodnie" : "tygodni"} prac
          </p>
          <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
            <Wiersz l="Robocizna netto" v={zl(wynik.robociznaNetto)} />
            <Wiersz l="Materiały netto" v={zl(wynik.materialyNetto)} />
            <Wiersz l="VAT" v={zl(wynik.vatRobocizna + wynik.vatMaterialy)} />
            <Wiersz l={`Rezerwa ${k.rezerwaProc}%`} v={zl(wynik.rezerwa)} />
          </dl>
          <p className="mt-2 text-xs text-slate-400">{stawki}{wynik.metrazRazem > 150 ? " (powyżej 150 m² wszędzie 23%)" : ""}</p>

          {wynik.pomieszczenia.length > 0 && wynik.netto > 0 && (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              {wynik.pomieszczenia.map((p) => (
                <div key={p.id}>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="truncate">{p.nazwa}</span>
                    <span>{zl(p.netto)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.max(2, (p.netto / wynik.netto) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => pdf("pdf")}
              disabled={!!pracuje}
              className="rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
            >
              {pracuje === "pdf" ? "Tworzę…" : "Pobierz PDF"}
            </button>
            <button
              type="button"
              onClick={() => pdf("druk")}
              disabled={!!pracuje}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400 disabled:opacity-60"
            >
              {pracuje === "druk" ? "Chwila…" : "Drukuj"}
            </button>
          </div>
          {v49 && (
            <button
              type="button"
              onClick={zapisz}
              disabled={zapis}
              className="mt-2 w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
            >
              {zapis ? "Zapisuję…" : id ? "Zapisz zmiany" : "Zapisz kosztorys"}
            </button>
          )}
          {komunikat && <p className={`mt-2 text-sm ${komunikat.ok ? "text-emerald-700" : "text-red-600"}`}>{komunikat.t}</p>}
        </div>

        {v49 && zapisane.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-900">Zapisane kosztorysy</p>
            <ul className="mt-3 divide-y divide-slate-100">
              {zapisane.map((z) => (
                <li key={z.id} className="flex items-center gap-2 py-2">
                  <Link href={`/app/kalkulatory/remont?id=${z.id}`} className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${z.id === id ? "font-semibold text-emerald-700" : "text-slate-800"}`}>{z.title}</span>
                    <span className="block text-xs text-slate-400">
                      {z.total_gross_pln != null ? zl(Number(z.total_gross_pln)) : "-"} · {new Date(z.updated_at).toLocaleDateString("pl-PL")}
                    </span>
                  </Link>
                  <PrzyciskUsun
                    tytul="Usuń kosztorys"
                    onClick={async () => {
                      if (!confirm(`Usunąć kosztorys „${z.title}”?`)) return;
                      const r = await usunKosztorys(z.id);
                      if (!r.ok) setKomunikat({ ok: false, t: r.error });
                      else if (z.id === id) router.push("/app/kalkulatory/remont");
                      else router.refresh();
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
        {!v49 && (
          <p className="px-1 text-xs text-slate-400">
            Zapisywanie kosztorysów włączy się po aktualizacji bazy (plik lib/SETUP-v49-rozbudowa.sql). PDF działa już teraz.
          </p>
        )}
      </aside>
    </div>
  );
}

function Wiersz({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{l}</dt>
      <dd className="font-medium text-slate-800">{v}</dd>
    </div>
  );
}

function Kafel({ aktywny, onClick, tytul, opis }: { aktywny: boolean; onClick: () => void; tytul: string; opis: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktywny}
      className={`rounded-xl border p-3 text-left transition ${aktywny ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/15" : "border-slate-200 hover:border-slate-300"}`}
    >
      <span className={`block text-sm font-semibold ${aktywny ? "text-emerald-800" : "text-slate-800"}`}>{tytul}</span>
      <span className="mt-0.5 block text-xs leading-snug text-slate-500">{opis}</span>
    </button>
  );
}

function PomieszczenieKarta({
  pom, k, suma, otwarte, onPrzelacz, onZmiana, onUsun,
}: {
  pom: Pomieszczenie;
  k: Kosztorys;
  suma: number;
  otwarte: boolean;
  onPrzelacz: () => void;
  onZmiana: (patch: Partial<Pomieszczenie>) => void;
  onUsun: () => void;
}) {
  const g = geometria(pom.metraz, k.wysokosc, pom.typ);
  const pozycje = pozycjeDla(pom.typ);
  const ile = pozycje.filter((p) => wlaczona(p, pom, k.zakres)).length;

  return (
    <div className={`rounded-xl border ${otwarte ? "border-emerald-300" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-center gap-2 p-3">
        <input
          aria-label="Nazwa pomieszczenia"
          value={pom.nazwa}
          onChange={(e) => onZmiana({ nazwa: e.target.value })}
          className={`${pole} min-w-0 flex-1 basis-40 py-2`}
          maxLength={60}
        />
        <div className="w-36">
          <Select
            aria-label="Rodzaj pomieszczenia"
            value={pom.typ}
            onChange={(e) => onZmiana({ typ: e.target.value as TypPomieszczenia, wybor: {}, ilosci: {} })}
            options={TYPY.map((t) => ({ value: t.v, label: t.l }))}
            placeholder=""
          />
        </div>
        <div className="flex w-24 items-center gap-1">
          <input
            aria-label="Metraż"
            inputMode="decimal"
            value={String(pom.metraz)}
            onChange={(e) => onZmiana({ metraz: Math.min(500, liczbaZ(e.target.value)), ilosci: {} })}
            className={`${pole} py-2 text-right`}
          />
          <span className="text-xs text-slate-400">m²</span>
        </div>
        <button type="button" onClick={onPrzelacz} className="ml-auto flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50" aria-expanded={otwarte}>
          <span className="font-semibold text-slate-800">{zl(suma)}</span>
          <span className="text-xs text-slate-400">{ile} poz.</span>
          <svg className={`h-4 w-4 text-slate-400 transition ${otwarte ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        <PrzyciskUsun onClick={onUsun} tytul={`Usuń: ${pom.nazwa}`} />
      </div>

      {otwarte && (
        <div className="border-t border-slate-100 px-3 pb-3 pt-2">
          <p className="mb-2 text-xs text-slate-400">
            Podłoga {zaokr(g.podloga)} m² · ściany ok. {Math.round(g.sciany)} m² · obwód ok. {Math.round(g.obwod)} mb
          </p>
          <ul className="space-y-1">
            {pozycje.map((p) => {
              const on = wlaczona(p, pom, k.zakres);
              const auto = zaokr(p.ilosc(g, pom.typ));
              const reczna = pom.ilosci[p.id];
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => onZmiana({ wybor: { ...pom.wybor, [p.id]: e.target.checked } })}
                    className="h-4 w-4 flex-shrink-0 accent-emerald-600"
                    aria-label={p.nazwa}
                  />
                  <span className={`min-w-0 flex-1 text-sm ${on ? "text-slate-800" : "text-slate-400"}`}>{p.nazwa}</span>
                  <input
                    aria-label={`Ilość: ${p.nazwa}`}
                    inputMode="decimal"
                    disabled={!on}
                    value={reczna != null ? String(reczna) : String(auto)}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      const n = { ...pom.ilosci };
                      if (v === "") delete n[p.id];
                      else n[p.id] = liczbaZ(v);
                      onZmiana({ ilosci: n });
                    }}
                    className={`${waskie} w-20 flex-shrink-0 py-1 text-right disabled:opacity-40 ${reczna != null ? "border-amber-300" : ""}`}
                  />
                  <span className="w-8 flex-shrink-0 text-xs text-slate-400">{p.jedn}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
