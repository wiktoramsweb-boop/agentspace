/**
 * Obróbka zdjęć w przeglądarce, przed wysłaniem na serwer.
 *
 * Dlaczego tutaj, a nie na serwerze: zdjęcie z telefonu ma 4-10 MB, a po
 * zmniejszeniu do 1600×1200 około 300-600 KB. Agent w terenie na LTE wysyła
 * więc kilkanaście razy mniej danych, a serwer nie potrzebuje żadnej
 * biblioteki graficznej. Znak wodny nakładamy w tym samym kroku.
 *
 * Tylko w przeglądarce (canvas). Nie importować z kodu serwerowego.
 */

import type { MarkPosition, PhotoConfig } from "./agency-settings";
import { SUPABASE_ANON_KEY } from "./supabase/config";

export type Mark = { url: string; opacity?: number; scale: number; position: MarkPosition };

type Drawable = ImageBitmap | HTMLImageElement;

function sizeOf(img: Drawable): { w: number; h: number } {
  return "naturalWidth" in img
    ? { w: img.naturalWidth, h: img.naturalHeight }
    : { w: img.width, h: img.height };
}

/**
 * Odczyt pliku z uwzględnieniem orientacji z EXIF. Bez tego zdjęcia robione
 * telefonem w pionie lądowały na boku.
 */
async function decode(blob: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      /* Safari starszy niż 15 nie zna tej opcji - próbujemy zwykłym <img> */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const markCache = new Map<string, Promise<Drawable>>();

/**
 * Znak wodny i stempel pobieramy jako blob, a nie przez <img src>, żeby
 * canvas nie został „skażony" obrazem z innej domeny i dało się go zapisać.
 */
function loadMark(url: string): Promise<Drawable> {
  let p = markCache.get(url);
  if (!p) {
    p = fetch(url, { mode: "cors" })
      .then((r) => {
        if (!r.ok) throw new Error(`Nie udało się pobrać znaku wodnego (${r.status}).`);
        return r.blob();
      })
      .then(decode);
    markCache.set(url, p);
    p.catch(() => markCache.delete(url));
  }
  return p;
}

function placeMark(
  canvasW: number,
  canvasH: number,
  markW: number,
  markH: number,
  position: MarkPosition,
): { x: number; y: number } {
  const margin = Math.round(Math.min(canvasW, canvasH) * 0.035);
  switch (position) {
    case "top-left":
      return { x: margin, y: margin };
    case "top-right":
      return { x: canvasW - markW - margin, y: margin };
    case "bottom-left":
      return { x: margin, y: canvasH - markH - margin };
    case "bottom-right":
      return { x: canvasW - markW - margin, y: canvasH - markH - margin };
    default:
      return { x: (canvasW - markW) / 2, y: (canvasH - markH) / 2 };
  }
}

async function drawMark(ctx: CanvasRenderingContext2D, w: number, h: number, mark: Mark) {
  const img = await loadMark(mark.url);
  const s = sizeOf(img);
  if (!s.w || !s.h) return;
  const mw = Math.round(w * mark.scale);
  const mh = Math.round(mw * (s.h / s.w));
  const { x, y } = placeMark(w, h, mw, mh, mark.position);
  ctx.save();
  ctx.globalAlpha = mark.opacity ?? 1;
  ctx.drawImage(img, x, y, mw, mh);
  ctx.restore();
}

export type Rendered = { blob: Blob; width: number; height: number };

/**
 * Zmniejsza zdjęcie do limitu (nigdy nie powiększa) i opcjonalnie nakłada
 * znak wodny oraz stempel. Wynik zawsze w JPEG.
 */
export async function renderPhoto(
  source: Blob,
  opts: { maxWidth: number; maxHeight: number; watermark?: Mark | null; stamp?: Mark | null },
): Promise<Rendered> {
  const img = await decode(source);
  const { w: sw, h: sh } = sizeOf(img);
  if (!sw || !sh) throw new Error("Pusty albo uszkodzony plik zdjęcia.");

  const ratio = Math.min(1, opts.maxWidth / sw, opts.maxHeight / sh);
  const width = Math.round(sw * ratio);
  const height = Math.round(sh * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Przeglądarka nie obsługuje obróbki zdjęć.");

  // Białe tło: PNG z przezroczystością nie zrobi się czarny po zapisie do JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  if ("close" in img) img.close();

  if (opts.watermark) await drawMark(ctx, width, height, opts.watermark);
  if (opts.stamp) await drawMark(ctx, width, height, { ...opts.stamp, opacity: 1 });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.86),
  );
  if (!blob) throw new Error("Nie udało się zapisać zdjęcia.");
  return { blob, width, height };
}

/**
 * Dwie wersje do wgrania: czysta (tylko zmniejszona) i ze znakiem wodnym.
 * Gdy biuro nie ma znaku wodnego, obie są tym samym plikiem.
 */
export async function preparePhoto(
  file: Blob,
  config: PhotoConfig,
  withStamp = false,
): Promise<{ original: Rendered; marked: Rendered | null }> {
  const size = { maxWidth: config.maxWidth, maxHeight: config.maxHeight };
  const original = await renderPhoto(file, size);
  const stamp = withStamp ? config.stamp : null;
  if (!config.watermark && !stamp) return { original, marked: null };
  const marked = await renderPhoto(file, { ...size, watermark: config.watermark, stamp });
  return { original, marked };
}

/**
 * Wysyłka na podpisany link z paskiem postępu. fetch() nie raportuje postępu
 * wysyłania, dlatego XMLHttpRequest. Format jak w supabase-js (uploadToSignedUrl).
 */
export function uploadToSignedUrl(
  signedUrl: string,
  blob: Blob,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("cacheControl", "31536000");
    body.append("", blob);

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Serwer odrzucił zdjęcie (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Brak połączenia podczas wysyłania zdjęcia."));
    xhr.send(body);
  });
}

/** Rozszerzenie do nazwy pliku w magazynie. */
export function extFor(blob: Blob): string {
  if (blob.type === "image/png") return "png";
  if (blob.type === "image/webp") return "webp";
  if (blob.type === "image/svg+xml") return "svg";
  return "jpg";
}

/** Pobranie pliku z innej domeny na dysk (atrybut download działa tylko w tej samej). */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`Nie udało się pobrać pliku (${res.status}).`);
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
