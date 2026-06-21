/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { throwConfetti } from "../src/lib/confetti";

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = "";
});
afterEach(() => vi.useRealTimers());

describe("throwConfetti()", () => {
  it("appends a burst of confetti nodes", () => {
    throwConfetti();
    expect(document.querySelectorAll(".confetti")).toHaveLength(46);
  });

  it("removes every node after the animation window", () => {
    throwConfetti();
    vi.advanceTimersByTime(4500);
    expect(document.querySelectorAll(".confetti")).toHaveLength(0);
  });
});
