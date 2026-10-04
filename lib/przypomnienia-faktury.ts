import { createSupabaseAdmin } from "./supabase/admin";
import { escapeHtml } from "./html";
import { zapiszBlad } from "./blad";
import { todayPL } from "./datetime";
import { APP_URL } from "./supabase/config";
import {
  dniPoTerminie,
  formatMoney,
  opisRodzaju,
  pozostaloDoZaplaty,
  statusPlatnosci,
} from "./invoice";

/**
 * Przypomnienie o fakturach po terminie.
 *
 * Jedna wiadomość na biuro ze zbiorczą listą, a nie osobny mail na każdą
 * fakturę: przy pięciu zaległościach pięć maili dziennie zostałoby wyciszone
 * po tygodniu i cała funkcja przestałaby działać.
 *
 * Wysyłamy wyłącznie wtedy, gdy jest co przypominać. Mail „nic nie zalega”
 * uczy ludzi ignorować nadawcę.
 *
 * Proformy pomijamy - to nie są faktury i nie ma z nich należności.
 */

type FakturaDoPrzypomnienia = {
  number: string;
  doc_type: string | null;
  buyer_name: string | null;
  payment_date: string | null;
  total_pln: number;
  paid_pln: number | null;
};

function wiersz(f: FakturaDoPrzypomnienia, dzis: string): string {
  const dni = dniPoTerminie(f.payment_date, dzis);
  const zostalo = pozostaloDoZaplaty({ total_pln: f.total_pln, paid_pln: f.paid_pln });
  return `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;">
        ${escapeHtml(opisRodzaju(f.doc_type as never).nazwa)} ${escapeHtml(f.number)}
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;">${escapeHtml(f.buyer_name ?? "-")}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;white-space:nowrap;">
        ${escapeHtml(f.payment_date ?? "-")}
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;white-space:nowrap;color:#b91c1c;">
        ${dni} dni
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4e4e7;text-align:right;white-space:nowrap;font-weight:600;">
        ${formatMoney(zostalo)} zł
      </td>
    </tr>`;
}

/**
 * Wysyła przypomnienia dla wszystkich biur. Zwraca liczbę wysłanych maili.
 * Błąd jednego biura nie przerywa pozostałych.
 */
export async function przypomnijOZaleglychFakturach(): Promise<number> {
  const klucz = process.env.RESEND_API_KEY;
  if (!klucz) return 0;

  const admin = createSupabaseAdmin();
  const dzis = todayPL();

  // Bierzemy tylko dokumenty z terminem już minionym. Resztę odsiewamy
  // w kodzie, bo „ile zapłacono” wymaga porównania dwóch kolumn.
  const { data, error } = await admin
    .from("invoices")
    .select("agency_id, number, doc_type, buyer_name, payment_date, total_pln, paid_pln")
    .lt("payment_date", dzis)
    .order("payment_date", { ascending: true });

  if (error) {
    await zapiszBlad("cron/przypomnienia-faktury", error.message);
    return 0;
  }

  const wgBiura = new Map<string, FakturaDoPrzypomnienia[]>();
  for (const f of data ?? []) {
    if ((f.doc_type ?? "faktura") === "proforma") continue;
    const status = statusPlatnosci(
      { total_pln: f.total_pln as number, paid_pln: f.paid_pln as number, payment_date: f.payment_date as string },
      dzis,
    );
    if (status !== "po_terminie") continue;
    const id = f.agency_id as string;
    if (!id) continue;
    if (!wgBiura.has(id)) wgBiura.set(id, []);
    wgBiura.get(id)!.push(f as FakturaDoPrzypomnienia);
  }

  if (wgBiura.size === 0) return 0;

  const { Resend } = await import("resend");
  const resend = new Resend(klucz);
  let wyslane = 0;

  for (const [agencyId, faktury] of wgBiura) {
    try {
      // Adresat: właściciel biura. To on pilnuje należności, a nie agent,
      // który wystawił dokument.
      const { data: owner } = await admin
        .from("profiles")
        .select("email, full_name")
        .eq("agency_id", agencyId)
        .eq("role", "owner")
        .limit(1)
        .maybeSingle();
      if (!owner?.email) continue;

      const { data: biuro } = await admin
        .from("agencies")
        .select("name")
        .eq("id", agencyId)
        .maybeSingle();

      const suma = faktury.reduce(
        (a, f) => a + pozostaloDoZaplaty({ total_pln: f.total_pln, paid_pln: f.paid_pln }),
        0,
      );

      const { error: bladWysylki } = await resend.emails.send({
        from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
        to: owner.email as string,
        subject: `${faktury.length} ${faktury.length === 1 ? "faktura" : "faktur"} po terminie - ${formatMoney(suma)} zł`,
        html: `
          <div style="font-family:-apple-system,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#18181b;">
            <h2 style="color:#b91c1c;margin:0 0 6px;">Faktury po terminie</h2>
            <p style="margin:0 0 20px;color:#52525b;">
              ${escapeHtml(biuro?.name ?? "Twoje biuro")} · łącznie do odzyskania
              <strong>${formatMoney(suma)} zł</strong>
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="text-align:left;color:#71717a;font-size:12px;">
                  <th style="padding:6px 10px;">Dokument</th>
                  <th style="padding:6px 10px;">Nabywca</th>
                  <th style="padding:6px 10px;">Termin</th>
                  <th style="padding:6px 10px;">Po terminie</th>
                  <th style="padding:6px 10px;text-align:right;">Zostało</th>
                </tr>
              </thead>
              <tbody>${faktury.map((f) => wiersz(f, dzis)).join("")}</tbody>
            </table>
            <p style="margin:24px 0 0;">
              <a href="${APP_URL}/app/faktury"
                 style="background:#10b981;color:#06281c;padding:11px 20px;border-radius:10px;text-decoration:none;font-weight:600;">
                Otwórz faktury
              </a>
            </p>
            <p style="margin-top:20px;font-size:12px;color:#a1a1aa;">
              Wiadomość wysyłana raz dziennie, tylko gdy coś zalega.
            </p>
          </div>
        `,
      });

      if (bladWysylki) {
        await zapiszBlad("cron/przypomnienia-faktury", bladWysylki.message ?? "błąd wysyłki", {
          agencyId,
        });
        continue;
      }
      wyslane++;
    } catch (err) {
      await zapiszBlad("cron/przypomnienia-faktury", err, { agencyId });
    }
  }

  return wyslane;
}
