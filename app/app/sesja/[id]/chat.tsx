"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { endSession } from "../../trening/actions";
import type { ChatMessage } from "@/lib/types";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";

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
    if (listening) stop();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    void runTurn(text);
  }

  // Głos - rozpoznawanie mowy PL (darmowe, w przeglądarce)
  const { supported: voiceSupported, listening, error: voiceError, toggle, stop } = useSpeechRecognition(
    (text, isFinal) => {
      if (isFinal) {
        setInput((prev) => (prev ? prev.trim() + " " : "") + text.trim());
      }
    },
  );

  const agentTurns = messages.filter((m) => m.role === "agent").length;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-9rem)]">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 border-b border-zinc-900 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{scenarioTitle}</h1>
          <p className="text-sm text-slate-500">Klient: {personality}</p>
        </div>
        <EndSessionButton sessionId={sessionId} disabled={agentTurns === 0} />
      </div>

      {/* Zadanie - WIDOCZNE cały czas, żeby nie zapomnieć adresu / celu */}
      {brief && (
        <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Twoje zadanie
          </p>
          <p className="text-sm leading-relaxed text-slate-800">{brief}</p>
        </div>
      )}

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
            <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-4 border-t border-slate-200 pt-4">
        {listening && (
          <p className="mb-2 flex items-center gap-2 text-sm text-emerald-600">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Słucham... mów, a tekst pojawi się w polu. Kliknij mikrofon by zakończyć.
          </p>
        )}
        {voiceError && (
          <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">🎤 {voiceError}</p>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggle}
              disabled={streaming}
              title={listening ? "Zakończ mówienie" : "Mów zamiast pisać"}
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-50 ${
                listening
                  ? "border-emerald-400 bg-emerald-500 text-white"
                  : "border-slate-300 bg-slate-100 text-slate-700 hover:border-emerald-500/50 hover:text-slate-900"
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
              </svg>
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Mów..." : "Napisz albo powiedz co mówisz do klienta..."}
            disabled={streaming}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Wyślij
          </button>
        </form>
        {voiceSupported && !listening && (
          <p className="mt-2 text-xs text-slate-500">
            🎤 Możesz mówić zamiast pisać - kliknij mikrofon. Działa najlepiej w Chrome.
          </p>
        )}
        {!voiceSupported && (
          <p className="mt-2 text-xs text-amber-400/80">
            🎤 Ta przeglądarka nie ma wbudowanego dyktowania. Na iPhone dotknij pola tekstowego i użyj
            ikony mikrofonu na klawiaturze iOS. Na komputerze użyj Chrome.
          </p>
        )}
      </div>
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
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-emerald-500/50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Oceniam..." : "Zakończ i oceń"}
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

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAgent = message.role === "agent";
  return (
    <div className={`flex gap-3 ${isAgent ? "flex-row-reverse" : ""}`}>
      <Avatar role={message.role} />
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAgent
            ? "rounded-tr-sm bg-emerald-100 text-emerald-50"
            : "rounded-tl-sm bg-slate-100 text-slate-800"
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
          ? "bg-emerald-500 text-white"
          : "bg-slate-200 text-slate-800"
      }`}
    >
      {role === "agent" ? "Ty" : "K"}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
