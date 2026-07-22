"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { endSession } from "../../trening/actions";
import type { ChatMessage } from "@/lib/types";

export function SessionChat({
  sessionId,
  initialTranscript,
  scenarioTitle,
  brief,
  personality,
}: {
  sessionId: string;
  initialTranscript: ChatMessage[];
  scenarioTitle: string;
  brief: string;
  personality: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialTranscript);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const openerTriggered = useRef(false);

  // Auto-scroll na dół
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamText]);

  // AI otwiera rozmowę, jeśli transkrypt pusty
  useEffect(() => {
    if (messages.length === 0 && !openerTriggered.current) {
      openerTriggered.current = true;
      void runTurn(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runTurn(agentMessage: string | null) {
    setStreaming(true);
    setStreamText("");

    if (agentMessage) {
      setMessages((m) => [...m, { role: "agent", content: agentMessage }]);
    }

    try {
      const res = await fetch("/api/coach/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, agentMessage: agentMessage ?? "" }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setMessages((m) => [
          ...m,
          { role: "client", content: `[${data.error ?? "Błąd połączenia z AI."}]` },
        ]);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamText(acc);
      }

      setMessages((m) => [...m, { role: "client", content: acc.trim() }]);
      setStreamText("");
    } catch {
      setMessages((m) => [...m, { role: "client", content: "[Błąd sieci. Spróbuj ponownie.]" }]);
    } finally {
      setStreaming(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    void runTurn(text);
  }

  const agentTurns = messages.filter((m) => m.role === "agent").length;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-9rem)]">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 border-b border-zinc-900 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">{scenarioTitle}</h1>
          <p className="text-sm text-zinc-500">Klient: {personality}</p>
        </div>
        <EndSessionButton sessionId={sessionId} disabled={agentTurns === 0} />
      </div>

      {/* Brief collapsible */}
      <details className="mb-4 rounded-xl border border-zinc-900 bg-zinc-900/30 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-zinc-300">Twoje zadanie</summary>
        <p className="mt-2 text-zinc-400">{brief}</p>
      </details>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {streaming && streamText && (
          <MessageBubble message={{ role: "client", content: streamText }} />
        )}
        {streaming && !streamText && (
          <div className="flex gap-3">
            <Avatar role="client" />
            <div className="rounded-2xl rounded-tl-sm bg-zinc-800/60 px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="mt-4 flex gap-2 border-t border-zinc-900 pt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napisz co mówisz do klienta..."
          disabled={streaming}
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Wyślij
        </button>
      </form>
    </div>
  );
}

function EndSessionButton({ sessionId, disabled }: { sessionId: string; disabled: boolean }) {
  const boundEnd = endSession.bind(null, sessionId);
  return (
    <form action={boundEnd}>
      <EndButtonInner disabled={disabled} />
    </form>
  );
}

function EndButtonInner({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        disabled={disabled || pending}
        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Oceniam..." : "Zakończ i oceń"}
      </button>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
            <p className="font-medium text-white">AI ocenia Twoją rozmowę...</p>
            <p className="mt-1 text-sm text-zinc-500">To potrwa kilka sekund.</p>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAgent = message.role === "agent";
  return (
    <div className={`flex gap-3 ${isAgent ? "flex-row-reverse" : ""}`}>
      <Avatar role={message.role} />
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAgent
            ? "rounded-tr-sm bg-emerald-500/15 text-emerald-50"
            : "rounded-tl-sm bg-zinc-800/60 text-zinc-200"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function Avatar({ role }: { role: "agent" | "client" }) {
  return (
    <div
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        role === "agent"
          ? "bg-emerald-500 text-zinc-950"
          : "bg-zinc-700 text-zinc-200"
      }`}
    >
      {role === "agent" ? "Ty" : "K"}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
