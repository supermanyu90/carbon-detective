import { describe, it, expect } from "vitest";
import { upsertHistory, previousOf, type ReportSnapshot } from "../src/lib/storage";
import type { Mode } from "../src/core/clues";

const snap = (over: Partial<ReportSnapshot>): ReportSnapshot => ({
  at: "2026-01-01T00:00:00.000Z",
  caseNo: "CASE No. CD-0001",
  mode: "home" as Mode,
  name: "Detective",
  co2: 100,
  cost: 1000,
  kwh: 100,
  water: 0,
  fuel: 0,
  nFound: 3,
  nClues: 20,
  verdict: "CASE PROVEN",
  ...over,
});

describe("upsertHistory()", () => {
  it("appends a new case", () => {
    const h = upsertHistory([], snap({ caseNo: "A" }));
    expect(h).toHaveLength(1);
    expect(h[0].caseNo).toBe("A");
  });

  it("replaces an existing entry with the same caseNo (re-generate)", () => {
    const first = upsertHistory([], snap({ caseNo: "A", co2: 100 }));
    const updated = upsertHistory(first, snap({ caseNo: "A", co2: 50 }));
    expect(updated).toHaveLength(1);
    expect(updated[0].co2).toBe(50);
  });

  it("keeps distinct cases and preserves order (oldest first)", () => {
    let h = upsertHistory([], snap({ caseNo: "A" }));
    h = upsertHistory(h, snap({ caseNo: "B" }));
    expect(h.map((x) => x.caseNo)).toEqual(["A", "B"]);
  });

  it("caps history length at 24", () => {
    let h: ReportSnapshot[] = [];
    for (let i = 0; i < 30; i++) h = upsertHistory(h, snap({ caseNo: `C${i}` }));
    expect(h).toHaveLength(24);
    expect(h[0].caseNo).toBe("C6"); // oldest six dropped
    expect(h[h.length - 1].caseNo).toBe("C29");
  });
});

describe("previousOf()", () => {
  const history = [
    snap({ caseNo: "A", mode: "home", co2: 200 }),
    snap({ caseNo: "B", mode: "class", co2: 300 }),
    snap({ caseNo: "C", mode: "home", co2: 150 }),
  ];

  it("returns the most recent earlier audit of the same scene", () => {
    // Current case is "D" (home) — the latest home entry before it is "C".
    expect(previousOf(history, "home", "D")?.caseNo).toBe("C");
  });

  it("excludes the current case itself", () => {
    // Current case is "C" — the previous home audit is "A".
    expect(previousOf(history, "home", "C")?.caseNo).toBe("A");
  });

  it("respects the scene (mode) filter", () => {
    expect(previousOf(history, "class", "X")?.caseNo).toBe("B");
  });

  it("returns null when there is no comparable prior audit", () => {
    expect(previousOf([], "home", "A")).toBeNull();
    expect(previousOf([snap({ caseNo: "A", mode: "home" })], "home", "A")).toBeNull();
  });
});
