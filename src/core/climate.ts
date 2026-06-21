/* =========================================================
   CLIMATE CONTEXT — linking avoidable CO₂ to climate anomalies
   -----------------------------------------------------------
   Pure, framework-free, unit-tested. Connects one audit's
   avoidable CO₂ to the systemic picture: why carbon matters
   for El Niño / La Niña (ENSO), the Indian monsoon, heatwaves
   and ocean warming.

   Scientific honesty (enforced in the copy + the AI primer):
   - ENSO (El Niño / La Niña) is a NATURAL ocean–atmosphere
     cycle. Greenhouse gases do not "cause" an El Niño event.
   - What carbon does is raise the baseline these cycles play
     out on — hotter oceans and air — so their impacts (heat,
     marine heatwaves, erratic rainfall) land harder.
   - CO₂ is cumulative and long-lived: a large share of today's
     emissions is still trapping heat a century from now.
   - One household's share is tiny in isolation; it matters in
     aggregate. We show both, and never overclaim.
   ========================================================= */

/** Fraction of a CO₂ pulse still in the atmosphere ~100 years
 *  later (IPCC AR6 / Bern carbon-cycle model, simplified). */
export const CO2_AIRBORNE_FRACTION_100YR = 0.4;

/** A relatable aggregation scale: a mid-size neighbourhood / school cluster. */
export const NEIGHBOURHOOD_HOMES = 10_000;

/** kg of this year's avoidable CO₂ still warming the planet ~a century on. */
export function stillWarmingAfter100yr(co2: number): number {
  return co2 * CO2_AIRBORNE_FRACTION_100YR;
}

/** Tonnes/year avoided if `homes` households fixed the same leaks. */
export function tonnesIfScaled(co2: number, homes = NEIGHBOURHOOD_HOMES): number {
  return (co2 * homes) / 1000;
}

export interface ClimateLink {
  id: string;
  ico: string;
  title: string;
  /** How accumulated carbon connects to this anomaly. */
  body: string;
  source: { label: string; url: string };
}

/** The mechanism cards: each links the carbon the user just audited to a
 *  documented climate anomaly, with a citation. India-relevant first. */
export const CLIMATE_LINKS: ClimateLink[] = [
  {
    id: "enso",
    ico: "🌊",
    title: "El Niño & La Niña, on a hotter baseline",
    body: "El Niño and La Niña are a natural Pacific cycle — carbon doesn't trigger them. But each year's CO₂ adds to a warmer ocean and atmosphere, so when an El Niño arrives it pushes record heat and marine heatwaves from an already-raised floor. Models also project stronger swings as warming continues.",
    source: { label: "IPCC AR6 WG1 (ENSO)", url: "https://www.ipcc.ch/report/ar6/wg1/" },
  },
  {
    id: "monsoon",
    ico: "🌧️",
    title: "An erratic Indian monsoon",
    body: "A warmer atmosphere holds ~7% more moisture per °C, which loads the monsoon toward fewer-but-fiercer downpours and longer dry spells between them. El Niño years already tend to suppress monsoon rain — warming sharpens the variability farmers feel.",
    source: {
      label: "IPCC AR6 — Regional (South Asia)",
      url: "https://www.ipcc.ch/report/ar6/wg1/",
    },
  },
  {
    id: "heat",
    ico: "🔥",
    title: "Fiercer, longer heatwaves",
    body: "Heatwaves that were rare are now routine, and they ride higher during El Niño years. The link to cumulative CO₂ is direct and well-measured — this is the anomaly your geyser, AC and idling clues touch most.",
    source: { label: "NOAA Climate.gov — ENSO", url: "https://www.climate.gov/enso" },
  },
  {
    id: "ocean",
    ico: "🌡️",
    title: "Oceans soaking up the heat",
    body: "The sea has absorbed the vast majority of the extra heat from greenhouse gases. Warmer water feeds stronger cyclones in the Arabian Sea and Bay of Bengal and bleaches reefs — long-lived CO₂ keeps that heat banked for centuries.",
    source: { label: "WMO — State of the Climate", url: "https://wmo.int" },
  },
];

/** Compact, vetted primer appended to the AI analyst's system prompt so it can
 *  connect a user's numbers to climate anomalies WITHOUT fabricating or
 *  overclaiming. Kept factual and bounded. */
export const CLIMATE_PRIMER = [
  "Climate context you may draw on (only if it fits the user's findings; stay accurate):",
  "- CO₂ is cumulative and long-lived — roughly 40% of a year's emissions is still warming the planet a century later.",
  "- El Niño / La Niña (ENSO) is a NATURAL cycle; do NOT say emissions cause it. Say carbon raises the baseline temperature these cycles play out on, so their heat and rainfall extremes land harder.",
  "- Warming pushes the Indian monsoon toward heavier bursts and longer dry spells, and makes heatwaves more frequent and intense, especially in El Niño years.",
  "- One household's share is tiny alone but meaningful in aggregate. You may use an 'if every home nearby did this' framing, but never imply a single audit changes the climate by itself.",
].join("\n");
