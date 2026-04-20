import { liveChatStore } from "@/lib/live-chat-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      console.log("[HomePage] Client connected — online:", liveChatStore.onlineCount + 1);

      // Send recent chat history
      const recent = liveChatStore.getRecent();
      controller.enqueue(
        encoder.encode(`event: init\ndata: ${JSON.stringify(recent)}\n\n`)
      );

      // Send current online count
      controller.enqueue(
        encoder.encode(
          `event: online\ndata: ${JSON.stringify({ count: liveChatStore.onlineCount + 1 })}\n\n`
        )
      );

      // Subscribe to chat messages
      const unsubChat = liveChatStore.subscribe((data) => {
        try {
          controller.enqueue(
            encoder.encode(`event: chat\ndata: ${data}\n\n`)
          );
        } catch {
          cleanup();
        }
      });

      // Subscribe to online count changes
      const unsubOnline = liveChatStore.subscribeOnline((count) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: online\ndata: ${JSON.stringify({ count })}\n\n`
            )
          );
        } catch {
          unsubOnline();
        }
      });

      // Keepalive every 15s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          console.log("[HomePage] Client disconnected — online:", liveChatStore.onlineCount);
          cleanup();
        }
      }, 15000);

      function cleanup() {
        clearInterval(keepalive);
        unsubChat();
        unsubOnline();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
