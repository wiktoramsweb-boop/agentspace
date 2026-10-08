"use client";

import { useEffect, useState } from "react";

type ZdarzenieInstalacji = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KLUCZ = "portal-instalacja-ukryta";

function czyIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPad od iPadOS 13 podaje się za Maca, więc dokładamy test na dotyk.
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function czyZainstalowana(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error - tylko Safari na iOS
    window.navigator.standalone === true
  );
}

/**
 * Zachęta do dodania portalu na ekran początkowy.
 *
 * Klient wchodzi z kodu QR i ląduje w przeglądarce - wtedy to wygląda jak
 * strona, a nie jak aplikacja, i przy następnym razie nie ma jak tu wrócić.
 * Dlatego instrukcja pokazuje się od razu przy pierwszym wejściu i znika
 * sama, gdy portal już jest zainstalowany.
 */
export function ZachetaInstalacji({ nazwaBiura }: { nazwaBiura: string }) {
  const [widoczna, setWidoczna] = useState(false);
  const [ios, setIos] = useState(false);
  const [kroki, setKroki] = useState(false);
  const [natywna, setNatywna] = useState<ZdarzenieInstalacji | null>(null);

  useEffect(() => {
    if (czyZainstalowana()) return;
    try {
      if (localStorage.getItem(KLUCZ) === "1") return;
    } catch {
      /* prywatne okno - trudno, pokażemy */
    }
    setIos(czyIOS());
    setWidoczna(true);

    const naPrompt = (e: Event) => {
      e.preventDefault();
      setNatywna(e as ZdarzenieInstalacji);
    };
    window.addEventListener("beforeinstallprompt", naPrompt);
    return () => window.removeEventListener("beforeinstallprompt", naPrompt);
  }, []);

  function ukryj() {
    setWidoczna(false);
    try {
      localStorage.setItem(KLUCZ, "1");
    } catch {
      /* ignore */
    }
  }

  async function zainstaluj() {
    if (natywna) {
      await natywna.prompt();
      await natywna.userChoice;
      ukryj();
      return;
    }
    setKroki(true);
  }

  if (!widoczna) return null;

  return (
    <div className="portal-instalacja">
      <div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b>Dodaj {nazwaBiura} na ekran telefonu</b>
          <small>Otworzysz jednym stuknięciem, bez szukania linku.</small>
        </div>
        {!kroki && (
          <button type="button" onClick={zainstaluj}>
            Pokaż jak
          </button>
        )}
        <button type="button" className="zamknij" onClick={ukryj} aria-label="Zamknij">
          ×
        </button>
      </div>
      {kroki && <KrokiInstalacji ios={ios} />}
    </div>
  );
}

/** Instrukcja krok po kroku. Używana też w zakładce „Biuro". */
export function KrokiInstalacji({ ios }: { ios: boolean }) {
  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600 }}>
        {ios ? "iPhone (Safari)" : "Android (Chrome)"}
      </p>
      {ios ? (
        <ol className="portal-kroki">
          <li>
            Stuknij ikonę <strong>Udostępnij</strong> na dole ekranu, tę ze strzałką w górę.
          </li>
          <li>
            Przewiń listę i wybierz <strong>Do ekranu początkowego</strong>.
          </li>
          <li>
            Potwierdź <strong>Dodaj</strong> w prawym górnym rogu.
          </li>
        </ol>
      ) : (
        <ol className="portal-kroki">
          <li>
            Stuknij <strong>trzy kropki</strong> w prawym górnym rogu przeglądarki.
          </li>
          <li>
            Wybierz <strong>Dodaj do ekranu głównego</strong> albo <strong>Zainstaluj aplikację</strong>.
          </li>
          <li>
            Potwierdź <strong>Zainstaluj</strong>.
          </li>
        </ol>
      )}
    </div>
  );
}

/** Obie instrukcje naraz, do zakładki pomocy - klient sam wie, co ma w ręku. */
export function ObieInstrukcje() {
  return (
    <>
      <KrokiInstalacji ios />
      <div style={{ height: 14 }} />
      <KrokiInstalacji ios={false} />
    </>
  );
}
