import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Wyjście z wersji demo. Opcjonalnie prosto do zakładania konta. */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const dalej = request.nextUrl.searchParams.get("dalej") === "signup" ? "/signup" : "/demo";
  return NextResponse.redirect(new URL(dalej, request.url), 303);
}
