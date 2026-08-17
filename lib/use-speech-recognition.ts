"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimalne typy Web Speech API (nie ma ich w standardowym lib.dom).
type SpeechRecognitionResultLike = {
  0: { transcript: string };
  isFinal: boolean;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Rozpoznawanie mowy PL w przeglądarce (darmowe, natywne).
 * onFinal wywoływany z finalnym tekstem fragmentu.
 */
const ERROR_MESSAGES: Record<string, string | null> = {
  "not-allowed": "Brak dostępu do mikrofonu. Zezwól na mikrofon w ustawieniach przeglądarki i spróbuj ponownie.",
  "service-not-allowed": "Mikrofon zablokowany w ustawieniach przeglądarki/systemu.",
  "audio-capture": "Nie wykryto mikrofonu w urządzeniu.",
  "network": "Rozpoznawanie mowy wymaga internetu - sprawdź połączenie.",
  "no-speech": null, // nie traktujemy jako błąd
  "aborted": null,
};

export function useSpeechRecognition(onText: (text: string, isFinal: boolean) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    setSupported(!!Ctor);
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = "pl-PL";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (final) onTextRef.current(final, true);
      else if (interim) onTextRef.current(interim, false);
    };
    rec.onerror = (e) => {
      setListening(false);
      const msg = ERROR_MESSAGES[e.error];
      // undefined = nieznany błąd → komunikat ogólny; null = ignorujemy (np. cisza)
      if (msg === undefined) setError("Nie udało się uruchomić dyktowania. Spróbuj ponownie.");
      else if (msg) setError(msg);
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {}
    };
  }, []);

  const start = useCallback(() => {
    if (!recRef.current || listening) return;
    setError(null);
    try {
      recRef.current.start();
      setListening(true);
    } catch {
      // start() rzuca, gdy wywołane zbyt szybko po poprzednim - spróbuj ponownie za chwilę
      setError("Nie udało się uruchomić mikrofonu. Kliknij jeszcze raz.");
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {}
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, error, start, stop, toggle };
}
