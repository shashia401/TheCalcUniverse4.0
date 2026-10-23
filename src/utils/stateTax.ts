/**
 * State individual income tax on wages, tax year 2026.
 * Source: Tax Foundation, "2026 State Individual Income Tax Rates and Brackets"
 * (https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/), which compiles each state's
 * rate schedule and standard deduction as of 1 January 2026. Tax Foundation notes that some states'
 * 2026 inflation adjustments were not yet published, so a few thresholds are the 2025 amounts.
 *
 * Deliberately NOT modelled: personal exemptions and credits, standard-deduction phase-outs,
 * local income taxes (e.g. NYC, Maryland counties) and state payroll taxes (CA/NJ/NY SDI, WA PFML).
 * Head-of-household and married-filing-separately use the single schedule.
 *
 * Verification: a state with a `verified` marker was checked against its own revenue department or
 * legislature page on the date shown (see the per-state notes). Every state WITHOUT the marker is still
 * the Tax Foundation figure and is labelled an estimate on the calculators (see `stateTaxBasis`).
 * Pennsylvania was verified earlier against the PA Department of Revenue (flat 3.07%).
 */

/** [lower threshold, rate] pairs in ascending order; the rate applies to income above the threshold. */
type Brackets = ReadonlyArray<readonly [number, number]>;

/** Evidence that a state's schedule was compared with the state's own official page. */
export interface StateVerified {
  /** Name of the official body, used in the on-page label ("verified against <authority>, <date>"). */
  authority: string;
  /** Official page or document the figures were read from. */
  url: string;
  /** ISO date the page was read. */
  checked: string;
  /** What exactly was confirmed, and any caveat (e.g. a figure published for the prior year). */
  note: string;
}

interface StateRule {
  name: string;
  single: Brackets;
  /** Defaults to the single schedule (flat-tax states and states with identical thresholds). */
  mfj?: Brackets;
  /** Standard deduction [single, married filing jointly]. Omitted = none. */
  std?: readonly [number, number];
  /** [threshold, amount]: a fixed amount of tax added once taxable income exceeds the threshold (Ohio's statutory base). */
  cliff?: readonly [number, number];
  /** Present only when confirmed against the state's own official source. */
  verified?: StateVerified;
}

const flat = (rate: number): Brackets => [[0, rate]];
const NONE: Brackets = [];

export const STATE_INCOME_TAX_YEAR = 2026;

const CHECKED = '2026-10-22';

export const STATE_INCOME_TAX: Record<string, StateRule> = {
  AL: { name: 'Alabama', single: [[0, 0.02], [500, 0.04], [3000, 0.05]], mfj: [[0, 0.02], [1000, 0.04], [6000, 0.05]], std: [3000, 8500] },
  AK: { name: 'Alaska', single: NONE },
  AZ: {
    name: 'Arizona',
    single: flat(0.025),
    // Std deduction: AZDOR publishes $15,750 single / $31,500 joint for 2025 and tells 2026 estimated-tax filers to use the 2025 amount
    // (2026 Form 140ES booklet; Individual Income Update Feb 2026); the 2026 amounts are not yet published.
    std: [15750, 31500],
    verified: {
      authority: 'Arizona Department of Revenue',
      url: 'https://azdor.gov/sites/default/files/document/FORMS_INDIVIDUAL_2026_140ESBooklet.pdf',
      checked: CHECKED,
      note: '2.5% flat rate for 2026 (Form 140ES booklet). Standard deduction is the 2025 amount, which the Department says to use for 2026 estimates until the 2026 amount is published (https://azdor.gov/sites/default/files/document/IND_Updates-2602.pdf).',
    },
  },
  AR: { name: 'Arkansas', single: [[0, 0.02], [4600, 0.039]], std: [2470, 4940] },
  CA: {
    name: 'California',
    // 2026 Schedules X and Y and the 2026 standard deduction, from the Franchise Tax Board's 2026 indexing announcement
    // (https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/index.html). The 13.3% step is the 1% Behavioral Health Services Tax on
    // taxable income over $1,000,000 (2025 Form 540 booklet, line 62), added to the schedule rate.
    single: [[0, 0.01], [11456, 0.02], [27157, 0.04], [42861, 0.06], [59498, 0.08], [75197, 0.093], [384109, 0.103], [460927, 0.113], [768213, 0.123], [1000000, 0.133]],
    mfj: [[0, 0.01], [22912, 0.02], [54314, 0.04], [85722, 0.06], [118996, 0.08], [150394, 0.093], [768218, 0.103], [921854, 0.113], [1000000, 0.123], [1536426, 0.133]],
    std: [5900, 11800],
    verified: {
      authority: 'California Franchise Tax Board',
      url: 'https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/index.html',
      checked: CHECKED,
      note: '2026 Schedule X/Y and standard deduction from the FTB 2026 indexing announcement (FTB says the complete 2026 tables are due in late December); 1% surtax over $1,000,000 from the Form 540 booklet.',
    },
  },
  CO: { name: 'Colorado', single: flat(0.044), std: [16100, 32200] },
  CT: {
    name: 'Connecticut',
    single: [[0, 0.02], [10000, 0.045], [50000, 0.055], [100000, 0.06], [200000, 0.065], [250000, 0.069], [500000, 0.0699]],
    mfj: [[0, 0.02], [20000, 0.045], [100000, 0.055], [200000, 0.06], [400000, 0.065], [500000, 0.069], [1000000, 0.0699]],
  },
  DE: { name: 'Delaware', single: [[0, 0], [2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]], std: [3250, 6500] },
  FL: { name: 'Florida', single: NONE },
  GA: {
    name: 'Georgia',
    // HB 463 (2026): flat rate cut from 5.19% to 4.99% and standard deduction raised to $15,000 / $30,000, retroactive to 1 Jan 2026
    // (Georgia DOR 2026 Employer's Tax Guide, "What's new for tax year 2026").
    single: flat(0.0499),
    std: [15000, 30000],
    verified: {
      authority: 'Georgia Department of Revenue',
      url: 'https://dor.georgia.gov/document/document/2026-employers-tax-guide-updated-june-2026/download',
      checked: CHECKED,
      note: "HB 463: 4.99% flat rate and $15,000 single / $30,000 joint standard deduction for tax year 2026 (2026 Employer's Tax Guide, updated June 2026).",
    },
  },
  HI: {
    name: 'Hawaii',
    single: [[0, 0.014], [9600, 0.032], [14400, 0.055], [19200, 0.064], [24000, 0.068], [36000, 0.072], [48000, 0.076], [125000, 0.079], [175000, 0.0825], [225000, 0.09], [275000, 0.1], [325000, 0.11]],
    mfj: [[0, 0.014], [19200, 0.032], [28800, 0.055], [38400, 0.064], [48000, 0.068], [72000, 0.072], [96000, 0.076], [250000, 0.079], [350000, 0.0825], [450000, 0.09], [550000, 0.1], [650000, 0.11]],
    std: [4400, 8800],
  },
  ID: { name: 'Idaho', single: [[0, 0], [4811, 0.053]], mfj: [[0, 0], [9622, 0.053]], std: [16100, 32200] },
  IL: {
    name: 'Illinois',
    single: flat(0.0495),
    verified: {
      authority: 'Illinois Department of Revenue',
      url: 'https://tax.illinois.gov/research/taxrates/income.html',
      checked: CHECKED,
      note: 'Individual income tax 4.95% of net income, effective July 1, 2017, no later change listed. The exemption allowance is not modelled.',
    },
  },
  IN: { name: 'Indiana', single: flat(0.0295) },
  IA: { name: 'Iowa', single: flat(0.038), std: [16100, 32200] },
  KS: { name: 'Kansas', single: [[0, 0.052], [23000, 0.0558]], mfj: [[0, 0.052], [46000, 0.0558]], std: [3605, 8240] },
  KY: { name: 'Kentucky', single: flat(0.035), std: [3360, 3360] },
  LA: { name: 'Louisiana', single: flat(0.03), std: [12875, 25750] },
  ME: { name: 'Maine', single: [[0, 0.058], [27399, 0.0675], [64849, 0.0715]], mfj: [[0, 0.058], [54849, 0.0675], [129749, 0.0715]], std: [8350, 16700] },
  MD: {
    name: 'Maryland',
    single: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575], [500000, 0.0625], [1000000, 0.065]],
    mfj: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [150000, 0.05], [175000, 0.0525], [225000, 0.055], [300000, 0.0575], [600000, 0.0625], [1200000, 0.065]],
    std: [3350, 6700],
  },
  MA: {
    name: 'Massachusetts',
    // 5% plus the 4% surtax on income over the indexed threshold: $1,107,750 for tax year 2026 ($1,083,150 was the 2025 figure).
    single: [[0, 0.05], [1107750, 0.09]],
    verified: {
      authority: 'Massachusetts Department of Revenue',
      url: 'https://www.mass.gov/info-details/tax-rates',
      checked: CHECKED,
      note: '5.00% rate and the 4% surtax over $1,107,750 for tax year 2026 (DOR Tax Rates page, updated December 30, 2025). The personal exemption is not modelled.',
    },
  },
  MI: {
    name: 'Michigan',
    single: flat(0.0425),
    verified: {
      authority: 'Michigan Department of Treasury',
      url: 'https://www.michigan.gov/treasury/reference/taxpayer-notices/2026/04/15/425-income-tax-rate-for-individuals-and-fiduciaries-in-2026-tax-year',
      checked: CHECKED,
      note: 'Treasury notice of April 15, 2026: the individual rate stays 4.25% for tax year 2026. The personal exemption is not modelled.',
    },
  },
  MN: { name: 'Minnesota', single: [[0, 0.0535], [33310, 0.068], [109430, 0.0785], [203150, 0.0985]], mfj: [[0, 0.0535], [48700, 0.068], [193480, 0.0785], [337930, 0.0985]], std: [15300, 30600] },
  MS: { name: 'Mississippi', single: [[0, 0], [10000, 0.04]], std: [2300, 4600] },
  MO: { name: 'Missouri', single: [[0, 0], [1348, 0.02], [2696, 0.025], [4044, 0.03], [5392, 0.035], [6740, 0.04], [8088, 0.045], [9436, 0.047]], std: [16100, 32200] },
  MT: { name: 'Montana', single: [[0, 0.047], [47500, 0.0565]], mfj: [[0, 0.047], [95000, 0.0565]], std: [16100, 32200] },
  NE: { name: 'Nebraska', single: [[0, 0.0246], [4130, 0.0351], [24760, 0.0455]], mfj: [[0, 0.0246], [8250, 0.0351], [49530, 0.0455]], std: [8850, 17700] },
  NV: { name: 'Nevada', single: NONE },
  NH: { name: 'New Hampshire', single: NONE },
  NJ: {
    name: 'New Jersey',
    single: [[0, 0.014], [20000, 0.0175], [35000, 0.035], [40000, 0.05525], [75000, 0.0637], [500000, 0.0897], [1000000, 0.1075]],
    mfj: [[0, 0.014], [20000, 0.0175], [50000, 0.0245], [70000, 0.035], [80000, 0.05525], [150000, 0.0637], [500000, 0.0897], [1000000, 0.1075]],
    verified: {
      authority: 'New Jersey Division of Taxation',
      url: 'https://www.nj.gov/treasury/taxation/taxtables.shtml',
      checked: CHECKED,
      note: "Rate schedules A and B ('2020 and after' on the Division's NJ Income Tax Rates page, updated 09/28/26), reproduced in the 2025 NJ-1040 instructions p. 63. The personal exemption is not modelled.",
    },
  },
  NM: {
    name: 'New Mexico',
    single: [[0, 0.015], [5500, 0.032], [16500, 0.043], [33500, 0.047], [66500, 0.049], [210000, 0.059]],
    mfj: [[0, 0.015], [8000, 0.032], [25000, 0.043], [50000, 0.047], [100000, 0.049], [315000, 0.059]],
    std: [16100, 32200],
  },
  NY: {
    name: 'New York',
    single: [[0, 0.039], [8500, 0.044], [11700, 0.0515], [13900, 0.054], [80650, 0.059], [215400, 0.0685], [1077550, 0.0965], [5000000, 0.103], [25000000, 0.109]],
    mfj: [[0, 0.039], [17150, 0.044], [23600, 0.0515], [27900, 0.054], [161550, 0.059], [323200, 0.0685], [2155350, 0.0965], [5000000, 0.103], [25000000, 0.109]],
    std: [8000, 16050],
    verified: {
      authority: 'New York State Department of Taxation and Finance',
      url: 'https://www.tax.ny.gov/pdf/publications/withholding/nys50_t_nys.pdf',
      checked: CHECKED,
      note: '2026 rates 3.9% to 10.9% and thresholds per Tax Law section 601 as amended by Chapter 59 of 2025 (https://www.nysenate.gov/legislation/laws/TAX/601); the first five brackets are also printed in NYS-50-T-NYS (1/26). Standard deduction $8,000 / $16,050 is from the 2025 IT-201 instructions (2026 instructions not yet published).',
    },
  },
  NC: {
    name: 'North Carolina',
    single: flat(0.0399),
    std: [12750, 25500],
    verified: {
      authority: 'North Carolina Department of Revenue',
      url: 'https://www.ncdor.gov/income-tax-withholding-tables-and-instructions-employers/open',
      checked: CHECKED,
      note: 'NC-30 (11-25): 3.99% for tax year 2026 and a $12,750 single standard deduction for 2026. The $25,500 joint amount is from https://www.ncdor.gov/taxes-forms/individual-income-tax/north-carolina-standard-deduction-or-north-carolina-itemized-deductions.',
    },
  },
  ND: { name: 'North Dakota', single: [[0, 0], [48475, 0.0195], [244825, 0.025]], mfj: [[0, 0], [80975, 0.0195], [298075, 0.025]], std: [16100, 32200] },
  OH: {
    name: 'Ohio',
    // Ohio Revised Code 5747.02(A)(3)(c), tax years beginning in 2026 and thereafter: no tax on income up to $26,050; above it,
    // "$332.00 plus 2.75% of the amount in excess of $26,050". The $332 is a fixed base that applies once income passes $26,050.
    single: [[0, 0], [26050, 0.0275]],
    cliff: [26050, 332],
    verified: {
      authority: 'Ohio Revised Code section 5747.02',
      url: 'https://codes.ohio.gov/ohio-revised-code/section-5747.02',
      checked: CHECKED,
      note: 'HB 96 flat schedule for 2026 (the Department of Taxation rates page lists 2025 and earlier only). The personal exemption is not modelled.',
    },
  },
  OK: { name: 'Oklahoma', single: [[0, 0], [3750, 0.025], [4900, 0.035], [7200, 0.045]], mfj: [[0, 0], [7500, 0.025], [9800, 0.035], [14400, 0.045]], std: [6350, 12700] },
  OR: { name: 'Oregon', single: [[0, 0.0475], [4550, 0.0675], [11400, 0.0875], [125000, 0.099]], mfj: [[0, 0.0475], [9100, 0.0675], [22800, 0.0875], [250000, 0.099]], std: [2910, 5820] },
  PA: {
    name: 'Pennsylvania',
    single: flat(0.0307),
    verified: {
      authority: 'Pennsylvania Department of Revenue',
      url: 'https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/personal-income-tax',
      checked: CHECKED,
      note: 'Personal income tax levied at 3.07 percent; no standard deduction or exemption. Payroll Section 125 health and HSA contributions are excluded from compensation per letter ruling PIT-06-005.',
    },
  },
  RI: { name: 'Rhode Island', single: [[0, 0.0375], [82050, 0.0475], [186450, 0.0599]], std: [11200, 22400] },
  SC: { name: 'South Carolina', single: [[0, 0], [3640, 0.03], [18230, 0.06]], std: [8350, 16700] },
  SD: { name: 'South Dakota', single: NONE },
  TN: { name: 'Tennessee', single: NONE },
  TX: { name: 'Texas', single: NONE },
  UT: { name: 'Utah', single: flat(0.045) },
  VT: { name: 'Vermont', single: [[0, 0.0335], [49400, 0.066], [119700, 0.076], [249700, 0.0875]], mfj: [[0, 0.0335], [82500, 0.066], [199450, 0.076], [304000, 0.0875]], std: [7650, 15300] },
  VA: {
    name: 'Virginia',
    single: [[0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]],
    std: [8750, 17500],
    verified: {
      authority: 'Virginia Department of Taxation',
      url: 'https://www.tax.virginia.gov/sites/default/files/inline-files/2026-legislative-summary.pdf',
      checked: CHECKED,
      note: 'Standard deduction stays $8,750 / $17,500 until 2027 (2026 Legislative Summary, July 6, 2026); rate schedule 2% / 3% / 5% / 5.75% from the 2025 Form 760 instructions. Personal exemptions are not modelled.',
    },
  },
  WA: { name: 'Washington', single: NONE }, // no tax on wages (capital-gains excise tax only)
  WV: { name: 'West Virginia', single: [[0, 0.0222], [10000, 0.0296], [25000, 0.0333], [40000, 0.0444], [60000, 0.0482]] },
  WI: { name: 'Wisconsin', single: [[0, 0.035], [15110, 0.044], [51950, 0.053], [332720, 0.0765]], mfj: [[0, 0.035], [20150, 0.044], [69260, 0.053], [443630, 0.0765]], std: [13960, 25840] },
  WY: { name: 'Wyoming', single: NONE },
};

/** True when the state does not tax wages. */
export const hasNoWageTax = (code: string): boolean => (STATE_INCOME_TAX[code]?.single.length ?? 0) === 0;

/**
 * State income tax on `wages` (already net of pre-tax deductions) for a 2026 filer.
 * `status` is the federal filing status; only 'mfj' switches to the joint schedule.
 */
export function stateIncomeTax(code: string, wages: number, status: string = 'single'): number {
  const rule = STATE_INCOME_TAX[code];
  if (!rule || rule.single.length === 0 || !(wages > 0)) return 0;
  const joint = status === 'mfj';
  const brackets = (joint && rule.mfj) || rule.single;
  const taxable = Math.max(0, wages - (rule.std ? rule.std[joint ? 1 : 0] : 0));
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [lower, rate] = brackets[i];
    const upper = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (taxable > lower) tax += (Math.min(taxable, upper) - lower) * rate;
  }
  if (rule.cliff && taxable > rule.cliff[0]) tax += rule.cliff[1];
  return tax;
}

/** Names of the states whose schedule carries a `verified` marker (for page text that must not hard-code the list). */
export const verifiedStateNames = (): string[] =>
  Object.values(STATE_INCOME_TAX).filter((r) => r.verified).map((r) => r.name);

/**
 * One shared label for how a state's figure was obtained, so every calculator words it the same way.
 * Verified states: "verified against <authority>, <date>". Other taxing states: "estimate". States with no wage tax: ''.
 */
export function stateTaxBasis(code: string): string {
  const rule = STATE_INCOME_TAX[code];
  if (!rule || rule.single.length === 0) return '';
  const v = rule.verified;
  return v
    ? `verified against ${v.authority}, ${v.checked}`
    : `estimate (Tax Foundation ${STATE_INCOME_TAX_YEAR} table, not checked against ${rule.name}'s own revenue department)`;
}
