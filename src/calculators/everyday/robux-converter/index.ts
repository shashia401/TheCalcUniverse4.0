import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RobuxConverterPanel from './RobuxConverterPanel';

interface Package {
  amount: number;
  cost: number;
}

const ROBUX_PACKAGES: Package[] = [
  { amount: 400, cost: 4.99 },
  { amount: 800, cost: 9.99 },
  { amount: 1700, cost: 19.99 },
  { amount: 4500, cost: 49.99 },
  { amount: 10000, cost: 99.99 },
];

const ROBUX_PREMIUM_PACKAGES: Package[] = [
  { amount: 440, cost: 4.99 },
  { amount: 880, cost: 9.99 },
  { amount: 1870, cost: 19.99 },
  { amount: 4950, cost: 49.99 },
  { amount: 11000, cost: 99.99 },
];

const VBUCK_PACKAGES: Package[] = [
  { amount: 1000, cost: 8.99 },
  { amount: 2800, cost: 22.99 },
  { amount: 5000, cost: 36.99 },
  { amount: 13500, cost: 79.99 },
];

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

function getPackageByAmount(packages: Package[], amount: number): Package | undefined {
  return packages.find(p => p.amount === amount);
}

function findBestPackage(packages: Package[]): Package {
  let best = packages[0];
  let bestRate = best.cost / best.amount;
  for (const pkg of packages) {
    const rate = pkg.cost / pkg.amount;
    if (rate < bestRate) {
      bestRate = rate;
      best = pkg;
    }
  }
  return best;
}

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
      step: 100,
      required: true,
      inputMode: 'numeric',
      helpText: 'How many Robux or V-Bucks do you want to acquire? Enter the total desired amount.',
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
    const amount = parseInt(values.virtualCurrency);
    const currencyType = values.currencyType || 'Robux';
    const packageTypeValue = values.packageType ? parseInt(values.packageType) : 0;

    if (isNaN(amount) || amount <= 0) return [];

    let packages: Package[];
    let bonusPercent = 0;
    let displayCurrency = '';

    if (currencyType === 'Roblox Premium') {
      packages = ROBUX_PREMIUM_PACKAGES;
      bonusPercent = 10;
      displayCurrency = 'Robux (Premium)';
    } else if (currencyType === 'V-Bucks') {
      packages = VBUCK_PACKAGES;
      displayCurrency = 'V-Bucks';
    } else {
      packages = ROBUX_PACKAGES;
      displayCurrency = 'Robux';
    }

    let selectedPkg = packageTypeValue > 0 ? getPackageByAmount(packages, packageTypeValue) : undefined;
    if (!selectedPkg) {
      selectedPkg = findBestPackage(packages);
    }

    const numPackages = Math.ceil(amount / selectedPkg.amount);
    const usdValue = numPackages * selectedPkg.cost;
    const effectiveRate = selectedPkg.cost / selectedPkg.amount;

    const bestPkg = findBestPackage(packages);
    const bestRate = bestPkg.cost / bestPkg.amount;

    const fmtMoney = (n: number) => n.toFixed(2);

    return [
      {
        id: 'usdValue',
        label: `Estimated Cost (USD) for ${amount.toLocaleString()} ${displayCurrency}`,
        value: `$${fmtMoney(usdValue)}`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'effectiveRate',
        label: 'Effective Rate ($ per unit)',
        value: `$${effectiveRate.toFixed(6)}`,
        color: 'neutral',
      },
      {
        id: 'bestPackage',
        label: 'Best Value Package',
        value: `${bestPkg.amount.toLocaleString()} for $${fmtMoney(bestPkg.cost)} ($${bestRate.toFixed(6)}/unit)`,
        color: 'positive',
      },
      {
        id: 'packageType',
        label: 'Selected Package',
        value: `${selectedPkg.amount.toLocaleString()} for $${fmtMoney(selectedPkg.cost)}`,
      },
      {
        id: 'bonusPercent',
        label: 'Bonus',
        value: bonusPercent > 0 ? `${bonusPercent}% Premium Bonus Applied` : 'Standard (no bonus)',
      },
      {
        id: 'currencyType',
        label: 'Currency',
        value: displayCurrency,
      },
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
      'The total USD cost is calculated by determining how many packages are needed to meet or exceed the desired virtual currency amount, then multiplying by the selected package price. Since virtual currency is only sold in fixed package sizes (you cannot buy partial packages), the calculator rounds up the number of packages needed using the ceiling function. The effective rate is the price per single unit of virtual currency, computed by dividing the package price by the number of units it contains. A lower effective rate means better value per unit — larger packages almost always offer superior rates. Roblox Premium subscribers receive approximately a 10 percent bonus on every Robux purchase, improving the effective rate by giving more units for the same dollar amount. This tiered pricing structure is intentional game design that encourages higher-value single purchases.',
    variables: [
      { symbol: 'Amount', name: 'Virtual Currency Amount', description: 'The total number of Robux or V-Bucks you want to purchase. Enter the desired quantity and the calculator determines the most cost-effective way to acquire it.' },
      { symbol: 'Package Size', name: 'Package Unit Count', description: 'The number of virtual currency units in a single fixed-price purchase package. Available sizes range from 400 to 13,500 units depending on the currency type.' },
      { symbol: 'Package Price', name: 'USD Price', description: 'The US dollar cost of the selected package tier. Prices are based on official Roblox and Epic Games store listings for the US market.' },
      { symbol: 'Effective Rate', name: 'Price Per Unit', description: 'The cost per single unit of virtual currency in USD. Computed as Package Price divided by Package Size. The package with the lowest effective rate gives you the most virtual currency per dollar spent.' },
      { symbol: 'Premium Bonus', name: 'Roblox Premium Bonus', description: 'Roblox Premium subscribers receive approximately 10 percent extra Robux on every purchase at no additional cost. A $99.99 package that normally gives 10,000 Robux gives 11,000 Robux with Premium, reducing the effective rate from $0.010 to $0.009 per Robux.' },
    ],
    commonUses: [
      'Estimating the exact USD cost of purchasing a specific amount of Robux or V-Bucks for in-game spending, gifts, or allowances',
      'Comparing package pricing tiers side-by-side to find the best value per unit before making a purchase decision',
      'Deciding whether a Roblox Premium subscription ($4.99/month) is financially worthwhile based on your monthly Robux purchasing habits',
      'Budgeting children\'s gaming spending by calculating exactly how many packages are needed to reach a target virtual currency amount',
    ],
    quickReference: [
      { label: '400 Robux', value: '$4.99 ($0.0125/Robux)' },
      { label: '800 Robux', value: '$9.99 ($0.0125/Robux)' },
      { label: '1,700 Robux', value: '$19.99 ($0.0118/Robux)' },
      { label: '4,500 Robux', value: '$49.99 ($0.0111/Robux)' },
      { label: '10,000 Robux', value: '$99.99 ($0.0100/Robux — BEST VALUE)' },
      { label: 'Premium 10% Bonus', value: '~$0.0091/Robux on $99.99 tier' },
      { label: 'Best V-Bucks Deal', value: '13,500 for $79.99 ($0.0059/V-Buck)' },
      { label: 'V-Bucks 1,000', value: '$8.99 ($0.0090/V-Buck — worst rate)' },
    ],
    howToUse: [
      'Select your currency type: Robux for standard Roblox currency, Robux (Premium) for the 10% subscriber bonus, or V-Bucks for Fortnite.',
      'Enter the total amount of virtual currency you want to acquire — for example, 5000 to purchase a specific game pass or outfit bundle.',
      'Choose Basic mode to see the essential cost and the best-value package recommendation.',
      'Switch to Advanced mode and select a specific package tier to see the detailed per-package cost breakdown for that tier.',
      'Review the effective rate (cost per unit) to understand which package size gives you the most virtual currency for your money.',
      'Compare the Premium vs. Standard rates to decide whether a Roblox Premium subscription pays for itself based on your buying habits.',
    ],
    explanation:
      'Virtual currency in online gaming platforms like Roblox (Robux) and Fortnite (V-Bucks) is purchased exclusively in fixed-price tiered packages — you cannot buy custom amounts. The concept of in-game virtual currencies dates back to the early 2000s when Second Life introduced the Linden Dollar in 2003, creating one of the first real-money-traded virtual economies. Habbo Hotel pioneered microtransactions through virtual furniture purchases in 2001, establishing the precedent for digital goods monetization. Roblox launched its Robux currency in 2007 alongside its developer exchange program (DevEx), and Fortnite introduced V-Bucks in 2017 as part of its free-to-play battle royale model. The psychology behind tiered pricing is well-studied: larger packages almost always offer a better per-unit rate, which encourages higher-value single purchases even though the total spend is larger. For example, buying 10,000 Robux in one package costs $99.99 at $0.010 per unit, while buying twenty-five 400-Robux packages to reach the same amount would cost $124.75 at $0.0125 per unit — a 25% premium for buying small. Roblox Premium subscribers receive approximately 10% bonus Robux on each purchase, reducing the effective rate further and often paying for the subscription cost through the bonus alone for regular buyers. Understanding these pricing mechanics helps parents, players, and gift-givers make informed purchasing decisions and avoid the hidden cost of buying small, frequent packages instead of saving for the best-value tier.',
    faqs: [
      {
        question: 'Is Roblox Premium worth it for buying Robux?',
        answer: 'Yes, if you buy Robux regularly — at least 1,000 Robux per month. Premium costs $4.99 per month and gives a monthly Robux stipend plus a 10 percent bonus on every Robux purchase. The 10 percent bonus on a $99.99 package effectively gives you $10 worth of extra Robux for free, which is double the monthly subscription cost. For families spending $20 or more per month on Robux, Premium almost always pays for itself through the bonus alone, even without factoring in the monthly stipend and other Premium perks like trading and selling items.',
      },
      {
        question: 'Which Robux package has the best value?',
        answer: 'The 10,000 Robux package at $99.99 offers the best per-unit rate at approximately $0.010 per Robux. The 400 Robux package at $4.99 has the worst rate at about $0.0125 per Robux — a 25 percent premium for buying small. The intermediate packages fall between these extremes: 800 Robux at $9.99 ($0.0125/Robux), 1,700 Robux at $19.99 ($0.0118/Robux), 4,500 Robux at $49.99 ($0.0111/Robux). Always buy the largest package you can reasonably afford for the best per-unit value.',
      },
      {
        question: 'Which V-Bucks package has the best value?',
        answer: 'The 13,500 V-Bucks package at $79.99 offers the best rate at approximately $0.0059 per V-Buck. The 1,000 V-Bucks package at $8.99 has the worst rate at $0.0090 per V-Buck — a 52 percent premium for buying the smallest package. The 2,800 V-Bucks at $22.99 ($0.0082/V-Buck) and 5,000 V-Bucks at $36.99 ($0.0074/V-Buck) offer intermediate value. Unlike Robux, V-Bucks cannot be earned through a subscription service and must be purchased directly or earned through the Battle Pass.',
      },
      {
        question: 'Can I buy partial packages or custom amounts?',
        answer: 'No, virtual currency purchases on Roblox and Fortnite are only available in fixed package sizes — there is no option to buy a custom amount. If you need an amount that falls between two package sizes, you must buy multiple smaller packages or a larger package that exceeds your target. For example, to get 3,000 Robux, you could buy one 1,700 Robux package plus one 800 Robux package plus one 400 Robux package (2,900 total for $34.97), or simply buy one 4,500 Robux package for $49.99 and have 1,500 extra for future use. The calculator shows you the exact cost for any combination.',
      },
      {
        question: 'How do V-Bucks and Robux pricing compare?',
        answer: 'Robux costs approximately $0.010 per unit at the best tier, while V-Bucks cost about $0.0059 per unit at the best tier. V-Bucks are roughly 41 percent cheaper per unit than Robux. However, these currencies are used in completely different games (Fortnite vs. Roblox), have different in-game purchasing power, and are not interchangeable — a V-Buck does not buy the same amount of in-game content as a Robux. Direct price-per-unit comparison is informative but should not be the sole basis for choosing between the two platforms.',
      },
      {
        question: 'Are there ways to get free or discounted Robux?',
        answer: 'Roblox Premium subscribers receive a monthly Robux stipend as part of their subscription: 450 Robux/month for the $4.99 tier, 1,000 Robux/month for $9.99, and 2,200 Robux/month for $19.99. Roblox also offers occasional gift card promotions at retail stores where you get bonus virtual items. However, never use third-party Robux generators, "free Robux" websites, or unauthorized resellers claiming to offer discounts — these are virtually always scams that steal account credentials or payment information. The only legitimate way to acquire Robux at a discount is through the Premium subscription bonus. When not to trust a Robux offer: if it is not from the official Roblox website, the Microsoft Store, or an authorized retailer like Amazon or GameStop, it is likely fraudulent.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A parent wants to buy 5,000 Robux for their child to purchase game passes and avatar items. They select Robux and enter 5000. Using the best-value package (10,000 Robux at $99.99), they would spend $99.99 and receive 10,000 Robux — double what they asked for. If they instead used the 4,500 Robux package at $49.99, they would need 2 packages ($99.98 total) to get 9,000 Robux. The 10,000 package gives 1,000 more Robux for only $0.01 more.',
        inputs: { virtualCurrency: '5000', currencyType: 'Robux' },
        result: 'Estimated cost: $99.99 for 10,000 Robux via the best-value package. Effective rate: $0.0100 per unit.',
        insight: 'Buying one 10,000-Robux package at $99.99 gives double the requested amount at nearly the same cost as buying multiple smaller packages. The extra 5,000 Robux can be saved in the account for future purchases. This is often the better financial decision for families who expect to buy Robux again within a few months.',
      },
      {
        scenario: 'A Roblox Premium subscriber wants to know if the 10% bonus actually matters for large purchases. With Premium, the $99.99 package gives 11,000 Robux instead of 10,000 — an extra 1,000 Robux for free. The effective rate drops from $0.0100 to $0.0091 per Robux. Over the course of a year, if they buy the $99.99 package four times, the Premium bonus saves $40 worth of Robux for a $60 annual subscription cost.',
        inputs: { virtualCurrency: '10000', currencyType: 'Roblox Premium' },
        result: 'Estimated cost: $99.99 for 11,000 Robux (Premium). Effective rate: $0.0091 per unit. 10% bonus applied.',
        insight: 'Roblox Premium at $4.99/month ($59.88/year) pays for itself if you buy at least 8,000 Robux per year. The 10% bonus on four $99.99 packages gives $40 worth of free Robux, and the monthly stipend (450/month for the basic tier) provides another 5,400 Robux annually — combined value well exceeding the subscription cost for regular buyers.',
      },
      {
        scenario: 'A Fortnite player wants the new Battle Pass (950 V-Bucks) plus a 2,000 V-Buck skin bundle. They need 2,950 V-Bucks total. They compare: one 2,800 V-Buck package plus one 1,000 V-Buck package (3,800 V-Bucks for $31.98), or one 5,000 V-Buck package (5,000 V-Bucks for $36.99). The 5,000 package gives 1,200 more V-Bucks for only $5.01 more — enough for another emote or pickaxe.',
        inputs: { virtualCurrency: '2950', currencyType: 'V-Bucks' },
        result: 'Estimated cost: $36.99 for 5,000 V-Bucks via best-value package. Effective rate: $0.0074 per unit.',
        insight: 'The mathematical approach: buying 2,800 + 1,000 = 3,800 V-Bucks costs $22.99 + $8.99 = $31.98. The 5,000 V-Buck package costs $36.99 — only $5.01 more for 1,200 additional V-Bucks. This is a 24% better per-unit rate on the extra V-Bucks. For players who regularly buy cosmetics and Battle Passes, batch-purchasing the largest package is always the better long-term financial decision.',
      },
    ],
    proTips: [
      'The 10,000 Robux package at $99.99 consistently offers the best per-unit rate at about $0.010 per Robux. If you plan to buy Robux multiple times per year, save up and buy the largest package once rather than smaller packages more frequently — you will save approximately 25% compared to buying the smallest packages repeatedly.',
      'Roblox Premium at $4.99 to $19.99 per month gives a monthly Robux stipend plus a 10% bonus on all Robux purchases. For families spending $20 or more per month on Robux, Premium almost always pays for itself through the bonus alone — the monthly stipend and trading/selling perks are essentially free extras.',
      'V-Bucks packages follow a different pricing structure: 13,500 V-Bucks for $79.99 at $0.0059 per V-Buck is by far the best value. The 1,000 V-Buck package at $8.99 costs 52% more per unit. Unlike Robux, V-Bucks cannot be earned through a subscription — they must be purchased or earned through Battle Pass gameplay.',
      'Never buy virtual currency from third-party resellers, "discount" websites, or social media sellers offering below-market rates. These are nearly always scams using stolen credit cards, hacked accounts, or fraudulent chargeback schemes. Purchasing from unauthorized sellers can result in permanent account bans, and the platforms offer zero recourse for lost funds in these cases.',
      'For parents managing children\'s gaming budgets, teach value comparison using this calculator. Show your child that saving allowance for the $99.99 package (10,000 Robux at $0.010 each) is much smarter than impulse-buying five $19.99 packages (8,500 Robux at $0.0118 each) — they get 1,500 more Robux for the same total spend.',
      'Exchange rates and package pricing vary by country and platform. Purchases made through the Apple App Store or Google Play Store on mobile devices often cost 10-30% more than direct web purchases due to platform fees. For the best rates, buy virtual currency directly through the Roblox or Epic Games website on a desktop browser.',
    ],
    limitations: [
      'Package pricing is based on USD pricing from the official Roblox and Epic Games stores as of the most recent update. Prices may vary by region, platform (iOS and Android app stores often charge more due to their 15-30% platform fees), and over time as the platforms adjust their pricing. This calculator uses published US pricing tiers — prices in other currencies such as EUR, GBP, CAD, and AUD are different and subject to exchange rate fluctuations. The calculator does not account for applicable sales tax, which may apply in some jurisdictions. Roblox gift cards and promotional events may offer bonus Robux that changes the effective rate beyond what is accounted for here. When not to rely on these estimates: for purchases outside the United States, always check the official platform purchase page for region-specific pricing. For exact current pricing, verify against the official Roblox or Fortnite in-app purchase page before making a buying decision.',
    ],
    citations: [
      { source: 'Roblox Developer Hub - Robux Overview', url: 'https://create.roblox.com/docs' },
      { source: 'Roblox Support - How to Get Robux', url: 'https://en.help.roblox.com/hc/en-us/articles/203313200-Robux' },
      { source: 'Wikipedia - Virtual Economy', url: 'https://en.wikipedia.org/wiki/Virtual_economy' },
    ],
  },
};

export default robuxConfig;
