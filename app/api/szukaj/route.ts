import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type SearchHit = {
  kind: "klient" | "nieruchomosc" | "dzialanie" | "poszukiwanie";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

/**
 * Globalna wyszukiwarka (⌘K). Szuka równolegle w klientach, ofertach,
 * działaniach i poszukiwaniach.
 *
 * Numer telefonu obsługujemy osobno: wpisany jako "600 100 200" albo
 * "+48600100200" ma znaleźć ten sam kontakt, dlatego porównujemy same cyfry.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.agency_id) {
    return Response.json({ hits: [] });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ hits: [] });

  const admin = createSupabaseAdmin();
  const agency = user.agency_id;
  const like = `%${q}%`;
  const digits = q.replace(/\D/g, "");
  const isPhone = digits.length >= 3;

  const [clients, properties, activities, searches] = await Promise.all([
    admin
      .from("clients")
      .select("id, name, phone, email, company, type")
      .eq("agency_id", agency)
      .or(
        isPhone
          ? `name.ilike.${like},phone.ilike.%${digits}%,phone_digits.ilike.%${digits}%`
          : `name.ilike.${like},email.ilike.${like},company.ilike.${like}`,
      )
      .limit(6),
    admin
      .from("properties")
      .select("id, title, city, address, price_pln, offer_no")
      .eq("agency_id", agency)
      .or(`title.ilike.${like},city.ilike.${like},address.ilike.${like},offer_no.ilike.${like}`)
      .limit(6),
    admin
      .from("activities")
      .select("id, subject, contact_name, contact_phone, due_at")
      .eq("agency_id", agency)
      .or(
        isPhone
          ? `subject.ilike.${like},contact_name.ilike.${like},contact_phone_digits.ilike.%${digits}%`
          : `subject.ilike.${like},contact_name.ilike.${like},description.ilike.${like}`,
      )
      .order("due_at", { ascending: false })
      .limit(6),
    admin
      .from("searches")
      .select("id, title, search_no, price_min, price_max")
      .eq("agency_id", agency)
      .or(`title.ilike.${like},search_no.ilike.${like}`)
      .limit(4),
  ]);

  const zl = (n: number | null) =>
    n == null ? null : new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " zł";

  const hits: SearchHit[] = [
    ...((clients.data ?? []) as Record<string, string | null>[]).map((c) => ({
      kind: "klient" as const,
      id: c.id!,
      title: c.name ?? "Klient",
      subtitle: [c.phone, c.company].filter(Boolean).join(" · ") || null,
      href: `/app/klienci/${c.id}`,
    })),
    ...((properties.data ?? []) as Record<string, unknown>[]).map((p) => ({
      kind: "nieruchomosc" as const,
      id: p.id as string,
      title: (p.title as string) ?? "Oferta",
      subtitle:
        [zl(p.price_pln as number | null), p.city as string, p.offer_no as string]
          .filter(Boolean)
          .join(" · ") || null,
      href: `/app/nieruchomosci/${p.id}`,
    })),
    ...((activities.data ?? []) as Record<string, string | null>[]).map((a) => ({
      kind: "dzialanie" as const,
      id: a.id!,
      title: a.subject ?? "Działanie",
      subtitle: [a.contact_name, a.contact_phone].filter(Boolean).join(" · ") || null,
      href: `/app/dzialania/${a.id}`,
    })),
    ...((searches.data ?? []) as Record<string, unknown>[]).map((s) => ({
      kind: "poszukiwanie" as const,
      id: s.id as string,
      title: (s.title as string) ?? "Poszukiwanie",
      subtitle:
        [zl(s.price_min as number | null), zl(s.price_max as number | null)]
          .filter(Boolean)
          .join(" - ") || (s.search_no as string) || null,
      href: `/app/poszukiwania/${s.id}`,
    })),
  ];

  return Response.json({ hits });
}
