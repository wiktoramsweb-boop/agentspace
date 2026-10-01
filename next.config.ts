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
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
