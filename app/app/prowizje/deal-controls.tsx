"use client";

import { SubmitButton } from "../components/submit-button";

import { useMemo, useRef, useState } from "react";
import { createDeal, updateDeal, setDealStatus, deleteDeal } from "./actions";
import type { Deal, DealStatus } from "@/lib/types";
import { formatPln } from "@/lib/format";
import { Modal } from "../components/modal";
import { useToast } from "../components/toast";

/** Oferta do wyboru w formularzu. Pola poza id/tytułem są opcjonalne (np. karta oferty podaje mniej). */
export type OfertaDoWyboru = {
  id: string;
  tytul: string;
  adres?: string;
  cena: number | null;
  rodzaj?: "sprzedaz" | "wynajem";
  wlascicielId?: string | null;
};
export type KlientDoWyboru = { id: string; nazwa: string; typ?: string };
export type StartTransakcji = { ofertaId?: string; klientId?: string };
/** Transakcja do poprawienia, z ofertą i klientem do pokazania, gdyby nie było ich na listach. */
export type EdycjaTransakcji = { deal: Deal; oferta?: OfertaDoWyboru | null; klient?: KlientDoWyboru | null };

type Mode = "pln" | "pct";
type Party = { val: string; mode: Mode };
type Rodzaj = "sprzedaz" | "wynajem";

const PARTY_DEFS = [
  { key: "seller", name: "commission_seller", label: "Od sprzedającego", rodzaj: "sprzedaz" },
  { key: "buyer", name: "commission_buyer", label: "Od kupującego", rodzaj: "sprzedaz" },
  { key: "landlord", name: "commission_landlord", label: "Od wynajmującego", rodzaj: "wynajem" },
  { key: "tenant", name: "commission_tenant", label: "Od najemcy", rodzaj: "wynajem" },
] as const;

type PartyKey = (typeof PARTY_DEFS)[number]["key"];

const POLE =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

/** Kwoty tolerują przecinek (klawiatura PL) i spacje. */
function liczba(v: string): number {
  return parseFloat(v.replace(",", ".").replace(/\s/g, "")) || 0;
}

/**
 * Zapisana kwota strony z powrotem do pola. W bazie trzymamy złotówki, ale
 * jeśli to równy procent ceny (np. 2,5%), pokazujemy procent, bo tak agent ją wpisał.
 */
function poleStrony(kwota: number, cena: number, domyslny: Mode): Party {
  if (!kwota) return { val: "", mode: domyslny };
  if (cena > 0) {
    const pct = Math.round((kwota / cena) * 10000) / 100;
    if (pct > 0 && pct <= 10 && Math.round((cena * pct) / 100) === kwota) {
      return { val: String(pct).replace(".", ","), mode: "pct" };
    }
  }
  return { val: String(kwota), mode: "pln" };
}

/** Przycisk „Edytuj” otwierający formularz z wpisanymi danymi transakcji. */
export function EdytujTransakcjeButton({
  edycja,
  oferty = [],
  klienci = [],
  defaultSplit = 50,
  className,
}: {
  edycja: EdycjaTransakcji;
  oferty?: OfertaDoWyboru[];
  klienci?: KlientDoWyboru[];
  defaultSplit?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
        }
      >
        Edytuj
      </button>
      {open && (
        <NowaTransakcja
          oferty={oferty}
          klienci={klienci}
          defaultSplit={defaultSplit}
          edycja={edycja}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/** Przycisk otwierający formularz. Używany w karcie oferty i tam, gdzie nie ma panelu Prowizji. */
export function NewDealButton({
  properties = [],
  klienci = [],
  defaultSplit = 50,
}: {
  properties?: { id: string; title: string; price_pln: number | null }[];
  klienci?: KlientDoWyboru[];
  defaultSplit?: number;
}) {
  const [open, setOpen] = useState(false);
  const oferty = useMemo<OfertaDoWyboru[]>(
    () => properties.map((p) => ({ id: p.id, tytul: p.title, cena: p.price_pln })),
    [properties],
  );
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
      >
        + Dodaj transakcję
      </button>
      {open && (
        <NowaTransakcja
          oferty={oferty}
          klienci={klienci}
          defaultSplit={defaultSplit}
          start={oferty.length === 1 ? { ofertaId: oferty[0].id } : undefined}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Formularz nowej transakcji. Wybór oferty uzupełnia opis, cenę, rodzaj
 * i właściciela; wybór klienta podpowiada jego oferty. Dzięki temu agent
 * zwykle wpisuje tylko procent prowizji.
 */
export function NowaTransakcja({
  oferty,
  klienci,
  defaultSplit,
  start,
  edycja,
  onClose,
}: {
  oferty: OfertaDoWyboru[];
  klienci: KlientDoWyboru[];
  defaultSplit: number;
  start?: StartTransakcji;
  /** Gdy podane, formularz poprawia istniejącą transakcję zamiast dodawać nową. */
  edycja?: EdycjaTransakcji;
  onClose: () => void;
}) {
  // Obecna oferta i klient edytowanej transakcji muszą być do wyboru, inaczej zapis by je wyczyścił.
  const ofertyLista = useMemo(
    () => (edycja?.oferta && !oferty.some((o) => o.id === edycja.oferta!.id) ? [edycja.oferta, ...oferty] : oferty),
    [oferty, edycja],
  );
  const klienciLista = useMemo(
    () => (edycja?.klient && !klienci.some((k) => k.id === edycja.klient!.id) ? [edycja.klient, ...klienci] : klienci),
    [klienci, edycja],
  );
  return (
    <FormularzTransakcji
      oferty={ofertyLista}
      klienci={klienciLista}
      defaultSplit={defaultSplit}
      start={start}
      edycja={edycja}
      onClose={onClose}
    />
  );
}

function FormularzTransakcji({
  oferty,
  klienci,
  defaultSplit,
  start,
  edycja,
  onClose,
}: {
  oferty: OfertaDoWyboru[];
  klienci: KlientDoWyboru[];
  defaultSplit: number;
  start?: StartTransakcji;
  edycja?: EdycjaTransakcji;
  onClose: () => void;
}) {
  const toast = useToast();
  const [saveError, setSaveError] = useState<string | null>(null);
  // Start z podpowiedzi albo z karty oferty: formularz od razu wypełniony.
  const [poczatek] = useState(() => {
    if (edycja) {
      const d = edycja.deal;
      const cena = d.transaction_value_pln ?? 0;
      const najem = d.commission_landlord_pln + d.commission_tenant_pln > 0;
      const sprzedaz = d.commission_seller_pln + d.commission_buyer_pln > 0;
      const o = oferty.find((x) => x.id === d.property_id);
      const rodzaj: Rodzaj = najem ? "wynajem" : sprzedaz ? "sprzedaz" : o?.rodzaj ?? "sprzedaz";
      // Starsze transakcje mają tylko łączną prowizję, bez podziału na strony.
      // Wpisujemy ją do pierwszej strony, inaczej zapis wyzerowałby kwotę.
      const bezStron = !najem && !sprzedaz && d.commission_pln > 0;
      const seller = bezStron && rodzaj === "sprzedaz" ? d.commission_pln : d.commission_seller_pln;
      const landlord = bezStron && rodzaj === "wynajem" ? d.commission_pln : d.commission_landlord_pln;
      return {
        ofertaId: d.property_id ?? "",
        klientId: d.client_id ?? "",
        rodzaj,
        tx: d.transaction_value_pln != null ? String(d.transaction_value_pln) : "",
        title: d.title,
        split: String(d.agent_split_pct || defaultSplit),
        extras: d.extras_pln ? String(d.extras_pln) : "",
        parties: {
          seller: poleStrony(seller, cena, "pct"),
          buyer: poleStrony(d.commission_buyer_pln, cena, "pct"),
          landlord: poleStrony(landlord, cena, "pln"),
          tenant: poleStrony(d.commission_tenant_pln, cena, "pln"),
        },
      };
    }
    const o = start?.ofertaId ? oferty.find((x) => x.id === start.ofertaId) : undefined;
    const r: Rodzaj = o?.rodzaj ?? "sprzedaz";
    const wlasc = o?.wlascicielId && klienci.some((k) => k.id === o.wlascicielId) ? o.wlascicielId : "";
    return {
      ofertaId: o?.id ?? "",
      klientId: start?.klientId ?? wlasc,
      rodzaj: r,
      tx: o?.cena != null ? String(o.cena) : "",
      title: o ? `${r === "wynajem" ? "Najem" : "Sprzedaż"}: ${o.adres || o.tytul}` : "",
      split: String(defaultSplit),
      extras: "",
      parties: {
        seller: { val: "", mode: "pct" },
        buyer: { val: "", mode: "pct" },
        landlord: { val: "", mode: "pln" },
        tenant: { val: "", mode: "pln" },
      } as Record<PartyKey, Party>,
    };
  });
  const [title, setTitle] = useState(poczatek.title);
  const tytulReczny = useRef(!!edycja);
  const [ofertaId, setOfertaId] = useState(poczatek.ofertaId);
  const [klientId, setKlientId] = useState(poczatek.klientId);
  const [rodzaj, setRodzaj] = useState<Rodzaj>(poczatek.rodzaj);
  const [tx, setTx] = useState(poczatek.tx);
  const [split, setSplit] = useState(poczatek.split);
  const [extras, setExtras] = useState(poczatek.extras);
  const [parties, setParties] = useState<Record<PartyKey, Party>>(poczatek.parties);

  const oferta = oferty.find((o) => o.id === ofertaId) ?? null;
  const klient = klienci.find((k) => k.id === klientId) ?? null;

  function wybierzOferte(id: string) {
    setOfertaId(id);
    const o = oferty.find((x) => x.id === id);
    if (!o) return;
    const r = o.rodzaj ?? "sprzedaz";
    setRodzaj(r);
    if (o.cena != null) setTx(String(o.cena));
    if (!tytulReczny.current) setTitle(`${r === "wynajem" ? "Najem" : "Sprzedaż"}: ${o.adres || o.tytul}`);
    if (o.wlascicielId && klienci.some((k) => k.id === o.wlascicielId)) setKlientId((obecny) => obecny || o.wlascicielId!);
  }

  // Powiązania: oferty wybranego klienta i właściciel wybranej oferty.
  const ofertyKlienta = klient ? oferty.filter((o) => o.wlascicielId === klient.id && o.id !== ofertaId) : [];
  const wlasciciel = oferta?.wlascicielId ? klienci.find((k) => k.id === oferta.wlascicielId) : undefined;

  const txNum = Math.round(liczba(tx));
  const splitNum = Math.min(100, Math.max(0, parseInt(split.replace(",", "."), 10) || 0));
  const extrasNum = Math.round(liczba(extras));

  const resolved = useMemo(() => {
    const r = {} as Record<PartyKey, number>;
    for (const d of PARTY_DEFS) {
      const p = parties[d.key];
      const v = liczba(p.val);
      // Strony drugiego rodzaju nie liczą się, nawet jeśli coś w nich zostało.
      r[d.key] = d.rodzaj !== rodzaj ? 0 : p.mode === "pct" ? Math.round((txNum * v) / 100) : Math.round(v);
    }
    return r;
  }, [parties, txNum, rodzaj]);

  const officeTotal = Object.values(resolved).reduce((a, b) => a + b, 0); // brutto
  const netto = officeTotal / 1.23;
  const vat = officeTotal - netto;
  const agentBase = Math.round((netto * splitNum) / 100); // udział liczony od netto
  const earnings = agentBase + extrasNum;

  function setParty(key: PartyKey, patch: Partial<Party>) {
    setParties((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  return (
    <Modal title={edycja ? "Edytuj transakcję" : "Nowa transakcja"} onClose={onClose}>
      <form
        action={async (fd) => {
          setSaveError(null);
          const res = edycja ? await updateDeal(edycja.deal.id, fd) : await createDeal(fd);
          if (res.ok) {
            toast(edycja ? "Zapisano zmiany." : "Transakcja dodana.");
            onClose();
          } else setSaveError(res.error);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {oferty.length > 0 && (
            <Labeled label="Oferta">
              <Wybieracz
                opcje={oferty.map((o) => ({
                  id: o.id,
                  nazwa: o.adres || o.tytul,
                  opis: [o.adres && o.tytul !== o.adres ? o.tytul : null, o.cena != null ? formatPln(o.cena) : null]
                    .filter(Boolean)
                    .join(" · "),
                }))}
                wartosc={ofertaId}
                onWybor={(id) => (id ? wybierzOferte(id) : setOfertaId(""))}
                placeholder="Szukaj po adresie lub tytule…"
              />
              <input type="hidden" name="property_id" value={ofertaId} />
            </Labeled>
          )}

          {klienci.length > 0 && (
            <Labeled label="Klient">
              <Wybieracz
                opcje={klienci.map((k) => ({ id: k.id, nazwa: k.nazwa, opis: k.typ ? ETYKIETY_TYPU[k.typ] ?? "" : "" }))}
                wartosc={klientId}
                onWybor={setKlientId}
                placeholder="Szukaj klienta…"
              />
              <input type="hidden" name="client_id" value={klientId} />
              {wlasciciel && wlasciciel.id !== klientId && (
                <Podpowiedzi
                  etykieta="Właściciel tej oferty:"
                  pozycje={[{ id: wlasciciel.id, nazwa: wlasciciel.nazwa }]}
                  onWybor={setKlientId}
                />
              )}
              {ofertyKlienta.length > 0 && (
                <Podpowiedzi
                  etykieta="Oferty tego klienta:"
                  pozycje={ofertyKlienta.slice(0, 4).map((o) => ({ id: o.id, nazwa: o.adres || o.tytul }))}
                  onWybor={wybierzOferte}
                />
              )}
            </Labeled>
          )}

          <Labeled label="Opis">
            <input
              name="title"
              required
              value={title}
              onChange={(e) => {
                tytulReczny.current = true;
                setTitle(e.target.value);
              }}
              placeholder="Sprzedaż mieszkania, ul. Polna 12"
              className={POLE}
            />
          </Labeled>

          <div>
            <p className="mb-1.5 text-sm text-slate-500">Rodzaj</p>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {(["sprzedaz", "wynajem"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRodzaj(r)}
                  aria-pressed={rodzaj === r}
                  className={`rounded-lg py-2 text-sm font-medium transition ${
                    rodzaj === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {r === "sprzedaz" ? "Sprzedaż" : "Najem"}
                </button>
              ))}
            </div>
          </div>

          <Labeled label={rodzaj === "wynajem" ? "Czynsz najmu (zł/mc)" : "Cena transakcji (zł)"}>
            <PoleKwoty value={tx} onChange={setTx} jednostka="zł" placeholder={rodzaj === "wynajem" ? "3500" : "650 000"} />
            <input type="hidden" name="transaction_value" value={txNum} />
          </Labeled>

          {/* Prowizje od stron */}
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Prowizja od stron</p>
            {PARTY_DEFS.map((d) => (
              <div key={d.key} className={d.rodzaj === rodzaj ? "rounded-xl border border-slate-200 bg-slate-50 p-3" : "hidden"}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-700">{d.label}</span>
                  {resolved[d.key] > 0 && (
                    <span className="text-sm font-semibold text-emerald-600">{formatPln(resolved[d.key])}</span>
                  )}
                </div>
                <div className="flex items-stretch gap-2">
                  <div className="min-w-0 flex-1">
                    <PoleKwoty
                      value={parties[d.key].val}
                      onChange={(v) => setParty(d.key, { val: v })}
                      jednostka={parties[d.key].mode === "pct" ? "%" : "zł"}
                      placeholder={parties[d.key].mode === "pct" ? "2,5" : "0"}
                      aria-label={d.label}
                    />
                  </div>
                  <div className="flex flex-shrink-0 rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label={`Jednostka: ${d.label}`}>
                    {(["pct", "pln"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setParty(d.key, { mode: m })}
                        aria-pressed={parties[d.key].mode === m}
                        className={`w-10 rounded-lg text-sm font-semibold transition ${
                          parties[d.key].mode === m ? "bg-emerald-500 text-white" : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {m === "pct" ? "%" : "zł"}
                      </button>
                    ))}
                  </div>
                </div>
                <input type="hidden" name={d.name} value={resolved[d.key]} />
              </div>
            ))}
          </div>

          {/* Split + dodatki */}
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Twój udział">
              <PoleKwoty value={split} onChange={setSplit} jednostka="%" placeholder="50" name="split" />
            </Labeled>
            <Labeled label="Dodatki">
              <PoleKwoty value={extras} onChange={setExtras} jednostka="zł" placeholder="np. 1000" name="extras" />
            </Labeled>
          </div>
          {extrasNum > 0 && (
            <Labeled label="Za co dodatki (np. prowizja od doradcy kredytowego)">
              <input name="extras_note" defaultValue={edycja?.deal.extras_note ?? ""} placeholder="Doradca kredytowy - Bartek" className={POLE} />
            </Labeled>
          )}

          {/* Podsumowanie na żywo */}
          <div className="space-y-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <Row label="Prowizja biura (brutto)" value={formatPln(officeTotal)} />
            <Row label="VAT (23%)" value={`− ${formatPln(vat)}`} muted />
            <Row label="Prowizja netto" value={formatPln(netto)} muted />
            <Row label={`Twój udział (${splitNum}% od netto)`} value={formatPln(agentBase)} muted />
            {extrasNum > 0 && <Row label="Dodatki (dla Ciebie)" value={formatPln(extrasNum)} muted />}
            <div className="mt-2 flex items-center justify-between border-t border-emerald-500/20 pt-2">
              <span className="font-medium text-slate-900">Twój zarobek (netto)</span>
              <span className="text-xl font-semibold text-emerald-600">{formatPln(earnings)}</span>
            </div>
          </div>

          <Labeled label="Planowane zamknięcie (wchodzi do prognozy)">
            <input name="expectedClose" type="date" defaultValue={edycja?.deal.expected_close?.slice(0, 10) ?? ""} className={POLE} />
          </Labeled>
        </div>

        {saveError && (
          <p className="mx-6 mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </p>
        )}

        <div className="flex flex-shrink-0 gap-3 border-t border-slate-200 px-6 py-4">
          <SubmitButton
            pendingText={edycja ? "Zapisuję…" : "Dodaję…"}
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-400"
          >
            {edycja ? "Zapisz zmiany" : "Dodaj transakcję"}
          </SubmitButton>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-5 py-3 text-slate-700 transition hover:bg-slate-100"
          >
            Anuluj
          </button>
        </div>
      </form>
    </Modal>
  );
}

const ETYKIETY_TYPU: Record<string, string> = {
  sprzedajacy: "Sprzedający",
  kupujacy: "Kupujący",
  wynajmujacy: "Wynajmujący",
  najemca: "Najemca",
  inny: "Inny",
};

/** Pole kwoty z jednostką w środku. Pełna szerokość, więc wpisana liczba zawsze jest widoczna. */
function PoleKwoty({
  value,
  onChange,
  jednostka,
  placeholder,
  name,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  jednostka: string;
  placeholder?: string;
  name?: string;
  "aria-label"?: string;
}) {
  return (
    <div className="relative">
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,\s]/g, ""))}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`${POLE} pr-10 tabular-nums`}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">{jednostka}</span>
    </div>
  );
}

/** Pole z wyszukiwaniem: wpisujesz kawałek adresu albo nazwiska i wybierasz z listy. */
function Wybieracz({
  opcje,
  wartosc,
  onWybor,
  placeholder,
}: {
  opcje: { id: string; nazwa: string; opis?: string }[];
  wartosc: string;
  onWybor: (id: string) => void;
  placeholder: string;
}) {
  const [szukaj, setSzukaj] = useState("");
  const [otwarte, setOtwarte] = useState(false);
  const wybrana = opcje.find((o) => o.id === wartosc);

  const pasujace = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    const lista = q ? opcje.filter((o) => `${o.nazwa} ${o.opis ?? ""}`.toLowerCase().includes(q)) : opcje;
    return lista.slice(0, 8);
  }, [opcje, szukaj]);

  if (wybrana) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{wybrana.nazwa}</p>
          {wybrana.opis && <p className="truncate text-xs text-slate-500">{wybrana.opis}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            onWybor("");
            setSzukaj("");
          }}
          className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-slate-700"
        >
          Zmień
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={szukaj}
        onChange={(e) => {
          setSzukaj(e.target.value);
          setOtwarte(true);
        }}
        onFocus={() => setOtwarte(true)}
        onBlur={() => setTimeout(() => setOtwarte(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className={POLE}
      />
      {otwarte && (
        <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {pasujace.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">Nic nie pasuje</li>
          ) : (
            pasujace.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onWybor(o.id);
                    setOtwarte(false);
                  }}
                  className="block w-full px-3 py-2 text-left transition hover:bg-slate-50"
                >
                  <span className="block truncate text-sm text-slate-900">{o.nazwa}</span>
                  {o.opis && <span className="block truncate text-xs text-slate-500">{o.opis}</span>}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function Podpowiedzi({
  etykieta,
  pozycje,
  onWybor,
}: {
  etykieta: string;
  pozycje: { id: string; nazwa: string }[];
  onWybor: (id: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-slate-500">{etykieta}</span>
      {pozycje.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onWybor(p.id)}
          className="max-w-full truncate rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
        >
          + {p.nazwa}
        </button>
      ))}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-slate-500" : "text-slate-700"}>{label}</span>
      <span className={muted ? "text-slate-700" : "font-medium text-slate-900"}>{value}</span>
    </div>
  );
}

export function DealActions({ dealId, status }: { dealId: string; status: DealStatus }) {
  const toast = useToast();
  return (
    <div className="flex items-center gap-2">
      {status === "w_toku" && (
        <>
          <button
            onClick={() => {
              setDealStatus(dealId, "zamkniety");
              toast("Transakcja zamknięta.");
            }}
            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500/25"
          >
            Zamknij ✓
          </button>
          <button
            onClick={() => {
              setDealStatus(dealId, "przepadl");
              toast("Oznaczono jako przepadła", "info");
            }}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-red-100 hover:text-red-700"
          >
            Przepadł
          </button>
        </>
      )}
      {status !== "w_toku" && (
        <button
          onClick={() => {
            setDealStatus(dealId, "w_toku");
            toast("Transakcja wznowiona", "info");
          }}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
        >
          Wznów
        </button>
      )}
      <button
        onClick={() => {
          deleteDeal(dealId);
          toast("Usunięto transakcję", "info");
        }}
        className="text-xs text-slate-400 transition hover:text-red-600"
        title="Usuń"
      >
        ✕
      </button>
    </div>
  );
}
