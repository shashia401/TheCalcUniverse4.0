import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import Decimal from 'decimal.js';
import CurrencyPanel from './CurrencyPanel';

const CURRENCIES = [
  { label: 'USD — US Dollar', value: 'USD' },
  { label: 'EUR — Euro', value: 'EUR' },
  { label: 'GBP — British Pound', value: 'GBP' },
  { label: 'JPY — Japanese Yen', value: 'JPY' },
  { label: 'CAD — Canadian Dollar', value: 'CAD' },
  { label: 'AUD — Australian Dollar', value: 'AUD' },
  { label: 'CHF — Swiss Franc', value: 'CHF' },
  { label: 'CNY — Chinese Yuan', value: 'CNY' },
  { label: 'INR — Indian Rupee', value: 'INR' },
  { label: 'MXN — Mexican Peso', value: 'MXN' },
  { label: 'BRL — Brazilian Real', value: 'BRL' },
  { label: 'KRW — South Korean Won', value: 'KRW' },
  { label: 'SGD — Singapore Dollar', value: 'SGD' },
  { label: 'HKD — Hong Kong Dollar', value: 'HKD' },
  { label: 'NOK — Norwegian Krone', value: 'NOK' },
  { label: 'SEK — Swedish Krona', value: 'SEK' },
  { label: 'DKK — Danish Krone', value: 'DKK' },
  { label: 'NZD — New Zealand Dollar', value: 'NZD' },
  { label: 'ZAR — South African Rand', value: 'ZAR' },
  { label: 'AED — UAE Dirham', value: 'AED' },
  { label: 'SAR — Saudi Riyal', value: 'SAR' },
  { label: 'THB — Thai Baht', value: 'THB' },
  { label: 'TRY — Turkish Lira', value: 'TRY' },
  { label: 'PLN — Polish Zloty', value: 'PLN' },
  { label: 'CZK — Czech Koruna', value: 'CZK' },
  { label: 'HUF — Hungarian Forint', value: 'HUF' },
  { label: 'ILS — Israeli Shekel', value: 'ILS' },
  { label: 'PHP — Philippine Peso', value: 'PHP' },
  { label: 'IDR — Indonesian Rupiah', value: 'IDR' },
  { label: 'MYR — Malaysian Ringgit', value: 'MYR' },
];

const currencyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'amount',
      label: 'Amount',
      type: 'number',
      placeholder: '1,000',
      min: 0,
      step: 1,
      required: true,
      inputMode: 'decimal',
      helpText: 'The amount of money you want to convert between currencies.',
    },
    {
      id: 'fromCurrency',
      label: 'From Currency',
      type: 'select',
      required: true,
      options: CURRENCIES,
      helpText: 'The currency you are converting from (source currency).',
    },
    {
      id: 'toCurrency',
      label: 'To Currency',
      type: 'select',
      required: true,
      options: CURRENCIES.map((c) => c.value === 'EUR' ? { ...c } : c),
      helpText: 'The currency you are converting to (target currency).',
    },
  ],
  calculate: (values) => {
    const amount = parseFloat(values.amount);
    const from = values.fromCurrency || 'USD';
    const to = values.toCurrency || 'EUR';

    // Use Decimal.js for precise monetary conversions
    const decAmount = new Decimal(isNaN(amount) ? 0 : amount);
    if (isNaN(amount) || amount <= 0) return [];
    if (from === to) {
      return [
        {
          id: 'result',
          label: 'Converted Amount',
          value: amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          highlight: true,
          color: 'neutral' as const,
        },
        {
          id: 'rate',
          label: 'Exchange Rate',
          value: `1 ${from} = 1.0000 ${to} (same currency)`,
          color: 'neutral' as const,
        },
      ];
    }

    return [
      {
        id: 'loading',
        label: 'Live Rate',
        value: 'Fetching live exchange rate...',
        highlight: true,
        color: 'neutral' as const,
      },
      {
        id: 'from',
        label: 'From',
        value: `${amount.toLocaleString(undefined)} ${from}`,
        color: 'neutral' as const,
      },
      {
        id: 'to',
        label: 'To',
        value: to,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, _results) => {
    const amount = parseFloat(values.amount);
    const from = values.fromCurrency || 'USD';
    const to = values.toCurrency || 'EUR';

    if (isNaN(amount) || amount <= 0 || !from || !to) return null;

    return createElement(CurrencyPanel, { amount, from, to });
  },
  educational: {
    formula: 'Converted Amount = Amount × Exchange Rate',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/><text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Currency Conversion Flow</text><text x="160" y="34" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Amount × Exchange Rate = Converted Amount</text><rect x="20" y="52" width="120" height="50" rx="8" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="80" y="73" text-anchor="middle" font-size="9" fill="var(--svg-1e40af)">Source Amount</text><text x="80" y="92" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-2563eb)">$1,000 USD</text><line x1="140" y1="77" x2="180" y2="77" stroke="var(--svg-64748b)" stroke-width="1.5"/><polygon points="180,72 190,77 180,82" fill="var(--svg-64748b)"/><text x="165" y="69" text-anchor="middle" font-size="8" fill="var(--svg-f59e0b)" font-weight="bold">× 0.92</text><rect x="190" y="52" width="120" height="50" rx="8" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="250" y="73" text-anchor="middle" font-size="9" fill="var(--svg-b45309)">Converted Amount</text><text x="250" y="92" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-d97706)">€920 EUR</text><rect x="20" y="118" width="280" height="70" rx="8" fill="var(--svg-f1f5f9)"/><text x="160" y="137" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">The Hidden Cost: Bid-Ask Spread</text><line x1="40" y1="150" x2="120" y2="150" stroke="var(--svg-64748b)" stroke-width="1"/><text x="80" y="148" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Bid (Buy)</text><line x1="200" y1="150" x2="280" y2="150" stroke="var(--svg-64748b)" stroke-width="1"/><text x="240" y="148" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Ask (Sell)</text><rect x="40" y="151" width="80" height="4" rx="2" fill="var(--svg-3b82f6)"/><rect x="200" y="151" width="80" height="4" rx="2" fill="var(--svg-ef4444)"/><text x="160" y="174" text-anchor="middle" font-size="8" fill="var(--svg-ef4444)">Spread = 1-3% at banks — always check the all-in cost</text></svg>',
      alt: 'Currency conversion diagram showing $1,000 USD multiplied by 0.92 exchange rate to get €920 EUR, with bid-ask spread concept below',
      caption: 'The mid-market rate (shown) has no markup, but banks and exchanges add a 1-3% spread that makes the actual rate less favorable',
    },
    formulaDescription:
      'Exchange rates are fetched live from the Frankfurter API, which sources data from the European Central Bank. Rates are updated on banking business days. The multiplication is straightforward, but the rate behind it reflects complex global macroeconomic forces including monetary policy, trade balances, inflation differentials, and market sentiment.',
    variables: [
      { symbol: 'Rate', name: 'Exchange Rate', description: 'How many units of the target currency equal 1 unit of the source currency. This rate reflects the relative value between two economies and fluctuates continuously during market hours based on supply and demand in the global foreign exchange market.' },
      { symbol: 'ECB', name: 'European Central Bank', description: 'The authoritative source for reference exchange rates, updated daily at approximately 16:00 CET on banking business days. The ECB reference rates are calculated using a consolidated dataset of electronic trading platform inputs and are used by financial institutions worldwide as benchmark mid-market rates.' },
      { symbol: 'Spread', name: 'Bid-Ask Spread', description: 'The difference between the buy and sell price of a currency pair. Retail currency exchanges make their profit on this spread, which is typically 1-3% for banks, 2-5% for airport exchanges, and as low as 0.1-0.5% for specialized online forex brokers. The rate shown is the mid-market rate with zero spread.' },
    ],
    howToUse: [
      'Enter the amount you want to convert.',
      'Select the currency you are converting from.',
      'Select the currency you are converting to.',
      'The live rate is fetched automatically from the European Central Bank via the Frankfurter API.',
      'Keep in mind that the rate shown is the interbank mid-market rate — your actual bank or exchange service will apply a markup (spread) on top of this rate.',
    ],
    commonUses: [
      'Convert between major world currencies using live European Central Bank reference rates for international transactions and travel planning.',
      'Compare the mid-market exchange rate against what your bank offers to calculate the hidden cost of currency conversion markups.',
      'Plan large international transfers by understanding the true exchange rate before negotiating with forex brokers or banks.',
    ],
    explanation:
      'Exchange rates fluctuate constantly based on global supply and demand, interest rate differentials, inflation, and geopolitical events. The rate shown is the interbank reference rate — actual rates from banks or exchange services include a markup (spread) of 1–5%. The Frankfurter API provides official ECB reference rates, which are the gold standard for financial applications. Understanding the difference between the mid-market rate (shown here) and the retail rate (what you actually pay) is critical when making international transfers or traveling abroad. A 3% spread on a $10,000 transfer is $300 in hidden costs — often more than any transfer fee. The most cost-effective strategy for large international transfers is typically to use specialized forex brokers who offer near-interbank rates with minimal spreads, rather than traditional banks which embed significant markups.',
    faqs: [
      {
        question: 'Why is the rate I get at the bank different?',
        answer: 'Banks and currency exchange services add a markup (called a spread) above the interbank rate. This markup is typically 1–3% at banks and 2–5% at airport exchanges. The rate shown here is the base ECB reference rate with no markup. For large transfers over $5,000, specialized online forex brokers often offer significantly better rates with spreads as low as 0.1-0.5%. Always compare the "all-in" cost including both the spread and any fixed fees before choosing a provider.',
      },
      {
        question: 'How often do exchange rates update?',
        answer: 'The European Central Bank updates reference rates on banking business days at approximately 16:00 CET. Rates do not update on weekends or EU public holidays. In the live forex market, however, major currency pairs trade 24 hours a day, five days a week, and rates fluctuate continuously. The ECB reference rate is a snapshot taken at a specific time each day, not a real-time trading rate.',
      },
      {
        question: 'What is the Frankfurter API?',
        answer: 'Frankfurter is an open-source foreign exchange rates API that sources its data from the European Central Bank. It provides free, accurate, daily reference rates for 33+ currencies. It is widely used by developers and financial applications because it requires no API key, has no rate limits for reasonable use, and provides historical data going back to 1999 when the euro was introduced.',
      },
      {
        question: 'What factors cause exchange rates to change?',
        answer: 'Exchange rates are driven by a complex mix of factors: interest rate differentials between central banks (higher rates attract foreign capital, strengthening the currency), inflation rates (higher inflation typically weakens a currency), trade balances (trade surpluses tend to strengthen a currency), political stability, economic growth rates, and market speculation. Major events like elections, central bank announcements, or geopolitical crises can cause significant intraday movements.',
      },
      {
        question: 'What is the best way to get foreign currency for travel?',
        answer: 'The most cost-effective approach is usually a combination: use a no-foreign-transaction-fee credit card for purchases (0% FX fee), withdraw cash from a local ATM at your destination (typically 1-2% above mid-market), and avoid airport kiosks entirely (5-15% markup). Order a small amount of currency from your bank before departure for immediate needs like taxi fares. Never use dynamic currency conversion (DCC) at foreign terminals — always choose to be charged in the local currency.',
      },
      {
        question: 'What is a currency peg and how does it affect exchange rates?',
        answer: 'A currency peg is when a country fixes its currency\'s value to another currency (usually USD) or a basket of currencies. Examples include the Hong Kong dollar (pegged to USD at ~7.75-7.85 HKD/USD), the Saudi riyal (fixed at 3.75 SAR/USD), and the Danish krone (pegged to EUR). Pegged currencies do not float freely — their central bank intervenes to maintain the peg by buying or selling foreign reserves. When using this calculator with a pegged currency, the rate will be very stable (the peg range), unlike freely floating currencies whose rates change continuously.',
      },
      {
        question: 'Why do some currencies have very high or very low nominal values relative to USD?',
        answer: 'A currency\'s nominal value (e.g., 1 USD = 145 JPY vs 1 USD = 0.92 EUR) does not indicate economic strength — it is largely a historical artifact. Japan has never redenominated the yen, which is why one yen is a very small unit. South Korea\'s won, Indonesia\'s rupiah, and Vietnam\'s dong similarly have high nominal values relative to USD. What matters for economic analysis is not the nominal exchange rate but the Real Effective Exchange Rate (REER), which adjusts for inflation and trade weights across multiple trading partners. A currency with a low nominal value can still represent a strong, productive economy.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Sarah is traveling from New York to Paris and wants to convert $2,000 USD to Euros for her trip. The current EUR/USD rate is 1.0850.',
        inputs: { amount: '2000', fromCurrency: 'USD', toCurrency: 'EUR' },
        result: '€1,843.32 EUR — Sarah gets approximately €1,843 for her $2,000 at the mid-market rate.',
        insight: 'The mid-market rate is what banks trade at. Sarah will likely get a worse rate from her bank or airport kiosk, which adds a spread of 2-5%. Using a specialized transfer service or multi-currency card can save $40-100 on this conversion alone.',
      },
      {
        scenario: 'Raj in Mumbai receives a $5,000 USD freelance payment and wants to convert it to Indian Rupees. The USD/INR rate is 83.25.',
        inputs: { amount: '5000', fromCurrency: 'USD', toCurrency: 'INR' },
        result: '₹416,250 INR — Raj receives approximately 4.16 lakh rupees before any bank fees or transfer charges.',
        insight: 'Freelancers receiving international payments should compare platforms like Wise, Payoneer, and direct bank transfers. The difference in exchange rates and fees between platforms can be 2-4%, which on $5,000 means $100-200 lost to poor rates.',
      },
      {
        scenario: 'The Chen family in San Francisco is planning a month-long trip to Japan and wants to budget $8,000 USD for spending money. The current USD/JPY exchange rate is 145.50.',
        inputs: { amount: '8000', fromCurrency: 'USD', toCurrency: 'JPY' },
        result: '¥1,164,000 JPY — the Chen family receives approximately 1.16 million yen for their $8,000 at the mid-market rate before any fees or spreads are applied.',
        insight: 'Japan remains a largely cash-based society, so the Chens should carry a mix of yen cash and a no-foreign-transaction-fee card. Withdrawing ¥1,164,000 from ATMs in Japan (at ~1.5% above mid-market) would cost about $120 in hidden fees compared to the mid-market rate. Using a Wise multi-currency card pre-loaded with yen at the time of conversion could cut that to about $40. Planning the currency exchange strategy in advance saves enough to cover a nice kaiseki dinner in Kyoto.',
      },
    ],
    proTips: [
      'Always check the mid-market rate before converting — this is the "real" rate without any markup. Google the pair (e.g., "USD to EUR") to see it instantly.',
      'Avoid airport and hotel currency exchange kiosks — they typically offer the worst rates with spreads of 5-15%. Use a local ATM instead for better rates.',
      'For large transfers (over $1,000), use a specialized currency transfer service rather than your bank — the savings from a better exchange rate can be 2-4%.',
      'Consider a multi-currency account or card if you travel frequently — they let you hold and spend multiple currencies at near-interbank rates.',
      'Be aware of the "dynamic currency conversion" scam at foreign ATMs and card terminals — always choose to be charged in the local currency, not your home currency.',
      'Weekend and holiday exchange rates may include additional markup since forex markets are closed — convert during business days for the best rates.',
    ],
    limitations: [
      'Exchange rates shown are mid-market reference rates and may differ from rates offered by banks, credit cards, or currency exchange services which add their own spread.',
      'This calculator does not account for transaction fees, service charges, or commission that financial institutions typically add to currency conversions.',
      'Rates update periodically based on available data and may not reflect real-time market movements during periods of high volatility.',
      'When not to use: This tool provides estimates for personal finance and travel planning — it should not be used for forex trading, business accounting requiring exact rates, or legal currency conversion requirements.',
    ],
    quickReference: [
      { label: 'Most traded pair', value: 'EUR/USD (Euro / US Dollar)' },
      { label: 'Typical bank spread', value: '2-5% above mid-market rate' },
      { label: 'Credit card foreign fee', value: '1-3% per transaction' },
      { label: 'Wise/TransferWise spread', value: '~0.5% above mid-market' },
      { label: 'Best time to convert', value: 'Weekdays 8am-5pm GMT (forex open)' },
      { label: 'USD to EUR (May 2026)', value: '~0.92 EUR per 1 USD' },
      { label: 'USD to GBP (May 2026)', value: '~0.78 GBP per 1 USD' },
      { label: 'USD to JPY (May 2026)', value: '~145 JPY per 1 USD' },
    ],
    citations: [
      { source: 'Federal Reserve', url: 'https://www.federalreserve.gov' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/c/currency.asp' },
      { source: 'European Central Bank', url: 'https://www.ecb.europa.eu' },
    ],
  },
};

export default currencyConfig;
