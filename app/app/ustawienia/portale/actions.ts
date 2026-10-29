"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { adresAutoryzacji, konfiguracjaOtodom, stanAutoryzacji, PORTAL } from "@/lib/otodom/klient";
import { zapiszZdarzenie } from "@/lib/dziennik";
import { odszyfruj, zaszyfruj } from "@/lib/szyfr";
import { testujFtp } from "@/lib/ftp/klient";
import { portalFtp, portalWPrzygotowaniu } from "@/lib/ftp/portale";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/html";
import { gosciaBlokujemy } from "@/lib/demo/straz";

/** Start połączenia: CEO loguje się na Otodom kontem biura i zgadza na dostęp. */
export async function polaczOtodom(): Promise<void> {
  const user = await requireOwner();
  if (!user.agency_id || !konfiguracjaOtodom().gotowe) redirect("/app/ustawienia/portale?otodom=brak-konfiguracji");
  redirect(adresAutoryzacji(stanAutoryzacji(user.agency_id!, user.id)));
}

export async function rozlaczOtodom(): Promise<void> {
  const user = await requireOwner();
  await createSupabaseAdmin()
    .from("portal_connections")
    .update({ revoked_at: new Date().toISOString(), access_token_enc: null, refresh_token_enc: null })
    .eq("agency_id", user.agency_id)
    .eq("portal", PORTAL);
  await zapiszZdarzenie({ agencyId: user.agency_id!, actorId: user.id, akcja: "portal_rozlaczony", opis: "Rozłączono konto Otodom", meta: { portal: "otodom" } });
  revalidatePath("/app/ustawienia/portale");
}

/** Konto testowe OLX: tytuły z [qatest-mercury] i opis testowy, zgodnie z zasadami OLX. */
export async function ustawTrybTestowy(formData: FormData): Promise<void> {
  const user = await requireOwner();
  await createSupabaseAdmin()
    .from("portal_connections")
    .update({ test_mode: formData.get("test") === "1" })
    .eq("agency_id", user.agency_id)
    .eq("portal", PORTAL);
  revalidatePath("/app/ustawienia/portale");
}

/* ───────────── portale przez FTP ───────────── */

function daneFormularza(formData: FormData) {
  const t = (k: string, max = 200) => String(formData.get(k) ?? "").trim().slice(0, max);
  const port = Number(t("port", 6)) || 21;
  return {
    portal: t("portal", 60),
    // Agent często wkleja adres z „ftp://” albo ukośnikiem na końcu.
    host: t("host").replace(/^s?ftps?:\/\//i, "").replace(/\/.*$/, ""),
    port: port > 0 && port < 65536 ? port : 21,
    login: t("login"),
    haslo: String(formData.get("haslo") ?? "").slice(0, 200),
    katalog: t("katalog") || "/",
    secure: formData.get("secure") === "1",
  };
}

const wroc = (stan: string, portal: string) => redirect(`/app/ustawienia/portale?ftp=${stan}&portal=${encodeURIComponent(portal)}#ftp-${portal}`);

export async function zapiszFtp(formData: FormData): Promise<void> {
  const user = await requireOwner();
  const d = daneFormularza(formData);
  if (!portalFtp(d.portal)) wroc("nieznany", d.portal);
  if (!d.host || !d.login) wroc("brak-danych", d.portal);
  const admin = createSupabaseAdmin();
  const { data: obecne } = await admin.from("portal_ftp").select("id").eq("agency_id", user.agency_id).eq("portal", d.portal).maybeSingle();
  // Puste hasło przy edycji = zostaw stare. Przy pierwszym zapisie hasło jest wymagane.
  if (!d.haslo && !obecne) wroc("brak-hasla", d.portal);
  const { error } = await admin.from("portal_ftp").upsert(
    {
      agency_id: user.agency_id,
      portal: d.portal,
      host: d.host,
      port: d.port,
      login: d.login,
      katalog: d.katalog,
      secure: d.secure,
      ...(d.haslo ? { haslo_enc: zaszyfruj(d.haslo) } : {}),
      created_by: user.id,
      updated_at: new Date().toISOString(),
      ostatni_test_ok: null,
      ostatni_blad: null,
    },
    { onConflict: "agency_id,portal" },
  );
  if (error) wroc(/portal_ftp/.test(error.message) ? "brak-tabeli" : "blad", d.portal);
  await zapiszZdarzenie({ agencyId: user.agency_id!, actorId: user.id, akcja: "portal_ftp_zapisany", opis: `Zapisano dane FTP: ${portalFtp(d.portal)!.nazwa}`, meta: { portal: d.portal, host: d.host } });
  await sprawdzFtp(user.agency_id!, d.portal);
  wroc("zapisano", d.portal);
}

async function sprawdzFtp(agencyId: string, portal: string) {
  const admin = createSupabaseAdmin();
  const { data: w } = await admin.from("portal_ftp").select("host, port, login, haslo_enc, katalog, secure").eq("agency_id", agencyId).eq("portal", portal).maybeSingle();
  if (!w) return;
  const wynik = await testujFtp({ host: w.host, port: w.port, login: w.login, haslo: odszyfruj(w.haslo_enc), katalog: w.katalog, secure: w.secure });
  await admin
    .from("portal_ftp")
    .update({ ostatni_test_at: new Date().toISOString(), ostatni_test_ok: wynik.ok, ostatni_blad: wynik.ok ? null : wynik.blad })
    .eq("agency_id", agencyId)
    .eq("portal", portal);
}

export async function testujFtpAkcja(formData: FormData): Promise<void> {
  const user = await requireOwner();
  const portal = String(formData.get("portal") ?? "");
  await sprawdzFtp(user.agency_id!, portal);
  wroc("sprawdzono", portal);
}

export async function usunFtp(formData: FormData): Promise<void> {
  const user = await requireOwner();
  const portal = String(formData.get("portal") ?? "");
  await createSupabaseAdmin().from("portal_ftp").delete().eq("agency_id", user.agency_id).eq("portal", portal);
  await zapiszZdarzenie({ agencyId: user.agency_id!, actorId: user.id, akcja: "portal_ftp_usuniety", opis: `Usunięto dane FTP: ${portalFtp(portal)?.nazwa ?? portal}`, meta: { portal } });
  wroc("usunieto", portal);
}

export async function wyslijFtpTeraz(formData: FormData): Promise<void> {
  const user = await requireOwner();
  const portal = String(formData.get("portal") ?? "");
  const { wyslijNaPortalFtp } = await import("@/lib/ftp/eksport");
  const r = await wyslijNaPortalFtp(user.agency_id!, portal, user.id);
  wroc(r.ok ? "wyslano" : /już trwa/.test(r.blad) ? "trwa" : "blad-wysylki", portal);
}

/* ───────────── portale w przygotowaniu ───────────── */

/**
 * Biuro chce wystawiać na portalu, którego integracji jeszcze nie ma.
 * Zapisujemy zgłoszenie i dajemy znać zespołowi AgentSpace mailem.
 */
export async function zglosPortal(formData: FormData): Promise<void> {
  const user = await requireOwner();
  const portal = String(formData.get("portal") ?? "");
  const p = portalWPrzygotowaniu(portal);
  if (!p) redirect("/app/ustawienia/portale");
  const { error } = await createSupabaseAdmin()
    .from("portal_requests")
    .upsert({ agency_id: user.agency_id, portal, created_by: user.id }, { onConflict: "agency_id,portal", ignoreDuplicates: true });
  if (error) redirect(`/app/ustawienia/portale?ftp=${/portal_requests/.test(error.message) ? "brak-tabeli-zgloszen" : "blad"}#kolejne`);
  await zapiszZdarzenie({ agencyId: user.agency_id!, actorId: user.id, akcja: "portal_zgloszony", opis: `Zgłoszono chęć wystawiania na ${p!.nazwa}`, meta: { portal } });
  const key = process.env.RESEND_API_KEY;
  if (key && !(await gosciaBlokujemy())) {
    await new Resend(key).emails
      .send({
        from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
        to: process.env.NOTIFICATION_EMAIL ?? "nieruchomoscispectra@gmail.com",
        replyTo: user.email ?? undefined,
        subject: `Portal: ${user.agency?.name ?? "biuro"} chce wystawiać na ${p!.nazwa}`,
        html: `<p><b>${escapeHtml(user.agency?.name ?? "")}</b> (${escapeHtml(user.full_name ?? "")}, ${escapeHtml(user.email ?? "")}) chce wystawiać oferty na ${escapeHtml(p!.nazwa)}.</p>`,
      })
      .catch(() => null);
  }
  redirect(`/app/ustawienia/portale?ftp=zgloszono#kolejne`);
}
