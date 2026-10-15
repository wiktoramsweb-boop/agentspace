"use client";

import { useCallback, useEffect, useState } from "react";
import { licznikCzatu } from "../czat/actions";
import { useNaZywo } from "./na-zywo";

/** Plakietka nieprzeczytanych wiadomości przy pozycji „Czat" w menu. */
export function LicznikCzatu({ userId }: { userId: string }) {
  const [ile, setIle] = useState<number | null>(null);
  const odswiez = useCallback(() => {
    licznikCzatu().then(setIle).catch(() => {});
  }, []);
  useEffect(() => {
    odswiez();
  }, [odswiez]);
  useNaZywo({ kanal: `licznik-czatu-${userId}`, tabela: "chat_messages", onZmiana: odswiez, wlaczony: ile !== null, zapasMs: 45_000 });
  if (!ile) return null;
  return (
    <span className="ml-auto flex min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold leading-5 text-[#06281d]">
      {ile > 99 ? "99+" : ile}
    </span>
  );
}
