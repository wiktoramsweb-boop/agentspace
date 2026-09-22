"use client";

import { useState } from "react";

/** Nagłówek sekcji: nadtytuł, tytuł i opcjonalny lead oraz akcja z prawej. */
export function Head({
  kick,
  title,
  lead,
  action,
}: {
  kick?: string;
  title: React.ReactNode;
  lead?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="wz-head" data-rev>
      <div>
        {kick && <p className="wz-kick">{kick}</p>}
        <h2 className="wz-h2">{title}</h2>
        {lead && (
          <p className="wz-lead" style={{ marginTop: 14 }}>
            {lead}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Liczba, która dolicza się od zera, gdy wjedzie w kadr. */
export function Counter({
  value,
  suffix = "",
  decimals = 0,
  label,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
}) {
  return (
    <div className="wz-stat">
      <b className="wz-count" data-count={value} data-suffix={suffix} data-decimals={decimals}>
        0{suffix}
      </b>
      <span>{label}</span>
    </div>
  );
}

/** Przewijany pasek: logotypy portali albo opinie. Treść dublujemy dla płynnej pętli. */
export function Marquee({
  children,
  speed = 38,
  gap = 28,
}: {
  children: React.ReactNode;
  speed?: number;
  gap?: number;
}) {
  return (
    <div className="wz-marquee" style={{ ["--speed" as string]: `${speed}s`, ["--gap" as string]: `${gap}px` }}>
      <div className="wz-marquee__track">{children}</div>
      <div className="wz-marquee__track" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/** Lista pytań i odpowiedzi. Rozwijana, bo nikt nie czyta ośmiu akapitów naraz. */
export function Faq({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="wz-faq" data-revs>
      {items.map(([q, a], i) => (
        <div key={q} className={`wz-faq__item${open === i ? " is-open" : ""}`}>
          <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
            <span>{q}</span>
            <i aria-hidden="true" />
          </button>
          <div className="wz-faq__body">
            <p>{a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Kroki procesu w jednej linii, z numeracją. */
export function Steps({ items }: { items: [string, string][] }) {
  return (
    <ol className="wz-steps" data-revs>
      {items.map(([t, d], i) => (
        <li key={t}>
          <b>{String(i + 1).padStart(2, "0")}</b>
          <h3>{t}</h3>
          <p>{d}</p>
        </li>
      ))}
    </ol>
  );
}

/** Pasek zaufania: gdzie publikujemy oferty. */
export function Portals({ items }: { items: string[] }) {
  return (
    <Marquee speed={30} gap={44}>
      {items.map((p) => (
        <span key={p} className="wz-portal">
          {p}
        </span>
      ))}
    </Marquee>
  );
}
