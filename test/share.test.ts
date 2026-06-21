import { describe, it, expect } from "vitest";
import { buildShareText, shareTargets, type ShareData } from "../src/core/share";

const base: ShareData = {
  mode: "home",
  co2: 412,
  cost: 9123,
  verdict: "CASE PROVEN",
  rank: "🕵️ Chief Detective",
  nFound: 6,
  nClues: 19,
};

describe("buildShareText", () => {
  it("includes the headline numbers and verdict", () => {
    const t = buildShareText(base);
    expect(t).toMatch(/9,123/);
    expect(t).toMatch(/412 kg/);
    expect(t).toMatch(/CASE PROVEN/);
    expect(t).toMatch(/6 clues/);
  });

  it("never leaks PII (no name / case-number tokens)", () => {
    const t = buildShareText(base);
    expect(t).not.toMatch(/detective[’']s name|case no|filed by|CD-/i);
  });

  it("has a graceful no-findings variant", () => {
    const t = buildShareText({ ...base, nFound: 0 });
    expect(t).toMatch(/no obvious waste/i);
    expect(t).not.toMatch(/avoidable CO₂ uncovered/);
  });

  it("uses the right scene wording per mode", () => {
    expect(buildShareText(base)).toMatch(/my home/);
    expect(buildShareText({ ...base, mode: "class" })).toMatch(/classroom\/office/);
  });
});

describe("shareTargets", () => {
  const url = "https://carbon-detective.example/";
  const text = "audit result";
  const t = shareTargets(text, url);

  it("builds well-formed, encoded intent URLs for each network", () => {
    expect(t.x).toContain("twitter.com/intent/tweet");
    expect(t.x).toContain(`url=${encodeURIComponent(url)}`);
    expect(t.whatsapp).toContain("wa.me/?text=");
    expect(t.whatsapp).toContain(encodeURIComponent(`${text} ${url}`));
    expect(t.linkedin).toContain("linkedin.com/sharing/share-offsite");
    expect(t.facebook).toContain("facebook.com/sharer");
  });

  it("encodes special characters so the message survives transport", () => {
    const tricky = shareTargets("₹9,123 & 412 kg CO₂", url);
    expect(tricky.x).toContain(encodeURIComponent("₹9,123 & 412 kg CO₂"));
    expect(tricky.x).not.toContain(" & 412"); // raw ampersand would break the query
  });

  it("all targets are https", () => {
    for (const href of Object.values(t)) expect(href).toMatch(/^https:\/\//);
  });
});
