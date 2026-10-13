import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import PaymentFeesPanel from './PaymentFeesPanel';
import { FEE_MAP, forwardFee, reverseInvoice } from './paymentMath';

const paymentFeesConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'invoiceAmount',
      label: 'Invoice / Sale Amount',
      type: 'number',
      placeholder: '100.00',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      inputMode: 'decimal',
      helpText: 'The gross amount you charge the customer before fees',
    },
    {
      id: 'platform',
      label: 'Payment Platform',
      type: 'select',
      required: true,
      options: [
        { label: 'Stripe — domestic card (2.9% + $0.30)', value: 'stripe-domestic' },
        { label: 'Stripe — international card (4.4% + $0.30)', value: 'stripe-international' },
        { label: 'PayPal Checkout — domestic (3.49% + $0.49)', value: 'paypal-domestic' },
        { label: 'PayPal — standard card payment (2.99% + $0.49)', value: 'paypal-cards' },
        { label: 'PayPal Checkout — international (4.99% + $0.49)', value: 'paypal-international' },
        { label: 'Square — in-person (2.6% + $0.15)', value: 'square' },
      ],
      helpText: 'Published US standard rates, checked October 2026 (Square in-person from fee guides, not confirmed on Square\'s page). Negotiated, interchange-plus and currency-conversion fees are not included.',
    },
    {
      id: 'reverseMode',
      label: 'Calculate what to invoice to receive exact amount',
      type: 'select',
      required: true,
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes', value: 'yes' },
      ],
    },
  ],

  calculate: (values) => {
    const amount = parseFloat(values.invoiceAmount);
    const platform = values.platform || 'stripe-domestic';
    const reverseMode = values.reverseMode || 'no';
    const feeInfo = FEE_MAP[platform];
    if (!feeInfo) return [];
    if (!Number.isFinite(amount) || amount <= 0) return [];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const reverse = reverseMode === 'yes';
    // forward: the customer pays `amount`; reverse: `amount` is the net you need, the invoice is solved for
    const p = reverse ? reverseInvoice(amount, feeInfo) : forwardFee(amount, feeInfo);

    return [
      { id: 'fee', label: 'Processing Fee', value: `$${fmt(p.fee)}`, color: 'negative' as const },
      { id: 'feePercent', label: 'Fee Rate', value: `${(feeInfo.rate * 100).toFixed(2)}%`, color: 'neutral' as const },
      { id: 'feeFixed', label: 'Fixed Fee', value: `$${fmt(feeInfo.fixed)}`, color: 'neutral' as const },
      {
        id: 'netAmount',
        label: 'You Receive',
        value: `$${fmt(p.net)}`,
        highlight: true,
        ...(reverse
          ? {}
          : {
              interpretation: `Payment processors charge a percentage plus a small fixed fee per transaction — the fixed portion hits small transactions hardest, so tiny sales lose a disproportionate share to fees (here ${p.effectivePct.toFixed(2)}% of the sale). Comparing processors on rate alone misses this; check the fixed fee too if you sell a lot of low-ticket items.`,
            }),
        color: 'positive' as const,
      },
      { id: 'platform', label: 'Platform', value: feeInfo.label, color: 'neutral' as const },
      reverse
        ? { id: 'reverseAmount', label: 'Amount to Invoice', value: `$${fmt(p.charged)}`, highlight: true, color: 'positive' as const }
        : { id: 'reverseAmount', label: 'Amount to Invoice', value: '—', color: 'neutral' as const },
      { id: 'totalPlatformFee', label: 'Total Fee Charged', value: `$${fmt(p.fee)}`, color: 'negative' as const },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PaymentFeesPanel, { values, results });
  },

  educational: {
    formula: 'Fee = Amount × Rate + Fixed Fee | Net = Amount − Fee',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="80" width="320" height="200" fill="var(--svg-f8fafc)" rx="8"/><rect x="80" y="100" width="280" height="40" fill="var(--svg-22c55e)" rx="4"/><text x="220" y="125" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Amount $100.00</text><rect x="80" y="150" width="280" height="30" fill="var(--svg-ef4444)" rx="4"/><text x="220" y="170" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">− 2.9% Fee (−$2.90)</text><rect x="80" y="185" width="280" height="30" fill="var(--svg-ef4444)" rx="4"/><text x="220" y="205" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">− $0.30 Fixed Fee</text><rect x="80" y="230" width="280" height="35" fill="var(--svg-22c55e)" rx="4"/><text x="220" y="253" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Net: $96.80</text></svg>',
      alt: 'Transaction amount breakdown showing percentage and fixed fee deductions',
      caption: 'Payment processing — percentage fee plus fixed fee deducted from total',
    },
    formulaDescription:
      'Payment processors charge a percentage of the transaction amount plus a fixed per-transaction fee. The net amount is what you actually receive after fees.',
    variables: [
      { symbol: 'Rate', name: 'Percentage Fee', description: 'The percentage of the transaction amount charged by the processor (about 2.6% to 5% for the plans in this calculator).' },
      { symbol: 'Fixed', name: 'Fixed Per-Transaction Fee', description: 'A flat fee charged on each transaction ($0.15 to $0.49 for the plans in this calculator).' },
      { symbol: 'Net', name: 'Net Amount (Payout)', description: 'The amount you actually receive after all fees are deducted.' },
    ],
    quickReference: [
      { label: 'Stripe domestic card', value: '2.9% + $0.30' },
      { label: 'Stripe international card', value: '4.4% + $0.30 (2.9% + 1.5%); +1% more if currency conversion is needed' },
      { label: 'PayPal Checkout (domestic)', value: '3.49% + $0.49' },
      { label: 'PayPal standard card payment', value: '2.99% + $0.49' },
      { label: 'PayPal international', value: '+1.50% on top of the domestic rate' },
      { label: 'Square in-person (Free plan)', value: '2.6% + $0.15 (online is 3.3% + $0.30)' },
      { label: '$10 transaction, Stripe', value: 'Fee = $0.59 (effective rate 5.9%)' },
      { label: '$100 transaction, Stripe', value: 'Fee = $3.20 (effective rate 3.20%)' },
      { label: '$1,000 transaction, Stripe', value: 'Fee = $29.30 (effective rate 2.93%)' },
    ],
    howToUse: [
      'Enter the invoice or sale amount you plan to charge.',
      'Select your payment platform and fee tier (Stripe, PayPal, or Square in-person).',
      'Toggle "Calculate what to invoice" to see how much to charge to receive a specific net amount.',
      'View the fee breakdown and your net payout.',
    ],
    explanation:
      'Payment processing fees are the cost of accepting credit cards and digital payments. These fees cover interchange fees (paid to the card-issuing bank), assessment fees (paid to the card network like Visa/Mastercard), and the processor\'s markup. While fees seem small per transaction (2–5%), they can significantly impact margins — especially for businesses with low average order values or high volumes. For a $10 transaction with a 2.9% + $0.30 fee, the effective fee rate is 5.9%. Understanding these fees helps you price your products correctly and choose the right payment processor for your business model.',
    commonUses: [
      'Calculating the net amount you will actually receive after credit card processing fees on each transaction',
      'Determining how much to invoice a client so that after processing fees you receive exactly the amount you need',
      'Comparing fee structures across payment processors (Stripe, PayPal, Square) to choose the most cost-effective option for your business',
    ],
    faqs: [
      {
        question: 'Why do international transactions cost more?',
        answer: 'Cards issued outside your country usually carry higher network and issuer costs, and processors pass that on. Stripe adds 1.5% for international cards (4.4% + $0.30 versus 2.9% + $0.30 domestic) and another 1% if currency conversion is needed; PayPal adds 1.50% to its domestic rate for international commercial transactions.',
      },
      {
        question: 'How should I account for fees when pricing?',
        answer: 'Use the reverse mode to determine what to charge. If you need to net $100 and fees are 2.9% + $0.30, you need to invoice approximately $103.30. Many businesses either absorb the fee as a cost of doing business or add a surcharge (where legally permitted).',
      },
      {
        question: 'Which platform has the lowest fees?',
        answer: 'It depends on the ticket size and channel. In-person, Square (2.6% + $0.15) is cheapest of the three for most sales. Online, Stripe (2.9% + $0.30) is cheaper than PayPal Checkout (3.49% + $0.49) at every amount, and also cheaper than PayPal\'s standard card rate (2.99% + $0.49), because both its percentage and fixed fee are lower. Square\'s online rate (3.3% + $0.30 on the Free plan) is higher than Stripe\'s. Features, payouts, integrations and dispute handling matter too.',
      },
      {
        question: 'What is the difference between interchange, assessment, and processor markup?',
        answer: 'Interchange fees are paid to the card-issuing bank (typically around 1.5–2.5% of the transaction) and are set by card networks. Assessment fees are paid to the card network (Visa, Mastercard, Amex) and are typically 0.13–0.15%. The processor markup is what Stripe, PayPal, or Square charges for their service — this is where they make their profit. Flat-rate processors like the ones in this calculator bundle all three into a single rate, making them simpler but often more expensive than interchange-plus pricing for high-volume merchants.',
      },
      {
        question: 'Should I pass processing fees to customers?',
        answer: 'Rules vary by state and by card network: some states restrict or prohibit credit-card surcharges, card networks cap them and require clear disclosure, and surcharging debit cards is generally not allowed. Check the current rules for your location and your processor\'s terms before adding one. Many businesses instead build the processing cost into their prices.',
      },
      {
        question: 'How do chargeback fees factor into my costs?',
        answer: 'Beyond the processing fee, a dispute (chargeback) usually adds a separate per-dispute fee from your processor, and card-network programs can penalise merchants with high dispute rates. A single chargeback can wipe out the profit from many small sales. This calculator does not include chargeback costs; check your processor\'s dispute fee and factor in your own dispute history.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Sarah runs a small online boutique and processes 200 orders per month at an average order value of $65 through Stripe. She is comparing PayPal Checkout for the same orders.',
        inputs: { invoiceAmount: '65', platform: 'stripe-domestic', reverseMode: 'no' },
        result: 'Stripe fee: $2.19 per order (65 × 0.029 + 0.30 = 2.185, rounded to the cent). Net: $62.81. Monthly fees across 200 orders: $438. PayPal Checkout would charge $2.76 per order (65 × 0.0349 + 0.49 = 2.7585), about $0.57 more per order or $114 more per month.',
        insight: 'On a $65 order Stripe is both lower in rate and lower in fixed fee than PayPal Checkout, so the gap is $0.57 per order. Over 200 orders that is about $114 a month, or $1,368 a year. Many shops still offer PayPal because some customers prefer it; the cost is worth knowing when deciding whether to make it the default.',
      },
      {
        scenario: 'A freelance designer needs to receive exactly $5,000 net from an international client. The client will pay via PayPal. How much should the designer invoice?',
        inputs: { invoiceAmount: '5000', platform: 'paypal-international', reverseMode: 'yes' },
        result: 'To receive $5,000 net: invoice $5,263.12. Fee = $263.12 (4.99% + $0.49). The client pays $5,263.12, the designer nets $5,000.00.',
        insight: 'Using reverse mode, the designer discovers they need to add $263.12 to the invoice just to cover PayPal fees. Alternatives include a bank or wire transfer (often a flat fee), or asking the client to cover processing costs. For large international invoices the percentage fee is a significant cost, so factor it into your rate or payment terms.',
      },
      {
        scenario: 'A SaaS company processes $150,000/month across 3,000 transactions (average $50/transaction) via Stripe. They want to understand their effective processing rate and whether interchange-plus pricing would save money.',
        inputs: { invoiceAmount: '50', platform: 'stripe-domestic', reverseMode: 'no' },
        result: 'Per-transaction fee: $1.75 (50 × 0.029 + 0.30). Effective rate: 3.5%. Total monthly fees: $5,250. Annual: $63,000.',
        insight: 'At $150K/month, the effective rate of 3.5% (inflated by the $0.30 fixed fee on small transactions) means the SaaS company is paying $63K/year in processing fees. At this volume it is worth asking processors for custom or interchange-plus pricing. Purely as an illustration (not a quote): if such a plan cost 2.3% + $0.10 per transaction, monthly cost would be 150,000 × 0.023 + 3,000 × 0.10 = $3,750 versus $5,250 on flat-rate, saving $18,000 a year. Real quotes depend on card mix, risk and negotiation.',
      },
    ],
    proTips: [
      'Use the reverse mode when invoicing clients: enter the amount you NEED to receive and the calculator tells you what to charge, so processing fees come out of the invoice rather than your margin. For large B2B invoices, ask your processor about lower-cost bank-transfer options.',
      'The fixed fee has a disproportionate impact on small transactions. A $5 sale on Stripe costs $0.45 in fees (an effective rate of 9%). If you sell low-priced items, consider bundling to raise the average order value, setting a minimum order, or choosing a plan with a lower fixed fee.',
      'Compare processors on your own mix of ticket size, card origin and channel, not just the headline percentage: a lower rate with a higher fixed fee can lose on small orders, and international cards and currency conversion add percentage points.',
      'For subscriptions, billing annually instead of monthly means one transaction fee instead of twelve. For a $100/month plan, 12 × ($100 × 0.029 + $0.30) = $38.40 a year in Stripe fees versus ($1,200 × 0.029 + $0.30) = $35.10 for one annual charge. Check whether your processor adds separate billing or recurring-payment fees on top.',
      'Fraud and chargeback costs can dwarf processing fees; use your processor\'s fraud tools and keep a record of fulfilment to contest disputes. This calculator shows processing fees only.',
    ],
    limitations: [
      'This calculator uses publicly listed US standard rates checked in October 2026 (Stripe and PayPal from their pricing pages; Square in-person from 2026 fee guides because Square\'s page could not be read automatically). It does not account for negotiated/custom rates or interchange-plus pricing.',
      'It does not include additional fees such as monthly gateway or platform fees, PCI compliance fees, chargeback/dispute fees, or ACH/bank transfer alternatives.',
      'Currency conversion fees (Stripe adds 1%; PayPal applies a 3-4% spread) and tax handling (sales tax, VAT, GST) are not modeled.',
      'Processors change pricing periodically, so always check the current pricing page before making business decisions. Processors round each fee to the cent; this calculator does the same.',
    ],
    citations: [
      { source: 'Stripe', url: 'https://stripe.com/pricing' },
      { source: 'PayPal', url: 'https://www.paypal.com/us/business/paypal-business-fees' },
      { source: 'Square', url: 'https://squareup.com/us/en/pricing' },
    ],
  },
};

export default paymentFeesConfig;
