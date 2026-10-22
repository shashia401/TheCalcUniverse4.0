import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, ExplainStep } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';
import SocialSecurityPanel from './SocialSecurityPanel';
import { BEND_POINTS, claimFactor, delayedCreditPerYear, estimatePIA, fraLabel, getFRA, MAX_BENEFIT_AT_FRA, monthlyBenefit } from './ssMath';
import { FICA } from '../../../utils/taxData';

const ssSvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="8"/><text x="160" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-1e293b)">PIA: Progressive Benefit Formula</text><rect x="10" y="35" width="300" height="155" rx="8" fill="var(--svg-f1f5f9)"/><rect x="20" y="50" width="80" height="50" rx="5" fill="var(--svg-22c55e)" opacity="0.85"/><text x="60" y="72" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ffffff)">90%</text><text x="60" y="88" text-anchor="middle" font-size="8" fill="var(--svg-052e16)">of AIME up to $1,286</text><rect x="110" y="50" width="90" height="50" rx="5" fill="var(--svg-3b82f6)" opacity="0.85"/><text x="155" y="72" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ffffff)">32%</text><text x="155" y="88" text-anchor="middle" font-size="8" fill="var(--svg-1e3a5f)">of AIME $1,286-$7,749</text><rect x="210" y="50" width="90" height="50" rx="5" fill="var(--svg-ef4444)" opacity="0.85"/><text x="255" y="72" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ffffff)">15%</text><text x="255" y="88" text-anchor="middle" font-size="8" fill="var(--svg-450a0a)">of AIME above $7,749</text><text x="160" y="115" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">Example: $5,000 AIME</text><text x="160" y="133" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">$1,286 x 90% = $1,157.40</text><text x="160" y="149" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">$3,714 x 32% = $1,188.48</text><line x1="50" y1="156" x2="270" y2="156" stroke="var(--svg-cbd5e1)" stroke-width="0.8"/><text x="160" y="172" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">PIA = $2,345.80/mo (rounded down to 10c)</text><text x="160" y="186" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">The formula replaces more of lower incomes — a progressive design</text></svg>`;

const socialSecurityConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'birthYear',
      label: 'Birth Year',
      type: 'number',
      placeholder: '1965',
      inputMode: 'numeric',
      min: 1930,
      max: 1999,
      step: 1,
      required: true,
      helpText: 'Used to calculate your Full Retirement Age (FRA)',
    },
    {
      id: 'annualIncome',
      label: 'Current Annual Income (Earned)',
      type: 'number',
      placeholder: '85,000',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Your gross W-2 or self-employment income. Social Security taxes apply up to $184,500 in 2026.',
    },
    {
      id: 'maritalStatus',
      label: 'Marital Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Single', value: 'single' },
        { label: 'Married', value: 'married' },
        { label: 'Divorced (10+ year marriage)', value: 'divorced' },
        { label: 'Widowed', value: 'widowed' },
      ],
    },
    {
      id: 'retirementAge',
      label: 'Expected Retirement Age',
      type: 'number',
      placeholder: '67',
      unit: 'years',
      inputMode: 'numeric',
      min: 62,
      max: 70,
      step: 1,
      required: true,
      helpText: 'Age 62 = earliest (reduced), Age 70 = maximum benefit. Every year you delay past FRA adds ~8%.',
    },
    {
      id: 'spouseIncome',
      label: 'Spouse Annual Income (if married)',
      type: 'number',
      placeholder: '60,000',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 1000,
      helpText: 'Used to estimate spouse\'s own benefit vs. spousal benefit (50% of your PIA)',
    },
  ],
  calculate: (values) => {
    const birthYear = parseInt(values.birthYear);
    const annualIncome = parseFloat(values.annualIncome);
    const retirementAge = parseFloat(values.retirementAge);
    const maritalStatus = values.maritalStatus || 'single';
    if (isNaN(birthYear) || isNaN(annualIncome) || isNaN(retirementAge)) return [];
    if (birthYear < 1930 || birthYear > 1999) return [];
    if (annualIncome < 0) return [];

    const fra = getFRA(birthYear);
    const pia = estimatePIA(annualIncome);

    const benefitAt62 = monthlyBenefit(pia, 62, fra, birthYear);
    const benefitAtFRA = monthlyBenefit(pia, fra, fra, birthYear);
    const benefitAt70 = monthlyBenefit(pia, 70, fra, birthYear);
    const benefitAtChosen = monthlyBenefit(pia, retirementAge, fra, birthYear);

    // No earnings -> no benefit -> a percent-of-FRA ratio is undefined (0/0)
    const pctOf = (b: number, dp: number) => benefitAtFRA > 0 ? `${new Decimal(b).div(benefitAtFRA).times(100).toFixed(dp)}%` : null;
    const pctOfFRA = pctOf(benefitAtChosen, 1);
    const annualBenefit = new Decimal(benefitAtChosen).times(12).toNumber();

    const spousalBenefit = new Decimal(pia).times(0.5).toNumber();
    const breakEvenVs62 = benefitAt62 > 0 && benefitAtChosen > benefitAt62
      ? Math.round(new Decimal(benefitAt62).times(retirementAge - 62).times(12).div(new Decimal(benefitAtChosen).minus(benefitAt62)).div(12).toNumber() + retirementAge)
      : null;

    const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    const results = [
      {
        id: 'chosen',
        label: `Monthly Benefit at Age ${retirementAge} (${retirementAge >= fra ? retirementAge === 70 ? 'Maximum' : 'Delayed' : 'Reduced'})`,
        value: `${fmt(benefitAtChosen)}/mo`,
        highlight: true,
        color: 'positive' as const,
        interpretation: `Claiming before your full retirement age (${fraLabel(fra)}) locks in a permanently reduced benefit for life; waiting past it — up to 70 — permanently increases it by about 8% per year. There's no single right age: it depends on health, other income, and whether you need the cash sooner rather than maximizing the monthly amount.`,
      },
      {
        id: 'annual',
        label: 'Annual Social Security Income',
        value: fmt(annualBenefit),
        color: 'positive' as const,
      },
      {
        id: 'fra',
        label: `Your Full Retirement Age (FRA)`,
        value: `Age ${fraLabel(fra)} — ${fmt(benefitAtFRA)}/mo at FRA`,
        color: 'neutral' as const,
      },
      {
        id: 'at62',
        label: 'Benefit if Claimed at Age 62 (Earliest)',
        value: pctOf(benefitAt62, 0) ? `${fmt(benefitAt62)}/mo (${pctOf(benefitAt62, 0)} of FRA benefit)` : `${fmt(benefitAt62)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'at70',
        label: 'Benefit if Delayed to Age 70 (Maximum)',
        value: pctOf(benefitAt70, 0) ? `${fmt(benefitAt70)}/mo (${pctOf(benefitAt70, 0)} of FRA benefit)` : `${fmt(benefitAt70)}/mo`,
        color: 'positive' as const,
      },
      {
        id: 'vs62',
        label: `Your Benefit vs. Age 62 Claim`,
        value: `${pctOfFRA ?? 'n/a'} — ${retirementAge > 62 ? '+' : ''}${fmt(benefitAtChosen - benefitAt62)}/mo`,
        color: benefitAtChosen >= benefitAt62 ? 'positive' as const : 'neutral' as const,
      },
    ];

    if (breakEvenVs62 && retirementAge > 62) {
      results.push({
        id: 'breakeven',
        label: 'Break-Even Age vs. Claiming at 62',
        value: `Age ${breakEvenVs62} — delay pays off if you live beyond this age`,
        color: 'neutral' as const,
      });
    }

    if (maritalStatus === 'married' || maritalStatus === 'divorced') {
      results.push({
        id: 'spousal',
        label: maritalStatus === 'divorced' ? 'Ex-Spousal Benefit (if eligible)' : 'Estimated Spousal Benefit',
        value: `Up to ${fmt(spousalBenefit)}/mo (50% of your FRA benefit)`,
        color: 'neutral' as const,
      });
    }

    const spouseIncome = parseFloat(values.spouseIncome);
    if (maritalStatus === 'married' && Number.isFinite(spouseIncome) && spouseIncome > 0) {
      // Spouse's own PIA vs a spousal benefit of 50% of your PIA (at their FRA): they receive the larger of the two.
      const spousePia = estimatePIA(spouseIncome);
      const topUp = Math.max(0, Math.floor(pia * 5) / 10 - spousePia);
      results.push({
        id: 'spouseBenefit',
        label: 'Spouse at Their Full Retirement Age (own vs. spousal benefit)',
        value: `Own ${fmt(Math.floor(spousePia))}/mo` + (topUp > 0 ? ` + ${fmt(Math.floor(topUp))} spousal top-up = ${fmt(Math.floor(spousePia + topUp))}/mo` : ' (own benefit is larger than the 50% spousal amount)'),
        color: 'neutral' as const,
      });
    }

    return results;
  },
  explainSteps: (values) => {
    const rows = socialSecurityConfig.calculate(values);
    if (!rows.length) return [];
    const birthYear = parseInt(values.birthYear);
    const annualIncome = parseFloat(values.annualIncome);
    const claimAge = parseFloat(values.retirementAge);
    const maritalStatus = values.maritalStatus || 'single';
    const val = (id: string) => resultValue(rows, id) ?? '';
    const fra = getFRA(birthYear);
    const pia = estimatePIA(annualIncome);
    const m2 = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const { first, second, year } = BEND_POINTS;
    const capped = Math.max(0, Math.min(annualIncome, FICA.socialSecurityWageBase));
    const aime = capped / 12;
    const part1 = 0.9 * Math.min(aime, first);
    const part2 = 0.32 * Math.max(0, Math.min(aime, second) - first);
    const part3 = 0.15 * Math.max(0, aime - second);
    const rawPia = part1 + part2 + part3;
    const f = claimFactor(claimAge, fra, birthYear);
    const rate = delayedCreditPerYear(birthYear);

    const steps: ExplainStep[] = [
      {
        label: 'Turn your income into average monthly earnings',
        expr: `min(${m2(annualIncome)}, ${m2(FICA.socialSecurityWageBase)} taxable maximum) ÷ 12 = ${m2(aime)} a month`,
        note: 'A simplification: your current income stands in for all 35 of your highest-earning years, in today\'s dollars. Your real record will differ.',
      },
      {
        label: `Apply the ${year} bend points to get your full-retirement-age benefit (PIA)`,
        expr: `90% × ${m2(Math.min(aime, first))} + 32% × ${m2(Math.max(0, Math.min(aime, second) - first))} + 15% × ${m2(Math.max(0, aime - second))} = ${m2(part1)} + ${m2(part2)} + ${m2(part3)} = ${m2(rawPia)} → ${m2(pia)}`,
        note: `The bands are the first ${m2(first)}, the next ${m2(second - first)} up to ${m2(second)}, and the rest. The result is cut down to a whole 10 cents${rawPia > MAX_BENEFIT_AT_FRA ? ` and capped at the maximum of ${m2(MAX_BENEFIT_AT_FRA)}` : ''}.`,
      },
      {
        label: 'Your full retirement age',
        expr: `Born in ${birthYear} → full retirement age ${fraLabel(fra)}`,
      },
    ];
    if (f.monthsFromFra < 0) {
      const first36 = Math.min(f.early, 36);
      const rest = Math.max(0, f.early - 36);
      steps.push({
        label: `Claiming ${f.early} months early cuts the benefit`,
        expr: `${first36} months × 5/9% ${rest > 0 ? `+ ${rest} months × 5/12% ` : ''}= ${+((1 - f.factor) * 100).toFixed(4)}% less → factor ${+(f.factor * 100).toFixed(4)}% of the PIA`,
        note: 'The cut is 5/9 of 1% for each of the first 36 months before full retirement age and 5/12 of 1% for each month beyond that.',
      });
    } else if (f.credited > 0) {
      steps.push({
        label: `Waiting ${f.credited} months past full retirement age adds credits`,
        expr: `${f.credited} months × ${+(rate * 100).toFixed(4)}% ÷ 12 = +${+((f.factor - 1) * 100).toFixed(4)}% → factor ${+(f.factor * 100).toFixed(4)}% of the PIA`,
        note: 'Delayed credits stop at age 70.',
      });
    } else {
      steps.push({ label: 'Claiming at full retirement age pays the full PIA', expr: 'No reduction and no credit → factor 100% of the PIA' });
    }
    steps.push({
      label: `Monthly benefit at age ${claimAge}`,
      expr: `${m2(pia)} × ${+f.factor.toFixed(6)} = ${m2(pia * f.factor)} → rounded down to ${val('chosen')} · ×12 = ${val('annual')} a year`,
    });
    steps.push({
      label: 'The same math at the other claiming ages',
      expr: `At 62: ${val('at62')} · At full retirement age: ${val('fra').split(' — ')[1] ?? ''} · At 70: ${val('at70')}`,
    });
    if (rows.some((r) => r.id === 'breakeven')) {
      steps.push({
        label: 'Break-even age against claiming at 62',
        expr: `Claiming at ${claimAge} pays ${val('vs62')} compared with age 62 (share of the full-retirement-age benefit, then the monthly gain) → ${val('breakeven')}`,
        note: 'Break-even is when the extra monthly amount has repaid the checks you gave up by waiting; it ignores inflation adjustments and investment returns.',
      });
    }
    if (rows.some((r) => r.id === 'spousal')) {
      steps.push({
        label: maritalStatus === 'divorced' ? 'Ex-spousal benefit' : 'Spousal benefit',
        expr: `50% × ${m2(pia)} = ${m2(pia * 0.5)} → ${val('spousal')}`,
        note: 'A spouse receives the larger of their own benefit or half of yours at their own full retirement age.',
      });
    }
    return finiteSteps(steps);
  },

  extraPanel: (values, results) => {
    const birthYear = parseInt(values.birthYear);
    const annualIncome = parseFloat(values.annualIncome);
    const retirementAge = parseFloat(values.retirementAge);

    if (!results.length || isNaN(birthYear) || isNaN(annualIncome) || isNaN(retirementAge)) return null;

    const fra = getFRA(birthYear);
    const pia = estimatePIA(annualIncome);
    const benefitAt62 = monthlyBenefit(pia, 62, fra, birthYear);
    const benefitAtFRA = monthlyBenefit(pia, fra, fra, birthYear);
    const benefitAt70 = monthlyBenefit(pia, 70, fra, birthYear);
    const benefitAtChosen = monthlyBenefit(pia, retirementAge, fra, birthYear);

    return createElement(SocialSecurityPanel, {
      fra, pia, benefitAt62, benefitAtFRA, benefitAt70, benefitAtChosen,
      retirementAge, birthYear, annualIncome,
    });
  },
  educational: {
    formula: 'PIA = 90% x AIME(up to $1,286) + 32% x AIME($1,286-$7,749) + 15% x AIME(above $7,749)',
    formulaDescription:
      'The Primary Insurance Amount (PIA) is calculated from your Average Indexed Monthly Earnings (AIME) using a progressive formula with three bend points. Benefits are then adjusted up or down based on the age you claim relative to your Full Retirement Age (FRA). All calculations use decimal.js for precision with the SSA bend point formula.',
    formulaSource:
      'Social Security Administration PIA formula (https://www.ssa.gov/oact/cola/piaformula.html). Bend points are for workers turning 62 in 2026: $1,286 and $7,749. The 90%-32%-15% replacement tiers are set by law. Delayed retirement credits are 8% per year (0.667% per month) for those born 1943+, applied from FRA to age 70.',
    diagram: {
      svg: ssSvg,
      alt: 'Social Security bend point formula showing three progressive replacement tiers: 90% of AIME up to $1,286, 32% from $1,286 to $7,749, and 15% above $7,749, with a $5,000 AIME example',
      caption: 'Social Security replaces a higher percentage of lower earnings — the progressive bend point formula is the key to understanding your benefit',
    },
    variables: [
      { symbol: 'PIA', name: 'Primary Insurance Amount', description: 'The monthly benefit you would receive if you claimed exactly at your Full Retirement Age. All adjustments for early or delayed claiming are based on this number.' },
      { symbol: 'AIME', name: 'Average Indexed Monthly Earnings', description: 'The SSA takes your highest 35 years of indexed earnings (wage-adjusted for inflation), sums them, and divides by 420 months. If you worked fewer than 35 years, zero years are included, reducing your AIME.' },
      { symbol: 'FRA', name: 'Full Retirement Age', description: 'For those born 1943-1954: Age 66. For those born 1960+: Age 67. For years in between, FRA increases in 2-month increments per birth year.' },
      { symbol: '+8%/yr', name: 'Delayed Retirement Credits', description: 'For every year you delay claiming past your FRA (up to age 70), your benefit increases 8% per year (0.667% per month). This is risk-free and guaranteed — the highest return available to most retirees.' },
      { symbol: 'Bend Points', name: 'PIA Bend Points', description: 'Bend points are the dollar thresholds in the PIA formula that determine the weighting of your AIME. For 2026, the first bend point is $1,286 (90% replacement) and the second is $7,749 (32% replacement up to this, 15% above). These are adjusted annually for average wage growth.' },
    ],
    howToUse: [
      'Enter your birth year — this determines your Full Retirement Age (FRA).',
      'Enter your current annual earned income. The calculator uses a simplified AIME: your income (up to the $184,500 taxable maximum) is treated as your earnings in every one of your 35 working years, in today\'s dollars.',
      'Use the retirement age field (62-70) to see how early or late claiming affects your monthly benefit, and review the comparison chart below.',
    ],
    commonUses: [
      'Estimate your monthly Social Security benefit at different claiming ages from 62 to 70 to optimize your retirement income strategy.',
      'Compare the lifetime benefits of claiming early versus delaying to determine which age maximizes your total Social Security payout.',
      'Understand how your full retirement age and the early claiming reduction or delayed retirement credits affect your monthly payment.',
    ],
    workedExamples: [
      {
        scenario: 'Maria, born in 1965, earned $85,000/year throughout her career. How much will she receive at FRA vs. age 62 vs. age 70?',
        inputs: { birthYear: '1965', annualIncome: '85000', maritalStatus: 'single', retirementAge: '67' },
        result: 'At 67 (FRA): $3,012/mo. At 62: $2,108/mo (70% of FRA). At 70: $3,735/mo (124% of FRA).',
        insight: 'Delaying from 62 to 70 increases Maria\'s benefit by about 77%: $2,108 vs $3,735/month. But she would give up 8 years of payments at the lower rate (8 × 12 × $2,108 ≈ $202,000 if she had claimed at 62 instead). The break-even age — the point where total lifetime benefits from delaying surpass early claiming — is about 79 for claiming at 67 instead of 62 and about 80 for claiming at 70. If Maria expects to live past that, waiting pays off. (Her AIME is $85,000 / 12 = $7,083; PIA = 0.9 × $1,286 + 0.32 × ($7,083 − $1,286) = $3,012.50.)',
      },
      {
        scenario: 'James, born in 1970, earns $45,000/year. What strategy maximizes his Social Security?',
        inputs: { birthYear: '1970', annualIncome: '45000', maritalStatus: 'single', retirementAge: '62' },
        result: 'At 62: $1,362/mo. At FRA (67): $1,945/mo. At 70: $2,412/mo.',
        insight: 'For James, the 90% replacement tier covers most of his AIME, giving him a proportionally larger benefit relative to his income. At about a 52% replacement rate (PIA $1,945.80 ÷ monthly income $3,750), Social Security will be a major income source. Low-income workers benefit most from delaying because the 8%/year delayed credits apply to the full PIA.',
      },
      {
        scenario: 'A married couple, both born 1960, has one spouse earning $120,000 and the other $30,000. What claiming strategy maximizes their household income?',
        inputs: { birthYear: '1960', annualIncome: '120000', maritalStatus: 'married', retirementAge: '70', spouseIncome: '30000' },
        result: 'Higher earner at 70: $4,418/mo. Lower earner\'s own (at FRA): $1,545/mo. Spousal benefit: up to $1,781/mo.',
        insight: 'The lower-earning spouse receives their own benefit ($1,545/mo) plus a spousal top-up of about $236 that brings the total to 50% of the higher earner\'s PIA ($3,563.20), about $1,781/mo. The common strategy: higher earner delays to 70 to maximize the survivor benefit, while the lower earner claims earlier or uses spousal benefits, depending on health and financial needs.',
      },
    ],
    proTips: [
      'The 8% per year delayed retirement credit is effectively risk-free and guaranteed by the US government — it is the best "investment return" available to most retirees and exceeds current bond yields by a wide margin.',
      'Create a free "my Social Security" account at ssa.gov to get your actual earnings record and a personalized benefit estimate — this calculator\'s simplified AIME is no substitute for your official SSA statement.',
      'If married, the higher earner should generally delay to 70 to maximize the survivor benefit (the surviving spouse gets the higher of the two benefits). The lower earner may claim earlier.',
      'Divorced after 10+ years? You can claim spousal benefits based on your ex-spouse\'s record (same 50% rule) even if they remarry — as long as you remain unmarried.',
      'Check your earnings record at ssa.gov for errors — missing years of reported income reduce your AIME calculation. You have 3 years, 3 months, and 15 days to correct errors.',
    ],
    limitations: [
      'This calculator uses a simplified AIME estimate based on current income — it assumes your current salary is representative of your career average. In reality, the SSA indexes your actual 35 highest-earning years for wage inflation, which can produce different results.',
      'The bend points used ($1,286 and $7,749) are the 2026 values, which apply to people turning 62 in 2026; they rise every year with the national average wage index, so younger workers will have higher bend points, and the estimate is in today\'s dollars. Estimates are capped at the SSA maximum benefit at full retirement age for 2026 ($4,152/month).',
      'The earnings test (benefit reduction if you work while claiming before FRA) is described in the FAQs but not calculated — the calculator shows what your benefit would be based solely on claiming age.',
      'Future Social Security legislative changes (benefit cuts, FRA increases, COLA formula changes) are not modeled. The 2025 Social Security Trustees Report projects the retirement (OASI) trust fund will be depleted in 2033, after which incoming payroll taxes would cover about 77% of scheduled benefits unless Congress acts.',
    ],
    quickReference: [
      { label: 'FRA for Born 1960+', value: 'Age 67' },
      { label: 'Earliest Claiming Age', value: '62 (25-30% reduction vs FRA)' },
      { label: 'Maximum Benefit Age', value: '70 (124-132% of FRA)' },
      { label: 'Delayed Retirement Credits', value: '8%/year (0.667%/month)' },
      { label: 'Early Reduction (first 36mo)', value: '5/9 of 1% per month' },
    ],
    explanation:
      'Social Security is the most complex financial decision most Americans face. Claiming at 62 gives you money immediately but reduces your monthly payment permanently — by 25-30% compared to claiming at FRA. Waiting to 70 gives you 24-32% more than FRA. The math favors delayed claiming for anyone in good health who expects to live past their mid-to-late 70s. However, if you have health concerns, immediate cash needs, or a lower-earning spouse who depends on your benefit, early claiming may make sense. There is no universally correct answer.',
    faqs: [
      {
        question: 'Is this an accurate Social Security estimate?',
        answer: 'This is a simplified approximation using the SSA\'s bend point formula. It assumes your current income is representative of your career earnings. For the most accurate estimate, create a free account at ssa.gov/myaccount to see your actual earnings record and official benefit projection.',
      },
      {
        question: 'What is the break-even age for delaying benefits?',
        answer: 'If you claim at 62 instead of 67, you receive 5 more years of payments but at a reduced amount. Generally, if you live past your mid-to-late 70s, delaying to FRA or 70 pays off more in total lifetime benefits. The SSA actuarially adjusts benefits so the "average" person breaks even, but individuals who live longer benefit more from waiting.',
      },
      {
        question: 'Can I work while receiving Social Security before FRA?',
        answer: 'Yes, but benefits are temporarily reduced if you earn above the earnings limit ($24,480 in 2026 if under FRA). For every $2 earned above that limit, $1 of benefits is withheld. In the year you reach FRA the limit is $65,160 (2026) and $1 is withheld for every $3 above it, counting only earnings before the month you reach FRA. Once you reach FRA, there is no earnings limit. The withheld benefits are credited back to you at FRA through a higher monthly payment.',
      },
      {
        question: 'What about spousal and survivor benefits?',
        answer: 'Spouses can claim up to 50% of a higher-earning spouse\'s FRA benefit as a spousal benefit (if it exceeds their own earned benefit). Survivor benefits allow widows/widowers to claim up to 100% of the deceased spouse\'s benefit. Divorced spouses married 10+ years are also eligible for spousal benefits.',
      },
      {
        question: 'Are Social Security benefits taxable?',
        answer: 'Yes, up to 85% of Social Security benefits may be subject to federal income tax if your combined income (AGI + nontaxable interest + half of SS benefits) exceeds certain thresholds: $25,000 (single), $32,000 (married filing jointly), or $0 (married filing separately). Up to 50% of benefits are taxable between the first and second threshold; up to 85% above the second threshold. A handful of states also tax Social Security benefits.',
      },
    ],
    citations: [
      { source: 'Social Security Administration', url: 'https://www.ssa.gov' },
      { source: 'IRS Publication 915', url: 'https://www.irs.gov/publications/p915' },
      { source: 'SSA — PIA Formula & Bend Points', url: 'https://www.ssa.gov/oact/cola/piaformula.html' },
    ],
  },
};

export default socialSecurityConfig;
