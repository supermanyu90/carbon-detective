import type { Mode } from "../core/clues";
import type { Answers } from "../core/audit";

const WIP_KEY = "cd:wip";
const HIST_KEY = "cd:history";
const HIST_CAP = 24;

/** A filed report, kept so a later audit can compare against it. */
export interface ReportSnapshot {
  at: string; // ISO timestamp
  caseNo: string;
  mode: Mode;
  name: string;
  co2: number;
  cost: number;
  kwh: number;
  water: number;
  fuel: number;
  nFound: number;
  nClues: number;
  verdict: string;
}

/** In-progress case, autosaved so a refresh never loses an audit. */
export interface Wip {
  v: 1;
  mode: Mode;
  detName: string;
  answers: Answers;
  caseNo: string;
  stampText: string;
  investigationUnlocked: boolean;
  reportUnlocked: boolean;
  step: number;
  filedAt: string; // ISO timestamp
}

/* ---------- pure helpers (unit-tested) ---------- */

/** Append a snapshot, replacing any existing entry for the same case,
 *  and cap the history length. */
export function upsertHistory(
  history: ReportSnapshot[],
  snap: ReportSnapshot,
): ReportSnapshot[] {
  const rest = history.filter((h) => h.caseNo !== snap.caseNo);
  return [...rest, snap].slice(-HIST_CAP);
}

/** The most recent *other* audit of the same scene, or null. */
export function previousOf(
  history: ReportSnapshot[],
  mode: Mode,
  caseNo: string,
): ReportSnapshot | null {
  const same = history.filter((h) => h.mode === mode && h.caseNo !== caseNo);
  return same.length ? same[same.length - 1] : null;
}

/* ---------- localStorage IO (guarded; safe if storage is unavailable) ---------- */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — degrade silently */
  }
}

export const loadHistory = (): ReportSnapshot[] => read<ReportSnapshot[]>(HIST_KEY, []);
export const saveHistory = (h: ReportSnapshot[]): void => write(HIST_KEY, h);

export const loadWip = (): Wip | null => {
  const w = read<Wip | null>(WIP_KEY, null);
  return w && w.v === 1 ? w : null;
};
export const saveWip = (w: Wip): void => write(WIP_KEY, w);
export const clearWip = (): void => {
  try {
    localStorage.removeItem(WIP_KEY);
  } catch {
    /* ignore */
  }
};
