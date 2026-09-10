import { createSupabaseAdmin } from "./supabase/admin";
import { ASSET_BUCKET, PHOTO_BUCKET, publicAssetUrl, type BucketId } from "./storage";

/**
 * Serwerowa część magazynu: zakładanie bucketów, podpisane linki do wgrania
 * i usuwanie plików. Tylko server-side (klucz service_role).
 */

const BUCKET_OPTIONS: Record<BucketId, { fileSizeLimit: string; allowedMimeTypes: string[] }> = {
  // Zdjęcia są zmniejszane w przeglądarce do ok. 0,3-1 MB, 15 MB to zapas.
  [PHOTO_BUCKET]: { fileSizeLimit: "15MB", allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  [ASSET_BUCKET]: {
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  },
};

const ensured = new Set<BucketId>();

/**
 * Zakłada bucket, jeśli go nie ma. Dzięki temu nowe biuro (albo nowy projekt
 * Supabase) nie musi niczego klikać w panelu, żeby wgrać pierwsze zdjęcie.
 */
export async function ensureBucket(bucket: BucketId): Promise<string | null> {
  if (ensured.has(bucket)) return null;
  const admin = createSupabaseAdmin();
  const { data } = await admin.storage.getBucket(bucket);
  if (!data) {
    const { error } = await admin.storage.createBucket(bucket, {
      public: true,
      ...BUCKET_OPTIONS[bucket],
    });
    if (error && !/already exists/i.test(error.message)) {
      return `Nie udało się przygotować magazynu zdjęć: ${error.message}`;
    }
  }
  ensured.add(bucket);
  return null;
}

export type SignedUpload = {
  path: string;
  signedUrl: string;
  publicUrl: string;
};

/** Losowa, nieprzewidywalna nazwa pliku (nie zdradza nazw z telefonu agenta). */
function randomName(ext: string): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${id}.${ext}`;
}

export async function signUploads(
  bucket: BucketId,
  folder: string,
  files: { ext: string }[],
): Promise<{ uploads: SignedUpload[]; error: string | null }> {
  const err = await ensureBucket(bucket);
  if (err) return { uploads: [], error: err };

  const admin = createSupabaseAdmin();
  const uploads: SignedUpload[] = [];
  for (const f of files) {
    const ext = /^(jpg|jpeg|png|webp|svg)$/.test(f.ext) ? f.ext : "jpg";
    const path = `${folder}/${randomName(ext)}`;
    const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      return { uploads: [], error: `Nie udało się przygotować wgrywania: ${error?.message ?? "brak linku"}` };
    }
    uploads.push({ path, signedUrl: data.signedUrl, publicUrl: publicAssetUrl(bucket, path) });
  }
  return { uploads, error: null };
}

export async function removeFiles(bucket: BucketId, paths: string[]): Promise<void> {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return;
  const admin = createSupabaseAdmin();
  await admin.storage.from(bucket).remove(clean);
}
