"use server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Zliczanie odsłon strony biura.
 *
 * Nie zapisujemy adresów IP ani nie stawiamy ciasteczek: w bazie ląduje tylko
 * licznik odsłon danej podstrony w danym dniu. Dzięki temu statystyki działają
 * także wtedy, gdy odwiedzający odrzuci zgodę na cookies.
 */
export async function trackView(agencyId: string, path: string, kind: string, ref?: string): Promise<void> {
  if (!agencyId || !path) return;
  const admin = createSupabaseAdmin();
  await admin.rpc("bump_site_view", {
    p_agency: agencyId,
    p_path: path.slice(0, 200),
    p_kind: kind.slice(0, 30),
    p_ref: ref ? ref.slice(0, 200) : null,
  });
}
