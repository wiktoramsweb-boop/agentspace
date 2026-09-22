"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DEMO_OFFERS, KIND_LABELS, districts, plOffersAcc, type DemoKind } from "@/lib/wzory/data";

const PRICE_STEPS = [400_000, 600_000, 800_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000];
const RENT_STEPS = [2_500, 3_500, 5_000, 7_500, 10_000, 15_000];

/**
 * Wyszukiwarka z nagłówka. Nie filtruje na miejscu, tylko przenosi do listy
 * ofert z gotowym adresem, więc wynik wyszukiwania da się wysłać linkiem.
 */
export function WzSearch({ wzor, compact = false }: { wzor: string; compact?: boolean }) {
  const router = useRouter();
  const [deal, setDeal] = useState<"sprzedaz" | "wynajem">("sprzedaz");
  const [kind, setKind] = useState("");
  const [district, setDistrict] = useState("");
  const [max, setMax] = useState("");

  const areas = useMemo(() => districts(), []);
  const steps = deal === "wynajem" ? RENT_STEPS : PRICE_STEPS;

  // Licznik pod przyciskiem: ile ofert pasuje do wybranych filtrów.
  const count = useMemo(
    () =>
      DEMO_OFFERS.filter(
        (o) =>
          o.deal === deal &&
          (!kind || o.kind === (kind as DemoKind)) &&
          (!district || o.district === district) &&
          (!max || o.price <= Number(max)),
      ).length,
    [deal, kind, district, max],
  );

  function go(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams({ transakcja: deal });
    if (kind) p.set("typ", kind);
    if (district) p.set("dzielnica", district);
    if (max) p.set("max", max);
    router.push(`/wzory/${wzor}/oferty?${p.toString()}`);
  }

  return (
    <form className="wzs" onSubmit={go}>
      <div className="wzs__f">
        <label htmlFor={`${wzor}-deal`}>Szukam</label>
        <div className="wzs__seg" id={`${wzor}-deal`}>
          <button type="button" aria-pressed={deal === "sprzedaz"} onClick={() => setDeal("sprzedaz")}>
            Na sprzedaż
          </button>
          <button type="button" aria-pressed={deal === "wynajem"} onClick={() => setDeal("wynajem")}>
            Na wynajem
          </button>
        </div>
      </div>

      <div className="wzs__f">
        <label htmlFor={`${wzor}-kind`}>Rodzaj</label>
        <select id={`${wzor}-kind`} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Dowolny</option>
          {Object.entries(KIND_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="wzs__f">
        <label htmlFor={`${wzor}-area`}>Lokalizacja</label>
        <select id={`${wzor}-area`} value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">Cały Kraków i okolice</option>
          {areas.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name} ({a.count})
            </option>
          ))}
        </select>
      </div>

      <div className="wzs__f">
        <label htmlFor={`${wzor}-max`}>Cena do</label>
        <select id={`${wzor}-max`} value={max} onChange={(e) => setMax(e.target.value)}>
          <option value="">Bez limitu</option>
          {steps.map((s) => (
            <option key={s} value={s}>
              {new Intl.NumberFormat("pl-PL").format(s)} zł{deal === "wynajem" ? "/mc" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="wzs__f wzs__submit">
        {!compact && <label aria-hidden="true">&nbsp;</label>}
        <button type="submit" className="wz-btn">
          Pokaż {count} {plOffersAcc(count)}
        </button>
      </div>
    </form>
  );
}
