import { amountToWordsPL } from "./invoice";

// Generator umowy rezerwacyjnej (sprzedaż / najem). Treść parametryzowana, prawnie kompletna.
// Definicje stron w formie standardowej (Sprzedający/Kupujący, Wynajmujący/Najemca) —
// to terminy zdefiniowane w umowie, poprawne niezależnie od płci/liczby stron.

export type DocType = "dowod" | "paszport";
export type Party = { name: string; pesel: string; docType: DocType; docNumber: string; address: string };
export type ResMode = "sprzedaz" | "najem";
export type PropType = "mieszkanie" | "dom" | "dzialka" | "lokal" | "inne";
export type DepositType = "zadatek" | "oplata";

export type ReservationData = {
  city: string;
  date: string; // yyyy-mm-dd
  mode: ResMode;
  propType: PropType;
  propAddress: string;
  propDetails: string;
  owners: Party[];
  buyers: Party[];
  depositType: DepositType;
  fee: number;
  account: string;
  payDays: number;
  price: number; // cena sprzedaży (sprzedaż) LUB miesięczny czynsz (najem)
  deadline: string; // yyyy-mm-dd
  rentType: "okazjonalny" | "zwykly";
  rentMonths: number;
  targetForm: "sprzedaz" | "przedwstepna";
  notaryCost: "kupujacy" | "strony";
  customClauses: string[]; // dodatkowe zapisy (np. dopisane przez AI)
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
function docText(p: Party): string {
  return p.docType === "paszport"
    ? `paszport nr ${p.docNumber.trim() || "[nr paszportu]"}`
    : `dowód osobisty seria i nr ${p.docNumber.trim() || "[seria i nr dowodu]"}`;
}
function partyText(parties: Party[], role: string): string {
  const valid = parties.filter((p) => p.name.trim() || p.pesel.trim() || p.address.trim() || p.docNumber.trim());
  const arr = valid.length ? valid : [{ name: "", pesel: "", docType: "dowod" as DocType, docNumber: "", address: "" }];
  const list = arr
    .map(
      (p) =>
        `${p.name.trim() || "[imię i nazwisko]"}, PESEL: ${p.pesel.trim() || "[PESEL]"}, ${docText(p)}, zam. ${
          p.address.trim() || "[adres zamieszkania]"
        }`,
    )
    .join("; oraz ");
  return `${list} (dalej: „${role}")`;
}

export function buildReservation(d: ReservationData): ResDoc {
  const P = PROP[d.propType];
  const term = P.term;
  const nom = term;
  const gen = term === "Lokal" ? "Lokalu" : "Nieruchomości";
  const ins = term === "Lokal" ? "Lokalem" : "Nieruchomością";

  const isSale = d.mode === "sprzedaz";
  const ownerRole = isSale ? "Sprzedający" : "Wynajmujący";
  const buyerRole = isSale ? "Kupujący" : "Najemca";
  const secondRoleGen = isSale ? "Kupującego" : "Najemcy"; // „na rzecz ..." (dopełniacz)
  const secondRoleDat = isSale ? "Kupującemu" : "Najemcy"; // „zwrócona/zwrotowi ..." (celownik)

  // Zadatek vs opłata rezerwacyjna
  const isZad = d.depositType === "zadatek";
  const fNom = isZad ? "Zadatek" : "Opłata rezerwacyjna"; // początek zdania
  const fLow = isZad ? "zadatek" : "opłata rezerwacyjna"; // w środku zdania
  const fGen = isZad ? "zadatku" : "opłaty rezerwacyjnej"; // „do zapłaty ..."
  const fPast = isZad ? "zaliczony" : "zaliczona"; // „zostanie ..."

  const feeS = `${money(d.fee)} zł (słownie: ${slownie(d.fee)})`;
  const account = d.account.trim() || "[numer rachunku bankowego]";
  const deadline = dateStr(d.deadline);

  const subjectText = `${P.label} ${
    term === "Lokal" ? "położony" : "położona"
  } pod adresem: ${d.propAddress.trim() || "[adres nieruchomości]"}${
    d.propDetails.trim() ? `, ${d.propDetails.trim()}` : ""
  } (dalej: „${term}”).`;

  // § 2 — wspólny dla sprzedaży i najmu (płatnik zależny od roli)
  const payer = isSale ? "Kupujący" : "Najemca";
  const payTo = isSale ? "Sprzedającego" : "Wynajmującego";
  const przyszlaUmowa = isSale ? "umowy sprzedaży" : "umowy najmu";
  const natureItem = isZad
    ? `Kwota, o której mowa w ust. 1, stanowi zadatek w rozumieniu art. 394 Kodeksu cywilnego i ma charakter bezzwrotny w zakresie określonym w § 5.`
    : `${fNom} nie stanowi zadatku w rozumieniu art. 394 Kodeksu cywilnego.`;

  const paragraf2: ResSection = {
    h: "§ 2. " + (isZad ? "Zadatek" : "Opłata rezerwacyjna"),
    items: [
      `${payer} zobowiązuje się do zapłaty ${fGen} w wysokości ${feeS} na rachunek bankowy ${payTo} nr ${account}, w terminie ${d.payDays} dni roboczych od dnia podpisania niniejszej umowy.`,
      `${fNom} stanowi potwierdzenie zamiaru zawarcia ${przyszlaUmowa} i rezerwuje ${nom} na rzecz ${secondRoleGen} do czasu jej zawarcia, z zastrzeżeniem zasad określonych w § 5.`,
      natureItem,
    ],
  };

  // § 5 — skutki niedojścia (zależne od typu wpłaty)
  const forfeit = `${fLow} przepada w całości na rzecz ${payTo}${isZad ? " (charakter bezzwrotny)" : ""} tytułem rekompensaty za wyłączenie ${gen} z oferty${isSale ? "" : " najmu"}.`;
  const sellerBack = isZad
    ? `${payer} może żądać zwrotu wpłaconego zadatku w wysokości nominalnej w terminie 7 dni od dnia złożenia oświadczenia o rezygnacji; Strony zgodnie wyłączają obowiązek zapłaty sumy dwukrotnie wyższej, o którym mowa w art. 394 § 1 Kodeksu cywilnego.`
    : `${fNom} zostanie zwrócona ${secondRoleDat} w pełnej wysokości w terminie 7 dni od dnia złożenia oświadczenia o rezygnacji, na wskazany przez niego rachunek bankowy.`;

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

    sections.push(paragraf2);

    const cena: string[] = [];
    if (d.price > 0) cena.push(`Strony zgodnie ustalają cenę sprzedaży ${gen} na kwotę ${money(d.price)} zł (słownie: ${slownie(d.price)}).`);
    cena.push(`Sprzedający zobowiązuje się, że w okresie rezerwacji nie zaoferuje ani nie sprzeda ${gen} innym osobom.`);
    cena.push(`Po zawarciu ${targetGen} ${fLow} ${d.depositType === "zadatek" ? "zostanie zaliczony" : "zostanie zaliczona"} na poczet ceny sprzedaży ${gen}.`);
    sections.push({ h: `§ 3. Cena i zaliczenie ${isZad ? "zadatku" : "opłaty rezerwacyjnej"}`, items: cena });

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
        `W przypadku rezygnacji Kupującego z zawarcia umowy sprzedaży albo niedopełnienia przez niego formalności niezbędnych do jej zawarcia w terminie wskazanym w § 4 ust. 1 — ${forfeit}`,
        `W przypadku rezygnacji Sprzedającego ze sprzedaży ${gen} przed upływem terminu, o którym mowa w § 4 ust. 1 — ${sellerBack}`,
      ],
    });

    const notary = d.notaryCost === "strony" ? "obie Strony po połowie" : "Kupujący";
    sections.push({
      h: "§ 6. Oświadczenia i przyszła umowa sprzedaży",
      items: [
        `Sprzedający oświadcza, że przysługuje mu prawo do rozporządzania ${ins} oraz że ${nom} jest ${term === "Lokal" ? "wolny" : "wolna"} od wad prawnych i obciążeń uniemożliwiających sprzedaż, poza ujawnionymi Kupującemu przed zawarciem niniejszej umowy.`,
        `Umowa sprzedaży ${gen} zostanie zawarta w formie aktu notarialnego, zgodnie z art. 158 Kodeksu cywilnego.`,
        `Koszty zawarcia umowy sprzedaży w formie aktu notarialnego (taksa notarialna, podatek od czynności cywilnoprawnych, opłaty sądowe) ponosi ${notary}, o ile Strony nie postanowią inaczej w umowie sprzedaży.`,
      ],
    });
  } else {
    const najemLabel = d.rentType === "okazjonalny" ? "umowy najmu okazjonalnego" : "umowy najmu";
    const najemAcc = d.rentType === "okazjonalny" ? "umowę najmu okazjonalnego" : "umowę najmu";

    sections.push({
      h: "§ 1. Cel umowy",
      items: [
        `Celem niniejszej umowy jest rezerwacja ${gen} na rzecz Najemcy w celu zawarcia pomiędzy Stronami ${najemLabel} ${gen} w terminie określonym w § 4 niniejszej umowy.`,
      ],
    });

    sections.push(paragraf2);

    const czynsz: string[] = [];
    if (d.price > 0) czynsz.push(`Strony zgodnie ustalają miesięczny czynsz najmu na kwotę ${money(d.price)} zł (słownie: ${slownie(d.price)}).`);
    czynsz.push(`Po podpisaniu umowy najmu ${fLow} ${d.depositType === "zadatek" ? "zostanie zaliczony" : "zostanie zaliczona"} na poczet pierwszego miesięcznego czynszu najmu należnego Wynajmującemu.`);
    sections.push({ h: `§ 3. Czynsz i zaliczenie ${isZad ? "zadatku" : "opłaty rezerwacyjnej"}`, items: czynsz });

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
        `W przypadku rezygnacji Najemcy z podpisania umowy najmu albo niedopełnienia przez niego formalności wymaganych do jej zawarcia w terminie wskazanym w § 4 ust. 1 — ${forfeit}`,
        `W przypadku rezygnacji Wynajmującego z oddania ${gen} w najem przed upływem terminu, o którym mowa w § 4 ust. 1 — ${sellerBack}`,
      ],
    });

    const przyszla: string[] = [];
    if (d.rentType === "okazjonalny") {
      przyszla.push(
        `Umowa najmu zostanie zawarta jako umowa najmu okazjonalnego w rozumieniu art. 19a ustawy z dnia 21 czerwca 2001 r. o ochronie praw lokatorów, mieszkaniowym zasobie gminy i o zmianie Kodeksu cywilnego, na okres ${d.rentMonths} miesięcy z możliwością przedłużenia.`,
        `Najemca zobowiązuje się dostarczyć Wynajmującemu, najpóźniej w dniu podpisania umowy najmu, dokumenty wymagane dla umowy najmu okazjonalnego, w tym oświadczenie w formie aktu notarialnego o poddaniu się egzekucji oraz oświadczenie wskazujące inny lokal, w którym mógłby zamieszkać w razie wykonania egzekucji, wraz ze zgodą właściciela tego lokalu.`,
      );
    } else {
      przyszla.push(`Umowa najmu zostanie zawarta na zasadach określonych w Kodeksie cywilnym, na okres ${d.rentMonths} miesięcy z możliwością przedłużenia.`);
    }
    przyszla.push(
      `Pozostałe szczegółowe warunki najmu (w tym wysokość kaucji, termin rozpoczęcia najmu, opłaty eksploatacyjne) zostaną określone w treści umowy najmu, w sposób nieodbiegający istotnie od warunków zaprezentowanych Najemcy przed zawarciem niniejszej umowy.`,
    );
    sections.push({ h: "§ 6. Postanowienia dotyczące przyszłej umowy najmu", items: przyszla });
  }

  // Dodatkowe zapisy (np. dopisane przez AI) — przed postanowieniami końcowymi,
  // żeby nie ruszać numeracji §1–§6 (do których odwołują się inne paragrafy).
  const custom = (d.customClauses ?? []).map((c) => c.trim()).filter(Boolean);
  if (custom.length) {
    sections.push({ h: "§ 7. Postanowienia dodatkowe", items: custom });
  }
  const koncoweNum = custom.length ? 8 : 7;

  sections.push({
    h: `§ ${koncoweNum}. Postanowienia końcowe`,
    items: [
      `Wszelkie zmiany niniejszej umowy wymagają formy pisemnej pod rygorem nieważności.`,
      `W sprawach nieuregulowanych niniejszą umową zastosowanie mają przepisy Kodeksu cywilnego${
        !isSale && d.rentType === "okazjonalny" ? " oraz ustawy o ochronie praw lokatorów" : ""
      }.`,
      `Ewentualne spory wynikłe z niniejszej umowy Strony poddają pod rozstrzygnięcie sądu powszechnego właściwego dla miejsca położenia ${gen}.`,
      `Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.`,
    ],
  });

  const ownerNames = d.owners.map((p) => p.name.trim()).filter(Boolean);
  const buyerNames = d.buyers.map((p) => p.name.trim()).filter(Boolean);

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
    ownerNames: ownerNames.length ? ownerNames : ["……………………………"],
    buyerNames: buyerNames.length ? buyerNames : ["……………………………"],
  };
}
