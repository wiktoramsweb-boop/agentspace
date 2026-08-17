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
import { useToast } from "../../components/toast";

type ClientLite = { id: string; name: string };

export function StatusBar({
  propertyId,
  status,
}: {
  propertyId: string;
  status: PropertyStatus;
}) {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      {PROPERTY_STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => {
            setPropertyStatus(propertyId, s.value);
            toast(`Status oferty: ${s.label}`);
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            status === s.value
              ? s.color
              : "bg-white text-slate-500 hover:bg-slate-100"
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
  const toast = useToast();
  return (
    <select
      value={ownerId ?? ""}
      onChange={(e) => {
        setPropertyOwner(propertyId, e.target.value || null);
        toast(e.target.value ? "Przypisano właściciela" : "Odłączono właściciela");
      }}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
    >
      <option value="">- brak właściciela -</option>
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
  const toast = useToast();

  if (clients.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Brak innych klientów do dodania.
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
      >
        <option value="">- wybierz klienta -</option>
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
            toast("Dodano zainteresowanego klienta");
          }
        }}
        className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
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
      className="text-slate-400 transition hover:text-red-600"
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
        className="text-sm text-slate-500 transition hover:text-red-600"
      >
        Usuń ofertę
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">Na pewno?</span>
      <button
        onClick={() => deleteProperty(propertyId)}
        className="font-medium text-red-600 hover:text-red-700"
      >
        Tak, usuń
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-slate-500 hover:text-slate-900"
      >
        Anuluj
      </button>
    </span>
  );
}
