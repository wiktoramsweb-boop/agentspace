"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { uploadToSignedUrl } from "@/lib/photo-process";
import { Avatar } from "../components/avatar";
import { Modal } from "../components/modal";
import { useToast } from "../components/toast";
import { pole } from "../dokumenty-wzory/klocki";
import {
  edytuj,
  nowaGrupa,
  przygotujZalaczniki,
  szukajRekordow,
  usun,
  wyslij,
  type Odnosnik,
  type Wiadomosc,
  type Zalacznik,
} from "./actions";
import type { Osoba } from "./czat";

const DZIEN_MS = 86_400_000;

function dzienEtykieta(iso: string): string {
  const d = new Date(iso);
  const klucz = (x: Date) => x.toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" });
  if (klucz(d) === klucz(new Date())) return "Dziś";
  if (klucz(d) === klucz(new Date(Date.now() - DZIEN_MS))) return "Wczoraj";
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Warsaw" });
}
function godzina(iso: string): string {
  return new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
}
function dzienKlucz(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" });
}
function rozmiar(b: number): string {
  if (b > 1024 * 1024) return `${(b / 1024 / 1024).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(b / 1024))} kB`;
}

/** Linki i @wzmianki w treści, bez wstrzykiwania HTML. */
function Tresc({ tekst }: { tekst: string }) {
  const czesci = tekst.split(/(https?:\/\/[^\s]+|@[\p{L}]+(?:\s[\p{L}]+)?)/gu);
  return (
    <>
      {czesci.map((c, i) => {
        if (/^https?:\/\//.test(c)) {
          return (
            <a key={i} href={c} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-emerald-700 underline decoration-emerald-500/40 underline-offset-2">
              {c}
            </a>
          );
        }
        if (c.startsWith("@")) return <span key={i} className="rounded bg-emerald-100 px-1 font-medium text-emerald-700">{c}</span>;
        return <Fragment key={i}>{c}</Fragment>;
      })}
    </>
  );
}

function KartaOdnosnika({ r }: { r: Odnosnik }) {
  return (
    <Link
      href={r.typ === "oferta" ? `/app/nieruchomosci/${r.id}` : `/app/klienci/${r.id}`}
      className="mt-2 flex max-w-sm items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 pr-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      {r.zdjecie ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.zdjecie} alt="" className="h-14 w-20 flex-shrink-0 rounded-lg object-cover" />
      ) : (
        <span className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${r.typ === "oferta" ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"}`}>
          {r.typ === "oferta" ? "Oferta" : "Klient"}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-900">{r.tytul}</span>
        {r.opis && <span className="block truncate text-xs text-slate-500">{r.opis}</span>}
      </span>
    </Link>
  );
}

function Zalaczniki({ lista }: { lista: Zalacznik[] }) {
  const obrazy = lista.filter((a) => a.mime.startsWith("image/") && a.url);
  const pliki = lista.filter((a) => !(a.mime.startsWith("image/") && a.url));
  return (
    <div className="mt-2 space-y-2">
      {obrazy.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {obrazy.map((a) => (
            <a key={a.path} href={a.url!} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url!} alt={a.name} className="max-h-48 max-w-[260px] rounded-xl border border-slate-200 object-cover" />
            </a>
          ))}
        </div>
      )}
      {pliki.map((a) => (
        <a
          key={a.path}
          href={a.url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-slate-300"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold uppercase text-slate-500">
            {a.name.split(".").pop()?.slice(0, 4)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-slate-800">{a.name}</span>
            <span className="text-xs text-slate-500">{rozmiar(a.size)}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

export function ListaWiadomosci({
  lista,
  ja,
  osoba,
  onZmiana,
  onOdpowiedz,
}: {
  lista: Wiadomosc[];
  ja: string;
  osoba: Map<string, Osoba>;
  onZmiana: () => void;
  onOdpowiedz: (w: Wiadomosc) => void;
}) {
  const toast = useToast();
  const [edycja, setEdycja] = useState<{ id: string; tekst: string } | null>(null);
  const [, startTransition] = useTransition();
  const poId = new Map(lista.map((w) => [w.id, w]));

  return (
    <div className="space-y-0.5">
      {lista.map((w, i) => {
        const poprz = lista[i - 1];
        const nowyDzien = !poprz || dzienKlucz(poprz.created_at) !== dzienKlucz(w.created_at);
        const ciag =
          !nowyDzien &&
          poprz?.author_id === w.author_id &&
          Date.parse(w.created_at) - Date.parse(poprz.created_at) < 5 * 60_000 &&
          !w.reply_to;
        const autor = osoba.get(w.author_id ?? "");
        const moja = w.author_id === ja;
        const cytat = w.reply_to ? poId.get(w.reply_to) : null;
        return (
          <Fragment key={w.id}>
            {nowyDzien && (
              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium capitalize text-slate-400">{dzienEtykieta(w.created_at)}</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            )}
            <div className={`group relative flex gap-3 rounded-xl px-2 transition hover:bg-slate-50 ${ciag ? "py-0.5" : "pt-2 pb-1"}`}>
              <div className="w-9 flex-shrink-0">
                {!ciag && <Avatar name={autor?.name ?? "Osoba"} path={autor?.avatar} size={36} />}
              </div>
              <div className="min-w-0 flex-1">
                {!ciag && (
                  <p className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-slate-900">{autor?.name ?? "Była osoba z zespołu"}</span>
                    <span className="text-[11px] text-slate-400">{godzina(w.created_at)}</span>
                  </p>
                )}
                {cytat && (
                  <p className="mb-1 mt-0.5 border-l-2 border-slate-300 pl-2 text-xs text-slate-500">
                    <span className="font-medium">{osoba.get(cytat.author_id ?? "")?.name ?? "Osoba"}:</span>{" "}
                    {cytat.deleted_at ? "wiadomość usunięta" : cytat.body.slice(0, 120) || "załącznik"}
                  </p>
                )}
                {w.deleted_at ? (
                  <p className="text-sm italic text-slate-400">Wiadomość usunięta</p>
                ) : edycja?.id === w.id ? (
                  <div className="mt-1">
                    <textarea
                      value={edycja.tekst}
                      onChange={(e) => setEdycja({ id: w.id, tekst: e.target.value })}
                      rows={2}
                      className={pole}
                      autoFocus
                    />
                    <div className="mt-1.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            const r = await edytuj(w.id, edycja.tekst);
                            if (!r.ok) toast(r.error, "error");
                            setEdycja(null);
                            onZmiana();
                          })
                        }
                        className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Zapisz
                      </button>
                      <button type="button" onClick={() => setEdycja(null)} className="rounded-lg px-3 py-1 text-xs text-slate-500 hover:bg-slate-100">
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {w.body && (
                      <p className="whitespace-pre-wrap break-words text-[0.9375rem] leading-relaxed text-slate-800">
                        <Tresc tekst={w.body} />
                        {w.edited_at && <span className="ml-1 text-[11px] text-slate-400">(edytowano)</span>}
                      </p>
                    )}
                    {w.refs?.map((r) => <KartaOdnosnika key={`${r.typ}-${r.id}`} r={r} />)}
                    {w.attachments?.length > 0 && <Zalaczniki lista={w.attachments} />}
                  </>
                )}
              </div>
              {!w.deleted_at && edycja?.id !== w.id && (
                <div className="absolute -top-3 right-2 hidden gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm group-hover:flex">
                  <Akcja onClick={() => onOdpowiedz(w)}>Odpowiedz</Akcja>
                  {moja && <Akcja onClick={() => setEdycja({ id: w.id, tekst: w.body })}>Edytuj</Akcja>}
                  {moja && (
                    <Akcja
                      onClick={() => {
                        if (!confirm("Usunąć wiadomość?")) return;
                        startTransition(async () => {
                          const r = await usun(w.id);
                          if (!r.ok) toast(r.error, "error");
                          onZmiana();
                        });
                      }}
                    >
                      Usuń
                    </Akcja>
                  )}
                </div>
              )}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function Akcja({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
      {children}
    </button>
  );
}

export function Pisanie({
  kanalId,
  ludzie,
  odpowiedzNa,
  autorOdpowiedzi,
  anulujOdpowiedz,
  onWyslano,
}: {
  kanalId: string;
  ludzie: Osoba[];
  odpowiedzNa: Wiadomosc | null;
  autorOdpowiedzi: string;
  anulujOdpowiedz: () => void;
  onWyslano: (w: Wiadomosc) => void;
}) {
  const toast = useToast();
  const [tekst, setTekst] = useState("");
  const [refs, setRefs] = useState<Odnosnik[]>([]);
  const [zal, setZal] = useState<Zalacznik[]>([]);
  const [wgrywa, setWgrywa] = useState(false);
  const [wybor, setWybor] = useState(false);
  const [wzmianka, setWzmianka] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pole_ = useRef<HTMLTextAreaElement>(null);
  const plik = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = pole_.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [tekst]);

  useEffect(() => {
    if (odpowiedzNa) pole_.current?.focus();
  }, [odpowiedzNa]);

  function zmienTekst(v: string) {
    setTekst(v);
    const m = v.slice(0, pole_.current?.selectionStart ?? v.length).match(/@([\p{L}]*)$/u);
    setWzmianka(m ? m[1] : null);
  }

  function wstawWzmianke(o: Osoba) {
    const el = pole_.current;
    const kursor = el?.selectionStart ?? tekst.length;
    const przed = tekst.slice(0, kursor).replace(/@[\p{L}]*$/u, `@${o.name} `);
    setTekst(przed + tekst.slice(kursor));
    setWzmianka(null);
    requestAnimationFrame(() => el?.focus());
  }

  async function wgraj(pliki: FileList | null) {
    if (!pliki?.length) return;
    const lista = [...pliki].slice(0, 10);
    setWgrywa(true);
    try {
      const r = await przygotujZalaczniki(kanalId, lista.map((f) => ({ name: f.name, size: f.size })));
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      for (let i = 0; i < lista.length; i++) await uploadToSignedUrl(r.uploads[i].signedUrl, lista[i]);
      setZal((z) => [
        ...z,
        ...lista.map((f, i) => ({ path: r.uploads[i].path, name: f.name, mime: f.type || "application/octet-stream", size: f.size })),
      ]);
    } catch {
      toast("Nie udało się wgrać pliku.", "error");
    } finally {
      setWgrywa(false);
      if (plik.current) plik.current.value = "";
    }
  }

  function wyslijTeraz() {
    if (pending || wgrywa) return;
    if (!tekst.trim() && !refs.length && !zal.length) return;
    const dane = { channelId: kanalId, body: tekst, refs, attachments: zal, replyTo: odpowiedzNa?.id ?? null };
    setTekst("");
    setRefs([]);
    setZal([]);
    startTransition(async () => {
      const w = await wyslij(dane);
      if (w.ok) onWyslano(w.wiadomosc);
      else {
        toast(w.error, "error");
        setTekst(dane.body);
        setRefs(dane.refs);
        setZal(dane.attachments);
      }
    });
  }

  const pasujacy = wzmianka !== null
    ? ludzie.filter((l) => l.name.toLocaleLowerCase("pl-PL").includes(wzmianka.toLocaleLowerCase("pl-PL"))).slice(0, 6)
    : [];

  return (
    <div className="border-t border-slate-200 p-3">
      {odpowiedzNa && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
          <span className="truncate">
            Odpowiedź do <span className="font-semibold">{autorOdpowiedzi}</span>: {odpowiedzNa.body.slice(0, 80) || "załącznik"}
          </span>
          <button type="button" onClick={anulujOdpowiedz} className="font-medium text-slate-500 hover:text-slate-800">Anuluj</button>
        </div>
      )}
      {(refs.length > 0 || zal.length > 0) && (
        <div className="mb-2 flex flex-wrap gap-2">
          {refs.map((r) => (
            <span key={`${r.typ}-${r.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              {r.typ === "oferta" ? "Oferta" : "Klient"}: {r.tytul}
              <button type="button" onClick={() => setRefs((x) => x.filter((y) => y !== r))} className="text-slate-400 hover:text-slate-700" aria-label="Usuń">×</button>
            </span>
          ))}
          {zal.map((a) => (
            <span key={a.path} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              {a.name}
              <button type="button" onClick={() => setZal((x) => x.filter((y) => y !== a))} className="text-slate-400 hover:text-slate-700" aria-label="Usuń">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2 rounded-2xl border border-slate-300 bg-white px-2 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15">
        {pasujacy.length > 0 && (
          <div className="absolute bottom-full left-2 mb-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {pasujacy.map((o) => (
              <button key={o.id} type="button" onClick={() => wstawWzmianke(o)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100">
                <Avatar name={o.name} path={o.avatar} size={22} /> {o.name}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => plik.current?.click()}
          disabled={wgrywa}
          title="Dołącz plik"
          aria-label="Dołącz plik"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          {wgrywa ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg>
          )}
        </button>
        <input ref={plik} type="file" multiple hidden onChange={(e) => void wgraj(e.target.files)} />
        <button
          type="button"
          onClick={() => setWybor(true)}
          title="Wklej kartę klienta albo oferty"
          aria-label="Wklej kartę klienta albo oferty"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" /></svg>
        </button>
        <textarea
          ref={pole_}
          value={tekst}
          onChange={(e) => zmienTekst(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (pasujacy.length > 0) wstawWzmianke(pasujacy[0]);
              else wyslijTeraz();
            }
            if (e.key === "Escape") setWzmianka(null);
          }}
          rows={1}
          placeholder="Napisz wiadomość. @ oznacza osobę, Shift+Enter nowa linia"
          className="max-h-[180px] min-h-[36px] flex-1 resize-none bg-transparent px-1 py-2 text-[0.9375rem] text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={wyslijTeraz}
          disabled={pending || wgrywa || (!tekst.trim() && !refs.length && !zal.length)}
          aria-label="Wyślij"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
        </button>
      </div>

      {wybor && <WyborRekordu onClose={() => setWybor(false)} onWybierz={(r) => { setRefs((x) => (x.some((y) => y.id === r.id) ? x : [...x, r].slice(0, 5))); setWybor(false); }} />}
    </div>
  );
}

function WyborRekordu({ onClose, onWybierz }: { onClose: () => void; onWybierz: (r: Odnosnik) => void }) {
  const [q, setQ] = useState("");
  const [wyniki, setWyniki] = useState<Odnosnik[]>([]);
  const [szuka, setSzuka] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSzuka(true);
      void szukajRekordow(q).then((r) => {
        setWyniki(r);
        setSzuka(false);
      });
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Modal title="Wklej kartę do wiadomości" onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-slate-200 px-6 py-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj oferty (adres, numer) albo klienta…" className={pole} autoFocus />
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {szuka && wyniki.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">Szukam…</li>}
          {!szuka && wyniki.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">Nic nie znaleziono.</li>}
          {wyniki.map((r) => (
            <li key={`${r.typ}-${r.id}`}>
              <button type="button" onClick={() => onWybierz(r)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-100">
                {r.zdjecie ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.zdjecie} alt="" className="h-10 w-14 rounded-lg object-cover" />
                ) : (
                  <span className={`flex h-10 w-14 items-center justify-center rounded-lg text-[10px] font-semibold ${r.typ === "oferta" ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"}`}>
                    {r.typ === "oferta" ? "Oferta" : "Klient"}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">{r.tytul}</span>
                  {r.opis && <span className="block truncate text-xs text-slate-500">{r.opis}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

export function NowaGrupa({ ludzie, onClose, onUtworzono }: { ludzie: Osoba[]; onClose: () => void; onUtworzono: (id: string) => void }) {
  const [nazwa, setNazwa] = useState("");
  const [osoby, setOsoby] = useState<string[]>([]);
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <Modal title="Nowa grupa" onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Nazwa</label>
            <input value={nazwa} onChange={(e) => setNazwa(e.target.value)} maxLength={60} placeholder="Np. Zespół Bronowice" className={pole} autoFocus />
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Kto należy do grupy</p>
            <div className="flex flex-wrap gap-2">
              {ludzie.map((l) => {
                const on = osoby.includes(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setOsoby((x) => (on ? x.filter((y) => y !== l.id) : [...x, l.id]))}
                    className={`inline-flex items-center gap-2 rounded-xl border py-1 pl-1 pr-3 text-sm transition ${on ? "border-emerald-500 bg-emerald-100 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    <Avatar name={l.name} path={l.avatar} size={24} />
                    {l.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const w = await nowaGrupa(nazwa, osoby);
                if (w.ok) onUtworzono(w.id);
                else setBlad(w.error);
              })
            }
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
          >
            Załóż grupę
          </button>
          {blad && <p className="text-sm text-red-600">{blad}</p>}
        </div>
      </div>
    </Modal>
  );
}
