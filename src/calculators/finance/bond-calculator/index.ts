import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import BondPanel from './BondPanel';

function calcYTM(faceValue: number, couponRate: number, marketPrice: number, yearsToMaturity: number, frequency: number): number {
  const annualCoupon = faceValue * (couponRate / 100);
  const couponPayment = annualCoupon / frequency;
  const n = yearsToMaturity * frequency;

  const approxYTM = (annualCoupon + (faceValue - marketPrice) / yearsToMaturity) / ((faceValue + marketPrice) / 2);

  let low = 0.0001;
  let high = 5.0;
  let ytmPeriod = approxYTM / frequency;

  for (let iter = 0; iter < 200; iter++) {
    ytmPeriod = (low + high) / 2;
    let price = 0;
    for (let t = 1; t <= n; t++) {
      price += couponPayment / Math.pow(1 + ytmPeriod, t);
    }
    price += faceValue / Math.pow(1 + ytmPeriod, n);

    if (Math.abs(price - marketPrice) < 0.0001) break;
    if (price > marketPrice) low = ytmPeriod;
    else high = ytmPeriod;
  }

  return ytmPeriod * frequency * 100;
}

const bondCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'faceValue',
      label: 'Face / Par Value',
      type: 'number',
      placeholder: '1,000',
      prefix: '$',
      min: 100,
      step: 100,
      required: true,
      helpText: 'The bond\'s redemption value at maturity. Standard US corporate and Treasury bonds: $1,000.',
    },
    {
      id: 'couponRate',
      label: 'Annual Coupon Rate',
      type: 'number',
      placeholder: '5.00',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      helpText: 'The stated annual interest rate printed on the bond. A $1,000 bond at 5% pays $50/year.',
    },
    {
      id: 'marketPrice',
      label: 'Current Market Price',
      type: 'number',
      placeholder: '950',
      prefix: '$',
      min: 1,
      step: 0.01,
      required: true,
      helpText: 'The price the bond is currently trading at on the secondary market. Can be above or below face value.',
    },
    {
      id: 'yearsToMaturity',
      label: 'Years to Maturity',
      type: 'number',
      placeholder: '10',
      unit: 'years',
      min: 0.5,
      max: 50,
      step: 0.5,
      required: true,
      helpText: 'Number of years until the bond matures and you receive the face value.',
    },
    {
      id: 'paymentFrequency',
      label: 'Coupon Payment Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Semi-Annual (US Standard — 2× per year)', value: '2' },
        { label: 'Annual (Eurobonds — 1× per year)', value: '1' },
        { label: 'Quarterly (4× per year)', value: '4' },
        { label: 'Monthly (12× per year)', value: '12' },
      ],
      helpText: 'How often the bond pays interest. US bonds typically pay semi-annually.',
    },
  ],

  calculate: (values) => {
    const faceValue = parseFloat(values.faceValue);
    const couponRate = parseFloat(values.couponRate);
    const marketPrice = parseFloat(values.marketPrice);
    const yearsToMaturity = parseFloat(values.yearsToMaturity);
    const frequency = parseInt(values.paymentFrequency) || 2;

    if (isNaN(faceValue) || isNaN(couponRate) || isNaN(marketPrice) || isNaN(yearsToMaturity)) return [];
    if (faceValue <= 0 || marketPrice <= 0 || yearsToMaturity <= 0) return [];

    const ytm = calcYTM(faceValue, couponRate, marketPrice, yearsToMaturity, frequency);
    const currentYield = ((faceValue * couponRate / 100) / marketPrice) * 100;
    const annualCoupon = faceValue * (couponRate / 100);
    const couponPaymentPerPeriod = annualCoupon / frequency;
    const totalCoupons = couponPaymentPerPeriod * yearsToMaturity * frequency;
    const capitalGainLoss = faceValue - marketPrice;
    const totalReturn = totalCoupons + capitalGainLoss;

    const isDiscount = marketPrice < faceValue;
    const isPremium = marketPrice > faceValue;
    const priceDiff = Math.abs(faceValue - marketPrice);
    const priceDiffPct = (priceDiff / faceValue) * 100;

    const fmtD = (n: number) =>
      n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtPct = (n: number) => `${n.toFixed(4)}%`;

    const freqLabel = frequency === 1 ? 'Annual' : frequency === 2 ? 'Semi-Annual' : frequency === 4 ? 'Quarterly' : 'Monthly';

    return [
      {
        id: 'ytm',
        label: 'Yield to Maturity (YTM)',
        value: fmtPct(ytm),
        highlight: true,
        interpretation: `YTM is the total return if you hold to maturity and reinvest every coupon at this same rate — that reinvestment assumption is the weak link, since real rates move. The bond is trading at a ${isDiscount ? 'discount' : isPremium ? 'premium' : 'par'} to face value, which is${isDiscount ? " why YTM runs above the coupon rate" : isPremium ? " why YTM runs below the coupon rate" : ' consistent with YTM matching the coupon rate'}.`,
        color: ytm > couponRate ? 'positive' as const : ytm < couponRate ? 'negative' as const : 'neutral' as const,
      },
      {
        id: 'currentYield',
        label: 'Current Yield (Annual Coupon ÷ Market Price)',
        value: fmtPct(currentYield),
        color: 'neutral' as const,
      },
      {
        id: 'pricingStatus',
        label: 'Bond Trading Status',
        value: isDiscount
          ? `Discount — ${fmtD(priceDiff)} (${priceDiffPct.toFixed(2)}%) below par`
          : isPremium
            ? `Premium — ${fmtD(priceDiff)} (${priceDiffPct.toFixed(2)}%) above par`
            : 'At Par — Trading at face value',
        highlight: true,
        color: isDiscount ? 'positive' as const : isPremium ? 'negative' as const : 'neutral' as const,
      },
      {
        id: 'annualCoupon',
        label: `Annual Coupon Income (${freqLabel} payments of ${fmtD(couponPaymentPerPeriod)})`,
        value: fmtD(annualCoupon),
        color: 'positive' as const,
      },
      {
        id: 'totalCoupons',
        label: 'Total Coupon Income Over Life',
        value: fmtD(totalCoupons),
        color: 'positive' as const,
      },
      {
        id: 'capitalGainLoss',
        label: `Capital ${capitalGainLoss >= 0 ? 'Gain' : 'Loss'} at Maturity`,
        value: `${capitalGainLoss >= 0 ? '+' : ''}${fmtD(capitalGainLoss)}`,
        color: capitalGainLoss >= 0 ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'totalReturn',
        label: 'Total Absolute Return (Coupons + Capital)',
        value: fmtD(totalReturn),
        color: totalReturn >= 0 ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'ytmVsCoupon',
        label: 'YTM vs. Coupon Rate',
        value: ytm > couponRate
          ? `YTM (${fmtPct(ytm)}) > Coupon (${fmtPct(couponRate)}) — Discount bond confirms higher effective yield`
          : ytm < couponRate
            ? `YTM (${fmtPct(ytm)}) < Coupon (${fmtPct(couponRate)}) — Premium bond confirms lower effective yield`
            : 'Equal — Bond trading at par value',
        color: 'neutral' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BondPanel, { values, results });
  },

  educational: {
    formula: 'YTM Approximation: (Annual Coupon + (Face − Price) / Years) / ((Face + Price) / 2)   ·   Exact YTM: solved by Newton-Raphson iteration',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">How a Bond Works: Cash Flow Timeline</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Fixed coupon payments + face value at maturity = total return</text><g transform="translate(30,65)"><!-- Face value box (left) --><rect x="10" y="0" width="120" height="55" rx="8" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="70" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e40af)">Face Value</text><text x="70" y="42" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-2563eb)">$1,000</text><!-- Market price just below --><rect x="10" y="60" width="120" height="40" rx="6" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="70" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-b45309)">Market Price</text><text x="70" y="94" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">$950 (Discount)</text><!-- Coupon payments along timeline --><line x1="160" y1="38" x2="400" y2="38" stroke="var(--svg-cbd5e1)" stroke-width="2"/><circle cx="180" cy="38" r="5" fill="var(--svg-22c55e)"/><text x="180" y="22" text-anchor="middle" font-size="9" fill="var(--svg-16a34a)" font-weight="bold">$25</text><text x="180" y="52" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">6mo</text><circle cx="220" cy="38" r="5" fill="var(--svg-22c55e)"/><text x="220" y="22" text-anchor="middle" font-size="9" fill="var(--svg-16a34a)" font-weight="bold">$25</text><text x="220" y="52" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">1yr</text><circle cx="260" cy="38" r="5" fill="var(--svg-22c55e)"/><text x="260" y="22" text-anchor="middle" font-size="9" fill="var(--svg-16a34a)" font-weight="bold">$25</text><text x="260" y="52" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">...</text><circle cx="300" cy="38" r="5" fill="var(--svg-22c55e)"/><text x="300" y="22" text-anchor="middle" font-size="9" fill="var(--svg-16a34a)" font-weight="bold">$25</text><text x="300" y="52" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">...</text><circle cx="395" cy="38" r="7" fill="var(--svg-8b5cf6)"/><text x="395" y="18" text-anchor="middle" font-size="9" fill="var(--svg-7c3aed)" font-weight="bold">$1,025</text><text x="395" y="56" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">Maturity</text><text x="395" y="64" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">($1K + $25)</text><!-- Price-yield relationship --><rect x="30" y="90" width="380" height="65" rx="10" fill="var(--svg-f1f5f9)"/><text x="220" y="108" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Inverse Relationship: Price vs. Yield</text><rect x="45" y="118" width="110" height="28" rx="6" fill="var(--svg-22c55e)"/><text x="100" y="137" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Price Down → YTM Up</text><rect x="165" y="118" width="110" height="28" rx="6" fill="var(--svg-ef4444)"/><text x="220" y="137" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Price Up → YTM Down</text><rect x="285" y="118" width="110" height="28" rx="6" fill="var(--svg-3b82f6)"/><text x="340" y="137" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">At Par → YTM = Coupon</text></g><!-- YTM formula --><g transform="translate(40,250)"><rect x="10" y="0" width="370" height="78" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">YTM Components</text><text x="80" y="38" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)">Coupons: $50/yr × 10yr = $500</text><text x="80" y="54" text-anchor="middle" font-size="10" fill="var(--svg-8b5cf6)">Capital Gain: $1,000 − $950 = $50</text><text x="80" y="70" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">Total Return: $550 &vert; YTM ≈ 5.7%</text></g></svg>',
      alt: 'Bond cash flow timeline showing semi-annual coupon payments of $25 and the $1,025 maturity payment, with price-yield inverse relationship and YTM components',
      caption: 'Bonds pay fixed coupon income over time plus return of face value at maturity — YTM accounts for both income and capital gain or loss',
    },
    formulaDescription:
      'The Yield to Maturity is the internal rate of return (IRR) of all future cash flows discounted back to the current price. There is no closed-form algebraic solution — it requires iterative numerical methods. This calculator uses binary search converging to 4 decimal places of precision.',
    variables: [
      { symbol: 'YTM', name: 'Yield to Maturity', description: 'The annualized total return if you buy the bond at the current market price and hold it until maturity, assuming all coupons are reinvested at the same YTM rate. This is the single most important metric for bond comparison — it accounts for the coupon income, capital gain or loss, and time value of money.' },
      { symbol: 'Current Yield', name: 'Current Yield', description: 'Annual coupon payment divided by current market price. A simpler but less accurate measure than YTM — it ignores the capital gain/loss at maturity. A $1,000 bond at a 5% coupon rate trading at $950 has a current yield of $50/$950 = 5.26%, but a higher YTM that also captures the $50 capital gain at maturity.' },
      { symbol: 'Discount vs Premium', name: 'Discount & Premium Bonds', description: 'A bond trades at a discount when market price is below face value (YTM > coupon rate) and at a premium when price is above face value (YTM < coupon rate). The difference between market price and face value represents the capital gain or loss at maturity.' },
      { symbol: 'Duration', name: 'Macaulay Duration', description: 'A measure of interest rate sensitivity expressed in years. Higher duration = higher price volatility when rates change. A 10-year bond with a 5% coupon has a duration of approximately 7.8 years — meaning a 1% rate rise causes roughly a 7.8% price decline.' },
    ],
    howToUse: [
      'Enter the face value (usually $1,000 for US bonds), coupon rate, and current market price, plus years to maturity and payment frequency.',
      'The calculator shows YTM, current yield, and whether the bond trades at a discount or premium.',
      'Use YTM — not coupon rate or current yield — to compare bonds with different prices and coupon structures.',
    ],
    commonUses: [
      'Calculate the yield to maturity on a bond trading at a discount or premium to determine its true return versus the coupon rate.',
      'Compare bonds with different coupon rates, maturities, and market prices to find the best fixed-income investment for your portfolio.',
      'Understand how changes in market interest rates affect the price of your existing bond holdings and their effective yield.',
    ],
    explanation:
      'Bond pricing and yield have an inverse relationship — the most fundamental concept in fixed income: when market interest rates rise, existing bond prices fall (and vice versa). If you paid $1,000 for a 5% coupon bond and rates rise to 7%, your bond becomes less attractive — it must drop in price until its effective yield (YTM) rises to compete with the 7% market rate. This calculator makes that relationship explicit: enter any price below par and watch the YTM rise above the coupon rate. Enter any price above par and watch the YTM fall below it.',
    faqs: [
      {
        question: 'What is the difference between YTM and current yield?',
        answer: 'Current yield = annual coupon / market price. It is simple to calculate but ignores the capital gain (if you bought at a discount) or loss (if you bought at a premium) at maturity. YTM is the complete measure — it incorporates all cash flows including the final return of face value. For a bond at par, current yield = YTM = coupon rate. For any other price, all three are different.',
      },
      {
        question: 'Why does bond price move inversely to interest rates?',
        answer: 'When market rates rise, newly issued bonds offer higher coupons. To compete, the price of existing lower-coupon bonds must fall until their total return (YTM) matches the new market rate. Conversely, when rates fall, the higher fixed coupon of existing bonds becomes more valuable, so their price rises. This inverse relationship is the central risk of bond investing — "interest rate risk."',
      },
      {
        question: 'What is bond duration and why does it matter?',
        answer: 'Duration measures how sensitive a bond\'s price is to interest rate changes — roughly, the percentage change in price for a 1% change in yield. A 10-year bond with 5-year duration would drop approximately 5% in price if yields rise 1%. Longer maturity and lower coupon rates increase duration (higher rate sensitivity). Zero-coupon bonds have the highest duration (equal to their maturity).',
      },
      {
        question: 'What is the YTM approximation formula?',
        answer: 'The classic approximation: YTM ≈ (Annual Coupon + (Face Value − Market Price) / Years to Maturity) / ((Face Value + Market Price) / 2). This is the formula taught in most finance courses and produces a close estimate. This calculator uses an iterative binary search method to compute the exact YTM to 4 decimal places of precision.',
      },
      {
        question: 'What is a zero-coupon bond and how is it different?',
        answer: 'A zero-coupon bond pays no regular coupon payments — it is issued at a deep discount to face value and matures at par. The total return comes entirely from capital appreciation. Zero-coupon bonds have higher duration (equal to maturity) and thus higher price volatility relative to coupon-paying bonds of the same maturity. They are popular for tax-advantaged accounts and for matching specific future liabilities.',
      },
    ],
    citations: [
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
      { source: 'Municipal Securities Rulemaking Board (MSRB)', url: 'https://www.msrb.org' },
    ],
  },
};

export default bondCalculatorConfig;
