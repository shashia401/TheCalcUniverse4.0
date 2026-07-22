import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import PaintCoveragePanel from './PaintCoveragePanel';

const paintCoverageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'roomLength',
      label: 'Room Length',
      type: 'number',
      placeholder: '14',
      unit: 'ft',
      min: 0,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Length of the room to be painted',
    },
    {
      id: 'roomWidth',
      label: 'Room Width',
      type: 'number',
      placeholder: '12',
      unit: 'ft',
      min: 0,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Width of the room to be painted',
    },
    {
      id: 'ceilingHeight',
      label: 'Ceiling Height',
      type: 'number',
      placeholder: '9',
      unit: 'ft',
      min: 0,
      step: 0.5,
      required: true,
      inputMode: 'decimal',
      helpText: 'Height from floor to ceiling',
    },
    {
      id: 'doors',
      label: 'Number of Doors',
      type: 'number',
      placeholder: '2',
      min: 0,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Standard door ≈ 21 sq ft each',
    },
    {
      id: 'windows',
      label: 'Number of Windows',
      type: 'number',
      placeholder: '3',
      min: 0,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Standard window ≈ 15 sq ft each',
    },
    {
      id: 'coats',
      label: 'Number of Coats',
      type: 'select',
      helpText: 'Two coats is standard for full, even coverage',
      options: [
        { label: '1 coat', value: '1' },
        { label: '2 coats (recommended)', value: '2' },
        { label: '3 coats', value: '3' },
      ],
    },
  ],
  calculate: (values) => {
    const length = parseFloat(values.roomLength);
    const width = parseFloat(values.roomWidth);
    const height = parseFloat(values.ceilingHeight);
    const doors = parseFloat(values.doors) || 0;
    const windows = parseFloat(values.windows) || 0;
    const coats = parseFloat(values.coats || '2');

    if ([length, width, height].some(isNaN) || length <= 0 || width <= 0 || height <= 0) return [];

    const wallArea = 2 * (length + width) * height;
    const doorArea = doors * 21;
    const windowArea = windows * 15;
    const paintableArea = Math.max(0, wallArea - doorArea - windowArea);
    const coveragePerGallon = 350;

    const gallonsNeeded = (paintableArea * coats) / coveragePerGallon;
    const gallonsWithWaste = gallonsNeeded * 1.1;
    const gallonContainers = Math.ceil(gallonsWithWaste);

    const fmt = (n: number) => n.toFixed(1);

    return [
      {
        id: 'gallons',
        label: 'Gallons Needed (with 10% waste)',
        value: `${fmt(gallonsWithWaste)} gallons`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'containers',
        label: 'Buy This Many Gallon Containers',
        value: `${gallonContainers} gallon(s)`,
        color: 'neutral',
      },
      {
        id: 'paintableArea',
        label: 'Net Paintable Area',
        value: `${fmt(paintableArea)} sq ft`,
        color: 'neutral',
      },
      {
        id: 'totalWallArea',
        label: 'Total Wall Area',
        value: `${fmt(wallArea)} sq ft`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PaintCoveragePanel, { values, results });
  },
  educational: {
    formula: 'Gallons = (Paintable Area × Coats) ÷ 350 sq ft/gallon × 1.1 (waste)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="140" y="60" width="160" height="200" fill="var(--svg-3b82f6)" rx="10"/><rect x="130" y="50" width="180" height="30" fill="var(--svg-1d4ed8)" rx="4"/><text x="220" y="70" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">PAINT</text><text x="220" y="160" text-anchor="middle" font-size="30" fill="var(--svg-ffffff)">1</text><text x="220" y="190" text-anchor="middle" font-size="13" fill="var(--svg-bfdbfe)">Gallon</text><rect x="160" y="270" width="120" height="3" fill="var(--svg-1d4ed8)"/><text x="220" y="310" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Covers ~350 sq ft</text></svg>',
      alt: 'Paint can icon showing one gallon covers approximately 350 square feet',
      caption: 'Paint coverage — one gallon covers roughly 350 sq ft per coat',
    },
    formulaDescription:
      'Paint coverage is calculated based on net paintable area (walls minus doors and windows), number of coats, and a standard coverage rate of 350 sq ft per gallon.',
    variables: [
      { symbol: '350 sq ft', name: 'Coverage Rate', description: 'Most interior latex paints cover 350-400 sq ft per gallon on smooth surfaces. Use 300 for rough or porous surfaces.' },
      { symbol: '10% Waste', name: 'Waste Factor', description: 'A 10% buffer accounts for spills, touch-ups, and uneven application.' },
    ],
    quickReference: [
      { label: '1 gallon', value: 'Covers ~350 sq ft (smooth surface, single coat)' },
      { label: '1 quart', value: 'Covers ~87 sq ft (1/4 gallon)' },
      { label: '10x10 ft room (8 ft ceiling)', value: '~1 gallon per coat (walls only)' },
      { label: 'Standard door (80×36 in)', value: '~20 sq ft to subtract' },
      { label: 'Standard window (48×36 in)', value: '~12 sq ft to subtract' },
      { label: '2 coats on 400 sq ft', value: '~2.3 gallons (with 10% waste), buy 3' },
      { label: 'Flat/matte finish', value: 'Hides wall flaws, low washability, best for ceilings & low-traffic' },
      { label: 'Semi-gloss finish', value: 'Durable & washable, best for kitchens, baths, trim' },
    ],
    howToUse: [
      'Enter your room dimensions (length, width, ceiling height).',
      'Enter the number of doors and windows to subtract from the wall area.',
      'Select the number of coats (2 is standard for full coverage).',
      'The result includes a 10% waste buffer — always round up to the nearest gallon.',
      'Consider paint sheen: flat hides imperfections but is harder to clean; eggshell/satin are best for living areas; semi-gloss is ideal for kitchens, bathrooms, and trim.',
    ],
    explanation:
      'Paint coverage varies by surface texture, paint quality, and application method. Smooth drywall allows the standard 350 sq ft/gallon coverage. Rough textures, brick, or bare drywall absorb more paint and may require 300 sq ft/gallon or even a primer coat. When in doubt, buy one extra quart. Leftover paint stores well sealed for touch-ups. Paint sheen also affects coverage and durability: flat paint hides imperfections best but is hard to clean, while semi-gloss and high-gloss are more durable and washable but reveal surface flaws more easily. For living rooms and bedrooms, eggshell or satin finishes offer a good balance. For kitchens, bathrooms, and trim, semi-gloss is recommended for its moisture resistance and cleanability. Proper surface preparation is just as important as the paint itself: cleaning walls, patching holes, sanding rough spots, and applying quality painter\'s tape all contribute to a professional-looking result that lasts longer and requires fewer coats.',
    commonUses: [
      'Estimating how many gallons of paint to buy for a room painting project to avoid multiple trips to the store',
      'Planning paint budget for repainting a house interior, accounting for the number of coats and door or window deductions',
      'Comparing paint quantities needed for different sheens and surface textures that affect coverage rates',
    ],
    faqs: [
      {
        question: 'Do I need to paint the ceiling too?',
        answer: 'This calculator covers only the four walls. For the ceiling, calculate the floor area (length x width) and divide by 350. Ceilings typically need 1-2 coats of a separate ceiling paint. Ceiling paint is formulated to be thicker and spatter-resistant compared to wall paint.',
      },
      {
        question: 'What is a primer coat and do I need one?',
        answer: 'Primer seals porous surfaces, covers stains, and improves paint adhesion. It is recommended when painting bare drywall, going from dark to light colors, or covering stains. Count primer as one of your coats. Self-priming paints exist but may not work as well on heavily stained or extremely porous surfaces.',
      },
      {
        question: 'How do I choose between paint finishes?',
        answer: 'Flat or matte finishes hide wall imperfections but are harder to clean, making them best for low-traffic areas like formal living rooms and bedrooms. Eggshell and satin finishes work well in high-traffic areas like hallways and family rooms. Semi-gloss and high-gloss are ideal for trim, doors, cabinets, and bathrooms due to their durability and washability.',
      },
      {
        question: 'Should I buy all the paint at once?',
        answer: 'Yes, buy all paint at the same time from the same store. Paint batches can have slight color variations between manufacturing runs. Getting all the paint for a room at once ensures color consistency. Keep a record of the brand, color name, and sheen for future touch-ups.',
      },
      {
        question: 'How many coats of paint do I really need?',
        answer: 'Two coats is the standard recommendation for most painting projects. The first coat seals the surface and provides a base; the second coat delivers even color and full coverage. Going from a dark to light color may require 3 coats. Quality paint with good coverage can sometimes do the job in one coat on similar colors. Use a primer on bare drywall, dark colors being covered by light, or porous surfaces to reduce the number of finish coats needed.',
      },
      {
        question: 'How do I measure an irregularly shaped room?',
        answer: 'Break the room into rectangles, measure each section, and add the wall areas together. For angled ceilings, measure the tallest wall height for a conservative estimate. For rooms with alcoves, bay windows, or irregular shapes, treat each wall segment separately — measure each flat wall section width and multiply by ceiling height, then sum all sections. The calculator assumes a rectangular room, so manually add extra wall area for alcoves or subtract for large openings like archways.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Jessica is repainting her 14×12 ft bedroom with 9 ft ceilings. The room has 2 standard doors and 3 windows. She wants 2 coats of eggshell finish for a fresh, even look.',
        inputs: { roomLength: '14', roomWidth: '12', ceilingHeight: '9', doors: '2', windows: '3', coats: '2' },
        result: 'Wall area = 468 sq ft, minus 42 sq ft (doors) and 45 sq ft (windows) = 381 sq ft paintable. At 350 sq ft/gallon with 2 coats and 10% waste: 2.4 gallons needed. Buy 3 gallons.',
        insight: 'Jessica needs 3 gallon containers. She should buy all 3 from the same store at the same time to avoid color lot mismatches. With eggshell finish on smooth walls, 350 sq ft/gallon is realistic. She should budget about $90–$150 for quality paint, plus supplies (rollers, brushes, tape, drop cloths). Total project time: about 4–6 hours for a weekend DIY project including prep and cleanup.',
      },
      {
        scenario: 'Mark is painting his 20×15 ft open-plan living room with 10 ft ceilings and large windows totaling 80 sq ft of glass. He wants 1 coat of a high-quality paint that promises one-coat coverage over a similar existing color.',
        inputs: { roomLength: '20', roomWidth: '15', ceilingHeight: '10', doors: '1', windows: '5', coats: '1' },
        result: 'Wall area = 700 sq ft, minus 21 sq ft (door) and ~75 sq ft (5 windows) = 604 sq ft paintable. At 350 sq ft/gallon with 1 coat and 10% waste: 1.9 gallons needed. Buy 2 gallons.',
        insight: 'Even with "one-coat" paint, Mark should budget for touch-ups. The 10% waste buffer covers those. Since the room has 10 ft ceilings (higher than standard), he will need an extension pole for his roller and possibly a small ladder for cutting in at the top. High-ceiling rooms use paint faster because of the extra reach work. Mark should also account for the ceiling if he plans to paint it — that would add 300 sq ft and require roughly 1 additional gallon.',
      },
      {
        scenario: 'A contractor is bidding on repainting a 3-bedroom house interior (3 rooms at 12×12×8 ft plus a hallway 15×3×8 ft). All rooms have 1 door and 2 windows each. The hallway has no windows and 1 door. Total 2 coats throughout.',
        inputs: { roomLength: '12', roomWidth: '12', ceilingHeight: '8', doors: '1', windows: '2', coats: '2' },
        result: 'Per bedroom: wall area = 384 sq ft, minus 21 (door) and 30 (windows) = 333 sq ft paintable. At 2 coats with waste: 2.1 gallons. Buy 3 gallons per bedroom = 9 gallons for 3 bedrooms. Hallway separately: wall area = 288 sq ft, minus 21 (door) = 267 sq ft, needs ~1.7 gallons, buy 2. Total: ~11 gallons for the job.',
        insight: 'The contractor should calculate each room separately since dimensions vary. The calculator handles one room at a time, so run it once per distinct room size and sum the results. For bidding, factor in ceiling paint separately (each 12×12 bedroom ceiling = 144 sq ft, ~0.9 gallons for 2 coats). The contractor should add 15% contingency to the total paint estimate for an insured professional job covering unexpected repairs and touch-ups.',
      },
    ],
    proTips: [
      'Always buy all your paint at once from the same store — different manufacturing batches can have subtle color variations that are visible on the wall even if the formula is identical. Check the batch/lot number on each can to verify they match.',
      'Use high-quality primer when painting over dark colors, bare drywall, or stained surfaces. Primer costs less than finish paint and can reduce the number of finish coats needed from 3 to 2, saving money overall. Tinted primer (tinted toward your final color) provides the best coverage for dramatic color changes.',
      'Cut in first — paint the edges and corners with a brush before rolling the main wall area. This technique, called "cutting in," prevents visible brush marks because the roller blends the edges while the brushed paint is still wet. Work in 3–4 ft wide sections from top to bottom, keeping a wet edge to avoid lap marks.',
      'For ceilings, use a separate ceiling paint which is formulated to be thicker (less dripping) and has a flatter finish than wall paint. Do the ceiling before the walls so any splatter on the walls gets covered. If you are not painting the ceiling, use painter\'s tape and a trim guard for a clean edge.',
      'Account for texture: smooth drywall allows the full 350 sq ft/gallon. Light orange-peel texture reduces coverage to ~300 sq ft/gallon. Heavy knockdown texture or bare brick can reduce it to 200–250 sq ft/gallon. Adjust your per-gallon coverage rate down accordingly.',
      'Store leftover paint properly: clean the rim of the can thoroughly (dried paint on the rim prevents an airtight seal), place plastic wrap over the opening before hammering the lid shut, and store the can upside down — this creates an airtight seal that prevents the paint from skinning over. Label each can with the room and date. Properly stored latex paint lasts 2–10 years.',
    ],
    limitations: [
      'This calculator provides an estimate based on standard rectangular rooms with flat walls. It does not account for textured surfaces (popcorn, knockdown, orange peel), which can reduce coverage by 15-40%, or vaulted/cathedral ceilings that increase wall area beyond simple rectangular calculations.',
      'Large built-in features like fireplaces, bookcases, or entertainment centers that reduce paintable area are not deducted. Different paint qualities and brands vary in coverage from 250-450 sq ft per gallon — the default 350 sq ft/gallon is an average.',
      'Paint absorption differences between new drywall (high absorption, needs primer) and previously painted surfaces (low absorption) are not accounted for. Exterior painting involves different surface types, coverage rates, and weather considerations.',
      'For complex rooms, use the calculator as a starting point and add 15-20% for safety. Always consult the paint can label for the manufacturer\'s specific coverage rate, which supersedes the 350 sq ft/gallon default used by this calculator.',
    ],
    citations: [
      { source: 'OSHA', url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.1101' },
      { source: 'Behr Paint', url: 'https://www.behr.com/consumer/how-to/calculate-paint' },
    ],
  },
};

export default paintCoverageConfig;
