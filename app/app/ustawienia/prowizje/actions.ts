"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { oczyscProgi } from "@/lib/zasady-prowizji";
import type { ActionResult } from "../company-actions";

function procent(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n * 100) / 100)) : 0;
}

export async function zapiszZasadyProwizji(fd: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  const agencyId = owner.agency_id!;
  const od = fd.getAll("prog_od").map((v) => String(v).replace(/\s/g, ""));
  const pct = fd.getAll("prog_pct").map(String);
  const progi = oczyscProgi(od.map((o, i) => ({ od: Number(o) || 0, pct: Number(pct[i]) || 0 })));
  const wiersz = {
    agency_id: agencyId,
    progi,
    manager_override_pct: procent(fd.get("nadprowizja")),
    network_fee_pct: procent(fd.get("siec")),
    network_name: String(fd.get("siec_nazwa") ?? "").trim().slice(0, 80) || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await createSupabaseAdmin().from("commission_rules").upsert(wiersz, { onConflict: "agency_id" });
  if (error) {
    return { ok: false, error: /commission_rules/.test(error.message) ? "Uruchom w Supabase migrację lib/SETUP-v54-oddzialy-prowizje.sql." : error.message };
  }
  await zapiszZdarzenie({
    agencyId,
    actorId: owner.id,
    akcja: "zasady_prowizji",
    rodzaj: "ustawienia",
    opis: `Zasady prowizji: progi ${progi.map((p) => `${p.od} zł → ${p.pct}%`).join(", ") || "brak"}, menedżer ${wiersz.manager_override_pct}%, sieć ${wiersz.network_fee_pct}%`,
  });
  revalidatePath("/app/ustawienia/prowizje");
  revalidatePath("/app/prowizje");
  return { ok: true };
}
