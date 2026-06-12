import { useMemo } from "react";
import type { Mode } from "../core/clues";
import {
  cluesForMode,
  findings,
  totals,
  verdict,
  rank,
  equivalents,
  fmt,
  type Answers,
} from "../core/audit";
import { CountUp } from "./CountUp";

interface Props {
  mode: Mode;
  answers: Answers;
  detName: string;
  reduceMotion: boolean;
  /** Stable timestamp captured when the report was filed. */
  filedAt: Date;
}

export function Report({ mode, answers, detName, reduceMotion, filedAt }: Props) {
  const found = useMemo(() => findings(mode, answers), [mode, answers]);
  const tot = useMemo(() => totals(found), [found]);

  // `detName` is rendered as JSX text below — React escapes it, so a name like
  // `<img src=x onerror=...>` is shown literally and cannot execute.
  const name = detName.trim() || "Detective";
  const nFound = found.length;
  const nClues = cluesForMode(mode).length;
  const ratio = nFound / nClues;
  const v = verdict(ratio);
  const detRank = rank(ratio, nFound);
  const eq = equivalents(tot);

  const filed = filedAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const suspects = found.slice(0, 3);
  const others = found.slice(3);

  return (
    <div className="card">
      <div className="report-head">
        <div>
          <p className="eyebrow">Environmental Investigation Unit · Final Report</p>
          <h2 className="disp" style={{ fontSize: "1.6rem" }}>
            Audit Report — {mode === "home" ? "The Home Case" : "The Classroom / Office Case"}
          </h2>
          <p className="case-no">
            Filed by {name} · {filed} · {nFound} of {nClues} clues confirmed
          </p>
          <p className="rank-badge" style={{ marginTop: 10 }}>
            {detRank}
          </p>
        </div>
        <div className="stamp verdict-stamp stamp-anim" key={v.s}>
          {v.s}
        </div>
      </div>

      <p>{v.msg}</p>

      <div className="stat-grid">
        <div className="stat red">
          <span className="num">
            <CountUp value={tot.co2} suffix=" kg" reduceMotion={reduceMotion} />
          </span>
          <span className="lbl">CO₂ avoidable / year</span>
        </div>
        <div className="stat green">
          <span className="num">
            <CountUp value={tot.cost} prefix="₹" reduceMotion={reduceMotion} />
          </span>
          <span className="lbl">Savings / year</span>
        </div>
        <div className="stat">
          <span className="num">
            <CountUp value={tot.kwh} suffix=" kWh" reduceMotion={reduceMotion} />
          </span>
          <span className="lbl">Electricity wasted</span>
        </div>
        <div className="stat">
          <span className="num">
            <CountUp value={tot.water} suffix=" L" reduceMotion={reduceMotion} />
          </span>
          <span className="lbl">Water wasted</span>
        </div>
        {tot.fuel > 0 && (
          <div className="stat">
            <span className="num">
              <CountUp value={tot.fuel} suffix=" L" reduceMotion={reduceMotion} />
            </span>
            <span className="lbl">Fuel wasted</span>
          </div>
        )}
      </div>

      {tot.co2 > 0 && (
        <div className="equiv">
          🌳 Fixing everything in this report equals the yearly work of{" "}
          <strong>
            {fmt(Math.max(1, eq.trees))} mature tree{eq.trees >= 1.5 ? "s" : ""}
          </strong>
          , or skipping <strong>{fmt(eq.km)} km</strong> of car travel, or{" "}
          <strong>{fmt(eq.phones)}</strong> smartphone charges
          {tot.water > 0 && (
            <>
              , plus <strong>{fmt(eq.buckets)}</strong> buckets of water saved
            </>
          )}
          .
        </div>
      )}

      {nFound > 0 && (
        <>
          <h3 className="disp" style={{ fontSize: "1.2rem", marginTop: 10 }}>
            Prime suspects — fix these first
          </h3>
          <ul className="suspects">
            {suspects.map((f, i) => (
              <li key={f.c.id}>
                <span className="rank">#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <p className="suspect-name">
                    {f.c.ico} {f.c.q}
                    {f.c.type === "count" && (
                      <span className="mono">
                        {" "}
                        (× {f.n} {f.c.unit})
                      </span>
                    )}
                  </p>
                  <p className="suspect-fix">Recommended fix: {f.c.fix}</p>
                  <p className="suspect-save">
                    Saves ≈ {fmt(f.im.co2)} kg CO₂ and ₹{fmt(f.im.cost)} every year
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {others.length > 0 && (
        <>
          <h3 className="disp" style={{ fontSize: "1.1rem", marginTop: 18 }}>
            Also on file
          </h3>
          <table className="method">
            <thead>
              <tr>
                <th scope="col">Finding</th>
                <th scope="col">Fix</th>
                <th scope="col">Annual saving</th>
              </tr>
            </thead>
            <tbody>
              {others.map((f) => (
                <tr key={f.c.id}>
                  <td>
                    {f.c.ico} {f.c.q}
                    {f.c.type === "count" ? ` (×${f.n})` : ""}
                  </td>
                  <td>{f.c.fix}</td>
                  <td className="mono">
                    {fmt(f.im.co2)} kg · ₹{fmt(f.im.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <details className="method-box" style={{ marginTop: 22 }}>
        <summary>📐 Show the working — how every number was calculated</summary>
        <p className="hint" style={{ margin: "8px 0" }}>
          This is the auditor&rsquo;s ledger. Assumptions: electricity ₹8/kWh and 0.82 kg CO₂/kWh
          (Indian grid average), petrol ₹105/L and 2.3 kg CO₂/L, water ₹0.03/L including pumping
          &amp; treatment energy. All figures are typical annual estimates, not meter readings — a
          real audit would measure. Adjust mentally for your tariff and habits.
        </p>
        {found.length > 0 ? (
          <table className="method">
            <thead>
              <tr>
                <th scope="col">Finding</th>
                <th scope="col">Basis (per year)</th>
                <th scope="col">CO₂ &amp; cost</th>
              </tr>
            </thead>
            <tbody>
              {found.map((f) => {
                const parts: string[] = [];
                if (f.c.kwh) parts.push(`${f.c.kwh} kWh/yr × ${f.n}`);
                if (f.c.fuel) parts.push(`${f.c.fuel} L petrol/yr × ${f.n}`);
                if (f.c.water) parts.push(`${fmt(f.c.water)} L water/yr × ${f.n}`);
                if (f.c.co2) parts.push(`${f.c.co2} kg CO₂ direct × ${f.n}`);
                return (
                  <tr key={f.c.id}>
                    <td>{f.c.q}</td>
                    <td className="mono">
                      {parts.map((p, i) => (
                        <span key={i}>
                          {p}
                          {i < parts.length - 1 && <br />}
                        </span>
                      ))}
                    </td>
                    <td className="mono">
                      {fmt(f.im.co2)} kg · ₹{fmt(f.im.cost)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="hint">No findings — no maths needed.</p>
        )}
      </details>

      <p className="hint" style={{ marginTop: 18 }}>
        🔁 Detective&rsquo;s tip: real resilience comes from repetition. Re-run this case in 3
        months and compare reports — the second audit tells you whether the fixes stuck.
      </p>
    </div>
  );
}
