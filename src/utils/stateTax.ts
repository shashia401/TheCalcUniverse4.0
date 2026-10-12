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
 */

/** [lower threshold, rate] pairs in ascending order; the rate applies to income above the threshold. */
type Brackets = ReadonlyArray<readonly [number, number]>;

interface StateRule {
  name: string;
  single: Brackets;
  /** Defaults to the single schedule (flat-tax states and states with identical thresholds). */
  mfj?: Brackets;
  /** Standard deduction [single, married filing jointly]. Omitted = none. */
  std?: readonly [number, number];
}

const flat = (rate: number): Brackets => [[0, rate]];
const NONE: Brackets = [];

export const STATE_INCOME_TAX_YEAR = 2026;

export const STATE_INCOME_TAX: Record<string, StateRule> = {
  AL: { name: 'Alabama', single: [[0, 0.02], [500, 0.04], [3000, 0.05]], mfj: [[0, 0.02], [1000, 0.04], [6000, 0.05]], std: [3000, 8500] },
  AK: { name: 'Alaska', single: NONE },
  AZ: { name: 'Arizona', single: flat(0.025), std: [8350, 16700] },
  AR: { name: 'Arkansas', single: [[0, 0.02], [4600, 0.039]], std: [2470, 4940] },
  CA: {
    name: 'California',
    single: [[0, 0.01], [11079, 0.02], [26264, 0.04], [41452, 0.06], [57542, 0.08], [72724, 0.093], [371479, 0.103], [445771, 0.113], [742953, 0.123], [1000000, 0.133]],
    mfj: [[0, 0.01], [22158, 0.02], [52528, 0.04], [82904, 0.06], [115084, 0.08], [145448, 0.093], [742958, 0.103], [891542, 0.113], [1000000, 0.123], [1485906, 0.133]],
    std: [5540, 11080],
  },
  CO: { name: 'Colorado', single: flat(0.044), std: [16100, 32200] },
  CT: {
    name: 'Connecticut',
    single: [[0, 0.02], [10000, 0.045], [50000, 0.055], [100000, 0.06], [200000, 0.065], [250000, 0.069], [500000, 0.0699]],
    mfj: [[0, 0.02], [20000, 0.045], [100000, 0.055], [200000, 0.06], [400000, 0.065], [500000, 0.069], [1000000, 0.0699]],
  },
  DE: { name: 'Delaware', single: [[0, 0], [2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]], std: [3250, 6500] },
  FL: { name: 'Florida', single: NONE },
  GA: { name: 'Georgia', single: flat(0.0519), std: [12000, 24000] },
  HI: {
    name: 'Hawaii',
    single: [[0, 0.014], [9600, 0.032], [14400, 0.055], [19200, 0.064], [24000, 0.068], [36000, 0.072], [48000, 0.076], [125000, 0.079], [175000, 0.0825], [225000, 0.09], [275000, 0.1], [325000, 0.11]],
    mfj: [[0, 0.014], [19200, 0.032], [28800, 0.055], [38400, 0.064], [48000, 0.068], [72000, 0.072], [96000, 0.076], [250000, 0.079], [350000, 0.0825], [450000, 0.09], [550000, 0.1], [650000, 0.11]],
    std: [4400, 8800],
  },
  ID: { name: 'Idaho', single: [[0, 0], [4811, 0.053]], mfj: [[0, 0], [9622, 0.053]], std: [16100, 32200] },
  IL: { name: 'Illinois', single: flat(0.0495) },
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
  MA: { name: 'Massachusetts', single: [[0, 0.05], [1083150, 0.09]] },
  MI: { name: 'Michigan', single: flat(0.0425) },
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
  },
  NC: { name: 'North Carolina', single: flat(0.0399), std: [12750, 25500] },
  ND: { name: 'North Dakota', single: [[0, 0], [48475, 0.0195], [244825, 0.025]], mfj: [[0, 0], [80975, 0.0195], [298075, 0.025]], std: [16100, 32200] },
  OH: { name: 'Ohio', single: [[0, 0], [26050, 0.0275]] },
  OK: { name: 'Oklahoma', single: [[0, 0], [3750, 0.025], [4900, 0.035], [7200, 0.045]], mfj: [[0, 0], [7500, 0.025], [9800, 0.035], [14400, 0.045]], std: [6350, 12700] },
  OR: { name: 'Oregon', single: [[0, 0.0475], [4550, 0.0675], [11400, 0.0875], [125000, 0.099]], mfj: [[0, 0.0475], [9100, 0.0675], [22800, 0.0875], [250000, 0.099]], std: [2910, 5820] },
  PA: { name: 'Pennsylvania', single: flat(0.0307) },
  RI: { name: 'Rhode Island', single: [[0, 0.0375], [82050, 0.0475], [186450, 0.0599]], std: [11200, 22400] },
  SC: { name: 'South Carolina', single: [[0, 0], [3640, 0.03], [18230, 0.06]], std: [8350, 16700] },
  SD: { name: 'South Dakota', single: NONE },
  TN: { name: 'Tennessee', single: NONE },
  TX: { name: 'Texas', single: NONE },
  UT: { name: 'Utah', single: flat(0.045) },
  VT: { name: 'Vermont', single: [[0, 0.0335], [49400, 0.066], [119700, 0.076], [249700, 0.0875]], mfj: [[0, 0.0335], [82500, 0.066], [199450, 0.076], [304000, 0.0875]], std: [7650, 15300] },
  VA: { name: 'Virginia', single: [[0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]], std: [8750, 17500] },
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
  return tax;
}
