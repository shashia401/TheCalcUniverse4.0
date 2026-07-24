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
      placeholder: 'e.g., 105',
      helpText: 'Total vertical height from floor to floor',
    },
    {
      id: 'targetRiserHeight',
      label: 'Desired Riser Height (in)',
      type: 'number',
      min: 1,
      step: 0.125,
      placeholder: 'e.g., 7',
      helpText: 'Typical riser: 7 inches',
      defaultValue: '7',
    },
    {
      id: 'treadDepth',
      label: 'Tread Depth (inches)',
      type: 'number',
      min: 1,
      step: 0.25,
      placeholder: 'e.g., 11',
      helpText: 'Typical tread: 11 inches',
      defaultValue: '11',
    },
    {
      id: 'stringerThickness',
      label: 'Stringer Thickness (inches)',
      type: 'number',
      min: 0,
      step: 0.5,
      placeholder: 'e.g., 1.5',
      helpText: 'Typically 1.5" for 2x12 lumber',
      defaultValue: '1.5',
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
      helpText: 'Nosing overhang beyond the stringer face',
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

    const formatInches = (inches: number): string => {
      const ft = Math.floor(inches / 12);
      const rem = inches % 12;
      const unit = values.unitSystem === 'ft' && ft > 0
        ? `${ft}' ${rem.toFixed(2)}"`
        : `${inches.toFixed(2)}"`;
      return unit;
    };

    const stairData = JSON.stringify({
      numberOfRisers,
      actualRiserHeight: parseFloat(actualRiserHeight.toFixed(4)),
      numberOfTreads,
      totalRunIn: parseFloat(totalRunIn.toFixed(4)),
      stringerLength: parseFloat(stringerLength.toFixed(4)),
      angleDeg: parseFloat(angleDeg.toFixed(2)),
      ibcCompliant,
      treadDepth: parseFloat(treadDepth.toFixed(4)),
      unitSystem: values.unitSystem || 'in',
    });

    return [
      {
        id: 'numberOfSteps',
        label: 'Number of Steps',
        value: `${numberOfRisers} steps`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'riserHeight',
        label: 'Riser Height',
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
        id: 'ibcStatus',
        label: 'IBC Compliance',
        value: ibcCompliant
          ? '✅ Passes IBC requirements'
          : '⚠️ Warning: Does not meet IBC standards',
        color: ibcCompliant ? 'positive' : 'negative',
      },
      {
        id: 'materialRecommendation',
        label: 'Stringer Recommendation',
        value: '2x12 lumber recommended',
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
      'Risers = ceil(TotalRise / RiserHeight) | TotalRun = Treads x TreadDepth | Stringer = sqrt(Rise^2 + Run^2)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Stair Rise / Run Profile</text><!-- Stringer diagonal --><line x1="50" y1="170" x2="270" y2="50" stroke="var(--svg-3b82f6)" stroke-width="2"/><!-- Treads and risers --><polyline points="50,170 80,147 80,147 80,124 110,101 110,101 110,78 140,55 140,55 140,50" fill="none" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linejoin="round"/><line x1="50" y1="170" x2="270" y2="170" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="4,3"/><!-- Rise label --><line x1="35" y1="170" x2="35" y2="124" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="30" y="150" text-anchor="end" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Riser</text><!-- Run label --><line x1="50" y1="180" x2="80" y2="180" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="65" y="192" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Tread</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">IBC: max riser 7.75 in, min tread 10 in</text></svg>',
      alt: 'Stair profile diagram showing riser height and tread depth with stringer',
      caption: 'Stair geometry: riser = vertical, tread = horizontal, stringer = diagonal',
    },
    formulaDescription:
      'Stair stringer layout follows the Pythagorean theorem. The number of risers is determined by dividing total rise by desired riser height and rounding up, then the exact riser height is recalculated.',
    variables: [
      {
        symbol: 'Rise & Run',
        name: 'Total Rise & Total Run',
        description: 'Rise is the total vertical height from finished floor to finished floor. Run is the total horizontal distance covered by the staircase. These two values determine the stair angle and stringer length.',
      },
      {
        symbol: 'Stringer',
        name: 'Stringer Length',
        description: 'Diagonal length of the stair stringer board, typically a 2x12.',
      },
      {
        symbol: 'IBC',
        name: 'IBC Limits',
        description: 'International Building Code: max riser 7.75", min tread 10".',
      },
    ],
    howToUse: [
      'Measure the total vertical rise from finished floor to finished floor.',
      'Enter your desired riser height (typically 7 inches).',
      'Enter your desired tread depth (typically 11 inches).',
      'Review the calculated number of steps, stringer dimensions, and IBC compliance status.',
    ],
    explanation:
      'Stair design balances comfort, safety, and code compliance. The IBC limits risers to 7.75 inches maximum and treads to 10 inches minimum. The stringer is cut from a 2x12 board following the rise and run measurements. The stair angle typically falls between 30 and 50 degrees for comfortable ascent. Practical example: a total rise of 105 inches with a desired riser of 7 inches yields 105 / 7 = 15 risers exactly. With 14 treads at 11 inches depth, the total run is 14 × 11 = 154 inches (12 feet 10 inches). The stringer length is sqrt(105² + 154²) = sqrt(11025 + 23716) = sqrt(34741) = 186.4 inches (15 feet 6 inches). The angle is arctan(105/154) = 34.3 degrees, which falls in the comfortable range. Edge cases: for exterior stairs exposed to snow and ice, consider using open treads or adding heating elements to prevent ice buildup. For spiral or curved staircases, the inside radius must be at least twice the stair width to meet code. When the total rise results in fractional risers (e.g., 105.5 inch rise with 7 inch desired riser), the calculator rounds up to 16 risers, giving an actual riser of 6.59 inches. For basement stairs with limited headroom, a steeper angle up to 42 degrees may be acceptable, but any angle above 45 degrees should require a landing or an alternating tread design.',
    faqs: [
      {
        question: 'What is the ideal stair angle?',
        answer:
          'The ideal stair angle is between 30 and 35 degrees for comfortable ascent. Stairs steeper than 45 degrees may require alternating tread designs or become climbing ladders.',
      },
      {
        question: 'Why 2x12 for stringers?',
        answer:
          'A 2x12 provides sufficient depth (11.25 inches actual) for cutting stair notches while maintaining structural integrity. The minimum recommended stringer width is 2x10, but 2x12 is preferred.',
      },
      {
        question: 'What if my stairs do not pass IBC?',
        answer:
          'If the riser exceeds 7.75 inches, try increasing the number of steps. If the tread is under 10 inches, you may need a longer staircase. Adjust your desired riser height downward to increase step count.',
      },
    ],
    citations: [
      { source: 'International Building Code (IBC) - Stairway Requirements', url: 'https://codes.iccsafe.org/' },
      { source: 'Wikipedia - Stair', url: 'https://en.wikipedia.org/wiki/Stair' },
    ],
  },
};

export default stairConfig;
