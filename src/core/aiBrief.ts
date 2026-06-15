/* =========================================================
   AI CASE ANALYST — request building & safety boundary
   -----------------------------------------------------------
   Pure, framework-free, fully unit-tested. Both the browser
   client and the serverless proxy import from here so the
   prompt, the input schema, and the PII boundary are defined
   in exactly one place.

   Responsible-AI guarantees enforced here:
   - No personally identifying data ever leaves the device.
     The detective's name, case number, and timestamps are
     NEVER included in the payload — only anonymous, aggregate
     audit numbers and the clue ids the user already saw.
   - The model is asked for prioritised *actions on the user's
     own findings*, not open-ended chat, which keeps it on-task
     and auditable.
   ========================================================= */
import type { Mode } from "./clues";
import type { Finding, Impact, Severity } from "./audit";

/** The maximum number of findings we forward. Bounds payload size
 *  (cost, latency, abuse surface) regardless of client input. */
export const MAX_FINDINGS = 33;

/** One anonymised finding — the only shape that crosses the wire. */
export interface AnalystFinding {
  id: string;
  zone: string;
  title: string;
  severity: Severity;
  co2: number;
  cost: number;
  count: number;
}

export interface AnalystRequest {
  mode: Mode;
  verdict: string;
  totals: Pick<Impact, "co2" | "cost" | "kwh" | "water" | "fuel">;
  findings: AnalystFinding[];
}

/** Build the wire payload from in-app findings. Strips everything
 *  except anonymous audit numbers, clamps to MAX_FINDINGS, and
 *  rounds figures (no spurious precision, smaller payload). */
export function buildAnalystRequest(
  mode: Mode,
  verdict: string,
  totals: Impact,
  found: Finding[],
): AnalystRequest {
  return {
    mode,
    verdict,
    totals: {
      co2: Math.round(totals.co2),
      cost: Math.round(totals.cost),
      kwh: Math.round(totals.kwh),
      water: Math.round(totals.water),
      fuel: Math.round(totals.fuel),
    },
    findings: found.slice(0, MAX_FINDINGS).map((f) => ({
      id: f.c.id,
      zone: f.c.zone,
      title: f.c.q,
      severity: severityOf(f.im.co2, f.c.water),
      co2: Math.round(f.im.co2),
      cost: Math.round(f.im.cost),
      count: f.n,
    })),
  };
}

// Local copy of the severity rule so this module stays import-light
// for the server bundle. Kept in sync with core/audit.ts via tests.
function severityOf(co2: number, water?: number): Severity {
  const adj = co2 + (water ? water * 0.00045 : 0);
  if (adj >= 100 || (water ?? 0) >= 7000) return "HIGH";
  if (adj >= 25) return "MODERATE";
  return "LOW";
}

/** Validate an untrusted request body (server-side gate). Returns a
 *  typed request or throws with a safe, specific message. */
export function parseAnalystRequest(body: unknown): AnalystRequest {
  if (typeof body !== "object" || body === null) throw new Error("body must be an object");
  const b = body as Record<string, unknown>;
  if (b.mode !== "home" && b.mode !== "class") throw new Error("invalid mode");
  if (typeof b.verdict !== "string" || b.verdict.length > 60)
    throw new Error("invalid verdict");
  const t = b.totals as Record<string, unknown> | undefined;
  if (!t) throw new Error("missing totals");
  const num = (v: unknown): number => {
    const n = typeof v === "number" ? v : NaN;
    if (!Number.isFinite(n) || n < 0 || n > 1e9) throw new Error("invalid total");
    return Math.round(n);
  };
  if (!Array.isArray(b.findings)) throw new Error("findings must be an array");
  const findings: AnalystFinding[] = b.findings.slice(0, MAX_FINDINGS).map((raw) => {
    const f = raw as Record<string, unknown>;
    const str = (v: unknown, max: number): string => {
      if (typeof v !== "string" || v.length > max) throw new Error("invalid field");
      return v;
    };
    const sev = f.severity;
    if (sev !== "HIGH" && sev !== "MODERATE" && sev !== "LOW")
      throw new Error("invalid severity");
    return {
      id: str(f.id, 40),
      zone: str(f.zone, 60),
      title: str(f.title, 240),
      severity: sev,
      co2: num(f.co2),
      cost: num(f.cost),
      count: num(f.count),
    };
  });
  return {
    mode: b.mode,
    verdict: b.verdict,
    totals: { co2: num(t.co2), cost: num(t.cost), kwh: num(t.kwh), water: num(t.water), fuel: num(t.fuel) },
    findings,
  };
}

export const SYSTEM_PROMPT = [
  "You are Inspector Hoot, the AI analyst inside The Carbon Detective — a home and",
  "classroom energy-audit app for an Indian audience. You receive the anonymous,",
  "already-computed findings of one audit and write a short, motivating action plan.",
  "",
  "Rules:",
  "- Ground every claim in the numbers provided. Never invent figures or cite sources.",
  "- Prioritise by impact: lead with the highest-CO₂ findings; mention that small ones",
  "  (e.g. empty phone chargers) are nearly negligible so effort goes where it counts.",
  "- Give concrete, low-cost next steps an ordinary household or school can act on this week.",
  "- All figures are typical annual ESTIMATES, not meter readings or professional advice —",
  "  say so plainly once. Do not provide financial, legal, or safety guarantees.",
  "- Be warm, concise, and concrete. No preamble, no headings, no markdown. 110 words max.",
  "- Currency is Indian rupees (₹). Write for a general reader; avoid jargon.",
].join("\n");

/** The user-turn text. Deterministic given the request (good for caching/tests). */
export function buildUserMessage(req: AnalystRequest): string {
  const scene = req.mode === "home" ? "home" : "classroom/office";
  const lines = req.findings
    .map(
      (f) =>
        `- [${f.severity}] ${f.title}${f.count > 1 ? ` (×${f.count})` : ""} — ` +
        `${f.co2} kg CO₂/yr, ₹${f.cost}/yr (zone: ${f.zone})`,
    )
    .join("\n");
  return [
    `Audit scene: ${scene}. Verdict: ${req.verdict}.`,
    `Totals/year — CO₂: ${req.totals.co2} kg, savings: ₹${req.totals.cost}, ` +
      `electricity: ${req.totals.kwh} kWh, water: ${req.totals.water} L, fuel: ${req.totals.fuel} L.`,
    req.findings.length ? `Confirmed findings (highest impact first):\n${lines}` : "No findings were confirmed.",
    "Write the detective's personalised action plan now.",
  ].join("\n\n");
}

/** Deterministic offline fallback — used when the AI tier is unavailable
 *  (local dev with no key, network failure, rate limit). Keeps the app
 *  fully functional with zero external dependency. */
export function localFallbackBrief(req: AnalystRequest): string {
  if (!req.findings.length) {
    return "No waste confirmed in this sweep — a genuinely tight ship, or one worth a second, sneakier inspection. Re-run the audit in three months to be sure the good habits are holding.";
  }
  const top = req.findings.slice(0, 3);
  const lead = top
    .map((f, i) => `${i + 1}. ${shorten(f.title)} — about ${f.co2} kg CO₂ and ₹${f.cost} a year`)
    .join("; ");
  return (
    `Prime suspects first: ${lead}. Fixing these has the biggest payoff — ` +
    `roughly ${req.totals.co2} kg of avoidable CO₂ and ₹${req.totals.cost} saved a year across the audit. ` +
    `Tiny leaks like idle chargers barely register, so spend your effort on the big ones. ` +
    `These are typical annual estimates, not meter readings — treat them as a guide, then re-audit in three months.`
  );
}

function shorten(q: string): string {
  const s = q.replace(/\?.*$/, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  return s.length > 70 ? s.slice(0, 67) + "…" : s;
}
