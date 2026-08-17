import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Sidebar } from "./components/sidebar";
import { OnboardingRedirect } from "./onboarding-redirect";
import { ToastProvider } from "./components/toast";
import { PageTransition } from "./components/page-transition";
import { PwaInstall } from "./components/pwa-install";

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
          fullName={user.full_name ?? "Użytkownik"}
          agencyName={user.agency?.name ?? "Biuro"}
        />
        <main className="flex-1 px-5 py-8 md:px-10 md:py-10">
          <div className="mx-auto max-w-6xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <PwaInstall />
    </ToastProvider>
  );
}
