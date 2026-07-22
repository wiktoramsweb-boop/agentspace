"use client";

import { useState, useTransition } from "react";
import { updateClientStatus } from "../actions";
import { CLIENT_STATUSES, type ClientStatus } from "@/lib/types";

export function StatusChanger({
  clientId,
  current,
}: {
  clientId: string;
  current: ClientStatus;
}) {
  const [status, setStatus] = useState<ClientStatus>(current);
  const [pending, startTransition] = useTransition();

  function change(next: ClientStatus) {
    setStatus(next);
    startTransition(() => updateClientStatus(clientId, next));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CLIENT_STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => change(s.value)}
          disabled={pending}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            status === s.value
              ? s.color + " ring-1 ring-inset ring-white/20"
              : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
