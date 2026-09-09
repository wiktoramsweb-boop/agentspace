"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { Match } from "@/lib/matching";
import { setMatchStatus } from "../actions";
import { PROPERTY_ICONS } from "../../components/icons";
import { MATCH_STATUSES } from "@/lib/types";

const STATUS_MAP = Object.fromEntries(MATCH_STATUSES.map((s) => [s.value, s]));
const zl = (n: number | null) =>
  n == null ? "-" : new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " zł";

export function MatchList({
  searchId,
  matches,
  statuses,
}: {
  searchId: string;
  matches: Match[];
  statuses: Record<string, string>;
}) {
  const [pending, start] = useTransition();

  if (matches.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
        Brak ofert spełniających te kryteria. Poszerz zakres ceny lub lokalizacji, albo poczekaj na
        nowe oferty - system sprawdza je automatycznie.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const p = m.property;
        const Icon = PROPERTY_ICONS[p.property_type] ?? PROPERTY_ICONS.inne;
        const st = statuses[p.id];
        const stMeta = st ? STATUS_MAP[st] : null;

        return (
          <div
            key={p.id}
            className={`overflow-hidden rounded-2xl border bg-white transition hover:shadow-sm ${
              m.fits ? "border-emerald-200" : "border-amber-200"
            }`}
          >
            <div className="flex flex-wrap items-start gap-4 p-4">
              <span
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white ${
                  m.fits ? "bg-emerald-500" : "bg-amber-500"
                }`}
              >
                <Icon className="h-6 w-6" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/app/nieruchomosci/${p.id}`}
                    className="font-semibold text-slate-900 hover:text-emerald-600 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      m.fits ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {m.fits ? "Pasuje" : "Prawie pasuje"} · {m.score}%
                  </span>
                  {stMeta && (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${stMeta.color}`}>
                      {stMeta.label}
                    </span>
                  )}
                </div>

                <p className="mb-2 text-sm text-slate-600">
                  {zl(p.price_pln)}
                  {p.area_m2 ? ` · ${p.area_m2} m²` : ""}
                  {p.rooms ? ` · ${p.rooms} pok.` : ""}
                  {p.city ? ` · ${p.city}` : ""}
                </p>

                {/* Dlaczego pasuje albo co nie gra - agent widzi to od razu */}
                <div className="flex flex-wrap gap-1.5">
                  {m.reasons.map((r) => (
                    <span
                      key={r.label}
                      className={`rounded-md px-2 py-0.5 text-xs ${
                        r.ok ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                      }`}
                      title={r.detail}
                    >
                      {r.ok ? "✓" : "!"} {r.label}
                      {r.detail ? `: ${r.detail}` : ""}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-shrink-0 flex-wrap gap-1.5">
                <ActionBtn
                  active={st === "wyslane"}
                  disabled={pending}
                  onClick={() => start(() => setMatchStatus(searchId, p.id, "wyslane"))}
                >
                  Wysłane
                </ActionBtn>
                <ActionBtn
                  active={st === "zainteresowany"}
                  disabled={pending}
                  tone="emerald"
                  onClick={() => start(() => setMatchStatus(searchId, p.id, "zainteresowany"))}
                >
                  Zainteresowany
                </ActionBtn>
                <ActionBtn
                  active={st === "odrzucone"}
                  disabled={pending}
                  tone="slate"
                  onClick={() => start(() => setMatchStatus(searchId, p.id, "odrzucone"))}
                >
                  Odrzuć
                </ActionBtn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionBtn({
  children,
  active,
  disabled,
  onClick,
  tone = "blue",
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tone?: "blue" | "emerald" | "slate";
}) {
  const tones = {
    blue: active ? "bg-blue-500 text-white" : "text-blue-700 hover:bg-blue-50",
    emerald: active ? "bg-emerald-500 text-white" : "text-emerald-700 hover:bg-emerald-50",
    slate: active ? "bg-slate-500 text-white" : "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
