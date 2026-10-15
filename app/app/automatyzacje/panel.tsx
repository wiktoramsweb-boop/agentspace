"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "../components/modal";
import { Select } from "../components/select";
import { useToast } from "../components/toast";
import { kiedy } from "../components/na-zywo";
import { pole } from "../dokumenty-wzory/klocki";
import { CLIENT_STATUSES, PROCESS_STAGES } from "@/lib/types";
import {
  AKCJE,
  SZABLONY_REGUL,
  ZDARZENIA,
  ZMIENNE,
  akcjeDlaZdarzenia,
  opisReguly,
  opisZdarzenia,
  type Akcja,
  type Odbiorca,
  type TypAkcji,
  type WarunkiReguly,
  type Zdarzenie,
} from "@/lib/automatyzacje-model";
import { przelaczRegule, usunRegule, wlaczSzablon, zapiszRegule } from "./actions";

export type ReguleWiersz = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Zdarzenie;
  trigger_config: WarunkiReguly;
  actions: Akcja[];
  runs_count: number;
  last_run_at: string | null;
};

export type UruchomienieWiersz = {
  id: string;
  rule_id: string;
  entity_type: string | null;
  entity_id: string | null;
  status: string;
  detail: string | null;
  created_at: string;
};

type Osoba = { id: string; name: string };

type Szkic = {
  id?: string;
  nazwa: string;
  trigger: Zdarzenie;
  warunki: WarunkiReguly;
  akcje: Akcja[];
};

const ADRES: Record<string, string> = {
  klient: "/app/klienci/",
  oferta: "/app/nieruchomosci/",
  transakcja: "/app/prowizje/",
};

function nowaAkcja(typ: TypAkcji): Akcja {
  switch (typ) {
    case "zadanie":
      return { typ, rodzaj: "zadanie", tytul: "", za_dni: 1, godzina: "09:00", priorytet: "normalny", dla: { kto: "opiekun" } };
    case "powiadomienie":
      return { typ, tytul: "", dla: [{ kto: "opiekun" }] };
    case "przypisz":
      return { typ, osoby: [], tylkoBezOpiekuna: true };
    case "status_klienta":
      return { typ, status: "w_kontakcie" };
    case "etap_oferty":
      return { typ, etap: "liczne_prezentacje" };
    case "mail_do_klienta":
      return { typ, temat: "", tresc: "", wymagajZgody: true };
  }
}

export function PanelAutomatyzacji({
  reguly,
  uruchomienia,
  ludzie,
}: {
  reguly: ReguleWiersz[];
  uruchomienia: UruchomienieWiersz[];
  ludzie: Osoba[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [szkic, setSzkic] = useState<Szkic | null>(null);
  const [pending, startTransition] = useTransition();
  const nazwyRegul = useMemo(() => new Map(reguly.map((r) => [r.id, r.name])), [reguly]);
  const wlaczone = new Set(reguly.map((r) => r.name));

  function wlaczGotowa(klucz: string) {
    startTransition(async () => {
      const w = await wlaczSzablon(klucz);
      if (w.ok) {
        toast("Reguła włączona. Od teraz działa sama.");
        router.refresh();
      } else toast(w.error, "error");
    });
  }

  function przelacz(r: ReguleWiersz) {
    startTransition(async () => {
      const w = await przelaczRegule(r.id, !r.enabled);
      if (w.ok) router.refresh();
      else toast(w.error, "error");
    });
  }

  function usun(r: ReguleWiersz) {
    if (!confirm(`Usunąć regułę „${r.name}"? Zadania, które już utworzyła, zostaną.`)) return;
    startTransition(async () => {
      const w = await usunRegule(r.id);
      if (w.ok) {
        toast("Reguła usunięta.");
        router.refresh();
      } else toast(w.error, "error");
    });
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Reguły biura</h2>
            <p className="text-sm text-slate-500">
              {reguly.length === 0
                ? "Nie masz jeszcze żadnej. Zacznij od gotowej poniżej albo ułóż własną."
                : `${reguly.filter((r) => r.enabled).length} z ${reguly.length} włączonych.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSzkic({ nazwa: "", trigger: "prezentacja_wykonana", warunki: {}, akcje: [nowaAkcja("zadanie")] })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            <span aria-hidden="true" className="text-base leading-none">+</span>
            Nowa reguła
          </button>
        </div>

        {reguly.length > 0 && (
          <ul className="grid gap-3">
            {reguly.map((r) => (
              <li
                key={r.id}
                className={`rounded-2xl border bg-white p-5 transition ${r.enabled ? "border-slate-200" : "border-dashed border-slate-300 opacity-70"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{r.name}</h3>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {opisZdarzenia(r.trigger)?.nazwa ?? r.trigger}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{opisReguly(r)}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {r.runs_count > 0
                        ? `Zadziałała ${r.runs_count} ${r.runs_count === 1 ? "raz" : "razy"}, ostatnio ${r.last_run_at ? kiedy(r.last_run_at) : "-"}`
                        : "Jeszcze nie zadziałała"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Przelacznik wlaczony={r.enabled} onChange={() => przelacz(r)} disabled={pending} etykieta={`Reguła ${r.name}`} />
                    <button
                      type="button"
                      onClick={() => setSzkic({ id: r.id, nazwa: r.name, trigger: r.trigger, warunki: r.trigger_config, akcje: r.actions })}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      onClick={() => usun(r)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-red-100 hover:text-red-700"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Gotowe reguły</h2>
        <p className="mb-4 text-sm text-slate-500">
          Te, które biura ustawiają najczęściej. Włączasz jednym kliknięciem, a potem możesz je dowolnie zmienić.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SZABLONY_REGUL.map((s) => {
            const jest = wlaczone.has(s.nazwa);
            return (
              <div key={s.klucz} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                  {opisZdarzenia(s.trigger)?.nazwa}
                </p>
                <h3 className="mt-1 font-semibold text-slate-900">{s.nazwa}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{s.poCo}</p>
                <p className="mt-3 text-xs text-slate-400">{opisReguly(s)}</p>
                <div className="mt-4">
                  {jest ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                      Włączona
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => wlaczGotowa(s.klucz)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-60"
                    >
                      Włącz
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Ostatnie uruchomienia</h2>
        <p className="mb-4 text-sm text-slate-500">Co reguły zrobiły i dla kogo. Każde zadanie z automatyzacji ma też dopisek, z której reguły pochodzi.</p>
        {uruchomienia.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Tu pojawi się historia, gdy pierwsza reguła zadziała.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {uruchomienia.map((u) => (
              <li key={u.id} className="flex flex-wrap items-start gap-3 px-5 py-3.5 text-sm">
                <span
                  className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${u.status === "ok" ? "bg-emerald-500" : u.status === "w_toku" ? "bg-slate-300" : "bg-amber-500"}`}
                  aria-label={u.status === "ok" ? "udane" : "częściowo"}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{nazwyRegul.get(u.rule_id) ?? "Usunięta reguła"}</p>
                  {u.detail && <p className="mt-0.5 text-slate-500">{u.detail}</p>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {u.entity_type && u.entity_id && ADRES[u.entity_type] && (
                    <Link href={`${ADRES[u.entity_type]}${u.entity_id}`} className="font-medium text-emerald-700 hover:underline">
                      Otwórz
                    </Link>
                  )}
                  <span>{kiedy(u.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {szkic && (
        <Kreator
          szkic={szkic}
          ludzie={ludzie}
          onClose={() => setSzkic(null)}
          onZapisano={() => {
            setSzkic(null);
            toast("Reguła zapisana.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Przelacznik({ wlaczony, onChange, disabled, etykieta }: { wlaczony: boolean; onChange: () => void; disabled?: boolean; etykieta: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={wlaczony}
      aria-label={etykieta}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${wlaczony ? "bg-emerald-500" : "bg-slate-300"} disabled:opacity-60`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${wlaczony ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

// ── Kreator reguły ─────────────────────────────────────────

function Kreator({
  szkic: poczatkowy,
  ludzie,
  onClose,
  onZapisano,
}: {
  szkic: Szkic;
  ludzie: Osoba[];
  onClose: () => void;
  onZapisano: () => void;
}) {
  const [s, setS] = useState<Szkic>(poczatkowy);
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dozwolone = akcjeDlaZdarzenia(s.trigger);
  const czego = opisZdarzenia(s.trigger)?.czego;

  function ustawZdarzenie(z: Zdarzenie) {
    const nowe = akcjeDlaZdarzenia(z);
    setS((p) => ({
      ...p,
      trigger: z,
      warunki: z === "klient_bez_kontaktu" || z === "oferta_bez_prezentacji" ? { dni: p.warunki.dni ?? 14 } : {},
      akcje: p.akcje.filter((a) => nowe.includes(a.typ)),
    }));
  }

  function zmienAkcje(i: number, a: Akcja) {
    setS((p) => ({ ...p, akcje: p.akcje.map((x, j) => (j === i ? a : x)) }));
  }

  function zapisz() {
    setBlad(null);
    startTransition(async () => {
      const w = await zapiszRegule({ id: s.id, nazwa: s.nazwa, trigger: s.trigger, warunki: s.warunki, akcje: s.akcje });
      if (w.ok) onZapisano();
      else setBlad(w.error);
    });
  }

  const grupy = ["Klienci", "Leady", "Oferty", "Transakcje"] as const;

  return (
    <Modal title={s.id ? "Edycja reguły" : "Nowa reguła"} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Nazwa reguły</label>
            <input
              value={s.nazwa}
              onChange={(e) => setS({ ...s, nazwa: e.target.value })}
              placeholder="Np. Telefon dzień po prezentacji"
              className={pole}
              maxLength={120}
            />
          </div>

          <Krok numer={1} tytul="Kiedy">
            <div className="space-y-3">
              {grupy.map((g) => (
                <div key={g}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{g}</p>
                  <div className="flex flex-wrap gap-2">
                    {ZDARZENIA.filter((z) => z.grupa === g).map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => ustawZdarzenie(z.id)}
                        aria-pressed={s.trigger === z.id}
                        className={`rounded-xl border px-3 py-2 text-sm transition ${
                          s.trigger === z.id
                            ? "border-emerald-500 bg-emerald-100 font-medium text-emerald-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {z.nazwa}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">Kiedy {opisZdarzenia(s.trigger)?.zdanie}.</p>
          </Krok>

          <Krok numer={2} tytul="Jeśli" opis="Opcjonalnie. Bez warunków reguła działa przy każdym takim zdarzeniu.">
            <Warunki trigger={s.trigger} w={s.warunki} onChange={(w) => setS({ ...s, warunki: w })} />
          </Krok>

          <Krok numer={3} tytul="Wtedy">
            <div className="space-y-3">
              {s.akcje.map((a, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{AKCJE.find((x) => x.typ === a.typ)?.nazwa}</p>
                    <button
                      type="button"
                      onClick={() => setS({ ...s, akcje: s.akcje.filter((_, j) => j !== i) })}
                      className="text-xs font-medium text-slate-400 hover:text-red-600"
                    >
                      Usuń akcję
                    </button>
                  </div>
                  <EdytorAkcji akcja={a} ludzie={ludzie} czego={czego} onChange={(n) => zmienAkcje(i, n)} />
                </div>
              ))}
              {s.akcje.length < 6 && (
                <div className="flex flex-wrap gap-2">
                  {AKCJE.filter((x) => dozwolone.includes(x.typ)).map((x) => (
                    <button
                      key={x.typ}
                      type="button"
                      onClick={() => setS({ ...s, akcje: [...s.akcje, nowaAkcja(x.typ)] })}
                      title={x.opis}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700"
                    >
                      <span aria-hidden="true">+</span> {x.nazwa}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Krok>

          <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <summary className="cursor-pointer font-medium text-slate-700">Zmienne do wstawienia w treści</summary>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {ZMIENNE.map((z) => (
                <li key={z.klucz} className="text-slate-500">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">{`{${z.klucz}}`}</code> {z.opis}
                </li>
              ))}
            </ul>
          </details>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={zapisz}
            disabled={pending}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {pending ? "Zapisuję…" : "Zapisz regułę"}
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

function Krok({ numer, tytul, opis, children }: { numer: number; tytul: string; opis?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{numer}</span>
        <h3 className="font-semibold text-slate-900">{tytul}</h3>
      </div>
      {opis && <p className="-mt-1 mb-3 text-sm text-slate-500">{opis}</p>}
      {children}
    </section>
  );
}

function Chipy({ opcje, wybrane, onChange }: { opcje: { value: string; label: string }[]; wybrane: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcje.map((o) => {
        const on = wybrane.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? wybrane.filter((x) => x !== o.value) : [...wybrane, o.value])}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              on ? "border-emerald-500 bg-emerald-100 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Warunki({ trigger, w, onChange }: { trigger: Zdarzenie; w: WarunkiReguly; onChange: (w: WarunkiReguly) => void }) {
  if (trigger === "zmiana_statusu_klienta") {
    return (
      <div>
        <p className="mb-2 text-sm text-slate-600">Tylko gdy klient przejdzie do:</p>
        <Chipy opcje={CLIENT_STATUSES} wybrane={w.statusNa ?? []} onChange={(v) => onChange({ ...w, statusNa: v })} />
      </div>
    );
  }
  if (trigger === "zmiana_etapu_oferty") {
    return (
      <div>
        <p className="mb-2 text-sm text-slate-600">Tylko gdy oferta przejdzie do etapu:</p>
        <Chipy opcje={PROCESS_STAGES} wybrane={w.etapNa ?? []} onChange={(v) => onChange({ ...w, etapNa: v })} />
      </div>
    );
  }
  if (trigger === "zmiana_ceny_oferty") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-slate-500">Rodzaj zmiany</label>
          <Select
            aria-label="Rodzaj zmiany ceny"
            value={w.kierunekCeny ?? "dowolna"}
            onChange={(e) => onChange({ ...w, kierunekCeny: e.target.value as WarunkiReguly["kierunekCeny"] })}
            options={[
              { value: "dowolna", label: "Każda zmiana" },
              { value: "obnizka", label: "Tylko obniżka" },
              { value: "podwyzka", label: "Tylko podwyżka" },
            ]}
            placeholder=""
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-500">Co najmniej o (%)</label>
          <input
            type="number"
            min={0}
            max={90}
            value={w.minZmianaProcent ?? ""}
            onChange={(e) => onChange({ ...w, minZmianaProcent: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="np. 2"
            className={pole}
          />
        </div>
      </div>
    );
  }
  if (trigger === "klient_bez_kontaktu" || trigger === "oferta_bez_prezentacji") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">Po ilu dniach</label>
        <input
          type="number"
          min={1}
          max={365}
          value={w.dni ?? 14}
          onChange={(e) => onChange({ ...w, dni: Number(e.target.value) })}
          className={`${pole.replace("w-full", "")} w-24`}
        />
        <span className="text-sm text-slate-500">Sprawdzamy raz dziennie rano.</span>
      </div>
    );
  }
  if (trigger === "nowy_klient") {
    return (
      <div>
        <p className="mb-2 text-sm text-slate-600">Tylko dla typu klienta:</p>
        <Chipy
          opcje={[
            { value: "sprzedajacy", label: "Sprzedający" },
            { value: "kupujacy", label: "Kupujący" },
            { value: "wynajmujacy", label: "Wynajmujący" },
            { value: "najemca", label: "Najemca" },
          ]}
          wybrane={w.typKlienta ?? []}
          onChange={(v) => onChange({ ...w, typKlienta: v })}
        />
      </div>
    );
  }
  if (trigger === "nowa_oferta") {
    return (
      <div>
        <p className="mb-2 text-sm text-slate-600">Tylko dla:</p>
        <Chipy
          opcje={[
            { value: "sprzedaz", label: "Sprzedaży" },
            { value: "wynajem", label: "Wynajmu" },
          ]}
          wybrane={w.rodzajOferty ?? []}
          onChange={(v) => onChange({ ...w, rodzajOferty: v })}
        />
      </div>
    );
  }
  return <p className="text-sm text-slate-400">To zdarzenie nie ma dodatkowych warunków.</p>;
}

const ODBIORCY_STALI: { kto: Odbiorca["kto"]; label: string }[] = [
  { kto: "opiekun", label: "Opiekun rekordu" },
  { kto: "autor", label: "Osoba, która to zrobiła" },
  { kto: "menedzer_opiekuna", label: "Menedżer opiekuna" },
  { kto: "ceo", label: "CEO i dyrektor" },
];

function kluczOdbiorcy(o: Odbiorca): string {
  return o.kto === "osoba" ? `osoba:${o.id}` : o.kto;
}
function zKlucza(k: string): Odbiorca {
  if (k.startsWith("osoba:")) return { kto: "osoba", id: k.slice(6) };
  return { kto: k as Exclude<Odbiorca["kto"], "osoba"> };
}

function EdytorAkcji({ akcja: a, ludzie, czego, onChange }: { akcja: Akcja; ludzie: Osoba[]; czego?: string; onChange: (a: Akcja) => void }) {
  const opcjeOdbiorcy = [
    ...ODBIORCY_STALI.map((o) => ({ value: o.kto, label: o.label })),
    ...ludzie.map((l) => ({ value: `osoba:${l.id}`, label: l.name })),
  ];

  switch (a.typ) {
    case "zadanie":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <input value={a.tytul} onChange={(e) => onChange({ ...a, tytul: e.target.value })} placeholder="Tytuł, np. Zadzwoń do {klient}" className={pole} />
          </div>
          <div className="sm:col-span-2">
            <textarea value={a.opis ?? ""} onChange={(e) => onChange({ ...a, opis: e.target.value })} placeholder="Opis (opcjonalnie)" rows={2} className={pole} />
          </div>
          <Select
            aria-label="Rodzaj zadania"
            value={a.rodzaj}
            onChange={(e) => onChange({ ...a, rodzaj: e.target.value as "zadanie" | "polaczenie" })}
            options={[
              { value: "zadanie", label: "Zadanie" },
              { value: "polaczenie", label: "Telefon" },
            ]}
            placeholder=""
          />
          <Select
            aria-label="Dla kogo"
            value={kluczOdbiorcy(a.dla)}
            onChange={(e) => onChange({ ...a, dla: zKlucza(e.target.value) })}
            options={opcjeOdbiorcy}
            placeholder=""
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Termin za</span>
            <input type="number" min={0} max={365} value={a.za_dni} onChange={(e) => onChange({ ...a, za_dni: Number(e.target.value) })} className={`${pole.replace("w-full", "")} w-20`} />
            <span className="text-sm text-slate-500">dni, o</span>
            <input type="time" value={a.godzina ?? "09:00"} onChange={(e) => onChange({ ...a, godzina: e.target.value })} className={`${pole.replace("w-full", "")} w-28`} />
          </div>
          <Select
            aria-label="Priorytet"
            value={a.priorytet ?? "normalny"}
            onChange={(e) => onChange({ ...a, priorytet: e.target.value as "niski" | "normalny" | "wysoki" })}
            options={[
              { value: "niski", label: "Priorytet niski" },
              { value: "normalny", label: "Priorytet normalny" },
              { value: "wysoki", label: "Priorytet wysoki" },
            ]}
            placeholder=""
          />
          <p className="text-xs text-slate-400 sm:col-span-2">Gdy ta osoba jest na urlopie, zadanie dostaje jej zastępca.</p>
        </div>
      );
    case "powiadomienie":
      return (
        <div className="space-y-3">
          <input value={a.tytul} onChange={(e) => onChange({ ...a, tytul: e.target.value })} placeholder="Tytuł, np. Obniżka: {oferta}" className={pole} />
          <textarea value={a.tresc ?? ""} onChange={(e) => onChange({ ...a, tresc: e.target.value })} placeholder="Treść (opcjonalnie)" rows={2} className={pole} />
          <div>
            <p className="mb-2 text-sm text-slate-600">Kto dostaje:</p>
            <Chipy
              opcje={opcjeOdbiorcy}
              wybrane={a.dla.map(kluczOdbiorcy)}
              onChange={(v) => onChange({ ...a, dla: v.map(zKlucza) })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={Boolean(a.mail)} onChange={(e) => onChange({ ...a, mail: e.target.checked })} className="h-4 w-4 rounded accent-emerald-500" />
            Wyślij też mailem
          </label>
        </div>
      );
    case "przypisz":
      return (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Wybierz osoby. Rekord dostanie ta, która ma teraz najmniej otwartych spraw. Nie wybierzesz nikogo, to cały zespół sprzedaży.
          </p>
          <Chipy
            opcje={ludzie.map((l) => ({ value: l.id, label: l.name }))}
            wybrane={a.osoby}
            onChange={(v) => onChange({ ...a, osoby: v })}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={a.tylkoBezOpiekuna !== false} onChange={(e) => onChange({ ...a, tylkoBezOpiekuna: e.target.checked })} className="h-4 w-4 rounded accent-emerald-500" />
            Tylko gdy {czego === "oferta" ? "oferta" : "rekord"} nie ma jeszcze opiekuna
          </label>
        </div>
      );
    case "status_klienta":
      return (
        <Select
          aria-label="Nowy status"
          value={a.status}
          onChange={(e) => onChange({ ...a, status: e.target.value })}
          options={CLIENT_STATUSES.map((x) => ({ value: x.value, label: x.label }))}
          placeholder=""
        />
      );
    case "etap_oferty":
      return (
        <Select
          aria-label="Nowy etap"
          value={a.etap}
          onChange={(e) => onChange({ ...a, etap: e.target.value })}
          options={PROCESS_STAGES.map((x) => ({ value: x.value, label: x.label }))}
          placeholder=""
        />
      );
    case "mail_do_klienta":
      return (
        <div className="space-y-3">
          <input value={a.temat} onChange={(e) => onChange({ ...a, temat: e.target.value })} placeholder="Temat, np. Dziękuję za spotkanie" className={pole} />
          <textarea
            value={a.tresc}
            onChange={(e) => onChange({ ...a, tresc: e.target.value })}
            placeholder={"Dzień dobry {imie},\n\ndziękuję za dzisiejsze oglądanie…"}
            rows={5}
            className={pole}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={a.wymagajZgody !== false} onChange={(e) => onChange({ ...a, wymagajZgody: e.target.checked })} className="h-4 w-4 rounded accent-emerald-500" />
            Wysyłaj tylko klientom ze zgodą na kontakt mailowy
          </label>
          <p className="text-xs text-slate-400">Mail idzie z nazwą biura, a odpowiedź klienta trafia do skrzynki opiekuna.</p>
        </div>
      );
  }
}
