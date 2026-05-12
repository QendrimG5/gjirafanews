"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import type { ArticleWithRelations } from "@gjirafanews/types";
import type { LiveMessage } from "./types";
import { env } from "@/lib/env";

const API_URL = env.NEXT_PUBLIC_API_BASE_URL;
const HUB_URL = `${API_URL}/hubs/chat`;
const HISTORY_URL = `${API_URL}/api/live-chat/messages?limit=100`;

// Server-side ChatMessageDto. CreatedAt is an ISO string; we convert to ms.
type ServerChatMessage = {
  id: string;
  username: string;
  text: string;
  createdAt: string;
  clientId: string | null;
};

function toLiveMessage(m: ServerChatMessage): LiveMessage {
  return {
    id: m.id,
    username: m.username,
    text: m.text,
    timestamp: new Date(m.createdAt).getTime(),
    _clientId: m.clientId ?? undefined,
  };
}

export function useHomePage(
  username: string,
  initialArticles: ArticleWithRelations[]
) {
  const liveArticles = initialArticles;

  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<HubConnection | null>(null);

  // Seed history once on mount.
  useEffect(() => {
    let cancelled = false;
    fetch(HISTORY_URL)
      .then((res) =>
        res.ok ? (res.json() as Promise<ServerChatMessage[]>) : []
      )
      .then((rows) => {
        if (cancelled) return;
        // Server returns newest-first; the chat renders chronologically.
        const ordered = rows.map(toLiveMessage).reverse();
        setMessages((prev) => {
          const optimistic = prev.filter((m) => m._optimistic);
          return [...ordered, ...optimistic];
        });
      })
      .catch(() => {
        // Non-fatal — live events still arrive over the hub.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Open the SignalR hub connection.
  useEffect(() => {
    let cancelled = false;
    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
    connectionRef.current = connection;

    connection.on("chat", (payload: ServerChatMessage) => {
      if (cancelled) return;
      const incoming = toLiveMessage(payload);
      setMessages((prev) => {
        // Reconcile optimistic placeholder if this is our own send echoing back.
        if (incoming._clientId) {
          const idx = prev.findIndex(
            (m) => m._optimistic && m._clientId === incoming._clientId,
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...incoming, _optimistic: false };
            return next;
          }
        }
        // Plain dedup by server id (covers reconnect replays).
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    });

    connection.on("online", (count: number) => {
      if (cancelled) return;
      setOnlineCount(count);
    });

    connection.onreconnecting(() => setConnected(false));
    connection.onreconnected(() => setConnected(true));
    connection.onclose(() => {
      if (!cancelled) setConnected(false);
    });

    connection
      .start()
      .then(() => {
        if (!cancelled) setConnected(true);
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });

    return () => {
      cancelled = true;
      if (connection.state !== HubConnectionState.Disconnected) {
        void connection.stop();
      }
      if (connectionRef.current === connection) {
        connectionRef.current = null;
      }
    };
  }, []);

  // Auto-scroll to newest.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) {
        return;
      }

      const clientId = crypto.randomUUID();
      const optimistic: LiveMessage = {
        id: clientId,
        username,
        text: text.trim(),
        timestamp: Date.now(),
        _optimistic: true,
        _clientId: clientId,
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        await connection.invoke<ServerChatMessage>("Send", {
          username,
          text: text.trim(),
          clientId,
        });
        // The "chat" broadcast that follows will swap the optimistic placeholder
        // for the server-confirmed message.
      } catch {
        // Roll back the optimistic bubble so the user sees their send failed.
        setMessages((prev) => prev.filter((m) => m._clientId !== clientId));
      }
    },
    [username],
  );

  return {
    messages,
    onlineCount,
    connected,
    username,
    sendMessage,
    scrollRef,
    liveArticles,
  };
}
