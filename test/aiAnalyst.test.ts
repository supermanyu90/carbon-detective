import { describe, it, expect, afterEach, vi } from "vitest";
import { runAnalyst } from "../src/lib/aiAnalyst";
import { impact, type Finding } from "../src/core/audit";
import { CLUES } from "../src/core/clues";

const totals = { co2: 412, cost: 9123, kwh: 503, water: 18400, fuel: 0 };

function findingFor(id: string, n = 1): Finding {
  const c = CLUES.find((x) => x.id === id)!;
  return { clue: c, count: n, impact: impact(c, n) };
}

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      c.close();
    },
  });
}

afterEach(() => vi.restoreAllMocks());

describe("runAnalyst()", () => {
  it("streams the AI response and reports source 'ai'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, body: streamOf(["Switch off ", "the geyser."]) }),
    );
    const tokens: string[] = [];
    const res = await runAnalyst("home", "CASE PROVEN", totals, [findingFor("geyseron")], {
      onToken: (t) => tokens.push(t),
    });
    expect(res.source).toBe("ai");
    expect(res.text).toBe("Switch off the geyser.");
    expect(tokens[tokens.length - 1]).toBe("Switch off the geyser.");
  });

  it("falls back to the on-device brief on an HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, body: null }));
    const res = await runAnalyst("home", "CASE PROVEN", totals, [findingFor("geyseron")]);
    expect(res.source).toBe("local");
    expect(res.text).toMatch(/estimate/i);
  });

  it("falls back when the stream signals an error mid-flight", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, body: streamOf(["partial", "\n[stream-error]"]) }),
    );
    const res = await runAnalyst("home", "CASE PROVEN", totals, [findingFor("geyseron")]);
    expect(res.source).toBe("local");
  });

  it("falls back when the network throws, with an empty audit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const res = await runAnalyst("home", "SPOTLESS", totals, []);
    expect(res.source).toBe("local");
    expect(res.text).toMatch(/no waste/i);
  });
});
