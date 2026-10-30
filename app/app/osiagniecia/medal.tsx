/** Medale rang i zadań. Kolory metalu są stałe, działają na jasnym i ciemnym tle. */

const METALE = [
  { a: "#d6a77a", b: "#9a6236", c: "#f3d9bd" }, // brąz
  { a: "#e2e8f0", b: "#94a3b8", c: "#f8fafc" }, // srebro
  { a: "#fcd34d", b: "#d97706", c: "#fef3c7" }, // złoto
  { a: "#6ee7b7", b: "#059669", c: "#d1fae5" }, // szmaragd
  { a: "#c4b5fd", b: "#7c3aed", c: "#ede9fe" }, // ametyst
];
const ZAMKNIETY = { a: "#cbd5e1", b: "#94a3b8", c: "#e2e8f0" };

export function Medal({ poziom, zdobyty = true, rozmiar = 64, children }: { poziom: number; zdobyty?: boolean; rozmiar?: number; children?: React.ReactNode }) {
  const m = zdobyty ? METALE[Math.min(poziom, METALE.length - 1)] : ZAMKNIETY;
  const id = `medal-${poziom}-${zdobyty ? 1 : 0}`;
  return (
    <span className="relative inline-grid flex-shrink-0 place-items-center" style={{ width: rozmiar, height: rozmiar * 1.12, opacity: zdobyty ? 1 : 0.55 }}>
      <svg viewBox="0 0 100 112" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={m.c} />
            <stop offset="0.45" stopColor={m.a} />
            <stop offset="1" stopColor={m.b} />
          </linearGradient>
        </defs>
        <path d="M50 3 92 27v50a9 9 0 0 1-4.5 7.8L50 109 12.5 84.8A9 9 0 0 1 8 77V27L50 3Z" fill={`url(#${id})`} />
        <path d="M50 16 80 33.500v37.500a6 6 0 0 1-3 5.200L50 94 23 76.200a6 6 0 0 1-3-5.200V33.500L50 16Z" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.500" />
        <path d="M50 3 92 27 50 52 8 27 50 3Z" fill="#fff" fillOpacity=".14" />
      </svg>
      <span className="relative font-bold text-white" style={{ fontSize: rozmiar * 0.3, textShadow: "0 1px 2px rgba(0,0,0,.35)" }}>
        {children}
      </span>
    </span>
  );
}

export function IkonaObszaru({ id }: { id: string }) {
  const sciezki: Record<string, string> = {
    klienci: "M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 8a5 5 0 0 0-3-4.600M15 3.300a4 4 0 0 1 0 7.400",
    oferty: "M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4",
    dzien: "M13 3 4 14h7l-1 7 9-11h-7l1-7Z",
    papiery: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6M9 17h6",
    trening: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm7 9a7 7 0 0 1-14 0m7 7v2",
    kredyty: "M3 10 12 4l9 6M5 10v8M9.500 10v8M14.500 10v8M19 10v8M3 20h18",
    biuro: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm3 10a7 7 0 0 0-14 0",
  };
  const ton: Record<string, string> = {
    klienci: "bg-rose-100 text-rose-600",
    oferty: "bg-blue-100 text-blue-600",
    dzien: "bg-amber-100 text-amber-600",
    papiery: "bg-violet-100 text-violet-600",
    trening: "bg-emerald-100 text-emerald-600",
    kredyty: "bg-sky-100 text-sky-600",
    biuro: "bg-cyan-100 text-cyan-600",
  };
  return (
    <span className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl ${ton[id] ?? "bg-slate-100 text-slate-600"}`}>
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={sciezki[id] ?? sciezki.dzien} />
      </svg>
    </span>
  );
}
