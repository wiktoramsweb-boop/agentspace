import type { Metadata } from "next";
import Link from "next/link";
import { requireOperator } from "@/lib/auth";

/**
 * Panel operatora ma własny układ, bez menu biura.
 *
 * `noindex` plus 404 dla obcych kont: panel nie istnieje dla nikogo poza
 * operatorem i nie ma go po co trzymać w wynikach wyszukiwania.
 */
export const metadata: Metadata = {
  title: "Operator | AgentSpace",
  robots: { index: false, follow: false },
};

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOperator();

  return (
    <div className="portal-dark min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-4">
          <Link href="/operator" className="flex items-center gap-2.5 font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            AgentSpace
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-zinc-300">
              operator
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-500">{user.email}</span>
            <Link href="/app" className="text-zinc-400 transition-colors hover:text-white">
              Moje biuro
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-10">{children}</main>
    </div>
  );
}
