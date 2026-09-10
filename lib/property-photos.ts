import { PHOTO_BUCKET, publicAssetUrl } from "./storage";
import type { PropertyPhoto } from "./types";

/** Górny limit zdjęć w jednej ofercie - portale i tak biorą 30-50. */
export const MAX_PHOTOS = 60;

/**
 * Czyści listę zdjęć przysłaną z przeglądarki: przepuszcza tylko pliki z
 * folderu tego biura i buduje adresy od nowa po stronie serwera, zamiast
 * ufać temu, co przyszło w formularzu.
 */
export function sanitizePhotos(raw: unknown, agencyId: string): PropertyPhoto[] {
  if (!Array.isArray(raw)) return [];
  const own = (p: unknown): p is string => typeof p === "string" && p.startsWith(`${agencyId}/`);
  const out: PropertyPhoto[] = [];
  for (const item of raw.slice(0, MAX_PHOTOS)) {
    if (!item || typeof item !== "object") continue;
    const p = item as Record<string, unknown>;
    if (!own(p.path)) continue;
    const originalPath = own(p.original_path) ? p.original_path : undefined;
    out.push({
      path: p.path,
      url: publicAssetUrl(PHOTO_BUCKET, p.path),
      original_path: originalPath,
      original_url: originalPath ? publicAssetUrl(PHOTO_BUCKET, originalPath) : undefined,
      caption: typeof p.caption === "string" ? p.caption.slice(0, 200) : undefined,
      export: p.export !== false,
      print: p.print !== false,
      plan: p.plan === true,
      visualization: p.visualization === true,
      stamp: p.stamp === true,
      width: typeof p.width === "number" ? p.width : undefined,
      height: typeof p.height === "number" ? p.height : undefined,
    });
  }
  return out;
}

