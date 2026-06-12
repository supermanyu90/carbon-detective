import { useMemo } from "react";
import type { Mode, Clue } from "../core/clues";
import {
  cluesForMode,
  zonesForMode,
  impact,
  severity,
  fmt,
  type Answers,
} from "../core/audit";

interface Props {
  mode: Mode;
  answers: Answers;
  onAnswerYN: (id: string, yes: boolean) => void;
  onStepCount: (id: string, delta: number) => void;
  onSetCount: (id: string, n: number) => void;
  onGenerate: () => void;
  onBack: () => void;
}

function ClueRow({
  c,
  answers,
  onAnswerYN,
  onStepCount,
  onSetCount,
}: {
  c: Clue;
  answers: Answers;
  onAnswerYN: Props["onAnswerYN"];
  onStepCount: Props["onStepCount"];
  onSetCount: Props["onSetCount"];
}) {
  const a = answers[c.id];
  const sev = severity(c);
  const found = !!a?.found;
  const note = found
    ? `📌 Evidence logged — est. ${fmt(impact(c, a!.n).co2)} kg CO₂ & ₹${fmt(impact(c, a!.n).cost)} per year`
    : "";

  return (
    <div className={`clue${found ? " found" : ""}`}>
      <div className="clue-main">
        <p className="clue-q">{c.q}</p>
        <p className="clue-why">{c.why}</p>
        <span className={`sev ${sev}`}>{sev} impact</span>
        <p className="found-note" aria-live="polite">
          {note}
        </p>
      </div>

      {c.type === "yn" ? (
        <div className="clue-ctrl" role="group" aria-label="Answer">
          <button
            className="pill yes"
            aria-pressed={a?.answered ? a.found : false}
            onClick={() => onAnswerYN(c.id, true)}
          >
            Yes 🔎
          </button>
          <button
            className="pill no"
            aria-pressed={a?.answered ? !a.found : false}
            onClick={() => onAnswerYN(c.id, false)}
          >
            No ✓
          </button>
        </div>
      ) : (
        <div className="clue-ctrl">
          <div
            className="stepper"
            role="group"
            aria-label={`Count of ${c.unit}`}
          >
            <button aria-label="Decrease count" onClick={() => onStepCount(c.id, -1)}>
              −
            </button>
            <span
              className="val"
              role="status"
              aria-live="polite"
              aria-label={a?.answered ? `${a.n} ${c.unit}` : `no ${c.unit} counted yet`}
            >
              {a?.answered ? a.n : "–"}
            </span>
            <button aria-label="Increase count" onClick={() => onStepCount(c.id, 1)}>
              +
            </button>
          </div>
          <button
            className="pill no"
            aria-pressed={a?.answered ? a.n === 0 : false}
            onClick={() => onSetCount(c.id, 0)}
          >
            None ✓
          </button>
        </div>
      )}
    </div>
  );
}

export function Investigation({
  mode,
  answers,
  onAnswerYN,
  onStepCount,
  onSetCount,
  onGenerate,
  onBack,
}: Props) {
  const clues = useMemo(() => cluesForMode(mode), [mode]);
  const zones = useMemo(() => zonesForMode(mode), [mode]);

  const done = clues.filter((c) => answers[c.id]?.answered).length;
  const found = clues.filter((c) => answers[c.id]?.found).length;
  const allDone = done === clues.length;
  const remaining = clues.length - done;

  return (
    <>
      <div className="progress-bar">
        <span className="mono">{`${done} of ${clues.length} clues examined`}</span>
        <div className="meter" aria-hidden="true">
          <div className="prog-fill" style={{ width: `${(100 * done) / clues.length}%` }} />
        </div>
        <span className="mono">{`Evidence: ${found}`}</span>
      </div>

      <div>
        {zones.map((z, zi) => {
          const zc = clues.filter((c) => c.zone === z);
          const zd = zc.filter((c) => answers[c.id]?.answered).length;
          const cleared = zd === zc.length;
          return (
            <details className="zone" key={z} open={zi === 0}>
              <summary>
                <span className="zone-ico">{zc[0].ico}</span>
                <span className="zone-title">{`Zone ${zi + 1} — ${z}`}</span>
                {cleared ? (
                  <span className="zone-done">Zone cleared ✓</span>
                ) : (
                  <span className="zone-count">{`${zd} / ${zc.length} examined`}</span>
                )}
                <span className="chev mono" aria-hidden="true">
                  ›
                </span>
              </summary>
              <div>
                {zc.map((c) => (
                  <ClueRow
                    key={c.id}
                    c={c}
                    answers={answers}
                    onAnswerYN={onAnswerYN}
                    onStepCount={onStepCount}
                    onSetCount={onSetCount}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <div className="actions-row">
        <button className="btn green" disabled={!allDone} onClick={onGenerate}>
          📋 Close the case &amp; generate report
        </button>
        <button className="btn secondary" onClick={onBack}>
          ← Back to briefing
        </button>
      </div>
      <p className="hint no-print" style={{ marginTop: 10 }}>
        {allDone
          ? "All zones swept. The case is ready to close."
          : `Examine every clue to unlock the audit report (${remaining} remaining).`}
      </p>
    </>
  );
}
