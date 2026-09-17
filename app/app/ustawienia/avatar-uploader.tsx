"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { extFor, uploadToSignedUrl } from "@/lib/photo-process";
import { setAvatar, signAvatarUpload } from "./actions";

/**
 * Zdjęcie profilowe agenta. Trzymamy oryginał bez przeróbek, bo zdjęcia
 * z telefonu są już przycięte, a kadrowanie w przeglądarce psułoby twarze.
 */
export function AvatarUploader({ name, currentUrl }: { name: string; currentUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const shown = preview ?? currentUrl;

  async function upload(file: File) {
    setError(null);
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Wybierz zdjęcie PNG, JPG albo WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Zdjęcie jest większe niż 10 MB.");
      return;
    }
    setBusy(true);
    setProgress(0);
    setPreview(URL.createObjectURL(file));
    try {
      const signed = await signAvatarUpload(extFor(file));
      if (signed.error || !signed.upload) throw new Error(signed.error ?? "Brak linku do wgrania.");
      await uploadToSignedUrl(signed.upload.signedUrl, file, setProgress);
      const res = await setAvatar(signed.upload.path);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Nie udało się wgrać zdjęcia.");
    }
    setBusy(false);
  }

  async function remove() {
    setError(null);
    setBusy(true);
    const res = await setAvatar(null);
    if (!res.ok) setError(res.error);
    else {
      setPreview(null);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-4">
      <motion.div whileHover={{ scale: 1.03 }} className="relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="group relative block h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100"
          aria-label="Zmień zdjęcie profilowe"
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl font-bold text-white">
              {(name || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-slate-900/55 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
            Zmień
          </span>
        </button>
        {busy && (
          <span className="absolute -bottom-1 left-0 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <span
              className="shimmer-bar block h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-[width]"
              style={{ width: `${Math.max(10, Math.round(progress * 100))}%` }}
            />
          </span>
        )}
      </motion.div>

      <div className="min-w-0">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="btn-ink rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50"
          >
            {shown ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
          </button>
          {currentUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              Usuń
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Widoczne w zespole, na karcie klienta i w materiałach dla klienta. Najlepiej kwadratowe, twarz na środku.
        </p>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
