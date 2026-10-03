import { cronUnauthorized } from "@/lib/cron-auth";
import { potwierdzWplate } from "@/lib/data-abonament";

/**
 * Potwierdzenie wpłaty za zamówienie.
 *
 * Płatności online jeszcze nie ma: biuro zamawia w aplikacji, operator
 * wystawia fakturę, a po zaksięgowaniu przelewu musi włączyć dostęp.
 * Logika była już napisana (`potwierdzWplate`), ale nic jej nie wywoływało,
 * więc jedynym sposobem było ręczne grzebanie w bazie - a to przy dwóch
 * tabelach i liczonej dacie końca okresu prosi się o pomyłkę.
 *
 * Celowo nie ma tu interfejsu ani roli „operator” w aplikacji. To jest
 * czynność księgowa wykonywana kilka razy w miesiącu przez jedną osobę,
 * więc wystarczy ten sam sekret, którym chronione są crony.
 *
 * Użycie:
 *   curl -X POST https://agentspace.pl/api/operator/potwierdz-wplate \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"orderId":"..."}'
 */
export async function POST(request: Request) {
  const odmowa = cronUnauthorized(request);
  if (odmowa) return odmowa;

  let orderId = "";
  try {
    const body = (await request.json()) as { orderId?: unknown };
    orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  } catch {
    return Response.json({ error: "Oczekiwano JSON z polem orderId." }, { status: 400 });
  }

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return Response.json({ error: "Niepoprawny orderId." }, { status: 400 });
  }

  const blad = await potwierdzWplate(orderId);
  if (blad) return Response.json({ error: blad }, { status: 400 });

  return Response.json({ ok: true, orderId });
}
