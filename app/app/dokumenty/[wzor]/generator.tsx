"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Select } from "../../components/select";
import { Pole, Sekcja, PrzyciskDodaj, PrzyciskUsun, PasekAkcji, pole } from "../../dokumenty-wzory/klocki";
import { wzor as znajdzWzor } from "@/lib/dokumenty";
import { generujDokumentPdf } from "@/lib/dokumenty/pdf";
import { daneStartowe, pustaStrona, type Dane, type Kontekst, type Pole as PoleWzoru, type Strona } from "@/lib/dokumenty/silnik";
import { pobierzPdf, drukujPdf } from "@/lib/pdf-kit";
import { uploadToSignedUrl } from "@/lib/photo-process";
import { signDocumentUploads, registerDocuments } from "../actions";
import { klientDoDokumentu, ofertaDoDokumentu, oznaczWzor } from "../wzory-actions";

export type Rekord = { id: string; nazwa: string; opis?: string };

type WzorDok = NonNullable<ReturnType<typeof znajdzWzor>>;

/** Pola dokumentu wypełniane z oferty (adres, cena, metraż…). */
function polaZOferty(w: WzorDok, pola: Record<string, string>, obecne: Dane): Dane {
  const n: Dane = {};
  for (const [zrodlo, pole] of Object.entries(w.zOferty ?? {})) {
    const v = pola[zrodlo];
    if (v && pole) n[pole] = v;
  }
  if (pola.numerOferty && "numerOferty" in obecne) n.numerOferty = pola.numerOferty;
  if (pola.miasto && "miasto" in obecne && !String(obecne.miasto ?? "").trim()) n.miasto = pola.miasto;
  return n;
}

/** Rodzaj dokumentu w karcie klienta/oferty. Nieznany zapisze się jako „inne". */
function rodzajWKarcie(wzorId: string): string {
  if (wzorId.startsWith("umowa-posrednictwa")) return "umowa_posrednictwa";
  if (wzorId.startsWith("pelnomocnictwo")) return "pelnomocnictwo";
  return "inne";
}

function nazwaPliku(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120);
}

/** `**pogrubienie**` w podglądzie, tak jak w PDF-ie. */
function Bogaty({ t }: { t: string }) {
  return (
    <>
      {t.split("**").map((kawalek, i) =>
        i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{kawalek}</strong> : <span key={i}>{kawalek}</span>,
      )}
    </>
  );
}

export function Generator({
  wzorId, kontekst, stopka, dzis, klienci, oferty, startKlient, startOferta, startStrona, startUkryte, startPola,
}: {
  wzorId: string;
  kontekst: Kontekst;
  stopka: string;
  dzis: string;
  klienci: Rekord[];
  oferty: Rekord[];
  startKlient?: string;
  startOferta?: string;
  startStrona?: Strona;
  startUkryte?: boolean;
  startPola?: Record<string, string>;
}) {
  const w = znajdzWzor(wzorId)!;
  const kluczSzkicu = `agentspace:wzor:${wzorId}`;

  const [d, setD] = useState<Dane>(() => {
    const start = daneStartowe(w, dzis);
    if (!start.miasto && w.grupy.some((g) => g.pola.some((p) => p.k === "miasto"))) start.miasto = kontekst.miasto;
    if (startStrona && w.poleKlienta) start[w.poleKlienta] = [startStrona];
    if (startPola) Object.assign(start, polaZOferty(w, startPola, start));
    return start;
  });
  const [klient, setKlient] = useState(startKlient ?? "");
  const [oferta, setOferta] = useState(startOferta ?? "");
  const [info, setInfo] = useState<string | null>(
    startUkryte ? "Biuro ukrywa dane klientów innych agentów, więc wpisałem tylko imię i nazwisko. PESEL i adres uzupełnij z klientem." : null,
  );
  const [szkic, setSzkic] = useState<Dane | null>(null);
  const [pracuje, setPracuje] = useState<false | "zapis" | "druk">(false);
  const [zapisCrm, setZapisCrm] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [gotowe, setGotowe] = useState<string | null>(null);
  const [widok, setWidok] = useState<"formularz" | "podglad">("formularz");
  const zmieniono = useRef(false);

  // Szkic w przeglądarce: agent zaczyna umowę u klienta, kończy w biurze.
  // To tylko wygoda, więc każdy błąd dostępu do pamięci pomijamy.
  useEffect(() => {
    if (startKlient || startOferta) return;
    try {
      const raw = localStorage.getItem(kluczSzkicu);
      if (raw) setSzkic(JSON.parse(raw) as Dane);
    } catch {}
  }, [kluczSzkicu, startKlient, startOferta]);

  useEffect(() => {
    if (!zmieniono.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(kluczSzkicu, JSON.stringify(d));
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [d, kluczSzkicu]);

  function set(k: string, v: Dane[string]) {
    zmieniono.current = true;
    setD((p) => ({ ...p, [k]: v }));
    setGotowe(null);
  }

  async function wczytajKlienta(id: string) {
    setKlient(id);
    setInfo(null);
    if (!id || !w.poleKlienta) return;
    const r = await klientDoDokumentu(id);
    if (!r.ok) return setBlad(r.error);
    const obecne = Array.isArray(d[w.poleKlienta]) ? (d[w.poleKlienta] as Strona[]) : [];
    const reszta = obecne.filter((s, i) => i > 0 && (s.imie.trim() || s.pesel.trim()));
    set(w.poleKlienta, [r.strona, ...reszta]);
    if (r.ukryte) setInfo("Biuro ukrywa dane klientów innych agentów, więc wpisałem tylko imię i nazwisko. PESEL i adres uzupełnij z klientem.");
  }

  async function wczytajOferte(id: string) {
    setOferta(id);
    if (!id || !w.zOferty) return;
    const r = await ofertaDoDokumentu(id);
    if (!r.ok) return setBlad(r.error);
    zmieniono.current = true;
    setD((p) => ({ ...p, ...polaZOferty(w, r.pola, p) }));
  }


  const dokument = useMemo(() => w.buduj(d, kontekst), [w, d, kontekst]);
  const tytulPliku = useMemo(() => {
    const osoba = w.poleKlienta && Array.isArray(d[w.poleKlienta]) ? (d[w.poleKlienta] as Strona[])[0]?.imie : "";
    return nazwaPliku(`${dokument.tytul}${osoba ? ` - ${osoba}` : ""}`);
  }, [dokument.tytul, d, w.poleKlienta]);

  async function zrob(tryb: "zapis" | "druk") {
    setBlad(null);
    setGotowe(null);
    setPracuje(tryb);
    try {
      const bytes = await generujDokumentPdf(dokument, stopka);
      if (tryb === "zapis") {
        pobierzPdf(bytes, tytulPliku);
        setGotowe("Plik zapisany w folderze pobranych.");
      } else {
        drukujPdf(bytes);
      }
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się przygotować dokumentu.");
    } finally {
      setPracuje(false);
    }
  }

  async function zapiszWCrm() {
    const entity = klient ? "client" : oferta ? "property" : null;
    const entityId = klient || oferta;
    if (!entity || !entityId) return;
    setBlad(null);
    setGotowe(null);
    setZapisCrm(true);
    try {
      const bytes = await generujDokumentPdf(dokument, stopka);
      const nazwa = `${tytulPliku}.pdf`;
      const signed = await signDocumentUploads(entity, entityId, [{ name: nazwa, size: bytes.length }]);
      if (!signed.ok) throw new Error(signed.error);
      const blob = new Blob([bytes.slice() as BlobPart], { type: "application/pdf" });
      await uploadToSignedUrl(signed.uploads[0].signedUrl, blob);
      const reg = await registerDocuments(entity, entityId, [
        { path: signed.uploads[0].path, name: nazwa, size: bytes.length, mime: "application/pdf", kind: rodzajWKarcie(wzorId) },
      ]);
      if (!reg.ok) throw new Error(reg.error);
      if (reg.docs[0]) await oznaczWzor(reg.docs[0].id, wzorId, d);
      setGotowe(entity === "client" ? "Dokument zapisany w karcie klienta." : "Dokument zapisany w karcie oferty.");
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się zapisać dokumentu.");
    } finally {
      setZapisCrm(false);
    }
  }

  function wyczysc() {
    try {
      localStorage.removeItem(kluczSzkicu);
    } catch {}
    zmieniono.current = false;
    const start = daneStartowe(w, dzis);
    if ("miasto" in start) start.miasto = kontekst.miasto;
    setD(start);
    setKlient("");
    setOferta("");
    setInfo(null);
    setGotowe(null);
  }

  const widoczneGrupy = w.grupy.filter((g) => !g.gdy || g.gdy(d));
  const nazwaKlienta = klienci.find((k) => k.id === klient)?.nazwa;
  const nazwaOferty = oferty.find((o) => o.id === oferta)?.nazwa;

  return (
    <div className="space-y-5">
      {szkic && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <span>Masz niedokończony szkic tego dokumentu.</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setD({ ...daneStartowe(w, dzis), ...szkic }); setSzkic(null); }}
              className="rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-500"
            >
              Wróć do szkicu
            </button>
            <button type="button" onClick={() => { setSzkic(null); wyczysc(); }} className="rounded-lg px-3 py-1.5 text-sky-800 hover:underline">
              Zacznij od nowa
            </button>
          </div>
        </div>
      )}

      {(w.poleKlienta || w.zOferty) && (klienci.length > 0 || oferty.length > 0) && (
        <Sekcja tytul="Uzupełnij z bazy" opis="Wybierz klienta i ofertę, a dane same wejdą do dokumentu. Możesz je potem poprawić.">
          <div className="grid gap-4 sm:grid-cols-2">
            {w.poleKlienta && klienci.length > 0 && (
              <Wybor etykieta="Klient" lista={klienci} wartosc={klient} onWybierz={wczytajKlienta} placeholder="Szukaj klienta…" />
            )}
            {w.zOferty && oferty.length > 0 && (
              <Wybor etykieta="Oferta" lista={oferty} wartosc={oferta} onWybierz={wczytajOferte} placeholder="Szukaj oferty po adresie…" />
            )}
          </div>
          {info && <p className="mt-3 text-sm text-amber-700">{info}</p>}
        </Sekcja>
      )}

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 lg:hidden" role="tablist">
        {(["formularz", "podglad"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={widok === t}
            onClick={() => setWidok(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${widok === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            {t === "formularz" ? "Formularz" : "Podgląd"}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className={`space-y-5 ${widok === "podglad" ? "hidden lg:block" : ""}`}>
          {dokument.uwagi && dokument.uwagi.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Zanim dasz do podpisu</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {dokument.uwagi.map((u) => <li key={u}>{u}</li>)}
              </ul>
            </div>
          )}

          {widoczneGrupy.map((g) => (
            <Sekcja key={g.tytul} tytul={g.tytul} opis={g.opis}>
              <div className="grid gap-4 sm:grid-cols-2">
                {g.pola.map((p) => (
                  <PoleFormularza key={p.k} p={p} d={d} set={set} />
                ))}
              </div>
            </Sekcja>
          ))}
        </div>

        <div className={`lg:sticky lg:top-4 ${widok === "formularz" ? "hidden lg:block" : ""}`}>
          <Podglad dokument={dokument} />
        </div>
      </div>

      <PasekAkcji onZapisz={() => zrob("zapis")} onDrukuj={() => zrob("druk")} pracuje={pracuje} blad={blad} gotowe={gotowe} />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {(klient || oferta) && (
          <button
            type="button"
            onClick={zapiszWCrm}
            disabled={zapisCrm || !!pracuje}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            {zapisCrm ? "Zapisuję…" : `Zapisz w karcie: ${klient ? nazwaKlienta ?? "klient" : nazwaOferty ?? "oferta"}`}
          </button>
        )}
        <button type="button" onClick={wyczysc} className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
          Wyczyść formularz
        </button>
      </div>
    </div>
  );
}

// ── Pola ───────────────────────────────────────────────────

function PoleFormularza({ p, d, set }: { p: PoleWzoru; d: Dane; set: (k: string, v: Dane[string]) => void }) {
  if (p.typ === "strony") {
    const lista = Array.isArray(d[p.k]) ? (d[p.k] as Strona[]) : [pustaStrona()];
    return <Osoby p={p} lista={lista} onZmiana={(l) => set(p.k, l)} />;
  }
  const v = typeof d[p.k] === "string" ? (d[p.k] as string) : "";
  const szer = p.szer === "cala" || p.typ === "opis" ? "sm:col-span-2" : "";

  if (p.typ === "wybor") {
    return (
      <div className={szer}>
        <label className="mb-1.5 block text-sm text-slate-500">{p.e}</label>
        <Select aria-label={p.e} value={v} onChange={(e) => set(p.k, e.target.value)} options={p.opcje.map((o) => ({ value: o.v, label: o.l }))} placeholder="" />
        {p.podp && <p className="mt-1.5 text-xs text-slate-400">{p.podp}</p>}
      </div>
    );
  }
  if (p.typ === "opis") {
    return (
      <div className={szer}>
        <label className="mb-1.5 block text-sm text-slate-500">{p.e}</label>
        <textarea value={v} rows={3} onChange={(e) => set(p.k, e.target.value)} placeholder={p.placeholder} className={pole} />
        {p.podp && <p className="mt-1.5 text-xs text-slate-400">{p.podp}</p>}
      </div>
    );
  }
  return (
    <div className={szer}>
      <Pole
        label={p.e}
        value={v}
        onChange={(x) => set(p.k, x)}
        type={p.typ === "data" ? "date" : "text"}
        placeholder={p.placeholder}
        hint={p.podp}
        maxLength={p.typ === "tekst" ? 300 : 40}
      />
    </div>
  );
}

function Osoby({ p, lista, onZmiana }: { p: Extract<PoleWzoru, { typ: "strony" }>; lista: Strona[]; onZmiana: (l: Strona[]) => void }) {
  const maks = p.maks ?? 4;
  function zmien(i: number, patch: Partial<Strona>) {
    const n = [...lista];
    n[i] = { ...n[i], ...patch };
    onZmiana(n);
  }
  return (
    <div className="space-y-4 sm:col-span-2">
      {p.podp && <p className="-mt-2 text-xs text-slate-400">{p.podp}</p>}
      {lista.map((s, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">{lista.length > 1 ? `${p.rola} ${i + 1}` : p.rola}</p>
            {lista.length > 1 && <PrzyciskUsun onClick={() => onZmiana(lista.filter((_, j) => j !== i))} tytul={`Usuń: ${p.rola} ${i + 1}`} />}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Pole label="Imię i nazwisko" value={s.imie} onChange={(v) => zmien(i, { imie: v })} maxLength={120} />
            </div>
            <Pole label="PESEL" value={s.pesel} onChange={(v) => zmien(i, { pesel: v.replace(/[^\d]/g, "").slice(0, 11) })} maxLength={11} />
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <div>
                <label className="mb-1.5 block text-sm text-slate-500">Dokument</label>
                <Select
                  aria-label="Rodzaj dokumentu"
                  value={s.dokument}
                  onChange={(e) => zmien(i, { dokument: e.target.value === "paszport" ? "paszport" : "dowod" })}
                  options={[{ value: "dowod", label: "Dowód" }, { value: "paszport", label: "Paszport" }]}
                  placeholder=""
                />
              </div>
              <Pole label="Seria i numer" value={s.nrDokumentu} onChange={(v) => zmien(i, { nrDokumentu: v.toUpperCase() })} maxLength={20} />
            </div>
            <div className="sm:col-span-2">
              <Pole label="Adres zamieszkania" value={s.adres} onChange={(v) => zmien(i, { adres: v })} maxLength={200} />
            </div>
          </div>
        </div>
      ))}
      {lista.length < maks && (
        <PrzyciskDodaj onClick={() => onZmiana([...lista, pustaStrona()])}>Dodaj osobę ({p.rola.toLowerCase()})</PrzyciskDodaj>
      )}
    </div>
  );
}

/** Wyszukiwarka z listą: przy kilkuset klientach zwykła lista wyboru jest nie do przewinięcia. */
function Wybor({
  etykieta, lista, wartosc, onWybierz, placeholder,
}: {
  etykieta: string;
  lista: Rekord[];
  wartosc: string;
  onWybierz: (id: string) => void;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const [otwarte, setOtwarte] = useState(false);
  const wybrany = lista.find((r) => r.id === wartosc);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
  const wyniki = useMemo(() => {
    const n = norm(q.trim());
    return (n ? lista.filter((r) => norm(`${r.nazwa} ${r.opis ?? ""}`).includes(n)) : lista).slice(0, 8);
  }, [q, lista]);

  if (wybrany) {
    return (
      <div>
        <label className="mb-1.5 block text-sm text-slate-500">{etykieta}</label>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm">
          <span className="min-w-0 truncate font-medium text-emerald-900">{wybrany.nazwa}</span>
          <button type="button" onClick={() => onWybierz("")} className="flex-shrink-0 text-xs text-emerald-700 hover:underline">
            Zmień
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm text-slate-500">{etykieta}</label>
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOtwarte(true); }}
        onFocus={() => setOtwarte(true)}
        onBlur={() => setTimeout(() => setOtwarte(false), 150)}
        placeholder={placeholder}
        className={pole}
        aria-label={etykieta}
      />
      {otwarte && wyniki.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg" role="listbox">
          {wyniki.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onWybierz(r.id); setQ(""); setOtwarte(false); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="block font-medium text-slate-800">{r.nazwa}</span>
                {r.opis && <span className="block truncate text-xs text-slate-400">{r.opis}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Podgląd ────────────────────────────────────────────────

function Podglad({ dokument }: { dokument: ReturnType<NonNullable<ReturnType<typeof znajdzWzor>>["buduj"]> }) {
  const wstep = [...dokument.wstep];
  const data = wstep[0] && /^[^*]+, dnia /.test(wstep[0]) ? wstep.shift() : null;
  return (
    <div className="max-h-[calc(100vh-2rem)] overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-3 sm:p-5">
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">Podgląd na żywo</p>
      <article className="mx-auto max-w-[640px] rounded-lg bg-white px-6 py-8 font-serif text-[13px] leading-relaxed text-slate-700 shadow-sm sm:px-10">
        {data && <p className="mb-6 text-right">{data}</p>}
        <h2 className="text-center font-sans text-base font-semibold uppercase tracking-wide text-slate-900">{dokument.tytul}</h2>
        <div className="mx-auto mb-6 mt-2 h-0.5 w-12 bg-emerald-500" />
        {wstep.map((w, i) =>
          w.includes("(dalej:") ? (
            <Blok key={i}><Bogaty t={w} /></Blok>
          ) : (
            <p key={i} className="mb-2 whitespace-pre-line"><Bogaty t={w} /></p>
          ),
        )}
        {dokument.paragrafy.map((p, i) => (
          <section key={i} className="mt-5">
            {p.tytul && <h3 className="mb-2 text-center font-sans text-[13px] font-semibold text-slate-900">{p.tytul}</h3>}
            {p.ustepy.map((u, j) => <p key={j} className="mb-2"><Bogaty t={u} /></p>)}
          </section>
        ))}
        <Podpisy p={dokument.podpisy} />
        {dokument.dodatki?.map((z, i) => (
          <section key={i} className="mt-10 border-t border-dashed border-slate-300 pt-8">
            <h3 className="mb-4 text-center font-sans text-sm font-semibold uppercase text-slate-900">{z.tytul}</h3>
            {z.akapity.filter((t) => t.trim()).map((t, j) => <p key={j} className="mb-2"><Bogaty t={t} /></p>)}
            {z.podpisy && <Podpisy p={z.podpisy} />}
          </section>
        ))}
      </article>
    </div>
  );
}

function Blok({ children }: { children: ReactNode }) {
  return <div className="mb-2 rounded-md bg-slate-50 px-3 py-2">{children}</div>;
}

function Podpisy({ p }: { p: [{ rola: string; osoby: string[] }, { rola: string; osoby: string[] }] }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-8 font-sans">
      {p.map((c, i) =>
        c.rola ? (
          <div key={i} className="text-center">
            <div className="border-t border-dashed border-slate-300" />
            <p className="mt-1.5 text-xs font-semibold text-slate-800">{c.rola}</p>
            <p className="text-[11px] text-slate-400">{c.osoby.filter(Boolean).join(", ") || (/^data\b/i.test(c.rola) ? "" : "(imię i nazwisko)")}</p>
          </div>
        ) : (
          <div key={i} />
        ),
      )}
    </div>
  );
}
