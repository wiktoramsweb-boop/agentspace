"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  dodajDzialaniePortalu,
  odpowiedzKlientowi,
  przypiszNieruchomosc,
  statusDzialaniaPortalu,
  udostepnijZdarzenie,
  type RodzajDzialaniaPortalu,
} from "../../klienci/portal-actions";
import { WyborTerminu } from "../../components/wybor-terminu";
import type { DzialaniePortalu } from "@/lib/wiadomosci-klientow";
import { PODPOWIEDZI } from "./podpowiedzi";

const RODZAJE: { v: RodzajDzialaniaPortalu; t: string; ikona: string; widoczneDomyslnie: boolean }[] = [
  { v: "prezentacja", t: "Prezentacja", ikona: "🔑", widoczneDomyslnie: true },
  { v: "telefon", t: "Telefon", ikona: "📞", widoczneDomyslnie: false },
  { v: "spotkanie", t: "Spotkanie", ikona: "🤝", widoczneDomyslnie: true },
  { v: "zadanie", t: "Zadanie", ikona: "✅", widoczneDomyslnie: false },
  { v: "informacja", t: "Informacja", ikona: "📣", widoczneDomyslnie: true },
];

const terazPL = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Warsaw" }));
  const pelna = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + (d.getMinutes() > 30 ? 1 : 0), d.getMinutes() > 0 && d.getMinutes() <= 30 ? 30 : 0);
  const k = `${pelna.getFullYear()}-${String(pelna.getMonth() + 1).padStart(2, "0")}-${String(pelna.getDate()).padStart(2, "0")}`;
  return { data: k, godzina: `${String(pelna.getHours()).padStart(2, "0")}:${String(pelna.getMinutes()).padStart(2, "0")}` };
};

/**
 * Nowe działanie w sprawie klienta: prawdziwe działanie biura z typem,
 * statusem i terminem. Opis dla klienta (z podpowiedzi albo własny) decyduje,
 * co klient zobaczy w portalu; bez opisu działanie zostaje tylko w biurze.
 */
export function NoweDzialanie({ accessId, rodzajDostepu, nieruchomosci }: { accessId: string; rodzajDostepu: string; nieruchomosci: { id: string; title: string }[] }) {
  const router = useRouter();
  const kupujacy = rodzajDostepu === "kupujacy";
  const start0 = terazPL();
  const [rodzaj, setRodzaj] = useState<RodzajDzialaniaPortalu>("prezentacja");
  const [status, setStatus] = useState<"zaplanowane" | "wykonane">("zaplanowane");
  const [termin, setTermin] = useState(start0);
  const [temat, setTemat] = useState("");
  const [opis, setOpis] = useState("");
  const [widoczne, setWidoczne] = useState(!kupujacy);
  const [nier, setNier] = useState(nieruchomosci[0]?.id ?? "");
  const grupy = PODPOWIEDZI.filter((g) => g.dla === "oba" || g.dla === (kupujacy ? "kupujacy" : "sprzedajacy"));
  const [grupa, setGrupa] = useState(grupy[0]?.nazwa ?? "");
  const [info, setInfo] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const doUzupelnienia = /\[[^\]]+\]/.test(opis);
  const aktywna = grupy.find((g) => g.nazwa === grupa) ?? grupy[0];

  function zapisz() {
    setBlad(null);
    setInfo(null);
    start(async () => {
      const w = await dodajDzialaniePortalu(accessId, {
        propertyId: kupujacy ? null : nier || null,
        rodzaj,
        status,
        data: termin.data,
        godzina: termin.godzina,
        temat,
        opisDlaKlienta: opis,
        widoczne: !kupujacy && widoczne,
      });
      if (!w.ok) return setBlad(w.error);
      // Kupujący nie ma osi czasu: opis idzie do niego wiadomością.
      if (kupujacy && widoczne && opis.trim().length >= 2) await odpowiedzKlientowi(accessId, opis);
      setTemat("");
      setOpis("");
      setInfo(widoczne && opis.trim() ? "Zapisane. Klient to widzi i dostanie powiadomienie." : "Zapisane w działaniach biura.");
      router.refresh();
    });
  }

  const sekcja = "text-xs font-semibold uppercase tracking-wider text-slate-400";

  return (
    <div className="space-y-4">
      <div>
        <p className={`${sekcja} mb-1.5`}>Co</p>
        <div className="flex flex-wrap gap-1.5">
          {RODZAJE.map((r) => (
            <button
              key={r.v}
              type="button"
              onClick={() => {
                setRodzaj(r.v);
                if (!kupujacy) setWidoczne(r.widoczneDomyslnie);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                rodzaj === r.v ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <span aria-hidden="true">{r.ikona}</span>
              {r.t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div>
          <p className={`${sekcja} mb-1.5`}>Status</p>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(
              [
                ["zaplanowane", "Zaplanowane"],
                ["wykonane", "Odbyło się"],
              ] as const
            ).map(([v, t]) => (
              <button
                key={v}
                type="button"
                onClick={() => setStatus(v)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${status === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {!kupujacy && nieruchomosci.length > 1 && (
          <div>
            <p className={`${sekcja} mb-1.5`}>Nieruchomość</p>
            <select value={nier} onChange={(e) => setNier(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
              {nieruchomosci.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <p className={`${sekcja} mb-1.5`}>Kiedy</p>
        <WyborTerminu data={termin.data} godzina={termin.godzina} onChange={(data, godzina) => setTermin({ data, godzina })} />
      </div>

      <div>
        <p className={`${sekcja} mb-1.5`}>Notatka dla biura (klient jej nie widzi)</p>
        <input
          value={temat}
          onChange={(e) => setTemat(e.target.value)}
          maxLength={200}
          placeholder={`Np. ${rodzaj === "prezentacja" ? "Prezentacja dla p. Nowaków, 2 osoby" : rodzaj === "telefon" ? "Omówić propozycję kupującego" : "Krótko, czego dotyczy"}`}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className={`rounded-2xl border p-3 transition ${widoczne ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
          <input type="checkbox" checked={widoczne} onChange={(e) => setWidoczne(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
          {kupujacy ? "Wyślij klientowi wiadomość" : "Pokaż klientowi w portalu"}
        </label>
        {widoczne && (
          <div className="mt-3">
            <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {grupy.map((g) => (
                <button
                  key={g.nazwa}
                  type="button"
                  onClick={() => setGrupa(g.nazwa)}
                  className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    g.nazwa === aktywna?.nazwa ? "border-emerald-500 bg-white text-emerald-800" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <span aria-hidden="true">{g.ikona}</span>
                  {g.nazwa}
                </button>
              ))}
            </div>
            <div className="mb-2 grid gap-1">
              {aktywna?.wpisy.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setOpis(w)}
                  className={`rounded-lg border px-3 py-1.5 text-left text-[13px] leading-snug transition ${opis === w ? "border-emerald-500 bg-white text-emerald-900" : "border-transparent bg-white/70 text-slate-700 hover:border-emerald-300"}`}
                >
                  {w}
                </button>
              ))}
            </div>
            <textarea
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              rows={2}
              maxLength={kupujacy ? 2000 : 300}
              placeholder="To przeczyta klient. Wybierz podpowiedź albo napisz własnymi słowami."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
            {doUzupelnienia && <p className="mt-1 text-xs font-medium text-amber-700">Uzupełnij miejsca w [nawiasach] przed zapisaniem.</p>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={zapisz}
          disabled={pending || (widoczne && (doUzupelnienia || opis.trim().length < 2)) || (!widoczne && !temat.trim())}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Zapisuję…" : "Dodaj działanie"}
        </button>
        {!widoczne && !temat.trim() && <span className="text-xs text-slate-400">Wpisz notatkę dla biura albo pokaż działanie klientowi.</span>}
        {info && <span className="text-sm text-emerald-700">{info}</span>}
        {blad && <span className="text-sm text-rose-600">{blad}</span>}
      </div>
    </div>
  );
}

const IKONY: Record<string, string> = { spotkanie: "🔑", polaczenie: "📞", zadanie: "✅", wydarzenie: "📣" };
const kiedyKrotko = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(new Date(iso)) : "bez terminu";

/** Działania w sprawie: najpierw zaplanowane, potem historia. Status i widoczność zmieniasz w miejscu. */
export function ListaDzialan({ accessId, dzialania, zWidocznoscia }: { accessId: string; dzialania: DzialaniePortalu[]; zWidocznoscia: boolean }) {
  const zaplanowane = dzialania.filter((d) => d.status === "zaplanowane").sort((a, b) => (a.kiedy ?? "").localeCompare(b.kiedy ?? ""));
  const reszta = dzialania.filter((d) => d.status !== "zaplanowane");
  if (!dzialania.length) return <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">Brak działań. Dodaj pierwsze powyżej.</p>;
  return (
    <div className="space-y-4">
      {zaplanowane.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">Zaplanowane ({zaplanowane.length})</p>
          <ul className="space-y-1.5">
            {zaplanowane.map((d) => (
              <Wiersz key={d.id} accessId={accessId} d={d} zWidocznoscia={zWidocznoscia} />
            ))}
          </ul>
        </div>
      )}
      {reszta.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Historia ({reszta.length})</p>
          <ul className="space-y-1.5">
            {reszta.map((d) => (
              <Wiersz key={d.id} accessId={accessId} d={d} zWidocznoscia={zWidocznoscia} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Wiersz({ accessId, d, zWidocznoscia }: { accessId: string; d: DzialaniePortalu; zWidocznoscia: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [edycja, setEdycja] = useState(false);
  const [opis, setOpis] = useState(d.opisDlaKlienta ?? "");
  const zmien = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <li className={`rounded-xl border px-3 py-2.5 ${d.status === "anulowane" ? "border-slate-100 opacity-60" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span aria-hidden="true" className="text-base">
          {IKONY[d.kind] ?? "•"}
        </span>
        <Link href={`/app/dzialania/${d.id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 hover:text-emerald-700">
          {d.temat}
        </Link>
        <span className="text-xs tabular-nums text-slate-500">{kiedyKrotko(d.kiedy)}</span>
        {zWidocznoscia && (
          <button
            type="button"
            onClick={() => setEdycja((v) => !v)}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${d.widoczne ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
            title="Kliknij, żeby zmienić, co widzi klient"
          >
            {d.widoczne ? "Klient widzi" : "Tylko biuro"}
          </button>
        )}
        {d.status === "zaplanowane" ? (
          <button type="button" disabled={pending} onClick={() => zmien(() => statusDzialaniaPortalu(accessId, d.id, "wykonane"))} className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200 disabled:opacity-50">
            ✓ Odbyło się
          </button>
        ) : d.status === "wykonane" ? (
          <span className="text-xs text-slate-400">wykonane</span>
        ) : (
          <span className="text-xs text-slate-400">anulowane</span>
        )}
      </div>
      {d.widoczne && d.opisDlaKlienta && !edycja && <p className="mt-1 pl-7 text-xs text-slate-500">Klient czyta: „{d.opisDlaKlienta}”</p>}
      {zWidocznoscia && edycja && (
        <div className="mt-2 rounded-lg bg-slate-50 p-2.5 pl-7">
          <input
            value={opis}
            onChange={(e) => setOpis(e.target.value)}
            maxLength={300}
            placeholder="Co ma przeczytać klient, np. Prezentacja dla zainteresowanej rodziny"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={pending || opis.trim().length < 2}
              onClick={() =>
                zmien(async () => {
                  await udostepnijZdarzenie(d.id, true, opis);
                  setEdycja(false);
                })
              }
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Pokaż klientowi
            </button>
            {d.widoczne && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  zmien(async () => {
                    await udostepnijZdarzenie(d.id, false, "");
                    setEdycja(false);
                  })
                }
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Ukryj przed klientem
              </button>
            )}
          </div>
        </div>
      )}
    </li>
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
