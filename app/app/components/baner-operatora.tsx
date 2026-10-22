/**
 * Pasek widoczny tylko w przeglądarce operatora, który wszedł do biura
 * z panelu /operator. Ciasteczko ustawia akcja wejdzJako, biuro go nie ma.
 */
export function BanerOperatora({ opis }: { opis: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg">
      <p>
        <span className="mr-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-950">Tryb operatora</span>
        {opis}. Zmiany zapisują się jak zmiany tej osoby.
      </p>
      <a href="/operator/wyjdz" className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20">
        Wyjdź do panelu
      </a>
    </div>
  );
}
