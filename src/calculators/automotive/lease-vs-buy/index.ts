import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import LeaseVsBuyPanel from './LeaseVsBuyPanel';

const leaseBuyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'vehiclePrice',
      label: 'Vehicle MSRP / Price',
      type: 'number',
      placeholder: '40,000',
      prefix: '$',
      min: 0,
      step: 500,
      inputMode: 'decimal',
      required: true,
      helpText: 'Total price of the vehicle including options',
    },
    {
      id: 'leasePayment',
      label: 'Monthly Lease Payment',
      type: 'number',
      placeholder: '450',
      prefix: '$',
      min: 0,
      step: 10,
      inputMode: 'decimal',
      required: true,
      helpText: 'The quoted monthly lease payment before tax',
    },
    {
      id: 'leaseDownPayment',
      label: 'Lease Down Payment / Cap Cost Reduction',
      type: 'number',
      placeholder: '2,000',
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'decimal',
      helpText: 'Cash paid upfront for the lease',
    },
    {
      id: 'leaseTerm',
      label: 'Lease Term',
      type: 'select',
      helpText: 'The length of the lease in months',
      options: [
        { label: '24 months', value: '24' },
        { label: '36 months', value: '36' },
        { label: '39 months', value: '39' },
        { label: '48 months', value: '48' },
      ],
    },
    {
      id: 'buyDownPayment',
      label: 'Buy Down Payment',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 500,
      inputMode: 'decimal',
      helpText: 'Cash down payment for the purchase option',
    },
    {
      id: 'buyAPR',
      label: 'Loan APR (Buy)',
      type: 'number',
      placeholder: '6.9',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Interest rate for the purchase loan',
    },
    {
      id: 'depreciationRate',
      label: 'Est. Annual Depreciation',
      type: 'number',
      placeholder: '15',
      unit: '%',
      min: 0,
      max: 50,
      step: 1,
      inputMode: 'decimal',
      helpText: 'New cars depreciate 15-25% per year; used cars less',
    },
  ],
  calculate: (values) => {
    const price = parseFloat(values.vehiclePrice);
    const leasePayment = parseFloat(values.leasePayment);
    const leaseDown = parseFloat(values.leaseDownPayment) || 0;
    const leaseTerm = parseFloat(values.leaseTerm || '36');
    const buyDown = parseFloat(values.buyDownPayment) || 0;
    const buyAPR = parseFloat(values.buyAPR) / 100;
    const deprPct = parseFloat(values.depreciationRate) / 100 || 0.15;

    if ([price, leasePayment].some(isNaN) || price <= 0) return [];

    const totalLeaseCost = leaseDown + leasePayment * leaseTerm;

    const loanPrincipal = price - buyDown;
    const monthlyRate = buyAPR / 12;
    let monthlyBuyPayment: number;
    if (monthlyRate === 0 || isNaN(buyAPR)) {
      monthlyBuyPayment = loanPrincipal / 60;
    } else {
      monthlyBuyPayment = (loanPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, 60))) / (Math.pow(1 + monthlyRate, 60) - 1);
    }

    const residualValue = price * Math.pow(1 - deprPct, leaseTerm / 12);
    const totalBuyCost = buyDown + monthlyBuyPayment * leaseTerm - residualValue;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const leaseWins = totalLeaseCost < totalBuyCost;

    return [
      {
        id: 'recommendation',
        label: `Over ${leaseTerm} months, ${leaseWins ? 'leasing' : 'buying'} costs less`,
        value: `Save $${fmt(Math.abs(totalBuyCost - totalLeaseCost))}`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'totalLease',
        label: `Total Lease Cost (${leaseTerm} mo)`,
        value: `$${fmt(totalLeaseCost)}`,
        color: 'neutral',
      },
      {
        id: 'totalBuy',
        label: `Net Buy Cost (${leaseTerm} mo, incl. equity)`,
        value: `$${fmt(totalBuyCost)}`,
        color: 'neutral',
      },
      {
        id: 'residualValue',
        label: 'Est. Vehicle Value After Term',
        value: `$${fmt(residualValue)}`,
        color: 'positive',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LeaseVsBuyPanel, { values, results });
  },
  educational: {
    formula: 'Net Buy Cost = Down Payment + Payments over term − Remaining Vehicle Value',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="80" width="170" height="200" fill="var(--svg-e0e7ff)" stroke="var(--svg-3b82f6)" stroke-width="1" rx="8"/><text x="125" y="115" text-anchor="middle" font-size="16" fill="var(--svg-3b82f6)" font-weight="bold">Lease</text><text x="125" y="150" text-anchor="middle" font-size="13" fill="var(--svg-333333)">$399/mo</text><text x="125" y="175" text-anchor="middle" font-size="11" fill="var(--svg-666666)">No equity</text><text x="125" y="220" text-anchor="middle" font-size="13" fill="var(--svg-333333)">Total: $14K</text><rect x="230" y="80" width="170" height="200" fill="var(--svg-ede9fe)" stroke="var(--svg-8b5cf6)" stroke-width="1" rx="8"/><text x="315" y="115" text-anchor="middle" font-size="16" fill="var(--svg-8b5cf6)" font-weight="bold">Buy</text><text x="315" y="150" text-anchor="middle" font-size="13" fill="var(--svg-333333)">$550/mo</text><text x="315" y="175" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Build equity</text><text x="315" y="220" text-anchor="middle" font-size="13" fill="var(--svg-333333)">Total: $33K</text></svg>',
      alt: 'Lease vs buy comparison showing monthly payment and equity difference',
      caption: 'Leasing offers lower payments; buying builds ownership equity over time',
    },
    formulaDescription:
      'The lease vs. buy comparison compares total lease payments to the net cost of buying after accounting for the vehicle\'s residual value at the end of the comparison period. The comparison is only valid over the same time horizon.',
    variables: [
      { symbol: 'Residual Value', name: 'Vehicle Residual Value', description: 'The estimated market value of the vehicle at the end of the lease/comparison term. This is the key advantage of buying — you retain this asset value.' },
      { symbol: 'Depreciation', name: 'Annual Depreciation Rate', description: 'The rate at which the vehicle loses value each year. New cars average 15-25% in year one; luxury vehicles can lose 30%+ in the first year.' },
    ],
    howToUse: [
      'Enter the vehicle price, lease payment, and lease term.',
      'Enter the buy scenario down payment and loan APR.',
      'Enter an estimated annual depreciation rate (15% is typical for new vehicles).',
      'The calculator compares total cost over the same time period.',
      'The comparison accounts for the vehicle equity you retain if you buy, making it a true apples-to-apples comparison.',
    ],
    explanation:
      'Leasing vs. buying is fundamentally a question of what you pay for what you get. Leasing means paying for only the depreciation during the lease term — you return the car at the end. Buying means paying for the full vehicle but retaining the asset. Leasing is often cheaper in the short term but more expensive over the long run if you always lease vs. driving a purchased vehicle for many years. Leasing makes financial sense when: you value always having a new car, you drive less than the mileage limit, and your lease payment is significantly below a purchase payment. Real-world example: a $40,000 car with a $450 per month lease at 36 months totals $16,200 plus $2,000 down equals $18,200. Buying the same car with $5,000 down at 6.9% APR over 60 months costs about $690 per month. Over 36 months, the buyer pays $29,840 but the car is worth about $22,000 residual, making the net cost only $7,840 — much less than the lease. However, the lease has lower monthly payments and the buyer is responsible for repairs after the warranty expires. The lease decision also depends on driving habits: if you drive 18,000 miles per year and the lease allows only 12,000, you face roughly $900 to $1,800 in excess mileage fees at the end. For business owners, lease payments can often be deducted as a business expense, which may tip the scales toward leasing.',
    commonUses: [
      'Deciding whether to lease or finance a new vehicle by comparing total costs over the same time period',
      'Evaluating the financial trade-off between lower monthly lease payments and building equity through ownership',
      'Comparing long-term costs for drivers who keep vehicles many years versus those who prefer upgrading every 2-3 years',
    ],
    workedExamples: [
      {
        scenario: 'Alex is considering a $40,000 SUV. Lease: $2,000 down, $450/month, 36 months. Buy: $5,000 down, 6.9% APR for 60 months, 15% annual depreciation. Over 36 months, which costs less?',
        inputs: { vehiclePrice: '40000', leasePayment: '450', leaseDownPayment: '2000', leaseTerm: '36', buyDownPayment: '5000', buyAPR: '6.9', depreciationRate: '15' },
        result: 'Buying saves $12,535 over 36 months — lease costs $18,200 with nothing retained vs. net buy cost of $5,665 after equity',
        insight: 'Total lease cost = $2,000 + ($450 x 36) = $18,200. Buy scenario: Loan principal = $35,000. Monthly payment at 6.9% for 60 months = $691.53. Over 36 months, buyer pays $5,000 + ($691.53 x 36) = $29,895. But after 3 years at 15% depreciation, the car\'s residual value is $40,000 x (0.85)^3 = $24,565. Net buy cost = $29,895 - $24,565 = $5,330. Buying saves $12,870 over 36 months because the car retains significant equity. If Alex can afford the higher payment, buying is the clear winner here — but the lease offers lower monthly cash outlay.',
      },
      {
        scenario: 'Taylor drives 8,000 miles per year and wants a new car every 3 years with the latest tech. The $35,000 sedan leases at $380/month with $1,500 down (36 months). Buying at 7.5% APR with $3,500 down and 18% annual depreciation. Is leasing the better fit?',
        inputs: { vehiclePrice: '35000', leasePayment: '380', leaseDownPayment: '1500', leaseTerm: '36', buyDownPayment: '3500', buyAPR: '7.5', depreciationRate: '18' },
        result: 'Buying saves $8,253 over 36 months — lease: $15,180 vs. net buy cost: $6,927 after equity',
        insight: 'Total lease cost = $1,500 + ($380 x 36) = $15,180. Buy: Loan = $31,500 at 7.5% / 60 months = $631.14/month. Over 36 months: $3,500 + ($631.14 x 36) = $26,221. Residual after 3 years at 18% depreciation: $35,000 x (0.82)^3 = $19,294. Net buy cost = $26,221 - $19,294 = $6,927. Buying still costs less on paper, but for Taylor\'s lifestyle — low mileage, always wanting the latest car, no interest in ownership — the convenience of leasing may be worth the $8,253 premium over 3 years. The analysis changes if Taylor keeps the purchased car beyond 3 years: each additional year of ownership dramatically tilts the math toward buying.',
      },
    ],
    proTips: [
      'Run the comparison net of equity, not just monthly payments. A $400 lease payment looks cheaper than a $650 loan payment, but the loan builds equity. Over 36 months, the lease costs $14,400 with nothing to show for it. The loan costs $23,400 but leaves you with a car worth $18,000-$25,000 — making the net cost potentially lower than leasing.',
      'Your annual mileage is the single biggest lifestyle factor. If you drive under 12,000 miles per year, leasing is viable. If you drive 15,000+, buying almost always wins because excess mileage fees on a lease ($0.15-$0.30/mile) add up fast. A 5,000-mile annual overage costs $750-$1,500 per year.',
      'Consider the ownership horizon, not just the first 3 years. Leasing every 3 years for 9 years (three consecutive leases) usually costs 50-100% more than buying one car and keeping it for 9 years. The savings from long-term ownership are enormous — often $15,000-$30,000 over a decade.',
      'For business owners, lease payments may be tax-deductible as a business expense (consult your CPA). The IRS allows deducting either actual expenses or the standard mileage rate. Leasing simplifies record-keeping since the monthly payment is a clean expense, whereas a purchased vehicle requires depreciation schedules.',
      'Factor in maintenance and repairs. Leased vehicles are always under factory warranty, so major repair costs are covered. A purchased vehicle kept beyond the warranty period (typically 3-5 years) will incur out-of-pocket repair costs. Budget $500-$1,000 per year for repairs on a 5-8 year old vehicle.',
    ],
    limitations: [
      'This calculator uses a simplified 60-month loan for the buy scenario and a constant annual depreciation rate, which is an approximation — real depreciation follows a declining curve (faster in early years).',
      'It does not account for sales tax differences between leasing and buying (some states tax the full vehicle price on a lease, others only monthly payments), insurance cost differences (leasing typically requires higher coverage limits), manufacturer incentives (lease cash, subsidized residuals), or the time value of money.',
      'The comparison assumes you sell or trade the purchased vehicle at the end of the comparison period. If you keep the purchased vehicle longer, the financial advantage of buying increases substantially.',
      'GAP insurance costs are not included but are often required on leases.',
    ],
    quickReference: [
      { label: 'Lease Best For', value: 'Low mileage, want new car every 2-3 yrs' },
      { label: 'Buy Best For', value: 'High mileage, keep car 5+ years' },
      { label: 'Typical Lease Payment vs Buy', value: '30-50% lower monthly' },
      { label: 'New Car Year-1 Depreciation', value: '15-25% of MSRP' },
      { label: 'Excess Mileage Fee', value: '$0.15 - $0.30 per mile' },
      { label: 'Break-Even (Lease vs Buy)', value: 'Usually 3-5 years ownership' },
      { label: 'Lease Mileage Limits', value: '10K / 12K / 15K miles per year' },
      { label: 'Key Metric', value: 'Net cost after equity, not monthly pmt' },
    ],
    faqs: [
      {
        question: 'What are the main advantages of leasing?',
        answer: 'Lower monthly payments (usually 30-50% less than buying), always driving a new vehicle under warranty, no trade-in hassle at the end, potential tax advantages for business use, and the ability to upgrade every 2-3 years. Disadvantages include mileage limits (typically 10,000-15,000 miles per year), no ownership or equity, and potential fees for excess wear or mileage at lease end.',
      },
      {
        question: 'What happens at the end of a lease?',
        answer: 'You return the vehicle and can walk away, lease a new vehicle, or purchase the vehicle at the predetermined residual value. Excess mileage fees typically run $0.15 to $0.30 per mile over the limit. Wear-and-tear charges may apply for damage beyond normal use. Compare the buyout price to the vehicle market value at lease end — if the residual is below market value, buying the car can be a good deal.',
      },
      {
        question: 'When does it make more sense to buy than lease?',
        answer: 'Buying makes more sense when: you drive more than 15,000 miles per year, you plan to keep the vehicle for more than 5 years, you want to customize the car, or you want to build equity in an asset. Over a 5 to 10 year ownership period, buying almost always costs less than continually leasing. If you tend to get bored with cars every 2 years and want the latest technology and safety features, leasing may be worth the premium.',
      },
      {
        question: 'How does mileage affect the lease vs. buy decision?',
        answer: 'Mileage is one of the most important factors. Standard leases cap you at 10,000, 12,000, or 15,000 miles per year. Every mile over the limit costs $0.15-$0.30 at lease-end. If you drive 20,000 miles per year, a 12,000-mile lease leaves you 24,000 miles over after 3 years — that\'s $3,600-$7,200 in fees. Buying eliminates this risk entirely. If your driving is unpredictable (new job, moving, lifestyle changes), buying gives you flexibility that a lease contract does not. You can purchase additional miles upfront at a discount (typically $0.10-$0.15/mile), but this still adds to the lease cost.',
      },
      {
        question: 'Can I get out of a lease early?',
        answer: 'Yes, but it is rarely cheap. Options include: (1) Lease transfer through services like Swapalease or LeaseTrader (you transfer the remaining payments to someone else, usually for a fee), (2) Early termination — you pay the remaining payments plus an early termination fee (often the remaining depreciation), which can run thousands of dollars, (3) Trading the leased vehicle — the dealer pays off the lease balance, and any negative equity gets rolled into your next deal, or (4) Voluntary repossession — this destroys your credit and is never recommended. Before leasing, be reasonably confident you can commit to the full term. Life changes (job relocation, growing family, financial hardship) are harder to accommodate with a lease than a purchased vehicle you can sell at any time.',
      },
      {
        question: 'What is the "lease then buy" strategy and does it make financial sense?',
        answer: 'Lease-then-buy means leasing a new car for 3 years, then purchasing it at the predetermined residual value at lease end. This can make sense in specific situations: (1) You are unsure if you will love the car long-term and want a 3-year test drive, (2) The manufacturer is offering lease incentives (lease cash, subsidized money factor) that make the combined lease-then-buy cost lower than financing from day one, or (3) You cannot afford the higher purchase payments now but expect higher income in 3 years. The downside is you typically pay more in total than buying outright from the start because you pay two sets of finance charges — the lease money factor for 3 years plus the loan APR for the buyout. Run both scenarios through this calculator to compare total cost over your full expected ownership period.',
      },
    ],
    citations: [
      { source: 'Edmunds', url: 'https://www.edmunds.com/car-leasing/lease-vs-buy/' },
      { source: 'Kelley Blue Book', url: 'https://www.kbb.com/car-advice/lease-vs-buy/' },
    ],
  },
};

export default leaseBuyConfig;
