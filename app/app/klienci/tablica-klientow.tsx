"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tablica, type KolumnaTablicy, type Przeniesienie } from "../components/tablica";
import { kwotaKrotko } from "../components/widok";
import { przeniesKlienta } from "../tablica-actions";
import { CLIENT_STATUSES, CLIENT_TYPE_LABELS } from "@/lib/types";
import type { KartaKlienta } from "@/lib/data-tablica";

const KROPKA: Record<string, string> = {
  nowy: "bg-blue-500",
  w_kontakcie: "bg-cyan-500",
  oglada: "bg-violet-500",
  negocjacje: "bg-amber-500",
  zamkniety: "bg-emerald-500",
  stracony: "bg-red-500",
};

function dniOd(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
}

function inicjaly(n: string | null): string {
  if (!n) return "?";
  return n
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() ?? "")
    .join("");
}

export function TablicaKlientow({ karty }: { karty: KartaKlienta[] }) {
  const router = useRouter();

  const kolumny: KolumnaTablicy[] = CLIENT_STATUSES.map((s) => ({
    id: s.value,
    nazwa: s.label,
    kolor: KROPKA[s.value] ?? "bg-slate-400",
    dopisek: s.value === "zamkniety" || s.value === "stracony" ? "Z ostatnich 30 dni" : undefined,
    podsumowanie: (lista) => {
      const suma = (lista as KartaKlienta[]).reduce((a, k) => a + (k.budget_pln ?? 0), 0);
      return suma > 0 ? <>Budżety: <span className="font-semibold text-slate-700">{kwotaKrotko(suma)}</span></> : null;
    },
  }));

  async function przenies(p: Przeniesienie) {
    const blad = await przeniesKlienta(p.id, p.kolumna, p.kolejnosc);
    if (!blad) router.refresh();
    return blad;
  }

  return (
    <Tablica
      kolumny={kolumny}
      karty={karty}
      onPrzenies={przenies}
      etykietaKarty={(k) => k.name}
      renderKarta={(k) => <KartaKlientaWidok k={k} />}
    />
  );
}

function KartaKlientaWidok({ k }: { k: KartaKlienta }) {
  const cisza = dniOd(k.last_contact_at ?? k.created_at);
  const zamkniety = k.kolumna === "zamkniety" || k.kolumna === "stracony";
  const kolorCiszy =
    zamkniety || cisza == null
      ? "text-slate-400"
      : cisza > 14
        ? "text-red-600"
        : cisza > 7
          ? "text-amber-600"
          : "text-slate-500";
  const kontaktDzis = k.next_contact_at && k.next_contact_at.slice(0, 10) <= new Date().toISOString().slice(0, 10);

  return (
    <Link
      href={`/app/klienci/${k.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-3.5 pr-10 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:shadow-md"
    >
      <p className="truncate text-sm font-semibold text-slate-900">{k.name}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        {CLIENT_TYPE_LABELS[k.type as keyof typeof CLIENT_TYPE_LABELS] ?? k.type}
        {k.budget_pln ? ` · ${kwotaKrotko(Number(k.budget_pln))}` : ""}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700">
            {inicjaly(k.opiekun)}
          </span>
          <span className="truncate">{k.opiekun ?? "Pula biura"}</span>
        </span>
        {!zamkniety && cisza != null && (
          <span className={`flex-shrink-0 text-[11px] font-medium ${kolorCiszy}`} title="Dni od ostatniego kontaktu">
            {cisza === 0 ? "kontakt dziś" : `${cisza} d. ciszy`}
          </span>
        )}
      </div>
      {kontaktDzis && !zamkniety && (
        <p className="mt-2 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">Zaplanowany kontakt na dziś</p>
      )}
    </Link>
  );
}
