import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import TipSplitterPanel from './TipSplitterPanel';
import { splitBill } from './tipMath';

const usd = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const tipSplitterConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'billAmount',
      label: 'Bill Amount',
      type: 'number',
      placeholder: '85.50',
      prefix: '$',
      min: 0,
      max: 1000000,
      step: 0.01,
      required: true,
      helpText: 'Total bill amount shown on the receipt (including tax, before the tip)',
    },
    {
      id: 'tipPercent',
      label: 'Tip Percentage',
      type: 'select',
      required: true,
      helpText: 'Choose the gratuity percentage you want to leave',
      options: [
        { label: '10%', value: '10' },
        { label: '15%', value: '15' },
        { label: '18%', value: '18' },
        { label: '20%', value: '20' },
        { label: '22%', value: '22' },
        { label: '25%', value: '25' },
        { label: '30%', value: '30' },
      ],
    },
    {
      id: 'numPeople',
      label: 'Number of People',
      type: 'number',
      placeholder: '4',
      unit: 'people',
      min: 1,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Number of people splitting the bill',
    },
    {
      id: 'taxAmount',
      label: 'Tax Amount (optional)',
      type: 'number',
      placeholder: '7.20',
      prefix: '$',
      min: 0,
      max: 1000000,
      step: 0.01,
      helpText: 'Enter the tax shown on the bill if you want the tip calculated on the pre-tax amount (must be less than the bill)',
    },
  ],
  calculate: (values) => {
    const sp = splitBill(values);
    if (!sp) return [];
    const even = sp.highCount === 0;

    const results = [
      {
        id: 'perPersonTotal',
        label: `Each Person Pays (÷${sp.people})`,
        value: usd(sp.highShare),
        highlight: true,
        color: 'positive' as const,
        interpretation: even
          ? `${usd(sp.totalCents)} ÷ ${sp.people} divides exactly.`
          : `${usd(sp.totalCents)} does not divide evenly in cents: ${sp.highCount} ${sp.highCount === 1 ? 'person pays' : 'people pay'} ${usd(sp.highShare)} and ${sp.people - sp.highCount} pay ${usd(sp.lowShare)}, so the shares add up to the total exactly.`,
      },
      { id: 'tipAmount', label: 'Total Tip', value: usd(sp.tipCents), color: 'neutral' as const, interpretation: `${usd(sp.billCents - sp.taxCents)} ${sp.taxCents > 0 ? '(pre-tax) ' : ''}× ${values.tipPercent || '18'}%, rounded to the cent.` },
      { id: 'perPersonTip', label: 'Tip Per Person', value: usd(sp.tipShares[0]), color: 'neutral' as const },
      { id: 'totalBill', label: 'Grand Total (bill + tip)', value: usd(sp.totalCents), color: 'neutral' as const },
    ];
    if (!even) {
      results.push({ id: 'shareSplit', label: 'Exact Split', value: `${sp.highCount} × ${usd(sp.highShare)} + ${sp.people - sp.highCount} × ${usd(sp.lowShare)}`, color: 'neutral' as const });
    }
    return results;
  },
  explainSteps: (values) => {
    const sp = splitBill(values);
    if (!sp) return [];
    const pct = parseFloat(values.tipPercent || '18');
    const base = sp.billCents - sp.taxCents;
    const steps = [
      sp.taxCents > 0
        ? { label: 'Take the tax off the bill', expr: `${usd(sp.billCents)} − ${usd(sp.taxCents)} = ${usd(base)}`, note: 'The tip is figured on the pre-tax amount, because tax is not part of the service.' }
        : { label: 'Start from the bill', expr: `${usd(base)}  (no tax entered, so the tip is on the whole bill)` },
      { label: 'Work out the tip', expr: `${usd(base)} × ${pct}% = ${usd(sp.tipCents)}` },
      { label: 'Add the tip to the bill', expr: `${usd(sp.billCents)} + ${usd(sp.tipCents)} = ${usd(sp.totalCents)}` },
    ];
    if (sp.people > 1) {
      const even = sp.highCount === 0;
      steps.push({
        label: `Split between ${sp.people} people`,
        expr: even
          ? `${usd(sp.totalCents)} ÷ ${sp.people} = ${usd(sp.highShare)}`
          : `${usd(sp.totalCents)} ÷ ${sp.people}: ${sp.highCount} ${sp.highCount === 1 ? 'pays' : 'pay'} ${usd(sp.highShare)}, ${sp.people - sp.highCount} ${sp.people - sp.highCount === 1 ? 'pays' : 'pay'} ${usd(sp.lowShare)}`,
        ...(even ? {} : { note: 'The total does not divide evenly in cents, so the leftover cents go one each to the first people.' }),
      });
    }
    return steps;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TipSplitterPanel, { values, results });
  },
  educational: {
    formula: 'Tip = Pre-Tax Bill × Tip % | Per Person = (Bill + Tip) ÷ Number of People',
    formulaDescription:
      'The tip is calculated by multiplying the chosen tip percentage by the pre-tax bill amount (total bill minus sales tax). This ensures you are not tipping on taxes, which are not service charges. The grand total is then computed as the bill amount plus the tip, and this total is divided evenly among the specified number of people. Each person pays an equal share of both the food and the gratuity, making bill splitting fast and fair for group dining.',
    diagram: {
      svg: '<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="210" y="22" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">How a $100 Bill Splits 4 Ways</text>' +
        '<!-- Bill total bar --><rect x="80" y="40" width="260" height="30" rx="6" fill="var(--svg-e2e8f0)"/>' +
        '<text x="210" y="60" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">$100.00 — Total Bill</text>' +
        '<!-- Split into 4 -->' +
        '<text x="210" y="92" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-64748b)" text-anchor="middle">Split 4 ways:</text>' +
        '<rect x="30" y="105" width="80" height="36" rx="6" fill="var(--svg-3b82f6)"/><text x="70" y="128" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">$25.00</text>' +
        '<rect x="120" y="105" width="80" height="36" rx="6" fill="var(--svg-22c55e)"/><text x="160" y="128" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">$25.00</text>' +
        '<rect x="210" y="105" width="80" height="36" rx="6" fill="var(--svg-f59e0b)"/><text x="250" y="128" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">$25.00</text>' +
        '<rect x="300" y="105" width="80" height="36" rx="6" fill="var(--svg-8b5cf6)"/><text x="340" y="128" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">$25.00</text>' +
        '<text x="210" y="170" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Each person pays: $25 + their share of the tip</text>' +
        '</svg>',
      alt: 'Diagram showing a $100 bill split equally into 4 portions of $25 each',
      caption: 'Splitting a bill equally divides the total by the number of people',
    },
    variables: [
      { symbol: 'Pre-Tax Bill', name: 'Food & Drink Subtotal', description: 'The bill amount before sales tax is applied.' },
      { symbol: 'Tip %', name: 'Gratuity Percentage', description: 'The percentage of the pre-tax bill you wish to leave as a tip.' },
      { symbol: 'N', name: 'Number of People', description: 'The number of diners splitting the bill equally. Each person pays the same total including their share of the tip.' },
    ],
    commonUses: [
      'Splitting a restaurant bill evenly among a group of diners with tip included',
      'Calculating the exact tip amount and per-person share for a group dinner or celebration',
      'Deciding how much each person owes when the tip is figured on the pre-tax subtotal',
      'Quickly comparing different tip percentages to decide on the right gratuity level',
    ],
    howToUse: [
      'Enter the total bill amount shown on your receipt.',
      'Select your desired tip percentage.',
      'Enter the number of people splitting the bill.',
      'Optionally enter the tax amount to calculate tip on the pre-tax subtotal.',
      'The result shows the per-person amount and itemized breakdown.',
    ],
    explanation:
      'Tipping etiquette varies by country and service type. In the United States, standard restaurant tips range from 15% (adequate) to 20% (good service) to 25%+ (exceptional). In the UK and Europe, 10-15% is typical, and tipping is less expected. Tipping became common in the United States in the late 19th century. Counter service, fast casual, and food delivery apps often prompt for tips ranging from 10-25%. The tip is traditionally calculated on the pre-tax subtotal, though many people tip on the total bill amount for simplicity. Knowing when and how much to tip can prevent awkward social situations and ensure service workers are fairly compensated. In the US, many service industry workers earn a tipped minimum wage as low as $2.13 per hour, making tips their primary income source. For group dining, splitting the bill evenly among all diners is the most common approach, but you should also consider whether some people ordered significantly more expensive items. Many restaurants automatically add gratuity of 18% or higher for parties of six or more, so always check your bill before adding an additional tip. During the COVID-19 pandemic, tipping norms shifted significantly, with many consumers tipping more generously (20-25%) to support hospitality workers facing reduced hours and health risks. This elevated tipping trend has partially persisted in the post-pandemic economy.',
    workedExamples: [
      { scenario: 'Four friends dine out and the total bill is $120 with $9.60 tax. They want to leave a 20% tip on the pre-tax amount and split evenly.', inputs: { billAmount: '120', tipPercent: '20', numPeople: '4', taxAmount: '9.60' }, result: '$35.52 per person (total $142.08 / 4). Tip: $22.08 total, $5.52 per person.', insight: 'The pre-tax subtotal is $110.40. At 20%, the tip is $22.08. The grand total is $142.08, split four ways at $35.52 per person. Each person also pays $5.52 as their share of the tip.' },
      { scenario: 'Two colleagues grab lunch. The bill is $48 total including $4 tax. They want to tip 18% on the pre-tax amount.', inputs: { billAmount: '48', tipPercent: '18', numPeople: '2', taxAmount: '4' }, result: '$27.96 per person (total $55.92 / 2). Tip: $7.92 total, $3.96 per person.', insight: 'Pre-tax subtotal is $44. Tip at 18% is $7.92. Total is $55.92, so each person pays $27.96. Without the tax deduction, the tip would have been $8.64 (18% of $48), saving them $0.72 by tipping on the pre-tax amount.' },
      { scenario: 'A group of 8 celebrates a birthday at a restaurant. The bill is $320 with no gratuity added yet, and they want to leave 18%.', inputs: { billAmount: '320', tipPercent: '18', numPeople: '8' }, result: '$47.20 per person (total $377.60 / 8). Tip: $57.60 total, $7.20 per person.', insight: 'Each of the 8 people pays $47.20: $40 for their share of the bill plus $7.20 for tip. If the restaurant has already added an automatic gratuity to the bill, enter a tip that matches it (or compare with the receipt) so the group does not tip twice.' },
    ],
    proTips: [
      'Double the tax to estimate a tip quickly: with an 8% sales tax, doubling the tax amount gives a 16% tip on the pre-tax amount. The shortcut gets bigger or smaller with the local tax rate, so check it against the percentage you actually want.',
      'When splitting a bill among couples or pairs, first divide by the number of sub-groups, then use the calculator for the final per-person split. This avoids confusion when some groups share entrees or drinks.',
      'For business meals, US tax rules generally limit the deduction to 50% of the cost, and the rules change, so keep the itemized receipt and check current IRS guidance.',
      'In countries where tipping is not customary (Japan, South Korea, China), leaving a tip can actually cause confusion or offense. Always research local customs before traveling.',
      'Digital payment apps like Venmo, Zelle, and Splitwise have made bill splitting dramatically easier. One person pays the full bill and others reimburse instantly — this calculator helps determine exactly how much each person owes.',
    ],
    limitations: [
      'This calculator assumes equal splitting of the total bill among all diners; amounts are worked out in whole cents, and when the total does not divide evenly a few people pay one cent more so the shares add up exactly. In reality, individuals may have consumed items of widely different costs, and a truly fair split would require itemizing each person\'s order. The calculator also assumes tip is calculated on the pre-tax amount, which may differ from local customs or restaurant policies. Auto-gratuity policies (typically 18% for parties of 6+) vary by restaurant and are not automatically accounted for. Currency conversion for international travel is not included.',
    ],
    quickReference: [
      { label: '15% tip (adequate)', value: 'Multiply bill by 0.15' },
      { label: '18% tip (standard)', value: 'Multiply bill by 0.18' },
      { label: '20% tip (good service)', value: 'Multiply bill by 0.20' },
      { label: '25% tip (exceptional)', value: 'Multiply bill by 0.25' },
      { label: 'US federal tipped minimum cash wage', value: '$2.13/hr (some states require more)' },
      { label: 'Large party auto-gratuity', value: 'Varies by restaurant (often 15-20% for larger parties)' },
    ],
    faqs: [
      {
        question: 'Should I tip on the pre-tax or post-tax amount?',
        answer: 'Traditionally, tips are calculated on the pre-tax food and drink subtotal. However, the difference is small and tipping on the total is an acceptable and common practice. For a $100 meal with 8% tax, tipping 20% on the pre-tax amount ($20) versus the total ($21.60) is only a $1.60 difference.',
      },
      {
        question: 'What is an appropriate tip for different services?',
        answer: 'These are common US customs, not rules, and vary by region. Sit-down restaurants: 15-20% (more for excellent service). Bars: about $1-2 per drink or 15-20%. Food delivery: 10-20%. Taxis and rideshares: 10-15%. Salon services: 15-20%. Valet: a few dollars. Moving services: customs vary by region and job size, so ask the company.',
      },
      {
        question: 'How should a group split a bill fairly?',
        answer: 'The simplest method is dividing equally by the number of diners, which this calculator uses. For fairness, some groups prefer that each person pays for their own items plus an equal share of the tip. If someone ordered significantly more expensive items, consider adjusting shares accordingly to avoid resentment.',
      },
      {
        question: 'Is it okay to tip less for bad service?',
        answer: 'In the US, many etiquette guides treat 15% as the baseline for adequate service. Tipping less is a personal choice and norms differ by country. If service is exceptional, 22-25% or more is a generous way to show appreciation.',
      },
      {
        question: 'Should I tip on takeout and counter service orders?',
        answer: 'Generally yes, but at a lower rate than full-service dining. For takeout, 10-15% is appropriate since the service team still packages and checks your order. Coffee shops and quick-service counters often have tip jars or digital prompts — 10-15% for crafted drinks, $1-2 for simple drip coffee. Food delivery drivers should receive 15-20%, especially in bad weather or for large orders.',
      },
    ],
  
    citations: [

      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/t/tip.asp' },
    ],
  },
};

export default tipSplitterConfig;
