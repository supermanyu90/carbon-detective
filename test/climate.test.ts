import { describe, it, expect } from "vitest";
import {
  CLIMATE_LINKS,
  CLIMATE_PRIMER,
  CO2_AIRBORNE_FRACTION_100YR,
  NEIGHBOURHOOD_HOMES,
  stillWarmingAfter100yr,
  tonnesIfScaled,
} from "../src/core/climate";
import { SYSTEM_PROMPT } from "../src/core/aiBrief";

describe("climate derived metrics", () => {
  it("lingering CO₂ uses the airborne fraction", () => {
    expect(stillWarmingAfter100yr(1000)).toBe(1000 * CO2_AIRBORNE_FRACTION_100YR);
    expect(stillWarmingAfter100yr(0)).toBe(0);
  });

  it("scaling to a neighbourhood converts kg→tonnes correctly", () => {
    // 500 kg/home × 10,000 homes = 5,000,000 kg = 5,000 t
    expect(tonnesIfScaled(500)).toBe((500 * NEIGHBOURHOOD_HOMES) / 1000);
    expect(tonnesIfScaled(500, 2000)).toBe(1000);
  });
});

describe("climate link cards", () => {
  it("covers ENSO, monsoon, heat and ocean with real https sources", () => {
    const ids = CLIMATE_LINKS.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["enso", "monsoon", "heat", "ocean"]));
    for (const c of CLIMATE_LINKS) {
      expect(c.source.url).toMatch(/^https:\/\//);
      expect(c.body.length).toBeGreaterThan(40);
    }
  });

  it("does not overclaim — ENSO card states carbon raises the baseline, not causation", () => {
    const enso = CLIMATE_LINKS.find((c) => c.id === "enso")!;
    expect(enso.body).toMatch(/natural/i);
    expect(enso.body.toLowerCase()).not.toMatch(/carbon (causes|triggers) (el ?niño|enso)/);
  });
});

describe("AI grounding", () => {
  it("primer carries the no-overclaim guardrail and is in the system prompt", () => {
    expect(CLIMATE_PRIMER).toMatch(/do NOT say emissions cause it/i);
    expect(SYSTEM_PROMPT).toContain(CLIMATE_PRIMER);
  });
});
