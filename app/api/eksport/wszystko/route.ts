import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { maModul } from "@/lib/role";
import { todayPL } from "@/lib/datetime";
import { ZBIORY, doCsv } from "@/lib/eksport-csv";
import { SCHEMAT } from "@/lib/eksport-schemat";
import { spakuj } from "@/lib/zip";

/**
 * Całe dane biura w jednym archiwum.
 *
 * To jest procedura wyjścia. Biuro, które odchodzi, ma zabrać wszystko jednym
 * kliknięciem, a nie klikać pięć razy i zastanawiać się, czy czegoś nie
 * przegapiło. Działa też po wygaśnięciu abonamentu, bo odcięcie danych byłoby
 * dokładnie tym uwiązaniem, którego obiecujemy nie robić.
 */

export const maxDuration = 60;

export async function GET() {
  const user = await requireUser();
  if (!user.agency_id) return new Response("Konto nie jest przypisane do biura.", { status: 403 });

  if (!maModul({ id: user.id, role: user.role, permissions: user.permissions }, "ustawienia")) {
    return new Response("Brak uprawnień do eksportu danych biura.", { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const kodownik = new TextEncoder();
  const pliki: { nazwa: string; dane: Uint8Array }[] = [];
  const podsumowanie: string[] = [];

  for (const zbior of ZBIORY) {
    const { tabela, kolumny } = SCHEMAT[zbior];
    const { data, error } = await admin
      .from(tabela)
      .select(kolumny.map((k) => k.klucz).join(","))
      .eq("agency_id", user.agency_id)
      .order("created_at", { ascending: false })
      .limit(20000);

    if (error) {
      podsumowanie.push(`${zbior}: nie udało się odczytać (${error.message})`);
      continue;
    }

    const wiersze = (data ?? []) as unknown as Record<string, unknown>[];
    // Nazwy w archiwum bez polskich znaków: starsze narzędzia do rozpakowania
    // potrafią je przekręcić, a nazwa pliku nie jest miejscem na ryzyko.
    pliki.push({ nazwa: `${zbior}.csv`, dane: kodownik.encode(doCsv(kolumny, wiersze)) });
    podsumowanie.push(`${zbior}: ${wiersze.length} wierszy`);
  }

  const dzis = todayPL();
  const czytaj = [
    `Eksport danych biura z AgentSpace`,
    `Data: ${dzis}`,
    ``,
    `Zawartość archiwum:`,
    ...podsumowanie.map((x) => `  - ${x}`),
    ``,
    `Pliki są w formacie CSV ze średnikiem i znacznikiem BOM, więc otwierają`,
    `się dwuklikiem w polskim Excelu, z zachowaniem polskich znaków.`,
    ``,
    `To jest komplet danych tekstowych biura. Pliki wgrane do dokumentów`,
    `i zdjęcia ofert pobiera się osobno z poziomu aplikacji.`,
  ].join("\n");
  pliki.push({ nazwa: "CZYTAJ-TO-NAJPIERW.txt", dane: kodownik.encode(czytaj) });

  const archiwum = spakuj(pliki);

  return new Response(archiwum as BodyInit, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="agentspace-dane-biura-${dzis}.zip"`,
      "cache-control": "no-store",
    },
  });
}
