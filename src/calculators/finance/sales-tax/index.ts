import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SalesTaxPanel from './SalesTaxPanel';

const salesTaxConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Calculation Mode',
      type: 'select',
      required: true,
      options: [
        { label: 'Add Tax — I have a price before tax', value: 'add' },
        { label: 'Extract Tax — I have a total including tax', value: 'extract' },
      ],
      helpText: 'Add Tax: calculate total from pre-tax price. Extract Tax: find pre-tax amount from total.',
    },
    {
      id: 'amount',
      label: 'Amount ($)',
      type: 'number',
      placeholder: '80.00',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'Enter the pre-tax price (Add Tax) or the total paid (Extract Tax)',
    },
    {
      id: 'taxRate',
      label: 'Sales Tax Rate',
      type: 'number',
      placeholder: '8.25',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.001,
      required: true,
      helpText: 'Your local combined state + county + city tax rate',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'add';
    const amount = parseFloat(values.amount);
    const taxRate = parseFloat(values.taxRate) / 100;

    if (isNaN(amount) || isNaN(taxRate) || amount <= 0) return [];

    const fmtD = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (mode === 'add') {
      const taxAmount = amount * taxRate;
      const grossPrice = amount + taxAmount;

      return [
        {
          id: 'grossPrice',
          label: 'Total Price (With Tax)',
          value: `$${fmtD(grossPrice)}`,
          highlight: true,
          color: 'neutral' as const,
        },
        {
          id: 'taxAmount',
          label: 'Tax Amount',
          value: `$${fmtD(taxAmount)}`,
          color: 'negative' as const,
        },
        {
          id: 'netPrice',
          label: 'Pre-Tax Price',
          value: `$${fmtD(amount)}`,
          color: 'neutral' as const,
        },
        {
          id: 'rateUsed',
          label: 'Tax Rate Applied',
          value: `${(taxRate * 100).toFixed(3)}%`,
          color: 'neutral' as const,
        },
      ];
    } else {
      const netPrice = amount / (1 + taxRate);
      const taxAmount = amount - netPrice;

      return [
        {
          id: 'taxAmount',
          label: 'Tax Amount to Remit',
          value: `$${fmtD(taxAmount)}`,
          highlight: true,
          color: 'negative' as const,
        },
        {
          id: 'netPrice',
          label: 'Pre-Tax Revenue (You Keep)',
          value: `$${fmtD(netPrice)}`,
          color: 'positive' as const,
        },
        {
          id: 'grossPrice',
          label: 'Total Collected (With Tax)',
          value: `$${fmtD(amount)}`,
          color: 'neutral' as const,
        },
        {
          id: 'rateUsed',
          label: 'Tax Rate Applied',
          value: `${(taxRate * 100).toFixed(3)}%`,
          color: 'neutral' as const,
        },
        {
          id: 'effectiveRate',
          label: 'Tax as % of Total Collected',
          value: `${((taxAmount / amount) * 100).toFixed(3)}%`,
          color: 'neutral' as const,
        },
      ];
    }
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SalesTaxPanel, { values, results });
  },
  educational: {
    formula: 'Add Tax: Gross = Amount × (1 + r)   ·   Extract Tax: Net = Total ÷ (1 + r)',
    formulaDescription:
      'Adding tax multiplies the base price by (1 + rate). Extracting tax (for businesses who collected a total including tax) divides the total by (1 + rate) to find the pre-tax amount. The tax owed is always Total − Net. This is a fundamental calculation for retail businesses, e-commerce sellers, and anyone who needs to determine the correct sales tax to remit to tax authorities. Getting this math wrong is one of the most common accounting errors new business owners make.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">' +
        '<rect width="320" height="200" fill="var(--svg-f8fafc)" rx="8"/>' +
        '<text x="160" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-1e293b)">Sales Tax: Add vs. Extract</text>' +
        '<rect x="6" y="30" width="152" height="160" rx="8" fill="var(--svg-f1f5f9)"/>' +
        '<rect x="6" y="30" width="152" height="24" rx="8" fill="var(--svg-3b82f6)"/>' +
        '<rect x="6" y="42" width="152" height="12" fill="var(--svg-3b82f6)"/>' +
        '<text x="82" y="46" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Add Tax</text>' +
        '<text x="82" y="74" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Item Price (pre-tax)</text>' +
        '<rect x="20" y="82" width="124" height="28" rx="5" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="1.2"/>' +
        '<text x="82" y="100" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-15803d)">$80.00</text>' +
        '<text x="82" y="124" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">+ 8.25% sales tax</text>' +
        '<line x1="30" y1="134" x2="134" y2="134" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
        '<text x="82" y="152" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Total Paid</text>' +
        '<rect x="20" y="156" width="124" height="28" rx="5" fill="var(--svg-3b82f6)"/>' +
        '<text x="82" y="174" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ffffff)">$86.60</text>' +
        '<rect x="162" y="30" width="152" height="160" rx="8" fill="var(--svg-f1f5f9)"/>' +
        '<rect x="162" y="30" width="152" height="24" rx="8" fill="var(--svg-ef4444)"/>' +
        '<rect x="162" y="42" width="152" height="12" fill="var(--svg-ef4444)"/>' +
        '<text x="238" y="46" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Extract Tax</text>' +
        '<text x="238" y="74" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Total Collected</text>' +
        '<rect x="176" y="82" width="124" height="28" rx="5" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.2"/>' +
        '<text x="238" y="100" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-92400e)">$108.00</text>' +
        '<text x="238" y="124" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">- 8% tax included</text>' +
        '<line x1="186" y1="134" x2="290" y2="134" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
        '<text x="238" y="152" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Your Revenue</text>' +
        '<rect x="176" y="156" width="124" height="28" rx="5" fill="var(--svg-22c55e)"/>' +
        '<text x="238" y="174" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ffffff)">$100.00</text>' +
        '</svg>',
      alt: 'Side-by-side comparison of Add Tax (pre-tax price plus rate equals total) and Extract Tax (total minus embedded tax equals revenue)',
      caption: 'Add Tax calculates the gross from a net price; Extract Tax finds the net from a gross total — two different operations for two different scenarios',
    },
    variables: [
      { symbol: 'r', name: 'Tax Rate', description: 'Combined state, county, and city sales tax rate as a decimal. e.g., 8.25% = 0.0825. The US has over 10,000 taxing jurisdictions, so your local rate may differ from neighboring cities.' },
      { symbol: 'Net Price', name: 'Pre-Tax Price', description: 'The price of the item before sales tax is applied. For businesses using Extract mode, this is the revenue you actually keep before paying the tax authority.' },
      { symbol: 'Gross Price', name: 'Total with Tax', description: 'The final amount the consumer pays, including sales tax. Businesses collect this total and must remit the tax portion to the state.' },
    ],
    howToUse: [
      'Select "Add Tax" to calculate the total price from a pre-tax price. Use this when setting retail prices or creating invoices.',
      'Select "Extract Tax" to find the pre-tax amount and tax owed when you only know the total collected. Essential for reconciling sales reports and preparing tax filings.',
      'Enter your local combined sales tax rate (state + county + city). You can find your exact rate at your state\'s department of revenue website or through sales tax lookup tools.',
      'Review the tax amount and effective rate — the Extract mode also shows the tax as a percentage of the total collected, which differs from the stated rate.',
    ],
    commonUses: [
      'Calculate the total price including sales tax for retail purchases or invoices by adding your local combined tax rate.',
      'Extract the pre-tax amount and actual tax paid from a gross total for accurate accounting and sales tax filing.',
      'Determine the correct sales tax to remit when you only know the total amount collected from a customer transaction.',
    ],
    explanation:
      'The "Extract Tax" mode (also called "back-calculating" sales tax) is critically important for business owners and e-commerce sellers who collect a single price from customers and need to know how much of that collected amount to remit to the state. For example: if you sold an item for $108 with 8% tax, you might instinctively calculate $108 × 8% = $8.64 and think you owe that amount. But that is incorrect — $108 is already the gross tax-inclusive amount. The correct calculation is $108 ÷ 1.08 = $100 (pre-tax revenue), meaning you owe exactly $8 in tax. Over-remitting means you lose profit; under-remitting means you risk penalties and interest from the state. This distinction matters more than most new business owners realize because the error compounds with every transaction. For online sellers operating in multiple states, sales tax compliance became significantly more complex after the 2018 South Dakota v. Wayfair Supreme Court decision, which allowed states to require out-of-state sellers to collect and remit sales tax even without a physical presence in the state.',
    faqs: [
      {
        question: 'What is my local sales tax rate?',
        answer: 'Sales tax rates vary by state, county, and city. The US average combined rate is approximately 7.12%. To find your precise rate, visit your state\'s Department of Revenue website, or look up your ZIP code on the Sales Tax Institute or Avalara websites. Some cities and counties have their own additional rates on top of the state rate, so checking the exact combined rate for your specific address is essential.',
      },
      {
        question: 'Why does "Extract Tax" give a different result than just multiplying by the rate?',
        answer: 'This is a very common mistake for new business owners. If you charge $100 total with 8% tax, you might think you collected $100 × 8% = $8 in tax. But that is wrong — $100 is the gross (tax-inclusive) amount. The pre-tax price is $100 ÷ 1.08 = $92.59, and the tax is $7.41. If you charged $100 intending to remit $8, you actually undercharged the customer. Always use Extract mode when working backward from a total.',
      },
      {
        question: 'Do I charge sales tax on shipping?',
        answer: 'It depends on your state. Some states tax shipping charges, others exempt them, and some only tax shipping if it is not separately stated on the invoice. As of 2024, approximately 15 states tax shipping unconditionally, 10 states exempt it, and the rest have nuanced rules based on the shipping method and whether the shipping charge is separately stated. This varies significantly by state — consult a tax advisor or your state\'s revenue department for definitive guidance.',
      },
      {
        question: 'Do I need to collect sales tax for online sales in other states?',
        answer: 'After the 2018 Wayfair ruling, most states require out-of-state sellers to collect sales tax if they meet certain economic thresholds (typically $100,000 in sales or 200 transactions in that state). This applies to marketplace sellers on Amazon, eBay, Etsy, and independent e-commerce stores. Many platforms now handle this automatically, but if you sell through your own website, use a sales tax automation service like Avalara, TaxJar, or TaxCloud to stay compliant.',
      },
      {
        question: 'Are there items exempt from sales tax?',
        answer: 'Yes, most states exempt certain categories of goods from sales tax. Common exemptions include groceries (most states exempt unprepared food), prescription medications, and medical devices. Some states also exempt clothing below a certain price threshold, textbooks, and manufacturing equipment. A few states like New Hampshire, Oregon, Montana, Delaware, and Alaska have no state-level sales tax at all. Always check your state\'s specific exemption list — the Tax Foundation maintains a comprehensive database of state-by-state sales tax rules including exemptions.',
      },
      {
        question: 'How do I handle sales tax for services versus products?',
        answer: 'The taxation of services varies significantly by state. Most states tax tangible goods by default but exempt most services — with notable exceptions. Common taxable services include: repair and maintenance services, lodging/accommodations, telecommunications, and some professional services like consulting. States like Hawaii, New Mexico, and South Dakota tax a broad range of services, while states like Illinois, Massachusetts, and Texas tax relatively few services. If your business sells both products and services, you may need to apply different tax rates or exemptions to different line items on the same invoice. Consult the Streamlined Sales Tax Governing Board or a sales tax professional for the rules in your specific state.',
      },
      {
        question: 'What happens if I do not collect and remit sales tax when I should?',
        answer: 'Failure to collect and remit sales tax can result in significant penalties including back taxes owed, interest on unpaid amounts (often 1-2% per month), and civil penalties ranging from 5-25% of the uncollected tax. In severe cases of deliberate non-compliance, business owners can face personal liability — meaning the state can pursue your personal assets even through a corporation or LLC. States have become increasingly aggressive about enforcement since the Wayfair ruling, and many participate in information-sharing agreements to identify non-compliant sellers. If you discover you have not been collecting when you should have, most states offer voluntary disclosure programs that reduce or waive penalties if you come forward before being contacted by the tax authority.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Alisha runs a craft business in Texas and sold products at a local fair totaling $2,376 including 8.25% combined state and local tax. She needs to know how much to remit to the state.',
        inputs: { mode: 'extract', amount: '2376', taxRate: '8.25' },
        result: 'Pre-tax revenue: $2,194.92, Tax to remit: $181.08, Effective tax rate: 7.62%',
        insight: 'Alisha keeps $2,194.92 in revenue and must remit $181.08 to the Texas Comptroller. The effective tax rate of 7.62% (not 8.25%) represents the tax as a percentage of the gross collected amount, because the tax rate applies to the pre-tax price, not the total. If Alisha had mistakenly calculated $2,376 x 8.25% = $196.02 and remitted that amount, she would have overpaid by nearly $15.',
      },
      {
        scenario: 'Mark owns a small retail shop in Chicago where the combined sales tax rate is 10.25% (6.25% state + 1.75% county + 1.25% city + 1% RTA). He wants to price a new product at $49.99 pre-tax and needs to know the shelf price.',
        inputs: { mode: 'add', amount: '49.99', taxRate: '10.25' },
        result: 'Total with tax: $55.11, Tax amount: $5.12, Pre-tax: $49.99',
        insight: 'Mark could set the shelf price as $55.11 or round up to $55.99 for psychological pricing. Chicago has one of the highest combined sales tax rates in the US — only a few cities like Long Beach, CA and certain Louisiana parishes exceed 10.25%. His customers pay $5.12 in tax on a single $49.99 item, which highlights the real impact that local tax rates have on consumers.',
      },
      {
        scenario: 'Sarah is an e-commerce seller based in Florida shipping to a customer in New York. She sold an item for $89.99 pre-tax. Florida has a 6% state rate and New York state rate is 4% plus the customer\'s county surcharge.',
        inputs: { mode: 'add', amount: '89.99', taxRate: '8.875' },
        result: 'Total with tax: $97.98, Tax amount: $7.99',
        insight: 'As of 2024, most e-commerce sales are taxed based on the destination (buyer\'s location), not the origin (seller\'s location). Sarah must know her customer\'s full combined state + county + city tax rate. In this case, she applied the customer\'s local combined rate and must remit $7.99 to New York state, not Florida. Many platforms like Shopify and WooCommerce automate this with geolocation-based rate lookups.',
      },
    ],
    proTips: [
      'Always save sales tax you collect in a separate bank account. It is not your money — it belongs to the state, and you are merely the collection agent. Commingling tax receipts with operating funds is the top cause of tax payment shortfalls at filing time.',
      'Use the Extract Tax mode when reconciling daily sales reports from your POS or e-commerce platform. These reports typically show gross receipts, and you need to back out the tax portion before recording revenue in your accounting system.',
      'Set calendar reminders for your sales tax filing deadlines. Most states require monthly filing for high-volume sellers, quarterly for moderate-volume, and annually for low-volume sellers. Missing a deadline triggers penalties even if you have the money to pay — the penalties are for the late filing, not the late payment.',
      'Keep your resale certificates organized and up to date. If you purchase inventory for resale, you generally do not pay sales tax on those purchases — you collect it from the end customer instead. Without a valid resale certificate on file with your supplier, you will be charged tax twice (once when you buy inventory and once when you sell it).',
    ],
    quickReference: [
      { label: 'US Average Combined Rate', value: '~7.12%' },
      { label: 'Highest State Rate (CA)', value: '7.25%' },
      { label: 'Highest Combined Rate', value: '~10.25% (Chicago, Long Beach)' },
      { label: 'No State Sales Tax', value: 'NH, OR, MT, DE, AK' },
      { label: 'Add Tax Formula', value: 'Gross = Net x (1 + rate)' },
      { label: 'Extract Tax Formula', value: 'Net = Gross / (1 + rate)' },
    ],
    limitations: [
      'Sales tax rates and rules change frequently and vary by jurisdiction. This calculator provides estimates using the rate you enter; always verify your specific rate with your state Department of Revenue or a tax professional before filing.',
      'This calculator does not account for product-level taxability exceptions such as grocery exemptions, clothing thresholds, or prescription drug exemptions. Some items may be taxed at a different rate or exempt entirely based on your jurisdiction\'s specific laws.',
      'Local use taxes (tax on items purchased out-of-state for in-state use) are not modeled. In most states, consumers are legally required to self-report and pay use tax on untaxed out-of-state purchases.',
      'This calculator models a flat tax rate per transaction. It does not handle tiered rates (different rates on different portions of the price), caps on taxable amounts (e.g., tax only on the first $X of certain goods), or tax-inclusive pricing (common in VAT/GST systems outside the US).',
    ],
  citations: [
    { source: 'Sales Tax Institute', url: 'https://www.salestaxinstitute.com' },
    { source: 'Tax Foundation', url: 'https://taxfoundation.org/tax-basics/sales-tax/' },
    { source: 'Streamlined Sales Tax Governing Board', url: 'https://www.streamlinedsalestax.org' },
  ],
  },
};

export default salesTaxConfig;
