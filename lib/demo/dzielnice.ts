/**
 * Dzielnice Krakowa z przybliżonym środkiem i poziomem cen.
 *
 * Używane wyłącznie do wypełniania konta demo. Ceny są orientacyjne i mają
 * odwzorowywać realne proporcje między dzielnicami, bo to one decydują, czy
 * pokaz analizy cenowej wygląda wiarygodnie.
 */
export type Dzielnica = {
  nazwa: string;
  lat: number;
  lng: number;
  /** Orientacyjna cena za metr na rynku wtórnym. */
  cenaM2: number;
  ulice: string[];
};

export const DZIELNICE: Dzielnica[] = [
  { nazwa: "Stare Miasto", lat: 50.0619, lng: 19.9368, cenaM2: 22500, ulice: ["Świętego Tomasza", "Sławkowska", "Floriańska", "Karmelicka"] },
  { nazwa: "Kazimierz", lat: 50.051, lng: 19.9445, cenaM2: 19500, ulice: ["Józefa", "Meiselsa", "Krakowska", "Dietla"] },
  { nazwa: "Grzegórzki", lat: 50.063, lng: 19.962, cenaM2: 17200, ulice: ["Mogilska", "Rzeźnicza", "Masarska"] },
  { nazwa: "Zabłocie", lat: 50.048, lng: 19.964, cenaM2: 17800, ulice: ["Romanowicza", "Ślusarska", "Przemysłowa"] },
  { nazwa: "Podgórze", lat: 50.044, lng: 19.956, cenaM2: 16400, ulice: ["Kalwaryjska", "Limanowskiego", "Wielicka"] },
  { nazwa: "Krowodrza", lat: 50.08, lng: 19.92, cenaM2: 16800, ulice: ["Łobzowska", "Mazowiecka", "Wrocławska"] },
  { nazwa: "Bronowice", lat: 50.082, lng: 19.889, cenaM2: 15300, ulice: ["Bronowicka", "Armii Krajowej", "Zarzecze"] },
  { nazwa: "Prądnik Biały", lat: 50.098, lng: 19.93, cenaM2: 14600, ulice: ["Białoprądnicka", "Opolska", "Imbramowska"] },
  { nazwa: "Dębniki", lat: 50.035, lng: 19.92, cenaM2: 15600, ulice: ["Kapelanka", "Barska", "Tyniecka"] },
  { nazwa: "Ruczaj", lat: 50.019, lng: 19.893, cenaM2: 14200, ulice: ["Bobrzyńskiego", "Kobierzyńska", "Szuwarowa"] },
  { nazwa: "Czyżyny", lat: 50.073, lng: 20.008, cenaM2: 13800, ulice: ["Centralna", "Sołtysowska", "Orlińskiego"] },
  { nazwa: "Nowa Huta", lat: 50.072, lng: 20.036, cenaM2: 12600, ulice: ["os. Centrum B", "os. Stalowe", "os. Zgody"] },
];
