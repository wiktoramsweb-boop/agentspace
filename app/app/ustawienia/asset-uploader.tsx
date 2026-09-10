"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extFor, uploadToSignedUrl } from "@/lib/photo-process";
import { setAsset, signAssetUpload } from "./company-actions";

/**
 * Wgrywanie jednego pliku biura: logo, znaku wodnego albo stempla.
 * Plik idzie bez przeróbek, bo logo zwykle jest PNG z przezroczystym tłem
 * i zamiana na JPEG zrobiłaby z niego biały prostokąt.
 */
export function AssetUploader({
  kind,
  label,
  currentUrl,
  checker = false,
  hint,
  disabled = false,
}: {
  kind: "logo" | "watermark" | "stamp";
  label: string;
  currentUrl: string | null;
  /** Szachownica pod podglądem: biały znak wodny na białym tle byłby niewidoczny. */
  checker?: boolean;
  hint?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) {
      setError("Wybierz plik PNG, JPG, WEBP albo SVG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Plik jest większy niż 10 MB.");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const signed = await signAssetUpload(kind, extFor(file));
      if (signed.error || !signed.upload) throw new Error(signed.error ?? "Brak linku do wgrania.");
      await uploadToSignedUrl(signed.upload.signedUrl, file, setProgress);
      const res = await setAsset(kind, signed.upload.path);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się wgrać pliku.");
    }
    setBusy(false);
  }

  async function remove() {
    setError(null);
    setBusy(true);
    const res = await setAsset(kind, null);
    if (!res.ok) setError(res.error);
    else router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex h-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 p-3 ${
          checker ? "checker-bg" : "bg-slate-50"
        }`}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-sm text-slate-400">Brak pliku</span>
        )}
      </div>

      {busy && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-[width]"
            style={{ width: `${Math.max(8, Math.round(progress * 100))}%` }}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy || disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          {currentUrl ? "Zmień" : "Wgraj"}
        </button>
        {currentUrl && (
          <button
            type="button"
            disabled={busy || disabled}
            onClick={() => void remove()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Usuń
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
