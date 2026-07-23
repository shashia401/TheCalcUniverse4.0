import { createElement, useMemo } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { pmt, buildSchedule } from '../../../utils/financial';
import { TrendingDown } from 'lucide-react';

// ─── Extra visualization panel ───────────────────────────────────────────────

function BoatLoanPanel({ values, results }: { values: Record<string, string>; results: CalculatorResult[] }) {
  const price = parseFloat(values.boatPrice) || 0;
  const downPayment = parseFloat(values.downPayment) || 0;
  const termMonths = parseFloat(values.loanTerm) || 0;
  const interestRate = parseFloat(values.interestRate) / 100 || 0;
  const monthlyRate = interestRate / 12;
  const loanAmount = price - downPayment;
  const monthlyMaintenance = parseFloat(values.monthlyMaintenance) || 0;

  const monthlyPayment = monthlyRate > 0 ? pmt(loanAmount, monthlyRate, termMonths) : loanAmount / termMonths;

  const schedule = useMemo(
    () => buildSchedule(loanAmount, monthlyRate, monthlyPayment, 0, termMonths),
    [loanAmount, monthlyRate, monthlyPayment, termMonths]
  );

  if (!schedule.length) return null;

  const totalPayment = monthlyPayment * schedule.length;
  const totalInterest = totalPayment - loanAmount;
  const totalMaintenance = monthlyMaintenance * schedule.length;
  const trueTotalCost = downPayment + totalPayment + totalMaintenance;

  const fmtCur = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return createElement('div', { className: 'rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden' },
    createElement('div', { className: 'flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50' },
      createElement(TrendingDown, { size: 16, className: 'text-slate-500' }),
      createElement('span', { className: 'text-xs font-bold uppercase tracking-widest text-slate-600' }, 'True Cost of Ownership')
    ),
    createElement('div', { className: 'p-6', style: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
      createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-4 gap-3' },
        createElement('div', { className: 'rounded-xl border border-slate-200 bg-white px-4 py-3' },
          createElement('p', { className: 'text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1' }, 'Monthly Loan'),
          createElement('p', { className: 'text-lg font-black text-slate-800' }, `$${fmtCur(monthlyPayment)}`)
        ),
        createElement('div', { className: 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3' },
          createElement('p', { className: 'text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1' }, 'Monthly Maint.'),
          createElement('p', { className: 'text-lg font-black text-amber-700' }, `$${fmtCur(monthlyMaintenance)}`)
        ),
        createElement('div', { className: 'rounded-xl border border-red-200 bg-red-50 px-4 py-3' },
          createElement('p', { className: 'text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1' }, 'Total Interest'),
          createElement('p', { className: 'text-lg font-black text-red-600' }, `$${fmtCur(totalInterest)}`)
        ),
        createElement('div', { className: 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3' },
          createElement('p', { className: 'text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1' }, 'True Total Cost'),
          createElement('p', { className: 'text-lg font-black text-emerald-700' }, `$${fmtCur(trueTotalCost)}`)
        )
      ),
      createElement('div', { className: 'flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3' },
        createElement('span', { className: 'text-[11px] text-amber-800', style: { lineHeight: '1.5' } },
          createElement('strong', null, 'True monthly cost: '),
          `$${fmtCur(monthlyPayment + monthlyMaintenance)} — including maintenance and storage. Over ${schedule.length} months (${Math.floor(schedule.length / 12)}yr ${schedule.length % 12}mo), that's $${fmtCur(totalMaintenance)} in non-loan costs.`
        )
      )
    )
  );
}

// ─── Calculator config ───────────────────────────────────────────────────────

const boatLoanConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'boatPrice',
      label: 'Boat Price',
      type: 'number',
      placeholder: '50,000',
      defaultValue: '50000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      inputMode: 'decimal',
      helpText: 'The total purchase price of the boat including any dealer fees, options, and accessories rolled into the financing. Boat prices range from $10,000 for a used fishing boat to $500,000+ for a new yacht. Enter the full negotiated price before down payment.',
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '10,000',
      defaultValue: '10000',
      prefix: '$',
      min: 0,
      step: 500,
      inputMode: 'decimal',
      helpText: 'Boat loans typically require 10–20% down. A larger down payment reduces the loan amount, monthly payment, and total interest. It may also help you qualify for a better interest rate since the lender\'s risk decreases with more equity upfront.',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'number',
      placeholder: '180',
      defaultValue: '180',
      unit: 'months',
      min: 12,
      max: 240,
      step: 12,
      required: true,
      inputMode: 'numeric',
      helpText: 'Boat loans often run 10–20 years (120–240 months). Longer terms reduce monthly payments but dramatically increase total interest — a 20-year loan can cost nearly double the interest of a 10-year loan. Shorter terms (10–12 years) are recommended if your budget allows.',
    },
    {
      id: 'interestRate',
      label: 'Interest Rate (APR)',
      type: 'number',
      placeholder: '7.5',
      defaultValue: '8',
      unit: '%',
      min: 0,
      max: 25,
      step: 0.01,
      required: true,
      inputMode: 'decimal',
      helpText: 'Boat loan rates are typically higher than auto loans due to longer terms and depreciation risk. Excellent credit (720+): 6–9%. Good credit (680–719): 9–12%. Average credit: 12–18%. Always compare at least 3 lenders including credit unions for the best marine loan rates.',
    },
    {
      id: 'monthlyMaintenance',
      label: 'Monthly Maintenance & Storage (Optional)',
      type: 'number',
      placeholder: '300',
      defaultValue: '300',
      prefix: '$',
      min: 0,
      step: 25,
      inputMode: 'decimal',
      helpText: 'Average boat ownership costs beyond the loan: marina storage or slip fees $100–500/mo, insurance $30–100/mo, routine maintenance $50–200/mo, winterization $50–150/mo (seasonal). Rule of thumb: budget 10% of the boat\'s value annually for maintenance and storage.',
    },
  ],

  calculate: (values) => {
    const priceRaw = parseFloat(values.boatPrice);
    const downPaymentRaw = parseFloat(values.downPayment) || 0;
    const termMonthsRaw = parseFloat(values.loanTerm);
    const interestRateRaw = parseFloat(values.interestRate);
    const monthlyMaintenanceRaw = parseFloat(values.monthlyMaintenance) || 0;

    if (isNaN(priceRaw) || isNaN(termMonthsRaw) || isNaN(interestRateRaw) || priceRaw <= 0 || termMonthsRaw <= 0) return [];

    const price = new Decimal(priceRaw);
    const downPayment = new Decimal(downPaymentRaw);
    const termMonths = termMonthsRaw;
    const annualRate = new Decimal(interestRateRaw).div(100);
    const monthlyMaintenance = new Decimal(monthlyMaintenanceRaw);
    const loanAmount = price.minus(downPayment);
    const monthlyRate = annualRate.div(12);

    if (loanAmount.lte(0) || termMonths <= 0) return [];

    let monthlyPayment: Decimal;
    if (monthlyRate.eq(0)) {
      monthlyPayment = loanAmount.div(termMonths);
    } else {
      const onePlusR = monthlyRate.plus(1);
      const powFactor = onePlusR.pow(termMonths);
      monthlyPayment = loanAmount.times(monthlyRate).times(powFactor).div(powFactor.minus(1));
    }

    const monthlyPaymentNum = monthlyPayment.toNumber();
    const totalPaid = monthlyPayment.times(termMonths);
    const totalInterest = totalPaid.minus(loanAmount);
    const totalMaintenance = monthlyMaintenance.times(termMonths);
    const trueTotalCost = downPayment.plus(totalPaid).plus(totalMaintenance);
    const trueMonthly = monthlyPayment.plus(monthlyMaintenance);

    const fmt = (d: Decimal) =>
      d.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      { id: 'monthlyPayment', label: 'Monthly Loan Payment', value: `$${fmt(monthlyPayment)}`, highlight: true, color: 'positive' as const },
      { id: 'trueMonthly', label: monthlyMaintenance.gt(0) ? 'True Monthly Cost (Loan + Maint.)' : 'Monthly Loan Payment', value: `$${fmt(trueMonthly)}`, color: monthlyMaintenance.gt(0) ? 'negative' as const : 'positive' as const },
      { id: 'totalInterest', label: 'Total Interest Paid', value: `$${fmt(totalInterest)}`, color: 'negative' as const },
      { id: 'totalMaintenance', label: monthlyMaintenance.gt(0) ? 'Total Maintenance & Storage' : 'Maintenance & Storage', value: monthlyMaintenance.gt(0) ? `$${fmt(totalMaintenance)}` : 'N/A', color: monthlyMaintenance.gt(0) ? 'negative' as const : 'neutral' as const },
      { id: 'trueTotal', label: 'True Total Cost of Ownership', value: `$${fmt(trueTotalCost)}`, color: 'negative' as const, highlight: true, interpretation: `Beyond the amount financed you'll pay $${fmt(totalInterest)} in interest${monthlyMaintenance.gt(0) ? ` and $${fmt(totalMaintenance)} in upkeep and storage` : ''} — this is the real cost of ownership, not the sticker price. Recreational-boat interest is rarely deductible, so budget against this figure.` },
      { id: 'loanAmount', label: 'Amount Financed', value: `$${fmt(loanAmount)}`, color: 'neutral' as const },
      { id: 'downPct', label: 'Down Payment %', value: `${priceRaw > 0 ? downPayment.div(price).times(100).toFixed(0) : 0}%`, color: 'neutral' as const },
      { id: 'termYears', label: 'Loan Term', value: `${Math.floor(termMonths / 12)}yr ${termMonths % 12}mo`, color: 'neutral' as const },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BoatLoanPanel, { values, results });
  },

  educational: {
    formula: 'M = P × [r(1+r)^n] / [(1+r)^n − 1]',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="#f8fafc" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">True Cost of Boat Ownership</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="#64748b">The loan payment is only half the story</text><g transform="translate(30,65)"><rect x="60" y="0" width="130" height="50" rx="8" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/><text x="125" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e40af">$50,000</text><text x="125" y="38" text-anchor="middle" font-size="9" fill="#64748b">Boat Price</text><text x="210" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#64748b">→</text><rect x="240" y="0" width="155" height="105" rx="10" fill="#f1f5f9"/><text x="317" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b">$50K Boat Cost</text><text x="265" y="36" text-anchor="middle" font-size="9" fill="#3b82f6">-$10K Down Payment</text><text x="265" y="52" text-anchor="middle" font-size="9" fill="#f59e0b">= $40K Loan Amount</text><text x="265" y="72" text-anchor="middle" font-size="9" fill="#64748b">15yr @ 8%:</text><text x="265" y="88" text-anchor="middle" font-size="11" font-weight="bold" fill="#ef4444">$382/mo payment</text><text x="265" y="102" text-anchor="middle" font-size="8" fill="#64748b">($48K in interest!)</text></g><g transform="translate(40,140)"><rect x="10" y="0" width="370" height="85" rx="10" fill="#fef3c7" stroke="#f59e0b" stroke-width="1"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">Hidden Costs of Boat Ownership</text><rect x="25" y="28" width="75" height="20" rx="4" fill="#ef4444"/><text x="62" y="42" text-anchor="middle" font-size="8" font-weight="bold" fill="#fff">Storage</text><rect x="108" y="28" width="75" height="20" rx="4" fill="#f59e0b"/><text x="145" y="42" text-anchor="middle" font-size="8" font-weight="bold" fill="#fff">Insurance</text><rect x="191" y="28" width="75" height="20" rx="4" fill="#8b5cf6"/><text x="228" y="42" text-anchor="middle" font-size="8" font-weight="bold" fill="#fff">Maintenance</text><rect x="274" y="28" width="75" height="20" rx="4" fill="#3b82f6"/><text x="311" y="42" text-anchor="middle" font-size="8" font-weight="bold" fill="#fff">Winterize</text><text x="195" y="72" text-anchor="middle" font-size="9" fill="#64748b">Total hidden: ~$300/mo → $54K over 15yr = more than the boat itself!</text></g><g transform="translate(40,238)"><rect x="10" y="0" width="370" height="90" rx="10" fill="#f1f5f9"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">True Cost of Ownership Breakdown</text><rect x="25" y="28" width="110" height="24" rx="4" fill="#3b82f6"/><text x="80" y="44" text-anchor="middle" font-size="9" font-weight="bold" fill="#fff">Loan P&I: $69K</text><rect x="145" y="28" width="110" height="24" rx="4" fill="#ef4444"/><text x="200" y="44" text-anchor="middle" font-size="9" font-weight="bold" fill="#fff">Interest: $48K</text><rect x="265" y="28" width="110" height="24" rx="4" fill="#f59e0b"/><text x="320" y="44" text-anchor="middle" font-size="9" font-weight="bold" fill="#fff">Maint: $54K</text><text x="195" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="#ef4444">True Total: $10K down + $69K payment + $54K maint = $133K</text></g></svg>',
      alt: 'Boat loan diagram showing boat price, down payment, loan amount breakdown, hidden costs including storage insurance maintenance and winterization, and true total cost of ownership calculation',
      caption: 'Boat loans stretch 10-20 years while the boat depreciates — maintenance and storage costs can double the true monthly cost of ownership',
    },
    formulaDescription:
      'The standard loan amortization formula computes a fixed monthly payment that pays off the boat loan exactly at the end of the term. P is the loan amount (boat price minus down payment), r is the monthly interest rate (APR divided by 12), and n is the total number of monthly payments (typically 120–240 for boat loans). Each monthly payment splits into an interest portion — calculated on the remaining balance — and a principal portion that reduces what you owe. Because interest is charged on a declining balance, early payments are mostly interest while later payments are mostly principal. The formula shows that longer boat loan terms reduce the monthly payment but dramatically increase total interest paid over the life of the loan — a 20-year boat loan can cost nearly twice the interest of a 10-year loan. The calculator adds the critical dimension of ongoing ownership costs (maintenance, storage, insurance, winterization) that are not part of the loan but represent a significant portion of the total cost of boat ownership and often exceed the loan payment itself.',
    variables: [
      { symbol: 'P (Principal)', name: 'Loan Amount', description: 'The amount financed — boat price minus your down payment. A larger down payment reduces P, which lowers both your monthly payment and the total interest you pay. Most marine lenders require 10–20% down. Putting down more than the minimum can also help you qualify for a lower interest rate since the loan-to-value ratio improves.' },
      { symbol: 'r (Monthly Rate)', name: 'Periodic Interest Rate', description: 'The annual APR divided by 12. For example, an 8% APR gives a monthly rate of 0.667%. This rate is applied to the outstanding balance each month. Boat loan rates are typically 1–3 percentage points higher than auto loans because boats depreciate faster and loan terms are longer, making them riskier for lenders. Credit unions often offer the most competitive marine loan rates.' },
      { symbol: 'n (Term)', name: 'Number of Monthly Payments', description: 'The total number of monthly payments over the loan term. Boat loans commonly run 120–240 months (10–20 years). The term length has a dramatic effect on total cost: doubling the term from 10 to 20 years can nearly double the total interest paid even at the same APR. Shorter terms are strongly recommended if your budget allows for the higher monthly payment.' },
      { symbol: 'True Cost', name: 'Actual Ownership Cost', description: 'Beyond the loan payment: marina storage or slip fees ($100–500/mo), boat insurance ($30–100/mo), routine maintenance like engine service and hull cleaning ($50–200/mo), and winterization in cold climates ($50–150/mo seasonal). These ongoing costs often total $300–600/month and can exceed the boat\'s purchase price over a 15–20 year ownership period. Many first-time boat buyers underestimate these costs by 50% or more.' },
    ],
    howToUse: [
      'Enter the total boat price including any dealer fees, options, electronics, and accessories you plan to finance together with the vessel.',
      'Enter your down payment amount. Marine lenders typically require 10–20% down. A larger down payment reduces your loan amount, monthly payment, and total interest cost.',
      'Set the loan term in months (120–240 months is typical for boat loans). Remember: longer terms lower the monthly payment but dramatically increase total interest.',
      'Enter the APR quoted by your marine lender. Boat loan rates are typically 6–12% for borrowers with good credit. Always compare offers from at least 3 lenders.',
      'Optionally enter your estimated monthly maintenance and storage costs to see the true total cost of boat ownership beyond just the loan payment.',
    ],
    commonUses: [
      'Calculate monthly boat loan payments and compare total interest costs across different loan terms (10, 12, 15, or 20 years) to find the best balance between affordable payments and minimizing total interest.',
      'Determine the true cost of boat ownership by adding ongoing expenses — marina storage, insurance, maintenance, and winterization — to the loan payment to see the full monthly financial commitment.',
      'Compare financing offers from different marine lenders, credit unions, and manufacturer promotional rates by evaluating total cost rather than just the monthly payment or stated APR.',
    ],
    workedExamples: [
      {
        scenario: 'Tom and Lisa are buying a used 24-foot center console fishing boat listed at $45,000. They have $9,000 (20%) for a down payment. Their credit union offers an 8.5% APR on a 12-year (144-month) marine loan. They estimate marina storage at $250/month, insurance at $50/month, and maintenance at $100/month.',
        inputs: { boatPrice: '45000', downPayment: '9000', loanTerm: '144', interestRate: '8.5', monthlyMaintenance: '400' },
        result: 'Monthly loan payment: $398; total interest: $21,342; true monthly cost (including $400/mo maintenance/storage): $798. Total cost of ownership over 12 years: $123,942.',
        insight: 'With a $36,000 loan at 8.5% over 12 years: monthly loan payment is $398, total interest is $21,342. Adding $400/month in maintenance and storage brings the true monthly cost to $798. Over 12 years, they will spend $57,600 on non-loan ownership costs alone — more than the boat\'s purchase price. The true total cost of ownership: $9,000 down + $57,342 in loan payments + $57,600 in maintenance = $123,942 total. Tom and Lisa should verify this fits their budget before committing and consider whether a 10-year term at a slightly higher payment saves enough interest to offset the shorter commitment.',
      },
      {
        scenario: 'David is a first-time boat buyer looking at a new $75,000 pontoon boat. The dealer offers promotional financing at 6.99% APR for 15 years (180 months) with 10% down. David is also considering a 10-year term at the same rate to save on interest, though the higher payment would be tight on his monthly budget.',
        inputs: { boatPrice: '75000', downPayment: '7500', loanTerm: '180', interestRate: '6.99', monthlyMaintenance: '350' },
        result: '15-year term: $606/month, $41,625 total interest. 10-year term: $783/month, $26,492 total interest — saving $15,133. True monthly cost with $350/mo ownership expenses: $956 (15yr) or $1,133 (10yr).',
        insight: 'With the 15-year term: $67,500 loan, monthly payment is $606, total interest is $41,625. With a 10-year term: monthly payment jumps to $783 — $177 more per month — but total interest drops to $26,492, a savings of $15,133. Adding $350/month in ownership costs brings the true monthly to $956 (15yr) or $1,133 (10yr). David should check whether the $177/month savings from the longer term is worth paying $15,133 more in interest over the life of the loan. If his budget can handle the 10-year payment, the interest savings alone could fund several years of maintenance and storage.',
      },
      {
        scenario: 'Maria is considering buying a used 30-foot sailboat for $35,000 with $7,000 down at a 9.5% APR over 15 years. She lives in New England where the boat must be winterized and stored on the hard for 5 months each year, adding significant seasonal costs.',
        inputs: { boatPrice: '35000', downPayment: '7000', loanTerm: '180', interestRate: '9.5', monthlyMaintenance: '450' },
        result: 'Monthly loan payment: $293; total interest: $24,671; true monthly cost (including $450/mo ownership): $743. Total non-loan costs over 15 years: $81,000.',
        insight: 'With a $28,000 loan at 9.5% over 15 years: monthly payment is $293, total interest is $24,671. Adding $450/month for slip fees, winter storage, insurance, and annual haul-out and bottom paint brings the true monthly to $743. Over 15 years, non-loan costs total $81,000 — more than double the boat\'s price. Maria should consider whether buying a smaller boat or joining a boat club might provide similar enjoyment at a fraction of the total cost, especially given the short New England boating season.',
      },
    ],
    proTips: [
      'Get pre-approved with at least 3 marine lenders before shopping. Credit unions, specialized marine lenders (such as Trident Funding and Sterling Associates), and manufacturer captive finance arms often have very different rates and terms for the same borrower.',
      'Consider a 10–12 year term instead of 15–20 years. A 12-year loan at 8% on $40,000 costs about $20,000 less in total interest than a 20-year loan. The monthly payment difference is often smaller than you think — about $150–200/month.',
      'Budget 10% of the boat\'s value annually for maintenance, storage, and insurance. On a $50,000 boat, that is $5,000/year or about $415/month — often more than the loan payment itself. This is the most common financial surprise for first-time boat owners.',
      'Check whether your lender requires a marine survey. Boats over 5–10 years old typically require a professional survey ($500–1,000) that assesses hull condition, engine hours, and safety equipment before the lender will approve the loan. Budget this into your purchase costs.',
      'If you boat seasonally, consider whether a boat club membership ($3,000–8,000/year) provides better value than ownership. Boat clubs give you access to a fleet without the loan, maintenance, storage, and depreciation headaches of ownership.',
    ],
    limitations: [
      'This calculator assumes a fixed interest rate for the entire loan term. Some marine lenders offer variable-rate boat loans, particularly for larger vessels — if your rate can adjust, the actual cost may differ.',
      'The calculator models a standard amortizing loan with equal monthly payments; some boat loans use balloon payments or seasonal payment structures (lower payments in off-season months) which are not modeled here.',
      'Maintenance and storage costs are estimates based on national averages and vary significantly by region (coastal vs. inland, saltwater vs. freshwater), boat type (power vs. sail), boat age, and whether you do your own maintenance.',
      'The calculator does not account for boat depreciation, which is typically steepest in the first 3–5 years of ownership and can result in negative equity if you sell before the loan is substantially paid down.',
      'Tax implications — such as the mortgage interest deduction for boats that qualify as second homes (must have sleeping, cooking, and toilet facilities) — are not included.',
      'Insurance costs vary widely based on the boat\'s value, your boating experience, the navigation area, and the coverage limits you select.',
      'This is an educational estimation tool and should be used alongside direct quotes from marine lenders, insurance agents, and marina operators rather than as a substitute for professional financial advice.',
    ],
    quickReference: [
      { label: 'Excellent Credit (720+)', value: '6–9% APR, 10–15% down, 10–20 year term' },
      { label: 'Good Credit (680–719)', value: '9–12% APR, 15–20% down, 10–15 year term' },
      { label: 'Average Credit (640–679)', value: '12–18% APR, 20%+ down, 10–12 year term' },
      { label: 'Large Loans ($100K+)', value: '5.5–8% APR, 15–20% down, 15–20 year term' },
    ],
    citations: [
      { source: 'Consumer Financial Protection Bureau — Boat and RV Loans', url: 'https://www.consumerfinance.gov/consumer-tools/auto-loans/' },
      { source: 'National Marine Lenders Association — Boat Loan Guide', url: 'https://www.marinelenders.org/' },
      { source: 'Discover Boating — Boat Ownership Costs', url: 'https://www.discoverboating.com/ownership/' },
      { source: 'BoatUS — Cost of Boat Ownership Study', url: 'https://www.boatus.com/expert-advice/' },
      { source: 'Investopedia — Boat Loan Guide', url: 'https://www.investopedia.com/boat-loans-5185103' },
    ],
    explanation:
      'A boat loan is fundamentally different from an auto loan in one critical respect: the term can stretch to 20 years while the underlying asset depreciates steadily. A $50,000 boat financed over 15 years at 8% APR costs $48,000 in interest alone — nearly as much as the boat itself. When you add $300–500 per month in marina storage, insurance, routine maintenance, and winterization, the true cost of ownership over the loan term can exceed $130,000. Many first-time boat buyers focus exclusively on the monthly loan payment and overlook that the long tail of interest and ongoing upkeep can far exceed the purchase price. The recreational marine lending industry dates back to the mid-20th century post-World War II boom in leisure boating, when manufacturers like Chris-Craft partnered with banks to offer the first dedicated boat financing programs. Today the U.S. recreational boating market exceeds $50 billion annually with over 12 million registered vessels, and marine lenders finance everything from $10,000 used fishing boats to multi-million-dollar yachts. This calculator makes the hidden costs of boat ownership visible by showing: the monthly loan payment, the true monthly cost including maintenance and storage, total interest over the full loan term, and the true total cost of ownership. The "True Cost of Ownership" panel below the results breaks down how much of your spending goes to interest versus principal versus maintenance, helping buyers make an informed decision about whether the total cost aligns with their budget and expected enjoyment.',
    faqs: [
      {
        question: 'Are boat loans different from auto loans?',
        answer: 'Yes — boat loans typically have longer terms (10–20 years vs. 5–7 years for cars), higher interest rates (1–3% above auto rates), and often require larger down payments (10–20% vs. 0–10%). Boats depreciate faster than cars in the first few years, so lenders see them as riskier collateral. The application process also differs: boat lenders often require a marine survey (professional appraisal) for used vessels over 5–10 years old, and some require proof of insurance before closing. Unlike auto loans, some boat loans allow seasonal payment structures where you pay less during the off-season months when the boat is in storage. Specialized marine lenders and credit unions typically offer better boat loan terms than traditional banks.',
      },
      {
        question: 'What is a typical boat loan interest rate?',
        answer: 'As of 2026: borrowers with excellent credit (720+) can expect 6–9% APR on new and used boat loans. Good credit (680–719): 9–12%. Average credit (640–679): 12–18%. Below 640: 18–25%+. Rates vary by loan amount (jumbo loans over $100K may get lower rates), boat age (newer boats get better rates), and loan term (shorter terms have lower rates). Manufacturer promotional financing on new boats can offer rates as low as 4–6% for well-qualified buyers. Always compare at least 3 lenders including credit unions, which often have the most competitive marine loan rates. Be aware that "teaser rates" may only apply for the first few years before adjusting upward.',
      },
      {
        question: 'Should I finance or pay cash for a boat?',
        answer: 'If you can pay cash without depleting your emergency fund or liquidating investments that earn more than the boat loan rate, cash avoids interest entirely. However, with boat loan rates in the 6–9% range for good-credit borrowers, financing may be reasonable if you keep the term shorter (10–12 years) and make a substantial down payment. The more important question: is the true total cost — interest plus maintenance, storage, insurance, and depreciation — worth the enjoyment you expect from the boat? Many financial advisors classify boats as "lifestyle assets" rather than investments because they almost always depreciate. If you use the boat frequently (50+ days per year), the cost-per-use can be reasonable. If it sits at the marina most weekends, a boat club or rental may provide better value.',
      },
      {
        question: 'What is a marine survey and do I need one for a boat loan?',
        answer: 'A marine survey is a professional inspection of a boat\'s condition, similar to a home inspection. Surveyors check the hull, deck, engine, electrical systems, safety equipment, and overall seaworthiness. Most lenders require a survey for used boats over 5–10 years old or for any boat valued above $50,000. Surveys typically cost $500–1,000 depending on boat size and are paid by the buyer. The survey protects both you and the lender by identifying issues that could affect the boat\'s value or safety. Some lenders also require a separate engine survey for inboard or sterndrive engines, particularly on older vessels. Budget for a survey in your purchase costs — a clean survey can also help you negotiate the price if issues are found.',
      },
      {
        question: 'What hidden costs should I budget for beyond the boat loan?',
        answer: 'The biggest surprise for new boat owners is that annual ownership costs typically run 10–15% of the boat\'s value. Key ongoing expenses include: marina slip or dry stack storage ($100–500/month), boat insurance ($30–100/month depending on coverage and navigation area), routine maintenance such as engine service, oil changes, and hull cleaning ($50–200/month), winterization and shrink-wrapping in cold climates ($500–1,500/year), registration and property taxes (varies by state), and unexpected repairs — budget at least $1,000–2,000/year for surprises. On a $50,000 boat, expect to spend $5,000–7,500/year ($415–625/month) on these costs in addition to the loan payment. Over a 15-year ownership period, non-loan costs can easily exceed the boat\'s purchase price by a wide margin.',
      },
      {
        question: 'Can I deduct boat loan interest on my taxes?',
        answer: 'Possibly, but only under specific circumstances. The IRS allows you to deduct mortgage interest on a boat if it qualifies as a second home, which requires the boat to have sleeping quarters (a berth), a galley (cooking facilities), and a head (toilet). If your boat meets these requirements and the loan is secured by the boat, the interest may be deductible as qualified residence interest on up to $750,000 of combined mortgage debt (primary home plus second home). This deduction is only available if you itemize deductions on your tax return rather than taking the standard deduction. The vast majority of recreational boats — center consoles, bass boats, bowriders, and most pontoons — do not qualify. Always consult a tax professional about your specific situation, as the rules changed significantly with the Tax Cuts and Jobs Act of 2017.',
      },
    ],
  },
};

export default boatLoanConfig;
