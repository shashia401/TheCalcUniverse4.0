import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import { DTIGauge } from './DtiPanel';
import { backEndBand, frontEndBand, shown } from './dtiMath';
import { finiteSteps } from '../../../utils/explainGuard';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

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
  explainSteps: (values) => {
    const rows = dtiRatioConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const inc = parseIncome(values);
    const debt = parseDebts(values);
    const m = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const plus = (xs: number[]) => xs.map(m).join(' + ');
    return finiteSteps([
      {
        label: 'Add up gross monthly income',
        expr: `${plus([inc.salary, inc.bonus, inc.other])} = ${resultValue(rows, 'totalIncome')}`,
        note: 'Salary, bonus / overtime and other income, all before tax.',
      },
      {
        label: 'Add up monthly debt payments',
        expr: `${plus([debt.housing, debt.car, debt.student, debt.cc, debt.childSupport, debt.otherDebt])} = ${resultValue(rows, 'totalDebt')}`,
        note: 'Housing payment, auto, student loans, card minimums, child support / alimony and other debt.',
      },
      {
        label: 'Front-end DTI: housing payment as a share of income',
        expr: `${m(debt.housing)} ÷ ${m(inc.totalIncome)} × 100 = ${resultValue(rows, 'frontEndDTI')}`,
      },
      {
        label: 'Back-end DTI: all debt as a share of income',
        expr: `${m(debt.totalDebt)} ÷ ${m(inc.totalIncome)} × 100 = ${resultValue(rows, 'backEndDTI')}`,
      },
      {
        label: 'Spending limits at the thresholds named in the results',
        expr: `${m(inc.totalIncome)} × 0.28 = ${resultValue(rows, 'maxHousingFor28')} housing · × 0.36 = ${resultValue(rows, 'maxDebtFor36')} debt · × 0.43 = ${resultValue(rows, 'maxDebtFor43')} debt`,
        note: `Against the 43% limit: ${resultValue(rows, 'debtHeadroom')}.`,
      },
    ]);
  },
  calculate: (values) => {
    const { totalIncome } = parseIncome(values);
    const { housing, totalDebt } = parseDebts(values);

    if (totalIncome <= 0) return [];
    const frontEndDTI = (housing / totalIncome) * 100;
    const backEndDTI = (totalDebt / totalIncome) * 100;

    const be = backEndBand(backEndDTI);
    const fe = frontEndBand(frontEndDTI);

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const maxHousingFor28 = totalIncome * 0.28;
    const maxDebtFor36 = totalIncome * 0.36;
    const maxDebtFor43 = totalIncome * 0.43;

    return [
      {
        id: 'backEndDTI',
        label: `Back-End DTI — ${be.label}`,
        value: `${shown(backEndDTI).toFixed(1)}%`,
        highlight: true,
        color: be.tone,
        interpretation: `This is all your monthly debt — housing plus cards, auto, student loans — as a share of gross income. Traditional guidelines treat 36% as comfortable and 43% as the FHA baseline cap (Fannie Mae will go to 45% manually and 50% through automated underwriting with strong credit and reserves); paying down other debt before applying often moves the needle more than shopping for a lower mortgage rate.`,
      },
      {
        id: 'frontEndDTI',
        label: `Front-End DTI (Housing Only) — ${fe.label}`,
        value: `${shown(frontEndDTI).toFixed(1)}%`,
        color: fe.tone,
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
        label: 'Max Total Debt for 43% (FHA baseline)',
        value: `$${fmt(maxDebtFor43)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'debtHeadroom',
        label: 'Remaining Capacity (vs. 43% baseline)',
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
      { symbol: 'Front-End DTI', name: 'Housing Ratio', description: 'Your proposed PITI payment divided by gross monthly income. The traditional conventional guideline is 28% or less; the FHA baseline is 31%.' },
      { symbol: 'Back-End DTI', name: 'Total Debt Ratio', description: 'All monthly debt payments combined divided by gross income. Fannie Mae manual underwriting uses 36% (up to 45% with qualifying credit score and reserves) and automated underwriting (DU) allows up to 50%. The FHA baseline is 43%, with higher ratios only on documented compensating factors.' },
      { symbol: 'PITI', name: 'Housing Payment', description: 'Principal, Interest, Taxes, and Insurance — the four components of a full mortgage payment. Lenders always use PITI, not just the principal and interest amount, for DTI calculations.' },
      { symbol: 'Compensating Factors', name: 'Factors That Offset High DTI', description: 'Documented cash reserves after closing, a strong credit score, a larger down payment, or a housing payment no higher than your current rent can help lenders approve DTIs above standard limits (the specific factors depend on the loan program).' },
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
      'Debt-to-Income ratio is the single most important factor in mortgage underwriting because it measures your capacity to take on additional debt. Lenders evaluate two ratios: the front-end ratio compares only your housing costs to income and should stay below 28% for conventional loans. The back-end ratio includes all debt payments: 36% is the traditional comfortable level, Fannie Mae allows up to 45% on manually underwritten loans and 50% through its automated underwriting, and the FHA baseline is 43% (higher ratios need documented compensating factors such as cash reserves or a payment no higher than your current housing cost). VA loans use a 41% guideline together with a residual-income test. The color-coded gauge maps to those benchmarks: green (28% or less front-end, 36% or less back-end) is comfortably within the traditional guidelines; orange (up to 31% front-end, up to 43% back-end) is acceptable to many lenders but may need a stronger credit profile; red (above 31% front-end or above 43% back-end) means you may need to pay down debt, increase your income, or find a lender and program that allows higher ratios. An important edge case: if you have significant assets or a large down payment, some lenders may be flexible on DTI limits. Self-employed borrowers should note that lenders use the net income from their tax returns, which is often much lower than gross revenue.',
    faqs: [
      {
        question: 'What DTI is needed to qualify for a conventional mortgage?',
        answer: 'The traditional guideline is a front-end DTI of 28% or less and a back-end DTI of 36% or less. Under the Fannie Mae Selling Guide, manually underwritten loans can go to 45% with the credit score and reserves required by the Eligibility Matrix, and loans approved through Desktop Underwriter can go up to 50%.',
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
        answer: 'Fannie Mae caps DU-approved loans at 50%, so conventional agency loans generally stop there. Some non-qualified mortgage (non-QM) lenders offer products for DTIs above 50%, typically requiring higher interest rates, larger down payments, and significant cash reserves. VA loans use a 41% guideline with a residual-income test rather than a hard cap.',
      },
    ],
    citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/' },
      { source: 'Fannie Mae', url: 'https://www.fanniemae.com/research-and-insights' },
    ],
  },
};

export default dtiRatioConfig;
