import { CalculatorConfig } from '../../../types/calculator';
import { leaseVsBuy } from './leaseVsBuyMath';
import { createElement } from 'react';
import LeaseVsBuyPanel from './LeaseVsBuyPanel';
import { finiteSteps } from '../../../utils/explainGuard';

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
      helpText: 'The quoted monthly lease payment before tax (add the tax rate below to include it)',
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
      required: true,
      helpText: 'Interest rate for the purchase loan',
    },
    {
      id: 'buyLoanTerm',
      label: 'Loan Term (Buy)',
      type: 'select',
      defaultValue: '60',
      helpText: 'Months to repay the purchase loan. Any balance left when the lease would end is counted against buying.',
      options: [
        { label: '36 months', value: '36' },
        { label: '48 months', value: '48' },
        { label: '60 months', value: '60' },
        { label: '72 months', value: '72' },
        { label: '84 months', value: '84' },
      ],
    },
    {
      id: 'salesTax',
      label: 'Sales Tax Rate',
      type: 'number',
      placeholder: '7',
      unit: '%',
      min: 0,
      max: 20,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Optional. Applied to each lease payment and to the purchase price (financed). Leave blank to compare pre-tax.',
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
      helpText: 'Leave blank for 15%. New cars often lose 15-25% in year one; the rate slows later.',
    },
  ],
  calculate: (values) => {
    const c = leaseVsBuy(values);
    if (!c) return [];
    const { leaseTerm, totalLeaseCost, netBuyCost, residualValue, leaseWins, tie, savings } = c;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return [
      {
        id: 'recommendation',
        label: tie ? `Over ${leaseTerm} months, leasing and buying cost the same` : `Over ${leaseTerm} months, ${leaseWins ? 'leasing' : 'buying'} costs less`,
        value: tie ? 'No difference' : `Save $${fmt(savings)}`,
        highlight: true,
        color: 'positive',
        interpretation: leaseWins
          ? `Leasing wins on pure cost here, but you own nothing at the end — this comparison is about cash flow, not wealth building. Buying builds equity you can sell or trade later, and every extra year you keep a purchased car improves its case.`
          : `Buying wins here largely because you keep the car's value at the end instead of returning it. Leasing can still make sense if you value driving a newer car every few years or want lower monthly payments and warranty coverage.`,
      },
      {
        id: 'totalLease',
        label: `Total Lease Cost (${leaseTerm} mo)`,
        value: `$${fmt(totalLeaseCost)}`,
        color: 'neutral',
      },
      {
        id: 'totalBuy',
        label: `Net Buy Cost (${leaseTerm} mo, after car value and loan payoff)`,
        value: `$${fmt(netBuyCost)}`,
        color: 'neutral',
      },
      {
        id: 'residualValue',
        label: 'Est. Vehicle Value After Term',
        value: `$${fmt(residualValue)}`,
        color: 'positive',
      },
      {
        id: 'loanBalance',
        label: 'Loan Balance Still Owed After Term',
        value: `$${fmt(c.loanBalance)}`,
        color: c.loanBalance > 0 ? 'negative' : 'neutral',
      },
    ];
  },
  explainSteps: (values) => {
    const c = leaseVsBuy(values);
    if (!c) return [];
    const f = (n: number) => `$${Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const f2 = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const price = parseFloat(values.vehiclePrice);
    const leasePayment = parseFloat(values.leasePayment);
    const leaseDown = parseFloat(values.leaseDownPayment) || 0;
    const buyDown = parseFloat(values.buyDownPayment) || 0;
    const buyAPR = parseFloat(values.buyAPR);
    const taxPct = parseFloat(values.salesTax) || 0;
    const deprRaw = parseFloat(values.depreciationRate);
    const deprPct = Number.isFinite(deprRaw) ? deprRaw : 15;
    const k = Math.min(c.leaseTerm, c.buyTerm);
    const diff = c.netBuyCost - c.totalLeaseCost;
    return finiteSteps([
      { label: 'Total cost of leasing', expr: `${f(leaseDown)} down + ${f2(leasePayment)} × ${c.leaseTerm} months × (1 + ${parseFloat(taxPct.toFixed(3))}% tax) = ${f(c.totalLeaseCost)}`, note: 'You hand the car back, so nothing is credited at the end.' },
      { label: 'Amount borrowed to buy', expr: `${f(price)} × (1 + ${parseFloat(taxPct.toFixed(3))}%) − ${f(buyDown)} down = ${f(c.loanPrincipal)}`, note: 'Sales tax on the price is financed with the loan.' },
      { label: 'Monthly loan payment', expr: `${f(c.loanPrincipal)} at ${parseFloat(buyAPR.toFixed(3))}% over ${c.buyTerm} months = ${f2(c.monthlyBuyPayment)}/month` },
      { label: `Paid and still owed after ${k} months`, expr: `Paid ${f2(c.monthlyBuyPayment)} × ${k} = ${f(c.buyPaid)}; balance left = ${f(c.loanBalance)}` },
      { label: `Car value after ${c.leaseTerm} months`, expr: `${f(price)} × (1 − ${parseFloat(deprPct.toFixed(3))}%)^(${c.leaseTerm} ÷ 12) = ${f(c.residualValue)}`, note: 'The yearly depreciation rate is your own assumption.' },
      { label: 'Net cost of buying', expr: `${f(Math.min(buyDown, price * (1 + taxPct / 100)))} down + ${f(c.buyPaid)} paid + ${f(c.loanBalance)} owed − ${f(c.residualValue)} car value = ${f(c.netBuyCost)}` },
      { label: 'Compare', expr: c.tie ? 'The two cost about the same.' : `${f(c.totalLeaseCost)} (lease) vs ${f(c.netBuyCost)} (buy): ${diff > 0 ? 'leasing' : 'buying'} is ${f(c.savings)} cheaper` },
    ]);
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LeaseVsBuyPanel, { values, results });
  },
  educational: {
    formula: 'Net Buy Cost = Down Payment + Payments made + Loan Balance Still Owed − Vehicle Value at End of Term',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="80" width="170" height="200" fill="var(--svg-e0e7ff)" stroke="var(--svg-3b82f6)" stroke-width="1" rx="8"/><text x="125" y="115" text-anchor="middle" font-size="16" fill="var(--svg-3b82f6)" font-weight="bold">Lease</text><text x="125" y="150" text-anchor="middle" font-size="13" fill="var(--svg-333333)">$399/mo</text><text x="125" y="175" text-anchor="middle" font-size="11" fill="var(--svg-666666)">No equity</text><text x="125" y="220" text-anchor="middle" font-size="13" fill="var(--svg-333333)">Total: $14K</text><rect x="230" y="80" width="170" height="200" fill="var(--svg-ede9fe)" stroke="var(--svg-8b5cf6)" stroke-width="1" rx="8"/><text x="315" y="115" text-anchor="middle" font-size="16" fill="var(--svg-8b5cf6)" font-weight="bold">Buy</text><text x="315" y="150" text-anchor="middle" font-size="13" fill="var(--svg-333333)">$550/mo</text><text x="315" y="175" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Build equity</text><text x="315" y="220" text-anchor="middle" font-size="13" fill="var(--svg-333333)">Total: $33K</text></svg>',
      alt: 'Lease vs buy comparison showing monthly payment and equity difference',
      caption: 'Leasing offers lower payments; buying builds ownership equity over time',
    },
    formulaDescription:
      'The lease vs. buy comparison compares total lease payments to the net cost of buying after accounting for the vehicle\'s residual value at the end of the comparison period. The loan still owed at the end of the window is counted against buying, because it must be paid off to sell the car (or carried if you keep it). The comparison is only valid over the same time horizon.',
    variables: [
      { symbol: 'Residual Value', name: 'Vehicle Residual Value', description: 'The estimated market value of the vehicle at the end of the lease/comparison term. This is the key advantage of buying — you retain this asset value.' },
      { symbol: 'Depreciation', name: 'Annual Depreciation Rate', description: 'The rate at which the vehicle loses value each year. New cars average 15-25% in year one; luxury vehicles can lose 30%+ in the first year.' },
    ],
    howToUse: [
      'Enter the vehicle price, lease payment, and lease term.',
      'Enter the buy scenario down payment and loan APR.',
      'Enter an estimated annual depreciation rate (15% is typical for new vehicles).',
      'The calculator compares total cost over the lease term, counting any loan balance still owed on the purchase.',
      'The comparison credits you with the vehicle value you keep if you buy and charges you for the loan still outstanding, making it an apples-to-apples comparison.',
    ],
    explanation:
      'Leasing vs. buying is fundamentally a question of what you pay for what you get. Leasing means paying for only the depreciation during the lease term — you return the car at the end. Buying means paying for the full vehicle but retaining the asset. Leasing is often cheaper in the short term but more expensive over the long run if you always lease vs. driving a purchased vehicle for many years. Leasing makes financial sense when: you value always having a new car, you drive less than the mileage limit, and your lease payment is significantly below a purchase payment. Real-world example: a $40,000 car with a $450 per month lease at 36 months totals $16,200 plus $2,000 down, or $18,200. Buying the same car with $5,000 down at 6.9% APR over 60 months costs about $691 per month. Over 36 months the buyer pays about $29,890 in cash, still owes about $15,458 on the loan, and owns a car worth about $24,565 (15% a year depreciation), so the net cost is $29,890 + $15,458 - $24,565 = $20,783, about $2,583 more than the lease. Leaving out the remaining loan balance would make buying look about $15,500 cheaper than it really is. The lease decision also depends on driving habits: if you drive 18,000 miles per year and the lease allows only 12,000, you face roughly $5,400 in excess mileage fees at $0.30 per mile (or $2,700 at $0.15) at the end. For business owners, lease payments can often be deducted as a business expense, which may tip the scales toward leasing.',
    commonUses: [
      'Deciding whether to lease or finance a new vehicle by comparing total costs over the same time period',
      'Evaluating the financial trade-off between lower monthly lease payments and building equity through ownership',
      'Comparing long-term costs for drivers who keep vehicles many years versus those who prefer upgrading every 2-3 years',
    ],
    workedExamples: [
      {
        scenario: 'Alex is considering a $40,000 SUV. Lease: $2,000 down, $450/month, 36 months. Buy: $5,000 down, 6.9% APR for 60 months, 15% annual depreciation. Over 36 months, which costs less?',
        inputs: { vehiclePrice: '40000', leasePayment: '450', leaseDownPayment: '2000', leaseTerm: '36', buyDownPayment: '5000', buyAPR: '6.9', depreciationRate: '15' },
        result: 'Leasing saves $2,583 over 36 months — lease costs $18,200 vs. net buy cost of $20,783 after car value and loan payoff',
        insight: 'Total lease cost = $2,000 + ($450 x 36) = $18,200. Buy scenario: Loan principal = $35,000. Monthly payment at 6.9% for 60 months = $691.39. Over 36 months, the buyer pays $5,000 + ($691.39 x 36) = $29,890 and still owes $15,458 on the loan. After 3 years at 15% depreciation, the car is worth $40,000 x (0.85)^3 = $24,565. Net buy cost = $29,890 + $15,458 - $24,565 = $20,783, so leasing is cheaper by $2,583 over this 36-month window. Keeping the purchased car longer changes the picture: each extra year of ownership spreads the depreciation over more months.',
      },
      {
        scenario: 'Taylor drives 8,000 miles per year and wants a new car every 3 years with the latest tech. The $35,000 sedan leases at $380/month with $1,500 down (36 months). Buying at 7.5% APR with $3,500 down and 18% annual depreciation. Is leasing the better fit?',
        inputs: { vehiclePrice: '35000', leasePayment: '380', leaseDownPayment: '1500', leaseTerm: '36', buyDownPayment: '3500', buyAPR: '7.5', depreciationRate: '18' },
        result: 'Leasing saves $5,772 over 36 months — lease: $15,180 vs. net buy cost: $20,952 after car value and loan payoff',
        insight: 'Total lease cost = $1,500 + ($380 x 36) = $15,180. Buy: Loan = $31,500 at 7.5% / 60 months = $631.20/month. Over 36 months: $3,500 + ($631.20 x 36) = $26,223, with $14,027 still owed on the loan. Car value after 3 years at 18% depreciation: $35,000 x (0.82)^3 = $19,298. Net buy cost = $26,223 + $14,027 - $19,298 = $20,952. Leasing is $5,772 cheaper over the 3 years, which fits Taylor with low mileage and a taste for new cars. The analysis changes if Taylor keeps the purchased car much longer than 3 years: depreciation slows, the loan gets paid off, and buying catches up.',
      },
    ],
    proTips: [
      'Run the comparison net of equity and net of the loan you still owe, not just monthly payments. A $400 lease payment looks cheaper than a $650 loan payment, but the loan buys an asset. Over 36 months the lease costs $14,400 with nothing to show for it; the loan costs $23,400 in payments, and you still owe a large balance, but you own a car that is worth something. Only after subtracting both do you see which is really cheaper.',
      'Your annual mileage is the single biggest lifestyle factor. If you drive under 12,000 miles per year, leasing is viable. If you drive 15,000+, buying almost always wins because excess mileage fees on a lease ($0.15-$0.30/mile) add up fast. A 5,000-mile annual overage costs $750-$1,500 per year.',
      'Consider the ownership horizon, not just the first 3 years. Leasing every 3 years for 9 years (three consecutive leases) usually costs more than buying one car and keeping it for 9 years, because you keep paying for the steepest part of depreciation each time. Run the numbers for your own quotes.',
      'For business owners, lease payments may be tax-deductible as a business expense (consult your CPA). The IRS allows deducting either actual expenses or the standard mileage rate. Leasing simplifies record-keeping since the monthly payment is a clean expense, whereas a purchased vehicle requires depreciation schedules.',
      'Factor in maintenance and repairs. Leased vehicles are always under factory warranty, so major repair costs are covered. A purchased vehicle kept beyond the warranty period (typically 3-5 years) will incur out-of-pocket repair costs. Budget for repairs on a vehicle that is out of warranty.',
    ],
    limitations: [
      'This calculator uses a constant annual depreciation rate and compares only over the lease term, which is an approximation — real depreciation follows a declining curve (faster in early years).',
      'It does not account for sales tax differences between leasing and buying (some states tax the full vehicle price on a lease, others only monthly payments), insurance cost differences (leasing typically requires higher coverage limits), manufacturer incentives (lease cash, subsidized residuals), or the time value of money.',
      'The comparison assumes you sell or trade the purchased vehicle at the end of the comparison period. If you keep the purchased vehicle longer, the financial advantage of buying increases substantially.',
      'GAP insurance costs are not included but are often required on leases.',
    ],
    quickReference: [
      { label: 'Lease Best For', value: 'Low mileage, want new car every 2-3 yrs' },
      { label: 'Buy Best For', value: 'High mileage, keep car 5+ years' },
      { label: 'Lease vs Loan Payment', value: 'Lease monthly is usually lower' },
      { label: 'New Car Year-1 Depreciation', value: '15-25% of MSRP' },
      { label: 'Excess Mileage Fee', value: '$0.15 - $0.30 per mile' },
      { label: 'Break-Even (Lease vs Buy)', value: 'Depends on your numbers — buying improves the longer you keep the car' },
      { label: 'Lease Mileage Limits', value: '10K / 12K / 15K miles per year' },
      { label: 'Key Metric', value: 'Net cost after equity, not monthly pmt' },
    ],
    faqs: [
      {
        question: 'What are the main advantages of leasing?',
        answer: 'Lower monthly payments (usually less than a loan payment on the same car), always driving a new vehicle under warranty, no trade-in hassle at the end, potential tax advantages for business use, and the ability to upgrade every 2-3 years. Disadvantages include mileage limits (typically 10,000-15,000 miles per year), no ownership or equity, and potential fees for excess wear or mileage at lease end.',
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
        answer: 'Mileage is one of the most important factors. Standard leases cap you at 10,000, 12,000, or 15,000 miles per year. Every mile over the limit costs $0.15-$0.30 at lease-end. If you drive 20,000 miles per year, a 12,000-mile lease leaves you 24,000 miles over after 3 years — that\'s $3,600-$7,200 in fees. Buying eliminates this risk entirely. If your driving is unpredictable (new job, moving, lifestyle changes), buying gives you flexibility that a lease contract does not. You can purchase additional miles upfront at a discount at a lower per-mile rate, but this still adds to the lease cost.',
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
