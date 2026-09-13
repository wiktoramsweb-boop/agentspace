import { createSupabaseAdmin } from "./supabase/admin";
import { ASSET_BUCKET, DOC_BUCKET, PHOTO_BUCKET, publicAssetUrl, type BucketId } from "./storage";

/**
 * Serwerowa część magazynu: zakładanie bucketów, podpisane linki do wgrania
 * i usuwanie plików. Tylko server-side (klucz service_role).
 */

/** Formaty dokumentów, które przyjmujemy: PDF, zdjęcia/skany, Word, Excel, OpenDocument, tekst. */
export const DOC_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "text/plain",
];

const BUCKET_OPTIONS: Record<BucketId, { public: boolean; fileSizeLimit: string; allowedMimeTypes: string[] }> = {
  // Zdjęcia są zmniejszane w przeglądarce do ok. 0,3-1 MB, 15 MB to zapas.
  [PHOTO_BUCKET]: { public: true, fileSizeLimit: "15MB", allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  [ASSET_BUCKET]: {
    public: true,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  },
  [DOC_BUCKET]: {
    public: false,
    fileSizeLimit: "25MB",
    allowedMimeTypes: DOC_MIME_TYPES,
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
    const { error } = await admin.storage.createBucket(bucket, BUCKET_OPTIONS[bucket]);
    if (error && !/already exists/i.test(error.message)) {
      return `Nie udało się przygotować magazynu plików: ${error.message}`;
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
  const allowedExt =
    bucket === DOC_BUCKET
      ? /^(pdf|jpg|jpeg|png|webp|heic|doc|docx|xls|xlsx|odt|ods|txt)$/
      : /^(jpg|jpeg|png|webp|svg)$/;
  for (const f of files) {
    const ext = allowedExt.test(f.ext) ? f.ext : bucket === DOC_BUCKET ? "pdf" : "jpg";
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

/**
 * Krótkotrwały link do pobrania pliku z prywatnego bucketu. `downloadName`
 * sprawia, że przeglądarka zapisze plik pod czytelną nazwą, a nie losową.
 */
export async function signedDownloadUrl(
  bucket: BucketId,
  path: string,
  downloadName?: string,
  seconds = 120,
): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, seconds, downloadName ? { download: downloadName } : undefined);
  return data?.signedUrl ?? null;
}
