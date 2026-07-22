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
      placeholder: '20',
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the length of the area to cover in feet. For driveways, measure the full length including any curved sections as a straight-line approximation.',
    },
    {
      id: 'width',
      label: 'Width (ft)',
      type: 'number',
      placeholder: '10',
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter the width of the area in feet. For irregular areas, use the average width.',
    },
    {
      id: 'depth',
      label: 'Depth (inches)',
      type: 'select',
      required: true,
      options: [
        { value: '2', label: '2 inches (pathway/decoration)' },
        { value: '3', label: '3 inches (walkway standard)' },
        { value: '4', label: '4 inches (driveway standard)' },
        { value: '6', label: '6 inches (heavy vehicle driveway)' },
        { value: '12', label: '12 inches (deep fill/base layer)' },
      ],
      helpText: 'Select the gravel depth. 4 inches is standard for driveways; 2-3 inches for walkways.',
    },
    {
      id: 'material',
      label: 'Material Type',
      type: 'select',
      required: true,
      options: [
        { value: 'pea-gravel', label: 'Pea Gravel (smooth, rounded)' },
        { value: 'crushed-limestone', label: 'Crushed Limestone (angular, compacts well)' },
        { value: 'river-rock', label: 'River Rock (large, decorative)' },
        { value: 'decomposed-granite', label: 'Decomposed Granite (fines, tight compaction)' },
      ],
      helpText: 'Choose material type. Crushed limestone is best for driveways; pea gravel for pathways.',
    },
    {
      id: 'pricePerYard',
      label: 'Price per Cubic Yard ($)',
      type: 'number',
      placeholder: '45',
      inputMode: 'decimal',
      helpText: 'Optional: enter the price per cubic yard from your local supplier for cost estimation.',
    },
    {
      id: 'pricePerTon',
      label: 'Price per Ton ($)',
      type: 'number',
      placeholder: '35',
      inputMode: 'decimal',
      helpText: 'Optional: enter the price per ton for materials that are sold by weight.',
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
    // Compaction adjustment for crushed materials
    const compactionFactor = values.material === 'pea-gravel' || values.material === 'river-rock' ? 1.0 : 1.15;
    const compactedYards = cubicYards * compactionFactor;

    const fmt2 = (n: number) => n.toFixed(2);
    const fmt0 = (n: number) => Math.round(n).toLocaleString();

    const results: CalculatorResult[] = [
      {
        id: 'cubic-yards',
        label: 'Volume (Uncompacted)',
        value: `${fmt2(cubicYards)} cubic yards`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'tons',
        label: 'Weight',
        value: `${fmt2(tons)} tons (${values.material})`,
        color: 'neutral',
      },
      {
        id: 'compacted-yards',
        label: 'Volume with Compaction',
        value: compactionFactor > 1 ? `${fmt2(compactedYards)} cubic yards (+15%)` : `${fmt2(cubicYards)} cubic yards`,
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

    if (pricePerYard !== undefined && !isNaN(pricePerYard) && pricePerYard > 0) {
      results.push({
        id: 'cost-per-yard',
        label: 'Estimated Cost (per yard)',
        value: `$${fmt2(cubicYards * pricePerYard)}`,
        color: 'positive',
      });
    }

    if (pricePerTon !== undefined && !isNaN(pricePerTon) && pricePerTon > 0) {
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
    formula: 'Cubic Yards = (L x W x Depth_in) / 324 | Tons = Cubic Yards x Density_lbs/yd3 / 2000',
    formulaDescription:
      'Gravel volume is calculated by multiplying area (length x width) by depth in inches, then dividing by 324 to convert directly to cubic yards. The constant 324 combines two conversion factors: 27 cubic feet per cubic yard times 12 inches per foot. Weight in tons is then derived by multiplying cubic yards by the material density (in pounds per cubic yard) and dividing by 2000 pounds per ton. Each material has a characteristic density: pea gravel at 2,700 lbs/yd3, crushed limestone at 2,600 lbs/yd3, river rock at 2,800 lbs/yd3, and decomposed granite at 2,650 lbs/yd3. For crushed materials that compact under load, add 10-15% extra volume to account for the reduction in thickness after compaction.',
    variables: [
      {
        symbol: 'Cubic Yards',
        name: 'Volume',
        description: 'Total volume of gravel needed in cubic yards. One cubic yard covers approximately 100 sq ft at 3 inches deep, or 54 sq ft at 6 inches deep.',
      },
      {
        symbol: 'Tons',
        name: 'Weight',
        description: 'Estimated weight based on the selected material density in pounds per cubic yard, converted to tons (divided by 2000). Used for ordering from suppliers who sell by weight rather than volume.',
      },
      {
        symbol: 'Compaction Factor',
        name: 'Compaction Allowance',
        description: 'Crushed materials (limestone, decomposed granite) compact by 10-15% under load, so extra volume is needed. Rounded materials (pea gravel, river rock) do not compact significantly.',
      },
    ],
    howToUse: [
      'Measure the length and width of the area to cover in feet — use the longest dimensions.',
      'Select the desired gravel depth from the dropdown based on your project type.',
      'Choose the material type — different gravels have different densities and compaction behaviors.',
      'Optionally enter price per cubic yard and/or price per ton for cost estimates.',
      'Review the results: uncompacted volume, compacted volume, weight in tons, and weed barrier fabric requirements.',
    ],
    explanation:
      'Gravel and crushed stone are fundamental materials in landscape construction, used for everything from decorative garden paths to heavy-duty driveway bases. Understanding the relationship between volume, weight, and material type is essential for accurate ordering and budgeting.\n\nGravel is measured by volume (cubic yards) but often sold by weight (tons) because different materials pack at different densities. One cubic yard of pea gravel weighs approximately 1.35 tons (2,700 lbs), while the same volume of river rock weighs about 1.4 tons (2,800 lbs). This weight difference matters when your delivery truck has a weight limit — a 10-yard load of river rock weighs 14 tons, which may exceed the capacity of a standard dump truck rated for 10-12 tons.\n\nPractical example: a 20 x 10 foot driveway at 4 inches deep using crushed limestone. Volume = (20 x 10 x 4) / 324 = 2.47 cubic yards. With 15% compaction allowance: 2.47 x 1.15 = 2.84 cubic yards. Weight = 2.84 x 2,600 / 2,000 = 3.69 tons. You would order 3 cubic yards or approximately 3.75 tons, plus 200 sq ft of weed barrier fabric.\n\nEdge cases: for decomposed granite pathways, compaction can reduce thickness by 25-30%, so order significantly more than the calculated uncompacted volume. For French drains, use washed 3/4 to 1.5 inch gravel — fines and dust from crusher-run material will clog drain pipe perforations. For deep fills exceeding 12 inches, use a layered approach: larger base rock (2-4 inch) for the bottom layer, then progressively smaller stone toward the surface. Most suppliers have a minimum delivery of 3-5 cubic yards, so for smaller projects, bagged gravel may be more practical despite higher per-unit cost.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><defs><marker id="ab" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-3b82f6)"/></marker><marker id="ar" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-ef4444)"/></marker></defs><rect x="60" y="40" width="200" height="110" fill="var(--svg-fef3c7)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="4"/><circle cx="100" cy="75" r="5" fill="var(--svg-d97706)" opacity=".4"/><circle cx="145" cy="65" r="4" fill="var(--svg-d97706)" opacity=".3"/><circle cx="185" cy="90" r="6" fill="var(--svg-d97706)" opacity=".4"/><circle cx="110" cy="115" r="4" fill="var(--svg-d97706)" opacity=".3"/><circle cx="165" cy="125" r="5" fill="var(--svg-d97706)" opacity=".4"/><circle cx="215" cy="105" r="4" fill="var(--svg-d97706)" opacity=".3"/><circle cx="225" cy="70" r="5" fill="var(--svg-d97706)" opacity=".4"/><circle cx="85" cy="95" r="3" fill="var(--svg-d97706)" opacity=".3"/><line x1="60" y1="30" x2="260" y2="30" stroke="var(--svg-3b82f6)" stroke-width="1.5" marker-start="url(#ab)" marker-end="url(#ab)"/><text x="160" y="23" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="14" font-weight="bold">Length (ft)</text><line x1="270" y1="40" x2="270" y2="150" stroke="var(--svg-ef4444)" stroke-width="1.5" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="278" y="99" text-anchor="start" fill="var(--svg-ef4444)" font-size="14" font-weight="bold">Width</text><rect x="30" y="158" width="130" height="18" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="95" y="170" text-anchor="middle" fill="var(--svg-1e40af)" font-size="11" font-weight="bold">Depth (inches)</text><text x="160" y="196" text-anchor="middle" fill="var(--svg-4b5563)" font-size="10">Volume = L &amp;times; W &amp;times; D</text></svg>',
      alt: 'Rectangular gravel area with length and width dimensions and depth indicator',
      caption: 'Gravel volume is calculated from length, width, and depth of the area to be covered.',
    },
    quickReference: [
      { label: '1 cu yd at 2" depth', value: '~162 sq ft coverage' },
      { label: '1 cu yd at 3" depth', value: '~108 sq ft coverage' },
      { label: '1 cu yd at 4" depth', value: '~81 sq ft coverage' },
      { label: 'Pea gravel weight', value: '~1.35 tons per cu yd' },
      { label: 'Crushed limestone weight', value: '~1.30 tons per cu yd' },
      { label: 'River rock weight', value: '~1.40 tons per cu yd' },
      { label: 'Decomposed granite weight', value: '~1.33 tons per cu yd' },
    ],
    faqs: [
      {
        question: 'How many square feet does a cubic yard of gravel cover?',
        answer: 'One cubic yard covers approximately 162 square feet at 2 inches deep, 108 square feet at 3 inches deep, 81 square feet at 4 inches deep, or 54 square feet at 6 inches deep. The exact coverage depends on the material and how evenly it is spread. For quick estimation, remember that 1 cubic yard at 3 inches deep covers about 100 square feet.',
      },
      {
        question: 'What is the best gravel depth for a walkway?',
        answer: 'For pedestrian walkways, 2-3 inches of gravel is sufficient for a stable, comfortable surface. For driveways that support vehicle weight, 4-6 inches is recommended — the extra depth prevents the gravel from shifting and exposing the base layer. Decorative garden paths can use 1-2 inches, but be aware that thin layers scatter more easily and require more frequent raking.',
      },
      {
        question: 'Should I use crushed limestone or pea gravel for my driveway?',
        answer: 'Crushed limestone is the superior choice for driveways because its angular edges interlock under compaction, creating a stable surface that resists shifting under vehicle traffic. Pea gravel has smooth, rounded edges that roll and scatter easily — it is better suited for walkways, playgrounds, and decorative borders where vehicles will not travel. For a driveway base, use 3-4 inches of #57 or #67 crushed limestone. For the top layer, a smaller grade like #8 or #89 limestone creates a smoother finish. For French drains and drainage applications, use washed 3/4-inch gravel — avoid crusher-run material with fines that can clog perforated pipes.',
      },
      {
        question: 'Do I need weed barrier fabric under gravel?',
        answer: 'Yes, landscape fabric (weed barrier) is strongly recommended under any gravel installation. It prevents weeds from growing up through the gravel, keeps the gravel from mixing with the underlying soil, and extends the life of your installation. Use commercial-grade fabric (not thin plastic sheeting) with at least a 3-ounce per square yard weight. Overlap seams by 6-12 inches and secure with landscape staples every 3 feet. For driveways, use a heavy-duty geotextile fabric rated for vehicular loads — standard landscape fabric can tear under vehicle weight.',
      },
      {
        question: 'What is the difference between crushed stone and gravel?',
        answer: 'Crushed stone is mechanically crushed rock with angular edges that interlock when compacted — ideal for structural applications like driveway bases, retaining wall backfill, and French drains. Gravel (like pea gravel or river rock) is naturally weathered stone with smooth, rounded edges — better for decorative surfaces, pathways, and playgrounds where compaction is not needed. Crushed stone typically costs less per ton than decorative gravel because it is a byproduct of quarry operations. Decomposed granite (DG) is a specialty material that falls between the two: it contains rock fines that bind together when compacted, creating a firm surface similar to asphalt in feel but with a natural appearance. DG is popular for pathways and patio surfaces in western US landscapes.',
      },
      {
        question: 'How do I maintain a gravel driveway or path?',
        answer: 'Gravel driveways need periodic maintenance to stay functional. Rake the surface every 2-3 months to redistribute gravel that has migrated to the edges. Add a fresh 1-inch top layer every 1-2 years as gravel gradually sinks into the subgrade. After heavy rain, check for erosion channels and fill them promptly before they grow. For driveways with a pronounced crown, re-grade every 2-3 years with a box blade to maintain proper drainage. In snowy climates, use a snow blower with adjustable skid plates set high enough to avoid picking up gravel — or mark the driveway edges with reflective stakes so plow operators can see the boundaries.',
      },
    ],
    workedExamples: [
      {
        scenario: 'David in Denver needs gravel for a 30 ft x 12 ft RV parking pad at 6 inches deep. He is choosing between crushed limestone at $38/ton and pea gravel at $52/ton. How much material and what will it cost?',
        inputs: { length: '30', width: '12', depth: '6', material: 'crushed-limestone' },
        result: 'Volume = 6.67 cubic yards (8.33 with compaction). Weight = 10.83 tons. Cost with limestone: $411. With pea gravel: $563. Crushed limestone saves $152.',
        insight: 'For an RV pad, crushed limestone is the clear winner both structurally and financially. David should add 10% to the compacted volume and order 9 cubic yards or 12 tons. He also needs 360 sq ft of heavy-duty geotextile fabric underneath to prevent the gravel from sinking into the soil under the weight of an RV.',
      },
    ],
    proTips: [
      'Install proper edging — Gravel migrates over time, especially on slopes. Install steel, aluminum, or pressure-treated timber edging along all borders to contain the gravel. Edging should extend 1-2 inches above the finished gravel height to act as a retaining curb.',
      'Use the right tool for spreading — A landscape rake (36-inch aluminum rake with flat tines) is the best tool for spreading and leveling gravel. Avoid bow rakes with curved tines — they catch on gravel and make leveling frustrating. For large areas, a tractor-mounted box blade or land plane is worth renting.',
      'Order by weight when possible — Suppliers who sell by weight (tons) generally give you exactly what you pay for on a certified scale. Volume-based orders (cubic yards) can vary by up to 10% depending on how the material is loaded and how much moisture it contains. If ordering by volume, visually verify the load size before the truck leaves.',
      'Account for delivery logistics — Standard dump trucks carry 10-14 cubic yards. If your project needs 16 yards, you will need two deliveries and should coordinate them so the first load can be spread before the second arrives. Have a wheelbarrow (6 cubic foot capacity), shovel, and rake ready before the truck arrives.',
    ],
    limitations: [
      'This calculator assumes a flat, rectangular area with uniform depth. Irregular shapes, sloped terrain, or varied depth profiles require breaking the project into smaller segments and calculating each separately.',
      'Material densities are approximate averages. Actual density varies with moisture content, gradation, and source quarry. Wet gravel can weigh 5-10% more than dry gravel. Always confirm the actual density with your supplier when ordering by weight.',
      'Compaction estimates are guidelines only. Actual compaction depends on subgrade soil type, compaction method (hand tamper vs. plate compactor), and number of passes. For engineered fills under structures, a geotechnical engineer should specify compaction requirements and testing.',
      'This tool is for residential landscaping and light construction estimates. When not to use: for structural base courses under buildings or retaining walls (requires engineered specifications), for DOT-spec road base (requires sieve analysis and Proctor testing), or for projects requiring a graded aggregate base with specific California Bearing Ratio (CBR) values.',
    ],
    commonUses: [
      'Driveway base and surfacing — use 4-6 inches of crushed limestone or road base for vehicle traffic areas with proper compaction and edging',
      'Garden pathway installation — apply 2-3 inches of pea gravel or decomposed granite for attractive, permeable walkways with weed barrier underneath',
      'French drain construction — use washed 3/4 to 1.5 inch gravel surrounding a perforated drain pipe for effective subsurface drainage',
      'Patio and seating area base — install 3-4 inches of decomposed granite or crushed stone as a level, compacted base for flagstone, pavers, or as a standalone surface',
    ],
    citations: [
      { source: 'Wikipedia - Gravel', url: 'https://en.wikipedia.org/wiki/Gravel' },
      { source: 'USGS - Crushed Stone Statistics', url: 'https://www.usgs.gov/centers/national-minerals-information-center/crushed-stone-statistics-and-information' },
      { source: 'Wolfram MathWorld - Volume', url: 'https://mathworld.wolfram.com/Volume.html' },
    ],
  },

  extraPanel: (
    values: Record<string, string>,
    results: CalculatorResult[],
  ) => createElement(GravelPanel, { values, results }),
};

export default config;
