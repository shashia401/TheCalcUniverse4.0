import { CalculatorConfig, ExplainStep } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';
import { VAT_COUNTRY_LIST, VAT_RATES } from '../../../utils/taxData';
import { salesTaxFigures } from '../sales-tax/salesTaxMath';
import { createElement } from 'react';
import VATPanel from './VATPanel';

const vatConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'calcMode',
      label: 'I Want To',
      type: 'select',
      required: true,
      options: [
        { label: 'Add VAT to a net price', value: 'add' },
        { label: 'Remove VAT from a gross total', value: 'remove' },
      ],
    },
    {
      id: 'amount',
      label: 'Amount',
      type: 'number',
      placeholder: '100.00',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
    },
    {
      id: 'country',
      label: 'Country / VAT Rate',
      type: 'select',
      required: true,
      options: [
        { label: '— Select a country —', value: '' },
        ...VAT_COUNTRY_LIST.map((c) => ({ label: `${c.name} (${c.standard}%)`, value: c.code })),
      ],
      helpText: 'Select a country to auto-fill its standard VAT rate',
    },
    {
      id: 'vatRate',
      label: 'VAT Rate',
      type: 'number',
      placeholder: '20',
      unit: '%',
      min: 0,
      max: 50,
      step: 0.01,
      helpText: 'Leave blank to use the selected country\'s standard rate, or type a rate here (it overrides the country), e.g. a reduced rate',
    },
  ],

  calculate: (values) => {
    const mode = values.calcMode === 'remove' ? 'remove' : 'add';
    const amount = parseFloat(values.amount);
    // A typed rate wins; otherwise fall back to the selected country's standard rate.
    const typed = parseFloat(values.vatRate);
    const vatRate = (Number.isFinite(typed) ? typed : VAT_RATES[values.country]?.standard ?? NaN) / 100;

    if (isNaN(amount) || isNaN(vatRate) || amount <= 0) return [];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // VAT is rounded to the cent (as on an invoice) so net + VAT = gross always holds.
    const { net: netAmount, tax: vatAmount, gross: grossAmount } = salesTaxFigures(mode === 'add' ? 'add' : 'extract', amount, vatRate);

    const vatPct = vatRate * 100;
    const vatSharePct = (vatAmount / grossAmount) * 100;

    return [
      {
        id: mode === 'add' ? 'grossAmount' : 'netAmount',
        label: mode === 'add' ? 'Gross Amount (Incl. VAT)' : 'Net Amount (Excl. VAT)',
        value: `$${fmt(mode === 'add' ? grossAmount : netAmount)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'vatAmount',
        label: 'VAT Amount',
        value: `$${fmt(vatAmount)}`,
        color: 'negative' as const,
      },
      {
        id: 'baseAmount',
        label: mode === 'add' ? 'Net Amount' : 'Gross Amount',
        value: `$${fmt(mode === 'add' ? netAmount : grossAmount)}`,
        color: 'neutral' as const,
      },
      {
        id: 'vatRateResult',
        label: 'VAT Rate Applied',
        value: `${vatPct.toFixed(2)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'vatShare',
        label: 'VAT as % of Gross',
        value: `${vatSharePct.toFixed(1)}%`,
        color: 'neutral' as const,
      },
    ];
  },

  explainSteps: (values) => {
    const rows = vatConfig.calculate(values);
    if (!rows.length) return [];
    const mode = values.calcMode === 'remove' ? 'remove' : 'add';
    const amount = parseFloat(values.amount);
    const typed = parseFloat(values.vatRate);
    const country = VAT_RATES[values.country];
    const vatRate = (Number.isFinite(typed) ? typed : country?.standard ?? NaN) / 100;
    const val = (id: string) => resultValue(rows, id) ?? '';
    const m = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const ratePct = +(vatRate * 100).toFixed(4);

    const steps: ExplainStep[] = [
      {
        label: 'Pick the VAT rate',
        expr: Number.isFinite(typed)
          ? `Rate typed in = ${ratePct}% → ${+vatRate.toFixed(8)} as a decimal`
          : `${country?.name ?? 'Selected country'} standard rate in the calculator's table = ${ratePct}% → ${+vatRate.toFixed(8)} as a decimal`,
        note: 'A rate you type overrides the country; use it for a reduced rate. Check the current rate with your tax authority, as rates change.',
      },
    ];
    if (mode === 'add') {
      steps.push(
        {
          label: 'Work out the VAT on the net price',
          expr: `${m(amount)} × ${+vatRate.toFixed(8)} = $${(amount * vatRate).toFixed(4)} → rounded to the cent = ${val('vatAmount')}`,
          note: 'VAT is rounded to the cent, as on an invoice, so net plus VAT always equals gross.',
        },
        {
          label: 'Add the VAT to get the gross amount',
          expr: `${m(amount)} + ${val('vatAmount')} = ${val('grossAmount')}`,
        },
      );
    } else {
      steps.push(
        {
          label: 'Take the VAT out of the gross total',
          expr: `${m(amount)} ÷ (1 + ${+vatRate.toFixed(8)}) = $${(amount / (1 + vatRate)).toFixed(4)} → rounded to the cent = ${val('netAmount')} net`,
          note: 'The gross total already contains the VAT, so you divide by 1 plus the rate.',
        },
        {
          label: 'The VAT is what is left over',
          expr: `${m(amount)} − ${val('netAmount')} = ${val('vatAmount')}`,
        },
      );
    }
    steps.push({
      label: 'VAT as a share of the gross amount',
      expr: `${val('vatAmount')} ÷ ${mode === 'add' ? val('grossAmount') : m(amount)} × 100 = ${val('vatShare')}`,
      note: 'The share of the gross is lower than the VAT rate, because the rate applies to the net price.',
    });
    return finiteSteps(steps);
  },

  extraPanel: (_values, results) => {
    if (!results.length) return null;
    return createElement(VATPanel, { results });
  },

  educational: {
    formula: 'Gross = Net × (1 + VAT%)    |    Net = Gross ÷ (1 + VAT%)',
    formulaDescription:
      'Adding VAT multiplies the net amount by (1 + rate). Removing VAT divides the gross by (1 + rate). The VAT amount is always the difference between gross and net. These are the two fundamental calculations for any business dealing with Value-Added Tax, which is used in over 170 countries worldwide.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">' +
        '<rect width="320" height="200" fill="var(--svg-f8fafc)" rx="8"/>' +
        '<text x="160" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-1e293b)">VAT: Add vs. Remove</text>' +
        '<rect x="6" y="32" width="152" height="158" rx="8" fill="var(--svg-f1f5f9)"/>' +
        '<rect x="6" y="32" width="152" height="24" rx="8" fill="var(--svg-3b82f6)"/>' +
        '<rect x="6" y="44" width="152" height="12" fill="var(--svg-3b82f6)"/>' +
        '<text x="82" y="48" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Add VAT</text>' +
        '<rect x="16" y="66" width="132" height="28" rx="5" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="1.2"/>' +
        '<text x="82" y="84" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-15803d)">Net: $100.00</text>' +
        '<text x="82" y="110" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">x (1 + 20%)</text>' +
        '<line x1="20" y1="120" x2="144" y2="120" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
        '<text x="82" y="142" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Gross (inc. VAT)</text>' +
        '<rect x="16" y="150" width="132" height="28" rx="5" fill="var(--svg-3b82f6)"/>' +
        '<text x="82" y="168" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">$120.00</text>' +
        '<rect x="162" y="32" width="152" height="158" rx="8" fill="var(--svg-f1f5f9)"/>' +
        '<rect x="162" y="32" width="152" height="24" rx="8" fill="var(--svg-ef4444)"/>' +
        '<rect x="162" y="44" width="152" height="12" fill="var(--svg-ef4444)"/>' +
        '<text x="238" y="48" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Remove VAT</text>' +
        '<rect x="172" y="66" width="132" height="28" rx="5" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.2"/>' +
        '<text x="238" y="84" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-92400e)">Gross: $120.00</text>' +
        '<text x="238" y="110" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">/ (1 + 20%)</text>' +
        '<line x1="176" y1="120" x2="300" y2="120" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
        '<text x="238" y="142" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Net (excl. VAT)</text>' +
        '<rect x="172" y="150" width="132" height="28" rx="5" fill="var(--svg-22c55e)"/>' +
        '<text x="238" y="168" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">$100.00</text>' +
        '</svg>',
      alt: 'Side-by-side comparison of Add VAT (net price times 1.20 equals gross) and Remove VAT (gross divided by 1.20 equals net)',
      caption: 'Add VAT calculates the gross price including tax from a net price; Remove VAT extracts the net price from a gross total',
    },
    variables: [
      { symbol: 'Net', name: 'Net Amount', description: 'The price before VAT — also called the "net of tax" or "excl. VAT" amount. What the seller receives before tax. Businesses typically quote prices excluding VAT when dealing with other VAT-registered businesses.' },
      { symbol: 'Gross', name: 'Gross Amount', description: 'The total price including VAT — what the buyer actually pays. Also called the "inc. VAT" amount. In most countries outside the US, displayed prices in stores already include VAT.' },
      { symbol: 'VAT Rate', name: 'VAT / Sales Tax Rate', description: 'The percentage of tax applied. Ranges from 5% (UAE, Canada GST) to 27% (Hungary) among the countries listed. Businesses in most countries reclaim VAT on purchases through input tax credits, making VAT a tax on end consumers only.' },
    ],
    howToUse: [
      'Select "Add VAT" if you have a net price and need to calculate the total including VAT — for invoicing.',
      'Select "Remove VAT" if you have a gross total and need to extract the VAT amount — for expense reporting or accounting.',
      'Select a country to use its standard VAT rate, or type a custom rate (for example a reduced rate); a typed rate overrides the country.',
      'The calculator shows the net amount, VAT amount, and gross amount — regardless of the mode selected.',
      'Review the "VAT as % of Gross" field — this is the implied VAT share of the total paid, which differs slightly from the stated VAT rate.',
    ],
    commonUses: [
      'Calculate the gross price including VAT for invoicing clients by adding the applicable VAT rate to your net price.',
      'Extract the VAT amount and net price from a total gross figure for expense reporting and accounting reconciliation.',
      'Look up standard VAT rates across different countries and compare how VAT affects pricing for international business transactions.',
    ],
    explanation:
      'Value-Added Tax (VAT) is a consumption tax applied at every stage of the supply chain, ultimately borne by the end consumer. Unlike US sales tax (added at checkout), VAT is typically included in the displayed price in most countries. Businesses registered for VAT can reclaim the VAT they pay on business purchases (input tax) against the VAT they charge customers (output tax). This calculator handles the two most common scenarios: adding VAT to a net price (for invoicing clients) and removing VAT from a gross total (for accounting, expense reporting, or understanding what portion of a purchase price is tax). VAT rates vary significantly worldwide — some countries have reduced rates for essential goods (food, medicine, children\'s clothing), while luxury goods may attract higher rates. Understanding how VAT works is essential for anyone doing business internationally or traveling to VAT-using countries for business.',
    faqs: [
      {
        question: 'What is the difference between VAT and sales tax?',
        answer: 'VAT is charged at each stage of production/distribution, with businesses reclaiming input VAT. Sales tax (US-style) is charged only at the final point of sale to the consumer. VAT is typically included in the listed price; US sales tax is added at checkout. VAT rates are uniform nationally; US sales tax varies by state, county, and city. Another key difference: under VAT, businesses at each stage of the supply chain collect tax on their output and reclaim tax on their inputs, remitting only the net difference to the government. Under US sales tax, only the final retailer collects and remits the full tax.',
      },
      {
        question: 'Can I reclaim VAT on business purchases?',
        answer: 'Yes — VAT-registered businesses can reclaim the VAT paid on business expenses (input tax) against the VAT they charge customers (output tax). The net amount is remitted to the tax authority. This means VAT is ultimately a cost only for end consumers, not for businesses registered for VAT. However, there are exceptions: some purchases like entertainment expenses or car purchases may have restricted input VAT recovery. Always consult a local tax professional for your specific situation.',
      },
      {
        question: 'Why do VAT rates vary so much between countries?',
        answer: 'VAT rates reflect each country\'s fiscal policy. EU countries tend to have higher rates (17–27%) because VAT is a major revenue source funding social programs and public services. Asian and Middle Eastern countries tend to have lower rates (5–10%). The US has no national VAT and relies on state and local sales taxes instead, while Canada\'s federal GST (and the provincial HST) is itself a VAT. Reduced rates often apply to essential goods like food, medicine, and children\'s clothing — for example, the UK charges 20% standard VAT but 0% on most food and children\'s clothing.',
      },
    ],
  citations: [
    { source: 'European Commission VAT', url: 'https://ec.europa.eu/taxation_customs/vat' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/v/valueaddedtax.asp' },
  ],
  },
};

export default vatConfig;
