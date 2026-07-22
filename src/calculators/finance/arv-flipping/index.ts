import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ArvFlippingPanel from './ArvFlippingPanel';

const arvFlippingConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'afterRepairValue',
      label: 'After Repair Value (ARV)',
      type: 'number',
      placeholder: '300,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Estimated market value of the property after all repairs are completed',
    },
    {
      id: 'repairCosts',
      label: 'Estimated Repair Costs',
      type: 'number',
      placeholder: '50,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Total cost of all renovations, repairs, and upgrades',
    },
    {
      id: 'holdingCosts',
      label: 'Holding Costs (closing, taxes, insurance, utilities)',
      type: 'number',
      placeholder: '15,000',
      prefix: '$',
      min: 0,
      step: 500,
      required: true,
      helpText: 'Carrying costs during the flip: loan interest, property taxes, insurance, utilities, etc.',
    },
    {
      id: 'targetProfitMargin',
      label: 'Target Profit Margin',
      type: 'number',
      placeholder: '20',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Your desired profit margin on the total project cost (typical: 15-25%)',
    },
  ],

  calculate: (values) => {
    const arv = parseFloat(values.afterRepairValue);
    const repairCosts = parseFloat(values.repairCosts);
    const holdingCosts = parseFloat(values.holdingCosts);
    const targetProfitMargin = parseFloat(values.targetProfitMargin);

    if ([arv, repairCosts, holdingCosts, targetProfitMargin].some(isNaN)) return [];
    if (arv <= 0 || repairCosts < 0 || holdingCosts < 0 || targetProfitMargin < 0 || targetProfitMargin > 100) return [];

    const maoRaw = arv * (1 - targetProfitMargin / 100) - repairCosts - holdingCosts;
    const maxAllowableOffer = Math.max(0, maoRaw);
    const totalCosts = maxAllowableOffer + repairCosts + holdingCosts;
    const estimatedProfit = arv - totalCosts;
    const roiPercent = totalCosts > 0 ? (estimatedProfit / totalCosts) * 100 : 0;
    const seventyPercentRule = arv * 0.7 - repairCosts;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return [
      {
        id: 'mao',
        label: 'Maximum Allowable Offer (MAO)',
        value: `$${fmt(maxAllowableOffer)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'maxAllowableOffer',
        label: 'Max Offer (detailed)',
        value: `$${fmt(maxAllowableOffer)}`,
        color: 'neutral' as const,
      },
      {
        id: 'estimatedProfit',
        label: 'Estimated Profit at MAO',
        value: `$${fmt(Math.max(0, estimatedProfit))}`,
        color: estimatedProfit > 0 ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'roiPercent',
        label: 'Return on Investment (ROI)',
        value: `${roiPercent.toFixed(1)}%`,
        color: roiPercent > 0 ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'seventyPercentRule',
        label: '70% Rule Value',
        value: `$${fmt(Math.max(0, seventyPercentRule))}`,
        color: 'neutral' as const,
      },
      {
        id: 'arv',
        label: 'After Repair Value (ARV)',
        value: `$${fmt(arv)}`,
        color: 'neutral' as const,
      },
      {
        id: 'totalCosts',
        label: 'Total Project Costs',
        value: `$${fmt(totalCosts)}`,
        color: 'negative' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ArvFlippingPanel, { values, results });
  },

  educational: {
    formula: 'MAO = (ARV × (1 − Target Profit%)) − Repair Costs − Holding Costs',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">House Flipping: The MAO Formula</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Buy right = work backward from your profit target</text><g transform="translate(30,65)"><!-- ARV at top --><rect x="60" y="0" width="310" height="45" rx="8" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="215" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-1e40af)">After Repair Value (ARV): $300,000</text><text x="215" y="36" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">What the property sells for after renovations</text><!-- The stack below ARV --><rect x="60" y="58" width="80" height="35" rx="6" fill="var(--svg-ef4444)"/><text x="100" y="80" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Profit</text><text x="100" y="130" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ef4444)">20% = $60K</text><rect x="150" y="58" width="90" height="35" rx="6" fill="var(--svg-f59e0b)"/><text x="195" y="80" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Repairs</text><text x="195" y="130" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-f59e0b)">$50K</text><rect x="250" y="58" width="120" height="35" rx="6" fill="var(--svg-8b5cf6)"/><text x="310" y="80" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Holding Costs</text><text x="310" y="130" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-8b5cf6)">$15K</text><!-- MAO at bottom --><rect x="60" y="148" width="310" height="50" rx="10" fill="var(--svg-22c55e)" stroke="var(--svg-15803d)" stroke-width="2"/><text x="215" y="170" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ffffff)">MAO = Maximum Allowable Offer</text><text x="215" y="190" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ffffff)">$175,000</text><!-- Check: 70% Rule --><rect x="40" y="215" width="350" height="40" rx="8" fill="var(--svg-fef3c7)"/><text x="215" y="234" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-b45309)">70% Rule Check: $300K × 0.70 − $50K = $160K</text><text x="215" y="250" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">MAO is above 70% rule — you are accepting a thinner margin</text></g><g transform="translate(40,275)"><text x="180" y="10" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">MAO = ARV×(1−Target%) − Repairs − Holding Costs</text><text x="180" y="26" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Always negotiate below MAO — it is your walk-away price, not your opening offer</text></g></svg>',
      alt: 'House flipping diagram showing the MAO formula breakdown: ARV minus target profit, repair costs, and holding costs equals maximum allowable offer',
      caption: 'The MAO formula works backward from the expected sale price to determine the most you can pay for a fixer-upper while still hitting your profit target',
    },
    formulaDescription:
      'The Maximum Allowable Offer (MAO) is the most you can pay for a property and still hit your target profit margin. The 70% Rule is a quick shorthand: ARV × 0.70 − repairs. If your MAO is above the 70% rule number, you are paying a premium. The MAO formula works backward from the expected sale price (ARV), deducts your desired profit percentage first (so you guarantee your margin), then subtracts all the costs you will incur to complete the project. What remains is the maximum you can pay for the property.',
    variables: [
      {
        symbol: 'ARV',
        name: 'After Repair Value',
        description: 'The estimated market value of the property after all renovations are complete. This is always an estimate — use comparable sales (comps) from the same neighborhood within the last 3-6 months.',
      },
      {
        symbol: 'MAO',
        name: 'Maximum Allowable Offer',
        description: 'The highest price you can pay for the property to achieve your target profit margin. Always negotiate toward a number below your MAO — this is your walk-away price, not your opening offer.',
      },
      {
        symbol: '70% Rule',
        name: '70% Rule',
        description: 'A quick guideline: never pay more than 70% of ARV minus repair costs. Helps avoid overpaying. The remaining 30% covers your profit, holding costs, closing costs, and transaction fees.',
      },
    ],
    howToUse: [
      'Enter the After Repair Value (ARV) — the estimated sale price after renovations. Research comparable sold properties in the same neighborhood.',
      'Enter your estimated repair and renovation costs. Get contractor bids before making an offer — do not rely on rough estimates.',
      'Enter holding costs: loan interest, property taxes, insurance, utilities during the flip period. A typical flip takes 3-6 months.',
      'Set your target profit margin as a percentage of the total project cost. Most investors target 15-25% minimum.',
      'The calculator shows your MAO, estimated profit, and ROI. Compare against the 70% Rule as a sanity check on your numbers.',
    ],
    commonUses: [
      'Calculate the maximum offer price for a fixer-upper property while ensuring your target profit margin is achieved after all renovation costs.',
      'Apply the 70 percent rule as a quick sanity check to avoid overpaying on potential house flipping investments.',
      'Compare multiple deal opportunities by analyzing the projected ROI for each property before making an offer.',
    ],
    explanation:
      'House flipping is about buying right. The MAO formula ensures you account for all costs plus your desired profit before making an offer. The 70% Rule is a quick industry heuristic — it assumes 30% of the ARV covers your profit, holding costs, and transaction fees. If your calculated MAO is below the 70% Rule number, you have a conservative deal. If it is above, you are either accepting thinner margins or the market demands it. Successful flippers typically analyze dozens of properties for every one they buy, using the MAO formula as a gatekeeper to ensure they never overpay. The most common mistake new flippers make is underestimating repair costs — always add a 10-20% contingency buffer to your initial repair estimate. The second most common mistake is overestimating the ARV by using the most optimistic comparable sale rather than a conservative average.',
    faqs: [
      {
        question: 'What is the 70% Rule in house flipping?',
        answer:
          'The 70% Rule states that you should pay no more than 70% of the After Repair Value (ARV) minus repair costs. Example: ARV = $300K, repairs = $50K → max offer = $300K × 0.70 − $50K = $160K. The remaining 30% accounts for your profit, holding costs, and closing costs. The rule is a guideline, not a hard limit — in hot markets, you may need to go above 70%, which means accepting a lower profit margin or relying on appreciation to make up the difference. In slow markets, aim for 65% or lower.',
      },
      {
        question: 'What are typical holding costs for a flip?',
        answer:
          'Holding costs include: loan interest (hard money or conventional), property taxes, insurance, utilities (electric, water, gas), HOA fees, and lawn maintenance. For a 3-6 month flip, these typically run 3-8% of the purchase price. Hard money loans are particularly expensive — 10-15% interest — which is why experienced flippers prioritize speed and often use cash or conventional financing when possible.',
      },
      {
        question: 'What is a good profit margin for a flip?',
        answer:
          'Most experienced flippers target a minimum 15-20% ROI on their total project cost. Beginners should aim higher (20-25%) to account for unexpected overruns. The rule of thumb: if you are not making at least $30K-$50K per flip, it might not be worth the risk and effort. Also consider your return on a per-hour basis — a $40K profit on a flip that consumed 300 hours of your time is $133/hour, which is excellent. The same profit on a flip that consumed 1,000 hours is only $40/hour.',
      },
    ],
    citations: [
      { source: 'Internal Revenue Service', url: 'https://www.irs.gov' },
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
    ],
  },
};

export default arvFlippingConfig;
