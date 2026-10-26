"use server";

import { requireUser } from "@/lib/auth";
import { dostepyWidoczne } from "@/lib/wiadomosci-klientow";
import { kodQrSvg } from "@/lib/qr";
import { APP_URL } from "@/lib/supabase/config";

/** Kod QR do pokazania klientowi na telefonie agenta. Tylko dla dostępu, który agent widzi. */
export async function qrPortalu(accessId: string): Promise<{ svg: string; link: string } | null> {
  const user = await requireUser();
  const d = (await dostepyWidoczne(user)).find((x) => x.id === accessId && !x.revoked_at);
  if (!d) return null;
  const link = `${APP_URL}/klient/${d.token}`;
  return { svg: await kodQrSvg(link), link };
}
