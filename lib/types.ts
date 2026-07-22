export type UserRole = "owner" | "agent";

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
    description: "Zimne telefony — pozyskiwanie kontaktu przez telefon",
    icon: "phone",
  },
  {
    value: "spotkanie",
    label: "Spotkania pozyskowe",
    description: "Spotkania u klienta — pozyskanie oferty i podpisanie umowy",
    icon: "handshake",
  },
  {
    value: "najem",
    label: "Najem (bezpieczny)",
    description: "Wynajem — weryfikacja najemcy, dochody, bezpieczeństwo",
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

export type ClientType = "kupujacy" | "sprzedajacy" | "najem" | "inny";
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
  title: string;
  commission_pln: number;
  status: DealStatus;
  expected_close: string | null;
  closed_at: string | null;
  created_at: string;
};

export const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: "kupujacy", label: "Kupujący" },
  { value: "sprzedajacy", label: "Sprzedający" },
  { value: "najem", label: "Najem" },
  { value: "inny", label: "Inny" },
];

export const CLIENT_STATUSES: {
  value: ClientStatus;
  label: string;
  color: string;
}[] = [
  { value: "nowy", label: "Nowy", color: "bg-blue-500/15 text-blue-300" },
  { value: "w_kontakcie", label: "W kontakcie", color: "bg-cyan-500/15 text-cyan-300" },
  { value: "oglada", label: "Ogląda", color: "bg-violet-500/15 text-violet-300" },
  { value: "negocjacje", label: "Negocjacje", color: "bg-amber-500/15 text-amber-300" },
  { value: "zamkniety", label: "Zamknięty", color: "bg-emerald-500/15 text-emerald-300" },
  { value: "stracony", label: "Stracony", color: "bg-red-500/15 text-red-300" },
];

export const DEAL_STATUSES: { value: DealStatus; label: string; color: string }[] = [
  { value: "w_toku", label: "W toku", color: "bg-amber-500/15 text-amber-300" },
  { value: "zamkniety", label: "Zamknięty", color: "bg-emerald-500/15 text-emerald-300" },
  { value: "przepadl", label: "Przepadł", color: "bg-red-500/15 text-red-300" },
];

export const PERSONALITIES = [
  {
    value: "zyczliwy",
    label: "Życzliwy (łatwy)",
    description: "Otwarty, sympatyczny, chętnie współpracuje — dobry na start",
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
