import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import BTUPanel from './BTUPanel';

// ─── Constants ──────────────────────────────────────────────────────────────────

const CLIMATE_FACTORS: Record<string, number> = {
  '1': 30,
  '2': 25,
  '3': 20,
  '4': 15,
};

const CEILING_FACTORS: Record<string, number> = {
  '8': 1.0,
  '9': 1.1,
  '12': 1.25,
};

const SUN_FACTORS: Record<string, number> = {
  minimal: 0.9,
  moderate: 1.0,
  high: 1.15,
};

const INSULATION_FACTORS: Record<string, number> = {
  poor: 1.2,
  average: 1.0,
  good: 0.9,
};

const ROOM_FACTORS: Record<string, number> = {
  standard: 1.0,
  kitchen: 1.15,
  basement: 0.85,
};

const BTUS_PER_PERSON = 600;
const BTUS_PER_TON = 12000;

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function parseNum(v: string | undefined): number {
  return parseFloat(v?.trim() || '');
}

function parseIntVal(v: string | undefined): number {
  return parseInt(v?.trim() || '', 10);
}

function isValidNum(n: number): boolean {
  return !isNaN(n) && n > 0;
}

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString(undefined);
}

function fmtOneDecimal(n: number): string {
  return n.toFixed(1);
}

// ─── Calculate ───────────────────────────────────────────────────────────────────

function calculate(values: Record<string, string>): CalculatorResult[] {
  const area = parseNum(values.area);
  const climateZone = values.climateZone || '';
  const sunExposure = values.sunExposure || '';
  const insulation = values.insulation || '';
  const ceilingHeight = values.ceilingHeight || '';
  const roomType = values.roomType || '';
  const people = parseIntVal(values.people || '1');
  const purpose = values.purpose || 'cooling';

  if (!isValidNum(area) || !climateZone || !sunExposure || !insulation || !ceilingHeight || !roomType) {
    return [];
  }

  const climateFactor = CLIMATE_FACTORS[climateZone];
  const ceilingFactor = CEILING_FACTORS[ceilingHeight];
  const sunFactor = SUN_FACTORS[sunExposure];
  const insulationFactor = INSULATION_FACTORS[insulation];
  const roomFactor = ROOM_FACTORS[roomType];
  const purposeMultiplier = purpose === 'heating' ? 0.85 : 1.0;

  if (
    climateFactor === undefined ||
    ceilingFactor === undefined ||
    sunFactor === undefined ||
    insulationFactor === undefined ||
    roomFactor === undefined
  ) {
    return [];
  }

  const baseBTU = area * climateFactor * ceilingFactor * sunFactor * insulationFactor * roomFactor;
  const peopleBTU = people * BTUS_PER_PERSON;
  const totalBTU = (baseBTU + peopleBTU) * purposeMultiplier;

  const tons = totalBTU / BTUS_PER_TON;
  const recommendedTons = Math.ceil(tons * 2) / 2;
  const recommendedBTU = recommendedTons * BTUS_PER_TON;
  const btuPerSqFt = totalBTU / area;

  const CLIMATE_LABELS: Record<string, string> = {
    '1': 'Zone 1 — Hot',
    '2': 'Zone 2 — Mixed',
    '3': 'Zone 3 — Cool',
    '4': 'Zone 4 — Cold',
  };

  const details = [
    `Climate: ${CLIMATE_LABELS[climateZone] || climateZone}`,
    `Ceiling: ${ceilingHeight}ft`,
    `Sun: ${sunExposure}`,
    `Insulation: ${insulation}`,
    `Room: ${roomType}`,
    `People: ${people}`,
    `Purpose: ${purpose}`,
  ].join(' | ');

  return [
    {
      id: 'btuRequired',
      label: 'BTU/h Required',
      value: `${fmtNum(totalBTU)} BTU/h`,
      highlight: true,
      color: 'positive' as const,
    },
    {
      id: 'tonsRequired',
      label: 'AC Size (Tons)',
      value: `${fmtOneDecimal(tons)} ton`,
    },
    {
      id: 'recommendedAC',
      label: 'Recommended AC Unit',
      value: `${fmtOneDecimal(recommendedTons)} ton (${fmtNum(recommendedBTU)} BTU/h)`,
    },
    {
      id: 'btuPerSqFt',
      label: 'BTU per sq ft',
      value: `${fmtNum(btuPerSqFt)} BTU/sq ft`,
    },
    {
      id: 'roomDetails',
      label: 'Room Factors',
      value: details,
    },
  ];
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
      helpText: 'Taller ceilings increase the air volume that needs conditioning. Standard 8 ft ceilings use a factor of 1.0.',
    },
    {
      id: 'roomType',
      type: 'select',
      label: 'Room Type',
      options: [
        { label: 'Living Room / Bedroom', value: 'standard' },
        { label: 'Kitchen (extra heat from appliances)', value: 'kitchen' },
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
      helpText: 'Each person adds approximately 600 BTU/h of heat output. Count the typical number of occupants.',
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
      helpText: 'Choose Cooling for AC sizing or Heating for furnace sizing. Cooling applies no derating; heating applies a 0.85 multiplier.',
    },
  ],

  calculate,

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BTUPanel, { values, results });
  },

  educational: {
    formula: 'BTU = Area x ClimateFactor x CeilingFactor x SunFactor x InsulationFactor x RoomFactor + (People x 600)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="50" y="30" width="220" height="130" fill="rgba(59,130,246,0.08)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="6"/><text x="160" y="55" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13" font-weight="bold">Room Floor Plan</text><rect x="70" y="65" width="60" height="40" fill="rgba(59,130,246,0.15)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="100" y="89" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9">Area (sq ft)</text><rect x="200" y="65" width="50" height="40" fill="rgba(239,68,68,0.15)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="3"/><text x="225" y="89" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="8">Sun</text><rect x="130" y="110" width="60" height="30" fill="rgba(239,68,68,0.15)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="3"/><text x="160" y="128" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="8">People</text><text x="100" y="160" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">Climate Zone</text><text x="225" y="160" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">Ceiling / Insulation</text><line x1="80" y1="105" x2="80" y2="152" stroke="var(--svg-9ca3af)" stroke-width="1" stroke-dasharray="2,2"/><line x1="160" y1="140" x2="160" y2="152" stroke="var(--svg-9ca3af)" stroke-width="1" stroke-dasharray="2,2"/><text x="160" y="195" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">BTU = Area x Factors + People Heat</text></svg>',
      alt: 'Room floor plan diagram showing area, sun exposure, people, climate zone, and insulation factors',
      caption: 'BTU calculation accounts for room area, climate, sun, insulation, and occupancy',
    },
    formulaDescription:
      'BTU (British Thermal Unit) measures the cooling or heating power needed for a room. This simplified formula adjusts for climate zone, sun exposure, insulation quality, ceiling height, room type, and occupancy.',
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
          'Regional adjustment: Zone 1 (Hot) = 30, Zone 2 (Mixed) = 25, Zone 3 (Cool) = 20, Zone 4 (Cold) = 15 BTU per sq ft.',
      },
      {
        symbol: 'Ch',
        name: 'Ceiling Height Factor',
        description:
          'Adjusts for taller ceilings that increase volume. Standard 8ft = 1.0, 9-10ft = 1.1, 12+ft = 1.25.',
      },
      {
        symbol: 'S',
        name: 'Sun Exposure Factor',
        description:
          'Adjusts for solar heat gain. Minimal/shaded = 0.9, Moderate = 1.0, High (large windows) = 1.15.',
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
          'Adjusts for room-specific conditions. Standard = 1.0, Kitchen = 1.15 (appliance heat), Basement = 0.85 (naturally cooler).',
      },
      {
        symbol: 'P',
        name: 'People',
        description:
          'Each person adds approximately 600 BTU/h of heat output. Default is 1 person.',
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
      'BTU (British Thermal Unit) is the standard measure of thermal energy used in HVAC sizing worldwide. One BTU is defined as the amount of heat required to raise the temperature of one pound of water by one degree Fahrenheit — a unit invented in the mid-19th century during the Industrial Revolution when steam engine engineers needed a standardized way to measure energy output from coal and boilers. One ton of cooling = 12,000 BTU/h, a unit of measurement that originated from the cooling capacity of melting one ton (2,000 lbs) of ice over a 24-hour period. This is the same principle used in the ice houses that cooled buildings before mechanical air conditioning was invented in 1902 by Willis Carrier. Proper sizing is critical today — an undersized unit runs constantly without reaching temperature, while an oversized unit short-cycles, wastes energy, and fails to dehumidify properly. This calculator uses a simplified residential method that adjusts for the most important factors: climate, area, sun exposure, insulation, ceiling height, room type, and occupancy. Practical example: a 400 sq ft living room in Zone 2 (Mixed climate) with moderate sun, average insulation, standard 8 ft ceiling, and 2 people. Base BTU = 400 × 25 × 1.0 × 1.0 × 1.0 × 1.0 = 10,000 BTU/h. People BTU = 2 × 600 = 1,200 BTU/h. Total = 11,200 BTU/h or 0.93 tons. The recommended unit size is 1.0 ton (12,000 BTU/h). For this room, a 1.0 ton window unit or mini-split would be appropriate. Edge cases: for kitchens, the calculator adds 15% because cooking appliances, ovens, and refrigerators generate significant heat — a 300 sq ft kitchen in Zone 1 (Hot) might need 300 × 30 × 1.15 = 10,350 BTU/h just for the base load. For high-altitude locations (above 5,000 ft), derate AC capacity by about 3.5% per 1,000 ft because air is less dense. For server rooms or home theaters, add 3,400 BTU/h per 1,000W of equipment. For sunrooms or rooms with floor-to-ceiling glass, select "High" sun exposure and consider that the BTU estimate may still be conservative — glass can transmit 5-10 times more heat per square foot than an insulated wall.',
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
        answer: 'SEER (Seasonal Energy Efficiency Ratio) measures an AC unit\'s cooling efficiency over an entire cooling season. Higher SEER means lower electricity bills. The minimum SEER for new residential AC units in the US is 14 SEER in northern states and 15 SEER in southern states (as of 2023 DOE standards). A 20 SEER unit costs about 30-50% more upfront than a 14 SEER unit but can save $200-$400 per year in electricity depending on climate and usage. For a unit you plan to keep 15-20 years, the higher SEER usually pays for itself within 5-8 years in hot climates. For mild climates with short cooling seasons, a lower SEER unit makes more financial sense. The BTU calculation is independent of SEER — SEER affects operating cost, not sizing. An oversized unit with a high SEER rating still short-cycles and dehumidifies poorly.',
      },
      {
        question: 'How do window units compare to mini-split systems?',
        answer: 'Window AC units (typically 5,000-25,000 BTU/h) are the most affordable option upfront ($150-$800) but are noisy, block window views, and are less efficient than mini-splits. Ductless mini-split systems ($1,500-$5,000 installed per zone) are quieter, more efficient (often 20+ SEER), and provide both heating and cooling with a heat pump. Mini-splits also allow multi-zone control — you can cool only the rooms you use. For a single room under 400 sq ft, a window unit is cost-effective. For whole-home cooling or when you value quiet operation, mini-splits are the superior choice despite the higher upfront cost. The BTU sizing is the same regardless of which type you choose.',
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
        result: '11,700 BTU/h (0.98 tons). Recommended: 1.5 ton (18,000 BTU/h).',
        insight: 'A master bedroom with two large windows facing east for morning sun. Base BTU = 350 × 30 × 1.0 × 1.0 × 1.0 × 1.0 = 10,500 BTU/h. People BTU = 2 × 600 = 1,200 BTU/h. Total cooling = 11,700 BTU/h = 0.98 tons. Recommended unit: 1.5 tons (18,000 BTU/h) — rounding up to the next standard size provides margin for the extreme 110 degrees Fahrenheit summer days in Phoenix. In Phoenix, summer temperatures routinely exceed 110°F. A 1.0 ton unit would be borderline on extreme days. A 1.5 ton window unit ($350-$500) or a 1.5 ton mini-split ($1,800-$2,500 installed) will handle the worst days comfortably. Consider a unit with inverter (variable-speed) technology for this room — it runs at partial capacity most of the time and only ramps to full power on the hottest afternoons, saving 25-35% on cooling electricity compared to a single-speed unit.',
      },
      {
        scenario: 'Living Room / Open Floor Plan in Minneapolis, MN (Zone 4 — Cold)',
        inputs: { area: '600', climateZone: '4', sunExposure: 'minimal', insulation: 'good', ceilingHeight: '9', roomType: 'standard', people: '4', purpose: 'heating' },
        result: '8,856 BTU/h heating. For a furnace or heat pump, round to approximately 9,000-10,000 BTU/h.',
        insight: 'An open-plan living/dining/kitchen area — treat as one large room. Base BTU = 600 × 15 × 1.1 × 0.9 × 0.9 × 1.0 = 8,019 BTU/h. People BTU = 4 × 600 = 2,400 BTU/h. Heating mode applies 0.85 multiplier: (8,019 + 2,400) × 0.85 = 8,856 BTU/h. In Minneapolis, heating is the primary concern. This room needs about 9,000-10,000 BTU/h of heating capacity. A 1-ton mini-split heat pump ($2,000-$3,000 installed) can provide both the heating and cooling for this space. Modern cold-climate heat pumps (rated to -15°F or lower) work well in Zone 4, but you will want a backup heating source (electric resistance or gas) for the coldest -20°F nights. The heating multiplier of 0.85 accounts for internal heat gains from appliances, lighting, and body heat that reduce the heating load but increase the cooling load.',
      },
    ],
    proTips: [
      'Have a professional perform a Manual J load calculation before purchasing a central AC system. The $200-$400 cost is trivial compared to the $5,000-$12,000 system cost, and a properly sized system will save far more in energy costs over its 15-20 year lifespan.',
      'For window units, check the amperage rating and make sure your electrical circuit can handle it. A 12,000 BTU/h window unit draws about 10-12 amps — you cannot run two of them on a single 15-amp circuit. Larger units (15,000+ BTU/h) often require a dedicated 20-amp circuit. Check the nameplate before buying.',
      'Clean or replace HVAC filters monthly during peak cooling season. A dirty filter can reduce airflow by 50% and increase energy consumption by 15%. The cheapest maintenance action with the highest payback. For washable filters, rinse from the clean side toward the dirty side so debris is pushed out, not deeper into the filter media.',
      'Use a programmable thermostat to set the temperature 5-8 degrees higher when you are away during the day and cool the house down 30 minutes before you return. Each degree of setback saves approximately 3% on cooling costs. Smart thermostats learn your schedule and can pre-cool your home when electricity rates are lower.',
      'Before upgrading your AC unit, improve the thermal envelope of your home first: add attic insulation to R-49 or R-60, seal air leaks around windows and doors, install double-pane low-E windows if you have single-pane, and add solar screens or awnings on south and west windows. Reducing the cooling load means you can buy a smaller, less expensive AC unit that costs less to run every month.',
      'For portable AC units (floor-standing with exhaust hose), derate the stated BTU rating by 20-30%. Dual-hose portable units are significantly more efficient than single-hose models because single-hose units create negative pressure that pulls hot outside air into the room through every crack and gap. A "14,000 BTU" single-hose portable AC often delivers only 9,000-10,000 BTU of effective cooling after accounting for infiltration losses.',
    ],
    limitations: [
      'This calculator uses a simplified residential method, not a full Manual J load calculation. For whole-house sizing, new construction requiring permits, or rooms with unusual heat loads (server rooms, home theaters, indoor pools), consult an HVAC professional for a Manual J calculation. The simplified method assumes typical residential construction and is accurate within approximately 15-20% for standard rooms.',
      'The calculator does not account for duct losses (typically 20-30% of capacity for ducted systems), air infiltration through cracks and gaps, internal gains from appliances beyond kitchen factor, or building orientation relative to prevailing winds. These factors can shift the BTU requirement by 10-25% in either direction.',
      'Calculated BTUs are for a single room with standard ceiling heights. Open floor plans that combine multiple rooms should be treated as one large room with the combined square footage, but this approach does not account for different sun exposures or room types within the open area. For rooms with two exterior walls (corner rooms), the actual cooling load may be 10-15% higher than calculated.',
      'BTU requirements assume standard indoor design temperatures (75°F cooling, 70°F heating) and standard outdoor design temperatures for each climate zone. If you prefer your home significantly cooler (68°F) or live in an area with recent climate change-driven heat extremes beyond historical norms, consider upsizing by 0.5 tons.',
    ],
    quickReference: [
      { label: '1 ton of cooling', value: '12,000 BTU/h' },
      { label: 'Person heat output', value: '~600 BTU/h' },
      { label: 'Kitchen heat gain factor', value: '1.15 (15% extra)' },
      { label: 'Basement cooling factor', value: '0.85 (15% less)' },
      { label: 'Min residential SEER (North)', value: '14 SEER' },
      { label: 'Min residential SEER (South)', value: '15 SEER' },
      { label: 'Window unit typical range', value: '5,000-25,000 BTU/h' },
      { label: 'Duct loss allowance', value: '20-30% of capacity' },
    ],
    citations: [
      { source: 'Wikipedia', title: 'British Thermal Unit', url: 'https://en.wikipedia.org/wiki/British_thermal_unit' },
      { source: 'U.S. Department of Energy — HVAC Sizing', url: 'https://www.energy.gov/energysaver/air-conditioning' },
      { source: 'ACCA Manual J — Residential Load Calculation', url: 'https://www.acca.org/standards/technical-manuals/manual-j' },
    ],
  },
};

export default btuConfig;
