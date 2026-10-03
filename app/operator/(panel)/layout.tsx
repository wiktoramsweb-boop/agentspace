import Link from "next/link";
import { redirect } from "next/navigation";
import { sesjaWazna } from "@/lib/operator-auth";
import { wylogujOperatora } from "../actions";

/**
 * Chroniona część panelu.
 *
 * Bez ważnego ciasteczka odsyłamy na ekran logowania. Ekran logowania leży
 * poza tą grupą, więc nie wpadamy w pętlę przekierowań.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await sesjaWazna())) redirect("/operator/login");

  return (
    <>
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
            <Link href="/app" className="text-zinc-400 transition-colors hover:text-white">
              Moje biuro
            </Link>
            <form action={wylogujOperatora}>
              <button type="submit" className="text-zinc-400 transition-colors hover:text-white">
                Wyloguj
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-10">{children}</main>
    </>
  );
}
