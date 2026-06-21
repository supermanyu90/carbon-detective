import { F } from "./factors";
import { CLUES, type Clue, type Mode } from "./clues";

export interface Impact {
  kwh: number;
  fuel: number;
  water: number;
  co2: number;
  cost: number;
}

export type Severity = "HIGH" | "MODERATE" | "LOW";

export interface Answer {
  answered: boolean;
  found: boolean;
  n: number;
}

export type Answers = Record<string, Answer>;

export interface Finding {
  clue: Clue;
  count: number;
  impact: Impact;
}

export interface Verdict {
  /** Short rubber-stamp label, e.g. "CASE PROVEN". */
  label: string;
  msg: string;
}

export interface Equivalents {
  trees: number;
  phones: number;
  km: number;
  buckets: number;
}

/** Largest count a single clue can hold (e.g. dripping taps, standby devices). */
export const MAX_COUNT = 99;

/** Clamp a raw count to a whole number within [0, MAX_COUNT]; non-finite → 0. */
export const clampCount = (n: number): number => {
  const whole = Number.isFinite(n) ? Math.floor(n) : 0;
  return Math.max(0, Math.min(MAX_COUNT, whole));
};

/** CO₂ (kg) thresholds that map a clue to a severity badge. */
const SEVERITY_HIGH_KG = 100;
const SEVERITY_MODERATE_KG = 25;
/** Water leaks at/above this (litres/yr) read as HIGH even when their CO₂ is low. */
const HIGH_WATER_L = 7000;
/** Severity-only weighting that nudges water waste up the ranking. */
const WATER_SEVERITY_KG_PER_L = 0.00045;

/** Real-world equivalences for the report payoff. */
const KG_CO2_PER_TREE_YEAR = 22; // absorbed by one mature tree in a year
const KG_CO2_PER_PHONE_CHARGE = 0.01; // ~10 g per smartphone charge
const KG_CO2_PER_CAR_KM = 0.18; // ~180 g per car-km
const LITRES_PER_BUCKET = 15;

/** Annual impact of one clue given quantity n (n = 1 for a confirmed yes/no). */
export function impact(c: Clue, n: number): Impact {
  const kwh = (c.kwh || 0) * n;
  const fuel = (c.fuel || 0) * n;
  const water = (c.water || 0) * n;
  const co2 = kwh * F.elecCO2 + fuel * F.fuelCO2 + water * F.waterCO2 + (c.co2 || 0) * n;
  const cost = kwh * F.elecCost + fuel * F.fuelCost + water * F.waterCost + (c.cost || 0) * n;
  return { kwh, fuel, water, co2, cost };
}

export function severity(c: Clue): Severity {
  // Nudge big water leaks up — their CO₂ is low but the waste is real.
  const co2 = impact(c, 1).co2 + (c.water ? c.water * WATER_SEVERITY_KG_PER_L : 0);
  const waterBig = (c.water || 0) >= HIGH_WATER_L;
  if (co2 >= SEVERITY_HIGH_KG || waterBig) return "HIGH";
  if (co2 >= SEVERITY_MODERATE_KG) return "MODERATE";
  return "LOW";
}

export function cluesForMode(mode: Mode): Clue[] {
  return CLUES.filter((c) => c.mode === mode);
}

export function zonesForMode(mode: Mode): string[] {
  return [...new Set(cluesForMode(mode).map((c) => c.zone))];
}

/** Confirmed findings for a mode, richest-CO₂ first. */
export function findings(mode: Mode, answers: Answers): Finding[] {
  return cluesForMode(mode)
    .filter((c) => answers[c.id]?.found)
    .map((c) => ({ clue: c, count: answers[c.id].n, impact: impact(c, answers[c.id].n) }))
    .sort((a, b) => b.impact.co2 - a.impact.co2);
}

export function totals(found: Finding[]): Impact {
  return found.reduce<Impact>(
    (t, f) => ({
      co2: t.co2 + f.impact.co2,
      cost: t.cost + f.impact.cost,
      kwh: t.kwh + f.impact.kwh,
      fuel: t.fuel + f.impact.fuel,
      water: t.water + f.impact.water,
    }),
    { co2: 0, cost: 0, kwh: 0, fuel: 0, water: 0 },
  );
}

export function verdict(ratio: number): Verdict {
  if (ratio === 0)
    return {
      label: "SPOTLESS",
      msg: "No waste found. Either this building is exemplary, or it deserves a second, sneakier inspection.",
    };
  if (ratio < 0.25)
    return {
      label: "MINOR LEAKS",
      msg: "A tight ship with a few slow leaks. Easy wins below.",
    };
  if (ratio < 0.5)
    return {
      label: "CASE PROVEN",
      msg: "Clear evidence of routine waste. The prime suspects are named below — all of them fixable.",
    };
  return {
    label: "MAJOR FINDINGS",
    msg: "Substantial waste uncovered across multiple zones. The good news: that makes this audit extremely profitable.",
  };
}

export function rank(ratio: number, nFound: number): string {
  if (ratio >= 0.5) return "🕵️ Chief Detective";
  if (nFound > 0) return "🔎 Inspector";
  return "🧢 Beat Constable (nothing to pin)";
}

export function equivalents(tot: Impact): Equivalents {
  return {
    trees: tot.co2 / KG_CO2_PER_TREE_YEAR,
    phones: tot.co2 / KG_CO2_PER_PHONE_CHARGE,
    km: tot.co2 / KG_CO2_PER_CAR_KM,
    buckets: tot.water / LITRES_PER_BUCKET,
  };
}
