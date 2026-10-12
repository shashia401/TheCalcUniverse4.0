// Closing-cost model shared by the calculator and its panel. Every rate below is an
// illustrative national-average assumption (lender fees and title rates vary by state and lender);
// the Loan Estimate is the only binding number.

export interface CostLine {
  id: string;
  label: string;
  amount: number;
}
export interface CostGroup {
  id: string;
  label: string;
  total: number;
  lines: CostLine[];
}
export interface ClosingCosts {
  loanAmount: number;
  buyerGroups: CostGroup[];
  totalBuyer: number;
  sellerLines: CostLine[];
  totalSeller: number;
}

const sum = (lines: CostLine[]) => lines.reduce((s, l) => s + l.amount, 0);
const group = (id: string, label: string, lines: CostLine[]): CostGroup => ({ id, label, total: sum(lines), lines });

/** downPct in percent (0-100), annualRate as a fraction. */
export function closingCosts(homePrice: number, downPct: number, annualRate: number): ClosingCosts {
  const loanAmount = homePrice * (1 - downPct / 100);
  const rate = Number.isFinite(annualRate) ? annualRate : 0;

  const loan = group('loanFees', 'LOAN / LENDER FEES', [
    { id: 'origination', label: '  Loan Origination Fee (1%)', amount: loanAmount * 0.01 },
    { id: 'appraisal', label: '  Appraisal Fee', amount: 550 },
    { id: 'creditReport', label: '  Credit Report Fee', amount: 35 },
    { id: 'underwriting', label: '  Underwriting Fee', amount: 995 },
  ]);
  const title = group('titleFees', 'TITLE & THIRD-PARTY FEES', [
    { id: 'titleSearch', label: '  Title Search', amount: 350 },
    { id: 'titleInsLender', label: "  Lender's Title Insurance", amount: loanAmount * 0.005 },
    { id: 'titleInsOwner', label: "  Owner's Title Insurance (the seller pays in some states)", amount: homePrice * 0.004 },
    { id: 'settlementFee', label: '  Settlement / Escrow Fee', amount: 450 },
    { id: 'recording', label: '  Recording Fee', amount: 150 },
  ]);
  const prepaid = group('prepaid', 'PREPAIDS & ESCROW SETUP', [
    // Daily interest from closing to month-end, assuming a mid-month closing (15 days).
    { id: 'prepaidInterest', label: '  Prepaid Interest (~15 days)', amount: ((loanAmount * rate) / 365) * 15 },
    { id: 'prepaidIns', label: '  Prepaid Homeowners Insurance', amount: homePrice * 0.005 },
    { id: 'taxEscrow', label: '  Property Tax Escrow (3 mo.)', amount: ((homePrice * 0.012) / 12) * 3 },
    { id: 'escrowSetup', label: '  Escrow Setup / Cushion', amount: 350 },
  ]);
  const buyerGroups = [loan, title, prepaid];

  const sellerLines: CostLine[] = [
    { id: 'commissionBuyer', label: "  Buyer's Agent Commission (2.5%)", amount: homePrice * 0.025 },
    { id: 'commissionSeller', label: "  Seller's Agent Commission (2.5%)", amount: homePrice * 0.025 },
    { id: 'transferTax', label: '  Transfer / Excise Tax', amount: homePrice * 0.002 },
    { id: 'homeWarranty', label: '  Home Warranty (optional)', amount: 500 },
  ];

  return {
    loanAmount,
    buyerGroups,
    totalBuyer: buyerGroups.reduce((s, g) => s + g.total, 0),
    sellerLines,
    totalSeller: sum(sellerLines),
  };
}

export type Party = 'buyer' | 'seller' | 'both';

/** Parse the form; null when incomplete or when no buyer loan exists for a buyer view. */
export function parseClosing(values: Record<string, string>): { homePrice: number; downPct: number; annualRate: number; party: Party } | null {
  const homePrice = parseFloat(values.homePrice);
  // Blank means the typical 20%; an explicit 0% (VA / USDA) is a real answer and must not be overridden.
  const downPctRaw = parseFloat(values.downPaymentPct);
  const downPct = Number.isFinite(downPctRaw) ? downPctRaw : 20;
  const annualRate = parseFloat(values.interestRate) / 100;
  const party = (values.party || 'buyer') as Party;
  if (!Number.isFinite(homePrice) || homePrice <= 0) return null;
  if (isNaN(annualRate) && party !== 'seller') return null; // rate drives buyer prepaid interest
  if (downPct < 0 || downPct > 100) return null;
  if (downPct >= 100 && party !== 'seller') return null; // no loan, no lender costs
  return { homePrice, downPct, annualRate, party };
}
