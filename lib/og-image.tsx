import { ImageResponse } from "next/og";

/**
 * Obraz podglądu linku, wspólny dla obu wersji językowych.
 *
 * Bez zewnętrznych fontów: Satori ma wbudowany krój z polskimi znakami,
 * a dociąganie pliku przy buildzie to kolejna rzecz, która potrafi paść.
 */

export const OG_SIZE = { width: 1200, height: 630 };

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
          <div style={{ width: 16, height: 16, borderRadius: 9999, background: "#34d399", display: "flex" }} />
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
