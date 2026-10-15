"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakTabeli, komunikatMigracji } from "@/lib/migracja";
import { powiadom } from "@/lib/powiadomienia";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { formatDatePL } from "@/lib/datetime";
import { RODZAJE_NIEOBECNOSCI } from "@/lib/zastepstwa-model";

type Wynik = { ok: true } | { ok: false; error: string };

const ZARZADZA = ["owner", "director", "manager"];
const DATA = /^\d{4}-\d{2}-\d{2}$/;

export async function dodajNieobecnosc(input: {
  agentId: string;
  rodzaj: string;
  od: string;
  do: string;
  zastepcaId: string | null;
  notatka: string;
}): Promise<Wynik> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  // Każdy zgłasza swój urlop. Za kogoś innego tylko CEO, dyrektor i menedżer.
  if (input.agentId !== user.id && !ZARZADZA.includes(user.role)) {
    return { ok: false, error: "Nieobecność innej osoby zgłasza CEO albo menedżer." };
  }
  if (!DATA.test(input.od) || !DATA.test(input.do)) return { ok: false, error: "Podaj daty od i do." };
  if (input.do < input.od) return { ok: false, error: "Data końca jest wcześniejsza niż początku." };
  if (input.zastepcaId && input.zastepcaId === input.agentId) {
    return { ok: false, error: "Zastępcą nie może być ta sama osoba." };
  }
  const rodzaj = RODZAJE_NIEOBECNOSCI.some((r) => r.value === input.rodzaj) ? input.rodzaj : "urlop";

  const admin = createSupabaseAdmin();
  // Obie osoby muszą być z tego samego biura.
  const ids = [input.agentId, input.zastepcaId].filter(Boolean) as string[];
  const { data: osoby } = await admin.from("profiles").select("id, full_name").eq("agency_id", user.agency_id).in("id", ids);
  if ((osoby ?? []).length !== ids.length) return { ok: false, error: "Nie znaleziono osoby w biurze." };
  const imie = (id: string) => osoby?.find((o) => o.id === id)?.full_name ?? "Osoba";

  const { error } = await admin.from("agent_absences").insert({
    agency_id: user.agency_id,
    agent_id: input.agentId,
    substitute_id: input.zastepcaId || null,
    kind: rodzaj,
    starts_on: input.od,
    ends_on: input.do,
    note: input.notatka.trim().slice(0, 300) || null,
    created_by: user.id,
  });
  if (error) return { ok: false, error: brakTabeli(error) ? komunikatMigracji() : error.message };

  const zakres = input.od === input.do ? formatDatePL(input.od) : `${formatDatePL(input.od)} – ${formatDatePL(input.do)}`;
  const etykieta = RODZAJE_NIEOBECNOSCI.find((r) => r.value === rodzaj)?.label.toLowerCase() ?? "nieobecność";
  if (input.zastepcaId) {
    await powiadom(user.agency_id, [input.zastepcaId], {
      rodzaj: "zastepstwo",
      tytul: `Zastępujesz: ${imie(input.agentId)}`,
      tresc: `${zakres}, ${etykieta}. W tym czasie zadania z automatyzacji i powiadomienia w sprawach klientów tej osoby trafiają do Ciebie i widzisz ich kontakty.`,
      adres: "/app/urlopy",
    });
  }
  await zapiszZdarzenie({
    agencyId: user.agency_id,
    actorId: user.id,
    akcja: "nieobecnosc",
    rodzaj: "osoba",
    id: input.agentId,
    opis: `${imie(input.agentId)}: ${etykieta} ${zakres}${input.zastepcaId ? `, zastępuje ${imie(input.zastepcaId)}` : ""}`,
  });
  revalidatePath("/app/urlopy");
  revalidatePath("/app");
  return { ok: true };
}

export async function usunNieobecnosc(id: string): Promise<Wynik> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Konto nie jest przypisane do biura." };
  const admin = createSupabaseAdmin();
  const { data: n } = await admin
    .from("agent_absences")
    .select("agent_id, created_by")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!n) return { ok: false, error: "Nie ma takiej nieobecności." };
  if (n.agent_id !== user.id && n.created_by !== user.id && !ZARZADZA.includes(user.role)) {
    return { ok: false, error: "Cudzą nieobecność usuwa CEO albo menedżer." };
  }
  const { error } = await admin.from("agent_absences").delete().eq("id", id).eq("agency_id", user.agency_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/urlopy");
  revalidatePath("/app");
  return { ok: true };
}
