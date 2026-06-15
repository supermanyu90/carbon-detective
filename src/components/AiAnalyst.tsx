import { useEffect, useRef, useState } from "react";
import type { Mode } from "../core/clues";
import type { Finding, Impact } from "../core/audit";
import { runAnalyst, type AnalystSource } from "../lib/aiAnalyst";

interface Props {
  mode: Mode;
  verdict: string;
  totals: Impact;
  found: Finding[];
  reduceMotion: boolean;
}

type Phase = "idle" | "running" | "done";

/** AI Case Analyst — Claude turns the structured audit into a
 *  personalised, prioritised action plan. Streams in; degrades to an
 *  on-device brief when the AI tier is unavailable. */
export function AiAnalyst({ mode, verdict, totals, found, reduceMotion }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [text, setText] = useState("");
  const [source, setSource] = useState<AnalystSource | null>(null);
  const abort = useRef<AbortController | null>(null);

  const start = () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setPhase("running");
    setText("");
    setSource(null);
    runAnalyst(mode, verdict, totals, found, {
      signal: ctrl.signal,
      onToken: (full) => setText(full),
    })
      .then((r) => {
        setText(r.text);
        setSource(r.source);
        setPhase("done");
      })
      .catch(() => setPhase("done"));
  };

  // Tidy up any in-flight request if the report unmounts.
  useEffect(() => () => abort.current?.abort(), []);

  return (
    <section className="ai-analyst card" aria-labelledby="ai-analyst-h">
      <div className="ai-analyst-head">
        <h3 id="ai-analyst-h" className="disp" style={{ fontSize: "1.15rem", margin: 0 }}>
          🦉 Ask the AI analyst
        </h3>
        {source && (
          <span className={`ai-badge ${source}`}>
            {source === "ai" ? "AI-generated · Claude" : "On-device brief"}
          </span>
        )}
      </div>

      {phase === "idle" && (
        <>
          <p className="hint" style={{ marginTop: 6 }}>
            Inspector Hoot can read your confirmed findings and write a personalised,
            prioritised plan — biggest savings first. Your name and case number are never
            sent; only the anonymous audit numbers you see above.
          </p>
          <button className="btn" onClick={start} disabled={!found.length && totals.co2 === 0}>
            ✨ Write my action plan
          </button>
        </>
      )}

      {phase !== "idle" && (
        <>
          <p
            className={`ai-output${phase === "running" && !reduceMotion ? " streaming" : ""}`}
            aria-live="polite"
            aria-busy={phase === "running"}
          >
            {text || (phase === "running" ? "Reading the case file…" : "")}
          </p>
          {phase === "done" && (
            <div className="ai-analyst-foot no-print">
              <button className="btn secondary" onClick={start}>
                ↻ Regenerate
              </button>
              <span className="hint ai-disclaimer">
                AI can be wrong; figures are typical annual estimates, not advice.
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
