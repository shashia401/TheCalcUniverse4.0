import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import GravelPanel from './GravelPanel';

const MATERIAL_DENSITIES: Record<string, number> = {
  'pea-gravel': 2700,
  'crushed-limestone': 2600,
  'river-rock': 2800,
  'decomposed-granite': 2650,
};

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'length',
      label: 'Length (ft)',
      type: 'number',
      placeholder: 'Enter length in feet',
      required: true,
      helpText: 'Enter the length of the area in feet',
    },
    {
      id: 'width',
      label: 'Width (ft)',
      type: 'number',
      placeholder: 'Enter width in feet',
      required: true,
      helpText: 'Enter the width of the area in feet',
    },
    {
      id: 'depth',
      label: 'Depth (inches)',
      type: 'select',
      required: true,
      options: [
        { value: '2', label: '2 inches' },
        { value: '3', label: '3 inches' },
        { value: '4', label: '4 inches' },
        { value: '6', label: '6 inches' },
        { value: '12', label: '12 inches' },
      ],
      helpText: 'Select the desired depth of gravel coverage',
    },
    {
      id: 'material',
      label: 'Material Type',
      type: 'select',
      required: true,
      options: [
        { value: 'pea-gravel', label: 'Pea Gravel' },
        { value: 'crushed-limestone', label: 'Crushed Limestone' },
        { value: 'river-rock', label: 'River Rock' },
        { value: 'decomposed-granite', label: 'Decomposed Granite' },
      ],
      helpText: 'Select the type of gravel or stone material',
    },
    {
      id: 'pricePerYard',
      label: 'Price per Cubic Yard ($)',
      type: 'number',
      placeholder: 'Optional',
      helpText: 'Enter price per cubic yard for cost estimation',
    },
    {
      id: 'pricePerTon',
      label: 'Price per Ton ($)',
      type: 'number',
      placeholder: 'Optional',
      helpText: 'Enter price per ton for cost estimation',
    },
  ],

  calculate: (values: Record<string, string>): CalculatorResult[] => {
    if (!values.length || !values.width || !values.depth || !values.material) {
      return [];
    }

    const length = parseFloat(values.length);
    const width = parseFloat(values.width);
    const depth = parseFloat(values.depth);

    if (isNaN(length) || isNaN(width) || isNaN(depth)) {
      return [];
    }

    if (length <= 0 || width <= 0 || depth <= 0) {
      return [];
    }

    const density = MATERIAL_DENSITIES[values.material];
    if (!density) {
      return [];
    }

    const cubicYards = (length * width * depth) / 324;
    const tons = (cubicYards * density) / 2000;
    const weedBarrierSqFt = length * width;

    const fmt2 = (n: number) => n.toFixed(2);
    const fmt0 = (n: number) => Math.round(n).toLocaleString();

    const results: CalculatorResult[] = [
      {
        id: 'cubic-yards',
        label: 'Volume',
        value: `${fmt2(cubicYards)} cubic yards`,
        color: 'neutral',
      },
      {
        id: 'tons',
        label: 'Weight',
        value: `${fmt2(tons)} tons`,
        color: 'neutral',
      },
      {
        id: 'weed-barrier',
        label: 'Weed Barrier Fabric Needed',
        value: `${fmt0(weedBarrierSqFt)} sq ft`,
        color: 'neutral',
      },
    ];

    const pricePerYard = values.pricePerYard ? parseFloat(values.pricePerYard) : undefined;
    const pricePerTon = values.pricePerTon ? parseFloat(values.pricePerTon) : undefined;

    if (
      pricePerYard !== undefined &&
      !isNaN(pricePerYard) &&
      pricePerYard > 0
    ) {
      results.push({
        id: 'cost-per-yard',
        label: 'Estimated Cost (per yard)',
        value: `$${fmt2(cubicYards * pricePerYard)}`,
        color: 'positive',
      });
    }

    if (
      pricePerTon !== undefined &&
      !isNaN(pricePerTon) &&
      pricePerTon > 0
    ) {
      results.push({
        id: 'cost-per-ton',
        label: 'Estimated Cost (per ton)',
        value: `$${fmt2(tons * pricePerTon)}`,
        color: 'positive',
      });
    }

    return results;
  },

  educational: {
    formula: 'Cubic Yards = (L × W × Depth_in) / 324 | Tons = Cubic Yards × Density / 2000',
    formulaDescription:
      'Calculate the volume in cubic feet (length × width × depth in feet), then convert to cubic yards (divide by 27). Multiply by material density to get weight in tons. Different materials have different densities: pea gravel ~2,700 lbs/yd³, crushed limestone ~2,600 lbs/yd³, river rock ~2,800 lbs/yd³.',
    variables: [
      {
        symbol: 'Cubic Yards',
        name: 'Volume',
        description: 'Total volume of gravel needed, measured in cubic yards. One cubic yard covers about 100 sq ft at 3" deep.',
      },
      {
        symbol: 'Tons',
        name: 'Weight',
        description: 'Estimated weight of the gravel based on material density. Used for ordering and delivery planning.',
      },
      {
        symbol: 'Density',
        name: 'Material Density',
        description: 'Weight per cubic yard of the selected material. Varies by gravel type and affects total tonnage.',
      },
    ],
    howToUse: [
      'Measure the length and width of the area you need to cover in feet',
      'Select the desired gravel depth from the dropdown (2" to 12")',
      'Choose your material type — different gravels have different densities',
      'Optionally enter price per cubic yard and/or per ton for cost estimates',
      'Review the results: total cubic yards, weight in tons, weed barrier fabric needed, and estimated cost',
    ],
    explanation:
      'Gravel and crushed stone are measured by volume (cubic yards) but sold by weight (tons) because different materials have different densities. One cubic yard of pea gravel weighs about 1.35 tons, while the same volume of river rock weighs about 1.4 tons. This calculator converts between volume and weight automatically so you can compare prices accurately. Practical example: a 10x20 foot driveway with 4 inches of crushed limestone. Volume = (10 × 20 × 4) / 324 = 2.47 cubic yards. Weight = 2.47 × 2,600 / 2,000 = 3.21 tons. You would need about 3.25 tons (round up for delivery minimums). Edge cases: for decomposed granite, compaction reduces volume by about 25-30%, so order extra material or plan for recompaction. For deep fills over 12 inches, consider layering with larger base rock first and compacting between layers. For French drains, specific gravel sizes (typically 3/4 to 1.5 inch washed gravel) are required — fines and dust can clog the drainage pipe perforations. Delivery trucks typically have a minimum order of 1-2 cubic yards, so for small projects, bagged gravel from a home center may be more practical despite the higher per-unit cost.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><defs><marker id="ab" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-3b82f6)"/></marker><marker id="ar" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-ef4444)"/></marker></defs><rect x="60" y="40" width="200" height="110" fill="var(--svg-fef3c7)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="4"/><circle cx="100" cy="75" r="5" fill="var(--svg-d97706)" opacity=".4"/><circle cx="145" cy="65" r="4" fill="var(--svg-d97706)" opacity=".3"/><circle cx="185" cy="90" r="6" fill="var(--svg-d97706)" opacity=".4"/><circle cx="110" cy="115" r="4" fill="var(--svg-d97706)" opacity=".3"/><circle cx="165" cy="125" r="5" fill="var(--svg-d97706)" opacity=".4"/><circle cx="215" cy="105" r="4" fill="var(--svg-d97706)" opacity=".3"/><circle cx="225" cy="70" r="5" fill="var(--svg-d97706)" opacity=".4"/><circle cx="85" cy="95" r="3" fill="var(--svg-d97706)" opacity=".3"/><line x1="60" y1="30" x2="260" y2="30" stroke="var(--svg-3b82f6)" stroke-width="1.5" marker-start="url(#ab)" marker-end="url(#ab)"/><text x="160" y="23" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="14" font-weight="bold">Length (ft)</text><line x1="270" y1="40" x2="270" y2="150" stroke="var(--svg-ef4444)" stroke-width="1.5" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="278" y="99" text-anchor="start" fill="var(--svg-ef4444)" font-size="14" font-weight="bold">Width</text><rect x="30" y="158" width="130" height="18" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="95" y="170" text-anchor="middle" fill="var(--svg-1e40af)" font-size="11" font-weight="bold">Depth (inches)</text><text x="160" y="196" text-anchor="middle" fill="var(--svg-4b5563)" font-size="10">Volume = L &amp;times; W &amp;times; D</text></svg>',
      alt: 'Rectangular gravel area with length and width dimensions and depth indicator',
      caption: 'Gravel volume is calculated from length, width, and depth of the area to be covered.',
    },
    faqs: [
      {
        question: 'How many square feet does a cubic yard of gravel cover?',
        answer: 'One cubic yard covers approximately 100 square feet at 3 inches deep, 162 square feet at 2 inches deep, or 54 square feet at 6 inches deep. Use the calculator to get an exact figure for your project.',
      },
      {
        question: 'What is the best gravel depth for a walkway?',
        answer: 'For pedestrian walkways, 2–3 inches of gravel is typically sufficient. For driveways, 4–6 inches is recommended to handle vehicle weight. Decorative pathways can use 1–2 inches for a lighter look.',
      },
      {
        question: 'Should I use crushed limestone or pea gravel for my driveway?',
        answer: 'Crushed limestone is the better choice for driveways because the angular edges of the crushed stone interlock, creating a stable, compacted surface that resists shifting under vehicle traffic. Pea gravel has smooth, rounded edges that shift and scatter easily — it is better suited for walkways, playgrounds, and decorative borders where vehicle traffic is not expected. For a driveway base, use 3-4 inches of crushed limestone (typically #57 or #67 stone), which compacts to about 2.5-3.5 inches. For the top course, a smaller crushed stone like #8 or #89 limestone can be used for a smoother surface. For drainage applications like French drains, use washed 3/4-inch gravel (not crushed limestone) because the fines in crushed stone can clog the perforated drain pipe. For decorative pathways, river rock provides an attractive, smooth surface but is difficult to walk on and should be limited to low-traffic areas or used as a border material. Decomposed granite creates a firm, natural-looking surface that compacts well for pathways but requires edging to prevent spreading.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Gravel', url: 'https://en.wikipedia.org/wiki/Gravel' },
      { source: 'Wolfram MathWorld', title: 'Volume', url: 'https://mathworld.wolfram.com/Volume.html' },
    ],
  },

  extraPanel: (
    values: Record<string, string>,
    results: CalculatorResult[],
  ) => createElement(GravelPanel, { values, results }),
};

export default config;
