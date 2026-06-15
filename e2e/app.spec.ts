import { test, expect, type Page } from "@playwright/test";

async function beginHome(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Begin investigation/ }).click();
  await expect(page.locator(".progress-bar")).toBeVisible();
}

/** Answer one clue, mark the rest as "no waste", then generate the report. */
async function completeAudit(page: Page) {
  await page.locator(".pill.yes").first().click();
  await page.getByRole("button", { name: /Mark remaining/ }).click();
  const gen = page.getByRole("button", { name: /Close the case/ });
  await expect(gen).toBeEnabled();
  await gen.click();
  await expect(page.locator(".stat-grid")).toBeVisible();
}

test("loads the briefing with the Field Manual and cited sources", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "The Carbon Detective" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Case briefing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Field Manual/ })).toBeVisible();
  await expect(page.locator(".asst-char")).toBeVisible(); // Inspector Hoot

  await page.getByText(/Sources & methodology/).click();
  const links = page.locator(".sources a");
  await expect(links).toHaveCount(7);
  const hrefs = await links.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
  expect(
    hrefs.every((h) =>
      /cea\.nic\.in|beeindia|ipcc|epa\.gov|iea\.org|ghgprotocol|gov\.uk/.test(h),
    ),
  ).toBe(true);
});

test("toggles scene mode with aria-pressed", async ({ page }) => {
  await page.goto("/");
  const cls = page.getByRole("button", { name: /Classroom \/ Office/ });
  await cls.click();
  await expect(cls).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /The Home Case/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("begins a home investigation with five zones", async ({ page }) => {
  await beginHome(page);
  await expect(page.locator("details.zone")).toHaveCount(5);
  await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText("Investigation");
});

test("classroom case has four zones", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Classroom \/ Office/ }).click();
  await page.getByRole("button", { name: /Begin investigation/ }).click();
  await expect(page.locator("details.zone")).toHaveCount(4);
});

test("scene map shows rooms and opens a zone when picked", async ({ page }) => {
  await beginHome(page);
  await expect(page.locator(".scene .room")).toHaveCount(5);
  await page.locator(".scene .room").nth(2).click();
  await expect(page.locator("#zone-2")).toHaveJSProperty("open", true);
});

test("count clue accepts a typed value and logs evidence", async ({ page }) => {
  await beginHome(page);
  const input = page.locator("input.val").first();
  await input.click();
  await input.fill("7");
  await expect(input).toHaveValue("7");
  await expect(page.locator(".clue.found .found-note").first()).toBeVisible();
});

test("guidance: jump to next unanswered and mark remaining", async ({ page }) => {
  await beginHome(page);
  await page.getByRole("button", { name: /next unanswered/ }).click();
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.className ?? ""))
    .toContain("clue");

  await page.locator(".pill.yes").first().click();
  await page.getByRole("button", { name: /Mark remaining/ }).click();
  await expect(page.getByRole("button", { name: /Close the case/ })).toBeEnabled();
});

test("generates an accessible audit report", async ({ page }) => {
  await beginHome(page);
  await completeAudit(page);
  await expect(page.locator(".evidence-board")).toBeVisible();
  await expect(page.locator(".suspect-card")).toHaveCount(1); // one finding in this flow
  await expect(page.locator(".stamp").filter({ hasText: "Case Closed" })).toBeVisible();

  // Expand the "Show the working" methodology table and check its headers.
  await page.getByText(/Show the working/).click();
  const method = page.locator("table.method").first();
  await expect(method).toBeVisible();
  expect(await method.locator("th[scope='col']").count()).toBeGreaterThanOrEqual(3);
});

test("AI analyst writes a plan, degrading to the on-device brief without a backend", async ({
  page,
}) => {
  await beginHome(page);
  await completeAudit(page);

  const analyst = page.locator(".ai-analyst");
  await expect(analyst).toBeVisible();
  await analyst.getByRole("button", { name: /Write my action plan/ }).click();

  // No /api/analyze in the preview server → graceful fallback to the local brief.
  await expect(analyst.locator(".ai-badge")).toHaveText(/On-device brief/);
  await expect(analyst.locator(".ai-output")).not.toBeEmpty();
  await expect(analyst.getByRole("button", { name: /Regenerate/ })).toBeVisible();
  // Output is announced to assistive tech.
  await expect(analyst.locator(".ai-output")).toHaveAttribute("aria-live", "polite");
});

test("shows the climate context linking carbon to anomalies", async ({ page }) => {
  await beginHome(page);
  await completeAudit(page);

  const climate = page.locator(".climate");
  await expect(climate).toBeVisible();
  await expect(climate.getByRole("heading", { name: /From your meter to the monsoon/ })).toBeVisible();
  // The four mechanism cards (ENSO, monsoon, heat, ocean).
  await expect(climate.locator(".climate-links li")).toHaveCount(4);
  await expect(climate).toContainText(/El Niño/);
  await expect(climate).toContainText(/still trapping heat a century/);
});

test("persists the case across a reload", async ({ page }) => {
  await beginHome(page);
  await completeAudit(page);
  await page.reload();
  // Restores straight into the report step without blanking.
  await expect(page.locator(".stat-grid")).toBeVisible();
});

test("shows a comparison banner on a repeat audit of the same scene", async ({ page }) => {
  await beginHome(page);
  await completeAudit(page);
  await page.getByRole("button", { name: /Open a new case/ }).click();
  await page.getByRole("button", { name: /Begin investigation/ }).click();
  await completeAudit(page);
  await expect(page.locator(".compare")).toBeVisible();
});

test("runs a full flow with no console or page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await beginHome(page);
  await completeAudit(page);
  await page.reload();
  await expect(page.locator(".stat-grid")).toBeVisible();

  expect(errors, errors.join("\n")).toEqual([]);
});
