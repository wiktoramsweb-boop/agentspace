import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgentSpace",
    short_name: "AgentSpace",
    description:
      "System operacyjny agenta nieruchomości - trening AI, klienci, oferty, cele, prowizje.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    // Kolory pod jasny interfejs aplikacji (.app-shell). Wcześniej było tu
    // czarne tło z pierwszej wersji, przez co pasek tytułu na Androidzie był
    // czarny nad jasnym ekranem.
    background_color: "#f1f4f9",
    theme_color: "#f1f4f9",
    orientation: "portrait",
    lang: "pl",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Przytrzymanie ikony na ekranie głównym: skrót prosto do tego, co agent
    // robi w terenie najczęściej, zamiast przechodzenia przez pulpit.
    shortcuts: [
      { name: "Klienci", short_name: "Klienci", url: "/app/klienci" },
      { name: "Zadania i telefony", short_name: "Zadania", url: "/app/dzialania" },
      { name: "Nieruchomości", short_name: "Oferty", url: "/app/nieruchomosci" },
    ],
  };
}
