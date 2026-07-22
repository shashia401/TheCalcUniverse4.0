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
      helpText: 'Choose the shape that best matches your room. For irregular rooms, select L-shape or break into multiple rectangles.',
    },
    {
      id: 'length',
      label: 'Length (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
      placeholder: '10',
      helpText: 'Length of the rectangular section in feet. Measure wall to wall along the longest side.',
      showWhen: (v) => v.shape === 'rectangle' || v.shape === 'lshape',
    },
    {
      id: 'width',
      label: 'Width (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
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
      inputMode: 'decimal',
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
      inputMode: 'decimal',
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
      inputMode: 'decimal',
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
      helpText: 'Choose your input unit. The calculator converts between feet and square meters automatically.',
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
      helpText: 'Extra material percentage for cuts, mistakes, and off-cuts. 10% is standard for flooring and tile projects.',
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
      'Square footage is the standard unit of area measurement in US real estate and construction, with roots tracing back to ancient Mesopotamia where surveyors used the "square cubit" to measure land and allocate agricultural plots along the Tigris and Euphrates rivers around 3000 BCE. The modern "square foot" was standardized in England during the medieval period as part of the imperial measurement system and carried to America by colonial settlers. The term "square" in real estate (e.g., "a 2,500-square-foot house") has been the dominant unit for property valuation in the United States since the early 20th century. It determines property values, flooring material quantities, paint coverage, HVAC sizing, and more. For simple rectangular rooms, just multiply length by width. For irregular shapes, break the space into rectangles, calculate each area, and sum them — a technique based on the geometric principle of area additivity. Always add a waste factor (typically 5-15%) when ordering materials like flooring or tile to account for cuts, mistakes, and off-cuts. Practical example: an L-shaped room consists of a 12×10 ft section joined to a 6×8 ft section. Total area = (12 × 10) + (6 × 8) = 120 + 48 = 168 sq ft. For hardwood flooring with a 10% waste factor, order 168 × 1.10 = 184.8 (round to 185 sq ft). At $5.00 per sq ft, estimated cost = $925. In square meters, the area is 168 / 10.764 = 15.6 m². Edge cases: for rooms with triangular sections, use A = ½ × base × height. For circular rooms, use A = πr². For carpet measurement, carpet comes in 12-ft wide rolls, so a room that is 14×10 ft might require 14 ft of 12-ft-wide carpet covering only 10 ft of width, with 2 ft of waste — a different calculation than simple square footage. For property listings, different US regions measure square footage differently — some include garages and basements, while others count only finished above-grade living space per ANSI Z765 standards. Always verify which standard is being used.',
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
    workedExamples: [
      {
        scenario: 'Hardwood Flooring for an L-Shaped Living/Dining Room',
        inputs: { shape: 'lshape', length: '16', width: '12', lLength2: '10', lWidth2: '8', unit: 'ft', pricePerSqFt: '6.50', wastage: '10' },
        result: '299.2 sq ft needed (round up to 300 sq ft). At $6.50/sq ft: $1,944.80 for engineered oak hardwood.',
        insight: 'The main living area is 16x12 ft = 192 sq ft. The dining alcove is 10x8 ft = 80 sq ft. Total area = 192 + 80 = 272 sq ft. With 10% waste: 272 x 1.10 = 299.2 sq ft. In square meters: 272 / 10.764 = 25.3 m2. For an L-shaped room like this, you cannot just order 272 sq ft of flooring -- the diagonal cuts where the planks meet at the room junction will generate significant waste. The 10% waste factor is actually conservative for L-shaped rooms with hardwood laid parallel to the longest wall. For diagonal or herringbone installations, increase the waste factor to 15%. At $6.50/sq ft for materials, every 1% of additional waste costs about $18 -- getting the waste factor right matters. Also budget $3-5/sq ft for installation labor if hiring a professional, bringing the all-in cost to approximately $2,800-$3,500 for this room.',
      },
      {
        scenario: 'Paver Patio Circular Fire Pit Area',
        inputs: { shape: 'circle', radius: '6', unit: 'ft', pricePerSqFt: '8.00', wastage: '10' },
        result: '124.4 sq ft needed. At $8.00/sq ft: $995.20 for concrete pavers. 38 linear ft of paver edging needed.',
        insight: 'A circular paver area with a 6 ft radius: Area = pi x 6^2 = 3.14159 x 36 = 113.1 sq ft. With 10% waste for paver cuts around the curved edge: 113.1 x 1.10 = 124.4 sq ft needed. The circumference = 2 x pi x 6 = 37.7 ft, so you will need approximately 38 linear feet of paver edging to contain the circle. Circular areas generate more waste than rectangular ones because pavers must be cut to follow the curve -- the outer edge of each cut piece is wasted. For detailed curved paver work, professional installation is highly recommended. A pallet of standard concrete pavers covers roughly 100-120 sq ft, so order 1.25 pallets. At $400-$500 per pallet at home centers, budget about $500-$650 for materials plus $200-$300 for base gravel, sand, and edge restraints. Rent a plate compactor ($60/day) for the gravel base and a wet saw ($50/day) for cutting curves cleanly.',
      },
    ],
    proTips: [
      'Measure twice, order once. Measure each wall independently rather than assuming a room is a perfect rectangle. Walls are rarely perfectly parallel — measure at both ends and use the average. For flooring, measure the room at its widest and longest points. A 1-inch measurement error in a 20-foot room translates to 1.7 sq ft of error.',
      'For flooring installations, always buy all your material from the same dye lot or production run. Boxes of flooring from different production batches can have subtle color variations that are invisible in the store but glaringly obvious once installed side by side. Write down the dye lot number from the box and confirm all boxes match.',
      'Before measuring, sketch the room on paper with all dimensions and note any alcoves, bay windows, doorways, closets, and built-in features. Include the swing of each door — a door that opens into the room requires clearance that may affect where flooring can end. This sketch will be invaluable when laying out your flooring pattern and planning cuts.',
      'Acclimate your flooring material in the room where it will be installed for at least 48-72 hours before installation. This allows the material to adjust to the room\'s temperature and humidity, preventing gaps or buckling after installation. Stack boxes flat with spacers between them for airflow. The room should be at normal living temperature (65-75°F) and humidity (35-55%) during acclimation.',
      'When calculating for paint (wall area, not floor area), use the formula: wall area = (perimeter × ceiling height) — (door area + window area). One gallon of quality paint covers approximately 350-400 sq ft of wall area in one coat. A 12×12 room with 8 ft ceilings has a perimeter of 48 ft and a wall area of 48 × 8 = 384 sq ft — almost exactly one gallon per coat. Always apply two coats for even coverage and color depth.',
      'For carpet, the roll width (typically 12 ft) determines the minimum width of your order regardless of room dimensions. A 10×10 ft room requires a 12×10 ft piece of carpet = 120 sq ft (13.3 sq yards), not 100 sq ft. The extra 2-foot strip is waste. Always order carpet by the square yard (divide square feet by 9) and confirm the roll width with your installer.',
    ],
    limitations: [
      'This calculator handles rectangles, circles, and L-shaped rooms only. For rooms with more than two rectangular sections, curved walls, bay windows, hexagonal rooms, or irregular polygons with more than 4 sides, divide the floor plan into simpler shapes, calculate each separately, and sum the results. Octagonal rooms, for example, can be treated as a square plus four triangles at the corners.',
      'The waste factor is an estimate based on typical installations. For diagonal flooring installations (running at 45 degrees to the walls), increase the waste factor by 5-10% above the selected value. For herringbone, chevron, or other intricate parquet patterns, waste can reach 20-30%. For large-format tile (12×24 inches or larger), waste increases because each broken or miscut tile wastes more square footage.',
      'The calculator does not account for material-specific ordering units. Flooring is sold by the box (typically 20-25 sq ft per box for laminate, 15-22 sq ft for hardwood, 12-15 sq ft for luxury vinyl plank). Tile is sold by the box (typically 10-15 sq ft per box). Carpet is sold by the square yard (divide sq ft by 9). Always round up to the nearest full box — partial boxes are rarely returnable after the job is done.',
      'Square footage calculations for real estate purposes are governed by ANSI Z765 standards in the US, which specify that only finished, above-grade living space with a ceiling height of at least 7 feet counts toward the listed square footage. Garages, unfinished basements, and attics with less than 7 feet of headroom do not count. This calculator measures total floor area and does not distinguish between finished and unfinished space.',
    ],
    quickReference: [
      { label: '1 square foot', value: '144 square inches' },
      { label: '1 square meter', value: '10.7639 sq ft' },
      { label: '1 square yard', value: '9 sq ft' },
      { label: 'Standard carpet roll width', value: '12 feet' },
      { label: 'Paint coverage (1 gal)', value: '350-400 sq ft wall' },
      { label: 'Standard waste factor', value: '10%' },
      { label: 'L-shape waste factor', value: '10-15%' },
      { label: 'Diagonal install waste', value: '+5-10% extra' },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Square Foot', url: 'https://en.wikipedia.org/wiki/Square_foot' },
      { source: 'ANSI Z765 — Square Footage Standard', url: 'https://www.nahb.org/advocacy/industry-issues/ansi-residential-square-footage-standard' },
      { source: 'Wolfram MathWorld', title: 'Area', url: 'https://mathworld.wolfram.com/Area.html' },
    ],
  },
};

export default squareFootageConfig;
