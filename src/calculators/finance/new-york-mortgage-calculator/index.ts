import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import NYMortgagePanel from './NYMortgagePanel';

const nyMortgageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Home Price',
      type: 'number',
      placeholder: '500,000',
      prefix: '$',
      min: 0,
      step: 1000,
      inputMode: 'numeric',
      required: true,
      helpText: 'New York median home price is ~$500,000 (higher in NYC metro)',
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '100,000',
      prefix: '$',
      min: 0,
      step: 1000,
      inputMode: 'numeric',
      required: true,
      helpText: '20% down avoids PMI. NY offers first-time homebuyer programs through SONYMA.',
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'percentage',
      placeholder: '6.7',
      min: 0,
      max: 15,
      step: 0.125,
      inputMode: 'decimal',
      required: true,
      helpText: 'Current NY average: ~6.7% for 30-year fixed (2026)',
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
      placeholder: '1.6',
      min: 0,
      max: 4,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'NY average is ~1.6% — varies widely by county (higher upstate, lower in NYC)',
    },
    {
      id: 'starEligible',
      label: 'STAR Program Eligible?',
      type: 'select',
      options: [
        { value: 'none', label: 'No — Do not qualify for STAR' },
        { value: 'basic', label: 'Basic STAR (income < $500K, primary residence)' },
        { value: 'enhanced', label: 'Enhanced STAR (age 65+, income < $98.7K)' },
      ],
      helpText: 'STAR reduces school property taxes. Basic STAR exempts up to $30K from assessed value; Enhanced STAR exempts up to $70K.',
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
    const star = values.starEligible || 'none';

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

    const monthlyTax = homePrice.mul(taxRate).div(12);
    const hasPmi = parseFloat(downPct) < 20;
    const monthlyPmi = hasPmi ? loanAmount.mul(0.005).div(12) : new Decimal(0);
    const totalMonthly = basePayment.plus(monthlyTax).plus(monthlyPmi);
    const totalInterest = basePayment.mul(months).minus(loanAmount);
    const totalCost = loanAmount.plus(totalInterest);

    // STAR savings (school tax is typically ~60% of total property tax)
    const annualSchoolTax = monthlyTax.mul(12).mul(0.6);
    let starSavings = new Decimal(0);
    if (star === 'basic') {
      // Basic STAR: $30K off assessed value. Multiply by the school tax rate.
      // School tax rate = annual school tax / home price
      const schoolTaxRate = annualSchoolTax.div(homePrice);
      starSavings = new Decimal(30000).mul(schoolTaxRate);
    } else if (star === 'enhanced') {
      const schoolTaxRate = annualSchoolTax.div(homePrice);
      starSavings = new Decimal(70000).mul(schoolTaxRate);
    }

    // Mortgage Recording Tax (paid at closing, not monthly)
    // NYC: 0.5% for loans under $500K, 0.625% for loans $500K+
    let mrtRate = new Decimal(0.005);
    if (loanAmount.gte(500000)) mrtRate = new Decimal(0.00625);
    const recordingTax = loanAmount.mul(mrtRate);

    const fmtDollar = (d: Decimal, decimals = 2): string =>
      `$${d.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    const fmtInt = (d: Decimal): string =>
      fmtDollar(d, 0);

    return [
      { id: 'monthlyPayment', label: 'Monthly Payment (Principal & Interest)', value: fmtDollar(basePayment), highlight: true, color: 'positive' },
      { id: 'totalMonthly', label: 'Monthly with Taxes & PMI', value: fmtDollar(totalMonthly), highlight: true, color: 'neutral' },
      { id: 'loanAmount', label: 'Loan Amount', value: fmtInt(loanAmount), color: 'neutral' },
      { id: 'downPercent', label: 'Down Payment', value: `${downPct}% (${fmtInt(downPayment)})`, color: hasPmi ? 'negative' : 'positive' },
      { id: 'totalInterest', label: 'Total Interest Paid', value: fmtInt(totalInterest), color: 'neutral' },
      { id: 'totalCost', label: 'Total Cost of Loan', value: fmtInt(totalCost), color: 'neutral' },
      { id: 'propertyTaxNote', label: 'Annual Property Taxes', value: `${fmtInt(monthlyTax.mul(12))}/yr`, color: 'neutral' },
      { id: 'starSavings', label: 'Estimated STAR Annual Savings', value: starSavings.gt(0) ? `${fmtInt(starSavings)}/yr` : 'Not eligible', color: 'positive' },
      { id: 'recordingTax', label: 'Mortgage Recording Tax (at closing)', value: fmtDollar(recordingTax), color: 'negative' },
      { id: '_nyData', label: '', value: JSON.stringify({ loanAmount: loanAmount.toNumber(), downPct, hasPmi, monthlyTax: monthlyTax.toNumber(), term }) },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(NYMortgagePanel, { values, results });
  },
  educational: {
    formula: 'M = P * [r(1+r)^n] / [(1+r)^n - 1]',
    formulaDescription: 'Standard monthly mortgage payment formula. New York has moderate-to-high property taxes (averaging ~1.6%), a state income tax (4-10.9% brackets), the STAR program that offers school tax relief for homeowners, and a unique mortgage recording tax paid at closing. All calculations use decimal.js for precise financial math.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">NY Housing Cost Components</text><rect x="20" y="35" width="280" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="160" y="51" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">Principal + Interest (monthly mortgage)</text><rect x="20" y="65" width="200" height="24" rx="4" fill="var(--svg-ef4444)" opacity="0.7"/><text x="120" y="81" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">Property Tax (~1.6% average)</text><rect x="20" y="95" width="150" height="24" rx="4" fill="var(--svg-ef4444)" opacity="0.5"/><text x="95" y="111" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">State Income Tax (4-10.9%)</text><rect x="20" y="125" width="120" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="80" y="141" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">Mortgage Recording Tax</text><line x1="20" y1="158" x2="300" y2="158" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="175" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-555555)">NY has BOTH property + income tax</text><text x="160" y="191" text-anchor="middle" font-size="9" fill="var(--svg-555555)">STAR program: up to $70K off assessed value</text></svg>',
      alt: 'Breakdown of New York housing cost components including mortgage, property tax, income tax, and recording tax',
      caption: 'New York homeowners pay both property tax (~1.6%) and state income tax (4-10.9%), plus a unique mortgage recording tax at closing.',
    },
    variables: [
      { symbol: 'M', name: 'Monthly Payment', description: 'Your monthly principal and interest. New York also has a mortgage recording tax (not included in monthly payment) that adds 0.5-2.25% of the loan amount at closing.' },
      { symbol: 'STAR', name: 'STAR Property Tax Exemption', description: 'New York\'s School Tax Relief program provides a partial exemption from school property taxes. Basic STAR: up to $30,000 off assessed value for homeowners earning under $500K. Enhanced STAR: up to $70,000 off for seniors 65+ earning under $98,700 (2025 income limit).' },
      { symbol: 'NY MRT', name: 'Mortgage Recording Tax', description: 'New York is one of the few states with a mortgage recording tax (0.5-2.25% of the mortgage amount, varies by county). NYC: 0.5% for loans under $500K, 0.625% for $500K+. Paid at closing, not monthly.' },
      { symbol: 'SONYMA', name: 'State of New York Mortgage Agency', description: 'Offers low-interest mortgages and down payment assistance (up to 3% of purchase price or $15,000) for first-time homebuyers. Additional grants available for specific counties and professions (teachers, first responders).' },
    ],
    howToUse: [
      'Enter the New York home price — use $500,000 as a starting point for statewide median.',
      'Enter your down payment. First-time buyers can explore SONYMA (State of New York Mortgage Agency) programs.',
      'Select your loan term. 30-year fixed is most common in New York.',
      'Enter the property tax rate. NY averages ~1.6% but varies from 0.8% (NYC) to 2.5% (upstate).',
      'Select your STAR eligibility status to see estimated annual property tax savings.',
      'Review the results — remember New York also has state income tax (unlike Texas), which affects your overall housing budget.',
    ],
    commonUses: [
      'Estimate monthly mortgage payments on a New York home including property taxes, mortgage recording tax, and state income tax impact.',
      'Compare housing costs across New York City, suburban, and upstate markets with location-specific property tax rate assumptions.',
      'Plan your home purchase by evaluating SONYMA down payment assistance and the STAR school tax relief program benefits.',
    ],
    explanation: 'New York\'s housing market is defined by extreme regional variation. New York City and its suburbs have among the highest home prices in the nation, while upstate cities like Buffalo, Rochester, and Syracuse remain relatively affordable. Property taxes in New York average about 1.6% of home value annually, but this varies dramatically by county — NYC has relatively low property tax rates (0.8-1.0%) while upstate counties like Monroe (Rochester) and Erie (Buffalo) can exceed 2.5%. New York is also one of the few states with a mortgage recording tax (0.5-2.25% of the loan amount, paid at closing). The STAR (School Tax Relief) program provides exemptions for homeowners: Basic STAR exempts $30K of assessed value (income < $500K), Enhanced STAR exempts $70K (age 65+, income < $98.7K). Unlike Texas, New York has both property tax AND state income tax (ranging from 4% to 10.9%), so the total tax burden is significantly higher.',
    workedExamples: [
      {
        scenario: 'Maria is buying a $400,000 condo in Queens, NYC with 20% down ($80,000), a 30-year fixed mortgage at 6.7%, and NYC property tax rate of 0.9%. She qualifies for Basic STAR.',
        inputs: { homePrice: '400000', downPayment: '80000', interestRate: '6.7', loanTerm: '30', propertyTaxRate: '0.9', starEligible: 'basic' },
        result: 'Monthly P&I is approximately $2,064, plus $300/month property tax — total $2,364/month. STAR saves roughly $600/year on school taxes. Mortgage recording tax at closing: approximately $1,600.',
        insight: 'Maria\'s monthly P&I is about $2,064, plus $300/month in property tax — total ~$2,364/month before STAR savings. The mortgage recording tax adds roughly $1,600 at closing. STAR saves her roughly $600/year on school taxes. State income tax on top means her true housing burden is higher than the mortgage alone suggests.',
      },
      {
        scenario: 'The Johnsons are buying a $250,000 home in Rochester (Monroe County) with 10% down ($25,000), a 30-year fixed at 6.7%, and Monroe County property tax rate of 2.5%. They are first-time buyers using SONYMA.',
        inputs: { homePrice: '250000', downPayment: '25000', interestRate: '6.7', loanTerm: '30', propertyTaxRate: '2.5', starEligible: 'basic' },
        result: 'Monthly P&I is approximately $1,451, plus $521/month property tax and $94/month PMI — total $2,066/month. Upstate NY property taxes at 2.5% add more to the monthly payment than PMI, making property tax the single largest cost after P&I.',
        insight: 'With only 10% down, the Johnsons pay PMI (~$94/month) on top of $1,451 P&I and $521/month in property tax — total ~$2,066/month. Upstate NY property taxes at 2.5% add more to the monthly payment than PMI. The high property tax is the single largest cost after principal and interest.',
      },
    ],
    proTips: [
      'Apply for STAR through the NYS Tax Department immediately after closing — the exemption is not automatic. You need to register online at tax.ny.gov/star or call 518-457-2036.',
      'Check SONYMA\'s "Achieving the Dream" program for lower interest rates if your income is below 80% of the area median — rates are often 0.5-1% below market.',
      'NYC buyers: co-ops have lower closing costs than condos because you are buying shares, not real property. The mortgage recording tax does not apply to co-op loans in NYC.',
      'Factor the mortgage recording tax into your closing cost budget — on a $500K mortgage in NYC, it is $3,125. This is paid at closing and cannot be rolled into the loan.',
      'Upstate buyers: negotiate property tax assessments with your town assessor. Many upstate NY assessments are outdated, and a successful grievance can reduce your tax bill permanently.',
    ],
    limitations: [
      'This calculator estimates the mortgage recording tax at NYC rates (0.5% for loans under $500K, 0.625% for $500K+) — your county may have different rates.',
      'STAR savings are estimated based on school taxes being ~60% of total property taxes; actual savings depend on your specific school district and assessment.',
      'Co-op and condo common charges are not included. Mello-Roos and special district taxes common in some NY developments are not modeled.',
      'SONYMA program eligibility requirements (income limits, purchase price caps) vary by county. State income tax impact on your overall budget is mentioned but not calculated here.',
    ],
    quickReference: [
      { label: 'NY Property Tax Avg', value: '~1.6% (0.8% NYC to 2.5% upstate)' },
      { label: 'NY Income Tax Range', value: '4% - 10.9%' },
      { label: 'Basic STAR Exemption', value: 'Up to $30,000 off assessed value' },
      { label: 'Enhanced STAR Exemption', value: 'Up to $70,000 off (age 65+)' },
      { label: 'NYC MRT Rate', value: '0.5% (<$500K) / 0.625% ($500K+)' },
      { label: 'SONYMA Down Payment Help', value: 'Up to 3% of purchase price' },
      { label: 'NY Median Home Price', value: '~$500,000 (2026)' },
    ],
    faqs: [
      { question: 'How do NY property taxes compare to other states?', answer: 'New York has some of the highest combined tax burdens in the US. Property taxes average ~1.6% of home value, plus state income tax of 4-10.9%. Unlike Texas which has no income tax, New York homeowners pay both property and income taxes — factor this into your affordability calculation.' },
      { question: 'What is the STAR program?', answer: 'The School Tax Relief (STAR) program offers a partial exemption from school property taxes. Basic STAR provides up to $30,000 off your home\'s assessed value for homeowners earning under $500,000. Enhanced STAR (for seniors 65+) provides up to $70,000 off for those earning under $98,700 (2025 income limit). You must apply through the NYS Tax Department at tax.ny.gov/star.' },
      { question: 'What is SONYMA?', answer: 'The State of New York Mortgage Agency (SONYMA) offers low-interest mortgages and down payment assistance (up to 3% of purchase price) for first-time homebuyers with qualifying income limits. Additional programs exist for specific professions: teachers, nurses, police officers, firefighters, and veterans. SONYMA also offers a "RemodelNY" program that finances both the home purchase and renovations in a single mortgage.' },
      { question: 'What is the mortgage recording tax?', answer: 'New York is one of the few states that charges a mortgage recording tax: 0.5% in NYC for loans under $500K, 0.625% for loans $500K+, 0.75-1.05% in the NYC suburbs (Nassau, Suffolk, Westchester, Rockland), and varying rates upstate. On a $400,000 mortgage in NYC, that is an additional $2,000-$2,500 at closing. This tax is paid at closing and is NOT tax-deductible.' },
      { question: 'Are co-ops cheaper to buy than condos in NYC?', answer: 'Co-ops typically have lower purchase prices than comparable condos and significantly lower closing costs because the mortgage recording tax does not apply to co-op loans (you are buying shares in a corporation, not real property). However, co-ops require board approval, have stricter financial requirements (often 20-25% down minimum, 2+ years of post-closing liquidity), and may have restrictions on subletting, renovations, and pied-a-terre use. Condos offer more flexibility but higher costs.' },
    ],
    citations: [
      { source: 'NY STAR Program', url: 'https://www.tax.ny.gov/pit/property/star/' },
      { source: 'SONYMA — First-Time Homebuyers', url: 'https://hcr.ny.gov/sonyma' },
      { source: 'NYC Department of Finance — Mortgage Recording Tax', url: 'https://www.nyc.gov/site/finance/taxes/mortgage-recording-tax.page' },
    ],
  },
};
export default nyMortgageConfig;
