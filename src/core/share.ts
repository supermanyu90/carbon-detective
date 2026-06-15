/* =========================================================
   SHARE — building the social-share message & intent links
   -----------------------------------------------------------
   Pure, framework-free, unit-tested. The UI layer (ShareBar)
   handles the Web Share API / clipboard; everything that needs
   testing — the wording and the target URLs — lives here.

   Privacy: the share text carries only the headline audit
   numbers and verdict. The detective's name, case number and
   timestamps are deliberately excluded.
   ========================================================= */
import type { Mode } from "./clues";
import { fmt } from "./audit";

export interface ShareData {
  mode: Mode;
  co2: number;
  cost: number;
  verdict: string;
  rank: string;
  nFound: number;
  nClues: number;
}

/** The shareable sentence. Kept tight enough for X (no URL counted there). */
export function buildShareText(d: ShareData): string {
  const scene = d.mode === "home" ? "my home" : "our classroom/office";
  if (d.nFound === 0) {
    return (
      `🕵️ I ran a Carbon Detective audit on ${scene} and found no obvious waste — ` +
      `verdict: ${d.verdict}. Think your place can match it?`
    );
  }
  return (
    `🕵️ Carbon Detective audit of ${scene}: ₹${fmt(d.cost)}/year in savings and ` +
    `${fmt(d.co2)} kg of avoidable CO₂ uncovered across ${d.nFound} clues. ` +
    `Verdict: ${d.verdict}. Can you close your own case?`
  );
}

/** Hashtags appended on platforms that benefit from them. */
export const SHARE_HASHTAGS = ["CarbonDetective", "ClimateAction"];

export interface ShareTargets {
  x: string;
  whatsapp: string;
  linkedin: string;
  facebook: string;
}

/** Prefilled share-intent URLs for each network. `url` is the app link. */
export function shareTargets(text: string, url: string): ShareTargets {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  const tags = SHARE_HASHTAGS.join(",");
  return {
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}&hashtags=${tags}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`,
  };
}
