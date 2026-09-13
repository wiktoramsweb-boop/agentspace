import { createSupabaseAdmin } from "./supabase/admin";
import type { DocEntity, DocumentItem } from "./documents-shared";

/**
 * Dokumenty przy ofercie albo kliencie. `ready: false` = brak tabeli
 * (nieuruchomiona migracja v23) - karta pokazuje wtedy prośbę o jej uruchomienie.
 */
export async function getDocuments(
  agencyId: string | null,
  entity: DocEntity,
  entityId: string,
): Promise<{ ready: boolean; docs: DocumentItem[] }> {
  if (!agencyId) return { ready: false, docs: [] };
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("documents")
    .select("id, kind, name, size_bytes, mime, created_at, uploaded_by")
    .eq("agency_id", agencyId)
    .eq("entity_type", entity)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { ready: false, docs: [] };

  const ids = [...new Set((data ?? []).map((d) => d.uploaded_by).filter(Boolean))] as string[];
  const { data: people } = ids.length
    ? await admin.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] as { id: string; full_name: string | null }[] };
  const names = new Map((people ?? []).map((p) => [p.id, p.full_name]));

  return {
    ready: true,
    docs: (data ?? []).map((d) => ({
      id: d.id,
      kind: d.kind,
      name: d.name,
      size_bytes: d.size_bytes,
      mime: d.mime,
      created_at: d.created_at,
      uploaderName: d.uploaded_by ? names.get(d.uploaded_by) ?? null : null,
    })),
  };
}
