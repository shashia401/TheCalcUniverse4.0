import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import StudentLoanPanel from './StudentLoanPanel';

const studentLoanConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'loanBalance',
      label: 'Loan Balance',
      type: 'number',
      placeholder: '35,000',
      prefix: '$',
      min: 0,
      step: 500,
      required: true,
      helpText: 'Total loan amount borrowed (or expected at graduation)',
    },
    {
      id: 'interestRate',
      label: 'Annual Interest Rate',
      type: 'number',
      placeholder: '6.53',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 20,
      step: 0.01,
      required: true,
      helpText: '2024–25 federal undergraduate direct subsidized/unsubsidized rate: 6.53%. Grad: 8.08%. PLUS: 9.08%.',
    },
    {
      id: 'repaymentTerm',
      label: 'Repayment Term',
      type: 'select',
      required: true,
      options: [
        { label: '10 years (Standard Federal Plan)', value: '10' },
        { label: '12 years', value: '12' },
        { label: '15 years (Extended)', value: '15' },
        { label: '20 years (Income-Driven Repayment)', value: '20' },
        { label: '25 years (IDR/PSLF eligible)', value: '25' },
      ],
    },
    {
      id: 'inSchool',
      label: 'Are You Currently In School?',
      type: 'select',
      required: true,
      options: [
        { label: 'No — Already graduated / in repayment', value: 'no' },
        { label: 'Yes — In school with loans disbursed', value: 'yes' },
      ],
    },
    {
      id: 'monthsUntilGraduation',
      label: 'Months Until Graduation',
      type: 'number',
      placeholder: '24',
      unit: 'months',
      inputMode: 'decimal',
      min: 1,
      max: 72,
      step: 1,
      helpText: 'How many months of in-school period remain before your 6-month grace period begins',
      showWhen: (v) => v.inSchool === 'yes',
    },
    {
      id: 'loanType',
      label: 'Loan Type',
      type: 'select',
      options: [
        { label: 'Unsubsidized — Interest accrues while in school', value: 'unsubsidized' },
        { label: 'Subsidized — Government pays interest while in school', value: 'subsidized' },
      ],
      helpText: 'Only applies if you answered "Yes" above. Subsidized loans: government covers interest during school and grace period.',
      showWhen: (v) => v.inSchool === 'yes',
    },
    {
      id: 'gracePeriodMonths',
      label: 'Grace Period',
      type: 'select',
      options: [
        { label: '6 months (Federal Standard)', value: '6' },
        { label: '9 months (Perkins Loans)', value: '9' },
        { label: 'No grace period', value: '0' },
      ],
    },
  ],

  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const principal = parseFloat(values.loanBalance);
    const annualRate = parseFloat(values.interestRate) / 100;
    const repaymentYears = parseInt(values.repaymentTerm) || 10;
    const inSchool = values.inSchool === 'yes';
    const monthsUntilGrad = parseInt(values.monthsUntilGraduation) || 0;
    const loanType = values.loanType || 'unsubsidized';
    const gracePeriodRaw = parseInt(values.gracePeriodMonths);
    const gracePeriod = isNaN(gracePeriodRaw) ? 6 : gracePeriodRaw;

    if (isNaN(principal) || isNaN(annualRate) || principal <= 0) return [];

    const monthlyRate = annualRate / 12;
    const inSchoolMonths = inSchool ? monthsUntilGrad : 0;
    const totalDeferMonths = inSchoolMonths + gracePeriod;

    let capitalizedInterest = 0;
    let effectivePrincipal = principal;

    if (inSchool && loanType === 'unsubsidized') {
      capitalizedInterest = principal * monthlyRate * totalDeferMonths;
      effectivePrincipal = principal + capitalizedInterest;
    }

    const n = repaymentYears * 12;
    const monthlyPayment = monthlyRate === 0
      ? effectivePrincipal / n
      : (effectivePrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));

    const totalPaid = monthlyPayment * n;
    const totalInterestRepayment = totalPaid - effectivePrincipal;
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtD = (n: number) =>
      n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    const results: CalculatorResult[] = [
      {
        id: 'monthlyPayment',
        label: `Monthly Payment (${repaymentYears}-Year ${inSchool ? 'Post-Graduation ' : ''}Plan)`,
        value: `${fmt(monthlyPayment)}/mo`,
        highlight: true,
        color: 'positive' as const,
        interpretation: `Over ${repaymentYears} years you'll repay ${fmt(totalPaid)} total, of which ${fmt(totalInterestRepayment)} is interest. Refinancing to a lower rate or paying extra toward principal early shrinks that interest; stretching the term lowers the monthly payment but raises the total.`,
      },
    ];

    if (inSchool && loanType === 'unsubsidized' && capitalizedInterest > 0) {
      results.push({
        id: 'capitalizedInterest',
        label: `Capitalized Interest (Added to Principal at Repayment)`,
        value: fmtD(capitalizedInterest),
        highlight: true,
        color: 'negative' as const,
      });
      results.push({
        id: 'effectivePrincipal',
        label: 'Effective Principal at Repayment Start',
        value: fmtD(effectivePrincipal),
        color: 'negative' as const,
      });
    }

    if (inSchool && loanType === 'subsidized') {
      results.push({
        id: 'subsidyBenefit',
        label: 'Government Interest Subsidy (In-School + Grace)',
        value: `${fmtD(principal * monthlyRate * totalDeferMonths)} — You owe $0 extra`,
        color: 'positive' as const,
      });
    }

    results.push({
      id: 'originalPrincipal',
      label: 'Original Loan Balance',
      value: fmtD(principal),
      color: 'neutral' as const,
    });
    results.push({
      id: 'totalInterestRepayment',
      label: 'Total Interest Paid During Repayment',
      value: fmtD(totalInterestRepayment),
      color: 'negative' as const,
    });
    results.push({
      id: 'totalLifetimeCost',
      label: 'Total Lifetime Loan Cost',
      value: fmtD(principal + capitalizedInterest + totalInterestRepayment),
      color: 'negative' as const,
    });
    results.push({
      id: 'payoffDate',
      label: 'Projected Payoff',
      value: `${repaymentYears} years after repayment begins`,
      color: 'neutral' as const,
    });

    if (inSchool && totalDeferMonths > 0) {
      results.push({
        id: 'deferPeriod',
        label: `Total Deferment (In-School + Grace Period)`,
        value: `${totalDeferMonths} months`,
        color: 'neutral' as const,
      });
    }

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(StudentLoanPanel, { values, results });
  },

  educational: {
    formula: 'Monthly Payment = P × r / [1 − (1+r)^−n]   ·   Capitalized Interest = P × (r/12) × deferment months',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Student Loan: Subsidized vs. Unsubsidized</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Interest during school changes the total cost dramatically</text><g transform="translate(30,60)"><!-- In school period --><text x="190" y="15" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">In-School Period (4 Years) + Grace Period (6 Months)</text><!-- Timeline bar school --><rect x="20" y="28" width="250" height="30" rx="6" fill="var(--svg-dbeafe)"/><text x="145" y="48" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e40af)">In School &amp; Grace Period</text><!-- Unsubsidized: interest accruing arrow --><line x1="290" y1="42" x2="370" y2="42" stroke="var(--svg-ef4444)" stroke-width="2"/><polygon points="370,36 380,42 370,48" fill="var(--svg-ef4444)"/><text x="335" y="34" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">Unsubsidized:</text><text x="335" y="60" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">Interest accrues + capitalizes</text><text x="335" y="72" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">($7,985 added)</text><!-- Subsidized: no interest --><text x="335" y="94" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">Subsidized:</text><text x="335" y="108" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">Govt pays interest</text><text x="335" y="120" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">($0 added)</text><!-- Principle bars comparison --><text x="190" y="148" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Repayment Start — Effective Principal</text><!-- Subsidized bar --><rect x="30" y="162" width="170" height="30" rx="6" fill="var(--svg-22c55e)"/><text x="115" y="182" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Subsidized: $35,000</text><!-- Unsubsidized bar --><rect x="30" y="200" width="205" height="30" rx="6" fill="var(--svg-ef4444)"/><text x="135" y="220" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Unsubsidized: $42,985</text><!-- Difference highlighted --><path d="M 205,215 L 220,215 L 220,177 L 205,177" fill="none" stroke="var(--svg-f59e0b)" stroke-width="2" stroke-dasharray="4,2"/><text x="250" y="195" font-size="9" fill="var(--svg-f59e0b)" font-weight="bold">$7,985 difference</text><text x="250" y="207" font-size="8" fill="var(--svg-64748b)">from capitalized interest</text></g><g transform="translate(40,252)"><rect x="10" y="0" width="370" height="76" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Lifetime Cost Comparison (10yr Repayment at 6.53%)</text><text x="80" y="38" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)" font-weight="bold">Subsidized: ~$47,800</text><text x="80" y="52" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">~$398/mo for 10 years</text><text x="290" y="38" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Unsubsidized: ~$58,600</text><text x="290" y="52" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">~$488/mo for 10 years</text><text x="195" y="66" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-f59e0b)">Difference: ~$10,800 more + higher monthly payment</text></g></svg>',
      alt: 'Student loan comparison showing the in-school period timeline, with unsubsidized interest accruing and capitalizing versus subsidized loans staying flat, and a cost comparison at repayment',
      caption: 'Unsubsidized student loans accrue interest from day one — capitalization at graduation permanently increases your principal and lifetime cost',
    },
    formulaDescription:
      'The monthly payment uses standard amortization on the effective principal after capitalization. For unsubsidized loans, interest compounds monthly during school and the grace period, then is added (capitalized) to the principal before repayment begins — permanently increasing the balance you will pay interest on for years.',
    variables: [
      { symbol: 'Subsidized', name: 'Subsidized Loans', description: 'The federal government pays the interest that accrues on Direct Subsidized Loans while you are enrolled at least half-time, during the 6-month grace period after graduation, and during periods of deferment. Your principal stays flat throughout school — you start repayment owing exactly what you borrowed, with no capitalized interest.' },
      { symbol: 'Unsubsidized', name: 'Unsubsidized Loans', description: 'Interest begins accruing from the day the loan is disbursed — through school, grace period, and any deferment period. You can choose to pay this interest as it accrues or allow it to be capitalized at repayment start. A $35,000 loan at 6.53% accrues approximately $1,905 per year in interest while you are in school.' },
      { symbol: 'Capitalization', name: 'Interest Capitalization', description: 'The moment your grace period ends, all unpaid accrued interest is added to your principal balance. You then pay interest on this larger number for the entire repayment term. A $35,000 loan with $3,810 in capitalized interest means you start repayment owing $38,810 — permanently increasing every future payment calculation.' },
      { symbol: 'IDR', name: 'Income-Driven Repayment', description: 'Federal IDR plans (SAVE, IBR, PAYE, ICR) cap monthly payments at 5-20% of discretionary income. After 20-25 years of qualifying payments, remaining balances may be forgiven, though the forgiven amount is typically taxable as income. The 20 and 25-year term options in this calculator reflect these plan timelines.' },
      { symbol: 'Grace Period', name: 'Post-Graduation Grace Period', description: 'Federal student loans provide a 6-month grace period after graduation (or dropping below half-time enrollment) before payments begin. During this period, subsidized loans continue to have interest paid by the government; unsubsidized loans continue accruing interest that will capitalize at repayment start.' },
    ],
    howToUse: [
      'Enter your total loan balance and interest rate, then select your repayment term. The Standard 10-year plan gives the lowest total interest; IDR plans have lower payments but higher lifetime cost.',
      'If you are currently in school, select "Yes" and enter your remaining months to see the impact of interest accrual and capitalization before repayment begins.',
      'Choose Subsidized or Unsubsidized — the difference in lifetime cost can be thousands of dollars due to interest capitalization.',
    ],
    commonUses: [
      'Compare the total lifetime cost of subsidized versus unsubsidized student loans including interest that accrues during school and grace periods.',
      'Calculate the monthly payment and total repayment amount for federal student loans under different term lengths and interest rates.',
      'See how paying interest while still in school prevents capitalization and saves thousands of dollars over the life of the loan.',
    ],
    explanation:
      'The difference between a subsidized and unsubsidized loan with the same balance and interest rate can be thousands of dollars over the life of the loan. For a $35,000 loan at 6.53% with 3 years of school and a 6-month grace period (42 months total deferment), an unsubsidized loan accumulates approximately $7,985 in capitalized interest before the first payment is due. Your starting balance at repayment is effectively $42,985 instead of $35,000 — and every monthly payment and lifetime interest cost is calculated on that higher number. Paying even small amounts of interest while in school can prevent this capitalization and save thousands.',
    faqs: [
      {
        question: 'Should I pay interest on my unsubsidized loan while in school?',
        answer: 'Yes — if you can afford it, paying the accruing interest while in school prevents capitalization and significantly reduces your lifetime loan cost. Even small payments of $50-100 per month during the school and grace period can save thousands of dollars over the life of the loan by preventing that interest from being added to your principal balance before repayment begins.',
      },
      {
        question: 'What is the standard federal student loan repayment plan?',
        answer: 'The Standard Repayment Plan is 10 years (120 fixed monthly payments). It results in the highest monthly payment but the lowest total interest paid of any federal repayment plan. Income-driven repayment plans offer lower monthly payments (capped at 5-20% of discretionary income) but extend repayment to 20-25 years, often resulting in significantly higher total interest costs, though forgiveness may apply at the end of the term.',
      },
      {
        question: 'How does Public Service Loan Forgiveness (PSLF) work?',
        answer: 'PSLF forgives the remaining federal student loan balance after 120 qualifying monthly payments (10 years) under an income-driven repayment plan while working full-time for a qualifying government agency or nonprofit organization. The forgiven amount under PSLF is not taxable as income. You must submit an Employment Certification Form annually and apply for forgiveness through your loan servicer after completing all 120 qualifying payments.',
      },
      {
        question: 'What are the current federal student loan interest rates?',
        answer: 'Federal student loan rates are set annually by Congress based on the 10-year Treasury note yield plus a fixed margin. For loans disbursed July 1, 2024 through June 30, 2025: Direct Subsidized and Unsubsidized Loans (undergraduate): 6.53%. Direct Unsubsidized (graduate/professional): 8.08%. Direct PLUS Loans (parent and graduate): 9.08%. Rates reset each July 1st, so check current rates at studentaid.gov.',
      },
      {
        question: 'What happens if I consolidate my student loans?',
        answer: 'Federal loan consolidation combines multiple federal student loans into a single Direct Consolidation Loan with one monthly payment and a fixed interest rate equal to the weighted average of the original loans (rounded up to the nearest 1/8%). Consolidation can extend repayment terms up to 30 years, lowering monthly payments but increasing total interest. It grants access to additional IDR plans and PSLF eligibility but resets any progress toward IDR forgiveness. Private consolidation (refinancing) through a private lender may offer lower rates but forfeits federal protections like IDR, PSLF, and deferment options.',
      },
      {
        question: 'Should I pay off student loans early or invest the extra money?',
        answer: 'It depends on your interest rate and personal risk tolerance. If your loan interest rate is above 6-7%, paying it off early often makes mathematical sense because it guarantees a tax-free return equal to the interest rate — a guaranteed 7% return is hard to beat in any market. If your rate is below 4-5%, investing the extra money in a diversified stock portfolio may produce better long-term results (historically ~7-10% nominal). A common compromise: pay the minimum on low-rate loans while investing, and aggressively pay down any loan above 6%. Also consider whether your loans qualify for forgiveness — paying extra toward a loan that will ultimately be forgiven through PSLF or IDR is effectively throwing that money away.',
      },
      {
        question: 'How does income-driven repayment (IDR) affect the total cost of my loan?',
        answer: 'IDR plans reduce your monthly payment to a percentage of your discretionary income (5-20% depending on the specific plan), but the trade-off is that extending repayment to 20 or 25 years dramatically increases total interest paid. For example, a $50,000 loan at 7% paid over 10 years costs about $69,500 total. The same loan under a 20-year IDR plan at a reduced payment could cost over $90,000 total — an extra $20,500 in interest. The benefit is cash flow flexibility today, and any remaining balance after the repayment term may be forgiven (though typically taxable). Use this calculator to compare the 10-year standard plan against the 20 or 25-year options to see the trade-off in real numbers.',
      },
    ],

    workedExamples: [
      {
        scenario: 'Emily graduates from a public university with $35,000 in unsubsidized federal loans at 6.53%. She had loans disbursed over 4 years and is about to enter her 6-month grace period. She wants to know the true cost of deferring interest.',
        inputs: { loanBalance: '35000', interestRate: '6.53', repaymentTerm: '10', inSchool: 'yes', monthsUntilGraduation: '0', loanType: 'unsubsidized', gracePeriodMonths: '6' },
        result: 'Capitalized interest: $1,143.02, Effective principal: $36,143.02, Monthly payment: $411.23/mo',
        insight: 'Emily\'s 6-month grace period will add over $1,143 to her principal. On a 10-year plan, the capitalized interest alone will cost her an additional $258 in interest over the repayment term because she pays interest on the interest. If Emily can pay just $190/month during her grace period to cover the accruing interest, she prevents capitalization entirely and enters repayment owing exactly $35,000 — saving thousands over the loan\'s life.',
      },
      {
        scenario: 'Marcus borrowed $60,000 for graduate school at 8.08% and is pursuing a career in government. He qualifies for PSLF and is choosing between the standard 10-year plan and a 25-year IDR plan.',
        inputs: { loanBalance: '60000', interestRate: '8.08', repaymentTerm: '10', inSchool: 'no' },
        result: 'Standard 10-year: $730.12/mo, total cost ~$87,614. With IDR + PSLF: lower payments and remaining balance forgiven tax-free after 120 qualifying payments.',
        insight: 'If Marcus is certain he will work in qualifying public service for 10 years, he should enroll in an IDR plan to keep payments low and maximize the amount forgiven through PSLF — which is tax-free unlike standard IDR forgiveness. The standard 10-year plan would pay off the loan entirely before PSLF forgiveness kicks in, meaning Marcus would get no benefit from the program he is eligible for.',
      },
      {
        scenario: 'Jennifer has $27,000 in subsidized federal loans at 5.50%. She is starting a 24-month graduate program and wants to see if subsidized status during deferment saves her money.',
        inputs: { loanBalance: '27000', interestRate: '5.50', repaymentTerm: '10', inSchool: 'yes', monthsUntilGraduation: '24', loanType: 'subsidized', gracePeriodMonths: '6' },
        result: 'Government subsidy benefit: $3,712.50 — she owes $0 extra. Monthly payment remains $293.03 on the original $27,000 principal.',
        insight: 'Because Jennifer\'s loans are subsidized, the government pays the $3,712.50 in interest that would have accrued during her 30 months of school plus grace period. If these were unsubsidized loans, her effective principal at repayment would be $30,712.50, raising her monthly payment to $333.30 — roughly $40 more per month, adding nearly $4,800 to her total repayment cost.',
      },
    ],

    proTips: [
      'Pay the accruing interest on unsubsidized loans while you are in school, even if only $25-50/month. Every dollar you pay before capitalization saves you from paying interest on that dollar for the entire 10-25 year repayment term.',
      'If you work in public service, submit the PSLF Employment Certification Form annually — not just at the end. This creates a paper trail and forces your loan servicer to confirm your qualifying payments each year rather than discovering a problem after 10 years that could reset your progress.',
      'When choosing between repayment plans, always calculate both the monthly payment AND the total lifetime cost. The plan with the lowest monthly payment often has the highest total cost due to extended terms. Enter different term lengths in this calculator to see the trade-off in real dollars.',
      'If you have multiple loans with different interest rates, direct extra payments to the highest-rate loan first (the "avalanche" method). For federal loans, you can target specific loans within your account by instructing your servicer in writing which loan to apply the extra payment to — otherwise they may spread it across all loans equally.',
    ],

    quickReference: [
      { label: 'Undergrad Rate 2024-25', value: '6.53% (Direct Subsidized/Unsubsidized)' },
      { label: 'Grad Rate 2024-25', value: '8.08% (Direct Unsubsidized)' },
      { label: 'PLUS Rate 2024-25', value: '9.08% (Parent/Grad PLUS)' },
      { label: 'Standard Repayment', value: '10 years (120 payments)' },
      { label: 'Grace Period', value: '6 months (federal standard)' },
      { label: 'PSLF Forgiveness', value: '120 qualifying payments, tax-free' },
    ],

    limitations: [
      'This calculator models federal Direct Loans. Private student loans, Parent PLUS loans, Perkins loans, and FFEL program loans may have different interest accrual rules, grace periods, and repayment options not represented here.',
      'Income-driven repayment calculations are based on discretionary income which depends on your actual income and family size. The 20 and 25-year term options in this calculator use standard amortization — actual IDR payments vary each year as your income changes and may not fully amortize the loan within the term.',
      'The calculator uses simple interest accrual for the in-school and grace periods. In reality, interest accrues daily on unsubsidized loans (daily interest = principal x rate / 365), and capitalization typically occurs at specific trigger events (end of grace period, end of deferment, end of forbearance).',
      'Forgiveness programs like PSLF and IDR forgiveness have specific eligibility requirements, qualifying payment definitions, and tax implications that this calculator cannot model. The forgiven amount under IDR is generally taxable as income in the year of forgiveness, while PSLF forgiveness is tax-free. Always consult studentaid.gov for current program rules.',
    ],
citations: [
      { source: 'Federal Student Aid (US Department of Education)', url: 'https://studentaid.gov' },
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    ],
  },
};

export default studentLoanConfig;
