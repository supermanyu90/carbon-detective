/* Presentation helpers. Kept out of core/ so the carbon math stays free of
 * locale and display concerns. All output uses the Indian locale (₹, lakh
 * digit grouping, en-IN month names) to match the app's audience. */

const LOCALE = "en-IN";

/** Whole-number formatting with Indian digit grouping (e.g. 1,23,456). */
export const fmt = (n: number): string =>
  n.toLocaleString(LOCALE, { maximumFractionDigits: 0 });

/** "21 Jun 2026" — compact dates for notes and comparisons. */
export const formatDateShort = (d: Date): string =>
  d.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });

/** "21 June 2026" — the formal date the report is filed under. */
export const formatDateLong = (d: Date): string =>
  d.toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" });
