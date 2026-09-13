import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getAgencySettings } from "@/lib/agency-settings";
import { PageHeader } from "../components/ui";
import { MailGenerator } from "./mail-generator";
import type { ClientContact } from "../components/save-to-client";

/** Klienci biura z e-mailem i telefonem - do wyboru adresata gotowej wiadomości. */
async function contactsFor(agencyId: string | null, userId: string, mask: boolean): Promise<ClientContact[]> {
  if (!agencyId) return [];
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("clients")
    .select("id, name, email, phone, agent_id")
    .eq("agency_id", agencyId)
    .order("name", { ascending: true })
    .limit(1000);
  return (data ?? []).map((c) => {
    // Przy ukrywaniu kontaktów agent nie dostaje adresów cudzych klientów.
    const hidden = mask && c.agent_id !== userId;
    return { id: c.id, name: c.name, email: hidden ? null : c.email, phone: hidden ? null : c.phone };
  });
}

export default async function MailePage() {
  const user = await requireUser();
  const settings = await getAgencySettings(user.agency_id, user.agency?.name);
  const clients = await contactsFor(
    user.agency_id,
    user.id,
    settings.options.hide_contacts && user.role === "agent",
  );
  return (
    <>
      <PageHeader
        title="Asystent wiadomości"
        subtitle="Maile i SMS-y do klientów. Wybierz temat, wpisz fakty, a AI napisze w tonie biura. Wyślij i zapisz przy kliencie."
      />
      <MailGenerator defaultSignature={user.full_name ?? ""} clients={clients} />
    </>
  );
}
