import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import TireSizePanel from './TireSizePanel';

interface TireSpec {
  width: number;
  aspect: number;
  rim: number;
  sidewall: number;
  diameter: number;
  circ: number;
  revs: number;
}

function calcTire(width: number, aspect: number, rim: number): TireSpec {
  const sidewall = width * (aspect / 100);
  const diameter = (2 * sidewall / 25.4) + rim;
  const circ = Math.PI * diameter;
  const revs = 63360 / circ;
  return { width, aspect, rim, sidewall, diameter, circ, revs };
}

const tireSizeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'oemWidth',
      label: 'OEM Tire Width (mm)',
      type: 'number',
      placeholder: 'e.g., 265',
      min: 100,
      max: 400,
      step: 5,
      required: true,
    },
    {
      id: 'oemAspect',
      label: 'OEM Aspect Ratio',
      type: 'number',
      placeholder: 'e.g., 70',
      min: 20,
      max: 100,
      step: 5,
      required: true,
      helpText: 'Percentage sidewall height to width',
    },
    {
      id: 'oemRim',
      label: 'OEM Rim Diameter (in)',
      type: 'number',
      placeholder: 'e.g., 17',
      min: 10,
      max: 30,
      step: 1,
      required: true,
    },
    {
      id: 'newWidth',
      label: 'New Tire Width (mm)',
      type: 'number',
      placeholder: 'e.g., 285',
      min: 100,
      max: 400,
      step: 5,
      required: true,
    },
    {
      id: 'newAspect',
      label: 'New Aspect Ratio',
      type: 'number',
      placeholder: 'e.g., 75',
      min: 20,
      max: 100,
      step: 5,
      required: true,
    },
    {
      id: 'newRim',
      label: 'New Rim Diameter (in)',
      type: 'number',
      placeholder: 'e.g., 18',
      min: 10,
      max: 30,
      step: 1,
      required: true,
    },
  ],
  calculate: (values) => {
    const ow = parseFloat(values.oemWidth);
    const oa = parseFloat(values.oemAspect);
    const or_ = parseFloat(values.oemRim);
    const nw = parseFloat(values.newWidth);
    const na = parseFloat(values.newAspect);
    const nr = parseFloat(values.newRim);

    if ([ow, oa, or_, nw, na, nr].some(isNaN) || ow <= 0 || oa <= 0 || or_ <= 0 || nw <= 0 || na <= 0 || nr <= 0) return [];

    const oem = calcTire(ow, oa, or_);
    const nwTire = calcTire(nw, na, nr);

    const diamDiff = nwTire.diameter - oem.diameter;
    const diamDiffPct = (diamDiff / oem.diameter) * 100;
    const sidewallDiffIn = (nwTire.sidewall - oem.sidewall) / 25.4;
    const revDiff = nwTire.revs - oem.revs;
    const groundClearanceDiff = diamDiff / 2;
    const actualSpeed = 60 * (nwTire.circ / oem.circ);

    const fmt = (n: number) => parseFloat(n.toFixed(2)).toString();

    return [
      {
        id: 'diameterDiff',
        label: 'Diameter Change',
        value: `${fmt(diamDiff)}" (${fmt(diamDiffPct)}%)`,
        highlight: true,
        color: Math.abs(diamDiffPct) < 3 ? 'positive' : 'negative',
      },
      {
        id: 'speedometerError',
        label: 'Speedometer Error',
        value: `When speedo reads 60 mph, actual = ${fmt(actualSpeed)} mph`,
        color: Math.abs(actualSpeed - 60) > 3 ? 'negative' : 'positive',
      },
      {
        id: 'oemDiameter',
        label: 'OEM Diameter',
        value: `${fmt(oem.diameter)}"`,
        color: 'neutral',
      },
      {
        id: 'newDiameter',
        label: 'New Diameter',
        value: `${fmt(nwTire.diameter)}"`,
        color: 'neutral',
      },
      {
        id: 'sidewallDiff',
        label: 'Sidewall Height Change',
        value: `${fmt(sidewallDiffIn)}"`,
        color: 'neutral',
      },
      {
        id: 'revolutionsDiff',
        label: 'Revolutions per Mile Diff',
        value: `${fmt(revDiff)} rev/mile`,
        color: 'neutral',
      },
      {
        id: 'groundClearance',
        label: 'Ground Clearance Change',
        value: `${fmt(groundClearanceDiff)}"`,
        color: 'neutral',
      },
      {
        id: 'tireData',
        label: 'Tire Data',
        value: JSON.stringify({
          oem,
          new: nwTire,
          diff: { diamDiff, diamDiffPct, sidewallDiffIn, revDiff, groundClearanceDiff, actualSpeed },
        }),
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TireSizePanel, { values, results });
  },
  educational: {
    formula: 'Overall Diameter = (2 x Width x AspectRatio / 100 / 25.4) + RimDiameter',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><circle cx="160" cy="100" r="75" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><circle cx="160" cy="100" r="30" fill="none" stroke="var(--svg-ef4444)" stroke-width="2"/><circle cx="160" cy="100" r="30" fill="rgba(239,68,68,0.08)"/><text x="160" y="100" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">Rim</text><line x1="160" y1="25" x2="160" y2="100" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="3,2"/><line x1="160" y1="100" x2="210" y2="55" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="190" y="55" text-anchor="start" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9">Sidewall</text><text x="190" y="68" text-anchor="start" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="8">(Aspect Ratio)</text><line x1="85" y1="115" x2="85" y2="152" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="70" y="138" text-anchor="end" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="9">Width</text><line x1="160" y1="175" x2="235" y2="175" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="197" y="183" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="9">Overall Diameter</text></svg>',
      alt: 'Tire cross-section diagram showing width, sidewall/aspect ratio, rim diameter, and overall diameter',
      caption: 'Tire dimensions: width, aspect ratio, and rim size determine overall diameter',
    },
    formulaDescription:
      'Tire size comparison calculates all dimensional differences between two tire sizes including diameter change, speedometer error, and ground clearance.',
    variables: [
      { symbol: 'Width', name: 'Tire Width (mm)', description: 'The width of the tire in millimeters.' },
      { symbol: 'Aspect Ratio', name: 'Aspect Ratio (%)', description: 'Sidewall height as a percentage of width.' },
      { symbol: 'Rim', name: 'Rim Diameter (in)', description: 'The diameter of the wheel rim in inches.' },
    ],
    howToUse: [
      'Enter the OEM (original) tire size numbers.',
      'Enter the new tire size numbers.',
      'Compare diameter, speedometer error, and clearance.',
      'Keep diameter change under 3% for safe fitment.',
    ],
    explanation:
      'When you change tire sizes, the overall diameter changes which affects speedometer accuracy, ground clearance, and gearing. A difference under 3% is generally considered safe. Larger changes may require recalibration. Practical example: upgrading from a stock 265/70R17 tire to a 285/75R17. The OEM tire has a sidewall of 265 × 0.70 = 185.5 mm and an overall diameter of (2 × 185.5 / 25.4) + 17 = 31.6 inches. The new tire has a sidewall of 285 × 0.75 = 213.75 mm and diameter of (2 × 213.75 / 25.4) + 17 = 33.8 inches. That is a 7% increase, well above the safe 3% threshold — your speedometer would read 60 mph when you are actually going 64 mph. Edge cases: mixing tire sizes on all-wheel-drive vehicles can damage the drivetrain because different diameters force the differentials to work constantly. For lifted trucks, larger tires also affect braking distance and may require a speedometer recalibration module. When fitting winter tires, a slightly narrower tire (one size down in width) often performs better in snow and slush because it concentrates vehicle weight on a smaller contact patch for better traction.',
    faqs: [
      {
        question: 'What is a safe diameter change?',
        answer: 'Most experts recommend keeping the diameter change within +/-3% of the original size. Changes larger than this can affect speedometer accuracy, ABS, traction control, and may cause rubbing.',
      },
      {
        question: 'Will larger tires affect my speedometer?',
        answer: 'Yes. Larger tires travel farther per revolution, so your speedometer reads lower than your actual speed. For example, a 3% larger tire means at 60 mph indicated, you are actually going 61.8 mph.',
      },
      {
        question: 'Can I change rim size and keep the same tire diameter?',
        answer: 'Yes, this is called a "plus sizing" upgrade. Going from 17-inch to 18-inch rims while maintaining the same overall diameter requires a lower aspect ratio tire. For example, a 265/70R17 (31.6 inch diameter) can be replaced with 265/65R18 (31.6 inch) or 265/60R19 (31.5 inch). The rule of thumb: for each inch of rim diameter increase, reduce the aspect ratio by 5-10 points to maintain the same overall diameter. This is why SUV and truck owners can upgrade to larger wheels without affecting speedometer accuracy, as long as the overall diameter stays within 3% of the original. However, larger rims with lower-profile tires provide a harsher ride because there is less sidewall to absorb road imperfections. Off-road enthusiasts should stick with smaller rims and higher aspect ratios for better tire flex and traction on uneven terrain.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Tire Code', url: 'https://en.wikipedia.org/wiki/Tire_code' },
      { source: 'Tire and Rim Association - Standards', url: 'https://www.us-tra.org/' },
    ],
  },
};

export default tireSizeConfig;
