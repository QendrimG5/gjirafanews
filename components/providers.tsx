"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { makeStore, AppStore } from "@/lib/store/store";

// This component wraps the app with two providers:
//
// 1. Redux Provider – manages client-only state (the auth slice: who's logged
//    in, isAuthenticated flag). This state is synchronous and lives entirely
//    in the browser — no network requests involved.
//
// 2. QueryClientProvider (TanStack Query) – manages server state. Every
//    `useQuery` / `useMutation` hook in the app reads from and writes to the
//    QueryClient's cache. It handles fetching, caching, background refetching,
//    and cache invalidation automatically.
//
// Both are initialised once per page load with useRef to avoid recreating them
// on every render (important for Next.js where the root layout re-renders on
// navigation).

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          // Don't refetch when the browser tab regains focus — avoids
          // unnecessary requests during development and for a news site
          // where data freshness is handled by explicit invalidation.
          refetchOnWindowFocus: false,
          // Keep cached data for 5 minutes before marking it stale.
          // Individual hooks can override this (e.g. categories use 10 min).
          staleTime: 5 * 60 * 1000,
        },
      },
    });
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <Provider store={storeRef.current}>{children}</Provider>
    </QueryClientProvider>
  );
}
