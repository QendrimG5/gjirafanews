import { NextRequest } from "next/server";
import { liveChatStore } from "@/lib/live-chat-store";

const URL_REGEX = /https?:\/\/[^\s]+/gi;
const ALLOWED_HOST = "gjirafanews.com";

/** Replace external links with "[link removed]", keep gjirafanews.com links */
function sanitizeLinks(text: string): string {
  return text.replace(URL_REGEX, (url) => {
    try {
      const host = new URL(url).hostname;
      if (host === ALLOWED_HOST || host.endsWith(`.${ALLOWED_HOST}`)) {
        return url;
      }
    } catch {
      // malformed URL — strip it
    }
    return "[link removed]";
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, username, _clientId } = body;

  if (!text?.trim() || !username?.trim()) {
    return Response.json(
      { error: "text and username are required" },
      { status: 400 }
    );
  }

  if (text.length > 500) {
    return Response.json(
      { error: "Message too long (max 500 characters)" },
      { status: 400 }
    );
  }

  const sanitizedText = sanitizeLinks(text.trim());

  const message = {
    id: crypto.randomUUID(),
    username: username.trim(),
    text: sanitizedText,
    timestamp: Date.now(),
    _clientId: _clientId || undefined,
  };

  // Simulate network/processing delay before broadcasting
  await new Promise((resolve) => setTimeout(resolve, 4000));

  liveChatStore.addMessage(message);

  return Response.json({ ok: true, message });
}
