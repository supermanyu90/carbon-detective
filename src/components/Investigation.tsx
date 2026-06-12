import { useEffect, useMemo, useState } from "react";
import type { Mode, Clue } from "../core/clues";
import {
  cluesForMode,
  zonesForMode,
  impact,
  severity,
  fmt,
  type Answers,
} from "../core/audit";
import { SceneMap, type Room } from "./SceneMap";

interface Props {
  mode: Mode;
  answers: Answers;
  flashlight: boolean;
  onAnswerYN: (id: string, yes: boolean) => void;
  onStepCount: (id: string, delta: number) => void;
  onSetCount: (id: string, n: number) => void;
  onGenerate: () => void;
  onBack: () => void;
}

/** Editable count field with a local draft, so the user can clear it,
 *  select-replace, and type freely. Commits live; empty commits 0 on blur. */
function CountInput({
  value,
  answered,
  unit,
  onSet,
}: {
  value: number;
  answered: boolean;
  unit: string;
  onSet: (n: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft !== null ? draft : answered ? String(value) : "";

  return (
    <input
      className="val"
      type="number"
      min={0}
      max={99}
      inputMode="numeric"
      aria-label={`Number of ${unit}`}
      value={shown}
      placeholder="–"
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const v = e.target.value;
        setDraft(v);
        if (v === "") return; // allow an empty field while typing
        onSet(Math.max(0, Math.min(99, Math.floor(Number(v) || 0))));
      }}
      onBlur={() => {
        if (draft === "") onSet(0); // empty means "none"
        setDraft(null);
      }}
    />
  );
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
    <div className={`clue${found ? " found" : ""}`} id={`clue-${c.id}`} tabIndex={-1}>
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
          <div className="stepper" role="group" aria-label={`Count of ${c.unit}`}>
            <button aria-label="Decrease count" onClick={() => onStepCount(c.id, -1)}>
              −
            </button>
            <CountInput
              value={a?.n ?? 0}
              answered={!!a?.answered}
              unit={c.unit!}
              onSet={(n) => onSetCount(c.id, n)}
            />
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
  flashlight,
  onAnswerYN,
  onStepCount,
  onSetCount,
  onGenerate,
  onBack,
}: Props) {
  const clues = useMemo(() => cluesForMode(mode), [mode]);
  const zones = useMemo(() => zonesForMode(mode), [mode]);

  const [openZones, setOpenZones] = useState<Record<string, boolean>>(() => ({
    [zones[0]]: true,
  }));
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  // Reset open state if the scene changes (e.g. after returning to briefing).
  useEffect(() => {
    setOpenZones({ [zones[0]]: true });
  }, [mode, zones]);

  const done = clues.filter((c) => answers[c.id]?.answered).length;
  const found = clues.filter((c) => answers[c.id]?.found).length;
  const allDone = done === clues.length;
  const remaining = clues.length - done;
  const firstUnanswered = clues.find((c) => !answers[c.id]?.answered);

  const rooms: Room[] = zones.map((z) => {
    const zc = clues.filter((c) => c.zone === z);
    return {
      zone: z,
      ico: zc[0].ico,
      total: zc.length,
      done: zc.filter((c) => answers[c.id]?.answered).length,
      found: zc.filter((c) => answers[c.id]?.found).length,
    };
  });

  const jumpToNext = () => {
    if (!firstUnanswered) return;
    setOpenZones((o) => ({ ...o, [firstUnanswered.zone]: true }));
    setScrollTarget(`clue-${firstUnanswered.id}`);
  };

  const pickRoom = (i: number) => {
    setOpenZones((o) => ({ ...o, [zones[i]]: true }));
    setScrollTarget(`zone-${i}`);
  };

  const markRemaining = () => {
    for (const c of clues) {
      if (!answers[c.id]?.answered) {
        if (c.type === "yn") onAnswerYN(c.id, false);
        else onSetCount(c.id, 0);
      }
    }
  };

  // After opening a zone/clue (state), scroll to it and move focus.
  useEffect(() => {
    if (!scrollTarget) return;
    const el = document.getElementById(scrollTarget);
    if (el) {
      const isZone = scrollTarget.startsWith("zone-");
      el.scrollIntoView({ behavior: "smooth", block: isZone ? "start" : "center" });
      if (isZone) el.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
      else el.focus({ preventScroll: true });
    }
    setScrollTarget(null);
  }, [scrollTarget]);

  return (
    <>
      <SceneMap mode={mode} rooms={rooms} flashlight={flashlight} onPick={pickRoom} />

      <div className="progress-bar">
        <span className="mono">{`${done} of ${clues.length} clues examined`}</span>
        <div className="meter" aria-hidden="true">
          <div className="prog-fill" style={{ width: `${(100 * done) / clues.length}%` }} />
        </div>
        <span className="mono">{`Evidence: ${found}`}</span>
      </div>

      {flashlight && (
        <p className="hint flashlight-hint no-print">
          🔦 Shine your cursor over a clue to bring it into the light.
        </p>
      )}

      {remaining > 0 && (
        <div className="guide-row no-print">
          <button className="ghost-btn" onClick={jumpToNext}>
            ↳ Go to next unanswered clue
            <span className="ghost-count">{remaining}</span>
          </button>
          {done > 0 && (
            <button className="ghost-btn" onClick={markRemaining}>
              Mark remaining as &ldquo;no waste&rdquo;
            </button>
          )}
        </div>
      )}

      <div className={flashlight ? "zones-host flashlight" : "zones-host"}>
        {zones.map((z, zi) => {
          const zc = clues.filter((c) => c.zone === z);
          const zd = zc.filter((c) => answers[c.id]?.answered).length;
          const cleared = zd === zc.length;
          return (
            <details
              className="zone"
              id={`zone-${zi}`}
              key={z}
              open={!!openZones[z]}
              onToggle={(e) => {
                // Read .open synchronously — the synthetic event's currentTarget
                // is nulled out by the time a state-updater callback runs.
                const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                setOpenZones((o) => ({ ...o, [z]: isOpen }));
              }}
            >
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
