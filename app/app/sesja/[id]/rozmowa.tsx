"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zapiszRozmoweGlosowa } from "./glos-actions";
import { endSession } from "../../trening/actions";
import { Dzwonek } from "@/lib/dzwonek";

type Wypowiedz = { role: "agent" | "client"; content: string };
type Faza = "stop" | "laczenie" | "rozmowa" | "konczenie";
type Sposob = "webrtc" | "websocket";
type Dostep = { token: string | null; adres: string | null; prompt: string; pierwsze: string };

/** Ile czekamy na jedną próbę połączenia, zanim spróbujemy drugą drogą. */
const LIMIT_PROBY_MS = 10_000;

/**
 * Rozmowa głosowa z klientem AI.
 *
 * Wygląda i brzmi jak telefon, bo tym ma być: agent naciska słuchawkę, słyszy
 * sygnał zgłoszenia, rozmawia na pełnym ekranie i odkłada słuchawkę. Trening
 * zimnych telefonów ma być nie do odróżnienia od zimnego telefonu.
 *
 * `useConversation` czyta stan z kontekstu i bez `ConversationProvider`
 * wywala render całej strony.
 */
export function RozmowaGlosowa({
  sessionId,
  tytul,
  osobowosc,
}: {
  sessionId: string;
  tytul: string;
  osobowosc: string;
}) {
  return (
    <ConversationProvider>
      <PanelRozmowy sessionId={sessionId} tytul={tytul} osobowosc={osobowosc} />
    </ConversationProvider>
  );
}

function PanelRozmowy({
  sessionId,
  tytul,
  osobowosc,
}: {
  sessionId: string;
  tytul: string;
  osobowosc: string;
}) {
  const router = useRouter();
  const [blad, setBlad] = useState<string | null>(null);
  const [faza, setFaza] = useState<Faza>("stop");
  const [sekundy, setSekundy] = useState(0);
  const [limit, setLimit] = useState(5);
  const [wyciszony, setWyciszony] = useState(false);

  // Refy, a nie stan: wypowiedzi lecą w trakcie rozmowy i nie chcemy
  // przerysowywać ekranu przy każdym zdaniu.
  const wypowiedzi = useRef<Wypowiedz[]>([]);
  const start = useRef<number>(0);
  const rozliczone = useRef(true);
  const fazaRef = useRef<Faza>("stop");
  const dostep = useRef<Dostep | null>(null);
  const sposob = useRef<Sposob>("webrtc");
  const dzwonek = useRef<Dzwonek | null>(null);

  function ustawFaze(f: Faza) {
    fazaRef.current = f;
    setFaza(f);
  }

  function ciszej() {
    dzwonek.current?.stop();
    dzwonek.current = null;
  }

  /**
   * Rozliczenie rozmowy.
   *
   * Kredyty pobieramy z góry, więc KAŻDE wyjście z tego ekranu musi tu trafić.
   * Inaczej nieudane połączenie zabiera minuty z puli biura i nikt ich nie
   * oddaje - dokładnie to zdarzyło się przy pierwszym uruchomieniu.
   */
  const rozlicz = useCallback(
    async (polaczono: boolean): Promise<number> => {
      if (rozliczone.current) return 0;
      rozliczone.current = true;
      const czas = polaczono && start.current ? Math.round((Date.now() - start.current) / 1000) : 0;
      const ile = wypowiedzi.current.length;
      await zapiszRozmoweGlosowa(sessionId, wypowiedzi.current, czas, polaczono);
      wypowiedzi.current = [];
      setSekundy(0);
      return ile;
    },
    [sessionId],
  );

  const rozmowa = useConversation({
    onConnect: () => {
      ciszej();
      start.current = Date.now();
      ustawFaze("rozmowa");
    },
    onMessage: (m) => {
      if (!m?.message) return;
      // U nich „agent" to mówiący automat, u nas agent to człowiek. Stąd zamiana.
      const odCzlowieka = (m.role ?? m.source) === "user";
      wypowiedzi.current.push({ role: odCzlowieka ? "agent" : "client", content: m.message });
    },
    onDisconnect: (szczegoly) => {
      if (fazaRef.current === "rozmowa" || fazaRef.current === "konczenie") {
        void zakoncz();
        return;
      }
      const powod = szczegoly?.reason === "error" ? szczegoly.message : null;

      // Zerwanie przed połączeniem: zanim się poddamy, druga droga.
      if (sposob.current === "webrtc" && dostep.current?.adres) {
        setBlad(powod ? `Szybkie połączenie odmówiło (${powod}), próbuję drugą drogą...` : "Próbuję drugą drogą...");
        polacz("websocket");
        return;
      }

      ciszej();
      ustawFaze("stop");
      setBlad(powod ? `Nie udało się połączyć: ${powod}` : "Nie udało się połączyć. Spróbuj jeszcze raz.");
      void rozlicz(false);
    },
    onError: (wiadomosc) => {
      setBlad(wiadomosc ? `Błąd połączenia: ${wiadomosc}` : "Błąd połączenia.");
    },
  });

  /**
   * Odłożenie słuchawki.
   *
   * Ekran gaśnie od razu, nie czekamy na potwierdzenie od dostawcy. Wcześniej
   * czekałem i gdy zwrotka nie przyszła, przycisk „Rozłącz" nie robił nic.
   */
  const zakoncz = useCallback(async () => {
    if (fazaRef.current === "stop") return;
    ciszej();
    ustawFaze("konczenie");
    try {
      rozmowa.endSession();
    } catch {
      /* już rozłączone */
    }
    const ile = await rozlicz(true);
    ustawFaze("stop");

    // Odłożenie słuchawki kończy całą sesję i uruchamia ocenę, tak jak
    // przycisk „Zakończ i oceń". Pustej rozmowy nie ma po co oceniać.
    if (ile > 0) await endSession(sessionId);
    else router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rozmowa, rozlicz, router, sessionId]);

  // Nie czekamy w nieskończoność. Po pierwszej nieudanej próbie przechodzimy
  // na drugą drogę, a dopiero potem oddajemy kredyty i mówimy, co nie wyszło.
  useEffect(() => {
    if (faza !== "laczenie") return;
    const t = setTimeout(() => {
      if (fazaRef.current !== "laczenie") return;
      try {
        rozmowa.endSession();
      } catch {
        /* nie było czego zamykać */
      }

      if (sposob.current === "webrtc" && dostep.current?.adres) {
        setBlad("Szybkie połączenie nie wstało, próbuję drugą drogą...");
        polacz("websocket");
        return;
      }

      ciszej();
      ustawFaze("stop");
      setBlad(
        `Nie udało się połączyć (${sposob.current}). Kredyty wróciły. ` +
          "Jeśli to się powtarza, sprawdź status ElevenLabs.",
      );
      void rozlicz(false);
    }, LIMIT_PROBY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faza, blad, rozmowa, rozlicz]);

  // Licznik i twarde zamknięcie po limicie. Rozmowa jest najdroższą operacją
  // w aplikacji, więc nie może zostać otwarta przez przypadek.
  useEffect(() => {
    if (faza !== "rozmowa") return;
    const t = setInterval(() => {
      const ile = Math.round((Date.now() - start.current) / 1000);
      setSekundy(ile);
      if (ile >= limit * 60) void zakoncz();
    }, 1000);
    return () => clearInterval(t);
  }, [faza, limit, zakoncz]);

  // Sygnał zgłoszenia nie może zostać grający, gdy ktoś zamknie kartę.
  useEffect(() => () => ciszej(), []);

  /**
   * Jedna próba połączenia.
   *
   * WebRTC jest szybsze, ale chodzi po UDP i w części sieci nie wstaje.
   * Gdy nie zdąży, przechodzimy na WebSocket, który idzie zwykłym portem 443.
   */
  function polacz(jak: Sposob) {
    const d = dostep.current;
    if (!d) return;
    sposob.current = jak;
    const wspolne = {
      overrides: {
        agent: {
          prompt: { prompt: d.prompt },
          firstMessage: d.pierwsze,
          language: "pl",
        },
      },
    } as const;

    if (jak === "webrtc" && d.token) {
      rozmowa.startSession({ conversationToken: d.token, connectionType: "webrtc", ...wspolne });
    } else if (d.adres) {
      rozmowa.startSession({ signedUrl: d.adres, connectionType: "websocket", ...wspolne });
    }
  }

  async function zadzwon() {
    setBlad(null);
    ustawFaze("laczenie");
    try {
      // Pytamy o mikrofon przed zamówieniem rozmowy: inaczej pobralibyśmy
      // kredyty za połączenie, którego przeglądarka i tak nie zestawi.
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Sygnał odpalamy tu, bo jesteśmy jeszcze w obsłudze kliknięcia.
      // Uruchomiony później zostałby zablokowany przez przeglądarkę.
      dzwonek.current = new Dzwonek();
      dzwonek.current.start();

      const r = await fetch("/api/coach/glos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const dane = await r.json();
      if (!r.ok) {
        ciszej();
        ustawFaze("stop");
        setBlad(dane.error ?? "Nie udało się połączyć.");
        return;
      }

      setLimit(dane.maxMinut ?? 5);
      wypowiedzi.current = [];
      // Od tej chwili kredyty są pobrane i ktoś musi je rozliczyć.
      rozliczone.current = false;
      dostep.current = {
        token: dane.token ?? null,
        adres: dane.adres ?? null,
        prompt: dane.prompt,
        pierwsze: dane.pierwsze,
      };
      polacz(dane.token ? "webrtc" : "websocket");
    } catch (e) {
      ciszej();
      ustawFaze("stop");
      setBlad(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Przeglądarka nie dostała zgody na mikrofon. Zezwól i spróbuj ponownie."
          : "Nie udało się połączyć. Sprawdź mikrofon i spróbuj ponownie.",
      );
      void rozlicz(false);
    }
  }

  function przelaczMikrofon() {
    const nowy = !wyciszony;
    setWyciszony(nowy);
    rozmowa.setMuted(nowy);
  }

  const minuty = String(Math.floor(sekundy / 60)).padStart(2, "0");
  const reszta = String(sekundy % 60).padStart(2, "0");
  const naEkranie = faza === "laczenie" || faza === "rozmowa" || faza === "konczenie";

  return (
    <>
      <div className="mb-3">
        {blad && !naEkranie && (
          <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">{blad}</p>
        )}
        <button
          type="button"
          onClick={() => void zadzwon()}
          disabled={naEkranie}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          <IkonaSluchawki className="h-4 w-4" />
          Zadzwoń i rozmawiaj głosem
        </button>
      </div>

      {naEkranie && (
        <EkranRozmowy
          tytul={tytul}
          osobowosc={osobowosc}
          stan={
            faza === "rozmowa"
              ? `${minuty}:${reszta}`
              : faza === "konczenie"
                ? "Kończę..."
                : (blad ?? "Dzwonię...")
          }
          mowi={faza === "rozmowa" && rozmowa.isSpeaking}
          polaczono={faza === "rozmowa"}
          wyciszony={wyciszony}
          naMikrofon={przelaczMikrofon}
          naRozlacz={() => void zakoncz()}
        />
      )}
    </>
  );
}

/** Pełnoekranowy widok połączenia. Celowo wygląda jak telefon, nie jak strona. */
function EkranRozmowy({
  tytul,
  osobowosc,
  stan,
  mowi,
  polaczono,
  wyciszony,
  naMikrofon,
  naRozlacz,
}: {
  tytul: string;
  osobowosc: string;
  stan: string;
  mowi: boolean;
  polaczono: boolean;
  wyciszony: boolean;
  naMikrofon: () => void;
  naRozlacz: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-gradient-to-b from-slate-800 via-slate-900 to-black px-6 py-16 text-white">
      <div className="flex flex-col items-center gap-5 pt-10">
        <div className="relative">
          {/* Fala rozchodzi się, gdy mówi klient. Widać, kto ma teraz głos. */}
          {mowi && (
            <span className="absolute inset-0 animate-ping rounded-full bg-white/20" aria-hidden="true" />
          )}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-4xl font-semibold backdrop-blur">
            {tytul.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="text-center">
          <p className="text-2xl font-semibold tracking-tight">{tytul}</p>
          <p className="mt-1 text-sm text-white/50">Klient: {osobowosc}</p>
        </div>

        <p className="font-mono text-lg tabular-nums text-white/70">{stan}</p>

        {polaczono && (
          <p className="max-w-xs text-center text-sm text-white/40">
            Mów normalnie. Możesz wejść mu w słowo, tak jak przez telefon.
          </p>
        )}
      </div>

      <div className="flex items-center gap-10">
        <button
          type="button"
          onClick={naMikrofon}
          disabled={!polaczono}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition disabled:opacity-30 ${
            wyciszony ? "bg-white text-slate-900" : "bg-white/15 text-white hover:bg-white/25"
          }`}
          aria-label={wyciszony ? "Włącz mikrofon" : "Wycisz mikrofon"}
        >
          <IkonaMikrofonu className="h-6 w-6" przekreslony={wyciszony} />
        </button>

        <button
          type="button"
          onClick={naRozlacz}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500"
          aria-label="Rozłącz"
        >
          <IkonaSluchawki className="h-8 w-8 rotate-[135deg]" />
        </button>

        <span className="h-14 w-14" aria-hidden="true" />
      </div>
    </div>
  );
}

function IkonaSluchawki({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.28 6.72 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.37c0-.52-.35-.97-.85-1.1l-4.43-1.1c-.44-.11-.9.05-1.17.42l-.97 1.29c-.28.38-.77.54-1.21.38a12.04 12.04 0 0 1-7.14-7.14c-.16-.44 0-.93.38-1.21l1.29-.97c.36-.27.53-.74.42-1.17L6.96 3.1a1.13 1.13 0 0 0-1.09-.85H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  );
}

function IkonaMikrofonu({ className, przekreslony }: { className?: string; przekreslony: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm7 9a7 7 0 0 1-14 0m7 7v3"
      />
      {przekreslony && <path strokeLinecap="round" d="m4 4 16 16" />}
    </svg>
  );
}
