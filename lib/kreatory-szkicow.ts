/**
 * Kreatory dokumentów z własnym ekranem (poza wzorami z lib/dokumenty), które
 * też zapisują szkice. Klucz to identyfikator wzoru w tabeli szkiców.
 */
export const KREATORY_SZKICOW: Record<string, { nazwa: string; adres: string }> = {
  rezerwacja: { nazwa: "Umowa rezerwacyjna", adres: "/app/rezerwacje" },
  aneks: { nazwa: "Aneks do umowy pośrednictwa", adres: "/app/aneks" },
  protokol: { nazwa: "Protokół zdawczo-odbiorczy", adres: "/app/protokol" },
};
