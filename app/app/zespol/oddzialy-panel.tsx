"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { przypiszDoOddzialu, usunOddzial, zapiszOddzial } from "./oddzialy-actions";
import { formatPln } from "@/lib/format";
import { Select } from "@/app/app/components/select";

export type OddzialWidok = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  manager_id: string | null;
};
export type WynikOddzialuWiersz = { id: string | null; nazwa: string; ludzie: number; telefony: number; oferty: number; klienci: number; prowizje: number };
export type OsobaOddzialu = { id: string; name: string; rola: string; branch_id: string | null };

const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

/**
 * Zakładka „Oddziały” w Zespole: porównanie oddziałów, ich dane i kto do
 * którego należy. Wszystko na jednym ekranie, bo CEO ustawia to raz,
 * a potem tylko patrzy na tabelę.
 */
export function OddzialyPanel({
  oddzialy,
  wyniki,
  osoby,
  kierownicy,
}: {
  oddzialy: OddzialWidok[];
  wyniki: WynikOddzialuWiersz[];
  osoby: OsobaOddzialu[];
  kierownicy: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [blad, setBlad] = useState<string | null>(null);
  const [edycja, setEdycja] = useState<string | "nowy" | null>(oddzialy.length ? null : "nowy");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, po?: () => void) =>
    start(async () => {
      setBlad(null);
      const w = await fn();
      if (!w.ok) return setBlad(w.error ?? "Nie udało się zapisać.");
      po?.();
      router.refresh();
    });

  const formularz = (o?: OddzialWidok) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        run(() => zapiszOddzial(fd), () => setEdycja(null));
      }}
      className="grid gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:grid-cols-2"
    >
      {o && <input type="hidden" name="id" value={o.id} />}
      <input name="name" defaultValue={o?.name ?? ""} placeholder="Nazwa, np. Kraków Ruczaj" className={pole} required />
      <input name="city" defaultValue={o?.city ?? ""} placeholder="Miasto" className={pole} />
      <input name="address" defaultValue={o?.address ?? ""} placeholder="Adres oddziału" className={pole} />
      <input name="phone" defaultValue={o?.phone ?? ""} placeholder="Telefon oddziału" className={pole} />
      <Select name="manager_id" defaultValue={o?.manager_id ?? ""} className="sm:col-span-2">
        <option value="">Kierownik oddziału: nie wybrano</option>
        {kierownicy.map((k) => (
          <option key={k.id} value={k.id}>
            Kierownik: {k.name}
          </option>
        ))}
      </Select>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
          {pending ? "Zapisuję…" : o ? "Zapisz oddział" : "Dodaj oddział"}
        </button>
        {(o || oddzialy.length > 0) && (
          <button type="button" onClick={() => setEdycja(null)} className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">
            Anuluj
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="space-y-8">
      {blad && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">{blad}</p>}

      {wyniki.length > 1 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Porównanie oddziałów</h2>
          <p className="mb-3 text-sm text-slate-500">Telefony z ostatnich 7 dni, prowizje biura z bieżącego miesiąca.</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Oddział</th>
                  <th className="px-3 py-3 text-right font-medium">Ludzie</th>
                  <th className="px-3 py-3 text-right font-medium">Telefony</th>
                  <th className="px-3 py-3 text-right font-medium">Oferty</th>
                  <th className="px-3 py-3 text-right font-medium">Klienci</th>
                  <th className="px-4 py-3 text-right font-medium">Prowizje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wyniki.map((w) => (
                  <tr key={w.id ?? "brak"} className={w.id ? "" : "text-slate-500"}>
                    <td className="px-4 py-3 font-medium text-slate-900">{w.nazwa}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{w.ludzie}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{w.telefony}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{w.oferty}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{w.klienci}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{formatPln(w.prowizje)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Oddziały</h2>
            <p className="text-sm text-slate-500">Kierownik oddziału widzi ludzi swojego oddziału i dostaje w poniedziałek ich podsumowanie.</p>
          </div>
          {edycja !== "nowy" && (
            <button type="button" onClick={() => setEdycja("nowy")} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              + Nowy oddział
            </button>
          )}
        </div>
        <div className="space-y-3">
          {edycja === "nowy" && formularz()}
          {oddzialy.map((o) =>
            edycja === o.id ? (
              <div key={o.id}>{formularz(o)}</div>
            ) : (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{o.name}</p>
                  <p className="text-sm text-slate-500">
                    {[o.city, o.address, o.phone].filter(Boolean).join(" · ") || "bez adresu"}
                    {" · "}
                    {kierownicy.find((k) => k.id === o.manager_id)?.name ? `kieruje ${kierownicy.find((k) => k.id === o.manager_id)!.name}` : "bez kierownika"}
                    {" · "}
                    {osoby.filter((p) => p.branch_id === o.id).length} os.
                  </p>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setEdycja(o.id)} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
                    Edytuj
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Usunąć oddział ${o.name}? Ludzie i leady zostaną w biurze, bez przypisania do oddziału.`)) run(() => usunOddzial(o.id));
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      {oddzialy.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Kto w którym oddziale</h2>
          <p className="mb-3 text-sm text-slate-500">Zmiana zapisuje się od razu.</p>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {osoby.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span className="min-w-0 text-sm">
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <span className="text-slate-400"> · {p.rola}</span>
                </span>
                <Select
                  aria-label={`Oddział: ${p.name}`}
                  value={p.branch_id ?? ""}
                  disabled={pending}
                  onChange={(e) => run(() => przypiszDoOddzialu(p.id, e.target.value || null))}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800"
                >
                  <option value="">bez oddziału</option>
                  {oddzialy.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
