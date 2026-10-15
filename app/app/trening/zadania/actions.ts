"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { idsZBiura, idZBiura } from "@/lib/agency-ids";
import { brakTabeli, komunikatMigracji } from "@/lib/migracja";
import { powiadom } from "@/lib/powiadomienia";
import { PERSONALITIES } from "@/lib/types";

type Wynik = { ok: true; ile?: number } | { ok: false; error: string };

// Plik "use server" może eksportować tylko funkcje, więc lista zostaje lokalna.
const ZLECAJACY = ["owner", "director", "manager"];

/** Menedżer zleca tylko swoim agentom, CEO i dyrektor każdemu w biurze. */
async function dozwoleniAgenci(user: { id: string; role: string; agency_id: string | null }, ids: string[]): Promise<string[]> {
  const admin = createSupabaseAdmin();
  const zBiura = [...(await idsZBiura(admin, "profiles", ids, user.agency_id))];
  if (user.role !== "manager") return zBiura;
  const { data } = await admin.from("profiles").select("id").in("id", zBiura).eq("manager_id", user.id);
  return (data ?? []).map((p) => p.id as string);
}

export async function zlecTrening(f: FormData): Promise<Wynik> {
  const user = await requireUser();
  if (!user.agency_id || !ZLECAJACY.includes(user.role)) return { ok: false, error: "Zadania zlecają CEO, dyrektor i menedżer." };
  const agenci = await dozwoleniAgenci(user, f.getAll("agenci").map(String).slice(0, 50));
  if (!agenci.length) return { ok: false, error: "Wybierz co najmniej jedną osobę." };

  const admin = createSupabaseAdmin();
  const scenarioId = String(f.get("scenario") ?? "");
  const { data: scen } = await admin.from("scenarios").select("id, title").eq("id", scenarioId).maybeSingle();
  if (!scen) return { ok: false, error: "Wybierz scenariusz." };
  const difficulty = ["latwy", "sredni", "trudny"].includes(String(f.get("difficulty"))) ? String(f.get("difficulty")) : "sredni";
  const personality = String(f.get("personality") ?? "");
  const prog = Number(String(f.get("min_score") ?? "7").replace(",", "."));
  const termin = String(f.get("due_on") ?? "");
  const propertyId = await idZBiura(admin, "properties", String(f.get("property") ?? "") || null, user.agency_id);

  const { error } = await admin.from("training_assignments").insert(
    agenci.map((agent_id) => ({
      agency_id: user.agency_id,
      agent_id,
      assigned_by: user.id,
      scenario_id: scen.id,
      property_id: propertyId,
      difficulty,
      personality: PERSONALITIES.some((p) => p.value === personality) ? personality : null,
      min_score: Number.isFinite(prog) && prog >= 1 && prog <= 10 ? prog : 7,
      due_on: /^\d{4}-\d{2}-\d{2}$/.test(termin) ? termin : null,
      note: String(f.get("note") ?? "").trim().slice(0, 500) || null,
    })),
  );
  if (error) return { ok: false, error: brakTabeli(error) ? komunikatMigracji() : "Nie udało się zapisać zadania." };

  await powiadom(user.agency_id, agenci, {
    rodzaj: "trening",
    tytul: "Nowe zadanie treningowe",
    tresc: `${scen.title}${termin ? `, do ${termin.split("-").reverse().join(".")}` : ""}. Próg zaliczenia: ${Number.isFinite(prog) ? prog : 7}/10.`,
    adres: "/app/trening",
  });
  revalidatePath("/app/trening/zadania");
  return { ok: true, ile: agenci.length };
}

export async function usunZadanie(id: string): Promise<Wynik> {
  const user = await requireUser();
  if (!ZLECAJACY.includes(user.role)) return { ok: false, error: "Brak uprawnień." };
  const admin = createSupabaseAdmin();
  let q = admin.from("training_assignments").delete().eq("id", id).eq("agency_id", user.agency_id);
  if (user.role === "manager") q = q.eq("assigned_by", user.id);
  const { error } = await q;
  revalidatePath("/app/trening/zadania");
  revalidatePath("/app/trening");
  return error ? { ok: false, error: "Nie udało się usunąć." } : { ok: true };
}
