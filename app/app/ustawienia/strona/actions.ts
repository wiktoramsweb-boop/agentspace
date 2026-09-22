"use server";

import { revalidatePath } from "next/cache";
import { requireOwner, requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ASSET_BUCKET } from "@/lib/storage";
import { removeFiles, signUploads, type SignedUpload } from "@/lib/storage-server";
import { slugify, type SiteBrand, type SiteContact, type SiteContent } from "@/lib/site/config";
import { WZORY } from "@/lib/wzory/themes";

export type SiteResult = { ok: true } | { ok: false; error: string };

/** Podgląd i strona publiczna muszą się odświeżyć po każdej zmianie. */
function refresh(slug: string) {
  revalidatePath("/app/ustawienia/strona");
  revalidatePath("/app/ustawienia/strona/tresci");
  revalidatePath("/app/ustawienia/strona/zespol");
  revalidatePath("/app/ustawienia/strona/wpisy");
  if (slug) {
    revalidatePath(`/strona/${slug}`);
    revalidatePath(`/strona/${slug}/oferty`);
    revalidatePath(`/strona/${slug}/zespol`);
    revalidatePath(`/strona/${slug}/poradnik`);
  }
}

async function upsert(agencyId: string, patch: Record<string, unknown>) {
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("site_config")
    .upsert({ agency_id: agencyId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "agency_id" });
  return error?.message ?? null;
}

/** Wzór, adres strony i publikacja. */
export async function saveSiteBasics(formData: FormData): Promise<SiteResult> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const template = String(formData.get("template") ?? "kamienica");
  if (!WZORY.some((w) => w.slug === template)) return { ok: false, error: "Nieznany wzór strony." };

  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugRaw || owner.agency?.name || "biuro");
  if (slug.length < 3) return { ok: false, error: "Adres strony musi mieć co najmniej trzy znaki." };

  const admin = createSupabaseAdmin();
  const { data: taken } = await admin.from("site_config").select("agency_id").eq("slug", slug).maybeSingle();
  if (taken && taken.agency_id !== owner.agency_id) {
    return { ok: false, error: "Ten adres jest już zajęty przez inne biuro. Wybierz inny." };
  }

  const brand: Partial<SiteBrand> = {
    officeName: String(formData.get("officeName") ?? "").trim().slice(0, 80) || (owner.agency?.name ?? "Biuro"),
    claim: String(formData.get("claim") ?? "").trim().slice(0, 60),
    accent: String(formData.get("accent") ?? "").trim().slice(0, 20),
  };

  const { data: current } = await admin
    .from("site_config")
    .select("brand")
    .eq("agency_id", owner.agency_id)
    .maybeSingle();

  const err = await upsert(owner.agency_id, {
    template,
    slug,
    published: formData.get("published") === "1",
    brand: { ...((current?.brand as object) ?? {}), ...brand },
  });
  if (err) return { ok: false, error: `Nie udało się zapisać: ${err}. Uruchom w Supabase SETUP-v25.` };

  refresh(slug);
  return { ok: true };
}

/** Dane kontaktowe pokazywane na stronie. */
export async function saveSiteContact(formData: FormData): Promise<SiteResult> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const contact: SiteContact = {
    phone: String(formData.get("phone") ?? "").trim().slice(0, 40),
    email: String(formData.get("email") ?? "").trim().slice(0, 120),
    addressLine: String(formData.get("addressLine") ?? "").trim().slice(0, 120),
    addressCity: String(formData.get("addressCity") ?? "").trim().slice(0, 80),
    hours: String(formData.get("hours") ?? "").trim().slice(0, 120),
    nip: String(formData.get("nip") ?? "").trim().slice(0, 40),
    facebook: String(formData.get("facebook") ?? "").trim().slice(0, 200),
    instagram: String(formData.get("instagram") ?? "").trim().slice(0, 200),
  };

  const err = await upsert(owner.agency_id, { contact });
  if (err) return { ok: false, error: `Nie udało się zapisać: ${err}` };

  const { data } = await createSupabaseAdmin()
    .from("site_config")
    .select("slug")
    .eq("agency_id", owner.agency_id)
    .maybeSingle();
  refresh((data?.slug as string) ?? "");
  return { ok: true };
}

/** Teksty sekcji strony głównej. */
export async function saveSiteContent(formData: FormData): Promise<SiteResult> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const take = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);

  const stats = [0, 1, 2, 3]
    .map((i) => ({ value: take(`stat_value_${i}`, 24), label: take(`stat_label_${i}`, 60) }))
    .filter((s) => s.value && s.label);

  const reasons = [0, 1, 2]
    .map((i) => ({ title: take(`reason_title_${i}`, 80), body: take(`reason_body_${i}`, 400) }))
    .filter((r) => r.title);

  const reviews = [0, 1, 2, 3]
    .map((i) => ({ text: take(`review_text_${i}`, 400), who: take(`review_who_${i}`, 60), what: take(`review_what_${i}`, 80) }))
    .filter((r) => r.text && r.who);

  const content: SiteContent = {
    heroKick: take("heroKick", 60),
    heroTitle: take("heroTitle", 140),
    heroLead: take("heroLead", 400),
    aboutTitle: take("aboutTitle", 120),
    aboutBody: take("aboutBody", 2000),
    stats,
    reasons,
    ctaTitle: take("ctaTitle", 140),
    ctaLead: take("ctaLead", 400),
    reviews,
  };

  if (!content.heroTitle) return { ok: false, error: "Nagłówek strony głównej nie może być pusty." };

  const err = await upsert(owner.agency_id, { content });
  if (err) return { ok: false, error: `Nie udało się zapisać: ${err}` };

  const { data } = await createSupabaseAdmin()
    .from("site_config")
    .select("slug")
    .eq("agency_id", owner.agency_id)
    .maybeSingle();
  refresh((data?.slug as string) ?? "");
  return { ok: true };
}

/* ───────────────────────── pliki ───────────────────────── */

export async function signSiteUpload(
  kind: "logo" | "hero",
  ext: string,
): Promise<{ upload: SignedUpload | null; error: string | null }> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { upload: null, error: "Konto nie jest przypisane do biura." };
  const res = await signUploads(ASSET_BUCKET, `${owner.agency_id}/site/${kind}`, [{ ext }]);
  return { upload: res.uploads[0] ?? null, error: res.error };
}

export async function setSiteAsset(kind: "logo" | "hero", path: string | null): Promise<SiteResult> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (path && !path.startsWith(`${owner.agency_id}/site/${kind}/`)) return { ok: false, error: "Nieprawidłowy plik." };

  const admin = createSupabaseAdmin();
  const { data: current } = await admin
    .from("site_config")
    .select("brand, slug")
    .eq("agency_id", owner.agency_id)
    .maybeSingle();

  const brand = ((current?.brand as Partial<SiteBrand>) ?? {}) as Partial<SiteBrand>;
  const field = kind === "logo" ? "logoPath" : "heroPath";
  const previous = brand[field] as string | null | undefined;

  const err = await upsert(owner.agency_id, { brand: { ...brand, [field]: path } });
  if (err) {
    if (path) await removeFiles(ASSET_BUCKET, [path]);
    return { ok: false, error: `Nie udało się zapisać: ${err}` };
  }
  if (previous && previous !== path) await removeFiles(ASSET_BUCKET, [previous]);

  refresh((current?.slug as string) ?? "");
  return { ok: true };
}

/* ───────────────────────── zespół ───────────────────────── */

export async function setTeamVisibility(memberId: string, show: boolean): Promise<SiteResult> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();
  const { data: member } = await admin.from("profiles").select("agency_id").eq("id", memberId).maybeSingle();
  if (!member || member.agency_id !== owner.agency_id) return { ok: false, error: "Nie znaleziono osoby." };

  const { error } = await admin.from("profiles").update({ show_on_site: show }).eq("id", memberId);
  if (error) return { ok: false, error: "Nie udało się zapisać. Uruchom w Supabase SETUP-v25." };

  const { data } = await admin.from("site_config").select("slug").eq("agency_id", owner.agency_id!).maybeSingle();
  refresh((data?.slug as string) ?? "");
  return { ok: true };
}

export async function moveTeamMember(memberId: string, direction: -1 | 1): Promise<SiteResult> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();

  const { data: rows } = await admin
    .from("profiles")
    .select("id, site_order, created_at")
    .eq("agency_id", owner.agency_id!)
    .order("site_order", { ascending: true })
    .order("created_at", { ascending: true });

  const list = (rows ?? []).map((r) => r.id as string);
  const i = list.indexOf(memberId);
  const j = i + direction;
  if (i === -1 || j < 0 || j >= list.length) return { ok: true };

  [list[i], list[j]] = [list[j], list[i]];
  for (let k = 0; k < list.length; k++) {
    await admin.from("profiles").update({ site_order: k }).eq("id", list[k]);
  }

  const { data } = await admin.from("site_config").select("slug").eq("agency_id", owner.agency_id!).maybeSingle();
  refresh((data?.slug as string) ?? "");
  return { ok: true };
}

/* ───────────────────────── wpisy ───────────────────────── */

export async function savePost(formData: FormData): Promise<SiteResult> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  if (title.length < 4) return { ok: false, error: "Tytuł jest za krótki." };

  const slug = slugify(String(formData.get("slug") ?? "").trim() || title);
  const row = {
    agency_id: user.agency_id,
    slug,
    title,
    lead: String(formData.get("lead") ?? "").trim().slice(0, 400) || null,
    body: String(formData.get("body") ?? "").trim().slice(0, 30000) || null,
    tag: String(formData.get("tag") ?? "").trim().slice(0, 40) || "Poradnik",
    author: String(formData.get("author") ?? "").trim().slice(0, 80) || user.full_name || null,
    read_min: Math.max(1, Math.min(60, parseInt(String(formData.get("read_min") ?? "4"), 10) || 4)),
    published: formData.get("published") === "1",
    published_at: String(formData.get("published_at") ?? "").trim() || new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  };

  const admin = createSupabaseAdmin();
  const { error } = id
    ? await admin.from("site_posts").update(row).eq("id", id).eq("agency_id", user.agency_id)
    : await admin.from("site_posts").insert(row);

  if (error) {
    if (error.message.includes("duplicate")) return { ok: false, error: "Wpis o tym adresie już istnieje." };
    return { ok: false, error: `Nie udało się zapisać: ${error.message}. Uruchom w Supabase SETUP-v25.` };
  }

  const { data } = await admin.from("site_config").select("slug").eq("agency_id", user.agency_id).maybeSingle();
  refresh((data?.slug as string) ?? "");
  return { ok: true };
}

export async function deletePost(id: string): Promise<SiteResult> {
  const owner = await requireOwner();
  const admin = createSupabaseAdmin();
  await admin.from("site_posts").delete().eq("id", id).eq("agency_id", owner.agency_id!);

  const { data } = await admin.from("site_config").select("slug").eq("agency_id", owner.agency_id!).maybeSingle();
  refresh((data?.slug as string) ?? "");
  return { ok: true };
}
