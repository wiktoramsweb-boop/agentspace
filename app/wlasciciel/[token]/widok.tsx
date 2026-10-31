"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LokalWlasciciela, MiesiacWlasciciela, WiadomoscWlasciciela, ZgloszenieWlasciciela } from "@/lib/data-wlasciciel";
import { nazwaOplaty } from "@/lib/najem-model";
import { decyzjaKoszt, linkDokumentu, napiszDoBiura, zglosUsterke } from "./actions";

const zl = (v: number) => `${v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
export const KARTA = "mb-3 rounded-2xl border border-[var(--linia)] bg-white p-4";
const PRZYCISK = "rounded-xl bg-[var(--t)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40";
const nazwaMiesiaca = (m: string) => new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T12:00:00Z`));

function Wiersz({ e, v, mocny }: { e: string; v: string; mocny?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 py-1.5 text-sm ${mocny ? "font-bold" : ""}`}>
      <span className={mocny ? "" : "text-[var(--t2)]"}>{e}</span>
      <span className="flex-shrink-0 tabular-nums">{v}</span>
    </div>
  );
}

export function KartaMiesiaca({ m, biuro, wlasciciel, najemca, dni }: { m: MiesiacWlasciciela; biuro: string; wlasciciel: string; najemca: string; dni: number }) {
  const [otwarty, setOtwarty] = useState(false);
  const netto = m.r.wplaty - m.r.prowizja - m.r.koszty;
  async function pdf() {
    const { rozliczeniePdf } = await import("@/lib/najem-pdf");
    const b = await rozliczeniePdf({ biuro, adres: m.lokal, wlasciciel, najemca, miesiac: m.r.miesiac, model: m.model, modelNazwa: "", prowizjaPct: m.prowizjaPct, r: m.r, czynszWplata: m.czynsz, oplatyWplata: m.oplatyWplata, kosztyOpis: m.kosztyOpis, kaucja: m.kaucja, dniNaZastrzezenia: dni, pozycje: m.pozycje });
    const url = URL.createObjectURL(new Blob([b as BlobPart], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rozliczenie-${m.r.miesiac}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  return (
    <section className={KARTA}>
      <button type="button" aria-expanded={otwarty} onClick={() => setOtwarty((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="min-w-0">
          <b className="block capitalize">{nazwaMiesiaca(m.r.miesiac)}</b>
          <small className="block truncate text-[var(--t2)]">{m.lokal}</small>
        </span>
        <span className="flex-shrink-0 text-right">
          <b className="block tabular-nums">{zl(netto)}</b>
          <small className={m.r.zaleglosc > 0 ? "text-[var(--bursztyn)]" : "text-[var(--zielen)]"}>{m.r.zaleglosc > 0 ? `brakuje ${zl(m.r.zaleglosc)}` : "rozliczone"}</small>
        </span>
      </button>
      {otwarty && (
        <div className="mt-3 border-t border-[var(--linia)] pt-2">
          <Wiersz e="Czynsz najmu wpłacony" v={zl(m.czynsz)} />
          <Wiersz e="Opłaty i media wpłacone" v={zl(m.oplatyWplata)} />
          {m.pozycje.map((p) => (
            <Wiersz key={p.id} e={`${nazwaOplaty(p.rodzaj)}${p.okres_mies > 1 ? ` za ${p.okres_mies} mies.` : ""}${p.biuro_oplaca ? " (opłaciło biuro)" : p.najemca_placi ? " (płaci najemca)" : " (po Twojej stronie)"}`} v={zl(p.kwota)} />
          ))}
          <Wiersz e={`Prowizja ${m.prowizjaPct}%`} v={`- ${zl(m.r.prowizja)}`} />
          {m.r.koszty > 0 && <Wiersz e={`Koszty i naprawy${m.kosztyOpis ? `: ${m.kosztyOpis}` : ""}`} v={`- ${zl(m.r.koszty)}`} />}
          <Wiersz e={m.model === "A" ? "Przelew do Ciebie" : "Prowizja i koszty do zapłaty"} v={zl(m.model === "A" ? m.r.doPrzekazania : m.r.doZaplatyPrzezWlasciciela)} mocny />
          {m.przekazano && <p className="text-xs text-[var(--t2)]">Przelew wykonano {m.przekazano.split("-").reverse().join(".")}</p>}
          <button type="button" onClick={pdf} className="mt-2 text-sm font-semibold text-[var(--akcent)]">
            Pobierz PDF
          </button>
        </div>
      )}
    </section>
  );
}

export function ZestawienieRoczne({ rok, biuro, wlasciciel, lokale }: { rok: number; biuro: string; wlasciciel: string; lokale: LokalWlasciciela[] }) {
  const dane = lokale.map((l) => {
    const m = l.miesiace.filter((x) => x.r.miesiac.startsWith(String(rok)));
    const s = (f: (x: MiesiacWlasciciela) => number) => m.reduce((a, x) => a + f(x), 0);
    return { adres: l.adres, czynsz: s((x) => x.czynsz), oplaty: s((x) => x.oplatyWplata), prowizja: s((x) => x.r.prowizja), koszty: s((x) => x.r.koszty), netto: s((x) => x.r.wplaty - x.r.prowizja - x.r.koszty) };
  });
  const netto = dane.reduce((a, d) => a + d.netto, 0);
  async function pdf() {
    const { rocznePdf } = await import("@/lib/najem-pdf");
    const b = await rocznePdf({ biuro, wlasciciel, rok, lokale: dane });
    const url = URL.createObjectURL(new Blob([b as BlobPart], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `zestawienie-${rok}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  return (
    <section className={KARTA}>
      <small className="text-[var(--t2)]">Zostało dla Ciebie w {rok}</small>
      <p className="text-3xl font-bold tabular-nums">{zl(netto)}</p>
      <button type="button" onClick={pdf} className="mt-2 text-sm font-semibold text-[var(--akcent)]">
        Pobierz zestawienie roczne do księgowości
      </button>
    </section>
  );
}

export function NoweZgloszenie({ token, lokale }: { token: string; lokale: { id: string; adres: string }[] }) {
  const router = useRouter();
  const [t, setT] = useState("");
  const [lokal, setLokal] = useState(lokale[0]?.id ?? "");
  const [info, setInfo] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className={KARTA}>
      <b>Zgłoś sprawę do biura</b>
      {lokale.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {lokale.map((l) => (
            <button key={l.id} type="button" aria-pressed={lokal === l.id} onClick={() => setLokal(l.id)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${lokal === l.id ? "bg-[var(--t)] text-white" : "bg-[var(--tlo2)] text-[var(--t2)]"}`}>
              {l.adres}
            </button>
          ))}
        </div>
      )}
      <textarea value={t} onChange={(e) => setT(e.target.value)} rows={3} maxLength={300} placeholder="Co się stało?" className="mt-2 w-full rounded-xl border border-[var(--linia)] p-3 text-sm outline-none focus:border-[var(--akcent)]" />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          disabled={pending || t.trim().length < 3}
          onClick={() =>
            start(async () => {
              const w = await zglosUsterke(token, lokal, t);
              setInfo(w.ok ? "Wysłane. Biuro już to widzi." : (w.blad ?? "Nie udało się."));
              if (w.ok) setT("");
              router.refresh();
            })
          }
          className={PRZYCISK}
        >
          Wyślij
        </button>
        {info && <small className="text-[var(--t2)]">{info}</small>}
      </div>
    </section>
  );
}

const STANY: Record<string, string> = { otwarte: "Zgłoszone", w_toku: "W naprawie", zamkniete: "Zakończone" };

export function ListaZgloszen({ token, lista }: { token: string; lista: ZgloszenieWlasciciela[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const decyzja = (id: string, tak: boolean) =>
    start(async () => {
      await decyzjaKoszt(token, id, tak);
      router.refresh();
    });
  if (!lista.length) return <p className="py-6 text-center text-sm text-[var(--t2)]">Brak zgłoszeń. Wszystko w porządku.</p>;
  return (
    <>
      {lista.map((z) => (
        <section key={z.id} className={KARTA}>
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <b className="block">{z.tytul}</b>
              <small className="block truncate text-[var(--t2)]">{z.lokal}</small>
            </span>
            <small className={`flex-shrink-0 rounded-md px-2 py-0.5 font-semibold ${z.stan === "zamkniete" ? "bg-[var(--zielen-tlo)] text-[var(--zielen)]" : "bg-[var(--bursztyn-tlo)] text-[var(--bursztyn)]"}`}>{STANY[z.stan] ?? z.stan}</small>
          </div>
          {z.koszt != null && <p className="mt-1 text-sm tabular-nums">Koszt: {zl(Number(z.koszt))}</p>}
          {z.zgoda === "oczekuje" && (
            <div className="mt-2 rounded-xl bg-[var(--bursztyn-tlo)] p-3">
              <p className="text-sm font-semibold">Ten koszt jest powyżej limitu i czeka na Twoją zgodę.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={pending} onClick={() => decyzja(z.id, true)} className={PRZYCISK}>
                  Zgadzam się
                </button>
                <button type="button" disabled={pending} onClick={() => decyzja(z.id, false)} className="rounded-xl border border-[var(--linia)] bg-white px-4 py-2.5 text-sm font-semibold">
                  Nie zgadzam się
                </button>
              </div>
            </div>
          )}
          {z.zgoda === "zatwierdzona" && <small className="mt-1 block text-[var(--zielen)]">Zatwierdzone przez Ciebie</small>}
          {z.zgoda === "odrzucona" && <small className="mt-1 block text-[var(--czerwien)]">Odrzucone przez Ciebie</small>}
        </section>
      ))}
    </>
  );
}

export function PobierzDokument({ token, id, nazwa }: { token: string; id: string; nazwa: string }) {
  const [blad, setBlad] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const u = await linkDokumentu(token, id);
        if (u) window.open(u, "_blank", "noopener");
        else setBlad(true);
      }}
      className="block w-full truncate text-left font-semibold text-[var(--akcent)]"
    >
      {blad ? "Nie udało się otworzyć" : nazwa}
    </button>
  );
}

export function Rozmowa({ token, lista }: { token: string; lista: WiadomoscWlasciciela[] }) {
  const router = useRouter();
  const [t, setT] = useState("");
  const [pending, start] = useTransition();
  return (
    <>
      <div className="mb-3 space-y-2">
        {lista.length === 0 && <p className="py-6 text-center text-sm text-[var(--t2)]">Napisz do biura, odpowiemy tutaj.</p>}
        {lista.map((w) => (
          <p key={w.id} className={`w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${w.autor === "wlasciciel" ? "ml-auto bg-[var(--t)] text-white" : "bg-[var(--tlo2)]"}`}>
            {w.tresc}
          </p>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <textarea value={t} onChange={(e) => setT(e.target.value)} rows={2} maxLength={2000} placeholder="Napisz wiadomość" className="min-w-0 flex-1 rounded-xl border border-[var(--linia)] p-3 text-sm outline-none focus:border-[var(--akcent)]" />
        <button
          type="button"
          disabled={pending || !t.trim()}
          onClick={() =>
            start(async () => {
              await napiszDoBiura(token, t);
              setT("");
              router.refresh();
            })
          }
          className={PRZYCISK}
        >
          Wyślij
        </button>
      </div>
    </>
  );
}
