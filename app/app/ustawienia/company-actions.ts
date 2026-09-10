"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import {
  getAgencySettings,
  saveAgencySettings,
  MARK_POSITIONS,
  PHOTO_SIZES,
  type AgencyOptions,
  type CompanyData,
  type MarkPosition,
  type PhotoSize,
} from "@/lib/agency-settings";
import { ASSET_BUCKET } from "@/lib/storage";
import { removeFiles, signUploads, type SignedUpload } from "@/lib/storage-server";

export type ActionResult = { ok: true } | { ok: false; error: string };

type AssetKind = "logo" | "watermark" | "stamp";

function txt(fd: FormData, k: string, max = 160): string | undefined {
  const v = String(fd.get(k) ?? "").trim().slice(0, max);
  return v || undefined;
}

function pct(fd: FormData, k: string, fallback: number): number {
  const n = parseFloat(String(fd.get(k) ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
}

function revalidateSettings() {
  revalidatePath("/app/ustawienia", "layout");
  revalidatePath("/app/nieruchomosci", "layout");
}

/** Dane firmy: nazwa, adres, NIP, kontakt i adres korespondencyjny. */
export async function saveCompany(formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const company: CompanyData = {
    name: txt(formData, "name", 200),
    street: txt(formData, "street"),
    postal_code: txt(formData, "postal_code", 12),
    city: txt(formData, "city"),
    country: txt(formData, "country") ?? "Polska",
    voivodeship: txt(formData, "voivodeship"),
    phone: txt(formData, "phone", 40),
    email: txt(formData, "email"),
    nip: txt(formData, "nip", 20)?.replace(/[^\d]/g, ""),
    www: txt(formData, "www"),
    corr_name: txt(formData, "corr_name", 200),
    corr_street: txt(formData, "corr_street"),
    corr_postal_code: txt(formData, "corr_postal_code", 12),
    corr_city: txt(formData, "corr_city"),
  };
  if (!company.name) return { ok: false, error: "Podaj nazwę firmy." };
  if (company.nip && company.nip.length !== 10) {
    return { ok: false, error: "NIP powinien mieć 10 cyfr." };
  }

  const err = await saveAgencySettings(owner.agency_id, { company });
  if (err) return { ok: false, error: err };
  revalidateSettings();
  return { ok: true };
}

/** Znak wodny i stempel: krycie, rozmiar, położenie. Same pliki wgrywa setAsset. */
export async function saveMarks(formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const current = await getAgencySettings(owner.agency_id, owner.agency?.name);

  const pos = (k: string, fallback: MarkPosition): MarkPosition => {
    const v = String(formData.get(k) ?? "");
    return MARK_POSITIONS.some((p) => p.value === v) ? (v as MarkPosition) : fallback;
  };

  const err = await saveAgencySettings(owner.agency_id, {
    watermark: {
      ...current.watermark,
      opacity: pct(formData, "wm_opacity", current.watermark.opacity * 100) / 100,
      scale: pct(formData, "wm_scale", current.watermark.scale * 100) / 100,
      position: pos("wm_position", current.watermark.position),
      enabled: formData.get("wm_enabled") === "1",
    },
    stamp: {
      ...current.stamp,
      scale: pct(formData, "st_scale", current.stamp.scale * 100) / 100,
      position: pos("st_position", current.stamp.position),
    },
  });
  if (err) return { ok: false, error: err };
  revalidateSettings();
  return { ok: true };
}

/** Pozostałe ustawienia: zdjęcia, prywatność, numeracja, raport, kojarzenie. */
export async function saveOptions(formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const current = await getAgencySettings(owner.agency_id, owner.agency?.name);

  const size = String(formData.get("photo_max") ?? "");
  const prefix = String(formData.get("offer_prefix") ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  const options: AgencyOptions = {
    photo_max: PHOTO_SIZES.some((s) => s.value === size) ? (size as PhotoSize) : current.options.photo_max,
    hide_contacts: formData.get("hide_contacts") === "1",
    report_default: formData.get("report_default") === "1",
    auto_numbering: formData.get("auto_numbering") === "1",
    offer_prefix: prefix || current.options.offer_prefix,
    match_price_minus: pct(formData, "match_price_minus", 10),
    match_price_plus: pct(formData, "match_price_plus", 10),
    match_area_minus: pct(formData, "match_area_minus", 10),
    match_area_plus: pct(formData, "match_area_plus", 10),
  };

  const err = await saveAgencySettings(owner.agency_id, { options });
  if (err) return { ok: false, error: err };
  revalidateSettings();
  revalidatePath("/app", "layout");
  return { ok: true };
}

/** Podpisany link do wgrania logo, znaku wodnego albo stempla. */
export async function signAssetUpload(
  kind: AssetKind,
  ext: string,
): Promise<{ upload: SignedUpload | null; error: string | null }> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { upload: null, error: "Konto nie jest przypisane do biura." };
  const res = await signUploads(ASSET_BUCKET, `${owner.agency_id}/${kind}`, [{ ext }]);
  return { upload: res.uploads[0] ?? null, error: res.error };
}

/** Po wgraniu: zapis ścieżki w ustawieniach i usunięcie poprzedniego pliku. */
export async function setAsset(kind: AssetKind, path: string | null): Promise<ActionResult> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (path && !path.startsWith(`${owner.agency_id}/${kind}/`)) {
    return { ok: false, error: "Nieprawidłowy plik." };
  }

  const current = await getAgencySettings(owner.agency_id, owner.agency?.name);
  const previous =
    kind === "logo" ? current.logo_path : kind === "watermark" ? current.watermark.path : current.stamp.path;

  const err =
    kind === "logo"
      ? await saveAgencySettings(owner.agency_id, { logo_path: path })
      : kind === "watermark"
        ? await saveAgencySettings(owner.agency_id, { watermark: { ...current.watermark, path } })
        : await saveAgencySettings(owner.agency_id, { stamp: { ...current.stamp, path } });

  if (err) {
    // Zapis się nie udał, więc świeżo wgrany plik nie jest nigdzie użyty.
    if (path) await removeFiles(ASSET_BUCKET, [path]);
    return { ok: false, error: err };
  }
  if (previous && previous !== path) await removeFiles(ASSET_BUCKET, [previous]);

  revalidateSettings();
  return { ok: true };
}
