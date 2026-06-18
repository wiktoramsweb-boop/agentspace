import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";

type Payload = {
  name?: string;
  email?: string;
  agency?: string;
  topic?: string;
  message?: string;
  website?: string; // honeypot
};

function hashIp(ip: string): string {
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

  // Honeypot
  if (body.website && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = (body.name ?? "").toString().trim();
  const email = (body.email ?? "").toString().trim().toLowerCase();
  const agency = body.agency ? body.agency.toString().trim() : null;
  const topic = (body.topic ?? "").toString().trim();
  const message = (body.message ?? "").toString().trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Podaj imię" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Niepoprawny email" }, { status: 400 });
  }
  if (!topic) {
    return NextResponse.json({ error: "Wybierz temat" }, { status: 400 });
  }
  if (!message || message.length < 10) {
    return NextResponse.json(
      { error: "Wiadomość zbyt krótka (min. 10 znaków)" },
      { status: 400 },
    );
  }

  const ipHash = hashIp(getClientIp(request));
  const userAgent = request.headers.get("user-agent") ?? null;

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

  const { error: dbError } = await supabase.from("contact_messages").insert({
    name,
    email,
    agency,
    topic,
    message,
    user_agent: userAgent,
    ip_hash: ipHash,
  });

  if (dbError) {
    console.error("Contact insert error:", dbError);
    return NextResponse.json(
      { error: "Nie udało się wysłać. Spróbuj za chwilę." },
      { status: 500 },
    );
  }

  // Email powiadomienie
  const resendKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFICATION_EMAIL ?? "nieruchomoscispectra@gmail.com";

  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "AgentSpace <onboarding@resend.dev>",
        to: notifyEmail,
        replyTo: email,
        subject: `📩 Wiadomość kontaktowa: ${name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #10b981; margin: 0 0 16px;">Nowa wiadomość przez formularz kontaktowy</h2>

            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
              <tr><td style="padding: 8px 0; color: #71717a;">Od:</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #71717a;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              ${agency ? `<tr><td style="padding: 8px 0; color: #71717a;">Biuro:</td><td style="padding: 8px 0;">${agency}</td></tr>` : ""}
              <tr><td style="padding: 8px 0; color: #71717a;">Temat:</td><td style="padding: 8px 0;">${topic}</td></tr>
            </table>

            <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; white-space: pre-wrap; color: #18181b; font-size: 14px; line-height: 1.6;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>

            <p style="color: #71717a; font-size: 12px; margin-top: 24px;">Możesz odpowiedzieć bezpośrednio na ten email — pójdzie do ${email}.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Resend error:", emailError);
    }
  }

  return NextResponse.json({ ok: true });
}
