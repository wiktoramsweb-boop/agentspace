import type { GameData } from "@/lib/gamification";

export function GameStrip({ game }: { game: GameData }) {
  const { level, xp, totals } = game;
  const nextBadge = game.badges.find((b) => !b.unlocked);

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
      {/* Poziom + XP */}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-slate-50 p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-violet-700">
              {level.level}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{level.title}</p>
              <p className="text-xs text-slate-500">{xp} XP łącznie</p>
            </div>
          </div>
          <span className="text-xs text-slate-500">
            {level.xpInLevel}/{level.xpForNext} do poziomu {level.level + 1}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all"
            style={{ width: `${level.progressPct}%` }}
          />
        </div>
      </div>

      {/* Passa */}
      <div className="flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-50 p-5">
        <span className="text-4xl">{totals.streak > 0 ? "🔥" : "💤"}</span>
        <div>
          <p className="text-2xl font-bold text-slate-900">{totals.streak} {totals.streak === 1 ? "dzień" : "dni"}</p>
          <p className="text-xs text-slate-500">passa z celem telefonów</p>
        </div>
      </div>

      {/* Następna odznaka */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-300 bg-white p-5">
        {nextBadge ? (
          <>
            <span className="text-4xl opacity-40 grayscale">{nextBadge.icon}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{nextBadge.label}</p>
              <p className="text-xs text-slate-500">{nextBadge.description}</p>
              {nextBadge.progress && (
                <p className="mt-1 text-xs text-emerald-600">
                  {nextBadge.progress.current}/{nextBadge.progress.target}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <span className="text-4xl">👑</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Wszystkie odznaki!</p>
              <p className="text-xs text-slate-500">Jesteś legendą</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function BadgesCard({ game }: { game: GameData }) {
  const unlocked = game.badges.filter((b) => b.unlocked).length;
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Osiągnięcia</h2>
        <span className="text-sm text-slate-500">{unlocked}/{game.badges.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {game.badges.map((b) => (
          <div
            key={b.id}
            className={`rounded-xl border p-3 text-center transition ${
              b.unlocked
                ? "border-emerald-500/30 bg-emerald-50"
                : "border-slate-300 bg-white"
            }`}
            title={b.description}
          >
            <div className={`mb-1 text-3xl ${b.unlocked ? "" : "opacity-30 grayscale"}`}>{b.icon}</div>
            <p className={`text-xs font-medium ${b.unlocked ? "text-slate-900" : "text-slate-500"}`}>{b.label}</p>
            {!b.unlocked && b.progress && (
              <p className="mt-1 text-[10px] text-slate-400">{b.progress.current}/{b.progress.target}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
