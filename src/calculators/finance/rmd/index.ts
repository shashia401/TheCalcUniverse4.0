import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import RMDPanel from './RMDPanel';

const UNIFORM_TABLE: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4,
  88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
  96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2,
  104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4,
  112: 3.3, 113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3, 120: 2.0,
};

const JOINT_TABLE: Record<number, number> = {
  70: 35.0, 71: 34.1, 72: 33.3, 73: 32.4, 74: 31.5, 75: 30.6, 76: 29.8, 77: 28.9, 78: 28.0,
  79: 27.2, 80: 26.3, 81: 25.5, 82: 24.6, 83: 23.8, 84: 22.9, 85: 22.1, 86: 21.3, 87: 20.5,
  88: 19.7, 89: 19.0, 90: 18.2,
};

function getDistributionPeriod(age: number, useJoint: boolean): number {
  if (useJoint) {
    const clampedAge = Math.min(Math.max(age, 70), 90);
    return JOINT_TABLE[clampedAge] ?? UNIFORM_TABLE[Math.min(Math.max(age, 72), 120)] ?? 2.0;
  }
  const clampedAge = Math.min(Math.max(age, 72), 120);
  return UNIFORM_TABLE[clampedAge] ?? 2.0;
}

function getRmdStartAge(birthYear: number): number {
  if (birthYear <= 1950) return 72;
  if (birthYear <= 1959) return 73;
  return 75;
}

const rmdConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'birthYear',
      label: "Account Owner's Birth Year",
      type: 'number',
      placeholder: '1955',
      min: 1930,
      max: 1990,
      inputMode: 'numeric',
      helpText:
        'Used to determine your RMD starting age under SECURE 2.0 (Born 1950 or earlier: age 72. Born 1951-1959: age 73. Born 1960+: age 75)',
    },
    {
      id: 'accountBalance',
      label: 'Retirement Account Balance (as of Dec 31, prior year)',
      type: 'number',
      prefix: '$',
      placeholder: '500,000',
      inputMode: 'numeric',
      required: true,
      helpText: 'Total value of your retirement accounts as of December 31 of last year.',
    },
    {
      id: 'spouseToggle',
      label: 'Sole beneficiary is spouse 10+ years younger?',
      type: 'select',
      options: [
        { label: 'No — Use Uniform Lifetime Table', value: 'no' },
        { label: 'Yes — Use Joint Life Expectancy Table', value: 'yes' },
      ],
      helpText: 'Select "Yes" if your sole beneficiary is a spouse more than 10 years younger.',
    },
    {
      id: 'expectedReturn',
      label: 'Expected Annual Return',
      type: 'number',
      placeholder: '6.00',
      unit: '%',
      min: 0,
      max: 20,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Used to project future RMD amounts over next 10 years',
    },
  ],

  calculate: (values) => {
    const birthYear = parseInt(values.birthYear, 10);
    const accountBalance = new Decimal(String(values.accountBalance || '0').replace(/,/g, ''));
    const useJoint = values.spouseToggle === 'yes';
    const expectedReturn = parseFloat(values.expectedReturn) || 6;

    if (isNaN(birthYear) || accountBalance.lte(0)) return [];

    const currentYear = 2026;
    const currentAge = currentYear - birthYear;
    const rmdStartAge = getRmdStartAge(birthYear);

    if (currentAge < rmdStartAge) {
      const rmdStartYear = birthYear + rmdStartAge;
      return [
        {
          id: 'notYet',
          label: 'RMD Status',
          value: `RMDs begin at age ${rmdStartAge} in year ${rmdStartYear}`,
          highlight: true,
          color: 'neutral',
        },
        {
          id: 'yearsUntil',
          label: 'Years Until First RMD',
          value: `${rmdStartAge - currentAge} year${rmdStartAge - currentAge !== 1 ? 's' : ''}`,
          color: 'neutral',
        },
      ];
    }

    const distributionPeriod = getDistributionPeriod(currentAge, useJoint);
    const rmd = accountBalance.div(distributionPeriod);
    const rmdPct = rmd.div(accountBalance).mul(100);
    const penalty25 = rmd.mul(0.25);

    const fmtDollar = (d: Decimal): string =>
      `$${d.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

    // Build 10-year projection data using decimal.js for precision
    const rate = expectedReturn / 100;
    const projection: Array<{ year: number; age: number; balance: number; rmd: number; factor: number }> = [];
    let projBalance = accountBalance;
    for (let i = 0; i < 10; i++) {
      const projAge = currentAge + i;
      const projYear = currentYear + i;
      if (projAge < rmdStartAge) {
        projBalance = projBalance.mul(1 + rate);
        projection.push({ year: projYear, age: projAge, balance: projBalance.toNumber(), rmd: 0, factor: 0 });
      } else {
        const factor = getDistributionPeriod(projAge, useJoint);
        const projRmd = projBalance.div(factor);
        projection.push({ year: projYear, age: projAge, balance: projBalance.toNumber(), rmd: projRmd.toNumber(), factor });
        projBalance = projBalance.minus(projRmd).mul(1 + rate);
      }
    }

    const tableLabel = useJoint ? 'Joint Life Expectancy Table' : 'Uniform Lifetime Table';

    return [
      {
        id: 'currentRmd',
        label: `${currentYear} Required Minimum Distribution`,
        value: fmtDollar(rmd),
        highlight: true,
        color: 'positive',
        interpretation: `This is a mandatory withdrawal, not optional income — the IRS taxes it as ordinary income whether you need the cash or not, and missing it triggers a 25% penalty (${fmtDollar(penalty25)} here) on the shortfall. It's ${rmdPct.toFixed(1)}% of your balance this year; the percentage rises each year as the distribution period shortens.`,
      },
      {
        id: 'distributionPeriod',
        label: `IRS Distribution Period Factor (${tableLabel}, Age ${currentAge})`,
        value: distributionPeriod.toFixed(1),
        color: 'neutral',
      },
      {
        id: 'rmdPct',
        label: 'RMD as % of Account Balance',
        value: `${rmdPct.toFixed(2)}%`,
        color: 'neutral',
      },
      {
        id: 'penaltyWarning',
        label: '25% penalty if not taken by Dec 31 (10% if corrected within 2 years)',
        value: `Potential penalty: ${fmtDollar(penalty25)}`,
        color: 'negative',
      },
      {
        id: 'rmdStartNote',
        label: 'Your RMD Start Age (SECURE 2.0)',
        value: `Age ${rmdStartAge}`,
        color: 'neutral',
      },
      {
        id: '_projectionData',
        label: '__projectionData__',
        value: JSON.stringify(projection),
        color: 'neutral',
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RMDPanel, { values, results });
  },

  educational: {
    formula: 'RMD = Account Balance / IRS Life Expectancy Factor',
    formulaDescription:
      'The account balance used is the December 31 value from the prior year. The IRS Life Expectancy Factor comes from either the Uniform Lifetime Table (most account owners) or the Joint Life Expectancy Table (when the sole beneficiary is a spouse more than 10 years younger). All calculations use decimal.js for precise financial math.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto" font-family="system-ui,sans-serif"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="8"/><text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">RMD Calculation</text><g transform="translate(10,30)"><rect x="0" y="0" width="140" height="34" rx="6" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="70" y="13" text-anchor="middle" font-size="9" fill="var(--svg-1e40af)">Account Balance</text><text x="70" y="27" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-2563eb)">$500,000</text><text x="152" y="22" text-anchor="middle" font-size="16" fill="var(--svg-94a3b8)">/</text><rect x="170" y="0" width="130" height="34" rx="6" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="235" y="13" text-anchor="middle" font-size="9" fill="var(--svg-92400e)">Life Expectancy Factor</text><text x="235" y="27" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-d97706)">25.5</text></g><g transform="translate(10,75)"><rect x="0" y="0" width="300" height="30" rx="8" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="150" y="14" text-anchor="middle" font-size="10" fill="var(--svg-166534)">RMD = $500K / 25.5 = $19,608 this year</text><text x="150" y="26" text-anchor="middle" font-size="8" fill="var(--svg-166534)">Multiply by your tax rate for estimated tax impact</text></g><g transform="translate(20,115)"><text x="140" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">RMD Percentage Increases With Age</text><line x1="0" y1="28" x2="280" y2="28" stroke="var(--svg-cbd5e1)" stroke-width="2"/><circle cx="40" cy="28" r="10" fill="var(--svg-3b82f6)"/><text x="40" y="32" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)" font-weight="bold">73</text><text x="40" y="46" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">3.8%</text><circle cx="115" cy="28" r="10" fill="var(--svg-8b5cf6)"/><text x="115" y="32" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)" font-weight="bold">80</text><text x="115" y="46" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">5.0%</text><circle cx="190" cy="28" r="10" fill="var(--svg-f59e0b)"/><text x="190" y="32" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)" font-weight="bold">90</text><text x="190" y="46" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">8.2%</text><circle cx="260" cy="28" r="10" fill="var(--svg-ef4444)"/><text x="260" y="32" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)" font-weight="bold">100</text><text x="260" y="46" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">15.6%</text></g><g transform="translate(10,175)"><rect x="0" y="0" width="300" height="20" rx="5" fill="var(--svg-fef2f2)"/><text x="150" y="13" text-anchor="middle" font-size="8" fill="var(--svg-dc2626)">SECURE 2.0: RMD start age = 72 (born <=1950), 73 (1951-1959), or 75 (1960+)</text></g></svg>',
      alt: 'RMD calculation diagram showing account balance divided by life expectancy factor, with a timeline showing RMD percentages increasing with age from 3.8% at 73 to 15.6% at 100',
      caption: 'RMDs require withdrawing a minimum percentage of your retirement account each year starting at age 72-75, with the percentage increasing as you age',
    },
    variables: [
      {
        symbol: 'Account Balance',
        name: 'Prior Year-End Balance',
        description:
          'The fair market value of all your traditional IRAs and qualified plan accounts as of December 31 of the prior year. Roth IRAs are excluded — they have no RMDs during the owner\'s lifetime. If you have multiple IRA accounts, you can aggregate the RMD amount and withdraw it from any one or combination of your IRAs.',
      },
      {
        symbol: 'Life Expectancy Factor',
        name: 'IRS Distribution Period',
        description:
          'A divisor published by the IRS in Publication 590-B. It decreases each year as you age, which increases the percentage you must withdraw. Under SECURE 2.0 the tables were updated in 2022 to reflect longer life expectancies, slightly reducing RMD amounts. The Uniform Lifetime Table is used by most account owners. The Joint Life Expectancy Table applies only when your sole beneficiary is a spouse more than 10 years younger.',
      },
      {
        symbol: 'RMD Start Age',
        name: 'Required Beginning Date',
        description:
          'Under the SECURE 2.0 Act, the age at which RMDs must begin depends on your birth year: born 1950 or earlier -> age 72; born 1951-1959 -> age 73; born 1960 or later -> age 75. Your first RMD can be delayed to April 1 of the following year, but you will then owe two RMDs in that year (which could push you into a higher tax bracket).',
      },
      {
        symbol: 'Penalty',
        name: 'Excise Tax for Missed RMDs',
        description:
          'SECURE 2.0 reduced the penalty for failing to take an RMD from 50% to 25% of the shortfall. If the failure is corrected within a 2-year window (the "correction window"), the penalty is further reduced to 10%. You must file Form 5329 with the IRS and attach a statement explaining the reasonable cause for the failure.',
      },
    ],
    howToUse: [
      'Enter your birth year so the calculator can determine your RMD start age under SECURE 2.0.',
      'Enter your total retirement account balance as of December 31 of the prior year. Include all Traditional IRAs and qualified employer plans (401k, 403b, 457b). Do NOT include Roth IRAs.',
      'Select whether your sole beneficiary is a spouse who is more than 10 years younger. If yes, the Joint Life Expectancy Table applies and gives a longer distribution period (lower RMD).',
      'Enter your expected annual return to see how your RMDs are projected to change over the next 10 years as your balance grows between distributions.',
      'Review the penalty warning — failing to take your full RMD results in a 25% excise tax on the shortfall (reduced to 10% if corrected within a 2-year window under SECURE 2.0).',
    ],
    commonUses: [
      'Calculate your required minimum distribution amount for the current year based on your retirement account balance and IRS life expectancy tables.',
      'Plan for future RMDs by projecting how account growth between distributions affects your annual required withdrawal amounts.',
      'Understand the SECURE 2.0 rules including the updated starting ages and potential 25 percent penalty for missed distributions.',
    ],
    explanation:
      'RMDs exist because the government allowed you to defer taxes on contributions and growth inside traditional retirement accounts. Eventually, it wants those taxes paid. The IRS requires you to withdraw a minimum amount each year, calculated by dividing your account balance by a life expectancy factor. SECURE 2.0 (signed into law December 2022) pushed the starting age to 73 for those born 1951-1959 and to 75 for those born 1960 or later, giving retirees more time for tax-deferred growth. Accounts subject to RMDs include Traditional IRAs, SEP IRAs, SIMPLE IRAs, 401(k) plans, 403(b) plans, and 457(b) plans. Roth IRAs are NOT subject to RMDs during the owner\'s lifetime — this is one of their key advantages for estate planning.',
    workedExamples: [
      {
        scenario: 'Margaret, born in 1953 (age 73 in 2026), has a $500,000 traditional IRA balance as of December 31, 2025. She is not married to someone 10+ years younger. Her account earns 6% annually.',
        inputs: { birthYear: '1953', accountBalance: '500000', spouseToggle: 'no', expectedReturn: '6' },
        result: 'Margaret\'s 2026 RMD is $500,000 / 26.5 = $18,868. This represents 3.77% of her account balance. At a 22% marginal tax rate, she will owe approximately $4,150 in federal taxes on this withdrawal.',
        insight: 'Margaret\'s 2026 RMD is $500,000 / 26.5 = $18,868. Her RMD started at age 73 (she is in that first year). The RMD represents 3.77% of her account balance. At her marginal tax rate (say 22%), she will owe roughly $4,150 in federal taxes on this withdrawal. Her 10-year projection shows her RMD growing to about $25,000 by age 83, assuming 6% annual growth.',
      },
      {
        scenario: 'Bob, born in 1948 (age 78 in 2026), has a $750,000 401(k) balance and his wife Susan is 15 years younger (age 63). He has named her as his sole beneficiary.',
        inputs: { birthYear: '1948', accountBalance: '750000', spouseToggle: 'yes', expectedReturn: '5' },
        result: 'Bob\'s RMD using the Joint Life Expectancy Table is $750,000 / 28.0 = $26,786 — nearly $7,300 less than the Uniform Table amount of $34,091. Over his remaining lifetime, the Joint Table could save Bob tens of thousands in reduced RMDs.',
        insight: 'Using the Joint Life Expectancy Table (spouse 10+ years younger), Bob\'s distribution factor at age 78 is 28.0 instead of the Uniform Table factor of 22.0. His RMD is $750,000 / 28.0 = $26,786 — nearly $7,300 less than under the Uniform Table ($34,091). Over his remaining lifetime, the Joint Table could save Bob tens of thousands in reduced RMDs, keeping more money tax-deferred.',
      },
    ],
    proTips: [
      'Consider taking your first RMD in the calendar year you turn 72/73/75 rather than delaying to April 1 of the next year. Delaying means taking two RMDs in one tax year, which could push you into a higher tax bracket and increase your Medicare IRMAA premiums.',
      'Use your RMD to fund a Qualified Charitable Distribution (QCD) if you are 70.5 or older. You can direct up to $105,000 (2026 limit) of your RMD directly to a qualified charity, satisfying the RMD requirement without the distribution counting as taxable income.',
      'If you have multiple IRA accounts, you can calculate the RMD for each IRA separately but withdraw the total from just one account. This flexibility lets you manage which investments to sell and minimize transaction costs. 401(k) RMDs, however, must be taken separately from each plan.',
      'Plan Roth conversions before RMD age to reduce future RMDs. Converting portions of your traditional IRA to a Roth IRA when you are in a lower tax bracket (e.g., between retirement and RMD age) reduces the balance subject to RMDs and generates tax-free growth.',
      'Monitor the "RMD tax torpedo" — RMDs increase your taxable income, which can trigger higher Medicare Part B and Part D premiums (IRMAA surcharges) and make more of your Social Security benefits taxable. Strategic planning before age 72/73/75 can mitigate this effect.',
    ],
    limitations: [
      'This calculator uses the 2022 IRS life expectancy tables (effective from 2022 per SECURE Act regulations). The Uniform Lifetime Table assumes the account owner\'s beneficiary is exactly 10 years younger — if there is no designated beneficiary or the beneficiary is less than 10 years younger, the Uniform Table applies.',
      'The Joint Life Expectancy Table is only valid when the spouse is the SOLE primary beneficiary and is more than 10 years younger.',
      'Inherited IRA RMD rules (under the SECURE Act\'s 10-year rule for non-spouse beneficiaries) are not covered by this calculator.',
      'The 10-year projection assumes constant returns, which does not reflect real market volatility. State income tax on RMDs varies by state and is not included.',
    ],
    quickReference: [
      { label: 'RMD Start — Born <=1950', value: 'Age 72' },
      { label: 'RMD Start — Born 1951-1959', value: 'Age 73' },
      { label: 'RMD Start — Born >=1960', value: 'Age 75' },
      { label: 'First RMD Deadline', value: 'April 1 of year after turning start age' },
      { label: 'Subsequent RMDs', value: 'December 31 each year' },
      { label: 'Missed RMD Penalty', value: '25% (10% if corrected within 2 yrs)' },
      { label: 'Roth IRAs', value: 'No RMDs during owner\'s lifetime' },
      { label: 'QCD Limit (2026)', value: '$105,000 per year (age 70.5+)' },
    ],
    faqs: [
      {
        question: 'What accounts are subject to RMDs?',
        answer:
          'Traditional IRAs, SEP IRAs, SIMPLE IRAs, 401(k), 403(b), and governmental 457(b) plans are all subject to RMDs. Roth IRAs are NOT subject to RMDs during the original owner\'s lifetime — you never have to withdraw from a Roth IRA while you\'re alive. However, inherited Roth IRAs are now subject to RMDs under the SECURE Act rules. Designated Roth accounts in 401(k) and 403(b) plans ARE subject to RMDs (unlike Roth IRAs), though many people roll these over to a Roth IRA before RMD age to avoid this requirement.',
      },
      {
        question: 'What happens if I take more than the RMD?',
        answer:
          'You can always withdraw more than the RMD minimum — the RMD is a floor, not a ceiling. However, the extra amount still counts as ordinary taxable income in the year withdrawn. Excess withdrawals cannot be rolled back or credited toward future years\' RMDs. If you do take extra, consider using the excess to fund a Roth conversion or a taxable brokerage account for continued growth.',
      },
      {
        question: 'Can I avoid RMDs by converting to a Roth IRA?',
        answer:
          'Yes. Converting a Traditional IRA to a Roth IRA eliminates future RMDs on those funds, since Roth IRAs have no RMD requirement during the owner\'s lifetime. However, the converted amount is fully taxable in the year of conversion. Many retirees do partial Roth conversions in lower-income years (e.g., between retirement and RMD age, before Social Security begins) to reduce future RMD amounts and smooth out their tax burden over retirement.',
      },
      {
        question: 'Do I have to take RMDs from each account separately?',
        answer:
          'For IRAs (Traditional, SEP, SIMPLE), you can calculate the RMD for each account separately but withdraw the total aggregate amount from any one IRA or combination of IRAs. For employer plans (401k, 403b, 457b), RMDs must be calculated and taken separately from each plan — you cannot aggregate across employer plans or between employer plans and IRAs. Inherited IRAs must also be handled separately from your own IRAs.',
      },
      {
        question: 'Can I delay my first RMD to April 1 of the following year?',
        answer:
          'Yes, you can delay your first RMD to April 1 of the year after you turn your RMD starting age. However, you must still take your second RMD by December 31 of that same year. Taking two RMDs in one tax year could push you into a higher tax bracket and trigger IRMAA surcharges on Medicare premiums. For most retirees, taking the first RMD in the year you turn your start age spreads the tax liability more evenly.',
      },
    ],
    citations: [
      { source: 'IRS Publication 590-B — Distributions from IRAs', url: 'https://www.irs.gov/publications/p590b' },
      { source: 'SECURE 2.0 Act Summary (Congress.gov)', url: 'https://www.congress.gov/bill/117th-congress/house-bill/2617' },
      { source: 'IRS — Retirement Plans FAQs on RMDs', url: 'https://www.irs.gov/retirement-plans/retirement-plans-faqs-regarding-required-minimum-distributions' },
    ],
  },
};

export default rmdConfig;
