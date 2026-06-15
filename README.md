# The Carbon Detective 🕵️

A gamified home & classroom/office **carbon audit**, themed as a detective case file.
Pick a scene, sweep each zone for wasted electricity, fuel and water, and close the case
with a full audit report — CO₂, ₹ savings, prime suspects, and a transparent "show the
working" ledger.

Originally a single 1,036-line HTML file; rebuilt here as a **Vite + React + TypeScript**
application with the carbon math extracted into a pure, unit-tested core.

## AI Case Analyst (Claude)

After an audit closes, the **AI Case Analyst** turns the structured findings into a
personalised, prioritised action plan — streamed in live. It is powered by **Claude
(`claude-opus-4-8`)** through a serverless proxy (`api/analyze.ts`), and is designed to
the following guarantees:

- **Key stays server-side.** The `ANTHROPIC_API_KEY` lives only in the serverless
  function's environment. The Anthropic SDK is never bundled into the browser (verified in
  CI by inspecting `dist/`).
- **No PII leaves the device.** Only anonymous, already-computed audit numbers and the
  clue ids the user saw are sent — never the detective's name, case number, or timestamps.
  The boundary is enforced in one place (`src/core/aiBrief.ts`) and unit-tested.
- **Untrusted input is validated and bounded** server-side (`parseAnalystRequest`) — types,
  string lengths, numeric ranges, and finding count are all capped.
- **Graceful degradation.** With no key (or on any network/rate-limit error) the app falls
  back to a deterministic **on-device brief**, so the static SPA has *no hard backend
  dependency* and works fully offline. This path is covered by an e2e test.
- **Responsible-AI disclosure.** The panel labels output as AI-generated, repeats that all
  figures are typical annual estimates (not advice), and the system prompt forbids invented
  figures or fabricated sources.

Set `ANTHROPIC_API_KEY` in your serverless host (see `.env.example`); `vercel.json` ships a
strict Content-Security-Policy and security headers. Without a key, everything else runs.

## Quick start

```bash
npm install
npm run dev        # start the dev server (Vite)
npm test           # unit tests (Vitest) — the carbon math + storage helpers
npm run test:e2e   # end-to-end tests (Playwright) against the production build
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
```

> First e2e run: `npx playwright install chromium` to fetch the browser.

CI (`.github/workflows/ci.yml`) runs type-check → unit → build → e2e on every
push and PR to `main`.

## Project layout

```
src/
  core/            ← pure, framework-free, fully testable
    factors.ts       emission & cost factors (Indian grid averages)
    clues.ts         the 33-clue evidence ledger (typed)
    audit.ts         impact / severity / findings / totals / verdict / rank / equivalents
  components/       ← React UI (Briefing, Investigation, Report, InspectorHoot, Spotlight, CountUp)
  hooks/           ← useMediaQuery (reduced-motion / pointer), useAssistant (typewriter queue)
  lib/confetti.ts  ← short-lived imperative DOM flourish
  styles.css       ← the "case file" design system
test/
  audit.test.ts    ← unit tests for the calculation core
  storage.test.ts  ← unit tests for persistence/comparison helpers
e2e/
  app.spec.ts      ← Playwright end-to-end flows (briefing → report, persistence, a11y)
```

## What changed from the original (review fixes)

1. **Self-XSS removed.** The detective-name field was previously concatenated into the
   report via `innerHTML`. In React it flows through JSX as text and is escaped by
   construction — a name like `<img src=x onerror=…>` is shown literally.
2. **Badge contrast fixed.** The `MODERATE` (`#B07B1E → #8A5A00`) and `LOW`
   (`#5A7D5A → #4E704E`) severity badges now clear WCAG AA (4.5:1) for small text on the
   paper background.
3. **Testable carbon core.** All audit math lives in `src/core/audit.ts` as pure functions
   and is covered by `test/audit.test.ts` (impact, severity boundaries, totals, verdict
   bands, rank, equivalents, and clue-ledger data integrity).

Plus smaller refinements: focus moves to the active step on navigation, count values and
the evidence note announce via `aria-live`, report tables use `<thead>`/`scope="col"`, and
the cursor spotlight pauses when the tab is hidden.

## Notes

- All figures are **typical annual estimates**, not meter readings. A real audit would
  measure. Assumptions are documented in `src/core/factors.ts` and surfaced to users in the
  report's "Show the working" section.
- Motion, the flashlight cursor and confetti all respect `prefers-reduced-motion`.
