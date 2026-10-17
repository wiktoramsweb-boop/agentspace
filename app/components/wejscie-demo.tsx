/** Wejście do działającej aplikacji demo, jednym kliknięciem, bez zakładania konta. */
export function WejscieDemo({ blad, en = false }: { blad?: string; en?: boolean }) {
  const komunikat =
    blad === "limit"
      ? en ? "Too many attempts from this network. Try again in an hour." : "Za dużo wejść z tej sieci. Spróbuj za godzinę."
      : blad
        ? en ? "Demo is unavailable right now. Try again in a moment." : "Demo jest chwilowo niedostępne. Spróbuj za chwilę."
        : null;
  const punkty = en
    ? ["Full app on a sample agency with real-looking data", "AI Coach and AI assistant work for real", "Saving changes, invites and e-mails are disabled"]
    : ["Cała aplikacja na przykładowym biurze z danymi", "AI Coach i asystent AI działają naprawdę", "Zapisywanie, zaproszenia i maile są wyłączone"];
  return (
    <section id="wejdz" className="px-6 py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-8 rounded-3xl border border-emerald-500/30 bg-[var(--mk-card-bg)] p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">{en ? "Live demo" : "Wersja demo"}</p>
          <h2 className="wd-tytul text-3xl font-semibold tracking-tight md:text-4xl">{en ? "Click through the real app" : "Przeklikaj prawdziwą aplikację"}</h2>
          <ul className="mt-6 space-y-2 text-[var(--color-mk-muted)]">
            {punkty.map((p) => (
              <li key={p} className="flex gap-3">
                <span className="text-emerald-400">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <form action="/wejdz-demo" method="post" className="flex flex-col gap-3">
          <button className="rounded-xl bg-emerald-500 px-8 py-4 text-lg font-semibold text-[var(--mk-on-accent)] transition hover:bg-emerald-400">
            {en ? "Open demo" : "Wejdź do demo"} →
          </button>
          <p className="text-center text-sm text-[var(--color-mk-muted)]">{en ? "No sign-up, no card." : "Bez rejestracji i bez karty."}</p>
          {komunikat && <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-400">{komunikat}</p>}
        </form>
      </div>
    </section>
  );
}
