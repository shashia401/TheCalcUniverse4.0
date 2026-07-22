import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import BraSizePanel from './BraSizePanel';

const cupLetters = [
  'AA', 'A', 'B', 'C', 'D', 'DD', 'DDD', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
];

function getCupSize(diffInches: number): string {
  if (diffInches < 0) return 'AA';
  const idx = Math.min(Math.max(Math.round(diffInches), 0), cupLetters.length - 1);
  return cupLetters[idx];
}

function getBandSize(underbustSnug: number, unit: string): number {
  // Convert to inches if in cm
  const bandInches = unit === 'cm' ? underbustSnug / 2.54 : underbustSnug;

  // Round to nearest even number
  let band = Math.round(bandInches / 2) * 2;

  // Special cases for very small ribcages
  if (bandInches < 24) band = 24;
  else if (bandInches < 27) band = 26;

  return band;
}

interface SisterSize {
  band: number;
  cup: string;
  size: string;
}

function getSisterSizes(band: number, cupIndex: number): { sisterDown: SisterSize; sisterUp: SisterSize } {
  // Sister down: smaller band, larger cup
  const downBand = band - 2;
  const downCupIndex = Math.min(cupIndex + 1, cupLetters.length - 1);
  const sisterDown: SisterSize = {
    band: downBand,
    cup: cupLetters[downCupIndex],
    size: `${downBand}${cupLetters[downCupIndex]}`,
  };

  // Sister up: larger band, smaller cup
  const upBand = band + 2;
  const upCupIndex = Math.max(cupIndex - 1, 0);
  const sisterUp: SisterSize = {
    band: upBand,
    cup: cupLetters[upCupIndex],
    size: `${upBand}${cupLetters[upCupIndex]}`,
  };

  return { sisterDown, sisterUp };
}

const braSizeCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit',
      type: 'select',
      options: [
        { label: 'Inches', value: 'in' },
        { label: 'Centimeters', value: 'cm' },
      ],
    },
    {
      id: 'underbustLoose',
      label: 'Underbust (Loose)',
      type: 'number',
      min: 20,
      max: 60,
      step: 0.1,
      helpText: 'Loose measurement around ribcage, just below bust',
    },
    {
      id: 'underbustSnug',
      label: 'Underbust (Snug)',
      type: 'number',
      min: 20,
      max: 60,
      step: 0.1,
      helpText: 'Snug but not tight',
    },
    {
      id: 'underbustTight',
      label: 'Underbust (Tight)',
      type: 'number',
      min: 20,
      max: 60,
      step: 0.1,
      helpText: 'Tight, exhaled — as tight as possible',
    },
    {
      id: 'bustStanding',
      label: 'Bust (Standing)',
      type: 'number',
      min: 20,
      max: 70,
      step: 0.1,
      helpText: 'Around fullest part while standing',
    },
    {
      id: 'bustLeaning',
      label: 'Bust (Leaning)',
      type: 'number',
      min: 20,
      max: 70,
      step: 0.1,
      helpText: 'Leaning forward 90°, bust parallel to floor',
    },
    {
      id: 'bustLying',
      label: 'Bust (Lying Down)',
      type: 'number',
      min: 20,
      max: 70,
      step: 0.1,
      helpText: 'Lying on your back',
    },
  ],
  calculate: (values) => {
    const unit = values.unit || 'in';
    const underbustSnug = parseFloat(values.underbustSnug);
    const bustStanding = parseFloat(values.bustStanding);

    if (isNaN(underbustSnug) || isNaN(bustStanding)) {
      return [];
    }

    // Convert all measurements to inches for calculations
    const toInches = (v: number): number => (unit === 'cm' ? v / 2.54 : v);
    const snugInches = toInches(underbustSnug);

    // Band size
    const band = getBandSize(underbustSnug, unit);

    // Bust average
    const bustLeaning = parseFloat(values.bustLeaning);
    const bustLying = parseFloat(values.bustLying);

    let bustTotal = bustStanding;
    let bustCount = 1;

    if (!isNaN(bustLeaning)) {
      bustTotal += bustLeaning;
      bustCount++;
    }
    if (!isNaN(bustLying)) {
      bustTotal += bustLying;
      bustCount++;
    }

    // Convert bust average to inches for cup calculation
    const bustAvg = bustTotal / bustCount;
    const bustAvgInches = toInches(bustAvg);

    const diffInches = bustAvgInches - snugInches;
    const cupSize = getCupSize(diffInches);
    const cupIndex = cupLetters.indexOf(cupSize);
    const fullSize = `${band}${cupSize}`;

    const { sisterDown, sisterUp } = getSisterSizes(band, cupIndex);

    const measurements = {
      unit,
      underbustLoose: values.underbustLoose || null,
      underbustSnug: values.underbustSnug,
      underbustTight: values.underbustTight || null,
      bustStanding: values.bustStanding,
      bustLeaning: values.bustLeaning || null,
      bustLying: values.bustLying || null,
      bustAverage: parseFloat((bustTotal / bustCount).toFixed(2)),
      bandInches: parseFloat(snugInches.toFixed(2)),
      difference: parseFloat(diffInches.toFixed(2)),
    };

    return [
      {
        id: 'size',
        label: 'Recommended Size',
        value: fullSize,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'bandSize',
        label: 'Band Size',
        value: String(band),
      },
      {
        id: 'cupSize',
        label: 'Cup Size',
        value: cupSize,
      },
      {
        id: 'sisterSizes',
        label: 'Sister Sizes',
        value: JSON.stringify({ sisterDown, sisterUp }),
      },
      {
        id: 'measurements',
        label: 'Measurements Used',
        value: JSON.stringify(measurements),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BraSizePanel, { values, results });
  },
  educational: {
    formula:
      'Band = Round(Snug Underbust) to nearest even | Cup = Bust Average − Band',
    formulaDescription:
      'Modern bra sizing uses multiple bust measurements (standing, leaning, and lying) for greater accuracy, recognizing that breast tissue distributes differently in each position. The band size is the snug underbust measurement rounded to the nearest even number. The cup size is the difference between the average of the three bust measurements and the band measurement, mapped to cup letters (1 inch = A, 2 inches = B, 3 inches = C, etc.). Sister sizes provide alternative band/cup combinations that hold the same volume.',
    variables: [
      {
        symbol: 'Band, Cup',
        name: 'Band & Cup Size',
        description: 'Band is the underbust rounded to the nearest even. Cup is the difference between average bust and underbust mapped to a letter (1" = A, 2" = B, etc.). Together they form your size (e.g., 34C).',
      },
      {
        symbol: 'Avg Bust',
        name: 'Average Bust',
        description: 'The arithmetic mean of the standing, leaning, and lying bust measurements. Using the average smooths out measurement variations and provides a more representative bust circumference.',
      },
      {
        symbol: 'Sister',
        name: 'Sister Size',
        description: 'An alternative size combination where the band changes by ±2 inches and the cup changes by ±1 step to maintain approximately the same cup volume. Useful when your recommended size is not available.',
      },
    ],
    howToUse: [
      'Select your preferred measurement unit: inches or centimeters.',
      'Take all six measurements carefully using a soft, flexible measuring tape. Measure snug but not tight.',
      'Enter each measurement in the corresponding input field — standing bust, leaning bust, lying bust, snug underbust, tight underbust.',
      'View your calculated band size, cup size, full bra size, sister sizes, and a detailed measurement breakdown.',
      'Check sister sizes — if your exact size is unavailable, these alternatives hold the same cup volume.',
    ],
    explanation:
      'Traditional bra fitting uses just two measurements (underbust and standing bust) with an outdated "+4" method that adds 4 inches to the band size — a practice from an era when bras were made of non-stretchy materials. Modern bras contain elastic fabrics that provide support through a snug band, not an artificially inflated one. Adding 4 inches puts most of the support on the straps instead of the band, leading to poor fit, shoulder pain, and inadequate support. This calculator follows the "A Bra That Fits" (ABTF) methodology, developed by the bra-fitting community, which uses six measurements to account for the fact that breast tissue distributes differently when standing, leaning forward at 90 degrees, and lying down. This multi-position approach gives a much more accurate starting point for finding well-fitting bras. Many people who use this method discover they have been wearing the wrong size for years — often a band that is too large and a cup that is too small. No single measurement tells the whole story, which is why the three-position bust averaging is central to this approach.',
    faqs: [
      {
        question: 'What are sister sizes and how do I use them?',
        answer:
          "Sister sizes are alternative bra sizes that hold approximately the same cup volume but on a different band length. For example, if your recommended size is 34C, the sister size down is 32D (smaller band, one cup larger) and the sister size up is 36B (larger band, one cup smaller). Sister sizes are useful when your exact size is not available at a store, or when you need a slightly different fit. However, the band should always be snug on the loosest hook — that is where most of the support comes from, not the straps. If you try a sister size, use a bra extender if the band needs slight adjustment.",
      },
      {
        question: "Why is the traditional '+4' method outdated?",
        answer:
          "The '+4' method was developed decades ago when bras were primarily made of non-elastic materials like cotton and needed extra room for movement. Modern bras contain elastane, spandex, and other stretchy fabrics that provide support through a snug, well-fitting band at your actual underbust measurement. Adding 4 inches shifts the band too large and the cups too small, putting most of the support on the straps. This leads to red marks from straps digging in, shoulder pain, the band riding up the back, and overall inadequate support. The ABTF method uses your actual underbust measurement for a band that fits correctly from day one.",
      },
      {
        question: 'How do I know if a bra fits correctly?',
        answer: 'A well-fitting bra has: a band that is level all the way around and snug on the loosest hook (you should be able to fit two fingers under it), cups that contain all breast tissue without spillage at the top or sides, a center gore that lies flat against the sternum, straps that do not dig in or slip off, and no red marks or discomfort after wearing. If the band rides up in the back, it is too large. If you have spillage or the gore does not lie flat, the cups are too small or the wrong shape.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Bra Size', url: 'https://en.wikipedia.org/wiki/Bra_size' },
      { source: 'ASTM D5585 - Standard Table of Body Measurements for Adult Female Misses Figure Type', url: 'https://www.astm.org/d5585_d5585m-21.html' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Bra Size Calculation</text><rect x="15" y="30" width="290" height="80" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="50" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Band = Snug Underbust → nearest even</text><text x="160" y="66" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Cup = Avg Bust − Band</text><text x="160" y="98" text-anchor="middle" font-size="9" fill="var(--svg-888888)">1" = A  |  2" = B  |  3" = C  |  4" = D  |  5" = DD  |  6" = DDD</text><rect x="15" y="118" width="290" height="72" rx="6" fill="var(--svg-fff5f5)" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="160" y="140" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Sister Sizes (same cup volume)</text><rect x="30" y="152" width="75" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="67" y="168" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">32D ↓</text><rect x="122" y="152" width="75" height="24" rx="4" fill="var(--svg-ef4444)"/><text x="159" y="168" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">34C ★</text><rect x="214" y="152" width="75" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="251" y="168" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">36B ↑</text><text x="160" y="193" text-anchor="middle" font-size="9" fill="var(--svg-888888)">Sister sizes: ±2 band, ∓1 cup (same approximate volume)</text></svg>',
      alt: 'Bra size diagram showing band and cup calculation with sister sizes',
      caption: 'Modern bra sizing uses the snug underbust for band and average of 3 bust measurements for cup, plus sister sizes.',
    },
  },
};

export default braSizeCalculatorConfig;
