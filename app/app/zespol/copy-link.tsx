"use client";

import { useState } from "react";
import { useToast } from "../components/toast";

export function CopyLink({
  link,
  label = "Kopiuj link",
  compact,
}: {
  link: string;
  label?: string;
  compact?: boolean;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast("Skopiowano link zaproszenia");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Nie udało się skopiować", "error");
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={copy}
        className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
      >
        {copied ? "Skopiowano ✓" : label}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5">
      <span className="min-w-0 flex-1 truncate px-2 text-xs text-zinc-400">{link}</span>
      <button
        type="button"
        onClick={copy}
        className="flex-shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
      >
        {copied ? "Skopiowano ✓" : label}
      </button>
    </div>
  );
}
