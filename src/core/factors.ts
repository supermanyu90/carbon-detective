/* =========================================================
   THE EVIDENCE LEDGER — emission & cost factors
   Assumptions:
   - Electricity: ₹8 per kWh, 0.82 kg CO₂ per kWh (Indian grid avg)
   - Petrol:      ₹105 per litre, 2.3 kg CO₂ per litre
   - Water:       ₹0.03 per litre supplied, 0.0006 kg CO₂ per litre
                  (pumping + treatment energy)
   ========================================================= */
export const F = {
  elecCost: 8,
  elecCO2: 0.82,
  fuelCost: 105,
  fuelCO2: 2.3,
  waterCost: 0.03,
  waterCO2: 0.0006,
} as const;
