import { equivalents, type Impact } from "../core/audit";
import { CountUp } from "./CountUp";

interface Props {
  impact: Impact;
  reduceMotion: boolean;
}

/** Animated "what this equals" payoff for the report. Same figures as the
 *  ledger, but the tree grows, the car drives off, and the battery fills. */
export function Equivalences({ impact, reduceMotion }: Props) {
  const { trees, km, phones, buckets } = equivalents(impact);

  return (
    <div className="equiv equiv-board">
      <p className="equiv-lead">🔦 Fixing everything in this report is worth, every year:</p>
      <div className="equiv-grid">
        <div className="equiv-item">
          <span className="equiv-ico grow" aria-hidden="true">
            🌳
          </span>
          <span className="equiv-num">
            <CountUp value={Math.max(1, trees)} reduceMotion={reduceMotion} />
          </span>
          <span className="equiv-lbl">
            mature tree{trees >= 1.5 ? "s" : ""} working a full year
          </span>
        </div>
        <div className="equiv-item">
          <span className="equiv-ico drive" aria-hidden="true">
            🚗
          </span>
          <span className="equiv-num">
            <CountUp value={km} suffix=" km" reduceMotion={reduceMotion} />
          </span>
          <span className="equiv-lbl">of car travel skipped</span>
        </div>
        <div className="equiv-item">
          <span className="equiv-ico charge" aria-hidden="true">
            🔋
          </span>
          <span className="equiv-num">
            <CountUp value={phones} reduceMotion={reduceMotion} />
          </span>
          <span className="equiv-lbl">smartphone charges</span>
        </div>
        {impact.water > 0 && (
          <div className="equiv-item">
            <span className="equiv-ico pour" aria-hidden="true">
              🪣
            </span>
            <span className="equiv-num">
              <CountUp value={buckets} reduceMotion={reduceMotion} />
            </span>
            <span className="equiv-lbl">buckets of water saved</span>
          </div>
        )}
      </div>
    </div>
  );
}
