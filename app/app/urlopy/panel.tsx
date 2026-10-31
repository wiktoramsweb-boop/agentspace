"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "../components/modal";
import { Select } from "../components/select";
import { useToast } from "../components/toast";
import { pole } from "../dokumenty-wzory/klocki";
import { RODZAJE_NIEOBECNOSCI, type Nieobecnosc } from "@/lib/zastepstwa-model";
import { dodajNieobecnosc, usunNieobecnosc } from "./actions";
import { PoleDaty } from "@/app/app/components/pole-daty";

type Osoba = { id: string; name: string };
type Wiersz = Nieobecnosc & { created_by: string | null };

const PASEK: Record<string, string> = {
  urlop: "bg-sky-400",
  l4: "bg-rose-400",
  szkolenie: "bg-violet-400",
  delegacja: "bg-amber-400",
  inne: "bg-slate-400",
};

const DNI_OSI = 42;

function dodajDni(klucz: string, n: number): string {
  const [r, m, d] = klucz.split("-").map(Number);
  return new Date(Date.UTC(r, m - 1, d + n)).toISOString().slice(0, 10);
}
function poniedzialek(klucz: string): string {
  const [r, m, d] = klucz.split("-").map(Number);
  const dzien = new Date(Date.UTC(r, m - 1, d)).getUTCDay();
  return dodajDni(klucz, -((dzien + 6) % 7));
}
function roznicaDni(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
function krotko(klucz: string): string {
  const [, m, d] = klucz.split("-").map(Number);
  return `${d}.${String(m).padStart(2, "0")}`;
}

export function PanelUrlopow({
  dzis,
  nieobecnosci,
  ludzie,
  ja,
  zarzadza,
}: {
  dzis: string;
  nieobecnosci: Wiersz[];
  ludzie: Osoba[];
  ja: string;
  zarzadza: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [otwarte, setOtwarte] = useState(false);
  const [pending, startTransition] = useTransition();
  const imie = useMemo(() => new Map(ludzie.map((l) => [l.id, l.name])), [ludzie]);

  const teraz = nieobecnosci.filter((n) => n.starts_on <= dzis && n.ends_on >= dzis);
  const plan = nieobecnosci.filter((n) => n.starts_on > dzis);
  const minione = nieobecnosci.filter((n) => n.ends_on < dzis).reverse();

  const start = poniedzialek(dzis);
  const koniec = dodajDni(start, DNI_OSI - 1);
  const wOsi = nieobecnosci.filter((n) => n.ends_on >= start && n.starts_on <= koniec);
  const wiersze = ludzie.filter((l) => wOsi.some((n) => n.agent_id === l.id));

  function usun(n: Wiersz) {
    if (!confirm("Usunąć tę nieobecność?")) return;
    startTransition(async () => {
      const w = await usunNieobecnosc(n.id);
      if (w.ok) router.refresh();
      else toast(w.error, "error");
    });
  }

  const mozeUsunac = (n: Wiersz) => zarzadza || n.agent_id === ja || n.created_by === ja;
  const etykieta = (k: string) => RODZAJE_NIEOBECNOSCI.find((r) => r.value === k)?.label ?? k;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {teraz.length === 0 ? "Dziś wszyscy są w pracy." : `Dziś nieobecnych: ${teraz.length}.`}
        </p>
        <button
          type="button"
          onClick={() => setOtwarte(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          <span aria-hidden="true" className="text-base leading-none">+</span>
          Zgłoś nieobecność
        </button>
      </div>

      {teraz.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teraz.map((n) => (
            <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{imie.get(n.agent_id) ?? "Osoba"}</p>
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${RODZAJE_NIEOBECNOSCI.find((r) => r.value === n.kind)?.kolor}`}>
                  {etykieta(n.kind)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Do {krotko(n.ends_on)} włącznie</p>
              <p className="mt-3 text-sm text-slate-700">
                {n.substitute_id ? (
                  <>Zastępuje: <span className="font-semibold">{imie.get(n.substitute_id) ?? "osoba spoza listy"}</span></>
                ) : (
                  <span className="text-amber-700">Bez zastępcy: sprawy czekają na powrót</span>
                )}
              </p>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Kalendarz zespołu</h2>
        <p className="mb-4 text-sm text-slate-500">Sześć tygodni od tego poniedziałku. Pionowa linia to dziś.</p>
        {wiersze.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            W tym okresie nikt nie ma zaplanowanej nieobecności.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <div className="min-w-[760px] p-4">
              <div className="mb-2 grid grid-cols-[140px_1fr] items-end">
                <span />
                <div className="relative h-5">
                  {Array.from({ length: DNI_OSI / 7 }).map((_, t) => (
                    <span
                      key={t}
                      className="absolute top-0 text-[11px] text-slate-400"
                      style={{ left: `${((t * 7) / DNI_OSI) * 100}%` }}
                    >
                      {krotko(dodajDni(start, t * 7))}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {wiersze.map((l) => (
                  <div key={l.id} className="grid grid-cols-[140px_1fr] items-center">
                    <span className="truncate pr-3 text-sm text-slate-700">{l.name}</span>
                    <div className="relative h-8 rounded-lg bg-slate-50">
                      {Array.from({ length: DNI_OSI / 7 - 1 }).map((_, t) => (
                        <span key={t} className="absolute inset-y-0 w-px bg-slate-200" style={{ left: `${(((t + 1) * 7) / DNI_OSI) * 100}%` }} />
                      ))}
                      {wOsi
                        .filter((n) => n.agent_id === l.id)
                        .map((n) => {
                          const od = Math.max(0, roznicaDni(start, n.starts_on));
                          const doD = Math.min(DNI_OSI - 1, roznicaDni(start, n.ends_on));
                          return (
                            <span
                              key={n.id}
                              title={`${etykieta(n.kind)} ${krotko(n.starts_on)} – ${krotko(n.ends_on)}${n.substitute_id ? `, zastępuje ${imie.get(n.substitute_id) ?? ""}` : ""}`}
                              className={`absolute top-1.5 h-5 rounded-md ${PASEK[n.kind] ?? PASEK.inne} shadow-sm`}
                              style={{ left: `${(od / DNI_OSI) * 100}%`, width: `${((doD - od + 1) / DNI_OSI) * 100}%` }}
                            />
                          );
                        })}
                      <span
                        className="absolute inset-y-0 w-0.5 bg-emerald-500"
                        style={{ left: `${((roznicaDni(start, dzis) + 0.5) / DNI_OSI) * 100}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                {RODZAJE_NIEOBECNOSCI.map((r) => (
                  <span key={r.value} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded ${PASEK[r.value]}`} /> {r.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {(plan.length > 0 || minione.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2">
          {[
            { tytul: "Zaplanowane", lista: plan },
            { tytul: "Ostatnie 30 dni", lista: minione },
          ].map((g) =>
            g.lista.length === 0 ? null : (
              <div key={g.tytul}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">{g.tytul}</h3>
                <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {g.lista.map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {imie.get(n.agent_id) ?? "Osoba"} <span className="font-normal text-slate-500">· {etykieta(n.kind).toLowerCase()}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {krotko(n.starts_on)} – {krotko(n.ends_on)}
                          {n.substitute_id ? ` · zastępuje ${imie.get(n.substitute_id) ?? ""}` : ""}
                          {n.note ? ` · ${n.note}` : ""}
                        </p>
                      </div>
                      {mozeUsunac(n) && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => usun(n)}
                          className="flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:bg-red-100 hover:text-red-700"
                        >
                          Usuń
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Co się dzieje w czasie zastępstwa</h2>
        <ul className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <li>Zadania z automatyzacji dla osoby na urlopie dostaje zastępca.</li>
          <li>Nowe leady przypisywane automatycznie omijają osoby na urlopie.</li>
          <li>Zastępca widzi kontakty klientów nieobecnego, także przy ukrywaniu kontaktów.</li>
          <li>Na pulpicie zastępcy pojawia się lista spraw na dziś do przejęcia.</li>
          <li>Na karcie klienta widać, że opiekun jest na urlopie i kto go zastępuje.</li>
          <li>Po powrocie nic nie trzeba odkręcać, bo nikt nie przepisywał klientów.</li>
        </ul>
      </section>

      {otwarte && (
        <FormularzNieobecnosci
          ludzie={ludzie}
          ja={ja}
          zarzadza={zarzadza}
          dzis={dzis}
          onClose={() => setOtwarte(false)}
          onZapisano={() => {
            setOtwarte(false);
            toast("Nieobecność zapisana.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function FormularzNieobecnosci({
  ludzie,
  ja,
  zarzadza,
  dzis,
  onClose,
  onZapisano,
}: {
  ludzie: Osoba[];
  ja: string;
  zarzadza: boolean;
  dzis: string;
  onClose: () => void;
  onZapisano: () => void;
}) {
  const [kto, setKto] = useState(ja);
  const [rodzaj, setRodzaj] = useState("urlop");
  const [od, setOd] = useState(dzis);
  const [doD, setDo] = useState(dzis);
  const [zastepca, setZastepca] = useState("");
  const [notatka, setNotatka] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function zapisz() {
    setBlad(null);
    startTransition(async () => {
      const w = await dodajNieobecnosc({ agentId: kto, rodzaj, od, do: doD, zastepcaId: zastepca || null, notatka });
      if (w.ok) onZapisano();
      else setBlad(w.error);
    });
  }

  return (
    <Modal title="Zgłoś nieobecność" onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {zarzadza && (
            <div>
              <label className="mb-1.5 block text-sm text-slate-500">Kto będzie nieobecny</label>
              <Select aria-label="Osoba" value={kto} onChange={(e) => setKto(e.target.value)} options={ludzie.map((l) => ({ value: l.id, label: l.name }))} placeholder="" />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Rodzaj</label>
            <Select aria-label="Rodzaj" value={rodzaj} onChange={(e) => setRodzaj(e.target.value)} options={RODZAJE_NIEOBECNOSCI.map((r) => ({ value: r.value, label: r.label }))} placeholder="" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-slate-500">Od</label>
              <PoleDaty value={od} onChange={(e) => { setOd(e.target.value); if (doD < e.target.value) setDo(e.target.value); }} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-500">Do (włącznie)</label>
              <PoleDaty value={doD} min={od} onChange={(e) => setDo(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Zastępca</label>
            <Select
              aria-label="Zastępca"
              value={zastepca}
              onChange={(e) => setZastepca(e.target.value)}
              options={[{ value: "", label: "Bez zastępcy" }, ...ludzie.filter((l) => l.id !== kto).map((l) => ({ value: l.id, label: l.name }))]}
              placeholder=""
            />
            <p className="mt-1.5 text-xs text-slate-400">Zastępca dostanie powiadomienie od razu po zapisaniu.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Notatka (opcjonalnie)</label>
            <input value={notatka} onChange={(e) => setNotatka(e.target.value)} maxLength={300} placeholder="Np. pod telefonem w pilnych sprawach" className={pole} />
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={zapisz} disabled={pending} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60">
            {pending ? "Zapisuję…" : "Zapisz"}
          </button>
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Anuluj
          </button>
          {blad && <p className="text-sm text-red-600">{blad}</p>}
        </div>
      </div>
    </Modal>
  );
}
