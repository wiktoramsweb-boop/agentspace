import { requireModul } from "@/lib/auth";
import { KATEGORIE, WZORY } from "@/lib/dokumenty";
import type { Kategoria } from "@/lib/dokumenty/silnik";
import { PageHeader } from "../components/ui";
import { Katalog, type PozycjaKatalogu } from "./katalog";

export const metadata = { title: "Dokumenty i umowy" };

/** Kreatory zbudowane wcześniej, każdy z własnym ekranem. */
const OSOBNE: (PozycjaKatalogu & { kategoria: Kategoria })[] = [
  {
    href: "/app/rezerwacje",
    nazwa: "Umowa rezerwacyjna",
    opis: "Sprzedaż lub najem: strony, kwota rezerwacji, termin. Gotowa do podpisu w kilka minut.",
    kategoria: "Sprzedaż i transakcja",
  },
  {
    href: "/app/aneks",
    nazwa: "Aneks do umowy pośrednictwa",
    opis: "Przedłużenie umowy, zmiana wynagrodzenia albo ceny ofertowej.",
    kategoria: "Pośrednictwo",
  },
  {
    href: "/app/oferta-wspolpracy",
    nazwa: "Oferta współpracy dla właściciela",
    opis: "Elegancka prezentacja biura na spotkanie pozyskowe: co robicie, ile to kosztuje, dlaczego Wy.",
    kategoria: "Pośrednictwo",
  },
  {
    href: "/app/protokol",
    nazwa: "Protokół zdawczo-odbiorczy",
    opis: "Stan lokalu, liczniki, klucze i wyposażenie przy wydaniu mieszkania.",
    kategoria: "Najem",
  },
  {
    href: "/app/klienci",
    nazwa: "Zgoda RODO i obowiązek informacyjny",
    opis: "Na karcie klienta, zakładka RODO: zgody, historia i PDF do podpisu.",
    kategoria: "Pośrednictwo",
  },
];

export default async function DokumentyPage() {
  await requireModul("dokumenty");

  const pozycje = [
    ...WZORY.map((w) => ({ href: `/app/dokumenty/${w.id}`, nazwa: w.nazwa, opis: w.opis, kategoria: w.kategoria })),
    ...OSOBNE,
  ];
  const grupy = KATEGORIE.map((k) => ({ kategoria: k, pozycje: pozycje.filter((p) => p.kategoria === k) }));

  return (
    <>
      <PageHeader
        title="Dokumenty i umowy"
        subtitle="Wybierz wzór, uzupełnij z bazy klientów i ofert, pobierz PDF albo zapisz go od razu w karcie klienta."
      />
      <Katalog grupy={grupy} />
    </>
  );
}
