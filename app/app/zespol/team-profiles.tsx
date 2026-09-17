"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ROLE_LABELS, type UserRole } from "@/lib/types";
import { formatPhone } from "@/lib/format";
import { updateMemberProfile } from "./actions";

export type TeamProfile = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  phone: string | null;
  jobTitle: string | null;
  bio: string | null;
  avatarUrl: string | null;
  /** Prowizje w tym miesiącu; null dla menedżera, który ich nie widzi. */
  commission: number | null;
  callsWeek: number;
  activeOffers: number;
  clients: number;
};

const ROLE_BADGE: Record<UserRole, string> = {
  owner: "bg-amber-100 text-amber-700",
  manager: "bg-violet-100 text-violet-700",
  agent: "bg-slate-100 text-slate-600",
};

/**
 * Karty zespołu: zdjęcie, stanowisko, kontakt i krótki opis w jednym miejscu.
 * CEO może poprawić dane każdemu, każdy inny widzi je tylko do odczytu.
 */
export function TeamProfiles({
  people,
  canEdit,
  currentUserId,
}: {
  people: TeamProfile[];
  canEdit: boolean;
  currentUserId: string;
}) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {people.map((p, i) => (
        <motion.div
          key={p.id}
          layout
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : Math.min(0.2, i * 0.04), duration: 0.25 }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <div className="p-5">
            <div className="flex items-start gap-3">
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatarUrl} alt={p.name} className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg font-bold text-white">
                  {p.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-900">{p.name}</p>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGE[p.role]}`}>
                    {ROLE_LABELS[p.role]}
                  </span>
                  {p.id === currentUserId && <span className="text-xs text-slate-400">(Ty)</span>}
                </div>
                <p className="truncate text-sm text-slate-500">{p.jobTitle ?? "Stanowisko nieuzupełnione"}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {p.phone ? (
                    <a href={`tel:${p.phone}`} className="text-blue-600 hover:underline">
                      {formatPhone(p.phone)}
                    </a>
                  ) : (
                    <span className="text-slate-400">brak telefonu</span>
                  )}
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="truncate text-blue-600 hover:underline">
                      {p.email}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {p.bio && <p className="mt-3 line-clamp-3 text-sm text-slate-600">{p.bio}</p>}

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-center">
              <Stat label="Telefony (7 dni)" value={p.callsWeek} />
              <Stat label="Aktywne oferty" value={p.activeOffers} />
              <Stat label="Klienci" value={p.clients} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <a href={`/app/zespol/${p.id}`} className="text-xs font-medium text-emerald-600 hover:underline">
                Wyniki i szczegóły →
              </a>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(editing === p.id ? null : p.id)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {editing === p.id ? "Zamknij" : "Edytuj profil"}
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {canEdit && editing === p.id && (
                <motion.div
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <EditForm person={p} onDone={() => setEditing(null)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-mono text-base font-semibold text-slate-900">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function EditForm({ person, onDone }: { person: TeamProfile; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState(person.jobTitle ?? "");
  const [phone, setPhone] = useState(person.phone ?? "");
  const [bio, setBio] = useState(person.bio ?? "");

  function save() {
    setError(null);
    start(async () => {
      const res = await updateMemberProfile(person.id, { jobTitle, phone, bio });
      if (res?.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
      <input
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
        maxLength={80}
        placeholder="Stanowisko"
        className={field}
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        maxLength={40}
        placeholder="Telefon"
        className={field}
      />
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
        maxLength={600}
        placeholder="Krótki opis: specjalizacja, dzielnice, doświadczenie."
        className={field}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending ? "Zapisuję..." : "Zapisz"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
        >
          Anuluj
        </button>
      </div>
      <p className="text-[11px] text-slate-400">Zdjęcie profilowe każdy wgrywa sobie sam w Ustawieniach.</p>
    </div>
  );
}

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";
