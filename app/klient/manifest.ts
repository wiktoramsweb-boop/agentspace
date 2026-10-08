import type { MetadataRoute } from "next";

/**
 * Manifest portalu klienta.
 *
 * Dzięki niemu strona instaluje się na telefonie jak aplikacja: własna ikona
 * na ekranie, pełny ekran bez paska przeglądarki. To jest cała „aplikacja
 * na iOS i Androida" - bez sklepów, bez review i bez opłat rocznych.
 *
 * Na iPhonie powiadomienia działają dopiero po dodaniu do ekranu początkowego
 * (iOS 16.4+), dlatego portal prosi o to zanim zaproponuje powiadomienia.
 *
 * `start_url` jest celowo katalogiem nadrzędnym bez tokenu: token siedzi
 * w adresie, z którego klient instaluje, a przeglądarka zapamiętuje go sama.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moja nieruchomość",
    short_name: "Nieruchomość",
    description: "Podgląd sprawy prowadzonej przez Twoje biuro nieruchomości.",
    lang: "pl",
    start_url: ".",
    scope: ".",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
