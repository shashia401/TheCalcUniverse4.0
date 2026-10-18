import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import StairPanel from './StairPanel';
import { parseNonNegative } from '../../../utils/parseNumber';

// Code limits. 7 3/4" riser / 10" tread are the RESIDENTIAL limits (IRC R311.7.5); the IBC (commercial) is stricter:
// 7" riser / 11" tread. The old text called the residential numbers "IBC".
const IRC_MAX_RISER = 7.75;
const IRC_MIN_TREAD = 10;
const IBC_MAX_RISER = 7;
const IBC_MIN_TREAD = 11;

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
      id: 'unitSystem',
      label: 'Units',
      type: 'select',
      options: [
        { label: 'Inches', value: 'in' },
        { label: 'Feet + Inches', value: 'ft' },
      ],
      defaultValue: 'in',
    },
  ],
  calculate: (values) => {
    const totalRise = parseNonNegative(values.totalRise, 1000);
    const targetRiserHeight = parseNonNegative(values.targetRiserHeight || '7', 1000);
    const treadDepth = parseNonNegative(values.treadDepth || '11', 1000);

    if (
      isNaN(totalRise) || totalRise <= 0 ||
      isNaN(targetRiserHeight) || targetRiserHeight <= 0 ||
      isNaN(treadDepth) || treadDepth <= 0
    ) {
      return [];
    }

    // The epsilon stops 7.7 / 1.1 = 7.000000000000001 from asking for an extra riser.
    const numberOfRisers = Math.max(1, Math.ceil(totalRise / targetRiserHeight - 1e-9));
    const actualRiserHeight = totalRise / numberOfRisers;
    const numberOfTreads = numberOfRisers - 1;
    const totalRunIn = numberOfTreads * treadDepth;
    const stringerLength = Math.sqrt(totalRise * totalRise + totalRunIn * totalRunIn);
    const angleDeg = Math.atan(totalRise / (totalRunIn || 1)) * (180 / Math.PI);

    const ircCompliant = actualRiserHeight <= IRC_MAX_RISER + 1e-9 && treadDepth >= IRC_MIN_TREAD;
    const ibcStrict = actualRiserHeight <= IBC_MAX_RISER + 1e-9 && treadDepth >= IBC_MIN_TREAD;
    const ibcCompliant = ircCompliant; // kept as the panel's pass/fail flag: legal for a house, see ibcStatus for commercial
    const comfort = 2 * actualRiserHeight + treadDepth; // the 2R + T comfort rule: 24-25 in feels natural

    const formatInches = (inches: number): string => {
      // Work in hundredths of an inch so 11.996 can never print as 5' 12.00".
      const hundredths = Math.round(inches * 100);
      const ft = Math.floor(hundredths / 1200);
      const rem = (hundredths % 1200) / 100;
      return values.unitSystem === 'ft' && ft > 0
        ? `${ft}' ${rem.toFixed(2)}"`
        : `${(hundredths / 100).toFixed(2)}"`;
    };

    const stairData = JSON.stringify({
      numberOfRisers,
      actualRiserHeight: parseFloat(actualRiserHeight.toFixed(4)),
      numberOfTreads,
      totalRunIn: parseFloat(totalRunIn.toFixed(4)),
      stringerLength: parseFloat(stringerLength.toFixed(4)),
      angleDeg: parseFloat(angleDeg.toFixed(2)),
      ibcCompliant,
      ibcStrict,
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
        highlight: actualRiserHeight <= IRC_MAX_RISER,
        color: actualRiserHeight <= IRC_MAX_RISER ? 'positive' : 'negative',
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
        label: 'Code Check (IRC residential / IBC commercial)',
        value: ibcStrict
          ? '✅ Passes IRC (residential) and IBC (commercial) limits'
          : ircCompliant
            ? '✅ Passes IRC (residential: riser ≤ 7¾", tread ≥ 10") · ⚠️ Does not meet IBC (commercial: riser ≤ 7", tread ≥ 11")'
            : '⚠️ Warning: Does not meet IRC/IBC standards (riser ≤ 7¾" and tread ≥ 10" for a house)',
        color: ircCompliant ? 'positive' : 'negative',
      },
      {
        id: 'comfortRule',
        label: 'Comfort Rule (2 × riser + tread)',
        value: `${comfort.toFixed(1)}" (24-25" feels natural)`,
        color: comfort >= 23.5 && comfort <= 25.5 ? 'positive' : 'neutral',
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
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Stair Rise / Run Profile</text><!-- Stringer diagonal --><line x1="50" y1="170" x2="270" y2="50" stroke="var(--svg-3b82f6)" stroke-width="2"/><!-- Treads and risers --><polyline points="50,170 80,147 80,147 80,124 110,101 110,101 110,78 140,55 140,55 140,50" fill="none" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linejoin="round"/><line x1="50" y1="170" x2="270" y2="170" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="4,3"/><!-- Rise label --><line x1="35" y1="170" x2="35" y2="124" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="30" y="150" text-anchor="end" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Riser</text><!-- Run label --><line x1="50" y1="180" x2="80" y2="180" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="65" y="192" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Tread</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">IRC (houses): max riser 7.75 in, min tread 10 in</text></svg>',
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
        description: 'Residential code (IRC): max riser 7.75", min tread 10". Commercial code (IBC): max riser 7", min tread 11".',
      },
    ],
    howToUse: [
      'Measure the total vertical rise from finished floor to finished floor.',
      'Enter your desired riser height (typically 7 inches).',
      'Enter your desired tread depth (typically 11 inches).',
      'Review the calculated number of steps, stringer dimensions, and the residential (IRC) and commercial (IBC) code check.',
    ],
    explanation:
      'Stair design balances comfort, safety, and code compliance. For houses the IRC limits risers to 7.75 inches maximum and treads to 10 inches minimum; commercial buildings under the IBC are stricter at 7 inches and 11 inches. The stringer is cut from a 2x12 board following the rise and run measurements. The stair angle typically falls between 30 and 50 degrees for comfortable ascent. Practical example: a total rise of 105 inches with a desired riser of 7 inches yields 105 / 7 = 15 risers exactly. With 14 treads at 11 inches depth, the total run is 14 × 11 = 154 inches (12 feet 10 inches). The stringer length is sqrt(105² + 154²) = sqrt(11025 + 23716) = sqrt(34741) = 186.4 inches (15 feet 6 inches). The angle is arctan(105/154) = 34.3 degrees, which falls in the comfortable range. Edge cases: for exterior stairs exposed to snow and ice, consider using open treads or adding heating elements to prevent ice buildup. For spiral or curved staircases, the inside radius must be at least twice the stair width to meet code. When the total rise results in fractional risers (e.g., 105.5 inch rise with 7 inch desired riser), the calculator rounds up to 16 risers, giving an actual riser of 6.59 inches. For basement stairs with limited headroom, a steeper angle up to 42 degrees may be acceptable, but any angle above 45 degrees should require a landing or an alternating tread design.',
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
        question: 'What if my stairs do not pass the code check?',
        answer:
          'If the riser exceeds 7.75 inches, try increasing the number of steps. If the tread is under 10 inches, you may need a longer staircase. Adjust your desired riser height downward to increase step count. For commercial or multi-family work the IBC applies instead and is stricter (7 inch riser, 11 inch tread), and your local code may differ from either, so confirm with your building department.',
      },
    ],
    citations: [
      { source: 'International Building Code (IBC) - Stairway Requirements', url: 'https://codes.iccsafe.org/' },
      { source: 'Wikipedia - Stair', url: 'https://en.wikipedia.org/wiki/Stair' },
    ],
  },
};

export default stairConfig;
