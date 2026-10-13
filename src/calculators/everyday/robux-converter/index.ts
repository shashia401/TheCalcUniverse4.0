import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RobuxConverterPanel from './RobuxConverterPanel';
import { PRICES_NOTE, cheapestCover, findBestPackage, packagesFor, singlePackPurchase } from './robuxMath';

const PACKAGE_OPTIONS = [
  { label: '400 units', value: '400' },
  { label: '440 units (Premium)', value: '440' },
  { label: '800 units', value: '800' },
  { label: '880 units (Premium)', value: '880' },
  { label: '1000 units (V-Bucks)', value: '1000' },
  { label: '1700 units', value: '1700' },
  { label: '1870 units (Premium)', value: '1870' },
  { label: '2800 units (V-Bucks)', value: '2800' },
  { label: '4500 units', value: '4500' },
  { label: '4950 units (Premium)', value: '4950' },
  { label: '5000 units (V-Bucks)', value: '5000' },
  { label: '10000 units', value: '10000' },
  { label: '11000 units (Premium)', value: '11000' },
  { label: '13500 units (V-Bucks)', value: '13500' },
];

const robuxConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'currencyType',
      label: 'Currency Type',
      type: 'select',
      required: true,
      helpText: 'Choose Robux for standard pricing, Robux (Premium) for the 10% subscriber bonus, or V-Bucks for Fortnite currency.',
      options: [
        { label: 'Robux', value: 'Robux' },
        { label: 'V-Bucks', value: 'V-Bucks' },
        { label: 'Robux (Premium)', value: 'Roblox Premium' },
      ],
    },
    {
      id: 'virtualCurrency',
      label: 'Amount of Virtual Currency',
      type: 'number',
      placeholder: '1000',
      min: 1,
      max: 1000000,
      step: 100,
      required: true,
      inputMode: 'numeric',
      helpText: 'How many Robux or V-Bucks do you want to get (at least)? Without a chosen package the calculator finds the cheapest mix of packs that reaches this amount.',
    },
    {
      id: 'calculationMode',
      label: 'Calculation Detail',
      type: 'select',
      required: false,
      defaultValue: 'basic',
      helpText: 'Basic shows the essential cost and best-value recommendation. Advanced adds a per-package cost breakdown for every available tier.',
      options: [
        { label: 'Basic (Cost + Best Value)', value: 'basic' },
        { label: 'Advanced (All Package Breakdown)', value: 'advanced' },
      ],
    },
    {
      id: 'packageType',
      label: 'Package (pricing tier)',
      type: 'select',
      required: false,
      helpText: 'Choose a specific package size to calculate cost using that tier. Shown only in Advanced mode for detailed price comparison.',
      options: PACKAGE_OPTIONS,
      showWhen: (values) => values.calculationMode === 'advanced',
    },
  ],
  calculate: (values) => {
    const amount = parseInt(values.virtualCurrency, 10);
    if (!Number.isFinite(amount) || amount <= 0) return [];
    const { packages, bonusPercent, display: displayCurrency } = packagesFor(values.currencyType || 'Robux');
    const chosen = values.packageType ? packages.find((p) => p.amount === parseInt(values.packageType, 10)) : undefined;

    const purchase = chosen ? singlePackPurchase(chosen, amount) : cheapestCover(packages, amount);
    const usdValue = purchase.cents / 100;
    const effectiveRate = usdValue / purchase.units;
    const bestPkg = findBestPackage(packages);
    const bestRate = bestPkg.cost / bestPkg.amount;
    const fmtMoney = (n: number) => n.toFixed(2);
    const mix = purchase.items.map((i) => `${i.count} × ${i.pkg.amount.toLocaleString('en-US')}`).join(' + ');
    const surplus = purchase.units - amount;

    return [
      {
        id: 'usdValue',
        label: `Estimated Cost (USD) for ${amount.toLocaleString('en-US')} ${displayCurrency}`,
        value: `$${fmtMoney(usdValue)}`,
        highlight: true,
        color: 'positive',
        interpretation: chosen
          ? `${mix} = ${purchase.units.toLocaleString('en-US')} ${displayCurrency}. ${PRICES_NOTE}`
          : `Cheapest mix of packs that reaches ${amount.toLocaleString('en-US')}: ${mix} = ${purchase.units.toLocaleString('en-US')} ${displayCurrency}. ${PRICES_NOTE}`,
        warning: 'Illustrative prices - confirm in the official store before buying.',
      },
      { id: 'effectiveRate', label: 'Effective Rate ($ per unit received)', value: `$${effectiveRate.toFixed(6)}`, color: 'neutral' },
      {
        id: 'bestPackage',
        label: 'Best Value Package (lowest $ per unit)',
        value: `${bestPkg.amount.toLocaleString('en-US')} for $${fmtMoney(bestPkg.cost)} ($${bestRate.toFixed(6)}/unit)`,
        color: 'positive',
      },
      {
        id: 'packageType',
        label: chosen ? 'Selected Package' : 'Packs Used',
        value: chosen ? `${chosen.amount.toLocaleString('en-US')} for $${fmtMoney(chosen.cost)}` : mix,
      },
      { id: 'unitsReceived', label: 'Units Received', value: `${purchase.units.toLocaleString('en-US')} (${surplus.toLocaleString('en-US')} more than requested)`, color: 'neutral' },
      { id: 'bonusPercent', label: 'Bonus', value: bonusPercent > 0 ? `${bonusPercent}% Premium Bonus Applied` : 'Standard (no bonus)' },
      { id: 'currencyType', label: 'Currency', value: displayCurrency },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RobuxConverterPanel, { values, results });
  },
  educational: {
    formula: 'USD Cost = ceil(Amount ÷ Package Size) × Package Price  |  Effective Rate = Price ÷ Units  |  Best Value = min(Price ÷ Units)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="100" width="130" height="140" fill="var(--svg-22c55e)" rx="8"/><text x="125" y="150" text-anchor="middle" font-size="18" fill="var(--svg-ffffff)">$</text><text x="125" y="180" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">USD</text><line x1="190" y1="170" x2="250" y2="170" stroke="var(--svg-666666)" stroke-width="2"/><polygon points="250,165 260,170 250,175" fill="var(--svg-666666)"/><rect x="270" y="100" width="130" height="140" fill="var(--svg-3b82f6)" rx="8"/><text x="335" y="150" text-anchor="middle" font-size="18" fill="var(--svg-ffffff)">R$</text><text x="335" y="180" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Robux</text></svg>',
      alt: 'Currency conversion flow diagram showing USD converting to Robux virtual currency',
      caption: 'Virtual currency is purchased in fixed package tiers. Larger packages offer a lower cost per unit of virtual currency.',
    },
    formulaDescription:
      'The total USD cost is calculated by determining how many packages are needed to meet or exceed the desired virtual currency amount, then multiplying by the selected package price. Since virtual currency is only sold in fixed package sizes (you cannot buy partial packages), the calculator rounds up the number of packages needed using the ceiling function. The effective rate is the price per single unit of virtual currency, computed by dividing the package price by the number of units it contains. A lower effective rate means better value per unit — larger packages almost always offer superior rates. Roblox Premium subscribers have received a 10 percent bonus on Robux purchases (the snapshot used here; check whether it still applies), improving the effective rate by giving more units for the same dollar amount. This tiered pricing structure is intentional game design that encourages higher-value single purchases.',
    variables: [
      { symbol: 'Amount', name: 'Virtual Currency Amount', description: 'The total number of Robux or V-Bucks you want to purchase. Enter the desired quantity and the calculator determines the most cost-effective way to acquire it.' },
      { symbol: 'Package Size', name: 'Package Unit Count', description: 'The number of virtual currency units in a single fixed-price purchase package. Available sizes range from 400 to 13,500 units depending on the currency type.' },
      { symbol: 'Package Price', name: 'USD Price', description: 'The US dollar cost of the selected package tier. Prices are an illustrative snapshot of US store listings (2025); they change over time, so confirm in the official store.' },
      { symbol: 'Effective Rate', name: 'Price Per Unit', description: 'The cost per single unit of virtual currency in USD. Computed as Package Price divided by Package Size. The package with the lowest effective rate gives you the most virtual currency per dollar spent.' },
      { symbol: 'Premium Bonus', name: 'Roblox Premium Bonus', description: 'Roblox Premium subscribers have received about 10 percent extra Robux on purchases (snapshot; check the current terms). A $99.99 package that normally gives 10,000 Robux gives 11,000 with Premium, reducing the effective rate from $0.0100 to $0.0091 per Robux.' },
    ],
    commonUses: [
      'Estimating the exact USD cost of purchasing a specific amount of Robux or V-Bucks for in-game spending, gifts, or allowances',
      'Comparing package pricing tiers side-by-side to find the best value per unit before making a purchase decision',
      'Estimating what a Roblox Premium purchase bonus is worth for your monthly Robux purchasing habits',
      'Budgeting children\'s gaming spending by calculating exactly how many packages are needed to reach a target virtual currency amount',
    ],
    quickReference: [
      { label: '400 Robux', value: '$4.99 ($0.0125/Robux)' },
      { label: '800 Robux', value: '$9.99 ($0.0125/Robux)' },
      { label: '1,700 Robux', value: '$19.99 ($0.0118/Robux)' },
      { label: '4,500 Robux', value: '$49.99 ($0.0111/Robux)' },
      { label: '10,000 Robux', value: '$99.99 ($0.0100/Robux — BEST VALUE)' },
      { label: 'Premium 10% Bonus', value: '~$0.0091/Robux on $99.99 tier' },
      { label: 'Best V-Bucks Deal', value: '13,500 for $89.99 ($0.0067/V-Buck)' },
      { label: 'V-Bucks 1,000', value: '$8.99 ($0.0090/V-Buck - highest rate)' },
    ],
    howToUse: [
      'Select your currency type: Robux for standard Roblox currency, Robux (Premium) for the 10% subscriber bonus, or V-Bucks for Fortnite.',
      'Enter the total amount of virtual currency you want to acquire — for example, 5000 to purchase a specific game pass or outfit bundle.',
      'Choose Basic mode to see the cheapest mix of packs that reaches your amount, its cost, and the lowest-price-per-unit package.',
      'Switch to Advanced mode and select a specific package tier to see the detailed per-package cost breakdown for that tier.',
      'Review the effective rate (cost per unit) to understand which package size gives you the most virtual currency for your money.',
      'Compare the Premium vs. Standard rates to decide whether a Roblox Premium subscription pays for itself based on your buying habits.',
    ],
    explanation:
      'Virtual currency in online gaming platforms like Roblox (Robux) and Fortnite (V-Bucks) is purchased exclusively in fixed-price tiered packages — you cannot buy custom amounts. In-game virtual currencies go back to the early 2000s, for example Second Life\'s Linden Dollar (2003), one of the first real-money-traded virtual economies. Roblox introduced Robux in 2007 (its Developer Exchange for cashing out followed in 2013), and Fortnite introduced V-Bucks in 2017. The psychology behind tiered pricing is well-studied: larger packages almost always offer a better per-unit rate, which encourages higher-value single purchases even though the total spend is larger. For example, buying 10,000 Robux in one package costs $99.99 at $0.010 per unit, while buying twenty-five 400-Robux packages to reach the same amount would cost $124.75 at $0.0125 per unit — a 25% premium for buying small. Roblox Premium subscribers receive approximately 10% bonus Robux on each purchase, reducing the effective rate further and often paying for the subscription cost through the bonus alone for regular buyers. Understanding these pricing mechanics helps parents, players, and gift-givers make informed purchasing decisions and avoid the hidden cost of buying small, frequent packages instead of saving for the best-value tier.',
    faqs: [
      {
        question: 'Is Roblox Premium worth it for buying Robux?',
        answer: 'It depends on how you value the extras. Premium costs $4.99 per month for the entry tier. At the snapshot terms it gives a monthly Robux stipend (450 Robux, worth about $5.60 at the standard $0.0125 per Robux) plus a 10 percent bonus on purchases. The bonus alone only offsets the $4.99 fee if you spend about $50 a month on Robux, so for most families the stipend and other Premium perks are the real value. Roblox changes these benefits, so check the current terms.',
      },
      {
        question: 'Which Robux package has the best value?',
        answer: 'The 10,000 Robux package at $99.99 offers the best per-unit rate at approximately $0.010 per Robux. The 400 Robux package at $4.99 has the worst rate at about $0.0125 per Robux — a 25 percent premium for buying small. The intermediate packages fall between these extremes: 800 Robux at $9.99 ($0.0125/Robux), 1,700 Robux at $19.99 ($0.0118/Robux), 4,500 Robux at $49.99 ($0.0111/Robux). Always buy the largest package you can reasonably afford for the best per-unit value.',
      },
      {
        question: 'Which V-Bucks package has the best value?',
        answer: 'In this snapshot the 13,500 V-Bucks package at $89.99 offers the best rate at approximately $0.0067 per V-Buck. The 1,000 V-Bucks package at $8.99 has the highest rate at $0.0090 per V-Buck — about 35 percent more per unit than the largest pack. The 2,800 V-Bucks at $22.99 ($0.0082/V-Buck) and 5,000 V-Bucks at $36.99 ($0.0074/V-Buck) sit in between. Epic reduced the V-Bucks in its packs in March 2026, so current packs differ. V-Bucks can also be earned in-game, for example through the Battle Pass.',
      },
      {
        question: 'Can I buy partial packages or custom amounts?',
        answer: 'No, virtual currency purchases on Roblox and Fortnite are only available in fixed package sizes — there is no option to buy a custom amount. If you need an amount that falls between two package sizes, you must buy multiple smaller packages or a larger package that exceeds your target. For example, to get at least 3,000 Robux the cheapest mix at these prices is eight 400-Robux packs (3,200 Robux for $39.92); one 1,700 plus one 1,700 pack (3,400 for $39.98) costs a few cents more but needs fewer purchases. Without a chosen package the calculator finds the cheapest mix for you.',
      },
      {
        question: 'How do V-Bucks and Robux pricing compare?',
        answer: 'Robux costs approximately $0.010 per unit at the best tier, while V-Bucks cost about $0.0067 per unit at the best tier (snapshot prices), roughly a third less per unit. However, these currencies are used in completely different games (Fortnite vs. Roblox), have different in-game purchasing power, and are not interchangeable — a V-Buck does not buy the same amount of in-game content as a Robux. Direct price-per-unit comparison is informative but should not be the sole basis for choosing between the two platforms.',
      },
      {
        question: 'Are there ways to get free or discounted Robux?',
        answer: 'Roblox Premium subscribers have received a monthly Robux stipend (450 Robux/month for the $4.99 tier, 1,000 for $9.99 and 2,200 for $19.99 at the snapshot terms; check current terms). Roblox also offers occasional gift card promotions at retail stores where you get bonus virtual items. However, never use third-party Robux generators, "free Robux" websites, or unauthorized resellers claiming to offer discounts — these are virtually always scams that steal account credentials or payment information. When not to trust a Robux offer: if it is not from the official Roblox website, the Microsoft Store, or an authorized retailer like Amazon or GameStop, it is likely fraudulent.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A parent wants to buy 5,000 Robux for a child to spend on game passes and avatar items. They choose Robux and enter 5000 without picking a package, so the calculator looks for the cheapest mix of packs that reaches at least 5,000.',
        inputs: { virtualCurrency: '5000', currencyType: 'Robux' },
        result: 'Estimated cost: $59.94 for exactly 5,000 Robux (4 × 400 + 2 × 1,700). Effective rate: $0.0120 per unit.',
        insight: 'Buying one 10,000-Robux pack would cost $99.99, almost $40 more, for double the amount. The cheapest way to reach 5,000 at these prices is four 400-Robux packs plus two 1,700-Robux packs: $19.96 + $39.98 = $59.94. A single 4,500 pack ($49.99) falls 500 short, and 4,500 + 800 gives 5,300 for $59.98. Prices are an illustrative snapshot, so check the store before buying.',
      },
      {
        scenario: 'A Roblox Premium member (at the snapshot terms, 10% more Robux per purchase) wants 10,000 Robux and enters 10000 with Robux (Premium) selected.',
        inputs: { virtualCurrency: '10000', currencyType: 'Roblox Premium' },
        result: 'Estimated cost: $99.99 for 11,000 Robux (Premium). Effective rate: $0.0091 per unit. 10% bonus applied.',
        insight: 'With the Premium amounts the $99.99 pack delivers 11,000 Robux instead of 10,000, an extra 1,000 Robux (about $12.50 at the standard small-pack rate) for the same price, and it is still the cheapest way to reach 10,000. The 10% bonus alone would take roughly $55 of Robux purchases a month to offset a $4.99 monthly fee, so Premium is mainly worth it for its other benefits. Check the current Premium terms, which Roblox changes.',
      },
      {
        scenario: 'A Fortnite player wants 2,950 V-Bucks (a Battle Pass plus a skin bundle) and enters 2950 with V-Bucks selected.',
        inputs: { virtualCurrency: '2950', currencyType: 'V-Bucks' },
        result: 'Estimated cost: $26.97 for 3,000 V-Bucks (3 × 1,000). Effective rate: $0.0090 per unit.',
        insight: 'The 1,000-V-Bucks pack has the highest price per V-Buck, but three of them reach 2,950 for $26.97, which is cheaper than 2,800 + 1,000 ($31.98) and far cheaper than the best-rate 13,500 pack ($89.99). If you will keep buying V-Bucks anyway, a larger pack lowers the cost per V-Buck. Epic reduced the V-Bucks in each pack in March 2026, so current packs differ from this snapshot.',
      },
    ],
    proTips: [
      'The 10,000 Robux pack at $99.99 has the lowest price per Robux at these prices (about $0.0100 per Robux). If you will use 10,000 Robux anyway, one large pack costs about 20% less per Robux than the smallest ones; if you only need a smaller amount, the calculator finds the cheapest mix of packs instead of pushing you to the biggest.',
      'Roblox Premium has offered a monthly Robux stipend plus a 10% bonus on purchases (snapshot terms; check the current ones). The bonus is worth about 9 cents of extra Robux per dollar spent, so the stipend and other perks are the main reason to subscribe.',
      'V-Bucks packs at the snapshot prices run from $0.0090 per V-Buck (1,000 pack) down to about $0.0067 (13,500 pack). Epic changed the V-Bucks in each pack in March 2026, so check the current lineup.',
      'Never buy virtual currency from third-party resellers, "discount" websites, or social media sellers offering below-market rates. These are often scams using stolen cards or hacked accounts, and purchases from unauthorized sellers can lead to account bans.',
      'For parents managing a gaming budget, compare price per unit: two $19.99 packs give 3,400 Robux ($0.0118 each), while the $49.99 pack gives 4,500 ($0.0111 each), so a bigger pack gives more Robux per dollar.',
      'Prices and amounts vary by country and platform. Roblox has said purchases on its website or with gift cards can give up to about 25% more Robux than purchases through mobile app stores (since November 2024), so check each channel before buying.',
    ],
    limitations: [
      'Package pricing is an illustrative snapshot of US store prices (2025); Roblox and Epic change pack sizes, bonuses and prices from time to time. Prices may vary by region, platform (iOS and Android app stores often charge more due to their 15-30% platform fees), and over time as the platforms adjust their pricing. This calculator uses published US pricing tiers — prices in other currencies such as EUR, GBP, CAD, and AUD are different and subject to exchange rate fluctuations. The calculator does not account for applicable sales tax, which may apply in some jurisdictions. Roblox gift cards and promotional events may offer bonus Robux that changes the effective rate beyond what is accounted for here. When not to rely on these estimates: for purchases outside the United States, always check the official platform purchase page for region-specific pricing. For exact current pricing, verify against the official Roblox or Fortnite in-app purchase page before making a buying decision.',
    ],
    citations: [
      { source: 'Roblox Developer Hub - Robux Overview', url: 'https://create.roblox.com/docs' },
      { source: 'Roblox Support - How to Get Robux', url: 'https://en.help.roblox.com/hc/en-us/articles/203313200-Robux' },
      { source: 'Wikipedia - Virtual Economy', url: 'https://en.wikipedia.org/wiki/Virtual_economy' },
    ],
  },
};

export default robuxConfig;
