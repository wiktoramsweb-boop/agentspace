"use client";

import { useState } from "react";
import { Modal } from "../components/modal";
import { SubmitButton } from "../components/submit-button";
import { ACTIVITY_ICONS } from "../components/icons";
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

type ClientLite = { id: string; name: string; phone?: string | null };
type Lite = { id: string; name: string };

export function ActivityModal({
  agents,
  clients,
  properties,
  presetClientId,
  presetPropertyId,
  trigger = "button",
}: {
  agents: Lite[];
  clients: ClientLite[];
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
            {ACTIVITY_KINDS.map((k) => {
              const Icon = ACTIVITY_ICONS[k.value];
              return (
                <button
                  key={k.value}
                  onClick={() => setKind(k.value)}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-7 transition hover:border-slate-300 hover:shadow-md"
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${k.tile}`}
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="text-center text-sm font-medium text-slate-800">{k.label}</span>
                </button>
              );
            })}
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
  clients: ClientLite[];
  properties: Lite[];
  presetClientId?: string;
  presetPropertyId?: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const meta = ACTIVITY_KIND_MAP[kind];
  const Icon = ACTIVITY_ICONS[kind];
  const isCall = kind === "polaczenie";
  const purposes = ACTIVITY_PURPOSES.filter((p) => p.kinds.includes(kind));

  const [assignees, setAssignees] = useState<string[]>([]);
  const [clientId, setClientId] = useState(presetClientId ?? "");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Wybór klienta z bazy uzupełnia dane kontaktowe - agent nie przepisuje ręcznie.
  function pickClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (c) {
      setContactName(c.name);
      if (c.phone) setContactPhone(c.phone);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5);

  return (
    <Modal title={`Nowe: ${meta.label.toLowerCase()}`} onClose={onClose} maxWidth="max-w-3xl">
      <form action={createActivity} className="flex min-h-0 flex-1 flex-col">
        <input type="hidden" name="kind" value={kind} />
        {assignees.map((id) => (
          <input key={id} type="hidden" name="assignee_ids" value={id} />
        ))}

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Nagłówek rodzaju */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${meta.tile}`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-slate-700">{meta.label}</p>
            <button
              type="button"
              onClick={onBack}
              className="ml-auto text-xs text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              zmień rodzaj
            </button>
          </div>

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

          {/* Dane kontaktowe - sedno wyszukiwania po numerze */}
          <Section title="Z kim">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Imię i nazwisko</Label>
                <input
                  name="contact_name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="np. Marcin Nowak"
                  className={inp}
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <input
                  name="contact_phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="600 100 200"
                  inputMode="tel"
                  className={inp}
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <input name="contact_email" type="email" placeholder="marcin@example.pl" className={inp} />
              </div>
            </div>
            <div>
              <Label>Klient z bazy (opcjonalnie)</Label>
              <select
                name="client_id"
                value={clientId}
                onChange={(e) => pickClient(e.target.value)}
                className={inp}
              >
                <option value="">nie wybrano</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` (${c.phone})` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-400">
                Wybór klienta uzupełni imię i telefon. Numer zapisujemy zawsze, żeby dało się później
                wyszukać, czy ktoś już pod niego dzwonił.
              </p>
            </div>
          </Section>

          {/* Szczegóły */}
          <Section title="Szczegóły">
            <div className="grid gap-3 sm:grid-cols-3">
              {isCall && (
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
              )}
              <div>
                <Label>Status</Label>
                <select name="status" className={inp} defaultValue="wykonane">
                  {ACTIVITY_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Data</Label>
                <input type="date" name="due_date" defaultValue={today} className={inp} />
              </div>
              <div>
                <Label>Godzina</Label>
                <input type="time" name="due_time" defaultValue={nowTime} className={inp} />
              </div>
            </div>
          </Section>

          {/* Opis */}
          <Section title="Co ustalono">
            <textarea
              name="description"
              rows={5}
              placeholder="O czym rozmawialiście, co dalej, kiedy kolejny kontakt…"
              className={inp}
            />
            <p className="text-xs text-slate-400">
              To pole czyta agent, który za kilka miesięcy zadzwoni pod ten sam numer. Warto opisać konkret.
            </p>
          </Section>

          {/* Powiązania i przypisanie */}
          <Section title="Powiązania">
            <div>
              <Label>Nieruchomość (opcjonalnie)</Label>
              <select name="property_id" className={inp} defaultValue={presetPropertyId ?? ""}>
                <option value="">brak</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Przypisane do</Label>
              <div className="mb-2 flex flex-wrap gap-2">
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
              <p className="mt-1.5 text-xs text-slate-400">Puste = działanie przypisane do Ciebie.</p>
            </div>
          </Section>
        </div>

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
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Anuluj
            </button>
            <SubmitButton
              pendingText="Zapisuję…"
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
            >
              Zapisz działanie
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
