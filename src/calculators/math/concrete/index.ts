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
      placeholder: '10',
      helpText: 'Enter the length of the slab in feet',
    },
    {
      id: 'width',
      label: 'Width (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: '10',
      showWhen: (v) => v.shape !== 'hole' && v.shape !== 'column',
      helpText: 'Enter the width of the slab in feet',
    },
    {
      id: 'depth',
      label: 'Depth/Thickness (in)',
      type: 'number',
      min: 0,
      step: 0.25,
      placeholder: '4',
      helpText: 'In inches. Standard slab = 4 in, driveway = 6 in.',
    },
    {
      id: 'diameter',
      label: 'Diameter (ft)',
      type: 'number',
      min: 0,
      step: 0.1,
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
      'Ordering the right amount of concrete saves money and prevents project delays. Under-ordering means extra trips; over-ordering means wasted material. The 10% waste allowance accounts for spillage, uneven subgrades, and slight depth variations. Practical example: a 10x10 foot patio slab at 4 inches deep requires approximately 100 sq ft of area. The volume is 100 × (4/12) = 33.33 cubic feet, which equals 1.23 cubic yards. With 10% waste, you need about 1.36 cubic yards. That translates to roughly 68 60-lb bags or 52 80-lb bags. Edge case: when pouring a curved or irregularly shaped slab, increase the waste allowance to 15% since form layout and cutting introduce more uncertainty. For very thin pours (2 inches or less), consider that concrete may crack more easily and fiber mesh reinforcement might be necessary. Always verify local building codes for minimum thickness requirements — many jurisdictions require 3.5 inches minimum for residential flatwork.',
    faqs: [
      {
        question: 'How many 80lb bags do I need per cubic yard?',
        answer:
          'One cubic yard = 27 cubic feet. An 80lb bag covers approximately 0.6 cubic feet, so you need 27 / 0.6 = 45 bags per cubic yard. A 60lb bag covers about 0.45 cubic feet, so 27 / 0.45 = 60 bags per cubic yard.',
      },
      {
        question: 'What is the standard waste allowance and when should I increase it?',
        answer:
          '10% is the standard waste allowance for most projects. Increase it to 15% for complex pours with multiple obstacles, rebar-heavy footings, or when pouring in difficult terrain. For simple flatwork like a patio slab, 5% may be sufficient.',
      },
      {
        question: 'Should I use fiber mesh or rebar for concrete reinforcement?',
        answer: 'It depends on the application. Fiber mesh (microsynthetic fibers) is ideal for flatwork like sidewalks, patios, and driveways — it controls plastic shrinkage cracking and provides three-dimensional reinforcement throughout the slab. Rebar is better for structural applications like footings, foundations, and columns that bear heavy loads. Many contractors use both: rebar for structural integrity and fiber mesh for crack control. For a standard 4-inch thick driveway slab on good soil, a 6x6 inch welded wire mesh or a 1/2 inch rebar grid on 24-inch centers is common. For a patio slab that will not support vehicle loads, fiber mesh alone is usually sufficient. For any slab thicker than 5 inches, or when building on expansive clay soils, rebar reinforcement is strongly recommended. Control joints should be cut at intervals equal to 2-3 times the slab thickness in inches — for a 4-inch slab, cut joints every 8-12 feet to control where any cracking occurs.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Concrete', url: 'https://en.wikipedia.org/wiki/Concrete' },
      { source: 'Wolfram MathWorld', title: 'Volume', url: 'https://mathworld.wolfram.com/Volume.html' },
    ],
  },
};

export default concreteConfig;
