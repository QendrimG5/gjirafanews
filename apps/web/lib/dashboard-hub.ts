"use client";

import { useEffect, useRef, useState } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

import { env } from "@/lib/env";

const HUB_URL = `${env.NEXT_PUBLIC_API_BASE_URL}/hubs/dashboard`;

export type DashboardLatest = {
  title: string;
  createdAt: string;
};

export type DashboardLatestArticle = {
  id: number;
  title: string;
  publishedAt: string;
};

export type DashboardSnapshot = {
  realtimeUsers: number;
  chatUsers: number;
  articlesCount: number;
  notificationsCount: number;
  chatMessagesCount: number;
  latestNotification: DashboardLatest | null;
  latestArticle: DashboardLatestArticle | null;
  generatedAt: string;
};

export type DashboardStatus = "disconnected" | "connecting" | "connected";

export type UseDashboardResult = {
  snapshot: DashboardSnapshot | null;
  status: DashboardStatus;
};

// Connects to the public DashboardHub. The hub sends one snapshot on connect
// and then on every event-driven or periodic refresh.
export function useDashboard(): UseDashboardResult {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [status, setStatus] = useState<DashboardStatus>("disconnected");
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    let cancelled = false;
    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
    connectionRef.current = connection;

    connection.on("snapshot", (next: DashboardSnapshot) => {
      if (cancelled) return;
      setSnapshot(next);
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

  return { snapshot, status };
}
