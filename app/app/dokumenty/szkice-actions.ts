"use server";

import { revalidatePath } from "next/cache";
import { requireModul } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { idZBiura } from "@/lib/agency-ids";
import { wzor } from "@/lib/dokumenty";
import type { Dane } from "@/lib/dokumenty/silnik";
import { KREATORY_SZKICOW } from "@/lib/kreatory-szkicow";
import { szkic as wczytaj, type Szkic } from "@/lib/data-szkice";

const znanyWzor = (id: string) => Boolean(wzor(id) || KREATORY_SZKICOW[id]);
const nazwaWzoru = (id: string) => wzor(id)?.nazwa ?? KREATORY_SZKICOW[id]?.nazwa ?? "Dokument";

type Wynik<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const BRAK_V54 = "Szkice wymagają migracji lib/SETUP-v55-szkice-dokumentow.sql w Supabase.";

/**
 * Zapis szkicu dokumentu. Pierwszy zapis tworzy szkic, kolejne (także
 * automatyczne) nadpisują go po `id`. Szkic należy do osoby, która go
 * zaczęła: cudzego nie nadpiszemy nawet ze znanym `id`.
 */
export async function zapiszSzkic(p: {
  id?: string | null;
  wzorId: string;
  tytul: string;
  dane: Dane | Record<string, unknown>;
  klientId?: string | null;
  ofertaId?: string | null;
}): Promise<Wynik<{ id: string; kiedy: string }>> {
  const user = await requireModul("dokumenty");
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (!znanyWzor(p.wzorId)) return { ok: false, error: "Nieznany wzór." };
  if (JSON.stringify(p.dane ?? {}).length > 60_000) return { ok: false, error: "Szkic jest za duży, skróć opisy." };

  const admin = createSupabaseAdmin();
  const [klient, oferta] = await Promise.all([
    idZBiura(admin, "clients", p.klientId ?? "", user.agency_id),
    idZBiura(admin, "properties", p.ofertaId ?? "", user.agency_id),
  ]);
  const kiedy = new Date().toISOString();
  const wiersz = {
    template: p.wzorId,
    title: (p.tytul || nazwaWzoru(p.wzorId)).slice(0, 160),
    data: p.dane,
    client_id: klient,
    property_id: oferta,
    updated_at: kiedy,
  };

  if (p.id) {
    const { data, error } = await admin
      .from("document_drafts")
      .update(wiersz)
      .eq("id", p.id)
      .eq("agency_id", user.agency_id)
      .eq("owner_id", user.id)
      .select("id");
    if (error) return { ok: false, error: /document_drafts/.test(error.message) ? BRAK_V54 : error.message };
    if (data?.length) return { ok: true, id: p.id, kiedy };
  }
  const { data, error } = await admin
    .from("document_drafts")
    .insert({ ...wiersz, agency_id: user.agency_id, owner_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error && /document_drafts/.test(error.message) ? BRAK_V54 : error?.message ?? "Nie zapisano szkicu." };
  revalidatePath("/app/dokumenty");
  return { ok: true, id: data.id as string, kiedy };
}

export async function usunSzkic(id: string): Promise<Wynik> {
  const user = await requireModul("dokumenty");
  const { error } = await createSupabaseAdmin().from("document_drafts").delete().eq("id", id).eq("agency_id", user.agency_id).eq("owner_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/dokumenty");
  return { ok: true };
}

/** Szkic do otwarcia w kreatorze (rezerwacja, aneks, protokół), który czyta go po stronie przeglądarki. */
export async function pobierzSzkic(id: string): Promise<Wynik<{ szkic: Szkic }>> {
  const user = await requireModul("dokumenty");
  const s = await wczytaj(user.agency_id, user.id, id);
  return s ? { ok: true, szkic: s } : { ok: false, error: "Nie znaleziono szkicu." };
}
