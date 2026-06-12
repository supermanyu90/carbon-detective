import type { Mode } from "../core/clues";

interface Props {
  mode: Mode;
  detName: string;
  onSetMode: (m: Mode) => void;
  onSetName: (name: string) => void;
  onStart: () => void;
}

export function Briefing({ mode, detName, onSetMode, onSetName, onStart }: Props) {
  return (
    <div className="card">
      <h2>Case briefing</h2>
      <p className="hint">
        Pick the scene of the investigation. Each scene has its own zones and clues. You can
        answer from memory or actually walk around and check — walking around is what real
        auditors do, and it&rsquo;s more fun.
      </p>
      <div className="mode-grid">
        <button
          className="mode-btn"
          aria-pressed={mode === "home"}
          onClick={() => onSetMode("home")}
        >
          <span className="big">🏠 The Home Case</span>
          5 zones · standby power, leaky taps, geysers, fridges, vehicles. Roughly 10–15 minutes.
        </button>
        <button
          className="mode-btn"
          aria-pressed={mode === "class"}
          onClick={() => onSetMode("class")}
        >
          <span className="big">🏫 The Classroom / Office Case</span>
          4 zones · lights, fans, computer labs, pantries, washrooms. Roughly 8–12 minutes.
        </button>
      </div>
      <div className="field">
        <label htmlFor="detName">Detective name (optional)</label>
        <input
          type="text"
          id="detName"
          maxLength={30}
          placeholder="e.g. Inspector Verma"
          autoComplete="off"
          value={detName}
          onChange={(e) => onSetName(e.target.value)}
        />
      </div>
      <p className="hint" style={{ marginTop: 14 }}>
        💡 How it works: every clue you confirm carries a realistic annual estimate of wasted
        electricity, fuel or water. The report converts these into kilograms of CO₂ and rupees,
        and shows you exactly how each number was calculated — the same logic professional energy
        auditors use, just simplified.
      </p>
      <div className="actions-row">
        <button className="btn" onClick={onStart}>
          🔍 Begin investigation
        </button>
      </div>
    </div>
  );
}
