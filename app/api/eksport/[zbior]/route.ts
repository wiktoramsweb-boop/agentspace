import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { maModul } from "@/lib/role";
import { todayPL } from "@/lib/datetime";
import { ZBIORY, doCsv, nazwaPliku, type Zbior } from "@/lib/eksport-csv";
import { SCHEMAT } from "@/lib/eksport-schemat";

/**
 * Eksport danych biura do CSV.
 *
 * Dane wychodzą zawsze z zakresu CAŁEGO biura, więc wymagamy roli, która
 * widzi całe biuro. Agent nie wynosi stąd bazy kolegów - do swoich danych
 * ma listy w aplikacji.
 *
 * Eksport działa też po wygaśnięciu abonamentu. To jest celowe: biuro, które
 * rezygnuje, musi móc zabrać swoje dane. Odcięcie ich byłoby dokładnie tym
 * lock-inem, którego obiecujemy nie robić.
 */

function jestZbiorem(x: string): x is Zbior {
  return (ZBIORY as readonly string[]).includes(x);
}

export async function GET(_req: Request, { params }: { params: Promise<{ zbior: string }> }) {
  const { zbior } = await params;
  if (!jestZbiorem(zbior)) {
    return new Response("Nieznany zbiór danych.", { status: 404 });
  }

  const user = await requireUser();
  if (!user.agency_id) return new Response("Konto nie jest przypisane do biura.", { status: 403 });

  // Eksport obejmuje całe biuro, więc wymaga uprawnienia do ustawień firmy.
  // To ten sam próg, co dane firmy i abonament: decyzja właściciela, nie agenta.
  if (!maModul({ id: user.id, role: user.role, permissions: user.permissions }, "ustawienia")) {
    return new Response("Brak uprawnień do eksportu danych biura.", { status: 403 });
  }

  const { tabela, kolumny } = SCHEMAT[zbior];
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from(tabela)
    .select(kolumny.map((k) => k.klucz).join(","))
    .eq("agency_id", user.agency_id)
    .order("created_at", { ascending: false })
    .limit(20000);

  if (error) {
    console.error(`Eksport ${zbior}:`, error);
    return new Response("Nie udało się odczytać danych.", { status: 500 });
  }

  const csv = doCsv(kolumny, (data ?? []) as unknown as Record<string, unknown>[]);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nazwaPliku(zbior, todayPL())}"`,
      "cache-control": "no-store",
    },
  });
}
