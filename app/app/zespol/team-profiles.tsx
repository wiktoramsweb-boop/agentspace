"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/role";
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
  director: "bg-orange-100 text-orange-700",
  manager: "bg-violet-100 text-violet-700",
  agent: "bg-slate-100 text-slate-600",
  assistant: "bg-sky-100 text-sky-700",
  accountant: "bg-emerald-100 text-emerald-700",
  coordinator: "bg-teal-100 text-teal-700",
  trainee: "bg-zinc-100 text-zinc-600",
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
          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="relative p-5">
            {/* Cała karta prowadzi do osoby: wcześniej trzeba było trafić w mały przycisk. */}
            <Link href={`/app/zespol/${p.id}`} className="absolute inset-0 z-0 rounded-2xl" aria-label={`Otwórz: ${p.name}`} />
            <div className="pointer-events-none relative flex items-center gap-4">
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatarUrl} alt={p.name} className="h-16 w-16 flex-shrink-0 rounded-full object-cover object-[50%_15%] ring-4 ring-slate-50" />
              ) : (
                <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xl font-bold text-white ring-4 ring-slate-50">
                  {p.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-slate-900">
                  {p.name}
                  {p.id === currentUserId && <span className="ml-1.5 text-xs font-normal text-slate-400">(Ty)</span>}
                </p>
                <p className="truncate text-sm text-slate-500">{p.jobTitle || ROLE_LABELS[p.role]}</p>
                <span className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGE[p.role]}`}>{ROLE_LABELS[p.role]}</span>
              </div>
              <svg className="h-5 w-5 flex-shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
            </div>

            <div className="relative mt-4 flex flex-wrap gap-2 text-xs">
              {p.phone && (
                <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-100">
                  <Ikona d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  {formatPhone(p.phone)}
                </a>
              )}
              {p.email && (
                <a href={`mailto:${p.email}`} className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-100">
                  <Ikona d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0-9.75 6.5-9.75-6.5" />
                  <span className="truncate">{p.email}</span>
                </a>
              )}
            </div>

            {p.bio && <p className="pointer-events-none relative mt-3 line-clamp-2 text-sm text-slate-600">{p.bio}</p>}

            <div className="pointer-events-none relative mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 py-2.5 text-center">
              <Stat label="Telefony 7 dni" value={p.callsWeek} />
              <Stat label="Oferty" value={p.activeOffers} />
              <Stat label="Klienci" value={p.clients} />
            </div>

            {canEdit && (
              <div className="relative mt-3 text-right">
                <button
                  type="button"
                  onClick={() => setEditing(editing === p.id ? null : p.id)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {editing === p.id ? "Zamknij" : "Szybka edycja danych"}
                </button>
              </div>
            )}

            <AnimatePresence initial={false}>
              {canEdit && editing === p.id && (
                <motion.div
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative overflow-hidden"
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

function Ikona({ d }: { d: string }) {
  return (
    <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
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
