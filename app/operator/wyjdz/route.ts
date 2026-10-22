import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Wyjście z trybu operatora: wylogowanie z konta biura i powrót do panelu. */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  // Tylko ta przeglądarka: zakres globalny wylogowałby właściciela biura na jego urządzeniach.
  await supabase.auth.signOut({ scope: "local" });
  (await cookies()).delete({ name: "as_operator_w", path: "/" });
  return NextResponse.redirect(new URL("/operator", request.url), 303);
}
