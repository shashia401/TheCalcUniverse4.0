import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RoofingPanel from './RoofingPanel';

const PITCH_MULTIPLIERS: Record<string, number> = {
  '0': 1.000,
  '2': 1.014,
  '4': 1.054,
  '6': 1.118,
  '8': 1.202,
  '10': 1.302,
  '12': 1.414,
};

const roofingConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'length',
      label: 'Building Length (ft)',
      type: 'number',
      placeholder: '40',
      min: 1,
      step: 0.5,
      required: true,
    },
    {
      id: 'width',
      label: 'Building Width (ft)',
      type: 'number',
      placeholder: '30',
      min: 1,
      step: 0.5,
      required: true,
    },
    {
      id: 'pitch',
      label: 'Roof Pitch',
      type: 'select',
      options: [
        { label: 'Flat (0/12)', value: '0' },
        { label: 'Low (2/12)', value: '2' },
        { label: 'Moderate (4/12)', value: '4' },
        { label: 'Standard (6/12)', value: '6' },
        { label: 'Steep (8/12)', value: '8' },
        { label: 'Very Steep (10/12)', value: '10' },
        { label: 'Max (12/12)', value: '12' },
      ],
      required: true,
    },
    {
      id: 'overhang',
      label: 'Eave Overhang (ft)',
      type: 'number',
      placeholder: '1',
      min: 0,
      step: 0.5,
      helpText: 'Typically 1-2 ft',
    },
    {
      id: 'roofType',
      label: 'Roof Type',
      type: 'select',
      options: [
        { label: 'Gable (simple)', value: 'gable' },
        { label: 'Hip', value: 'hip' },
      ],
      required: true,
    },
    {
      id: 'wasteFactor',
      label: 'Waste Factor',
      type: 'select',
      options: [
        { label: '5% (simple roof)', value: '5' },
        { label: '10% (standard)', value: '10' },
        { label: '15% (complex)', value: '15' },
      ],
    },
  ],
  calculate: (values) => {
    const length = parseFloat(values.length);
    const width = parseFloat(values.width);
    const pitch = values.pitch || '6';
    const overhangRaw = parseFloat(values.overhang);
    const overhang = !isNaN(overhangRaw) ? overhangRaw : 1;
    const roofType = values.roofType || 'gable';
    const wastePct = parseFloat(values.wasteFactor || '10') / 100;

    if ([length, width].some(isNaN) || length <= 0 || width <= 0) return [];

    const pitchMulti = PITCH_MULTIPLIERS[pitch] ?? 1.118;

    const effL = length + 2 * overhang;
    const effW = width + 2 * overhang;
    const footprintArea = effL * effW;

    const hipFactor = roofType === 'hip' ? 0.05 : 0;
    const roofArea = footprintArea * pitchMulti * (1.0 + wastePct + hipFactor);
    const squares = Math.ceil(roofArea / 100);
    const bundles = squares * 3;

    const ridgeLength = roofType === 'gable' ? effL : (effL > effW ? effL : effW);
    const feltRolls = Math.ceil(roofArea / 400);
    const nailsLbs = squares * 2;

    const fmt = (n: number) => parseFloat(n.toFixed(1)).toString();

    const results = [
      {
        id: 'roofArea',
        label: 'Total Roof Area',
        value: `${fmt(roofArea)} sq ft`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'squares',
        label: 'Roofing Squares Needed',
        value: `${squares} squares`,
        color: 'neutral' as const,
      },
      {
        id: 'bundles',
        label: 'Shingle Bundles Needed',
        value: `${bundles} bundles`,
        color: 'neutral' as const,
      },
      {
        id: 'footprintArea',
        label: 'Footprint Area',
        value: `${fmt(footprintArea)} sq ft`,
        color: 'neutral' as const,
      },
      {
        id: 'pitchMultiplier',
        label: 'Pitch Multiplier',
        value: `${pitchMulti}`,
        color: 'neutral' as const,
      },
      {
        id: 'estimatedCost',
        label: 'Est. Material Cost',
        value: 'Enter price per square for estimate',
        color: 'neutral' as const,
      },
      {
        id: 'materialsList',
        label: 'Materials List',
        value: JSON.stringify({
          squares,
          bundles,
          feltRolls,
          nailsLbs,
          ridgeLength: fmt(ridgeLength),
        }),
        color: 'neutral' as const,
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RoofingPanel, { values, results });
  },
  educational: {
    formula: 'Roof Area = Footprint Area x Pitch Multiplier x (1 + Waste) x (1 + Hip Factor)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Roof Pitch Cross-Section</text><!-- House walls --><rect x="70" y="100" width="180" height="70" fill="rgba(59,130,246,0.1)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="160" y="145" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="18" font-weight="bold">House</text><!-- Roof --><polygon points="50,100 160,30 270,100" fill="none" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linejoin="round"/><!-- Rafter line --><line x1="160" y1="100" x2="160" y2="160" stroke="var(--svg-3b82f6)" stroke-width="1" stroke-dasharray="4,3"/><!-- Rise and Run labels --><line x1="160" y1="30" x2="160" y2="100" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="165" y="68" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Rise</text><line x1="160" y1="100" x2="270" y2="100" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="215" y="96" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Run</text><text x="160" y="190" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="10">Pitch = Rise / Run (e.g., 6/12) = 26.6 deg</text></svg>',
      alt: 'House roof cross-section showing pitch as rise over run with labeled dimensions',
      caption: 'Roof pitch = rise / run, measured in inches per 12 inches of horizontal run',
    },
    formulaDescription:
      'Roofing material quantities are calculated from the building footprint adjusted for roof pitch, overhang, waste, and roof type.',
    variables: [
      { symbol: 'Pitch Multiplier', name: 'Pitch Multiplier', description: 'Factor that accounts for the increased surface area of a sloped roof vs flat.' },
      { symbol: 'Squares', name: 'Squares', description: 'A roofing square = 100 sq ft. Industry standard for quoting material.' },
    ],
    howToUse: [
      'Enter building length and width.',
      'Select roof pitch from the dropdown.',
      'Choose roof type (gable or hip).',
      'Add overhang and waste factor.',
      'Review squares, bundles, and materials.',
    ],
    explanation:
      'Roofing is measured in "squares" where 1 square = 100 square feet. The pitch multiplier accounts for the extra surface area created by the slope. Hip roofs require ~5% more material than gable roofs due to complex cuts. Always add a waste factor of 10-15% depending on roof complexity. Practical example: a house measuring 40 feet by 30 feet with a 6/12 pitch and 1 foot overhang on all sides. The effective footprint is (40 + 2) × (30 + 2) = 42 × 32 = 1,344 sq ft. Using the pitch multiplier of 1.118 for 6/12, the roof surface area is 1,344 × 1.118 = 1,503 sq ft. With 10% waste on a gable roof: 1,503 × 1.10 = 1,653 sq ft, which is 16.53 squares, rounded up to 17 squares requiring 51 bundles of shingles. Edge cases: for roofs with multiple valleys, dormers, or chimneys, waste can reach 20% because of complex flashing and cutting around obstructions. For flat roofs (0/12 pitch), the pitch multiplier is 1.000 but additional material is needed for tapered insulation to ensure proper drainage — at least 1/4 inch per foot slope. For metal roofing, the square calculation differs because panels are ordered by linear foot with specific coverage widths, and ridge caps, drip edges, and flashings must be accounted for separately. In high-wind areas, consider upgraded underlayment and additional fasteners per square.',
    faqs: [
      {
        question: 'What is a roofing square?',
        answer: 'A roofing square is 100 square feet of roof surface. Material estimates (shingles, underlayment) are typically quoted in squares. A 2,000 sq ft roof = 20 squares.',
      },
      {
        question: 'How many shingle bundles per square?',
        answer: 'Standard 3-tab architectural shingles come 3 bundles per square. Each bundle covers approximately 33.3 sq ft. Always round up to the nearest bundle.',
      },
      {
        question: 'How do I calculate roofing for a complex roof with valleys and dormers?',
        answer: 'For complex roofs, divide the roof into individual planes (rectangles and triangles), calculate each plane area separately using the pitch multiplier, and sum them all. A hip roof with four planes and a front-facing dormer might have 5 or more separate plane calculations. Valleys (where two roof planes intersect) require additional flashing and the shingles must be cut at an angle, which increases waste. For dormer windows, calculate the dormer roof area separately (typically two small triangular or trapezoidal planes) and add any sidewall flashing material. For wide valleys, use the "open valley" method with metal flashing extending 6-8 inches on each side, or the "woven valley" method where shingles are interlaced. Each valley requires about 10-12 linear feet of extra material per story for proper flashing. For skylights, account for the flashing kit and the extra shingle cutting around the curb. A general rule for complex roofs: add 15-20% waste instead of the standard 10%, and always include ridge vent material for proper attic ventilation at the rate of 1 square foot of vent area per 300 square feet of attic floor space.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Roof', url: 'https://en.wikipedia.org/wiki/Roof' },
      { source: 'Wolfram MathWorld', title: 'Geometry', url: 'https://mathworld.wolfram.com/Geometry.html' },
    ],
  },
};

export default roofingConfig;
