"use client";

import { useState } from "react";
import {
  setPropertyStatus,
  deleteProperty,
  setPropertyOwner,
  addPropertyInterest,
  removePropertyInterest,
} from "../actions";
import { PROPERTY_STATUSES, type PropertyStatus } from "@/lib/types";

type ClientLite = { id: string; name: string };

export function StatusBar({
  propertyId,
  status,
}: {
  propertyId: string;
  status: PropertyStatus;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROPERTY_STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => setPropertyStatus(propertyId, s.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            status === s.value
              ? s.color
              : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function OwnerPicker({
  propertyId,
  ownerId,
  clients,
}: {
  propertyId: string;
  ownerId: string | null;
  clients: ClientLite[];
}) {
  return (
    <select
      value={ownerId ?? ""}
      onChange={(e) => setPropertyOwner(propertyId, e.target.value || null)}
      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
    >
      <option value="">— brak właściciela —</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export function InterestAdder({
  propertyId,
  clients,
}: {
  propertyId: string;
  clients: ClientLite[];
}) {
  const [value, setValue] = useState("");

  if (clients.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        Brak innych klientów do dodania.
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
      >
        <option value="">— wybierz klienta —</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          if (value) {
            addPropertyInterest(propertyId, value);
            setValue("");
          }
        }}
        className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
      >
        Dodaj
      </button>
    </div>
  );
}

export function RemoveInterestButton({
  propertyId,
  clientId,
}: {
  propertyId: string;
  clientId: string;
}) {
  return (
    <button
      onClick={() => removePropertyInterest(propertyId, clientId)}
      className="text-zinc-600 transition hover:text-red-400"
      title="Usuń z zainteresowanych"
    >
      ✕
    </button>
  );
}

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-sm text-zinc-500 transition hover:text-red-400"
      >
        Usuń ofertę
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className="text-zinc-400">Na pewno?</span>
      <button
        onClick={() => deleteProperty(propertyId)}
        className="font-medium text-red-400 hover:text-red-300"
      >
        Tak, usuń
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-zinc-500 hover:text-white"
      >
        Anuluj
      </button>
    </span>
  );
}
