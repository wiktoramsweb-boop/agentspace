import QRCode from "qrcode";

/**
 * Kod QR jako SVG, składany po stronie serwera.
 *
 * Celowo nie korzystamy z generatorów dostępnych przez internet: w adresie
 * siedzi token dostępu klienta, a wysyłanie go obcemu serwisowi oznaczałoby
 * oddanie komuś klucza do cudzej sprawy.
 *
 * SVG, a nie PNG, bo kod bywa drukowany na umowie i musi zostać ostry
 * w każdym rozmiarze.
 */
export async function kodQrSvg(tresc: string): Promise<string> {
  return QRCode.toString(tresc, {
    type: "svg",
    // Wyższa korekcja błędów: kod na wydrukowanej umowie bywa zagięty
    // albo poplamiony, a i tak ma się zeskanować.
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#111418", light: "#ffffff" },
  });
}
