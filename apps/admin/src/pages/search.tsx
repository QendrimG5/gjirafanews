import { useEffect, useRef, useState } from "react";
import type { ChatSourceArticle, ChatStreamEvent } from "@gjirafanews/api-client";
import { apiClient } from "@/lib/api";

// RAG chat page. The user asks a question; the server embeds it, vector-searches
// `article_embeddings`, and streams a grounded OpenAI Chat Completions answer
// back as SSE events. We render the tokens live as they arrive — no waiting
// for the full response.
//
// State machine per assistant message:
//   placeholder (empty content) → sources arrive → tokens accumulate → done.
// An assistant message can also end early via `error` or via the user clicking
// Stop (which aborts the underlying fetch and ASP.NET cancels the OpenAI call).

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSourceArticle[];
  error?: string;
};

export default function SearchPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever messages change. Smooth scrolling on
  // every token would be jarring; "auto" is snappier and matches what every
  // chat UI does in practice.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" });
  }, [messages]);

  // Clean up an in-flight stream if the user navigates away.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const question = input.trim();
    if (!question || isStreaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    function patch(update: (m: Message) => Message) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? update(m) : m)));
    }

    function onEvent(ev: ChatStreamEvent) {
      switch (ev.type) {
        case "sources":
          patch((m) => ({ ...m, sources: ev.articles }));
          break;
        case "token":
          // Functional update + string append — keeps tokens additive without
          // racing with React 19's automatic batching of state updates.
          patch((m) => ({ ...m, content: m.content + ev.text }));
          break;
        case "error":
          patch((m) => ({ ...m, error: ev.message }));
          break;
        case "done":
          // No-op — the finally block handles teardown.
          break;
      }
    }

    try {
      await apiClient.articles.streamChat({ question, topK: 5 }, onEvent, controller.signal);
    } catch (err: unknown) {
      // Aborts are expected when the user clicks Stop — surface other errors.
      if (controller.signal.aborted) {
        patch((m) => ({ ...m, content: m.content + "\n\n[Stopped]" }));
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        patch((m) => ({ ...m, error: msg }));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter to send, Shift+Enter for newline — standard chat behavior.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-gn-text text-2xl font-bold tracking-tight">Pyet AI</h1>
        <p className="text-gn-text-tertiary mt-1 text-sm">
          RAG mbi artikujt me embedding. Pyetja juaj kthehet ne nje vektor,
          krahasohet me artikujt ne baze, dhe perfundon te OpenAI Chat
          Completions per nje pergjigje te perqendruar — gjithcka ne streaming.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="border-gn-border-light bg-background flex-1 space-y-4 overflow-y-auto rounded-lg border p-4"
      >
        {messages.length === 0 && (
          <EmptyState
            onPick={(q) => setInput(q)}
            disabled={isStreaming}
          />
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isStreaming={isStreaming && m.id === messages[messages.length - 1]?.id}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 shrink-0">
        <div className="border-gn-border-light bg-gn-surface flex items-end gap-2 rounded-lg border p-2">
          <textarea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pyet dicka per artikujt... (Enter = dergo, Shift+Enter = rresht i ri)"
            rows={2}
            disabled={isStreaming}
            className="text-gn-text placeholder:text-gn-text-tertiary flex-1 resize-none bg-transparent text-sm outline-none disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="bg-gn-danger text-gn-text-inverse h-10 shrink-0 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90"
            >
              Ndalo
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-gn-primary text-gn-text-inverse h-10 shrink-0 rounded-md px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Dergo
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-gn-primary text-gn-text-inverse max-w-[80%] rounded-lg px-3.5 py-2 text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex max-w-[90%] flex-col gap-2">
      <div className="border-gn-border-light bg-gn-surface text-gn-text rounded-lg border px-3.5 py-2 text-sm">
        {message.content ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <span className="text-gn-text-tertiary italic">Duke menduar...</span>
        )}
        {isStreaming && message.content && (
          <span className="bg-gn-text ml-0.5 inline-block h-3.5 w-1.5 animate-pulse align-middle" />
        )}
        {message.error && (
          <div className="text-gn-danger bg-gn-danger-muted border-gn-danger/20 mt-2 rounded border p-2 text-xs">
            {message.error}
          </div>
        )}
      </div>
      {message.sources && message.sources.length > 0 && (
        <SourcesPanel sources={message.sources} />
      )}
    </div>
  );
}

function SourcesPanel({ sources }: { sources: ChatSourceArticle[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-gn-border-light bg-gn-overlay rounded-lg border p-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-gn-text-secondary hover:text-gn-text flex w-full items-center justify-between text-xs font-semibold"
      >
        <span>
          {sources.length} burime · klik per {expanded ? "fshehur" : "detaje"}
        </span>
        <span>{expanded ? "−" : "+"}</span>
      </button>
      {!expanded && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sources.map((s) => (
            <span
              key={s.id}
              title={`${s.title} · ${(s.similarity * 100).toFixed(0)}%`}
              className="border-gn-border-light bg-gn-surface text-gn-text-secondary inline-flex max-w-[260px] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
            >
              <span className="text-gn-text font-bold">[{s.rank}]</span>
              <span className="truncate">{s.title}</span>
            </span>
          ))}
        </div>
      )}
      {expanded && (
        <ul className="divide-gn-border-light mt-2 divide-y">
          {sources.map((s) => (
            <li key={s.id} className="py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-gn-text font-semibold">
                  [{s.rank}] {s.title}
                </span>
                <span className="text-gn-text-tertiary shrink-0 tabular-nums">
                  {(s.similarity * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-gn-text-secondary mt-0.5 line-clamp-2">
                {s.summary}
              </p>
              <div className="text-gn-text-tertiary mt-1 flex gap-3">
                {s.category && <span>{s.category}</span>}
                {s.source && <span>{s.source}</span>}
                <span className="tabular-nums">id={s.id}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (q: string) => void;
  disabled: boolean;
}) {
  const samples = [
    "Cilet jane lajmet me te fundit nga politika?",
    "Cfare ka ndodhur ne ekonomi kete jave?",
    "Permblidh lajmet sportive me te rendesishme.",
  ];
  return (
    <div className="text-gn-text-tertiary flex h-full flex-col items-center justify-center gap-3 text-center text-sm">
      <p>Bej nje pyetje per te nisur. Disa shembuj:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {samples.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            disabled={disabled}
            className="border-gn-border-light bg-gn-surface text-gn-text-secondary hover:border-gn-primary hover:text-gn-text rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
