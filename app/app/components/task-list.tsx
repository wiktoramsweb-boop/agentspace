"use client";

import { useRef, useState, useTransition } from "react";
import { addTask, toggleTask, deleteTask } from "../tasks-actions";
import type { Task } from "@/lib/types";

export function TaskList({ tasks }: { tasks: Task[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  function toggle(task: Task) {
    const next = !(optimistic[task.id] ?? task.is_done);
    setOptimistic((o) => ({ ...o, [task.id]: next }));
    startTransition(() => toggleTask(task.id, next));
  }

  const sorted = [...tasks].sort((a, b) => {
    const ad = optimistic[a.id] ?? a.is_done;
    const bd = optimistic[b.id] ?? b.is_done;
    return Number(ad) - Number(bd);
  });

  return (
    <div>
      <form
        ref={formRef}
        action={async (fd) => {
          await addTask(fd);
          formRef.current?.reset();
        }}
        className="mb-4 flex gap-2"
      >
        <input
          name="title"
          required
          placeholder="Dodaj zadanie na dziś..."
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          +
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-600">
          Brak zadań. Dodaj pierwsze — zaplanuj dzień.
        </p>
      ) : (
        <ul className="space-y-1">
          {sorted.map((task) => {
            const done = optimistic[task.id] ?? task.is_done;
            return (
              <li key={task.id} className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-900/40">
                <button
                  onClick={() => toggle(task)}
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition ${
                    done ? "border-emerald-500 bg-emerald-500" : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  {done && (
                    <svg className="h-3 w-3 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-sm ${done ? "text-zinc-600 line-through" : "text-zinc-200"}`}>
                  {task.title}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
