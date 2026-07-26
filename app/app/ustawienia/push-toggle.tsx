"use client";

import { useEffect, useState } from "react";
import { useToast } from "../components/toast";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type Status = "loading" | "unsupported" | "ios-not-installed" | "off" | "on";

export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (!supported) {
      // iOS pokazuje PushManager dopiero po instalacji apki na ekran główny
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error iOS Safari
        window.navigator.standalone === true;
      setStatus(ios && !standalone ? "ios-not-installed" : "unsupported");
      return;
    }

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast("Nie udzielono zgody na powiadomienia", "error");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        toast("Brak konfiguracji push (klucz VAPID)", "error");
        setBusy(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error();
      setStatus("on");
      toast("Powiadomienia włączone ✅");
      // Wyślij testowe powiadomienie potwierdzające
      fetch("/api/push/test", { method: "POST" }).catch(() => {});
    } catch {
      toast("Nie udało się włączyć powiadomień", "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
      toast("Powiadomienia wyłączone", "info");
    } catch {
      toast("Nie udało się wyłączyć", "error");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-zinc-500">Sprawdzam…</p>;
  }

  if (status === "unsupported") {
    return (
      <p className="text-sm text-zinc-400">
        Ta przeglądarka nie obsługuje powiadomień push. Użyj Chrome (Android/komputer)
        lub zainstaluj apkę na iPhone.
      </p>
    );
  }

  if (status === "ios-not-installed") {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm text-amber-200">
        Aby włączyć powiadomienia na iPhone, najpierw <strong>zainstaluj apkę</strong>:
        Udostępnij → „Do ekranu początkowego". Potem otwórz apkę z ekranu głównego i wróć tutaj.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-white">
          Powiadomienia {status === "on" ? "włączone" : "wyłączone"}
        </p>
        <p className="text-sm text-zinc-400">
          Poranna odprawa i przypomnienia o kontakcie z klientem.
        </p>
      </div>
      <button
        onClick={status === "on" ? disable : enable}
        disabled={busy}
        className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
          status === "on"
            ? "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        }`}
      >
        {busy ? "…" : status === "on" ? "Wyłącz" : "Włącz powiadomienia"}
      </button>
    </div>
  );
}
