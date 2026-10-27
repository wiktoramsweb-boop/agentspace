"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { zapiszZdarzenie } from "@/lib/dziennik";

export type WynikOddzialu = { ok: true } | { ok: false; error: string };

const BRAK_V54 = "Oddziały wymagają migracji lib/SETUP-v54-oddzialy-prowizje.sql w Supabase.";

function pole(fd: FormData, k: string, maks = 160): string | null {
  const s = String(fd.get(k) ?? "").trim();
  return s ? s.slice(0, maks) : null;
}

/** Kierownik musi być z tego samego biura, inaczej ID z formularza mogłoby wskazać obcą osobę. */
async function kierownikZBiura(agencyId: string, id: string | null): Promise<string | null> {
  if (!id) return null;
  const { data } = await createSupabaseAdmin().from("profiles").select("id").eq("id", id).eq("agency_id", agencyId).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function zapiszOddzial(fd: FormData): Promise<WynikOddzialu> {
  const owner = await requireOwner();
  const agencyId = owner.agency_id!;
  const name = pole(fd, "name", 80);
  if (!name) return { ok: false, error: "Podaj nazwę oddziału." };
  const id = pole(fd, "id", 40);
  const wiersz = {
    name,
    city: pole(fd, "city", 80),
    address: pole(fd, "address", 200),
    phone: pole(fd, "phone", 40),
    manager_id: await kierownikZBiura(agencyId, pole(fd, "manager_id", 40)),
  };
  const admin = createSupabaseAdmin();
  const { error } = id
    ? await admin.from("branches").update(wiersz).eq("id", id).eq("agency_id", agencyId)
    : await admin.from("branches").insert({ ...wiersz, agency_id: agencyId });
  if (error) return { ok: false, error: /branches/.test(error.message) ? BRAK_V54 : error.message };
  if (!id) await zapiszZdarzenie({ agencyId, actorId: owner.id, akcja: "oddzial_dodany", rodzaj: "oddzial", opis: `Dodano oddział ${name}` });
  revalidatePath("/app/zespol");
  return { ok: true };
}

export async function usunOddzial(id: string): Promise<WynikOddzialu> {
  const owner = await requireOwner();
  const agencyId = owner.agency_id!;
  // Ludzie i leady zostają w biurze, tylko tracą przypisanie (on delete set null).
  const { data, error } = await createSupabaseAdmin().from("branches").delete().eq("id", id).eq("agency_id", agencyId).select("name");
  if (error) return { ok: false, error: error.message };
  if (data?.length) {
    await zapiszZdarzenie({ agencyId, actorId: owner.id, akcja: "oddzial_usuniety", rodzaj: "oddzial", id, opis: `Usunięto oddział ${data[0].name}` });
  }
  revalidatePath("/app/zespol");
  return { ok: true };
}

export async function przypiszDoOddzialu(profileId: string, branchId: string | null): Promise<WynikOddzialu> {
  const owner = await requireOwner();
  const agencyId = owner.agency_id!;
  const admin = createSupabaseAdmin();
  if (branchId) {
    const { data: b } = await admin.from("branches").select("id").eq("id", branchId).eq("agency_id", agencyId).maybeSingle();
    if (!b) return { ok: false, error: "Nie ma takiego oddziału w biurze." };
  }
  const { error } = await admin.from("profiles").update({ branch_id: branchId }).eq("id", profileId).eq("agency_id", agencyId);
  if (error) return { ok: false, error: /branch_id/.test(error.message) ? BRAK_V54 : error.message };
  revalidatePath("/app/zespol");
  return { ok: true };
}
