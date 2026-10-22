"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zapiszRozmoweGlosowa } from "./glos-actions";
import { endSession } from "../../trening/actions";
import { Dzwonek } from "@/lib/dzwonek";
import { kartaRozmowy } from "@/lib/karta-rozmowy";

type Wypowiedz = { role: "agent" | "client"; content: string; t?: number };
export type KartaBoczna = { oferta?: { tytul: string; dzielnica: string; miasto: string; cena: number | null; metraz: number | null; pokoje?: number | null; pietro?: number | null; rok?: number | null } | null; cel?: string | null };
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
  brief,
  osobowosc,
  plec,
  boczna = null,
}: {
  sessionId: string;
  /** Opis zadania ze scenariusza. Wyciągamy z niego kartę kontaktu. */
  brief: string;
  osobowosc: string;
  /** Wymuszony głos klienta albo null, gdy ma go dobrać scenariusz. */
  plec: "k" | "m" | null;
  /** Karta oferty i cel rozmowy pokazywane obok telefonu. */
  boczna?: KartaBoczna | null;
}) {
  return (
    <ConversationProvider>
      <PanelRozmowy sessionId={sessionId} brief={brief} osobowosc={osobowosc} plec={plec} boczna={boczna} />
    </ConversationProvider>
  );
}

function PanelRozmowy({
  sessionId,
  brief,
  osobowosc,
  plec,
  boczna,
}: {
  sessionId: string;
  brief: string;
  osobowosc: string;
  plec: "k" | "m" | null;
  boczna: KartaBoczna | null;
}) {
  const karta = useMemo(() => kartaRozmowy(brief), [brief]);
  const router = useRouter();
  const [blad, setBlad] = useState<string | null>(null);
  const [faza, setFaza] = useState<Faza>("stop");
  const [sekundy, setSekundy] = useState(0);
  const [limit, setLimit] = useState(5);
  const [wyciszony, setWyciszony] = useState(false);
  const [etap, setEtap] = useState("Zapisuję rozmowę...");
  // Napisy na żywo obok telefonu. Osobny stan od refa z wypowiedziami, bo te
  // chcemy pokazać na ekranie, a pełna lista idzie dopiero do zapisu.
  const [napisy, setNapisy] = useState<Wypowiedz[]>([]);
  const rozmowaId = useRef<string | null>(null);

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
      await zapiszRozmoweGlosowa(sessionId, wypowiedzi.current, czas, polaczono, rozmowaId.current);
      wypowiedzi.current = [];
      setSekundy(0);
      return ile;
    },
    [sessionId],
  );

  const rozmowa = useConversation({
    onConnect: (p) => {
      rozmowaId.current = p?.conversationId ?? null;
      ciszej();
      start.current = Date.now();
      ustawFaze("rozmowa");
    },
    onMessage: (m) => {
      if (!m?.message) return;
      // U nich „agent" to mówiący automat, u nas agent to człowiek. Stąd zamiana.
      const odCzlowieka = (m.role ?? m.source) === "user";
      const w: Wypowiedz = {
        role: odCzlowieka ? "agent" : "client",
        content: m.message,
        t: start.current ? Math.round((Date.now() - start.current) / 1000) : 0,
      };
      wypowiedzi.current.push(w);
      setNapisy((n) => [...n.slice(-7), w]);
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
    if (fazaRef.current === "stop" || fazaRef.current === "konczenie") return;
    ciszej();
    setEtap("Zapisuję rozmowę...");
    ustawFaze("konczenie");
    try {
      rozmowa.endSession();
    } catch {
      /* już rozłączone */
    }
    const ile = await rozlicz(true);

    // Odłożenie słuchawki kończy całą sesję i uruchamia ocenę, tak jak
    // przycisk „Zakończ i oceń". Pustej rozmowy nie ma po co oceniać.
    if (ile === 0) {
      ustawFaze("stop");
      router.refresh();
      return;
    }

    // Ocena to wywołanie modelu i trwa kilka sekund. Ekran zostaje na wierzchu
    // aż do przejścia na wyniki: wcześniej gasł od razu i agent przez te kilka
    // sekund patrzył na pustą rozmowę, nie wiedząc, czy odświeżać.
    setEtap("Oceniam rozmowę...");
    try {
      await endSession(sessionId);
    } catch {
      // Przekierowanie z akcji serwerowej leci tędy i to jest normalne.
    }
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

  // Gdyby ocena nie wróciła, nie zostawiamy agenta z zasłoniętym ekranem.
  useEffect(() => {
    if (faza !== "konczenie") return;
    const t = setTimeout(() => {
      if (fazaRef.current !== "konczenie") return;
      ustawFaze("stop");
      setBlad("Ocena trwa dłużej niż zwykle. Odśwież stronę za chwilę.");
      router.refresh();
    }, 45_000);
    return () => clearTimeout(t);
  }, [faza, router]);

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
        body: JSON.stringify({ sessionId, plec }),
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
      setNapisy([]);
      rozmowaId.current = null;
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
          kto={karta.kto}
          szczegoly={karta.szczegoly}
          osobowosc={osobowosc}
          konczenie={faza === "konczenie" ? etap : null}
          stan={faza === "rozmowa" ? `${minuty}:${reszta}` : (blad ?? "Dzwonię...")}
          mowi={faza === "rozmowa" && rozmowa.isSpeaking}
          polaczono={faza === "rozmowa"}
          wyciszony={wyciszony}
          naMikrofon={przelaczMikrofon}
          naRozlacz={() => void zakoncz()}
          boczna={boczna}
          napisy={napisy}
        />
      )}
    </>
  );
}

/**
 * Pełnoekranowy widok połączenia, narysowany jako telefon.
 *
 * Obrys aparatu nie jest ozdobą: trening ma być nie do odróżnienia od zimnego
 * telefonu, a agent patrzący na ekran przeglądarki cały czas pamięta, że to
 * ćwiczenie. Dlatego jest ramka, wysepka, pasek stanu i karta kontaktu z tym,
 * co realnie widać na telefonie przed rozmową: do kogo dzwonisz i czego
 * dotyczy sprawa.
 */
function EkranRozmowy({
  kto,
  szczegoly,
  osobowosc,
  stan,
  konczenie,
  mowi,
  polaczono,
  wyciszony,
  naMikrofon,
  naRozlacz,
  boczna,
  napisy,
}: {
  boczna: KartaBoczna | null;
  napisy: Wypowiedz[];
  kto: string;
  szczegoly: string[];
  osobowosc: string;
  stan: string;
  /** Tekst etapu po rozłączeniu. Gdy jest, zamiast telefonu pokazujemy ocenianie. */
  konczenie: string | null;
  mowi: boolean;
  polaczono: boolean;
  wyciszony: boolean;
  naMikrofon: () => void;
  naRozlacz: () => void;
}) {
  const [zegar, setZegar] = useState("");

  // Godzina na pasku stanu. Liczona po stronie przeglądarki, więc nie rozjedzie
  // się z serwerem - ten ekran i tak pojawia się dopiero po kliknięciu.
  useEffect(() => {
    const ustaw = () =>
      setZegar(
        new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      );
    ustaw();
    const t = setInterval(ustaw, 20_000);
    return () => clearInterval(t);
  }, []);

  // Ocena to wywołanie modelu i trwa kilka sekund. Przez ten czas ekran musi
  // mówić, co się dzieje, inaczej wygląda jak zawieszona aplikacja.
  if (konczenie) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-slate-950/90 px-6 text-white backdrop-blur">
        <span className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-white/15 border-t-emerald-400" />
        <div className="text-center">
          <p className="text-xl font-semibold tracking-tight">Rozłączono</p>
          <p className="mt-2 text-white/60">{konczenie}</p>
          <p className="mt-6 max-w-xs text-sm text-white/35">
            To zajmuje kilka sekund. Nie odświeżaj, za chwilę pokażę ocenę rozmowy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center gap-8 bg-slate-950/85 p-4 backdrop-blur-sm">
      <PanelBoczny boczna={boczna} kto={kto} />
      <div
        className="relative shrink-0 rounded-[3rem] border-[10px] border-slate-800 bg-slate-800 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
        style={{ height: "min(86vh, 760px)", aspectRatio: "9 / 19.5" }}
      >
        {/* Przyciski na krawędziach. Czysta dekoracja, ale bez nich to nie jest telefon. */}
        <span className="absolute -left-[13px] top-[108px] h-8 w-[3px] rounded-l bg-slate-700" aria-hidden="true" />
        <span className="absolute -left-[13px] top-[156px] h-12 w-[3px] rounded-l bg-slate-700" aria-hidden="true" />
        <span className="absolute -left-[13px] top-[216px] h-12 w-[3px] rounded-l bg-slate-700" aria-hidden="true" />
        <span className="absolute -right-[13px] top-[180px] h-20 w-[3px] rounded-r bg-slate-700" aria-hidden="true" />

        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.3rem] bg-gradient-to-b from-slate-700 via-slate-900 to-black text-white">
          {/* Wysepka */}
          <span
            className="absolute left-1/2 top-2.5 z-10 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black"
            aria-hidden="true"
          />

          {/* Pasek stanu */}
          <div className="flex items-center justify-between px-6 pt-[14px] text-[11px] font-medium tabular-nums">
            <span>{zegar}</span>
            <span className="flex items-center gap-1.5 opacity-80" aria-hidden="true">
              <IkonaZasiegu />
              <IkonaWifi />
              <IkonaBaterii />
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-between px-6 pb-8 pt-10">
            <div className="flex w-full flex-col items-center gap-4">
              <p className="text-[13px] uppercase tracking-[0.18em] text-white/35">
                {polaczono ? "Połączenie trwa" : "Łączenie"}
              </p>

              <div className="relative mt-1">
                {mowi && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/20" aria-hidden="true" />
                )}
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl font-semibold backdrop-blur">
                  {kto.replace(/^Pan[i]?\s+/, "").charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="text-center">
                <p className="text-[26px] font-semibold leading-tight tracking-tight">{kto}</p>
                <p className="mt-1 font-mono text-base tabular-nums text-white/55">{stan}</p>
              </div>

              {szczegoly.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {szczegoly.map((x) => (
                    <span
                      key={x}
                      className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] text-white/75"
                    >
                      {x}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[12px] text-white/30">Nastawienie: {osobowosc}</p>
            </div>

            {polaczono && (
              <p className="max-w-[220px] text-center text-[12px] leading-relaxed text-white/30">
                Mów normalnie. Możesz wejść mu w słowo, tak jak przez telefon.
              </p>
            )}

            <div className="flex w-full items-center justify-center gap-8">
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
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500"
                aria-label="Rozłącz"
              >
                <IkonaSluchawki className="h-7 w-7 rotate-[135deg]" />
              </button>

              <span className="h-14 w-14" aria-hidden="true" />
            </div>
          </div>

          {/* Belka gestu */}
          <span
            className="absolute bottom-2 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-white/35"
            aria-hidden="true"
          />
        </div>
      </div>
      <Napisy napisy={napisy} kto={kto} widoczne={polaczono} />
    </div>
  );
}

const zlotych = (n: number) => new Intl.NumberFormat("pl-PL").format(n) + " zł";

/** Karta obok telefonu: cel rozmowy i dane oferty, o której rozmawiacie. Tylko na szerokim ekranie. */
function PanelBoczny({ boczna, kto }: { boczna: KartaBoczna | null; kto: string }) {
  const o = boczna?.oferta;
  if (!o && !boczna?.cel) return <span className="hidden w-72 xl:block" aria-hidden="true" />;
  const wiersze: [string, string][] = [];
  if (o?.metraz) wiersze.push(["Powierzchnia", `${o.metraz} m²`]);
  if (o?.pokoje) wiersze.push(["Pokoje", String(o.pokoje)]);
  if (o?.pietro != null) wiersze.push(["Piętro", o.pietro === 0 ? "parter" : String(o.pietro)]);
  if (o?.rok) wiersze.push(["Rok budowy", String(o.rok)]);
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 xl:flex">
      {o && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] text-white">
          <div className="bg-gradient-to-br from-emerald-500/25 via-cyan-500/10 to-transparent px-5 pb-4 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Oferta w rozmowie</p>
            <p className="mt-2 text-lg font-semibold leading-snug">{o.tytul || [o.dzielnica, o.miasto].filter(Boolean).join(", ")}</p>
            <p className="text-sm text-white/55">{[o.dzielnica, o.miasto].filter(Boolean).join(", ")}</p>
            {o.cena ? (
              <p className="mt-3 text-2xl font-semibold tabular-nums">
                {zlotych(o.cena)}
                {o.metraz ? <span className="ml-2 text-sm font-normal text-white/50">{zlotych(Math.round(o.cena / o.metraz))}/m²</span> : null}
              </p>
            ) : null}
          </div>
          {wiersze.length > 0 && (
            <dl className="divide-y divide-white/10 px-5 text-sm">
              {wiersze.map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5">
                  <dt className="text-white/50">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
      {boczna?.cel && (
        <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.07] p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Twój cel</p>
          <p className="mt-2 text-sm leading-relaxed text-white/85">{boczna.cel}</p>
          <p className="mt-3 text-xs text-white/40">Rozmawiasz z: {kto}</p>
        </div>
      )}
    </aside>
  );
}

/** Napisy na żywo obok telefonu: ostatnie wypowiedzi obu stron. */
function Napisy({ napisy, kto, widoczne }: { napisy: Wypowiedz[]; kto: string; widoczne: boolean }) {
  const [schowane, setSchowane] = useState(false);
  return (
    <aside className="hidden w-80 shrink-0 self-center xl:block" aria-live="polite">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Transkrypcja na żywo</p>
          <button type="button" onClick={() => setSchowane((x) => !x)} className="text-xs text-white/45 hover:text-white">
            {schowane ? "Pokaż" : "Schowaj"}
          </button>
        </div>
        {!schowane && (
          <div className="mt-4 flex max-h-[52vh] flex-col gap-3 overflow-hidden">
            {napisy.length === 0 ? (
              <p className="text-sm text-white/35">{widoczne ? "Słucham. Napisy pojawią się, gdy ktoś coś powie." : "Łączę..."}</p>
            ) : (
              napisy.map((n, i) => (
                <p key={i} className={`text-sm leading-relaxed ${i === napisy.length - 1 ? "text-white" : "text-white/55"}`}>
                  <span className="mr-2 font-mono text-[11px] tabular-nums text-white/35">
                    {String(Math.floor((n.t ?? 0) / 60)).padStart(2, "0")}:{String((n.t ?? 0) % 60).padStart(2, "0")}
                  </span>
                  <b className={n.role === "agent" ? "text-emerald-300" : "text-cyan-200"}>{n.role === "agent" ? "Ty" : kto}:</b>{" "}
                  {n.content}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function IkonaZasiegu() {
  return (
    <svg className="h-3 w-3.5" viewBox="0 0 16 12" fill="currentColor">
      <rect x="0" y="8" width="2.5" height="4" rx="0.6" />
      <rect x="4" y="5.5" width="2.5" height="6.5" rx="0.6" />
      <rect x="8" y="3" width="2.5" height="9" rx="0.6" />
      <rect x="12" y="0" width="2.5" height="12" rx="0.6" opacity="0.4" />
    </svg>
  );
}

function IkonaWifi() {
  return (
    <svg className="h-3 w-3.5" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth={1.4}>
      <path strokeLinecap="round" d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 6.9a6 6 0 0 1 8 0" />
      <circle cx="8" cy="9.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IkonaBaterii() {
  return (
    <svg className="h-3 w-6" viewBox="0 0 26 12" fill="none">
      <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.5" />
      <rect x="2" y="2" width="16" height="8" rx="1.8" fill="currentColor" />
      <path d="M23.5 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" opacity="0.5" />
    </svg>
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
