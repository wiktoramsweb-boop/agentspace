"use client";

import { useFormStatus } from "react-dom";
import { rescoreSession } from "../../trening/actions";

export function RescoreButton({ sessionId }: { sessionId: string }) {
  return (
    <form action={rescoreSession.bind(null, sessionId)}>
      <Inner />
    </form>
  );
}

function Inner() {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending ? "Oceniam..." : "Oceń tę rozmowę"}
      </button>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-400" />
            <p className="font-medium text-slate-900">AI ocenia Twoją rozmowę...</p>
            <p className="mt-1 text-sm text-slate-500">To potrwa kilka sekund.</p>
          </div>
        </div>
      )}
    </>
  );
}
