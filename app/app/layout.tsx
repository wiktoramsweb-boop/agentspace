import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Sidebar } from "./components/sidebar";
import { OnboardingRedirect } from "./onboarding-redirect";

export const metadata: Metadata = {
  title: "AgentSpace — panel",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // User bez agencji (przerwana rejestracja) — obsłuż łagodnie
  if (!user.agency_id) {
    return <OnboardingRedirect />;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white md:flex">
      <Sidebar
        role={user.role}
        fullName={user.full_name ?? "Użytkownik"}
        agencyName={user.agency?.name ?? "Biuro"}
      />
      <main className="flex-1 px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
