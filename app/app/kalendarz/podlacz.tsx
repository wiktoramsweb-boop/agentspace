"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { polaczKalendarz } from "./podlacz-actions";
import { useToast } from "../components/toast";

/** Kolejne kroki podłączenia: wybór kalendarza otwiera jego własny ekran dodawania. */
export function PodlaczKalendarz({ token, ostatnio, adresBazowy }: { token: string | null; ostatnio: string | null; adresBazowy: string }) {
  const router = useRouter();
  const toast = useToast();
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const url = token ? `${adresBazowy}/api/kalendarz/${token}` : "";
  const webcal = url.replace(/^https?:/, "webcal:");
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
  const outlook = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(url)}&name=AgentSpace`;

  const wlacz = () =>
    start(async () => {
      setBlad(null);
      const w = await polaczKalendarz();
      if (!w.ok) setBlad(w.blad ?? "Nie udało się.");
      router.refresh();
    });

  if (!token) {
    return (
      <div>
        <button type="button" disabled={pending} onClick={wlacz} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
          {pending ? "Włączam…" : "Włącz podłączanie kalendarza"}
        </button>
        {blad && <p className="mt-2 text-sm text-rose-600">{blad}</p>}
      </div>
    );
  }

  const przycisk = "flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:text-emerald-700";
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-3">
        <a href={google} target="_blank" rel="noopener noreferrer" className={przycisk}>
          Dodaj do Google
        </a>
        <a href={webcal} className={przycisk}>
          Dodaj do Apple
        </a>
        <a href={outlook} target="_blank" rel="noopener noreferrer" className={przycisk}>
          Dodaj do Outlooka
        </a>
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {ostatnio ? `Kalendarz pobrał dane ${new Date(ostatnio).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}.` : "Po dodaniu wizyty pojawią się w Twoim kalendarzu."} Twój kalendarz odświeża je sam, Google nawet raz na kilka godzin. Zmiany robisz w AgentSpace.
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <button type="button" onClick={() => navigator.clipboard?.writeText(url).then(() => toast("Skopiowano adres"))} className="font-medium text-emerald-700 hover:underline">
          Kopiuj adres
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Stary adres przestanie działać i trzeba będzie dodać kalendarz od nowa. Kontynuować?")) wlacz();
          }}
          className="font-medium text-slate-500 hover:text-rose-600"
        >
          Zmień adres (gdy ktoś go poznał)
        </button>
      </div>
      {blad && <p className="mt-2 text-sm text-rose-600">{blad}</p>}
    </div>
  );
}
