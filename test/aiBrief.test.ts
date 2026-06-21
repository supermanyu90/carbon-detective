import { describe, it, expect } from "vitest";
import {
  buildAnalystRequest,
  parseAnalystRequest,
  buildUserMessage,
  localFallbackBrief,
  SYSTEM_PROMPT,
  MAX_FINDINGS,
} from "../src/core/aiBrief";
import { CLUES } from "../src/core/clues";
import { impact, severity, type Finding } from "../src/core/audit";

function findingFor(id: string, n = 1): Finding {
  const c = CLUES.find((x) => x.id === id)!;
  return { clue: c, count: n, impact: impact(c, n) };
}

const totals = { co2: 412.7, cost: 9123.4, kwh: 503.2, water: 18400.9, fuel: 0 };

describe("buildAnalystRequest", () => {
  it("rounds figures and carries anonymous fields only", () => {
    const req = buildAnalystRequest("home", "CASE PROVEN", totals, [findingFor("geyseron")]);
    expect(req.totals.co2).toBe(413);
    expect(req.totals.cost).toBe(9123);
    const f = req.findings[0];
    expect(f).toHaveProperty("id");
    expect(f).toHaveProperty("severity");
    // No name, caseNo, or timestamp anywhere in the payload.
    const blob = JSON.stringify(req);
    expect(blob).not.toMatch(/name|caseNo|filed|detective/i);
  });

  it("clamps to MAX_FINDINGS", () => {
    const many = CLUES.filter((c) => c.mode === "home").map((c) => findingFor(c.id));
    const padded = [...many, ...many, ...many];
    const req = buildAnalystRequest("home", "MAJOR FINDINGS", totals, padded);
    expect(req.findings.length).toBeLessThanOrEqual(MAX_FINDINGS);
  });

  it("severity matches the canonical core rule", () => {
    for (const c of CLUES) {
      const req = buildAnalystRequest(c.mode, "X", totals, [findingFor(c.id)]);
      expect(req.findings[0].severity).toBe(severity(c));
    }
  });
});

describe("parseAnalystRequest (server gate)", () => {
  const valid = buildAnalystRequest("home", "CASE PROVEN", totals, [findingFor("geyseron")]);

  it("accepts a well-formed body", () => {
    expect(() => parseAnalystRequest(valid)).not.toThrow();
  });

  it("rejects bad mode, oversized strings, and negative/huge numbers", () => {
    expect(() => parseAnalystRequest({ ...valid, mode: "x" })).toThrow();
    expect(() => parseAnalystRequest({ ...valid, verdict: "z".repeat(100) })).toThrow();
    expect(() =>
      parseAnalystRequest({ ...valid, totals: { ...valid.totals, co2: -1 } }),
    ).toThrow();
    expect(() =>
      parseAnalystRequest({ ...valid, totals: { ...valid.totals, co2: 1e12 } }),
    ).toThrow();
    expect(() => parseAnalystRequest({ ...valid, findings: "nope" })).toThrow();
    expect(() => parseAnalystRequest(null)).toThrow();
  });

  it("caps findings length on untrusted input", () => {
    const flood = Array.from({ length: 200 }, () => valid.findings[0]);
    const parsed = parseAnalystRequest({ ...valid, findings: flood });
    expect(parsed.findings.length).toBeLessThanOrEqual(MAX_FINDINGS);
  });

  it("rejects findings with an invalid severity or oversized fields", () => {
    expect(() =>
      parseAnalystRequest({
        ...valid,
        findings: [{ ...valid.findings[0], severity: "EXTREME" }],
      }),
    ).toThrow();
    expect(() =>
      parseAnalystRequest({
        ...valid,
        findings: [{ ...valid.findings[0], title: "z".repeat(500) }],
      }),
    ).toThrow();
  });
});

describe("prompt + fallback", () => {
  it("system prompt states the estimate/advice boundary", () => {
    expect(SYSTEM_PROMPT).toMatch(/estimate/i);
    expect(SYSTEM_PROMPT).toMatch(/not.*advice|not meter/i);
  });

  it("user message is deterministic and lists findings", () => {
    const req = buildAnalystRequest("class", "MINOR LEAKS", totals, [
      findingFor("c_corridor"),
    ]);
    const a = buildUserMessage(req);
    const b = buildUserMessage(req);
    expect(a).toBe(b);
    expect(a).toMatch(/classroom\/office/);
    expect(a).toMatch(/kg CO₂/);
  });

  it("local fallback handles both empty and populated audits", () => {
    const empty = buildAnalystRequest(
      "home",
      "SPOTLESS",
      { co2: 0, cost: 0, kwh: 0, water: 0, fuel: 0 },
      [],
    );
    expect(localFallbackBrief(empty)).toMatch(/no waste/i);
    const req = buildAnalystRequest("home", "CASE PROVEN", totals, [findingFor("geyseron")]);
    expect(localFallbackBrief(req)).toMatch(/estimate/i);
  });
});
