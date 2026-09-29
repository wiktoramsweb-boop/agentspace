import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { AuroraBackground } from "../aurora-background";

/**
 * Wspólna oprawa stron logowania i rejestracji.
 *
 * Strony auth są zawsze ciemne, niezależnie od motywu systemu. Wymuszamy to
 * lokalnie zmiennymi CSS, bo aurora wygasza się do `--color-mk-bg`, a poza
 * kontenerem `.mk` ta zmienna przy jasnym motywie systemu robiła się jasna
 * i na dole ekranu wychodził biały pas.
 */
const CIEMNO = {
  "--color-mk-bg": "#0a0a0c",
  "--mk-aurora-fade": "rgba(10, 10, 12, 0.72)",
  "--mk-grid-line": "rgba(255, 255, 255, 0.5)",
  "--mk-grid-opacity": "0.025",
} as CSSProperties;

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      style={CIEMNO}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0c] px-6 py-12"
    >
      <AuroraBackground />

      {/* Delikatna poświata pod kartą, żeby nie wisiała na płaskim tle. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_1px_rgba(16,185,129,0.8)]" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">AgentSpace</span>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mb-6 text-sm leading-relaxed text-zinc-400">{subtitle}</p>}
          {children}
        </div>

        {/* Zinc-500 na ciemnym tle było praktycznie nieczytelne. */}
        {footer && <div className="mt-6 text-center text-sm text-zinc-300">{footer}</div>}
      </div>
    </div>
  );
}
