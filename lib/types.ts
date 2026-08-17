export type UserRole = "owner" | "manager" | "agent";

/** Etykiety ról w UI. Wartość 'owner' w bazie = CEO (nie zmieniamy wartości, tylko etykietę). */
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "CEO",
  manager: "Menedżer",
  agent: "Agent",
};

export type Agency = {
  id: string;
  name: string;
  owner_id: string | null;
  plan: string;
  trial_ends_at: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  agency_id: string | null;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  monthly_goal_pln: number;
  default_split_pct: number;
  phone: string | null;
  manager_id: string | null;
  weekly_ai_limit: number | null; // null = bez limitu; liczba = maks. rozmów AI/tydzień
  created_at: string;
};

export type ProfileWithAgency = Profile & {
  agency: Agency | null;
};

export type ScenarioCategory = "cold_calling" | "spotkanie" | "najem";

export type Scenario = {
  id: string;
  slug: string;
  title: string;
  description: string;
  brief: string;
  system_prompt: string;
  difficulty: "easy" | "medium" | "hard";
  order_index: number;
  is_active: boolean;
  category: ScenarioCategory;
};

export const SCENARIO_CATEGORIES: {
  value: ScenarioCategory;
  label: string;
  description: string;
  icon: "phone" | "handshake" | "shield";
}[] = [
  {
    value: "cold_calling",
    label: "Cold Calling",
    description: "Zimne telefony - pozyskiwanie kontaktu przez telefon",
    icon: "phone",
  },
  {
    value: "spotkanie",
    label: "Spotkania pozyskowe",
    description: "Spotkania u klienta - pozyskanie oferty i podpisanie umowy",
    icon: "handshake",
  },
  {
    value: "najem",
    label: "Najem (bezpieczny)",
    description: "Wynajem - weryfikacja najemcy, dochody, bezpieczeństwo",
    icon: "shield",
  },
];

export type ChatMessage = {
  role: "agent" | "client";
  content: string;
};

export type TrainingSession = {
  id: string;
  agent_id: string;
  agency_id: string;
  scenario_id: string;
  scenario_title: string | null;
  personality: string | null;
  difficulty: string | null;
  transcript: ChatMessage[];
  status: "in_progress" | "completed";
  started_at: string;
  completed_at: string | null;
};

export type SessionScore = {
  id: string;
  session_id: string;
  agent_id: string;
  agency_id: string;
  overall: number;
  opening: number;
  qualification: number;
  objection_handling: number;
  closing: number;
  summary: string;
  suggestions: string[];
  created_at: string;
};

export type Task = {
  id: string;
  agent_id: string;
  agency_id: string;
  title: string;
  is_done: boolean;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ClientType = "sprzedajacy" | "kupujacy" | "wynajmujacy" | "najemca" | "najem" | "inny";

/** Etykiety typów (z „najem" dla starych rekordów sprzed rozdzielenia). */
export const CLIENT_TYPE_LABELS: Record<string, string> = {
  sprzedajacy: "Sprzedający",
  kupujacy: "Kupujący",
  wynajmujacy: "Wynajmujący",
  najemca: "Najemca",
  najem: "Najem",
  inny: "Inny",
};
export type ClientStatus =
  | "nowy"
  | "w_kontakcie"
  | "oglada"
  | "negocjacje"
  | "zamkniety"
  | "stracony";

export type Client = {
  id: string;
  agent_id: string;
  agency_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: ClientType;
  status: ClientStatus;
  budget_pln: number | null;
  property: string | null;
  notes: string | null;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  next_contact_at: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientNote = {
  id: string;
  client_id: string;
  agent_id: string;
  content: string;
  created_at: string;
};

export type DealStatus = "w_toku" | "zamkniety" | "przepadl";

export type Deal = {
  id: string;
  agent_id: string;
  agency_id: string;
  client_id: string | null;
  property_id: string | null;
  title: string;
  commission_pln: number; // prowizja łączna biura (suma stron + dodatki)
  transaction_value_pln: number | null;
  commission_seller_pln: number;
  commission_buyer_pln: number;
  commission_landlord_pln: number;
  commission_tenant_pln: number;
  extras_pln: number;
  extras_note: string | null;
  agent_split_pct: number;
  agent_earnings_pln: number; // zarobek agenta (jego % + dodatki)
  status: DealStatus;
  expected_close: string | null;
  closed_at: string | null;
  created_at: string;
};

// ---------- NIERUCHOMOŚCI (oferty) ----------

export type PropertyDealKind = "sprzedaz" | "wynajem";
export type PropertyType =
  | "mieszkanie"
  | "dom"
  | "dzialka"
  | "lokal"
  | "magazyn"
  | "obiekt"
  | "pokoj"
  | "inwestycja"
  | "budynek"
  | "inne";
export type PropertyStatus = "aktywna" | "zarezerwowana" | "sfinalizowana" | "archiwum";

export type Property = {
  id: string;
  agent_id: string;
  agency_id: string;
  title: string;
  deal_kind: PropertyDealKind;
  property_type: PropertyType;
  status: PropertyStatus;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_pln: number | null;
  area_m2: number | null;
  rooms: number | null;
  floor: number | null;
  description: string | null;
  owner_client_id: string | null;
  created_at: string;
  updated_at: string;
  // ── v17: pola pod ofertę i przyszły eksport na stronę www ──
  offer_no?: string | null;
  slug?: string | null;
  headline?: string | null;
  market?: string | null;
  ownership?: string | null;
  available_from?: string | null;
  floors_total?: number | null;
  year_built?: number | null;
  building_type?: string | null;
  condition_std?: string | null;
  heating?: string | null;
  plot_area_m2?: number | null;
  admin_fee_pln?: number | null;
  deposit_pln?: number | null;
  features?: Record<string, boolean> | null;
  photos?: { url: string; main?: boolean; export?: boolean; caption?: string }[] | null;
  export_to_web?: boolean | null;
  export_to_portals?: boolean | null;
  web_published_at?: string | null;
  export_address_mode?: string | null;
};

export type PropertyInterest = {
  id: string;
  property_id: string;
  client_id: string;
  created_at: string;
};

export const PROPERTY_DEAL_KINDS: { value: PropertyDealKind; label: string }[] = [
  { value: "sprzedaz", label: "Sprzedaż" },
  { value: "wynajem", label: "Wynajem" },
];

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "mieszkanie", label: "Mieszkanie" },
  { value: "dom", label: "Dom" },
  { value: "dzialka", label: "Działka" },
  { value: "lokal", label: "Lokal / komercja" },
  { value: "magazyn", label: "Magazyn" },
  { value: "obiekt", label: "Obiekt" },
  { value: "pokoj", label: "Pokój" },
  { value: "inwestycja", label: "Inwestycja" },
  { value: "budynek", label: "Budynek" },
  { value: "inne", label: "Inne" },
];

/** Kafelki wyboru typu w kreatorze: ikona + kolor (układ jak w ASARI). */
export const PROPERTY_TYPE_TILES: {
  value: PropertyType;
  label: string;
  emoji: string;
  tile: string;
  group: "podstawowe" | "wieksze";
}[] = [
  { value: "mieszkanie", label: "Mieszkanie", emoji: "🏢", tile: "bg-blue-500", group: "podstawowe" },
  { value: "dom", label: "Dom", emoji: "🏠", tile: "bg-emerald-500", group: "podstawowe" },
  { value: "dzialka", label: "Działka", emoji: "🌳", tile: "bg-teal-500", group: "podstawowe" },
  { value: "lokal", label: "Lokal", emoji: "🏬", tile: "bg-violet-500", group: "podstawowe" },
  { value: "magazyn", label: "Magazyn", emoji: "📦", tile: "bg-amber-500", group: "podstawowe" },
  { value: "obiekt", label: "Obiekt", emoji: "🏛️", tile: "bg-slate-500", group: "podstawowe" },
  { value: "pokoj", label: "Pokój", emoji: "🛏️", tile: "bg-rose-500", group: "podstawowe" },
  { value: "inwestycja", label: "Inwestycja", emoji: "📈", tile: "bg-cyan-500", group: "wieksze" },
  { value: "budynek", label: "Budynek", emoji: "🏘️", tile: "bg-indigo-500", group: "wieksze" },
];

// ── Słowniki pól oferty (v17). Wartości trzymamy jako tekst, żeby dodanie
// nowej pozycji nie wymagało migracji bazy. ──
export const MARKETS: { value: string; label: string }[] = [
  { value: "wtorny", label: "Wtórny" },
  { value: "pierwotny", label: "Pierwotny" },
];

export const OWNERSHIPS: { value: string; label: string }[] = [
  { value: "wlasnosc", label: "Pełna własność (KW)" },
  { value: "spoldzielcze", label: "Spółdzielcze własnościowe" },
  { value: "udzial", label: "Udział w nieruchomości" },
  { value: "uzytkowanie", label: "Użytkowanie wieczyste" },
];

export const BUILDING_TYPES: { value: string; label: string }[] = [
  { value: "blok", label: "Blok" },
  { value: "apartamentowiec", label: "Apartamentowiec" },
  { value: "kamienica", label: "Kamienica" },
  { value: "wolnostojacy", label: "Wolnostojący" },
  { value: "blizniak", label: "Bliźniak" },
  { value: "szeregowy", label: "Szeregowy" },
];

export const CONDITIONS: { value: string; label: string }[] = [
  { value: "do_wprowadzenia", label: "Do wprowadzenia" },
  { value: "do_odswiezenia", label: "Do odświeżenia" },
  { value: "do_remontu", label: "Do remontu" },
  { value: "deweloperski", label: "Stan deweloperski" },
  { value: "w_budowie", label: "W budowie" },
];

export const HEATINGS: { value: string; label: string }[] = [
  { value: "miejskie", label: "Miejskie (MPEC)" },
  { value: "gazowe", label: "Gazowe" },
  { value: "elektryczne", label: "Elektryczne" },
  { value: "pompa", label: "Pompa ciepła" },
  { value: "kominek", label: "Kominek / piec" },
  { value: "inne", label: "Inne" },
];

/** Udogodnienia jako flagi w kolumnie features (jsonb). */
export const PROPERTY_FEATURES: { key: string; label: string }[] = [
  { key: "balkon", label: "Balkon" },
  { key: "taras", label: "Taras" },
  { key: "ogrodek", label: "Ogródek" },
  { key: "winda", label: "Winda" },
  { key: "garaz", label: "Garaż / miejsce postojowe" },
  { key: "piwnica", label: "Piwnica / komórka" },
  { key: "klimatyzacja", label: "Klimatyzacja" },
  { key: "alarm", label: "System alarmowy" },
  { key: "monitoring", label: "Monitoring" },
  { key: "meble", label: "Umeblowane" },
  { key: "zmywarka", label: "Zmywarka" },
  { key: "pralka", label: "Pralka" },
];

export const EXPORT_ADDRESS_MODES: { value: string; label: string; hint: string }[] = [
  { value: "pelny", label: "Pełny adres", hint: "z numerem budynku" },
  { value: "ulica", label: "Tylko ulica", hint: "bez numeru (zalecane)" },
  { value: "dzielnica", label: "Tylko dzielnica", hint: "najbardziej dyskretne" },
];

export const PROPERTY_STATUSES: {
  value: PropertyStatus;
  label: string;
  color: string;
}[] = [
  { value: "aktywna", label: "Aktywna", color: "bg-emerald-100 text-emerald-700" },
  { value: "zarezerwowana", label: "Zarezerwowana", color: "bg-amber-100 text-amber-700" },
  { value: "sfinalizowana", label: "Sfinalizowana", color: "bg-cyan-100 text-cyan-700" },
  { value: "archiwum", label: "Archiwum", color: "bg-slate-200 text-slate-600" },
];

export const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: "sprzedajacy", label: "Sprzedający" },
  { value: "kupujacy", label: "Kupujący" },
  { value: "wynajmujacy", label: "Wynajmujący" },
  { value: "najemca", label: "Najemca" },
  { value: "inny", label: "Inny" },
];

export const CLIENT_STATUSES: {
  value: ClientStatus;
  label: string;
  color: string;
}[] = [
  { value: "nowy", label: "Nowy", color: "bg-blue-100 text-blue-700" },
  { value: "w_kontakcie", label: "W kontakcie", color: "bg-cyan-100 text-cyan-700" },
  { value: "oglada", label: "Ogląda", color: "bg-violet-100 text-violet-700" },
  { value: "negocjacje", label: "Negocjacje", color: "bg-amber-100 text-amber-700" },
  { value: "zamkniety", label: "Zamknięty", color: "bg-emerald-100 text-emerald-700" },
  { value: "stracony", label: "Stracony", color: "bg-red-100 text-red-700" },
];

export const DEAL_STATUSES: { value: DealStatus; label: string; color: string }[] = [
  { value: "w_toku", label: "W toku", color: "bg-amber-100 text-amber-700" },
  { value: "zamkniety", label: "Zamknięty", color: "bg-emerald-100 text-emerald-700" },
  { value: "przepadl", label: "Przepadł", color: "bg-red-100 text-red-700" },
];

export const PERSONALITIES = [
  {
    value: "zyczliwy",
    label: "Życzliwy (łatwy)",
    description: "Otwarty, sympatyczny, chętnie współpracuje - dobry na start",
    color: "emerald",
  },
  {
    value: "agresywny",
    label: "Agresywny",
    description: "Napięty, nieufny, szybko traci cierpliwość",
    color: "red",
  },
  {
    value: "wahający",
    label: "Wahający",
    description: "Niezdecydowany, potrzebuje prowadzenia",
    color: "amber",
  },
  {
    value: "cenowy",
    label: "Cenowy",
    description: "Wszystko sprowadza do ceny i prowizji",
    color: "blue",
  },
  {
    value: "emocjonalny",
    label: "Emocjonalny",
    description: "Kieruje się uczuciami, potrzebuje empatii",
    color: "violet",
  },
  {
    value: "biznesowy",
    label: "Biznesowy",
    description: "Konkretny, rzeczowy, ceni Twój czas",
    color: "emerald",
  },
  {
    value: "nieufny",
    label: "Nieufny",
    description: "Podejrzliwy, był kiedyś oszukany, testuje Cię",
    color: "orange",
  },
  {
    value: "spieszacy",
    label: "Spieszący się",
    description: "Nie ma czasu, chce konkretów w 30 sekund",
    color: "cyan",
  },
  {
    value: "roszczeniowy",
    label: "Roszczeniowy",
    description: "Dużo wymaga, oczekuje że wszystko będzie po jego myśli",
    color: "pink",
  },
  {
    value: "gadatliwy",
    label: "Gadatliwy",
    description: "Odbiega od tematu, trzeba go umiejętnie prowadzić",
    color: "teal",
  },
] as const;

// ---------- CELE (lejek sprzedażowy) ----------

export type Goal = {
  id: string;
  agent_id: string;
  agency_id: string;
  annual_income_pln: number;
  avg_commission_pln: number;
  workdays_per_week: number;
  calls_per_meeting: number;
  meetings_per_listing: number;
  listings_per_sale: number;
  updated_at: string;
  created_at: string;
};

export type DailyLog = {
  id: string;
  agent_id: string;
  agency_id: string;
  log_date: string;
  cold_calls: number;
  meetings: number;
  listings: number;
  buyers: number;
  sales: number;
  created_at: string;
};

export const FUNNEL_STAGES = [
  { key: "cold_calls", label: "Cold calle", short: "Telefony", icon: "phone" },
  { key: "meetings", label: "Spotkania pozyskowe", short: "Spotkania", icon: "handshake" },
  { key: "listings", label: "Podpisane umowy", short: "Umowy", icon: "doc" },
  { key: "buyers", label: "Znalezieni kupujący", short: "Kupujący", icon: "user" },
  { key: "sales", label: "Sprzedaże / finalizacje", short: "Sprzedaże", icon: "trophy" },
] as const;

export type FunnelStageKey = (typeof FUNNEL_STAGES)[number]["key"];

export type PersonalityValue = (typeof PERSONALITIES)[number]["value"];
