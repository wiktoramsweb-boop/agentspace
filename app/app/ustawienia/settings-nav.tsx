"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

const PERSONAL: Item[] = [{ href: "/app/ustawienia", label: "Mój profil" }];

const COMPANY: Item[] = [
  { href: "/app/ustawienia/firma", label: "Dane firmy" },
  { href: "/app/ustawienia/znak-wodny", label: "Znak wodny i stemple" },
  { href: "/app/ustawienia/pozostale", label: "Pozostałe ustawienia" },
];

/**
 * Boczne menu ustawień (układ jak w ASARI). Na telefonie zamienia się
 * w poziomy pasek, żeby nie zajmować pół ekranu nad formularzem.
 */
export function SettingsNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();

  const link = (item: Item) => {
    const active = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${
          active
            ? "btn-ink font-medium shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${active ? "bg-emerald-400" : "bg-slate-300"}`}
        />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 lg:sticky lg:top-6 lg:flex-col lg:self-start lg:p-3">
      <p className="hidden px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:block">
        Moje konto
      </p>
      {PERSONAL.map(link)}
      {isOwner && (
        <>
          <p className="hidden px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:block">
            Ustawienia firmy
          </p>
          {COMPANY.map(link)}
        </>
      )}
    </nav>
  );
}
