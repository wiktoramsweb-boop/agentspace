/**
 * Miejsca na zdjęcia strony www.
 *
 * Każde miejsce ma docelowy plik i gotowy opis do Nano Banana Pro. Dopóki
 * plik nie istnieje, na produkcji stoi zdjęcie zastępcze, a w trybie
 * deweloperskim widać ramkę z nazwą miejsca. Wystarczy wrzucić plik pod
 * podaną ścieżkę i wdrożyć: kod się nie zmienia.
 *
 * Zasady wspólne dla wszystkich opisów (dopisane do każdego w STYL):
 * zwykli ludzie z Polski, prawdziwe wnętrza, bez napisów na ekranach
 * (generator robi z nich bełkot), bez uśmiechów do obiektywu.
 */

export type SlotZdjecia = {
  id: string;
  plik: string;
  /** Proporcje kadru, np. "4/5". */
  proporcje: string;
  alt: string;
  altEn: string;
  zastepcze: string;
  opis: string;
};

export const STYL =
  "Photorealistic editorial documentary photograph, shot on a 35mm full-frame camera, natural window light, soft realistic shadows, true-to-life colors with a slightly warm white balance, shallow depth of field. Real people from Poland in their 30s to 50s, ordinary clothes, natural skin texture, candid moment, nobody looks at the camera. Real Kraków interiors and streets. Any phone or laptop screen is seen at an angle or slightly out of focus, with no readable text, no logos and no UI details. No text, no watermarks, no brand names anywhere in the image.";

export const SLOTY: SlotZdjecia[] = [
  {
    id: "hero-teren",
    plik: "/zdjecia/nowe/hero-teren.jpg",
    proporcje: "4/5",
    alt: "Agentka nieruchomości przed kamienicą sprawdza w telefonie plan dnia",
    altEn: "Real estate agent in front of a tenement house checking her day plan on a phone",
    zastepcze: "/zdjecia/pozyskanie.jpg",
    opis: "A female real estate agent around 35, dark wool coat, standing on a Kraków street in front of a renovated tenement house with a wooden gate, late morning autumn light. She holds a smartphone at chest height and glances at it while a set of apartment keys hangs from her other hand. Background slightly blurred: tram tracks, a cafe sign without readable letters. Vertical 4:5 composition, subject on the left third, space on the right.",
  },
  {
    id: "dzien-rano",
    plik: "/zdjecia/nowe/dzien-rano.jpg",
    proporcje: "4/3",
    alt: "Biurko w biurze nieruchomości rano: laptop, kawa i notes",
    altEn: "Real estate office desk in the morning: laptop, coffee and notebook",
    zastepcze: "/zdjecia/poranek-przy-kawie.jpg",
    opis: "Early morning in a small real estate office in Kraków. Over-the-shoulder view of a male agent around 40 at a wooden desk, coffee in a white cup, a paper notebook with a pen, laptop open showing a calm light dashboard seen at an angle and out of focus. Morning sun through tall old windows, plants on the windowsill. Horizontal 4:3.",
  },
  {
    id: "dzien-teren",
    plik: "/zdjecia/nowe/dzien-teren.jpg",
    proporcje: "4/3",
    alt: "Agent w samochodzie nagrywa głosową notatkę po prezentacji mieszkania",
    altEn: "Agent in a car recording a voice note after an apartment viewing",
    zastepcze: "/zdjecia/miedzy-spotkaniami.jpg",
    opis: "A real estate agent around 30 sitting in the driver's seat of a parked car right after an apartment viewing, holding a phone close to his mouth and speaking a voice note, a folder with documents on the passenger seat. Overcast daylight, a residential block from the 2010s visible through the windshield, slightly blurred. Horizontal 4:3.",
  },
  {
    id: "dzien-umowa",
    plik: "/zdjecia/nowe/dzien-umowa.jpg",
    proporcje: "4/3",
    alt: "Podpisanie umowy najmu przy stole w mieszkaniu",
    altEn: "Signing a lease agreement at a table in an apartment",
    zastepcze: "/zdjecia/transakcja.jpg",
    opis: "Close, candid shot of a lease signing at a light wooden kitchen table in a freshly renovated Kraków apartment. A young couple in their late 20s reads a printed multi-page contract, the agent's hand points to a signature line, a pen and a set of keys on the table. Faces partly cropped, focus on hands and paper; the paper text is not readable. Soft daylight. Horizontal 4:3.",
  },
  {
    id: "dzien-trening",
    plik: "/zdjecia/nowe/dzien-trening.jpg",
    proporcje: "4/3",
    alt: "Agentka ze słuchawkami ćwiczy rozmowę z klientem przy laptopie",
    altEn: "Agent with headphones practicing a client call at a laptop",
    zastepcze: "/zdjecia/rozmowa-audyt.jpg",
    opis: "A female real estate agent around 28 in a quiet corner of an office, wearing simple over-ear headphones, speaking with focused expression and a slight hand gesture as if handling an objection on a call, laptop in front of her seen from the side with an out-of-focus screen. Late afternoon light, calm atmosphere. Horizontal 4:3.",
  },
  {
    id: "wlasciciel",
    plik: "/zdjecia/nowe/wlasciciel.jpg",
    proporcje: "3/2",
    alt: "Właściciel biura nieruchomości przegląda wyniki miesiąca na tablecie",
    altEn: "Real estate office owner reviewing monthly results on a tablet",
    zastepcze: "/zdjecia/zespol.jpg",
    opis: "The owner of a real estate office, a man around 45 in a navy sweater, standing by the window of his office in the evening, looking at a tablet with an out-of-focus chart, the empty open-plan office with a few desks behind him, warm desk lamps on. Thoughtful, calm mood, not posed. Horizontal 3:2.",
  },
  {
    id: "zespol-odprawa",
    plik: "/zdjecia/nowe/zespol-odprawa.jpg",
    proporcje: "3/2",
    alt: "Poranna odprawa zespołu biura nieruchomości",
    altEn: "Morning stand-up of a real estate team",
    zastepcze: "/zdjecia/wnetrze-biura.jpg",
    opis: "A short morning stand-up in a real estate office: five agents of different ages standing around a high table with coffee cups, one woman talks while others listen, a large screen on the wall in the background shows an out-of-focus board with columns. Candid documentary feel, nobody looks at the camera. Horizontal 3:2.",
  },
];

export function slot(id: string): SlotZdjecia {
  const s = SLOTY.find((x) => x.id === id);
  if (!s) throw new Error(`Nieznane miejsce na zdjęcie: ${id}`);
  return s;
}
