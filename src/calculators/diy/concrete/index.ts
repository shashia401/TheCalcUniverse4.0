import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import ConcretePanel from './ConcretePanel';

// ─── Constants ──────────────────────────────────────────────────────────────────

const SHAPE_LABELS: Record<string, string> = {
  slab: 'Slab/Patio',
  hole: 'Round Hole/Footing',
  column: 'Column/Cylinder',
  stairs: 'Stairs',
};

const SHAPE_FORMULAS: Record<string, string> = {
  slab: 'Volume = Length × Width × (Depth / 12)',
  hole: 'Volume = π × (Diameter/2)² × (Depth / 12)',
  column: 'Volume = π × (Diameter/2)² × (Depth / 12)',
  stairs: 'Volume ≈ Length × Width × (Riser / 12) × Steps × 0.5',
};

// ─── Calculation helpers ─────────────────────────────────────────────────────────

/** Parse a numeric value from the form. Returns NaN when missing or empty. */
function parseDim(v: string | undefined): number {
  return parseFloat(v?.trim() || '');
}

/** Parse an integer from the form. Returns NaN when missing or empty. */
function parseIntDim(v: string | undefined): number {
  return parseInt(v?.trim() || '', 10);
}

/** Validate that a dimension is a positive number. */
function isValidPositive(n: number): boolean {
  return !isNaN(n) && n > 0;
}

/**
 * Build the result array common to all shapes.
 * Wastage is expressed as a whole number percentage (0, 5, 10, 15).
 */
function buildResults(rawCubicFeet: number, wastage: number, shape: string): CalculatorResult[] {
  const cubicYards = rawCubicFeet / 27;
  const multiplier = 1 + wastage / 100;
  const totalCubicFeet = rawCubicFeet * multiplier;
  const totalCubicYards = cubicYards * multiplier;

  const bags60 = Math.ceil(totalCubicFeet / 0.45);
  const bags80 = Math.ceil(totalCubicFeet / 0.60);

  return [
    {
      id: 'cubicYards',
      label: 'Concrete Needed',
      value: `${totalCubicYards.toFixed(2)} cu yd`,
      highlight: true,
      color: 'positive',
    },
    {
      id: 'cubicFeet',
      label: 'Volume',
      value: `${totalCubicFeet.toFixed(2)} cu ft`,
    },
    {
      id: 'bags60lb',
      label: '60-lb Bags',
      value: String(bags60),
    },
    {
      id: 'bags80lb',
      label: '80-lb Bags',
      value: String(bags80),
    },
    {
      id: 'weightEstimate',
      label: 'Total Weight (80lb bags)',
      value: `${bags80 * 80} lbs`,
    },
    {
      id: 'wastageApplied',
      label: 'Waste Allowance',
      value: wastage > 0 ? `${wastage}%` : 'None (exact)',
    },
    {
      id: 'shape',
      label: 'Shape',
      value: SHAPE_LABELS[shape] || shape,
    },
    {
      id: 'formula',
      label: 'Formula',
      value: SHAPE_FORMULAS[shape] || '',
    },
  ];
}

// ─── Calculate function ──────────────────────────────────────────────────────────

function calculate(values: Record<string, string>): CalculatorResult[] {
  const shape = values.shape || 'slab';
  const wastage = parseInt(values.wastage || '0', 10) || 0;
  const depth = parseDim(values.depth);

  if (shape === 'slab') {
    const length = parseDim(values.length);
    const width = parseDim(values.width);
    if (!isValidPositive(length) || !isValidPositive(width) || !isValidPositive(depth)) {
      return [];
    }
    const cubicFeet = length * width * (depth / 12);
    return buildResults(cubicFeet, wastage, shape);
  }

  if (shape === 'hole' || shape === 'column') {
    const diameter = parseDim(values.diameter);
    if (!isValidPositive(diameter) || !isValidPositive(depth)) {
      return [];
    }
    const radius = diameter / 2;
    const cubicFeet = Math.PI * radius * radius * (depth / 12);
    return buildResults(cubicFeet, wastage, shape);
  }

  if (shape === 'stairs') {
    const stairsLength = parseDim(values.stairsLength);
    const stairsWidth = parseDim(values.stairsWidth);
    const riserHeight = parseDim(values.riserHeight);
    const numSteps = parseIntDim(values.numSteps);
    if (
      !isValidPositive(stairsLength) ||
      !isValidPositive(stairsWidth) ||
      !isValidPositive(riserHeight) ||
      !isValidPositive(numSteps)
    ) {
      return [];
    }
    // Each step is approximately half a rectangular block
    const cubicFeet = stairsLength * stairsWidth * (riserHeight / 12) * numSteps * 0.5;
    return buildResults(cubicFeet, wastage, shape);
  }

  return [];
}

// ─── Config ──────────────────────────────────────────────────────────────────────

const concreteConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'shape',
      label: 'Shape',
      type: 'select',
      options: [
        { label: 'Slab/Patio', value: 'slab' },
        { label: 'Round Hole/Footing', value: 'hole' },
        { label: 'Column/Cylinder', value: 'column' },
        { label: 'Stairs', value: 'stairs' },
      ],
      helpText: 'Select the shape of the concrete pour',
    },
    {
      id: 'length',
      label: 'Length (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
      placeholder: '10',
      showWhen: (v) => v.shape !== 'hole' && v.shape !== 'column' && v.shape !== 'stairs',
      helpText: 'Enter the length in feet. For slabs, measure the longest dimension. This is the primary dimension for rectangular forms.',
    },
    {
      id: 'width',
      label: 'Width (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
      placeholder: '10',
      showWhen: (v) => v.shape !== 'hole' && v.shape !== 'column' && v.shape !== 'stairs',
      helpText: 'Enter the width of the slab in feet',
    },
    {
      id: 'depth',
      label: 'Depth/Thickness (in)',
      type: 'number',
      min: 0,
      step: 0.25,
      inputMode: 'decimal',
      placeholder: '4',
      helpText: 'In inches. Standard slab = 4 in, driveway = 6 in.',
    },
    {
      id: 'diameter',
      label: 'Diameter (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
      placeholder: '2',
      showWhen: (v) => v.shape === 'hole' || v.shape === 'column',
      helpText: 'Enter the diameter of the round hole or column in feet',
    },
    {
      id: 'stairsLength',
      label: 'Stair Length (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
      placeholder: '10',
      showWhen: (v) => v.shape === 'stairs',
      helpText: 'Enter the total length of the staircase in feet',
    },
    {
      id: 'stairsWidth',
      label: 'Stair Width (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      inputMode: 'decimal',
      placeholder: '3',
      showWhen: (v) => v.shape === 'stairs',
      helpText: 'Enter the width of the stairs in feet',
    },
    {
      id: 'riserHeight',
      label: 'Riser Height (in)',
      type: 'number',
      min: 0,
      step: 0.25,
      inputMode: 'decimal',
      placeholder: '7',
      showWhen: (v) => v.shape === 'stairs',
      helpText: 'Enter the height of each step riser in inches',
    },
    {
      id: 'numSteps',
      label: 'Number of Steps',
      type: 'number',
      min: 1,
      step: 1,
      inputMode: 'numeric',
      placeholder: '10',
      showWhen: (v) => v.shape === 'stairs',
      helpText: 'Enter the total number of steps',
    },
    {
      id: 'wastage',
      label: 'Waste Allowance',
      type: 'select',
      options: [
        { label: 'None (exact)', value: '0' },
        { label: '5% (minimal waste)', value: '5' },
        { label: '10% (standard)', value: '10' },
        { label: '15% (complex pour)', value: '15' },
      ],
      helpText: 'Select the waste allowance percentage for the concrete',
    },
  ],

  calculate,

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ConcretePanel, { values, results });
  },

  educational: {
    formula: 'Volume = Area × Depth | Cubic Yards = Cubic Feet / 27',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="60" y="55" width="200" height="90" fill="rgba(59,130,246,0.15)" stroke="var(--svg-3b82f6)" stroke-width="2.5" rx="4"/><rect x="60" y="145" width="200" height="6" fill="var(--svg-3b82f6)" opacity="0.3"/><line x1="60" y1="55" x2="80" y2="35" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="260" y1="55" x2="280" y2="35" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="80" y1="35" x2="280" y2="35" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="280" y1="35" x2="280" y2="145" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="280" y1="145" x2="260" y2="145" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="3,2"/><line x1="80" y1="35" x2="80" y2="145" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="3,2"/><text x="160" y="110" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="28" font-weight="bold">SLAB</text><line x1="60" y1="170" x2="260" y2="170" stroke="var(--svg-ef4444)" stroke-width="1.5" marker-start="url(#arwL)" marker-end="url(#arwR)"/><text x="160" y="168" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Length (L)</text><line x1="275" y1="35" x2="275" y2="145" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="292" y="95" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="11" font-weight="bold">H</text><line x1="55" y1="55" x2="55" y2="145" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="40" y="105" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="11" font-weight="bold">W</text></svg>',
      alt: 'Concrete slab diagram with length, width, and height dimensions labeled',
      caption: 'Concrete slab dimensions: Volume = L x W x H',
    },
    formulaDescription:
      'Concrete is ordered by cubic yard. One cubic yard = 27 cubic feet. A standard 80lb bag yields ~0.6 cubic feet.',
    variables: [
      {
        symbol: 'V',
        name: 'Volume & Depth',
        description:
          'The total concrete volume needed. For slabs: V = L × W × (D/12). Depth in inches is converted to feet. For cylinders: V = πr²h.',
      },
      {
        symbol: 'yd³',
        name: 'Cubic Yards',
        description:
          'Standard concrete ordering unit. 1 cubic yard = 27 cubic feet. Most ready-mix trucks carry 8-10 cubic yards.',
      },
      {
        symbol: 'W',
        name: 'Waste Allowance',
        description:
          'A percentage added to account for spillage, uneven subgrades, and slight depth variations. Standard practice is 10%.',
      },
    ],
    howToUse: [
      'Choose your shape (slab, hole, column, or stairs).',
      'Enter dimensions in feet and inches as requested.',
      'Optionally add waste allowance (recommended: 10%).',
      'Get your concrete volume and exact bag count for Home Depot.',
      'Review the weight estimate to plan for transport and handling.',
    ],
    explanation:
      `Ordering the right amount of concrete saves money and prevents project delays. Under-ordering means extra trips; over-ordering means wasted material. Concrete has been a fundamental building material since Roman times — the Pantheon's unreinforced concrete dome, completed in 126 CE, remains the world's largest after nearly 1,900 years, demonstrating the remarkable durability of properly formulated concrete. Modern Portland cement, invented in 1824 by Joseph Aspdin in Leeds, England, revolutionized construction by providing a consistent, predictable binder that hardens through hydration (a chemical reaction with water) rather than simple drying. This was the key advancement that enabled the skyscrapers, highways, and infrastructure of the modern world. The 10% waste allowance accounts for spillage, uneven subgrades, and slight depth variations. Practical example: a 10x10 foot patio slab at 4 inches deep requires approximately 100 sq ft of area. The volume is 100 x (4/12) = 33.33 cubic feet, which equals 1.23 cubic yards. With 10% waste, you need about 1.36 cubic yards. That translates to roughly 68 60-lb bags or 52 80-lb bags. Edge case: when pouring a curved or irregularly shaped slab, increase the waste allowance to 15% since form layout and cutting introduce more uncertainty. For very thin pours (2 inches or less), consider that concrete may crack more easily and fiber mesh reinforcement might be necessary. Always verify local building codes for minimum thickness requirements — many jurisdictions require 3.5 inches minimum for residential flatwork. For posts and footings, always dig below the frost line in your region (typically 12-48 inches depending on climate zone) to prevent frost heave from lifting and cracking your concrete. When mixing bagged concrete, add water gradually — the ideal slump for most DIY projects is 3-4 inches, meaning the concrete should hold its shape when formed into a ball but still be workable enough to spread. Water that pools on the surface during finishing indicates the mix is too wet, which can weaken the final compressive strength by 20-30% compared to a properly proportioned mix.`,
    faqs: [
      {
        question: 'How many 80lb bags do I need per cubic yard?',
        answer:
          'One cubic yard = 27 cubic feet. An 80lb bag covers approximately 0.6 cubic feet, so you need 27 / 0.6 = 45 bags per cubic yard. A 60lb bag covers about 0.45 cubic feet, so 27 / 0.45 = 60 bags per cubic yard. For a typical two-car driveway needing 5 cubic yards, that is 225 80-lb bags or 300 60-lb bags — this is why ready-mix delivery is almost always the right choice for projects over 1 cubic yard.',
      },
      {
        question: 'What is the standard waste allowance and when should I increase it?',
        answer:
          '10% is the standard waste allowance for most projects. Increase it to 15% for complex pours with multiple obstacles, rebar-heavy footings, or when pouring in difficult terrain. For simple flatwork like a patio slab, 5% may be sufficient. The waste factor accounts for spillage during transport and placement, slight depth variations from uneven subgrade, and concrete that remains in the chute of the mixer or pump hose. If your subgrade is particularly uneven (rocky or sloped), bump the waste factor by an additional 5%.',
      },
      {
        question: 'Should I use fiber mesh or rebar for concrete reinforcement?',
        answer: 'It depends on the application. Fiber mesh (microsynthetic fibers) is ideal for flatwork like sidewalks, patios, and driveways — it controls plastic shrinkage cracking and provides three-dimensional reinforcement throughout the slab. Rebar is better for structural applications like footings, foundations, and columns that bear heavy loads. Many contractors use both: rebar for structural integrity and fiber mesh for crack control. For a standard 4-inch thick driveway slab on good soil, a 6x6 inch welded wire mesh or a 1/2 inch rebar grid on 24-inch centers is common. Control joints should be cut at intervals equal to 2-3 times the slab thickness in inches — for a 4-inch slab, cut joints every 8-12 feet.',
      },
      {
        question: 'How do I calculate concrete for staircases?',
        answer: 'Stairs are approximated as triangular prisms. The formula multiplies stair length by width, then by riser height (in feet), then by the number of steps, and divides by 2 because each step is approximately a triangle in cross-section. For example, a set of 10 stairs that are 3 feet wide, with 7-inch risers and a total run of 10 feet: Volume = 10 ft × 3 ft × (7/12 ft) × 10 steps × 0.5 = 8.75 cubic feet = 0.32 cubic yards. The 0.5 factor accounts for the triangular shape. For more precise estimates on complex staircases with landings, treat the landing as a separate slab calculation and add it to the stair volume.',
      },
      {
        question: 'How do I calculate concrete for round footings or columns?',
        answer: 'Round footings and columns use the cylinder volume formula: V = π × r² × h, where r is the radius (half the diameter) in feet and h is the depth in feet. For example, a 24-inch diameter footing (r = 1 ft) that is 4 feet deep: V = 3.14159 × 1² × 4 = 12.57 cubic feet = 0.47 cubic yards. With 10% waste: 0.51 cubic yards. That is about 23 80-lb bags or 31 60-lb bags. For sonotube (cardboard form) columns, the diameter is the inside diameter of the tube. Common sonotube sizes are 8, 10, 12, 18, and 24 inches. Always flare the bottom of the footing wider than the column for stability — building codes typically require the footing to be twice the column diameter and at least 6 inches thick at the base.',
      },
      {
        question: 'When is ready-mix concrete delivery worth it versus mixing from bags?',
        answer: 'Ready-mix is cost-effective for pours over 1 cubic yard (roughly 45 80-lb bags). Below 1 cubic yard, bagged concrete is practical for a DIY project. At 1-2 cubic yards, both options are viable — ready-mix costs about $130-$180 per yard plus a $150-$200 delivery fee, while bags cost $225-$315 per cubic yard equivalent but have no delivery minimum. For 2+ cubic yards, ready-mix is the clear winner on both cost and labor. A full truck carries 8-10 cubic yards. If your pour is less than 4-5 yards, you will likely pay a short-load fee of $50-$100 on top of the per-yard price. Always call at least three local ready-mix suppliers for quotes.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Backyard Patio Slab in Austin, TX',
        inputs: { shape: 'slab', length: '12', width: '10', depth: '4', wastage: '10' },
        result: '1.63 cubic yards. Approximately 74 80-lb bags or 98 60-lb bags. Ready-mix would cost roughly $210-$290 delivered.',
        insight: 'A standard 12x10 ft patio at 4 inches thick. Volume = 12 × 10 × (4/12) = 40 cubic feet. In cubic yards: 40 / 27 = 1.48 cubic yards. With 10% waste: 1.63 cubic yards. Equivalent to approximately 74 80-lb bags or 98 60-lb bags. At $5.50 per 80-lb bag, the material cost is about $407 for bagged concrete. Ready-mix would cost roughly $210-$290 delivered in the Austin area. At 1.63 cubic yards with waste, this project is right at the threshold where ready-mix starts to make sense. If you have a truck and can pick up the bags yourself, bagged concrete gives you flexibility to work at your own pace over a weekend. If convenience matters more, order 1.75 yards of ready-mix and have it done in a morning. In Austin heat, pour early in the morning (before 8 AM) to avoid rapid setting — concrete poured above 85°F can lose workability in under 30 minutes.',
      },
      {
        scenario: 'Deck Footings for a 12x16 Deck in Chicago, IL',
        inputs: { shape: 'hole', diameter: '1', depth: '4', wastage: '10' },
        result: '0.77 cubic yards with waste. Approximately 35 80-lb bags or 47 60-lb bags total for 6 footings.',
        insight: 'A typical deck requires 6 footing holes, each 12 inches in diameter and 48 inches deep (below the 42-inch frost line in Chicago). Per footing: radius = 0.5 ft, Volume = π × 0.5² × 4 = 3.14 cubic feet. Total for 6 footings: 18.85 cubic feet = 0.70 cubic yards. With 10% waste: 0.77 cubic yards. In Chicago, footings must extend below the 42-inch frost line by code. Always verify your local frost depth before digging. Use a post-hole digger or auger for holes, and consider renting a powered auger ($60-$80/day) for more than 4 holes. Place a few inches of gravel at the bottom of each hole for drainage before pouring. Use Quikrete Fast-Setting Concrete Mix for fence and deck posts — it sets in 20-40 minutes and does not require mixing, just pour it dry into the hole and add water. For structural deck footings, however, use standard concrete mix and allow 24-48 hours of curing before attaching post anchors.',
      },
    ],
    proTips: [
      'Order concrete for a morning delivery — cooler temperatures give you more working time. Concrete delivered on a hot afternoon can lose 30-60 minutes of workability. In temperatures above 85°F, use a set-retarding admixture or plan to finish the concrete within 30 minutes of placement.',
      'Build sturdy formwork with 2x4 lumber secured with stakes every 2-3 feet. Check that forms are level with a 4-foot level before pouring. Apply a release agent (diesel fuel or commercial form oil) to the inside of forms so they strip cleanly after the concrete sets. Use duplex nails so forms can be disassembled easily.',
      'Have all tools ready before the truck arrives: wheelbarrow (or concrete buggy for large pours), shovel, rake, screed board (a straight 2x4), bull float, magnesium hand float, edging tool, and groover/jointer tool. The concrete will not wait while you search for a missing trowel — you typically have 60-90 minutes from truck arrival to finish.',
      'For bagged concrete, rent a portable drum mixer ($35-$50/day) for projects requiring more than 20 bags. Hand-mixing in a wheelbarrow with a hoe is exhausting beyond about 10-12 bags and produces inconsistent results. A mixer ensures uniform water distribution and strength throughout the pour.',
      'Cure concrete properly: keep the surface moist for at least 7 days. Cover with wet burlap, plastic sheeting, or apply a curing compound. Do not let freshly poured concrete dry out in the first 24-48 hours — rapid drying causes surface cracking and reduces strength. In hot weather, mist the surface with water 2-3 times per day.',
      'Cut control joints within 24 hours of pouring, while the concrete is still green. For a 4-inch slab, cut joints every 8-12 feet and to a depth of at least 1 inch (25% of slab thickness). Joints direct cracking to predetermined locations. For sidewalks, place joints at intervals equal to the width of the walkway.',
    ],
    limitations: [
      'This calculator provides estimates for common geometric shapes. For irregular or curved shapes, break the area into rectangles and triangles, calculate each section separately, and sum the results. Complex shapes with multiple radii or organic curves will have higher waste — add an additional 5% for each complex feature.',
      'Bag estimates assume standard yields: 0.6 cubic feet per 80-lb bag and 0.45 cubic feet per 60-lb bag. Actual yield varies based on water content, mixing method, and aggregate moisture. Overwatering to improve workability reduces yield per bag and weakens the concrete. Always follow the water-to-mix ratio printed on the bag.',
      'The calculator does not account for reinforcement (rebar or mesh), formwork lumber costs, subbase gravel, vapor barriers, or labor. These additional costs typically represent 40-60% of the total project cost beyond the concrete material itself. For a budget estimate, multiply the concrete cost by 2.5-3x for the all-in project cost.',
      'Stair calculations use an approximation (triangular prism model with 0.5 factor). For staircases with landings, curved steps, or irregular riser heights, this estimate should be treated as an approximation. Calculate landings separately as slabs and add them to the stair volume.',
    ],
    quickReference: [
      { label: '1 cubic yard', value: '27 cubic feet' },
      { label: '80-lb bag yield', value: '~0.6 cu ft' },
      { label: '60-lb bag yield', value: '~0.45 cu ft' },
      { label: 'Bags per cu yd (80 lb)', value: '45 bags' },
      { label: 'Bags per cu yd (60 lb)', value: '60 bags' },
      { label: 'Std slab thickness', value: '4 inches' },
      { label: 'Driveway thickness', value: '4-6 inches' },
      { label: 'Ready-mix cost/yard', value: '$130-$180' },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Concrete', url: 'https://en.wikipedia.org/wiki/Concrete' },
      { source: 'Portland Cement Association', url: 'https://www.cement.org/' },
      { source: 'American Concrete Institute', url: 'https://www.concrete.org/' },
      { source: 'Wolfram MathWorld', title: 'Volume', url: 'https://mathworld.wolfram.com/Volume.html' },
    ],
  },
};

export default concreteConfig;
