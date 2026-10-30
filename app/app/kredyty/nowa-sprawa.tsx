"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { nowaSprawaDoradcy } from "./actions";
import { RODZAJE_KREDYTU } from "@/lib/kredyt-etapy";
import { Select } from "@/app/app/components/select";
import { Modal } from "@/app/app/components/modal";

const POLE = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";
const ETYKIETA = "mb-1 block text-sm font-medium text-slate-700";

/** Nowa sprawa: klient własny doradcy albo polecony przez agenta biura. */
export function NowaSprawa({ doradcy, agenci, jestemDoradca }: { doradcy: { id: string; name: string }[]; agenci: { id: string; name: string }[]; jestemDoradca: boolean }) {
  const router = useRouter();
  const [otwarte, setOtwarte] = useState(false);
  const [f, setF] = useState({ imie: "", telefon: "", email: "", rodzaj: "hipoteczny", kwota: "", notatka: "", advisorId: doradcy[0]?.id ?? "", polecilId: "" });
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ustaw = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  if (!jestemDoradca && doradcy.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => setOtwarte(true)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
        + Nowa sprawa kredytowa
      </button>
      {!jestemDoradca && <span className="text-sm text-slate-500">Klienta biura przekażesz najszybciej z jego karty.</span>}

      {otwarte && (
        <Modal title="Nowa sprawa kredytowa" onClose={() => setOtwarte(false)} maxWidth="max-w-2xl">
          <div className="space-y-5 overflow-y-auto px-6 py-5">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Klient</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="sm:col-span-3">
                  <span className={ETYKIETA}>Imię i nazwisko *</span>
                  <input value={f.imie} onChange={ustaw("imie")} autoFocus className={POLE} />
                </label>
                <label className="sm:col-span-1">
                  <span className={ETYKIETA}>Telefon</span>
                  <input value={f.telefon} onChange={ustaw("telefon")} inputMode="tel" className={POLE} />
                </label>
                <label className="sm:col-span-2">
                  <span className={ETYKIETA}>E-mail</span>
                  <input value={f.email} onChange={ustaw("email")} inputMode="email" className={POLE} />
                </label>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Kredyt</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RODZAJE_KREDYTU.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={f.rodzaj === r.id}
                    onClick={() => setF((x) => ({ ...x, rodzaj: r.id }))}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${f.rodzaj === r.id ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    {r.nazwa}
                  </button>
                ))}
              </div>
              <label className="mt-3 block">
                <span className={ETYKIETA}>Kwota kredytu (zł)</span>
                <input value={f.kwota} onChange={ustaw("kwota")} inputMode="numeric" placeholder="np. 520000" className={POLE} />
              </label>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Skąd jest klient</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className={ETYKIETA}>Polecił agent</span>
                  <Select aria-label="Polecił agent" value={f.polecilId} onChange={ustaw("polecilId")} options={agenci.map((a) => ({ value: a.id, label: a.name }))} placeholder="Klient własny, bez polecenia" />
                </div>
                {!jestemDoradca && (
                  <div>
                    <span className={ETYKIETA}>Doradca</span>
                    <Select aria-label="Doradca" value={f.advisorId} onChange={ustaw("advisorId")} options={doradcy.map((d) => ({ value: d.id, label: d.name }))} placeholder="" />
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Agent, który polecił, zobaczy postęp kredytu i dostanie powiadomienia.</p>
            </section>

            <label className="block">
              <span className={ETYKIETA}>Notatka</span>
              <textarea value={f.notatka} onChange={ustaw("notatka")} rows={2} placeholder="np. szuka 3 pokoi, wkład 20%, umowa o pracę" className={POLE} />
            </label>

            {blad && <p className="text-sm text-rose-600">{blad}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOtwarte(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Anuluj
              </button>
              <button
                type="button"
                disabled={pending || f.imie.trim().length < 2}
                onClick={() =>
                  start(async () => {
                    setBlad(null);
                    const w = await nowaSprawaDoradcy(f);
                    if (!w.ok) return setBlad(w.error);
                    router.push(`/app/kredyty/${w.id}`);
                  })
                }
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {pending ? "Zapisuję…" : "Załóż sprawę"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
