import type { ArticleWithRelations } from "@gjirafanews/types";

export interface LiveMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  _optimistic?: boolean;
  _clientId?: string;
}

export interface HomePageContextValue {
  // Live chat
  messages: LiveMessage[];
  onlineCount: number;
  connected: boolean;
  username: string;
  sendMessage: (text: string) => Promise<void>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  // Live articles
  liveArticles: ArticleWithRelations[];
}
