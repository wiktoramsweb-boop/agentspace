"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUpOwner } from "../auth/actions";
import { AuthShell } from "../components/auth/auth-shell";
import { FormField, SubmitButton, FormError } from "../components/auth/form-field";

type Firma = { nazwa: string; nip: string | null; ulica: string | null; kod: string | null; miasto: string | null };

const pole =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-zinc-500 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20";

function Naglowek({ ikona, children }: { ikona: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 border-b border-white/10 pb-2 text-sm font-semibold text-emerald-400">
      <span aria-hidden="true">{ikona}</span>
      {children}
    </p>
  );
}

export function FormularzRejestracji({ email, dniProbne }: { email: string; dniProbne: number }) {
  const [state, formAction, pending] = useActionState(signUpOwner, undefined);
  const [numer, setNumer] = useState("");
  const [nazwa, setNazwa] = useState("");
  const [firma, setFirma] = useState<Firma | null>(null);
  const [szukam, setSzukam] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [pokazHaslo, setPokazHaslo] = useState(false);

  async function wyszukaj() {
    const czysty = numer.replace(/[\s-]/g, "");
    if (!/^\d{10}$/.test(czysty)) {
      setInfo("NIP i KRS mają po 10 cyfr.");
      return;
    }
    setSzukam(true);
    setInfo(null);
    try {
      const r = await fetch(`/api/firma?numer=${czysty}`);
      const d = (await r.json()) as { firma?: Firma; error?: string };
      if (d.firma) {
        setFirma(d.firma);
        setNazwa(d.firma.nazwa);
        setInfo(null);
      } else {
        setFirma(null);
        setInfo(d.error ?? "Nie znaleźliśmy firmy. Wpisz nazwę ręcznie.");
      }
    } catch {
      setInfo("Rejestr nie odpowiada. Wpisz nazwę ręcznie.");
    } finally {
      setSzukam(false);
    }
  }

  return (
    <AuthShell
      title="Załóż konto biura"
      subtitle={`${dniProbne} dni za darmo, z pełnym dostępem i bez karty. Konto zakłada właściciel albo osoba zarządzająca biurem, agentów zaprosisz po zalogowaniu.`}
      footer={
        <>
          Masz już konto?{" "}
          <Link href="/login" className="font-medium text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline">
            Zaloguj się
          </Link>
          <span className="mx-2 text-zinc-600">·</span>
          Pracujesz w biurze, które ma AgentSpace? Poproś szefa o zaproszenie.
        </>
      }
    >
      <form action={formAction} className="space-y-5">
        {/* Pułapka na boty: człowiek tego pola nie widzi i go nie wypełni. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <input type="hidden" name="nip" value={firma?.nip ?? ""} />
        <input type="hidden" name="ulica" value={firma?.ulica ?? ""} />
        <input type="hidden" name="kod" value={firma?.kod ?? ""} />
        <input type="hidden" name="miasto" value={firma?.miasto ?? ""} />

        <Naglowek ikona="▦">Dane biura</Naglowek>
        <div>
          <label htmlFor="numer" className="mb-2 block text-sm font-medium text-zinc-300">
            NIP albo KRS <span className="text-zinc-500">(opcjonalnie)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="numer"
              inputMode="numeric"
              value={numer}
              onChange={(e) => setNumer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void wyszukaj();
                }
              }}
              placeholder="np. 6772516327"
              className={pole}
            />
            <button
              type="button"
              onClick={wyszukaj}
              disabled={szukam}
              className="shrink-0 rounded-xl border border-emerald-400/60 px-4 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-50"
            >
              {szukam ? "Szukam..." : "Wyszukaj"}
            </button>
          </div>
          <p className={`mt-1.5 text-xs ${info ? "text-amber-300" : "text-zinc-500"}`}>
            {info ?? (firma ? `Znalezione: ${[firma.ulica, firma.kod, firma.miasto].filter(Boolean).join(", ")}. Dane trafią do ustawień firmy.` : "Pobierzemy nazwę i adres z rejestru, żeby nie przepisywać.")}
          </p>
        </div>
        <div>
          <label htmlFor="agencyName" className="mb-2 block text-sm font-medium text-zinc-300">
            Nazwa biura <span className="text-emerald-400">*</span>
          </label>
          <input id="agencyName" name="agencyName" required value={nazwa} onChange={(e) => setNazwa(e.target.value)} placeholder="Np. Nowak Nieruchomości" className={pole} />
        </div>

        <Naglowek ikona="◉">Dane kontaktowe</Naglowek>
        <FormField label="Imię i nazwisko" name="fullName" autoComplete="name" placeholder="Jan Kowalski" />
        <FormField label="E-mail służbowy" name="email" type="email" autoComplete="email" placeholder="ty@biuro.pl" defaultValue={email} />
        <FormField label="Telefon" name="phone" type="tel" autoComplete="tel" placeholder="+48 600 000 000" required={false} />

        <Naglowek ikona="🔒">Hasło do konta</Naglowek>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
            Hasło <span className="text-zinc-500">(min. 8 znaków)</span> <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <input id="password" name="password" type={pokazHaslo ? "text" : "password"} required minLength={8} autoComplete="new-password" className={`${pole} pr-20`} />
            <button
              type="button"
              onClick={() => setPokazHaslo((v) => !v)}
              className="absolute inset-y-0 right-3 my-auto h-8 rounded-lg px-2 text-xs font-medium text-zinc-400 hover:text-white"
            >
              {pokazHaslo ? "Ukryj" : "Pokaż"}
            </button>
          </div>
        </div>

        <FormError message={state?.error} />
        <SubmitButton pending={pending}>Załóż konto biura →</SubmitButton>
        <p className="text-center text-xs leading-relaxed text-zinc-400">
          Zakładając konto akceptujesz{" "}
          <Link href="/regulamin" className="underline underline-offset-2 hover:text-emerald-300">regulamin</Link>,{" "}
          <Link href="/umowa-powierzenia" className="underline underline-offset-2 hover:text-emerald-300">umowę powierzenia danych</Link> i{" "}
          <Link href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-emerald-300">politykę prywatności</Link>.
        </p>
      </form>
      {/* Osobny formularz: przycisk w środku wysłałby do demo także wpisane hasło. */}
      <form action="/wejdz-demo" method="post" className="mt-4 text-center text-xs text-zinc-500">
        Wolisz najpierw zobaczyć?{" "}
        <button className="font-medium text-emerald-400 underline-offset-2 hover:underline">Wejdź do demo bez rejestracji</button>
      </form>
    </AuthShell>
  );
}
