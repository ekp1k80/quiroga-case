// src/app/api/play-session/stream/route.ts
import { rtdb } from "@/lib/firebaseAdmin";

/**
 * SSE stream para estado de playSession sin polling.
 * GET ?playSessionId=...
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playSessionId = (searchParams.get("playSessionId") ?? "").trim();
  if (!playSessionId) return new Response("Missing playSessionId", { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const ref = rtdb().ref(`playSessions/${playSessionId}`);

      const send = (payload: any) => {
        controller.enqueue(encoder.encode(`event: state\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const onValue = (snap: any) => {
        send(snap.val());
      };

      ref.on("value", onValue);

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
      }, 15000);

      const abort = () => {
        clearInterval(keepAlive);
        ref.off("value", onValue);
        try {
          controller.close();
        } catch {}
      };

      // cerrar si el cliente corta
      // @ts-ignore
      req.signal?.addEventListener?.("abort", abort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
