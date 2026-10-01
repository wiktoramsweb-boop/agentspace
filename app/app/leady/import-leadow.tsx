"use client";

import { useRef, useState } from "react";
import { Modal } from "../components/modal";
import { Select } from "../components/select";
import {
  dopasujKolumny, odczytajTekst, parsujCsv, wierszeNaLeady, zgadnijSeparator,
  type LeadZPliku, type PoleLeada, type WierszPliku,
} from "@/lib/leady-import";
import { importujLeady } from "./actions";
import { LEAD_SOURCES } from "@/lib/types";

const OPISY_POL: { pole: PoleLeada; label: string; wazne?: boolean }[] = [
  { pole: "name", label: "Imię i nazwisko", wazne: true },
  { pole: "phone", label: "Telefon", wazne: true },
  { pole: "email", label: "E-mail", wazne: true },
  { pole: "city", label: "Miasto" },
  { pole: "address", label: "Adres" },
  { pole: "message", label: "Wiadomość" },
  { pole: "submitted_at", label: "Data zgłoszenia" },
  { pole: "campaign", label: "Kampania" },
  { pole: "ad_name", label: "Reklama" },
  { pole: "form_name", label: "Formularz" },
  { pole: "platform", label: "Platforma" },
  { pole: "external_id", label: "Identyfikator z pliku" },
];

/**
 * Wczytywanie leadów z pliku.
 *
 * Krok z dopasowaniem kolumn jest celowy. Nagłówki zależą od tego, jak biuro
 * nazwało pytania w formularzu reklamy, więc żadne sztywne mapowanie nie
 * wystarczy. Rozpoznajemy je automatycznie, ale pokazujemy wynik do
 * poprawienia, zanim cokolwiek trafi do bazy.
 */
export function ImportLeadow({ agenci }: { agenci: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [krok, setKrok] = useState<"plik" | "mapowanie" | "gotowe">("plik");
  const [wiersze, setWiersze] = useState<WierszPliku[]>([]);
  const [naglowki, setNaglowki] = useState<string[]>([]);
  const [mapa, setMapa] = useState<Partial<Record<PoleLeada, string>>>({});
  const [source, setSource] = useState("meta");
  const [agentId, setAgentId] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [pracuje, setPracuje] = useState(false);
  const [wynik, setWynik] = useState<string | null>(null);
  const plikRef = useRef<HTMLInputElement>(null);

  function zamknij() {
    setOpen(false);
    setKrok("plik");
    setWiersze([]);
    setNaglowki([]);
    setMapa({});
    setBlad(null);
    setWynik(null);
  }

  async function wczytajPlik(file: File) {
    setBlad(null);
    try {
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        setBlad(
          "To jest plik Excela. W Meta Ads przy pobieraniu wybierz format CSV, albo otwórz plik w Excelu i zapisz jako CSV.",
        );
        return;
      }
      const tekst = odczytajTekst(await file.arrayBuffer());
      const w = parsujCsv(tekst, zgadnijSeparator(tekst));
      if (!w.length) {
        setBlad("Nie znalazłem w pliku żadnych wierszy z danymi.");
        return;
      }
      const h = Object.keys(w[0]);
      setWiersze(w);
      setNaglowki(h);
      setMapa(dopasujKolumny(h));
      setKrok("mapowanie");
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się odczytać pliku.");
    }
  }

  const podglad: LeadZPliku[] = krok === "mapowanie" ? wierszeNaLeady(wiersze, mapa) : [];
  const odsiane = wiersze.length - podglad.length;

  async function wyslij() {
    setPracuje(true);
    setBlad(null);
    try {
      const res = await importujLeady(podglad, source, agentId || null);
      if (!res.ok) {
        setBlad(res.error);
        return;
      }
      const w = res.wynik;
      setWynik(
        [
          `Dodano ${w.dodane} ${w.dodane === 1 ? "leada" : "leadów"}.`,
          w.pominieteDuplikaty ? `Pominięto ${w.pominieteDuplikaty} jako duplikaty.` : "",
          w.bledy ? `Nie udało się zapisać ${w.bledy}.` : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
      setKrok("gotowe");
    } finally {
      setPracuje(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-emerald-500/60"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 7.5 12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        Wczytaj z pliku
      </button>
    );
  }

  return (
    <Modal title="Wczytaj leady z pliku" onClose={zamknij} maxWidth="max-w-3xl">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {krok === "plik" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
              <p className="font-semibold text-slate-900">Skąd wziąć plik z Meta Ads</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Menedżer reklam albo Meta Business Suite, zakładka <strong>Centrum potencjalnych klientów</strong>.</li>
                <li>Wybierz formularz i okres, potem <strong>Pobierz</strong>.</li>
                <li>Zaznacz format <strong>CSV</strong>, nie Excel.</li>
              </ol>
              <p className="mt-2 text-xs text-slate-500">
                Przyjmiemy też plik z innego źródła: wystarczy, że ma kolumnę z telefonem albo e-mailem.
                Rozpoznajemy przecinki, średniki i tabulatory.
              </p>
            </div>

            <button
              type="button"
              onClick={() => plikRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-6 py-10 text-center transition hover:border-emerald-500 hover:bg-emerald-50/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </span>
              <span className="font-semibold text-slate-900">Wybierz plik CSV</span>
              <span className="text-sm text-slate-500">albo przeciągnij go tutaj</span>
            </button>
            <input
              ref={plikRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void wczytajPlik(f);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {krok === "mapowanie" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Plik ma <strong>{wiersze.length}</strong> {wiersze.length === 1 ? "wiersz" : "wierszy"}.
              Rozpoznałem kolumny automatycznie, sprawdź i popraw, jeśli któraś jest nie ta.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {OPISY_POL.map((o) => (
                <div key={o.pole}>
                  <label className="mb-1.5 block text-sm text-slate-500">
                    {o.label}
                    {o.wazne && <span className="ml-1 text-xs text-emerald-600">ważne</span>}
                  </label>
                  <Select
                    aria-label={o.label}
                    value={mapa[o.pole] ?? ""}
                    onChange={(e) =>
                      setMapa((p) => ({ ...p, [o.pole]: e.target.value || undefined }))
                    }
                    options={naglowki.map((h) => ({ value: h, label: h }))}
                    placeholder="nie wczytuj"
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-slate-500">Źródło leadów</label>
                <Select
                  aria-label="Źródło leadów"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  options={LEAD_SOURCES}
                  placeholder=""
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-500">Przypisz od razu do</label>
                <Select
                  aria-label="Przypisz do"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  options={agenci.map((a) => ({ value: a.id, label: a.name }))}
                  placeholder="zostaw w puli biura"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">
                Podgląd: {podglad.length} do wczytania
                {odsiane > 0 && (
                  <span className="ml-2 font-normal text-slate-500">
                    ({odsiane} bez telefonu i e-maila zostanie pominiętych)
                  </span>
                )}
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Imię i nazwisko</th>
                      <th className="px-3 py-2 font-medium">Telefon</th>
                      <th className="px-3 py-2 font-medium">E-mail</th>
                      <th className="px-3 py-2 font-medium">Miasto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {podglad.slice(0, 5).map((l, i) => (
                      <tr key={i} className="border-t border-slate-200">
                        <td className="px-3 py-2 text-slate-800">{l.name ?? "-"}</td>
                        <td className="px-3 py-2 tabular-nums text-slate-800">{l.phone ?? "-"}</td>
                        <td className="px-3 py-2 text-slate-600">{l.email ?? "-"}</td>
                        <td className="px-3 py-2 text-slate-600">{l.city ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {krok === "gotowe" && (
          <div className="py-10 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
            <p className="text-lg font-semibold text-slate-900">Gotowe</p>
            <p className="mt-1 text-sm text-slate-600">{wynik}</p>
          </div>
        )}

        {blad && (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{blad}</p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
        <button type="button" onClick={zamknij} className="text-sm font-medium text-slate-500 hover:text-slate-900">
          {krok === "gotowe" ? "Zamknij" : "Anuluj"}
        </button>
        {krok === "mapowanie" && (
          <button
            type="button"
            onClick={wyslij}
            disabled={pracuje || !podglad.length}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {pracuje ? "Wczytuję…" : `Wczytaj ${podglad.length}`}
          </button>
        )}
      </div>
    </Modal>
  );
}
