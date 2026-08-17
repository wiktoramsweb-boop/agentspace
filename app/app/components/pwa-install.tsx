"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed";

export function PwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Rejestracja service workera
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Już zainstalowana? (tryb standalone / iOS)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error - iOS Safari
      window.navigator.standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY)) return;

    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);

    // Android/desktop - przechwyć natywny prompt instalacji
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS nie emituje beforeinstallprompt - pokaż baner z instrukcją
    if (ios) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function dismiss() {
    setVisible(false);
    setShowIOSHelp(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      dismiss();
    }
  }

  if (!visible) return null;

  return (
    <div className="print-hide fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-md md:left-auto md:right-4 md:mx-0">
      <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-2xl shadow-black/50 backdrop-blur">
        {!showIOSHelp ? (
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500">
              <HomeMark />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Zainstaluj AgentSpace</p>
              <p className="text-xs text-slate-500">
                Miej apkę na telefonie - szybki dostęp i powiadomienia.
              </p>
            </div>
            <button
              onClick={install}
              className="flex-shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              {isIOS ? "Jak?" : "Zainstaluj"}
            </button>
            <button
              onClick={dismiss}
              aria-label="Zamknij"
              className="flex-shrink-0 text-slate-500 transition hover:text-slate-900"
            >
              ✕
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Instalacja na iPhone</p>
              <button onClick={dismiss} aria-label="Zamknij" className="text-slate-500 hover:text-slate-900">
                ✕
              </button>
            </div>
            <ol className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <Step n={1} /> Dotknij ikony <ShareIcon /> <span className="text-slate-500">(Udostępnij)</span> na dole Safari
              </li>
              <li className="flex items-center gap-2">
                <Step n={2} /> Wybierz <strong className="text-slate-900">„Do ekranu początkowego"</strong>
              </li>
              <li className="flex items-center gap-2">
                <Step n={3} /> Potwierdź <strong className="text-slate-900">„Dodaj"</strong> - gotowe ✅
              </li>
            </ol>
            <p className="mt-3 text-xs text-slate-500">
              Na iPhone powiadomienia działają tylko po zainstalowaniu apki w ten sposób.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
      {n}
    </span>
  );
}

function HomeMark() {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 138 L410 272 L368 272 L368 392 L296 392 L296 322 L216 322 L216 392 L144 392 L144 272 L102 272 Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="inline h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0-13 4 4m-4-4-4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}
