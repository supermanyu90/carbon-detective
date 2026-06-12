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
  c: Clue;
  n: number;
  im: Impact;
}

export interface Verdict {
  s: string;
  msg: string;
}

export interface Equivalents {
  trees: number;
  phones: number;
  km: number;
  buckets: number;
}

/** Annual impact of one clue given quantity n (n = 1 for a confirmed yes/no). */
export function impact(c: Clue, n: number): Impact {
  const kwh = (c.kwh || 0) * n;
  const fuel = (c.fuel || 0) * n;
  const water = (c.water || 0) * n;
  const co2 =
    kwh * F.elecCO2 + fuel * F.fuelCO2 + water * F.waterCO2 + (c.co2 || 0) * n;
  const cost =
    kwh * F.elecCost + fuel * F.fuelCost + water * F.waterCost + (c.cost || 0) * n;
  return { kwh, fuel, water, co2, cost };
}

export function severity(c: Clue): Severity {
  // Nudge big water leaks up — their CO₂ is low but the waste is real.
  const co2 = impact(c, 1).co2 + (c.water ? c.water * 0.00045 : 0);
  const waterBig = (c.water || 0) >= 7000;
  if (co2 >= 100 || waterBig) return "HIGH";
  if (co2 >= 25) return "MODERATE";
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
    .map((c) => ({ c, n: answers[c.id].n, im: impact(c, answers[c.id].n) }))
    .sort((a, b) => b.im.co2 - a.im.co2);
}

export function totals(found: Finding[]): Impact {
  return found.reduce<Impact>(
    (t, f) => ({
      co2: t.co2 + f.im.co2,
      cost: t.cost + f.im.cost,
      kwh: t.kwh + f.im.kwh,
      fuel: t.fuel + f.im.fuel,
      water: t.water + f.im.water,
    }),
    { co2: 0, cost: 0, kwh: 0, fuel: 0, water: 0 },
  );
}

export function verdict(ratio: number): Verdict {
  if (ratio === 0)
    return {
      s: "SPOTLESS",
      msg: "No waste found. Either this building is exemplary, or it deserves a second, sneakier inspection.",
    };
  if (ratio < 0.25)
    return { s: "MINOR LEAKS", msg: "A tight ship with a few slow leaks. Easy wins below." };
  if (ratio < 0.5)
    return {
      s: "CASE PROVEN",
      msg: "Clear evidence of routine waste. The prime suspects are named below — all of them fixable.",
    };
  return {
    s: "MAJOR FINDINGS",
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
    trees: tot.co2 / 22, // ~22 kg CO₂ absorbed per mature tree per year
    phones: tot.co2 / 0.01, // ~10 g CO₂ per smartphone charge
    km: tot.co2 / 0.18, // ~180 g CO₂ per car-km
    buckets: tot.water / 15,
  };
}

export const fmt = (n: number): string =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
