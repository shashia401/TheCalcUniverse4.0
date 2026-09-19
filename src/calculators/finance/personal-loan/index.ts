import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import { pmt } from '../../../utils/financial';
import AmortizationPanel from '../../../components/calculator/AmortizationPanel';

const personalLoanConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'loanAmount',
      slider: { min: 1000, max: 100000, step: 500 },
      label: 'Loan Amount',
      type: 'number',
      defaultValue: '20000',
      placeholder: '20,000',
      prefix: '$',
      required: true,
      helpText: 'Total amount you wish to borrow from the lender.',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      required: true,
      options: [
        { label: '12 months (1 year)', value: '12' },
        { label: '24 months (2 years)', value: '24' },
        { label: '36 months (3 years)', value: '36' },
        { label: '48 months (4 years)', value: '48' },
        { label: '60 months (5 years)', value: '60' },
        { label: '72 months (6 years)', value: '72' },
      ],
      helpText: 'How long you have to repay the loan — longer terms mean smaller payments but more interest.',
    },
    {
      id: 'interestRate',
      slider: { min: 0, max: 36, step: 0.1 },
      label: 'Annual Interest Rate (APR)',
      type: 'number',
      defaultValue: '11.5',
      placeholder: '11.5',
      unit: '%',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
      helpText: 'Personal loan APRs typically range from 6% to 36% depending on credit score.',
    },
    {
      id: 'originationFeeType',
      label: 'Origination Fee Type',
      type: 'select',
      helpText: 'How is the origination fee applied?',
      options: [
        { label: 'Percentage of loan (most common)', value: 'percent' },
        { label: 'Flat dollar amount', value: 'flat' },
        { label: 'No origination fee', value: 'none' },
      ],
    },
    {
      id: 'originationFeeValue',
      label: 'Origination Fee',
      type: 'number',
      placeholder: '3',
      helpText: 'Enter the percentage (e.g., 3 for 3%) or flat dollar amount.',
      step: 0.1,
    },
    {
      id: 'feeHandling',
      label: 'How is the fee collected?',
      type: 'select',
      helpText: 'Lenders handle origination fees differently.',
      options: [
        { label: 'Deducted from loan proceeds (you receive less cash)', value: 'deducted' },
        { label: 'Added to loan balance (you pay interest on the fee too)', value: 'added' },
      ],
    },
  ],

  explainSteps: (values) => {
    const loanAmount = parseFloat(values.loanAmount);
    const n = parseInt(values.loanTerm, 10) || 36;
    const interestRate = parseFloat(values.interestRate);
    const originationFeeType = values.originationFeeType || 'none';
    const feeValue = parseFloat(values.originationFeeValue) || 0;
    const feeHandling = values.feeHandling || 'deducted';

    if (isNaN(loanAmount) || isNaN(interestRate) || loanAmount <= 0 || interestRate < 0) return [];

    let originationFeeAmount = 0;
    if (originationFeeType === 'percent') originationFeeAmount = loanAmount * (feeValue / 100);
    else if (originationFeeType === 'flat') originationFeeAmount = feeValue;

    const actualLoanBalance = feeHandling === 'added' ? loanAmount + originationFeeAmount : loanAmount;
    const monthlyRate = interestRate / 100 / 12;

    const monthlyPayment = pmt(actualLoanBalance, monthlyRate, n);

    const totalPaid = monthlyPayment * n;
    const totalInterest = totalPaid - actualLoanBalance;
    const fmt = (num: number) =>
      num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const steps: { label: string; expr: string; note?: string }[] = [];

    if (originationFeeAmount > 0) {
      steps.push({
        label: 'Origination fee',
        expr: originationFeeType === 'percent'
          ? `$${fmt(loanAmount)} × ${feeValue}% = $${fmt(originationFeeAmount)}`
          : `Flat fee = $${fmt(originationFeeAmount)}`,
        note: feeHandling === 'added'
          ? 'Rolled into the balance — you pay interest on it too.'
          : 'Deducted from the cash you receive.',
      });
      if (feeHandling === 'added') {
        steps.push({
          label: 'Balance the payment is based on',
          expr: `$${fmt(loanAmount)} + $${fmt(originationFeeAmount)} = $${fmt(actualLoanBalance)}`,
        });
      }
    }

    steps.push({
      label: 'Convert the APR to a monthly rate',
      expr: `r = ${interestRate}% ÷ 12 = ${(monthlyRate * 100).toFixed(4)}%`,
    });

    if (monthlyRate === 0) {
      steps.push({
        label: 'No interest — divide the balance evenly',
        expr: `$${fmt(actualLoanBalance)} ÷ ${n} = $${fmt(monthlyPayment)}/mo`,
      });
    } else {
      steps.push({
        label: 'Monthly payment (amortization formula)',
        expr: `$${fmt(actualLoanBalance)} × ${monthlyRate.toFixed(6)} ÷ (1 − (1 + ${monthlyRate.toFixed(6)})^−${n}) = $${fmt(monthlyPayment)}`,
        note: 'The same fixed amount every month for the whole term.',
      });
    }

    steps.push({
      label: 'Total cost over the loan',
      expr: `$${fmt(monthlyPayment)} × ${n} = $${fmt(totalPaid)}  (interest: $${fmt(totalInterest)})`,
    });

    return steps;
  },
  calculate: (values) => {
    const loanAmount = parseFloat(values.loanAmount);
    const n = parseInt(values.loanTerm, 10) || 36;
    const interestRate = parseFloat(values.interestRate);
    const originationFeeType = values.originationFeeType || 'none';
    const feeValue = parseFloat(values.originationFeeValue) || 0;
    const feeHandling = values.feeHandling || 'deducted';

    if (isNaN(loanAmount) || isNaN(interestRate) || loanAmount <= 0 || interestRate < 0) return [];

    // Calculate origination fee
    let originationFeeAmount = 0;
    if (originationFeeType === 'percent') {
      originationFeeAmount = loanAmount * (feeValue / 100);
    } else if (originationFeeType === 'flat') {
      originationFeeAmount = feeValue;
    } else {
      originationFeeAmount = 0;
    }

    // Actual loan balance used for amortization
    let actualLoanBalance: number;
    if (feeHandling === 'added') {
      actualLoanBalance = loanAmount + originationFeeAmount;
    } else {
      actualLoanBalance = loanAmount;
    }

    // Cash actually received
    let actualCashReceived: number;
    if (feeHandling === 'deducted') {
      actualCashReceived = loanAmount - originationFeeAmount;
    } else {
      actualCashReceived = loanAmount;
    }

    const monthlyRate = interestRate / 100 / 12;

    const monthlyPayment = pmt(actualLoanBalance, monthlyRate, n);

    const totalPaid = monthlyPayment * n;
    const totalInterest = totalPaid - actualLoanBalance;

    // Total cost including fee when fee was deducted (not rolled in)
    const totalCostIncFee = totalPaid + (feeHandling === 'deducted' ? originationFeeAmount : 0);

    const fmt = (num: number) =>
      num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Build amortization schedule
    type AmortRow = {
      month: number;
      beginningBalance: number;
      payment: number;
      interest: number;
      principal: number;
      endingBalance: number;
    };

    const schedule: AmortRow[] = [];
    let balance = actualLoanBalance;

    for (let mo = 1; mo <= n; mo++) {
      const interest = balance * monthlyRate;
      const principal = Math.min(monthlyPayment - interest, balance);
      const endingBalance = Math.max(0, balance - principal);
      schedule.push({
        month: mo,
        beginningBalance: balance,
        payment: monthlyPayment,
        interest,
        principal,
        endingBalance,
      });
      balance = endingBalance;
    }

    return [
      {
        id: 'monthlyPayment',
        label: 'Estimated Monthly Payment',
        value: `$${fmt(monthlyPayment)}`,
        highlight: true,
        color: 'positive' as const,
        interpretation: `Over the term you'll pay $${fmt(totalInterest)} in interest — ${((totalInterest / totalPaid) * 100).toFixed(0)}% of the $${fmt(totalPaid)} total. The monthly payment is only half the story; a shorter term or lower APR is what shrinks the interest.`,
      },
      {
        id: 'actualCashReceived',
        label: 'Actual Cash You Receive',
        value: `$${fmt(actualCashReceived)}`,
        color: actualCashReceived < loanAmount ? 'negative' as const : 'neutral' as const,
      },
      {
        id: 'totalInterest',
        label: 'Total Interest Paid',
        value: `$${fmt(totalInterest)}`,
        color: 'negative' as const,
      },
      {
        id: 'originationFeeResult',
        label: 'Origination Fee Cost',
        value: originationFeeAmount > 0 ? `$${fmt(originationFeeAmount)}` : 'None',
        color: originationFeeAmount > 0 ? 'negative' as const : 'neutral' as const,
      },
      {
        id: 'totalCostIncFee',
        label: 'Total Cost of Loan (Payments + Fee)',
        value: `$${fmt(totalCostIncFee)}`,
        color: 'negative' as const,
      },
      {
        id: 'loanTermResult',
        label: 'Loan Term',
        value: `${n} months`,
        color: 'neutral' as const,
      },
      {
        id: '_amortization',
        label: '_amortization',
        value: JSON.stringify(schedule),
      },
    ];
  },

  extraPanel: (_values, results) => {
    if (!results.length) return null;

    const loanAmount = parseFloat(_values.loanAmount);
    const interestRate = parseFloat(_values.interestRate) / 100;
    const n = parseInt(_values.loanTerm, 10) || 36;
    const feeHandling = _values.feeHandling || 'deducted';
    const originationFeeType = _values.originationFeeType || 'none';
    const feeValue = parseFloat(_values.originationFeeValue) || 0;

    if (isNaN(loanAmount) || isNaN(interestRate) || loanAmount <= 0) return null;

    let originationFeeAmount = 0;
    if (originationFeeType === 'percent') {
      originationFeeAmount = loanAmount * (feeValue / 100);
    } else if (originationFeeType === 'flat') {
      originationFeeAmount = feeValue;
    }

    const actualLoanBalance = feeHandling === 'added' ? loanAmount + originationFeeAmount : loanAmount;
    const monthlyRate = interestRate / 12;
    const years = n / 12;

    const monthlyPayment = pmt(actualLoanBalance, monthlyRate, n);

    const totalInterest = monthlyPayment * n - actualLoanBalance;

    return createElement(AmortizationPanel, {
      loanAmount: actualLoanBalance,
      annualRate: interestRate,
      years,
      monthlyPayment,
      totalInterest,
    });
  },

  educational: {
    formula: 'Monthly Payment = P × r(1+r)^n / ((1+r)^n − 1)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Personal Loan Amortization</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Each payment splits into principal reduction and interest cost</text><g transform="translate(35,60)"><!-- Y-axis --><text x="-10" y="120" text-anchor="middle" font-size="10" fill="var(--svg-64748b)" transform="rotate(-90,-10,120)">Loan Balance ($)</text><!-- Grid lines --><line x1="30" y1="20" x2="370" y2="20" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="24" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">$20K</text><line x1="30" y1="68" x2="370" y2="68" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="72" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">$15K</text><line x1="30" y1="116" x2="370" y2="116" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="120" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">$10K</text><line x1="30" y1="165" x2="370" y2="165" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="169" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">$5K</text><line x1="30" y1="212" x2="370" y2="212" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="216" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">$0</text><line x1="30" y1="20" x2="30" y2="212" stroke="var(--svg-cbd5e1)" stroke-width="1"/><!-- Declining balance curve --><path d="M 50,22 Q 130,35 210,55 Q 290,100 340,165 Q 360,190 370,212" fill="none" stroke="var(--svg-3b82f6)" stroke-width="3" stroke-linecap="round"/><path d="M 50,22 Q 130,35 210,55 Q 290,100 340,165 Q 360,190 370,212 L 370,212 L 50,212 Z" fill="var(--svg-3b82f6)" opacity="0.08"/><!-- Interest vs Principal bar decomposition --><g transform="translate(40,225)"><text x="180" y="10" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Monthly Payment Split Over Time</text><text x="180" y="26" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Early payments are interest-heavy; later payments are principal-heavy</text><rect x="40" y="35" width="340" height="22" rx="4" fill="var(--svg-e2e8f0)"/><rect x="40" y="35" width="170" height="22" rx="4" fill="var(--svg-ef4444)"/><rect x="210" y="35" width="170" height="22" rx="4" fill="var(--svg-3b82f6)"/><text x="125" y="51" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)" font-weight="bold">Interest (early months)</text><text x="300" y="51" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)" font-weight="bold">Principal (late months)</text></g><!-- Origination fee visual --><g transform="translate(40,275)"><rect x="10" y="0" width="370" height="55" rx="10" fill="var(--svg-fef3c7)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-b45309)">Origination Fee Impact</text><text x="105" y="38" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Deducted: you receive $19,400, repay $20K + interest</text><text x="295" y="38" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Added: you pay interest on the fee too</text></g></svg>',
      alt: 'Line chart showing personal loan balance declining over the loan term, with a decomposition bar showing how monthly payments shift from interest-heavy to principal-heavy',
      caption: 'Personal loan payments are amortized — early payments cover mostly interest while later payments reduce principal faster',
    },
    formulaDescription:
      'The standard loan amortization formula. P = principal (loan balance), r = monthly interest rate (APR divided by 12), n = number of monthly payments. Origination fees change the effective balance and your true APR in ways that are not always obvious from the stated interest rate.',
    variables: [
      {
        symbol: 'Principal & Term',
        name: 'Loan Amount & Duration',
        description: 'The principal (P) is the total borrowed; the term (n) is the duration in months. If an origination fee is added to the balance, P increases accordingly. Together these variables determine your monthly payment and total interest cost.',
      },
      {
        symbol: 'r',
        name: 'Monthly Rate',
        description: 'The annual APR divided by 12. For example, a 12% APR equals a 1% monthly rate. This periodic rate is applied to the outstanding balance each month to determine the interest portion of the payment.',
      },
      {
        symbol: 'Origination Fee',
        name: 'Origination Fee Impact',
        description:
          'When a fee is deducted from proceeds, you receive less cash but still repay the full loan amount — increasing your effective APR. When added to the balance, you pay interest on the fee for the entire loan term, further increasing the total cost.',
      },
    ],
    howToUse: [
      'Enter the loan amount you are requesting from the lender.',
      'Select the loan term — shorter terms have higher monthly payments but dramatically lower total interest.',
      'Enter the APR (Annual Percentage Rate) quoted by your lender.',
      'Select the origination fee type and amount. Most personal loans charge 1-8%.',
      'Choose how the fee is handled — deducted from proceeds (most common) or added to the balance.',
      'Review the monthly payment, actual cash received, and total cost of the loan including all fees.',
    ],
    commonUses: [
      'Compare personal loan offers by calculating the true cost including origination fees, interest, and repayment term.',
      'See how different origination fee structures — deducted from proceeds versus added to the balance — affect your net loan amount.',
      'Determine whether a loan with a lower interest rate but higher origination fee is better than a no-fee loan with a higher rate.',
    ],
    explanation:
      'Origination fees are a critical and often overlooked cost of personal loans. A 3% origination fee on a $20,000 loan is $600 — but if it is deducted from proceeds, you only receive $19,400 while repaying the full $20,000 plus interest. This raises your effective APR well above the stated rate. When the fee is added to the loan balance, you pay interest on the fee for the entire loan term, further increasing the total cost. Always compare loans on total cost rather than just the monthly payment or stated APR. The amortization schedule below shows every payment split between interest and principal reduction.',
    faqs: [
      {
        question: 'What is a typical personal loan origination fee?',
        answer:
          'Personal loan origination fees typically range from 1% to 8% of the loan amount. Online lenders tend to charge more (3-8%), while credit unions and traditional banks may charge less or nothing at all. Some lenders advertise "no origination fee" but compensate with a higher interest rate. Always compare the APR — which is legally required to include qualifying fees — rather than just the interest rate when shopping for loans.',
      },
      {
        question: 'How does an origination fee affect my effective APR?',
        answer:
          'When an origination fee is deducted from your loan proceeds, you receive less money than you borrowed but still must repay the full loan amount plus interest. This effectively raises your true cost of borrowing. For example, a $20,000 loan at 11.5% APR with a 3% origination fee deducted means you receive only $19,400 but must repay the full $20,000 plus interest — raising your effective APR to approximately 13.5%. This calculator accounts for this and shows you the real cost.',
      },
      {
        question: 'Does my credit score affect my personal loan rate?',
        answer:
          'Yes — significantly. Borrowers with excellent credit (760+) typically qualify for the most competitive rates of 6-12%. Those with good credit (700-759) usually see rates of 12-18%. Fair credit (640-699) often results in rates of 18-28%. Below 640, rates can reach 30-36% or lenders may even decline the application entirely. Improving your credit score before applying for a personal loan can save thousands of dollars in interest on the same loan amount and term.',
      },
    ],
    citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/personal-loans-5214843' },
    ],
  },
};

export default personalLoanConfig;
