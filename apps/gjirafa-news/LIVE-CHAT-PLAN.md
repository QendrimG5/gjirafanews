# Live Chat — Real-Time Implementation Plan

## Overview

Real-time multi-user live chat on the homepage. Users type messages, everyone sees them instantly via WebSocket. Messages are sent through a POST API, which broadcasts to all connected WS clients.

---

## Architecture

```
┌─────────────┐   POST /api/live-chat/send   ┌──────────────────┐
│  Browser A   │ ──────────────────────────▶  │  Next.js API      │
│  (sends msg) │                              │  Route Handler    │
└─────────────┘                               │                   │
                                              │  Pushes message   │
┌─────────────┐   WebSocket connection        │  to in-memory     │
│  Browser B   │ ◀─────────────────────────── │  subscriber list  │
│  (reads msg) │                              │                   │
└─────────────┘                               └──────────────────┘
                                                       ▲
┌─────────────┐   WebSocket connection                 │
│  Browser C   │ ◀─────────────────────────────────────┘
│  (reads msg) │
└─────────────┘
```

**Flow:**
1. Client opens a WebSocket connection to `/api/live-chat/ws`
2. Client sends a message via `POST /api/live-chat/send`
3. POST handler validates the message, stores it in memory, and broadcasts it to all connected WebSocket clients
4. Every connected client receives the message in real-time

---

## Why POST + WebSocket (not WS for sending)?

- POST gives us request validation, rate limiting, and auth middleware for free
- WebSocket is read-only — simpler protocol, no bidirectional message parsing
- Easier to add features later (moderation, persistence, analytics)
- Matches the existing SSE chat pattern in the codebase

---

## File Structure

```
apps/gjirafa-news/
├── app/
│   └── api/
│       └── live-chat/
│           ├── send/route.ts        ← POST: validate + broadcast message
│           └── ws/route.ts          ← GET: WebSocket upgrade endpoint
├── components/
│   └── live-chat/
│       ├── types.ts                 ← LiveMessage, LiveChatContextValue
│       ├── use-live-chat.ts         ← useLiveChat hook (WS + POST logic)
│       ├── live-chat-context.tsx    ← Context provider
│       ├── live-chat-header.tsx     ← Header with online count
│       ├── live-chat-body.tsx       ← Message list
│       ├── live-chat-input.tsx      ← Input + send button
│       └── index.tsx                ← LiveChat wrapper (composes all)
├── lib/
│   └── live-chat-store.ts          ← In-memory message store + subscriber set
└── packages/types/src/index.ts      ← Add LiveMessage type
```

---

## Step-by-Step Implementation

### Step 1: Types

**`components/live-chat/types.ts`**

```ts
export interface LiveMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface LiveChatContextValue {
  messages: LiveMessage[];
  onlineCount: number;
  connected: boolean;
  sendMessage: (text: string, username: string) => Promise<void>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}
```

---

### Step 2: In-Memory Store + Pub/Sub

**`lib/live-chat-store.ts`**

Server-side singleton that holds:
- `messages: LiveMessage[]` — last 100 messages (ring buffer)
- `subscribers: Set<WritableStreamDefaultWriter>` — connected WS clients
- `broadcast(msg)` — writes to every subscriber
- `addSubscriber(writer)` / `removeSubscriber(writer)`

```ts
import type { LiveMessage } from "@/components/live-chat/types";

const MAX_MESSAGES = 100;

class LiveChatStore {
  messages: LiveMessage[] = [];
  subscribers = new Set<(msg: string) => void>();

  addMessage(msg: LiveMessage) {
    this.messages.push(msg);
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
    this.broadcast(msg);
  }

  broadcast(msg: LiveMessage) {
    const data = JSON.stringify(msg);
    for (const send of this.subscribers) {
      try { send(data); } catch { this.subscribers.delete(send); }
    }
  }

  subscribe(send: (msg: string) => void) {
    this.subscribers.add(send);
    return () => this.subscribers.delete(send);
  }

  getRecent(): LiveMessage[] {
    return [...this.messages];
  }

  get onlineCount(): number {
    return this.subscribers.size;
  }
}

// Singleton — survives across API route invocations in dev/prod
export const liveChatStore = new LiveChatStore();
```

---

### Step 3: WebSocket API Route

**`app/api/live-chat/ws/route.ts`**

Next.js 16 does not natively support WebSocket upgrades in API routes. Two options:

**Option A — Use SSE instead of raw WebSocket (recommended for Next.js)**

Since Next.js API routes run as serverless/edge functions, true WebSocket upgrade is not supported out of the box. Use SSE (Server-Sent Events) as the push channel — same real-time behavior, zero extra dependencies.

```ts
// GET /api/live-chat/ws — SSE stream for receiving messages
export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send recent messages as initial payload
      const recent = liveChatStore.getRecent();
      controller.enqueue(
        encoder.encode(`event: init\ndata: ${JSON.stringify(recent)}\n\n`)
      );

      // Send current online count
      controller.enqueue(
        encoder.encode(`event: online\ndata: ${JSON.stringify({ count: liveChatStore.onlineCount + 1 })}\n\n`)
      );

      // Subscribe to new messages
      const unsubscribe = liveChatStore.subscribe((data) => {
        controller.enqueue(
          encoder.encode(`event: message\ndata: ${data}\n\n`)
        );
      });

      // Subscribe to online count changes
      const unsubOnline = liveChatStore.subscribeOnline((count) => {
        controller.enqueue(
          encoder.encode(`event: online\ndata: ${JSON.stringify({ count })}\n\n`)
        );
      });

      // Cleanup on disconnect
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(interval);
          unsubscribe();
          unsubOnline();
        }
      }, 15000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
```

**Option B — Custom Node server with `ws` package**

Only needed if you require true bidirectional WebSocket. Requires `server.ts` + `ws` npm package. More complex, not recommended unless needed.

**Recommendation: Option A (SSE).** It matches the existing codebase patterns, needs no extra dependencies, and works with Next.js serverless/edge. The plan below uses Option A.

---

### Step 4: POST API — Send Message

**`app/api/live-chat/send/route.ts`**

```ts
import { NextRequest } from "next/server";
import { liveChatStore } from "@/lib/live-chat-store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, username } = body;

  if (!text?.trim() || !username?.trim()) {
    return Response.json({ error: "text and username required" }, { status: 400 });
  }

  if (text.length > 500) {
    return Response.json({ error: "Message too long (max 500)" }, { status: 400 });
  }

  const message = {
    id: crypto.randomUUID(),
    username: username.trim(),
    text: text.trim(),
    timestamp: Date.now(),
  };

  liveChatStore.addMessage(message);

  return Response.json({ ok: true, message });
}
```

---

### Step 5: `useLiveChat` Hook

**`components/live-chat/use-live-chat.ts`**

Manages:
- EventSource connection to `/api/live-chat/ws`
- Receiving messages + online count from SSE stream
- Sending messages via `POST /api/live-chat/send`
- Auto-reconnection on disconnect
- Auto-scroll

```ts
"use client";

export function useLiveChat(username: string) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/live-chat/ws");
    eventSourceRef.current = es;

    es.addEventListener("init", (e) => {
      setMessages(JSON.parse(e.data));
      setConnected(true);
    });

    es.addEventListener("message", (e) => {
      const msg: LiveMessage = JSON.parse(e.data);
      setMessages((prev) => [...prev, msg]);
    });

    es.addEventListener("online", (e) => {
      setOnlineCount(JSON.parse(e.data).count);
    });

    es.onerror = () => setConnected(false);
    es.onopen = () => setConnected(true);

    return () => es.close();
  }, []);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    await fetch("/api/live-chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, username }),
    });
  }, [username]);

  return { messages, onlineCount, connected, sendMessage, scrollRef };
}
```

---

### Step 6: Context + Provider

**`components/live-chat/live-chat-context.tsx`**

```ts
const LiveChatContext = createContext<LiveChatContextValue | null>(null);

export function LiveChatProvider({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const chat = useLiveChat(username);
  return <LiveChatContext value={chat}>{children}</LiveChatContext>;
}

export function useLiveChatContext() {
  const ctx = useContext(LiveChatContext);
  if (!ctx) throw new Error("useLiveChatContext must be used within LiveChatProvider");
  return ctx;
}
```

---

### Step 7: UI Components

**`live-chat-header.tsx`** — Title, online count badge, connection status dot

**`live-chat-body.tsx`** — Message list with:
- Username colored consistently (hash-based color)
- Timestamp
- Current user's messages aligned right
- Auto-scroll to bottom

**`live-chat-input.tsx`** — Text input + send button, disabled when disconnected

**`index.tsx`** — Composes all inside `LiveChatProvider`:
```tsx
export default function LiveChat({ username }: { username: string }) {
  return (
    <LiveChatProvider username={username}>
      <div className="bg-gn-overlay border-gn-border-light flex h-[520px] flex-col overflow-hidden rounded-2xl border">
        <LiveChatHeader />
        <LiveChatBody />
        <LiveChatInput />
      </div>
    </LiveChatProvider>
  );
}
```

---

### Step 8: Homepage Integration

**`app/page.tsx`**

Add below the article grid:
```tsx
import LiveChat from "@/components/live-chat";

// Inside the return:
<div className="mb-5 mt-8 flex items-center gap-3">
  <h2 className="text-gn-text text-sm font-semibold tracking-wider uppercase">
    Live Chat
  </h2>
  <div className="bg-gn-border-light h-px flex-1" />
</div>
<div className="mb-8">
  <LiveChat username="Anonim" />
</div>
```

For authenticated users, pass `session.name` instead of `"Anonim"`.

---

## Updated `live-chat-store.ts` (Final Version with Online Tracking)

```ts
class LiveChatStore {
  messages: LiveMessage[] = [];
  subscribers = new Set<(msg: string) => void>();
  onlineSubscribers = new Set<(count: number) => void>();

  addMessage(msg: LiveMessage) {
    this.messages.push(msg);
    if (this.messages.length > MAX_MESSAGES) this.messages.shift();
    this.broadcast(msg);
  }

  broadcast(msg: LiveMessage) {
    const data = JSON.stringify(msg);
    for (const send of this.subscribers) {
      try { send(data); } catch { this.subscribers.delete(send); }
    }
  }

  subscribe(send: (msg: string) => void) {
    this.subscribers.add(send);
    this.notifyOnline();
    return () => { this.subscribers.delete(send); this.notifyOnline(); };
  }

  subscribeOnline(cb: (count: number) => void) {
    this.onlineSubscribers.add(cb);
    return () => this.onlineSubscribers.delete(cb);
  }

  notifyOnline() {
    const count = this.subscribers.size;
    for (const cb of this.onlineSubscribers) {
      try { cb(count); } catch { this.onlineSubscribers.delete(cb); }
    }
  }

  getRecent() { return [...this.messages]; }
  get onlineCount() { return this.subscribers.size; }
}
```

---

## Implementation Order

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 1 | Create types | `components/live-chat/types.ts` | — |
| 2 | Create in-memory store | `lib/live-chat-store.ts` | 1 |
| 3 | Create SSE stream endpoint | `app/api/live-chat/ws/route.ts` | 2 |
| 4 | Create POST send endpoint | `app/api/live-chat/send/route.ts` | 2 |
| 5 | Create `useLiveChat` hook | `components/live-chat/use-live-chat.ts` | 1 |
| 6 | Create context + provider | `components/live-chat/live-chat-context.tsx` | 5 |
| 7 | Create header component | `components/live-chat/live-chat-header.tsx` | 6 |
| 8 | Create body component | `components/live-chat/live-chat-body.tsx` | 6 |
| 9 | Create input component | `components/live-chat/live-chat-input.tsx` | 6 |
| 10 | Create index wrapper | `components/live-chat/index.tsx` | 7, 8, 9 |
| 11 | Add to homepage | `app/page.tsx` | 10 |

---

## Edge Cases to Handle

- **Disconnection:** Auto-reconnect via EventSource (built-in behavior)
- **Message flood:** Rate limit in POST handler (e.g., max 1 msg/sec per user)
- **Memory:** Ring buffer capped at 100 messages
- **Long messages:** Truncate at 500 chars in POST validation
- **XSS:** React auto-escapes text in JSX — safe by default
- **Empty username:** Default to "Anonim"
- **Server restart:** Messages lost (acceptable for in-memory store)
