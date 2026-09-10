import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getAgencySettings } from "@/lib/agency-settings";
import { maskPhone } from "@/lib/format";

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

  const [clients, properties, activities, searches, settings] = await Promise.all([
    admin
      .from("clients")
      .select("id, name, phone, phone_digits, email, company, type, agent_id")
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
      .select("id, subject, contact_name, contact_phone, contact_phone_digits, due_at, created_by, assignee_ids")
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
    getAgencySettings(agency, user.agency?.name),
  ]);

  // Ukrywanie kontaktów (Ustawienia → Pozostałe): agent nie widzi pełnych
  // numerów cudzych klientów. Dodatkowo cudzy klient pokazuje się po numerze
  // tylko przy pełnym numerze - inaczej dałoby się go odtworzyć cyfra po cyfrze,
  // wpisując coraz dłuższe fragmenty.
  const mask = settings.options.hide_contacts && user.role === "agent";
  const exactPhone = (d: string | null | undefined) =>
    !!d && digits.length >= 9 && (d === digits || d.endsWith(digits.slice(-9)));
  const textHit = (...vals: (string | null | undefined)[]) =>
    vals.some((v) => (v ?? "").toLowerCase().includes(q.toLowerCase()));

  type ClientRow = Record<string, string | null>;
  type ActivityRow = Record<string, unknown>;
  const clientRows = ((clients.data ?? []) as ClientRow[])
    .filter((c) => !mask || c.agent_id === user.id || !isPhone || exactPhone(c.phone_digits) || textHit(c.name, c.company))
    .map((c) =>
      mask && c.agent_id !== user.id ? { ...c, phone: maskPhone(c.phone) } : c,
    );
  const activityRows = ((activities.data ?? []) as ActivityRow[])
    .map((a) => {
      const own = a.created_by === user.id || ((a.assignee_ids as string[] | null) ?? []).includes(user.id);
      return { a, own };
    })
    .filter(
      ({ a, own }) =>
        !mask || own || !isPhone || exactPhone(a.contact_phone_digits as string | null) ||
        textHit(a.subject as string | null, a.contact_name as string | null),
    )
    .map(({ a, own }) =>
      mask && !own ? { ...a, contact_phone: maskPhone(a.contact_phone as string | null) } : a,
    ) as Record<string, string | null>[];

  const zl = (n: number | null) =>
    n == null ? null : new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " zł";

  const hits: SearchHit[] = [
    ...clientRows.map((c) => ({
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
    ...activityRows.map((a) => ({
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
