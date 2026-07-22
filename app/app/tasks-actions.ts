"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function addTask(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const admin = createSupabaseAdmin();
  await admin.from("tasks").insert({
    agent_id: user.id,
    agency_id: user.agency_id,
    title,
    due_date: new Date().toISOString().slice(0, 10),
  });
  revalidatePath("/app");
}

export async function toggleTask(taskId: string, done: boolean): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin
    .from("tasks")
    .update({
      is_done: done,
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("agent_id", user.id);
  revalidatePath("/app");
}

export async function deleteTask(taskId: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  await admin.from("tasks").delete().eq("id", taskId).eq("agent_id", user.id);
  revalidatePath("/app");
}
