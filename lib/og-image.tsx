import { ImageResponse } from "next/og";

/**
 * Obraz podglądu linku, wspólny dla obu wersji językowych.
 *
 * Bez zewnętrznych fontów: Satori ma wbudowany krój z polskimi znakami,
 * a dociąganie pliku przy buildzie to kolejna rzecz, która potrafi paść.
 */

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Znak na kafelku jako obrazek. Satori nie rysuje gradientu tła za SVG tak
 * jak przeglądarka, więc cały kafelek, razem z gradientem, siedzi w jednym SVG.
 */
const ZNAK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect width="100" height="100" rx="22.6" fill="url(#g)"/><g transform="translate(50 50) scale(0.91) translate(-50 -50)"><g transform="translate(0 -2.15)"><path d="M 50 29.3 L 80.5 54 L 72.3 54 L 72.3 76.6 L 60.6 76.6 L 60.6 59.9 L 39.6 59.9 L 39.6 76.6 L 27.9 76.6 L 27.9 54 L 19.5 54 Z" fill="#0b1220" stroke="#0b1220" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="27.6" r="2.9" fill="#ffffff"/></g></g></svg>`;
const ZNAK_URI = `data:image/svg+xml;base64,${Buffer.from(ZNAK_SVG).toString("base64")}`;

type Copy = { title: string; lead: string; tags: string[] };

const COPY: Record<string, Copy> = {
  pl: {
    title: "Całe biuro nieruchomości w jednym miejscu",
    lead: "Klienci, oferty, cele, prowizje i AI Coach. Jeden system dla całego zespołu.",
    tags: ["CRM", "Nieruchomości", "Cele", "Prowizje", "AI Coach"],
  },
  en: {
    title: "The whole agency in one place",
    lead: "Clients, listings, goals, commissions and an AI Coach. One system for the whole team.",
    tags: ["CRM", "Listings", "Goals", "Commissions", "AI Coach"],
  },
};

export function ogImage(lang: string = "pl") {
  const t = COPY[lang] ?? COPY.pl;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #07090c 0%, #0d1b1a 55%, #06232b 100%)",
          padding: 72,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -160,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(16,185,129,0.34) 0%, rgba(16,185,129,0) 68%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ZNAK_URI} width={52} height={52} alt="" />
          <div style={{ color: "#f8fafc", fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>AgentSpace</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#f8fafc",
              fontSize: 74,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: -2.5,
              maxWidth: 940,
              display: "flex",
            }}
          >
            {t.title}
          </div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 31,
              lineHeight: 1.4,
              marginTop: 26,
              maxWidth: 880,
              display: "flex",
            }}
          >
            {t.lead}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {t.tags.map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 9999,
                border: "1px solid rgba(148,163,184,0.28)",
                color: "#cbd5e1",
                fontSize: 23,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
