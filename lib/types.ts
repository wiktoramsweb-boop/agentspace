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
