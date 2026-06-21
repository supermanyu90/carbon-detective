import { fmt } from "../lib/format";
import {
  CLIMATE_LINKS,
  NEIGHBOURHOOD_HOMES,
  stillWarmingAfter100yr,
  tonnesIfScaled,
} from "../core/climate";

interface Props {
  /** Avoidable CO₂ for this audit, kg/year. */
  co2: number;
}

/** Case background: why the audited carbon matters for the climate —
 *  cumulative, long-lived CO₂ and the anomalies it loads the dice toward
 *  (El Niño impacts, monsoon swings, heatwaves, ocean warming). */
export function ClimateContext({ co2 }: Props) {
  if (co2 <= 0) return null;

  const lingering = Math.round(stillWarmingAfter100yr(co2));
  const scaled = tonnesIfScaled(co2);

  return (
    <section className="climate card" aria-labelledby="climate-h">
      <p className="eyebrow">Case background · Why this carbon matters</p>
      <h3 id="climate-h" className="disp" style={{ fontSize: "1.2rem", margin: "2px 0 6px" }}>
        From your meter to the monsoon
      </h3>
      <p className="hint" style={{ marginTop: 0 }}>
        Carbon dioxide is the rare pollutant that lingers — and it piles up. It doesn&rsquo;t
        <em> cause</em> natural cycles like El Niño, but it raises the temperature baseline
        they play out on, so their heat and rainfall extremes land harder.
      </p>

      <div className="climate-stats">
        <div className="climate-stat">
          <span className="num">{fmt(lingering)} kg</span>
          <span className="lbl">
            of this year&rsquo;s avoidable CO₂ still trapping heat a century from now
          </span>
        </div>
        <div className="climate-stat">
          <span className="num">{fmt(scaled)} t</span>
          <span className="lbl">
            avoided per year if {fmt(NEIGHBOURHOOD_HOMES)} nearby homes fixed the same leaks
          </span>
        </div>
      </div>

      <ul className="climate-links">
        {CLIMATE_LINKS.map((c) => (
          <li key={c.id}>
            <p className="climate-link-title">
              <span aria-hidden="true">{c.ico}</span> {c.title}
            </p>
            <p className="climate-link-body">{c.body}</p>
            <a
              className="climate-link-src"
              href={c.source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {c.source.label} ↗
            </a>
          </li>
        ))}
      </ul>

      <p className="hint climate-caveat">
        A single audit won&rsquo;t move the climate — but cumulative, neighbourhood-wide and
        national choices do. That&rsquo;s the case for fixing the prime suspects above.
      </p>
    </section>
  );
}
