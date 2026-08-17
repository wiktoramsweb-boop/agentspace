// Szkielet ładowania panelu - pokazuje się podczas renderowania strony po stronie
// serwera, dając wrażenie natychmiastowej reakcji przy nawigacji.
export default function AppLoading() {
  return (
    <div className="animate-pulse">
      {/* Nagłówek */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="h-8 w-56 rounded-lg bg-slate-100" />
          <div className="h-4 w-72 rounded bg-white" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-slate-100" />
      </div>

      {/* Kafelki statystyk */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, n) => (
          <div key={n} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 h-3 w-20 rounded bg-slate-100" />
            <div className="h-7 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Sekcje */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, n) => (
          <div key={n} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="mb-5 h-5 w-32 rounded bg-slate-100" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, m) => (
                <div key={m} className="h-4 w-full rounded bg-white" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
