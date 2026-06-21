import { useMemo } from "react";
import type { Mode } from "../core/clues";
import { cluesForMode, findings, totals, verdict, rank, type Answers } from "../core/audit";
import { fmt, formatDateLong, formatDateShort } from "../lib/format";
import { CountUp } from "./CountUp";
import { Equivalences } from "./Equivalences";
import { EvidenceBoard } from "./EvidenceBoard";
import type { ReportSnapshot } from "../lib/storage";

interface Props {
  mode: Mode;
  answers: Answers;
  detName: string;
  reduceMotion: boolean;
  /** Stable timestamp captured when the report was filed. */
  filedAt: Date;
  /** The most recent earlier audit of this scene, for comparison. */
  previous: ReportSnapshot | null;
}

export function Report({ mode, answers, detName, reduceMotion, filedAt, previous }: Props) {
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

  const filed = formatDateLong(filedAt);

  const suspects = found.slice(0, 3);
  const others = found.slice(3);

  const cmp = previous
    ? {
        diff: tot.co2 - previous.co2,
        pct:
          previous.co2 > 0
            ? Math.round((Math.abs(tot.co2 - previous.co2) / previous.co2) * 100)
            : 0,
        when: formatDateShort(new Date(previous.at)),
        improved: tot.co2 < previous.co2,
      }
    : null;

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
        <div className="stamp verdict-stamp stamp-anim" key={v.label}>
          {v.label}
        </div>
      </div>

      <p>{v.msg}</p>

      {cmp && (
        <div
          className={`compare ${cmp.improved ? "better" : cmp.diff > 0 ? "worse" : "flat"}`}
        >
          🔁 Compared with your last {mode === "home" ? "home" : "classroom/office"} audit on{" "}
          {cmp.when}:{" "}
          <strong>
            {fmt(previous!.co2)} kg → {fmt(tot.co2)} kg
          </strong>{" "}
          {cmp.diff === 0 ? (
            <>— no change yet. Make a fix and re-run.</>
          ) : cmp.improved ? (
            <>
              — that&rsquo;s <strong>{cmp.pct}% less</strong> avoidable CO₂. The fixes are
              sticking. 🌱
            </>
          ) : (
            <>
              — <strong>{cmp.pct}% more</strong>. New leaks have crept in; the suspects are
              below.
            </>
          )}
        </div>
      )}

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

      {tot.co2 > 0 && <Equivalences impact={tot} reduceMotion={reduceMotion} />}

      {nFound > 0 && (
        <>
          <h3 className="disp" style={{ fontSize: "1.2rem", marginTop: 10 }}>
            Prime suspects — fix these first
          </h3>
          <EvidenceBoard suspects={suspects} verdict={v.label} />
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
                <tr key={f.clue.id}>
                  <td>
                    {f.clue.ico} {f.clue.q}
                    {f.clue.type === "count" ? ` (×${f.count})` : ""}
                  </td>
                  <td>{f.clue.fix}</td>
                  <td className="mono">
                    {fmt(f.impact.co2)} kg · ₹{fmt(f.impact.cost)}
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
          This is the auditor&rsquo;s ledger. Assumptions: electricity ₹8/kWh and 0.82 kg
          CO₂/kWh (Indian grid average), petrol ₹105/L and 2.3 kg CO₂/L, water ₹0.03/L
          including pumping &amp; treatment energy. All figures are typical annual estimates,
          not meter readings — a real audit would measure. Adjust mentally for your tariff and
          habits.
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
                if (f.clue.kwh) parts.push(`${f.clue.kwh} kWh/yr × ${f.count}`);
                if (f.clue.fuel) parts.push(`${f.clue.fuel} L petrol/yr × ${f.count}`);
                if (f.clue.water) parts.push(`${fmt(f.clue.water)} L water/yr × ${f.count}`);
                if (f.clue.co2) parts.push(`${f.clue.co2} kg CO₂ direct × ${f.count}`);
                return (
                  <tr key={f.clue.id}>
                    <td>{f.clue.q}</td>
                    <td className="mono">
                      {parts.map((p, i) => (
                        <span key={i}>
                          {p}
                          {i < parts.length - 1 && <br />}
                        </span>
                      ))}
                    </td>
                    <td className="mono">
                      {fmt(f.impact.co2)} kg · ₹{fmt(f.impact.cost)}
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
