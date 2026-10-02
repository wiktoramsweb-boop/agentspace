"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { type UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/role";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";
import { signOut } from "@/app/auth/actions";
import { SECTIONS, TILE } from "./nav-meta";
import { maModul, type Uprawnienia } from "@/lib/role";

const COLLAPSE_KEY = "as_nav_collapsed";

export function Sidebar({
  role,
  permissions,
  przewodnik,
  fullName,
  agencyName,
  avatarUrl,
}: {
  role: UserRole;
  permissions?: Uprawnienia | null;
  /** Postęp przewodnika. Podany tylko, póki nie jest domknięty. */
  przewodnik?: { zrobione: number; wszystkich: number } | null;
  fullName: string;
  agencyName: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Menu ma 19 pozycji - na niższych ekranach nie mieści się w całości.
  // Agent może zwinąć sekcje, z których nie korzysta; wybór zostaje na stałe.
  const [collapsed, setCollapsed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function toggleSection(title: string) {
    setCollapsed((prev) => {
      const next = prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title];
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  const nav = (
    <nav className="sidebar-nav flex min-h-0 flex-1 flex-col overflow-y-auto">
      <GlobalSearch />
      {/* Przewodnik nie jest stałą pozycją menu: znika, gdy biuro jest
          ustawione, bo po roku pracy „Jak zacząć” tylko zajmuje miejsce. */}
      {przewodnik && (
        <Link
          href="/app/start"
          className={`mx-2 mb-3 flex items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-sm transition hover:bg-emerald-500/20 ${
            isActive("/app/start") ? "ring-1 ring-emerald-400" : ""
          }`}
        >
          <span className="font-medium text-emerald-300">Jak zacząć</span>
          <span className="shrink-0 rounded-full bg-emerald-500/25 px-2 py-0.5 text-xs tabular-nums text-emerald-200">
            {przewodnik.zrobione}/{przewodnik.wszystkich}
          </span>
        </Link>
      )}
      <div className="flex flex-col gap-4 pb-2">
      {SECTIONS.map((section) => {
        const items = section.items.filter((i) => !i.modul || maModul({ id: "", role, permissions }, i.modul));
        if (items.length === 0) return null;
        // Sekcja z aktywną pozycją zostaje otwarta, żeby agent widział, gdzie jest.
        const hasActive = items.some((i) => isActive(i.href));
        const isCollapsed = collapsed.includes(section.title) && !hasActive;
        return (
          <div key={section.title}>
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              aria-expanded={!isCollapsed}
              className="mb-1.5 flex w-full items-center gap-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-400"
            >
              <ChevronIcon open={!isCollapsed} />
              {section.title}
            </button>
            <div className={`flex flex-col gap-0.5 ${isCollapsed ? "hidden" : ""}`}>
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-zinc-800/80 text-white"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-400 transition-opacity ${
                        active ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition ${TILE[item.color]} ${
                        active ? "" : "opacity-90 group-hover:opacity-100"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      </div>
    </nav>
  );

  const brand = (
    <Link href="/app" className="flex items-center gap-2 px-3 py-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      <span className="font-semibold text-white">AgentSpace</span>
    </Link>
  );

  const account = (
    <div className="border-t border-white/10 pt-4">
      <div className="mb-3 flex items-center gap-3 px-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={fullName} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-zinc-950">
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{fullName}</p>
          <p className="truncate text-xs text-white/50">
            {ROLE_LABELS[role]} · {agencyName}
          </p>
        </div>
      </div>
      <div className="mb-1">
        <ThemeToggle />
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogoutIcon />
          Wyloguj się
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="app-sidebar print-hide sticky top-0 z-30 flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
        {brand}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800"
          aria-label="Menu"
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="app-sidebar fixed inset-0 z-20 flex flex-col px-4 pb-6 pt-20 md:hidden">
          {nav}
          {account}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="app-sidebar sticky top-0 hidden h-screen w-64 flex-col border-r border-white/10 p-4 md:flex">
        <div className="mb-6">{brand}</div>
        {nav}
        {account}
      </aside>
    </>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function LogoutIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>;
}
function MenuIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
}
function CloseIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
}
