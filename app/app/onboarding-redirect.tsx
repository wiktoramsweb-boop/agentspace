import { signOut } from "@/app/auth/actions";

/**
 * Fallback dla usera bez agencji (rzadki przypadek przerwanej rejestracji).
 */
export function OnboardingRedirect() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-center text-white">
      <div className="max-w-md">
        <h1 className="mb-3 text-2xl font-semibold">Konto niekompletne</h1>
        <p className="mb-6 text-zinc-400">
          Twoje konto nie jest przypisane do żadnego biura. Wyloguj się i załóż biuro
          od nowa albo poproś o ponowne zaproszenie.
        </p>
        <form action={signOut}>
          <button className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400">
            Wyloguj się
          </button>
        </form>
      </div>
    </div>
  );
}
