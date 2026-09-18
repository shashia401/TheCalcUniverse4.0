import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CreditCardPanel from './CreditCardPanel';

function simulatePayoff(balance: number, _apr: number, monthlyPayment: number, monthlyRate: number) {
  let remaining = balance;
  let months = 0;
  let totalPaid = 0;
  let totalInterest = 0;

  while (remaining > 0.005 && months < 1200) {
    const interestCharge = remaining * monthlyRate;
    remaining = Math.max(0, remaining + interestCharge - monthlyPayment);
    totalPaid += monthlyPayment;
    totalInterest += interestCharge;
    months++;
  }

  return { months, totalPaid, totalInterest };
}

function fmtD(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

const creditCardSvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">
  <rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/>
  <text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">Credit Card Debt Payoff</text>
  <line x1="30" y1="150" x2="290" y2="150" stroke="var(--svg-cbd5e1)" stroke-width="1"/>
  <line x1="30" y1="150" x2="30" y2="30" stroke="var(--svg-cbd5e1)" stroke-width="1"/>
  <path d="M 30,30 Q 110,38 180,68 Q 240,105 290,150" fill="none" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 30,30 Q 110,38 180,68 Q 240,105 290,150 L 290,150 L 30,150 Z" fill="var(--svg-ef4444)" opacity="0.08"/>
  <text x="70" y="168" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Month 1</text>
  <rect x="40" y="171" width="60" height="12" rx="2" fill="var(--svg-ef4444)"/>
  <rect x="40" y="171" width="12" height="12" rx="2" fill="var(--svg-3b82f6)"/>
  <text x="160" y="168" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Month 24</text>
  <rect x="130" y="171" width="60" height="12" rx="2" fill="var(--svg-3b82f6)"/>
  <rect x="130" y="171" width="10" height="12" rx="2" fill="var(--svg-ef4444)"/>
  <rect x="60" y="185" width="12" height="8" rx="2" fill="var(--svg-ef4444)"/>
  <text x="76" y="193" font-size="7" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Interest</text>
  <rect x="120" y="185" width="12" height="8" rx="2" fill="var(--svg-3b82f6)"/>
  <text x="136" y="193" font-size="7" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Principal</text>
  <text x="160" y="198" text-anchor="middle" font-size="7" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">n = -log(1 - rB/P) / log(1+r)</text>
</svg>`;

const creditCardPayoffConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'balance',
      label: 'Current Balance',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'Your current outstanding credit card balance',
    },
    {
      id: 'apr',
      label: 'Annual Interest Rate (APR)',
      type: 'number',
      placeholder: '21.99',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 100,
      step: 0.01,
      required: true,
      helpText: 'The annual percentage rate on your credit card',
    },
    {
      id: 'payoffMode',
      label: 'How Would You Like to Pay It Off?',
      type: 'select',
      required: true,
      options: [
        { label: 'I want to pay a fixed amount each month', value: 'fixed' },
        { label: 'I want to pay it off by a target date', value: 'bydate' },
      ],
      helpText: 'Choose whether to set a fixed monthly payment or target a specific payoff date.',
    },
    {
      id: 'monthlyPayment',
      label: 'Fixed Monthly Payment',
      type: 'number',
      placeholder: '200',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 0.01,
      helpText: 'The fixed amount you plan to pay each month',
      showWhen: (v) => v.payoffMode === 'fixed',
    },
    {
      id: 'targetMonths',
      label: 'Pay Off In',
      type: 'number',
      placeholder: '24',
      unit: 'months',
      inputMode: 'decimal',
      min: 1,
      max: 120,
      step: 1,
      helpText: 'How many months you want to take to pay off this debt',
      showWhen: (v) => v.payoffMode === 'bydate',
    },
  ],
  calculate: (values) => {
    const balance = parseFloat(values.balance);
    const apr = parseFloat(values.apr) / 100;
    const payoffMode = values.payoffMode || 'fixed';
    const monthlyPayment = parseFloat(values.monthlyPayment) || 0;
    const targetMonths = parseFloat(values.targetMonths) || 0;

    if (isNaN(balance) || isNaN(apr) || balance <= 0) return [];

    const monthlyRate = apr / 12;

    const results: Array<{ id: string; label: string; value: string; highlight?: boolean; color: 'positive' | 'negative' | 'neutral'; interpretation?: string }> = [];

    if (payoffMode === 'bydate') {
      if (targetMonths <= 0) return [];

      // Calculate required monthly payment for target months
      let requiredPmt: number;
      if (monthlyRate === 0) {
        requiredPmt = balance / targetMonths;
      } else {
        requiredPmt =
          (balance * (monthlyRate * Math.pow(1 + monthlyRate, targetMonths))) /
          (Math.pow(1 + monthlyRate, targetMonths) - 1);
      }

      const sim = simulatePayoff(balance, apr, requiredPmt, monthlyRate);

      results.push(
        {
          id: 'hero', label: `Pay by ${fmtDate(sim.months)}`, value: `$${fmtD(requiredPmt)}/mo`, highlight: true, color: 'positive' as const,
          interpretation: `Paying $${fmtD(requiredPmt)}/mo clears your $${fmtD(balance)} balance in ${targetMonths} months, but interest adds $${fmtD(sim.totalInterest)} (${((sim.totalInterest / balance) * 100).toFixed(0)}% of the balance). ${sim.totalInterest / balance > 0.25 ? 'That interest share is high — a 0% balance-transfer card or a shorter payoff window would cut it substantially.' : 'Keeping the payoff window short is keeping your interest cost low.'}`,
        },
        { id: 'requiredPayment', label: 'Required Monthly Payment', value: `$${fmtD(requiredPmt)}/mo`, color: 'positive' as const },
        { id: 'payoffDate', label: 'Debt-Free Date', value: fmtDate(sim.months), color: 'positive' as const },
        { id: 'totalInterest', label: 'Total Interest Paid', value: `$${fmtD(sim.totalInterest)}`, color: 'negative' as const },
        { id: 'totalPaid', label: 'Total Amount Paid', value: `$${fmtD(sim.totalPaid)}`, color: 'neutral' as const },
        { id: 'interestRatio', label: 'Interest as % of Balance', value: `${((sim.totalInterest / balance) * 100).toFixed(1)}%`, color: sim.totalInterest / balance > 0.5 ? 'negative' as const : 'neutral' as const },
      );
    } else {
      if (isNaN(monthlyPayment) || monthlyPayment <= 0) return [];

      const minPayment = balance * monthlyRate;

      if (monthlyPayment <= minPayment) {
        return [
          {
            id: 'warning',
            label: 'Warning — Payment Too Low',
            value: `Your payment of $${fmtD(monthlyPayment)}/mo only covers the interest ($${fmtD(minPayment)}/mo). Your balance will never be paid off. Try increasing your payment or switching to the "pay off by date" mode.`,
            highlight: true,
            color: 'negative' as const,
          },
        ];
      }

      const sim = simulatePayoff(balance, apr, monthlyPayment, monthlyRate);

      results.push(
        {
          id: 'hero', label: `Debt-Free by ${fmtDate(sim.months)}`, value: `$${fmtD(monthlyPayment)}/mo`, highlight: true, color: 'positive' as const,
          interpretation: (() => {
            const simPlus = simulatePayoff(balance, apr, monthlyPayment + 50, monthlyRate);
            const monthsSaved = sim.months - simPlus.months;
            const interestSaved = sim.totalInterest - simPlus.totalInterest;
            return `At $${fmtD(monthlyPayment)}/mo you'll pay $${fmtD(sim.totalInterest)} in interest (${((sim.totalInterest / balance) * 100).toFixed(0)}% of your balance) over ${Math.floor(sim.months / 12)}yr ${sim.months % 12}mo.${monthsSaved > 0 ? ` Adding just $50/mo would make you debt-free ${monthsSaved} month${monthsSaved === 1 ? '' : 's'} sooner and save $${fmtD(interestSaved)} in interest.` : ''}`;
          })(),
        },
        { id: 'payoffDate', label: 'Debt-Free Date', value: fmtDate(sim.months), color: 'positive' as const },
        { id: 'payoffTime', label: 'Time to Pay Off', value: `${Math.floor(sim.months / 12)}yr ${sim.months % 12}mo`, color: 'neutral' as const },
        { id: 'totalInterest', label: 'Total Interest Paid', value: `$${fmtD(sim.totalInterest)}`, color: 'negative' as const },
        { id: 'interestRatio', label: 'Interest as % of Balance', value: `${((sim.totalInterest / balance) * 100).toFixed(1)}%`, color: sim.totalInterest / balance > 0.5 ? 'negative' as const : 'neutral' as const },
        { id: 'totalPaid', label: 'Total Amount Paid', value: `$${fmtD(sim.totalPaid)}`, color: 'neutral' as const },
      );
    }

    return results;
  },

  extraPanel: (values, results) => {
    const balance = parseFloat(values.balance);
    const apr = parseFloat(values.apr) / 100;
    const payoffMode = values.payoffMode || 'fixed';
    const monthlyPayment = parseFloat(values.monthlyPayment) || 0;
    const targetMonths = parseFloat(values.targetMonths) || 0;

    if (!results.length || isNaN(balance) || balance <= 0) return null;
    if (results[0]?.id === 'warning') return null;

    return createElement(CreditCardPanel, { balance, apr, payoffMode, monthlyPayment, targetMonths, results });
  },

  educational: {
    formula: 'n = −log(1 − (r × B) / P) ÷ log(1 + r)   ·   P = B × [r(1+r)^n] / [(1+r)^n − 1]',
    diagram: {
      svg: creditCardSvg,
      alt: 'Declining balance curve showing credit card payoff over time with payment composition bars for early vs late months',
      caption: 'Early payments go mostly toward interest — increasing your monthly payment dramatically reduces total interest paid',
    },
    formulaDescription:
      'The first formula calculates the exact number of months needed to pay off a credit card balance with a fixed monthly payment. The second calculates the required monthly payment to be debt-free by a target date. Both are derived from the standard loan amortization formula adapted for revolving credit.',
    variables: [
      { symbol: 'Balance & Timeline', name: 'Debt Amount & Payoff Duration', description: 'Your current credit card balance (B) directly determines the pay-off timeline. At 22% APR on a $5,000 balance, paying $200/month takes about 30 months; paying only the minimum takes over 8 years.' },
      { symbol: 'r', name: 'Monthly Rate', description: 'Your APR divided by 12. Credit card APRs are typically quoted as annual rates, but interest is charged monthly on the average daily balance.' },
      { symbol: 'P', name: 'Monthly Payment', description: 'The fixed amount you plan to pay each month. If this amount does not exceed the monthly interest charge, the balance will never decrease.' },
    ],
    howToUse: [
      'Enter your current balance and APR (found on your monthly statement).',
      'Choose "Fixed amount" to set your own payment, or "By date" to find the monthly payment needed for a specific deadline.',
      'Review your debt-free date, total interest, total paid, and the monthly payoff timeline chart.',
    ],
    commonUses: [
      'Find out exactly how long it will take to pay off your credit card balance and how much total interest you will pay at your current payment rate.',
      'Determine the monthly payment needed to become debt-free by a specific date, such as before a major life event.',
      'See how increasing your monthly payment by even a small amount dramatically reduces total interest and accelerates your payoff timeline.',
    ],
    explanation:
      'Credit card debt is among the most expensive debt available to consumers, with average APRs currently exceeding 20%. The insidious nature of compound interest means that making only minimum payments keeps you in debt for decades. On a $5,000 balance at 22% APR, paying only the 2% minimum ($100/month initially) costs over $4,500 in interest and takes more than 8 years to pay off. Even worse, if your monthly payment does not exceed the monthly interest charge, your balance never decreases — you are treading water financially. This calculator makes the true cost visible and helps you find a realistic payoff strategy that fits your budget.',
    faqs: [
      {
        question: 'What is the minimum payment trap?',
        answer: 'Minimum payments (typically 1-2% of the balance) often barely cover the interest each month. At a typical 22% APR, a $5,000 balance generates about $92 in interest every month. If your minimum payment is $100, only $8 goes toward principal. At that rate, it would take over 30 years to pay off the balance and cost more than $12,000 in interest. This calculator warns you if your payment is too low to ever pay off the balance.',
      },
      {
        question: 'Should I pay off my credit card or save first?',
        answer: 'Mathematically, if your credit card APR exceeds your expected investment returns (which it almost certainly does at 20%+), paying off the card is overwhelmingly the better financial move. A guaranteed 22% return by avoiding interest beats any stock market investment. The one exception is an employer 401(k) match — contribute enough to capture the full match first, as that is an immediate 50-100% return on your money, then focus everything else on eliminating credit card debt.',
      },
      {
        question: 'Will paying off my card hurt my credit score?',
        answer: 'Paying off a credit card typically helps your credit score by lowering your credit utilization ratio — the percentage of your available credit you are using. Utilization is the second most important factor in FICO scores after payment history. The only potential temporary dip comes if you close the card after paying it off, which reduces your total available credit and can increase your overall utilization. Keep paid-off cards open with a zero balance to maximize your score.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Tanya in Denver, CO has a $5,000 balance on her Chase credit card at 21.99% APR. She wants to know how long it will take if she pays $200/month, and whether she can afford to pay it off in 24 months instead.',
        inputs: { balance: '5000', apr: '21.99', payoffMode: 'fixed', monthlyPayment: '200' },
        result: 'At $200/month fixed payment, Tanya will be debt-free in approximately 2 years 10 months (34 months). She will pay about $1,749 in total interest — roughly 35% of her original balance. Total amount paid: $6,749.',
        insight: 'Tanya\'s $200/month payment covers her first month\'s interest charge of about $92 and applies only $108 toward principal. The slow start is the nature of credit card debt — early payments are mostly interest. Adding just $50 more per month ($250 total) would cut her payoff time to roughly 2 years 1 month (25 months) and save approximately $550 in interest. This demonstrates the most powerful debt-reduction insight: the best return on investment is paying down high-interest credit card debt.',
      },
      {
        scenario: 'David in Miami, FL wants to pay off his $8,200 credit card at 24.99% APR by his daughter\'s college graduation, which is exactly 36 months away. He uses the "pay off by date" mode to find the required monthly payment.',
        inputs: { balance: '8200', apr: '24.99', payoffMode: 'bydate', targetMonths: '36' },
        result: 'David needs to pay $325.99/month to be debt-free in 36 months. Over that time he will pay $3,536 in total interest — about 43% of his original balance. Total repayment: $11,736 on an $8,200 balance.',
        insight: 'The required monthly payment of nearly $326 is significantly higher than the 2% minimum payment his card statement shows (~$164/month). If David paid only the minimum, he would be in debt for over 10 years and pay more than $9,000 in interest. The target-date mode reveals the uncomfortable truth about credit card debt: short payoff timelines require large monthly payments, and the interest cost is punishing even on "reasonable" timelines. David\'s 43% interest-to-balance ratio shows why paying only the minimum is financial quicksand.',
      },
    ],

    proTips: [
      'A 0% balance transfer card can save you thousands if you qualify. Even with a 3-5% transfer fee, moving a 22% APR balance to a 0% card for 18 months cuts your effective interest rate to roughly 2-3% — but you must pay it off before the promotional period ends, or deferred interest may apply retroactively.',
      'Use this calculator\'s "by date" mode to set a specific debt-free deadline tied to a real event (tax refund season, bonus payout, or a birthday). A concrete date creates psychological commitment that "I\'ll pay it off eventually" does not.',
      'If your payment barely exceeds the monthly interest charge, you are treading water. At 22% APR on a $5,000 balance, interest is ~$92/month. A $100 payment means only $8 goes to principal. The calculator warns you when your payment is too low — never ignore that warning.',
      'Snowball method: pay minimums on all cards, apply all extra cash to the smallest balance first for quick wins. Avalanche method: apply extra to the highest APR card first for maximum mathematical savings. This calculator shows you exactly how much each approach saves.',
    ],

    quickReference: [
      { label: 'Average Credit Card APR (2026)', value: '20-23% — among the most expensive consumer debt' },
      { label: '2% Minimum Payment on $5,000', value: '~$100/month — takes 10+ years to pay off, costs $5,000+ in interest' },
      { label: 'Payoff Formula (Fixed Payment)', value: 'Months = −log(1 − rB/P) ÷ log(1 + r) where r = monthly rate, B = balance, P = payment' },
      { label: 'Payoff Formula (By Date)', value: 'P = B × [r(1+r)^n] ÷ [(1+r)^n − 1] — standard loan amortization formula' },
      { label: 'Balance Transfer Typical Fee', value: '3-5% of transferred balance — still far cheaper than 20%+ APR if paid during promo period' },
    ],

    limitations: [
      'This calculator assumes a fixed APR for the entire payoff period. In reality, credit card rates are variable and can change when the Federal Reserve adjusts rates, if you miss a payment (penalty APR), or when promotional rates expire.',
      'It does not account for annual fees, late payment fees, cash advance fees, balance transfer fees, or foreign transaction fees — all of which increase the true cost of carrying a balance and extend the payoff timeline.',
      'The calculation assumes no new purchases are added to the balance. If you continue using the card while paying it down, your actual payoff date will be later and total interest will be higher than shown.',
      'This calculator models a single card in isolation. Real debt repayment strategies must consider all debts simultaneously — mortgages, student loans, auto loans, and multiple credit cards — to optimize the allocation of limited monthly cash flow.',
    ],
citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/c/credit-card-payoff.asp' },
    ],
  },
};

export default creditCardPayoffConfig;
