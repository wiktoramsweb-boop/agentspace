"use client";

import { useEffect, useState } from "react";
import { wlaczPowiadomienia, wylaczPowiadomienia } from "./actions";

/**
 * Włączenie powiadomień w portalu klienta.
 *
 * Na iPhonie działa to dopiero po dodaniu portalu do ekranu początkowego,
 * i to jest ograniczenie systemu, nie nasze. Dlatego zamiast chować przycisk
 * mówimy wprost, co trzeba zrobić: klient, który nie wie dlaczego nie działa,
 * uzna, że aplikacja jest zepsuta.
 */
export function PrzelacznikPowiadomien({ token }: { token: string }) {
  const [stan, setStan] = useState<"sprawdzam" | "brak" | "wylaczone" | "wlaczone" | "odmowa">("sprawdzam");
  const [pracuje, setPracuje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStan("brak");
        return;
      }
      if (Notification.permission === "denied") {
        setStan("odmowa");
        return;
      }
      const rej = await navigator.serviceWorker.getRegistration();
      const sub = await rej?.pushManager.getSubscription();
      setStan(sub ? "wlaczone" : "wylaczone");
    })().catch(() => setStan("brak"));
  }, []);

  async function wlacz() {
    setBlad(null);
    setPracuje(true);
    try {
      const zgoda = await Notification.requestPermission();
      if (zgoda !== "granted") {
        setStan("odmowa");
        return;
      }

      const rej =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;

      const klucz = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!klucz) {
        setBlad("Powiadomienia nie są jeszcze włączone po stronie biura.");
        return;
      }

      const sub = await rej.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: klucz,
      });

      const w = await wlaczPowiadomienia(token, JSON.parse(JSON.stringify(sub)));
      if (w.ok) setStan("wlaczone");
      else setBlad(w.error);
    } catch {
      setBlad("Nie udało się włączyć. Na iPhonie dodaj najpierw tę stronę do ekranu początkowego.");
    } finally {
      setPracuje(false);
    }
  }

  async function wylacz() {
    setPracuje(true);
    try {
      const rej = await navigator.serviceWorker.getRegistration();
      const sub = await rej?.pushManager.getSubscription();
      if (sub) {
        await wylaczPowiadomienia(token, sub.endpoint);
        await sub.unsubscribe();
      }
      setStan("wylaczone");
    } finally {
      setPracuje(false);
    }
  }

  if (stan === "sprawdzam") return null;

  if (stan === "brak") {
    return (
      <p className="portal-kroki" style={{ listStyle: "none", paddingLeft: 0 }}>
        Ta przeglądarka nie obsługuje powiadomień. Na iPhonie dodaj tę stronę do ekranu
        początkowego, wtedy zadziałają.
      </p>
    );
  }

  if (stan === "odmowa") {
    return (
      <p className="portal-kroki" style={{ listStyle: "none", paddingLeft: 0 }}>
        Powiadomienia są zablokowane w ustawieniach przeglądarki. Odblokuj je dla tej strony,
        a potem wróć tutaj.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        className={`portal-przycisk${stan === "wlaczone" ? " obrys" : ""}`}
        disabled={pracuje}
        onClick={() => void (stan === "wlaczone" ? wylacz() : wlacz())}
      >
        {pracuje
          ? "Chwileczkę..."
          : stan === "wlaczone"
            ? "Wyłącz powiadomienia"
            : "Włącz powiadomienia"}
      </button>
      {blad && (
        <p style={{ color: "var(--czerwien)", fontSize: 14, marginTop: 8 }}>{blad}</p>
      )}
    </div>
  );
}
