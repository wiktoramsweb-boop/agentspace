"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  // Podgląd przewija się dopiero po kliknięciu. Wcześniej kółko myszy nad ramką
  // raz przewijało wzór, a raz stronę, zależnie od tego, gdzie był kursor.
  const [aktywny, setAktywny] = useState(false);
  const w = wzory.find((x) => x.slug === wybrany) ?? wzory[0];

  // Przewijanie wzoru w ramce na stronie gryzło się z przewijaniem strony
  // (płynne przewijanie, gładzik, przechwytywanie gestu). Dlatego klik otwiera
  // wzór na pełnym ekranie, a strona pod spodem jest w tym czasie zablokowana.
  useEffect(() => {
    if (!aktywny) return;
    const html = document.documentElement;
    const poprzedni = html.style.overflow;
    html.style.overflow = "hidden";
    window.__lenis?.stop();
    const klawisz = (e: KeyboardEvent) => e.key === "Escape" && setAktywny(false);
    addEventListener("keydown", klawisz);
    return () => {
      html.style.overflow = poprzedni;
      window.__lenis?.start();
      removeEventListener("keydown", klawisz);
    };
  }, [aktywny]);

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
                setAktywny(false);
              }}
            >
              <span className="wp__kropka" style={{ background: `linear-gradient(135deg, ${x.swatch[0]} 50%, ${x.swatch[2] ?? x.swatch[1]} 50%)` }} />
              {x.name}
            </button>
          ))}
        </div>
        <div className="wp__prawa">
        <a className="wp__otworz" href={`/wzory/${w.slug}`} target="_blank" rel="noreferrer">
          Otwórz cały wzór ↗
        </a>
        <div className="wp__widok" role="radiogroup" aria-label="Widok">
          <button type="button" role="radio" aria-checked={!telefon} className={!telefon ? "on" : ""} onClick={() => setTelefon(false)}>
            Komputer
          </button>
          <button type="button" role="radio" aria-checked={telefon} className={telefon ? "on" : ""} onClick={() => setTelefon(true)}>
            Telefon
          </button>
        </div>
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
              <>
                <iframe key={w.slug} src={`/wzory/${w.slug}`} title={`Podgląd wzoru ${w.name}`} loading="lazy" tabIndex={-1} className="wp__martwy" />
                <button type="button" className="wp__aktywuj" onClick={() => setAktywny(true)}>
                  <span>Kliknij, żeby przewijać i klikać wzór na pełnym ekranie</span>
                </button>
              </>
            ) : (
              <button type="button" className="wp__start" onClick={() => setWlaczony(true)}>
                <b>Pokaż wzór „{w.name}” na żywo</b>
                <span>Działająca strona z ofertami, wyszukiwarką i formularzami. Możesz ją przewijać i klikać.</span>
              </button>
            )}
          </div>
        </div>
        {aktywny && createPortal(
          <div className="wp-modal" role="dialog" aria-modal="true" aria-label={`Wzór ${w.name}`}>
            <div className="wp-modal__pasek">
              <b>{w.name}</b>
              <div className="wp-modal__wzory">
                {wzory.map((x) => (
                  <button key={x.slug} type="button" className={x.slug === w.slug ? "on" : ""} onClick={() => setWybrany(x.slug)}>
                    {x.name}
                  </button>
                ))}
              </div>
              <a href={`/wzory/${w.slug}`} target="_blank" rel="noreferrer" className="wp__otworz">
                Nowa karta ↗
              </a>
              <button type="button" className="wp-modal__zamknij" onClick={() => setAktywny(false)} aria-label="Zamknij podgląd" autoFocus>
                ✕
              </button>
            </div>
            <div className={`wp-modal__ramka${telefon ? " wp-modal__ramka--tel" : ""}`}>
              <iframe key={`m-${w.slug}`} src={`/wzory/${w.slug}`} title={`Wzór ${w.name}`} />
            </div>
          </div>,
          document.body,
        )}
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
