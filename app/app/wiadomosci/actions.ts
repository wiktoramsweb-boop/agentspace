"use server";

import { requireUser } from "@/lib/auth";
import { licznikWiadomosciKlientow } from "@/lib/wiadomosci-klientow";

/** Plakietka w menu: ile wiadomości od klientów czeka na przeczytanie. */
export async function licznikKlientow(): Promise<number> {
  const user = await requireUser();
  return licznikWiadomosciKlientow(user).catch(() => 0);
}
