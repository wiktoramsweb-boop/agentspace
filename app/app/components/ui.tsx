import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-gradient text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-zinc-400 md:text-base">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm shadow-black/20 transition ${
        accent
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-zinc-800/40"
          : "border-zinc-700/60 bg-zinc-800/40 hover:border-zinc-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
        {icon && (
          <span
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
              accent ? "bg-emerald-500/25 text-emerald-300" : "bg-zinc-700/50 text-zinc-300"
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-sm text-zinc-400">{sub}</p>}
    </div>
  );
}

export function scoreColor(score: number | null): string {
  if (score == null) return "text-zinc-500";
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-amber-400";
  return "text-red-400";
}

export function scoreBg(score: number | null): string {
  if (score == null) return "bg-zinc-800 text-zinc-400";
  if (score >= 8) return "bg-emerald-500/15 text-emerald-300";
  if (score >= 6) return "bg-amber-500/15 text-amber-300";
  return "bg-red-500/15 text-red-300";
}

export function ScoreBadge({ score }: { score: number | null }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 font-mono text-sm font-semibold ${scoreBg(score)}`}
    >
      {score != null ? `${score}/10` : "-"}
    </span>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
        className ?? "bg-zinc-800 text-zinc-300"
      }`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
  icon,
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center">
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/70 text-zinc-400">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-zinc-400">{body}</p>
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="inline-flex items-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

export function Card({
  children,
  className,
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-6 shadow-sm shadow-black/20 ${
        hover ? "hover-lift hover:border-zinc-600 hover:bg-zinc-800/70" : ""
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
