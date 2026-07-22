import { createElement, useMemo } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { pmt, buildSchedule, fmtCurrency } from '../../../utils/financial';
import { TrendingDown } from 'lucide-react';

function BoatLoanPanel({ values }: { values: Record<string, string>; results: CalculatorResult[] }) {
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingDown size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">True Cost of Ownership</span>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Monthly Loan</p>
            <p className="text-lg font-black text-slate-800">{fmtCurrency(monthlyPayment)}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Monthly Maint.</p>
            <p className="text-lg font-black text-amber-700">{fmtCurrency(monthlyMaintenance)}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Total Interest</p>
            <p className="text-lg font-black text-red-600">{fmtCurrency(totalInterest)}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">True Total Cost</p>
            <p className="text-lg font-black text-emerald-700">{fmtCurrency(trueTotalCost)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <span className="text-[11px] text-amber-800 leading-relaxed">
            <strong>True monthly cost:</strong> {fmtCurrency(monthlyPayment + monthlyMaintenance)} — including maintenance and storage.
            Over {schedule.length} months ({Math.floor(schedule.length / 12)}yr {schedule.length % 12}mo), that's {fmtCurrency(totalMaintenance)} in non-loan costs.
          </span>
        </div>
      </div>
    </div>
  );
}

const boatLoanConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'boatPrice',
      label: 'Boat Price',
      type: 'number',
      placeholder: '50,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 500,
      helpText: 'Boat loans typically require 10–20% down. Larger down payments may get better rates.',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'number',
      placeholder: '180',
      unit: 'months',
      min: 12,
      max: 240,
      step: 12,
      required: true,
      helpText: 'Boat loans often run 10–20 years (120–240 months). Longer terms = lower payments but more interest.',
    },
    {
      id: 'interestRate',
      label: 'Interest Rate (APR)',
      type: 'number',
      placeholder: '7.5',
      unit: '%',
      min: 0,
      max: 25,
      step: 0.01,
      required: true,
      helpText: 'Boat loan rates are typically higher than auto loans. Excellent credit: 6–9%. Average credit: 9–14%.',
    },
    {
      id: 'monthlyMaintenance',
      label: 'Monthly Maintenance & Storage (Optional)',
      type: 'number',
      placeholder: '300',
      prefix: '$',
      min: 0,
      step: 25,
      helpText: 'Average boat ownership costs: storage $100–500/mo, insurance $30–100/mo, maintenance $50–200/mo.',
    },
  ],

  calculate: (values) => {
    const price = parseFloat(values.boatPrice);
    const downPayment = parseFloat(values.downPayment) || 0;
    const termMonths = parseFloat(values.loanTerm);
    const interestRate = parseFloat(values.interestRate) / 100;
    const monthlyMaintenance = parseFloat(values.monthlyMaintenance) || 0;

    if (isNaN(price) || isNaN(termMonths) || isNaN(interestRate) || price <= 0 || termMonths <= 0) return [];

    const loanAmount = price - downPayment;
    const monthlyRate = interestRate / 12;
    const monthlyPayment = monthlyRate > 0 ? pmt(loanAmount, monthlyRate, termMonths) : loanAmount / termMonths;
    const totalPaid = monthlyPayment * termMonths;
    const totalInterest = totalPaid - loanAmount;
    const totalMaintenance = monthlyMaintenance * termMonths;
    const trueTotalCost = downPayment + totalPaid + totalMaintenance;

    return [
      { id: 'monthlyPayment', label: 'Monthly Loan Payment', value: `${fmtCurrency(monthlyPayment)}`, highlight: true, color: 'positive' as const },
      { id: 'trueMonthly', label: monthlyMaintenance > 0 ? 'True Monthly Cost (Loan + Maint.)' : 'Monthly Loan Payment', value: `${fmtCurrency(monthlyPayment + monthlyMaintenance)}`, color: monthlyMaintenance > 0 ? 'negative' as const : 'positive' as const },
      { id: 'totalInterest', label: 'Total Interest Paid', value: fmtCurrency(totalInterest), color: 'negative' as const },
      { id: 'totalMaintenance', label: monthlyMaintenance > 0 ? 'Total Maintenance & Storage' : '—', value: monthlyMaintenance > 0 ? fmtCurrency(totalMaintenance) : 'N/A', color: monthlyMaintenance > 0 ? 'negative' as const : 'neutral' as const },
      { id: 'trueTotal', label: 'True Total Cost of Ownership', value: fmtCurrency(trueTotalCost), color: 'negative' as const, highlight: true },
      { id: 'loanAmount', label: 'Amount Financed', value: fmtCurrency(loanAmount), color: 'neutral' as const },
      { id: 'downPct', label: 'Down Payment %', value: `${((downPayment / price) * 100).toFixed(0)}%`, color: 'neutral' as const },
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
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="#f8fafc" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">True Cost of Boat Ownership</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="#64748b">The loan payment is only half the story</text><g transform="translate(30,65)"><!-- Boat price box --><rect x="60" y="0" width="130" height="50" rx="8" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/><text x="125" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e40af">$50,000</text><text x="125" y="38" text-anchor="middle" font-size="9" fill="#64748b">Boat Price</text><text x="210" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#64748b">→</text><!-- Loan breakdown --><rect x="240" y="0" width="155" height="105" rx="10" fill="#f1f5f9"/><text x="317" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b">$50K Boat Cost</text><text x="265" y="36" text-anchor="middle" font-size="9" fill="#3b82f6">-$10K Down Payment</text><text x="265" y="52" text-anchor="middle" font-size="9" fill="#f59e0b">= $40K Loan Amount</text><text x="265" y="72" text-anchor="middle" font-size="9" fill="#64748b">15yr @ 8%:</text><text x="265" y="88" text-anchor="middle" font-size="11" font-weight="bold" fill="#ef4444">$382/mo payment</text><text x="265" y="102" text-anchor="middle" font-size="8" fill="#64748b">($48K in interest!)</text></g><!-- Hidden costs section --><g transform="translate(40,140)"><rect x="10" y="0" width="370" height="85" rx="10" fill="#fef3c7" stroke="#f59e0b" stroke-width="1"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">Hidden Costs of Boat Ownership</text><rect x="25" y="28" width="75" height="20" rx="4" fill="#ef4444"/><text x="62" y="42" text-anchor="middle" font-size="8" font-weight="bold" class="fill-white">Storage</text><rect x="108" y="28" width="75" height="20" rx="4" fill="#f59e0b"/><text x="145" y="42" text-anchor="middle" font-size="8" font-weight="bold" class="fill-white">Insurance</text><rect x="191" y="28" width="75" height="20" rx="4" fill="#8b5cf6"/><text x="228" y="42" text-anchor="middle" font-size="8" font-weight="bold" class="fill-white">Maintenance</text><rect x="274" y="28" width="75" height="20" rx="4" fill="#3b82f6"/><text x="311" y="42" text-anchor="middle" font-size="8" font-weight="bold" class="fill-white">Winterize</text><text x="195" y="72" text-anchor="middle" font-size="9" fill="#64748b">Total hidden: ~$300/mo → $54K over 15yr = more than the boat itself!</text></g><!-- True cost summary --><g transform="translate(40,238)"><rect x="10" y="0" width="370" height="90" rx="10" fill="#f1f5f9"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">True Cost of Ownership Breakdown</text><rect x="25" y="28" width="110" height="24" rx="4" fill="#3b82f6"/><text x="80" y="44" text-anchor="middle" font-size="9" font-weight="bold" class="fill-white">Loan P&I: $69K</text><rect x="145" y="28" width="110" height="24" rx="4" fill="#ef4444"/><text x="200" y="44" text-anchor="middle" font-size="9" font-weight="bold" class="fill-white">Interest: $48K</text><rect x="265" y="28" width="110" height="24" rx="4" fill="#f59e0b"/><text x="320" y="44" text-anchor="middle" font-size="9" font-weight="bold" class="fill-white">Maint: $54K</text><text x="195" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="#ef4444">True Total: $10K down + $69K payment + $54K maint = $133K</text></g></svg>',
      alt: 'Boat loan diagram showing boat price, down payment, loan amount breakdown, hidden costs (storage, insurance, maintenance, winterization), and true total cost of ownership',
      caption: 'Boat loans stretch 10-20 years while the boat depreciates -- maintenance and storage costs can double the true monthly cost',
    },
    formulaDescription:
      'Standard loan amortization formula. Boat loans differ from auto loans in duration (often 10–20 years vs. 5–7 years) and the critical factor: maintenance and storage costs that can equal the loan payment itself. The formula shows that longer terms reduce monthly payments but dramatically increase total interest paid over the loan life.',
    variables: [
      { symbol: 'Principal & Term', name: 'Loan Amount & Duration', description: 'The loan amount (P) is the boat price minus down payment. The term (n) runs 120–240 months — longer terms mean interest can exceed the boat value itself, a common trap for buyers focused only on monthly payment affordability.' },
      { symbol: 'r', name: 'Monthly Rate', description: 'APR ÷ 12. Boat loan rates are generally higher than auto loans due to longer terms and depreciation risk. Credit quality is a major factor.' },
      { symbol: 'True Cost', name: 'Actual Ownership Cost', description: 'Beyond the loan: storage (slip/marina), insurance, maintenance, winterization, and depreciation. These often double the true monthly cost of boat ownership.' },
    ],
    howToUse: [
      'Enter the boat price — including any dealer fees and options rolled into financing.',
      'Enter your down payment. Most lenders require 10–20% down for boat loans. More down means less interest and better rates.',
      'Set the loan term — boat loans commonly run 10–20 years. Longer terms reduce payments but dramatically increase total interest.',
      'Enter the interest rate offered by your lender. Compare at least 3 lenders including credit unions.',
      'Optionally enter monthly maintenance and storage costs to see the true cost of ownership beyond just the loan payment.',
    ],
    commonUses: [
      'Calculate monthly payments and total interest on a boat loan over terms from 10 to 20 years for recreational vessel financing.',
      'Determine the true cost of boat ownership by factoring in loan payments plus ongoing maintenance and storage expenses.',
      'Compare loan offers from different marine lenders by evaluating how down payment size and interest rate affect total cost.',
    ],
    explanation:
      'Boat loans are fundamentally different from auto loans in one critical way: the asset depreciates while the loan term can stretch 20 years. A $50,000 boat financed over 15 years at 8% costs $48,000 in interest alone — nearly as much as the boat itself. When you add $300/month in storage and maintenance, the true cost of ownership over the loan term exceeds $130,000. Many boat buyers focus only on the monthly payment and miss that the long tail of interest and upkeep can exceed the purchase price. This calculator makes those hidden costs visible by showing: the monthly loan payment, the "true monthly cost" including maintenance and storage, total interest over the full term, and the true total cost of ownership. The "True Cost of Ownership" panel below the results breaks this down visually, showing how much of your total spending goes to interest vs. principal vs. maintenance. This perspective helps buyers make an informed decision about whether the total cost of ownership aligns with their budget and how much enjoyment they expect from the boat.',
    faqs: [
      {
        question: 'Are boat loans different from auto loans?',
        answer: 'Yes — boat loans typically have longer terms (10–20 years vs. 5–7 years), higher rates, and often require larger down payments. Boats depreciate faster than cars in the first few years, so lenders see them as riskier collateral. Some boat loans also require marine insurance and may have prepayment penalties. The application process is also different — boat lenders often require a survey (appraisal) for older vessels.',
      },
      {
        question: 'What is a typical boat loan interest rate?',
        answer: 'As of 2026: borrowers with excellent credit (720+) can expect 6–9% APR. Average credit (680–719): 9–12%. Below 680: 12–18%+. Rates vary by loan term (shorter = lower rates), boat age (new = lower rates), and loan amount (larger = sometimes better rates). Always compare at least 3 lenders, including credit unions which often have the best marine loan rates. Some manufacturers also offer promotional financing on new boats.',
      },
      {
        question: 'Should I finance or pay cash for a boat?',
        answer: 'If you can pay cash without depleting your emergency fund, cash avoids interest entirely. However, with current boat loan rates in the 6–9% range, financing may make sense if your alternative is selling investments that earn more than the loan rate. The real question: is the true total cost (interest + maintenance + storage + depreciation) worth the enjoyment you will get from the boat? Many financial advisors suggest that boats are "lifestyle assets" rather than investments — the financial decision should account for the utility and enjoyment you expect to receive.',
      },
    ],
  },
};

export default boatLoanConfig;
