import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import SquareFootagePanel from './SquareFootagePanel';

const SHAPE_OPTIONS = [
  { label: 'Rectangle', value: 'rectangle' },
  { label: 'Circle', value: 'circle' },
  { label: 'L-Shape', value: 'lshape' },
];

const UNIT_OPTIONS = [
  { label: 'Feet', value: 'ft' },
  { label: 'Meters', value: 'm' },
];

const WASTAGE_OPTIONS = [
  { label: 'None (exact)', value: '0' },
  { label: '5%', value: '5' },
  { label: '10% (recommended)', value: '10' },
  { label: '15%', value: '15' },
];

const SHAPE_LABELS: Record<string, string> = {
  rectangle: 'Rectangle',
  circle: 'Circle',
  lshape: 'L-Shape',
};

function fmt(n: number): string {
  if (!isFinite(n)) return '0';
  return parseFloat(n.toFixed(4)).toString();
}

const squareFootageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'shape',
      label: 'Shape',
      type: 'select',
      required: true,
      options: SHAPE_OPTIONS,
    },
    {
      id: 'length',
      label: 'Length (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: '10',
      helpText: 'Length of the rectangular section',
      showWhen: (v) => v.shape === 'rectangle' || v.shape === 'lshape',
    },
    {
      id: 'width',
      label: 'Width (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: '12',
      helpText: 'Width of the rectangular section',
      showWhen: (v) => v.shape === 'rectangle' || v.shape === 'lshape',
    },
    {
      id: 'radius',
      label: 'Radius (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: '5',
      helpText: 'Radius of the circle',
      showWhen: (v) => v.shape === 'circle',
    },
    {
      id: 'lLength2',
      label: 'Second Rectangle Length (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: '6',
      helpText: 'The length of the second rectangular section',
      showWhen: (v) => v.shape === 'lshape',
    },
    {
      id: 'lWidth2',
      label: 'Second Rectangle Width (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: '4',
      helpText: 'The width of the second rectangular section',
      showWhen: (v) => v.shape === 'lshape',
    },
    {
      id: 'unit',
      label: 'Unit',
      type: 'select',
      required: true,
      options: UNIT_OPTIONS,
    },
    {
      id: 'pricePerSqFt',
      label: 'Price per sq ft ($)',
      type: 'number',
      min: 0,
      step: 0.01,
      placeholder: '0',
      helpText: 'Optional — enter to estimate total cost',
    },
    {
      id: 'wastage',
      label: 'Waste Factor',
      type: 'select',
      required: true,
      options: WASTAGE_OPTIONS,
    },
  ],
  calculate: (values) => {
    const shape = values.shape || 'rectangle';
    const unit = values.unit || 'ft';
    const wastageStr = values.wastage || '0';
    const priceStr = values.pricePerSqFt || '';
    const wastagePct = parseInt(wastageStr) || 0;
    const price = priceStr ? parseFloat(priceStr) : NaN;

    // Validate shape-specific inputs
    let area: number;
    let dimensionsDesc: string;

    if (shape === 'rectangle') {
      const length = parseFloat(values.length);
      const width = parseFloat(values.width);
      if (isNaN(length) || isNaN(width) || length <= 0 || width <= 0) return [];
      area = length * width;
      dimensionsDesc = `${fmt(length)} × ${fmt(width)} ${unit}`;
    } else if (shape === 'circle') {
      const radius = parseFloat(values.radius);
      if (isNaN(radius) || radius <= 0) return [];
      area = Math.PI * radius * radius;
      dimensionsDesc = `Radius = ${fmt(radius)} ${unit}`;
    } else if (shape === 'lshape') {
      const length = parseFloat(values.length);
      const width = parseFloat(values.width);
      const lLength2 = parseFloat(values.lLength2);
      const lWidth2 = parseFloat(values.lWidth2);
      if (
        isNaN(length) || isNaN(width) || length <= 0 || width <= 0 ||
        isNaN(lLength2) || isNaN(lWidth2) || lLength2 <= 0 || lWidth2 <= 0
      ) return [];
      area = length * width + lLength2 * lWidth2;
      dimensionsDesc = `(${fmt(length)} × ${fmt(width)}) + (${fmt(lLength2)} × ${fmt(lWidth2)}) ${unit}`;
    } else {
      return [];
    }

    if (!isFinite(area) || area <= 0) return [];

    // Convert area to sq ft and sq m
    let sqft: number;
    let sqm: number;

    if (unit === 'm') {
      sqm = area;
      sqft = area * 10.7639;
    } else {
      sqft = area;
      sqm = area / 10.7639;
    }

    // Apply wastage
    const wasteMultiplier = 1 + wastagePct / 100;
    const withWaste = sqft * wasteMultiplier;

    const fmtSqft = fmt(sqft);
    const fmtSqm = fmt(sqm);
    const fmtWithWaste = fmt(withWaste);
    const shapeLabel = SHAPE_LABELS[shape] || shape;

    const results: CalculatorResult[] = [
      {
        id: 'sqft',
        label: 'Square Footage',
        value: `${fmtSqft} ft²`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'sqm',
        label: 'Square Meters',
        value: `${fmtSqm} m²`,
        color: 'neutral',
      },
      {
        id: 'withWaste',
        label: `With ${wastagePct}% Waste`,
        value: `${fmtWithWaste} ft²`,
        color: 'neutral',
      },
      {
        id: 'shape',
        label: 'Shape',
        value: shapeLabel,
        color: 'neutral',
      },
      {
        id: 'dimensions',
        label: 'Dimensions',
        value: dimensionsDesc,
        color: 'neutral',
      },
    ];

    // Optional cost estimate
    if (!isNaN(price) && price > 0) {
      const cost = price * withWaste;
      results.push({
        id: 'totalCost',
        label: 'Estimated Cost',
        value: `$${cost.toFixed(2)}`,
        color: 'neutral',
      });
    }

    return results;
  },
  extraPanel: (_values, results) => {
    if (!results.length) return null;
    return createElement(SquareFootagePanel, { values: _values, results });
  },
  educational: {
    formula: 'Rectangle: A = l × w | Circle: A = πr² | L-Shape: A = (l₁×w₁) + (l₂×w₂)',
    formulaDescription:
      'Square footage measures the area of a space in square feet. Different shapes use different area formulas. For rectangles multiply length by width. For circles use π times the radius squared. For L-shaped rooms divide into two rectangles and add their areas.',
    variables: [
      { symbol: 'A', name: 'Area', description: 'Total square footage of the space.' },
      { symbol: 'l / w', name: 'Length & Width', description: 'Dimensions of a rectangular section in feet or meters.' },
      { symbol: 'r', name: 'Radius', description: 'Distance from center to edge of a circular area.' },
      { symbol: 'π', name: 'Pi', description: 'Mathematical constant ≈ 3.14159, used for circular area.' },
    ],
    howToUse: [
      'Select the shape of the area: rectangle, circle, or L-shape.',
      'Enter the required dimensions for the chosen shape.',
      'Choose your input unit (feet or meters).',
      'Optionally add a waste factor (10% is standard for flooring) and a price per square foot for a cost estimate.',
    ],
    explanation:
      'Square footage is the standard unit of area measurement in US real estate and construction. It determines property values, flooring material quantities, paint coverage, HVAC sizing, and more. For simple rectangular rooms, just multiply length by width. For irregular shapes, break the space into rectangles, calculate each area, and sum them. Always add a waste factor (typically 5-15%) when ordering materials like flooring or tile to account for cuts, mistakes, and off-cuts. Practical example: an L-shaped room consists of a 12×10 ft section joined to a 6×8 ft section. Total area = (12 × 10) + (6 × 8) = 120 + 48 = 168 sq ft. For hardwood flooring with a 10% waste factor, order 168 × 1.10 = 184.8 (round to 185 sq ft). At $5.00 per sq ft, estimated cost = $925. In square meters, the area is 168 / 10.764 = 15.6 m². Edge cases: for rooms with triangular sections (e.g., a bay window alcove), use the formula A = ½ × base × height for each triangular section and add it to the rectangular area. For circular rooms or areas (rare in residential but common in some commercial buildings), use A = πr². For rooms measured in meters, the calculator converts to square feet using the factor 1 m² = 10.7639 ft² automatically. For carpet measurement, remember that carpet comes in 12-ft wide rolls, so a room that is 14×10 ft might require 14 ft of 12-ft-wide carpet covering only 10 ft of width, with 2 ft of waste — a different calculation than simple square footage. For paint estimation, one gallon typically covers about 350-400 sq ft of wall area (not floor area), so you need the wall perimeter × ceiling height for the wall surface area. For property listings, note that different US regions measure square footage differently — some include garages and basements, while others count only finished above-grade living space. Always verify which standard is being used when comparing property values.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><defs><marker id="ab" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-3b82f6)"/></marker></defs><rect x="50" y="30" width="130" height="100" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="3"/><rect x="180" y="80" width="90" height="50" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="3"/><text x="115" y="85" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="12" font-weight="bold">12 ft</text><text x="115" y="98" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="11">&amp;times;</text><text x="115" y="111" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="12" font-weight="bold">10 ft</text><text x="115" y="124" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="10">= 120 ft&sup2;</text><text x="225" y="108" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="12" font-weight="bold">6 &amp;times; 8</text><text x="225" y="121" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="10">= 48 ft&sup2;</text><line x1="50" y1="18" x2="180" y2="18" stroke="var(--svg-3b82f6)" stroke-width="1.5" marker-start="url(#ab)" marker-end="url(#ab)"/><text x="115" y="13" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="12" font-weight="bold">Length 1</text><line x1="35" y1="30" x2="35" y2="130" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="27" y="85" text-anchor="end" fill="var(--svg-ef4444)" font-size="12" font-weight="bold" transform="rotate(-90,27,85)">Width 1</text><text x="160" y="174" text-anchor="middle" fill="var(--svg-4b5563)" font-size="10">Total = (12 &amp;times; 10) + (6 &amp;times; 8) = 168 ft&sup2;</text><text x="160" y="193" text-anchor="middle" fill="var(--svg-4b5563)" font-size="9">Add waste factor: 168 &amp;times; 1.10 = 185 ft&sup2; for ordering</text></svg>',
      alt: 'L-shaped room divided into two rectangles with dimensions and area calculations',
      caption: 'Square footage is calculated by dividing irregular spaces into rectangles, calculating each area, and summing them.',
    },
    faqs: [
      {
        question: 'Why do I need a waste factor?',
        answer: 'Materials like flooring, tile, and carpet rarely fit perfectly into a space without cutting. The waste factor accounts for off-cuts, pattern matching, mistakes, and future repairs. For standard rectangular rooms, 5% is usually enough. For diagonal installations, L-shapes, or rooms with many corners, 10-15% is recommended.',
      },
      {
        question: 'How do I convert square feet to square meters?',
        answer: 'Multiply square feet by 0.092903 to get square meters. Conversely, multiply square meters by 10.7639 to get square feet. This calculator does both conversions automatically.',
      },
      {
        question: 'What is an L-shaped room and how is it measured?',
        answer: 'An L-shaped room is any space that forms an "L" configuration — two rectangular sections joined at a right angle. To calculate its area, split it into two rectangles, calculate each area separately using length × width, and add them together.',
      },
      {
        question: 'How much flooring do I need for a 12×12 room?',
        answer: 'A 12×12 ft room has 144 sq ft of floor area. With a 10% waste factor, you should order 144 × 1.10 = 158.4 sq ft of material. It\'s always better to round up to account for measuring errors and unexpected cuts.',
      },
      {
        question: 'How do I measure square footage for carpet or flooring on stairs?',
        answer: 'Stairs require a different measurement approach. Each stair tread (horizontal surface) plus the riser (vertical face) is measured together. Measure the tread width and depth, and the riser height, all in inches. For each stair, the total square footage = (tread depth + riser height) × tread width / 144. Multiply by the number of stairs. For example, 13 stairs with a 10-inch tread, 7-inch riser, and 36-inch width: each stair covers (10 + 7) × 36 / 144 = 4.25 sq ft, and 13 stairs total 55.25 sq ft. Add a landing area (if present) separately. For carpet, add 3-4 inches to each measurement for trimming and pattern matching. For LVP (luxury vinyl plank) or hardwood on stairs, each tread is typically a single piece cut to size, so you need one plank or board per tread plus the riser trim pieces. For bullnose treads (rounded front edge), measure from the back of the tread to the farthest point of the nose. Stair nose molding (transition pieces) is ordered separately by linear foot equal to the total width of all stairs.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Square Foot', url: 'https://en.wikipedia.org/wiki/Square_foot' },
      { source: 'Wolfram MathWorld', title: 'Area', url: 'https://mathworld.wolfram.com/Area.html' },
    ],
  },
};

export default squareFootageConfig;
