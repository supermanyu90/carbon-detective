/* Client transport for the AI Case Analyst.
   Streams text from /api/analyze; on ANY failure (no backend in
   local dev, network error, rate limit, server error) it resolves
   with the deterministic on-device brief so the UI never dead-ends. */
import { buildAnalystRequest, localFallbackBrief, type AnalystRequest } from "../core/aiBrief";
import type { Mode } from "../core/clues";
import type { Finding, Impact } from "../core/audit";

export type AnalystSource = "ai" | "local";

export interface AnalystResult {
  text: string;
  source: AnalystSource;
}

export interface StreamCallbacks {
  onToken?: (full: string) => void;
  signal?: AbortSignal;
}

/** Run the analyst. Streams tokens via onToken; resolves with the
 *  final text and which source produced it. */
export async function runAnalyst(
  mode: Mode,
  verdict: string,
  totals: Impact,
  found: Finding[],
  cb: StreamCallbacks = {},
): Promise<AnalystResult> {
  const request = buildAnalystRequest(mode, verdict, totals, found);
  try {
    const text = await streamFromApi(request, cb);
    if (text && !text.includes("[stream-error]")) return { text, source: "ai" };
  } catch {
    /* fall through to local brief */
  }
  const text = localFallbackBrief(request);
  cb.onToken?.(text);
  return { text, source: "local" };
}

async function streamFromApi(request: AnalystRequest, cb: StreamCallbacks): Promise<string> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
    signal: cb.signal,
  });
  if (!res.ok || !res.body) throw new Error(`api ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    cb.onToken?.(full);
  }
  return full.trim();
}
