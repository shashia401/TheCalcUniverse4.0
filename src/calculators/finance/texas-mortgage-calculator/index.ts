import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import TexasMortgagePanel from './TexasMortgagePanel';

const texasMortgageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Home Price',
      type: 'number',
      placeholder: '350,000',
      prefix: '$',
      min: 0,
      step: 1000,
      inputMode: 'numeric',
      required: true,
      helpText: 'Typical Texas median home price is ~$350,000 (varies by city)',
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '70,000',
      prefix: '$',
      min: 0,
      step: 1000,
      inputMode: 'numeric',
      required: true,
      helpText: '20% down avoids PMI. Texas offers down payment assistance programs.',
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'percentage',
      placeholder: '6.8',
      min: 0,
      max: 15,
      step: 0.125,
      inputMode: 'decimal',
      required: true,
      helpText: 'Current Texas average: ~6.8% for 30-year fixed (2026)',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      placeholder: '30',
      options: [
        { value: '15', label: '15 years' },
        { value: '20', label: '20 years' },
        { value: '30', label: '30 years' },
      ],
      required: true,
    },
    {
      id: 'propertyTaxRate',
      label: 'Property Tax Rate',
      type: 'percentage',
      placeholder: '1.8',
      min: 0,
      max: 4,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Texas average is ~1.8% — one of the highest in the US (no state income tax)',
    },
    {
      id: 'homesteadType',
      label: 'Homestead Exemption Type',
      type: 'select',
      options: [
        { value: 'none', label: 'Not eligible / Not applied' },
        { value: 'general', label: 'General Homestead ($100K school tax exemption)' },
        { value: 'senior', label: 'Senior 65+ / Disabled ($100K+ exemption, frozen school taxes)' },
      ],
      helpText: 'Texas Homestead Exemption removes part of your home value from school district property taxes.',
    },
  ],
  calculate: (values) => {
    const homePriceNum = parseFloat(values.homePrice);
    const downPaymentNum = parseFloat(values.downPayment);
    const interestRateNum = parseFloat(values.interestRate);
    const taxRateNum = parseFloat(values.propertyTaxRate);
    if (isNaN(homePriceNum) || isNaN(interestRateNum)) return [];
    if (homePriceNum <= 0 || isNaN(downPaymentNum) || downPaymentNum < 0 || downPaymentNum >= homePriceNum) return [];

    const homePrice = new Decimal(homePriceNum);
    const downPayment = new Decimal(downPaymentNum);
    const rate = new Decimal(interestRateNum).div(100);
    const term = parseInt(values.loanTerm) || 30;
    const taxRate = isNaN(taxRateNum) ? new Decimal(0) : new Decimal(taxRateNum).div(100);
    const homestead = values.homesteadType || 'none';

    const loanAmount = homePrice.minus(downPayment);
    const downPct = downPayment.div(homePrice).mul(100).toFixed(1);
    const months = term * 12;
    const monthlyRate = rate.div(12);

    let basePayment: Decimal;
    if (monthlyRate.gt(0)) {
      const factor = monthlyRate.plus(1).pow(months);
      basePayment = loanAmount.mul(monthlyRate.mul(factor)).div(factor.minus(1));
    } else {
      basePayment = loanAmount.div(months);
    }

    // School taxes are roughly 55% of total property tax in Texas
    const annualTaxBeforeExemption = homePrice.mul(taxRate);
    const schoolTaxRate = taxRate.mul(0.55);
    let annualTaxAfterExemption = annualTaxBeforeExemption;

    if (homestead === 'general') {
      // $100K general homestead exemption applies to school taxes
      const exemptedTax = new Decimal(100000).mul(schoolTaxRate);
      annualTaxAfterExemption = annualTaxBeforeExemption.minus(exemptedTax);
    } else if (homestead === 'senior') {
      // $100K+ exemption for seniors/disabled, plus school tax freeze
      const exemptedTax = new Decimal(100000).mul(schoolTaxRate);
      annualTaxAfterExemption = annualTaxBeforeExemption.minus(exemptedTax);
      // Senior freeze: assessed value cannot increase for school taxes
    }

    const monthlyTaxBefore = annualTaxBeforeExemption.div(12);
    const monthlyTaxAfter = annualTaxAfterExemption.div(12);

    const hasPmi = parseFloat(downPct) < 20;
    const monthlyPmi = hasPmi ? loanAmount.mul(0.005).div(12) : new Decimal(0);
    const totalMonthly = basePayment.plus(monthlyTaxAfter).plus(monthlyPmi);
    const totalInterest = basePayment.mul(months).minus(loanAmount);
    const totalCost = loanAmount.plus(totalInterest);

    const fmtDollar = (d: Decimal, decimals = 2): string =>
      `$${d.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    const fmtInt = (d: Decimal): string =>
      fmtDollar(d, 0);

    // Estimate income tax savings compared to states with income tax
    // Texas has no income tax; a comparable earner in a 6% state might save thousands
    const estimatedIncomeTaxSavings = homePrice.mul(0.06).div(12).toNumber();

    return [
      {
        id: 'monthlyPayment',
        label: 'Monthly Payment (Principal & Interest)',
        value: fmtDollar(basePayment),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'totalMonthly',
        label: 'Monthly with Taxes & PMI',
        value: fmtDollar(totalMonthly),
        highlight: true,
        color: 'neutral' as const,
      },
      {
        id: 'loanAmount',
        label: 'Loan Amount',
        value: fmtInt(loanAmount),
        color: 'neutral' as const,
      },
      {
        id: 'downPercent',
        label: 'Down Payment',
        value: `${downPct}% (${fmtInt(downPayment)})`,
        color: hasPmi ? 'negative' as const : 'positive' as const,
      },
      {
        id: 'totalInterest',
        label: 'Total Interest Paid',
        value: fmtInt(totalInterest),
        color: 'neutral' as const,
      },
      {
        id: 'totalCost',
        label: 'Total Cost of Loan',
        value: fmtInt(totalCost),
        color: 'neutral' as const,
      },
      {
        id: 'propertyTaxBefore',
        label: 'Annual Property Tax (before homestead)',
        value: `${fmtInt(annualTaxBeforeExemption)}/yr`,
        color: 'negative' as const,
      },
      {
        id: 'propertyTaxAfter',
        label: 'Annual Property Tax (after homestead)',
        value: homestead !== 'none' ? `${fmtInt(annualTaxAfterExemption)}/yr` : 'No exemption applied',
        color: homestead !== 'none' ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'homesteadSavings',
        label: 'Homestead Annual Savings',
        value: homestead !== 'none' ? `${fmtInt(annualTaxBeforeExemption.minus(annualTaxAfterExemption))}/yr` : 'Apply for homestead exemption',
        color: homestead !== 'none' ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'incomeTaxNote',
        label: 'No State Income Tax',
        value: `TX saves ~$${Math.round(estimatedIncomeTaxSavings).toLocaleString()}/mo vs. states with ~6% income tax`,
        color: 'positive' as const,
      },
      {
        id: '_texasData',
        label: '',
        value: JSON.stringify({ loanAmount: loanAmount.toNumber(), downPct, hasPmi, monthlyTax: monthlyTaxAfter.toNumber(), term, homestead }),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TexasMortgagePanel, { values, results });
  },
  educational: {
    formula: 'M = P * [r(1+r)^n] / [(1+r)^n - 1]',
    formulaDescription: 'Standard monthly mortgage payment formula. Texas-specific factors include property taxes (among the highest in the nation at ~1.8% average), no state income tax, and the Texas Homestead Exemption which can reduce school district property taxes. All calculations use decimal.js for precise financial math.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">Texas: No Income Tax Tradeoff</text><rect x="35" y="35" width="110" height="50" rx="6" fill="var(--svg-3b82f6)" opacity="0.85"/><text x="90" y="55" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">No State</text><text x="90" y="72" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">Income Tax</text><rect x="175" y="35" width="110" height="50" rx="6" fill="var(--svg-ef4444)" opacity="0.85"/><text x="230" y="55" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">High Property</text><text x="230" y="72" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">Tax 1.8%</text><line x1="20" y1="95" x2="300" y2="95" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="114" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-555555)">National avg property tax: ~1.1%</text><rect x="20" y="125" width="135" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.65"/><text x="87" y="140" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">TX: $350K -> $6,300/yr tax</text><rect x="165" y="125" width="135" height="22" rx="4" fill="var(--svg-ef4444)" opacity="0.65"/><text x="232" y="140" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Nat. avg -> $3,850/yr tax</text><rect x="15" y="157" width="290" height="36" rx="5" fill="var(--svg-f0f9ff)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="173" text-anchor="middle" font-size="9" fill="var(--svg-555555)">Homestead Exemption: $100K off school tax value</text><text x="160" y="188" text-anchor="middle" font-size="9" fill="var(--svg-555555)">Seniors 65+: up to $100K exemption + school tax freeze</text></svg>',
      alt: 'Comparison of Texas no income tax policy versus high property tax rates',
      caption: 'Texas has no state income tax but property taxes average 1.8%, among the highest in the US. The Homestead Exemption reduces school district taxes.',
    },
    variables: [
      { symbol: 'M', name: 'Monthly Payment', description: 'Your monthly principal and interest payment. Texas property taxes add significantly to the true monthly cost — often more than PMI.' },
      { symbol: 'PMI', name: 'Private Mortgage Insurance', description: 'Required when down payment is under 20%. In Texas, FHA loans and USDA loans are popular alternatives to avoid PMI. Texas also has a unique "Texas Vet" loan program with no PMI for qualifying veterans.' },
      { symbol: 'Homestead', name: 'Texas Homestead Exemption', description: 'Texas law exempts a portion of your home value from school district property taxes. As of 2026, the exemption is $100,000 for general homestead. Seniors 65+ and disabled homeowners receive the $100K exemption plus a school tax freeze, meaning their school tax amount never increases even if property values rise.' },
      { symbol: 'No Income Tax', name: 'Texas No State Income Tax', description: 'Texas is one of 9 states with no state income tax. This saves homeowners 2-10% of their income compared to states like California, New York, or Oregon. The trade-off: property taxes are roughly 60% higher than the national average to fund local services.' },
    ],
    howToUse: [
      'Enter the Texas home price — use $350,000 as a starting point for the statewide median.',
      'Enter your down payment. First-time buyers in Texas can use programs like TSAHC or Texas My First Home.',
      'Select your loan term. 30-year fixed is most common in Texas.',
      'Enter the property tax rate. Default 1.8% is the Texas average — your county may vary from 1.2% to 3.0%.',
      'Select your Homestead Exemption type to see estimated property tax savings.',
      'Review the results: your true monthly cost includes property taxes (often the second-largest component after P&I) but not state income tax.',
    ],
    commonUses: [
      'Estimate monthly mortgage payments on a Texas home factoring in the state\'s above-average property tax rates and homestead exemption.',
      'Compare the no-state-income-tax advantage against higher property taxes to understand your true housing cost in Texas.',
      'Plan your home purchase by exploring TSAHC and Texas Veterans Land Board down payment assistance programs.',
    ],
    explanation: 'Texas is unique in the US housing market because it has no state income tax but relies heavily on property taxes to fund local services. The average effective property tax rate in Texas is approximately 1.8% of home value annually — among the highest in the nation. This means a $350,000 home in Texas costs about $6,300 per year in property taxes alone ($525/month), which is significantly more than the national average of ~1.1%. However, Texas offers a Homestead Exemption that reduces the taxable value of your home for school district taxes. As of 2026, the general homestead exemption is $100,000. Seniors and disabled homeowners receive additional benefits including a school tax freeze. First-time homebuyers should also explore programs like the Texas State Affordable Housing Corporation (TSAHC) and the Texas Veterans Land Board for down payment assistance. Despite the high property taxes, Texas remains attractive due to no state income tax, strong job growth, and relatively affordable home prices compared to coastal states.',
    workedExamples: [
      {
        scenario: 'The Garcias are buying a $300,000 home in Houston (Harris County) with 20% down ($60,000), a 30-year fixed at 6.8%, and Harris County property tax rate of 2.1%. They apply for the general homestead exemption.',
        inputs: { homePrice: '300000', downPayment: '60000', interestRate: '6.8', loanTerm: '30', propertyTaxRate: '2.1', homesteadType: 'general' },
        result: 'P&I is approximately $1,564/month. Property tax after $100K homestead exemption: approximately $5,145/year ($429/month). Total monthly payment: approximately $1,993. With no state income tax, the Garcias keep more take-home pay than in New York or California.',
        insight: 'P&I is about $1,564/month. Property tax before homestead: $6,300/year ($525/month). The $100K homestead exemption saves roughly $1,155/year on school taxes. Net property tax: ~$5,145/year ($429/month). Total monthly: ~$1,993. With no state income tax, the Garcias keep more of their take-home pay than they would in New York or California.',
      },
      {
        scenario: 'Robert, age 67, is buying a $250,000 retirement home in Austin (Travis County) with 25% down ($62,500), a 15-year fixed at 6.2%, and Travis County tax rate of 1.8%. He qualifies for the senior homestead exemption.',
        inputs: { homePrice: '250000', downPayment: '62500', interestRate: '6.2', loanTerm: '15', propertyTaxRate: '1.8', homesteadType: 'senior' },
        result: 'P&I is approximately $1,600/month on a 15-year loan. Senior homestead exemption saves approximately $990/year on school taxes, with the school tax freeze locking those dollars forever. Annual property tax: approximately $3,510 vs. $4,500 without homestead. Over 20 years, the tax freeze could save $20,000+.',
        insight: 'P&I is about $1,600/month on a 15-year loan. The $100K senior homestead exemption saves ~$990/year on school taxes. Additionally, Robert\'s school taxes are frozen — they cannot increase even if property values rise. Annual property tax: ~$3,510 vs. $4,500 without homestead. Over a 20-year retirement, the tax freeze alone could save $20,000+ as property values appreciate.',
      },
    ],
    proTips: [
      'File your Homestead Exemption application with your county appraisal district immediately after closing — you have until April 30 of the tax year. The exemption does not apply retroactively, so every month you delay costs you money.',
      'Protest your property tax appraisal every year. Texas allows annual protests, and data shows homeowners who protest save an average of 5-10% on their tax bill. Many protest services work on contingency (they only get paid if they reduce your taxes).',
      'If you are over 65, file for the senior exemption AND the tax freeze — the freeze locks your school tax dollars (not just the rate) so they never increase, regardless of how much your home appreciates.',
      'In high-growth markets like Austin, Dallas, and Houston, factor in annual property tax increases of 5-10% into your budget. Texas has no cap on how much your assessed value can increase for non-homestead properties.',
      'Consider USDA Rural Development loans if you are buying outside major metro areas — much of Texas qualifies as rural under USDA guidelines, including many suburbs of major cities. 0% down, no PMI, and competitive rates.',
    ],
    limitations: [
      'This calculator uses average Texas tax rates; your actual rate depends on your specific county, city, school district, and any MUD (Municipal Utility District) or PID (Public Improvement District) assessments.',
      'Homestead savings are estimated at ~55% school tax share — actual savings depend on your school district\'s tax rate.',
      'The no-income-tax comparison is illustrative and does not account for differences in sales tax (TX: 6.25% state + up to 2% local = 8.25% max) versus states with income tax but lower sales tax.',
      'Property tax rates can change annually based on local government budgets and voter-approved bond measures. Texas does not have a state property tax cap on assessment increases, though a 10% annual cap applies to homestead properties.',
    ],
    quickReference: [
      { label: 'TX Property Tax Avg', value: '~1.8% (varies by county)' },
      { label: 'TX Income Tax', value: '0% (no state income tax)' },
      { label: 'TX Sales Tax Max', value: '8.25% (6.25% state + 2% local)' },
      { label: 'General Homestead Exemption', value: '$100,000 off school tax value' },
      { label: 'Senior/Disabled Exemption', value: '$100K + school tax freeze' },
      { label: 'TX Median Home Price', value: '~$350,000 (2026)' },
      { label: 'Appraisal Protest Deadline', value: 'May 15 or 30 days after notice' },
    ],
    faqs: [
      { question: 'Why are Texas property taxes so high?', answer: 'Texas has no state income tax, so local governments rely on property taxes to fund schools, roads, and emergency services. The average effective tax rate is about 1.8%, compared to the national average of 1.1%. Texans pay more in property taxes but no state income tax, which can benefit higher-income buyers. The breakeven point depends on your income — for many middle-class families, the savings from no income tax roughly offset the higher property taxes.' },
      { question: 'What is the Texas Homestead Exemption?', answer: 'The Texas Homestead Exemption removes a portion of your home value from school district property taxes. For 2026, the exemption is $100,000 for general homesteads. Seniors 65+ and disabled homeowners also get the $100K exemption plus a school tax freeze (your school tax dollars never increase). You must file an application with your county appraisal district. The exemption only applies to your primary residence.' },
      { question: 'What down payment assistance is available in Texas?', answer: 'Texas offers several programs: TSAHC (Texas State Affordable Housing Corporation) provides up to 5% of the home price as down payment assistance. Texas My First Home offers 30-year fixed rates with down payment help. The Texas Veterans Land Board offers land, home, and improvement loans for veterans with below-market rates. Additionally, SETH (Southeast Texas Housing Finance Corporation) and TDHCA offer programs for specific regions.' },
      { question: 'How do I protest my property tax appraisal in Texas?', answer: 'File a written protest with your county Appraisal Review Board (ARB) by May 15 (or 30 days after your appraisal notice, whichever is later). Gather evidence: recent comparable sales, an independent appraisal, photos of property defects, and repair estimates. The ARB hearing is informal — you present your case, the appraisal district presents theirs, and the panel decides. Most homeowners who protest get a reduction. You can also hire a property tax consultant who works on contingency.' },
      { question: 'Is Texas really cheaper than California for homeowners?', answer: 'For the same home price, Texas is generally cheaper due to no state income tax, though property taxes are higher. However, the actual comparison depends on: (a) home prices — $350K in Texas buys much more house than $350K in most of California, (b) your income — the higher your income, the more valuable the no-income-tax advantage becomes, and (c) lifestyle factors — Texas has higher utility costs (AC), higher property insurance (hail, hurricanes in coastal areas), and potentially higher transportation costs due to sprawl. Many Texas transplants save money overall, but the gap has narrowed as Texas home prices and property taxes have risen.' },
    ],
    citations: [
      { source: 'Texas Comptroller — Property Tax', url: 'https://comptroller.texas.gov/taxes/property-tax/' },
      { source: 'TSAHC — Homebuyer Programs', url: 'https://www.tsahc.org/' },
      { source: 'Texas State Law Library — Homestead Exemption', url: 'https://www.sll.texas.gov/' },
    ],
  },
};

export default texasMortgageConfig;
