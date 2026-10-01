"use client";

import { useState, useTransition } from "react";
import {
  MODULY,
  ROLE,
  ZAKRESY,
  maModul,
  opisRoli,
  zakresDanych,
  type Modul,
  type Uprawnienia,
  type UserRole,
  type Zakres,
} from "@/lib/role";
import { Select } from "@/app/app/components/select";
import { setMemberPermissions, setMemberRole } from "./actions";

/**
 * Rola i dostępy jednej osoby.
 *
 * Rola ustawia zestaw domyślny, a przełączniki niżej pokazują stan faktyczny.
 * Moduł odstający od roli dostaje etykietę, żeby po pół roku było widać, co
 * ktoś zmienił ręcznie, a co wynika ze stanowiska.
 */
export function UprawnieniaOsoby({
  memberId,
  imie,
  rola,
  uprawnienia,
  czyCeo,
}: {
  memberId: string;
  imie: string;
  rola: UserRole;
  uprawnienia: Uprawnienia | null;
  czyCeo: boolean;
}) {
  const [r, setR] = useState<UserRole>(rola);
  const [u, setU] = useState<Uprawnienia>(uprawnienia ?? {});
  const [blad, setBlad] = useState<string | null>(null);
  const [zapisane, setZapisane] = useState(false);
  const [pracuje, start] = useTransition();

  const osoba = { id: memberId, role: r, permissions: u };
  const domyslne = opisRoli(r);

  function zmienRole(nowa: UserRole) {
    setR(nowa);
    // Odstępstwa liczą się względem roli, więc przy zmianie stanowiska
    // zaczynamy od czystego zestawu, zamiast przenosić stare wyjątki.
    setU({});
    setZapisane(false);
    start(async () => {
      const res = await setMemberRole(memberId, nowa);
      if (res?.error) {
        setBlad(res.error);
        setR(rola);
      } else {
        setBlad(null);
      }
    });
  }

  function przelacz(m: Modul, wlaczony: boolean) {
    setU((stare) => ({ ...stare, moduly: { ...stare.moduly, [m]: wlaczony } }));
    setZapisane(false);
  }

  function zmienZakres(z: Zakres) {
    setU((stare) => ({ ...stare, zakres: z }));
    setZapisane(false);
  }

  function zapisz() {
    setBlad(null);
    start(async () => {
      const res = await setMemberPermissions(memberId, u);
      if (res?.error) setBlad(res.error);
      else setZapisane(true);
    });
  }

  if (czyCeo) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Dostęp</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {imie} jest CEO i ma pełny dostęp do wszystkiego, łącznie z ustawieniami i abonamentem.
          Tego nie da się ograniczyć, żeby biuro nie zostało bez nikogo, kto to odkręci.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Rola i dostęp</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Stanowisko ustawia dostępy domyślne. Niżej możesz je zmienić dla tej jednej osoby.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">Stanowisko</label>
          <Select value={r} onChange={(e) => zmienRole(e.target.value as UserRole)} disabled={pracuje}>
            {ROLE.filter((x) => x.id !== "owner").map((x) => (
              <option key={x.id} value={x.id}>
                {x.nazwa}
              </option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{domyslne.opis}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">
            Które dane widzi
          </label>
          <Select
            value={zakresDanych(osoba)}
            onChange={(e) => zmienZakres(e.target.value as Zakres)}
            disabled={pracuje}
          >
            {ZAKRESY.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nazwa}
              </option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {ZAKRESY.find((z) => z.id === zakresDanych(osoba))?.opis}
          </p>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-slate-200 dark:divide-slate-700">
        {MODULY.map((m) => {
          const wlaczony = maModul(osoba, m.id);
          const zRoli = domyslne.moduly.includes(m.id);
          return (
            <li key={m.id} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{m.nazwa}</span>
                  {wlaczony !== zRoli && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                      {wlaczony ? "dodane ręcznie" : "odebrane ręcznie"}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{m.opis}</p>
              </div>
              <label className="mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={wlaczony}
                  onChange={(e) => przelacz(m.id, e.target.checked)}
                  disabled={pracuje}
                  className="peer sr-only"
                />
                <span className="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-checked:[&>span]:translate-x-5 peer-disabled:opacity-50 dark:bg-slate-600">
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition" />
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={zapisz}
          disabled={pracuje}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
        >
          {pracuje ? "Zapisuję..." : "Zapisz dostęp"}
        </button>
        {zapisane && <span className="text-sm text-emerald-600">Zapisano.</span>}
        {blad && <span className="text-sm text-red-600">{blad}</span>}
      </div>
    </div>
  );
}
