"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { nowyToken } from "@/lib/kalendarz-subskrypcja";

/** Pierwsze podłączenie albo wymiana adresu. Nowy adres unieważnia stary. */
export async function polaczKalendarz(): Promise<{ ok: boolean; blad?: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, blad: "Konto nie jest przypisane do biura." };
  if (user.agency?.is_demo) return { ok: false, blad: "W wersji demo podłączanie kalendarza jest wyłączone." };
  const token = await nowyToken(user.id, user.agency_id);
  if (!token) return { ok: false, blad: "Kalendarz ruszy po uruchomieniu migracji lib/SETUP-v59-kredyty-cele.sql." };
  await zapiszZdarzenie({ agencyId: user.agency_id, actorId: user.id, akcja: "kalendarz_adres", rodzaj: "ustawienia", opis: "Nowy prywatny adres kalendarza" });
  revalidatePath("/app/kalendarz");
  revalidatePath("/app/ustawienia/integracje");
  return { ok: true };
}
