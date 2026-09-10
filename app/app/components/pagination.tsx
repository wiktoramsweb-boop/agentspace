"use client";

/**
 * Stronicowanie list (klienci, oferty).
 *
 * Dane i tak przychodzą w całości, więc dzielimy je po stronie przeglądarki.
 * Chodzi o to, żeby przy kilkuset pozycjach nie renderować wszystkiego naraz
 * i żeby agent miał gdzie „wrócić", zamiast przewijać kilometrową listę.
 */
export const PAGE_SIZE = 25;

export function Pagination({
  page,
  total,
  pageSize = PAGE_SIZE,
  onPage,
  label = "pozycji",
}: {
  page: number;
  total: number;
  pageSize?: number;
  onPage: (p: number) => void;
  label?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);

  // Okno numerów wokół bieżącej strony, żeby pasek nie rósł w nieskończoność.
  const window: number[] = [];
  const start = Math.max(0, Math.min(page - 2, pages - 5));
  for (let i = start; i < Math.min(pages, start + 5); i++) window.push(i);

  const btn =
    "rounded-lg border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        {from}-{to} z {total} {label}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className={`${btn} border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}
        >
          Poprzednia
        </button>
        {window.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPage(i)}
            aria-current={i === page ? "page" : undefined}
            className={`${btn} ${
              i === page
                ? "border-emerald-500 bg-emerald-500 font-semibold text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages - 1}
          className={`${btn} border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}
        >
          Następna
        </button>
      </div>
    </div>
  );
}
