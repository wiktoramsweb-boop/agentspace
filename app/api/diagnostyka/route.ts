import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { stanDostepu } from "@/lib/abonament-cennik";
import { poczatekMiesiaca } from "@/lib/kredyty-cennik";
import { APP_TZ } from "@/lib/datetime";

/**
 * Diagnostyka systemu, wyłącznie do odczytu.
 *
 * Powstała po to, żeby dało się sprawdzić stan AgentSpace bez logowania do
 * panelu i bez zaglądania do bazy: jedno zapytanie mówi, czy komplet zmiennych
 * jest ustawiony, ile biur żyje, co się ostatnio wysypało i czy ktoś czeka
 * na fakturę.
 *
 * Token jest ODDZIELNY od CRON_SECRET i daje wyłącznie odczyt. Nie da się nim
 * niczego zmienić ani wywołać żadnej akcji. To celowe: gdyby kiedyś wyciekł,
 * najgorsze co się stanie, to że ktoś pozna liczbę biur.
 *
 * Nie zwraca ŻADNYCH danych klientów biur: ani nazwisk, ani telefonów,
 * ani treści notatek.
 *
 * Użycie:
 *   curl -H "Authorization: Bearer $DIAG_TOKEN" https://agentspace.pl/api/diagnostyka
 */

export const dynamic = "force-dynamic";

function ustawiona(nazwa: string): boolean {
  return Boolean(process.env[nazwa]);
}

export async function GET(request: Request) {
  const token = process.env.DIAG_TOKEN;
  if (!token) return new Response("DIAG_TOKEN not configured", { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const odMiesiaca = poczatekMiesiaca(APP_TZ);
  const odTygodnia = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [agencje, bledy, zamowienia, kredyty] = await Promise.all([
    admin
      .from("agencies")
      .select("id, name, is_demo, subscription_status, subscription_ends_at, trial_ends_at"),
    admin
      .from("app_errors")
      .select("created_at, gdzie, wiadomosc, szczegoly")
      .gte("created_at", odTygodnia)
      .order("created_at", { ascending: false })
      .limit(40),
    admin.from("subscription_orders").select("id, status, created_at").neq("status", "oplacone"),
    admin.from("rate_events").select("credits").gte("created_at", odMiesiaca),
  ]);

  const lista = agencje.data ?? [];
  const stany = lista.map((a) => ({ demo: Boolean(a.is_demo), stan: stanDostepu(a), nazwa: a.name }));

  // Zliczenie błędów po miejscu w kodzie: powtarzający się wpis to awaria,
  // pojedynczy to zwykle incydent sieciowy.
  const wgMiejsca = new Map<string, number>();
  for (const b of bledy.data ?? []) {
    const gdzie = b.gdzie as string;
    wgMiejsca.set(gdzie, (wgMiejsca.get(gdzie) ?? 0) + 1);
  }

  const nieoplacone = zamowienia.data ?? [];

  return Response.json(
    {
      czas: new Date().toISOString(),
      konfiguracja: {
        ANTHROPIC_API_KEY: ustawiona("ANTHROPIC_API_KEY"),
        RESEND_API_KEY: ustawiona("RESEND_API_KEY"),
        CRON_SECRET: ustawiona("CRON_SECRET"),
        SIGNUP_CODE: ustawiona("SIGNUP_CODE"),
        OPERATOR_LOGIN: ustawiona("OPERATOR_LOGIN"),
        OPERATOR_PASSWORD: ustawiona("OPERATOR_PASSWORD"),
        NOTIFICATION_EMAIL: ustawiona("NOTIFICATION_EMAIL"),
      },
      biura: {
        razem: lista.length,
        demo: stany.filter((s) => s.demo).length,
        aktywne: stany.filter((s) => !s.demo && s.stan.aktywne).length,
        probne: stany.filter((s) => !s.demo && s.stan.probny && s.stan.aktywne).length,
        wygasle: stany.filter((s) => !s.demo && !s.stan.aktywne).length,
        konczySieWTydzien: stany
          .filter((s) => !s.demo && s.stan.aktywne && (s.stan.dniDoKonca ?? 99) <= 7)
          .map((s) => ({ biuro: s.nazwa, dni: s.stan.dniDoKonca })),
      },
      zamowieniaDoRozliczenia: {
        ile: nieoplacone.length,
        najstarsze: nieoplacone.length
          ? nieoplacone.reduce((a, b) =>
              (a.created_at as string) < (b.created_at as string) ? a : b,
            ).created_at
          : null,
      },
      kredytyAI: {
        wTymMiesiacu: (kredyty.data ?? []).reduce((s, z) => s + ((z.credits as number) ?? 1), 0),
      },
      bledy: {
        dziennikDziala: !bledy.error,
        wOstatnimTygodniu: bledy.data?.length ?? 0,
        wgMiejsca: Object.fromEntries([...wgMiejsca.entries()].sort((a, b) => b[1] - a[1])),
        ostatnie: (bledy.data ?? []).slice(0, 15),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
