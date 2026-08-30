import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import TipPanel from './TipPanel';

/** Format a number as a USD currency string (no cents if whole dollar). */
function fmtCurrency(n: number): string {
  const abs = Math.abs(n);
  const prefix = n < 0 ? '-' : '';
  if (Number.isInteger(abs)) return `${prefix}$${abs.toFixed(0)}`;
  return `${prefix}$${abs.toFixed(2)}`;
}

/** Format a percentage, showing one decimal only when needed. */
function fmtPct(n: number): string {
  return n % 1 === 0 ? `${n.toFixed(0)}%` : `${n.toFixed(1)}%`;
}

const tipConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'billAmount',
      label: 'Bill Amount ($)',
      type: 'number',
      min: 0,
      step: 0.01,
      placeholder: 'e.g., 85.50',
    },
    {
      id: 'tipPercent',
      label: 'Tip Percentage',
      type: 'select',
      options: [
        { label: '15%', value: '15' },
        { label: '18%', value: '18' },
        { label: '20%', value: '20' },
        { label: 'Custom', value: 'custom' },
      ],
      defaultValue: '15',
    },
    {
      id: 'customTipPercent',
      label: 'Custom Tip %',
      type: 'number',
      min: 0,
      step: 0.5,
      placeholder: 'e.g., 22',
      showWhen: (v) => v.tipPercent === 'custom',
    },
    {
      id: 'splitPeople',
      label: 'Split Between',
      type: 'number',
      min: 1,
      step: 1,
      placeholder: 'e.g., 2',
      defaultValue: '1',
    },
    {
      id: 'roundingMode',
      label: 'Rounding',
      type: 'select',
      options: [
        { label: 'No rounding', value: 'none' },
        { label: 'Round total up to nearest $', value: 'total' },
        { label: 'Round tip up to nearest $', value: 'tip' },
        { label: 'Round both', value: 'both' },
      ],
      defaultValue: 'none',
      helpText: '"OCD Rounding" — round everything up for easy math',
    },
  ],
  calculate: (values) => {
    const billAmount = parseFloat(values.billAmount);
    const tipPercentRaw = values.tipPercent || '15';
    const splitRaw = values.splitPeople || '1';
    const roundingMode = values.roundingMode || 'none';

    // Validate bill amount
    if (isNaN(billAmount) || billAmount <= 0) return [];

    // Determine tip percentage
    let tipPercent: number;
    if (tipPercentRaw === 'custom') {
      tipPercent = parseFloat(values.customTipPercent);
      if (isNaN(tipPercent) || tipPercent <= 0) return [];
    } else {
      tipPercent = parseFloat(tipPercentRaw);
    }

    // Validate split
    const splitPeople = parseInt(splitRaw, 10);
    if (isNaN(splitPeople) || splitPeople < 1) return [];

    // ── Calculations ──
    let tipAmount = billAmount * (tipPercent / 100);
    let total = billAmount + tipAmount;
    let roundingApplied = '';
    let effectiveTipPct = tipPercent;

    if (roundingMode === 'tip' || roundingMode === 'both') {
      const roundedTip = Math.ceil(tipAmount);
      if (roundedTip !== tipAmount) {
        roundingApplied += `Tip rounded up from ${fmtCurrency(tipAmount)} to ${fmtCurrency(roundedTip)}`;
        tipAmount = roundedTip;
        total = billAmount + tipAmount;
        effectiveTipPct = ((tipAmount / billAmount) * 100);
      }
    }

    if (roundingMode === 'total' || roundingMode === 'both') {
      const roundedTotal = Math.ceil(total);
      if (roundedTotal !== total) {
        const prefix = roundingApplied ? roundingApplied + '. ' : '';
        roundingApplied = `${prefix}Total rounded up from ${fmtCurrency(total)} to ${fmtCurrency(roundedTotal)}`;
        total = roundedTotal;
        // Recalculate tip as the difference
        tipAmount = total - billAmount;
        effectiveTipPct = ((tipAmount / billAmount) * 100);
      }
    }

    const perPerson = total / splitPeople;
    const tipPerPerson = tipAmount / splitPeople;
    const showSplit = splitPeople > 1;
    const roundingChanged = roundingMode !== 'none';

    const results: Array<{
      id: string;
      label: string;
      value: string;
      highlight?: boolean;
      color?: 'positive' | 'negative' | 'neutral';
    }> = [
      {
        id: 'totalAmount',
        label: 'Total (Bill + Tip)',
        value: fmtCurrency(total),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'tipAmount',
        label: 'Tip Amount',
        value: fmtCurrency(tipAmount),
      },
    ];

    if (showSplit) {
      results.push({
        id: 'totalPerPerson',
        label: 'Per Person',
        value: fmtCurrency(perPerson),
      });
      results.push({
        id: 'tipPerPerson',
        label: 'Tip Per Person',
        value: fmtCurrency(tipPerPerson),
      });
    }

    // Show effective tip % only when rounding changed it
    if (roundingChanged && Math.abs(effectiveTipPct - tipPercent) > 0.01) {
      results.push({
        id: 'effectiveTipPercent',
        label: 'Effective Tip %',
        value: fmtPct(effectiveTipPct),
      });
    }

    results.push({
      id: 'splitInfo',
      label: 'Split',
      value: showSplit ? `Split ${splitPeople} ways` : 'No split',
    });

    if (roundingChanged) {
      results.push({
        id: 'roundingApplied',
        label: 'Rounding',
        value: roundingApplied,
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TipPanel, { values, results });
  },
  educational: {
    formula:
      'Tip = Bill × (Tip% ÷ 100) | Total = Bill + Tip | Per Person = Total ÷ People',
    formulaDescription:
      'A tip (gratuity) is an optional additional payment for service. Standard tip percentages in the US range from 15% to 20% for restaurant service. The split feature divides the total equally among diners.',
    diagram: {
      svg: '<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="30" width="280" height="150" rx="10" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="2"/><rect x="80" y="50" width="240" height="36" rx="6" fill="var(--svg-f1f5f9)"/><text x="100" y="74" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-64748b)">Bill Total</text><text x="300" y="74" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-1e293b)" text-anchor="end" font-weight="bold">$85.50</text><line x1="80" y1="96" x2="320" y2="96" stroke="var(--svg-e2e8f0)" stroke-width="1"/><rect x="80" y="106" width="240" height="36" rx="6" fill="var(--svg-dcfce7)"/><text x="100" y="130" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-16a34a)">Tip (20%)</text><text x="300" y="130" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-16a34a)" text-anchor="end" font-weight="bold">$17.10</text><line x1="80" y1="152" x2="320" y2="152" stroke="var(--svg-e2e8f0)" stroke-width="1"/><rect x="80" y="160" width="240" height="10" rx="5" fill="var(--svg-3b82f6)"/><text x="100" y="188" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="bold">Total</text><text x="300" y="188" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-1e293b)" text-anchor="end" font-weight="bold">$102.60</text></svg>',
      alt: 'Receipt-style visual showing a bill of $85.50, a 20% tip of $17.10, and a total of $102.60',
      caption: 'Tip calculation — the total is the sum of the original bill plus the selected tip percentage',
    },
    variables: [
      {
        symbol: 'Bill',
        name: 'Bill Amount',
        description: 'The pre-tip amount charged for goods or services.',
      },
      {
        symbol: 'Tip%',
        name: 'Tip Percentage',
        description: 'The percentage of the bill added as a gratuity, typically 15–20%.',
      },
      {
        symbol: 'Split',
        name: 'Split Between',
        description: 'Number of people sharing the bill equally. Total and tip are divided by this number.',
      },
    ],
    howToUse: [
      'Enter the bill amount (pre-tax if preferred).',
      'Select a standard tip percentage or choose Custom.',
      'Optionally set a split count and rounding mode.',
      'Read the total, tip, and per-person amounts instantly.',
    ],
    quickReference: [
      { label: '$50 bill at 15% tip', value: '$7.50 tip, $57.50 total' },
      { label: '$50 bill at 18% tip', value: '$9.00 tip, $59.00 total' },
      { label: '$50 bill at 20% tip', value: '$10.00 tip, $60.00 total' },
      { label: '$85 bill at 15% tip', value: '$12.75 tip, $97.75 total' },
      { label: '$85 bill at 20% tip', value: '$17.00 tip, $102.00 total' },
      { label: '$120 bill at 18% tip', value: '$21.60 tip, $141.60 total' },
      { label: 'Split $60 total 3 ways', value: '$20.00 per person' },
      { label: 'Split $102 total 4 ways', value: '$25.50 per person' },
    ],
    commonUses: [
      'Restaurant dining — quickly calculate the appropriate tip for any bill amount, whether dining solo or with a group',
      'Service industry tipping — compute gratuities for hairdressers, tattoo artists, tour guides, hotel staff, and other service professionals',
      'Group dinner splitting — divide the total bill including tip evenly among friends without the awkward math at the table',
      'Cash payment rounding — use the "OCD Rounding" mode to round totals up to the nearest dollar for easy cash transactions without fumbling for change',
      'Event catering — calculate tips for large catering orders or delivery services where the bill is significantly higher than a typical restaurant meal',
    ],
    explanation:
      'Tipping customs vary worldwide. In the United States, 15–20% of the pre-tax bill is standard for restaurant service, while other countries may include service charges or have different norms. This calculator gives you control over the percentage, splitting, and rounding — the "OCD Rounding" mode rounds everything up to the nearest dollar for easy cash payments or mental math.',
    faqs: [
      {
        question: 'What is the standard tip percentage?',
        answer:
          'In the US, 15% is standard for adequate service, 18% for good service, and 20% for excellent service. Some groups recommend 20% as the new baseline. For large parties (6+), many restaurants automatically add 18% gratuity.',
      },
      {
        question: 'Should I tip on pre-tax or post-tax amount?',
        answer:
          'Most tipping guidelines suggest tipping on the pre-tax amount, as tax is not a service provided. However, tipping on the post-tax amount only adds a small difference and is a simpler mental math approach for many people.',
      },
      {
        question: "What's the etiquette for splitting the bill?",
        answer:
          'For group dining, splitting evenly is the simplest approach. If some people ordered significantly more expensive items, individual bills may be fairer. Many restaurants can split checks by request. When using this calculator, just set the number of people for even division.',
      },
      {
        question: 'How does the rounding mode work?',
        answer: 'The "OCD Rounding" feature gives you four options. "No rounding" keeps exact amounts. "Round total up" rounds the combined total to the nearest whole dollar. "Round tip up" rounds only the tip portion. "Round both" rounds both. This is useful for cash payments where exact change is inconvenient — many people prefer to round up to simplify the transaction, and the difference is usually less than a dollar.',
      },
      {
        question: 'Should I tip differently for takeout vs. dine-in?',
        answer: 'Takeout tipping is generally lower than dine-in, with 10-15% being common vs. 15-20% for table service. However, many argue that if the restaurant staff packaged your order and checked its accuracy, 15-18% is still appropriate. For delivery services (Uber Eats, DoorDash, pizza delivery), 15-20% of the pre-tax order total is standard, as the driver relies on tips as their primary income and uses their own vehicle and gas.',
      },
    ],
    citations: [

      { source: 'Wikipedia - Gratuity', url: 'https://en.wikipedia.org/wiki/Gratuity' },
    ],
  },
};

export default tipConfig;
