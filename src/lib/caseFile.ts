import type { Mode } from "../core/clues";
import {
  cluesForMode,
  findings,
  totals,
  verdict,
  rank,
  equivalents,
  severity,
  type Answers,
} from "../core/audit";

/** Everything needed to reproduce a filed audit, as plain data. */
export interface CaseFile {
  app: "The Carbon Detective";
  version: 1;
  generatedAt: string;
  scene: string;
  detective: string;
  verdict: string;
  rank: string;
  cluesConfirmed: number;
  cluesExamined: number;
  annual: {
    co2Kg: number;
    savingsRupees: number;
    electricityKwh: number;
    waterLitres: number;
    fuelLitres: number;
  };
  equivalents: { trees: number; carKm: number; phoneCharges: number; buckets: number };
  findings: Array<{
    id: string;
    question: string;
    fix: string;
    count: number;
    severity: string;
    co2Kg: number;
    savingsRupees: number;
  }>;
}

export interface CaseInput {
  mode: Mode;
  answers: Answers;
  detName: string;
  filedAt: Date;
}

const round = (n: number, dp = 0): number => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/** Build a portable, JSON-serialisable record of a filed audit. Pure: the same
 *  core functions that drive the on-screen report produce the exported numbers,
 *  so a downloaded case file always matches what the user saw. */
export function buildCaseFile({ mode, answers, detName, filedAt }: CaseInput): CaseFile {
  const found = findings(mode, answers);
  const tot = totals(found);
  const nClues = cluesForMode(mode).length;
  const ratio = found.length / nClues;
  const eq = equivalents(tot);

  return {
    app: "The Carbon Detective",
    version: 1,
    generatedAt: filedAt.toISOString(),
    scene: mode === "home" ? "Home" : "Classroom / Office",
    detective: detName.trim() || "Detective",
    verdict: verdict(ratio).label,
    rank: rank(ratio, found.length),
    cluesConfirmed: found.length,
    cluesExamined: nClues,
    annual: {
      co2Kg: round(tot.co2),
      savingsRupees: round(tot.cost),
      electricityKwh: round(tot.kwh),
      waterLitres: round(tot.water),
      fuelLitres: round(tot.fuel),
    },
    equivalents: {
      trees: round(eq.trees, 1),
      carKm: round(eq.km),
      phoneCharges: round(eq.phones),
      buckets: round(eq.buckets),
    },
    findings: found.map((f) => ({
      id: f.clue.id,
      question: f.clue.q,
      fix: f.clue.fix,
      count: f.count,
      severity: severity(f.clue),
      co2Kg: round(f.impact.co2),
      savingsRupees: round(f.impact.cost),
    })),
  };
}

/** Pretty-printed JSON for download. */
export const caseFileJson = (input: CaseInput): string =>
  JSON.stringify(buildCaseFile(input), null, 2);

/** A filesystem-safe download name, e.g. "carbon-detective-home-2026-06-21.json". */
export const caseFileName = ({ mode, filedAt }: CaseInput): string =>
  `carbon-detective-${mode}-${filedAt.toISOString().slice(0, 10)}.json`;
