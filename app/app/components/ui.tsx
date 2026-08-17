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
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-slate-500 md:text-base">{subtitle}</p>}
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
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm shadow-slate-900/5 transition ${
        accent
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        {icon && (
          <span
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
              accent ? "bg-emerald-500/25 text-emerald-700" : "bg-slate-200 text-slate-700"
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

export function scoreColor(score: number | null): string {
  if (score == null) return "text-slate-500";
  if (score >= 8) return "text-emerald-600";
  if (score >= 6) return "text-amber-600";
  return "text-red-600";
}

export function scoreBg(score: number | null): string {
  if (score == null) return "bg-slate-100 text-slate-500";
  if (score >= 8) return "bg-emerald-100 text-emerald-700";
  if (score >= 6) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
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
        className ?? "bg-slate-100 text-slate-700"
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
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-slate-500">{body}</p>
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="inline-flex items-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
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
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 ${
        hover ? "hover-lift hover:border-slate-300 hover:bg-slate-100" : ""
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
