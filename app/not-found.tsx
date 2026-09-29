import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "./components/site-nav";
import { SiteFooter } from "./components/site-footer";

export const metadata: Metadata = {
  title: "Nie ma takiej strony | AgentSpace",
  robots: { index: false, follow: true },
};

/**
 * Własna 404 dla całego serwisu.
 *
 * Domyślny ekran Next.js jest bez nawigacji, więc człowiek, który trafił tu
 * ze starego linku, po prostu zamyka kartę. Tu zostawiamy pasek, kilka
 * sensownych wyjść i wyszukiwarkę Google zawężoną do domeny.
 *
 * Trasy językowe nie mają nic do rzeczy: ten plik obsługuje też adresy,
 * które w ogóle nie weszły w `app/[lang]`, więc trzyma się polskiego.
 */

const LINKS = [
  { href: "/", label: "Strona główna", desc: "Czym jest AgentSpace" },
  { href: "/cennik", label: "Cennik", desc: "Pakiety i dodatek strony www" },
  { href: "/wzory", label: "Strony www", desc: "Osiem wzorów dla biur" },
  { href: "/kontakt", label: "Kontakt", desc: "Odpowiadamy w 24 godziny" },
];

export default function NotFound() {
  return (
    <div className="mk relative min-h-screen">
      <SiteNav />

      <section className="px-6 pt-[140px] pb-24 md:pt-[180px]">
        <div className="mx-auto max-w-[760px]">
          <p className="mk-eyebrow mb-6">Błąd 404</p>

          <h1 className="max-w-[18ch] !text-left">
            Tej strony <span className="grad">tu nie ma</span>
          </h1>

          <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-[var(--color-mk-muted)]">
            Adres jest nieaktualny albo wkradła się literówka. Nic nie zginęło,
            po prostu ta ścieżka nigdzie nie prowadzi.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mk-card group flex flex-col gap-1 p-6 transition-transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2 font-medium text-[var(--color-mk-text)]">
                  {link.label}
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-[var(--color-mk-accent)] transition-transform duration-300 group-hover:translate-x-1"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M3 10h13m0 0-5-5m5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-[0.9375rem] text-[var(--color-mk-muted)]">{link.desc}</span>
              </Link>
            ))}
          </div>

          <p className="mt-10 text-[0.9375rem] text-[var(--color-mk-muted)]">
            Trafiłeś tu z linku, który gdzieś u nas wisi?{" "}
            <Link href="/kontakt" className="underline underline-offset-4 hover:text-[var(--color-mk-text)]">
              Daj znać
            </Link>
            , poprawimy.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
