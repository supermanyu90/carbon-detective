import { describe, it, expect } from "vitest";
import { drawCaseCard, cardFilename, CARD_W, CARD_H, type DrawCtx } from "../src/core/shareCard";
import type { ShareData } from "../src/core/share";

/** Recording stub: captures every fillText/strokeRect call. */
function recorder() {
  const texts: string[] = [];
  let strokeRects = 0;
  let fillRects = 0;
  const ctx: DrawCtx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    fillRect: () => {
      fillRects++;
    },
    strokeRect: () => {
      strokeRects++;
    },
    fillText: (t) => {
      texts.push(t);
    },
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
  };
  return { ctx, texts, get strokeRects() { return strokeRects; }, get fillRects() { return fillRects; } };
}

const base: ShareData = {
  mode: "home",
  co2: 412,
  cost: 9123,
  verdict: "CASE PROVEN",
  rank: "🕵️ Chief Detective",
  nFound: 6,
  nClues: 19,
};

describe("drawCaseCard", () => {
  it("uses an OG-friendly aspect ratio", () => {
    expect(CARD_W / CARD_H).toBeCloseTo(1.905, 1);
  });

  it("paints the headline figures, verdict and rank", () => {
    const r = recorder();
    drawCaseCard(r.ctx, base);
    const all = r.texts.join(" | ");
    expect(all).toContain("THE CARBON DETECTIVE");
    expect(all).toContain("₹9,123");
    expect(all).toContain("412 kg");
    expect(all).toContain("CASE PROVEN");
    expect(all).toContain(base.rank);
    expect(all).toMatch(/THE HOME CASE/);
    // background panel + border + stamp box were drawn
    expect(r.fillRects).toBeGreaterThanOrEqual(2);
    expect(r.strokeRects).toBeGreaterThanOrEqual(2);
  });

  it("has a distinct no-findings layout", () => {
    const r = recorder();
    drawCaseCard(r.ctx, { ...base, nFound: 0 });
    const all = r.texts.join(" | ");
    expect(all).toContain("No waste found");
    expect(all).not.toContain("₹9,123");
  });

  it("filename is mode- and value-specific with a .png extension", () => {
    expect(cardFilename(base)).toBe("carbon-detective-home-412kg.png");
    expect(cardFilename({ ...base, mode: "class", co2: 88 })).toMatch(/-class-88kg\.png$/);
  });
});
