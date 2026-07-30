"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useToast } from "../../components/toast";

// Wejście kategorii, gdy dane o okolicy doskoczą (fetch async) — delikatny stagger.
const listVariants = { show: { transition: { staggerChildren: 0.05 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] as const } },
};

type Cat = { key: string; label: string; items: { name: string; dist: number }[] };

const ICONS: Record<string, string> = {
  komunikacja: "🚌",
  edukacja: "🎓",
  sklepy: "🛒",
  zdrowie: "➕",
  zielen: "🌳",
};

function fmt(dist: number): string {
  if (dist < 1000) return `${Math.round(dist / 10) * 10} m`;
  return `${(dist / 1000).toFixed(1).replace(".", ",")} km`;
}

export function NearbyCard({ lat, lng }: { lat: number; lng: number }) {
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [error, setError] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/nearby?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.categories) setCats(d.categories);
        else setError(true);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  function copyToDescription() {
    if (!cats) return;
    const lines = cats.map(
      (c) => `${c.label}: ${c.items.map((i) => `${i.name} ${fmt(i.dist)}`).join(", ")}`,
    );
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => toast("Skopiowano — wklej do opisu oferty"))
      .catch(() => toast("Nie udało się skopiować", "error"));
  }

  return (
    <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-6 shadow-sm shadow-black/20">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Co w okolicy</h2>
        {cats && cats.length > 0 && (
          <button
            onClick={copyToDescription}
            className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
          >
            Kopiuj do opisu
          </button>
        )}
      </div>

      {cats === null && !error && (
        <p className="text-sm text-zinc-500">Sprawdzam okolicę…</p>
      )}
      {error && <p className="text-sm text-zinc-500">Nie udało się pobrać danych o okolicy.</p>}
      {cats && cats.length === 0 && (
        <p className="text-sm text-zinc-500">Brak znanych punktów w promieniu ~900 m.</p>
      )}

      {cats && cats.length > 0 && (
        <motion.div className="space-y-3" initial="hidden" animate="show" variants={listVariants}>
          {cats.map((c) => (
            <motion.div key={c.key} variants={itemVariants}>
              <p className="mb-1 text-xs font-medium text-zinc-400">
                {ICONS[c.key] ?? "•"} {c.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.items.map((i, n) => (
                  <span
                    key={n}
                    className="rounded-lg bg-zinc-900/60 px-2 py-1 text-xs text-zinc-300"
                  >
                    {i.name} · <span className="text-zinc-500">{fmt(i.dist)}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
