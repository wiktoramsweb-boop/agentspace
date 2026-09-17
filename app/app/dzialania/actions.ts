"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { warsawToIso } from "@/lib/datetime";
import { applyActivityToGoals } from "@/lib/goal-sync";

function txt(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v || null;
}

/**
 * Łączy datę i godzinę z formularza w znacznik czasu.
 * Wartości z formularza to czas polski - serwer działa w UTC, więc bez jawnej
 * strefy godzina zapisywałaby się przesunięta o 1-2 h.
 */
function whenFrom(fd: FormData, dateKey: string, timeKey: string): string | null {
  return warsawToIso(String(fd.get(dateKey) ?? ""), String(fd.get(timeKey) ?? ""));
}

/** Wynik zapisu. Modal zamyka się tylko przy ok, inaczej pokazuje powód. */
export type SaveResult = { ok: true } | { ok: false; error: string };

export async function createActivity(formData: FormData): Promise<SaveResult> {
  const user = await requireUser();
  const subject = String(formData.get("subject") ?? "").trim();
  if (!subject) return { ok: false, error: "Podaj temat działania." };

  // Przypisani agenci: gdy nikogo nie wskazano, działanie jest moje.
  const assignees = formData.getAll("assignee_ids").map(String).filter(Boolean);
  const status = txt(formData, "status") ?? "wykonane";
  const clientId = txt(formData, "client_id");

  const admin = createSupabaseAdmin();

  // Numer zapisujemy ZAWSZE - to on pozwala potem sprawdzić, czy ktoś już
  // dzwonił. Gdy agent wybrał klienta, a numeru nie wpisał, bierzemy z bazy.
  let contactPhone = txt(formData, "contact_phone");
  let contactName = txt(formData, "contact_name");
  if (clientId && (!contactPhone || !contactName)) {
    const { data: c } = await admin
      .from("clients")
      .select("name, phone")
      .eq("id", clientId)
      .maybeSingle();
    if (c) {
      contactPhone = contactPhone ?? c.phone ?? null;
      contactName = contactName ?? c.name ?? null;
    }
  }

  // Jeśli agent wpisał numer, a nie wskazał klienta z bazy: szukamy po numerze,
  // a gdy takiego nie ma - zakładamy klienta. Dzięki temu baza buduje się sama
  // przy zwykłym zapisywaniu telefonów, zamiast wymagać osobnego kroku.
  let linkedClientId = clientId;
  const wantsClient = formData.get("create_client") === "1";
  const digits = (contactPhone ?? "").replace(/\D/g, "");

  if (!linkedClientId && digits.length >= 6) {
    const existing = await findClientByPhone(admin, user.agency_id, digits, contactPhone!);
    if (existing) {
      linkedClientId = existing;
    } else if (wantsClient) {
      const { data: created } = await admin
        .from("clients")
        .insert({
          agent_id: user.id,
          agency_id: user.agency_id,
          name: contactName || contactPhone || "Kontakt bez nazwy",
          phone: contactPhone,
          email: txt(formData, "contact_email"),
          type: "inny",
          status: "nowy",
          last_contact_at: status === "wykonane" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();
      if (created) linkedClientId = created.id;
    }
  }

  const assigneeIds = assignees.length ? assignees : [user.id];
  const completedAt = status === "wykonane" ? new Date().toISOString() : null;

  // Wątek: kolejna rozmowa pod tym samym numerem dopisuje się do istniejącego
  // działania zamiast tworzyć drugi taki sam wpis. Zawsze celujemy w korzeń
  // wątku, żeby nie robić drzewa na trzy poziomy.
  let parentId: string | null = null;
  let inherited: { client_id: string | null; property_id: string | null; contact_name: string | null; contact_phone: string | null; contact_email: string | null } | null = null;
  const parentRaw = txt(formData, "parent_id");
  if (parentRaw) {
    const { data: parent } = await admin
      .from("activities")
      .select("id, parent_id, client_id, property_id, contact_name, contact_phone, contact_email")
      .eq("id", parentRaw)
      .eq("agency_id", user.agency_id)
      .maybeSingle();
    if (parent) {
      parentId = parent.parent_id ?? parent.id;
      inherited = parent;
    }
  }

  if (inherited) {
    contactPhone = contactPhone ?? inherited.contact_phone;
    contactName = contactName ?? inherited.contact_name;
    if (!linkedClientId) linkedClientId = inherited.client_id;
  }

  const { error: insertError } = await admin.from("activities").insert({
    agency_id: user.agency_id,
    created_by: user.id,
    kind: txt(formData, "kind") ?? "polaczenie",
    purpose: txt(formData, "purpose"),
    subject,
    description: txt(formData, "description"),
    status,
    priority: txt(formData, "priority") ?? "normalny",
    call_direction: txt(formData, "call_direction"),
    due_at: whenFrom(formData, "due_date", "due_time"),
    completed_at: completedAt,
    client_id: linkedClientId,
    contact_name: contactName,
    contact_phone: contactPhone,
    contact_email: txt(formData, "contact_email"),
    property_id: txt(formData, "property_id") ?? inherited?.property_id ?? null,
    assignee_ids: assigneeIds,
    ...(parentId ? { parent_id: parentId } : {}),
    include_in_report: formData.get("include_in_report") === "1",
  });

  // Bez tego nieudany zapis wyglądał jak udany: modal się zamykał, a działania
  // nie było. Agent musi zobaczyć powód i mieć wpisane dane nadal w formularzu.
  if (insertError) {
    return {
      ok: false,
      error: `Nie udało się zapisać działania: ${insertError.message}`,
    };
  }

  // Wykonany telefon albo spotkanie od razu podbija licznik w Celach,
  // żeby agent nie odhaczał tego samego drugi raz.
  await applyActivityToGoals(
    admin,
    {
      kind: txt(formData, "kind") ?? "polaczenie",
      purpose: txt(formData, "purpose"),
      status,
      completed_at: completedAt,
      assignee_ids: assigneeIds,
      created_by: user.id,
      agency_id: user.agency_id,
    },
    1,
  );

  // Wykonane działanie = był kontakt. Aktualizujemy datę u klienta, żeby
  // przypomnienia „dawno nie dzwoniłeś" liczyły się od realnej rozmowy.
  if (linkedClientId && status === "wykonane") {
    await admin
      .from("clients")
      .update({ last_contact_at: new Date().toISOString() })
      .eq("id", linkedClientId)
      .eq("agency_id", user.agency_id);
  }

  revalidatePath("/app/dzialania");

  revalidatePath("/app/kalendarz");
  revalidatePath("/app/klienci");
  revalidatePath("/app/cele");
  revalidatePath("/app");
  return { ok: true };
}

/**
 * Szuka klienta po numerze telefonu. Najpierw po kolumnie ze samymi cyframi
 * (v19), a gdy migracji jeszcze nie ma - po surowym numerze.
 */
async function findClientByPhone(
  admin: ReturnType<typeof createSupabaseAdmin>,
  agencyId: string | null,
  digits: string,
  raw: string,
): Promise<string | null> {
  const byDigits = await admin
    .from("clients")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("phone_digits", digits)
    .limit(1)
    .maybeSingle();
  if (!byDigits.error && byDigits.data) return byDigits.data.id;

  if (byDigits.error) {
    const byRaw = await admin
      .from("clients")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("phone", raw)
      .limit(1)
      .maybeSingle();
    if (byRaw.data) return byRaw.data.id;
  }
  return null;
}

/** Pola potrzebne do przeliczenia celów. */
const GOAL_FIELDS = "kind, purpose, status, completed_at, assignee_ids, created_by, agency_id";

/** Szybka zmiana statusu z listy (odhaczenie „wykonane"). */
export async function setActivityStatus(id: string, status: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();

  // Stan sprzed zmiany, żeby cofnąć wcześniejsze zaliczenie do celów.
  const { data: before } = await admin
    .from("activities")
    .select(GOAL_FIELDS)
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!before) return;

  const completedAt = status === "wykonane" ? new Date().toISOString() : null;
  await admin
    .from("activities")
    .update({ status, completed_at: completedAt })
    .eq("id", id)
    .eq("agency_id", user.agency_id);

  await applyActivityToGoals(admin, before, -1);
  await applyActivityToGoals(admin, { ...before, status, completed_at: completedAt }, 1);

  revalidatePath("/app/dzialania");

  revalidatePath("/app/kalendarz");
  revalidatePath("/app/cele");
  revalidatePath("/app");
}

export async function deleteActivity(id: string): Promise<void> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();

  const { data: before } = await admin
    .from("activities")
    .select(GOAL_FIELDS)
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .maybeSingle();

  await admin.from("activities").delete().eq("id", id).eq("agency_id", user.agency_id);
  if (before) await applyActivityToGoals(admin, before, -1);

  revalidatePath("/app/dzialania");

  revalidatePath("/app/kalendarz");
  revalidatePath("/app/cele");
  revalidatePath("/app");
}

/** Usunięcie z poziomu karty działania - wraca na listę. */
export async function deleteActivityAndBack(id: string): Promise<void> {
  await deleteActivity(id);
  redirect("/app/dzialania");
}

/** Zmiana statusu z poziomu karty (bez opuszczania widoku). */
export async function toggleActivityDone(id: string, done: boolean): Promise<void> {
  await setActivityStatus(id, done ? "wykonane" : "zaplanowane");
  revalidatePath(`/app/dzialania/${id}`);
}

/**
 * Nowy termin działania po przeciągnięciu w kalendarzu. Data i godzina w czasie
 * polskim; odrzucamy wszystko, co nie wygląda na datę, zamiast zgadywać.
 */
export async function rescheduleActivity(
  id: string,
  dateKey: string,
  time: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}$/.test(time)) {
    return { ok: false, error: "Nieprawidłowy termin." };
  }
  const dueAt = warsawToIso(dateKey, time);
  if (!dueAt) return { ok: false, error: "Nieprawidłowy termin." };

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("activities")
    .update({ due_at: dueAt, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agency_id", user.agency_id);
  if (error) return { ok: false, error: `Nie udało się przesunąć: ${error.message}` };

  revalidatePath("/app/kalendarz");
  revalidatePath("/app/dzialania");
  revalidatePath("/app");
  return { ok: true };
}

export type PhoneThread = {
  id: string;
  subject: string;
  count: number;
  lastAt: string | null;
  clientId: string | null;
  clientName: string | null;
  contactName: string | null;
};

/**
 * Czy pod tym numerem jest już wątek działań. Dzięki temu agent, który dzwoni
 * po raz drugi, dopisuje rozmowę do istniejącego wpisu zamiast tworzyć drugi
 * taki sam kontakt i drugie takie samo działanie.
 */
export async function findThreadByPhone(phone: string): Promise<PhoneThread | null> {
  const user = await requireUser();
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!user.agency_id || digits.length < 7) return null;

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("activities")
    .select("id, subject, due_at, client_id, contact_name, parent_id")
    .eq("agency_id", user.agency_id)
    .eq("contact_phone_digits", digits)
    .order("due_at", { ascending: false })
    .limit(20);
  if (!data?.length) return null;

  // Korzeń wątku: pierwsze działanie bez rodzica, a gdy takiego brak, najstarsze.
  const rows = data as { id: string; subject: string; due_at: string | null; client_id: string | null; contact_name: string | null; parent_id: string | null }[];
  const rootId = rows.find((r) => !r.parent_id)?.id ?? rows[rows.length - 1].parent_id ?? rows[rows.length - 1].id;
  const root = rows.find((r) => r.id === rootId) ?? rows[0];

  const { count } = await admin
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", user.agency_id)
    .or(`id.eq.${rootId},parent_id.eq.${rootId}`);

  let clientName: string | null = null;
  if (root.client_id) {
    const { data: c } = await admin.from("clients").select("name").eq("id", root.client_id).maybeSingle();
    clientName = c?.name ?? null;
  }

  return {
    id: rootId,
    subject: root.subject,
    count: count ?? rows.length,
    lastAt: rows[0]?.due_at ?? null,
    clientId: root.client_id,
    clientName,
    contactName: root.contact_name,
  };
}

/** Rozmowy dopisane do wątku, od najnowszej. */
export async function getThreadItems(rootId: string) {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("activities")
    .select("id, subject, kind, status, due_at, description, duration_s, call_direction, assignee_ids, created_by")
    .eq("agency_id", user.agency_id)
    .eq("parent_id", rootId)
    .order("due_at", { ascending: false })
    .limit(200);
  return data ?? [];
}
