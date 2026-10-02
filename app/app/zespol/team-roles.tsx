import Link from "next/link";
import type { UserRole } from "@/lib/types";
import { moduly, opisRoli, type Uprawnienia } from "@/lib/role";

export type TeamMember = {
  id: string;
  label: string;
  email: string | null;
  role: UserRole;
  manager_id: string | null;
  permissions?: Uprawnienia | null;
};

/**
 * Lista osób z ich stanowiskiem.
 *
 * Wcześniej rola zmieniała się tu rozwijaną listą, ale przy ośmiu
 * stanowiskach lista nie mieściła się na ekranie i ucinała ostatnie pozycje.
 * Poza tym rola to dopiero połowa sprawy: indywidualne dostępy i tak ustawia
 * się na karcie osoby. Dlatego wiersz prowadzi w jedno miejsce, w którym
 * ustawia się wszystko naraz.
 */
export function TeamRoles({
  members,
  currentUserId,
}: {
  members: TeamMember[];
  currentUserId: string;
}) {
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
      {members.map((m) => {
        const rola = opisRoli(m.role);
        const ile = moduly({ id: m.id, role: m.role, permissions: m.permissions }).length;
        const wyjatki = Object.keys(m.permissions?.moduly ?? {}).length;

        return (
          <li key={m.id}>
            <Link
              href={`/app/zespol/${m.id}`}
              className="flex flex-col gap-3 p-4 transition hover:bg-slate-100 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {m.label}
                  {m.id === currentUserId && (
                    <span className="ml-2 text-xs text-slate-500">(Ty)</span>
                  )}
                </p>
                {m.email && <p className="truncate text-xs text-slate-500">{m.email}</p>}
                <p className="mt-0.5 text-xs text-slate-400">{rola.opis}</p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{rola.nazwa}</p>
                  <p className="text-xs text-slate-500">
                    {ile} {ile === 1 ? "moduł" : ile < 5 ? "moduły" : "modułów"}
                    {wyjatki > 0 && " · zmieniane ręcznie"}
                  </p>
                </div>
                <span aria-hidden="true" className="text-slate-400">
                  →
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
