"use client";

import { useState } from "react";
import { Sidebar } from "../app/components/sidebar";
import { ThemeToggle } from "../app/components/theme-toggle";
import { PageHeader, StatCard, Card, Badge } from "../app/components/ui";
import { Button, SegmentedToggle } from "../app/components/kit";
import { PROPERTY_STATUSES, CLIENT_STATUSES } from "@/lib/types";
import { PropertyWizard } from "../app/nieruchomosci/property-wizard";

export function ThemePreview() {
  const [scope, setScope] = useState<"all" | "mine">("all");

  return (
    <div className="app-shell min-h-screen text-slate-900 md:flex">
      <Sidebar role="owner" fullName="Wiktor Szostek" agencyName="Spectra Nieruchomości" />
      <main className="flex-1 px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <PageHeader
            title="Nieruchomości"
            subtitle="12 aktywnych, 34 w biurze"
            action={
              <div className="flex items-center gap-2">
                <div className="w-44 rounded-xl bg-slate-800 p-1">
                  <ThemeToggle />
                </div>
                <PropertyWizard clients={[{ id: "1", name: "Jan Kowalski" }, { id: "2", name: "Anna Nowak" }]} />
              </div>
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Aktywne oferty" value="12" sub="w całym biurze" />
            <StatCard label="Średnia cena" value="654 000 zł" sub="mieszkania" />
            <StatCard label="Na stronie" value="9" sub="opublikowanych" accent />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SegmentedToggle
              value={scope}
              onChange={setScope}
              accent="emerald"
              options={[
                { value: "all", label: "Wszystkie (34)" },
                { value: "mine", label: "Moje (8)" },
              ]}
            />
            <input
              placeholder="Szukaj po nazwie, adresie, mieście..."
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <Card>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
              Statusy nieruchomości
            </h2>
            <div className="mb-5 flex flex-wrap gap-2">
              {PROPERTY_STATUSES.map((s) => (
                <span key={s.value} className={`rounded-md px-2 py-1 text-xs font-medium ${s.color}`}>
                  {s.label}
                </span>
              ))}
            </div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
              Statusy klientów
            </h2>
            <div className="flex flex-wrap gap-2">
              {CLIENT_STATUSES.map((s) => (
                <span key={s.value} className={`rounded-md px-2 py-1 text-xs font-medium ${s.color}`}>
                  {s.label}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Przyciski (akcenty modułów)</h2>
            <div className="flex flex-wrap gap-2">
              <Button accent="emerald">Zapisz</Button>
              <Button accent="cyan">Wyślij</Button>
              <Button accent="violet">Generuj AI</Button>
              <Button accent="amber">Drukuj</Button>
              <Button accent="emerald" variant="ghost">
                Anuluj
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>Neutralny</Badge>
              <Badge className="bg-emerald-100 text-emerald-700">Sukces</Badge>
              <Badge className="bg-amber-100 text-amber-700">Uwaga</Badge>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { t: "Kraków, ul. Sołtysowska", p: "754 999 zł", m: "47 m² · 2 pok.", k: "Sprzedaż" },
              { t: "Kraków, os. Stalowe", p: "597 000 zł", m: "48 m² · 2 pok.", k: "Sprzedaż" },
              { t: "Kraków, ul. Wielicka", p: "3 200 zł/mc", m: "38 m² · 2 pok.", k: "Wynajem" },
            ].map((o) => (
              <div
                key={o.t}
                className="card-glow overflow-hidden rounded-2xl border border-slate-200 bg-white"
                style={{ ["--glow" as string]: "rgba(16,185,129,0.4)" }}
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xl">
                      🏢
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      {o.k}
                    </span>
                  </div>
                  <h3 className="mb-1 font-semibold text-slate-900">{o.t}</h3>
                  <p className="mb-3 text-sm text-slate-500">📍 Kraków</p>
                  <p className="text-2xl font-bold text-slate-900">{o.p}</p>
                  <p className="mt-1 text-sm text-slate-500">{o.m}</p>
                </div>
              </div>
            ))}
          </div>

          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 font-medium">Klient</th>
                  <th className="py-2 font-medium">Telefon</th>
                  <th className="py-2 text-right font-medium">Budżet</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Małgorzata Zielińska", "600 100 200", "900 000 zł"],
                  ["Roman Kalinowski", "600 300 400", "650 000 zł"],
                ].map((r) => (
                  <tr key={r[0]} className="border-b border-slate-200 last:border-0">
                    <td className="py-2.5 font-medium text-slate-800">{r[0]}</td>
                    <td className="py-2.5 text-slate-600">{r[1]}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-800">{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </main>
    </div>
  );
}
