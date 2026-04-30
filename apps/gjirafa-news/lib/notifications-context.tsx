"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5283";
const HUB_URL = `${API_URL}/hubs/notifications`;

const MAX_NOTIFICATIONS = 100;

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
};

type ServerNotification = Notification;

type ConnectionStatus = "disconnected" | "connecting" | "connected";

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  connectedCount: number;
  status: ConnectionStatus;
  markAllRead: () => void;
  clear: () => void;
  sendTest: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const connectionRef = useRef<HubConnection | null>(null);
  // Tracks every id we've already placed into `notifications`. Lets the live
  // SignalR handler decide whether an arrival is genuinely new (bump unread)
  // or a repeat of something the seed-fetch already delivered.
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Seed from the server-side log so visitors see history that arrived before
  // they connected.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/notifications?limit=50`)
      .then((res) => (res.ok ? (res.json() as Promise<ServerNotification[]>) : []))
      .then((items) => {
        if (cancelled || items.length === 0) return;
        const fresh = items.filter((i) => !seenIdsRef.current.has(i.id));
        if (fresh.length === 0) return;
        for (const i of fresh) seenIdsRef.current.add(i.id);
        setNotifications((prev) =>
          [...fresh, ...prev].slice(0, MAX_NOTIFICATIONS),
        );
        // Seeded items are historical — don't mark them unread.
      })
      .catch(() => {
        // Initial seed failure isn't fatal — the live connection still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on("notification", (payload: ServerNotification) => {
      if (cancelled) return;
      if (seenIdsRef.current.has(payload.id)) return;
      seenIdsRef.current.add(payload.id);
      setNotifications((prev) =>
        [payload, ...prev].slice(0, MAX_NOTIFICATIONS),
      );
      setUnreadCount((c) => c + 1);
    });

    connection.on("presence", (count: number) => {
      if (cancelled) return;
      setConnectedCount(count);
    });

    connection.onreconnecting(() => setStatus("connecting"));
    connection.onreconnected(() => setStatus("connected"));
    connection.onclose(() => {
      if (!cancelled) setStatus("disconnected");
    });

    setStatus("connecting");
    connection
      .start()
      .then(() => {
        if (!cancelled) setStatus("connected");
      })
      .catch(() => {
        if (!cancelled) setStatus("disconnected");
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

  const markAllRead = useCallback(() => setUnreadCount(0), []);
  const clear = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    seenIdsRef.current.clear();
  }, []);

  const sendTest = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/notifications/test`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(`Failed to send test notification (${res.status})`);
    }
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      connectedCount,
      status,
      markAllRead,
      clear,
      sendTest,
    }),
    [
      notifications,
      unreadCount,
      connectedCount,
      status,
      markAllRead,
      clear,
      sendTest,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within <NotificationsProvider>",
    );
  return ctx;
}
