import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import ClothingSizePanel from './ClothingSizePanel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SizeRow {
  us: string;
  uk: string;
  eu: string;
  jp: string;
  intl?: string;
}

interface CategoryTable {
  rows: SizeRow[];
  numericColumns: ('us' | 'uk' | 'eu' | 'jp')[];
  intlColumn: boolean;
}

// ─── Helper to parse size input ───────────────────────────────────────────────

function isNumericValue(val: string): boolean {
  const n = parseFloat(val);
  return !isNaN(n) && val.trim() !== '';
}

function parseNumeric(val: string): number {
  return parseFloat(val.trim());
}

/** Find the closest matching row index for a numeric value in a given column */
function findClosestRow(
  rows: SizeRow[],
  column: 'us' | 'uk' | 'eu' | 'jp',
  target: number,
): number | null {
  if (rows.length === 0) return null;
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < rows.length; i++) {
    const val = parseFloat(rows[i][column]);
    if (isNaN(val)) continue;
    const diff = Math.abs(val - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** Interpolate a numeric value between two rows for a given column */
function interpolateValue(
  rows: SizeRow[],
  colA: 'us' | 'uk' | 'eu' | 'jp',
  colB: 'us' | 'uk' | 'eu' | 'jp',
  idxLow: number,
  idxHigh: number,
  target: number,
): string {
  const valLow = parseFloat(rows[idxLow][colB]);
  const valHigh = parseFloat(rows[idxHigh][colB]);
  const keyLow = parseFloat(rows[idxLow][colA]);
  const keyHigh = parseFloat(rows[idxHigh][colA]);

  if (isNaN(valLow) || isNaN(valHigh) || isNaN(keyLow) || isNaN(keyHigh) || keyHigh === keyLow) {
    return '';
  }

  const frac = (target - keyLow) / (keyHigh - keyLow);
  const result = valLow + (valHigh - valLow) * frac;

  // Format: show integer if whole, up to 1 decimal if fractional
  if (Math.abs(result - Math.round(result)) < 0.05) {
    return Math.round(result).toString();
  }
  return result.toFixed(1);
}

/** Find exact row by matching a numeric column value exactly */
function findExactRow(
  rows: SizeRow[],
  column: 'us' | 'uk' | 'eu' | 'jp',
  target: number,
): SizeRow | null {
  for (const row of rows) {
    const val = parseFloat(row[column]);
    if (!isNaN(val) && Math.abs(val - target) < 0.01) {
      return row;
    }
  }
  return null;
}

/** Find exact row by matching a string column (e.g., International letter) */
function findExactStringRow(
  rows: SizeRow[],
  column: 'intl',
  target: string,
): SizeRow | null {
  const t = target.trim().toUpperCase();
  for (const row of rows) {
    if ((row[column] || '').toUpperCase() === t) {
      return row;
    }
  }
  return null;
}

/** Find the range (low, high indices) around a target in a numeric column */
function findRange(
  rows: SizeRow[],
  column: 'us' | 'uk' | 'eu' | 'jp',
  target: number,
): { low: number; high: number } | null {
  // Collect all pairs of (value, index)
  const pairs: { val: number; idx: number }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const val = parseFloat(rows[i][column]);
    if (!isNaN(val)) {
      pairs.push({ val, idx: i });
    }
  }
  if (pairs.length === 0) return null;
  pairs.sort((a, b) => a.val - b.val);

  let low = -1;
  let high = -1;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].val <= target) {
      low = pairs[i].idx;
    }
    if (pairs[i].val >= target && high === -1) {
      high = pairs[i].idx;
    }
  }

  if (low === -1) low = pairs[0].idx;
  if (high === -1) high = pairs[pairs.length - 1].idx;
  if (low === high) return null; // exact match handled elsewhere

  return { low, high };
}

// ─── Conversion Tables ────────────────────────────────────────────────────────

const WOMENS_DRESSES: CategoryTable = {
  rows: [
    { us: '0', uk: '4', eu: '32', jp: '5', intl: 'XS' },
    { us: '2', uk: '6', eu: '34', jp: '7', intl: 'XS' },
    { us: '4', uk: '8', eu: '36', jp: '9', intl: 'S' },
    { us: '6', uk: '10', eu: '38', jp: '11', intl: 'S' },
    { us: '8', uk: '12', eu: '40', jp: '13', intl: 'M' },
    { us: '10', uk: '14', eu: '42', jp: '15', intl: 'L' },
    { us: '12', uk: '16', eu: '44', jp: '17', intl: 'L' },
    { us: '14', uk: '18', eu: '46', jp: '19', intl: 'XL' },
    { us: '16', uk: '20', eu: '48', jp: '21', intl: 'XL' },
  ],
  numericColumns: ['us', 'uk', 'eu', 'jp'],
  intlColumn: true,
};

const WOMENS_TOPS: CategoryTable = {
  rows: [
    { us: '0', uk: '4', eu: '32', jp: '5', intl: 'XS' },
    { us: '2', uk: '6', eu: '34', jp: '7', intl: 'XS' },
    { us: '4', uk: '8', eu: '36', jp: '9', intl: 'S' },
    { us: '6', uk: '10', eu: '38', jp: '11', intl: 'S' },
    { us: '8', uk: '12', eu: '40', jp: '13', intl: 'M' },
    { us: '10', uk: '14', eu: '42', jp: '15', intl: 'L' },
    { us: '12', uk: '16', eu: '44', jp: '17', intl: 'L' },
    { us: '14', uk: '18', eu: '46', jp: '19', intl: 'XL' },
    { us: '16', uk: '20', eu: '48', jp: '21', intl: 'XL' },
  ],
  numericColumns: ['us', 'uk', 'eu', 'jp'],
  intlColumn: true,
};

const MENS_SUITS_JACKETS: CategoryTable = {
  rows: [
    { us: '34', uk: '34', eu: '44', jp: 'S', intl: 'XS' },
    { us: '36', uk: '36', eu: '46', jp: 'M', intl: 'S' },
    { us: '38', uk: '38', eu: '48', jp: 'M', intl: 'M' },
    { us: '40', uk: '40', eu: '50', jp: 'L', intl: 'M' },
    { us: '42', uk: '42', eu: '52', jp: 'L', intl: 'L' },
    { us: '44', uk: '44', eu: '54', jp: 'XL', intl: 'L' },
    { us: '46', uk: '46', eu: '56', jp: 'XL', intl: 'XL' },
    { us: '48', uk: '48', eu: '58', jp: 'XXL', intl: 'XXL' },
    { us: '50', uk: '50', eu: '60', jp: 'XXL', intl: 'XXL' },
  ],
  numericColumns: ['us', 'uk', 'eu'],
  intlColumn: true,
};

const MENS_SHIRTS: CategoryTable = {
  rows: [
    { us: '14', uk: '14', eu: '36', jp: 'S', intl: 'XS' },
    { us: '14.5', uk: '14.5', eu: '37', jp: 'S', intl: 'XS' },
    { us: '15', uk: '15', eu: '38', jp: 'M', intl: 'S' },
    { us: '15.5', uk: '15.5', eu: '39', jp: 'M', intl: 'S' },
    { us: '16', uk: '16', eu: '41', jp: 'L', intl: 'M' },
    { us: '16.5', uk: '16.5', eu: '42', jp: 'L', intl: 'M' },
    { us: '17', uk: '17', eu: '43', jp: 'XL', intl: 'L' },
    { us: '17.5', uk: '17.5', eu: '44', jp: 'XL', intl: 'L' },
    { us: '18', uk: '18', eu: '45', jp: 'XXL', intl: 'XL' },
  ],
  numericColumns: ['us', 'uk', 'eu'],
  intlColumn: true,
};

const WOMENS_SHOES: CategoryTable = {
  rows: [
    { us: '5', uk: '3', eu: '35.5', jp: '22' },
    { us: '6', uk: '4', eu: '37', jp: '23' },
    { us: '7', uk: '5', eu: '38', jp: '24' },
    { us: '8', uk: '6', eu: '39', jp: '25' },
    { us: '9', uk: '7', eu: '40.5', jp: '26' },
    { us: '10', uk: '8', eu: '42', jp: '27' },
  ],
  numericColumns: ['us', 'uk', 'eu', 'jp'],
  intlColumn: false,
};

const MENS_SHOES: CategoryTable = {
  rows: [
    { us: '7', uk: '6.5', eu: '40', jp: '25.5' },
    { us: '8', uk: '7.5', eu: '41', jp: '26' },
    { us: '9', uk: '8.5', eu: '42.5', jp: '27' },
    { us: '10', uk: '9.5', eu: '43', jp: '28' },
    { us: '11', uk: '10.5', eu: '45', jp: '29' },
    { us: '12', uk: '11.5', eu: '46', jp: '30' },
    { us: '13', uk: '12.5', eu: '47.5', jp: '31' },
  ],
  numericColumns: ['us', 'uk', 'eu', 'jp'],
  intlColumn: false,
};

const CHILDREN: CategoryTable = {
  rows: [
    { us: '0-3M', uk: '0-3M', eu: '56', jp: '50', intl: 'NB' },
    { us: '3-6M', uk: '3-6M', eu: '62', jp: '60', intl: '0-3M' },
    { us: '6-12M', uk: '6-12M', eu: '74', jp: '70', intl: '3-6M' },
    { us: '12-18M', uk: '12-18M', eu: '80', jp: '80', intl: '6-9M' },
    { us: '2T', uk: '2T', eu: '86', jp: '90', intl: '12-18M' },
    { us: '3T', uk: '3T', eu: '92', jp: '95', intl: '2T' },
    { us: '4T', uk: '4T', eu: '98', jp: '100', intl: '3T' },
    { us: '5', uk: '5', eu: '104', jp: '110', intl: '4' },
    { us: '6', uk: '6', eu: '110', jp: '120', intl: '5' },
    { us: '7', uk: '7', eu: '116', jp: '130', intl: '6' },
    { us: '8', uk: '8', eu: '122', jp: '140', intl: '7' },
    { us: '10', uk: '10', eu: '134', jp: '150', intl: '8' },
    { us: '12', uk: '12', eu: '140', jp: '160', intl: '10' },
    { us: '14', uk: '14', eu: '152', jp: '170', intl: '12' },
  ],
  numericColumns: ['eu', 'jp'],
  intlColumn: true,
};

const JEANS: CategoryTable = {
  rows: [
    { us: '28', uk: '28', eu: '42', jp: '70', intl: 'XS' },
    { us: '29', uk: '29', eu: '44', jp: '73', intl: 'S' },
    { us: '30', uk: '30', eu: '46', jp: '76', intl: 'S' },
    { us: '31', uk: '31', eu: '48', jp: '79', intl: 'M' },
    { us: '32', uk: '32', eu: '50', jp: '81', intl: 'M' },
    { us: '33', uk: '33', eu: '52', jp: '84', intl: 'L' },
    { us: '34', uk: '34', eu: '54', jp: '86', intl: 'L' },
    { us: '36', uk: '36', eu: '56', jp: '91', intl: 'XL' },
    { us: '38', uk: '38', eu: '58', jp: '97', intl: 'XXL' },
    { us: '40', uk: '40', eu: '60', jp: '102', intl: 'XXL' },
  ],
  numericColumns: ['us', 'uk', 'eu', 'jp'],
  intlColumn: true,
};

// ─── Category definitions ─────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, CategoryTable> = {
  "Women's Dresses": WOMENS_DRESSES,
  "Women's Tops": WOMENS_TOPS,
  "Men's Suits/Jackets": MENS_SUITS_JACKETS,
  "Men's Shirts": MENS_SHIRTS,
  "Women's Shoes": WOMENS_SHOES,
  "Men's Shoes": MENS_SHOES,
  'Children (by age)': CHILDREN,
  'Jeans (W/L)': JEANS,
};

// ─── Region column mapping ────────────────────────────────────────────────────

const REGION_COLUMN: Record<string, 'us' | 'uk' | 'eu' | 'jp'> = {
  US: 'us',
  UK: 'uk',
  EU: 'eu',
  JP: 'jp',
};

interface LookupResult {
  us: string;
  uk: string;
  eu: string;
  jp: string;
  intl: string;
}

function lookupInTable(
  table: CategoryTable,
  region: string,
  sizeInput: string,
): LookupResult | null {
  const trimmed = sizeInput.trim();
  if (!trimmed) return null;

  const rows = table.rows;
  const col = REGION_COLUMN[region];

  // Handle International region specially
  if (region === 'International (S/M/L/XL)') {
    const row = findExactStringRow(rows, 'intl', trimmed);
    if (row) {
      return {
        us: row.us,
        uk: row.uk,
        eu: row.eu,
        jp: row.jp,
        intl: row.intl || trimmed,
      };
    }
    // For children's sizes, try to match a US value directly
    if (table === CHILDREN) {
      const childRow = rows.find(
        (r) => r.us.toUpperCase() === trimmed.toUpperCase(),
      );
      if (childRow) {
        return {
          us: childRow.us,
          uk: childRow.uk,
          eu: childRow.eu,
          jp: childRow.jp,
          intl: childRow.intl || '',
        };
      }
    }
    return null;
  }

  // For non-numeric columns (Children by age is text-based), try exact match first
  if (table === CHILDREN) {
    // Children uses text-based sizes in us/uk columns
    const row = rows.find(
      (r) => r[col].toUpperCase() === trimmed.toUpperCase(),
    );
    if (row) {
      return {
        us: row.us,
        uk: row.uk,
        eu: row.eu,
        jp: row.jp,
        intl: row.intl || '',
      };
    }
    return null;
  }

  // Numeric lookup
  if (!isNumericValue(trimmed)) return null;
  const target = parseNumeric(trimmed);

  // Try exact match first
  const exactRow = findExactRow(rows, col, target);
  if (exactRow) {
    return {
      us: exactRow.us,
      uk: exactRow.uk,
      eu: exactRow.eu,
      jp: exactRow.jp,
      intl: exactRow.intl || '',
    };
  }

  // Try interpolation
  const range = findRange(rows, col, target);
  if (range && range.low !== range.high) {
    const usVal = interpolateValue(rows, col, 'us', range.low, range.high, target);
    const ukVal = interpolateValue(rows, col, 'uk', range.low, range.high, target);
    const euVal = interpolateValue(rows, col, 'eu', range.low, range.high, target);
    const jpVal = interpolateValue(rows, col, 'jp', range.low, range.high, target);
    // Use closest row's intl value
    const closestIdx = Math.abs(parseFloat(rows[range.low][col]) - target) <=
      Math.abs(parseFloat(rows[range.high][col]) - target)
      ? range.low
      : range.high;
    const intlVal = rows[closestIdx].intl || '';

    return {
      us: usVal,
      uk: ukVal,
      eu: euVal,
      jp: jpVal,
      intl: intlVal,
    };
  }

  // Fallback: closest match
  const closestIdx = findClosestRow(rows, col, target);
  if (closestIdx === null) return null;
  const closestRow = rows[closestIdx];
  return {
    us: closestRow.us,
    uk: closestRow.uk,
    eu: closestRow.eu,
    jp: closestRow.jp,
    intl: closestRow.intl || '',
  };
}

// ─── Calculator config ────────────────────────────────────────────────────────

const clothingSizeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      helpText: 'Type of clothing you want to convert',
      options: [
        { label: "Women's Dresses", value: "Women's Dresses" },
        { label: "Women's Tops", value: "Women's Tops" },
        { label: "Men's Suits/Jackets", value: "Men's Suits/Jackets" },
        { label: "Men's Shirts", value: "Men's Shirts" },
        { label: "Women's Shoes", value: "Women's Shoes" },
        { label: "Men's Shoes", value: "Men's Shoes" },
        { label: 'Children (by age)', value: 'Children (by age)' },
        { label: 'Jeans (W/L)', value: 'Jeans (W/L)' },
      ],
      required: true,
    },
    {
      id: 'region',
      label: 'Source Region',
      type: 'select',
      helpText: 'The sizing system of the size you know',
      options: [
        { label: 'US', value: 'US' },
        { label: 'UK', value: 'UK' },
        { label: 'EU', value: 'EU' },
        { label: 'JP', value: 'JP' },
        { label: 'International (S/M/L/XL)', value: 'International (S/M/L/XL)' },
      ],
      required: true,
    },
    {
      id: 'sizeInput',
      label: 'Size',
      type: 'text',
      placeholder: 'Enter size...',
      required: true,
      helpText: 'Enter your size number or letter for the selected region',
    },
  ],

  calculate: (values) => {
    const category = (values.category || '').trim();
    const region = (values.region || '').trim();
    const sizeInput = (values.sizeInput || '').trim();

    if (!category || !region || !sizeInput) return [];

    const table = CATEGORY_MAP[category];
    if (!table) return [];

    const result = lookupInTable(table, region, sizeInput);
    if (!result) return [];

    const results = [
      { id: 'us', label: 'US Size', value: result.us },
      { id: 'uk', label: 'UK Size', value: result.uk },
      { id: 'eu', label: 'EU Size', value: result.eu },
      { id: 'jp', label: 'JP Size', value: result.jp },
    ];

    if (result.intl) {
      results.push({ id: 'intl', label: 'International', value: result.intl });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ClothingSizePanel, { values, results });
  },
  educational: {
    formula:
      'Convert between US, UK, EU, JP, and International sizing using standardised conversion tables with matching and linear interpolation for partial sizes.',
    formulaDescription:
      'Clothing sizing systems developed independently across different regions, each using different measurement units, reference points, and grading increments. US women\'s clothing uses even numbers (0-20+) where each increment corresponds to approximately 1 inch of circumference change. UK women\'s sizing follows a similar scale offset by about 4 sizes. EU sizing uses a centimetre-based system (30-60+) that directly corresponds to body measurements. Japanese sizing provides an alternative numeric or letter-based system. International letter sizing (XS-XXL) offers a rough cross-reference but varies significantly between brands and garment types. This converter uses standardised conversion tables derived from industry references to map sizes across all five systems, with linear interpolation applied for in-between sizes.',
    variables: [
      {
        symbol: 'US',
        name: 'US Sizing System',
        description: 'US women\'s clothing uses even numbers (0-20+). Men\'s suits use chest inches (34-50+). Men\'s shirts use neck/collar inches (14-18). Shoes use a numeric scale where men\'s is approximately 1-2 sizes larger than women\'s.',
      },
      {
        symbol: 'UK',
        name: 'UK Sizing System',
        description: 'UK women\'s clothing follows the same numeric pattern as US but offset by approximately 4 sizes (a US 8 equals a UK 12). Men\'s UK sizing is typically identical to US for suits and shirts. UK shoe sizes differ from US by about 1-2 sizes.',
      },
      {
        symbol: 'EU',
        name: 'EU (European) Sizing',
        description: 'European sizes use a single numeric scale (28-62+) based on body measurements in centimetres. EU sizing does not distinguish between genders for most categories and is the most standardised system internationally.',
      },
      {
        symbol: 'JP',
        name: 'Japanese Sizing',
        description: 'Japanese clothing sizes use a different numeric scale (5-21 for women, S-XXL for men\'s shirts, 22-31 for shoes) often based on smaller average body measurements compared to Western sizing.',
      },
      {
        symbol: 'Intl',
        name: 'International Letter Sizing',
        description: 'Letter-based sizing (XS through XXL and beyond) provides a rough cross-reference across brands and regions. However, these labels are not standardised and can vary significantly between manufacturers, garment cuts, and target markets.',
      },
    ],
    howToUse: [
      'Select the clothing category from the dropdown: dresses, tops, suits/jackets, shirts, shoes, children, or jeans.',
      'Choose the region of your known size (US, UK, EU, JP, or International letter).',
      'Enter your size as a number or letter. For numeric sizes like jeans, enter the waist measurement (e.g., 32). For children, enter the age label (e.g., 3T, 6-12M).',
      'View your converted sizes across all regional systems displayed simultaneously.',
    ],
    quickReference: [
      { label: "Women's Dresses", value: 'US 8 = UK 12 = EU 40 = JP 13 = M' },
      { label: "Men's Shirts", value: 'US 15.5 = UK 15.5 = EU 39 = M' },
      { label: "Women's Shoes", value: 'US 8 = UK 6 = EU 39 = JP 25' },
      { label: "Men's Shoes", value: 'US 10 = UK 9.5 = EU 43 = JP 28' },
    ],
    commonUses: [
      'Shopping from international online retailers that use different sizing systems than your home country.',
      'Converting gift sizes when buying clothing for friends or family who live in a different region.',
      'Understanding your equivalent size when travelling abroad and needing to buy clothes in local stores.',
      'Comparing sizes across different brands that may use US, UK, or EU sizing inconsistently.',
      'Helping parents find the right size for children using age-based sizing charts from different countries.',
    ],
    explanation:
      'Clothing size conversion is complicated because different countries and regions developed their sizing systems independently, using different measurement units, reference points, and grading increments. US women\'s clothing sizing traces its origins to a 1930s government study by the Bureau of Home Economics, where 10,000 women were measured to create a standardised system. That original system used even numbers (8-42), but over decades, manufacturers shifted the scale (a phenomenon known as vanity sizing) so that today a size 8 fits a body approximately two sizes larger than the 1930s equivalent. UK women\'s sizing follows a similar scale to US but is offset by approximately 4 sizes: a US size 8 equals a UK size 12. The offset originated because the UK based its system on imperial measurements while the US system drifted independently. EU sizing is fundamentally different: it uses a centimetre-based system where each size typically corresponds to a 2 cm change in circumference (4 cm for full chest circumference in tops). EU sizes for women (30-60) and men (44-72) are based on actual body measurements, making them more systematic and less prone to vanity sizing drift. Japanese sizing for women (5-21) uses yet another scale that tends to run smaller than Western equivalents, reflecting the average difference in body measurements across populations. International letter sizing (XS through XXL and beyond) was intended as a universal cross-reference but remains unstandardised: a size M from one brand may fit differently than a size M from another, even within the same country. The most reliable approach is to use body measurements (chest, waist, hips, inseam) in centimetres or inches, which this converter uses as its underlying reference data. For shoes, each system uses a different zero point and grading increment: US sizes start at approximately 0 (women) or 6 (men) and increase by 1/3 inch per size. UK sizes are similar but offset by about 1-2 sizes. EU shoe sizes are based on the Paris point (2/3 cm per size), making them strictly linear. Japanese shoe sizes are simply the foot length in centimetres.',
    faqs: [
      {
        question: 'Why are clothing sizes different between the US, UK, and EU?',
        answer: 'Each region developed its sizing system independently based on local measurement units and historical standards. US women\'s sizing originated from a 1930s government study and uses even numbers based on inches. UK women\'s sizing is similar but shifted by approximately +4 sizes. EU sizing uses a metric-based system directly tied to body measurements in centimetres. These historical differences persist because there is no single mandatory international standard — manufacturers choose which system to use based on their target market.',
      },
      {
        question: 'Why do my sizes vary so much between different brands?',
        answer: 'Clothing sizing is not standardised across manufacturers. Factors contributing to variation include: vanity sizing (brands adjust sizes larger so customers feel slimmer), different target demographics (brands aimed at younger customers may run smaller), different garment cuts (slim fit vs. regular vs. relaxed), different fabric properties (stretch fabrics allow more tolerance), and different manufacturing quality standards. Always check the brand\'s specific size chart and read customer reviews about fit.',
      },
      {
        question: 'How do I convert my shoe size between US, UK, EU, and JP?',
        answer: 'Shoe sizes use different zero points and grading increments across systems. US men\'s and women\'s shoe sizes are on different scales: a US women\'s 8 is approximately a US men\'s 6.5. UK shoe sizes are about 1-2 sizes smaller than US. EU shoe sizes are based on the Paris point (2/3 cm per size) and are the same for men and women. Japanese shoe sizes represent the foot length in centimetres. This converter handles all these relationships automatically.',
      },
      {
        question: 'What is "International" letter sizing (S, M, L, XL) and can I rely on it?',
        answer: 'International letter sizing (XS through XXL) was created as a universal cross-reference system, but it is not standardised. A size M from one brand may fit differently than a size M from another, even within the same country. Letter sizes are best used as a rough guide; for a reliable fit, always check the brand\'s specific size chart with body measurements. Some brands publish the chest, waist, and hip measurements corresponding to each letter size.',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="210" y="16" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Clothing Size Conversion Chart</text><g transform="translate(10, 28)"><text x="200" y="12" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Women’s Dresses / Tops</text><rect x="0" y="22" width="68" height="20" rx="3" fill="var(--svg-dbeafe)"/><text x="34" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-2563eb)" font-weight="600">US</text><rect x="70" y="22" width="68" height="20" rx="3" fill="var(--svg-dbeafe)"/><text x="104" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-2563eb)" font-weight="600">UK</text><rect x="140" y="22" width="68" height="20" rx="3" fill="var(--svg-dbeafe)"/><text x="174" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-2563eb)" font-weight="600">EU</text><rect x="210" y="22" width="68" height="20" rx="3" fill="var(--svg-dbeafe)"/><text x="244" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-2563eb)" font-weight="600">JP</text><rect x="280" y="22" width="68" height="20" rx="3" fill="var(--svg-dbeafe)"/><text x="314" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-2563eb)" font-weight="600">Intl</text><text x="34" y="60" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">4</text><text x="104" y="60" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">8</text><text x="174" y="60" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">36</text><text x="244" y="60" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">9</text><text x="314" y="60" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">S</text><text x="34" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">8</text><text x="104" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">12</text><text x="174" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">40</text><text x="244" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">13</text><text x="314" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">M</text><text x="34" y="96" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">14</text><text x="104" y="96" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">18</text><text x="174" y="96" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">46</text><text x="244" y="96" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">19</text><text x="314" y="96" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">XL</text></g><g transform="translate(10, 130)"><text x="200" y="12" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Men’s Shirts (Collar)</text><rect x="0" y="22" width="68" height="20" rx="3" fill="var(--svg-dbeafe)"/><text x="34" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-2563eb)" font-weight="600">US</text><rect x="70" y="22" width="68" height="20" rx="3" fill="var(--svg-dbeafe)"/><text x="104" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-2563eb)" font-weight="600">EU</text><rect x="140" y="22" width="68" height="20" rx="3" fill="var(--svg-dbeafe)"/><text x="174" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-2563eb)" font-weight="600">Intl</text><text x="34" y="60" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">14.5</text><text x="104" y="60" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">37</text><text x="174" y="60" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">XS</text><text x="34" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">15.5</text><text x="104" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">39</text><text x="174" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">S</text><text x="34" y="96" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">16.5</text><text x="104" y="96" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">42</text><text x="174" y="96" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">M</text><text x="34" y="114" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">17.5</text><text x="104" y="114" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">44</text><text x="174" y="114" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="500">L</text></g></svg>',
      alt: 'Size conversion table showing US, UK, EU, JP, and International equivalent sizes for women\'s dresses/tops and men\'s shirts across multiple rows.',
      caption: 'Equivalence chart for women\'s dresses/tops and men\'s shirts across US, UK, EU, JP, and International sizing systems.',
    },
    citations: [
      { title: 'Wikipedia — Clothing Sizes', url: 'https://en.wikipedia.org/wiki/Clothing_sizes' },
      { title: 'ASTM D6240 — Standard Tables of Body Measurements for Men Sizes', url: 'https://www.astm.org/d6240-18.html' },
    ],
  },
};

export default clothingSizeConfig;
