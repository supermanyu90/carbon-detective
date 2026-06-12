import { useEffect, useRef, useState } from "react";
import type { Mode } from "./core/clues";
import {
  cluesForMode,
  findings,
  severity,
  totals,
  verdict,
  zonesForMode,
  type Answer,
  type Answers,
} from "./core/audit";
import { CLUES } from "./core/clues";
import { usePrefersReducedMotion, useFinePointer } from "./hooks/useMediaQuery";
import { useAssistantStore } from "./hooks/useAssistant";
import { throwConfetti } from "./lib/confetti";
import {
  loadHistory,
  loadWip,
  previousOf,
  saveHistory,
  saveWip,
  upsertHistory,
  type ReportSnapshot,
} from "./lib/storage";
import { Briefing } from "./components/Briefing";
import { FieldManual } from "./components/FieldManual";
import { Investigation } from "./components/Investigation";
import { Report } from "./components/Report";
import { InspectorHoot } from "./components/InspectorHoot";
import { Spotlight } from "./components/Spotlight";

const HIGH_LINES = [
  "Big catch! That one’s a repeat offender.",
  "Major evidence. Fixing this pays for the whole investigation.",
  "Ooh — a prime suspect if I ever saw one.",
];
const MOD_LINES = [
  "Logged in the ledger. Every kilo counts.",
  "Noted. Small leaks sink big ships.",
  "Good eye, detective.",
];
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (n: number) => Math.max(0, Math.min(99, n));

const STEP_TABS = ["1 · Briefing", "2 · Investigation", "3 · Audit Report"];
const DEFAULT_CASE_NO = "CASE No. CD-0000 · OPENED TODAY";

export default function App() {
  const reduceMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const asst = useAssistantStore(reduceMotion);
  const say = asst.say;

  // Restore an in-progress case (if any) exactly once.
  const wip0 = useRef(loadWip()).current;

  const [step, setStep] = useState(wip0?.step ?? 0);
  const [mode, setMode] = useState<Mode>(wip0?.mode ?? "home");
  const [detName, setDetName] = useState(wip0?.detName ?? "");
  const [answers, setAnswers] = useState<Answers>(wip0?.answers ?? {});
  const [investigationUnlocked, setInvestigationUnlocked] = useState(
    wip0?.investigationUnlocked ?? false,
  );
  const [reportUnlocked, setReportUnlocked] = useState(wip0?.reportUnlocked ?? false);
  const [caseNo, setCaseNo] = useState(wip0?.caseNo ?? DEFAULT_CASE_NO);
  const [stampText, setStampText] = useState(wip0?.stampText ?? "Open Case");
  const [filedAt, setFiledAt] = useState<Date>(() =>
    wip0?.filedAt ? new Date(wip0.filedAt) : new Date(),
  );
  const [history, setHistory] = useState<ReportSnapshot[]>(() => loadHistory());
  const [previousSnapshot, setPreviousSnapshot] = useState<ReportSnapshot | null>(null);

  // Mirror of answers for synchronous reads inside rapid-fire handlers.
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const clearedZones = useRef<Set<string>>(new Set());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  const sectionRef = useRef<HTMLElement>(null);
  const mounted = useRef(false);

  /* ---- Seed cleared-zone tracking from any restored answers (once) ---- */
  useEffect(() => {
    const cz = new Set<string>();
    const clues = cluesForMode(mode);
    for (const z of zonesForMode(mode)) {
      if (clues.filter((c) => c.zone === z).every((c) => answers[c.id]?.answered)) cz.add(z);
    }
    clearedZones.current = cz;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Autosave the in-progress case ---- */
  useEffect(() => {
    saveWip({
      v: 1,
      mode,
      detName,
      answers,
      caseNo,
      stampText,
      investigationUnlocked,
      reportUnlocked,
      step,
      filedAt: filedAt.toISOString(),
    });
  }, [
    mode,
    detName,
    answers,
    caseNo,
    stampText,
    investigationUnlocked,
    reportUnlocked,
    step,
    filedAt,
  ]);

  /* ---- Greeting (welcome back if a case was restored) ---- */
  useEffect(() => {
    const resumed = wip0 && (wip0.step > 0 || Object.keys(wip0.answers).length > 0);
    const t = setTimeout(
      () =>
        say(
          resumed
            ? "Welcome back, detective. Your case file was right where you left it."
            : "Inspector Hoot, at your service. Pick a scene and we’ll sniff out the wasted watts.",
          "excited",
          true,
        ),
      900,
    );
    return () => clearTimeout(t);
  }, [say, wip0]);

  /* ---- Focus the active section on step change (skip first mount) ---- */
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    sectionRef.current?.focus();
  }, [step]);

  /* ---- Idle nudge while investigating ---- */
  const stopIdle = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = null;
  };
  const resetIdle = () => {
    stopIdle();
    idleTimer.current = setTimeout(() => {
      if (stepRef.current === 1)
        say("Stuck on a clue? Go and look — the meter cupboard never lies.");
    }, 50000);
  };
  useEffect(() => stopIdle, []);
  useEffect(() => () => asst.dispose(), [asst]);

  /* ---- Briefing ---- */
  const chooseMode = (m: Mode) => {
    setMode(m);
    say(
      m === "home"
        ? "The domestic case. My money is on the geyser."
        : "An institutional case. Corridor lights are usually guilty.",
    );
  };

  const startInvestigation = () => {
    setAnswers({});
    answersRef.current = {};
    clearedZones.current = new Set();
    const caseNum = "CD-" + String(Math.floor(1000 + Math.random() * 9000));
    const today = new Date()
      .toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      .toUpperCase();
    setCaseNo(`CASE No. ${caseNum} · OPENED ${today}`);
    setStampText("Under Investigation");
    setInvestigationUnlocked(true);
    setReportUnlocked(false);
    setStep(1);
    say(
      "Sweep one zone at a time. Better still, walk over and check — real detectives leave the chair.",
      "excited",
      true,
    );
    resetIdle();
  };

  /* ---- Answering ---- */
  const afterAnswer = (id: string, ans: Answer, next: Answers) => {
    resetIdle();
    if (ans.found) {
      if (id === "chargers") {
        say(
          "Plot twist: empty chargers are nearly innocent — barely 4 units a year. Save your zeal for the geyser.",
          "excited",
        );
      } else {
        const c = CLUES.find((x) => x.id === id)!;
        if (severity(c) === "HIGH") say(pick(HIGH_LINES), "excited");
        else if (Math.random() < 0.4) say(pick(MOD_LINES));
      }
    }
    const clues = cluesForMode(mode);
    for (const z of zonesForMode(mode)) {
      const zc = clues.filter((c) => c.zone === z);
      if (zc.every((c) => next[c.id]?.answered) && !clearedZones.current.has(z)) {
        clearedZones.current.add(z);
        if (clues.every((c) => next[c.id]?.answered))
          say("Every clue examined. Close the case when you’re ready, chief.", "excited", true);
        else say(`${z} — cleared. Onward.`, "excited");
      }
    }
  };

  const applyAnswer = (id: string, ans: Answer) => {
    const next: Answers = { ...answersRef.current, [id]: ans };
    answersRef.current = next;
    setAnswers(next);
    afterAnswer(id, ans, next);
  };

  const answerYN = (id: string, yes: boolean) =>
    applyAnswer(id, { answered: true, found: yes, n: yes ? 1 : 0 });
  const setCount = (id: string, n: number) =>
    applyAnswer(id, { answered: true, found: n > 0, n });
  const stepCount = (id: string, delta: number) => {
    const cur = answersRef.current[id]?.n ?? 0;
    setCount(id, clamp(cur + delta));
  };

  /* ---- Report ---- */
  const generateReport = () => {
    const now = new Date();
    setFiledAt(now);

    const f = findings(mode, answersRef.current);
    const t = totals(f);
    const nFound = f.length;
    const nClues = cluesForMode(mode).length;
    const snap: ReportSnapshot = {
      at: now.toISOString(),
      caseNo,
      mode,
      name: detName.trim() || "Detective",
      co2: t.co2,
      cost: t.cost,
      kwh: t.kwh,
      water: t.water,
      fuel: t.fuel,
      nFound,
      nClues,
      verdict: verdict(nFound / nClues).s,
    };
    setPreviousSnapshot(previousOf(history, mode, caseNo));
    const nextHistory = upsertHistory(history, snap);
    setHistory(nextHistory);
    saveHistory(nextHistory);

    setReportUnlocked(true);
    setStampText("Case Closed");
    setStep(2);
    stopIdle();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (nFound > 0 && !reduceMotion) throwConfetti();
    say(
      nFound === 0
        ? "Spotless. Suspiciously spotless. I’d still re-check that geyser."
        : "Case closed! Print it, pin it on the fridge, and re-run me in three months.",
      "excited",
      true,
    );
  };

  const resetCase = () => {
    setAnswers({});
    answersRef.current = {};
    clearedZones.current = new Set();
    setInvestigationUnlocked(false);
    setReportUnlocked(false);
    setPreviousSnapshot(null);
    setStampText("Open Case");
    setCaseNo(DEFAULT_CASE_NO);
    setStep(0);
    say("Fresh case file. Where shall we look this time?", "excited", true);
  };

  const tabEnabled = [true, investigationUnlocked, reportUnlocked];

  return (
    <>
      <div className="wrap">
        <header className="case-head">
          <div className="case-row">
            <div>
              <p className="eyebrow">Confidential · Environmental Investigation Unit</p>
              <h1>The Carbon Detective</h1>
              <p className="case-no">{caseNo}</p>
            </div>
            <div className="stamp stamp-anim" key={stampText}>
              {stampText}
            </div>
          </div>
          <p className="lede">
            Somewhere in this building, energy and water are quietly going to waste — and the carbon
            adds up. Your job: sweep each zone, log the evidence, and close the case with a full
            audit report and savings estimate. No experience needed. Reading glasses welcome.
          </p>
        </header>

        <nav className="steps" role="tablist" aria-label="Investigation steps">
          {STEP_TABS.map((label, i) => (
            <button
              key={i}
              className="step-tab"
              role="tab"
              aria-selected={step === i}
              disabled={!tabEnabled[i]}
              onClick={() => setStep(i)}
            >
              <span className="dot" />
              {label}
            </button>
          ))}
        </nav>

        <section ref={sectionRef} tabIndex={-1} aria-label={STEP_TABS[step]}>
          {step === 0 && (
            <>
              <Briefing
                mode={mode}
                detName={detName}
                history={history}
                onSetMode={chooseMode}
                onSetName={setDetName}
                onStart={startInvestigation}
              />
              <FieldManual />
            </>
          )}
          {step === 1 && (
            <Investigation
              mode={mode}
              answers={answers}
              flashlight={finePointer && !reduceMotion}
              onAnswerYN={answerYN}
              onStepCount={stepCount}
              onSetCount={setCount}
              onGenerate={generateReport}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <>
              <Report
                mode={mode}
                answers={answers}
                detName={detName}
                reduceMotion={reduceMotion}
                filedAt={filedAt}
                previous={previousSnapshot}
              />
              <div className="actions-row no-print">
                <button className="btn" onClick={() => window.print()}>
                  🖨️ Print / save as PDF
                </button>
                <button className="btn secondary" onClick={() => setStep(1)}>
                  ← Re-examine clues
                </button>
                <button className="btn secondary" onClick={resetCase}>
                  🗂️ Open a new case
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <Spotlight enabled={finePointer && !reduceMotion} />
      <InspectorHoot store={asst} />
    </>
  );
}
