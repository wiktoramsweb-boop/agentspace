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

/**
 * Biblioteka wstawia sztywne `width="320" height="320"`, więc kod wychodził
 * poza swoją ramkę, gdy pojemnik był węższy. Zdejmujemy te atrybuty i każemy
 * SVG wypełnić pojemnik - `viewBox` pilnuje kwadratu, więc nic się nie krzywi.
 */
function dopasujDoPojemnika(svg: string): string {
  return svg
    .replace(/\s(width|height)="\d+"/g, "")
    .replace("<svg ", '<svg style="display:block;width:100%;height:auto" ');
}

export async function kodQrSvg(tresc: string): Promise<string> {
  const svg = await QRCode.toString(tresc, {
    type: "svg",
    // Wyższa korekcja błędów: kod na wydrukowanej umowie bywa zagięty
    // albo poplamiony, a i tak ma się zeskanować.
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#111418", light: "#ffffff" },
  });
  return dopasujDoPojemnika(svg);
}
