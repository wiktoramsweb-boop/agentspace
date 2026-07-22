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
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-zinc-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        accent
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-zinc-800/40"
          : "border-zinc-700 bg-zinc-800/40"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
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
      {score != null ? `${score}/10` : "—"}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-800/30 p-10 text-center">
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-zinc-300">{body}</p>
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

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-700 bg-zinc-800/40 p-6 ${className ?? ""}`}>
      {children}
    </div>
  );
}
