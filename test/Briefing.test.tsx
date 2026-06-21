/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Briefing } from "../src/components/Briefing";
import type { ReportSnapshot } from "../src/lib/storage";

afterEach(cleanup);

const noop = () => {};

function renderBriefing(over: Partial<Parameters<typeof Briefing>[0]> = {}) {
  const props = {
    mode: "home" as const,
    detName: "",
    history: [] as ReportSnapshot[],
    onSetMode: noop,
    onSetName: noop,
    onStart: noop,
    ...over,
  };
  render(<Briefing {...props} />);
  return props;
}

describe("<Briefing>", () => {
  it("offers both scenes and reflects the selected mode via aria-pressed", () => {
    renderBriefing({ mode: "home" });
    expect(screen.getByRole("button", { name: /The Home Case/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Classroom \/ Office Case/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("invokes onStart when the investigation begins", async () => {
    const onStart = vi.fn();
    renderBriefing({ onStart });
    await userEvent.click(screen.getByRole("button", { name: /Begin investigation/ }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("summarises the most recent case when history exists", () => {
    const last: ReportSnapshot = {
      at: "2026-01-01T00:00:00.000Z",
      caseNo: "CASE No. CD-0001",
      mode: "home",
      name: "Verma",
      co2: 432,
      cost: 5000,
      kwh: 500,
      water: 0,
      fuel: 0,
      nFound: 4,
      nClues: 20,
      verdict: "CASE PROVEN",
    };
    renderBriefing({ history: [last] });
    expect(screen.getByText(/1 case on file/)).toBeInTheDocument();
    expect(screen.getByText("CASE PROVEN")).toBeInTheDocument();
  });
});
