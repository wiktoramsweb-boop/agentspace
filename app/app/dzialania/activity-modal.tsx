"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "../components/modal";
import { SubmitButton } from "../components/submit-button";
import { createActivity } from "./actions";
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_MAP,
  ACTIVITY_PRIORITIES,
  ACTIVITY_PURPOSES,
  ACTIVITY_STATUSES,
  CALL_DIRECTIONS,
  type ActivityKind,
} from "@/lib/types";

type Lite = { id: string; name: string };

/** Formatuje sekundy jako 00:00:00 (licznik rozmowy jak w ASARI). */
function hhmmss(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function ActivityModal({
  agents,
  clients,
  properties,
  presetClientId,
  presetPropertyId,
  trigger = "button",
}: {
  agents: Lite[];
  clients: Lite[];
  properties: Lite[];
  presetClientId?: string;
  presetPropertyId?: string;
  trigger?: "button" | "plus";
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ActivityKind | null>(null);

  function close() {
    setOpen(false);
    setKind(null);
  }

  return (
    <>
      {trigger === "plus" ? (
        <button
          onClick={() => setOpen(true)}
          aria-label="Dodaj działanie"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white transition hover:bg-emerald-400"
        >
          +
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          + Dodaj działanie
        </button>
      )}

      {open && !kind && (
        <Modal title="Wybierz rodzaj działania" onClose={close} maxWidth="max-w-xl">
          <div className="grid grid-cols-2 gap-4 px-6 py-8">
            {ACTIVITY_KINDS.map((k) => (
              <button
                key={k.value}
                onClick={() => setKind(k.value)}
                className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-7 transition hover:border-slate-300 hover:shadow-md"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white ${k.tile}`}
                >
                  {k.emoji}
                </span>
                <span className="text-center text-sm font-medium text-slate-800">{k.label}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {open && kind && (
        <ActivityForm
          kind={kind}
          agents={agents}
          clients={clients}
          properties={properties}
          presetClientId={presetClientId}
          presetPropertyId={presetPropertyId}
          onBack={() => setKind(null)}
          onClose={close}
        />
      )}
    </>
  );
}

function ActivityForm({
  kind,
  agents,
  clients,
  properties,
  presetClientId,
  presetPropertyId,
  onBack,
  onClose,
}: {
  kind: ActivityKind;
  agents: Lite[];
  clients: Lite[];
  properties: Lite[];
  presetClientId?: string;
  presetPropertyId?: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const meta = ACTIVITY_KIND_MAP[kind];
  const isCall = kind === "polaczenie";
  const purposes = ACTIVITY_PURPOSES.filter((p) => p.kinds.includes(kind));

  const [assignees, setAssignees] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Licznik rozmowy: agent klika Start przy odebraniu i Stop po zakończeniu.
  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5);

  return (
    <Modal title={`Dodawanie: ${meta.label.toLowerCase()}`} onClose={onClose} maxWidth="max-w-3xl">
      <form action={createActivity} className="flex min-h-0 flex-1 flex-col">
        <input type="hidden" name="kind" value={kind} />
        {assignees.map((id) => (
          <input key={id} type="hidden" name="assignee_ids" value={id} />
        ))}
        <input type="hidden" name="duration_s" value={seconds} />

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Cel + temat */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Cel</Label>
              <select name="purpose" className={inp} defaultValue={purposes[0]?.value ?? ""}>
                <option value="">nie podano</option>
                {purposes.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>
                Temat <span className="text-red-500">*</span>
              </Label>
              <input
                name="subject"
                required
                placeholder={isCall ? "np. Pozysk ul. Warmijska" : "np. Prezentacja Sołtysowska"}
                className={inp}
              />
            </div>
          </div>

          {/* Przypisani agenci */}
          <Section icon="👤" title="Przypisane do">
            <div className="flex flex-wrap gap-2">
              {assignees.map((id) => {
                const a = agents.find((x) => x.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-2.5 py-1 text-sm text-blue-700"
                  >
                    {a?.name ?? "Agent"}
                    <button
                      type="button"
                      onClick={() => setAssignees((p) => p.filter((x) => x !== id))}
                      aria-label="Usuń"
                      className="text-blue-500 hover:text-blue-800"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
            <select
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v && !assignees.includes(v)) setAssignees((p) => [...p, v]);
              }}
              className={inp}
            >
              <option value="">Dodaj agenta…</option>
              {agents
                .filter((a) => !assignees.includes(a.id))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
            <p className="text-xs text-slate-400">Puste = działanie przypisane do Ciebie.</p>
          </Section>

          {/* Rozmowa (tylko połączenie) */}
          {isCall && (
            <Section icon="📞" title="Rozmowa">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Rodzaj rozmowy</Label>
                  <select name="call_direction" className={inp} defaultValue="wychodzaca">
                    {CALL_DIRECTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Priorytet</Label>
                  <select name="priority" className={inp} defaultValue="normalny">
                    {ACTIVITY_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex-1">
                  <Label>Początek rozmowy</Label>
                  <div className="flex gap-2">
                    <input type="date" name="due_date" defaultValue={today} className={inp} />
                    <input type="time" name="due_time" defaultValue={nowTime} className={inp} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                    {hhmmss(seconds)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRunning((r) => !r)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
                      running ? "bg-red-500 hover:bg-red-400" : "bg-blue-500 hover:bg-blue-400"
                    }`}
                  >
                    {running ? "■ Stop" : "▶ Start"}
                  </button>
                </div>
              </div>
            </Section>
          )}

          {/* Harmonogram (dla nie-rozmów) */}
          {!isCall && (
            <Section icon="📅" title="Harmonogram">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Data</Label>
                  <input type="date" name="due_date" defaultValue={today} className={inp} />
                </div>
                <div>
                  <Label>Godzina</Label>
                  <input type="time" name="due_time" defaultValue="09:00" className={inp} />
                </div>
                <div>
                  <Label>Priorytet</Label>
                  <select name="priority" className={inp} defaultValue="normalny">
                    {ACTIVITY_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Section>
          )}

          {/* Opis */}
          <Section icon="📝" title="Opis">
            <textarea
              name="description"
              rows={4}
              placeholder="Co ustalono, co dalej…"
              className={inp}
            />
          </Section>

          {/* Powiązania */}
          <Section icon="🔗" title="Powiązane z">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Klient</Label>
                <select name="client_id" className={inp} defaultValue={presetClientId ?? ""}>
                  <option value="">brak</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Nieruchomość</Label>
                <select name="property_id" className={inp} defaultValue={presetPropertyId ?? ""}>
                  <option value="">brak</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Section>

          {/* Status */}
          <div className="sm:w-1/2">
            <Label>Status</Label>
            <select name="status" className={inp} defaultValue="zaplanowane">
              {ACTIVITY_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stopka jak w ASARI */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-t border-slate-200 px-6 py-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="include_in_report"
              value="1"
              className="h-4 w-4 accent-emerald-500"
            />
            Uwzględnij w raporcie aktywności
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Zmień rodzaj
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Anuluj
            </button>
            <SubmitButton
              pendingText="Zapisuję…"
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
            >
              Zapisz i zamknij
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}

const inp =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm text-slate-500">{children}</label>;
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span>{icon}</span>
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
