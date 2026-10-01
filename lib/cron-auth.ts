/**
 * Czy zapytanie do crona przyszło od Vercela (albo zewnętrznego schedulera).
 *
 * Bez ustawionego CRON_SECRET odmawiamy. Wcześniej brak sekretu oznaczał
 * „wpuść każdego” i ktokolwiek z internetu mógł w kółko wysyłać raporty
 * i powiadomienia do wszystkich biur. Vercel sam dokleja nagłówek
 * `Authorization: Bearer <CRON_SECRET>` do swoich cronów.
 */
export function cronUnauthorized(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("Cron odrzucony: brak CRON_SECRET w zmiennych środowiskowych.");
    return new Response("CRON_SECRET not configured", { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
