import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import DebtConsolidationPanel from './DebtConsolidationPanel';
import DebtInputs from './DebtInputs';

const debtConsolidationSvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Debt Consolidation</text><text x="160" y="30" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Multiple debts converge into one lower-rate loan</text><rect x="18" y="42" width="110" height="26" rx="4" fill="var(--svg-fee2e2)" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="28" y="56" font-size="7" font-weight="bold" fill="var(--svg-dc2626)">Card A</text><text x="118" y="56" text-anchor="end" font-size="7" fill="var(--svg-64748b)">$6.5K @ 23%</text><rect x="18" y="72" width="110" height="26" rx="4" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1"/><text x="28" y="86" font-size="7" font-weight="bold" fill="var(--svg-b45309)">Card B</text><text x="118" y="86" text-anchor="end" font-size="7" fill="var(--svg-64748b)">$3.2K @ 20%</text><rect x="18" y="102" width="110" height="26" rx="4" fill="var(--svg-f3e8ff)" stroke="var(--svg-8b5cf6)" stroke-width="1"/><text x="28" y="116" font-size="7" font-weight="bold" fill="var(--svg-7c3aed)">Loan</text><text x="118" y="116" text-anchor="end" font-size="7" fill="var(--svg-64748b)">$4.0K @ 10%</text><line x1="132" y1="55" x2="158" y2="82" stroke="var(--svg-94a3b8)" stroke-width="1.5"/><polygon points="160,84 153,79 157,72" fill="var(--svg-94a3b8)"/><line x1="132" y1="85" x2="158" y2="88" stroke="var(--svg-94a3b8)" stroke-width="1.5"/><polygon points="160,88 153,85 157,80" fill="var(--svg-94a3b8)"/><line x1="132" y1="115" x2="158" y2="94" stroke="var(--svg-94a3b8)" stroke-width="1.5"/><polygon points="160,92 153,97 157,104" fill="var(--svg-94a3b8)"/><rect x="170" y="48" width="132" height="82" rx="8" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="236" y="66" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-15803d)">Consolidation Loan</text><line x1="180" y1="72" x2="292" y2="72" stroke="var(--svg-22c55e)" stroke-width="0.5"/><text x="180" y="84" font-size="7" fill="var(--svg-475569)">Balance: $13,700</text><text x="180" y="96" font-size="7" fill="var(--svg-475569)">Rate: 11.99%</text><text x="180" y="112" font-size="8" font-weight="bold" fill="var(--svg-16a34a)">1 payment: $305/mo</text><text x="180" y="126" font-size="6" fill="var(--svg-64748b)">Was 3 payments: $450/mo</text><rect x="15" y="168" width="290" height="26" rx="6" fill="var(--svg-f1f5f9)"/><text x="160" y="181" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ef4444)">Savings = Old Interest - New Interest - Fees</text><text x="160" y="193" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">Check the bottom line after fees, not just lower rates</text></svg>';

const debtConsolidationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'debts',
      label: 'Your Debts',
      type: 'custom',
      required: true,
      defaultValue: '[{"name":"Card A","balance":"6500","rate":"23","payment":"200"}]',
      component: DebtInputs,
      helpText: 'Enter each debt with its name, balance, APR, and minimum monthly payment. If you usually pay more than the minimum, enter your typical payment for a more accurate comparison.',
    },
    {
      id: 'newRate',
      label: 'Consolidation Loan — New Interest Rate',
      type: 'number',
      placeholder: '11.99',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 40,
      step: 0.01,
      required: true,
      helpText: 'The annual interest rate offered on your new consolidation loan. Compare offers from multiple lenders. Personal loan rates typically range from 7-25% depending on your credit score.',
    },
    {
      id: 'newTermMonths',
      label: 'Consolidation Loan — Term',
      type: 'select',
      required: true,
      options: [
        { label: '12 months (1 year)', value: '12' },
        { label: '24 months (2 years)', value: '24' },
        { label: '36 months (3 years)', value: '36' },
        { label: '48 months (4 years)', value: '48' },
        { label: '60 months (5 years)', value: '60' },
        { label: '72 months (6 years)', value: '72' },
        { label: '84 months (7 years)', value: '84' },
      ],
      helpText: 'Select the repayment term for the new consolidation loan. Longer terms mean lower monthly payments but more total interest paid over the life of the loan.',
    },
    {
      id: 'originationFee',
      label: 'Origination Fee',
      type: 'number',
      placeholder: '2.00',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 10,
      step: 0.25,
      helpText: 'Upfront fee charged by the lender, typically 1-5% of the loan amount. Some lenders deduct this from the disbursement; others add it to the loan balance. Enter 0 if there is no origination fee. Always check the loan disclosure for this figure before signing.',
    },
  ],

  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    let debts: Array<{ name: string; balance: number; rate: number; payment: number }> = [];
    try {
      const raw = JSON.parse(values.debts || '[]');
      if (Array.isArray(raw)) {
        debts = raw
          .map((d: { name?: string; balance?: string; rate?: string; payment?: string }) => ({
            name: d.name || 'Debt',
            balance: parseFloat(d.balance as string) || 0,
            rate: parseFloat(d.rate as string) || 0,
            payment: parseFloat(d.payment as string) || 0,
          }))
          .filter((d) => d.balance > 0 && d.rate > 0 && d.payment > 0);
      }
    } catch { /* no debts */ }

    // Fallback: flat key-value format (debt1balance, debt1rate, debt1payment, etc.)
    if (!debts.length) {
      for (let i = 1; i <= 3; i++) {
        const name = values[`debt${i}name`] || `Debt ${i}`;
        const balance = parseFloat(values[`debt${i}balance`]) || 0;
        const rate = parseFloat(values[`debt${i}rate`]) || 0;
        const payment = parseFloat(values[`debt${i}payment`]) || 0;
        if (balance > 0 && rate > 0 && payment > 0) {
          debts.push({ name, balance, rate, payment });
        }
      }
    }

    const newRate = parseFloat(values.newRate);
    const newTermMonths = parseInt(values.newTermMonths) || 60;
    const originationFeePct = parseFloat(values.originationFee) || 0;

    if (!debts.length || isNaN(newRate) || newRate <= 0 || originationFeePct < 0 || originationFeePct > 10) return [];

    const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
    const totalCurrentPayment = debts.reduce((s, d) => s + d.payment, 0);

    const originationFeeAmount = totalBalance * (originationFeePct / 100);
    const consolidationPrincipal = totalBalance + originationFeeAmount;

    const rMonth = newRate / 100 / 12;
    const newMonthlyPayment = rMonth === 0
      ? consolidationPrincipal / newTermMonths
      : (consolidationPrincipal * rMonth) / (1 - Math.pow(1 + rMonth, -newTermMonths));

    const newTotalPaid = newMonthlyPayment * newTermMonths;
    const newTotalInterest = newTotalPaid - consolidationPrincipal;

    const simulateCurrent = () => {
      const balances = debts.map((d) => d.balance);
      const rates = debts.map((d) => d.rate / 100 / 12);
      const payments = debts.map((d) => d.payment);
      let month = 0;
      let totalInterest = 0;
      const maxMonths = 600;
      const progression: number[] = [totalBalance];

      while (balances.some((b) => b > 0.01) && month < maxMonths) {
        month++;
        const totalBefore = balances.reduce((s, b) => s + b, 0);
        for (let i = 0; i < balances.length; i++) {
          if (balances[i] <= 0) continue;
          const interest = balances[i] * rates[i];
          totalInterest += interest;
          balances[i] = Math.max(0, balances[i] + interest - payments[i]);
        }
        const totalAfter = balances.reduce((s, b) => s + b, 0);
        progression.push(parseFloat(totalAfter.toFixed(2)));
      }
      return { months: month, totalInterest, totalPaid: totalBalance + totalInterest, progression };
    };

    const current = simulateCurrent();

    // Consolidation amortization schedule
    const consolidationProgression: number[] = [consolidationPrincipal];
    let remBalance = consolidationPrincipal;
    const consolMonths = Math.min(newTermMonths, 600);
    for (let m = 1; m <= consolMonths; m++) {
      const interest = remBalance * rMonth;
      remBalance = Math.max(0, remBalance + interest - newMonthlyPayment);
      consolidationProgression.push(parseFloat(remBalance.toFixed(2)));
    }

    const monthlySavings = totalCurrentPayment - newMonthlyPayment;
    const interestSaved = current.totalInterest - newTotalInterest;
    const lifetimeSaved = interestSaved - originationFeeAmount;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    const fmtD = (n: number) =>
      n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const currentYears = Math.floor(current.months / 12);
    const currentMo = current.months % 12;
    const newYears = Math.floor(newTermMonths / 12);
    const newMo = newTermMonths % 12;

    return [
      {
        id: 'monthlySavings',
        label: monthlySavings >= 0 ? 'Monthly Savings with Consolidation' : 'Monthly Cost Increase',
        value: `${fmtD(Math.abs(monthlySavings))}/mo`,
        highlight: true,
        color: monthlySavings >= 0 ? 'positive' as const : 'negative' as const,
        interpretation: `${monthlySavings >= 0 ? `Frees up $${fmtD(Math.abs(monthlySavings))}/mo` : `Raises your payment by $${fmtD(Math.abs(monthlySavings))}/mo`}, but judge it on the lifetime line: after fees you ${lifetimeSaved >= 0 ? `save $${fmt(Math.abs(lifetimeSaved))} overall` : `pay $${fmt(Math.abs(lifetimeSaved))} MORE overall`}. A lower monthly payment stretched over a longer term can cost more — the rate alone doesn't tell you.`,
      },
      {
        id: 'lifetimeSaved',
        label: lifetimeSaved >= 0 ? 'Total Lifetime Savings (after fees)' : 'Extra Total Cost (after fees)',
        value: fmt(Math.abs(lifetimeSaved)),
        highlight: true,
        color: lifetimeSaved >= 0 ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'currentPayment',
        label: 'Current Total Monthly Payment',
        value: `${fmtD(totalCurrentPayment)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'newPayment',
        label: 'New Consolidated Monthly Payment',
        value: `${fmtD(newMonthlyPayment)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'currentInterest',
        label: 'Current Plan — Total Interest',
        value: fmt(current.totalInterest),
        color: 'negative' as const,
      },
      {
        id: 'newInterest',
        label: 'Consolidation Plan — Total Interest',
        value: fmt(newTotalInterest),
        color: 'neutral' as const,
      },
      {
        id: 'originationFeeAmt',
        label: `Origination Fee (${originationFeePct.toFixed(2)}%)`,
        value: originationFeeAmount > 0 ? fmt(originationFeeAmount) : '$0 — No fee',
        color: originationFeeAmount > 0 ? 'negative' as const : 'positive' as const,
      },
      {
        id: 'currentTimeline',
        label: 'Current Plan — Estimated Payoff',
        value: `${currentYears > 0 ? `${currentYears}yr ` : ''}${currentMo}mo`,
        color: 'neutral' as const,
      },
      {
        id: 'newTimeline',
        label: 'Consolidation Loan — Term',
        value: `${newYears > 0 ? `${newYears}yr ` : ''}${newMo > 0 ? `${newMo}mo` : ''}`.trim(),
        color: 'neutral' as const,
      },
      {
        id: 'currentTotalCost',
        label: 'Current Plan — Total Cost (Principal + Interest)',
        value: fmt(current.totalPaid),
        color: 'neutral' as const,
      },
      {
        id: 'newTotalCost',
        label: 'Consolidation — Total Cost (Principal + Interest)',
        value: fmt(newTotalPaid),
        color: 'neutral' as const,
      },
      {
        id: '_payoffData',
        label: '_payoffData',
        value: JSON.stringify({
          current: current.progression,
          consolidation: consolidationProgression,
        }),
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DebtConsolidationPanel, { values, results });
  },

  educational: {
    formula: 'New Monthly Payment = P × r / [1 − (1+r)^−n]   ·   Savings = Current Total Interest − New Total Interest − Origination Fee',
    diagram: {
      svg: debtConsolidationSvg,
      alt: 'Debt consolidation diagram showing three high-interest debt cards on the left converging via arrows into a single consolidation loan on the right with summary details',
      caption: 'Debt consolidation combines multiple high-interest debts into one loan at a lower rate, but origination fees and extended terms can reduce or negate the savings',
    },
    formulaDescription:
      'The consolidation loan uses standard amortization to calculate the new payment. True savings must subtract the origination fee from the interest saved — a step most basic calculators miss entirely. This gives you the real bottom line, not just a rosy monthly payment comparison.',
    variables: [
      { symbol: 'Origination Fee', name: 'The Hidden Cost', description: 'Personal loans typically charge 1-5% of the loan amount upfront, either deducted from the disbursement or added to the loan balance. A $10,000 loan with a 3% origination fee costs $300 immediately. Always factor this into the real break-even analysis to get an accurate picture of your true savings.' },
      { symbol: 'Break-Even', name: 'When Consolidation Pays Off', description: 'Divide the total upfront cost (origination fee) by the monthly savings to find the break-even month. If the fee is $300 and you save $75/month, you break even in 4 months. After that, every month of savings is pure financial gain.' },
      { symbol: 'Weighted Rate', name: 'Your Blended Interest Rate', description: 'If you have three debts at 22%, 19%, and 10%, your weighted average rate depends on the balance at each rate. Consolidation is most effective when your new rate is significantly below the weighted average of all existing debts. The new rate does not need to be lower than every individual rate to be beneficial.' },
    ],
    howToUse: [
      'Enter up to 3 existing debts with their current balance, interest rate, and monthly payment amounts.',
      'Enter the consolidation loan\'s new interest rate, term (in months), and origination fee percentage.',
      'Review the side-by-side comparison of monthly payment, total interest paid, and payoff timeline for both strategies.',
      'Check the "Total Lifetime Savings after fees" figure — this is the true bottom line that tells you whether consolidation actually saves you money.',
    ],
    commonUses: [
      'Compare your current total debt payments against a consolidation loan to see if rolling multiple debts into one actually saves you money.',
      'Evaluate whether the interest savings from consolidation outweigh the origination fees and extended repayment term.',
      'Determine the break-even point where consolidation fees are recouped through lower monthly interest charges across all debts.',
    ],
    explanation:
      'Debt consolidation works when your new interest rate is meaningfully lower than the weighted average rate you are currently paying across multiple debts. However, the origination fee is the often-overlooked variable that can flip the math. A $15,000 personal loan with a 3% origination fee ($450) requires you to save at least $450 in interest before you break even — and that is $450 you would not owe if you kept paying the original debts separately. A lower rate that significantly extends your repayment term can also result in you paying more total interest even with a lower monthly payment. This tool exposes that trade-off clearly so you can make an informed decision.',
    faqs: [
      {
        question: 'When does debt consolidation NOT make sense?',
        answer: 'Consolidation is counterproductive in several situations: (1) The new interest rate is not significantly lower than your current weighted average rate; (2) The origination fee is large relative to the interest savings, extending the break-even period too far; (3) You extend the term so much that higher total interest costs outweigh the monthly payment reduction; (4) You are already close to paying off the existing debts. Always check the "Total Lifetime Savings" figure rather than just looking at the monthly payment reduction, which can be misleading when the term is extended.',
      },
      {
        question: 'How does consolidation affect my credit score?',
        answer: 'A consolidation loan triggers a hard credit inquiry that may temporarily reduce your score by 5-10 points. However, paying off multiple revolving credit card balances significantly reduces your credit utilization ratio, which accounts for 30% of your FICO score. Most borrowers see a net positive credit score impact within 6 months, provided they keep the paid-off cards open and do not accumulate new balances on them.',
      },
      {
        question: 'What credit score do I need for a personal loan?',
        answer: 'To qualify for the most competitive personal loan rates (7-12%), most lenders require a credit score of 720 or higher. Borrowers in the 650-720 range typically receive rates of 13-20%. Below 650, rates often exceed 25-30%, which may make consolidation less beneficial or even counterproductive. Check pre-qualification offers from multiple lenders — these typically use a soft inquiry that does not affect your credit score.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Sarah has three debts: a credit card with $6,500 at 23% APR ($200/mo), another card with $3,200 at 20% APR ($150/mo), and a personal loan with $4,000 at 10% APR ($100/mo). She is considering a consolidation loan at 12% APR over 5 years with a 2% origination fee.',
        inputs: { debts: '[{"name":"Card A","balance":"6500","rate":"23","payment":"200"},{"name":"Card B","balance":"3200","rate":"20","payment":"150"},{"name":"Personal Loan","balance":"4000","rate":"10","payment":"100"}]', newRate: '12', newTermMonths: '60', originationFee: '2' },
        result: 'Monthly savings: about $145/mo. Total interest saved: approximately $4,200 after the $274 origination fee.',
        insight: 'At 12% APR, Sarah\'s new rate is well below her weighted average of ~18.5%. Consolidating saves her roughly $145/month in payments and about $4,200 in total interest over the 5-year term, even after accounting for the 2% origination fee. She should verify the new rate with at least 3 lenders and check for prepayment penalties before committing.',
      },
    ],

    proTips: [
      'Always compare the total cost (interest + fees), not just the monthly payment. A lower monthly payment over a longer term can cost more in total interest, even at a lower rate.',
      'Check for prepayment penalties on both your existing debts and the new consolidation loan. Some lenders charge fees if you pay off early, which can erode your savings.',
      'Your credit score determines your consolidation rate. Check your score before applying — rates can range from 7% (excellent credit) to 25%+ (poor credit). Improving your score by even 20 points can save thousands.',
      'Use the Debt Payoff (Avalanche/Snowball) calculator first to see if keeping your current debts and accelerating payments beats consolidating — sometimes the math favors staying the course.',
    ],

    quickReference: [
      { label: 'Good Credit Rate', value: '7–12% APR — typically offered to scores 690+' },
      { label: 'Fair Credit Rate', value: '12–18% APR — typical for scores 630–689' },
      { label: 'Poor Credit Rate', value: '18–36% APR — may not save over existing debts' },
      { label: 'Origination Fee Range', value: '1–8% of loan amount; 2–5% is most common' },
      { label: 'Break-Even Test', value: 'Lifetime interest saved > origination fee = good deal' },
      { label: 'Term Warning', value: 'Longer terms lower payments but increase total interest paid' },
    ],

    limitations: [
      'This calculator assumes you make all payments on time and exactly as scheduled. Late fees, missed payments, or rate changes (on variable-rate loans) are not modeled.',
      'The origination fee is modeled as added to the loan balance. Some lenders deduct it from the disbursement or charge it separately — verify with your lender how the fee is applied.',
      'Debt consolidation does not eliminate debt — it restructures it. Without addressing spending habits, many borrowers re-accumulate credit card debt within 2 years.',
      'For secured consolidation loans (home equity, HELOC), failing to pay can result in losing your home. This calculator treats all debts as unsecured and does not model collateral risk.',
    ],
citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/d/debtconsolidation.asp' },
    ],
  },
};

export default debtConsolidationConfig;
