import type { GameData } from "@/lib/gamification";

export function GameStrip({ game }: { game: GameData }) {
  const { level, xp, totals } = game;
  const nextBadge = game.badges.find((b) => !b.unlocked);

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
      {/* Poziom + XP */}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-zinc-800/40 p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-lg font-bold text-violet-300">
              {level.level}
            </div>
            <div>
              <p className="font-semibold text-white">{level.title}</p>
              <p className="text-xs text-zinc-400">{xp} XP łącznie</p>
            </div>
          </div>
          <span className="text-xs text-zinc-500">
            {level.xpInLevel}/{level.xpForNext} do poziomu {level.level + 1}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all"
            style={{ width: `${level.progressPct}%` }}
          />
        </div>
      </div>

      {/* Passa */}
      <div className="flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-zinc-800/40 p-5">
        <span className="text-4xl">{totals.streak > 0 ? "🔥" : "💤"}</span>
        <div>
          <p className="text-2xl font-bold text-white">{totals.streak} {totals.streak === 1 ? "dzień" : "dni"}</p>
          <p className="text-xs text-zinc-400">passa z celem telefonów</p>
        </div>
      </div>

      {/* Następna odznaka */}
      <div className="flex items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-800/40 p-5">
        {nextBadge ? (
          <>
            <span className="text-4xl opacity-40 grayscale">{nextBadge.icon}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{nextBadge.label}</p>
              <p className="text-xs text-zinc-400">{nextBadge.description}</p>
              {nextBadge.progress && (
                <p className="mt-1 text-xs text-emerald-400">
                  {nextBadge.progress.current}/{nextBadge.progress.target}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <span className="text-4xl">👑</span>
            <div>
              <p className="text-sm font-semibold text-white">Wszystkie odznaki!</p>
              <p className="text-xs text-zinc-400">Jesteś legendą</p>
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
    <div className="rounded-2xl border border-zinc-700 bg-zinc-800/40 p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Osiągnięcia</h2>
        <span className="text-sm text-zinc-400">{unlocked}/{game.badges.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {game.badges.map((b) => (
          <div
            key={b.id}
            className={`rounded-xl border p-3 text-center transition ${
              b.unlocked
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-zinc-700 bg-zinc-800/40"
            }`}
            title={b.description}
          >
            <div className={`mb-1 text-3xl ${b.unlocked ? "" : "opacity-30 grayscale"}`}>{b.icon}</div>
            <p className={`text-xs font-medium ${b.unlocked ? "text-white" : "text-zinc-500"}`}>{b.label}</p>
            {!b.unlocked && b.progress && (
              <p className="mt-1 text-[10px] text-zinc-600">{b.progress.current}/{b.progress.target}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
