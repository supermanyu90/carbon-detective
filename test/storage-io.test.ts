import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadHistory,
  saveHistory,
  loadWip,
  saveWip,
  clearWip,
  type ReportSnapshot,
  type Wip,
} from "../src/lib/storage";

/** Minimal in-memory Storage so the IO guards are tested deterministically,
 *  independent of the test environment's (quirky) localStorage. */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
}

const snap: ReportSnapshot = {
  at: "2026-01-01T00:00:00.000Z",
  caseNo: "CASE No. CD-0001",
  mode: "home",
  name: "Detective",
  co2: 100,
  cost: 1000,
  kwh: 100,
  water: 0,
  fuel: 0,
  nFound: 3,
  nClues: 20,
  verdict: "CASE PROVEN",
};

const wip: Wip = {
  v: 1,
  mode: "home",
  detName: "Verma",
  answers: { standby: { answered: true, found: true, n: 2 } },
  caseNo: "CASE No. CD-0001",
  stampText: "Under Investigation",
  investigationUnlocked: true,
  reportUnlocked: false,
  step: 1,
  filedAt: "2026-01-01T00:00:00.000Z",
};

let mem: Storage;
beforeEach(() => {
  mem = createMemoryStorage();
  vi.stubGlobal("localStorage", mem);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("history persistence", () => {
  it("round-trips through localStorage", () => {
    saveHistory([snap]);
    expect(loadHistory()).toEqual([snap]);
  });

  it("returns an empty list when nothing is stored", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("falls back to an empty list when stored JSON is corrupt", () => {
    mem.setItem("cd:history", "{not json");
    expect(loadHistory()).toEqual([]);
  });
});

describe("work-in-progress persistence", () => {
  it("round-trips through localStorage", () => {
    saveWip(wip);
    expect(loadWip()).toEqual(wip);
  });

  it("returns null when nothing is stored", () => {
    expect(loadWip()).toBeNull();
  });

  it("rejects a payload from an incompatible schema version", () => {
    mem.setItem("cd:wip", JSON.stringify({ ...wip, v: 2 }));
    expect(loadWip()).toBeNull();
  });

  it("clearWip removes the saved case", () => {
    saveWip(wip);
    clearWip();
    expect(loadWip()).toBeNull();
  });
});

describe("degrades gracefully when storage is unavailable", () => {
  it("read swallows access errors and returns the fallback", () => {
    vi.spyOn(mem, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadHistory()).toEqual([]);
    expect(loadWip()).toBeNull();
  });

  it("write swallows quota/access errors without throwing", () => {
    vi.spyOn(mem, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() => saveHistory([snap])).not.toThrow();
    expect(() => saveWip(wip)).not.toThrow();
  });

  it("clearWip swallows access errors without throwing", () => {
    vi.spyOn(mem, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => clearWip()).not.toThrow();
  });
});
