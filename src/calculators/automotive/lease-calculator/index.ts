import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import LeasePanel from './LeasePanel';

const leaseCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'msrp',
      label: 'MSRP (Sticker Price)',
      type: 'number',
      placeholder: '45,000',
      prefix: '$',
      inputMode: 'decimal',
      required: true,
      helpText: 'Manufacturer suggested retail price of the vehicle',
    },
    {
      id: 'negotiatedPrice',
      label: 'Negotiated Price (Cap Cost)',
      type: 'number',
      placeholder: '42,500',
      prefix: '$',
      inputMode: 'decimal',
      required: true,
      helpText: 'The actual selling price you negotiate — lower is better.',
    },
    {
      id: 'downPayment',
      label: 'Down Payment (Cap Cost Reduction)',
      type: 'number',
      placeholder: '2,000',
      prefix: '$',
      inputMode: 'decimal',
      helpText:
        'Cash paid upfront to lower monthly payment. Note: in a lease, down payments are usually not recommended — you lose it if the car is totaled.',
    },
    {
      id: 'tradeInValue',
      label: 'Trade-In Value',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      inputMode: 'decimal',
      helpText: 'Value of your trade-in vehicle applied as additional cap cost reduction.',
    },
    {
      id: 'leaseTerm',
      label: 'Lease Term (Months)',
      type: 'select',
      required: true,
      helpText: '36 months is most common and typically offers best rates',
      options: [
        { label: '24 months (2 years)', value: '24' },
        { label: '36 months (3 years)', value: '36' },
        { label: '39 months', value: '39' },
        { label: '48 months (4 years)', value: '48' },
      ],
    },
    {
      id: 'residualValuePct',
      label: 'Residual Value (%)',
      type: 'number',
      placeholder: '55',
      unit: '%',
      min: 1,
      max: 95,
      step: 0.5,
      inputMode: 'decimal',
      required: true,
      helpText:
        "The vehicle's estimated value at lease end, as a % of MSRP. Set by the manufacturer — higher is better for the lessee.",
    },
    {
      id: 'rateInputType',
      label: 'Rate Input Method',
      type: 'select',
      helpText: 'Choose how to enter the lease interest rate',
      options: [
        { label: 'Money Factor (as provided by dealer)', value: 'mf' },
        { label: 'APR / Interest Rate (%)', value: 'apr' },
      ],
    },
    {
      id: 'moneyFactor',
      label: 'Money Factor',
      type: 'number',
      placeholder: '0.00125',
      step: 0.00001,
      inputMode: 'decimal',
      helpText:
        'The lease interest rate disguised by dealers. Multiply by 2400 to convert to APR. Typical range: 0.00050–0.00300.',
      showWhen: (v) => v.rateInputType === 'mf',
    },
    {
      id: 'aprRate',
      label: 'Interest Rate (APR)',
      type: 'number',
      placeholder: '3.0',
      unit: '%',
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Will be converted to Money Factor (APR ÷ 2400) for the lease calculation.',
      showWhen: (v) => v.rateInputType === 'apr',
    },
    {
      id: 'salesTax',
      label: 'Local Sales Tax Rate',
      type: 'number',
      placeholder: '8.25',
      unit: '%',
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Sales tax is applied monthly to the base lease payment in most states',
    },
    {
      id: 'acquisitionFee',
      label: 'Acquisition Fee (Bank Fee)',
      type: 'number',
      placeholder: '895',
      prefix: '$',
      inputMode: 'decimal',
      helpText:
        'Charged by the financing bank/manufacturer. Typically $595–$1,095. Usually added to cap cost.',
    },
  ],

  calculate: (values) => {
    const msrp = parseFloat(values.msrp);
    const negotiatedPrice = parseFloat(values.negotiatedPrice);
    const downPayment = parseFloat(values.downPayment) || 0;
    const tradeInValue = parseFloat(values.tradeInValue) || 0;
    const leaseTerm = parseInt(values.leaseTerm, 10) || 36;
    const residualValuePct = parseFloat(values.residualValuePct);
    const rateInputType = values.rateInputType || 'mf';
    const moneyFactorInput = parseFloat(values.moneyFactor) || 0;
    const aprRateInput = parseFloat(values.aprRate) || 0;
    const salesTaxRate = parseFloat(values.salesTax) / 100 || 0;
    const acquisitionFee = parseFloat(values.acquisitionFee) || 0;

    if (
      isNaN(msrp) ||
      isNaN(negotiatedPrice) ||
      isNaN(residualValuePct) ||
      msrp <= 0 ||
      negotiatedPrice <= 0 ||
      residualValuePct <= 0
    ) {
      return [];
    }

    // Adjusted cap cost
    const adjustedCapCost = negotiatedPrice - downPayment - tradeInValue + acquisitionFee;

    // Residual value (dollar amount)
    const residualValue = msrp * (residualValuePct / 100);

    // Money factor
    let moneyFactorUsed: number;
    if (rateInputType === 'apr') {
      moneyFactorUsed = aprRateInput / 2400;
    } else {
      moneyFactorUsed = moneyFactorInput;
    }

    // APR display
    const aprDisplay = moneyFactorUsed * 2400;

    // Monthly depreciation
    const monthlyDepreciation = (adjustedCapCost - residualValue) / leaseTerm;

    // Monthly finance charge
    const monthlyFinanceCharge = (adjustedCapCost + residualValue) * moneyFactorUsed;

    // Base monthly payment
    const baseMonthlyPayment = monthlyDepreciation + monthlyFinanceCharge;

    // Monthly tax
    const monthlyTax = baseMonthlyPayment * salesTaxRate;

    // Total monthly payment
    const totalMonthlyPayment = baseMonthlyPayment + monthlyTax;

    // Total lease cost (all-in)
    const totalLeaseCost = totalMonthlyPayment * leaseTerm + downPayment + tradeInValue;

    const effectiveAPR = moneyFactorUsed * 2400;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fmtMF = (mf: number) => mf.toFixed(5);

    // Build _leaseBreakdown for the panel
    const leaseBreakdown = {
      adjustedCapCost,
      residualValue,
      moneyFactorUsed,
      aprDisplay,
      monthlyDepreciation,
      monthlyFinanceCharge,
      baseMonthlyPayment,
      monthlyTax,
      totalMonthlyPayment,
      totalLeaseCost,
      msrp,
      negotiatedPrice,
      leaseTerm,
      residualValuePct,
    };

    return [
      {
        id: 'totalMonthlyPayment',
        label: 'Monthly Lease Payment (After Tax)',
        value: `$${fmt(totalMonthlyPayment)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'baseMonthlyPayment',
        label: 'Pre-Tax Monthly Payment',
        value: `$${fmt(baseMonthlyPayment)}`,
        color: 'neutral' as const,
      },
      {
        id: 'monthlyDepreciationResult',
        label: 'Monthly Depreciation Charge',
        value: `$${fmt(monthlyDepreciation)}`,
        color: 'neutral' as const,
      },
      {
        id: 'monthlyFinanceChargeResult',
        label: 'Monthly Finance Charge (Interest)',
        value: `$${fmt(monthlyFinanceCharge)}`,
        color: 'negative' as const,
      },
      {
        id: 'effectiveAPRResult',
        label: 'Effective APR (Money Factor × 2400)',
        value: `${effectiveAPR.toFixed(2)}%`,
        color: effectiveAPR < 4 ? 'positive' as const : effectiveAPR < 7 ? 'neutral' as const : 'negative' as const,
      },
      {
        id: 'moneyFactorDisplay',
        label: 'Money Factor Used',
        value: fmtMF(moneyFactorUsed),
        color: 'neutral' as const,
      },
      {
        id: 'residualValueResult',
        label: 'Residual Value at Lease End',
        value: `$${fmt(residualValue)}`,
        color: 'neutral' as const,
      },
      {
        id: 'totalLeaseCostResult',
        label: 'Total Lease Cost (All-In)',
        value: `$${fmt(totalLeaseCost)}`,
        color: 'negative' as const,
      },
      {
        id: '_leaseBreakdown',
        label: '_leaseBreakdown',
        value: JSON.stringify(leaseBreakdown),
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LeasePanel, { values, results });
  },

  educational: {
    formula:
      'Monthly Payment = [(Cap Cost − Residual) ÷ Term] + [(Cap Cost + Residual) × Money Factor]',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="60" width="170" height="230" fill="var(--svg-e0e7ff)" stroke="var(--svg-3b82f6)" stroke-width="1" rx="8"/><text x="125" y="90" text-anchor="middle" font-size="13" fill="var(--svg-3b82f6)" font-weight="bold">Lease</text><rect x="60" y="110" width="130" height="35" fill="var(--svg-3b82f6)" rx="4"/><text x="125" y="132" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">Lower Payments</text><rect x="60" y="155" width="130" height="35" fill="var(--svg-ef4444)" rx="4"/><text x="125" y="177" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">No Ownership</text><text x="125" y="225" text-anchor="middle" font-size="12" fill="var(--svg-333333)">36 mo x $399</text><text x="125" y="245" text-anchor="middle" font-size="12" fill="var(--svg-333333)">= $14,364</text><rect x="230" y="60" width="170" height="230" fill="var(--svg-ede9fe)" stroke="var(--svg-8b5cf6)" stroke-width="1" rx="8"/><text x="315" y="90" text-anchor="middle" font-size="13" fill="var(--svg-8b5cf6)" font-weight="bold">Buy</text><rect x="250" y="110" width="130" height="35" fill="var(--svg-8b5cf6)" rx="4"/><text x="315" y="132" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">Higher Payments</text><rect x="250" y="155" width="130" height="35" fill="var(--svg-22c55e)" rx="4"/><text x="315" y="177" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)">Own Asset</text><text x="315" y="225" text-anchor="middle" font-size="12" fill="var(--svg-333333)">60 mo x $550</text><text x="315" y="245" text-anchor="middle" font-size="12" fill="var(--svg-333333)">= $33,000</text></svg>',
      alt: 'Side-by-side comparison of lease and buy costs',
      caption: 'Lease vs buy — lower monthly payments but no ownership equity in a lease',
    },
    formulaDescription:
      'Lease payments have two components: the depreciation charge (how much vehicle value you consume) and the finance charge (interest on the average outstanding balance). The money factor is simply APR ÷ 2400 — dealers sometimes obscure this to make the rate harder to compare.',
    variables: [
      {
        symbol: 'MF',
        name: 'Money Factor',
        description:
          'The lease interest rate expressed as a small decimal. Convert to APR by multiplying by 2400. A money factor of 0.00125 = 3.0% APR. Never accept a money factor without converting it to APR for comparison.',
      },
      {
        symbol: 'Residual',
        name: 'Residual Value',
        description:
          'The manufacturer-set projected value of the vehicle at lease end, expressed as a % of MSRP. This is the single most important variable in determining your monthly payment. A higher residual means lower depreciation charges and lower payments. Always lease vehicles with high residual values.',
      },
      {
        symbol: 'Cap Cost & Reduction',
        name: 'Capitalized Cost & Reductions',
        description:
          'The negotiated selling price adjusted for down payment, trade-in, and acquisition fee. Down payments and trade-ins reduce the cap cost but carry risk — if the car is totaled early, the insurance payout goes to the lessor and you lose that cash. Lower cap cost = lower monthly payment.',
      },
    ],
    howToUse: [
      'Enter the MSRP and the negotiated selling price (your cap cost).',
      'Enter any down payment or trade-in value to reduce cap cost.',
      'Select your lease term — 36 months is most common and typically yields the best residual values.',
      'Enter the residual value percentage — ask the dealer for this number, it is set by the manufacturer.',
      'Enter the money factor or APR. Ask the dealer for the money factor explicitly.',
      'Add your local sales tax rate and acquisition fee.',
      'Review the payment breakdown to see exactly how depreciation and finance charges combine.',
    ],
    explanation:
      'Most consumers focus on the monthly payment and miss the two critical variables: the residual value and the money factor. The residual determines how much of the car you "use up" — a vehicle with a 60% residual vs. 50% residual at the same price can save $50–$100/month on a 36-month lease. The money factor is negotiable at some dealerships and can often be reduced with a strong credit score. Always multiply the money factor by 2400 to compare it to APR from other financing sources.',
    commonUses: [
      'Evaluating monthly lease payments and total lease cost before visiting a dealership to negotiate terms',
      'Comparing money factor (APR) and residual value offers across different manufacturers and vehicle models',
      'Deciding whether to put money down on a lease or keep cash in hand, understanding the risk of losing the down payment if the car is totaled',
    ],
    workedExamples: [
      {
        scenario: 'David negotiates a $42,500 price on an SUV with a $45,000 MSRP. The 36-month lease has a 55% residual, 0.00125 money factor, $2,000 down, $895 acquisition fee, and 8.25% sales tax. What is his true monthly payment?',
        inputs: { msrp: '45000', negotiatedPrice: '42500', downPayment: '2000', leaseTerm: '36', residualValuePct: '55', rateInputType: 'mf', moneyFactor: '0.00125', salesTax: '8.25', acquisitionFee: '895' },
        result: '$590.01/month after tax — $23,240.36 total lease cost over 36 months',
        insight: 'Adjusted cap cost = $42,500 - $2,000 + $895 = $41,395. Residual value = $45,000 x 55% = $24,750. Monthly depreciation = ($41,395 - $24,750) / 36 = $462.36. Monthly finance charge = ($41,395 + $24,750) x 0.00125 = $82.68. Base payment = $462.36 + $82.68 = $545.04. Tax at 8.25% = $44.97. Total monthly = $590.01. Effective APR = 0.00125 x 2400 = 3.0%. Total 36-month cost including down payment = $590.01 x 36 + $2,000 = $23,240.',
      },
      {
        scenario: 'Priya is cross-shopping two leases on a $38,000 MSRP sedan. Dealer A offers 60% residual and 0.00150 money factor. Dealer B offers 55% residual and 0.00080 money factor. Both are 36 months with $0 down and $795 acquisition fee, negotiated to $36,000. Which is the better deal?',
        inputs: { msrp: '38000', negotiatedPrice: '36000', downPayment: '0', leaseTerm: '36', residualValuePct: '60', rateInputType: 'mf', moneyFactor: '0.00150', salesTax: '0', acquisitionFee: '795' },
        result: 'Dealer A: $478.14/month vs Dealer B: $487.69/month — Dealer A wins by $9.55/month despite higher money factor',
        insight: 'Dealer A: Residual = $22,800 (60%). Cap cost = $36,795. Depreciation = ($36,795 - $22,800) / 36 = $388.75. Finance charge = ($36,795 + $22,800) x 0.00150 = $89.39. Total = $478.14/month. Dealer B: Residual = $20,900 (55%). Cap cost = $36,795. Depreciation = ($36,795 - $20,900) / 36 = $441.53. Finance charge = ($36,795 + $20,900) x 0.00080 = $46.16. Total = $487.69/month. Despite the higher residual, Dealer A\'s higher money factor makes it only $9.55/month cheaper. The residual isn\'t everything — always convert the money factor to APR and compare the total.',
      },
    ],
    proTips: [
      'Never negotiate a lease based on monthly payment. Instead, negotiate the capitalized cost (selling price) just like a purchase — then apply the residual and money factor. A lower cap cost directly reduces both the depreciation and finance charge components.',
      'Ask for the "buy rate" money factor. Dealers can mark up the manufacturer\'s base money factor and pocket the difference. The buy rate is what you qualify for based on your credit score. Check Edmunds forums to find the current buy rate for your make and model before visiting the dealer.',
      'Avoid putting money down on a lease. Unlike a purchase, a down payment on a lease is lost if the vehicle is totaled or stolen — the insurance payout goes to the leasing company, not you. Instead, consider Multiple Security Deposits (MSDs) if offered by the manufacturer, which reduce the money factor and are refundable at lease end.',
      'Target vehicles with high residual values. The residual is the single biggest driver of your monthly payment. Brands like Toyota, Honda, Subaru, and some luxury marques (Lexus, Porsche) set aggressive residuals to keep payments low. Avoid vehicles with residuals below 50% after 36 months unless the cap cost discount is substantial.',
      'Check for lease-specific incentives. Manufacturers frequently offer lease cash, loyalty rebates, and conquest incentives that apply only to leases — not purchases. These reduce the cap cost and can make leasing dramatically cheaper than buying, especially on slow-selling models.',
      'Review the lease contract for these specific numbers: gross capitalized cost, capitalized cost reduction, adjusted capitalized cost, residual value, rent charge (total finance charge over the term), and the total of payments. If any number doesn\'t match what you calculated, ask why — don\'t sign until you understand every line item.',
    ],
    limitations: [
      'This calculator models a closed-end lease with fixed monthly payments but does not account for mileage overage fees (typically $0.15-$0.30/mile), excess wear-and-tear charges, disposition fees at lease end ($300-$500), or early termination penalties.',
      'Lease tax treatment varies by state: some tax the full vehicle price upfront, some tax each monthly payment, and others tax the sum of payments. Illinois and Texas, for example, tax the full selling price even on a lease, which significantly increases the effective monthly cost.',
      'The calculator assumes sales tax is applied monthly, which is the most common method. Manufacturer lease specials often include subsidized residuals and money factors not reflected here.',
      'Always confirm the residual value, money factor, and all fees directly with the dealer before signing.',
    ],
    quickReference: [
      { label: 'Money Factor x 2400', value: '= Equivalent APR' },
      { label: 'APR / 2400', value: '= Money Factor' },
      { label: 'Good Money Factor', value: '< 0.00125 (< 3% APR)' },
      { label: 'Avg Money Factor', value: '0.00125 - 0.00167 (3-4%)' },
      { label: 'High Money Factor', value: '> 0.00208 (> 5% APR)' },
      { label: 'Target Residual (36 mo)', value: '55-65% of MSRP' },
      { label: 'Acquisition Fee Range', value: '$595 - $1,095' },
      { label: 'Disposition Fee (end)', value: '$300 - $500' },
    ],
    faqs: [
      {
        question: 'What is a money factor and how do I convert it to APR?',
        answer:
          'The money factor (also called lease factor or lease rate) is the interest rate on a lease expressed as a tiny decimal, typically between 0.0005 and 0.003. Multiply by 2400 to convert to the equivalent APR: a money factor of 0.00125 equals 3.0% APR (0.00125 × 2400 = 3.0). Always ask your dealer for the money factor explicitly — they are not required to disclose it in most states — and verify it by calculating the monthly finance charge independently.',
      },
      {
        question: 'Why does the residual value affect my monthly payment so much?',
        answer:
          'The lease payment covers only the portion of the car you use — the depreciation from today\'s price to the residual value at lease end. A $45,000 car with a 60% residual leaves $18,000 of value to amortize over the lease. The same car with a 50% residual leaves $22,500 to amortize — a 25% increase in the depreciation component, which typically drives 70–80% of the payment. This is why leasing vehicles with high residual values (many luxury brands, popular SUVs) is dramatically more economical than leasing vehicles with poor residuals.',
      },
      {
        question: 'Can I negotiate the money factor on a lease?',
        answer:
          'The base money factor (called the "buy rate") is set by the manufacturer\'s captive finance arm and tied to your credit tier. With excellent credit (720+), you qualify for the lowest available tier. However, dealers are sometimes permitted to mark up the money factor by a small amount (similar to dealer reserve on a conventional loan) and keep the difference as profit. Ask the dealer to confirm they are charging the buy rate, and verify by checking manufacturer-specific lease forums (such as Edmunds forums) where enthusiasts track published money factors monthly.',
      },
      {
        question: 'Is it smart to put money down on a lease?',
        answer: 'Generally, no. Unlike a purchase where a down payment builds equity, lease down payments (called cap cost reduction) only lower your monthly payment — and that money is gone if the car is totaled or stolen because the insurance payout goes to the leasing company. If you have $3,000 to put down on a 36-month lease at 3% APR equivalent, that $3,000 saves you about $88/month but you lose every penny of it in a total loss. Instead, keep the cash in a savings account and use it to supplement the higher monthly payment. Some manufacturers offer Multiple Security Deposits (MSDs) as an alternative — these are refundable at lease end and reduce the money factor without the risk of a traditional down payment.',
      },
      {
        question: 'What happens at the end of my lease?',
        answer: 'At lease end, you have three options: (1) Return the vehicle and walk away (possibly paying a disposition fee of $300-$500 plus any excess mileage or wear-and-tear charges), (2) Purchase the vehicle at the predetermined residual value stated in your contract (this can be a good deal if the market value exceeds the residual), or (3) Trade the vehicle toward a new lease or purchase (the dealer pays the residual and any positive equity goes toward your next deal). Some lessees can sell their leased vehicle to a third-party dealer like CarMax or Carvana for more than the residual and pocket the difference — check if your leasing company allows third-party buyouts, as some (like Honda/Acura and Nissan/Infiniti) recently restricted this.',
      },
      {
        question: 'What are excess mileage and wear-and-tear charges?',
        answer: 'Standard leases include 10,000, 12,000, or 15,000 miles per year. Exceeding this limit triggers a per-mile fee — typically $0.15 to $0.30 per mile — charged at lease end. If you drive 18,000 miles per year on a 12,000-mile lease, you could owe $5,400 at turn-in ($0.30 x 18,000 excess miles over 3 years). You can prepay for higher mileage limits upfront at a lower per-mile rate. Wear-and-tear charges apply for damage beyond "normal use" as defined in your lease contract: typically, any single dent or scratch larger than a credit card, windshield cracks, tire tread below 1/8 inch, stained or torn upholstery, and missing equipment. Most manufacturers offer a lease-end inspection about 60-90 days before turn-in so you can address issues on your own terms.',
      },
    ],
    citations: [
      { source: 'Edmunds', url: 'https://www.edmunds.com/car-leasing/lease-calculator.html' },
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-car-lease-en-1886/' },
    ],
  },
};

export default leaseCalculatorConfig;
