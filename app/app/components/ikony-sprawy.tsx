/** Ikony działań i spraw. Rysowane kreską, biorą kolor z tekstu, więc działają w obu motywach. */

const SCIEZKI = {
  klucz: "M15.5 7.5a3.5 3.5 0 1 1-3.3 4.7L4 20.5V17h3v-3h3l1.7-1.7M16.5 7.500h.01",
  telefon: "M3 5.500A2.5 2.5 0 0 1 5.5 3h1.300a1 1 0 0 1 .95.680l1.1 3.300a1 1 0 0 1-.5 1.200l-1.5.750a11 11 0 0 0 5.7 5.700l.75-1.500a1 1 0 0 1 1.2-.500l3.3 1.100a1 1 0 0 1 .68.950v1.300A2.5 2.5 0 0 1 18 21C9.7 21 3 14.3 3 6v-.500Z",
  spotkanie: "M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 8a3 3 0 0 0-3.5-3M6.5 16A3 3 0 0 0 3 19M17 5.500a2.5 2.5 0 0 1 0 5M7 5.500a2.5 2.5 0 0 0 0 5",
  zadanie: "M9 11l2.5 2.500L16 9M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
  informacja: "M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1Zm14-1.500a4 4 0 0 1 0 7",
  zastanawia: "M9.5 9a2.5 2.5 0 1 1 3.8 2.150c-.8.5-1.3 1.05-1.3 1.850M12 16.500h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  rozmowa: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  wykres: "M4 19h16M6 15l4-4 3 3 5-6",
  dokument: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6M9 17h6",
  dom: "M3 11.5 12 4l9 7.500M5 10v10h14V10M10 20v-5h4v5",
  bank: "M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18",
} as const;

export type NazwaIkony = keyof typeof SCIEZKI;

export function IkonaSprawy({ nazwa, className = "h-4 w-4" }: { nazwa: NazwaIkony; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={SCIEZKI[nazwa]} />
    </svg>
  );
}
