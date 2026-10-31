"use client";

import { useRef, useState, useTransition } from "react";
import { Select, type SelectOption } from "../../components/select";
import { pole, PrzyciskUsun } from "../../dokumenty-wzory/klocki";
import { usunZadanie, zlecTrening } from "./actions";
import { PoleDaty } from "@/app/app/components/pole-daty";

export type ZadanieWiersz = {
  id: string;
  osoba: string;
  scenariusz: string;
  trudnosc: string;
  prog: number | null;
  termin: string | null;
  status: string;
  najlepszy: number | null;
  proby: number;
  notatka: string | null;
};

const TRUDNOSC: Record<string, string> = { latwy: "łatwy", sredni: "średni", trudny: "trudny" };
const dataPL = (iso: string) => iso.split("-").reverse().join(".");

export function FormularzZadania({
  osoby, scenariusze, osobowosci, oferty,
}: {
  osoby: { id: string; nazwa: string }[];
  scenariusze: SelectOption[];
  osobowosci: SelectOption[];
  oferty: SelectOption[];
}) {
  const [wybrani, setWybrani] = useState<string[]>([]);
  const [scenariusz, setScenariusz] = useState("");
  const [trudnosc, setTrudnosc] = useState("sredni");
  const [osobowosc, setOsobowosc] = useState("");
  const [oferta, setOferta] = useState("");
  const [komunikat, setKomunikat] = useState<{ ok: boolean; t: string } | null>(null);
  const [pracuje, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      action={(f) =>
        start(async () => {
          wybrani.forEach((id) => f.append("agenci", id));
          f.set("scenario", scenariusz);
          f.set("difficulty", trudnosc);
          f.set("personality", osobowosc);
          f.set("property", oferta);
          const r = await zlecTrening(f);
          if (!r.ok) return setKomunikat({ ok: false, t: r.error });
          setKomunikat({ ok: true, t: `Zlecono ${r.ile === 1 ? "jednej osobie" : `${r.ile} osobom`}. Dostali powiadomienie.` });
          setWybrani([]);
          form.current?.reset();
        })
      }
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <p className="font-semibold text-slate-900">Nowe zadanie</p>

      <fieldset>
        <legend className="mb-1.5 text-sm text-slate-500">Dla kogo</legend>
        {osoby.length === 0 ? (
          <p className="text-sm text-slate-500">Nie masz jeszcze nikogo w zespole.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {osoby.map((o) => {
              const on = wybrani.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setWybrani(on ? wybrani.filter((x) => x !== o.id) : [...wybrani, o.id])}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-emerald-500 bg-emerald-50 font-medium text-emerald-800" : "border-slate-300 text-slate-600 hover:border-slate-400"}`}
                >
                  {o.nazwa}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <div>
        <label className="mb-1.5 block text-sm text-slate-500">Scenariusz</label>
        <Select aria-label="Scenariusz" value={scenariusz} onChange={(e) => setScenariusz(e.target.value)} options={scenariusze} placeholder="Wybierz rozmowę…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-slate-500">Trudność</label>
          <Select
            aria-label="Trudność"
            value={trudnosc}
            onChange={(e) => setTrudnosc(e.target.value)}
            options={[{ value: "latwy", label: "Łatwy" }, { value: "sredni", label: "Średni" }, { value: "trudny", label: "Trudny" }]}
            placeholder=""
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-500" htmlFor="z-prog">Próg zaliczenia</label>
          <input id="z-prog" name="min_score" type="number" min={1} max={10} step={0.5} defaultValue={7} className={pole} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-slate-500">Typ klienta</label>
        <Select aria-label="Typ klienta" value={osobowosc} onChange={(e) => setOsobowosc(e.target.value)} options={osobowosci} placeholder="Agent wybiera sam" />
      </div>
      {oferty.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm text-slate-500">Na ofercie (opcjonalnie)</label>
          <Select aria-label="Oferta" value={oferta} onChange={(e) => setOferta(e.target.value)} options={oferty} placeholder="Bez oferty" />
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm text-slate-500" htmlFor="z-termin">Termin</label>
        <PoleDaty id="z-termin" name="due_on" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-slate-500" htmlFor="z-note">Wskazówka dla agenta</label>
        <textarea id="z-note" name="note" rows={2} maxLength={500} placeholder="Np. ćwicz domykanie spotkania, nie odpuszczaj po pierwszym „nie”." className={pole} />
      </div>
      <button type="submit" disabled={pracuje} className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60">
        {pracuje ? "Zlecam…" : "Zleć zadanie"}
      </button>
      {komunikat && <p className={`text-sm ${komunikat.ok ? "text-emerald-700" : "text-red-600"}`}>{komunikat.t}</p>}
    </form>
  );
}

export function ListaZadan({ zadania }: { zadania: ZadanieWiersz[] }) {
  const [, start] = useTransition();
  if (zadania.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        Nie ma jeszcze zadań. Zleć pierwsze: np. „Obiekcja: prowizja za wysoka”, poziom trudny, próg 7.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <ul className="divide-y divide-slate-100">
        {zadania.map((z) => {
          const poTerminie = z.status !== "zaliczone" && z.termin && z.termin < new Date().toISOString().slice(0, 10);
          return (
            <li key={z.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate text-sm font-medium text-slate-800">{z.osoba} · {z.scenariusz}</p>
                <p className="text-xs text-slate-400">
                  {TRUDNOSC[z.trudnosc] ?? z.trudnosc}
                  {z.prog != null ? ` · próg ${z.prog}` : ""}
                  {z.termin ? ` · do ${dataPL(z.termin)}` : ""}
                  {` · podejścia: ${z.proby}`}
                  {z.najlepszy != null ? ` · najlepszy wynik ${z.najlepszy}` : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  z.status === "zaliczone" ? "bg-emerald-100 text-emerald-700" : poTerminie ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {z.status === "zaliczone" ? "zaliczone" : poTerminie ? "po terminie" : "w trakcie"}
              </span>
              <PrzyciskUsun
                tytul="Usuń zadanie"
                onClick={() => {
                  if (confirm("Usunąć to zadanie?")) start(async () => { await usunZadanie(z.id); });
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
