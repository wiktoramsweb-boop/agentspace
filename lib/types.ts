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
};

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
] as const;

export type PersonalityValue = (typeof PERSONALITIES)[number]["value"];
