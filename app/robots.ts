import type { MetadataRoute } from "next";

const BASE_URL = "https://agentspace.pl";

// Aplikacja, portal klienta i API: nic tam do indeksowania. Boty AI mają
// osobne reguły, które zastępują regułę „*”, więc listę powtarzamy przy każdym.
const PRYWATNE = ["/api/", "/_next/", "/private/", "/app/", "/operator", "/zaproszenie/", "/podglad-motywu", "/klient/", "/wejdz-demo", "/reset-hasla"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRYWATNE,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: PRYWATNE,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: PRYWATNE,
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: PRYWATNE,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: PRYWATNE,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
