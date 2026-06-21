import { describe, it, expect } from "vitest";
import { buildCaseFile, caseFileJson, caseFileName } from "../src/lib/caseFile";
import type { Answers } from "../src/core/audit";

const filedAt = new Date("2026-06-21T10:00:00.000Z");

// aclow: 390 kWh (yn) · standby: 48 kWh × 2 (count)
const answers: Answers = {
  aclow: { answered: true, found: true, n: 1 },
  standby: { answered: true, found: true, n: 2 },
  hotfood: { answered: true, found: false, n: 0 },
};

describe("buildCaseFile()", () => {
  it("summarises a home audit using the same core math as the report", () => {
    const cf = buildCaseFile({ mode: "home", answers, detName: "  Verma  ", filedAt });
    expect(cf.scene).toBe("Home");
    expect(cf.detective).toBe("Verma"); // trimmed
    expect(cf.cluesConfirmed).toBe(2);
    expect(cf.annual.electricityKwh).toBe(486); // 390 + 96
    expect(cf.annual.co2Kg).toBe(399); // round(486 * 0.82)
    expect(cf.annual.savingsRupees).toBe(3888); // 486 * 8
    expect(cf.generatedAt).toBe(filedAt.toISOString());
  });

  it("lists findings richest-first with severity and count", () => {
    const cf = buildCaseFile({ mode: "home", answers, detName: "", filedAt });
    expect(cf.findings.map((f) => f.id)).toEqual(["aclow", "standby"]);
    expect(cf.findings[0].severity).toBe("HIGH");
    expect(cf.findings[1].count).toBe(2);
  });

  it("falls back to a default name and the office scene label", () => {
    const cf = buildCaseFile({ mode: "class", answers: {}, detName: "", filedAt });
    expect(cf.detective).toBe("Detective");
    expect(cf.scene).toBe("Classroom / Office");
    expect(cf.cluesConfirmed).toBe(0);
    expect(cf.verdict).toBe("SPOTLESS");
    expect(cf.findings).toEqual([]);
  });
});

describe("caseFileJson() / caseFileName()", () => {
  it("produces JSON that parses back to the same record", () => {
    const input = { mode: "home" as const, answers, detName: "Verma", filedAt };
    expect(JSON.parse(caseFileJson(input))).toEqual(buildCaseFile(input));
  });

  it("derives a filesystem-safe, dated filename", () => {
    expect(caseFileName({ mode: "home", answers, detName: "", filedAt })).toBe(
      "carbon-detective-home-2026-06-21.json",
    );
  });
});
