import { requireUser } from "@/lib/auth";
import { naProbie } from "@/lib/proba";
import { TylkoAbonament } from "../components/proba";

/**
 * Biblioteka technik jest w abonamencie. W okresie próbnym i w demo widać
 * zamazany podgląd z kłódką, a nie pustą stronę: ma być jasne, co jest w środku.
 * Bramka w layoucie obejmuje też pojedyncze techniki i skrypty.
 */
export default async function TechnikiLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { naProbie: proba, demo } = naProbie(user);
  if (!proba) return children;
  return (
    <TylkoAbonament
      demo={demo}
      tytul="Biblioteka technik jest dla klientów abonamentowych"
      opis="46 technik rozmowy, skrypty z rozgałęzieniami, bank obiekcji i Akademia dla nowych, każda do przećwiczenia z klientem AI. W wersji próbnej możesz przetestować same rozmowy w AI Coach."
    >
      {children}
    </TylkoAbonament>
  );
}
