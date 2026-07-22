import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ShoeSizePanel from './ShoeSizePanel';

// ── Conversion Tables ──────────────────────────────────────────────────────

interface ShoeSizeRow {
  us: number;
  uk: number;
  eu: number;
  jp: number;
}

const MENS: ShoeSizeRow[] = [
  { us: 6, uk: 5.5, eu: 39, jp: 24.5 },
  { us: 6.5, uk: 6, eu: 39, jp: 25 },
  { us: 7, uk: 6.5, eu: 40, jp: 25.5 },
  { us: 7.5, uk: 7, eu: 40.5, jp: 26 },
  { us: 8, uk: 7.5, eu: 41, jp: 26.5 },
  { us: 8.5, uk: 8, eu: 42, jp: 27 },
  { us: 9, uk: 8, eu: 42.5, jp: 27.5 },
  { us: 9.5, uk: 8.5, eu: 43, jp: 28 },
  { us: 10, uk: 9, eu: 43.5, jp: 28.5 },
  { us: 10.5, uk: 9.5, eu: 44, jp: 29 },
  { us: 11, uk: 10, eu: 44.5, jp: 29.5 },
  { us: 11.5, uk: 10.5, eu: 45, jp: 30 },
  { us: 12, uk: 11, eu: 46, jp: 30.5 },
  { us: 13, uk: 12, eu: 47, jp: 31.5 },
  { us: 14, uk: 13, eu: 48, jp: 32.5 },
  { us: 15, uk: 14, eu: 49, jp: 33.5 },
];

const WOMENS: ShoeSizeRow[] = [
  { us: 5, uk: 3, eu: 36, jp: 22 },
  { us: 5.5, uk: 3.5, eu: 36.5, jp: 22.5 },
  { us: 6, uk: 4, eu: 37, jp: 23 },
  { us: 6.5, uk: 4.5, eu: 37.5, jp: 23.5 },
  { us: 7, uk: 5, eu: 38, jp: 24 },
  { us: 7.5, uk: 5.5, eu: 38.5, jp: 24.5 },
  { us: 8, uk: 6, eu: 39, jp: 25 },
  { us: 8.5, uk: 6.5, eu: 40, jp: 25.5 },
  { us: 9, uk: 7, eu: 40.5, jp: 26 },
  { us: 9.5, uk: 7.5, eu: 41, jp: 26.5 },
  { us: 10, uk: 8, eu: 42, jp: 27 },
  { us: 10.5, uk: 8.5, eu: 42.5, jp: 27.5 },
  { us: 11, uk: 9, eu: 43, jp: 28 },
  { us: 12, uk: 10, eu: 44, jp: 29 },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────

/** Find the nearest table row for a given size key in a table. Returns index and row. */
function findClosest(
  table: ShoeSizeRow[],
  key: keyof ShoeSizeRow,
  target: number,
): { idx: number; row: ShoeSizeRow } | null {
  if (table.length === 0) return null;
  let best = 0;
  let bestDiff = Math.abs(table[0][key] - target);
  for (let i = 1; i < table.length; i++) {
    const d = Math.abs(table[i][key] - target);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return { idx: best, row: table[best] };
}

/** Linear interpolation between two rows for all fields. */
function interpolate(
  a: ShoeSizeRow,
  b: ShoeSizeRow,
  key: keyof ShoeSizeRow,
  target: number,
): ShoeSizeRow {
  const t = b[key] - a[key];
  if (t === 0) return { ...a };
  const frac = (target - a[key]) / t;
  return {
    us: a.us + (b.us - a.us) * frac,
    uk: a.uk + (b.uk - a.uk) * frac,
    eu: a.eu + (b.eu - a.eu) * frac,
    jp: a.jp + (b.jp - a.jp) * frac,
  };
}

/** Format a shoe size number. Shows up to 2 decimal places, stripping trailing zeros. */
function fmt(n: number): string {
  if (n % 1 === 0) return n.toFixed(0);
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, '');
}

/** Look up all 4 sizes from a table using a given key and target value. */
function lookup(
  table: ShoeSizeRow[],
  key: keyof ShoeSizeRow,
  target: number,
): ShoeSizeRow | null {
  const closest = findClosest(table, key, target);
  if (!closest) return null;

  // Exact match?
  if (closest.row[key] === target) return { ...closest.row };

  // Check if target is between two consecutive entries
  const i = closest.idx;
  if (target < closest.row[key]) {
    if (i > 0) return interpolate(table[i - 1], table[i], key, target);
    // Off the low end: extrapolate from first two
    return interpolate(table[0], table[1], key, target);
  }
  // target > closest.row[key]
  if (i < table.length - 1) return interpolate(table[i], table[i + 1], key, target);
  // Off the high end: extrapolate from last two
  return interpolate(table[table.length - 2], table[table.length - 1], key, target);
}

// ── Config ──────────────────────────────────────────────────────────────────

const shoeSizeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'size',
      label: 'Your Size',
      type: 'number',
      min: 0,
      step: 0.5,
      placeholder: 'e.g., 9',
    },
    {
      id: 'fromRegion',
      label: 'From Region',
      type: 'select',
      options: [
        { label: 'US (Men)', value: 'us_m' },
        { label: 'US (Women)', value: 'us_w' },
        { label: 'UK', value: 'uk' },
        { label: 'EU', value: 'eu' },
        { label: 'Japan / CM', value: 'jp' },
      ],
      defaultValue: 'us_m',
    },
    {
      id: 'gender',
      label: 'Gender (for US)',
      type: 'select',
      options: [
        { label: 'Men / Unisex', value: 'M' },
        { label: 'Women', value: 'F' },
      ],
      defaultValue: 'M',
      helpText: 'Affects US-to-international conversion',
    },
  ],
  calculate: (values) => {
    const sizeStr = values.size;
    const fromRegion = values.fromRegion || 'us_m';
    const gender = values.gender || 'M';

    // Validate
    const size = parseFloat(sizeStr);
    if (isNaN(size) || size <= 0) return [];

    // Select the appropriate table
    const useMen = gender === 'M';
    let table: ShoeSizeRow[];
    let genderLabel: string;

    // Determine which table to use for lookup
    if (fromRegion === 'us_w') {
      table = WOMENS;
      genderLabel = useMen ? "Men's Sizing" : "Women's Sizing";
    } else if (fromRegion === 'us_m') {
      table = MENS;
      genderLabel = "Men's Sizing";
    } else {
      // For UK, EU, JP we use the men's table by default, women's if gender=F and fromRegion allows
      table = useMen ? MENS : WOMENS;
      genderLabel = useMen ? "Men's Sizing" : "Women's Sizing";
    }

    // Determine which key in the table matches the input
    const keyMap: Record<string, keyof ShoeSizeRow> = {
      us_m: 'us',
      us_w: 'us',
      uk: 'uk',
      eu: 'eu',
      jp: 'jp',
    };
    const key = keyMap[fromRegion] || 'us';

    const row = lookup(table, key, size);
    if (!row) return [];

    const footLength =
      fromRegion === 'jp'
        ? size
        : row.jp;

    return [
      {
        id: 'usSize',
        label: 'US Size',
        value: fmt(row.us),
      },
      {
        id: 'ukSize',
        label: 'UK Size',
        value: fmt(row.uk),
      },
      {
        id: 'euSize',
        label: 'EU Size',
        value: fmt(row.eu),
      },
      {
        id: 'jpSize',
        label: 'Japan / CM',
        value: fmt(row.jp),
      },
      {
        id: 'footLength',
        label: 'Foot Length',
        value: `${fmt(footLength)} cm`,
      },
      {
        id: 'genderLabel',
        label: 'Size System',
        value: genderLabel,
      },
      {
        id: 'conversionNote',
        label: 'Note',
        value:
          'Sizes may vary by brand. Always try on when possible.',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ShoeSizePanel, { values, results });
  },
  educational: {
    formula:
      'US → UK → EU → JP conversion using standardised adult shoe size tables with linear interpolation for intermediate sizes.',
    formulaDescription:
      'Shoe size systems vary by region and use fundamentally different measurement units and scales. US sizing is based on barleycorns (1/3 inch per size), UK sizing follows a similar but offset scale, EU sizing uses Paris points (2/3 cm per size), and Japanese sizing directly measures foot length in centimetres. This converter maps between all four systems using established conversion tables with linear interpolation to handle half sizes and intermediate values that fall between standard table entries.',
    variables: [
      {
        symbol: 'US & UK',
        name: 'US & UK Sizing',
        description:
          'US sizing uses barleycorns (1/3 inch increments), with men\'s and women\'s scales differing by ~1.5–2 sizes. UK sizing uses the same system but is offset: US Men\'s 9 = UK 8.',
      },
      {
        symbol: 'EU',
        name: 'EU Size',
        description:
          'European shoe sizing based on the Paris point (2/3 cm per size). Does not distinguish between genders. Ranges from 35-36 (small adult) to 48-49 (large adult).',
      },
      {
        symbol: 'JP',
        name: 'Japan / CM',
        description:
          'Japanese shoe sizing measured directly in centimetres of foot length. The most objective and reproducible system — just measure your foot in cm. No gender or brand variations.',
      },
    ],
    howToUse: [
      'Enter your shoe size in the input field — whole and half sizes are supported.',
      'Select the region and gender system you are starting from (US Men, US Women, UK, EU, or JP/CM).',
      'Read your converted sizes across all four major systems displayed simultaneously.',
      'Use the foot length in centimetres as the most reliable cross-reference between systems.',
    ],
    explanation:
      'Shoe size conversion is complicated because different countries developed their measurement systems independently using different units and zero points. US sizing uses barleycorns (1/3 inch per size), EU sizing uses Paris points (2/3 cm), UK sizing is similar to US but shifted by one size, and Japanese sizing directly measures the foot in centimetres. This calculator uses standardised conversion tables with linear interpolation to handle any input size, including half sizes and intermediate values that do not appear in the standard lookup tables. Note that shoe sizes are inherently approximate — even within the same system, different brands and styles (athletic vs dress shoes, sneakers vs boots) may fit differently due to different lasts (the molds around which shoes are built), materials, and intended use. The foot length in centimetres is the most objective measurement because it bypasses all the regional conventions and directly represents the physical length of your foot.',
    faqs: [
      {
        question: 'Why do US men\'s and women\'s sizes differ?',
        answer:
          'US women\'s sizing typically runs about 1.5 to 2 sizes larger than men\'s for the same foot length. A US Men\'s 9 is roughly equivalent to a US Women\'s 10.5. This historical difference stems from separate lasts (shoe molds) developed for men\'s and women\'s footwear manufacturing and reflects different average foot shapes and sizing conventions established decades ago. Both men\'s and women\'s scales use the same barleycorn (1/3 inch) increment system.',
      },
      {
        question: 'Is JP/CM the most accurate sizing?',
        answer:
          'Yes — Japanese sizing directly measures foot length in centimetres, making it the most objective, reproducible, and brand-independent system. If you know your foot length in cm (measured while standing), you can convert to any other system with reasonable accuracy. This is why JP/CM is often used as the anchor for conversion tables. To measure, place a piece of paper against a wall, stand on it with your heel touching the wall, mark the longest toe, and measure the distance in cm.',
      },
      {
        question: 'How do I measure my foot length at home?',
        answer:
          'Place a piece of paper on a hard floor against a wall. Stand on the paper with your heel touching the wall. Mark the position of your longest toe (which may not be your big toe). Measure the distance from the wall edge to your mark in centimetres. Repeat for both feet and use the larger measurement. Do this at the end of the day when feet are slightly swollen for the most accurate fit. Also measure while wearing the type of socks you plan to wear with the shoes.',
      },
      {
        question: 'Why do my sizes vary between brands?',
        answer:
          'Shoe sizing is not standardised across manufacturers. A US size 9 in Nike may fit differently than a US size 9 in Adidas, New Balance, or Cole Haan. Several factors contribute: different lasts (the 3D mold around which shoes are built), different materials (leather stretches differently than mesh or synthetics), different intended uses (running shoes fit snugger than casual shoes), and different target markets. Always check the brand\'s specific size chart or try shoes on when possible.',
      },
      {
        question: 'Can I convert children\'s shoe sizes with this calculator?',
        answer: 'This calculator covers standard adult shoe sizing ranges. Children\'s shoe sizes use different scales and conversion tables. US children\'s sizes typically run from 0-13 (toddler/child), while youth sizes bridge the gap to adult sizes. Many brands provide separate size charts for children\'s and adult footwear, and the conversion between them does not follow the same linear relationships as adult sizes.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Shoe Size', url: 'https://en.wikipedia.org/wiki/Shoe_size' },
      { source: 'ASTM F539 - Standard Practice for Fitting of Athletic Footwear', url: 'https://www.astm.org/f0539-21.html' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Shoe Size Conversion</text><ellipse cx="160" cy="110" rx="55" ry="70" fill="var(--svg-f0f4ff)" stroke="var(--svg-3b82f6)" stroke-width="2"/><path d="M120 85 Q130 65 150 60 Q170 55 185 65 Q195 75 195 90" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="160" y="138" text-anchor="middle" font-size="9" fill="var(--svg-555555)">Foot Length</text><line x1="160" y1="42" x2="160" y2="178" stroke="var(--svg-ef4444)" stroke-width="1.5" stroke-dasharray="4"/><polygon points="155,46 160,38 165,46" fill="var(--svg-ef4444)"/><polygon points="155,174 160,182 165,174" fill="var(--svg-ef4444)"/><rect x="15" y="148" width="60" height="20" rx="4" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="45" y="163" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)" font-weight="bold">US 9</text><rect x="85" y="148" width="60" height="20" rx="4" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="115" y="163" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)" font-weight="bold">UK 8</text><rect x="155" y="148" width="60" height="20" rx="4" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="185" y="163" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)" font-weight="bold">EU 42</text><rect x="225" y="148" width="60" height="20" rx="4" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="255" y="163" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)" font-weight="bold">JP 27</text><text x="160" y="193" text-anchor="middle" font-size="9" fill="var(--svg-888888)">US: barleycorns (⅓ inch)  |  EU: Paris points (⅔ cm)  |  JP: cm</text></svg>',
      alt: 'Foot outline with shoe size conversion showing US, UK, EU, and JP sizes',
      caption: 'Shoe size systems use different units: US/UK use barleycorns, EU uses Paris points, JP measures foot length in cm.',
    },
  },
};

export default shoeSizeConfig;
