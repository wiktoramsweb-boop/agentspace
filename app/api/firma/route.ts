import { hitLimit, visitorKey } from "@/lib/rate-limit";
import { szukajFirmy } from "@/lib/rejestr-firm";

/** Podpowiedź nazwy i adresu biura w formularzu rejestracji. Publiczne, więc z limitem. */
export async function GET(req: Request) {
  const numer = new URL(req.url).searchParams.get("numer") ?? "";
  if (await hitLimit(`firma:${await visitorKey()}`, 20, 3600)) {
    return Response.json({ error: "Za dużo wyszukiwań. Wpisz nazwę ręcznie." }, { status: 429 });
  }
  const firma = await szukajFirmy(numer);
  return Response.json(firma ? { firma } : { error: "Nie znaleźliśmy firmy. Wpisz nazwę ręcznie." });
}
