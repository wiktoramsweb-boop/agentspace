import { dostepPoTokenie, brandingBiura } from "@/lib/data-portal";

/**
 * Manifest aplikacji klienta, podpisany nazwą jego biura.
 *
 * Osobny manifest dla każdego dostępu, a nie jeden wspólny: klient podpisał
 * umowę ze Spectrą albo z innym biurem i to jego nazwa ma stać pod ikoną na
 * ekranie telefonu. Nazwa AgentSpace nie pada w portalu ani razu - to jest
 * narzędzie biura, a nie marka, którą klient ma znać.
 *
 * `start_url` wskazuje wprost na adres z tokenem, więc stuknięcie w ikonę
 * otwiera właśnie tę sprawę, bez logowania i bez wklejania linku.
 */
/**
 * Podpis pod ikoną mieści ok. 12 znaków. Ucinamy na granicy słowa, bo
 * „Biuro Demo N" wygląda jak błąd, a „Biuro Demo" jak nazwa.
 */
function krotkaNazwa(nazwa: string): string {
  if (nazwa.length <= 12) return nazwa;
  const slowa = nazwa.split(/\s+/);
  let out = slowa[0].slice(0, 12);
  for (const s of slowa.slice(1)) {
    if (`${out} ${s}`.length > 12) break;
    out += ` ${s}`;
  }
  return out;
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) return new Response("Nie znaleziono", { status: 404 });

  const biuro = await brandingBiura(dostep.agency_id);
  const baza = `/klient/${token}`;

  return Response.json(
    {
      name: biuro.nazwa,
      short_name: krotkaNazwa(biuro.nazwa),
      description:
        dostep.rodzaj === "kupujacy"
          ? `Oferty dobrane przez ${biuro.nazwa}.`
          : `Podgląd sprawy prowadzonej przez ${biuro.nazwa}.`,
      lang: "pl",
      start_url: baza,
      scope: baza,
      id: baza,
      display: "standalone",
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: "#ffffff",
      icons: [
        { src: `${baza}/ikona?r=192`, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: `${baza}/ikona?r=512`, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: `${baza}/ikona?r=512&m=1`, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json; charset=utf-8" } },
  );
}
