"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakTabeli } from "@/lib/migracja";

export type PozycjaPowiadomienia = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type StanPowiadomien = {
  pozycje: PozycjaPowiadomienia[];
  nieprzeczytane: number;
  /** Tabela jeszcze nie istnieje: dzwonek się nie pokazuje. */
  brakMigracji?: boolean;
};

export async function pobierzPowiadomienia(): Promise<StanPowiadomien> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const [lista, licznik] = await Promise.all([
    admin
      .from("notifications")
      .select("id, kind, title, body, href, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);
  if (brakTabeli(lista.error)) return { pozycje: [], nieprzeczytane: 0, brakMigracji: true };
  return {
    pozycje: (lista.data ?? []) as PozycjaPowiadomienia[],
    nieprzeczytane: licznik.count ?? 0,
  };
}

export async function oznaczPrzeczytane(id?: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  let q = admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (id) q = q.eq("id", id);
  await q;
}
