import type { NextConfig } from "next";

// Nagłówki bezpieczeństwa dla każdej odpowiedzi. Celowo bez pełnego CSP:
// mapy, analityka Vercela i PDF-y ładują zasoby z kilku domen, a zbyt ciasna
// polityka po cichu psuje funkcje. frame-ancestors blokuje osadzanie aplikacji
// w ramce na obcej stronie (podstępne klikanie w przyciski).
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Mikrofon potrzebny do dyktowania (AI Coach, szybki wpis) tylko na naszej domenie.
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Okno otwarte z obcej strony nie dostaje uchwytu do naszej karty (wycieki przez window.opener).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const nextConfig: NextConfig = {
  // Kod w przeglądarce zostaje zminifikowany i bez map źródeł: z narzędzi
  // programisty nie da się odtworzyć plików projektu ani komentarzy.
  productionBrowserSourceMaps: false,
  // Bez nagłówka „X-Powered-By: Next.js”, który mówi, na czym stoi aplikacja.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Dyżur AI zdjęty z oferty: stary adres prowadzi do listy narzędzi.
    return [
      { source: "/produkt/dyzur-ai", destination: "/produkt", permanent: false },
      { source: "/en/produkt/dyzur-ai", destination: "/en/produkt", permanent: false },
    ];
  },
};

export default nextConfig;
