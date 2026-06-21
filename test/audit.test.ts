import { describe, it, expect } from "vitest";
import { F } from "../src/core/factors";
import { CLUES, type Clue } from "../src/core/clues";
import {
  impact,
  severity,
  findings,
  totals,
  verdict,
  rank,
  equivalents,
  clampCount,
  MAX_COUNT,
  cluesForMode,
  zonesForMode,
  type Answers,
} from "../src/core/audit";

const clue = (over: Partial<Clue>): Clue => ({
  mode: "home",
  zone: "Z",
  ico: "🔌",
  id: "t",
  type: "yn",
  q: "q",
  why: "why",
  fix: "fix",
  ...over,
});

describe("impact()", () => {
  it("multiplies electricity by count and applies both factors", () => {
    const im = impact(clue({ kwh: 100 }), 3);
    expect(im.kwh).toBe(300);
    expect(im.co2).toBeCloseTo(300 * F.elecCO2, 6);
    expect(im.cost).toBeCloseTo(300 * F.elecCost, 6);
  });

  it("handles fuel and water resources", () => {
    const fuel = impact(clue({ fuel: 10 }), 2);
    expect(fuel.fuel).toBe(20);
    expect(fuel.co2).toBeCloseTo(20 * F.fuelCO2, 6);

    const water = impact(clue({ water: 1000 }), 1);
    expect(water.water).toBe(1000);
    expect(water.cost).toBeCloseTo(1000 * F.waterCost, 6);
  });

  it("adds direct co2/cost on top of resource-derived values", () => {
    const im = impact(clue({ co2: 15, cost: 600 }), 2);
    expect(im.co2).toBe(30);
    expect(im.cost).toBe(1200);
  });

  it("returns zeros for an empty clue at any count", () => {
    expect(impact(clue({}), 5)).toEqual({ kwh: 0, fuel: 0, water: 0, co2: 0, cost: 0 });
  });
});

describe("severity()", () => {
  it("classifies a high-CO₂ clue as HIGH (>= 100 kg)", () => {
    // 130 kWh * 0.82 = 106.6 kg
    expect(severity(clue({ kwh: 130 }))).toBe("HIGH");
  });

  it("treats big water leaks (>= 7000 L) as HIGH despite low CO₂", () => {
    expect(severity(clue({ water: 7300 }))).toBe("HIGH");
  });

  it("classifies a mid clue as MODERATE (25–100 kg)", () => {
    // 50 kWh * 0.82 = 41 kg
    expect(severity(clue({ kwh: 50 }))).toBe("MODERATE");
  });

  it("keeps the empty-charger 'twist' clue LOW (4 kWh/yr)", () => {
    const chargers = CLUES.find((c) => c.id === "chargers")!;
    expect(severity(chargers)).toBe("LOW");
  });

  it("respects the MODERATE/HIGH boundary at exactly 100 kg", () => {
    const c = clue({ co2: 100 }); // direct 100 kg, no water nudge
    expect(severity(c)).toBe("HIGH");
    expect(severity(clue({ co2: 99.99 }))).toBe("MODERATE");
  });
});

describe("findings() and totals()", () => {
  const answers: Answers = {
    aclow: { answered: true, found: true, n: 1 }, // 390 kWh
    standby: { answered: true, found: true, n: 2 }, // 48*2 kWh
    hotfood: { answered: true, found: false, n: 0 }, // not found -> excluded
  };

  it("includes only found clues, sorted by CO₂ descending", () => {
    const f = findings("home", answers);
    expect(f.map((x) => x.clue.id)).toEqual(["aclow", "standby"]);
    expect(f[0].impact.co2).toBeGreaterThan(f[1].impact.co2);
  });

  it("respects per-clue count n", () => {
    const f = findings("home", answers);
    const standby = f.find((x) => x.clue.id === "standby")!;
    expect(standby.count).toBe(2);
    expect(standby.impact.kwh).toBe(96);
  });

  it("excludes findings from the other mode", () => {
    const f = findings("class", answers);
    expect(f).toHaveLength(0);
  });

  it("sums totals across resources", () => {
    const tot = totals(findings("home", answers));
    expect(tot.kwh).toBe(390 + 96);
    expect(tot.co2).toBeCloseTo((390 + 96) * F.elecCO2, 6);
  });

  it("totals of nothing are all zero", () => {
    expect(totals([])).toEqual({ co2: 0, cost: 0, kwh: 0, fuel: 0, water: 0 });
  });
});

describe("verdict() bands", () => {
  it("maps each ratio band to its stamp", () => {
    expect(verdict(0).label).toBe("SPOTLESS");
    expect(verdict(0.1).label).toBe("MINOR LEAKS");
    expect(verdict(0.3).label).toBe("CASE PROVEN");
    expect(verdict(0.8).label).toBe("MAJOR FINDINGS");
  });

  it("uses inclusive lower / exclusive upper boundaries", () => {
    expect(verdict(0.25).label).toBe("CASE PROVEN"); // not < 0.25
    expect(verdict(0.5).label).toBe("MAJOR FINDINGS"); // not < 0.5
  });
});

describe("rank()", () => {
  it("promotes to Chief Detective at ratio >= 0.5", () => {
    expect(rank(0.5, 5)).toBe("🕵️ Chief Detective");
  });
  it("is Inspector when some evidence found below the threshold", () => {
    expect(rank(0.2, 3)).toBe("🔎 Inspector");
  });
  it("is Beat Constable when nothing is found", () => {
    expect(rank(0, 0)).toBe("🧢 Beat Constable (nothing to pin)");
  });
});

describe("equivalents()", () => {
  it("derives trees/phones/km/buckets from totals", () => {
    const eq = equivalents({ co2: 220, cost: 0, kwh: 0, fuel: 0, water: 150 });
    expect(eq.trees).toBeCloseTo(10, 6);
    expect(eq.phones).toBeCloseTo(22000, 6);
    expect(eq.km).toBeCloseTo(1222.22, 1);
    expect(eq.buckets).toBeCloseTo(10, 6);
  });
});

describe("clampCount()", () => {
  it("keeps whole values within [0, MAX_COUNT]", () => {
    expect(clampCount(5)).toBe(5);
    expect(clampCount(0)).toBe(0);
    expect(clampCount(MAX_COUNT)).toBe(MAX_COUNT);
  });

  it("clamps out-of-range values to the nearest bound", () => {
    expect(clampCount(-3)).toBe(0);
    expect(clampCount(MAX_COUNT + 50)).toBe(MAX_COUNT);
  });

  it("floors fractional input and treats non-finite values as 0", () => {
    expect(clampCount(3.7)).toBe(3);
    expect(clampCount(NaN)).toBe(0);
  });
});

describe("data integrity of the clue ledger", () => {
  it("has unique ids", () => {
    const ids = CLUES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every count clue declares a unit", () => {
    for (const c of CLUES.filter((c) => c.type === "count")) {
      expect(c.unit, `${c.id} missing unit`).toBeTruthy();
    }
  });

  it("every clue carries at least one impact factor", () => {
    for (const c of CLUES) {
      const hasFactor = c.kwh || c.fuel || c.water || c.co2 || c.cost;
      expect(hasFactor, `${c.id} has no impact factor`).toBeTruthy();
    }
  });

  it("exposes 5 home zones and 4 class zones", () => {
    expect(zonesForMode("home")).toHaveLength(5);
    expect(zonesForMode("class")).toHaveLength(4);
    expect(cluesForMode("home").length).toBeGreaterThan(0);
  });
});
