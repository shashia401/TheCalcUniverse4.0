import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RentVsBuyPanel from './RentVsBuyPanel';
import { numOr, simulateRentVsBuy, firstBuyingWinsYear, RvbParams } from './model';


// ─── Config ───────────────────────────────────────────────────────────────────

const rentVsBuyFinanceConfig: CalculatorConfig = {
  inputs: [
    // ── Renting Group ──
    {
      id: '_rentHeader',
      label: '── Renting ──',
      type: 'text',
      placeholder: '',
      required: false,
    },
    {
      id: 'monthlyRent',
      label: 'Current Monthly Rent',
      type: 'number',
      prefix: '$',
      placeholder: '2,200',
      required: true,
    },
    {
      id: 'annualRentIncrease',
      label: 'Annual Rent Increase Rate',
      type: 'number',
      unit: '%',
      placeholder: '3',
      step: 0.1,
      helpText: 'Typical US rent growth is a few percent a year. Blank uses 3%; enter 0 if rent is fixed.',
    },
    {
      id: 'rentersInsurance',
      label: "Annual Renter's Insurance",
      type: 'number',
      prefix: '$',
      placeholder: '180',
      helpText: 'Typically $15–$25/month.',
    },

    // ── Buying Group ──
    {
      id: '_buyHeader',
      label: '── Buying ──',
      type: 'text',
      placeholder: '',
      required: false,
    },
    {
      id: 'homePrice',
      label: 'Home Purchase Price',
      type: 'number',
      prefix: '$',
      placeholder: '400,000',
      required: true,
    },
    {
      id: 'downPaymentPct',
      label: 'Down Payment',
      type: 'number',
      unit: '%',
      placeholder: '10',
      step: 0.5,
      helpText: '20%+ avoids PMI on conventional loans.',
    },
    {
      id: 'mortgageRate',
      label: 'Mortgage Interest Rate',
      type: 'number',
      unit: '%',
      placeholder: '6.75',
      min: 0,
      max: 100,
      step: 0.01,
      required: true,
    },
    {
      id: 'closingCostsPct',
      label: 'Closing Costs',
      type: 'number',
      unit: '%',
      placeholder: '3',
      step: 0.1,
      helpText: 'Buyer closing costs typically 2–5% of home price. Includes title, escrow, lender fees.',
    },
    {
      id: 'propertyTaxRate',
      label: 'Annual Property Tax Rate',
      type: 'number',
      unit: '%',
      placeholder: '1.2',
      step: 0.01,
      helpText: 'Varies by location; the US effective average is roughly 1%. Check your county assessor.',
    },
    {
      id: 'maintenancePct',
      label: 'Annual Maintenance & Upkeep',
      type: 'number',
      unit: '%',
      placeholder: '1.5',
      step: 0.1,
      helpText: 'Rule of thumb: 1–2% of home value per year. Older homes trend higher.',
    },
    {
      id: 'homeInsurancePct',
      label: "Annual Homeowner's Insurance",
      type: 'number',
      unit: '%',
      placeholder: '0.5',
      min: 0,
      max: 5,
      step: 0.05,
      helpText: "Homeowner's insurance as % of home value per year. Blank uses 0.5%; enter 0 to exclude it.",
    },
    {
      id: 'homeAppreciationRate',
      label: 'Annual Home Appreciation Rate',
      type: 'number',
      unit: '%',
      placeholder: '3',
      step: 0.1,
      helpText:
        'National long-run average: ~3–4%/year. Hot markets have exceeded this; recessions have caused negative returns.',
    },
    {
      id: 'sellingCostsPct',
      label: 'Home Selling Costs (when you sell)',
      type: 'number',
      unit: '%',
      placeholder: '6',
      step: 0.1,
      helpText: 'Realtor commissions + transfer taxes typically 5–8% of sale price.',
    },
    {
      id: 'pmiRate',
      label: 'PMI Rate (if down payment < 20%)',
      type: 'number',
      unit: '%',
      placeholder: '0.7',
      step: 0.05,
      helpText:
        'Private Mortgage Insurance: typically 0.5–1.5%/year of loan amount. Auto-drops when LTV reaches 80%.',
    },

    // ── Timeline Group ──
    {
      id: '_timelineHeader',
      label: '── Timeline ──',
      type: 'text',
      placeholder: '',
      required: false,
    },
    {
      id: 'yearsToStay',
      label: 'Years You Plan to Stay',
      type: 'number',
      placeholder: '7',
      min: 1,
      max: 30,
      step: 1,
      required: true,
      helpText:
        'This is the most critical variable. Try different values to find your break-even point.',
    },
  ],

  calculate: (values) => {
    // Blank -> default; an explicit 0 is respected (0% appreciation, fixed rent, no PMI ...).
    const monthlyRent = parseFloat(values.monthlyRent);
    const homePrice = parseFloat(values.homePrice);
    const mortgageRate = parseFloat(values.mortgageRate) / 100;
    if ([monthlyRent, homePrice, mortgageRate].some(isNaN) || homePrice <= 0 || monthlyRent <= 0) return [];

    const params: RvbParams = {
      monthlyRent,
      rentIncrease: numOr(values.annualRentIncrease, 3) / 100,
      rentersInsurance: numOr(values.rentersInsurance, 180),
      homePrice,
      downPaymentPct: Math.min(1, Math.max(0, numOr(values.downPaymentPct, 10) / 100)),
      mortgageRate,
      closingCostsPct: numOr(values.closingCostsPct, 3) / 100,
      propertyTaxRate: numOr(values.propertyTaxRate, 1.2) / 100,
      maintenancePct: numOr(values.maintenancePct, 1.5) / 100,
      homeInsurancePct: numOr(values.homeInsurancePct, 0.5) / 100,
      appreciation: numOr(values.homeAppreciationRate, 3) / 100,
      sellingCostsPct: numOr(values.sellingCostsPct, 6) / 100,
      pmiRate: numOr(values.pmiRate, 0.7) / 100,
      investReturn: 0.07, // opportunity-cost rate
    };
    const yearsToStay = Math.min(30, Math.max(1, Math.round(numOr(values.yearsToStay, 7))));

    const rows = simulateRentVsBuy(params);
    const downPayment = homePrice * params.downPaymentPct;
    const closingCosts = homePrice * params.closingCostsPct;
    const loanAmount = homePrice - downPayment;
    const chartData = rows.map((r) => ({
      year: r.year,
      cumulativeRentCost: Math.round(r.netRentCost),
      cumulativeBuyCost: Math.round(r.netBuyCost),
    }));
    // 1 = buying already cheaper after year one; -1 = never within 30 years
    const breakEvenYear = firstBuyingWinsYear(rows);

    // ── Horizon results ───────────────────────────────────────────────────────
    const at = rows[yearsToStay - 1];
    const buyingCostAtHorizon = at.netBuyCost;
    const rentingCostAtHorizon = at.netRentCost;
    const cheaperOption = buyingCostAtHorizon < rentingCostAtHorizon ? 'buy' : 'rent';
    const difference = Math.abs(buyingCostAtHorizon - rentingCostAtHorizon);
    const homeValueAtHorizon = at.homeValue;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const breakEvenDisplay =
      breakEvenYear === 1
        ? 'Buying always cheaper'
        : breakEvenYear === -1
        ? 'No break-even within 30 years'
        : `${breakEvenYear} years`;

    return [
      // 1. Break-even
      {
        id: 'breakEvenResult',
        label: 'Break-Even Point',
        value: breakEvenDisplay,
        highlight: true,
        color: 'neutral' as const,
        interpretation: `Buying carries big upfront costs (down payment, closing) that renting doesn't, so it only wins if you stay long enough to spread them out. ${breakEvenYear > 1 ? `Past ${breakEvenYear} years buying pulls ahead; sell sooner and renting likely costs less.` : 'Here buying comes out ahead quickly.'} This assumes steady rent and home-price growth — shift either and the break-even moves.`,
      },

      // 2. Verdict at selected horizon
      {
        id: 'selectedYearVerdict',
        label: `After ${yearsToStay} Year${yearsToStay !== 1 ? 's' : ''}, ${cheaperOption === 'buy' ? 'Buying' : 'Renting'} Is Cheaper By`,
        value: `$${fmt(difference)}`,
        color: cheaperOption === 'buy' ? ('positive' as const) : ('negative' as const),
      },

      // 3. Net cost to buy
      {
        id: 'buyingTotalCost',
        label: `Total Net Cost of Buying (${yearsToStay} yr${yearsToStay !== 1 ? 's' : ''})`,
        value: `$${fmt(buyingCostAtHorizon)}`,
        color: 'neutral' as const,
      },

      // 4. Net cost to rent
      {
        id: 'rentingTotalCost',
        label: `Total Cost of Renting (${yearsToStay} yr${yearsToStay !== 1 ? 's' : ''})`,
        value: `$${fmt(rentingCostAtHorizon)}`,
        color: 'neutral' as const,
      },

      // 5. Home value at horizon
      {
        id: 'homeValueAtHorizon',
        label: 'Projected Home Value at Sale',
        value: `$${fmt(homeValueAtHorizon)}`,
        color: 'positive' as const,
      },

      // 6. Data blob for panel
      {
        id: '_rvbData',
        label: '_rvbData',
        value: JSON.stringify({
          breakEvenYear,
          yearRange: 30,
          chartData,
          selectedYear: yearsToStay,
          buyingCostAtHorizon,
          rentingCostAtHorizon,
          difference,
          cheaperOption,
          homePrice,
          downPayment,
          closingCosts,
          loanAmount,
          // For side-by-side breakdown
          monthlyRent,
          annualRentIncrease: params.rentIncrease * 100,
          rentersInsurance: params.rentersInsurance,
          mortgageRate: mortgageRate * 100,
          propertyTaxRate: params.propertyTaxRate * 100,
          maintenancePct: params.maintenancePct * 100,
          pmiRate: params.pmiRate * 100,
          downPaymentPct: params.downPaymentPct * 100,
          sellingCostsPct: params.sellingCostsPct * 100,
          homeAppreciationRate: params.appreciation * 100,
          homeValueAtHorizon,
          // Cumulative components at the chosen horizon, straight from the model (the panel never re-derives them)
          breakdown: {
            rentOnly: at.rentOnly,
            rentersInsurance: at.rentersInsurancePaid,
            investmentGain: at.investmentGain,
            mortgagePaid: at.mortgagePaid,
            tax: at.taxPaid,
            insurance: at.insurancePaid,
            maintenance: at.maintenancePaid,
            pmi: at.pmiPaid,
            saleProceeds: at.saleProceeds,
            upfront: downPayment + closingCosts,
          },
        }),
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RentVsBuyPanel, { values, results });
  },

  educational: {
    formula: 'Net Cost Buy = Costs Paid − Sale Proceeds | Net Cost Rent = Total Rent − Investment Gains on Down Payment',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/><text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Rent vs. Buy: Break-Even Point</text><line x1="30" y1="35" x2="290" y2="35" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="72" x2="290" y2="72" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="109" x2="290" y2="109" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="146" x2="290" y2="146" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="35" x2="30" y2="160" stroke="var(--svg-cbd5e1)" stroke-width="1"/><path d="M 40,95 L 80,100 L 120,108 L 160,118 L 200,130 L 240,144 L 280,160" fill="none" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linecap="round"/><text x="285" y="158" font-size="8" fill="var(--svg-ef4444)" font-weight="bold">Rent Cost</text><path d="M 40,55 L 80,62 L 120,72 L 160,85 L 200,100 L 240,118 L 280,140" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linecap="round"/><text x="285" y="138" font-size="8" fill="var(--svg-3b82f6)" font-weight="bold">Buy Cost</text><circle cx="190" cy="96" r="4" fill="var(--svg-f59e0b)"/><text x="190" y="88" text-anchor="middle" font-size="8" fill="var(--svg-f59e0b)" font-weight="bold">Break-Even ~5yr</text><text x="160" y="180" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Years Holding the Property</text><text x="50" y="177" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">1</text><text x="96" y="177" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">3</text><text x="160" y="177" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">5</text><text x="210" y="177" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">7</text><text x="260" y="177" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">10</text><text x="18" y="105" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)" transform="rotate(-90,18,105)">Cumulative Cost</text></svg>',
      alt: 'Chart showing renting cost rising over time while buying cost is initially higher but rises more slowly, with a break-even point at approximately year 5',
      caption: 'Buying has higher upfront costs from closing and down payment but builds equity, so the cumulative cost grows more slowly than renting over time',
    },
    formulaDescription:
      'This calculator compares the true total cost of renting versus buying over your chosen time horizon. The buying path tracks principal and interest, property taxes, homeowner\'s insurance, maintenance, PMI, and closing costs, then subtracts the net proceeds from selling the home. The renting path tracks all rent payments (adjusted for annual increases) and renters insurance, then subtracts the investment gains your down payment and closing costs would have earned if invested in the stock market at 7%. The break-even year is when cumulative buying costs first become lower than cumulative renting costs. Simplifications: the mortgage is a 30-year fixed loan, property tax stays at the purchase-price level (it does not rise with appreciation), mortgage-interest and property-tax deductions are ignored, and any monthly cash-flow difference between owning and renting is not invested.',
    variables: [
      {
        symbol: 'Break-Even',
        name: 'Break-Even Year',
        description: 'The number of years after which buying becomes cheaper than renting on a cumulative net-cost basis. If you stay longer than this, buying wins financially. If you move sooner, renting wins.',
      },
      {
        symbol: 'Opportunity Cost',
        name: 'Down Payment Opportunity Cost',
        description: 'The money you would have earned by investing your down payment and closing costs in stocks (assumed 7% return) instead of using them for a home purchase. This is the primary financial advantage of renting.',
      },
      {
        symbol: 'Home Equity',
        name: 'Equity Accumulation',
        description: 'The wealth you build through principal paydown and home appreciation, minus selling costs. This is the primary financial advantage of buying.',
      },
      {
        symbol: 'Transaction Costs',
        name: 'Closing & Selling Expenses',
        description: 'Buying typically costs 3–5% in closing costs upfront and 5–8% in selling costs at exit. These transaction costs create a significant upfront hurdle — the main reason buying only wins if you stay long enough to recover them.',
      },
    ],
    howToUse: [
      'Enter the home price, down payment percentage, mortgage rate, and closing costs for the buy scenario.',
      'Input your monthly rent, expected annual rent increase rate, and renters insurance for the rent scenario.',
      'Set the property tax rate, maintenance percentage, and home appreciation rate (national averages are shown as defaults).',
      'Choose your expected holding period — try different values to see how the break-even point shifts.',
      'Compare the two paths at different time horizons: the chart shows cumulative costs year by year, and the break-even year tells you which choice is better for your specific timeline.',
    ],
    commonUses: [
      'Compare the total lifetime cost of renting versus buying a home over different time horizons to find your financial break-even point.',
      'Understand how long you need to stay in a home for the equity and appreciation benefits of buying to outweigh upfront transaction costs.',
      'Model how changing home prices, mortgage rates, and rent increases affect whether renting or buying is the better financial decision.',
    ],
    explanation:
      'The rent vs. buy decision is one of the most significant financial choices most people make. This calculator models the true total cost of each path, accounting for: opportunity cost of the down payment (invested in stocks instead), rent increases over time, building home equity through principal paydown and appreciation, PMI elimination when LTV hits 80%, and net sale proceeds after selling costs at your chosen time horizon. The break-even point is the year when buying becomes cheaper than renting on a cumulative net-cost basis. A commonly cited rule of thumb is that buying needs roughly 5-7 years to beat renting, but it varies dramatically with home prices, rents, and mortgage rates, and in high-cost markets it can take longer. The key insight: transaction costs (closing costs at purchase, ~6% selling costs at sale) are the biggest barrier to short-term buying. If you might move within 3 years, renting almost always wins financially. If you will stay 7+ years, buying typically builds more wealth.',
    faqs: [
      {
        question: 'How is the break-even year calculated?',
        answer:
          'We model two paths side by side for each year. The renting path tracks all rent paid, adjusted for annual increases. The buying path tracks total costs (P&I, taxes, maintenance, PMI, closing costs) minus net home equity gained (sale proceeds at that year). We also account for the opportunity cost of your down payment — if you rented, you could invest that cash in stocks earning 7%. The break-even year is when cumulative buying costs first fall below cumulative renting costs. This is the point at which your home equity and appreciation have overcome the upfront transaction costs of buying.',
      },
      {
        question: 'Should I factor in tax deductions for mortgage interest?',
        answer:
          'The calculator does not include mortgage interest deductions because the 2026 standard deduction ($32,200 for married couples filing jointly, $16,100 single) means most filers do not itemize. If you do itemize, your true buying cost will be lower than calculated here. Consult a tax advisor for personalized analysis. The mortgage interest deduction is most valuable in the first years of the loan when interest payments are highest, and for higher-priced homes with larger mortgages.',
      },
      {
        question: 'What if I am unsure how long I will stay?',
        answer:
          'The break-even year is the key number. If you are fairly confident you will stay longer than the break-even point, buying likely makes financial sense. If your timeline is uncertain, the flexibility of renting (no selling costs, no maintenance, easy to move) has real value that this calculator does not capture. Consider a "worst-case" scenario: if you had to move in 2 years, could you absorb the loss? This risk analysis is often more important than the financial comparison itself.',
      },
      {
        question: 'Does the calculator include HOA fees?',
        answer:
          'HOA fees are not directly included in the buy scenario inputs, but you can factor them into your maintenance percentage or simply acknowledge that the buying total cost may be slightly higher if HOA fees are significant. In many markets, HOA fees are $200-$500/month, which should be considered when comparing renting to buying — especially in condos and planned communities.',
      },
      {
        question: 'What if home prices drop after I buy?',
        answer:
          'A market downturn shortly after purchase can leave you "underwater" (owing more than the home is worth). This calculator assumes steady annual appreciation, but actual returns are uneven. If you might need to sell within 3–5 years, a price drop could mean a significant loss. Stress-test by trying 0% or negative appreciation to see how long it would take to recover.',
      },
    ],
  citations: [
    { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/r/rent-vs-buy.asp' },
  ],
  },
};

export default rentVsBuyFinanceConfig;
