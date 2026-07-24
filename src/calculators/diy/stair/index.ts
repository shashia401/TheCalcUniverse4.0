import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import StairPanel from './StairPanel';

const stairConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'totalRise',
      label: 'Total Rise (inches)',
      type: 'number',
      min: 0.1,
      step: 0.25,
      placeholder: '105',
      required: true,
      inputMode: 'decimal',
      helpText: 'Total vertical height from finished floor to finished floor in inches. Measure at multiple points and use the largest measurement.',
    },
    {
      id: 'targetRiserHeight',
      label: 'Desired Riser Height (in)',
      type: 'number',
      min: 1,
      step: 0.125,
      placeholder: '7',
      helpText: 'Typical residential riser height is 7 inches. IBC code maximum is 7.75 inches. Comfortable stairs use 6.5-7.5 inches.',
      defaultValue: '7',
      inputMode: 'decimal',
    },
    {
      id: 'treadDepth',
      label: 'Tread Depth (inches)',
      type: 'number',
      min: 1,
      step: 0.25,
      placeholder: '11',
      helpText: 'The horizontal depth of each step. IBC code minimum is 10 inches. 11 inches is the comfortable standard for residential stairs.',
      defaultValue: '11',
      inputMode: 'decimal',
    },
    {
      id: 'stringerThickness',
      label: 'Stringer Thickness (inches)',
      type: 'number',
      min: 0,
      step: 0.5,
      placeholder: '1.5',
      helpText: 'Board thickness for the stringer. 1.5 inches is standard for 2x12 dimensional lumber (actual 1.5" x 11.25").',
      defaultValue: '1.5',
      inputMode: 'decimal',
    },
    {
      id: 'unitSystem',
      label: 'Units',
      type: 'select',
      options: [
        { label: 'Inches', value: 'in' },
        { label: 'Feet + Inches', value: 'ft' },
      ],
      defaultValue: 'in',
      helpText: 'Choose display format for total run and stringer length. Feet+Inches is useful for framing layout.',
    },
    {
      id: 'includeOverhang',
      label: 'Include Tread Overhang',
      type: 'select',
      options: [
        { label: 'Yes (1" nosing)', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      defaultValue: 'yes',
      helpText: 'Nosing overhang extends the tread 1 inch beyond the stringer face. Required by IBC for commercial stairs; recommended for residential.',
    },
  ],
  calculate: (values) => {
    const totalRise = parseFloat(values.totalRise);
    const targetRiserHeight = parseFloat(values.targetRiserHeight || '7');
    const treadDepth = parseFloat(values.treadDepth || '11');

    if (
      isNaN(totalRise) || totalRise <= 0 ||
      isNaN(targetRiserHeight) || targetRiserHeight <= 0 ||
      isNaN(treadDepth) || treadDepth <= 0
    ) {
      return [];
    }

    const numberOfRisers = Math.ceil(totalRise / targetRiserHeight);
    const actualRiserHeight = totalRise / numberOfRisers;
    const numberOfTreads = numberOfRisers - 1;
    const totalRunIn = numberOfTreads * treadDepth;
    const stringerLength = Math.sqrt(totalRise * totalRise + totalRunIn * totalRunIn);
    const angleDeg = Math.atan(totalRise / (totalRunIn || 1)) * (180 / Math.PI);

    const ibcCompliant = actualRiserHeight <= 7.75 && treadDepth >= 10;
    // Check IRC comfort rule: 2R + T should be 24-25 inches
    const comfortValue = 2 * actualRiserHeight + treadDepth;
    const isComfortable = comfortValue >= 24 && comfortValue <= 25;

    const formatInches = (inches: number): string => {
      const ft = Math.floor(inches / 12);
      const rem = inches % 12;
      return values.unitSystem === 'ft' && ft > 0
        ? `${ft}' ${rem.toFixed(2)}"`
        : `${inches.toFixed(2)}"`;
    };

    const stairData = JSON.stringify({
      numberOfRisers,
      actualRiserHeight: parseFloat(actualRiserHeight.toFixed(4)),
      numberOfTreads,
      totalRunIn: parseFloat(totalRunIn.toFixed(4)),
      stringerLength: parseFloat(stringerLength.toFixed(4)),
      angleDeg: parseFloat(angleDeg.toFixed(2)),
      ibcCompliant,
      comfortValue: parseFloat(comfortValue.toFixed(1)),
      treadDepth: parseFloat(treadDepth.toFixed(4)),
      unitSystem: values.unitSystem || 'in',
    });

    return [
      {
        id: 'numberOfSteps',
        label: 'Number of Steps',
        value: `${numberOfRisers} risers, ${numberOfTreads} treads`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'riserHeight',
        label: 'Actual Riser Height',
        value: `${actualRiserHeight.toFixed(2)}"`,
        highlight: actualRiserHeight <= 7.75,
        color: actualRiserHeight <= 7.75 ? 'positive' : 'negative',
      },
      {
        id: 'treadDepthResult',
        label: 'Tread Depth',
        value: `${treadDepth.toFixed(2)}"`,
      },
      {
        id: 'totalRun',
        label: 'Total Run (Horizontal)',
        value: formatInches(totalRunIn),
      },
      {
        id: 'stringerLength',
        label: 'Stringer Length Needed',
        value: formatInches(stringerLength),
      },
      {
        id: 'stringerAngle',
        label: 'Stair Angle',
        value: `${angleDeg.toFixed(1)}°`,
      },
      {
        id: 'comfortCheck',
        label: 'Comfort Check (2R+T)',
        value: `2R + T = ${comfortValue.toFixed(1)}" ${isComfortable ? '(ideal 24-25")' : '(outside ideal 24-25" range)'}`,
        color: isComfortable ? 'positive' : 'negative',
      },
      {
        id: 'ibcStatus',
        label: 'IBC Compliance',
        value: ibcCompliant
          ? 'Passes IBC requirements (R <= 7.75", T >= 10")'
          : 'Warning: Does not meet IBC standards',
        color: ibcCompliant ? 'positive' : 'negative',
      },
      {
        id: 'materialRecommendation',
        label: 'Stringer Recommendation',
        value: '2x12 lumber recommended (minimum 2x10)',
      },
      {
        id: '_stairData',
        label: 'Stair Geometry Data',
        value: stairData,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(StairPanel, { values, results });
  },
  educational: {
    formula:
      'Risers = ceil(TotalRise / RiserHeight) | TotalRun = Treads x TreadDepth | Stringer = sqrt(Rise^2 + Run^2) | 2R + T = 24-25"',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Stair Rise / Run Profile</text><!-- Stringer diagonal --><line x1="50" y1="170" x2="270" y2="50" stroke="var(--svg-3b82f6)" stroke-width="2"/><!-- Treads and risers --><polyline points="50,170 80,147 80,147 80,124 110,101 110,101 110,78 140,55 140,55 140,50" fill="none" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linejoin="round"/><line x1="50" y1="170" x2="270" y2="170" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="4,3"/><!-- Rise label --><line x1="35" y1="170" x2="35" y2="124" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="30" y="150" text-anchor="end" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Riser</text><!-- Run label --><line x1="50" y1="180" x2="80" y2="180" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="65" y="192" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Tread</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">IBC: max riser 7.75 in, min tread 10 in</text></svg>',
      alt: 'Stair profile diagram showing riser height and tread depth with stringer',
      caption: 'Stair geometry: riser = vertical rise per step, tread = horizontal depth, stringer = diagonal support board.',
    },
    formulaDescription:
      'Stair design is governed by three interrelated constraints: the International Building Code (IBC) limits, the comfort equation, and the Pythagorean geometry of the stringer. The code limits are absolute: risers must not exceed 7.75 inches and treads must be at least 10 inches. The comfort equation (2R + T = 24-25 inches) comes from ergonomic research on human stride length — when twice the riser height plus the tread depth falls within this range, stairs feel natural and comfortable to climb. The stringer length follows directly from the Pythagorean theorem: it is the square root of the sum of the squares of total rise and total run.',
    variables: [
      {
        symbol: 'Rise',
        name: 'Total Rise & Riser Height',
        description: 'Total rise is the vertical distance from finished floor to finished floor. Riser height is the vertical height of each individual step, calculated by dividing total rise by the number of risers. IBC maximum is 7.75 inches per riser.',
      },
      {
        symbol: 'Run',
        name: 'Total Run & Tread Depth',
        description: 'Total run is the horizontal distance the staircase extends from the first riser to the last. Tread depth is the horizontal depth of each step (minimum 10 inches per IBC). Total run = tread depth x (number of risers - 1).',
      },
      {
        symbol: '2R+T',
        name: 'Comfort Equation',
        description: 'The ergonomic formula 2R + T (twice the riser plus the tread) should ideally equal 24-25 inches for comfortable stairs. This is derived from average human stride length and is the gold standard for stair design beyond minimum code requirements.',
      },
    ],
    howToUse: [
      'Measure the total vertical rise from finished floor to finished floor using a tape measure and level.',
      'Enter your target riser height (7 inches is the standard starting point for residential design).',
      'Enter your desired tread depth (11 inches is the comfortable standard).',
      'Review the calculated number of steps, actual riser height, stringer length, stair angle, and IBC compliance.',
      'Adjust riser height or tread depth if the stairs do not pass IBC or the comfort check.',
    ],
    explanation:
      'Stair design is one of the most regulated aspects of residential construction because improperly designed stairs are a leading cause of falls and injuries. A well-designed staircase is easy to climb, predictable underfoot, and compliant with building codes that have been refined over centuries of architectural practice.\n\nThe ancient Roman architect Vitruvius wrote about stair proportions in De Architectura (circa 25 BCE), recommending that risers be between 6 and 7.5 inches — remarkably close to modern code. The modern comfort equation (2R + T = 24-25) was formalized by French architect Francois Blondel in the 17th century and remains the ergonomic standard today.\n\nPractical example: a total rise of 105 inches (8 feet 9 inches, typical for an 8-foot ceiling with 9-inch floor joists) with a target riser of 7 inches yields 105 / 7 = 15 risers exactly. With 14 treads at 11 inches each, the total run is 154 inches (12 feet 10 inches). The stringer length is sqrt(105^2 + 154^2) = 186.4 inches (15 feet 6 inches) — requiring a 16-foot 2x12 board. The angle is 34.3 degrees, which is comfortable. The comfort check: 2(7) + 11 = 25 — perfectly within the ideal range.\n\nEdge cases: for exterior deck stairs, the bottom riser may differ from the rest because it terminates at grade rather than a finished floor — ensure all risers are within 3/8 inch of each other for safety. For basement stairs with limited headroom, a steeper angle up to 42 degrees may be acceptable but a landing is required for rises exceeding 12 feet. When total rise produces fractional risers, the calculator rounds up, distributing the fraction across all steps evenly — all risers MUST be equal height by code.',
    quickReference: [
      { label: 'IBC max riser', value: '7.75 inches' },
      { label: 'IBC min tread', value: '10 inches' },
      { label: 'Comfort equation', value: '2R + T = 24-25' },
      { label: 'Ideal riser', value: '7 inches' },
      { label: 'Ideal tread', value: '11 inches' },
      { label: 'Stringer board', value: '2x12 (actual 1.5" x 11.25")' },
      { label: 'Ideal stair angle', value: '30-35 degrees' },
      { label: 'Max continuous rise without landing', value: '12 feet (IBC)' },
    ],
    faqs: [
      {
        question: 'What is the ideal stair angle?',
        answer: 'The ideal stair angle is between 30 and 35 degrees for comfortable, safe ascent. This corresponds roughly to a 7-inch riser with an 11-inch tread (7/11 ratio). Angles below 30 degrees feel shallow and require more steps (increasing total run), while angles above 42 degrees become challenging — particularly for children, older adults, and anyone carrying items. Stairs steeper than 45 degrees should include a landing or consider an alternating tread design (ship ladder style). The OSHA standard for fixed industrial stairs permits angles up to 50 degrees with open risers, but these are not suitable for residential use.',
      },
      {
        question: 'Why use 2x12 for stringers?',
        answer: 'A 2x12 provides 11.25 inches of actual depth, which is the minimum needed to cut stair notches for a 7-inch riser and 11-inch tread while leaving sufficient material for structural integrity. After cutting notches, the remaining "throat" of the stringer (the uncut portion) should be at least 3.5 inches for adequate strength. A 2x10 (9.25 inches actual) can work for shallower stairs but leaves less safety margin. For stairs wider than 36 inches, use three stringers (two outer, one center) rather than the minimum two. For stairs exceeding 48 inches in width, use four stringers spaced no more than 16 inches apart to prevent tread deflection.',
      },
      {
        question: 'What if my stairs do not pass IBC?',
        answer: 'If the riser exceeds 7.75 inches, increase the number of risers by reducing your target riser height — even a 0.25-inch adjustment can add enough steps to bring the riser within code. If the tread is under 10 inches, you need a longer total run, which means a larger floor footprint for the staircase. In tight spaces, consider a switchback (U-shaped) staircase with a landing to fit the required run into a smaller floor area. If you cannot meet both constraints, consult a structural engineer — occupied structures must comply with IBC. Note that local amendments to the IBC may have stricter requirements (some jurisdictions cap risers at 7.5 inches for residential).',
      },
      {
        question: 'How do I lay out and cut stair stringers?',
        answer: 'Use a framing square with stair gauges (small brass clamps) set to your riser and tread dimensions. Starting at one end of the 2x12, position the square with the riser dimension on the tongue (short leg) and tread on the blade (long leg). Mark the first notch, slide the square to align with the previous mark, and repeat for all steps. Cut along the lines with a circular saw, stopping at the inside corner of each notch, then finish the corner with a handsaw or jigsaw — never overcut with a circular saw as this weakens the stringer. The bottom riser should be shortened by the thickness of the tread material so all risers end up equal height after treads are installed. Always cut one stringer first, test-fit it against the structure, and use it as a template for the remaining stringers. Mark all stringers clearly so you cut them identically.',
      },
      {
        question: 'What is the difference between open and closed stringers?',
        answer: 'Closed (housed) stringers have routed grooves or dadoes into which treads and risers slide — common in finished interior stairs where the stringer sides are visible. They require precise routing and are more time-consuming to build. Open (cut) stringers have the stair profile cut into the top edge of the board with treads mounted on top and risers optionally attached to the face. Open stringers are standard for deck stairs, basement stairs, and utility stairs where speed and simplicity are priorities. Cut stringers are the type calculated by this tool. For interior finished stairs, the visible outer stringers are often decorative skirt boards attached to the structural cut stringers hidden behind them.',
      },
      {
        question: 'How do I calculate stairs with a landing?',
        answer: 'For stairs with a landing (required for rises over 12 feet), treat each flight of stairs as a separate calculation. Measure the rise from the lower floor to the landing, calculate that flight, then measure from the landing to the upper floor and calculate the second flight. The two flights can have different numbers of steps but each flight must have risers of equal height within the flight. The landing itself must be at least as deep as the stair width (minimum 36 inches) and must be level. Use this calculator twice — once for each flight — entering the appropriate total rise for each section. The landing platform should be framed as a miniature floor with joists sized for the span and expected live load (typically 40 psf for residential).',
      },
    ],
    workedExamples: [
      {
        scenario: 'Mark in Seattle is building deck stairs from his 56-inch-high deck to ground level. He wants comfortable 7-inch risers with 11-inch treads. How many steps, what is the total run, and how long a stringer board does he need?',
        inputs: { totalRise: '56', targetRiserHeight: '7', treadDepth: '11' },
        result: '8 risers at exactly 7.00 inches each, 7 treads, total run = 77 inches (6 ft 5 in), stringer = 95.2 inches (7 ft 11 in), angle = 36.0 degrees. IBC compliant. Comfort check: 2(7) + 11 = 25 (ideal).',
        insight: 'Mark needs one 8-foot 2x12 for each stringer. Since the deck is wider than 36 inches, he should cut 3 stringers. The bottom of the stringer should sit on a concrete pad or buried footing below the frost line to prevent frost heave in Seattle winters.',
      },
      {
        scenario: 'Linda in Boston has a 118-inch total rise from her basement to the first floor. The available horizontal space is limited to 12 feet. Can she fit code-compliant stairs in this space?',
        inputs: { totalRise: '118', targetRiserHeight: '7.5', treadDepth: '10' },
        result: '16 risers at 7.375 inches, 15 treads, total run = 150 inches (12 ft 6 in). Does NOT fit in 12 feet.',
        insight: 'Linda cannot fit code-compliant straight stairs in 12 feet. Solutions: (1) Increase riser height to the IBC max of 7.75 inches, giving 16 risers at 7.375 inches and 150 inches of run (still too long). (2) Add a landing and use an L-shaped or U-shaped staircase, which fits the same run into a smaller footprint. A U-shape with a 3-foot landing splits the run into two 6-foot-3-inch sections, easily fitting in her space with a 3-foot-wide stair.',
      },
    ],
    proTips: [
      'Use the comfort equation, not just code minimums — Code-compliant stairs at 7.75" riser and 10" tread pass inspection but feel steep and uncomfortable. Design to the comfort equation (2R+T=24-25) for stairs you will use every day. A 7" riser with an 11" tread (2R+T=25) is the gold standard.',
      'Buy extra stringer material — A 16-foot 2x12 is a large, expensive board. Most lumber yards allow you to pick through the pile for straight boards with minimal knots. Buy one extra board — if you miscut a stringer, you want a matching board from the same lot rather than making a second trip mid-project.',
      'Account for finished floor thickness — When measuring total rise, account for the finished floor material on both levels. If the upper floor will have 3/4" hardwood and the lower floor will have 1/2" tile, the finished total rise is different from the rough-framing measurement. Measure after both floors are installed or add the thickness differences to your calculation.',
      'Cut the bottom riser shorter — The bottom riser of the stringer must be shortened by the thickness of one tread board. If you do not do this, the first step off the floor will be taller than all other steps by one tread thickness. This is the single most common stair-building mistake for beginners.',
      'Check local amendments to IBC — Many jurisdictions adopt the IBC with local amendments. Some require residential risers not to exceed 7.5 inches (stricter than the IBC 7.75"). Some require closed risers for all interior stairs. Check with your local building department before cutting stringers.',
    ],
    limitations: [
      'This calculator is designed for straight-run stairs with uniform rise and run. Curved, spiral, or winder staircases require specialized geometry calculations and additional code provisions (IBC 1011.7-1011.10) that are beyond the scope of this tool.',
      'The IBC compliance check covers the two most commonly flagged dimensions (maximum riser height and minimum tread depth). It does not verify other IBC requirements including: minimum headroom (80 inches), minimum stair width (36 inches for residential), handrail height and graspability, guardrail height and baluster spacing, or landing requirements for rises exceeding 12 feet.',
      'Stringer length calculation assumes typical residential construction with 2x12 lumber. For commercial stairs with steel stringers, concrete stairs, or stairs with intermediate landings, consult a structural engineer or architect for design and shop drawings.',
      'This tool provides design guidance for planning purposes only. When not to use: for stairs in commercial assembly occupancies (different riser/tread requirements apply), for egress stairs in buildings over 3 stories, or for stairs designed to meet ADA accessibility standards (which have different slope and landing requirements).',
    ],
    commonUses: [
      'Deck stair construction — design exterior stairs from deck to grade with IBC-compliant rise and run, accounting for ground slope and footing requirements',
      'Basement stair planning — calculate the optimal stair layout within limited floor space, using minimum tread depths and maximum riser heights to fit the available footprint',
      'Interior staircase renovation — redesign existing stairs to meet modern comfort standards while working within the existing stairwell opening dimensions',
      'Attic access stair design — calculate steep but code-compliant stairs for attic conversions where space is at a premium',
    ],
    citations: [
      { source: 'International Building Code (IBC) 2024 - Chapter 10: Means of Egress', url: 'https://codes.iccsafe.org/' },
      { source: 'Wikipedia - Stair', url: 'https://en.wikipedia.org/wiki/Stair' },
      { source: 'Blondel, Francois - Cours d Architecture (1675) - Origin of the comfort equation', url: 'https://en.wikipedia.org/wiki/Fran%C3%A7ois_Blondel' },
    ],
  },
};

export default stairConfig;
