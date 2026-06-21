import { describe, it, expect } from "vitest";
import { fmt, formatDateShort, formatDateLong } from "../src/lib/format";

describe("fmt()", () => {
  it("rounds to a whole number", () => {
    expect(fmt(106.6)).toBe("107");
    expect(fmt(0.4)).toBe("0");
  });

  it("groups digits in the Indian style (lakh/crore)", () => {
    expect(fmt(1234567)).toBe("12,34,567");
    expect(fmt(1000)).toBe("1,000");
  });
});

describe("formatDate helpers", () => {
  // Local-midnight construction keeps the assertion timezone-independent.
  const d = new Date(2026, 5, 21);

  it("formatDateShort uses an abbreviated month", () => {
    expect(formatDateShort(d)).toBe("21 Jun 2026");
  });

  it("formatDateLong uses the full month name", () => {
    expect(formatDateLong(d)).toBe("21 June 2026");
  });
});
