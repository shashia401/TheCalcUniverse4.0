import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import PaymentFeesPanel from './PaymentFeesPanel';

interface FeeStructure {
  rate: number;
  fixed: number;
  label: string;
}

const FEE_MAP: Record<string, FeeStructure> = {
  'stripe-domestic': { rate: 0.029, fixed: 0.30, label: 'Stripe Domestic' },
  'stripe-international': { rate: 0.039, fixed: 0.30, label: 'Stripe International' },
  'paypal-domestic': { rate: 0.0299, fixed: 0.49, label: 'PayPal Domestic' },
  'paypal-international': { rate: 0.0449, fixed: 0.49, label: 'PayPal International' },
  'square': { rate: 0.026, fixed: 0.10, label: 'Square' },
};

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
        { label: 'Stripe Domestic', value: 'stripe-domestic' },
        { label: 'Stripe International', value: 'stripe-international' },
        { label: 'PayPal Domestic', value: 'paypal-domestic' },
        { label: 'PayPal International', value: 'paypal-international' },
        { label: 'Square', value: 'square' },
      ],
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
    if (isNaN(amount) || amount <= 0) return [];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (reverseMode === 'yes') {
      // Calculate what to invoice to receive exactly `amount`
      const invoiceAmount = Math.ceil((amount + feeInfo.fixed) / (1 - feeInfo.rate) * 100) / 100;
      const fee = invoiceAmount * feeInfo.rate + feeInfo.fixed;
      const net = invoiceAmount - fee;

      return [
        {
          id: 'fee',
          label: 'Processing Fee',
          value: `$${fmt(fee)}`,
          color: 'negative' as const,
        },
        {
          id: 'feePercent',
          label: 'Fee Rate',
          value: `${(feeInfo.rate * 100).toFixed(2)}%`,
          color: 'neutral' as const,
        },
        {
          id: 'feeFixed',
          label: 'Fixed Fee',
          value: `$${fmt(feeInfo.fixed)}`,
          color: 'neutral' as const,
        },
        {
          id: 'netAmount',
          label: 'You Receive',
          value: `$${fmt(net)}`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'platform',
          label: 'Platform',
          value: feeInfo.label,
          color: 'neutral' as const,
        },
        {
          id: 'reverseAmount',
          label: 'Amount to Invoice',
          value: `$${fmt(invoiceAmount)}`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'totalPlatformFee',
          label: 'Total Fee Charged',
          value: `$${fmt(fee)}`,
          color: 'negative' as const,
        },
      ];
    }

    const fee = amount * feeInfo.rate + feeInfo.fixed;
    const net = amount - fee;

    return [
      {
        id: 'fee',
        label: 'Processing Fee',
        value: `$${fmt(fee)}`,
        color: 'negative' as const,
      },
      {
        id: 'feePercent',
        label: 'Fee Rate',
        value: `${(feeInfo.rate * 100).toFixed(2)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'feeFixed',
        label: 'Fixed Fee',
        value: `$${fmt(feeInfo.fixed)}`,
        color: 'neutral' as const,
      },
      {
        id: 'netAmount',
        label: 'You Receive',
        value: `$${fmt(net)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'platform',
        label: 'Platform',
        value: feeInfo.label,
        color: 'neutral' as const,
      },
      {
        id: 'reverseAmount',
        label: 'Amount to Invoice',
        value: '—',
        color: 'neutral' as const,
      },
      {
        id: 'totalPlatformFee',
        label: 'Total Fee Charged',
        value: `$${fmt(fee)}`,
        color: 'negative' as const,
      },
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
      { symbol: 'Rate', name: 'Percentage Fee', description: 'The percentage of the transaction amount charged by the processor, typically 2.5–4.5%.' },
      { symbol: 'Fixed', name: 'Fixed Per-Transaction Fee', description: 'A flat fee charged on each transaction, typically $0.10–$0.49.' },
      { symbol: 'Net', name: 'Net Amount (Payout)', description: 'The amount you actually receive after all fees are deducted.' },
    ],
    quickReference: [
      { label: 'Stripe Domestic', value: '2.9% + $0.30' },
      { label: 'Stripe International', value: '3.9% + $0.30 (+1% cross-border)' },
      { label: 'PayPal Domestic', value: '2.99% + $0.49' },
      { label: 'PayPal International', value: '4.49% + $0.49' },
      { label: 'Square', value: '2.6% + $0.10 (lowest per-transaction fixed fee)' },
      { label: '$10 transaction, Stripe', value: 'Fee = $0.59 (effective rate 5.9%)' },
      { label: '$100 transaction, Stripe', value: 'Fee = $3.20 (effective rate 3.20%)' },
      { label: '$1,000 transaction, Stripe', value: 'Fee = $29.30 (effective rate 2.93%)' },
    ],
    howToUse: [
      'Enter the invoice or sale amount you plan to charge.',
      'Select your payment platform (Stripe, PayPal, or Square).',
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
        answer: 'International transactions incur higher interchange fees because of currency conversion, cross-border settlement, and increased fraud risk. Stripe charges 3.9% + $0.30 for international cards vs. 2.9% + $0.30 for domestic ones.',
      },
      {
        question: 'How should I account for fees when pricing?',
        answer: 'Use the reverse mode to determine what to charge. If you need to net $100 and fees are 2.9% + $0.30, you need to invoice approximately $103.30. Many businesses either absorb the fee as a cost of doing business or add a surcharge (where legally permitted).',
      },
      {
        question: 'Which platform has the lowest fees?',
        answer: 'For domestic transactions, Square has the lowest rate at 2.6% + $0.10. Stripe Domestic (2.9% + $0.30) and PayPal Domestic (2.99% + $0.49) are comparable. For international, Stripe\'s 3.9% + $0.30 is generally lower than PayPal\'s 4.49% + $0.49. However, consider other factors like features, integrations, and customer experience.',
      },
      {
        question: 'What is the difference between interchange, assessment, and processor markup?',
        answer: 'Interchange fees are paid to the card-issuing bank (typically 1.5–2.5% of the transaction) and are set by card networks. Assessment fees are paid to the card network (Visa, Mastercard, Amex) and are typically 0.13–0.15%. The processor markup is what Stripe, PayPal, or Square charges for their service — this is where they make their profit. Flat-rate processors like the ones in this calculator bundle all three into a single rate, making them simpler but sometimes more expensive than interchange-plus pricing for high-volume merchants processing over $50K/month.',
      },
      {
        question: 'Should I pass processing fees to customers?',
        answer: 'In most US states, you can legally add a surcharge for credit card payments (typically up to 4%), but you must: display clear signage at the point of sale, list the surcharge as a separate line item on the receipt, and NOT apply surcharges to debit cards even when processed as credit. Some states (Colorado, Connecticut, Massachusetts) restrict surcharging. Passing fees to customers saves you money but may create friction — many businesses instead build the processing cost into their pricing, treating it as a cost of doing business. For B2B invoices over $500, consider ACH/bank transfer payments which cost $0.50–1.50 flat fee instead of a percentage.',
      },
      {
        question: 'How do chargeback fees factor into my costs?',
        answer: 'Beyond the processing fee, chargebacks (when a customer disputes a charge) come with additional fees of $15–25 per incident regardless of who wins the dispute. Even if you win, you typically still pay the fee (Stripe is an exception — they refund the $15 dispute fee if you win). A single chargeback can wipe out the profit from many small transactions. Chargeback rates above 0.75–1% can result in your merchant account being terminated or placed in a high-risk category with even higher processing rates. This calculator does not include chargeback costs — factor them separately based on your business\'s dispute history.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Sarah runs a small online boutique and processes 200 orders per month at an average order value of $65. She currently uses Stripe and is considering switching to Square to save on fees.',
        inputs: { invoiceAmount: '65', platform: 'stripe-domestic', reverseMode: 'no' },
        result: 'Stripe fee: $2.19 per order (65 × 0.029 + 0.30). Net: $62.81. Monthly fees across 200 orders: $438. Square would charge $1.79 per order (65 × 0.026 + 0.10), saving $0.40/order or $80/month — $960/year.',
        insight: 'The $80/month savings from switching to Square is real but modest for 200 orders. Sarah should also consider that: Square integrates less deeply with some e-commerce platforms than Stripe; Stripe offers more advanced fraud protection tools (Radar) that might reduce chargeback costs; and Square\'s flat 2.6% rate doesn\'t distinguish between card types, while Stripe\'s rate is the same. For Sarah\'s $13,000/month volume, the $960/year savings may not justify switching if she\'s happy with Stripe\'s features. The tipping point where these fee differences become meaningful is around $5,000+/month in volume.',
      },
      {
        scenario: 'A freelance designer needs to receive exactly $5,000 net from an international client. The client will pay via PayPal. How much should the designer invoice?',
        inputs: { invoiceAmount: '5000', platform: 'paypal-international', reverseMode: 'yes' },
        result: 'To receive $5,000 net: Invoice amount needs to be ~$5,240.77. Fee = $240.77. The client pays $5,240.77, the designer nets approximately $5,000.',
        insight: 'Using reverse mode, the designer discovers they need to add $240.77 to the invoice just to cover PayPal fees. Alternative approaches: wire transfer ($15–30 flat fee, much cheaper for $5K), Wise/TransferWise (~0.5% + small fixed fee, ~$25), or requesting the client cover processing fees. For international freelancing, processing fees are a significant cost — the designer should factor these into their rate or standard terms. If the client pays by credit card, the 4.49% fee is unavoidable; the alternative is requesting a bank transfer where available, saving $200+ on this single invoice.',
      },
      {
        scenario: 'A SaaS company processes $150,000/month across 3,000 transactions (average $50/transaction) via Stripe. They want to understand their effective processing rate and whether interchange-plus pricing would save money.',
        inputs: { invoiceAmount: '50', platform: 'stripe-domestic', reverseMode: 'no' },
        result: 'Per-transaction fee: $1.75 (50 × 0.029 + 0.30). Effective rate: 3.5%. Total monthly fees: $5,250. Annual: $63,000.',
        insight: 'At $150K/month, the effective rate of 3.5% (inflated by the $0.30 fixed fee on small transactions) means the SaaS company is paying $63K/year in processing fees. At this volume, they should negotiate interchange-plus pricing with a processor. A typical interchange-plus quote for this volume might be: interchange (pass-through, ~1.8%) + 0.3% assessment + 0.2% processor markup = 2.3% + $0.10 per transaction. Monthly cost at interchange-plus: ~$3,750 vs. $5,250 flat rate — saving ~$18,000/year. The break-even for interchange-plus is typically around $10K–20K/month in volume, making it a clear win here. The SaaS company should also explore ACH/debit options for annual subscription payments to reduce fees further.',
      },
    ],
    proTips: [
      'Always use the reverse mode when invoicing clients — enter the amount you NEED to receive, and the calculator tells you what to charge. This ensures processing fees come out of the client\'s payment rather than your margin. For B2B invoices over $500, consider ACH or wire transfer as an alternative — flat fees of $0.50–1.50 for ACH are dramatically cheaper than 2.9% on large amounts.',
      'The $0.30 fixed fee has a disproportionate impact on small transactions. A $5 coffee purchase processed via Stripe has an effective rate of 8.9% (fee of $0.45 on $5). If you sell low-priced items, consider: bundling products to increase average order value, setting a minimum transaction amount, using a micropayments rate if your processor offers one, or switching to a processor with a lower fixed fee (Square at $0.10 is better for small transactions).',
      'For subscription/recurring billing, Stripe charges the same rate as one-time payments. However, if you have high-value annual subscriptions ($500+), encourage annual billing with a small discount (e.g., 5% off) — you pay one transaction fee instead of 12 monthly fees, saving significantly on processing costs while improving cash flow predictability. For a $100/month subscription: 12 × ($100 × 0.029 + $0.30) = $38.40/year in fees vs. one annual charge: ($1,200 × 0.029 + $0.30) = $35.10 — saving $3.30/year per customer plus improving retention.',
      'International sellers lose 1% extra on cross-border transactions with Stripe. If you sell internationally, consider: setting up a local entity or Stripe account in your largest foreign market (e.g., Stripe UK for European customers), using a merchant of record service that handles local payment methods, or accepting local payment methods (iDEAL in Netherlands, SEPA in EU) that have lower fees than international card processing.',
      'Fraud and chargeback costs can dwarf processing fees. For every $100 in processing fees you pay, a single $50 chargeback (with $15 dispute fee) can cost an additional $65+. Use Stripe Radar (included) or similar fraud tools, require CVV for all transactions, and consider 3D Secure for high-risk orders. The calculator shows processing fees — always add 0.5–1% to your mental model for fraud and dispute costs.',
    ],
    limitations: [
      'This calculator compares flat-rate pricing from major processors (Stripe, PayPal, Square) using their publicly listed standard rates as of 2026. It does not account for negotiated/custom rates or interchange-plus pricing.',
      'It does not include additional fees such as monthly gateway fees ($10–25/month), PCI compliance fees, chargeback/dispute fees ($15–25 per incident), or ACH/bank transfer alternatives.',
      'Currency conversion fees (typically 1–2% above the mid-market rate) and tax handling (sales tax, VAT, GST) are not modeled.',
      'Rates were verified at time of development but processors change pricing periodically — always check the processor\'s current pricing page before making business decisions.',
    ],
    citations: [
      { source: 'Stripe', url: 'https://stripe.com/pricing' },
      { source: 'PayPal', url: 'https://www.paypal.com/us/webapps/mpp/merchant-fees' },
      { source: 'Square', url: 'https://squareup.com/us/en/pricing' },
    ],
  },
};

export default paymentFeesConfig;
