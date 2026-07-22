import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Auth-check tylko na ścieżkach które go wymagają — strony marketingowe
  // (landing, blog, cennik itd.) NIE wywołują Supabase, więc są szybkie.
  matcher: ["/app/:path*", "/login", "/signup"],
};
