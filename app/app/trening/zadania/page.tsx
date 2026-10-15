import Link from "next/link";
import { redirect } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getScenarios } from "@/lib/data";
import { maV49 } from "@/lib/schemat";
import { PERSONALITIES, SCENARIO_CATEGORIES } from "@/lib/types";
import { PageHeader } from "../../components/ui";
import { BrakMigracji } from "../../components/brak-migracji";
import { FormularzZadania, ListaZadan, type ZadanieWiersz } from "./formularz";

export const metadata = { title: "Zadania treningowe" };

export default async function ZadaniaPage() {
  const user = await requireModul("coach");
  if (!["owner", "director", "manager"].includes(user.role)) redirect("/app/trening");
  if (!(await maV49())) {
    return (
      <>
        <PageHeader title="Zadania treningowe" subtitle="Zlecaj agentom konkretne rozmowy do przećwiczenia." />
        <BrakMigracji />
      </>
    );
  }
  const admin = createSupabaseAdmin();
  let ludzieQ = admin.from("profiles").select("id, full_name, role, manager_id").eq("agency_id", user.agency_id).order("full_name");
  if (user.role === "manager") ludzieQ = ludzieQ.eq("manager_id", user.id);
  let zadaniaQ = admin
    .from("training_assignments")
    .select("id, agent_id, scenario_id, difficulty, min_score, due_on, note, status, best_score, attempts, created_at, completed_at, assigned_by")
    .eq("agency_id", user.agency_id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (user.role === "manager") zadaniaQ = zadaniaQ.eq("assigned_by", user.id);

  const [scenarios, { data: ludzie }, { data: zadania }, { data: oferty }] = await Promise.all([
    getScenarios(),
    ludzieQ,
    zadaniaQ,
    admin.from("properties").select("id, address, city, title").eq("agency_id", user.agency_id).order("updated_at", { ascending: false }).limit(300),
  ]);

  const osoby = (ludzie ?? []).filter((p) => p.id !== user.id || user.role !== "owner");
  const imie = new Map((ludzie ?? []).map((p) => [p.id as string, (p.full_name as string) || "Bez imienia"]));
  const tytul = new Map(scenarios.map((s) => [s.id, s.title]));
  const wiersze: ZadanieWiersz[] = (zadania ?? []).map((z) => ({
    id: z.id,
    osoba: imie.get(z.agent_id) ?? "Osoba spoza zespołu",
    scenariusz: tytul.get(z.scenario_id) ?? "Scenariusz usunięty",
    trudnosc: z.difficulty,
    prog: z.min_score == null ? null : Number(z.min_score),
    termin: z.due_on,
    status: z.status,
    najlepszy: z.best_score == null ? null : Number(z.best_score),
    proby: z.attempts ?? 0,
    notatka: z.note,
  }));

  return (
    <>
      <PageHeader
        title="Zadania treningowe"
        subtitle="Zleć agentowi konkretną rozmowę do przećwiczenia, z progiem zaliczenia i terminem. Dostaniesz powiadomienie, gdy zaliczy."
        action={<Link href="/app/trening" className="text-sm font-medium text-slate-500 hover:text-slate-800">← AI Coach</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start">
        <FormularzZadania
          osoby={osoby.map((p) => ({ id: p.id as string, nazwa: (p.full_name as string) || "Bez imienia" }))}
          scenariusze={SCENARIO_CATEGORIES.flatMap((c) =>
            scenarios.filter((s) => s.category === c.value).map((s) => ({ value: s.id, label: s.title, hint: c.label })),
          )}
          osobowosci={PERSONALITIES.map((p) => ({ value: p.value, label: p.label }))}
          oferty={(oferty ?? []).map((o) => ({ value: o.id as string, label: [o.address, o.city].filter(Boolean).join(", ") || (o.title as string) }))}
        />
        <ListaZadan zadania={wiersze} />
      </div>
    </>
  );
}
