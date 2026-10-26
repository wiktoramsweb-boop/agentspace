"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PortalKlienta } from "@/lib/wiadomosci-klientow";
import { utworzDostepKlienta } from "../klienci/portal-actions";
import { qrPortalu } from "./actions";

const ileTemu = (iso: string | null) => {
  if (!iso) return null;
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return "przed chwilą";
  if (min < 60) return `${min} min temu`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} godz. temu`;
  const d = Math.round(h / 24);
  return d === 1 ? "wczoraj" : `${d} dni temu`;
};

const KOLORY = ["from-sky-400 to-blue-500", "from-emerald-400 to-teal-500", "from-violet-400 to-fuchsia-500", "from-amber-400 to-orange-500", "from-rose-400 to-pink-500"];
const kolor = (s: string) => KOLORY[[...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % KOLORY.length];

function Ikona({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}
const I = {
  otworz: "M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25",
  czat: "M8.625 9.75h6.75M8.625 13.5h4.5M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.29 48.29 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.39 48.39 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z",
  qr: "M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5ZM13.5 14.25h2.25v2.25H13.5v-2.25Zm4.5 0h2.25v2.25H18v-2.25Zm-4.5 4.5h2.25V21H13.5v-2.25Zm4.5 0h2.25V21H18v-2.25Z",
  osoba: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0A17.9 17.9 0 0 1 12 21.75c-2.7 0-5.26-.6-7.5-1.65Z",
  plus: "M12 4.5v15m7.5-7.5h-15",
  lupa: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",
};

/** Okno z kodem QR: agent pokazuje telefon klientowi przy umowie, klient skanuje i ma portal. */
function OknoQr({ accessId, klient, onZamknij }: { accessId: string; klient: string; onZamknij: () => void }) {
  const [dane, setDane] = useState<{ svg: string; link: string } | null | "blad">(null);
  const [skopiowany, setSkopiowany] = useState(false);
  useEffect(() => {
    qrPortalu(accessId).then((d) => setDane(d ?? "blad")).catch(() => setDane("blad"));
  }, [accessId]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onZamknij}>
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Portal klienta</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">{klient}</h2>
        <p className="mt-1 text-sm text-slate-500">Klient skanuje aparatem w telefonie i od razu ma swój portal.</p>
        <div className="mx-auto mt-5 aspect-square w-full max-w-[260px] rounded-2xl border border-slate-200 p-3">
          {dane === null ? (
            <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
          ) : dane === "blad" ? (
            <p className="pt-20 text-sm text-rose-600">Nie udało się wczytać kodu.</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: dane.svg }} />
          )}
        </div>
        {dane && dane !== "blad" && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(dane.link);
                setSkopiowany(true);
                setTimeout(() => setSkopiowany(false), 2000);
              }}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {skopiowany ? "Skopiowano ✓" : "Kopiuj link"}
            </button>
            <a
              href={`sms:?&body=${encodeURIComponent(`Twój podgląd sprawy: ${dane.link}`)}`}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Wyślij SMS
            </a>
          </div>
        )}
        <button type="button" onClick={onZamknij} className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
          Gotowe
        </button>
      </div>
    </div>
  );
}

export function PortaleLista({ portale, baza }: { portale: PortalKlienta[]; baza: string }) {
  const [szukaj, setSzukaj] = useState("");
  const [qr, setQr] = useState<{ id: string; klient: string } | null>(null);
  const widoczne = useMemo(() => {
    const t = szukaj.trim().toLowerCase();
    const cyfry = szukaj.replace(/\D/g, "");
    if (!t) return portale;
    return portale.filter((p) => p.klient.toLowerCase().includes(t) || (cyfry.length >= 3 && (p.telefon ?? "").replace(/\D/g, "").includes(cyfry)));
  }, [portale, szukaj]);

  if (!portale.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
        <p className="font-semibold text-slate-900">Żaden klient nie ma jeszcze portalu</p>
        <p className="mt-1 text-sm text-slate-500">Utwórz pierwszy powyżej i pokaż klientowi kod QR przy podpisaniu umowy.</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-4">
        <Ikona d={I.lupa} className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={szukaj}
          onChange={(e) => setSzukaj(e.target.value)}
          placeholder="Szukaj klienta po nazwisku albo telefonie…"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {widoczne.map((p) => {
          const kiedy = ileTemu(p.ostatnioWPortalu);
          return (
            <div key={p.accessId} className={`rounded-2xl border bg-white p-4 transition hover:shadow-md ${p.nieprzeczytane ? "border-sky-300" : "border-slate-200"}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-white ${kolor(p.klient)}`}>
                  {p.klient.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{p.klient}</p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${kiedy ? "bg-emerald-500" : "bg-slate-300"}`} />
                    {kiedy ? `W portalu ${kiedy}` : "Jeszcze nie wszedł"}
                    <span className="text-slate-300">·</span>
                    {p.rodzaj === "kupujacy" ? "szuka" : p.nieruchomosci === 1 ? "1 nieruchomość" : `${p.nieruchomosci} nieruchomości`}
                  </p>
                </div>
                {p.nieprzeczytane > 0 && (
                  <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs font-bold text-white">{p.nieprzeczytane} nowe</span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-1.5">
                <a href={`${baza}/klient/${p.token}`} target="_blank" rel="noopener noreferrer" className={przycisk(true)}>
                  <Ikona d={I.otworz} />
                  Otwórz
                </a>
                <Link href={`/app/wiadomosci?w=${p.accessId}`} className={przycisk(false, p.nieprzeczytane > 0)}>
                  <Ikona d={I.czat} />
                  Czat
                </Link>
                <button type="button" onClick={() => setQr({ id: p.accessId, klient: p.klient })} className={przycisk(false)}>
                  <Ikona d={I.qr} />
                  QR
                </button>
                <Link href={`/app/klienci/${p.clientId}?z=portal`} className={przycisk(false)}>
                  <Ikona d={I.osoba} />
                  Klient
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      {widoczne.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nikt nie pasuje do „{szukaj}”.</p>}

      {qr && <OknoQr accessId={qr.id} klient={qr.klient} onZamknij={() => setQr(null)} />}
    </>
  );
}

const przycisk = (glowny: boolean, wyroznij = false) =>
  `flex flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-semibold transition ${
    glowny ? "bg-slate-900 text-white hover:bg-slate-700" : wyroznij ? "bg-sky-100 text-sky-800 hover:bg-sky-200" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
  }`;

/** Nowy portal: wybór klienta z podpowiedziami i rodzaju, po utworzeniu od razu kod QR. */
export function NowyPortal({ klienci }: { klienci: { id: string; nazwa: string; telefon: string | null }[] }) {
  const router = useRouter();
  const [otwarte, setOtwarte] = useState(false);
  const [szukaj, setSzukaj] = useState("");
  const [wybrany, setWybrany] = useState<{ id: string; nazwa: string } | null>(null);
  const [rodzaj, setRodzaj] = useState<"sprzedajacy" | "kupujacy">("sprzedajacy");
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [qr, setQr] = useState<{ id: string; klient: string } | null>(null);

  const podpowiedzi = useMemo(() => {
    const t = szukaj.trim().toLowerCase();
    const cyfry = szukaj.replace(/\D/g, "");
    return (t ? klienci.filter((k) => k.nazwa.toLowerCase().includes(t) || (cyfry.length >= 3 && (k.telefon ?? "").replace(/\D/g, "").includes(cyfry))) : klienci).slice(0, 6);
  }, [klienci, szukaj]);

  function utworz() {
    if (!wybrany) return;
    setBlad(null);
    start(async () => {
      const w = await utworzDostepKlienta(wybrany.id, rodzaj);
      if (!w.ok) return setBlad(w.error);
      setQr({ id: w.id, klient: wybrany.nazwa });
      setWybrany(null);
      setSzukaj("");
      setOtwarte(false);
      router.refresh();
    });
  }

  return (
    <div className="mb-6">
      {!otwarte ? (
        <button
          type="button"
          onClick={() => setOtwarte(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-left text-white shadow-sm transition hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Ikona d={I.plus} className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">Udostępnij portal klientowi</span>
            <span className="block text-sm text-white/60">Wybierz klienta, a dostaniesz kod QR do pokazania na telefonie.</span>
          </span>
        </button>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-slate-900">Nowy portal</p>
            <button type="button" onClick={() => setOtwarte(false)} className="text-sm text-slate-500 hover:text-slate-900">
              Anuluj
            </button>
          </div>

          {wybrany ? (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
              <span className="font-semibold text-emerald-900">{wybrany.nazwa}</span>
              <button type="button" onClick={() => setWybrany(null)} className="text-sm text-emerald-700 hover:underline">
                Zmień
              </button>
            </div>
          ) : (
            <>
              <input
                autoFocus
                value={szukaj}
                onChange={(e) => setSzukaj(e.target.value)}
                placeholder="Wpisz nazwisko albo telefon klienta…"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
                {podpowiedzi.map((k) => (
                  <li key={k.id}>
                    <button type="button" onClick={() => setWybrany(k)} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50">
                      <span className="font-medium text-slate-900">{k.nazwa}</span>
                      <span className="text-xs text-slate-400">{k.telefon}</span>
                    </button>
                  </li>
                ))}
                {podpowiedzi.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">Brak klientów bez portalu o tej nazwie.</li>}
              </ul>
            </>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ["sprzedajacy", "Sprzedaje lub wynajmuje", "widzi swoją ofertę i prezentacje"],
                ["kupujacy", "Szuka nieruchomości", "dostaje dobrane oferty"],
              ] as const
            ).map(([v, t, o]) => (
              <button
                key={v}
                type="button"
                onClick={() => setRodzaj(v)}
                className={`rounded-xl border p-3 text-left transition ${rodzaj === v ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <span className="block text-sm font-semibold text-slate-900">{t}</span>
                <span className="block text-xs text-slate-500">{o}</span>
              </button>
            ))}
          </div>

          {blad && <p className="mt-2 text-sm text-rose-600">{blad}</p>}
          <button
            type="button"
            onClick={utworz}
            disabled={!wybrany || pending}
            className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {pending ? "Tworzę…" : "Utwórz portal i pokaż kod QR"}
          </button>
        </div>
      )}
      {qr && qr.id && <OknoQr accessId={qr.id} klient={qr.klient} onZamknij={() => setQr(null)} />}
    </div>
  );
}
