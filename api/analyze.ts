/* =========================================================
   /api/analyze — serverless proxy for the AI Case Analyst
   -----------------------------------------------------------
   Runs on the server (Vercel / Netlify / Cloudflare functions).
   The Anthropic API key lives ONLY here, in an environment
   variable — it is never shipped to the browser.

   Responsibilities:
   - Validate & bound the untrusted request body (parseAnalystRequest).
   - Forward only anonymous audit numbers to Claude.
   - Stream the response back to the client as plain text chunks
     so the UI can render the brief as it arrives.
   - Fail safe: any error returns a 4xx/5xx the client handles by
     showing the deterministic local brief instead.

   Deploy notes: set ANTHROPIC_API_KEY in the host's env. The app
   works fully WITHOUT this endpoint — the client falls back to an
   on-device brief — so the static SPA has no hard backend dependency.
   ========================================================= */
import Anthropic from "@anthropic-ai/sdk";
import {
  parseAnalystRequest,
  buildUserMessage,
  SYSTEM_PROMPT,
} from "../src/core/aiBrief";

export const config = { runtime: "edge" };

const MODEL = "claude-opus-4-8";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // No AI tier configured — tell the client to use its local brief.
    return json({ error: "ai_unavailable" }, 503);
  }

  let request;
  try {
    request = parseAnalystRequest(await req.json());
  } catch (e) {
    return json({ error: "invalid_request", detail: (e as Error).message }, 400);
  }

  const client = new Anthropic({ apiKey: key });
  const encoder = new TextEncoder();

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 512,
      // System prompt is byte-stable across requests → cache it.
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildUserMessage(request) }],
    });

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch {
          // Surface a marker the client treats as "fall back locally".
          controller.enqueue(encoder.encode("\n[stream-error]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (e) {
    const status = e instanceof Anthropic.APIError ? e.status ?? 502 : 502;
    return json({ error: "upstream_error" }, status);
  }
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
