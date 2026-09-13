"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { DOC_BUCKET } from "@/lib/storage";
import { removeFiles, signUploads, signedDownloadUrl, type SignedUpload } from "@/lib/storage-server";
import { docKinds, type DocEntity, type DocumentItem } from "@/lib/documents-shared";

const MAX_FILES = 20;
const MAX_BYTES = 25 * 1024 * 1024;

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Czy oferta albo klient należy do biura pytającego. */
async function ownsEntity(agencyId: string, entity: DocEntity, id: string): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from(entity === "property" ? "properties" : "clients")
    .select("id")
    .eq("id", id)
    .eq("agency_id", agencyId)
    .maybeSingle();
  return !!data;
}

function pathFor(entity: DocEntity, entityId: string, agencyId: string) {
  return `${agencyId}/${entity}/${entityId}`;
}

function revalidateEntity(entity: DocEntity, id: string) {
  revalidatePath(entity === "property" ? `/app/nieruchomosci/${id}` : `/app/klienci/${id}`);
}

/** Podpisane linki do wgrania dokumentów. Pliki lądują w folderze biura i konkretnej oferty/klienta. */
export async function signDocumentUploads(
  entity: DocEntity,
  entityId: string,
  files: { name: string; size: number }[],
): Promise<Result<{ uploads: SignedUpload[] }>> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (!(await ownsEntity(user.agency_id, entity, entityId))) return { ok: false, error: "Nie znaleziono." };
  if (files.length === 0) return { ok: false, error: "Nie wybrano plików." };
  if (files.length > MAX_FILES) return { ok: false, error: `Naraz można dodać do ${MAX_FILES} plików.` };
  const tooBig = files.find((f) => f.size > MAX_BYTES);
  if (tooBig) return { ok: false, error: `Plik ${tooBig.name} ma więcej niż 25 MB.` };

  const res = await signUploads(
    DOC_BUCKET,
    pathFor(entity, entityId, user.agency_id),
    files.map((f) => ({ ext: (f.name.split(".").pop() ?? "").toLowerCase() })),
  );
  if (res.error) return { ok: false, error: res.error };
  return { ok: true, uploads: res.uploads };
}

/** Po wgraniu: zapis wpisów w bazie. Ścieżki spoza folderu tej oferty/klienta odrzucamy. */
export async function registerDocuments(
  entity: DocEntity,
  entityId: string,
  items: { path: string; name: string; size: number; mime: string; kind: string }[],
): Promise<Result<{ docs: DocumentItem[] }>> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  if (!(await ownsEntity(user.agency_id, entity, entityId))) return { ok: false, error: "Nie znaleziono." };

  const prefix = `${pathFor(entity, entityId, user.agency_id)}/`;
  const kinds = new Set(docKinds(entity).map((k) => k.value));
  const rows = items
    .filter((i) => typeof i.path === "string" && i.path.startsWith(prefix))
    .map((i) => ({
      agency_id: user.agency_id,
      entity_type: entity,
      entity_id: entityId,
      kind: kinds.has(i.kind) ? i.kind : "inne",
      name: String(i.name).slice(0, 200) || "dokument",
      path: i.path,
      size_bytes: Number.isFinite(i.size) ? Math.round(i.size) : null,
      mime: String(i.mime ?? "").slice(0, 120) || null,
      uploaded_by: user.id,
    }));
  if (rows.length === 0) return { ok: false, error: "Brak plików do zapisania." };

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("documents")
    .insert(rows)
    .select("id, kind, name, size_bytes, mime, created_at");
  if (error) {
    // Zapis w bazie się nie udał, więc wgrane pliki są osierocone - sprzątamy.
    await removeFiles(DOC_BUCKET, rows.map((r) => r.path));
    return {
      ok: false,
      error: /documents/.test(error.message)
        ? "Brak tabeli dokumentów. Uruchom w Supabase plik lib/SETUP-v23-dokumenty-korespondencja.sql."
        : `Nie udało się zapisać: ${error.message}`,
    };
  }

  // Wgrane świadectwo energetyczne od razu oznacza ofertę jako posiadającą je.
  if (entity === "property" && rows.some((r) => r.kind === "swiadectwo")) {
    await admin
      .from("properties")
      .update({ energy_cert_status: "posiada" })
      .eq("id", entityId)
      .eq("agency_id", user.agency_id)
      .is("energy_cert_status", null);
  }

  revalidateEntity(entity, entityId);
  return {
    ok: true,
    docs: (data ?? []).map((d) => ({ ...d, uploaderName: user.full_name ?? null })),
  };
}

async function loadOwnDoc(id: string) {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("documents")
    .select("id, path, name, entity_type, entity_id")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  return { user, admin, doc: data };
}

export async function updateDocumentKind(id: string, kind: string): Promise<Result> {
  const { user, admin, doc } = await loadOwnDoc(id);
  if (!doc) return { ok: false, error: "Nie znaleziono dokumentu." };
  const entity = doc.entity_type as DocEntity;
  if (!docKinds(entity).some((k) => k.value === kind)) return { ok: false, error: "Nieznany rodzaj." };
  await admin.from("documents").update({ kind }).eq("id", id).eq("agency_id", user.agency_id);
  revalidateEntity(entity, doc.entity_id);
  return { ok: true };
}

export async function deleteDocument(id: string): Promise<Result> {
  const { user, admin, doc } = await loadOwnDoc(id);
  if (!doc) return { ok: false, error: "Nie znaleziono dokumentu." };
  const { error } = await admin.from("documents").delete().eq("id", id).eq("agency_id", user.agency_id);
  if (error) return { ok: false, error: `Nie udało się usunąć: ${error.message}` };
  await removeFiles(DOC_BUCKET, [doc.path]);
  revalidateEntity(doc.entity_type as DocEntity, doc.entity_id);
  return { ok: true };
}

/** Link ważny 2 minuty, wydawany dopiero po sprawdzeniu, że dokument jest z tego biura. */
export async function getDocumentUrl(id: string, inline = false): Promise<Result<{ url: string }>> {
  const { doc } = await loadOwnDoc(id);
  if (!doc) return { ok: false, error: "Nie znaleziono dokumentu." };
  const url = await signedDownloadUrl(DOC_BUCKET, doc.path, inline ? undefined : doc.name);
  if (!url) return { ok: false, error: "Nie udało się przygotować pobierania." };
  return { ok: true, url };
}
