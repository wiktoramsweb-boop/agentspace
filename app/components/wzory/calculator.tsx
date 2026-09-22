"use client";

import { useState } from "react";

const zl = (n: number) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(Math.round(n)) + " zł";

/**
 * Kalkulator raty. Liczy ratę równą ze wzoru annuitetowego, więc wynik zgadza
 * się z tym, co klient zobaczy potem w banku.
 */
export function RateCalculator({ price = 800_000 }: { price?: number }) {
  const [value, setValue] = useState(price);
  const [own, setOwn] = useState(Math.round(price * 0.2));
  const [years, setYears] = useState(25);
  const [rate, setRate] = useState(7.2);

  const loan = Math.max(0, value - own);
  const i = rate / 100 / 12;
  const n = years * 12;
  const installment = loan === 0 ? 0 : i === 0 ? loan / n : (loan * i) / (1 - Math.pow(1 + i, -n));
  const total = installment * n;
  const ownPct = value > 0 ? Math.round((own / value) * 100) : 0;

  return (
    <div className="wzk">
      <div style={{ display: "grid", gap: 18 }}>
        <div className="wzk__range">
          <label htmlFor="k-value">
            Cena nieruchomości: <b>{zl(value)}</b>
          </label>
          <input
            id="k-value"
            type="range"
            min={200_000}
            max={3_000_000}
            step={10_000}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value);
              setValue(v);
              if (own > v) setOwn(v);
            }}
          />
        </div>

        <div className="wzk__range">
          <label htmlFor="k-own">
            Wkład własny: <b>{zl(own)}</b> <span className="wz-muted">({ownPct}%)</span>
          </label>
          <input id="k-own" type="range" min={0} max={value} step={10_000} value={own} onChange={(e) => setOwn(Number(e.target.value))} />
          {ownPct < 10 && <span className="wzf__note">Większość banków wymaga co najmniej 10 procent wkładu.</span>}
        </div>

        <div className="wzk__range">
          <label htmlFor="k-years">
            Okres kredytu: <b>{years} lat</b>
          </label>
          <input id="k-years" type="range" min={5} max={35} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} />
        </div>

        <div className="wzk__range">
          <label htmlFor="k-rate">
            Oprocentowanie: <b>{rate.toFixed(1).replace(".", ",")} %</b>
          </label>
          <input id="k-rate" type="range" min={3} max={12} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </div>
      </div>

      <div className="wzk__out">
        <p className="wz-kick" style={{ marginBottom: 6 }}>
          Rata miesięczna
        </p>
        <p className="wzk__val">{zl(installment)}</p>
        <p className="wz-muted" style={{ fontSize: 14, marginTop: 12 }}>
          Kwota kredytu {zl(loan)}
          <br />
          Łącznie do spłaty {zl(total)}
        </p>
        <p className="wzf__note" style={{ marginTop: 14 }}>
          Wyliczenie poglądowe, rata równa, bez ubezpieczeń i prowizji. Nie jest ofertą w rozumieniu prawa.
        </p>
      </div>
    </div>
  );
}
