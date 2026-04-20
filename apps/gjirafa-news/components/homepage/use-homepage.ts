"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArticleWithRelations } from "@gjirafanews/types";
import type { LiveMessage } from "./types";

export function useHomePage(
  username: string,
  initialArticles: ArticleWithRelations[]
) {
  const liveArticles = initialArticles;

  // ─── Live chat ───
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<Map<string, string>>(new Map());
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    esRef.current?.close();

    const es = new EventSource("/api/live-chat/ws");
    esRef.current = es;

    es.addEventListener("init", (e) => {
      const recent: LiveMessage[] = JSON.parse(e.data);
      setMessages((prev) => {
        const optimistic = prev.filter((m) => m._optimistic);
        return [...recent, ...optimistic];
      });
      setConnected(true);
    });

    es.addEventListener("chat", (e) => {
      const msg: LiveMessage = JSON.parse(e.data);

      setMessages((prev) => {
        let idx = -1;

        if (msg._clientId) {
          idx = prev.findIndex(
            (m) => m._optimistic && m._clientId === msg._clientId
          );
        }

        if (idx === -1) {
          const pending = pendingRef.current;
          for (const [clientId, serverId] of pending) {
            if (serverId === msg.id) {
              pending.delete(clientId);
              idx = prev.findIndex(
                (m) => m._optimistic && m._clientId === clientId
              );
              break;
            }
          }
        }

        if (idx === -1) {
          idx = prev.findIndex(
            (m) => m._optimistic && m.username === msg.username
          );
        }

        if (idx !== -1) {
          const next = [...prev];
          next[idx] = {
            ...prev[idx],
            _optimistic: false,
            _clientId: undefined,
          };
          return next;
        }

        return [...prev, msg];
      });
    });

    es.addEventListener("online", (e) => {
      const { count } = JSON.parse(e.data);
      setOnlineCount(count);
    });

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
  }, []);

  useEffect(() => {
    connect();

    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        console.log("[HomePage] Tab lost focus — closing SSE connection");
        esRef.current?.close();
        setConnected(false);
      } else {
        console.log("[HomePage] Tab regained focus — reconnecting SSE");
        connect();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      esRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

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

      fetch("/api/live-chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          username,
          _clientId: clientId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.message?.id) {
            pendingRef.current.set(clientId, data.message.id);
          }
        })
        .catch(() => {});
    },
    [username]
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
