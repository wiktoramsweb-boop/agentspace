"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { DOC_BUCKET } from "@/lib/storage";
import { signedDownloadUrl } from "@/lib/storage-server";
import { dostepWlasciciela, powiadomOpiekuna } from "@/lib/data-wlasciciel";

const odswiez = (token: string) => revalidatePath(`/wlasciciel/${token}`, "layout");

export async function zglosUsterke(token: string, lokalId: string, tytul: string): Promise<{ ok: boolean; blad?: string }> {
  const d = await dostepWlasciciela(token);
  const t = tytul.trim().slice(0, 300);
  if (!d || !d.unit_ids.includes(lokalId)) return { ok: false, blad: "Brak dostępu." };
  if (t.length < 3) return { ok: false, blad: "Opisz, co się stało." };
  const { error } = await createSupabaseAdmin().from("rental_events").insert({ unit_id: lokalId, agency_id: d.agency_id, rodzaj: "usterka", tytul: t, od_wlasciciela: true });
  if (error) return { ok: false, blad: "Nie udało się wysłać." };
  await powiadomOpiekuna(lokalId, d.agency_id, "Właściciel zgłosił sprawę", t);
  odswiez(token);
  return { ok: true };
}

/** Zgoda na koszt powyżej limitu. Działa tylko na wpisie, który naprawdę na nią czeka. */
export async function decyzjaKoszt(token: string, zdarzenieId: string, zgoda: boolean): Promise<{ ok: boolean }> {
  const d = await dostepWlasciciela(token);
  if (!d) return { ok: false };
  const admin = createSupabaseAdmin();
  const { data: z } = await admin.from("rental_events").select("unit_id, tytul, zgoda").eq("id", zdarzenieId).maybeSingle();
  if (!z || !d.unit_ids.includes(z.unit_id) || z.zgoda !== "oczekuje") return { ok: false };
  await admin.from("rental_events").update({ zgoda: zgoda ? "zatwierdzona" : "odrzucona" }).eq("id", zdarzenieId);
  await powiadomOpiekuna(z.unit_id, d.agency_id, `Właściciel ${zgoda ? "zatwierdził" : "odrzucił"} koszt`, z.tytul);
  odswiez(token);
  return { ok: true };
}

export async function napiszDoBiura(token: string, tresc: string): Promise<{ ok: boolean }> {
  const d = await dostepWlasciciela(token);
  const t = tresc.trim().slice(0, 2000);
  if (!d || t.length < 1) return { ok: false };
  const admin = createSupabaseAdmin();
  await admin.from("rental_owner_messages").insert({ access_id: d.id, agency_id: d.agency_id, autor: "wlasciciel", tresc: t });
  await admin.from("rental_owner_messages").update({ read_at: new Date().toISOString() }).eq("access_id", d.id).eq("autor", "biuro").is("read_at", null);
  if (d.unit_ids[0]) await powiadomOpiekuna(d.unit_ids[0], d.agency_id, `Wiadomość od właściciela: ${d.nazwa}`, t.slice(0, 140));
  odswiez(token);
  return { ok: true };
}

export async function linkDokumentu(token: string, id: string): Promise<string | null> {
  const d = await dostepWlasciciela(token);
  if (!d) return null;
  const { data: doc } = await createSupabaseAdmin().from("documents").select("path, name, entity_type, entity_id, kind").eq("id", id).eq("agency_id", d.agency_id).maybeSingle();
  if (!doc || doc.entity_type !== "najem" || doc.kind === "inne" || !d.unit_ids.includes(doc.entity_id)) return null;
  return signedDownloadUrl(DOC_BUCKET, doc.path, doc.name);
}
