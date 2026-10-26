import sharp from "sharp";

/**
 * Logo biura przycięte do ikony aplikacji.
 *
 * Logotypy biur to zwykle znak i obok napis („domek + SPECTRA”), z szerokim
 * marginesem w pliku. Wciśnięte w kwadrat ikony dawały malutki pasek tekstu.
 * Najpierw obcinamy puste brzegi, potem szukamy pionowej przerwy między
 * znakiem a napisem: jeśli lewa część jest mniej więcej kwadratowa, to jest
 * znak i to on idzie na ikonę. Bez wyraźnego znaku zostaje całe logo.
 */
export type LogoDoIkony = { znak: Buffer | null; cale: Buffer };

const pamiec = new Map<string, Promise<LogoDoIkony | null>>();

export function logoDoIkony(url: string): Promise<LogoDoIkony | null> {
  if (!pamiec.has(url)) {
    pamiec.set(url, przygotuj(url).catch(() => null));
    if (pamiec.size > 200) pamiec.delete(pamiec.keys().next().value!);
  }
  return pamiec.get(url)!;
}

async function przygotuj(url: string): Promise<LogoDoIkony | null> {
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const wej = Buffer.from(await r.arrayBuffer());
  const cale = await sharp(wej).trim({ threshold: 12 }).png().toBuffer();

  const { data, info } = await sharp(cale).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Kolumna „z tuszem”: nieprzezroczysty i niebiały piksel.
  const tusz: boolean[] = [];
  for (let x = 0; x < w; x++) {
    let jest = false;
    for (let y = 0; y < h && !jest; y += 2) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      const jasny = data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235;
      if (a > 40 && !jasny) jest = true;
    }
    tusz.push(jest);
  }
  let znak: Buffer | null = null;
  if (w / h > 1.8) {
    const minPrzerwa = Math.max(3, Math.round(w * 0.025));
    let x = 0;
    while (x < w && tusz[x]) x++;
    let przerwa = 0;
    while (x + przerwa < w && !tusz[x + przerwa]) przerwa++;
    const proporcja = x / h;
    if (x > 0 && przerwa >= minPrzerwa && x + przerwa < w && proporcja > 0.45 && proporcja < 1.7) {
      znak = await sharp(cale).extract({ left: 0, top: 0, width: x, height: h }).trim({ threshold: 12 }).png().toBuffer();
    }
  }
  return { znak, cale };
}

export const naDataUrl = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;
