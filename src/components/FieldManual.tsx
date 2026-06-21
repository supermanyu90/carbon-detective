interface Source {
  label: string;
  org: string;
  href: string;
  use: string;
}

/** Credible, public references that underpin the app's estimates. Each maps
 *  to a factor actually used in src/core/factors.ts or the equivalences. */
const SOURCES: Source[] = [
  {
    label: "CO₂ Baseline Database for the Indian Power Sector",
    org: "Central Electricity Authority (CEA), Government of India",
    href: "https://cea.nic.in/",
    use: "Grid electricity emission factor (~0.7–0.82 kg CO₂ per kWh) — the basis for converting wasted kWh into CO₂.",
  },
  {
    label: "Standards & Labelling (star ratings) programme",
    org: "Bureau of Energy Efficiency (BEE), Government of India",
    href: "https://www.beeindia.gov.in/",
    use: "Appliance efficiency assumptions for fridges, ACs and geysers (e.g. old vs. 4–5 star units).",
  },
  {
    label: "2006 IPCC Guidelines for National Greenhouse Gas Inventories",
    org: "Intergovernmental Panel on Climate Change (IPCC)",
    href: "https://www.ipcc-nggip.iges.or.jp/public/2006gl/",
    use: "Fuel-combustion emission factors behind petrol ≈ 2.3 kg CO₂ per litre.",
  },
  {
    label: "Greenhouse gas reporting: conversion factors",
    org: "UK Dept. for Energy Security & Net Zero / DEFRA",
    href: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting",
    use: "Cross-check for fuel and energy emission factors used in the ledger.",
  },
  {
    label: "Greenhouse Gas Equivalencies Calculator",
    org: "U.S. Environmental Protection Agency (EPA)",
    href: "https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator",
    use: "Real-world equivalences: trees (~22 kg CO₂/yr each), car-km, and smartphone charges shown in the report.",
  },
  {
    label: "Emissions Factors & energy statistics",
    org: "International Energy Agency (IEA)",
    href: "https://www.iea.org/data-and-statistics",
    use: "Reference data on energy use and grid emissions for sanity-checking estimates.",
  },
  {
    label: "Corporate & calculation standards",
    org: "Greenhouse Gas Protocol",
    href: "https://ghgprotocol.org/",
    use: "Accounting methodology — how activity data is multiplied by emission factors.",
  },
];

export function FieldManual() {
  return (
    <section className="card manual" aria-labelledby="manualHead">
      <h2 id="manualHead">📖 How to use it — Field Manual</h2>
      <p className="hint">
        A carbon audit in six steps. No experience needed — the app does the maths and shows
        its working.
      </p>

      <ol className="manual-steps">
        <li>
          <strong>Pick your scene.</strong> Choose the <em>Home</em> or{" "}
          <em>Classroom / Office</em> case above. Each has its own zones and clues. Add a
          detective name if you like.
        </li>
        <li>
          <strong>Sweep each zone.</strong> Open a zone and work through its clues. For every
          clue, answer <em>Yes&nbsp;🔎</em> (you found waste — a lead to chase) or{" "}
          <em>No&nbsp;✓</em> (all clear), or type a <em>count</em> for things like dripping
          taps or standby devices.{" "}
          <em>Tip: actually walk over and check — that&rsquo;s what real auditors do.</em>
        </li>
        <li>
          <strong>Read the impact badges.</strong> Each clue is tagged{" "}
          <span className="sev HIGH">HIGH</span> <span className="sev MODERATE">MODERATE</span>{" "}
          or <span className="sev LOW">LOW</span> so you know which findings actually move the
          needle.
        </li>
        <li>
          <strong>Use the guides if you get stuck.</strong> &ldquo;Go to next unanswered
          clue&rdquo; jumps you straight to what&rsquo;s left; &ldquo;Mark remaining as no
          waste&rdquo; clears the rest in one tap.
        </li>
        <li>
          <strong>Close the case.</strong> Once every clue is examined, generate the audit
          report — avoidable CO₂, rupee savings, your prime suspects with fixes, and a
          transparent &ldquo;show the working&rdquo; table. Print or save it as a PDF.
        </li>
        <li>
          <strong>Act, then re-run.</strong> Fix the top suspects and audit the same scene
          again later — the report compares against your last one so you can see whether the
          fixes stuck. Your progress <strong>autosaves</strong>, so you can stop and resume
          anytime.
        </li>
      </ol>

      <details className="method-box sources-box">
        <summary>📚 Sources &amp; methodology — where the numbers come from</summary>
        <p className="hint" style={{ margin: "8px 0 12px" }}>
          Every figure is a <strong>typical annual estimate</strong>, not a meter reading —
          aligned with public emission-factor data from the bodies below. Tariffs (₹/kWh) and
          the energy embodied in water vary by region and utility, so treat results as
          directional, not exact.
        </p>
        <ul className="sources">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
              <span className="source-org"> — {s.org}</span>
              <span className="source-use">{s.use}</span>
            </li>
          ))}
        </ul>
        <p className="hint" style={{ marginTop: 12 }}>
          The exact factors the app uses (electricity ₹8/kWh &amp; 0.82 kg CO₂/kWh, petrol
          ₹105/L &amp; 2.3 kg CO₂/L, water ₹0.03/L) are listed in the report&rsquo;s
          &ldquo;Show the working&rdquo; section.
        </p>
      </details>
    </section>
  );
}
