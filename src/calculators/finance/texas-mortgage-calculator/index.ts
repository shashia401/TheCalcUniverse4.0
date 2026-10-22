import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, ExplainStep } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';
import TexasMortgagePanel from './TexasMortgagePanel';

/** Texas school-district homestead exemptions (Prop. 13 and Prop. 11, approved Nov 4, 2025): $140,000 general, +$60,000 age 65+/disabled. */
const HOMESTEAD_GENERAL = 140000;
const HOMESTEAD_SENIOR = 200000;
/** Rough share of a Texas property tax bill that goes to the school district - an ESTIMATE; yours depends on your taxing units. */
const SCHOOL_TAX_SHARE = 0.55;
/** Estimated PMI as a share of the loan per year when the down payment is under 20% - an ESTIMATE; quotes vary with credit score. */
const PMI_RATE = 0.005;

/** Every figure behind the result rows and the worked solution (single source of truth). Null when the inputs are unusable. */
export function texasFigures(values: Record<string, string>) {
  const homePriceNum = parseFloat(values.homePrice);
  const downPaymentNum = parseFloat(values.downPayment);
  const interestRateNum = parseFloat(values.interestRate);
  const taxRateNum = parseFloat(values.propertyTaxRate);
  if (isNaN(homePriceNum) || isNaN(interestRateNum)) return null;
  if (homePriceNum <= 0 || isNaN(downPaymentNum) || downPaymentNum < 0 || downPaymentNum >= homePriceNum) return null;

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

  // School-district share of the tax bill is an estimate; the exemption cannot exceed the home's value.
  const annualTaxBeforeExemption = homePrice.mul(taxRate);
  const schoolTaxRate = taxRate.mul(SCHOOL_TAX_SHARE);
  const exemptionAmount = homestead === 'senior' ? HOMESTEAD_SENIOR : homestead === 'general' ? HOMESTEAD_GENERAL : 0;
  const exemptedValue = Decimal.min(new Decimal(exemptionAmount), homePrice);
  const annualTaxAfterExemption = annualTaxBeforeExemption.minus(exemptedValue.mul(schoolTaxRate));

  const monthlyTaxBefore = annualTaxBeforeExemption.div(12);
  const monthlyTaxAfter = annualTaxAfterExemption.div(12);

  const hasPmi = parseFloat(downPct) < 20;
  const monthlyPmi = hasPmi ? loanAmount.mul(PMI_RATE).div(12) : new Decimal(0);
  const insuranceAnnual = Math.max(0, parseFloat(values.homeInsurance) || 0);
  const monthlyInsurance = new Decimal(insuranceAnnual).div(12);
  const totalMonthly = basePayment.plus(monthlyTaxAfter).plus(monthlyPmi).plus(monthlyInsurance);
  const totalInterest = basePayment.mul(months).minus(loanAmount);
  const totalCost = loanAmount.plus(totalInterest);

  return {
    homePrice, downPayment, rate, term, taxRate, homestead, loanAmount, downPct, months, monthlyRate, basePayment,
    annualTaxBeforeExemption, schoolTaxRate, exemptionAmount, exemptedValue, annualTaxAfterExemption, monthlyTaxBefore,
    monthlyTaxAfter, hasPmi, monthlyPmi, insuranceAnnual, monthlyInsurance, totalMonthly, totalInterest, totalCost,
  };
}

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
      helpText: 'Enter the purchase price. Home prices vary widely between Texas metros.',
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
      helpText: 'Use the rate quoted by your lender for the loan term you pick.',
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
      helpText: 'Estimate: combined county, city, school and special-district rates of roughly 1.5%-2.5% of value are common in Texas. Check your county appraisal district for your exact rate.',
    },
    {
      id: 'homesteadType',
      label: 'Homestead Exemption Type',
      type: 'select',
      options: [
        { value: 'none', label: 'Not eligible / Not applied' },
        { value: 'general', label: 'General Homestead ($140K school tax exemption)' },
        { value: 'senior', label: 'Senior 65+ / Disabled ($200K school tax exemption, frozen school taxes)' },
      ],
      helpText: 'Texas Homestead Exemption removes part of your home value from school district property taxes.',
    },
    {
      id: 'homeInsurance',
      label: 'Annual Homeowners Insurance (optional)',
      type: 'number',
      prefix: '$',
      placeholder: '0',
      min: 0,
      step: 100,
      inputMode: 'numeric',
      helpText: 'Leave blank to exclude it. Texas premiums are among the highest in the US (hail and wind), so get a quote and enter it here.',
    },
  ],
  calculate: (values) => {
    const f = texasFigures(values);
    if (!f) return [];
    const {
      downPayment, loanAmount, downPct, hasPmi, homestead, basePayment, totalMonthly, insuranceAnnual, totalInterest, totalCost,
      annualTaxBeforeExemption, annualTaxAfterExemption, monthlyTaxAfter, term, rate,
    } = f;

    const fmtDollar = (d: Decimal, decimals = 2): string =>
      `$${d.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    const fmtInt = (d: Decimal): string =>
      fmtDollar(d, 0);

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
        label: insuranceAnnual > 0 ? 'Monthly with Taxes, Est. PMI & Insurance' : 'Monthly with Taxes & Est. PMI (insurance not included)',
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
        value: 'Texas does not tax wages, so no state income tax is deducted from your paycheck',
        color: 'positive' as const,
      },
      {
        id: '_texasData',
        label: '',
        value: JSON.stringify({ loanAmount: loanAmount.toNumber(), downPct, hasPmi, monthlyTax: monthlyTaxAfter.toNumber(), term, homestead, monthlyPI: basePayment.toNumber(), totalMonthly: totalMonthly.toNumber(), totalInterest: totalInterest.toNumber(), totalCost: totalCost.toNumber(), rate: rate.toNumber() }),
      },
    ];
  },
  explainSteps: (values) => {
    const f = texasFigures(values);
    if (!f) return [];
    const rows = texasMortgageConfig.calculate(values);
    if (!rows.length) return [];
    const val = (id: string) => resultValue(rows, id) ?? '';
    const m = (d: Decimal): string => `$${d.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    const pc = (d: Decimal, dp = 4) => `${+d.mul(100).toFixed(dp)}%`;

    const steps: ExplainStep[] = [
      {
        label: 'Loan amount and down payment',
        expr: `${m(f.homePrice)} − ${m(f.downPayment)} = ${m(f.loanAmount)} · ${m(f.downPayment)} ÷ ${m(f.homePrice)} = ${f.downPct}% down`,
        note: f.hasPmi ? 'Under 20% down, so the calculator adds an estimated PMI below.' : '20% or more down, so no PMI is added.',
      },
      {
        label: 'Monthly rate and number of payments',
        expr: `r = ${pc(f.rate)} ÷ 12 = ${f.monthlyRate.mul(100).toFixed(4)}% per month · n = ${f.term} years × 12 = ${f.months} payments`,
      },
    ];
    if (f.monthlyRate.gt(0)) {
      const factor = f.monthlyRate.plus(1).pow(f.months);
      steps.push({
        label: 'Principal and interest payment',
        expr: `(1 + r)ⁿ = ${factor.toFixed(4)} · M = ${m(f.loanAmount)} × (r × (1 + r)ⁿ) ÷ ((1 + r)ⁿ − 1) = ${val('monthlyPayment')}`,
        note: 'The one fixed payment that pays the interest and retires the loan exactly at the last month.',
      });
    } else {
      steps.push({ label: 'No interest, so divide the loan evenly', expr: `M = ${m(f.loanAmount)} ÷ ${f.months} = ${val('monthlyPayment')}` });
    }
    steps.push({
      label: 'Property tax before any exemption',
      expr: `${m(f.homePrice)} × ${pc(f.taxRate)} = ${m(f.annualTaxBeforeExemption)} a year`,
      note: 'Texas has no state income tax, so property tax is the big recurring tax on the house. Use your county appraisal district\'s rate for an exact figure.',
    });
    if (f.homestead === 'none') {
      steps.push({
        label: 'No homestead exemption applied',
        expr: `${m(f.annualTaxBeforeExemption)} ÷ 12 = ${m(f.monthlyTaxAfter)} a month`,
      });
    } else {
      steps.push(
        {
          label: 'Estimate the school-district part of the tax',
          expr: `${pc(f.taxRate)} × ${pc(new Decimal(SCHOOL_TAX_SHARE), 2)} school share = ${pc(f.schoolTaxRate, 5)} school tax rate`,
          note: 'The school share is an estimate (about half of a typical bill); your own taxing units decide the real split.',
        },
        {
          label: `Homestead exemption (${f.homestead === 'senior' ? 'age 65+ / disabled' : 'general'})`,
          expr: `min(${m(new Decimal(f.exemptionAmount))}, ${m(f.homePrice)}) = ${m(f.exemptedValue)} exempt × ${pc(f.schoolTaxRate, 5)} = ${m(f.exemptedValue.mul(f.schoolTaxRate))} saved → ${m(f.annualTaxBeforeExemption)} − ${m(f.exemptedValue.mul(f.schoolTaxRate))} = ${m(f.annualTaxAfterExemption)} a year · ÷ 12 = ${m(f.monthlyTaxAfter)} a month`,
          note: 'The exemption removes part of the home\'s value from the school-district tax only, and cannot exceed the home\'s value.',
        },
      );
    }
    if (f.hasPmi) {
      steps.push({
        label: 'Estimated PMI',
        expr: `${m(f.loanAmount)} × ${pc(new Decimal(PMI_RATE), 2)} ÷ 12 = ${m(f.monthlyPmi)} a month`,
        note: 'The 0.5% a year is an estimate; real quotes vary with credit score.',
      });
    }
    if (f.insuranceAnnual > 0) {
      steps.push({ label: 'Homeowners insurance', expr: `${m(new Decimal(f.insuranceAnnual))} ÷ 12 = ${m(f.monthlyInsurance)} a month` });
    }
    steps.push(
      {
        label: 'Total monthly payment',
        expr: `${val('monthlyPayment')} + ${m(f.monthlyTaxAfter)} tax${f.hasPmi ? ` + ${m(f.monthlyPmi)} PMI` : ''}${f.insuranceAnnual > 0 ? ` + ${m(f.monthlyInsurance)} insurance` : ''} = ${val('totalMonthly')}`,
      },
      {
        label: 'Total interest and total cost of the loan',
        expr: `${val('monthlyPayment')} × ${f.months} − ${m(f.loanAmount)} = ${m(f.totalInterest)} (shown as ${val('totalInterest')}) · ${m(f.loanAmount)} + ${m(f.totalInterest)} = ${val('totalCost')}`,
      },
    );
    return finiteSteps(steps);
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TexasMortgagePanel, { values, results });
  },
  educational: {
    formula: 'M = P * [r(1+r)^n] / [(1+r)^n - 1]',
    formulaDescription: 'Standard monthly mortgage payment formula. Texas-specific factors include property taxes (among the highest in the nation, commonly 1.5%-2.5% of value depending on the county), no state income tax, and the Texas Homestead Exemption which reduces school district property taxes. Property tax, PMI and insurance figures are estimates. All calculations use decimal.js for precise financial math.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">Texas: No Income Tax Tradeoff</text><rect x="35" y="35" width="110" height="50" rx="6" fill="var(--svg-3b82f6)" opacity="0.85"/><text x="90" y="55" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">No State</text><text x="90" y="72" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">Income Tax</text><rect x="175" y="35" width="110" height="50" rx="6" fill="var(--svg-ef4444)" opacity="0.85"/><text x="230" y="55" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">High Property</text><text x="230" y="72" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">Tax 1.8%</text><line x1="20" y1="95" x2="300" y2="95" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="114" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-555555)">National avg property tax: ~1.1%</text><rect x="20" y="125" width="135" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.65"/><text x="87" y="140" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">TX: $350K -> $6,300/yr tax</text><rect x="165" y="125" width="135" height="22" rx="4" fill="var(--svg-ef4444)" opacity="0.65"/><text x="232" y="140" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Nat. avg -> $3,850/yr tax</text><rect x="15" y="157" width="290" height="36" rx="5" fill="var(--svg-f0f9ff)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="173" text-anchor="middle" font-size="9" fill="var(--svg-555555)">Homestead Exemption: $100K off school tax value</text><text x="160" y="188" text-anchor="middle" font-size="9" fill="var(--svg-555555)">Seniors 65+: up to $100K exemption + school tax freeze</text></svg>',
      alt: 'Comparison of Texas no income tax policy versus high property tax rates',
      caption: 'Texas has no state income tax but property tax rates are commonly 1.5%-2.5%, among the highest in the US. The Homestead Exemption reduces school district taxes.',
    },
    variables: [
      { symbol: 'M', name: 'Monthly Payment', description: 'Your monthly principal and interest payment. Texas property taxes add significantly to the true monthly cost — often more than PMI.' },
      { symbol: 'PMI', name: 'Private Mortgage Insurance', description: 'Required when down payment is under 20%. In Texas, FHA loans and USDA loans are popular alternatives to avoid PMI. VA loans for qualifying veterans have no monthly mortgage insurance. This calculator estimates PMI at 0.5% of the loan per year when the down payment is under 20%.' },
      { symbol: 'Homestead', name: 'Texas Homestead Exemption', description: 'Texas law exempts a portion of your home value from school district property taxes. Since the November 2025 constitutional amendments, the exemption is $140,000 for a general homestead. Seniors 65+ and disabled homeowners receive an additional $60,000 ($200,000 total) plus a school tax ceiling, meaning their school tax amount stays frozen even if property values rise.' },
      { symbol: 'No Income Tax', name: 'Texas No State Income Tax', description: 'Texas is one of 9 states that do not tax wages, which can save homeowners thousands of dollars a year compared to states like California, New York, or Oregon. The trade-off: property tax rates are well above the national average to fund local services.' },
    ],
    howToUse: [
      'Enter the Texas home price — use $350,000 as a starting point for the statewide median.',
      'Enter your down payment. First-time buyers in Texas can use programs like TSAHC or Texas My First Home.',
      'Select your loan term. 30-year fixed is most common in Texas.',
      'Enter the property tax rate. 1.8% is only an example — your combined rate depends on your county, city, school district and special districts, and can range from about 1.2% to 3.0%.',
      'Select your Homestead Exemption type to see estimated property tax savings.',
      'Review the results: your true monthly cost includes property taxes (often the second-largest component after P&I) but not state income tax.',
    ],
    commonUses: [
      'Estimate monthly mortgage payments on a Texas home factoring in the state\'s above-average property tax rates and homestead exemption.',
      'Compare the no-state-income-tax advantage against higher property taxes to understand your true housing cost in Texas.',
      'Plan your home purchase by exploring TSAHC and Texas Veterans Land Board down payment assistance programs.',
    ],
    explanation: 'Texas is unique in the US housing market because it has no state income tax but relies heavily on property taxes to fund local services. Property tax rates in Texas are among the highest in the nation. At an example rate of 1.8%, a $350,000 home costs about $6,300 per year in property taxes alone ($525/month), well above what a ~1% national-average rate would give. However, Texas offers a Homestead Exemption that reduces the taxable value of your home for school district taxes: $140,000 for a general homestead since the November 2025 amendments, and $200,000 for homeowners 65+ or disabled, who also get a school tax freeze. First-time homebuyers should also explore programs like the Texas State Affordable Housing Corporation (TSAHC) and the Texas Veterans Land Board for down payment assistance. Despite the high property taxes, Texas remains attractive due to no state income tax, strong job growth, and relatively affordable home prices compared to coastal states.',
    workedExamples: [
      {
        scenario: 'The Garcias are buying a $300,000 home in Houston (Harris County) with 20% down ($60,000), a 30-year fixed at 6.8%, and Harris County property tax rate of 2.1%. They apply for the general homestead exemption.',
        inputs: { homePrice: '300000', downPayment: '60000', interestRate: '6.8', loanTerm: '30', propertyTaxRate: '2.1', homesteadType: 'general' },
        result: 'P&I is $1,564.62/month. Property tax after the $140K homestead exemption: about $4,683/year ($390/month). Total monthly payment (P&I + tax, no PMI at 20% down): about $1,955. With no state income tax, the Garcias keep more take-home pay than in New York or California.',
        insight: 'P&I is about $1,565/month. Property tax before homestead: $6,300/year ($525/month). The $140K homestead exemption saves roughly $1,617/year in school taxes ($140,000 × 2.1% × the estimated 55% school share). Net property tax: ~$4,683/year ($390/month). Total monthly: ~$1,955. With no state income tax, the Garcias keep more of their take-home pay than they would in New York or California.',
      },
      {
        scenario: 'Robert, age 67, is buying a $250,000 retirement home in Austin (Travis County) with 25% down ($62,500), a 15-year fixed at 6.2%, and Travis County tax rate of 1.8%. He qualifies for the senior homestead exemption.',
        inputs: { homePrice: '250000', downPayment: '62500', interestRate: '6.2', loanTerm: '15', propertyTaxRate: '1.8', homesteadType: 'senior' },
        result: 'P&I is $1,602.56/month on a 15-year loan. The $200K senior homestead exemption saves about $1,980/year in school taxes, and the school tax ceiling keeps that bill from rising. Annual property tax: about $2,520 vs. $4,500 without homestead.',
        insight: 'P&I is about $1,603/month on a 15-year loan. The $200K senior exemption saves ~$1,980/year in school taxes ($200,000 × 1.8% × the estimated 55% school share). Additionally, Robert\'s school tax is frozen at its first senior-year amount, so it cannot rise even if property values do. Annual property tax: ~$2,520 vs. $4,500 without homestead. The freeze is not modeled here, so any further savings come on top of this estimate.',
      },
    ],
    proTips: [
      'File your Homestead Exemption application (Form 50-114) with your county appraisal district soon after you buy and move in; the normal deadline is April 30 of the year after you acquire the home, but check your district. Delaying can cost you a year of savings.',
      'Protest your property tax appraisal every year. Texas allows annual protests, and many homeowners who protest win a reduction. Many protest services work on contingency (they only get paid if they reduce your taxes).',
      'If you are over 65, file for the senior exemption AND the tax freeze — the freeze locks your school tax dollars (not just the rate) so they never increase, regardless of how much your home appreciates.',
      'In high-growth markets like Austin, Dallas, and Houston, budget for property tax increases. Homestead appraisals can rise at most 10% a year; most other property valued at $5 million or less has a 20% annual cap (2024-2026), and rates can also change.',
      'Consider USDA Rural Development loans if you are buying outside major metro areas — much of Texas qualifies as rural under USDA guidelines, including many suburbs of major cities. 0% down and no traditional PMI (USDA charges guarantee fees instead).',
    ],
    limitations: [
      'This calculator uses average Texas tax rates; your actual rate depends on your specific county, city, school district, and any MUD (Municipal Utility District) or PID (Public Improvement District) assessments.',
      'Homestead savings are estimated using a 55% school-tax share, PMI at 0.5% of the loan per year, and no insurance unless you enter it — all estimates. Actual savings and costs depend on your taxing units and quotes.',
      'The calculator does not compute state income tax elsewhere; use the paycheck calculator to compare states. Sales tax also differs (TX: 6.25% state + up to 2% local = 8.25% max).',
      'Property tax rates can change annually based on local government budgets and voter-approved bond measures. Homestead appraisals are capped at a 10% annual increase, and most other property valued at $5 million or less has a 20% annual cap (2024-2026).',
    ],
    quickReference: [
      { label: 'TX Property Tax Rate', value: 'Commonly 1.5%-2.5% (varies by county)' },
      { label: 'TX Income Tax', value: '0% (no state income tax)' },
      { label: 'TX Sales Tax Max', value: '8.25% (6.25% state + 2% local)' },
      { label: 'General Homestead Exemption', value: '$140,000 off school tax value' },
      { label: 'Senior/Disabled Exemption', value: '$200,000 total + school tax freeze' },
      { label: 'Appraisal Protest Deadline', value: 'May 15 or 30 days after notice' },
    ],
    faqs: [
      { question: 'Why are Texas property taxes so high?', answer: 'Texas has no state income tax, so local governments rely on property taxes to fund schools, roads, and emergency services. Effective rates are commonly 1.5%-2.5% of value, compared to roughly 1% nationally. Texans pay more in property taxes but no state income tax, which can benefit higher-income buyers. The breakeven point depends on your income — for many middle-class families, the savings from no income tax roughly offset the higher property taxes.' },
      { question: 'What is the Texas Homestead Exemption?', answer: 'The Texas Homestead Exemption removes a portion of your home value from school district property taxes. Since the November 2025 amendments, the exemption is $140,000 for general homesteads. Seniors 65+ and disabled homeowners get an additional $60,000 ($200,000 total) plus a school tax freeze (your school tax dollars stay frozen). You must file an application with your county appraisal district. The exemption only applies to your primary residence.' },
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
