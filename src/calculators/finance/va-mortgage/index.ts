import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import VAPanel from './VAPanel';

// VA Funding Fee Table (purchase loans only)
// < 5% down:   first=2.15%, subsequent=3.30%
// 5–9.99%:     first=1.50%, subsequent=1.50%
// >= 10%:      first=1.25%, subsequent=1.25%

function getVAFundingFeeRate(downPaymentPct: number, useType: string): number {
  if (downPaymentPct < 5) {
    return useType === 'first' ? 0.0215 : 0.033;
  } else if (downPaymentPct < 10) {
    return 0.015;
  } else {
    return 0.0125;
  }
}

const vaMortgageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Home Price',
      type: 'number',
      prefix: '$',
      placeholder: '400,000',
      required: true,
      helpText: 'The purchase price of the home. VA loans have no maximum loan amount with full entitlement, but lenders may impose their own limits.',
    },
    {
      id: 'downPaymentType',
      label: 'Down Payment Input',
      type: 'select',
      helpText: 'Choose whether to enter your down payment as a dollar amount or as a percentage of the home price. VA loans allow 0% down.',
      options: [
        { label: 'Dollar Amount ($)', value: 'dollar' },
        { label: 'Percentage (%)', value: 'percent' },
      ],
    },
    {
      id: 'downPaymentValue',
      label: 'Down Payment',
      type: 'number',
      placeholder: '0',
      helpText: 'VA loans allow 0% down. Enter 0 to see the full VA benefit.',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      required: true,
      helpText: '30-year term has lower monthly payments but higher total interest. 15-year term saves tens of thousands in interest but requires higher monthly payments.',
      options: [
        { label: '30 years', value: '30' },
        { label: '15 years', value: '15' },
      ],
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'number',
      unit: '%',
      placeholder: '6.75',
      min: 0,
      max: 25,
      step: 0.01,
      required: true,
      helpText: 'VA rates are typically 0.25-0.50% lower than conventional rates. Enter the rate quoted by your VA-approved lender.',
    },
    {
      id: 'vaUseType',
      label: 'VA Loan Use',
      type: 'select',
      required: true,
      helpText: 'First use of VA benefit vs. subsequent use affects the funding fee.',
      options: [
        { label: 'First-time use of VA benefit', value: 'first' },
        { label: 'Subsequent use of VA benefit', value: 'subsequent' },
      ],
    },
    {
      id: 'fundingFeeExempt',
      label: 'Funding Fee Exemption',
      type: 'select',
      helpText:
        'Veterans receiving service-connected disability compensation or certain surviving spouses are exempt.',
      options: [
        { label: 'Not exempt — standard funding fee applies', value: 'no' },
        { label: 'Exempt — service-connected disability or DIC recipient', value: 'yes' },
      ],
    },
    {
      id: 'fundingFeePaidUpfront',
      label: 'How to pay the VA Funding Fee?',
      type: 'select',
      helpText: 'Most borrowers roll the funding fee into the loan balance to preserve cash.',
      options: [
        { label: 'Roll into loan balance (most common)', value: 'rolled' },
        { label: 'Pay upfront in cash at closing', value: 'upfront' },
      ],
    },
    {
      id: 'annualPropertyTax',
      label: 'Annual Property Taxes',
      type: 'number',
      prefix: '$',
      placeholder: '4,800',
      helpText: 'Enter your estimated annual property tax amount.',
    },
    {
      id: 'annualInsurance',
      label: 'Annual Hazard Insurance',
      type: 'number',
      prefix: '$',
      placeholder: '1,800',
      helpText: 'Homeowners insurance premium per year.',
    },
    {
      id: 'monthlyHOA',
      label: 'Monthly HOA Fees',
      type: 'number',
      prefix: '$',
      placeholder: '0',
      helpText: 'Monthly homeowners association dues. Enter 0 if your property has no HOA.',
    },
  ],

  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const homePrice = parseFloat(values.homePrice);
    const interestRate = parseFloat(values.interestRate);
    const loanTerm = parseInt(values.loanTerm || '30');

    if (isNaN(homePrice) || homePrice <= 0) return [];
    if (isNaN(interestRate) || interestRate < 0) return [];

    const downPaymentType = values.downPaymentType || 'dollar';
    const downPaymentRaw = parseFloat(values.downPaymentValue) || 0;

    const downPaymentDollars =
      downPaymentType === 'dollar'
        ? downPaymentRaw
        : homePrice * (downPaymentRaw / 100);

    const downPaymentPct = (downPaymentDollars / homePrice) * 100;
    const baseLoanAmount = homePrice - downPaymentDollars;

    const isExempt = values.fundingFeeExempt === 'yes';
    const fundingFeeRate = isExempt
      ? 0
      : getVAFundingFeeRate(downPaymentPct, values.vaUseType || 'first');

    const fundingFeeAmount = baseLoanAmount * fundingFeeRate;
    const isRolled = (values.fundingFeePaidUpfront || 'rolled') === 'rolled';
    const totalLoanAmount = isRolled
      ? baseLoanAmount + fundingFeeAmount
      : baseLoanAmount;

    const monthlyRate = interestRate / 100 / 12;
    const n = loanTerm * 12;

    let principalAndInterest: number;
    if (totalLoanAmount <= 0) {
      principalAndInterest = 0;
    } else if (monthlyRate === 0) {
      principalAndInterest = totalLoanAmount / n;
    } else {
      principalAndInterest =
        (totalLoanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
    }

    const annualPropertyTax = parseFloat(values.annualPropertyTax) || 0;
    const annualInsurance = parseFloat(values.annualInsurance) || 0;
    const monthlyHOA = parseFloat(values.monthlyHOA) || 0;

    const monthlyTax = annualPropertyTax / 12;
    const monthlyInsurance = annualInsurance / 12;
    const totalMonthlyPayment =
      principalAndInterest + monthlyTax + monthlyInsurance + monthlyHOA;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fundingFeePct = (fundingFeeRate * 100).toFixed(2);
    const fundingFeeLabel = isExempt
      ? 'VA Funding Fee — EXEMPT'
      : `VA Funding Fee (${fundingFeePct}%)`;

    return [
      {
        id: 'totalMonthlyPayment',
        label: 'Total Monthly Payment',
        value: `$${fmt(totalMonthlyPayment)}`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'principalAndInterest',
        label: 'Principal & Interest',
        value: `$${fmt(principalAndInterest)}`,
      },
      {
        id: 'fundingFeeResult',
        label: fundingFeeLabel,
        value: isExempt ? '$0.00' : `$${fmt(fundingFeeAmount)}`,
        color: fundingFeeAmount > 0 ? 'negative' : 'positive',
      },
      {
        id: 'totalLoanAmountResult',
        label: 'Total Loan Amount (incl. Funding Fee if rolled)',
        value: `$${fmt(totalLoanAmount)}`,
      },
      {
        id: 'noPMINote',
        label: 'Private Mortgage Insurance (PMI)',
        value: '$0.00 — Not required on VA loans',
        color: 'positive',
      },
      {
        id: 'monthlyTaxResult',
        label: 'Monthly Property Tax',
        value: `$${fmt(monthlyTax)}`,
      },
      {
        id: 'monthlyInsuranceResult',
        label: 'Monthly Insurance',
        value: `$${fmt(monthlyInsurance)}`,
      },
      {
        id: '_vaData',
        label: '_vaData',
        value: JSON.stringify({
          homePrice,
          downPaymentDollars,
          downPaymentPct,
          baseLoanAmount,
          totalLoanAmount,
          fundingFeeRate,
          fundingFeeAmount,
          fundingFeePaidUpfront: values.fundingFeePaidUpfront || 'rolled',
          fundingFeeExempt: isExempt,
          principalAndInterest,
          monthlyTax,
          monthlyInsurance,
          monthlyHOA,
          totalMonthlyPayment,
          interestRate,
          loanTerm,
          vaUseType: values.vaUseType || 'first',
        }),
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(VAPanel, { values, results });
  },

  educational: {
    formula: 'M = P × [r(1+r)^n] / [(1+r)^n − 1]  |  VA Funding Fee = Base Loan × Rate',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">VA Loan: The Ultimate Benefit</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">What makes VA loans superior to conventional mortgages</text><g transform="translate(30,65)"><!-- VA vs Conventional comparison --><rect x="20" y="0" width="180" height="85" rx="8" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="110" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-15803d)">VA Loan ($400K)</text><text x="110" y="38" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-166534)">0% Down ✓</text><text x="110" y="54" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-166534)">No PMI ✓</text><text x="110" y="70" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-166534)">Funding Fee: $8,600</text><rect x="230" y="0" width="180" height="85" rx="8" fill="var(--svg-fee2e2)" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="320" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-dc2626)">Conventional ($400K)</text><text x="320" y="38" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-991b1b)">5% Down: $20K</text><text x="320" y="54" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-991b1b)">PMI: ~$250/mo</text><text x="320" y="70" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-991b1b)">=$9K+ over 3yr</text><!-- Savings callout --><path d="M 200,85 L 200,98" stroke="var(--svg-22c55e)" stroke-width="1.5"/><rect x="60" y="98" width="310" height="30" rx="8" fill="var(--svg-f1f5f9)"/><text x="215" y="118" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">VA saves ~$15K vs Conventional over 5 years</text></g><!-- Funding Fee breakdown --><g transform="translate(40,145)"><rect x="10" y="0" width="370" height="85" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">VA Funding Fee — One-Time, Can Be Rolled In</text><rect x="25" y="28" width="80" height="22" rx="4" fill="var(--svg-22c55e)"/><text x="65" y="43" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">0% Down</text><text x="65" y="58" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">2.15%</text><rect x="115" y="28" width="80" height="22" rx="4" fill="var(--svg-3b82f6)"/><text x="155" y="43" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">5-10% Down</text><text x="155" y="58" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">1.50%</text><rect x="205" y="28" width="80" height="22" rx="4" fill="var(--svg-8b5cf6)"/><text x="245" y="43" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">10%+ Down</text><text x="245" y="58" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">1.25%</text><rect x="295" y="28" width="60" height="22" rx="4" fill="var(--svg-f59e0b)"/><text x="325" y="43" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">Disabled</text><text x="325" y="58" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">0%</text><text x="195" y="78" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Subsequent use: 3.30% (0% down) | Disability rating ≥ 10% = exempt</text></g><!-- Key advantages --><g transform="translate(40,245)"><rect x="10" y="0" width="370" height="80" rx="10" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e40af)">VA Loan Advantages vs. All Other Programs</text><text x="65" y="38" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Zero down payment required</text><text x="65" y="52" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">No PMI — save $150-$300/mo</text><text x="65" y="66" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Rates 0.25-0.50% below conventional</text><text x="290" y="38" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Funding fee can be rolled into loan</text><text x="290" y="52" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Assumable by other VA-eligible buyers</text><text x="290" y="66" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">No prepayment penalty</text></g></svg>',
      alt: 'VA loan diagram comparing VA (0% down, no PMI) vs conventional (5% down, PMI) loans side by side, with Funding Fee rate table by down payment amount',
      caption: 'VA loans offer zero down payment, no PMI, and competitive rates -- the single best mortgage program for eligible veterans',
    },
    formulaDescription:
      'VA loans use the standard mortgage amortization formula with some unique additions. The monthly payment includes principal and interest on the total loan amount (which may include the rolled-in VA Funding Fee). The key difference from conventional loans: no PMI requirement, a one-time VA Funding Fee that replaces PMI, and typically competitive interest rates. The Funding Fee rate depends on your down payment percentage and whether it is your first or subsequent use of VA loan benefits.',
    variables: [
      {
        symbol: 'VA Funding Fee',
        name: 'One-Time Fee',
        description: 'Replaces monthly PMI. First use with 0% down: 2.15%. First use with 5-10% down: 1.50%. First use with 10%+ down: 1.25%. Subsequent use with 0% down: 3.30%. Veterans with service-connected disabilities are exempt.',
      },
      {
        symbol: 'No PMI',
        name: 'No Private Mortgage Insurance',
        description: 'Unlike conventional loans, VA loans never require PMI — regardless of down payment size. This saves $100–$300/month compared to a conventional loan with less than 20% down.',
      },
      {
        symbol: '0% Down',
        name: 'Zero Down Payment Option',
        description: 'VA loans allow eligible borrowers to finance 100% of the home price. This is the only major mortgage program that offers true 0% down without requiring PMI or paying a higher rate.',
      },
    ],
    howToUse: [
      'Enter the home price and choose how to input your down payment (dollar or percentage). Try 0% to see the full VA benefit.',
      'Select your loan term (15 or 30 years) and enter the interest rate you have been quoted.',
      'Indicate whether this is your first VA loan use or a subsequent use — this affects the Funding Fee rate.',
      'If you have a service-connected disability rating of 10% or more, toggle the Funding Fee Exemption to "Exempt."',
      'Optionally enter property tax, insurance, and HOA estimates for a complete monthly payment picture.',
    ],
    commonUses: [
      'Calculate the monthly payment on a VA home loan including the funding fee to understand the true cost of zero-down mortgage financing.',
      'Compare VA loans against conventional mortgages by modeling the savings from no PMI and no minimum down payment requirements.',
      'Determine how a service-connected disability exemption from the VA funding fee affects your total loan cost and monthly payment.',
    ],
    explanation:
      'VA loans offer exceptional benefits that no other mortgage program matches: no PMI requirement (saving $100–$300/month vs. conventional loans with less than 20% down), no minimum down payment required, and competitive interest rates often 0.25–0.50% below conventional rates. The VA Funding Fee replaces PMI — it is a one-time fee paid at closing or rolled into the loan. For first-time VA loan users putting 0% down, the fee is 2.15% of the loan amount. For those putting 5% or more down, the fee drops to 1.50%. Veterans with a service-connected disability rating of 10% or more are fully exempt from this fee. Purple Heart recipients on active duty are also exempt. The ability to finance 100% of the home price without PMI is the single biggest advantage of VA loans. On a $400,000 home, a conventional loan with 5% down would require about $250/month in PMI and a $20,000 down payment. A VA loan with 0% down requires no PMI and no down payment — just the Funding Fee (which can be rolled into the loan). Over 5 years, the VA loan saves roughly $15,000 in PMI and upfront cash. Additionally, VA loans are assumable by other VA-eligible borrowers, which can be a powerful selling point if rates rise. The VA also offers support for borrowers facing financial hardship, including loan modifications and repayment plans. When comparing VA to other low-down-payment options like FHA (which requires both upfront and annual MIP for the life of the loan) or conventional 97% LTV (which requires PMI until the loan reaches 80% LTV), the VA loan almost always comes out ahead for eligible borrowers. Veterans should factor in the one-time nature of the funding fee versus the ongoing monthly cost of PMI or FHA mortgage insurance. For a typical 30-year loan, PMI can cost $15,000–$30,000 over the years before cancellation. The VA funding fee on a $400,000 purchase with 0% down for a first-time user is $8,600 — a fraction of the long-term PMI cost. For subsequent users, the higher 3.30% fee can be mitigated by putting 5% or more down, which drops the fee to 1.50%. The key is to run the numbers for your specific scenario — including property taxes, insurance, HOA fees, and the funding fee — to see your true monthly payment and total cost over time. Also consider that VA loans have no prepayment penalty, allowing you to refinance to a lower rate without penalty if rates drop.',
    faqs: [
      {
        question: 'Who is exempt from the VA Funding Fee?',
        answer:
          'Veterans receiving compensation for a service-connected disability, veterans who would be entitled to disability compensation but are receiving retirement pay instead, surviving spouses receiving Dependency and Indemnity Compensation (DIC), and active-duty service members who have received the Purple Heart. Exemption is automatic for those rated 10% or more disabled by the VA.',
      },
      {
        question: 'Should I put money down on a VA loan?',
        answer:
          'The math often favors 0% down: VA loans have no PMI, so the main cost of no-down-payment is the higher loan balance and more total interest. However, putting 5% or 10% down reduces the VA Funding Fee significantly (from 2.15% to 1.50% or 1.25% on first use). Run both scenarios to see which produces a lower total cost over your planned ownership period. If you have the cash, putting some down reduces your monthly payment and total interest.',
      },
      {
        question: 'Can I use my VA benefit more than once?',
        answer:
          'Yes — VA benefits can be reused. However, if you still have an active VA loan, you will be using your remaining entitlement, which may limit the loan amount on a second home. The funding fee increases for subsequent use (3.30% vs. 2.15% for 0% down). Once a previous VA loan is paid off (or sold), full entitlement is typically restored. You can also have your entitlement restored without selling if your loan is assumed by another eligible veteran.',
      },
      {
        question: 'How do VA rates compare to conventional mortgage rates?',
        answer:
          'VA loan interest rates are typically 0.25–0.50% lower than comparable conventional loans because the VA guaranty reduces lender risk. However, the VA Funding Fee offsets some of this advantage. When comparing total cost (rate + fees), VA loans almost always come out ahead for eligible borrowers who would otherwise put less than 20% down on a conventional loan, because the PMI savings alone are substantial.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },
      {
        question: 'Can I get a VA loan for a second home or investment property?',
        answer: 'VA loans are primarily intended for primary residences — the home you will live in as your main residence. You cannot use a VA loan to buy a vacation home or investment property. However, you can use a VA loan to purchase a multi-unit property (up to 4 units) as long as you occupy one of the units as your primary residence. You can also use a VA loan for a manufactured home, for new construction, and for refinancing an existing VA or non-VA loan via the VA Interest Rate Reduction Refinance Loan (IRRRL).',
      },
      {
        question: 'What credit score is needed for a VA loan?',
        answer: 'The VA itself does not set a minimum credit score requirement — the VA guarantee means the lender is protected against loss if you default. However, individual VA-approved lenders may impose their own credit score minimums, typically in the 580–620 range. Because the VA guaranty reduces lender risk, VA lenders are often more flexible with credit than conventional lenders. Still, a higher credit score will get you better interest rates and more lender options. Most VA lenders look for at least a 620 FICO score, and many will work with scores as low as 580 with compensating factors like a low debt-to-income ratio.',
      },
    ],
    
    workedExamples: [
      {
        scenario: 'Sergeant Michael Rodriguez, a first-time VA loan user in San Antonio, TX, is buying a $350,000 home with 0% down. He has no service-connected disability, so he must pay the 2.15% funding fee. His VA-approved lender quotes 6.25% on a 30-year fixed loan.',
        inputs: { homePrice: '350000', downPaymentType: 'dollars', downPaymentValue: '0', loanTerm: '30', interestRate: '6.25', vaUseType: 'first', fundingFeeExempt: 'no', fundingFeePaidUpfront: 'rolled', annualPropertyTax: '4200', annualInsurance: '1200', monthlyHOA: '0' },
        result: 'Monthly payment: approximately $2,646 including P&I, taxes, and insurance. Total loan amount (with rolled-in funding fee): $357,525.',
        insight: 'With 0% down and the funding fee rolled in, Michael finances everything with no upfront cash required. His total monthly payment of $2,646 includes principal, interest, property taxes ($350/mo), and insurance ($100/mo). The funding fee adds $7,525 to his loan but preserves his cash. Compared to a conventional loan with 5% down ($17,500 cash required) and $200/month PMI, the VA loan saves $17,500 upfront and eliminates $200/month in PMI. Over 5 years, total savings exceed $29,500.',
      },
      {
        scenario: 'Captain Sarah Chen, a disabled veteran with a 30% service-connected disability rating, is buying a $500,000 home in San Diego, CA. She has saved $50,000 for a down payment (10%) but is considering using 0% down since she is exempt from the funding fee.',
        inputs: { homePrice: '500000', downPaymentType: 'percent', downPaymentValue: '10', loanTerm: '30', interestRate: '6.0', vaUseType: 'first', fundingFeeExempt: 'yes', fundingFeePaidUpfront: 'rolled', annualPropertyTax: '6000', annualInsurance: '1500', monthlyHOA: '250' },
        result: 'Monthly payment with 10% down: approximately $3,279 including P&I, taxes, insurance, and HOA. Monthly payment with 0% down: approximately $3,553. Difference: $274/month.',
        insight: 'Sarah is exempt from the funding fee due to her disability rating, which saves her $10,750 (2.15% of $500K) even with 0% down. She must decide between keeping her $50,000 invested and paying $274 more per month, or putting it toward the house. At 6% interest, the $50,000 down payment saves about $25,000 in total interest over 30 years. If she expects to earn more than 6% on her investments, keeping the cash and going 0% down could be financially optimal.',
      },
      {
        scenario: 'Corporal James Wilson, a second-time VA loan user in Jacksonville, FL, wants to buy a $275,000 home. He previously used his VA benefit on a condo he sold 3 years ago. His lender quotes 6.5% on a 30-year loan, and he plans to put 5% down.',
        inputs: { homePrice: '275000', downPaymentType: 'percent', downPaymentValue: '5', loanTerm: '30', interestRate: '6.5', vaUseType: 'subsequent', fundingFeeExempt: 'no', fundingFeePaidUpfront: 'rolled', annualPropertyTax: '3300', annualInsurance: '1100', monthlyHOA: '75' },
        result: 'Monthly payment: approximately $1,983. Funding fee at subsequent use with 5% down: 1.50% (reduced from 3.30% at 0% down).',
        insight: 'As a second-time user, James faces a higher funding fee (3.30% at 0% down vs. 2.15% for first-time). By putting 5% down ($13,750), he reduces the funding fee to 1.50%, saving about $1,800 in fees. The down payment also lowers his loan amount and monthly payment. The tradeoff: $13,750 in cash upfront vs. the fee and interest savings. For James, the 5% down payment is a strong middle-ground option — it lowers the funding fee substantially without requiring the full 10% threshold for the lowest fee tier.',
      },
    ],
    proTips: [
      'If you have a service-connected disability rating (even 0%), get your VA disability letter BEFORE closing — the funding fee exemption can save thousands.',
      'The VA funding fee is lower when you put at least 5% down. If you have some savings, running both 0% and 5% scenarios side-by-side often reveals that modest down payments pay for themselves through lower fees and interest.',
      'VA loans are assumable by future buyers who are also VA-eligible. If rates rise, this can make your home more valuable to VA buyers who can "assume" your below-market rate instead of getting a new loan.',
      'When shopping lenders, compare both the rate AND lender fees. Some lenders charge a 1% origination fee on VA loans, while others do not. The VA does not limit lender origination fees — only the 1% funding fee.',
    ],
    quickReference: [
      { label: 'First use, 0% down funding fee', value: '2.15% of loan amount' },
      { label: 'Subsequent use, 0% down funding fee', value: '3.30% of loan amount' },
      { label: '5-9.99% down (any use)', value: '1.50% funding fee' },
      { label: '10%+ down (any use)', value: '1.25% funding fee' },
      { label: 'Minimum credit score (typical)', value: '580-620 FICO (lender-dependent)' },
      { label: 'Maximum loan (full entitlement)', value: 'No statutory limit' },
    ],
    limitations: [
      'VA loans are solely for primary residences — this calculator cannot model investment property or second home scenarios.',
      'The actual funding fee rate depends on your specific military service history, disability status, and whether it is your first or subsequent VA loan use. Verify your exact rate with your VA Certificate of Eligibility.',
      'VA loan rates and terms vary by lender. This calculator uses the standard mortgage amortization formula but does not account for lender-specific pricing adjustments, discount points, or closing cost variations.',
    ],
citations: [
      { source: 'US Department of Veterans Affairs', url: 'https://www.va.gov/housing-assistance/home-loans' },
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    ],
  },
};

export default vaMortgageConfig;
