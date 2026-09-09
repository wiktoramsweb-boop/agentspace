"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function txt(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v || null;
}

/** Łączy datę i godzinę z formularza w znacznik czasu. */
function whenFrom(fd: FormData, dateKey: string, timeKey: string): string | null {
  const d = String(fd.get(dateKey) ?? "").trim();
  if (!d) return null;
  const t = String(fd.get(timeKey) ?? "").trim() || "09:00";
  const dt = new Date(`${d}T${t}`);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

export async function createActivity(formData: FormData): Promise<void> {
  const user = await requireUser();
  const subject = String(formData.get("subject") ?? "").trim();
  if (!subject) return;

  // Przypisani agenci: gdy nikogo nie wskazano, działanie jest moje.
  const assignees = formData.getAll("assignee_ids").map(String).filter(Boolean);
  const status = txt(formData, "status") ?? "zaplanowane";

  const admin = createSupabaseAdmin();
  await admin.from("activities").insert({
    agency_id: user.agency_id,
    created_by: user.id,
    kind: txt(formData, "kind") ?? "polaczenie",
    purpose: txt(formData, "purpose"),
    subject,
    description: txt(formData, "description"),
    status,
    priority: txt(formData, "priority") ?? "normalny",
    call_direction: txt(formData, "call_direction"),
    duration_s: Number(formData.get("duration_s")) || null,
    due_at: whenFrom(formData, "due_date", "due_time"),
    completed_at: status === "wykonane" ? new Date().toISOString() : null,
    client_id: txt(formData, "client_id"),
    property_id: txt(formData, "property_id"),
    assignee_ids: assignees.length ? assignees : [user.id],
    include_in_report: formData.get("include_in_report") === "1",
  });

  revalidatePath("/app/dzialania");
  revalidatePath("/app");
}

/** Szybka zmiana statusu z listy (odhaczenie „wykonane"). */
export async function setActivityStatus(id: string, status: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("activities")
    .update({
      status,
      completed_at: status === "wykonane" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("agency_id", user.agency_id);

  revalidatePath("/app/dzialania");
}

export async function deleteActivity(id: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin.from("activities").delete().eq("id", id).eq("agency_id", user.agency_id);
  revalidatePath("/app/dzialania");
}
