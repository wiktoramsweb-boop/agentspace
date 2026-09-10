import { SUPABASE_URL } from "./supabase/config";

/**
 * Magazyn plików (Supabase Storage).
 *
 * Dwa publiczne buckety: zdjęcia ofert i pliki biura (logo, znak wodny,
 * stempel). Publiczne do odczytu, bo te pliki i tak idą na stronę i portale.
 * Wgrywanie wyłącznie przez podpisane linki wydawane przez serwer po
 * sprawdzeniu uprawnień, więc przeglądarka nigdy nie dostaje klucza.
 */

export const PHOTO_BUCKET = "property-photos";
export const ASSET_BUCKET = "agency-assets";
export type BucketId = typeof PHOTO_BUCKET | typeof ASSET_BUCKET;

export function publicAssetUrl(bucket: BucketId, path: string): string {
  const base = (process.env.SUPABASE_URL ?? SUPABASE_URL).replace(/\/$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}

/**
 * Wyciąga ścieżkę w buckecie z publicznego adresu. Potrzebne przy usuwaniu
 * zdjęcia, gdy w bazie mamy tylko jego URL.
 */
export function pathFromPublicUrl(bucket: BucketId, url: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const rest = url.slice(i + marker.length).split("?")[0];
  return rest.split("/").map(decodeURIComponent).join("/");
}
