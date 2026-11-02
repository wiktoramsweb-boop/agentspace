import { ImageResponse } from "next/og";
import { brandingBiura } from "@/lib/data-portal";
import { logoDoIkony, naDataUrl } from "@/lib/logo-ikona";

/** Ikona aplikacji biura: logo albo inicjał na ciemnym tle. Wspólna dla portalu klienta i właściciela. */
export async function ikonaBiura(agencyId: string, req: Request): Promise<Response> {
  const biuro = await brandingBiura(agencyId);
  const url = new URL(req.url);
  const rozmiar = url.searchParams.get("r") === "192" ? 192 : 512;
  const maskable = url.searchParams.get("m") === "1";
  // Bezpieczny obszar maski to ok. 80% szerokości. Znak dostaje więcej
  // powietrza niż napis, bo jest zwarty i inaczej dotykałby krawędzi.
  const logo = biuro.logoUrl ? await logoDoIkony(biuro.logoUrl) : null;
  const obraz = logo ? naDataUrl(logo.znak ?? logo.cale) : biuro.logoUrl;
  const zapas = Math.round(rozmiar * (maskable ? 0.22 : logo?.znak ? 0.16 : 0.08));

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
            src={obraz!}
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
