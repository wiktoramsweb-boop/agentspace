import { postepAkademii } from "@/lib/data-akademia";
import { lekcja as znajdzLekcje, nazwaAkademii } from "@/lib/techniki/akademia";
import { PasekPowrotu } from "./pasek-powrotu";

/**
 * Pasek na dole strony techniki, skryptu albo banku obiekcji, gdy ktoś
 * przyszedł z lekcji Akademii. Bez niego trzeba było przewijać na górę
 * i szukać strzałki wstecz.
 */
export async function PowrotDoAkademii({ user, lekcjaId }: { user: { id: string; agency_id: string | null }; lekcjaId: string | null | undefined }) {
  const l = znajdzLekcje(lekcjaId);
  if (!l) return null;
  const { ready, wpisy } = await postepAkademii(user.agency_id, user.id);
  const zrobiona = wpisy.some((w) => w.item === l.id && w.passed);
  return <PasekPowrotu lekcjaId={l.id} tytul={l.tytul} nazwa={nazwaAkademii(user.agency_id).krotka} zrobiona={zrobiona} moznaOznaczyc={ready} />;
}
