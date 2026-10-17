"use client";

import { useState } from "react";

type Wzor = { slug: string; name: string; swatch: string[]; tagline: string };

/**
 * Podgląd wzorów strony na żywo: prawdziwa strona wzoru w ramce, z przełącznikiem
 * wzoru i widoku komputer / telefon. Ramka ładuje się dopiero po kliknięciu
 * „Pokaż”, żeby osiem stron nie wczytywało się przy wejściu na /wzory.
 */
export function WzoryPodglad({ wzory }: { wzory: Wzor[] }) {
  const [wybrany, setWybrany] = useState(wzory[0]?.slug ?? "");
  const [telefon, setTelefon] = useState(false);
  const [wlaczony, setWlaczony] = useState(false);
  const w = wzory.find((x) => x.slug === wybrany) ?? wzory[0];

  return (
    <div className="wp">
      <div className="wp__pasek">
        <div className="wp__wzory" role="tablist" aria-label="Wzór strony">
          {wzory.map((x) => (
            <button
              key={x.slug}
              type="button"
              role="tab"
              aria-selected={x.slug === wybrany}
              className={x.slug === wybrany ? "on" : ""}
              onClick={() => {
                setWybrany(x.slug);
                setWlaczony(true);
              }}
            >
              <span className="wp__kropka" style={{ background: `linear-gradient(135deg, ${x.swatch[0]} 50%, ${x.swatch[2] ?? x.swatch[1]} 50%)` }} />
              {x.name}
            </button>
          ))}
        </div>
        <div className="wp__widok" role="radiogroup" aria-label="Widok">
          <button type="button" role="radio" aria-checked={!telefon} className={!telefon ? "on" : ""} onClick={() => setTelefon(false)}>
            Komputer
          </button>
          <button type="button" role="radio" aria-checked={telefon} className={telefon ? "on" : ""} onClick={() => setTelefon(true)}>
            Telefon
          </button>
        </div>
      </div>

      <div className={`wp__scena${telefon ? " wp__scena--tel" : ""}`}>
        <div className="wp__ramka">
          <div className="wp__belka" aria-hidden="true">
            <span />
            <span />
            <span />
            <em>twojebiuro.pl</em>
          </div>
          <div className="wp__okno">
            {wlaczony ? (
              <iframe key={w.slug} src={`/wzory/${w.slug}`} title={`Podgląd wzoru ${w.name}`} loading="lazy" />
            ) : (
              <button type="button" className="wp__start" onClick={() => setWlaczony(true)}>
                <b>Pokaż wzór „{w.name}” na żywo</b>
                <span>Działająca strona z ofertami, wyszukiwarką i formularzami. Możesz ją przewijać i klikać.</span>
              </button>
            )}
          </div>
        </div>
        <p className="wp__opis">
          <b>{w.name}.</b> {w.tagline}{" "}
          <a href={`/wzory/${w.slug}`} target="_blank" rel="noreferrer">
            Otwórz w nowej karcie →
          </a>
        </p>
      </div>
    </div>
  );
}
