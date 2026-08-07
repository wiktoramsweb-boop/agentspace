import Link from "next/link";
import type { ReactNode } from "react";
import { AuroraBackground } from "../aurora-background";

/**
 * Wspólna oprawa stron auth: aurora tło, logo, wycentrowana karta.
 */
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-6 py-12">
      <AuroraBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-lg font-semibold text-white">AgentSpace</span>
        </Link>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 backdrop-blur-xl">
          <h1 className="mb-2 text-2xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="mb-6 text-sm text-zinc-400">{subtitle}</p>}
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-zinc-500">{footer}</div>}
      </div>
    </div>
  );
}
