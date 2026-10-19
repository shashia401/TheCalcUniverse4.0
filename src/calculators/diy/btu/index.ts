import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import BTUPanel from './BTUPanel';
import { btu, CLIMATE_LABELS, BTU_PER_TON, BTU_PER_EXTRA_PERSON, FREE_OCCUPANTS, KITCHEN_BTU } from './btuMath';
import { finiteSteps } from '../../../utils/explainGuard';
import type { ExplainStep } from '../../../types/calculator';

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString(undefined);
}

function fmtOneDecimal(n: number): string {
  return n.toFixed(1);
}

// ─── Calculate ───────────────────────────────────────────────────────────

function calculate(values: Record<string, string>): CalculatorResult[] {
  const r = btu(values);
  if (!r) return [];
  const heating = r.purpose === 'heating';

  const details = [
    `Climate: ${CLIMATE_LABELS[values.climateZone] || values.climateZone}`,
    `Ceiling: ${values.ceilingHeight}ft`,
    heating ? 'Sun: not used for heating' : `Sun: ${values.sunExposure}`,
    `Insulation: ${values.insulation}`,
    heating ? 'Room: not used for heating' : `Room: ${values.roomType}`,
    heating ? 'People: not used for heating' : `People: ${r.occupants}`,
    `Purpose: ${r.purpose}`,
  ].join(' | ');

  return [
    {
      id: 'btuRequired',
      label: heating ? 'Heating BTU/h Required' : 'Cooling BTU/h Required',
      value: `${fmtNum(r.totalBTU)} BTU/h`,
      highlight: true,
      color: 'positive' as const,
    },
    {
      id: 'tonsRequired',
      label: heating ? 'Capacity (Tons of 12,000 BTU/h)' : 'AC Size (Tons)',
      value: `${fmtOneDecimal(r.tons)} ton`,
    },
    {
      id: 'recommendedAC',
      label: heating ? 'Nearest Standard Size Up' : 'Recommended AC Unit',
      value: `${fmtOneDecimal(r.recommendedTons)} ton (${fmtNum(r.recommendedBTU)} BTU/h)`,
    },
    {
      id: 'btuPerSqFt',
      label: 'BTU per sq ft',
      value: `${fmtNum(r.btuPerSqFt)} BTU/sq ft`,
    },
    {
      id: 'roomDetails',
      label: 'Room Factors',
      value: details,
    },
  ];
}

function explainSteps(values: Record<string, string>): ExplainStep[] {
  const r = btu(values);
  if (!r) return [];
  const heating = r.purpose === 'heating';
  const n = (x: number) => Math.round(x).toLocaleString(undefined);
  const factors: string[] = [`ceiling ${r.ceilingFactor}`];
  if (!heating) factors.push(`sun ${r.sunFactor}`);
  factors.push(`insulation ${r.insulationFactor}`);
  if (!heating && r.roomFactor !== 1) factors.push(`room ${r.roomFactor}`);
  const base = r.area * r.perSqFt;
  const adjusted = r.totalBTU - r.extraBtu;
  const steps: ExplainStep[] = [
    { label: `Base ${r.purpose} load for the climate zone`, expr: `${n(r.area)} sq ft × ${r.perSqFt} BTU/h per sq ft = ${n(base)} BTU/h`, note: `Planning value for ${CLIMATE_LABELS[values.climateZone] || 'your zone'}; this is a room-sizing estimate, not a full Manual J load calculation.` },
    { label: 'Adjust for the room', expr: `${n(base)} × ${factors.join(' × ')} = ${n(adjusted)} BTU/h`, note: heating ? 'Sun, room type and people do not change a heating estimate.' : 'More sun, taller ceilings and poor insulation raise the load; a basement lowers it.' },
  ];
  if (!heating) {
    const parts: string[] = [];
    if (values.roomType === 'kitchen') parts.push(`${n(KITCHEN_BTU)} kitchen`);
    const extraPeople = Math.max(0, r.occupants - FREE_OCCUPANTS);
    if (extraPeople > 0) parts.push(`${extraPeople} extra ${extraPeople === 1 ? 'person' : 'people'} × ${n(BTU_PER_EXTRA_PERSON)}`);
    steps.push({ label: 'Add heat from people and the kitchen', expr: parts.length ? `${n(adjusted)} + ${parts.join(' + ')} = ${n(r.totalBTU)} BTU/h` : `${n(adjusted)} + 0 (two people or fewer, no kitchen) = ${n(r.totalBTU)} BTU/h`, note: `The first ${FREE_OCCUPANTS} people are already in the base figure.` });
  }
  steps.push({ label: 'Convert to tons and round up to a standard size', expr: `${n(r.totalBTU)} ÷ ${n(BTU_PER_TON)} = ${r.tons.toFixed(1)} ton, so ${r.recommendedTons.toFixed(1)} ton (${n(r.recommendedBTU)} BTU/h)`, note: 'Units come in half-ton steps, so round up rather than down.' });
  return finiteSteps(steps);
}

// ─── Config ──────────────────────────────────────────────────────────────────────

const btuConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'area',
      type: 'number',
      step: 1,
      min: 0,
      inputMode: 'numeric',
      label: 'Room Area (sq ft)',
      placeholder: 'e.g., 400',
      required: true,
      helpText: 'Total floor area of the room in square feet. Measure length x width. Do not include closets or hallways unless they share the same HVAC zone.',
    },
    {
      id: 'climateZone',
      type: 'select',
      label: 'Climate Zone',
      options: [
        { label: 'Zone 1 — Hot (e.g., Miami, Phoenix)', value: '1' },
        { label: 'Zone 2 — Mixed (e.g., Atlanta, Dallas)', value: '2' },
        { label: 'Zone 3 — Cool (e.g., Chicago, NYC)', value: '3' },
        { label: 'Zone 4 — Cold (e.g., Minneapolis, Denver)', value: '4' },
      ],
      helpText: 'Select your region for climate adjustment. Zone 1 requires the most cooling, Zone 4 the most heating.',
    },
    {
      id: 'sunExposure',
      type: 'select',
      label: 'Sun Exposure',
      options: [
        { label: 'Minimal (shaded / north-facing)', value: 'minimal' },
        { label: 'Moderate (some direct sun)', value: 'moderate' },
        { label: 'High (large south/west windows)', value: 'high' },
      ],
      helpText: 'How much direct sunlight enters the room. South and west-facing rooms with large windows need more cooling capacity.',
    },
    {
      id: 'insulation',
      type: 'select',
      label: 'Insulation',
      options: [
        { label: 'Poor (old / single-pane windows)', value: 'poor' },
        { label: 'Average (standard modern)', value: 'average' },
        { label: 'Good (well-insulated / double-pane)', value: 'good' },
      ],
      helpText: 'Quality of wall insulation and window type. Better insulation means lower BTU requirements — and lower energy bills.',
    },
    {
      id: 'ceilingHeight',
      type: 'select',
      label: 'Ceiling Height',
      options: [
        { label: 'Standard (8 ft)', value: '8' },
        { label: 'Tall (9-10 ft)', value: '9' },
        { label: 'High (12+ ft)', value: '12' },
      ],
      helpText: 'Taller ceilings increase the air volume that needs conditioning (8 ft = 1.0, 9-10 ft = 1.2, 12+ ft = 1.5).',
    },
    {
      id: 'roomType',
      type: 'select',
      label: 'Room Type',
      options: [
        { label: 'Living Room / Bedroom', value: 'standard' },
        { label: 'Kitchen (adds 4,000 BTU/h of cooling)', value: 'kitchen' },
        { label: 'Basement (naturally cooler)', value: 'basement' },
      ],
      helpText: 'Kitchens generate extra heat from cooking. Basements stay naturally cooler and need less cooling capacity.',
    },
    {
      id: 'people',
      type: 'number',
      step: 1,
      min: 0,
      inputMode: 'numeric',
      label: 'People (typical occupancy)',
      placeholder: 'e.g., 2',
      defaultValue: '1',
      showWhen: (v) => parseFloat(v.area) > 0,
      helpText: 'Cooling only: the first two occupants are already in the base load; each additional person adds about 600 BTU/h.',
    },
    {
      id: 'purpose',
      type: 'select',
      label: 'Purpose',
      options: [
        { label: 'Cooling (AC sizing)', value: 'cooling' },
        { label: 'Heating (furnace sizing)', value: 'heating' },
      ],
      defaultValue: 'cooling',
      helpText: 'Cooling sizes an air conditioner from the ~20 BTU/sq ft rule of thumb. Heating uses a separate per-sq-ft table where colder zones need more capacity.',
    },
  ],

  calculate,
  explainSteps,

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BTUPanel, { values, results });
  },

  educational: {
    formula: 'Cooling BTU/h = Area x BTU-per-sq-ft(zone) x Ceiling x Sun x Insulation x Room + 600 x (People - 2) + 4,000 (kitchen)  |  Heating BTU/h = Area x BTU-per-sq-ft(zone) x Ceiling x Insulation',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="50" y="30" width="220" height="130" fill="rgba(59,130,246,0.08)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="6"/><text x="160" y="55" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13" font-weight="bold">Room Floor Plan</text><rect x="70" y="65" width="60" height="40" fill="rgba(59,130,246,0.15)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="100" y="89" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9">Area (sq ft)</text><rect x="200" y="65" width="50" height="40" fill="rgba(239,68,68,0.15)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="3"/><text x="225" y="89" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="8">Sun</text><rect x="130" y="110" width="60" height="30" fill="rgba(239,68,68,0.15)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="3"/><text x="160" y="128" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="8">People</text><text x="100" y="160" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">Climate Zone</text><text x="225" y="160" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">Ceiling / Insulation</text><line x1="80" y1="105" x2="80" y2="152" stroke="var(--svg-9ca3af)" stroke-width="1" stroke-dasharray="2,2"/><line x1="160" y1="140" x2="160" y2="152" stroke="var(--svg-9ca3af)" stroke-width="1" stroke-dasharray="2,2"/><text x="160" y="195" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">BTU = Area x Factors + People Heat</text></svg>',
      alt: 'Room floor plan diagram showing area, sun exposure, people, climate zone, and insulation factors',
      caption: 'BTU calculation accounts for room area, climate, sun, insulation, and occupancy',
    },
    formulaDescription:
      'BTU (British Thermal Unit) measures the cooling or heating power needed for a room. Cooling starts from the widely used ENERGY STAR / ASHRAE rule of thumb of about 20 BTU/h per square foot, scaled by climate, then adjusted -10% for a shaded room and +10% for a sunny one, +600 BTU/h for each occupant beyond two, and +4,000 BTU/h for a kitchen (ENERGY STAR room-AC sizing guidance). The climate scaling, insulation, ceiling-height, and basement factors, and the heating table, are this calculator\'s own planning assumptions. It is not a Manual J load calculation.',
    variables: [
      {
        symbol: 'A',
        name: 'Area (sq ft)',
        description: 'The total floor area of the room or space being cooled or heated.',
      },
      {
        symbol: 'Cz',
        name: 'Climate Zone Factor',
        description:
          'Cooling BTU/h per sq ft: Zone 1 (Hot) = 30, Zone 2 (Mixed) = 25, Zone 3 (Cool) = 20 (the standard rule of thumb), Zone 4 (Cold) = 15. Heating BTU/h per sq ft runs the other way: 20, 30, 40, 50 from hot to cold.',
      },
      {
        symbol: 'Ch',
        name: 'Ceiling Height Factor',
        description:
          'Adjusts for taller ceilings that increase volume. Proportional to volume: 8 ft = 1.0, 9-10 ft = 1.2, 12+ ft = 1.5.',
      },
      {
        symbol: 'S',
        name: 'Sun Exposure Factor',
        description:
          'Adjusts for solar heat gain. Cooling only. Minimal/shaded = 0.9, Moderate = 1.0, High (large sunny windows) = 1.1.',
      },
      {
        symbol: 'I',
        name: 'Insulation Factor',
        description:
          'Adjusts for heat transfer through walls/windows. Poor = 1.2, Average = 1.0, Good = 0.9.',
      },
      {
        symbol: 'R',
        name: 'Room Type Factor',
        description:
          'Adjusts for room-specific conditions. Cooling only. Standard = no change, Kitchen = +4,000 BTU/h (appliance heat), Basement = 0.85x (naturally cooler).',
      },
      {
        symbol: 'P',
        name: 'People',
        description:
          'Cooling only. The base load assumes two occupants; each additional person adds about 600 BTU/h. Default is 1 person.',
      },
    ],
    howToUse: [
      'Enter the room area in square feet.',
      'Select your climate zone for regional temperature adjustment.',
      'Choose sun exposure, insulation level, ceiling height, and room type.',
      'Enter the typical number of occupants.',
      'Select whether you are sizing for cooling (AC) or heating (furnace).',
      'Review the recommended BTU/h and AC tonnage.',
    ],
    explanation:
      'BTU (British Thermal Unit) is the standard measure of thermal energy used in HVAC sizing worldwide. One BTU is defined as the amount of heat required to raise the temperature of one pound of water by one degree Fahrenheit — a unit invented in the mid-19th century during the Industrial Revolution when steam engine engineers needed a standardized way to measure energy output from coal and boilers. One ton of cooling = 12,000 BTU/h, a unit of measurement that originated from the cooling capacity of melting one ton (2,000 lbs) of ice over a 24-hour period. This is the same principle used in the ice houses that cooled buildings before mechanical air conditioning was invented in 1902 by Willis Carrier. Proper sizing is critical today — an undersized unit runs constantly without reaching temperature, while an oversized unit short-cycles, wastes energy, and fails to dehumidify properly. This calculator uses a simplified residential method that adjusts for the most important factors: climate, area, sun exposure, insulation, ceiling height, room type, and occupancy. Practical example: a 400 sq ft living room in Zone 2 (Mixed climate) with moderate sun, average insulation, a standard 8 ft ceiling, and 2 people. Cooling BTU = 400 x 25 x 1.0 x 1.0 x 1.0 x 1.0 = 10,000 BTU/h with no occupant add-on (the first two people are in the base). That is 0.83 tons, so the recommended unit is 1.0 ton (12,000 BTU/h). Edge cases: a kitchen adds 4,000 BTU/h because cooking appliances generate significant heat, so a 300 sq ft kitchen in Zone 1 (Hot) needs 300 x 30 + 4,000 = 13,000 BTU/h. For high-altitude locations (above 5,000 ft), derate AC capacity by about 3.5% per 1,000 ft because air is less dense. For server rooms or home theaters, add 3,400 BTU/h per 1,000W of equipment. For sunrooms or rooms with floor-to-ceiling glass, select "High" sun exposure and consider that the BTU estimate may still be conservative — glass can transmit 5-10 times more heat per square foot than an insulated wall.',
    faqs: [
      {
        question: 'What happens if I undersize or oversize my AC?',
        answer:
          'An undersized AC runs continuously without adequately cooling the space, leading to high electricity bills and poor comfort. An oversized AC short-cycles (turns on and off frequently every 5-10 minutes), which wastes energy, reduces dehumidification significantly (causing that "cold but clammy" feeling), and causes temperature swings of 3-5 degrees. Short-cycling also increases wear on the compressor and can halve the unit\'s lifespan. Proper sizing is essential for comfort, efficiency, and equipment longevity.',
      },
      {
        question: 'Why does the calculator recommend rounding up to the nearest 0.5 ton?',
        answer:
          'AC units are manufactured in standard sizes: 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, and 5.0 tons for residential equipment. Rounding up to the next half-ton ensures the unit has adequate capacity for the hottest days of the year. It is better to be slightly oversized (by 0.5 tons) than slightly undersized, because on the hottest summer day, an undersized unit will not maintain temperature, while a properly sized unit with a 0.5-ton margin will cycle normally and still dehumidify adequately.',
      },
      {
        question: 'How do I calculate BTU for a room with vaulted or cathedral ceilings?',
        answer:
          'For vaulted or cathedral ceilings, use the ceiling height factor that most closely matches the average height. A room starting at 8 feet and peaking at 16 feet has an average of 12 feet, so use the 12-foot factor (1.25). Vaulted ceilings increase the thermal load because heat rises and collects at the peak, and the larger glass area common in rooms with vaulted ceilings increases solar heat gain. A ceiling fan can make a room feel 4-5 degrees cooler, potentially reducing cooling load by 10-15%. The Department of Energy recommends using ceiling fans in conjunction with AC to set the thermostat higher.',
      },
      {
        question: 'What is a SEER rating and why does it matter?',
        answer: 'SEER (Seasonal Energy Efficiency Ratio) measures an AC unit\'s cooling efficiency over an entire cooling season. Higher SEER means lower electricity bills. Since 2023 the DOE minimum for new split-system residential AC units is 13.4 SEER2 in northern states and 14.3 SEER2 in southern states (roughly 14 and 15 on the older SEER scale). A higher-efficiency unit costs more upfront but can save on electricity depending on climate and usage. For a unit you plan to keep 15-20 years, the payback of a higher SEER depends on climate, usage, and electricity rates. For mild climates with short cooling seasons, a lower SEER unit makes more financial sense. The BTU calculation is independent of SEER — SEER affects operating cost, not sizing. An oversized unit with a high SEER rating still short-cycles and dehumidifies poorly.',
      },
      {
        question: 'How do window units compare to mini-split systems?',
        answer: 'Window AC units (typically 5,000-25,000 BTU/h) are usually the most affordable option upfront but are noisy, block window views, and are less efficient than mini-splits. Ductless mini-split systems are quieter, more efficient (often 20+ SEER), and provide both heating and cooling with a heat pump. Mini-splits also allow multi-zone control — you can cool only the rooms you use. For a single room under 400 sq ft, a window unit is cost-effective. For whole-home cooling or when you value quiet operation, mini-splits are the superior choice despite the higher upfront cost. The BTU sizing is the same regardless of which type you choose.',
      },
      {
        question: 'Can I use this calculator for whole-house HVAC sizing?',
        answer: 'This calculator is designed for individual room sizing, which is appropriate for window units, mini-splits, or portable ACs. For whole-house central HVAC sizing, you need a Manual J load calculation that accounts for the entire building envelope, including all rooms, hallways, attic insulation, window orientation, air infiltration, and duct losses. Manual J is the industry standard and is required by building codes in most jurisdictions for new construction and major renovations. A whole-house Manual J calculation typically requires software and a detailed home survey. As a rough estimate for central AC, you can sum individual room BTUs, but this method does not account for duct losses (typically 20-30% of capacity) or the thermal interaction between rooms.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Master Bedroom in Phoenix, AZ (Zone 1 — Hot)',
        inputs: { area: '350', climateZone: '1', sunExposure: 'moderate', insulation: 'average', ceilingHeight: '8', roomType: 'standard', people: '2', purpose: 'cooling' },
        result: '10,500 BTU/h (0.9 tons). Recommended: 1.0 ton (12,000 BTU/h).',
        insight: 'A master bedroom with two large windows facing east for morning sun. Cooling BTU = 350 x 30 x 1.0 x 1.0 x 1.0 x 1.0 = 10,500 BTU/h; two occupants add nothing beyond the base load. That is 10,500 / 12,000 = 0.875 tons, rounded up to the next standard half-ton size: 1.0 ton (12,000 BTU/h), which leaves about 14% headroom. In a very hot climate, high-sun rooms, poor insulation, or extra people can erase that margin, so consider the next size up and a variable-speed (inverter) unit for part-load efficiency. Confirm with a Manual J calculation for central systems.',
      },
      {
        scenario: 'Living Room / Open Floor Plan in Minneapolis, MN (Zone 4 — Cold), heating',
        inputs: { area: '600', climateZone: '4', sunExposure: 'minimal', insulation: 'good', ceilingHeight: '9', roomType: 'standard', people: '4', purpose: 'heating' },
        result: '32,400 BTU/h of heating (2.7 tons-equivalent). Nearest standard size up: 3.0 (36,000 BTU/h).',
        insight: 'An open-plan living/dining/kitchen area treated as one large room. Heating BTU = 600 x 50 x 1.2 (9-10 ft ceiling) x 0.9 (good insulation) = 32,400 BTU/h. Sun, occupants, and room type are not used for heating, because body heat and solar gain slightly reduce the heating load rather than add to it. In a cold climate heating is the primary concern, and the heating table here is a planning figure, not a design load: a Manual J calculation for your actual walls, windows, and local design temperature is the right basis for buying a furnace or heat pump. Cold-climate heat pumps work well in Zone 4 but are often paired with a backup heat source for the coldest nights.',
      },
    ],
    proTips: [
      'Have a professional perform a Manual J load calculation before purchasing a central AC system. The cost is small compared to the cost of a central system, and a properly sized system saves energy over its lifespan.',
      'For window units, check the amperage rating and make sure your electrical circuit can handle it. A 12,000 BTU/h window unit draws about 10-12 amps — you cannot run two of them on a single 15-amp circuit. Larger units (15,000+ BTU/h) often require a dedicated 20-amp circuit. Check the nameplate before buying.',
      'Clean or replace HVAC filters monthly during peak cooling season. A clogged filter restricts airflow, and the U.S. Department of Energy says replacing a dirty filter can lower an air conditioner\'s energy use by 5-15%. The cheapest maintenance action with the highest payback. For washable filters, rinse from the clean side toward the dirty side so debris is pushed out, not deeper into the filter media.',
      'Use a programmable thermostat to set the temperature 5-8 degrees higher when you are away during the day and cool the house down 30 minutes before you return. Raising the setpoint while you are away saves energy; smart thermostats can pre-cool your home when electricity rates are lower.',
      'Before upgrading your AC unit, improve the thermal envelope of your home first: add attic insulation to R-49 or R-60, seal air leaks around windows and doors, install double-pane low-E windows if you have single-pane, and add solar screens or awnings on south and west windows. Reducing the cooling load means you can buy a smaller, less expensive AC unit that costs less to run every month.',
      'For portable AC units (floor-standing with exhaust hose), derate the stated BTU rating by 20-30%. Dual-hose portable units are significantly more efficient than single-hose models because single-hose units create negative pressure that pulls hot outside air into the room through every crack and gap. A portable unit\'s nameplate BTU rating can overstate its effective cooling once infiltration losses are counted.',
    ],
    limitations: [
      'This calculator uses a simplified residential method, not a full Manual J load calculation. For whole-house sizing, new construction requiring permits, or rooms with unusual heat loads (server rooms, home theaters, indoor pools), consult an HVAC professional for a Manual J calculation. The simplified method assumes typical residential construction and is accurate within approximately 15-20% for standard rooms.',
      'The calculator does not account for duct losses (typically 20-30% of capacity for ducted systems), air infiltration through cracks and gaps, internal gains from appliances beyond kitchen factor, or building orientation relative to prevailing winds. These factors can shift the BTU requirement by 10-25% in either direction.',
      'Calculated BTUs are for a single room with standard ceiling heights. Open floor plans that combine multiple rooms should be treated as one large room with the combined square footage, but this approach does not account for different sun exposures or room types within the open area. For rooms with two exterior walls (corner rooms), the actual cooling load may be 10-15% higher than calculated.',
      'BTU requirements assume standard indoor design temperatures (75°F cooling, 70°F heating) and standard outdoor design temperatures for each climate zone. If you prefer your home significantly cooler (68°F) or live in an area with recent climate change-driven heat extremes beyond historical norms, consider upsizing by 0.5 tons.',
    ],
    quickReference: [
      { label: '1 ton of cooling', value: '12,000 BTU/h' },
      { label: 'Extra occupant (beyond 2)', value: '+600 BTU/h (cooling)' },
      { label: 'Kitchen', value: '+4,000 BTU/h (cooling)' },
      { label: 'Sunny / shaded room', value: '+10% / -10% (cooling)' },
      { label: 'Basement cooling factor', value: '0.85 (this calculator)' },
      { label: 'Min split-system AC efficiency (North)', value: '13.4 SEER2 (DOE, 2023)' },
      { label: 'Min split-system AC efficiency (South)', value: '14.3 SEER2 (DOE, 2023)' },
      { label: 'Window unit typical range', value: '5,000-25,000 BTU/h' },
      { label: 'Duct loss allowance', value: '20-30% of capacity' },
    ],
    citations: [
      { source: 'Wikipedia', title: 'British Thermal Unit', url: 'https://en.wikipedia.org/wiki/British_thermal_unit' },

      { source: 'ACCA Manual J — Residential Load Calculation', url: 'https://www.acca.org/standards/technical-manuals/manual-j' },
    ],
  },
};

export default btuConfig;
