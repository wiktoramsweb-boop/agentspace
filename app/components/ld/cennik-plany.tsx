"use client";

import Link from "next/link";
import { useState } from "react";
import { OKRESY, cenaOkresu, type Okres } from "@/lib/abonament-cennik";

type PlanWidok = { id: string; price: number; priceFrom?: boolean; name: string; tagline: string; features: string[] };

/**
 * Pakiety z przełącznikiem okresu płatności. Ceny i rabaty biorą się z tych
 * samych plików co płatności w aplikacji (plans.ts, abonament-cennik.ts),
 * więc strona nie może pokazać innej kwoty niż ta, którą biuro zapłaci.
 */
export function CennikPlany({
  plany,
  en,
  polecany,
  wybierz,
  miesiac,
  od,
}: {
  plany: PlanWidok[];
  en: boolean;
  polecany: string;
  wybierz: string;
  miesiac: string;
  od: string;
}) {
  const [okres, setOkres] = useState<Okres>("monthly");
  const o = OKRESY.find((x) => x.id === okres) ?? OKRESY[0];
  const nazwy: Record<Okres, string> = en ? { monthly: "Monthly", half_year: "Every 6 months", yearly: "Yearly" } : { monthly: "Miesięcznie", half_year: "Co pół roku", yearly: "Co rok" };

  return (
    <>
      <div className="lx-okresy" role="radiogroup" aria-label={en ? "Billing period" : "Okres płatności"}>
        {OKRESY.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={okres === x.id} className={okres === x.id ? "on" : ""} onClick={() => setOkres(x.id)}>
            {nazwy[x.id]}
            {x.rabat > 0 && <em>-{Math.round(x.rabat * 100)}%</em>}
          </button>
        ))}
      </div>
      <div className="ld-plany">
        {plany.map((plan) => {
          const wyr = plan.id === "pro";
          const zaOkres = cenaOkresu(plan.price, okres);
          const miesiecznie = Math.round(zaOkres / o.miesiecy);
          const rocznie = Math.round(plan.price * 12 - cenaOkresu(plan.price, okres) * (12 / o.miesiecy));
          return (
            <div className={`ld-plan${wyr ? " ld-plan--wyr" : ""}`} key={plan.id}>
              {wyr && <span className="ld-plan__znaczek">{polecany}</span>}
              <h3>{plan.name}</h3>
              <p className="ld-plan__kto">{plan.tagline}</p>
              <div className="ld-plan__cena">
                {plan.priceFrom && <span className="od">{od}</span>}
                <span key={`${plan.id}-${okres}`} className="lx-cena-liczba">
                  {miesiecznie.toLocaleString("pl-PL")}
                </span>
                <small>{miesiac}</small>
              </div>
              <p className="lx-plan__okres">
                {o.miesiecy === 1
                  ? en
                    ? "Billed monthly, cancel anytime."
                    : "Płatne co miesiąc, rezygnujesz kiedy chcesz."
                  : en
                    ? `${zaOkres.toLocaleString("pl-PL")} PLN billed every ${o.miesiecy} months. You save ${rocznie.toLocaleString("pl-PL")} PLN a year.`
                    : `${zaOkres.toLocaleString("pl-PL")} zł płatne co ${o.miesiecy} mies. Oszczędzasz ${rocznie.toLocaleString("pl-PL")} zł rocznie.`}
              </p>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>
                    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link className={`ld-btn${wyr ? "" : " ld-btn--ciemny"}`} href="/signup">
                {wybierz}
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
