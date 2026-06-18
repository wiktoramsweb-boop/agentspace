import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";

const VALID_TEAM_SIZES = ["1-3", "4-10", "11-25", "25+"] as const;
type TeamSize = (typeof VALID_TEAM_SIZES)[number];

type Payload = {
  email?: string;
  agencyName?: string;
  teamSize?: string;
  phone?: string;
  // Honeypot — boty wypełniają wszystko, człowiek pomija ukryte pole
  website?: string;
};

function hashIp(ip: string): string {
  // SHA-256 hash IP — zachowujemy żeby móc wykryć spam, ale bez prawdziwego IP w bazie (RODO)
  return createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT ?? "default-salt"))
    .digest("hex")
    .slice(0, 32);
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Niepoprawne dane" }, { status: 400 });
  }

  // Honeypot — jeśli wypełnione, udajemy sukces bez zapisu
  if (body.website && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = (body.email ?? "").toString().trim().toLowerCase();
  const agencyName = (body.agencyName ?? "").toString().trim();
  const teamSize = (body.teamSize ?? "").toString().trim();
  const phone = body.phone ? body.phone.toString().trim() : null;

  // Walidacja
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Niepoprawny email" }, { status: 400 });
  }
  if (!agencyName || agencyName.length < 2) {
    return NextResponse.json(
      { error: "Podaj nazwę biura" },
      { status: 400 },
    );
  }
  if (!VALID_TEAM_SIZES.includes(teamSize as TeamSize)) {
    return NextResponse.json(
      { error: "Wybierz wielkość zespołu" },
      { status: 400 },
    );
  }

  const ipHash = hashIp(getClientIp(request));
  const userAgent = request.headers.get("user-agent") ?? null;

  // Zapis do Supabase
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (error) {
    console.error("Supabase init error:", error);
    return NextResponse.json(
      { error: "Backend niedostępny. Spróbuj za chwilę." },
      { status: 500 },
    );
  }

  const { error: dbError } = await supabase.from("waitlist").insert({
    email,
    agency_name: agencyName,
    team_size: teamSize,
    phone,
    user_agent: userAgent,
    ip_hash: ipHash,
  });

  if (dbError) {
    // Unique violation = już zapisany
    if (dbError.code === "23505") {
      return NextResponse.json({ ok: true, alreadyOnList: true });
    }
    console.error("Waitlist insert error:", dbError);
    return NextResponse.json(
      { error: "Nie udało się zapisać. Spróbuj za chwilę." },
      { status: 500 },
    );
  }

  // Email powiadomienie do ownera (Wiktor)
  const resendKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFICATION_EMAIL ?? "nieruchomoscispectra@gmail.com";

  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
        to: notifyEmail,
        subject: `🎉 Nowy zapis na waitlist: ${agencyName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #10b981; margin: 0 0 16px;">Nowy zapis na listę oczekujących AgentSpace</h2>
            <p style="color: #52525b; font-size: 14px; margin: 0 0 24px;">Ktoś właśnie zapisał się przez formularz na stronie głównej.</p>

            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #71717a;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #71717a;">Biuro:</td><td style="padding: 8px 0; font-weight: 600;">${agencyName}</td></tr>
              <tr><td style="padding: 8px 0; color: #71717a;">Zespół:</td><td style="padding: 8px 0;">${teamSize} agentów</td></tr>
              ${phone ? `<tr><td style="padding: 8px 0; color: #71717a;">Telefon:</td><td style="padding: 8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>` : ""}
            </table>

            <p style="color: #71717a; font-size: 12px; margin-top: 24px;">Sprawdź wszystkie zapisy w panelu Supabase.</p>
          </div>
        `,
      });
    } catch (emailError) {
      // Email nie powiódł się, ale zapis już jest w bazie — nie blokujemy odpowiedzi
      console.error("Resend error:", emailError);
    }
  }

  return NextResponse.json({ ok: true });
}
