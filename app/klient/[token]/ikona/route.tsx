import { ImageResponse } from "next/og";
import { dostepPoTokenie, brandingBiura } from "@/lib/data-portal";

/**
 * Ikona aplikacji na ekranie telefonu klienta.
 *
 * iPhone bierze pod uwagę wyłącznie `apple-touch-icon` w formacie PNG - bez
 * niego robi zrzut strony i na ekranie początkowym ląduje nieczytelny kafelek.
 * Dlatego składamy PNG tutaj, z logo biura, a gdy biuro go nie wgrało -
 * z pierwszej litery nazwy na ciemnym tle.
 *
 * Wersja „maskable" ma zapas przy krawędziach, bo Android przycina ikonę do
 * kształtu wybranego przez producenta telefonu.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) return new Response("Nie znaleziono", { status: 404 });

  const biuro = await brandingBiura(dostep.agency_id);
  const url = new URL(req.url);
  const rozmiar = url.searchParams.get("r") === "192" ? 192 : 512;
  const maskable = url.searchParams.get("m") === "1";
  // Bezpieczny obszar maski to ok. 80% szerokości.
  const zapas = maskable ? Math.round(rozmiar * 0.18) : Math.round(rozmiar * 0.08);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: biuro.logoUrl ? "#ffffff" : "#0f1419",
          padding: zapas,
        }}
      >
        {biuro.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={biuro.logoUrl}
            alt=""
            width={rozmiar - zapas * 2}
            height={rozmiar - zapas * 2}
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: Math.round(rozmiar * 0.52),
              fontWeight: 700,
            }}
          >
            {biuro.inicjal}
          </div>
        )}
      </div>
    ),
    {
      width: rozmiar,
      height: rozmiar,
      headers: { "cache-control": "public, max-age=86400" },
    },
  );
}
