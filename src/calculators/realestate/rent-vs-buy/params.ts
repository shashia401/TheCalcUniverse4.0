import { numOr, RvbParams } from '../../finance/rent-vs-buy/model';

/**
 * Real-estate calculator inputs -> the shared finance rent-vs-buy model.
 * Inputs this version does not ask for use the finance calculator's defaults, so both calculators
 * give identical answers for identical inputs: 6% selling costs, 0.5% homeowner's insurance,
 * 0.7% PMI (only below 20% down) and a 7% return on the cash a renter does not spend.
 */
export function rvbParamsFromValues(values: Record<string, string>): { params: RvbParams; years: number } | null {
  const homePrice = parseFloat(values.homePrice);
  const downPct = parseFloat(values.downPaymentPct) / 100;
  const annualRate = parseFloat(values.interestRate) / 100;
  const appreciation = parseFloat(values.homeAppreciation) / 100;
  const monthlyRent = parseFloat(values.monthlyRent);
  const yearsRaw = parseFloat(values.years);
  if ([homePrice, downPct, annualRate, appreciation, monthlyRent, yearsRaw].some((n) => !Number.isFinite(n))) return null;
  if (homePrice <= 0 || monthlyRent <= 0 || yearsRaw <= 0) return null;

  return {
    years: Math.min(30, Math.max(1, Math.round(yearsRaw))),
    params: {
      monthlyRent,
      rentIncrease: numOr(values.rentIncrease, 3) / 100,
      rentersInsurance: numOr(values.rentersInsurance, 200),
      homePrice,
      downPaymentPct: Math.min(1, Math.max(0, downPct)),
      mortgageRate: annualRate,
      closingCostsPct: numOr(values.closingCostsPct, 3) / 100,
      propertyTaxRate: numOr(values.propertyTaxPct, 1.2) / 100,
      maintenancePct: numOr(values.maintenancePct, 1.5) / 100,
      homeInsurancePct: 0.005,
      appreciation,
      sellingCostsPct: 0.06,
      pmiRate: 0.007,
      investReturn: 0.07,
    },
  };
}
