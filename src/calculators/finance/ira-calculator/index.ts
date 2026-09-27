import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { fvWithContributions } from '../../../utils/financial';
import { IRA_LIMITS, ROTH_IRA_INCOME_LIMITS, DEDUCTIBLE_IRA_LIMITS } from '../../../utils/taxData';
import IraPanel from './IraPanel';

const TAX_YEAR = 2026;

const iraCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'currentAge',
      label: 'Current Age',
      type: 'number',
      placeholder: '30',
      unit: 'years',
      inputMode: 'decimal',
      min: 18,
      max: 75,
      step: 1,
      required: true,
    },
    {
      id: 'retirementAge',
      label: 'Target Retirement Age',
      type: 'number',
      placeholder: '65',
      unit: 'years',
      inputMode: 'decimal',
      min: 30,
      max: 80,
      step: 1,
      required: true,
    },
    {
      id: 'currentBalance',
      label: 'Current IRA Balance (Total)',
      type: 'number',
      placeholder: '15,000',
      prefix: '$',
      min: 0,
      step: 500,
      helpText: 'Enter your combined Traditional + Roth IRA balance, or 0 if starting fresh.',
    },
    {
      id: 'annualContribution',
      label: `Annual Contribution (${TAX_YEAR} Limit: $${IRA_LIMITS.base.toLocaleString()}, +$${IRA_LIMITS.catchup.toLocaleString()} if 50+)`,
      type: 'number',
      placeholder: '7,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: `${TAX_YEAR} IRS combined limit: $${IRA_LIMITS.base.toLocaleString()} (under 50), $${IRA_LIMITS.totalAge50Plus.toLocaleString()} (age 50+). Applies to Traditional + Roth combined.`,
    },
    {
      id: 'expectedReturn',
      label: 'Expected Annual Return',
      type: 'number',
      placeholder: '7.00',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 20,
      step: 0.1,
      required: true,
      helpText: 'Historical S&P 500 average: ~10% nominal, ~7% after inflation.',
    },
    {
      id: 'marginalTaxRate',
      label: 'Current Marginal Tax Rate',
      type: 'select',
      required: true,
      options: [
        { label: '10% — Single < $11,600 / MFJ < $23,200', value: '10' },
        { label: '12% — Single $11,600–$47,150 / MFJ up to $94,300', value: '12' },
        { label: '22% — Single $47,150–$100,525 / MFJ up to $201,050', value: '22' },
        { label: '24% — Single $100,525–$191,950 / MFJ up to $383,900', value: '24' },
        { label: '32% — Single $191,950–$243,725 / MFJ up to $487,450', value: '32' },
        { label: '35% — Single $243,725–$609,350 / MFJ up to $731,200', value: '35' },
        { label: '37% — Single > $609,350 / MFJ > $731,200', value: '37' },
      ],
      helpText: 'Your highest federal tax bracket. Used to calculate the Traditional IRA upfront tax deduction.',
    },
    {
      id: 'retirementTaxRate',
      label: 'Expected Effective Tax Rate in Retirement',
      type: 'select',
      options: [
        { label: '0% — Very low retirement income', value: '0' },
        { label: '10% — Low retirement income', value: '10' },
        { label: '12% — Moderate retirement income', value: '12' },
        { label: '22% — Higher retirement income', value: '22' },
        { label: '24% — High retirement income', value: '24' },
        { label: '32% — Very high retirement income', value: '32' },
      ],
      helpText: 'The effective tax rate you expect to pay on Traditional IRA withdrawals in retirement. This is the key variable in the Roth vs. Traditional decision.',
    },
  ],

  calculate: (values) => {
    const currentAge = parseInt(values.currentAge);
    const retirementAge = parseInt(values.retirementAge);
    const currentBalance = parseFloat(values.currentBalance) || 0;
    const annualContribution = parseFloat(values.annualContribution) || 0;
    const annualReturn = parseFloat(values.expectedReturn) / 100;
    const marginalRate = parseFloat(values.marginalTaxRate) / 100 || 0.22;
    const retireRate = parseFloat(values.retirementTaxRate) / 100 || 0.12;

    if (isNaN(currentAge) || isNaN(retirementAge) || retirementAge <= currentAge || isNaN(annualReturn)) return [];

    const years = retirementAge - currentAge;
    const isCatchup = currentAge >= 50;
    const maxContrib = isCatchup ? IRA_LIMITS.totalAge50Plus : IRA_LIMITS.base;
    const contrib = Math.min(annualContribution, maxContrib);
    const overLimit = annualContribution > maxContrib;

    const monthlyRate = annualReturn / 12;
    const months = years * 12;

    // Roth: contributions are after-tax, withdrawals are tax-free
    const rothBalance = fvWithContributions(currentBalance, contrib / 12, monthlyRate, months);

    // Traditional: contributions are pre-tax (deductible), withdrawals taxed at retireRate
    const tradBalance = fvWithContributions(currentBalance, contrib / 12, monthlyRate, months);
    const tradAfterTax = tradBalance * (1 - retireRate);

    // Tax savings from Traditional: the deduction frees up marginalRate * contrib
    // in cash each year, which — if invested the same way — grows alongside the
    // IRA itself. Without crediting this, Traditional only ever loses (the
    // withdrawal tax) and never wins, which is the bug this fixes: Roth and
    // Traditional start with the same account formula by design (same annual
    // contribution either way), so Traditional's entire case rests on this
    // reinvested-refund side account, not on the IRA balance alone.
    const yearlyDeductionSavings = contrib * marginalRate;
    const tradTaxSavingsInvested = fvWithContributions(0, yearlyDeductionSavings / 12, monthlyRate, months);
    const tradTotal = tradAfterTax + tradTaxSavingsInvested;

    // Roth advantage: no tax on withdrawal, compared against Traditional's
    // after-tax IRA balance PLUS its reinvested deduction savings.
    const rothAdvantage = rothBalance - tradTotal;

    const totalContribs = currentBalance + contrib * years;
    const rothEarnings = rothBalance - totalContribs;

    const breakevenRate = (() => {
      if (rothBalance <= 0) return 0;
      let lo = 0, hi = 0.5;
      for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;
        if (tradBalance * (1 - mid) + tradTaxSavingsInvested > rothBalance) lo = mid;
        else hi = mid;
      }
      return lo;
    })();

    const winner = rothAdvantage > 0 ? 'Roth' : 'Traditional';

    const fmt = (n: number) =>
      n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    const results: CalculatorResult[] = [
      {
        id: 'rothBalance',
        label: 'Roth IRA — Tax-Free Balance',
        value: fmt(rothBalance),
        highlight: true,
        color: 'positive' as const,
        interpretation: `This grows tax-free and comes out tax-free in retirement — the ${winner} account wins here mainly because of the tax-rate assumptions you entered. Roth tends to win if you expect a higher tax rate in retirement than now; Traditional tends to win in the opposite case, since its upfront deduction is worth more at a high current rate.`,
      },
      {
        id: 'tradAfterTax',
        label: `Traditional IRA — After ${(retireRate * 100).toFixed(0)}% Withdrawal Tax`,
        value: fmt(tradAfterTax),
        color: 'neutral' as const,
      },
      {
        id: 'winner',
        label: `Recommended: ${winner}`,
        value: `${winner} wins by ${fmt(Math.abs(rothAdvantage))}`,
        color: rothAdvantage > 0 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'tradBalance',
        label: 'Traditional IRA — Gross Balance (Before Tax)',
        value: fmt(tradBalance),
        color: 'neutral' as const,
      },
      {
        id: 'tradTaxSavingsInvested',
        label: 'Traditional — Reinvested Tax Refund (Side Account)',
        value: fmt(tradTaxSavingsInvested),
        color: 'neutral' as const,
        interpretation: `Your ${(marginalRate * 100).toFixed(0)}% deduction frees up ${fmt(yearlyDeductionSavings)}/year in cash. Investing that refund the same way it grows to ${fmt(tradTaxSavingsInvested)} — this is Traditional's real advantage, on top of the IRA balance itself.`,
      },
      {
        id: 'rothEarnings',
        label: 'Roth IRA — Tax-Free Investment Growth',
        value: fmt(rothEarnings),
        color: 'positive' as const,
      },
      {
        id: 'breakevenRate',
        label: 'Breakeven Retirement Tax Rate',
        value: `${(breakevenRate * 100).toFixed(1)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'totalContributions',
        label: 'Total Contributions (Current + Annual × Years)',
        value: fmt(totalContribs),
        color: 'neutral' as const,
      },
    ];

    if (overLimit) {
      results.push({
        id: 'limitWarning',
        label: `${TAX_YEAR} IRS Contribution Limit Warning`,
        value: `Your $${annualContribution.toLocaleString()} exceeds the ${isCatchup ? 'age 50+' : ''} limit of $${maxContrib.toLocaleString()}. Using $${maxContrib.toLocaleString()}.`,
        color: 'negative' as const,
      });
    }

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(IraPanel, { values, results });
  },

  educational: {
    formula: 'Roth: FV = Balance × (1+r)^n + PMT[((1+r)^n − 1) / r] → tax-free | Traditional: Same FV × (1 − tax%)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="#f8fafc" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">Roth IRA vs. Traditional IRA</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="#64748b">Same investment growth, different tax treatment</text><g transform="translate(30,60)"><!-- Roth IRA side --><rect x="20" y="5" width="170" height="32" rx="6" fill="#e0f2fe"/><text x="105" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#0369a1">Roth IRA</text><text x="105" y="54" text-anchor="middle" font-size="10" fill="#64748b">After-tax contributions</text><!-- Roth bars --><rect x="50" y="70" width="110" height="40" rx="4" fill="#3b82f6" opacity="0.6"/><text x="55" y="95" font-size="10" class="fill-white" font-weight="bold">Contributions</text><rect x="50" y="112" width="110" height="70" rx="4" fill="#22c55e"/><text x="55" y="155" font-size="10" class="fill-white" font-weight="bold">Tax-Free Growth</text><text x="105" y="196" text-anchor="middle" font-size="11" fill="#64748b">Withdrawals: 100% Tax-Free</text><text x="105" y="212" text-anchor="middle" font-size="20" font-weight="bold" fill="#22c55e">$0 Tax</text></g><g transform="translate(30,60)"><!-- Traditional IRA side --><rect x="220" y="5" width="170" height="32" rx="6" fill="#fef3c7"/><text x="305" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#b45309">Traditional IRA</text><text x="305" y="54" text-anchor="middle" font-size="10" fill="#64748b">Pre-tax contributions (deductible)</text><!-- Trad bars --><rect x="250" y="70" width="110" height="40" rx="4" fill="#3b82f6" opacity="0.6"/><text x="255" y="95" font-size="10" class="fill-white" font-weight="bold">Contributions</text><rect x="250" y="112" width="110" height="70" rx="4" fill="#8b5cf6"/><text x="255" y="140" font-size="10" class="fill-white" font-weight="bold">Growth</text><rect x="250" y="155" width="110" height="27" rx="4" fill="#ef4444" opacity="0.8"/><text x="255" y="173" font-size="10" class="fill-white" font-weight="bold">Withdrawal Tax</text><text x="305" y="196" text-anchor="middle" font-size="11" fill="#64748b">Withdrawals: Taxed at ordinary rates</text><text x="305" y="212" text-anchor="middle" font-size="18" font-weight="bold" fill="#ef4444">Pay Tax</text></g><!-- Bottom decision guide --><g transform="translate(40,290)"><text x="180" y="10" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">Key Decision Rule</text><text x="180" y="28" text-anchor="middle" font-size="10" fill="#64748b">Rate Now &lt; Rate Later &rarr; Roth | Rate Now &gt; Rate Later &rarr; Traditional</text></g></svg>',
      alt: 'Side-by-side comparison of Roth IRA and Traditional IRA showing Roth withdrawals are 100% tax-free while Traditional withdrawals incur taxes on growth and contributions',
      caption: 'Roth IRA contributions are after-tax but all withdrawals are tax-free; Traditional IRA contributions are pre-tax (deductible) but all withdrawals are taxed as ordinary income',
    },
    formulaDescription:
      'Both account types grow identically. The only difference is when taxes are paid. Roth = pay tax now (contribution is after-tax), never again. Traditional = deduct now, pay tax on every dollar withdrawn at your future rate. If your tax rate is the same now and later, the result is mathematically identical.',
    variables: [
      { symbol: 'Current vs. Future Tax Rate', name: 'Now vs. Retirement', description: 'If your current marginal rate is higher than your retirement effective rate, Traditional wins (deduct now at high rate, pay later at low rate). If lower now, Roth wins (pay now at low rate, withdraw tax-free later). The breakeven rate shown in results tells you the tipping point.' },
      { symbol: 'Breakeven Rate', name: 'The Decision Point', description: 'If your retirement effective rate is below this percentage, Traditional wins. Above it, Roth wins. Find your breakeven and compare against your estimated retirement rate.' },
      { symbol: 'Contribution Limit', name: `${TAX_YEAR} IRS Combined Limit`, description: `$${IRA_LIMITS.base.toLocaleString()} (under 50) or $${IRA_LIMITS.totalAge50Plus.toLocaleString()} (50+) applies to the total of Traditional + Roth IRA contributions. You can split any way between the two types.` },
    ],
    howToUse: [
      'Enter your current age and target retirement age to set the investment window.',
      'Enter your combined current IRA balance (Traditional + Roth) and planned annual contribution.',
      `The calculator enforces the ${TAX_YEAR} IRS limit of $${IRA_LIMITS.base.toLocaleString()} (under 50) / $${IRA_LIMITS.totalAge50Plus.toLocaleString()} (50+).`,
      'Select your current marginal tax rate — this determines the Traditional IRA deduction benefit.',
      'Estimate your effective tax rate in retirement — this is the critical variable. Most retirees have effective rates of 10–15%.',
      'The breakeven rate shows the exact retirement tax rate at which Traditional and Roth are equal.',
    ],
    commonUses: [
      'Compare the after-tax retirement value of a Traditional IRA versus a Roth IRA based on your current tax rate and estimated retirement tax rate.',
      'Determine the breakeven retirement tax rate at which Traditional and Roth IRAs produce the same after-tax outcome.',
      'Plan annual contributions across both IRA types to create tax diversification and optimize your retirement withdrawal strategy.',
    ],
    explanation:
      `The Traditional vs. Roth IRA decision comes down to one question: is your tax rate higher now or in retirement? If you pay $${IRA_LIMITS.base.toLocaleString()}/year into a Traditional IRA at a 22% marginal rate, you save $${(IRA_LIMITS.base * 0.22).toLocaleString()} in taxes this year. That tax savings can be invested elsewhere. In retirement, every dollar withdrawn from the Traditional IRA is taxed as ordinary income. A Roth IRA skips the upfront deduction in exchange for completely tax-free withdrawals. The math is identical when current and future tax rates are the same — meaning the Roth advantage is purely a bet on future tax rates being higher. Most financial advisors suggest Roth for young professionals in low brackets, Traditional for peak earners in high brackets, and a mix for those who want tax diversification.`,
    
    
    
    
    limitations: [
      `Traditional IRA deductions phase out at higher incomes for those covered by a workplace retirement plan. In 2026: single filers covered by a workplace plan phase out at $${DEDUCTIBLE_IRA_LIMITS.single.start.toLocaleString()}-$${DEDUCTIBLE_IRA_LIMITS.single.end.toLocaleString()} MAGI; MFJ (both covered) at $${DEDUCTIBLE_IRA_LIMITS.mfj.start.toLocaleString()}-$${DEDUCTIBLE_IRA_LIMITS.mfj.end.toLocaleString()}. This calculator does not check income phase-out eligibility — it assumes your Traditional IRA contribution is fully deductible.`,
      `Roth IRA contributions phase out at higher incomes regardless of workplace plan coverage. In 2026: single filers phase out at $${ROTH_IRA_INCOME_LIMITS.single.start.toLocaleString()}-$${ROTH_IRA_INCOME_LIMITS.single.end.toLocaleString()} MAGI; MFJ at $${ROTH_IRA_INCOME_LIMITS.mfj.start.toLocaleString()}-$${ROTH_IRA_INCOME_LIMITS.mfj.end.toLocaleString()}. Above these thresholds, you may need the Backdoor Roth IRA strategy, which is not modeled here.`,
      'The calculator assumes a constant annual return, which real markets never deliver. Sequence-of-returns risk — a bear market in the years just before or during early retirement — can significantly reduce the final balance compared to the smooth growth projection shown here.',
      'Projections do not account for Required Minimum Distributions (RMDs) starting at age 73 (SECURE 2.0 Act) for Traditional IRAs, which force taxable withdrawals and may push retirees into higher brackets. Roth IRAs have no RMDs during the original owner\'s lifetime, a significant long-term advantage not reflected in simple balance comparisons.',
    ],
quickReference: [
      { label: '2026 IRA Contribution Limit (Under 50)', value: `$${IRA_LIMITS.base.toLocaleString()} — combined Traditional + Roth limit` },
      { label: '2026 IRA Contribution Limit (50+)', value: `$${IRA_LIMITS.totalAge50Plus.toLocaleString()} — includes $${IRA_LIMITS.catchup.toLocaleString()} catch-up contribution` },
      { label: 'Traditional IRA Rule', value: 'Contributions may be tax-deductible now; all withdrawals taxed as ordinary income' },
      { label: 'Roth IRA Rule', value: 'Contributions are after-tax (not deductible); qualified withdrawals are 100% tax-free' },
      { label: 'RMD Age (Traditional IRA)', value: '73 — Required Minimum Distributions must begin (SECURE 2.0 Act)' },
      { label: 'Roth IRA RMDs', value: 'None during original owner\'s lifetime — a major long-term advantage of Roth accounts' },
      { label: 'Breakeven Decision Rule', value: 'Current marginal rate > retirement effective rate → Traditional wins. Current < retirement → Roth wins.' },
      { label: 'Roth IRA 5-Year Rule', value: 'Earnings withdrawn before age 59½ AND before the account is 5 years old incur taxes + 10% penalty' },
    ],
proTips: [
      'If you expect your income to rise significantly later in your career (doctors, lawyers, tech workers), fund a Roth IRA early while you are in a lower bracket. Once you cross into the 32%+ bracket, the math strongly favors Traditional — but you cannot undo years of missed Roth contributions.',
      `The "tax diversification" strategy: split your contributions between Traditional and Roth IRAs (e.g., $${(IRA_LIMITS.base / 2).toLocaleString()} in each if under 50). In retirement, withdraw from Traditional to fill the low brackets (0%, 10%, 12%) and use Roth for any spending above that — minimizing your lifetime tax bill regardless of future rate changes.`,
      `The Traditional IRA tax deduction savings should be invested, not spent. If your $${IRA_LIMITS.base.toLocaleString()} Traditional contribution saves you $${(IRA_LIMITS.base * 0.22).toLocaleString()} in taxes (at 22% rate) and you invest that in a taxable brokerage account, your Traditional IRA outcome significantly outperforms Roth over time. Failing to invest the tax savings is the most common mistake in the Roth vs. Traditional decision.`,
      'If your income exceeds the Roth IRA phase-out limits, the Backdoor Roth IRA strategy is available: contribute to a non-deductible Traditional IRA and immediately convert to Roth. There is no income limit on Roth conversions. Be aware of the "pro-rata rule" — any existing pre-tax Traditional IRA balances will trigger taxable conversion amounts proportional to your total IRA balance.',
    ],
workedExamples: [
      {
        scenario: 'Alex, a 26-year-old software developer in Seattle, WA, has $18,000 in a Roth IRA and contributes $7,000/year (below the 2026 max of $7,500). He is in the 22% federal marginal bracket and expects to be in the 22% bracket in retirement with a comfortable lifestyle. He uses a 7% expected return and plans to retire at 65 (39-year horizon).',
        inputs: { currentAge: '26', retirementAge: '65', currentBalance: '18000', annualContribution: '7000', expectedReturn: '7', marginalTaxRate: '22', retirementTaxRate: '22' },
        result: 'Roth IRA tax-free balance: approximately $1,695,000. Traditional IRA after-tax balance (at 22% expected retirement rate): approximately $1,322,000. But Traditional\'s $1,540/year tax deduction, invested at the same 7% return, grows to about $312,700 on its own — added to the Traditional IRA that brings its true total to about $1,634,700. Roth still wins here, but by only about $60,000, not the $373,000 gap a raw-balance comparison would suggest.',
        insight: 'Alex\'s raw Roth balance looks $373,000 ahead of Traditional\'s after-tax balance, but that comparison ignores what happens to the tax savings a Traditional contribution frees up. At a 22% marginal rate, a $7,000 Roth contribution actually costs Alex $8,974 of pre-tax earnings, while a Traditional contribution costs only $7,000 — freeing up $1,540/year that, invested in a taxable account at the same 7% return, grows to roughly $312,700 over 39 years. Crediting Traditional with that reinvested refund narrows Roth\'s true lead to about $60,000. Because Alex\'s current and retirement rates are identical (22%), the two strategies land close together, with a modest edge to Roth mainly because a taxable side account owes its own tax drag along the way (not modeled here). The core lesson: never compare raw IRA balances alone — the Traditional deduction is only worth as much as what you actually do with it.',

      },
      {
        scenario: 'Diana, a 48-year-old marketing director in Chicago, IL, has $120,000 in a Traditional IRA and contributes $7,500/year (under 50). She is in the 32% federal bracket and expects her effective tax rate in retirement to be 12% — she plans a modest retirement with no mortgage. She uses a 6% expected return and plans to retire at 67 (19-year horizon).',
        inputs: { currentAge: '48', retirementAge: '67', currentBalance: '120000', annualContribution: '7500', expectedReturn: '6', marginalTaxRate: '32', retirementTaxRate: '12' },
        result: 'Roth IRA tax-free balance: approximately $639,000. Traditional IRA after-tax balance (at 12% expected retirement rate): approximately $562,000. But Diana\'s $2,400/year tax deduction (32% × $7,500), invested at the same 6% return, grows to about $84,700 on its own — added to the Traditional IRA, that brings its true total to about $646,900, actually ahead of the Roth balance by about $8,000.',
        insight: 'Diana is in the 32% bracket now and expects only 12% in retirement — a textbook case where Traditional should win, and once the tax savings are properly credited, it does. Diana\'s $7,500 Traditional contribution generates a $2,400 tax deduction (32% × $7,500). Invested in a taxable brokerage account at 6%, that grows to approximately $84,700 after 19 years. Adding that to her Traditional after-tax balance of $562,000 gives roughly $646,900 — about $8,000 ahead of the $639,000 Roth balance. If her retirement rate ends up being even lower than 12%, Traditional\'s advantage grows further. The practical takeaway: for peak earners in their 40s who expect dramatically lower tax rates in retirement, Traditional IRAs are typically the better choice — but only if the tax savings are actually reinvested rather than spent.',

      },
    ],
faqs: [
      {
        question: 'Can I have both a Traditional and Roth IRA?',
        answer: `Yes — the ${TAX_YEAR} contribution limit of $${IRA_LIMITS.base.toLocaleString()} (under 50) / $${IRA_LIMITS.totalAge50Plus.toLocaleString()} (50+) is a combined limit across all IRA accounts. You could contribute $4,000 to Traditional and $3,500 to Roth, for example. Having both provides tax diversification in retirement: you can withdraw from Traditional up to the standard deduction amount (tax-free) and supplement with Roth (also tax-free).`,
      },
      {
        question: 'How do I know what my retirement tax rate will be?',
        answer: 'Most retirees withdraw enough to fill the lower brackets. In 2026, the standard deduction is $15,000 (single) / $30,000 (MFJ) — that much income is tax-free. To reach the 22% bracket in retirement as a single filer, you would need over $60,000 in taxable withdrawals. For most people, the effective tax rate in retirement is 10–15%. Use the breakeven rate shown in the results: as long as your expected retirement rate is below the breakeven, Traditional wins.',
      },
      {
        question: 'Does the Traditional IRA tax deduction phase out?',
        answer: `Yes — if you (or your spouse) have access to a workplace retirement plan (401k), the Traditional IRA deduction is phased out at higher incomes. For 2026: single filers covered by a workplace plan: $${DEDUCTIBLE_IRA_LIMITS.single.start.toLocaleString()}–$${DEDUCTIBLE_IRA_LIMITS.single.end.toLocaleString()} MAGI phase-out. MFJ (both covered): $${DEDUCTIBLE_IRA_LIMITS.mfj.start.toLocaleString()}–$${DEDUCTIBLE_IRA_LIMITS.mfj.end.toLocaleString()}. MFJ (one covered) has a separate, higher phase-out for the non-covered spouse. Roth IRA income phase-outs are separate and higher.`,
      },
      {
        question: 'What is a Backdoor Roth IRA?',
        answer: `If your income exceeds the Roth IRA direct contribution limits (single > $${ROTH_IRA_INCOME_LIMITS.single.end.toLocaleString()}, MFJ > $${ROTH_IRA_INCOME_LIMITS.mfj.end.toLocaleString()} in ${TAX_YEAR}), you can still contribute via the "backdoor" strategy: contribute to a non-deductible Traditional IRA, then immediately convert to Roth. There is no income limit on Roth conversions. If you have no existing pre-tax Traditional IRA balance, the conversion is effectively tax-free. This is a common strategy for high-income earners.`,
      },
      {
        question: 'What are Required Minimum Distributions (RMDs)?',
        answer: 'Traditional IRA accounts require you to begin taking Required Minimum Distributions (RMDs) starting at age 73 (as of 2025 under SECURE 2.0 Act). RMDs are calculated based on your life expectancy factor from the IRS Uniform Lifetime Table and are taxed as ordinary income. Roth IRAs do not have RMDs during the original owner\'s lifetime, which is one of their most valuable long-term advantages. RMDs can push retirees into higher tax brackets, making Roth conversions before age 73 worth considering.',
      },
    ],
  },
};

export default iraCalculatorConfig;
