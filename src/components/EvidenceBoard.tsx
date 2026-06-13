import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { fmt, type Finding } from "../core/audit";

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** The prime suspects rendered as a detective's corkboard: pinned index cards
 *  with red string running back to the verdict. The string is measured from the
 *  actual pin positions (via ResizeObserver), so it stays connected whether the
 *  cards sit in a row or stack on a narrow screen. */
export function EvidenceBoard({ suspects, verdict }: { suspects: Finding[]; verdict: string }) {
  const n = suspects.length;
  const boardRef = useRef<HTMLDivElement>(null);
  const verdictPinRef = useRef<HTMLSpanElement>(null);
  const cardPinRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const board = boardRef.current;
    const vpin = verdictPinRef.current;
    if (!board || !vpin) return;

    const center = (el: Element, br: DOMRect) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - br.left, y: r.top + r.height / 2 - br.top };
    };
    const measure = () => {
      const br = board.getBoundingClientRect();
      const start = center(vpin, br);
      setSize({ w: br.width, h: br.height });
      setLines(
        cardPinRefs.current
          .filter((p): p is HTMLSpanElement => !!p)
          .map((pin) => {
            const c = center(pin, br);
            return { x1: start.x, y1: start.y, x2: c.x, y2: c.y };
          }),
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    return () => ro.disconnect();
  }, [suspects]);

  return (
    <div className="evidence-board" ref={boardRef} role="group" aria-label="Prime suspects evidence board">
      <svg className="board-string" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
        ))}
      </svg>

      <div className="board-verdict">
        <span className="pin" ref={verdictPinRef} aria-hidden="true" />
        Verdict: {verdict}
      </div>

      <div className="board-cards">
        {suspects.map((f, i) => (
          <article
            className="suspect-card"
            key={f.c.id}
            style={{ "--rot": `${(i - (n - 1) / 2) * 2.4}deg` } as CSSProperties}
          >
            <span
              className="pin"
              ref={(el) => {
                cardPinRefs.current[i] = el;
              }}
              aria-hidden="true"
            />
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
