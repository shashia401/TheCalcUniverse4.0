import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import { DTIGauge } from './DtiPanel';

/* ── Shared parsing helpers (used by calculate and extraPanel) ── */
function parseIncome(values: Record<string, string>) {
  const salary = parseFloat(values.grossMonthlySalary) || 0;
  const bonus = parseFloat(values.bonusOvertime) || 0;
  const other = parseFloat(values.otherIncome) || 0;
  return { salary, bonus, other, totalIncome: salary + bonus + other };
}

function parseDebts(values: Record<string, string>) {
  const housing = parseFloat(values.housingPayment) || 0;
  const car = parseFloat(values.carPayment) || 0;
  const student = parseFloat(values.studentLoans) || 0;
  const cc = parseFloat(values.creditCardMin) || 0;
  const childSupport = parseFloat(values.childSupport) || 0;
  const otherDebt = parseFloat(values.otherDebt) || 0;
  const totalDebt = housing + car + student + cc + childSupport + otherDebt;
  return { housing, car, student, cc, childSupport, otherDebt, totalDebt };
}

const dtiRatioConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sectionIncome',
      label: '── Monthly Income ──',
      type: 'text',
      placeholder: '',
      required: false,
    },
    {
      id: 'grossMonthlySalary',
      label: 'Gross Monthly Salary',
      type: 'number',
      placeholder: '7,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Your base salary before taxes and deductions',
    },
    {
      id: 'bonusOvertime',
      label: 'Bonus / Overtime (Monthly)',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 50,
      required: false,
      helpText: 'Average monthly bonus or overtime pay',
    },
    {
      id: 'otherIncome',
      label: 'Other Monthly Income',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 50,
      required: false,
      helpText: 'Rental income, alimony, freelance, etc.',
    },
    {
      id: 'sectionDebt',
      label: '── Monthly Debt Payments ──',
      type: 'text',
      placeholder: '',
      required: false,
    },
    {
      id: 'housingPayment',
      label: 'Expected Housing Payment (PITI)',
      type: 'number',
      placeholder: '1,800',
      prefix: '$',
      min: 0,
      step: 50,
      required: true,
      helpText: 'Proposed mortgage (principal, interest, taxes, insurance)',
    },
    {
      id: 'carPayment',
      label: 'Auto Loan Payment(s)',
      type: 'number',
      placeholder: '400',
      prefix: '$',
      min: 0,
      step: 50,
      helpText: 'Total monthly auto loan payments',
    },
    {
      id: 'studentLoans',
      label: 'Student Loan Payment',
      type: 'number',
      placeholder: '300',
      prefix: '$',
      min: 0,
      step: 50,
    },
    {
      id: 'creditCardMin',
      label: 'Credit Card Minimum Payments',
      type: 'number',
      placeholder: '150',
      prefix: '$',
      min: 0,
      step: 25,
    },
    {
      id: 'childSupport',
      label: 'Child Support / Alimony',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 25,
    },
    {
      id: 'otherDebt',
      label: 'Other Monthly Debt',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 25,
    },
  ],
  calculate: (values) => {
    const { totalIncome } = parseIncome(values);
    const { housing, totalDebt } = parseDebts(values);

    if (totalIncome <= 0) return [];
    const frontEndDTI = (housing / totalIncome) * 100;
    const backEndDTI = (totalDebt / totalIncome) * 100;

    const getStatus = (dti: number) => {
      if (dti <= 28) return 'Green — Excellent';
      if (dti <= 36) return 'Yellow — Good';
      if (dti <= 43) return 'Yellow — Acceptable';
      if (dti <= 49) return 'Red — High';
      return 'Red — Needs Work';
    };

    const getColor = (dti: number): 'positive' | 'negative' | 'neutral' => {
      if (dti <= 36) return 'positive';
      if (dti <= 43) return 'neutral';
      return 'negative';
    };

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const maxHousingFor28 = totalIncome * 0.28;
    const maxDebtFor36 = totalIncome * 0.36;
    const maxDebtFor43 = totalIncome * 0.43;

    return [
      {
        id: 'backEndDTI',
        label: `Back-End DTI — ${getStatus(backEndDTI)}`,
        value: `${backEndDTI.toFixed(1)}%`,
        highlight: true,
        color: getColor(backEndDTI),
        interpretation: `This is all your monthly debt — housing plus cards, auto, student loans — as a share of gross income. Most mortgage lenders cap this around 43%, with the best rates reserved for borrowers under 36%; paying down other debt before applying often moves the needle more than shopping for a lower mortgage rate.`,
      },
      {
        id: 'frontEndDTI',
        label: `Front-End DTI (Housing Only) — ${getStatus(frontEndDTI)}`,
        value: `${frontEndDTI.toFixed(1)}%`,
        color: getColor(frontEndDTI),
      },
      {
        id: 'totalIncome',
        label: 'Total Gross Monthly Income',
        value: `$${fmt(totalIncome)}`,
        color: 'positive' as const,
      },
      {
        id: 'totalDebt',
        label: 'Total Monthly Debt',
        value: `$${fmt(totalDebt)}`,
        color: 'neutral' as const,
      },
      {
        id: 'maxHousingFor28',
        label: 'Max Housing for 28% Front-End',
        value: `$${fmt(maxHousingFor28)}/mo`,
        color: housing <= maxHousingFor28 ? 'positive' : 'negative' as const,
      },
      {
        id: 'maxDebtFor36',
        label: 'Max Total Debt for 36% Back-End',
        value: `$${fmt(maxDebtFor36)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'maxDebtFor43',
        label: 'Max Total Debt for 43% (FHA limit)',
        value: `$${fmt(maxDebtFor43)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'debtHeadroom',
        label: 'Remaining Capacity (vs. 43% limit)',
        value: maxDebtFor43 - totalDebt >= 0
          ? `$${fmt(maxDebtFor43 - totalDebt)}/mo available`
          : `$${fmt(totalDebt - maxDebtFor43)}/mo over limit`,
        color: maxDebtFor43 >= totalDebt ? 'positive' : 'negative' as const,
      },
    ];
  },
  extraPanel: (values) => {
    const { totalIncome } = parseIncome(values);
    if (totalIncome <= 0) return null;

    const { housing, totalDebt } = parseDebts(values);
    const frontEnd = (housing / totalIncome) * 100;
    const backEnd = (totalDebt / totalIncome) * 100;

    return createElement(DTIGauge, { frontEnd, backEnd });
  },

  educational: {
    formula: 'Front-End DTI = Housing PITI ÷ Gross Income × 100 | Back-End DTI = All Debts ÷ Gross Income × 100',
    formulaDescription:
      'DTI ratio compares your monthly debt obligations to your gross monthly income and is the single most important number lenders evaluate during mortgage underwriting. Two versions are used: front-end (housing costs only) and back-end (all debts combined). Each has its own threshold that determines which loan programs you qualify for.',
    variables: [
      { symbol: 'Front-End DTI', name: 'Housing Ratio', description: 'Your proposed PITI payment divided by gross monthly income. Conventional lenders prefer this below 28%; anything under 31% is typically acceptable for FHA loans.' },
      { symbol: 'Back-End DTI', name: 'Total Debt Ratio', description: 'All monthly debt payments combined divided by gross income. Conventional loans cap at 36-43%; FHA may allow up to 50% with compensating factors like high credit scores or large cash reserves.' },
      { symbol: 'PITI', name: 'Housing Payment', description: 'Principal, Interest, Taxes, and Insurance — the four components of a full mortgage payment. Lenders always use PITI, not just the principal and interest amount, for DTI calculations.' },
      { symbol: 'Compensating Factors', name: 'Factors That Offset High DTI', description: 'Reserves (cash savings after closing), excellent credit above 740, large down payment above 25%, or significant rental income history can help lenders approve DTIs above standard limits.' },
    ],
    howToUse: [
      'Enter all sources of gross monthly income before taxes and deductions, including salary, self-employment earnings, and stable side income.',
      'Enter your proposed mortgage payment as PITI (principal, interest, taxes, and insurance) — this drives the front-end ratio.',
      'Add all other monthly debt payments: auto loans, student loans, credit card minimums, personal loans, alimony, and child support.',
      'Review your front-end and back-end DTI with the color-coded status gauge. Green indicates well-qualified, yellow means borderline, red suggests you should pay down debt first.',
      'Use the "Max Debt" output rows to understand exactly how much additional monthly debt you could take on while staying within lender limits.',
      'Experiment by adjusting individual debt amounts or adding income to see how much each change affects your DTI percentages.',
    ],
    explanation:
      'Debt-to-Income ratio is the single most important factor in mortgage underwriting because it measures your capacity to take on additional debt. Lenders evaluate two ratios: the front-end ratio compares only your housing costs to income and should stay below 28% for conventional loans. The back-end ratio includes all debt payments and should stay below 36-43% for conventional financing. FHA loans are more generous, allowing back-end DTI up to 50% if you have compensating factors such as a credit score above 700, significant cash reserves after closing, or a history of stable employment. VA loans have no strict DTI maximum but generally require residual income analysis. The color-coded gauge in this tool maps directly to lender guidelines: green (under 28% front-end or 36% back-end) means you are well-qualified; yellow (28-36% front-end or 36-43% back-end) is acceptable to many lenders but may require a stronger credit profile; red (above 43% back-end) means you may need to pay down debt, increase your income, or consider an FHA or non-qualified mortgage program. An important edge case: if you have significant assets or a large down payment, some lenders may be flexible on DTI limits. Self-employed borrowers should note that lenders use the net income from their tax returns, which is often much lower than gross revenue.',
    faqs: [
      {
        question: 'What DTI is needed to qualify for a conventional mortgage?',
        answer: 'Most conventional lenders want a front-end DTI below 28% and a back-end DTI below 36-43%. Fannie Mae and Freddie Mac allow back-end DTIs up to 45-50% with strong compensating factors such as large cash reserves, a credit score above 740, or a significant down payment of 25% or more.',
      },
      {
        question: 'Does DTI use gross or net income?',
        answer: 'Always gross income before taxes and deductions. Lenders verify gross income from pay stubs, W-2s, and tax returns. For self-employed borrowers, lenders use the adjusted gross income from the most recent two years of tax returns.',
      },
      {
        question: 'How can I lower my DTI quickly?',
        answer: 'Pay off revolving credit card debt first, as this eliminates the minimum monthly payment from your DTI calculation immediately. Paying off installment loans (auto, student) has the same effect but takes longer. Increasing your income through a raise, second job, or side business is the other primary lever for improving DTI.',
      },
      {
        question: 'Are bonus and overtime income counted?',
        answer: 'Lenders typically require a two-year history of receiving bonus or overtime income to include it in qualifying income. New jobs or sporadic bonuses without an established track record generally are not counted. Self-employment income is averaged over two years.',
      },
      {
        question: 'What is the difference between front-end and back-end DTI?',
        answer: 'Front-end DTI includes only your housing payment (PITI), while back-end DTI includes all monthly debt obligations including housing, car loans, student loans, credit card minimums, personal loans, alimony, and child support. Lenders care more about the back-end ratio because it reflects your total financial obligations.',
      },
      {
        question: 'Can I get a mortgage with a DTI over 50%?',
        answer: 'Conventional and FHA loans generally cap at 50% back-end DTI. However, some non-qualified mortgage (non-QM) lenders offer products for DTIs above 50%, typically requiring higher interest rates, larger down payments, and significant cash reserves. VA loans do not have a specific DTI cap but require residual income analysis.',
      },
    ],
    citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/' },
      { source: 'Fannie Mae', url: 'https://www.fanniemae.com/research-and-insights' },
    ],
  },
};

export default dtiRatioConfig;
