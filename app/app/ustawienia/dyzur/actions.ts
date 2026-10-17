"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { getDyzur, numerE164, zapiszDyzur } from "@/lib/dyzur";
import { zapiszZdarzenie } from "@/lib/dziennik";
import type { ActionResult } from "../company-actions";

export async function zapiszUstawieniaDyzuru(formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  if (!owner.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const t = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const numer = numerE164(t("numer", 20));
  const wlaczony = formData.get("wlaczony") === "1";
  if (wlaczony && !/^\+\d{9,15}$/.test(numer)) return { ok: false, error: "Podaj numer Twilio, np. +48 12 345 67 89." };
  const poprzedni = await getDyzur(owner.agency_id);
  const err = await zapiszDyzur(owner.agency_id, {
    wlaczony,
    numer,
    nazwa: t("nazwa", 80),
    powitanie: t("powitanie", 300) || poprzedni.powitanie,
    informacje: t("informacje", 800),
    opiekun_id: t("opiekun_id", 40) || null,
  });
  if (err) return { ok: false, error: err };
  if (poprzedni.wlaczony !== wlaczony) {
    await zapiszZdarzenie({ agencyId: owner.agency_id, actorId: owner.id, akcja: wlaczony ? "dyzur_wlaczony" : "dyzur_wylaczony", opis: `Dyżur AI ${wlaczony ? "włączony" : "wyłączony"} (${numer || "bez numeru"})` });
  }
  revalidatePath("/app/ustawienia/dyzur");
  return { ok: true };
}
