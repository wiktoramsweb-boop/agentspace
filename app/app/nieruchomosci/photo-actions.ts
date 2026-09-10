"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PHOTO_BUCKET } from "@/lib/storage";
import { sanitizePhotos } from "@/lib/property-photos";
import { removeFiles, signUploads, type SignedUpload } from "@/lib/storage-server";
import type { PropertyPhoto } from "@/lib/types";

/** Ile zdjęć naraz przyjmujemy w jednej paczce (ASARI ma podobny limit). */
const MAX_BATCH = 40;

/**
 * Podpisane linki do wgrania zdjęć. Pliki trafiają do folderu biura, więc
 * nikt z innego biura nie może ich nadpisać ani podpiąć pod swoją ofertę.
 */
export async function signPhotoUploads(
  count: number,
): Promise<{ uploads: SignedUpload[]; error: string | null }> {
  const user = await requireUser();
  if (!user.agency_id) return { uploads: [], error: "Konto nie jest przypisane do biura." };
  const n = Math.max(0, Math.min(MAX_BATCH * 2, Math.floor(count)));
  const month = new Date().toISOString().slice(0, 7);
  return signUploads(
    PHOTO_BUCKET,
    `${user.agency_id}/${month}`,
    Array.from({ length: n }, () => ({ ext: "jpg" })),
  );
}

function filesOf(photos: PropertyPhoto[]): Set<string> {
  const s = new Set<string>();
  for (const p of photos) {
    if (p.path) s.add(p.path);
    if (p.original_path) s.add(p.original_path);
  }
  return s;
}

/** Zapis kolejności, opisów i oznaczeń zdjęć oferty. Usunięte pliki kasujemy z magazynu. */
export async function savePropertyPhotos(
  propertyId: string,
  photos: PropertyPhoto[],
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const admin = createSupabaseAdmin();
  const { data: prop } = await admin
    .from("properties")
    .select("id, photos")
    .eq("id", propertyId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!prop) return { ok: false, error: "Nie znaleziono oferty." };

  const clean = sanitizePhotos(photos, user.agency_id);
  const { error } = await admin
    .from("properties")
    .update({ photos: clean, updated_at: new Date().toISOString() })
    .eq("id", propertyId)
    .eq("agency_id", user.agency_id);
  if (error) return { ok: false, error: `Nie udało się zapisać zdjęć: ${error.message}` };

  // Pliki, które zniknęły z listy, usuwamy dopiero po udanym zapisie oferty.
  const before = filesOf((prop.photos ?? []) as PropertyPhoto[]);
  const after = filesOf(clean);
  const removed = [...before].filter((p) => !after.has(p) && p.startsWith(`${user.agency_id}/`));
  await removeFiles(PHOTO_BUCKET, removed);

  revalidatePath(`/app/nieruchomosci/${propertyId}`);
  revalidatePath("/app/nieruchomosci");
  return { ok: true };
}

/**
 * Sprzątanie po przerwanym dodawaniu oferty: agent wgrał zdjęcia w kreatorze,
 * ale zamknął go bez zapisu. Kasujemy tylko pliki z folderu własnego biura.
 */
export async function discardPhotoUploads(paths: string[]): Promise<void> {
  const user = await requireUser();
  if (!user.agency_id) return;
  const own = paths.filter((p) => typeof p === "string" && p.startsWith(`${user.agency_id}/`));
  await removeFiles(PHOTO_BUCKET, own);
}
