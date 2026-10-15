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
    title: "Program dla biura nieruchomości, w którym agenci naprawdę pracują",
    lead: "CRM, umowy, prowizje, koszty biura i trening rozmów z AI. 7\u00a0dni za darmo, bez karty.",
    tags: ["CRM", "Umowy", "Prowizje", "Czat zespołu", "AI Coach"],
  },
  en: {
    title: "Real estate agency software your agents will actually use",
    lead: "CRM, contracts, commissions, office costs and AI call training. 7-day free trial, no card.",
    tags: ["CRM", "Contracts", "Commissions", "Team chat", "AI Coach"],
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
          borderTop: "14px solid #0b7a55",
          background: "#f7f7f4",
          padding: 72,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ZNAK_URI} width={52} height={52} alt="" />
          <div style={{ color: "#14171a", fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>AgentSpace</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#14171a",
              fontSize: 66,
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
              color: "#555b61",
              fontSize: 30,
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
                border: "1px solid #cdd0c8",
                background: "#ffffff",
                color: "#0a6a4a",
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
