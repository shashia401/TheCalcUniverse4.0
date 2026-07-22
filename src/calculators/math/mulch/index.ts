import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import MulchPanel from './MulchPanel';

const mulchConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'length',
      label: 'Garden Bed Length (ft)',
      type: 'number',
      placeholder: '20',
      min: 0.1,
      step: 0.5,
      required: true,
    },
    {
      id: 'width',
      label: 'Garden Bed Width (ft)',
      type: 'number',
      placeholder: '10',
      min: 0.1,
      step: 0.5,
      required: true,
    },
    {
      id: 'depth',
      label: 'Mulch Depth',
      type: 'select',
      options: [
        { label: '1 inch (light top-dress)', value: '1' },
        { label: '2 inches (standard)', value: '2' },
        { label: '3 inches (deep)', value: '3' },
        { label: '4 inches (heavy)', value: '4' },
      ],
      required: true,
    },
    {
      id: 'shape',
      label: 'Bed Shape',
      type: 'select',
      options: [
        { label: 'Rectangle/Square', value: 'rect' },
        { label: 'Circle', value: 'circle' },
      ],
      required: true,
    },
    {
      id: 'pricePerBag2',
      label: 'Price per 2 cu ft Bag ($)',
      type: 'number',
      placeholder: '4.50',
      min: 0,
      step: 0.01,
      helpText: 'Optional',
    },
    {
      id: 'pricePerBulkYard',
      label: 'Price per Bulk Cubic Yard ($)',
      type: 'number',
      placeholder: '35',
      min: 0,
      step: 0.01,
      helpText: 'Optional',
    },
  ],
  calculate: (values) => {
    const length = parseFloat(values.length);
    const width = parseFloat(values.width);
    const depthIn = parseFloat(values.depth || '2');
    const shape = values.shape || 'rect';
    const pBag2 = parseFloat(values.pricePerBag2);
    const pBulk = parseFloat(values.pricePerBulkYard);

    if ([length, width, depthIn].some(isNaN) || length <= 0 || width <= 0 || depthIn <= 0) return [];

    let area: number;
    if (shape === 'circle') {
      const radius = length / 2;
      area = Math.PI * radius * radius;
    } else {
      area = length * width;
    }

    const cubicYards = (area * depthIn) / 324;
    const cubicFeet = cubicYards * 27;

    const bags2ft = Math.ceil(cubicFeet / 2);
    const bags3ft = Math.ceil(cubicFeet / 3);
    const bulkScoops = Math.ceil(cubicYards);

    const fmt = (n: number) => parseFloat(n.toFixed(2)).toString();
    const fmtSqft = (n: number) => parseFloat(n.toFixed(1)).toString();

    const results = [
      {
        id: 'cubicYards',
        label: 'Mulch Needed',
        value: `${fmt(cubicYards)} cu yd`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'cubicFeet',
        label: 'Total Cubic Feet',
        value: `${fmt(cubicFeet)} cu ft`,
        color: 'neutral' as const,
      },
      {
        id: 'bags2ft',
        label: '2 cu ft Bags Needed',
        value: `${bags2ft} bags`,
        color: 'neutral' as const,
      },
      {
        id: 'bags3ft',
        label: '3 cu ft Bags Needed',
        value: `${bags3ft} bags`,
        color: 'neutral' as const,
      },
      {
        id: 'bulkScoops',
        label: 'Bulk Scoops (1 yd each)',
        value: `${bulkScoops} scoop${bulkScoops !== 1 ? 's' : ''}`,
        color: 'neutral' as const,
      },
      {
        id: 'costBags',
        label: 'Cost: 2 cu ft Bags',
        value: !isNaN(pBag2) && pBag2 > 0 ? `$${(bags2ft * pBag2).toFixed(2)}` : 'Enter price per bag',
        color: 'neutral' as const,
      },
      {
        id: 'costBulk',
        label: 'Cost: Bulk Delivery',
        value: !isNaN(pBulk) && pBulk > 0 ? `$${(bulkScoops * pBulk).toFixed(2)}` : 'Enter bulk price',
        color: 'neutral' as const,
      },
      {
        id: 'coverageArea',
        label: 'Coverage Area',
        value: `${fmtSqft(area)} sq ft`,
        color: 'neutral' as const,
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MulchPanel, { values, results });
  },
  educational: {
    formula: 'Cubic Yards = (L x W x DepthIn) / 324 | Circle: A = pi x (D/2)^2',
    formulaDescription:
      'Mulch volume is calculated from the bed area and desired depth. One cubic yard covers approximately 162 sq ft at 2 inches deep.',
    variables: [
      { symbol: '324', name: 'Conversion Constant', description: '324 = 27 (cu ft per cu yd) x 12 (inches per ft). Converts area x depth to cubic yards.' },
      { symbol: 'Cu Yd', name: 'Cubic Yard', description: 'Standard unit for bulk mulch. 1 scoop from a landscape truck = approx 1 cubic yard.' },
    ],
    howToUse: [
      'Enter the garden bed length and width in feet.',
      'Select desired mulch depth (2 inches is standard).',
      'Choose bed shape (rectangle or circle).',
      'Optionally enter prices to compare bagged vs. bulk cost.',
    ],
    explanation:
      'Mulch is typically applied at 2-3 inches for weed suppression and moisture retention. One cubic yard of mulch covers ~162 sq ft at 2 inches deep. For larger areas, bulk delivery is significantly cheaper than bagged. A standard pickup truck can hold about 1-2 cubic yards. Practical example: a rectangular garden bed measuring 20 feet by 10 feet at 3 inches deep needs 200 sq ft of coverage. Using the formula: (200 × 3) / 324 = 1.85 cubic yards. You would need approximately 25 bags of 2-cubic-foot mulch or order 2 cubic yards in bulk. Bulk delivery at $35 per yard costs $70, while bagged at $4.50 per bag costs $112.50 — a clear savings for larger areas. Edge cases: for circular beds, measure the diameter at the widest point but remember that the actual planted area may be less if there are large shrubs or trees in the middle. For sloped beds, slightly deeper mulch helps prevent erosion runoff. Avoid piling mulch against tree trunks (volcano mulching) as it causes bark rot and insect infestation. Gravel or rubber mulch requires different depth calculations — rubber mulch is often applied at just 1-2 inches since it does not decompose.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><defs><marker id="ab" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-3b82f6)"/></marker></defs><rect x="40" y="130" width="240" height="50" fill="var(--svg-92400e)" rx="3"/><rect x="40" y="100" width="240" height="30" fill="var(--svg-78350f)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="3"/><text x="160" y="120" text-anchor="middle" fill="var(--svg-ffffff)" font-size="12" font-weight="bold">Mulch Layer (2&ndash;3 in)</text><text x="160" y="157" text-anchor="middle" fill="var(--svg-fef3c7)" font-size="11">Soil</text><line x1="40" y1="90" x2="280" y2="90" stroke="var(--svg-3b82f6)" stroke-width="1.5" marker-start="url(#ab)" marker-end="url(#ab)"/><text x="160" y="84" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="13" font-weight="bold">Garden Bed Width</text><line x1="290" y1="100" x2="290" y2="130" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="300" y="118" text-anchor="start" fill="var(--svg-ef4444)" font-size="11" font-weight="bold">D</text><rect x="30" y="165" width="260" height="20" fill="var(--svg-d1d5db)" rx="3"/><text x="160" y="178" text-anchor="middle" fill="var(--svg-1e40af)" font-size="10">Cubic Yards = (L &amp;times; W &amp;times; Depth_in) &amp;divide; 324</text></svg>',
      alt: 'Cross-section of garden bed showing mulch layer on top of soil',
      caption: 'Mulch is applied in a layer 2-3 inches deep on top of garden soil for weed suppression and moisture retention.',
    },
    faqs: [
      {
        question: 'Should I buy bagged or bulk mulch?',
        answer: 'For areas needing 2+ cubic yards, bulk delivery is usually cheaper per yard. For small projects under 2 yards, bagged mulch from a home center is more practical. Bagged mulch is also easier to transport.',
      },
      {
        question: 'How deep should I apply mulch?',
        answer: '2-3 inches is ideal. 1 inch is too thin for weed suppression. More than 4 inches can suffocate plant roots and promote rot. Keep mulch a few inches away from plant stems and tree trunks.',
      },
      {
        question: 'How do I calculate mulch for irregularly shaped beds?',
        answer: 'For irregular beds, divide the bed into simple shapes (rectangles, triangles, circles), calculate each area, and sum them. For kidney-shaped or free-form beds, use the average width method: measure the length at the longest point and the width at several points, average the widths, then multiply length × average width. This gives a reasonable approximation. For beds with large trees or shrubs in the middle, subtract the area occupied by the trunk or root ball. For mulching around a tree with a 6-inch trunk diameter, subtract about 0.2 sq ft or simply measure the bed as the outer perimeter area. For very large beds (over 500 sq ft), consider using a landscape fabric underneath the mulch to improve weed suppression and reduce the frequency of mulch replenishment.',
      },
    ],
    citations: [
      { source: 'ASTM D5730 - Standard Guide for Site Characterization for Environmental Purposes', url: 'https://www.astm.org/d5730-02.html' },
      { source: 'Wikipedia - Mulch', url: 'https://en.wikipedia.org/wiki/Mulch' },
    ],
  },
};

export default mulchConfig;
