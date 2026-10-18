import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RentVsBuyPanel from './RentVsBuyPanel';
import { simulateRentVsBuy, firstBuyingWinsYear } from '../../finance/rent-vs-buy/model';
import { monthlyPayment } from '../../finance/rent-vs-buy/utils';
import { rvbParamsFromValues } from './params';

const rentVsBuyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sectionBuy',
      label: '── Buying Parameters ──',
      type: 'text',
      placeholder: '',
      required: false,
    },
    {
      id: 'homePrice',
      label: 'Home Purchase Price',
      type: 'number',
      placeholder: '400,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'The price of the home you are considering buying',
    },
    {
      id: 'downPaymentPct',
      label: 'Down Payment',
      type: 'number',
      placeholder: '20',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Percentage of home price paid upfront',
    },
    {
      id: 'interestRate',
      label: 'Mortgage Rate',
      type: 'number',
      placeholder: '6.8',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      helpText: 'Annual mortgage interest rate',
    },
    {
      id: 'closingCostsPct',
      label: 'Closing Costs',
      type: 'number',
      placeholder: '3',
      unit: '%',
      min: 0,
      max: 10,
      step: 0.1,
      required: false,
      helpText: 'Buyer closing costs as % of home price (default 3%)',
    },
    {
      id: 'propertyTaxPct',
      label: 'Property Taxes (Annual)',
      type: 'number',
      placeholder: '1.2',
      unit: '%',
      min: 0,
      step: 0.1,
      required: false,
      helpText: 'Annual property tax as % of home value',
    },
    {
      id: 'maintenancePct',
      label: 'Maintenance & Repairs (Annual)',
      type: 'number',
      placeholder: '1.5',
      unit: '%',
      min: 0,
      step: 0.1,
      required: false,
      helpText: 'Ongoing upkeep as % of home value (default 1.5%)',
    },
    {
      id: 'homeAppreciation',
      label: 'Annual Home Appreciation',
      type: 'number',
      placeholder: '3',
      unit: '%',
      min: -10,
      max: 20,
      step: 0.1,
      required: true,
      helpText: 'Expected annual change in home value (long-run US average is roughly 3-4%; use a negative value to stress-test a decline)',
    },
    {
      id: 'sectionRent',
      label: '── Renting Parameters ──',
      type: 'text',
      placeholder: '',
      required: false,
    },
    {
      id: 'monthlyRent',
      label: 'Current Monthly Rent',
      type: 'number',
      placeholder: '2,000',
      prefix: '$',
      min: 0,
      step: 50,
      required: true,
      helpText: 'What you currently pay or would pay in rent',
    },
    {
      id: 'rentIncrease',
      label: 'Annual Rent Increase',
      type: 'number',
      placeholder: '3',
      unit: '%',
      min: 0,
      max: 20,
      step: 0.1,
      required: false,
      helpText: 'Expected annual rent growth rate (default 3%)',
    },
    {
      id: 'rentersInsurance',
      label: "Renter's Insurance (Annual)",
      type: 'number',
      placeholder: '200',
      prefix: '$',
      min: 0,
      step: 25,
      required: false,
      helpText: "Annual renter's insurance premium",
    },
    {
      id: 'sectionTimeline',
      label: '── Timeline ──',
      type: 'text',
      placeholder: '',
      required: false,
    },
    {
      id: 'years',
      label: 'Years You Plan to Stay',
      type: 'number',
      placeholder: '7',
      unit: 'years',
      min: 1,
      max: 30,
      step: 1,
      required: true,
      helpText: 'Slide from 1–30 years to find the break-even point',
    },
  ],
  calculate: (values) => {
    const parsed = rvbParamsFromValues(values);
    if (!parsed) return [];
    const { params, years } = parsed;

    const rows = simulateRentVsBuy(params);
    const at = rows[years - 1];
    const closingCosts = params.homePrice * params.closingCostsPct;
    const loanAmount = params.homePrice * (1 - params.downPaymentPct);
    const monthlyMortgage = monthlyPayment(loanAmount, params.mortgageRate, 360);
    // Year-1 monthly cost: P&I + tax + maintenance + insurance, plus PMI when the down payment is under 20%
    // (the same PMI the net-cost model charges).
    const monthlyPmi = params.downPaymentPct < 0.2 ? (loanAmount * params.pmiRate) / 12 : 0;
    const monthlyOwnership =
      monthlyMortgage + monthlyPmi + (params.homePrice * (params.propertyTaxRate + params.maintenancePct + params.homeInsurancePct)) / 12;

    const futureHomeValue = at.homeValue;
    const homeEquity = at.equity;
    const netBuyCost = at.netBuyCost;
    const netRentCost = at.netRentCost;
    const breakEven = firstBuyingWinsYear(rows);
    const breakEvenYear = breakEven === -1 ? null : breakEven;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const buyWins = netBuyCost < netRentCost;
    // Net cost can be negative (the renter's investment growth exceeds rent paid): keep the sign before the $.
    const money = (n: number) => `${n < 0 ? '-' : ''}$${fmt(Math.abs(n))}`;

    const breakEvenLabel = breakEvenYear
      ? `Break-even at year ${breakEvenYear}`
      : 'Buying does not break even within 30 years';

    return [
      {
        id: 'breakEven',
        label: breakEvenLabel,
        value: breakEvenYear
          ? `Buy if staying ${breakEvenYear} ${breakEvenYear === 1 ? 'year' : 'years'} or more`
          : 'Renting is cheaper long-term at these inputs',
        interpretation: breakEvenYear
          ? `Buying's upfront costs (down payment, closing) need time to be offset by building equity instead of paying rent — sell before this point and you likely come out behind after transaction costs. This assumes steady rent and home-price growth; a hot rental market or slow appreciation shifts the break-even.`
          : `At these inputs, renting stays cheaper even over a long horizon — often because rent growth or home-price appreciation assumptions favor renting. Try adjusting the appreciation rate or your expected time in the home to see how sensitive this verdict is.`,
        highlight: true,
        color: breakEvenYear && years >= breakEvenYear ? ('positive' as const) : ('neutral' as const),
      },
      {
        id: 'recommendation',
        label: `Over ${years} years: ${buyWins ? 'Buying' : 'Renting'} saves you`,
        value: `$${fmt(Math.abs(netRentCost - netBuyCost))}`,
        color: 'positive' as const,
      },
      {
        id: 'netBuyCost',
        label: `Net Cost to Buy (${years} yrs)`,
        value: money(netBuyCost),
        color: 'neutral' as const,
      },
      {
        id: 'netRentCost',
        label: `Net Cost to Rent (${years} yrs)`,
        value: money(netRentCost),
        color: 'neutral' as const,
      },
      {
        id: 'homeEquity',
        label: 'Projected Home Equity (before selling costs)',
        value: `$${fmt(homeEquity)}`,
        color: 'positive' as const,
      },
      {
        id: 'futureHomeValue',
        label: 'Future Home Value',
        value: `$${fmt(futureHomeValue)}`,
        color: 'positive' as const,
      },
      {
        id: 'totalMonthlyBuy',
        label: 'Total Monthly Buy Cost',
        value: `$${fmt(monthlyOwnership)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'closingCostsLine',
        label: 'Estimated Closing Costs',
        value: `$${fmt(closingCosts)}`,
        color: 'negative' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RentVsBuyPanel, { values, results });
  },

  educational: {
    formula: 'Net Buy Cost = Down + Closing + (P&I + Tax + Insurance + Maintenance + PMI) − (Sale Price × (1 − Selling Costs) − Loan Balance)   |   Net Rent Cost = Rent + Renter\'s Insurance − Growth on (Down + Closing) at 7%',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="60" width="170" height="230" fill="var(--svg-e0e7ff)" stroke="var(--svg-3b82f6)" stroke-width="1" rx="8"/><text x="125" y="90" text-anchor="middle" font-size="14" fill="var(--svg-3b82f6)" font-weight="bold">Rent</text><text x="125" y="130" text-anchor="middle" font-size="12" fill="var(--svg-333333)">$1,500/mo</text><text x="125" y="155" text-anchor="middle" font-size="11" fill="var(--svg-666666)">No equity</text><text x="125" y="175" text-anchor="middle" font-size="11" fill="var(--svg-666666)">No maintenance</text><text x="125" y="230" text-anchor="middle" font-size="13" fill="var(--svg-333333)">10yr Cost: $180K</text><rect x="230" y="60" width="170" height="230" fill="var(--svg-ede9fe)" stroke="var(--svg-8b5cf6)" stroke-width="1" rx="8"/><text x="315" y="90" text-anchor="middle" font-size="14" fill="var(--svg-8b5cf6)" font-weight="bold">Buy</text><text x="315" y="130" text-anchor="middle" font-size="12" fill="var(--svg-333333)">$2,200/mo</text><text x="315" y="155" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Build equity</text><text x="315" y="175" text-anchor="middle" font-size="11" fill="var(--svg-666666)">+ maintenance</text><text x="315" y="230" text-anchor="middle" font-size="13" fill="var(--svg-333333)">10yr Cost: $264K</text><text x="315" y="250" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)">+ Equity: $80K</text></svg>',
      alt: 'Side-by-side comparison of renting versus buying costs over 10 years',
      caption: 'Rent vs buy — compare monthly payments, equity building, and lifetime costs',
    },
    formulaDescription:
      'Compares the full lifetime cost of buying a home versus renting over your intended stay. Accounts for the initial cash outlay (down payment and closing costs), recurring ownership costs (mortgage principal and interest, property taxes, maintenance, insurance), and the equity built through loan paydown and property appreciation. On the renting side, tracks monthly rent payments that typically increase each year plus renter\'s insurance, less the growth the down payment and closing costs would have earned if a renter invested them at 7%. Buying is charged 6% selling costs when you sell, homeowner\'s insurance of 0.5% of value, and PMI below 20% down. The break-even year is when the cumulative cost of owning finally drops below the cumulative cost of renting.',
    variables: [
      { symbol: 'Break-Even', name: 'Break-Even Point', description: 'The year at which buying becomes cheaper than renting cumulatively. Beyond this point, buying saves money over renting for the same period.' },
      { symbol: 'Net Cost to Own vs Rent', name: 'Net Cost Comparison', description: 'Net Buy Cost = all ownership payments minus equity recovered. Net Rent Cost = all rent payments plus renter\'s insurance, minus what the down payment would have earned if invested. Buying is cheaper long-term; renting wins for short stays due to high transaction costs.' },
      { symbol: 'Home Equity', name: 'Equity at Exit', description: 'Future home value minus remaining mortgage balance when you sell. The main financial benefit of homeownership over renting.' },
    ],
    howToUse: [
      'Enter the home price, down payment percentage, mortgage rate, and expected annual appreciation rate. These are the core buying assumptions that drive the entire analysis.',
      'Set closing costs (default 3%), annual property tax rate, and maintenance percentage. If unsure, keep the defaults which reflect national averages for typical single-family homes.',
      'Enter your current monthly rent, expected annual rent increase percentage, and renter\'s insurance premium. Rent increases compound year over year just like investment returns.',
      'Adjust the "Years You Plan to Stay" slider from 1 to 30 years and watch how the break-even indicator shifts. This is the most sensitive input in the model.',
      'Compare the Net Cost to Buy versus Net Cost to Rent results. Buying usually needs a longer stay to win and renting wins for short stays; how long depends mostly on the price-to-rent ratio, appreciation and the 7% investment return credited to renting, so read the break-even year the calculator gives you rather than a rule of thumb.',
      'If your break-even year is close to your planned stay length, try small adjustments to each input to test how sensitive the result is to your assumptions.',
    ],
    explanation:
      'Deciding whether to buy or rent is one of the most consequential financial decisions most households face. The core insight is straightforward: buying requires a large upfront investment (down payment and closing costs) but builds equity over time through loan paydown and appreciation. Renting requires minimal upfront cash and provides predictable monthly costs, but every dollar spent on rent is gone forever with no asset value created. A commonly cited rule of thumb is that buying needs roughly 5 to 7 years to beat renting. However, local market conditions dramatically affect this number. In high-cost coastal cities like San Francisco, Los Angeles, or New York, where home prices are high relative to local rents, the break-even may stretch to 10 years or more. In lower-cost Midwestern or Southern markets, buying can be cheaper than renting almost from the start. Edge cases worth considering: if you expect to move within 3 years, renting is almost always superior because transaction costs consumed at purchase and sale will eat any equity gains. If interest rates drop after you buy, refinancing can strengthen the buy-side economics. The calculator models the opportunity cost of the down payment (a 7% investment return), selling costs (6%), homeowner\'s insurance and PMI, but not the mortgage interest tax deduction, which can shift the comparison.',
    faqs: [
      {
        question: 'What is the break-even point?',
        answer: 'The break-even year is when the cumulative net cost of buying equals the cumulative cost of renting. After that year, buying becomes the cheaper option. It often falls somewhere around 5 to 7 years, but varies widely by location and market conditions.',
      },
      {
        question: 'Does this include opportunity cost of the down payment?',
        answer: 'Yes. The renting side is credited with the growth the down payment and closing costs would have earned if invested at 7% a year, the same assumption used by our finance Rent vs Buy calculator, so both give identical answers for identical inputs.',
      },
      {
        question: 'How does appreciation affect the break-even?',
        answer: 'Higher appreciation shortens the break-even period because your equity grows faster. In booming markets like Austin or Phoenix during growth cycles, buying can win even for short stays of 3-4 years. In flat or declining markets, renting may remain cheaper indefinitely.',
      },
      {
        question: 'What closing costs are typical for buyers?',
        answer: 'Buyer closing costs are typically 2-5% of the purchase price. The default in this calculator is 3%. They include origination fees, appraisal, title insurance, escrow, and recording fees. These one-time costs are a primary reason buying is expensive over short time horizons.',
      },
      {
        question: 'What if I plan to move in exactly four to five years?',
        answer: 'That timeline falls right at the typical break-even range. We recommend stress-testing with conservative assumptions: lower appreciation of 1-2%, higher maintenance of 2-2.5%, and standard closing costs. If the cost margin between buying and renting is thin, renting is often the safer bet given its flexibility.',
      },
      {
        question: 'Does the calculator account for HOA fees or special assessments?',
        answer: 'This version does not include HOA fees as a separate line item. If your target property has significant HOA dues, consider increasing the maintenance percentage from the default 1.5% to 2.5-3% to roughly capture those additional recurring costs in the comparison.',
      },
    ],
    citations: [
      { source: 'National Association of Realtors', url: 'https://www.nar.realtor/research-and-statistics' },
      { source: 'Zillow Research', url: 'https://www.zillow.com/research/' },
    ],
  },
};

export default rentVsBuyConfig;
