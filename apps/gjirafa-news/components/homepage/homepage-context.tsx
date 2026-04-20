"use client";

import { createContext, useContext } from "react";
import type { ArticleWithRelations } from "@gjirafanews/types";
import type { HomePageContextValue } from "./types";
import { useHomePage } from "./use-homepage";

const HomePageContext = createContext<HomePageContextValue | null>(null);

export function HomePageProvider({
  username,
  initialArticles,
  children,
}: {
  username: string;
  initialArticles: ArticleWithRelations[];
  children: React.ReactNode;
}) {
  const value = useHomePage(username, initialArticles);

  return <HomePageContext value={value}>{children}</HomePageContext>;
}

export function useHomePageContext(): HomePageContextValue {
  const ctx = useContext(HomePageContext);
  if (!ctx)
    throw new Error("useHomePageContext must be used within HomePageProvider");
  return ctx;
}
