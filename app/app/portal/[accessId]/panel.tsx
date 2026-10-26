"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { przypiszNieruchomosc, udostepnijZdarzenie, wpisDlaKlienta, odpowiedzKlientowi } from "../../klienci/portal-actions";
import { PODPOWIEDZI } from "./podpowiedzi";

/**
 * Nowy wpis dla klienta z gotowych podpowiedzi. Sprzedający dostaje wpis na
 * osi czasu wybranej nieruchomości, kupujący wiadomość w czacie (nie ma osi czasu).
 */
export function NowyWpis({
  accessId,
  rodzaj,
  nieruchomosci,
}: {
  accessId: string;
  rodzaj: string;
  nieruchomosci: { id: string; title: string }[];
}) {
  const router = useRouter();
  const kupujacy = rodzaj === "kupujacy";
  const grupy = PODPOWIEDZI.filter((g) => g.dla === "oba" || g.dla === (kupujacy ? "kupujacy" : "sprzedajacy"));
  const [grupa, setGrupa] = useState(grupy[0]?.nazwa ?? "");
  const [tekst, setTekst] = useState("");
  const [nier, setNier] = useState(nieruchomosci[0]?.id ?? "");
  const [kiedy, setKiedy] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const limit = kupujacy ? 2000 : 300;
  const doUzupelnienia = /\[[^\]]+\]/.test(tekst);

  if (!kupujacy && nieruchomosci.length === 0) {
    return <p className="text-sm text-slate-500">Dodaj klientowi nieruchomość do portalu (niżej), a będziesz mógł dodawać wpisy na jej osi czasu.</p>;
  }

  function wyslij() {
    setBlad(null);
    setInfo(null);
    start(async () => {
      const w = kupujacy ? await odpowiedzKlientowi(accessId, tekst) : await wpisDlaKlienta(nier, tekst, kiedy ? new Date(kiedy).toISOString() : null);
      if (w.ok) {
        setTekst("");
        setKiedy("");
        setInfo(kupujacy ? "Wysłane. Klient dostanie powiadomienie." : "Dodane. Klient widzi to w portalu i dostanie powiadomienie.");
        router.refresh();
      } else setBlad(w.error);
    });
  }

  const aktywna = grupy.find((g) => g.nazwa === grupa) ?? grupy[0];

  return (
    <div>
      <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {grupy.map((g) => (
          <button
            key={g.nazwa}
            type="button"
            onClick={() => setGrupa(g.nazwa)}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              g.nazwa === aktywna?.nazwa ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <span aria-hidden="true">{g.ikona}</span>
            {g.nazwa}
          </button>
        ))}
      </div>

      <div className="mb-3 grid gap-1.5">
        {aktywna?.wpisy.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setTekst(w.slice(0, limit))}
            className={`rounded-xl border px-3 py-2 text-left text-[13px] leading-snug transition ${
              tekst === w ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40"
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      <textarea
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        rows={3}
        maxLength={limit}
        placeholder={kupujacy ? "Napisz do klienta albo wybierz podpowiedź wyżej…" : "Co przekazać klientowi? Wybierz podpowiedź wyżej albo napisz własnymi słowami."}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
      />
      {doUzupelnienia && <p className="mt-1 text-xs font-medium text-amber-700">Uzupełnij miejsca w [nawiasach] przed wysłaniem.</p>}

      {!kupujacy && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {nieruchomosci.length > 1 && (
            <select value={nier} onChange={(e) => setNier(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
              {nieruchomosci.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Kiedy
            <input type="datetime-local" value={kiedy} onChange={(e) => setKiedy(e.target.value)} className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
          </label>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending || tekst.trim().length < 2 || doUzupelnienia}
          onClick={wyslij}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Wysyłam…" : kupujacy ? "Wyślij klientowi" : "Pokaż klientowi"}
        </button>
        <span className="text-xs text-slate-400">
          {tekst.length}/{limit}
        </span>
        {info && <span className="text-sm text-emerald-700">{info}</span>}
        {blad && <span className="text-sm text-rose-600">{blad}</span>}
      </div>
    </div>
  );
}

/** Ukrycie wpisu z portalu: zostaje w działaniach biura, znika u klienta. */
export function UkryjWpis({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Ukryć ten wpis przed klientem? W działaniach biura zostanie.")) return;
        start(async () => {
          await udostepnijZdarzenie(id, false, "");
          router.refresh();
        });
      }}
      className="flex-shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
    >
      {pending ? "…" : "Ukryj"}
    </button>
  );
}

export function PrzypnijNieruchomosc({ accessId, propertyId, przypnij, etykieta }: { accessId: string; propertyId: string; przypnij: boolean; etykieta: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await przypiszNieruchomosc(accessId, propertyId, przypnij);
          router.refresh();
        })
      }
      className={
        przypnij
          ? "rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
          : "rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-rose-600"
      }
    >
      {pending ? "…" : etykieta}
    </button>
  );
}
