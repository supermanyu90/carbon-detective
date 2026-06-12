import type { CSSProperties } from "react";
import { fmt, type Finding } from "../core/audit";

/** The prime suspects rendered as a detective's corkboard: pinned index cards
 *  with red string running back to the verdict. Decorative string positions are
 *  approximate (evenly-spaced cards), so no DOM measurement is needed. */
export function EvidenceBoard({ suspects, verdict }: { suspects: Finding[]; verdict: string }) {
  const n = suspects.length;
  const xs = n === 1 ? [50] : n === 2 ? [27, 73] : [16, 50, 84];

  return (
    <div className="evidence-board" role="group" aria-label="Prime suspects evidence board">
      <svg className="board-string" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {xs.map((x, i) => (
          <line key={i} x1="50" y1="11" x2={x} y2="48" />
        ))}
      </svg>

      <div className="board-verdict">
        <span className="pin" aria-hidden="true" />
        Verdict: {verdict}
      </div>

      <div className="board-cards">
        {suspects.map((f, i) => (
          <article
            className="suspect-card"
            key={f.c.id}
            style={{ "--rot": `${(i - (n - 1) / 2) * 2.4}deg` } as CSSProperties}
          >
            <span className="pin" aria-hidden="true" />
            <p className="card-rank">Suspect #{i + 1}</p>
            <p className="card-title">
              {f.c.ico} {f.c.q}
              {f.c.type === "count" && (
                <span className="mono">
                  {" "}
                  (× {f.n} {f.c.unit})
                </span>
              )}
            </p>
            <p className="card-fix">Fix: {f.c.fix}</p>
            <p className="card-save">
              ≈ {fmt(f.im.co2)} kg CO₂ · ₹{fmt(f.im.cost)} / yr
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
