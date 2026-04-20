import type { LiveMessage } from "@/components/homepage/types";

const MAX_MESSAGES = 100;

class LiveChatStore {
  messages: LiveMessage[] = [];
  subscribers = new Set<(data: string) => void>();
  onlineSubscribers = new Set<(count: number) => void>();

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
      try {
        send(data);
      } catch {
        this.subscribers.delete(send);
      }
    }
  }

  subscribe(send: (data: string) => void) {
    this.subscribers.add(send);
    this.notifyOnline();
    return () => {
      this.subscribers.delete(send);
      this.notifyOnline();
    };
  }

  subscribeOnline(cb: (count: number) => void) {
    this.onlineSubscribers.add(cb);
    return () => {
      this.onlineSubscribers.delete(cb);
    };
  }

  notifyOnline() {
    const count = this.subscribers.size;
    for (const cb of this.onlineSubscribers) {
      try {
        cb(count);
      } catch {
        this.onlineSubscribers.delete(cb);
      }
    }
  }

  getRecent(): LiveMessage[] {
    return [...this.messages];
  }

  get onlineCount(): number {
    return this.subscribers.size;
  }
}

const g = globalThis as unknown as { __liveChatStore?: LiveChatStore };
if (!g.__liveChatStore) {
  g.__liveChatStore = new LiveChatStore();
}
export const liveChatStore: LiveChatStore = g.__liveChatStore;
