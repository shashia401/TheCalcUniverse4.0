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
      label: 'Room Area (sq ft)',
      placeholder: 'e.g., 400',
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
      helpText: 'Select your region for climate adjustment',
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
    },
    {
      id: 'people',
      type: 'number',
      step: 1,
      min: 0,
      label: 'People (typical occupancy)',
      placeholder: 'e.g., 2',
      defaultValue: '1',
      helpText: 'Each person adds ~600 BTU/h',
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
      'BTU (British Thermal Unit) is the standard measure of thermal energy used in HVAC sizing. One ton of cooling = 12,000 BTU/h. Proper sizing is critical — an undersized unit runs constantly without reaching temperature, while an oversized unit short-cycles, wastes energy, and fails to dehumidify properly. This calculator uses a simplified residential method that adjusts for the most important factors: climate, area, sun exposure, insulation, ceiling height, room type, and occupancy. Practical example: a 400 sq ft living room in Zone 2 (Mixed climate) with moderate sun, average insulation, standard 8 ft ceiling, and 2 people. Base BTU = 400 × 25 × 1.0 × 1.0 × 1.0 × 1.0 = 10,000 BTU/h. People BTU = 2 × 600 = 1,200 BTU/h. Total = 11,200 BTU/h or 0.93 tons. The recommended unit size is 1.0 ton (12,000 BTU/h). For this room, a 1.0 ton window unit would be appropriate. Edge cases: for kitchens, the calculator adds 15% because cooking appliances, ovens, and refrigerators generate significant heat — a 300 sq ft kitchen in Zone 1 (Hot) might need 300 × 30 × 1.15 = 10,350 BTU/h just for the base load. For basements, the calculator applies a 0.85 factor because basements are naturally cooler due to being partially underground, but if the basement has finished walls and is used as a living space, it may need additional capacity for dehumidification. For rooms with unusually large windows or skylights beyond the standard sun exposure adjustment, consider increasing the sun factor or adding supplemental cooling. For server rooms or home theaters, the heat generated by electronics can be substantial — add 3,400 BTU/h per 1,000W of equipment. For high-altitude locations (above 5,000 ft), derate AC capacity by about 3.5% per 1,000 ft because air is less dense and carries less heat.',
    faqs: [
      {
        question: 'What happens if I undersize or oversize my AC?',
        answer:
          'An undersized AC runs continuously without adequately cooling the space. An oversized AC short-cycles (turns on and off frequently), which wastes energy, reduces dehumidification, and causes temperature swings. Proper sizing is essential for comfort and efficiency.',
      },
      {
        question: 'Why does the calculator recommend rounding up to the nearest 0.5 ton?',
        answer:
          'AC units are manufactured in standard sizes: 1.0, 1.5, 2.0, 2.5, 3.0 tons, etc. Rounding up ensures the unit has adequate capacity for extreme conditions. The standard recommendation adds approximately 0.5 tons above the calculated value as a safety margin.',
      },
      {
        question: 'How do I calculate BTU requirements for a room with vaulted or cathedral ceilings?',
        answer:
          'For vaulted or cathedral ceilings, use the ceiling height factor that most closely matches the average height. A room with a 12-foot vaulted ceiling that starts at 8 feet and peaks at 16 feet has an average height of 12 feet, so use the 12-foot factor (1.25). However, vaulted ceilings also increase the thermal load because heat rises and collects at the peak, and the larger glass area (windows and skylights) common in rooms with vaulted ceilings increases solar heat gain. For rooms with large south-facing windows under a vaulted ceiling, consider selecting the next higher sun exposure category. For example, if the room has large south-facing windows with moderate sun exposure overall but high sun exposure during summer afternoons, select "High" sun exposure for safety. Also consider that rooms with ceiling fans can effectively circulate air and may allow slightly lower BTUs because the occupants will feel cooler at the same temperature due to the wind-chill effect of the fan — a ceiling fan can make a room feel 4-5°F cooler, potentially reducing cooling load by 10-15%. The Department of Energy recommends using ceiling fans in conjunction with AC to allow setting the thermostat higher while maintaining comfort.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'British Thermal Unit', url: 'https://en.wikipedia.org/wiki/British_thermal_unit' },
      { source: 'Wolfram MathWorld', title: 'BTU', url: 'https://mathworld.wolfram.com/BTU.html' },
    ],
  },
};

export default btuConfig;
