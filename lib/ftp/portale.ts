/**
 * Portale, do których biuro wysyła oferty plikiem przez FTP. Dane serwera
 * (host, login, hasło) każde biuro dostaje od portalu po podpisaniu umowy.
 * `format` to nazwa formatu pliku z ofertami, którego portal oczekuje.
 */
export type PortalFtp = { id: string; nazwa: string; format: string; jakZdobyc: string };

export const PORTALE_FTP: PortalFtp[] = [
  {
    id: "nieruchomosci-online",
    nazwa: "Nieruchomosci-online.pl",
    format: "NOE 2.0",
    jakZdobyc: "Zadzwoń do Nieruchomosci-online (33 486 90 55) albo napisz na support@nieruchomosci-online.pl, że korzystasz z AgentSpace. Dane FTP dostaniesz od konsultanta, są też w panelu biura w Ustawieniach.",
  },
];

export const portalFtp = (id: string) => PORTALE_FTP.find((p) => p.id === id) ?? null;
