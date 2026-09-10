"use client";

import { useEffect, useState } from "react";
import { renderPhoto } from "@/lib/photo-process";

/**
 * Test obróbki zdjęć na stronie podglądu (tylko tryb deweloperski):
 * zmniejszenie do 1600×1200 i nałożenie znaku wodnego na środku.
 * Znak rysujemy tu w locie jako biały napis na przezroczystym tle,
 * czyli dokładnie taki rodzaj pliku, jaki biuro wgrywa jako logo.
 */
export function PhotoPipelineTest() {
  const [out, setOut] = useState<{ url: string; w: number; h: number; kb: number; srcKb: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const c = document.createElement("canvas");
        c.width = 1200;
        c.height = 405;
        const g = c.getContext("2d")!;
        g.fillStyle = "#fff";
        g.font = "bold 220px sans-serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("SPECTRA", 600, 200);
        const wmBlob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/png"));
        const wmUrl = URL.createObjectURL(wmBlob);

        // Źródło jak z telefonu: 4000 × 3000 w JPEG.
        const svg = await fetch("/podglad-wnetrze.svg").then((r) => r.blob());
        const img = new Image();
        img.src = URL.createObjectURL(svg);
        await img.decode();
        const big = document.createElement("canvas");
        big.width = 4000;
        big.height = 3000;
        big.getContext("2d")!.drawImage(img, 0, 0, 4000, 3000);
        const src = await new Promise<Blob>((r) => big.toBlob((b) => r(b!), "image/jpeg", 0.92));
        const res = await renderPhoto(src, {
          maxWidth: 1600,
          maxHeight: 1200,
          watermark: { url: wmUrl, opacity: 0.3, scale: 0.3, position: "center" },
        });
        setOut({
          url: URL.createObjectURL(res.blob),
          w: res.width,
          h: res.height,
          kb: Math.round(res.blob.size / 1024),
          srcKb: Math.round(src.size / 1024),
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  return (
    <div data-testid="photo-pipeline">
      {err && <p data-result="error" className="text-sm text-red-600">{err}</p>}
      {out && (
        <div className="space-y-2">
          <p data-result="ok" className="text-sm text-slate-600">
            Źródło 4000 × 3000, {out.srcKb} KB → wynik {out.w} × {out.h}, {out.kb} KB
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={out.url} alt="Wynik obróbki" className="w-full max-w-xl rounded-xl" />
        </div>
      )}
      {!out && !err && <p className="text-sm text-slate-400">Przetwarzam…</p>}
    </div>
  );
}
