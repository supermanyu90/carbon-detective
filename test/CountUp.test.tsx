/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CountUp } from "../src/components/CountUp";

afterEach(cleanup);

describe("<CountUp>", () => {
  it("renders the final value immediately when motion is reduced", () => {
    render(<CountUp value={1234} prefix="₹" suffix=" kg" reduceMotion />);
    expect(screen.getByText("₹1,234 kg")).toBeInTheDocument();
  });

  it("rounds the displayed value for consistency with the rest of the report", () => {
    render(<CountUp value={106.6} reduceMotion />);
    expect(screen.getByText("107")).toBeInTheDocument();
  });
});
