"use client";

import { useState, useTransition } from "react";
import { setProcessStage, setPropertyOwner, setPropertyOwnerRole, attachNewOwner } from "../actions";
import { OWNER_ROLES, PROCESS_STAGES, type PropertyDealKind } from "@/lib/types";

type ClientLite = { id: string; name: string; phone?: string | null };

/**
 * Pasek etapów obsługi oferty (jak w ASARI). Klikalny - agent przesuwa ofertę
 * jednym kliknięciem, bez wchodzenia w edycję.
 */
export function ProcessBar({
  propertyId,
  stage,
}: {
  propertyId: string;
  stage: string | null;
}) {
  const [pending, start] = useTransition();
  const current = stage ?? "przyjeta";
  const currentIdx = PROCESS_STAGES.findIndex((s) => s.value === current);

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max items-stretch gap-1">
        {PROCESS_STAGES.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <button
              key={s.value}
              onClick={() => start(() => setProcessStage(propertyId, s.value))}
              disabled={pending}
              title={s.label}
              className={`relative flex-1 whitespace-nowrap px-4 py-2.5 text-xs font-medium transition disabled:opacity-60 ${
                i === 0 ? "rounded-l-xl" : ""
              } ${i === PROCESS_STAGES.length - 1 ? "rounded-r-xl" : ""} ${
                active
                  ? "bg-amber-400 text-amber-950"
                  : done
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {s.short}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        Etap obsługi oferty. Kliknij, żeby przesunąć.
      </p>
    </div>
  );
}

/**
 * Właściciel (przy sprzedaży) albo wynajmujący (przy najmie) - z możliwością
 * założenia nowego klienta bez opuszczania karty oferty.
 */
export function OwnerCard({
  propertyId,
  ownerId,
  ownerRole,
  ownerName,
  ownerPhone,
  dealKind,
  clients,
}: {
  propertyId: string;
  ownerId: string | null;
  ownerRole: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  dealKind: PropertyDealKind;
  clients: ClientLite[];
}) {
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const role = ownerRole ?? (dealKind === "wynajem" ? "wynajmujacy" : "wlasciciel");
  const roleLabel = OWNER_ROLES.find((r) => r.value === role)?.label ?? "Właściciel";

  return (
    <div className="space-y-3">
      <div>
        <label className={lbl}>Rola</label>
        <select
          value={role}
          onChange={(e) => start(() => setPropertyOwnerRole(propertyId, e.target.value))}
          disabled={pending}
          className={inp}
        >
          {OWNER_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={lbl}>{roleLabel} (klient z bazy)</label>
        <select
          value={ownerId ?? ""}
          onChange={(e) => start(() => setPropertyOwner(propertyId, e.target.value || null))}
          disabled={pending}
          className={inp}
        >
          <option value="">nie przypisano</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.phone ? ` (${c.phone})` : ""}
            </option>
          ))}
        </select>
      </div>

      {ownerId && ownerName && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="font-medium text-slate-900">{ownerName}</p>
          {ownerPhone && (
            <a href={`tel:${ownerPhone}`} className="text-sm text-blue-600 hover:underline">
              {ownerPhone}
            </a>
          )}
          <a
            href={`/app/klienci/${ownerId}`}
            className="mt-1 block text-xs text-emerald-600 hover:underline"
          >
            Otwórz kartę klienta →
          </a>
        </div>
      )}

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          + Dodaj nowego {roleLabel.toLowerCase()}
        </button>
      ) : (
        <form
          action={attachNewOwner.bind(null, propertyId)}
          className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
        >
          <input type="hidden" name="owner_role" value={role} />
          <input name="owner_name" required placeholder="Imię i nazwisko" className={inp} />
          <input name="owner_phone" placeholder="Telefon" inputMode="tel" className={inp} />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Dodaj i przypisz
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Anuluj
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Klient trafi też do zakładki Klienci - nie trzeba go wpisywać drugi raz.
          </p>
        </form>
      )}
    </div>
  );
}

const lbl = "mb-1.5 block text-sm text-slate-500";
const inp =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none disabled:opacity-60";
