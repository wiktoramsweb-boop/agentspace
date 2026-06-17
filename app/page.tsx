export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <p className="text-sm font-medium tracking-[0.3em] text-zinc-500 uppercase mb-6">
          Wkrótce
        </p>

        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6">
          AgentSpace
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mb-12 max-w-xl mx-auto">
          Codzienna platforma dla agentów nieruchomości.
          Trening cold calli z AI, plan dnia, ranking zespołu — wszystko w jednym miejscu.
        </p>

        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-zinc-900 border border-zinc-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-zinc-300">Budowa w toku — start 2026</span>
        </div>

        <footer className="mt-24 text-xs text-zinc-600">
          AgentSpace · agentspace.pl
        </footer>
      </div>
    </main>
  );
}