import { amountToWordsPL } from "./invoice";

// Generator umowy rezerwacyjnej (sprzedaż / najem). Treść parametryzowana, prawnie kompletna.
// Definicje stron w formie standardowej (Sprzedający/Kupujący, Wynajmujący/Najemca) —
// to terminy zdefiniowane w umowie, poprawne niezależnie od płci/liczby stron.

export type Party = { name: string; pesel: string; address: string };
export type ResMode = "sprzedaz" | "najem";
export type PropType = "mieszkanie" | "dom" | "dzialka" | "lokal" | "inne";

export type ReservationData = {
  city: string;
  date: string; // yyyy-mm-dd
  mode: ResMode;
  propType: PropType;
  propAddress: string;
  propDetails: string; // opcjonalnie: nr KW, powierzchnia itp.
  owners: Party[];
  buyers: Party[];
  fee: number;
  account: string;
  payDays: number;
  price: number; // cena sprzedaży (sprzedaż) LUB miesięczny czynsz (najem)
  deadline: string; // yyyy-mm-dd — do kiedy zawrzeć umowę
  rentType: "okazjonalny" | "zwykly";
  rentMonths: number;
  targetForm: "sprzedaz" | "przedwstepna";
  notaryCost: "kupujacy" | "strony";
};

export type ResSection = { h: string; items: string[] };
export type ResDoc = {
  title: string;
  intro: string;
  ownerText: string;
  buyerText: string;
  jointly: string;
  subjectText: string;
  sections: ResSection[];
  ownerRole: string;
  buyerRole: string;
  ownerNames: string[];
  buyerNames: string[];
};

const PROP: Record<PropType, { label: string; term: "Lokal" | "Nieruchomość" }> = {
  mieszkanie: { label: "Lokal mieszkalny", term: "Lokal" },
  dom: { label: "Dom", term: "Nieruchomość" },
  dzialka: { label: "Działka", term: "Nieruchomość" },
  lokal: { label: "Lokal użytkowy", term: "Lokal" },
  inne: { label: "Nieruchomość", term: "Nieruchomość" },
};

function slownie(n: number): string {
  return amountToWordsPL(n).replace(" zero groszy", "");
}
function money(n: number): string {
  return new Intl.NumberFormat("pl-PL").format(n);
}
function dateStr(iso: string): string {
  if (!iso) return "[data]";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y} r.`;
}
function partyText(parties: Party[], role: string): string {
  const valid = parties.filter((p) => p.name.trim() || p.pesel.trim() || p.address.trim());
  const arr = valid.length ? valid : [{ name: "", pesel: "", address: "" }];
  const list = arr
    .map(
      (p) =>
        `${p.name.trim() || "[imię i nazwisko]"}, PESEL: ${p.pesel.trim() || "[PESEL]"}, zam. ${
          p.address.trim() || "[adres zamieszkania]"
        }`,
    )
    .join("; oraz ");
  return `${list} (dalej: „${role}")`;
}

export function buildReservation(d: ReservationData): ResDoc {
  const P = PROP[d.propType];
  const term = P.term; // „Lokal" | „Nieruchomość"
  const nom = term; // mianownik/biernik
  const gen = term === "Lokal" ? "Lokalu" : "Nieruchomości";
  const ins = term === "Lokal" ? "Lokalem" : "Nieruchomością";

  const isSale = d.mode === "sprzedaz";
  const ownerRole = isSale ? "Sprzedający" : "Wynajmujący";
  const buyerRole = isSale ? "Kupujący" : "Najemca";

  const feeS = `${money(d.fee)} zł (słownie: ${slownie(d.fee)})`;
  const account = d.account.trim() || "[numer rachunku bankowego]";
  const deadline = dateStr(d.deadline);

  const subjectText = `${P.label} ${
    term === "Lokal" ? "położony" : "położona"
  } pod adresem: ${d.propAddress.trim() || "[adres nieruchomości]"}${
    d.propDetails.trim() ? `, ${d.propDetails.trim()}` : ""
  } (dalej: „${term}”).`;

  const sections: ResSection[] = [];

  if (isSale) {
    const targetGen = d.targetForm === "przedwstepna" ? "umowy przedwstępnej sprzedaży" : "umowy sprzedaży";
    const targetAcc = d.targetForm === "przedwstepna" ? "umowę przedwstępną sprzedaży" : "umowę sprzedaży";

    sections.push({
      h: "§ 1. Cel umowy",
      items: [
        `Celem niniejszej umowy jest rezerwacja ${gen} na rzecz Kupującego w celu zawarcia pomiędzy Stronami ${targetGen} ${gen} w terminie określonym w § 4 niniejszej umowy.`,
      ],
    });

    sections.push({
      h: "§ 2. Opłata rezerwacyjna",
      items: [
        `Kupujący zobowiązuje się do zapłaty opłaty rezerwacyjnej w wysokości ${feeS} na rachunek bankowy Sprzedającego nr ${account}, w terminie ${d.payDays} dni roboczych od dnia podpisania niniejszej umowy.`,
        `Opłata rezerwacyjna stanowi potwierdzenie zamiaru zawarcia umowy sprzedaży i rezerwuje ${nom} na rzecz Kupującego do czasu jej zawarcia, z zastrzeżeniem zasad zwrotu i zatrzymania określonych w § 5.`,
        `Opłata rezerwacyjna nie stanowi zadatku w rozumieniu art. 394 Kodeksu cywilnego.`,
      ],
    });

    const cenaItems: string[] = [];
    if (d.price > 0) {
      cenaItems.push(`Strony zgodnie ustalają cenę sprzedaży ${gen} na kwotę ${money(d.price)} zł (słownie: ${slownie(d.price)}).`);
    }
    cenaItems.push(`Sprzedający zobowiązuje się, że w okresie rezerwacji nie zaoferuje ani nie sprzeda ${gen} innym osobom.`);
    cenaItems.push(`Po zawarciu ${targetGen} opłata rezerwacyjna zostanie zaliczona na poczet ceny sprzedaży ${gen}.`);
    sections.push({ h: "§ 3. Cena i zaliczenie opłaty rezerwacyjnej", items: cenaItems });

    sections.push({
      h: "§ 4. Okres rezerwacji",
      items: [
        `Rezerwacja obowiązuje do dnia ${deadline}, w którym to terminie Strony zobowiązują się zawrzeć ${targetAcc} ${gen}.`,
        `Strony mogą, za zgodnym porozumieniem, przedłużyć termin wskazany w ust. 1; przedłużenie wymaga formy pisemnej (w tym wymiany wiadomości e-mail z adresów wskazanych przez Strony) pod rygorem nieważności.`,
      ],
    });

    sections.push({
      h: "§ 5. Skutki niedojścia do zawarcia umowy",
      items: [
        `W przypadku rezygnacji Kupującego z zawarcia umowy sprzedaży albo niedopełnienia przez niego formalności niezbędnych do jej zawarcia w terminie wskazanym w § 4 ust. 1 — opłata rezerwacyjna przepada w całości na rzecz Sprzedającego tytułem rekompensaty za wyłączenie ${gen} z oferty.`,
        `W przypadku rezygnacji Sprzedającego ze sprzedaży ${gen} przed upływem terminu, o którym mowa w § 4 ust. 1 — opłata rezerwacyjna zostanie zwrócona Kupującemu w pełnej wysokości w terminie 7 dni od dnia złożenia oświadczenia o rezygnacji, na wskazany przez niego rachunek bankowy.`,
        `Jeżeli do zawarcia umowy nie dojdzie z przyczyn niezależnych od żadnej ze Stron (np. brak zdolności kredytowej Kupującego mimo dochowania należytej staranności, ujawniona wada prawna ${gen}, zdarzenie losowe) — opłata rezerwacyjna podlega zwrotowi Kupującemu w terminie 7 dni od dnia ustania możliwości zawarcia umowy.`,
      ],
    });

    const notary =
      d.notaryCost === "strony"
        ? "obie Strony po połowie"
        : "Kupujący";
    sections.push({
      h: "§ 6. Oświadczenia i przyszła umowa sprzedaży",
      items: [
        `Sprzedający oświadcza, że przysługuje mu prawo do rozporządzania ${ins} oraz że ${nom} jest ${
          term === "Lokal" ? "wolny" : "wolna"
        } od wad prawnych i obciążeń uniemożliwiających sprzedaż, poza ujawnionymi Kupującemu przed zawarciem niniejszej umowy.`,
        `Umowa sprzedaży ${gen} zostanie zawarta w formie aktu notarialnego, zgodnie z art. 158 Kodeksu cywilnego.`,
        `Koszty zawarcia umowy sprzedaży w formie aktu notarialnego (taksa notarialna, podatek od czynności cywilnoprawnych, opłaty sądowe) ponosi ${notary}, o ile Strony nie postanowią inaczej w umowie sprzedaży.`,
      ],
    });
  } else {
    // NAJEM
    const najemLabel = d.rentType === "okazjonalny" ? "umowy najmu okazjonalnego" : "umowy najmu";
    const najemAcc = d.rentType === "okazjonalny" ? "umowę najmu okazjonalnego" : "umowę najmu";

    sections.push({
      h: "§ 1. Cel umowy",
      items: [
        `Celem niniejszej umowy jest rezerwacja ${gen} na rzecz Najemcy w celu zawarcia pomiędzy Stronami ${najemLabel} ${gen} w terminie określonym w § 4 niniejszej umowy.`,
      ],
    });

    sections.push({
      h: "§ 2. Opłata rezerwacyjna",
      items: [
        `Najemca zobowiązuje się do zapłaty opłaty rezerwacyjnej w wysokości ${feeS} na rachunek bankowy Wynajmującego nr ${account}, w terminie ${d.payDays} dni roboczych od dnia podpisania niniejszej umowy.`,
        `Opłata rezerwacyjna stanowi potwierdzenie zamiaru zawarcia umowy najmu i rezerwuje ${nom} na rzecz Najemcy do czasu jej zawarcia, z zastrzeżeniem zasad zwrotu i zatrzymania określonych w § 5.`,
        `Opłata rezerwacyjna nie stanowi zadatku w rozumieniu art. 394 Kodeksu cywilnego.`,
      ],
    });

    const czynszItems: string[] = [];
    if (d.price > 0) {
      czynszItems.push(`Strony zgodnie ustalają miesięczny czynsz najmu na kwotę ${money(d.price)} zł (słownie: ${slownie(d.price)}).`);
    }
    czynszItems.push(`Po podpisaniu umowy najmu opłata rezerwacyjna zostanie zaliczona na poczet pierwszego miesięcznego czynszu najmu należnego Wynajmującemu.`);
    sections.push({ h: "§ 3. Czynsz i zaliczenie opłaty rezerwacyjnej", items: czynszItems });

    sections.push({
      h: "§ 4. Okres rezerwacji",
      items: [
        `Rezerwacja obowiązuje do dnia ${deadline}, w którym to terminie Strony zobowiązują się zawrzeć ${najemAcc} ${gen}.`,
        `Strony mogą, za zgodnym porozumieniem, przedłużyć termin wskazany w ust. 1; przedłużenie wymaga formy pisemnej (w tym wymiany wiadomości e-mail z adresów wskazanych przez Strony) pod rygorem nieważności.`,
      ],
    });

    sections.push({
      h: "§ 5. Skutki niedojścia do zawarcia umowy najmu",
      items: [
        `W przypadku rezygnacji Najemcy z podpisania umowy najmu albo niedopełnienia przez niego formalności wymaganych do jej zawarcia w terminie wskazanym w § 4 ust. 1 — opłata rezerwacyjna przepada w całości na rzecz Wynajmującego tytułem rekompensaty za wyłączenie ${gen} z oferty najmu.`,
        `W przypadku rezygnacji Wynajmującego z oddania ${gen} w najem przed upływem terminu, o którym mowa w § 4 ust. 1 — opłata rezerwacyjna zostanie zwrócona Najemcy w pełnej wysokości w terminie 7 dni od dnia złożenia oświadczenia o rezygnacji, na wskazany przez niego rachunek bankowy.`,
        `Jeżeli do zawarcia umowy najmu nie dojdzie z przyczyn niezależnych od żadnej ze Stron (np. zdarzenie losowe uniemożliwiające najem ${gen}) — opłata rezerwacyjna podlega zwrotowi Najemcy w terminie 7 dni od dnia ustania możliwości zawarcia umowy.`,
      ],
    });

    const przyszla: string[] = [];
    if (d.rentType === "okazjonalny") {
      przyszla.push(
        `Umowa najmu zostanie zawarta jako umowa najmu okazjonalnego w rozumieniu art. 19a ustawy z dnia 21 czerwca 2001 r. o ochronie praw lokatorów, mieszkaniowym zasobie gminy i o zmianie Kodeksu cywilnego, na okres ${d.rentMonths} miesięcy z możliwością przedłużenia.`,
        `Najemca zobowiązuje się dostarczyć Wynajmującemu, najpóźniej w dniu podpisania umowy najmu, dokumenty wymagane dla umowy najmu okazjonalnego, w tym oświadczenie w formie aktu notarialnego o poddaniu się egzekucji oraz oświadczenie wskazujące inny lokal, w którym mógłby zamieszkać w razie wykonania egzekucji, wraz ze zgodą właściciela tego lokalu.`,
      );
    } else {
      przyszla.push(
        `Umowa najmu zostanie zawarta na zasadach określonych w Kodeksie cywilnym, na okres ${d.rentMonths} miesięcy z możliwością przedłużenia.`,
      );
    }
    przyszla.push(
      `Pozostałe szczegółowe warunki najmu (w tym wysokość kaucji, termin rozpoczęcia najmu, opłaty eksploatacyjne) zostaną określone w treści umowy najmu, w sposób nieodbiegający istotnie od warunków zaprezentowanych Najemcy przed zawarciem niniejszej umowy.`,
    );
    sections.push({ h: "§ 6. Postanowienia dotyczące przyszłej umowy najmu", items: przyszla });
  }

  // § końcowe — wspólne
  sections.push({
    h: "§ 7. Postanowienia końcowe",
    items: [
      `Wszelkie zmiany niniejszej umowy wymagają formy pisemnej pod rygorem nieważności.`,
      `W sprawach nieuregulowanych niniejszą umową zastosowanie mają przepisy Kodeksu cywilnego${
        !isSale && d.rentType === "okazjonalny" ? " oraz ustawy o ochronie praw lokatorów" : ""
      }.`,
      `Ewentualne spory wynikłe z niniejszej umowy Strony poddają pod rozstrzygnięcie sądu powszechnego właściwego dla miejsca położenia ${gen}.`,
      `Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.`,
    ],
  });

  const validOwnerNames = d.owners.map((p) => p.name.trim()).filter(Boolean);
  const validBuyerNames = d.buyers.map((p) => p.name.trim()).filter(Boolean);

  return {
    title: "UMOWA REZERWACYJNA",
    intro: `Zawarta w dniu ${dateStr(d.date)} w ${d.city.trim() || "[miejscowość]"}, pomiędzy:`,
    ownerText: partyText(d.owners, ownerRole),
    buyerText: partyText(d.buyers, buyerRole),
    jointly: `zwani dalej łącznie „Stronami”.`,
    subjectText,
    sections,
    ownerRole,
    buyerRole,
    ownerNames: validOwnerNames.length ? validOwnerNames : ["……………………………"],
    buyerNames: validBuyerNames.length ? validBuyerNames : ["……………………………"],
  };
}
