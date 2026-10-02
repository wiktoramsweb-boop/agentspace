/**
 * Zastępnik logo: inicjały biura w kółku.
 *
 * Wcześniej brak logo oznaczał podstawienie `/logo.png`, czyli logo naszego
 * biura. Obce biuro wysyłało klientowi kalkulację z cudzą marką. Neutralny
 * monogram jest uczciwy i od razu podpowiada, że warto wgrać własne logo.
 */
export function Monogram({ nazwa, rozmiar = 48 }: { nazwa: string; rozmiar?: number }) {
  const inicjaly =
    nazwa
      .split(/\s+/)
      .filter((s) => /\p{L}/u.test(s))
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <span
      aria-label={nazwa}
      style={{ width: rozmiar, height: rozmiar, fontSize: Math.round(rozmiar * 0.38) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-900 font-semibold tracking-tight text-white"
    >
      {inicjaly}
    </span>
  );
}
