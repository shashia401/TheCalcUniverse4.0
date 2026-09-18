import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import { fvLumpSum } from '../../../utils/financial';
import CDPanel from './CDPanel';

const COMPOUND_LABELS: Record<string, { label: string; n: number }> = {
  daily: { label: 'Daily', n: 365 },
  weekly: { label: 'Weekly', n: 52 },
  monthly: { label: 'Monthly', n: 12 },
  quarterly: { label: 'Quarterly', n: 4 },
  semiannually: { label: 'Semi-Annually', n: 2 },
  annually: { label: 'Annually', n: 1 },
};

const cdSvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">
  <rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/>
  <text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">CD Ladder Strategy</text>
  <text x="160" y="34" text-anchor="middle" font-size="9" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Stagger maturities for liquidity + better rates</text>
  <rect x="25" y="50" width="60" height="40" rx="6" fill="var(--svg-3b82f6)"/>
  <text x="55" y="74" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)" font-family="system-ui,sans-serif">3mo</text>
  <rect x="95" y="50" width="60" height="40" rx="6" fill="var(--svg-10b981)"/>
  <text x="125" y="74" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)" font-family="system-ui,sans-serif">6mo</text>
  <rect x="165" y="50" width="60" height="40" rx="6" fill="var(--svg-f59e0b)"/>
  <text x="195" y="74" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)" font-family="system-ui,sans-serif">1yr</text>
  <rect x="235" y="50" width="60" height="40" rx="6" fill="var(--svg-ef4444)"/>
  <text x="265" y="74" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)" font-family="system-ui,sans-serif">2yr</text>
  <path d="M 55,95 L 55,108" stroke="var(--svg-94a3b8)" stroke-width="1.5"/>
  <polygon points="51,105 55,112 59,105" fill="var(--svg-94a3b8)"/>
  <path d="M 125,95 L 125,108" stroke="var(--svg-94a3b8)" stroke-width="1.5"/>
  <polygon points="121,105 125,112 129,105" fill="var(--svg-94a3b8)"/>
  <path d="M 195,95 L 195,108" stroke="var(--svg-94a3b8)" stroke-width="1.5"/>
  <polygon points="191,105 195,112 199,105" fill="var(--svg-94a3b8)"/>
  <rect x="25" y="118" width="60" height="30" rx="6" fill="var(--svg-3b82f6)" opacity="0.4"/>
  <text x="55" y="137" text-anchor="middle" font-size="9" fill="var(--svg-1e40af)" font-family="system-ui,sans-serif">Roll to 2yr</text>
  <text x="160" y="168" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">As each CD matures, reinvest at current rate</text>
  <text x="160" y="182" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">A = P(1+r/n)^(nt) per CD</text>
  <text x="160" y="195" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Regular liquidity + higher blended yield</text>
</svg>`;

const cdConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'initialDeposit',
      label: 'Initial Deposit',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'The amount you deposit to open the CD. Most banks require $500–$5,000 minimum.',
    },
    {
      id: 'termUnit',
      label: 'Term',
      type: 'select',
      required: true,
      options: [
        { label: 'Months', value: 'months' },
        { label: 'Years', value: 'years' },
      ],
      helpText: 'Choose whether to enter the CD term in months or years.',
    },
    {
      id: 'termLength',
      label: 'Term Length',
      type: 'number',
      placeholder: '12',
      min: 1,
      max: 120,
      step: 1,
      required: true,
      helpText: 'Length of the CD term in the unit selected above (months or years).',
    },
    {
      id: 'apy',
      label: 'Annual Percentage Yield (APY)',
      type: 'number',
      placeholder: '4.25',
      unit: '%',
      min: 0,
      max: 20,
      step: 0.01,
      required: true,
      helpText: 'The annual percentage yield offered by the bank — this already accounts for compounding.',
    },
    {
      id: 'compounding',
      label: 'Compounding Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Daily (365/year)', value: 'daily' },
        { label: 'Weekly (52/year)', value: 'weekly' },
        { label: 'Monthly (12/year)', value: 'monthly' },
        { label: 'Quarterly (4/year)', value: 'quarterly' },
        { label: 'Semi-Annually (2/year)', value: 'semiannually' },
        { label: 'Annually (1/year)', value: 'annually' },
      ],
      helpText: 'How often interest is added to your balance. Daily or monthly is most common for CDs.',
    },
    {
      id: 'additionalDeposit',
      label: 'Additional Deposits (Optional)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 50,
      helpText: 'Recurring deposit amount added each compounding period',
    },
  ],

  calculate: (values) => {
    const deposit = parseFloat(values.initialDeposit);
    const termUnit = values.termUnit || 'months';
    const termRaw = parseFloat(values.termLength);
    const apyRaw = parseFloat(values.apy);
    const apy = apyRaw / 100;
    const compoundingKey = values.compounding || 'monthly';
    const additionalDeposit = parseFloat(values.additionalDeposit) || 0;

    if (isNaN(deposit) || isNaN(termRaw) || isNaN(apyRaw) || deposit <= 0 || termRaw <= 0 || apyRaw < 0 || additionalDeposit < 0) return [];

    const years = termUnit === 'months' ? termRaw / 12 : termRaw;
    const { n: periodsPerYear, label: compLabel } = COMPOUND_LABELS[compoundingKey] || COMPOUND_LABELS.monthly;

    // APY is already the effective ANNUAL rate (the input's own helpText says
    // so), not a nominal rate to re-compound — so the per-period rate must be
    // the one that, compounded `periodsPerYear` times, reproduces exactly
    // that APY: (1+apy)^(1/n) - 1. Dividing apy/n here would treat it as a
    // nominal rate and silently change the balance based on which
    // compounding frequency the user picks, even though APY is defined to
    // make that frequency irrelevant.
    const ratePerPeriod = Math.pow(1 + apy, 1 / periodsPerYear) - 1;
    const totalPeriods = Math.round(years * periodsPerYear);

    // Future value
    let balance = fvLumpSum(deposit, ratePerPeriod, totalPeriods);

    // Additional deposits
    if (additionalDeposit > 0 && ratePerPeriod > 0) {
      balance += additionalDeposit * ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);
    } else if (additionalDeposit > 0) {
      balance += additionalDeposit * totalPeriods;
    }

    const totalInterest = balance - deposit - additionalDeposit * totalPeriods;
    const interestPct = balance > 0 ? (totalInterest / balance) * 100 : 0;

    const fmtLarge = (n: number) =>
      n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    return [
      { id: 'balance', label: `Balance at Maturity (${termUnit === 'months' ? termRaw : termRaw * 12} ${termRaw === 1 ? 'month' : 'months'})`, value: fmtLarge(balance), highlight: true, color: 'positive' as const, interpretation: `Of this balance, ${interestPct.toFixed(1)}% (${fmtLarge(totalInterest)}) is interest the bank pays you — the rest is your own money back. A CD's return is fixed and guaranteed, but locked: withdrawing early usually forfeits several months of that interest.` },
      { id: 'totalPrincipal', label: 'Total Principal Deposited', value: fmtLarge(deposit + additionalDeposit * totalPeriods), color: 'neutral' as const },
      { id: 'totalInterest', label: 'Total Interest Earned', value: fmtLarge(totalInterest), color: 'positive' as const },
      { id: 'interestPct', label: 'Interest as % of Final Balance', value: `${interestPct.toFixed(1)}%`, color: interestPct > 20 ? 'positive' as const : 'neutral' as const },
      { id: 'apyResult', label: 'APY', value: `${(apy * 100).toFixed(2)}%`, color: 'neutral' as const },
      { id: 'compoundingResult', label: 'Compounding', value: `${compLabel} (${periodsPerYear}x/year)`, color: 'neutral' as const },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CDPanel, { values, results });
  },

  educational: {
    formula: 'A = P × (1 + r/n)^(n×t)',
    diagram: {
      svg: cdSvg,
      alt: 'CD ladder strategy diagram showing four staggered CDs (3mo, 6mo, 1yr, 2yr) with rollover arrows and compounding formula',
      caption: 'CD laddering staggers maturities for regular liquidity access while earning higher long-term rates on most of your deposit',
    },
    formulaDescription:
      'The compound interest formula: A = final amount at maturity, P = initial deposit, r = APY expressed as a decimal, n = compounding periods per year, t = time in years. More frequent compounding results in more interest earned on interest over the same time period.',
    variables: [
      { symbol: 'A', name: 'Maturity Balance', description: 'The total value of the CD at the end of its term — includes both the original principal and all compounded interest earned over the full term.' },
      { symbol: 'P', name: 'Initial Deposit', description: 'The principal amount you deposit to open the CD. Most banks require a minimum deposit of $500 to $5,000.' },
      { symbol: 'APY & Compounding', name: 'True Yield & Compounding Frequency', description: 'APY (Annual Percentage Yield) already reflects the true annual return including compounding — that is the entire point of disclosing APY instead of a nominal rate. A 4.25% APY CD grows $10,000 to the same $10,425 in one year whether the bank compounds daily or annually; the compounding-frequency selector changes how often interest posts to your account, not how much you ultimately earn.' },
    ],
    howToUse: [
      'Enter your initial deposit amount — CDs typically require a $500 to $5,000 minimum deposit.',
      'Choose the term unit (months or years) and enter the length of the CD term.',
      'Enter the APY offered by the bank (or use the benchmark rates table below as a reference for current market rates).',
      'Select the compounding frequency — daily compounding is most common for high-yield CDs.',
      'Optionally add recurring deposits if your bank allows "add-on" CD contributions.',
      'Review the maturity balance, total principal versus interest breakdown, and effective APY.',
    ],
    commonUses: [
      'Compare CD offers from different banks by calculating the exact maturity value based on APY, term length, and compounding frequency.',
      'Build a CD ladder strategy by modeling how splitting deposits across staggered maturity dates affects overall returns and liquidity.',
      'Decide between a high-yield savings account and a fixed-term CD by projecting the total interest earned under each option.',
    ],
    explanation:
      'Certificates of Deposit (CDs) offer a guaranteed fixed return in exchange for locking your money away for a predetermined term. The key advantage over regular savings accounts is the higher fixed interest rate that is guaranteed for the entire term. Banks issue CDs as a way to secure stable deposits they can use for lending, and in return they offer depositors a premium over standard savings rates. The trade-off is the loss of liquidity during the CD term — if you need access to your funds before maturity, you will typically face an early withdrawal penalty. Because APY already bakes in the effect of compounding, a given APY produces the same maturity balance no matter how often the bank compounds it — that is the entire reason regulators require APY disclosure instead of a nominal rate: it lets you compare CDs apples-to-apples without doing the compounding math yourself. The real strategy for maximizing CD returns is known as "CD laddering": splitting your total deposit across multiple CDs with staggered maturity dates (3-month, 6-month, 1-year, 2-year, etc.) so that some portion of your money matures at regular intervals, giving you ongoing liquidity access while keeping the bulk of your savings earning the higher long-term rates. CD laddering works especially well in a rising rate environment because as shorter-term CDs mature, you reinvest at higher current rates. This calculator also accounts for additional recurring deposits, which some banks offer through "add-on" CDs that allow you to continue contributing during the term rather than making only a single initial deposit. This is also why comparing the advertised APY across banks is always safe even if two offers compound at different intervals — a 4.5% APY is a 4.5% yield regardless of whether it is credited monthly or daily; the bank has already done that math for you. When comparing CD offers, always look at the APY rather than the nominal rate — the APY is required by federal law (Truth in Savings Act) to reflect the true annual return including compounding, making it the most honest basis for comparison. FDIC insurance coverage of up to $250,000 per depositor per bank makes CDs one of the safest places to park cash, alongside Treasury securities and high-yield savings accounts.',
    faqs: [
      {
        question: 'What is the difference between APY and APR?',
        answer: 'APY (Annual Percentage Yield) reflects the true rate of return including the effect of compounding. APR (Annual Percentage Rate) is the nominal rate before compounding is factored in. A CD with 4.25% APY compounded daily is effectively earning 4.25%. If the same CD only advertised 4.25% APR, the actual APY would be higher depending on the compounding frequency. Always compare APYs when shopping for CDs to get an apples-to-apples comparison.',
      },
      {
        question: 'What is a CD ladder and how does it work?',
        answer: 'A CD ladder is a strategy that splits your money across multiple CDs with different maturity dates. Instead of putting $20,000 in a single 2-year CD, you distribute $5,000 each into 6-month, 1-year, 18-month, and 2-year CDs. As each CD matures, you reinvest the proceeds at the current rate into a new long-term CD. This strategy gives you regular access to a portion of your savings while keeping most of your money earning higher long-term rates.',
      },
      {
        question: 'What happens if I withdraw early from a CD?',
        answer: 'Early withdrawal penalties vary by bank and are outlined in the CD terms. Typical penalties are 3 months of interest for CDs under 1 year, and 6-12 months of interest for longer terms. Some banks (like Ally) offer no-penalty CDs that allow early withdrawal with just 7 days of interest forfeited. Always understand the early withdrawal penalty before opening a CD account.',
      },
      {
        question: 'Are CDs FDIC-insured?',
        answer: 'Yes — CDs held at FDIC-member banks are insured up to $250,000 per depositor, per bank, per ownership category. Credit union CDs (called share certificates) are NCUA-insured for the same $250,000 limit. This insurance coverage makes CDs one of the safest places to park cash that you do not need immediate access to, while still earning a competitive return.',
      },
      {
        question: 'How do I choose the right CD term length?',
        answer: 'Match the term to when you will need the money. Need access in 6 months? Use a 6-month CD. Can lock money away longer? Longer terms generally offer higher rates. A CD ladder strategy is ideal when you want both higher rates and regular liquidity: split deposits across 3-month, 1-year, 2-year, and 5-year CDs so a portion matures at regular intervals.',
      },
      {
        question: 'What is a jumbo CD and how is it different?',
        answer: 'A jumbo CD requires a minimum deposit of $100,000 or more (some banks set the threshold at $250,000). In exchange for the larger deposit, jumbo CDs typically offer slightly higher APYs than standard CDs with the same term length. They carry the same FDIC insurance protection up to $250,000, but amounts above that limit are uninsured unless spread across multiple banks. Jumbo CDs are most commonly used by institutions, wealthy individuals, and retirees managing large cash positions who want guaranteed returns with minimal risk.',
      },
      {
        question: 'How does CD interest get taxed?',
        answer: 'CD interest is taxable as ordinary income in the year it is earned, even if you do not withdraw it or the CD has not yet matured. Your bank will issue a Form 1099-INT each year showing the interest credited to your account. You must report this on your federal and state tax returns. For CDs with terms longer than one year where interest compounds but is not paid out until maturity, you still owe tax annually on the accrued interest (called "original issue discount" or OID rules). Consider holding CDs in a tax-advantaged account like an IRA to defer or avoid taxes on the interest.',
      },
    ],
    formulaSource: 'Compound interest formula A = P(1 + r/n)^(nt) is the standard future value equation from time value of money theory. The Truth in Savings Act (12 CFR Part 1030) requires banks to disclose APY calculated as (1 + r/n)^n - 1, ensuring consistent comparison across products with different compounding frequencies.',
    proTips: [
      'Build a CD ladder instead of buying one long-term CD. Split your deposit across 3-month, 6-month, 1-year, and 2-year CDs. As each matures, reinvest at the current (potentially higher) rate. This gives you regular liquidity while capturing higher long-term yields.',
      'Always compare APY, not the nominal interest rate. Banks are required by law to disclose APY, which already includes the effect of compounding — a 4.25% APY is a 4.25% yield whether it is credited daily or monthly, so you never need to adjust for compounding frequency yourself when comparing offers.',
      'Watch for promotional "special" CD rates that are significantly above market. These are often limited to new customers or require a minimum deposit. Read the fine print: some promotional CDs automatically renew at much lower rates unless you act during a narrow grace period.',
      'Consider no-penalty CDs if you might need early access. These CDs (offered by Ally, Marcus, and others) allow full withdrawal after a short lock-up period (typically 6-7 days) with no penalty. The trade-off is a slightly lower APY — typically 0.25-0.50% below standard CD rates.',
    ],
    limitations: [
      'This calculator assumes the APY and compounding frequency remain constant throughout the CD term. It does not account for early withdrawal penalties, which vary by bank (typically 3-12 months of interest).',
      'This calculator assumes the bank credits interest at exactly the frequency selected and rounds only at maturity — actual bank statements may differ by fractions of a cent due to daily rounding conventions.',
      'CD interest is taxable as ordinary income; this calculator does not estimate after-tax returns.',
      'FDIC insurance covers up to $250,000 per depositor per bank; amounts above this limit are not protected.',
      'For CDs held in IRAs, different tax rules apply.',
      'This is an educational tool — always confirm rates and terms directly with your financial institution before opening a CD.',
    ],
    workedExamples: [
      {
        scenario: 'Sarah in Phoenix has $20,000 in emergency savings sitting in a 0.01% checking account. She wants to earn more without risking her principal and needs access every 3 months.',
        inputs: { initialDeposit: '5000', termUnit: 'months', termLength: '3', apy: '4.50', compounding: 'daily', additionalDeposit: '0' },
        result: 'Each $5,000 3-month CD earns approximately $56 in interest at maturity. With four CDs in a ladder, she earns about $224/year.',
        insight: 'By laddering four $5,000 CDs with 3-month maturities staggered one month apart, Sarah has $5,000 maturing every month. She earns 450x more interest than her checking account while maintaining near-full liquidity — a perfect use case for CD laddering as an emergency fund strategy.',
      },
      {
        scenario: 'Robert has $50,000 from a bonus and wants the highest guaranteed return for a 2-year horizon when he plans to buy a home.',
        inputs: { initialDeposit: '50000', termUnit: 'years', termLength: '2', apy: '5.25', compounding: 'monthly', additionalDeposit: '0' },
        result: 'Balance at maturity: approximately $55,500. Total interest earned: about $5,500 over 2 years.',
        insight: 'A single 2-year CD locks in the rate for the full term -- useful when rates are expected to decline. Robert knows exactly how much he will have for his down payment in 2 years, making his home-buying budget more predictable. He should confirm the early withdrawal penalty (likely 6 months of interest or about $1,375) in case plans change.',
      },
      {
        scenario: 'Jennifer has $100,000 from a home sale and wants to max FDIC coverage while earning competitive returns. She splits across two banks using add-on CDs.',
        inputs: { initialDeposit: '50000', termUnit: 'years', termLength: '3', apy: '4.85', compounding: 'daily', additionalDeposit: '500' },
        result: 'Balance at maturity: approximately $73,800 per bank. Total interest earned: about $9,800 across 3 years per bank, plus additional deposit growth.',
        insight: 'By splitting $100,000 evenly between two FDIC-insured banks (each with the full $250,000 coverage), Jennifer ensures all her principal is protected. The add-on CD feature allows her to deposit an extra $500 each month from her paycheck, turning a fixed-term CD into a forced savings vehicle. After 3 years, she will have contributed $68,000 in additional deposits per bank, with interest pushing the total well above her initial $50,000 deposit.',
      },
    ],
    quickReference: [
      { label: 'CD Term Range', value: '1 month to 10 years' },
      { label: 'FDIC Insurance Limit', value: '$250,000 per depositor per bank' },
      { label: 'Typical Minimum Deposit', value: '$500 to $5,000' },
      { label: 'Jumbo CD Threshold', value: '$100,000+' },
      { label: 'Early Withdrawal Penalty', value: '3-12 months of interest' },
    ],
    citations: [
      { source: 'Federal Deposit Insurance Corporation (FDIC)', url: 'https://www.fdic.gov' },
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
    ],
  },
};

export default cdConfig;
