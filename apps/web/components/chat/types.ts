export type ChatState = "idle" | "thinking" | "generating" | "done";

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  state: ChatState;
}

export interface ChatConfig {
  categoryId: string;
  categoryName: string;
}

export interface ChatContextValue {
  messages: Message[];
  input: string;
  streaming: boolean;
  config: ChatConfig;
  setInput: (value: string) => void;
  sendMessage: (text: string) => void;
  stopStreaming: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}
