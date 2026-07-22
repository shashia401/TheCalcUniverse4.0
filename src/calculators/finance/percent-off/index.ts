import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import PercentOffPanel from './PercentOffPanel';

const percentOffConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'price',
      label: 'Original Price',
      type: 'number',
      placeholder: '120',
      prefix: '$',
      required: true,
      helpText: 'The original price of the item before any discounts are applied.',
    },
    {
      id: 'discount1',
      label: 'Primary Discount',
      type: 'number',
      placeholder: '20',
      unit: '%',
      step: 0.5,
      required: true,
      helpText: 'First percentage discount applied to the original price.',
    },
    {
      id: 'discount2',
      label: 'Stacked Additional Discount (optional)',
      type: 'number',
      placeholder: '15',
      unit: '%',
      step: 0.5,
      helpText: 'Applied AFTER the primary discount, not added to it. Leave blank if not stacking.',
    },
    {
      id: 'tax',
      label: 'Local Sales Tax',
      type: 'number',
      placeholder: '8.25',
      unit: '%',
      step: 0.01,
      helpText: 'Applied to the post-discount price. Leave blank for no tax.',
    },
  ],

  calculate: (values) => {
    const price = parseFloat(values.price);
    const d1 = parseFloat(values.discount1);
    const d2 = parseFloat(values.discount2);
    const tax = parseFloat(values.tax) || 0;

    if (isNaN(price) || isNaN(d1) || price <= 0 || d1 < 0) return [];
    if (d1 > 100 || (!isNaN(d2) && (d2 < 0 || d2 > 100)) || tax < 0 || tax > 100) {
      return [
        {
          id: 'err',
          label: 'Input Error',
          value: 'Discounts and tax must each be between 0% and 100%.',
          color: 'negative' as const,
          highlight: true,
        },
      ];
    }

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const afterFirst = price * (1 - d1 / 100);
    const afterSecond = !isNaN(d2) && d2 > 0 ? afterFirst * (1 - d2 / 100) : afterFirst;
    const taxAmount = afterSecond * (tax / 100);
    const finalPrice = afterSecond + taxAmount;
    const totalSaved = price - afterSecond;
    const effectiveDiscountPct = ((price - afterSecond) / price) * 100;
    const naiveSum = !isNaN(d2) && d2 > 0 ? d1 + d2 : d1;
    const stackingGap = naiveSum - effectiveDiscountPct;

    const results: CalculatorResult[] = [
      { id: 'final', label: tax > 0 ? 'Final Price (After Tax)' : 'Final Price', value: `$${fmt(finalPrice)}`, highlight: true, color: 'positive' as const },
      { id: 'price', label: 'Original Price', value: `$${fmt(price)}`, color: 'neutral' as const },
      { id: 'firstDisc', label: `After ${d1}% Discount`, value: `$${fmt(afterFirst)}`, color: 'neutral' as const },
    ];

    if (!isNaN(d2) && d2 > 0) {
      results.push({
        id: 'secondDisc',
        label: `After Additional ${d2}% (Stacked)`,
        value: `$${fmt(afterSecond)}`,
        color: 'neutral' as const,
      });
    }

    if (tax > 0) {
      results.push({
        id: 'tax',
        label: `Sales Tax (${tax}%)`,
        value: `+$${fmt(taxAmount)}`,
        color: 'negative' as const,
      });
    }

    results.push(
      { id: 'saved', label: 'Total Amount Saved', value: `$${fmt(totalSaved)}`, color: 'positive' as const },
      { id: 'effective', label: 'Effective Total Discount', value: `${effectiveDiscountPct.toFixed(2)}%`, color: 'positive' as const },
    );

    if (!isNaN(d2) && d2 > 0 && stackingGap > 0.01) {
      results.push({
        id: 'gap',
        label: `"Stacking Gap" — looks like ${naiveSum}% off but you actually got`,
        value: `${effectiveDiscountPct.toFixed(2)}% (${stackingGap.toFixed(2)} percentage points less)`,
        color: 'negative' as const,
      });
    }

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PercentOffPanel, { values, results });
  },
  educational: {
    formula: 'Final = Price × (1 − D₁) × (1 − D₂) × (1 + Tax)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/><text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Stacked Discounts: They Multiply, Not Add</text><rect x="40" y="32" width="240" height="30" rx="6" fill="var(--svg-e2e8f0)"/><text x="160" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-475569)">Original Price: $100</text><path d="M 100,62 L 100,72 L 70,78" fill="none" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><rect x="40" y="75" width="105" height="30" rx="6" fill="var(--svg-3b82f6)"/><text x="92" y="94" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">20% Off → $80</text><path d="M 185,62 L 185,72 L 215,78" fill="none" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><rect x="175" y="75" width="105" height="30" rx="6" fill="var(--svg-8b5cf6)"/><text x="227" y="94" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">10% Off → $72</text><rect x="20" y="118" width="280" height="72" rx="8" fill="var(--svg-f1f5f9)"/><text x="160" y="137" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">The "Stacking Gap"</text><rect x="35" y="146" width="110" height="20" rx="4" fill="var(--svg-fef3c7)"/><text x="90" y="160" text-anchor="middle" font-size="9" fill="var(--svg-b45309)">Think: 30% off = $70</text><rect x="155" y="146" width="130" height="20" rx="4" fill="var(--svg-ef4444)"/><text x="220" y="160" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Actually: 28% off = $72</text><text x="160" y="184" text-anchor="middle" font-size="8" fill="var(--svg-ef4444)">You lose 2% to the stacking gap — always multiply, never add</text></svg>',
      alt: 'Diagram showing how stacked discounts multiply rather than add: a $100 item with 20% off then 10% off becomes $72 (28% off), not $70 (30% off)',
      caption: 'Sequential discounts always multiply — the second discount applies to the already-reduced price, creating a "stacking gap" that is smaller than the sum of discounts',
    },
    formulaDescription:
      'Stacked discounts multiply, they do not add. A 20% discount followed by a 10% discount does not equal 30% off — the second discount is applied to the already-reduced price, so the combined effective discount is always less than the sum of the two stated discounts. The formula also shows that sales tax is applied after all discounts, which means a larger discount actually reduces the amount of tax you pay as well.',
    variables: [
      { symbol: 'Price', name: 'Original Price', description: 'The pre-discount listed price of the item. This is the starting point before any discounts or tax are applied.' },
      { symbol: 'Stacked Discounts', name: 'Sequential Discounts', description: 'Two discounts multiply, they do not add. A 20% discount followed by 10% off = 28% effective total discount ($100 → $72), not 30% ($70). The order of discounts does not matter since multiplication is commutative.' },
      { symbol: 'Tax', name: 'Sales Tax Rate', description: 'Local sales tax, applied to the final discounted subtotal. Always calculated after all discounts have been applied.' },
    ],
    howToUse: [
      'Enter the original price, the primary discount percentage, and any stacked second discount.',
      'Add your local sales tax rate to see the true out-the-door price.',
      'Notice the "Stacking Gap" — the difference between what discounts look like added together vs. what they actually multiply out to.',
    ],
    commonUses: [
      'Calculate the final price after multiple sequential discounts to avoid the common mistake of adding percentages together.',
      'Compare different coupon and promotion combinations to determine which stacking strategy saves you the most money.',
      'Include sales tax in your discount calculations to see the true out-the-door price for major retail purchases.',
    ],
    explanation:
      'Sequential discounting is the most misunderstood pricing math in retail. If a sweater is $100 and a sign says "30% off, plus an extra 20% at the register," shoppers expect to pay $50 (50% off). The actual price is $100 × 0.70 × 0.80 = $56 — only 44% off. Retailers exploit this gap during Black Friday and clearance events because the headline number ("Up to 50% off!") is mathematically dishonest but legally fine. Always run the actual numbers before committing to a "stack." The "Stacking Gap" line in the results explicitly shows you how many percentage points you are losing to sequential math. This is particularly important for large purchases like furniture, electronics, or appliances where even a 2% gap can mean tens or hundreds of dollars.',
    faqs: [
      {
        question: 'Why doesn\'t a 20% discount plus a 10% discount equal 30% off?',
        answer:
          'Because the second discount is applied to the price AFTER the first discount, not to the original price. On a $100 item: after 20% off you pay $80. Then 10% off $80 is $8 more saved, for a final price of $72 — a 28% effective total discount, not 30%. The two discount percentages multiply (1 − 0.20) × (1 − 0.10) = 0.72, never add. The larger the individual discounts, the bigger the gap between perceived savings (adding) and actual savings (multiplying).',
      },
      {
        question: 'Does the order I apply two stacked discounts matter?',
        answer:
          'For pure percentage discounts: no. Multiplication is commutative, so 20% off then 10% off gives the exact same final price as 10% off then 20% off. However, for fixed dollar coupons combined with percentages, the order matters enormously. A "$10 off" coupon applied BEFORE a 20% discount saves you more than if it is applied after. Smart stores set the order in their POS to maximize their margin, usually applying the percentage first and the fixed dollar amount second.',
      },
      {
        question: 'Is sales tax applied before or after a discount?',
        answer:
          'Always after the discount, in every US state. Sales tax is a percentage of the price actually paid, not the sticker price. So if a $100 item is 25% off in a state with 8% tax, you pay $75 + (8% × $75) = $81 total. This is also why higher-discount items effectively give you a small tax break compared to the original full-price version. The calculator accounts for this automatically.',
      },
      {
        question: 'What is the "stacking gap" shown in the results?',
        answer:
          'The stacking gap is the difference between what shoppers THINK they are saving (adding discounts) and what they ACTUALLY save (multiplying discounts). For example, a 40% + 30% discount looks like 70% off ($100 → $30), but the real math gives 58% off ($100 → $42). The gap is 12 percentage points — meaning you pay $12 more than expected. This gap grows larger as the individual discounts increase. The calculator shows this explicitly so you never overestimate your savings.',
      },
      {
        question: 'How do clearance sales use stacking to appear bigger than they are?',
        answer:
          'During Black Friday or "extra 50% off clearance" sales, stores rely on the stacking illusion. A $200 item marked "50% off clearance" with "extra 30% off" sounds like 80% off ($40), but the real price is $200 × 0.50 × 0.70 = $70 — a 65% discount, not 80%. At scale (furniture, electronics, appliances), this gap can mean hundreds of dollars. Always run the numbers through the calculator before feeling like you got a deal — the "stacking gap" line tells you exactly how much the perception differs from reality.',
      },
    ],
    quickReference: [
      { label: 'Single discount', value: 'Price × (1 − D%)' },
      { label: 'Stacked discounts', value: 'Price × (1 − D₁) × (1 − D₂) — multiply, never add' },
      { label: 'With tax', value: 'Final = Subtotal × (1 + Tax%) after all discounts' },
      { label: 'Effective discount', value: '(Original − Final) / Original × 100' },
      { label: 'Stacking gap', value: '(D₁ + D₂) − Effective — points lost to multiplying' },
    ],
    proTips: [
      'When you see "XX% off, plus an extra YY% at checkout," always run the numbers. The combined discount is always less than XX + YY. This gap is most punishing when both discounts are large (e.g., 50% + 50% = 75% off, not 100%).',
      'If you have a choice between "$X off" and "Y% off," calculate both. For items below $X/Y%, the dollar coupon is better. For items above $X/Y%, the percentage coupon wins. This calculator lets you model both by adjusting approach.',
      'Sales tax varies wildly across jurisdictions (from 0% in Delaware to over 10% in some cities). For large purchases like appliances or furniture, the tax difference between "discounted then taxed" vs "taxed then discounted" can be meaningful. This calculator applies tax correctly (after discount) per standard retail practice.',
      'Use this calculator BEFORE Black Friday to understand what "45% off + extra 20% at checkout" actually means. The headline stacks look impressive but the effective discount is always lower than the sum. Knowing this ahead of time helps you spot real vs fake deals.',
      'For online purchases with multiple promo codes, test different stacking orders. Some sites apply the larger discount first, some apply codes in the order you enter them. The calculator assumes percentage-then-percentage (order does not matter for pure percentages), but if one code is a dollar amount, the order matters significantly.',
      'When comparison shopping across retailers with different tax rates, the "final price with tax" display lets you compare true out-the-door costs. A lower sticker price at a store in a higher-tax jurisdiction may actually cost more after tax than a slightly higher sticker at a lower-tax store.',
    ],
    limitations: [
      'This calculator handles percentage-based stacking discounts only. It does not model fixed-dollar coupons combined with percentages (e.g., "$10 off plus 20% off"), buy-one-get-one (BOGO) promotions, loyalty points discounts, or tiered discounts (e.g., "spend $200, get 25% off"). For dollar-plus-percentage combos, the order of application matters significantly and varies by retailer.',
      'Some states exempt certain items from sales tax (groceries, clothing under a threshold, prescription drugs); the calculator applies a single flat tax rate to the entire discounted subtotal.',
      'Shipping costs, handling fees, and multi-item checkout logic are not included. Always verify with your receipt or the store POS for the exact final amount.',
    ],
    workedExamples: [
      {
        scenario: 'Single Discount — Simple 25% Off Sale',
        inputs: {
          price: '80',
          discount1: '25',
          discount2: '',
          tax: '',
        },
        result: 'Final price is $60.00 — you save $20.00, an effective discount of 25%.',
        insight:
          'A $80 item with 25% off gives a final price of $60. You save $20, and the effective discount is exactly 25%. This is the straightforward case where a single discount percentage equals the effective discount percentage. Always verify this baseline to ensure your mental math is correct before tackling stacked discounts.',
      },
      {
        scenario: 'Stacked Black Friday Deal — 40% + 30% That Looks Like 70% Off',
        inputs: {
          price: '200',
          discount1: '40',
          discount2: '30',
          tax: '8.25',
        },
        result: 'Final price is $90.93 with 8.25% tax. Effective discount: 58% (not 70%). The stacking gap is 12 percentage points — costing $24 more than the headline suggests.',
        insight:
          'A $200 jacket marked "40% off + extra 30% off at register" sounds like 70% off ($60), but the real math produces $200 × 0.60 × 0.70 = $84 before tax, or about $90.93 with 8.25% tax. The effective discount is only 58%, not 70% — a stacking gap of 12 percentage points. At $200, this gap costs you $24 more than you might expect. This is the classic Black Friday pricing illusion that the calculator exposes.',
      },
    ],
  citations: [
    { source: 'Internal Revenue Service', url: 'https://www.irs.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/d/discount.asp' },
  ],
  },
};

export default percentOffConfig;
