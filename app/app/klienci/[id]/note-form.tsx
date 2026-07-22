"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addClientNote } from "../actions";

export function NoteForm({ clientId }: { clientId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = addClientNote.bind(null, clientId);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await boundAction(fd);
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Dodaj notatkę z kontaktu — o czym rozmawialiście, co dalej..."
        className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
      />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Zapisuję..." : "Dodaj notatkę"}
    </button>
  );
}
