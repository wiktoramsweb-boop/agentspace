import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hitLimit, visitorKey } from "@/lib/rate-limit";
import { DEMO_EMAIL, DEMO_IMIE } from "@/lib/demo/tryb";

/**
 * Wejście do wersji demo jednym kliknięciem (formularz POST ze strony /demo).
 * Logujemy odwiedzającego na wspólne konto gościa biura demo, bez hasła:
 * jednorazowy token z panelu administracyjnego zamieniamy od razu na sesję.
 */

/** Konto gościa zakładamy przy pierwszym wejściu, żeby nie wymagało ręcznej konfiguracji. */
async function idGoscia(): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const { data: profil } = await admin.from("profiles").select("id").eq("email", DEMO_EMAIL).maybeSingle();
  if (profil) return profil.id as string;

  const { data: biuro } = await admin.from("agencies").select("id").eq("is_demo", true).order("created_at").limit(1).maybeSingle();
  if (!biuro) return null;

  const haslo = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  const { data: konto, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: haslo,
    email_confirm: true,
    user_metadata: { demo: true, full_name: DEMO_IMIE },
  });
  if (error || !konto.user) return null;
  const { error: bladProfilu } = await admin.from("profiles").insert({
    id: konto.user.id,
    agency_id: biuro.id,
    full_name: DEMO_IMIE,
    email: DEMO_EMAIL,
    role: "owner",
    monthly_goal_pln: 20000,
  });
  return bladProfilu ? null : konto.user.id;
}

export async function POST(request: NextRequest) {
  const wroc = (powod: string) => NextResponse.redirect(new URL(`/demo?blad=${powod}`, request.url), 303);

  if (await hitLimit(`demo:${await visitorKey()}`, 8, 3600)) return wroc("limit");
  if (!(await idGoscia())) return wroc("niedostepne");

  const { data: link, error } = await createSupabaseAdmin().auth.admin.generateLink({ type: "magiclink", email: DEMO_EMAIL });
  if (error || !link.properties?.hashed_token) return wroc("niedostepne");

  const supabase = await createSupabaseServerClient();
  const { error: bladSesji } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (bladSesji) return wroc("niedostepne");

  return NextResponse.redirect(new URL("/app", request.url), 303);
}
