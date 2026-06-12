export type Mode = "home" | "class";
export type ClueType = "yn" | "count";

export interface Clue {
  mode: Mode;
  zone: string;
  ico: string;
  id: string;
  type: ClueType;
  unit?: string;
  q: string;
  why: string;
  fix: string;
  /** PER-UNIT, PER-YEAR estimates. */
  kwh?: number;
  fuel?: number;
  water?: number;
  /** direct annual CO₂ (kg) / cost (₹) not derived from kwh/fuel/water */
  co2?: number;
  cost?: number;
}

export const CLUES: Clue[] = [
  /* ---------- HOME ---------- */
  { mode: "home", zone: "Living Room", ico: "🛋️", id: "standby", type: "count", unit: "devices",
    q: "Devices glowing on standby right now? (TV, set-top box, speakers, gaming console)",
    why: "A device on standby sips ~5–6 watts, 24 hours a day. It looks asleep. It is not.",
    kwh: 48, fix: "Switch off at the wall or use a switched power strip. One flick, done." },
  { mode: "home", zone: "Living Room", ico: "🛋️", id: "oldbulbs", type: "count", unit: "bulbs",
    q: "Old incandescent or CFL bulbs still in service?",
    why: "A 60 W incandescent burning 4 hrs/day uses ~74 kWh/yr more than a 9 W LED doing the same job.",
    kwh: 74, fix: "Replace with LED bulbs — they pay for themselves in under a year." },
  { mode: "home", zone: "Living Room", ico: "🛋️", id: "aclow", type: "yn",
    q: "Is the AC usually set below 24 °C?",
    why: "Every degree below 24 °C adds roughly 6% to AC consumption. 20 °C is a sweater, not a setting.",
    kwh: 390, fix: "Set 24–26 °C and run the ceiling fan with it. Same comfort, far less power." },
  { mode: "home", zone: "Living Room", ico: "🛋️", id: "emptyroom", type: "yn",
    q: "Do lights or fans stay on in empty rooms?",
    why: "A fan left running 3 extra hrs/day quietly burns ~80–100 kWh a year.",
    kwh: 95, fix: "Last one out switches off. Make it a house rule, not a reminder." },

  { mode: "home", zone: "Kitchen", ico: "🍳", id: "oldfridge", type: "yn",
    q: "Is the fridge more than 10 years old?",
    why: "Old fridges can use 2–3× the power of a modern 4–5 star unit. It runs 24×7, all year.",
    kwh: 250, fix: "When it retires, choose a BEE 4–5 star model. Meanwhile keep coils dust-free." },
  { mode: "home", zone: "Kitchen", ico: "🍳", id: "fridgeseal", type: "yn",
    q: "Does the fridge door seal look loose, or does the door get held open while deciding?",
    why: "Cold air falls out, the compressor works overtime. The paper test: a slip of paper should not slide out of a closed door.",
    kwh: 50, fix: "Replace a worn gasket; decide what you want before opening the door." },
  { mode: "home", zone: "Kitchen", ico: "🍳", id: "hotfood", type: "yn",
    q: "Is hot food placed straight into the fridge?",
    why: "The fridge must fight the heat you just added — extra compressor cycles every time.",
    kwh: 25, fix: "Let food reach room temperature first (within safe limits, ~1–2 hrs)." },
  { mode: "home", zone: "Kitchen", ico: "🍳", id: "rowaste", type: "yn",
    q: "Does the RO purifier’s reject water go straight down the drain?",
    why: "RO purifiers reject ~3 litres for every litre purified — easily 8+ litres a day wasted.",
    water: 2900, fix: "Collect reject water in a bucket for mopping, plants or washing." },
  { mode: "home", zone: "Kitchen", ico: "🍳", id: "bigflame", type: "yn",
    q: "Does the gas flame regularly lick up the sides of the pan?",
    why: "Flame beyond the pan base heats the kitchen, not the food — roughly 10–15% of LPG wasted.",
    co2: 15, cost: 600, fix: "Keep the flame within the pan base; use lids to cook faster." },

  { mode: "home", zone: "Bathroom", ico: "🚿", id: "leakytap", type: "count", unit: "taps",
    q: "Taps or flush valves dripping anywhere? Count them.",
    why: "One steady drip ≈ 20 litres a day ≈ 7,300 litres a year. Per tap.",
    water: 7300, fix: "Usually just a ₹20 washer and ten minutes of work." },
  { mode: "home", zone: "Bathroom", ico: "🚿", id: "geyseron", type: "yn",
    q: "Is the geyser left switched on for hours (or all day)?",
    why: "A geyser kept hot loses heat constantly — standing losses of ~0.5–1 kWh every day it idles.",
    kwh: 180, fix: "Switch on 15–20 minutes before bathing, off right after. Or add a timer." },
  { mode: "home", zone: "Bathroom", ico: "🚿", id: "geyserhot", type: "yn",
    q: "Is the geyser thermostat set scalding hot (above ~50–55 °C)?",
    why: "You heat water to 70 °C, then mix cold water to survive it. That extra heating is pure waste.",
    kwh: 60, fix: "Set the thermostat to 50–55 °C." },
  { mode: "home", zone: "Bathroom", ico: "🚿", id: "longshower", type: "yn",
    q: "Are showers in this house typically longer than 10 minutes?",
    why: "A shower flows ~8–10 litres a minute. The minutes after you’re actually clean are the expensive ones.",
    water: 11000, kwh: 80, fix: "Aim for 5–7 minutes, or go bucket — the original water-efficient tech." },

  { mode: "home", zone: "Study & Bedroom", ico: "🛏️", id: "pcon", type: "count", unit: "machines",
    q: "Computers or laptops left running overnight?",
    why: "A desktop idling 10 hrs a night uses ~120–180 kWh a year doing absolutely nothing.",
    kwh: 130, fix: "Shut down or enable sleep after 15 minutes idle. Updates can run at dinner time." },
  { mode: "home", zone: "Study & Bedroom", ico: "🛏️", id: "chargers", type: "count", unit: "chargers",
    q: "Phone chargers left plugged in with nothing attached?",
    why: "Detective’s twist: modern chargers draw under 0.5 W empty — about 4 kWh/yr each. Real, but tiny. Good auditors measure instead of guessing.",
    kwh: 4, fix: "Unplug them for tidiness — but spend your real effort on the AC and geyser clues." },
  { mode: "home", zone: "Study & Bedroom", ico: "🛏️", id: "daylight", type: "yn",
    q: "Are lights kept on even when daylight is doing the job?",
    why: "Daylight is the only fully subsidised lighting scheme in existence.",
    kwh: 40, fix: "Open the curtains first; switch on second." },

  { mode: "home", zone: "Outside & Vehicle", ico: "🚗", id: "idling", type: "yn",
    q: "Does the vehicle idle while waiting — at gates, pickups, long signals (over a minute)?",
    why: "Idling burns ~0.5–1 litre per hour for zero kilometres travelled.",
    fuel: 45, fix: "If the wait is over 60 seconds, switch off. Restarting uses less fuel than idling." },
  { mode: "home", zone: "Outside & Vehicle", ico: "🚗", id: "tyres", type: "yn",
    q: "Has tyre pressure gone unchecked for over a month?",
    why: "Under-inflated tyres add ~3% to fuel use — invisible, constant, and free to fix.",
    fuel: 18, fix: "Check pressure monthly, at the pump, when tyres are cold." },
  { mode: "home", zone: "Outside & Vehicle", ico: "🚗", id: "shorttrips", type: "yn",
    q: "Are trips under 2 km usually made by car or bike instead of on foot?",
    why: "Cold engines on short hops are at their thirstiest — and a 2 km walk takes ~20 minutes.",
    fuel: 50, fix: "Walk or cycle the short ones. The engine and the cardiologist both approve." },
  { mode: "home", zone: "Outside & Vehicle", ico: "🚗", id: "hosewash", type: "yn",
    q: "Is the vehicle or floor washed with a running hose?",
    why: "A running hose pours out ~10 litres a minute. A bucket caps the damage by design.",
    water: 5000, fix: "Bucket and cloth: ~20 litres instead of ~150 per wash." },

  /* ---------- CLASSROOM / OFFICE ---------- */
  { mode: "class", zone: "Classroom / Main Room", ico: "📚", id: "c_lights", type: "count", unit: "lights",
    q: "Tube lights or panels burning bright next to sunlit windows? Count them.",
    why: "A 36 W tube running 4 unneeded hrs/day ≈ 36 kWh a year. Multiply by every fixture.",
    kwh: 36, fix: "Use the window-side switch bank last. Daylight first, switches second." },
  { mode: "class", zone: "Classroom / Main Room", ico: "📚", id: "c_fans", type: "yn",
    q: "Do fans and lights keep running after everyone leaves for breaks or dispersal?",
    why: "An empty room consuming power is the easiest crime to solve in this entire case.",
    kwh: 160, fix: "Appoint a rotating \"switch monitor\" — last out, lights out." },
  { mode: "class", zone: "Classroom / Main Room", ico: "📚", id: "c_projector", type: "yn",
    q: "Does the projector or smart board sit on standby all day and night?",
    why: "Projectors on standby draw power continuously and shorten their own lamp life.",
    kwh: 55, fix: "Power off fully at the end of each session, not just \"blank screen\"." },
  { mode: "class", zone: "Classroom / Main Room", ico: "📚", id: "c_aclow", type: "yn",
    q: "Is the AC set below 24 °C?",
    why: "Every degree below 24 °C costs ~6% more energy. Sweaters in summer are a clue, not a coincidence.",
    kwh: 420, fix: "Standardise 24–26 °C with fans on. Tape over the remote if needed." },

  { mode: "class", zone: "Computer Lab", ico: "💻", id: "c_pcs", type: "count", unit: "PCs",
    q: "Computers left on after hours or overnight? Count the glowing ones.",
    why: "Each idle desktop burns ~130 kWh/yr after hours — a lab of 20 is a small power plant of waste.",
    kwh: 130, fix: "Enable auto-sleep via settings; assign a shutdown sweep at closing." },
  { mode: "class", zone: "Computer Lab", ico: "💻", id: "c_monitors", type: "count", unit: "monitors",
    q: "Monitors or screens glowing on standby?",
    why: "Standby screens draw a few watts each, all day, all year.",
    kwh: 25, fix: "Master switch per row — one flick kills the whole bench." },
  { mode: "class", zone: "Computer Lab", ico: "💻", id: "c_printer", type: "yn",
    q: "Is the printer / copier never actually switched off?",
    why: "Large copiers on standby can quietly use 100+ kWh a year.",
    kwh: 110, fix: "Enable deep-sleep mode and switch off at day end." },

  { mode: "class", zone: "Washrooms & Corridors", ico: "🚰", id: "c_taps", type: "count", unit: "taps",
    q: "Dripping taps or running cisterns in the washrooms? Count them.",
    why: "One drip ≈ 7,300 litres a year. Institutional washrooms often hide several.",
    water: 7300, fix: "Report to maintenance with the count — numbers get fixed faster than complaints." },
  { mode: "class", zone: "Washrooms & Corridors", ico: "🚰", id: "c_corridor", type: "yn",
    q: "Do corridor and stairwell lights stay on in broad daylight?",
    why: "Common areas are nobody’s job — which makes them everybody’s leak.",
    kwh: 200, fix: "Suggest daylight sensors or simply add it to the caretaker’s morning round." },
  { mode: "class", zone: "Washrooms & Corridors", ico: "🚰", id: "c_urinal", type: "yn",
    q: "Any continuously-flushing urinals or overflow from overhead tanks?",
    why: "A continuously running flush can waste tens of thousands of litres a year.",
    water: 20000, fix: "Flag to maintenance — float valves and sensor flushes are cheap fixes." },

  { mode: "class", zone: "Staff Room / Pantry", ico: "☕", id: "c_kettle", type: "yn",
    q: "Is the kettle re-boiled fully for every single cup?",
    why: "Boiling a full kettle for one cup wastes most of the energy, most of the time.",
    kwh: 45, fix: "Boil only what’s needed, or use a flask to hold the heat." },
  { mode: "class", zone: "Staff Room / Pantry", ico: "☕", id: "c_fridge", type: "yn",
    q: "Is the pantry fridge ancient, frosted up, or half-sealed?",
    why: "A neglected fridge can double its own consumption — and it never gets a day off.",
    kwh: 200, fix: "Defrost, fix the gasket, or retire it for a small efficient unit." },
  { mode: "class", zone: "Staff Room / Pantry", ico: "☕", id: "c_acafter", type: "yn",
    q: "Does the staff room AC run on after everyone has gone home?",
    why: "Cooling an empty room is the most expensive way to do nothing.",
    kwh: 300, fix: "A simple plug-in timer ends this crime permanently." },
];
