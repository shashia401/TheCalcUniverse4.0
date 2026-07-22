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
      inputMode: 'decimal',
      helpText: 'Enter the length of your garden bed in feet. Use the longest dimension for circular beds (this becomes the diameter).',
    },
    {
      id: 'width',
      label: 'Garden Bed Width (ft)',
      type: 'number',
      placeholder: '10',
      min: 0.1,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the width of your garden bed in feet. For irregular beds, use the average width.',
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
      helpText: 'Select the desired mulch depth. 2 inches is standard for weed suppression and moisture retention.',
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
      helpText: 'Choose between rectangular/square or circular garden bed shape.',
    },
    {
      id: 'pricePerBag2',
      label: 'Price per 2 cu ft Bag ($)',
      type: 'number',
      placeholder: '4.50',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Optional: enter the price per bag at your local store for cost comparison.',
    },
    {
      id: 'pricePerBulkYard',
      label: 'Price per Bulk Cubic Yard ($)',
      type: 'number',
      placeholder: '35',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Optional: enter the bulk delivery price per cubic yard from your local supplier.',
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

    // Determine savings recommendation
    let savingsNote = '';
    if (!isNaN(pBag2) && !isNaN(pBulk) && pBag2 > 0 && pBulk > 0) {
      const bagCost = bags2ft * pBag2;
      const bulkCost = bulkScoops * pBulk;
      if (bagCost < bulkCost) {
        savingsNote = `Bagged is cheaper by $${(bulkCost - bagCost).toFixed(2)}`;
      } else if (bulkCost < bagCost) {
        savingsNote = `Bulk delivery saves $${(bagCost - bulkCost).toFixed(2)}`;
      } else {
        savingsNote = 'Costs are roughly equal';
      }
    }

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
      {
        id: 'savingsNote',
        label: 'Savings Comparison',
        value: savingsNote || 'Enter both prices to compare',
        color: savingsNote.includes('saves') ? 'positive' as const : 'neutral' as const,
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
      'Mulch volume is calculated by multiplying the bed area by the desired depth, then converting to cubic yards using the constant 324. This constant combines two unit conversions: 27 cubic feet per cubic yard and 12 inches per foot (27 x 12 = 324). For rectangular beds, area = length x width. For circular beds, area = pi x (diameter / 2)^2. One cubic yard of mulch covers approximately 162 square feet at 2 inches deep, or 108 square feet at 3 inches deep. The formula handles both metric-style measurement precision and the practical reality that mulch depth is measured in inches while area is in feet.',
    variables: [
      { symbol: '324', name: 'Conversion Constant', description: '324 = 27 (cu ft per cu yd) x 12 (inches per ft). Converts area (sq ft) times depth (inches) directly to cubic yards in one step.' },
      { symbol: 'Cu Yd', name: 'Cubic Yard', description: 'The standard unit for bulk mulch orders. One cubic yard is a cube 3 ft x 3 ft x 3 ft (27 cubic feet). A standard pickup truck bed holds 1-2 cubic yards.' },
      { symbol: 'Cu Ft', name: 'Cubic Foot', description: 'Bagged mulch is sold by the cubic foot. A typical bag contains 2 cubic feet. There are 27 cubic feet in one cubic yard.' },
    ],
    howToUse: [
      'Enter the garden bed length and width in feet — measure at the longest and widest points.',
      'Select desired mulch depth from the dropdown (2 inches is the standard recommendation).',
      'Choose your bed shape — rectangle/square for most beds, or circle for round beds and tree rings.',
      'Optionally enter bag and bulk pricing to see a side-by-side cost comparison.',
      'Review the results: total cubic yards, bag counts, bulk scoops, and cost comparison.',
    ],
    explanation:
      'Mulch is a protective layer of material applied to the surface of soil. Its primary functions are to conserve soil moisture, improve soil fertility and health, reduce weed growth, and enhance the visual appeal of garden beds. The word "mulch" comes from the Middle English word "molsh," meaning soft or moist — a fitting origin for a material that keeps soil soft and moist beneath its surface.\n\nMulch is typically applied at a depth of 2-3 inches for effective weed suppression and moisture retention. One cubic yard of mulch covers approximately 162 sq ft at 2 inches deep, or 108 sq ft at 3 inches deep. For larger areas (over 2 cubic yards), bulk delivery from a landscape supply company is significantly cheaper per cubic yard than bagged mulch from a home improvement store. A standard full-size pickup truck can hold about 1-2 cubic yards of mulch safely.\n\nPractical example: a rectangular garden bed measuring 20 feet by 10 feet (200 sq ft) at 3 inches deep requires (200 x 3) / 324 = 1.85 cubic yards of mulch. You would need approximately 25 bags of 2-cubic-foot mulch or order 2 cubic yards in bulk. Bulk delivery at $35 per yard costs $70, while bagged mulch at $4.50 per bag costs $112.50 — a savings of $42.50 with bulk delivery for this medium-sized bed.\n\nEdge cases: for circular beds around trees, measure the diameter at the widest point but subtract the area occupied by the tree trunk. For sloped beds, use a depth on the higher end (3-4 inches) to prevent erosion runoff. For irregularly shaped beds, divide the bed into simple geometric shapes, calculate each area separately, and sum them. Avoid "volcano mulching" — piling mulch against tree trunks — as this traps moisture against the bark, causing rot, fungal disease, and insect infestation. Rubber mulch and gravel require different depth calculations: rubber mulch is often applied at just 1-2 inches since it does not decompose, while gravel for driveways needs 4-6 inches for load-bearing capacity.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><defs><marker id="ab" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-3b82f6)"/></marker></defs><rect x="40" y="130" width="240" height="50" fill="var(--svg-92400e)" rx="3"/><rect x="40" y="100" width="240" height="30" fill="var(--svg-78350f)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="3"/><text x="160" y="120" text-anchor="middle" fill="var(--svg-ffffff)" font-size="12" font-weight="bold">Mulch Layer (2&ndash;3 in)</text><text x="160" y="157" text-anchor="middle" fill="var(--svg-fef3c7)" font-size="11">Soil</text><line x1="40" y1="90" x2="280" y2="90" stroke="var(--svg-3b82f6)" stroke-width="1.5" marker-start="url(#ab)" marker-end="url(#ab)"/><text x="160" y="84" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="13" font-weight="bold">Garden Bed Width</text><line x1="290" y1="100" x2="290" y2="130" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="300" y="118" text-anchor="start" fill="var(--svg-ef4444)" font-size="11" font-weight="bold">D</text><rect x="30" y="165" width="260" height="20" fill="var(--svg-d1d5db)" rx="3"/><text x="160" y="178" text-anchor="middle" fill="var(--svg-1e40af)" font-size="10">Cubic Yards = (L &amp;times; W &amp;times; Depth_in) &amp;divide; 324</text></svg>',
      alt: 'Cross-section of garden bed showing mulch layer on top of soil with width and depth dimensions labeled',
      caption: 'Mulch is applied in a layer 2-3 inches deep on top of garden soil for weed suppression and moisture retention.',
    },
    quickReference: [
      { label: '1 cubic yard at 2" depth', value: '162 sq ft coverage' },
      { label: '1 cubic yard at 3" depth', value: '108 sq ft coverage' },
      { label: '1 cubic yard at 4" depth', value: '81 sq ft coverage' },
      { label: 'Standard bag size', value: '2 cubic feet' },
      { label: 'Bags per cubic yard', value: '13.5 bags (2 cu ft)' },
      { label: 'Pickup truck capacity', value: '1-2 cubic yards' },
      { label: 'Ideal mulch depth', value: '2-3 inches' },
      { label: 'Minimum bulk order', value: '~1-2 cubic yards' },
    ],
    faqs: [
      {
        question: 'Should I buy bagged or bulk mulch?',
        answer: 'For areas needing 2 or more cubic yards, bulk delivery is usually cheaper per cubic yard. For small projects under 2 cubic yards, bagged mulch from a home improvement store is more practical — it is easier to transport in a regular car and you avoid delivery fees. Bagged mulch is also cleaner to handle and can be stored if you overbuy. Bulk mulch may contain more debris and requires a truck or trailer for pickup. When comparing prices, remember that bagged mulch is sold by the cubic foot (typically 2 cu ft per bag) while bulk mulch is sold by the cubic yard (27 cu ft). There are 13.5 bags (2 cu ft) in one cubic yard.',
      },
      {
        question: 'How deep should I apply mulch?',
        answer: '2-3 inches is ideal for most garden applications. One inch is too thin for effective weed suppression and will need replenishing within weeks. More than 4 inches can suffocate plant roots, prevent water penetration, and promote fungal rot. Keep mulch pulled back 2-3 inches from plant stems and tree trunks to prevent bark rot and rodent damage. For the first application on bare soil, 3 inches is recommended; for refreshing existing mulch, 1-2 inches on top of the remaining old layer is sufficient (but remove excess if the total depth would exceed 4 inches).',
      },
      {
        question: 'How do I calculate mulch for irregularly shaped beds?',
        answer: 'For irregular beds, divide the bed into simple geometric shapes (rectangles, triangles, circles), calculate each area separately, and sum them. For kidney-shaped or free-form beds, use the average width method: measure the length at the longest point and the width at several equally spaced points, average the widths, then multiply length x average width. For beds with large trees or shrubs, subtract the area occupied by trunks and root balls. For mulching around a tree, measure the diameter of the mulched area (not the trunk) and use the circle formula. For very large beds over 500 sq ft, consider landscape fabric underneath the mulch to improve weed suppression and extend the time between mulch refreshes.',
      },
      {
        question: 'What type of mulch is best for my garden?',
        answer: 'The best mulch type depends on your garden goals. Organic mulches like shredded hardwood bark, pine straw, and cocoa hulls decompose over time, enriching the soil with organic matter — ideal for flower beds and vegetable gardens. Cedar and cypress mulch are naturally insect-repellent and long-lasting, making them good for ornamental beds but less ideal for vegetable gardens where decomposition is beneficial. Stone, gravel, or rubber mulch are inorganic options that do not decompose, suitable for pathways, driveways, or decorative areas with zero maintenance. Rubber mulch is popular for playgrounds because it provides impact absorption. Dyed mulches (red, black, brown) maintain their color for one to two seasons. Avoid fresh wood chips or sawdust directly on garden beds — they temporarily deplete soil nitrogen during decomposition. Aged or composted wood products are safer for plant health.',
      },
      {
        question: 'When is the best time to apply mulch?',
        answer: 'The ideal times are mid-spring (after soil has warmed above 50 degrees Fahrenheit) and early fall (after the first hard frost). In spring, wait until soil temperature reaches about 50 degrees Fahrenheit (10 degrees Celsius) — applying too early delays soil warming and slows plant growth. Apply a fresh 2-inch layer on top of old mulch, but remove excess buildup if total depth exceeds 4 inches. In fall, mulch after the first hard frost to insulate roots and prevent frost heave. For vegetable gardens, straw or shredded leaves make excellent winter mulch that can be tilled into the soil in spring as green manure. Avoid applying mulch during rainy periods as soggy mulch can promote fungal growth and root rot.',
      },
      {
        question: 'What is volcano mulching and why is it harmful?',
        answer: 'Volcano mulching is the practice of piling mulch in a cone shape directly against a tree trunk, resembling a volcano. This is one of the most common and damaging landscaping mistakes. The piled mulch traps moisture against the bark, leading to trunk rot, fungal cankers, and decay. It also encourages shallow root growth into the mulch rather than deep into the soil, making the tree less stable and more drought-vulnerable. Rodents and insects are attracted to the warm, moist environment and may girdle the trunk. The correct method is "donut mulching" — spread mulch in a flat ring 2-3 inches deep starting 3-6 inches away from the trunk and extending out to the drip line. The mulch ring should look like a donut with the tree trunk in the hole.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Maria in Portland has a 25 ft x 8 ft flower bed along her fence line and wants to apply 3 inches of cedar mulch. She found bagged cedar mulch at $5.97 per 2 cu ft bag and a bulk supplier at $42 per cubic yard. Which is cheaper for her project?',
        inputs: { length: '25', width: '8', depth: '3', shape: 'rect', pricePerBag2: '5.97', pricePerBulkYard: '42' },
        result: '1.85 cubic yards needed. Bagged: 25 bags at $5.97 = $149.25. Bulk: 2 yards at $42 = $84.00. Bulk delivery saves $65.25.',
        insight: 'Maria saves 44% by ordering bulk delivery despite needing only 1.85 yards. Many suppliers have a 1-2 yard minimum and charge a delivery fee ($30-50), so she should call to confirm the total delivered price. Even with a $40 delivery fee, bulk ($124) still beats bagged ($149).',
      },
      {
        scenario: 'James in Austin needs to mulch around a 15 ft diameter circular tree ring at 2 inches deep. He only has a sedan and cannot transport bulk. How many bags should he buy?',
        inputs: { length: '15', width: '15', depth: '2', shape: 'circle' },
        result: 'Area = 176.7 sq ft. Mulch needed = 1.09 cubic yards (29.5 cubic feet). Bags needed: 15 bags (2 cu ft) or 10 bags (3 cu ft).',
        insight: 'James needs 15 bags of 2-cu-ft mulch. He should buy 16-17 bags to account for settling and uneven ground. Since he has a sedan, two trips or having it delivered might be necessary. A 15-ft tree ring is a substantial mulching project — landscape fabric underneath would reduce future maintenance.',
      },
    ],
    proTips: [
      'Use landscape fabric for large beds — For beds over 500 sq ft, lay commercial-grade landscape fabric before mulching. This extends mulch life by 1-2 years and reduces weed pressure significantly. Overlap fabric seams by 6 inches and secure with landscape staples every 3 feet.',
      'Refresh, do not replace — When refreshing existing mulch, only remove the top crusted layer. The decomposed lower layer has already become valuable organic matter. Simply fluff the old mulch with a rake and add 1-2 inches of fresh material on top.',
      'Match mulch to plants — Acid-loving plants (azaleas, rhododendrons, blueberries) benefit from pine bark or pine straw mulch, which acidifies soil as it decomposes. Vegetables and annual flowers prefer compost-like mulches that add nutrients. Avoid dyed mulches in vegetable gardens.',
      'Calculate for delivery logistics — Standard bulk delivery trucks carry 5-15 cubic yards. If your project needs only 1-2 yards, ask if the supplier offers a "small load" delivery or split a delivery with a neighbor. A standard wheelbarrow holds about 2-3 cubic feet (7-11 trips per cubic yard).',
      'Consider mulch color fading — Dyed mulches (red, black, brown) typically maintain their color for one season, then fade to a grayish tone. Natural undyed hardwood mulch weathers to a silvery gray within 3-6 months. If color consistency matters, budget for annual reapplication of dyed mulch in visible front-yard beds.',
    ],
    limitations: [
      'This calculator assumes flat, uniform beds. For sloped terrain, order 10-20% more mulch to account for runoff and deeper application on the slope face. Steep slopes over 30 degrees may require erosion control blankets in addition to mulch.',
      'Mulch settling occurs naturally over time. A 3-inch initial application will settle to approximately 2.5 inches within a few weeks as the material compacts under its own weight and rainfall. Consider ordering 5-10% extra for this settling effect.',
      'Bag sizes vary by brand and region. While 2 cubic feet is the most common bag size, some brands sell 1.5 cu ft or 3 cu ft bags. Always verify the bag volume printed on the packaging — the label saying "covers 12 sq ft at 2 inches" is a coverage claim, not a volume guarantee.',
      'This tool is for residential landscaping estimates only. Commercial landscaping projects with complex grading, drainage requirements, or engineered soil specifications should be designed by a licensed landscape architect. When not to use: for playground safety surfaces (engineered wood fiber has specific ASTM depth requirements), for erosion control on construction sites (requires engineered plans), or for agricultural applications (soil amendment rates differ from decorative mulching).',
    ],
    commonUses: [
      'Garden bed mulching — apply 2-3 inches of organic mulch to flower beds, vegetable gardens, and shrub borders to suppress weeds, retain moisture, and regulate soil temperature throughout the growing season',
      'Tree ring mulching — create a donut-shaped mulch ring around trees at 2-3 inches deep, extending to the drip line, keeping mulch 3-6 inches away from the trunk to prevent bark rot',
      'Playground safety surfacing — use engineered wood fiber or rubber mulch at 6-12 inches depth (per ASTM F1292) for impact attenuation under play equipment',
      'Pathway and walkway covering — apply 2-3 inches of shredded hardwood or pine bark to create soft, natural-looking garden paths that suppress weeds',
    ],
    citations: [
      { source: 'ASTM D5730 - Standard Guide for Site Characterization for Environmental Purposes', url: 'https://www.astm.org/d5730-02.html' },
      { source: 'Wikipedia - Mulch', url: 'https://en.wikipedia.org/wiki/Mulch' },
      { source: 'USDA Natural Resources Conservation Service - Mulching', url: 'https://www.nrcs.usda.gov/conservation-basics/conservation-by-state' },
    ],
  },
};

export default mulchConfig;
