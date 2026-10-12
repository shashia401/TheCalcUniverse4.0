import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RefinancePanel from './RefinancePanel';
import { computeRefi } from './refinanceMath';

const refinanceConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'currentBalance',
      label: 'Current Loan Balance',
      type: 'number',
      placeholder: '250,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
    },
    {
      id: 'currentRate',
      label: 'Current Interest Rate (APR)',
      type: 'number',
      placeholder: '7.5',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 25,
      step: 0.01,
      required: true,
    },
    {
      id: 'currentTerm',
      label: 'Current Remaining Term',
      type: 'number',
      placeholder: '300',
      unit: 'months',
      inputMode: 'decimal',
      min: 12,
      max: 360,
      step: 12,
      required: true,
      helpText: 'Number of months remaining on your current loan.',
    },
    {
      id: 'newRate',
      label: 'New Interest Rate (APR)',
      type: 'number',
      placeholder: '6.0',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 25,
      step: 0.01,
      required: true,
      helpText: 'The rate you have been quoted for the new loan.',
    },
    {
      id: 'newTerm',
      label: 'New Loan Term',
      type: 'number',
      placeholder: '360',
      unit: 'months',
      inputMode: 'decimal',
      min: 12,
      max: 360,
      step: 12,
      required: true,
      helpText: 'Term of the new loan. Resetting to 30 years may lower payment but extend interest total.',
    },
    {
      id: 'closingCosts',
      label: 'Refinance Closing Costs',
      type: 'number',
      placeholder: '6,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Typical refi closing costs: 2–5% of loan amount. Includes origination, appraisal, title.',
    },
    {
      id: 'plannedStay',
      label: 'How Long Will You Stay?',
      type: 'number',
      placeholder: '60',
      unit: 'months',
      inputMode: 'decimal',
      min: 1,
      max: 360,
      step: 6,
      required: true,
      helpText: 'Your planned time in the home. The key question: will you stay past the break-even point?',
    },
  ],

  calculate: (values) => {
    const c = computeRefi(values);
    if (!c) return [];
    const { monthlySavings, breakEvenMonths, plannedStay, closingCosts, interestSaved } = c;
    const rateLower = c.newRate < c.currentRate;
    const paysOffBeforeBreakEven = plannedStay < breakEvenMonths;
    const netInterestSaved = interestSaved - closingCosts;

    const fmt = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    // Recommendation
    let recommendation: string;
    let recColor: 'positive' | 'negative' | 'neutral';
    if (monthlySavings <= 0) {
      if (rateLower && netInterestSaved > 0) {
        // Shorter term: the payment rises but lifetime interest falls by more than the closing costs.
        recommendation = `Yes — shorter term saves ${fmt(netInterestSaved)} in interest after closing costs (payment rises ${fmt(-monthlySavings)}/mo)`;
        recColor = 'positive';
      } else {
        recommendation = rateLower ? 'Wait — interest savings do not cover the closing costs' : 'Wait — your new rate is not lower';
        recColor = 'negative';
      }
    } else if (plannedStay >= breakEvenMonths && rateLower) {
      recommendation = 'Yes — Refinance now';
      recColor = 'positive';
    } else if (paysOffBeforeBreakEven) {
      recommendation = `Wait — break-even (${breakEvenMonths}mo) exceeds your stay (${plannedStay}mo)`;
      recColor = 'negative';
    } else {
      recommendation = 'Review details carefully';
      recColor = 'neutral';
    }

    return [
      {
        id: 'recommendation',
        label: 'Recommendation',
        value: recommendation,
        highlight: true,
        color: recColor,
        interpretation: `Refinancing carries upfront closing costs, so it only pays off if you keep the loan past the break-even point (${breakEvenMonths < Infinity ? `about ${breakEvenMonths} months here` : 'a lower payment never pays them back at these numbers'}). ${monthlySavings > 0 ? `The lower payment helps, but resetting to a fresh 30-year term can still raise total interest even at a lower rate.` : rateLower ? `Your payment goes up because the term is shorter; the benefit comes from interest saved, not cash flow.` : `Your new rate isn't lower, so there's nothing to recover.`}`,
      },
      {
        id: 'monthlySavings',
        label: 'Monthly Payment Savings',
        value: monthlySavings > 0 ? fmt(monthlySavings) : 'No savings',
        color: monthlySavings > 0 ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'breakEven',
        label: 'Break-Even Point',
        value: breakEvenMonths < Infinity ? `${breakEvenMonths} months (${(breakEvenMonths / 12).toFixed(1)} years)` : 'Never',
        color: paysOffBeforeBreakEven ? 'negative' as const : 'positive' as const,
      },
      {
        id: 'oldPayment',
        label: 'Current Monthly Payment',
        value: fmt(c.oldPayment),
        color: 'neutral' as const,
      },
      {
        id: 'newPayment',
        label: 'New Monthly Payment',
        value: fmt(c.newPayment),
        color: c.newPayment < c.oldPayment ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'totalInterestSaved',
        label: 'Total Interest Saved (Full Term, before closing costs)',
        value: interestSaved > 0 ? fmt(interestSaved) : 'No savings',
        color: interestSaved > 0 ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'netBenefit',
        label: 'Net Benefit Over Planned Stay (payment savings - closing costs)',
        value: monthlySavings > 0 && plannedStay >= breakEvenMonths
          ? fmt(c.netOverStay)
          : monthlySavings > 0 ? `Not yet break-even` : '—',
        color: monthlySavings > 0 && plannedStay >= breakEvenMonths ? 'positive' as const : 'neutral' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RefinancePanel, { values });
  },

  educational: {
    formula: 'Break−Even = Closing Costs ÷ (Old Payment − New Payment)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="#f8fafc" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">Refinance: Break-Even Analysis</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="#64748b">When do your monthly savings cover the closing costs?</text><g transform="translate(30,65)"><!-- Before / After comparison boxes --><rect x="20" y="0" width="180" height="65" rx="8" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/><text x="110" y="20" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Before Refinance</text><text x="110" y="38" text-anchor="middle" font-size="13" font-weight="bold" fill="#991b1b">$1,848/mo</text><text x="110" y="55" text-anchor="middle" font-size="8" fill="#64748b">Current 7.5% rate</text><rect x="230" y="0" width="180" height="65" rx="8" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/><text x="320" y="20" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">After Refinance</text><text x="320" y="38" text-anchor="middle" font-size="13" font-weight="bold" fill="#166534">$1,499/mo</text><text x="320" y="55" text-anchor="middle" font-size="8" fill="#64748b">New 6.0% rate</text><!-- Savings arrow --><path d="M 170,35 L 230,35" stroke="#22c55e" stroke-width="2"/><text x="200" y="28" text-anchor="middle" font-size="10" font-weight="bold" fill="#22c55e">$349/mo</text><text x="200" y="65" text-anchor="middle" font-size="8" fill="#64748b">savings</text><!-- Break-even calculation --><rect x="40" y="80" width="350" height="55" rx="10" fill="#f1f5f9"/><text x="215" y="98" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">Break-Even = Closing Costs ÷ Monthly Savings</text><text x="80" y="118" text-anchor="middle" font-size="10" fill="#3b82f6">$6,000 ÷ $349 = 18 months</text><text x="290" y="118" text-anchor="middle" font-size="10" font-weight="bold" fill="#22c55e">Stay > 18mo? Refi!</text><text x="215" y="133" text-anchor="middle" font-size="9" fill="#64748b">Break-even under 24 months is excellent; 24-36mo is standard</text></g><!-- Decision diagram --><g transform="translate(40,160)"><rect x="10" y="0" width="370" height="90" rx="10" fill="#f1f5f9"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">Your Decision Depends on Your Time Horizon</text><text x="65" y="40" text-anchor="middle" font-size="9" fill="#64748b">Stay 5 years (60mo):</text><text x="65" y="55" text-anchor="middle" font-size="9" fill="#22c55e">Savings = $20,940</text><text x="65" y="70" text-anchor="middle" font-size="9" fill="#22c55e">Net after costs = $14,940 ✓</text><text x="265" y="40" text-anchor="middle" font-size="9" fill="#64748b">Stay 1 year (12mo):</text><text x="265" y="55" text-anchor="middle" font-size="9" fill="#ef4444">Savings = $4,188</text><text x="265" y="70" text-anchor="middle" font-size="9" fill="#ef4444">Net after costs = -$1,812 ✗</text></g><!-- Key factors --><g transform="translate(40,268)"><rect x="10" y="0" width="370" height="60" rx="10" fill="#fef3c7" stroke="#f59e0b" stroke-width="1"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">Key Factors to Consider</text><text x="80" y="36" text-anchor="middle" font-size="9" fill="#64748b">Rate drop: at least 0.5-1% to justify costs</text><text x="280" y="36" text-anchor="middle" font-size="9" fill="#64748b">Resetting term: extends interest payments</text><text x="195" y="54" text-anchor="middle" font-size="9" fill="#64748b">Rolling costs in: pays interest on fees for 30 years</text></g></svg>',
      alt: 'Refinance break-even analysis diagram comparing before (red, $1,848/mo at 7.5%) vs after (green, $1,499/mo at 6.0%) monthly payments with break-even calculation and decision guide',
      caption: 'Break-even = closing costs divided by monthly savings. If you stay longer than this period, refinancing pays off. If you move sooner, you lose money.',
    },
    formulaDescription:
      'The break-even point is the number of months needed for your monthly savings to accumulate to equal the total closing costs. If you plan to stay in the home longer than this period, refinancing makes financial sense. If you will move before then, the upfront closing costs outweigh the cumulative monthly savings you would receive.',
    variables: [
      { symbol: 'Break-Even', name: 'Months to Recoup Costs', description: 'Closing costs divided by monthly savings. This is the single most critical number in any refinance decision — it tells you how long it takes for the savings to cover the upfront costs.' },
      { symbol: 'Monthly Savings', name: 'Reduction in Payment', description: 'Old monthly payment minus new monthly payment. Can be negative if extending the loan term cancels out the benefit of a lower rate. Not all lower payments are actually savings.' },
      { symbol: 'Rate Drop', name: 'Interest Rate Reduction', description: 'The difference between old and new APR. A 1% drop on a $200,000 30-year loan saves roughly $130 to $135/month. However, the actual savings depends on how much time is left on the current loan.' },
      { symbol: 'Planned Stay', name: 'Your Time Horizon', description: 'How many months you plan to stay in the home after refinancing. If this is less than the break-even period, do not refinance — you will not recoup the closing costs.' },
      { symbol: 'Total Interest Savings', name: 'Lifetime Cost Comparison', description: 'The net savings in total interest paid over the full life of the new loan compared to the remaining term of the old loan. A lower monthly payment does not always mean lower total interest — resetting the loan term can increase lifetime cost even at a lower rate.' },
    ],
    howToUse: [
      'Enter your current loan balance and the interest rate you are paying now on your existing mortgage.',
      'Enter how many months remain on your current loan term.',
      'Enter the new interest rate you have been quoted and the new loan term you are considering.',
      'Enter the total refinance closing costs — ask your lender for a formal Loan Estimate document.',
      'Enter how many months you plan to stay in the home after refinancing.',
      'Read the bold recommendation at the top. If it says "Yes," refinancing makes financial sense given your time horizon.',
    ],
    commonUses: [
      'Determine whether refinancing your mortgage makes financial sense by comparing monthly savings against total closing costs.',
      'Calculate the break-even point where accumulated monthly savings from a lower rate exceed the upfront refinancing costs.',
      'Compare keeping your current loan versus refinancing to a different term to see which option minimizes total interest over your planned time in the home.',
    ],
    explanation:
      'Refinancing is not free — closing costs typically run 2-5% of the loan amount and include origination fees, appraisal costs, title insurance, and recording fees. The key question is whether you will stay in the home long enough for the monthly savings to offset those upfront costs. If your break-even is 24 months and you plan to stay 5 years, refinancing clearly makes sense. If you might move in 18 months, the closing costs will exceed your savings. Importantly, a lower monthly payment obtained by extending the loan term is not always savings — resetting from a 25-year remaining term to a new 30-year term often increases total interest paid even when the rate drops. This calculator factors all of this into a single Yes/No/Wait recommendation.',
    
    
    
    
    limitations: [
      'Closing costs are estimated at a flat dollar amount. In reality, they vary by lender, loan type, and location — typically 2-5% of the loan amount. Get a formal Loan Estimate document from your lender for accurate numbers before deciding.',
      'This calculator does NOT model tax implications. Mortgage interest deductibility has changed significantly under the TCJA — the standard deduction is now high enough that many homeowners no longer itemize, making the mortgage interest deduction less relevant.',
      'Resetting to a new 30-year term from an existing 25-year remaining term means an extra 5 years of interest payments. The calculator shows total interest saved over the FULL new term vs remaining old term — this captures the term-extension cost but can make the savings look smaller than they are. For a fair comparison, compare total interest over the same remaining time horizon.',
      'The break-even analysis assumes you stay for the full planned period. If you sell or refinance again before the break-even point, you lose money on this refinance. Life changes (job relocation, growing family) can disrupt even the best-laid plans.',
    ],
quickReference: [
      { label: 'Good Break-Even', value: 'Under 24 months' },
      { label: 'Acceptable Break-Even', value: '24–36 months' },
      { label: 'Typical Closing Costs', value: '2–5% of loan amount' },
      { label: 'Minimum Rate Drop', value: '0.5–1% to justify costs' },
      { label: '$250K at 7.5%→6%', value: '~$349/mo savings, 18mo break-even' },
      { label: '30yr reset risk', value: 'Lower payment but extends total interest' },
    ],
proTips: [
      'Get a Loan Estimate from at least 3 lenders — closing costs can vary by thousands of dollars for the same rate. Use the break-even with each lender\'s actual fees, not estimates.',
      'A "no-cost refinance" rolls closing costs into the rate (you pay a slightly higher rate in exchange for zero upfront costs). If you might move within 2-3 years, a no-cost refi eliminates break-even risk entirely — but you pay more if you stay long-term.',
      'When refinancing from a 30-year with 25 years left into a new 30-year, calculate the total interest over the SAME 25-year horizon (by adding extra principal to the new loan schedule) for a fair comparison. The calculator shows lifetime totals which include the extra 5 years.',
      'If your credit score has improved significantly since your original mortgage, you may qualify for a much better rate than the average. Check your credit before shopping — a large improvement can mean a meaningfully lower rate.',
    ],
workedExamples: [
      {
        scenario: 'Sarah has a $250,000 mortgage balance at 7.5% with 25 years (300 months) remaining. She has been quoted a 6.0% refinance rate on a new 30-year loan with $6,000 in closing costs. She plans to stay in her Phoenix home for at least 5 more years.',
        inputs: {
          'Current Loan Balance': '$250,000',
          'Current Interest Rate (APR)': '7.5',
          'Current Remaining Term': '300',
          'New Interest Rate (APR)': '6.0',
          'New Loan Term': '360',
          'Refinance Closing Costs': '$6,000',
          'How Long Will You Stay?': '60',
        },
        result: 'Recommendation: Yes — Refinance now. Old payment: $1,848/month. New payment: $1,499/month. Monthly savings: $349. Break-even: 18 months (1.5 years). Net benefit over 5-year stay (payment savings minus closing costs): approximately $14,900. Total interest remaining on the current loan: approximately $304,000 compared to about $290,000 on the new loan — saving roughly $14,600 in interest over the remaining 25 years. However, extending the term to 30 years means making payments for 5 extra years, so the monthly savings come at the cost of a longer repayment timeline.',
        insight: 'Sarah saves $349/month immediately, and her break-even is just 18 months — well under her planned 60-month stay. Over 5 years, after recouping closing costs, she nets about $14,900 in savings. The refinance reduces total interest on the remaining balance, but because the loan term resets from 25 remaining years to 30 years, she trades lower monthly payments for 5 extra years of mortgage payments. If she refinanced into a 25-year term instead, her monthly savings would be smaller but overall interest savings significantly larger.',
      },
      {
        scenario: 'Mike has a $300,000 mortgage at 6.5% with 20 years (240 months) remaining. He is considering refinancing to 5.75% on a new 15-year term with $5,500 in closing costs. He wants to pay off the home faster and plans to stay at least 10 years in his Denver home.',
        inputs: {
          'Current Loan Balance': '$300,000',
          'Current Interest Rate (APR)': '6.5',
          'Current Remaining Term': '240',
          'New Interest Rate (APR)': '5.75',
          'New Loan Term': '180',
          'Refinance Closing Costs': '$5,500',
          'How Long Will You Stay?': '120',
        },
        result: 'Recommendation: Yes — shorter term saves about $82,900 in interest after closing costs (payment rises $255/mo). Old payment: $2,237/month. New payment: $2,491/month. Payment change: +$255/month. Break-even on payment savings: never (payment increased). Total interest on the remaining current loan: approximately $236,800. Total interest on the new 15-year loan: approximately $148,400. Interest saved by refinancing: approximately $88,400 before the $5,500 closing costs.',
        insight: 'Mike\'s monthly payment goes up by $255 because he is shortening the term from 20 remaining years to 15 years. However, he saves about $88,400 in total interest by both lowering his rate (0.75% drop) and shortening the term. There is no break-even in the traditional sense because the payment increased — instead, the savings come from the roughly $88K in avoided interest. This is a "rate-and-term" refinance where the primary goal is long-term savings, not monthly cash flow relief. Mike should confirm the higher payment fits his budget before proceeding.',
      },
    ],
faqs: [
      {
        question: 'What is a good break-even period for refinancing?',
        answer: 'A break-even under 24 months is considered excellent, 24-36 months is standard and acceptable, and over 48 months is questionable unless you plan to stay in the home long-term. Your specific closing costs and rate drop determine your actual break-even.',
      },
      {
        question: 'Should I refinance if I plan to move in 2 years?',
        answer: 'Only if the break-even period is shorter than 24 months. Here is the math: if closing costs are $6,000 and monthly savings are $250, break-even is exactly 24 months. If you move in 23 months, you lost $250. If you stay 25 months, you saved $250. Every month beyond break-even is pure savings. Use the calculator to check your specific numbers before deciding.',
      },
      {
        question: 'Does resetting to a 30-year term ever make sense?',
        answer: 'Refinancing into a new 30-year term lowers your monthly payment but resets your amortization clock, meaning you will pay mostly interest again for years. A "rate-and-term" refinance that matches your remaining term (e.g., replacing 20 years remaining with a 20-year loan) preserves your equity-building progress. Only extend the term if you genuinely need the lower payment to afford the home.',
      },
      {
        question: 'Should I roll closing costs into the loan?',
        answer: 'Rolling closing costs into the loan balance means you pay interest on those costs for the entire loan term, which increases total cost. Paying closing costs upfront is usually cheaper in the long run if you have the cash available. If you must roll them in, factor that into your break-even calculation — the higher loan balance reduces effective savings.',
      },
      {
        question: 'What is a cash-out refinance and when does it make sense?',
        answer: 'A cash-out refinance replaces your existing mortgage with a larger loan, letting you pocket the difference as cash. It makes sense when you have significant home equity and can use the cash for home improvements (which may be tax-deductible), high-interest debt consolidation, or other meaningful purposes. The risk: you increase your loan balance and may reset to a longer term. Lenders typically limit cash-out to 80% CLTV and charge slightly higher rates than rate-and-term refinances.',
      },
    ],
  },
};

export default refinanceConfig;
