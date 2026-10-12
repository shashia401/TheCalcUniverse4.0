// Pure estate-tax math shared by index.ts and EstateTaxPanel.tsx.

/**
 * Federal basic exclusion amount for 2026: $15,000,000 per individual (P.L. 119-21 / OBBBA §70106,
 * inflation-indexed after 2026). Annual gift exclusion 2026: $19,000 (Rev. Proc. 2025-32).
 */
export const FEDERAL_EXEMPTION = 15_000_000;
export const TAX_YEAR = 2026;

/**
 * State estate tax: exemption and top marginal rate. Best-available 2026 figures (state revenue
 * departments / secondary summaries disagree for ME, RI and DC): WA $3,000,000 and 10-20% (DOR, deaths
 * on/after 2026-07-01), NY $7,350,000, CT matches the federal $15M, DC $4,988,400, ME $7,000,000.
 */
export const STATE_EXEMPTIONS: Record<string, { name: string; exemption: number; topRate: number }> = {
  none: { name: 'No State Estate Tax', exemption: 0, topRate: 0 },
  CT: { name: 'Connecticut', exemption: 15_000_000, topRate: 12 },
  HI: { name: 'Hawaii', exemption: 5_490_000, topRate: 20 },
  IL: { name: 'Illinois', exemption: 4_000_000, topRate: 16 },
  ME: { name: 'Maine', exemption: 7_000_000, topRate: 12 },
  MD: { name: 'Maryland', exemption: 5_000_000, topRate: 16 },
  MA: { name: 'Massachusetts', exemption: 2_000_000, topRate: 16 },
  MN: { name: 'Minnesota', exemption: 3_000_000, topRate: 16 },
  NY: { name: 'New York', exemption: 7_350_000, topRate: 16 },
  OR: { name: 'Oregon', exemption: 1_000_000, topRate: 16 },
  RI: { name: 'Rhode Island', exemption: 1_838_056, topRate: 16 },
  VT: { name: 'Vermont', exemption: 5_000_000, topRate: 16 },
  WA: { name: 'Washington', exemption: 3_000_000, topRate: 20 },
  DC: { name: 'Washington D.C.', exemption: 4_988_400, topRate: 16 },
};

/**
 * Crude planning approximation: state schedules are graduated, so the tax on the amount above the
 * exemption averages well below the top rate. We use half the top rate. Not a statutory figure.
 */
export const STATE_AVG_RATE_FACTOR = 0.5;

/** IRC §2001(c) unified rate schedule (18% to 40%). */
const SCHEDULE = [
  { min: 0, rate: 0.18 },
  { min: 10_000, rate: 0.2 },
  { min: 20_000, rate: 0.22 },
  { min: 40_000, rate: 0.24 },
  { min: 60_000, rate: 0.26 },
  { min: 80_000, rate: 0.28 },
  { min: 100_000, rate: 0.3 },
  { min: 150_000, rate: 0.32 },
  { min: 250_000, rate: 0.34 },
  { min: 500_000, rate: 0.37 },
  { min: 750_000, rate: 0.39 },
  { min: 1_000_000, rate: 0.4 },
];

/** Tentative tax on a taxable estate from the unified schedule. */
export function scheduleTax(amount: number): number {
  if (!(amount > 0)) return 0;
  let tax = 0;
  for (let i = 0; i < SCHEDULE.length; i++) {
    const lo = SCHEDULE[i].min;
    const hi = i + 1 < SCHEDULE.length ? SCHEDULE[i + 1].min : Infinity;
    if (amount <= lo) break;
    tax += (Math.min(amount, hi) - lo) * SCHEDULE[i].rate;
  }
  return tax;
}

/**
 * Federal estate tax = schedule tax on the whole taxable estate minus the unified credit, which equals the
 * schedule tax on the exemption. With an exemption above $1M that is simply 40% of the excess.
 */
export function federalEstateTax(taxableEstate: number, exemption: number): number {
  if (!(taxableEstate > exemption)) return 0;
  return Math.max(0, scheduleTax(taxableEstate) - scheduleTax(exemption));
}

export interface EstateInput {
  totalAssets: number;
  debts: number;
  married: boolean;
  /** Surviving spouse's own estate, added at the second death (married only) */
  spouseEstate: number;
  stateKey: string;
}

export function computeEstate(i: EstateInput) {
  const gross = i.totalAssets + (i.married ? Math.max(0, i.spouseEstate) : 0);
  const adjusted = Math.max(0, gross - i.debts);
  const exemption = i.married ? FEDERAL_EXEMPTION * 2 : FEDERAL_EXEMPTION;

  const state = STATE_EXEMPTIONS[i.stateKey] || STATE_EXEMPTIONS.none;
  const stateTax =
    state.topRate > 0
      ? Math.max(0, adjusted - state.exemption) * (state.topRate / 100) * STATE_AVG_RATE_FACTOR
      : 0;

  // IRC §2058: state death taxes paid are deductible from the federal taxable estate.
  const federalBase = Math.max(0, adjusted - stateTax);
  const federalTaxable = Math.max(0, federalBase - exemption);
  const federalTax = federalEstateTax(federalBase, exemption);

  const totalTax = federalTax + stateTax;
  return {
    gross,
    adjusted,
    exemption,
    state,
    stateTax,
    federalBase,
    federalTaxable,
    federalTax,
    totalTax,
    netToHeirs: adjusted - totalTax,
    effectiveRate: adjusted > 0 ? (totalTax / adjusted) * 100 : 0,
  };
}
