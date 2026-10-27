import { requireModul } from "@/lib/auth";
import { KATEGORIE, WZORY } from "@/lib/dokumenty";
import type { Kategoria } from "@/lib/dokumenty/silnik";
import { PageHeader } from "../components/ui";
import { Katalog, type PozycjaKatalogu } from "./katalog";
import { SzkiceLista } from "./szkice-lista";
import { szkiceOsoby } from "@/lib/data-szkice";
import { wzor } from "@/lib/dokumenty";
import { KREATORY_SZKICOW } from "@/lib/kreatory-szkicow";

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
  const user = await requireModul("dokumenty");
  const { lista: szkice } = await szkiceOsoby(user.agency_id, user.id);

  const pozycje = [
    ...WZORY.map((w) => ({ href: `/app/dokumenty/${w.id}`, nazwa: w.nazwa, opis: w.opis, kategoria: w.kategoria })),
    ...OSOBNE,
  ];
  const grupy = KATEGORIE.map((k) => ({ kategoria: k, pozycje: pozycje.filter((p) => p.kategoria === k) }));

  return (
    <>
      <PageHeader
        title="Dokumenty i umowy"
        subtitle="Wybierz wzór, uzupełnij z bazy klientów i ofert, pobierz PDF albo zapisz go od razu w karcie klienta. Niedokończony dokument zapiszesz jako szkic i wrócisz do niego później."
      />
      <SzkiceLista
        szkice={szkice.map((s) => ({ id: s.id, href: `${KREATORY_SZKICOW[s.wzorId]?.adres ?? `/app/dokumenty/${s.wzorId}`}?szkic=${s.id}`, tytul: s.tytul, wzor: wzor(s.wzorId)?.nazwa ?? KREATORY_SZKICOW[s.wzorId]?.nazwa ?? "Dokument", zmieniony: s.zmieniony }))}
      />
      <Katalog grupy={grupy} />
    </>
  );
}
