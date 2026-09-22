"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OfferCard } from "./offer-card";
import { WzMap } from "./map";
import { useFavorites } from "./favorites";
import {
  KIND_LABELS,
  districts,
  plOffers,
  type DemoDeal,
  type DemoKind,
  type DemoOffer,
} from "@/lib/wzory/data";

export type OffersQuery = {
  deal: string;
  kind: string;
  district: string;
  min: string;
  max: string;
  rooms: string;
  q: string;
  sort: string;
  favOnly: boolean;
};

const SORTS: { value: string; label: string; cmp: (a: DemoOffer, b: DemoOffer) => number }[] = [
  { value: "nowe", label: "Najnowsze", cmp: (a, b) => Number(!!b.fresh) - Number(!!a.fresh) },
  { value: "cena-rosnaco", label: "Cena rosnąco", cmp: (a, b) => a.price - b.price },
  { value: "cena-malejaco", label: "Cena malejąco", cmp: (a, b) => b.price - a.price },
  { value: "metraz", label: "Metraż malejąco", cmp: (a, b) => b.area - a.area },
  { value: "m2", label: "Cena za metr rosnąco", cmp: (a, b) => a.price / a.area - b.price / b.area },
];

/**
 * Lista ofert z filtrami i mapą. Filtry siedzą w adresie strony, więc wynik
 * wyszukiwania można wysłać klientowi linkiem albo zapisać w zakładkach.
 */
export function OffersBrowser({
  base,
  initial,
  offers,
  dark = false,
}: {
  base: string;
  initial: OffersQuery;
  /** Oferty do pokazania: demo we wzorze, prawdziwe na stronie klienta. */
  offers: DemoOffer[];
  dark?: boolean;
}) {
  const router = useRouter();
  const { ids: favIds } = useFavorites(base);
  const [q, setQ] = useState(initial);
  const [view, setView] = useState<"lista" | "mapa">("lista");
  const [panel, setPanel] = useState(false);
  const areas = useMemo(() => districts(offers), [offers]);

  // Adres strony nadąża za filtrami, ale bez przeładowania widoku.
  useEffect(() => {
    const p = new URLSearchParams();
    if (q.deal) p.set("transakcja", q.deal);
    if (q.kind) p.set("typ", q.kind);
    if (q.district) p.set("dzielnica", q.district);
    if (q.min) p.set("min", q.min);
    if (q.max) p.set("max", q.max);
    if (q.rooms) p.set("pokoje", q.rooms);
    if (q.q) p.set("szukaj", q.q);
    if (q.sort && q.sort !== "nowe") p.set("sort", q.sort);
    if (q.favOnly) p.set("ulubione", "1");
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [q]);

  const rows = useMemo(() => {
    const text = q.q.trim().toLowerCase();
    const out = offers.filter((o) => {
      if (q.deal && o.deal !== (q.deal as DemoDeal)) return false;
      if (q.kind && o.kind !== (q.kind as DemoKind)) return false;
      if (q.district && o.district !== q.district) return false;
      if (q.min && o.price < Number(q.min)) return false;
      if (q.max && o.price > Number(q.max)) return false;
      if (q.rooms && (o.rooms ?? 0) < Number(q.rooms)) return false;
      if (q.favOnly && !favIds.includes(o.id)) return false;
      if (text) {
        const hay = `${o.title} ${o.district} ${o.city} ${o.street} ${o.no} ${o.lead}`.toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });
    const sort = SORTS.find((s) => s.value === q.sort) ?? SORTS[0];
    return [...out].sort(sort.cmp);
  }, [q, favIds, offers]);

  const active =
    [q.kind, q.district, q.min, q.max, q.rooms, q.q].filter(Boolean).length + (q.favOnly ? 1 : 0);

  function set<K extends keyof OffersQuery>(k: K, v: OffersQuery[K]) {
    setQ((s) => ({ ...s, [k]: v }));
  }

  return (
    <div>
      <div className="wzl__bar">
        <p className="wzl__count">
          <b>{rows.length}</b> {plOffers(rows.length)}
          {q.favOnly ? " w ulubionych" : ""}
        </p>

        <div className="wzl__tools">
          <button type="button" className="wzl__chip" aria-pressed={q.deal === "sprzedaz"} onClick={() => set("deal", q.deal === "sprzedaz" ? "" : "sprzedaz")}>
            Sprzedaż
          </button>
          <button type="button" className="wzl__chip" aria-pressed={q.deal === "wynajem"} onClick={() => set("deal", q.deal === "wynajem" ? "" : "wynajem")}>
            Wynajem
          </button>
          <button type="button" className="wzl__chip" aria-pressed={q.favOnly} onClick={() => set("favOnly", !q.favOnly)}>
            Ulubione ({favIds.length})
          </button>
          <button type="button" className="wzl__chip" aria-pressed={panel} onClick={() => setPanel((v) => !v)}>
            Filtry{active > 0 ? ` (${active})` : ""}
          </button>
          <button type="button" className="wzl__chip" aria-pressed={view === "mapa"} onClick={() => setView(view === "mapa" ? "lista" : "mapa")}>
            {view === "mapa" ? "Ukryj mapę" : "Pokaż mapę"}
          </button>
          <span className="wzl__sort">
            <label htmlFor="wz-sort" className="wz-muted" style={{ fontSize: 13, marginRight: 6 }}>
              Sortuj
            </label>
            <select id="wz-sort" value={q.sort} onChange={(e) => set("sort", e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </span>
        </div>
      </div>

      {panel && (
        <div className="wzl__panel wzs">
          <div className="wzs__f">
            <label htmlFor="wz-q">Szukaj</label>
            <input id="wz-q" value={q.q} onChange={(e) => set("q", e.target.value)} placeholder="Ulica, dzielnica, numer oferty…" />
          </div>
          <div className="wzs__f">
            <label htmlFor="wz-kind">Rodzaj</label>
            <select id="wz-kind" value={q.kind} onChange={(e) => set("kind", e.target.value)}>
              <option value="">Dowolny</option>
              {Object.entries(KIND_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="wzs__f">
            <label htmlFor="wz-area">Lokalizacja</label>
            <select id="wz-area" value={q.district} onChange={(e) => set("district", e.target.value)}>
              <option value="">Wszystkie</option>
              {areas.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name} ({a.count})
                </option>
              ))}
            </select>
          </div>
          <div className="wzs__f">
            <label htmlFor="wz-rooms">Pokoje od</label>
            <select id="wz-rooms" value={q.rooms} onChange={(e) => set("rooms", e.target.value)}>
              <option value="">Dowolnie</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>
          <div className="wzs__f">
            <label htmlFor="wz-min">Cena od</label>
            <input id="wz-min" inputMode="numeric" value={q.min} onChange={(e) => set("min", e.target.value.replace(/\D/g, ""))} placeholder="np. 500000" />
          </div>
          <div className="wzs__f">
            <label htmlFor="wz-max">Cena do</label>
            <input id="wz-max" inputMode="numeric" value={q.max} onChange={(e) => set("max", e.target.value.replace(/\D/g, ""))} placeholder="np. 1200000" />
          </div>
          <div className="wzs__f">
            <label aria-hidden="true">&nbsp;</label>
            <button
              type="button"
              className="wz-btn wz-btn--ghost"
              onClick={() =>
                setQ({ deal: "", kind: "", district: "", min: "", max: "", rooms: "", q: "", sort: "nowe", favOnly: false })
              }
            >
              Wyczyść filtry
            </button>
          </div>
        </div>
      )}

      <div style={{ paddingTop: 26 }}>
        {rows.length === 0 ? (
          <div className="wzl__empty">
            <p className="wz-h3" style={{ marginBottom: 10 }}>
              {q.favOnly ? "Nie masz jeszcze ulubionych ofert" : "Nic nie pasuje do tych filtrów"}
            </p>
            <p className="wz-muted" style={{ marginBottom: 18 }}>
              {q.favOnly
                ? "Kliknij serduszko przy ofercie, a wróci tutaj."
                : "Zmień kryteria albo zleć nam poszukiwanie, a odezwiemy się, gdy pojawi się coś pasującego."}
            </p>
            <button
              type="button"
              className="wz-btn"
              onClick={() =>
                q.favOnly
                  ? set("favOnly", false)
                  : router.push(`${base}/kontakt#poszukiwanie`)
              }
            >
              {q.favOnly ? "Pokaż wszystkie oferty" : "Zleć poszukiwanie"}
            </button>
          </div>
        ) : view === "mapa" ? (
          <div className="wzl__split">
            <div className="wz-grid" style={{ gridTemplateColumns: "1fr" }}>
              {rows.map((o) => (
                <OfferCard key={o.id} offer={o} base={base} sizes="(max-width: 1100px) 100vw, 45vw" />
              ))}
            </div>
            <div className="wzl__map">
              <WzMap offers={rows} base={base} dark={dark} />
            </div>
          </div>
        ) : (
          <div className="wz-grid" data-revs>
            {rows.map((o, i) => (
              <OfferCard key={o.id} offer={o} base={base} priority={i < 3} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
