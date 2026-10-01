import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Sidebar } from "./components/sidebar";
import { avatarUrl } from "./components/avatar";
import { OnboardingRedirect } from "./onboarding-redirect";
import { ToastProvider } from "./components/toast";
import { PageTransition } from "./components/page-transition";
import { PwaInstall } from "./components/pwa-install";
import { odswiezDemoJesliTrzeba } from "@/lib/demo/zasiew";
import { redirect } from "next/navigation";
import { stanDostepu } from "@/lib/abonament-cennik";
import { PasekAbonamentu } from "./pasek-abonamentu";

export const metadata: Metadata = {
  title: "Panel AgentSpace",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // User bez agencji (przerwana rejestracja) - obsłuż łagodnie
  if (!user.agency_id) {
    return <OnboardingRedirect />;
  }

  // Po okresie próbnym i po wygaśnięciu abonamentu biuro trafia na ekran
  // płatności. Konto demo zostaje otwarte: służy do pokazów, nie do pracy.
  const dostep = stanDostepu(user.agency ?? null);
  if (!dostep.aktywne && !user.agency?.is_demo) {
    redirect("/abonament");
  }

  // Konto demo odświeża się samo. Pokaz może się odbyć za tydzień albo za dwa
  // miesiące, a kalendarz i statystyki mają wtedy wyglądać tak samo. Dotyczy
  // wyłącznie biur oznaczonych jako demo, więc zwykłych kont nie rusza.
  if (user.agency?.is_demo) {
    await odswiezDemoJesliTrzeba({
      id: user.agency_id,
      is_demo: user.agency.is_demo,
      demo_refreshed_at: user.agency.demo_refreshed_at,
    });
  }

  return (
    <ToastProvider>
      {/* Motyw ustawiamy przed pierwszym malowaniem, żeby ciemny nie mrugał bielą. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem("as_theme")||"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}`,
        }}
      />
      <div className="app-shell min-h-screen text-slate-900 md:flex">
        <Sidebar
          role={user.role}
          permissions={user.permissions}
          fullName={user.full_name ?? "Użytkownik"}
          agencyName={user.agency?.name ?? "Biuro"}
          avatarUrl={avatarUrl(user.avatar_path)}
        />
        <main className="flex-1 px-5 py-8 md:px-10 md:py-10">
          <div className="mx-auto max-w-6xl">
            {dostep.ostrzegaj && (
              <PasekAbonamentu
                probny={dostep.probny}
                dni={dostep.dniDoKonca ?? 0}
                czyCeo={user.role === "owner"}
              />
            )}
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <PwaInstall />
    </ToastProvider>
  );
}
