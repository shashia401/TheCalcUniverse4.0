import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import MortgageComparePanel from './MortgageComparePanel';
import { money2dp as fmt } from '../../../lib/format';
import { pmt } from '../../../utils/financial';

/** PMI is requested to drop at 80% LTV of the original value (HPA: automatic at 78%). */
const PMI_DROP_LTV = 0.8;

/** Months of PMI: payments until the scheduled balance first reaches 80% of the home price. */
function pmiMonthsFor(price: number, loan: number, monthlyRate: number, payment: number, termMonths: number): number {
  let balance = loan;
  for (let m = 0; m < termMonths; m++) {
    if (balance <= price * PMI_DROP_LTV + 1e-9) return m;
    balance = balance * (1 + monthlyRate) - payment;
  }
  return termMonths;
}

const mortgageComparisonConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Home Price',
      type: 'number',
      placeholder: '400,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Total purchase price of the home',
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '80,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Amount paid upfront (typically 20% for no PMI)',
    },
    {
      id: 'rate15',
      label: '15-Year Interest Rate',
      type: 'percentage',
      placeholder: '5.5',
      inputMode: 'decimal',
      min: 0,
      max: 30,
      step: 0.125,
      required: true,
      helpText: 'Current rate for a 15-year fixed mortgage',
    },
    {
      id: 'rate30',
      label: '30-Year Interest Rate',
      type: 'percentage',
      placeholder: '6.5',
      inputMode: 'decimal',
      min: 0,
      max: 30,
      step: 0.125,
      required: true,
      helpText: 'Current rate for a 30-year fixed mortgage',
    },
    {
      id: 'propertyTaxRate',
      label: 'Annual Property Tax Rate',
      type: 'percentage',
      placeholder: '1.2',
      inputMode: 'decimal',
      min: 0,
      max: 5,
      step: 0.1,
      helpText: 'Percentage of home value paid annually in property taxes (typically 0.5-2%)',
    },
    {
      id: 'annualInsurance',
      label: 'Annual Homeowner Insurance',
      type: 'number',
      placeholder: '1,200',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: 'Yearly cost of homeowner insurance',
    },
    {
      id: 'pmiRate',
      label: 'PMI Rate (if down payment < 20%)',
      type: 'percentage',
      placeholder: '0.5',
      inputMode: 'decimal',
      min: 0,
      max: 3,
      step: 0.1,
      helpText: 'Annual PMI rate (typically 0.3-1.5% of loan amount)',
    },
  ],
  calculate: (values) => {
    const homePrice = parseFloat(values.homePrice);
    const downPayment = parseFloat(values.downPayment);
    const rate15 = parseFloat(values.rate15) / 100;
    const rate30 = parseFloat(values.rate30) / 100;
    // Required inputs: a blank rate must not silently become a 0% mortgage.
    if ([homePrice, downPayment, rate15, rate30].some((n) => !Number.isFinite(n))) return [];
    const propertyTaxRate = (parseFloat(values.propertyTaxRate) || 0) / 100;
    const annualInsurance = parseFloat(values.annualInsurance) || 0;
    const pmiRate = (parseFloat(values.pmiRate) || 0) / 100;

    if (homePrice <= 0 || downPayment < 0 || homePrice <= downPayment) return [];

    const loanAmount = homePrice - downPayment;
    const downPaymentPct = (downPayment / homePrice) * 100;

    // Monthly property tax and insurance
    const monthlyTax = (homePrice * propertyTaxRate) / 12;
    const monthlyInsurance = annualInsurance / 12;

    // PMI: required if down payment < 20%
    const hasPmi = downPaymentPct < 20;
    const monthlyPmi = hasPmi ? (loanAmount * pmiRate) / 12 : 0;

    // 15-year
    const months15 = 15 * 12;
    const basePayment15 = pmt(loanAmount, rate15 / 12, months15);
    const totalMonthly15 = basePayment15 + monthlyTax + monthlyInsurance + monthlyPmi;
    const totalInterest15 = basePayment15 * months15 - loanAmount;
    const pmiMonths15 = hasPmi ? pmiMonthsFor(homePrice, loanAmount, rate15 / 12, basePayment15, months15) : 0;

    // 30-year
    const months30 = 30 * 12;
    const basePayment30 = pmt(loanAmount, rate30 / 12, months30);
    const totalMonthly30 = basePayment30 + monthlyTax + monthlyInsurance + monthlyPmi;
    const totalInterest30 = basePayment30 * months30 - loanAmount;
    const pmiMonths30 = hasPmi ? pmiMonthsFor(homePrice, loanAmount, rate30 / 12, basePayment30, months30) : 0;

    // Savings attributable to the loan choice: interest + PMI actually paid. Property tax and
    // insurance are owed for as long as you own the home under either loan, so they are excluded.
    const financeCost15 = totalInterest15 + monthlyPmi * pmiMonths15;
    const financeCost30 = totalInterest30 + monthlyPmi * pmiMonths30;
    const savings = financeCost30 - financeCost15;
    const extraMonthly = totalMonthly15 - totalMonthly30;

    const fmtWhole = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return [
      {
        id: 'monthly15',
        label: '15-Year Monthly Payment (incl. taxes & insurance)',
        value: `$${fmt(totalMonthly15)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'monthly30',
        label: '30-Year Monthly Payment (incl. taxes & insurance)',
        value: `$${fmt(totalMonthly30)}`,
        highlight: true,
        color: 'negative' as const,
      },
      {
        id: 'interest15',
        label: 'Total Interest Paid (15-Year)',
        value: `$${fmtWhole(totalInterest15)}`,
        color: 'positive' as const,
      },
      {
        id: 'interest30',
        label: 'Total Interest Paid (30-Year)',
        value: `$${fmtWhole(totalInterest30)}`,
        color: 'negative' as const,
      },
      {
        id: 'savings',
        label: 'Total Savings with 15-Year (interest + PMI)',
        value: savings > 0 ? `$${fmtWhole(savings)}` : 'No savings',
        color: savings > 0 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'extraMonthly',
        label: 'Extra Monthly Cost for 15-Year',
        value: extraMonthly > 0 ? `$${fmt(extraMonthly)}` : 'Less than 30-year',
        color: 'neutral' as const,
      },
      ...(hasPmi
        ? [{
            id: 'pmiDuration',
            label: 'PMI Drops Off After (15-yr / 30-yr)',
            value: `${(pmiMonths15 / 12).toFixed(1)} yrs / ${(pmiMonths30 / 12).toFixed(1)} yrs`,
            color: 'neutral' as const,
            interpretation: 'PMI is charged until the scheduled balance reaches 80% of the home price, then dropped. The monthly payments above include PMI while it applies.',
          }]
        : []),
      {
        id: '_breakdown',
        label: '_breakdown',
        value: JSON.stringify({
          loanAmount,
          downPaymentPct: downPaymentPct.toFixed(1),
          hasPmi,
          monthlyPmi,
          monthlyTax,
          monthlyInsurance,
          basePayment15,
          basePayment30,
          pmiMonths15,
          pmiMonths30,
        }),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MortgageComparePanel, { values, results });
  },
  educational: {
    formula: 'M = P × [r(1+r)^n] / [(1+r)^n - 1] where M = monthly payment, P = principal, r = monthly rate, n = months',
    formulaDescription: 'This calculator compares a 15-year vs 30-year mortgage side by side, accounting for different interest rates, property taxes, insurance, and PMI. The shorter term almost always has a lower rate but higher monthly payment, while the longer term has lower payments but dramatically more total interest. The key insight: the "savings" from a 15-year term is typically hundreds of thousands of dollars, but only if you can afford the higher monthly payment.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">15-Year vs 30-Year Mortgage</text><rect x="35" y="30" width="105" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.85"/><text x="87" y="45" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">15-Year</text><rect x="180" y="30" width="105" height="24" rx="4" fill="var(--svg-ef4444)" opacity="0.85"/><text x="232" y="45" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">30-Year</text><line x1="20" y1="62" x2="300" y2="62" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="80" font-size="10" fill="var(--svg-333333)">Monthly Payment</text><rect x="145" y="68" width="8" height="14" rx="2" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="158" y="79" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">Higher</text><rect x="210" y="72" width="8" height="10" rx="2" fill="var(--svg-ef4444)" opacity="0.8"/><text x="223" y="79" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Lower</text><line x1="20" y1="96" x2="300" y2="96" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="114" font-size="10" fill="var(--svg-333333)">Total Interest</text><rect x="145" y="108" width="8" height="8" rx="2" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="158" y="116" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">Lower</text><rect x="210" y="104" width="8" height="14" rx="2" fill="var(--svg-ef4444)" opacity="0.8"/><text x="223" y="116" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Higher</text><line x1="20" y1="130" x2="300" y2="130" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="148" font-size="10" fill="var(--svg-333333)">Equity Build Speed</text><rect x="145" y="138" width="8" height="14" rx="2" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="158" y="149" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">Fast</text><rect x="210" y="144" width="8" height="8" rx="2" fill="var(--svg-ef4444)" opacity="0.8"/><text x="223" y="149" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Slow</text><rect x="15" y="160" width="290" height="34" rx="5" fill="var(--svg-f0f9ff)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="176" text-anchor="middle" font-size="9" fill="var(--svg-555555)">15-yr: lower rate, higher payment, saves $100K-$300K+</text><text x="160" y="190" text-anchor="middle" font-size="9" fill="var(--svg-555555)">30-yr: lower payment, more flexibility, can prepay</text></svg>',
      alt: 'Side-by-side comparison of 15-year vs 30-year mortgage features',
      caption: '15-year mortgages have higher monthly payments but save significantly on total interest over the loan life.',
    },
    variables: [
      { symbol: 'PMI', name: 'Private Mortgage Insurance', description: 'Required when down payment is less than 20%. Typically 0.3-1.5% of the loan amount annually, paid monthly until you reach 20% equity.' },
      { symbol: 'LTV', name: 'Loan-to-Value Ratio', description: 'The loan amount divided by the home price. LTV above 80% triggers PMI requirement.' },
      { symbol: 'Escrow', name: 'Escrow Payment', description: 'Monthly payment that includes taxes and insurance held in escrow by the lender, paid on your behalf when due.' },
    ],
    howToUse: [
      'Enter the home price and your down payment amount.',
      'Enter current 15-year and 30-year mortgage rates.',
      'Optionally add property tax rate and annual insurance for a true monthly comparison.',
      'If down payment is under 20%, enter your estimated PMI rate.',
      'Compare the monthly payment and total cost side by side.',
    ],
    commonUses: [
      'Compare a 15-year versus 30-year mortgage side by side to see the trade-off between lower monthly payments and total interest savings.',
      'Determine whether the higher monthly payment of a shorter mortgage term is worth the hundreds of thousands of dollars in interest saved over the loan life.',
      'Factor in PMI, property taxes, and insurance to get a true monthly payment comparison between different mortgage options.',
    ],
    explanation: 'The 15-year vs 30-year mortgage decision is one of the most consequential financial choices a homebuyer makes. A 15-year mortgage typically offers a lower interest rate (often 0.5-1% lower) and builds equity twice as fast, but requires a significantly higher monthly payment. Over the life of the loan, the 30-year mortgage can cost $100,000-$300,000+ more in interest. However, the 30-year offers lower monthly payments and more flexibility — the difference can be invested elsewhere. This calculator gives you the exact numbers for your specific scenario so you can make an informed tradeoff.',
    faqs: [
      { question: 'Is a 15-year mortgage always better?', answer: 'Not always. A 15-year mortgage saves on total interest but requires higher monthly payments. If the payment difference would strain your budget or prevent you from investing in retirement accounts (especially with employer match), the 30-year may be better. You can always make extra principal payments on a 30-year to effectively shorten the term.' },
      { question: 'How is PMI calculated?', answer: 'PMI (Private Mortgage Insurance) typically costs 0.3% to 1.5% of the original loan amount per year, paid monthly. It is required when your down payment is less than 20% of the home price. Once you reach 20% equity, you can request PMI cancellation.' },
      { question: 'Should I include property taxes in my comparison?', answer: 'Yes — property taxes and insurance are unavoidable costs of homeownership. Including them gives you the true monthly payment difference between the two loan options. Property tax rates vary significantly by location, from under 0.5% in some areas to over 2.5% in others.' },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Elena and Tom are buying a $400,000 home in Raleigh, NC, with a 20% down payment ($80,000). They are comparing a 15-year loan at 5.5% versus a 30-year loan at 6.5%. Property taxes are 0.8% and annual insurance is $1,200.',
        inputs: {
          'Home Price': '$400,000',
          'Down Payment': '$80,000',
          '15-Year Interest Rate': '5.5%',
          '30-Year Interest Rate': '6.5%',
          'Annual Property Tax Rate': '0.8%',
          'Annual Homeowner Insurance': '$1,200',
          'PMI Rate': '0.5%',
        },
        result: '15-year: $2,981.33/month (incl. taxes & insurance), base P&I $2,614.67, total interest $150,640. 30-year: $2,389.28/month, base P&I $2,022.62, total interest $408,142. Lifetime savings with the 15-year loan (interest + PMI; no PMI here): approximately $257,502. The 15-year costs about $592 more per month.',
        insight: 'The 15-year loan saves Elena and Tom roughly $257,500 in interest over the life of the loan but costs about $592 more per month. The shorter term\'s lower interest rate (5.5% vs. 6.5%) accounts for part of the savings, and the accelerated amortization accounts for the rest. They need to decide whether they can afford the higher monthly payment — or whether investing that $592/month difference elsewhere might beat the guaranteed return that the shorter loan provides. Investing only wins if your after-tax return reliably exceeds the mortgage rate, which is not guaranteed.',
      },
      {
        scenario: 'James is a first-time buyer in Detroit purchasing a $250,000 home with only a 5% down payment ($12,500). He is comparing 15-year at 5.75% vs 30-year at 6.75%. With less than 20% down, PMI at 0.5% applies. Property taxes are 1.4% and insurance is $900/year.',
        inputs: {
          'Home Price': '$250,000',
          'Down Payment': '$12,500',
          '15-Year Interest Rate': '5.75%',
          '30-Year Interest Rate': '6.75%',
          'Annual Property Tax Rate': '1.4%',
          'Annual Homeowner Insurance': '$900',
          'PMI Rate': '0.5%',
        },
        result: '15-year: $2,437.85/month (incl. PMI, taxes & insurance), base P&I $1,972.22, total interest $117,500. 30-year: $2,006.05/month, base P&I $1,540.42, total interest $317,051. PMI drops off after about 3.4 years on the 15-year and 10.6 years on the 30-year. Lifetime savings with the 15-year (interest + PMI): approximately $208,061. Extra monthly cost for 15-year: about $432.',
        insight: 'With only 5% down, James pays PMI on both options until the balance falls to 80% of the home price — which happens much faster with the 15-year loan (about 3.4 years vs 10.6 years). The PMI adds about $99/month to both payments initially. The combined effect of a lower rate, faster equity build, and earlier PMI removal makes the 15-year particularly attractive if James can stretch his budget by about $432/month. The 15-year saves roughly $199,500 in total interest compared to the 30-year. The 30-year option, however, keeps his DTI ratio lower for loan qualification — an important consideration for a first-time buyer.',
      },
    ],

    proTips: [
      'The 15-year rate is typically 0.5%–1% lower than the 30-year rate. This rate spread is free money — but only if you qualify and can afford the higher monthly payment. Run both rates at current market levels, not guesstimates.',
      'PMI falls off automatically at 78% LTV or can be requested at 80%. On a 15-year loan, you hit 80% LTV roughly twice as fast because more of each payment goes to principal. Factor in the PMI removal date when comparing total costs.',
      'Consider the "30-year + prepay" strategy: take the 30-year for the lower required payment, but make extra principal payments equivalent to the 15-year amount. You get most of the interest savings of the 15-year with the flexibility to drop back to the lower payment if finances tighten.',
      'If you invest the monthly savings from the 30-year (instead of spending it), you may come out ahead of the 15-year even after paying more interest — but only if your after-tax investment return reliably beats your mortgage rate. The 15-year\'s interest savings are a certain return; market returns are not.',
    ],

    quickReference: [
      { label: '15-Year Typical Rate', value: '0.5–1.0% below 30-year' },
      { label: 'PMI Required', value: 'Down payment < 20%' },
      { label: 'PMI Annual Cost', value: '0.3–1.5% of loan amount' },
      { label: '$400K home, 20% down', value: '15yr saves ~$258K in interest vs 30yr (5.5% vs 6.5%)' },
      { label: 'Break-Even on Prepay', value: 'Invest difference if return > mortgage rate' },
      { label: 'Property Tax Range', value: '0.3% (HI) to 2.5% (NJ, IL)' },
    ],

    limitations: [
      'Rate quotes are estimates. Actual mortgage rates depend on your credit score, loan type (conventional, FHA, VA, jumbo), points paid, and the specific lender. Always get a Loan Estimate from at least 3 lenders before deciding.',
      'PMI is simplified as a flat annual percentage. In reality, PMI rates vary by credit score, LTV, and mortgage insurer. FHA loans use MIP (Mortgage Insurance Premium) with different rules, including upfront premiums and potentially lifetime MIP.',
      'Property taxes are assumed constant. In reality, property taxes can increase significantly after purchase if the home is reassessed at the new purchase price. Some states cap annual increases (CA Prop 13), others do not.',
      'This comparison does not factor in the opportunity cost of the larger down payment, tax deductibility of mortgage interest (which changed significantly under the TCJA), closing costs, or the fact that 15-year loans may have slightly different underwriting requirements and debt-to-income ratio limits.',
    ],
citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/mortgage/' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/m/mortgage.asp' },
    ],
  },
};

export default mortgageComparisonConfig;
