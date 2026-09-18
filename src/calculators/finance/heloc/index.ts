import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import HELOCPanel from './HELOCPanel';

const helocSvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Home Equity Breakdown</text><polygon points="160,25 195,40 195,55 125,55 125,40" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><rect x="143" y="40" width="34" height="15" rx="2" fill="var(--svg-f1f5f9)"/><text x="160" y="52" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-1e40af)">$550K</text><rect x="40" y="66" width="240" height="18" rx="3" fill="var(--svg-3b82f6)" opacity="0.4"/><text x="48" y="79" font-size="8" font-weight="bold" fill="var(--svg-1e40af)">Mortgage</text><text x="272" y="79" text-anchor="end" font-size="7" fill="var(--svg-64748b)">$320K</text><rect x="40" y="86" width="50" height="18" rx="3" fill="var(--svg-22c55e)"/><text x="65" y="99" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">Cushion</text><text x="272" y="99" text-anchor="end" font-size="7" fill="var(--svg-64748b)">$60K</text><rect x="40" y="106" width="150" height="18" rx="3" fill="var(--svg-8b5cf6)"/><text x="115" y="119" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">Available HELOC: $120K</text><line x1="248" y1="62" x2="248" y2="128" stroke="var(--svg-f59e0b)" stroke-width="1.5" stroke-dasharray="3,2"/><text x="278" y="98" font-size="7" fill="var(--svg-f59e0b)">80% CLTV</text><rect x="30" y="146" width="260" height="48" rx="6" fill="var(--svg-f1f5f9)"/><text x="160" y="162" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-1e293b)">Max HELOC = ($550K x 80%) - $320K = $120K</text><text x="80" y="180" text-anchor="middle" font-size="7" fill="var(--svg-3b82f6)">Draw Period: 10yr interest-only</text><text x="240" y="180" text-anchor="middle" font-size="7" fill="var(--svg-ef4444)">Repayment: 20yr amortizing</text><text x="160" y="194" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">Total CLTV = ($320K + $120K) / $550K = 80%</text></svg>';

const helocCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homeValue',
      label: 'Estimated Home Value',
      type: 'number',
      prefix: '$',
      placeholder: '550,000',
      required: true,
      helpText:
        'Use a recent appraisal, Zillow/Redfin estimate, or your purchase price plus estimated appreciation.',
    },
    {
      id: 'mortgageBalance',
      label: 'Current Mortgage Balance',
      type: 'number',
      prefix: '$',
      placeholder: '320,000',
      required: true,
      helpText:
        'Your current outstanding principal balance — found on your most recent mortgage statement.',
    },
    {
      id: 'maxLTV',
      label: 'Lender Maximum CLTV Limit',
      type: 'select',
      helpText:
        'Combined Loan-to-Value ratio. Most lenders allow 80%. Some banks and credit unions allow 85–90%.',
      options: [
        { label: '80% CLTV (Most common)', value: '80' },
        { label: '85% CLTV (Some lenders)', value: '85' },
        { label: '90% CLTV (Select lenders / credit unions)', value: '90' },
      ],
    },
    {
      id: 'helocRate',
      label: 'HELOC Interest Rate (APR)',
      type: 'number',
      unit: '%',
      placeholder: '8.75',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      helpText:
        'HELOCs use variable rates tied to Prime Rate. Current Prime is approximately 8.50%. Enter the rate quoted by your lender.',
    },
    {
      id: 'drawAmount',
      label: 'Amount You Plan to Draw',
      type: 'number',
      prefix: '$',
      placeholder: '50,000',
      helpText:
        'Optional: Enter how much you plan to borrow for a specific project to see your exact interest payment.',
    },
  ],

  calculate: (values) => {
    const homeValue = parseFloat(values.homeValue);
    const mortgageBalance = parseFloat(values.mortgageBalance);
    const maxLTV = parseFloat(values.maxLTV || '80');
    const helocRate = parseFloat(values.helocRate);
    const drawAmount = parseFloat(values.drawAmount) || 0;

    if (isNaN(homeValue) || homeValue <= 0) return [];
    if (isNaN(mortgageBalance) || mortgageBalance < 0) return [];
    if (isNaN(maxLTV) || maxLTV > 100) return [];
    if (isNaN(helocRate) || helocRate < 0) return [];

    const maxBorrowable = Math.max(0, homeValue * (maxLTV / 100) - mortgageBalance);
    const totalEquity = homeValue - mortgageBalance;
    const tapableEquity = maxBorrowable;
    const requiredCushion = homeValue - mortgageBalance - maxBorrowable;
    const currentLTV = (mortgageBalance / homeValue) * 100;

    const actualDraw = drawAmount > 0 ? Math.min(drawAmount, maxBorrowable) : maxBorrowable;
    const monthlyInterestOnDraw = actualDraw * (helocRate / 100 / 12);
    const monthlyInterestOnMax = maxBorrowable * (helocRate / 100 / 12);

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const interestLabel =
      drawAmount > 0
        ? 'Monthly Interest-Only Payment (on your draw)'
        : 'Monthly Interest-Only Payment (full line)';

    return [
      {
        id: 'maxCreditLine',
        label: 'Maximum Available Line of Credit',
        value: `$${fmt(maxBorrowable)}`,
        highlight: true,
        color: maxBorrowable > 0 ? 'positive' : 'negative',
        interpretation: `This is the most a lender may extend against your equity — not a spending target. A HELOC is secured by your home, and the interest-only payment above doesn't reduce the balance, so what you draw stays owed until the repayment period begins.`,
      },
      {
        id: 'monthlyInterestPayment',
        label: interestLabel,
        value: `$${fmt(monthlyInterestOnDraw)}`,
        color: 'neutral',
      },
      {
        id: 'totalEquityResult',
        label: 'Total Home Equity',
        value: `$${fmt(totalEquity)}`,
      },
      {
        id: 'tapableEquityResult',
        label: '"Tapable" Equity (Available to Borrow)',
        value: `$${fmt(tapableEquity)}`,
      },
      {
        id: 'currentLTVResult',
        label: 'Current Loan-to-Value (LTV)',
        value: `${currentLTV.toFixed(1)}%`,
      },
      {
        id: 'maxLTVResult',
        label: 'Lender Maximum CLTV',
        value: `${maxLTV}%`,
      },
      {
        id: '_helocData',
        label: '_helocData',
        value: JSON.stringify({
          homeValue,
          mortgageBalance,
          maxLTV,
          maxBorrowable,
          totalEquity,
          tapableEquity,
          requiredCushion,
          currentLTV,
          helocRate,
          actualDraw,
          drawAmount,
          monthlyInterestOnDraw,
          monthlyInterestOnMax,
        }),
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HELOCPanel, { values, results });
  },

  educational: {
    formula: 'Max HELOC = (Home Value × Max CLTV%) − Existing Mortgage Balance',
    diagram: {
      svg: helocSvg,
      alt: 'Home equity diagram with a house icon and stacked bar showing home value split into mortgage balance, lender equity cushion, and available HELOC credit line',
      caption: "A HELOC lets you borrow against home equity up to the lender CLTV limit, typically 80% of the home value minus the existing mortgage balance's CLTV limit, with the remaining equity kept as a cushion for the lender",
    },
    formulaDescription:
      'A HELOC allows you to borrow against the equity you have built in your home. The maximum credit line is determined by multiplying your home value by the lender\'s maximum CLTV (Combined Loan-to-Value) ratio, then subtracting your existing mortgage balance. The result is your available borrowing capacity — the equity you can actually access beyond what your lender requires you to keep as a cushion.',
    variables: [
      { symbol: 'Home Value', name: 'Estimated Home Value', description: 'The current market value of your home, based on appraisal or automated valuation model (AVM) from services like Zillow or Redfin.' },
      { symbol: 'Mortgage Balance', name: 'Existing Mortgage Balance', description: 'The outstanding principal remaining on your first mortgage. This is subtracted from the maximum allowed debt to determine the available HELOC amount.' },
      { symbol: 'CLTV%', name: 'Combined Loan-to-Value Ratio', description: 'The maximum percentage of your home\'s value that lenders allow as total debt (first mortgage + HELOC). Most lenders use 80%, though some go up to 90%. A higher CLTV means more borrowing power but more risk.' },
      { symbol: 'Available HELOC', name: 'Maximum Credit Line', description: 'The maximum amount you can borrow calculated as (Home Value × CLTV%) − Mortgage Balance. This is your tapable equity — the portion of your equity the lender will let you access.' },
      { symbol: 'Draw Amount', name: 'Planned Draw Amount', description: 'The specific amount you intend to borrow from your HELOC. Entering this gives you a precise monthly interest-only payment instead of a payment on the full line.' },
    ],
    commonUses: [
      'Calculate your available home equity and maximum HELOC credit line based on your home value and current mortgage balance.',
      'Estimate the interest-only monthly payment during the draw period for home improvement projects or debt consolidation.',
      'Compare HELOC borrowing against other financing options by understanding how variable rates affect long-term repayment costs.',
    ],
    explanation:
      'A HELOC (Home Equity Line of Credit) works like a credit card secured by your home equity. During the draw period (typically 10 years), you borrow and repay as needed, paying interest-only on what you have drawn. After the draw period, the balance converts to a fully-amortizing loan typically over 20 years. HELOCs use variable rates tied to the Prime Rate, so payments change as rates move. For example, if the Prime Rate is 8.50% and your lender offers Prime + 1.00%, your rate is 9.50%. When the Federal Reserve raises or lowers rates, your HELOC rate follows. HELOCs are commonly used for home improvements, debt consolidation, major purchases, or as an emergency fund. The interest paid on a HELOC may be tax-deductible if the funds are used to buy, build, or substantially improve your home — consult a tax advisor for your specific situation. The draw period structure makes HELOCs particularly suitable for ongoing projects where you need flexibility to borrow as work progresses rather than taking a lump sum all at once.',
    howToUse: [
      'Enter your estimated home value based on appraisal or market estimate (Zillow, Redfin, or professional appraisal).',
      'Input your current mortgage balance from your latest statement.',
      'Select the lender\'s maximum CLTV limit (typically 80-90%). Most conventional lenders cap at 80%.',
      'Enter the HELOC interest rate quoted by your lender — typically Prime Rate plus a margin.',
      'Optionally enter the specific amount you plan to draw to see your exact interest-only payment.',
      'Review your available equity, estimated line amount, and maximum borrowing capacity.',
    ],
    faqs: [
      {
        question: 'What is the difference between a HELOC and a home equity loan?',
        answer:
          'A home equity loan gives you a lump sum at a fixed interest rate — like a second mortgage with predictable payments. A HELOC gives you a revolving line of credit with a variable rate and interest-only payments during the draw period. HELOCs offer more flexibility (draw as needed, repay and reborrow) while home equity loans offer payment certainty with a fixed rate and fixed term. HELOCs are better for ongoing projects like renovations with uncertain costs; home equity loans are better for one-time large expenses like debt consolidation where you want fixed payments.',
      },
      {
        question: 'How does CLTV work?',
        answer:
          'Combined Loan-to-Value (CLTV) is the total of all loans secured by your home divided by its value. If your home is worth $500,000 and you have a $300,000 mortgage, your current LTV is 60%. At 80% CLTV, you can borrow up to $100,000 more ($400,000 total − $300,000 existing). The lender keeps a 20% equity cushion as protection against declining home values. Some credit unions offer up to 90% CLTV, but this comes with higher rates and less room if home prices drop.',
      },
      {
        question: 'Can I use a HELOC to pay off debt?',
        answer:
          'Yes — and this is one of the most common uses. Mortgage interest on HELOCs may be tax-deductible when used for home improvements (consult a tax advisor). HELOC rates are typically much lower than credit card rates (8-10% vs. 20-25%). However, you are converting unsecured debt (credit cards) into debt secured by your home — defaulting on a HELOC puts your home at risk. Only use this strategy if you have disciplined financial habits and a plan to avoid reaccumulating credit card debt.',
      },
      {
        question: 'What happens after the draw period ends?',
        answer: 'After the draw period (typically 10 years), the HELOC enters the repayment period. You can no longer draw funds, and the outstanding balance converts to a fully-amortizing loan typically amortized over 20 years. This means your monthly payment can increase significantly because you are now paying principal AND interest. It is a common trap for borrowers who only budget for the interest-only draw period payment. Plan for the repayment period before you enter it.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Jennifer in Charlotte, NC bought her home for $380,000 five years ago and it is now worth $550,000 based on recent comparable sales. She still owes $320,000 on her mortgage and wants to know how much she can borrow through a HELOC at a standard 80% CLTV limit. The lender quoted a rate of 8.75% (Prime + 0.25%). She plans to draw $50,000 for a kitchen renovation.',
        inputs: { homeValue: '550000', mortgageBalance: '320000', maxLTV: '80', helocRate: '8.75', drawAmount: '50000' },
        result: 'Maximum available credit line: $120,000. Monthly interest-only payment on her $50,000 draw: $365/month. Total home equity: $230,000. Tapable equity: $120,000. Required equity cushion: $110,000. Current LTV: 58.2%.',
        insight: 'Jennifer has built $230,000 in equity — 42% of her home\'s value — through both principal paydown and appreciation. However, the 80% CLTV limit means she can only access $120,000 of that equity (the "tapable" portion). The remaining $110,000 must stay in the home as a lender cushion. At the quoted 8.75% rate, her $50,000 draw for the kitchen renovation costs $365/month in interest-only payments during the 10-year draw period — significantly less than the ~$1,042/month she would pay on a 20% APR credit card for the same balance. This is why HELOCs are popular for home improvements: the rate spread between HELOCs and credit cards is typically 10+ percentage points.',
      },
      {
        scenario: 'David and Lisa in Denver, CO own a home worth $720,000 with a $395,000 mortgage balance. They are exploring a HELOC with a credit union that offers 90% CLTV at a rate of 9.25%. They want to know their maximum credit line before deciding how much to draw.',
        inputs: { homeValue: '720000', mortgageBalance: '395000', maxLTV: '90', helocRate: '9.25', drawAmount: '0' },
        result: 'Maximum available credit line: $253,000. Monthly interest-only payment on the full line: $1,950/month. Total home equity: $325,000. Tapable equity: $253,000. Required equity cushion: $72,000. Current LTV: 54.9%.',
        insight: 'The 90% CLTV from David and Lisa\'s credit union gives them access to $253,000 — substantially more than the $181,000 they would get at the standard 80% CLTV. However, the trade-off is a higher rate (9.25% vs. the typical 8.50-8.75%) and a thinner equity cushion. Only $72,000 in equity remains as a buffer if home values decline; if the Denver market corrects by 10%, their $720,000 home drops to $648,000 and their combined loan-to-value jumps to 100% ($395,000 mortgage + a portion of the HELOC balance), potentially triggering a lender review or a freeze on further draws (common during 2008-style housing downturns). The higher CLTV option provides more borrowing power today but significantly less financial flexibility tomorrow. They should only access the full amount if they have a clear, high-ROI use for the funds.',
      },
    ],

    proTips: [
      'HELOC rates are variable and tied to the Prime Rate. When the Federal Reserve raises rates, your monthly payment increases. Budget for rates 2-3 percentage points higher than today\'s quote — if you cannot afford the payment at that level, you are overborrowing.',
      'The draw period (typically 10 years) is interest-only — you pay only the interest on what you have drawn. When the repayment period begins, your payment jumps significantly because you now pay principal AND interest. A $100,000 draw at 8.75% costs $729/month (interest-only) during the draw period but roughly $1,050/month during the 20-year repayment period.',
      'HELOC interest may be tax-deductible if used to buy, build, or substantially improve your home (IRS Publication 936). Interest on funds used for debt consolidation, vacations, or college tuition is generally NOT deductible. Track your draws by purpose to maximize your tax deduction.',
      'Many lenders charge annual fees ($50-$100), draw fees, early closure fees (if you close the line within 3 years), and inactivity fees. The effective cost of a HELOC is higher than the stated interest rate alone — ask for a full fee schedule before committing.',
    ],

    quickReference: [
      { label: 'Max HELOC Formula', value: '(Home Value × CLTV%) − Mortgage Balance' },
      { label: 'Standard CLTV Limit', value: '80% — most conventional lenders cap total secured debt at 80% of home value' },
      { label: 'Current Prime Rate (June 2026)', value: '~8.50% — HELOC rates typically Prime + 0% to 2% margin' },
      { label: 'Draw Period Duration', value: 'Typically 10 years — interest-only payments on drawn balance' },
      { label: 'Repayment Period Duration', value: 'Typically 20 years — fully amortizing, no further draws allowed' },
      { label: 'HELOC Interest Tax Deduction', value: 'Deductible only if funds used to buy, build, or substantially improve the home (IRS Pub 936)' },
      { label: 'Typical HELOC Fees', value: '$0-$500 origination, $50-$100 annual fee, possible early closure fee if closed within 3 years' },
    ],

    limitations: [
      'This calculator provides the maximum line based on CLTV but does not consider your income, credit score, or debt-to-income ratio — all of which lenders use to determine actual approval and the final credit line amount. Qualification requires a full lender underwriting process.',
      'HELOC interest rates are variable (tied to Prime Rate + a margin) and this calculator uses the rate you enter as if it were fixed. Actual HELOC payments change whenever the Federal Reserve adjusts rates — monthly payments can increase substantially during rate-hiking cycles.',
      'It does not account for closing costs (typically $0-$500), annual maintenance fees, early termination fees, or appraisal costs. It also does not model the repayment period jump — when the draw period ends, the payment switches from interest-only to fully amortizing over ~20 years.',
      'Home values are estimates and can decline. If your home\'s market value drops, the lender may freeze or reduce your available credit line — even if you have never missed a payment. This happened to millions of HELOC borrowers during the 2008 financial crisis. Do not treat a HELOC as an emergency fund that cannot be taken away.',
    ],
citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
      { source: 'Federal Reserve Board (Regulation Z)', url: 'https://www.federalreserve.gov' },
    ],
  },
};

export default helocCalculatorConfig;
