import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RentVsBuyPanel from './RentVsBuyPanel';

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
      min: 0,
      max: 20,
      step: 0.1,
      required: true,
      helpText: 'Expected annual increase in home value (national avg ~3%)',
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
    const homePrice = parseFloat(values.homePrice);
    const downPct = parseFloat(values.downPaymentPct) / 100;
    const annualRate = parseFloat(values.interestRate) / 100;
    const closingCostsPct = (parseFloat(values.closingCostsPct) || 3) / 100;
    const propertyTaxPct = (parseFloat(values.propertyTaxPct) || 1.2) / 100;
    const maintenancePct = (parseFloat(values.maintenancePct) || 1.5) / 100;
    const appreciation = parseFloat(values.homeAppreciation) / 100;
    const monthlyRent = parseFloat(values.monthlyRent);
    const rentIncrease = (parseFloat(values.rentIncrease) || 3) / 100;
    const rentersInsuranceAnnual = parseFloat(values.rentersInsurance) || 200;
    const years = parseFloat(values.years);

    if ([homePrice, downPct, annualRate, monthlyRent, years, appreciation].some(isNaN)) return [];
    if (homePrice <= 0 || years <= 0) return [];

    const downPayment = homePrice * downPct;
    const principal = homePrice - downPayment;
    const closingCosts = homePrice * closingCostsPct;
    const monthlyRate = annualRate / 12;
    const numPayments30 = 30 * 12;

    let monthlyMortgage: number;
    if (monthlyRate === 0) {
      monthlyMortgage = principal / numPayments30;
    } else {
      monthlyMortgage =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments30))) /
        (Math.pow(1 + monthlyRate, numPayments30) - 1);
    }

    const propertyTaxMonthly = (homePrice * propertyTaxPct) / 12;
    const maintenanceMonthly = (homePrice * maintenancePct) / 12;
    const homeInsuranceMonthly = (homePrice * 0.005) / 12;

    let totalBuyPaid = downPayment + closingCosts;
    let remainingBalance = principal;

    for (let i = 0; i < years * 12; i++) {
      const interest = remainingBalance * monthlyRate;
      const principalPaid = monthlyMortgage - interest;
      remainingBalance = Math.max(remainingBalance - principalPaid, 0);
      totalBuyPaid += monthlyMortgage + propertyTaxMonthly + maintenanceMonthly + homeInsuranceMonthly;
    }

    const futureHomeValue = homePrice * Math.pow(1 + appreciation, years);
    const homeEquity = futureHomeValue - remainingBalance;
    const netBuyCost = totalBuyPaid - homeEquity;

    let totalRentPaid = 0;
    let currentRent = monthlyRent;
    for (let yr = 0; yr < years; yr++) {
      totalRentPaid += currentRent * 12 + rentersInsuranceAnnual;
      currentRent *= (1 + rentIncrease);
    }
    const netRentCost = totalRentPaid;

    const breakEvenYear = (() => {
      let buyRunning = downPayment + closingCosts;
      let rentRunning = 0;
      let bal = principal;
      let rent = monthlyRent;

      for (let yr = 1; yr <= 30; yr++) {
        for (let m = 0; m < 12; m++) {
          const interest = bal * monthlyRate;
          const principalPaid = monthlyMortgage - interest;
          bal = Math.max(bal - principalPaid, 0);
          buyRunning += monthlyMortgage + propertyTaxMonthly + maintenanceMonthly + homeInsuranceMonthly;
        }
        rentRunning += rent * 12 + rentersInsuranceAnnual;
        rent *= (1 + rentIncrease);
        const fv = homePrice * Math.pow(1 + appreciation, yr);
        const equity = fv - bal;
        const netBuy = buyRunning - equity;
        if (netBuy <= rentRunning) return yr;
      }
      return null;
    })();

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const buyWins = netBuyCost < netRentCost;

    const breakEvenLabel = breakEvenYear
      ? `Break-even at year ${breakEvenYear}`
      : 'Buying does not break even within 30 years';

    return [
      {
        id: 'breakEven',
        label: breakEvenLabel,
        value: breakEvenYear
          ? `Buy if staying > ${breakEvenYear} ${breakEvenYear === 1 ? 'year' : 'years'}`
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
        value: `$${fmt(netBuyCost)}`,
        color: 'neutral' as const,
      },
      {
        id: 'netRentCost',
        label: `Net Cost to Rent (${years} yrs)`,
        value: `$${fmt(netRentCost)}`,
        color: 'neutral' as const,
      },
      {
        id: 'homeEquity',
        label: 'Projected Home Equity',
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
        value: `$${fmt(monthlyMortgage + propertyTaxMonthly + maintenanceMonthly + homeInsuranceMonthly)}/mo`,
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
    formula: 'Net Buy Cost = (Mortgage + Tax + Maintenance + Insurance) × Months + Down + Closing − Home Equity',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="60" width="170" height="230" fill="var(--svg-e0e7ff)" stroke="var(--svg-3b82f6)" stroke-width="1" rx="8"/><text x="125" y="90" text-anchor="middle" font-size="14" fill="var(--svg-3b82f6)" font-weight="bold">Rent</text><text x="125" y="130" text-anchor="middle" font-size="12" fill="var(--svg-333333)">$1,500/mo</text><text x="125" y="155" text-anchor="middle" font-size="11" fill="var(--svg-666666)">No equity</text><text x="125" y="175" text-anchor="middle" font-size="11" fill="var(--svg-666666)">No maintenance</text><text x="125" y="230" text-anchor="middle" font-size="13" fill="var(--svg-333333)">10yr Cost: $180K</text><rect x="230" y="60" width="170" height="230" fill="var(--svg-ede9fe)" stroke="var(--svg-8b5cf6)" stroke-width="1" rx="8"/><text x="315" y="90" text-anchor="middle" font-size="14" fill="var(--svg-8b5cf6)" font-weight="bold">Buy</text><text x="315" y="130" text-anchor="middle" font-size="12" fill="var(--svg-333333)">$2,200/mo</text><text x="315" y="155" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Build equity</text><text x="315" y="175" text-anchor="middle" font-size="11" fill="var(--svg-666666)">+ maintenance</text><text x="315" y="230" text-anchor="middle" font-size="13" fill="var(--svg-333333)">10yr Cost: $264K</text><text x="315" y="250" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)">+ Equity: $80K</text></svg>',
      alt: 'Side-by-side comparison of renting versus buying costs over 10 years',
      caption: 'Rent vs buy — compare monthly payments, equity building, and lifetime costs',
    },
    formulaDescription:
      'Compares the full lifetime cost of buying a home versus renting over your intended stay. Accounts for the initial cash outlay (down payment and closing costs), recurring ownership costs (mortgage principal and interest, property taxes, maintenance, insurance), and the equity built through loan paydown and property appreciation. On the renting side, tracks monthly rent payments that typically increase each year plus renter\'s insurance. The break-even year is when the cumulative cost of owning finally drops below the cumulative cost of renting.',
    variables: [
      { symbol: 'Break-Even', name: 'Break-Even Point', description: 'The year at which buying becomes cheaper than renting cumulatively. Beyond this point, buying saves money over renting for the same period.' },
      { symbol: 'Net Cost to Own vs Rent', name: 'Net Cost Comparison', description: 'Net Buy Cost = all ownership payments minus equity recovered. Net Rent Cost = all rent payments plus insurance (no equity). Buying is cheaper long-term; renting wins for short stays due to high transaction costs.' },
      { symbol: 'Home Equity', name: 'Equity at Exit', description: 'Future home value minus remaining mortgage balance when you sell. The main financial benefit of homeownership over renting.' },
    ],
    howToUse: [
      'Enter the home price, down payment percentage, mortgage rate, and expected annual appreciation rate. These are the core buying assumptions that drive the entire analysis.',
      'Set closing costs (default 3%), annual property tax rate, and maintenance percentage. If unsure, keep the defaults which reflect national averages for typical single-family homes.',
      'Enter your current monthly rent, expected annual rent increase percentage, and renter\'s insurance premium. Rent increases compound year over year just like investment returns.',
      'Adjust the "Years You Plan to Stay" slider from 1 to 30 years and watch how the break-even indicator shifts. This is the most sensitive input in the model.',
      'Compare the Net Cost to Buy versus Net Cost to Rent results. Buying wins over longer horizons of 7+ years; renting wins decisively for stays under 3-4 years.',
      'If your break-even year is close to your planned stay length, try small adjustments to each input to test how sensitive the result is to your assumptions.',
    ],
    explanation:
      'Deciding whether to buy or rent is one of the most consequential financial decisions most households face. The core insight is straightforward: buying requires a large upfront investment (down payment and closing costs) but builds equity over time through loan paydown and appreciation. Renting requires minimal upfront cash and provides predictable monthly costs, but every dollar spent on rent is gone forever with no asset value created. Nationally, the break-even point when buying becomes cheaper than renting falls between 4 and 7 years. However, local market conditions dramatically affect this number. In high-cost coastal cities like San Francisco, Los Angeles, or New York, where home prices are high relative to local rents, the break-even may stretch to 10 years or more. In lower-cost Midwestern or Southern markets, buying can be cheaper than renting almost from the start. Edge cases worth considering: if you expect to move within 3 years, renting is almost always superior because transaction costs consumed at purchase and sale will eat any equity gains. If interest rates drop after you buy, refinancing can strengthen the buy-side economics. The calculator does not currently model the opportunity cost of using your down payment funds instead of investing them in the stock market, nor does it account for the mortgage interest tax deduction, both factors that can shift the comparison materially.',
    faqs: [
      {
        question: 'What is the break-even point?',
        answer: 'The break-even year is when the cumulative net cost of buying equals the cumulative cost of renting. After that year, buying becomes the cheaper option. It typically falls between 4 and 7 years for most U.S. markets but can vary widely by location and market conditions.',
      },
      {
        question: 'Does this include opportunity cost of the down payment?',
        answer: 'This calculator does not model investing the down payment in the stock market as an alternative. A full analysis would compare home equity growth versus investment returns on that same capital over the same period, including dividend reinvestment.',
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
