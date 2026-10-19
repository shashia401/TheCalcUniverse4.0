import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ConfidenceIntervalPanel from './ConfidenceIntervalPanel';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { normQuantile, tCritical } from '../../../utils/distributions';
import { hasAnswer, resultValue } from '../../../utils/explainResults';
import { roundStr6 } from '../../../lib/format';

/** Confidence level -> two-sided alpha. Critical values are computed exactly (1.6449, 1.9600, 2.5758), not from rounded tables. */
const LEVELS: Record<string, { label: string; alpha: number }> = {
  '80': { label: '80%', alpha: 0.2 },
  '90': { label: '90%', alpha: 0.1 },
  '95': { label: '95%', alpha: 0.05 },
  '98': { label: '98%', alpha: 0.02 },
  '99': { label: '99%', alpha: 0.01 },
  '99.9': { label: '99.9%', alpha: 0.001 },
};

const confidenceIntervalConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sampleMean',
      label: 'Sample Mean (x̄)',
      type: 'number',
      placeholder: '50',
      step: 0.1,
      required: true,
      helpText: 'The mean of your sample data',
    },
    {
      id: 'sampleSize',
      label: 'Sample Size (n)',
      type: 'number',
      placeholder: '100',
      min: 1,
      step: 1,
      required: true,
      helpText: 'The number of observations in your sample (whole number; at least 2 when using the sample standard deviation s)',
    },
    {
      id: 'stddev',
      label: 'Standard Deviation (s or σ)',
      type: 'number',
      placeholder: '10',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'The sample standard deviation s (the usual case), or the known population standard deviation σ — pick which below',
    },
    {
      id: 'sdType',
      label: 'Standard Deviation Type',
      type: 'select',
      options: [
        { label: 'Sample s (σ unknown) — use Student t, df = n − 1', value: 'sample' },
        { label: 'Population σ (known) — use normal z', value: 'population' },
      ],
      helpText: 'With s estimated from the same sample, the t-distribution is the correct choice at every n; it matches z as n grows.',
    },
    {
      id: 'confidence',
      label: 'Confidence Level',
      type: 'select',
      required: true,
      options: [
        { label: '80%', value: '80' },
        { label: '90%', value: '90' },
        { label: '95%', value: '95' },
        { label: '98%', value: '98' },
        { label: '99%', value: '99' },
        { label: '99.9%', value: '99.9' },
      ],
      defaultValue: '95',
    },
  ],
  calculate: (values) => {
    const sampleMean = parseNumberStrict(values.sampleMean);
    const sampleSize = parseNumberStrict(values.sampleSize);
    const stddev = parseNumberStrict(values.stddev);
    const confidence = values.confidence || '95';
    const useT = values.sdType !== 'population';

    if ([sampleMean, stddev, sampleSize].some(isNaN)) return [];
    // n must be a whole number; a sample standard deviation needs n >= 2 (df = n - 1 >= 1).
    if (!Number.isInteger(sampleSize) || sampleSize < (useT ? 2 : 1) || stddev <= 0) return [];
    if (!LEVELS[confidence]) return [];

    const level = LEVELS[confidence];
    const df = sampleSize - 1;
    const crit = useT ? tCritical(level.alpha, df) : normQuantile(1 - level.alpha / 2);
    const zInfo = { label: level.label, z: crit };
    const se = stddev / Math.sqrt(sampleSize);
    const moe = crit * se;
    const lower = sampleMean - moe;
    const upper = sampleMean + moe;

    const fmt = (n: number) => {
      if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
      return parseFloat(n.toFixed(6)).toString();
    };

    return [
      {
        id: 'confidenceInterval',
        label: `${zInfo.label} Confidence Interval`,
        value: `[${fmt(lower)}, ${fmt(upper)}]`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'lowerBound',
        label: 'Lower Bound',
        value: fmt(lower),
        color: 'neutral' as const,
      },
      {
        id: 'upperBound',
        label: 'Upper Bound',
        value: fmt(upper),
        color: 'neutral' as const,
      },
      {
        id: 'marginOfError',
        label: 'Margin of Error (MOE)',
        value: `±${fmt(moe)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'criticalValue',
        label: useT ? `Critical Value (t, df = ${df})` : 'Critical Value (Z)',
        value: `${crit.toFixed(4)} (${zInfo.label} confidence)`,
        color: 'neutral' as const,
      },
      {
        id: 'standardError',
        label: 'Standard Error (SE)',
        value: fmt(se),
        color: 'neutral' as const,
      },
      {
        id: 'sampleSizeInfo',
        label: 'Sample Size',
        value: `${sampleSize} ${useT ? `(Student t, ${df} degrees of freedom)` : sampleSize < 30 ? '(z with known σ — assumes a normal population when n is small)' : '(z with known σ)'}`,
        color: 'neutral' as const,
      },
      {
        id: 'formula',
        label: 'Formula',
        value: `CI = x̄ ± ${useT ? 't' : 'Z'} × (${useT ? 's' : 'σ'}/√n) = ${fmt(sampleMean)} ± ${crit.toFixed(4)} × (${fmt(stddev)}/√${sampleSize}) = [${fmt(lower)}, ${fmt(upper)}]`,
        color: 'neutral' as const,
      },
      // Exact numbers for the panel (it never parses the formatted strings above).
      { id: '_data', label: '', value: JSON.stringify({ mean: sampleMean, lower, upper, moe, crit, useT }) },
    ];
  },
  explainSteps: (values) => {
    const rows = confidenceIntervalConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const useT = values.sdType !== 'population';
    const n = parseNumberStrict(values.sampleSize);
    const sd = roundStr6(parseNumberStrict(values.stddev));
    const mean = roundStr6(parseNumberStrict(values.sampleMean));
    const crit = rows.find((r) => r.id === 'criticalValue')!;
    const se = resultValue(rows, 'standardError')!;
    const moe = resultValue(rows, 'marginOfError')!.replace('±', '');
    return [
      { label: `Standard error = ${useT ? 's' : 'σ'} ÷ √n`, expr: `${sd} ÷ √${n} = ${se}` },
      {
        label: `Look up the ${useT ? 't' : 'z'} critical value`,
        expr: `${crit.label} = ${crit.value}`,
        note: useT ? 'The standard deviation was estimated from the sample, so Student t (df = n − 1) is used rather than z.' : 'The population standard deviation is known, so the normal z value applies.',
      },
      { label: 'Margin of error = critical value × standard error', expr: `${crit.value.split(' ')[0]} × ${se} = ${moe}` },
      { label: 'Interval = mean ± margin of error', expr: `${mean} ± ${moe} = ${resultValue(rows, 'confidenceInterval')}` },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ConfidenceIntervalPanel, { values, results });
  },
  educational: {
    formula: 'CI = x̄ ± t × (s/√n)  [t with n − 1 df; Z × σ/√n when σ is known] | MOE = t × SE | SE = s/√n',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Confidence Interval</text><line x1="30" y1="130" x2="410" y2="130" stroke="var(--svg-999999)" stroke-width="2"/><line x1="80" y1="125" x2="80" y2="135" stroke="var(--svg-666666)" stroke-width="2"/><text x="80" y="160" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Lower</text><text x="80" y="175" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Bound</text><line x1="360" y1="125" x2="360" y2="135" stroke="var(--svg-666666)" stroke-width="2"/><text x="360" y="160" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Upper</text><text x="360" y="175" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Bound</text><line x1="220" y1="125" x2="220" y2="135" stroke="var(--svg-3b82f6)" stroke-width="3"/><text x="220" y="160" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">x&#773; (sample mean)</text><line x1="80" y1="130" x2="360" y2="130" stroke="var(--svg-8b5cf6)" stroke-width="5" stroke-linecap="round" opacity=".4"/><text x="220" y="115" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-8b5cf6)">Confidence Interval</text><text x="220" y="210" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Key Components</text><text x="220" y="233" text-anchor="middle" font-size="12" fill="var(--svg-555555)">CI = x&#773; &plusmn; Z &times; (&sigma;/&radic;n)</text><text x="220" y="255" text-anchor="middle" font-size="12" fill="var(--svg-555555)">MOE = Z &times; (&sigma;/&radic;n) &nbsp;&nbsp; SE = &sigma;/&radic;n</text><text x="220" y="277" text-anchor="middle" font-size="12" fill="var(--svg-555555)">Z = 1.645 (90%) | 1.96 (95%) | 2.576 (99%)</text><text x="220" y="303" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Wider interval = more confidence but less precision</text></svg>',
      alt: 'Number line with a confidence interval marked between lower and upper bounds and the sample mean at center',
      caption: 'A confidence interval provides a range of plausible values for a population parameter',
    },
    formulaDescription:
      'A confidence interval provides a range of plausible values for an unknown population parameter. The margin of error (MOE) is the critical value (Student t with n − 1 degrees of freedom when the standard deviation is estimated from the sample, or Z when the population σ is known) times the standard error (SE). The standard error measures how much the sample mean is expected to vary from the true population mean.',
    variables: [
      { symbol: 'x̄', name: 'Sample Mean', description: 'The average of your sample data. The point estimate of the population mean.' },
      { symbol: 't, Z', name: 'Critical Value', description: 'Z (σ known) is 1.6449 for 90%, 1.9600 for 95%, 2.5758 for 99%. The Student t value depends on df = n − 1 and is larger for small n: for 95% it is 12.706 at n = 2, 2.262 at n = 10, 2.045 at n = 30 and 1.984 at n = 100. Higher confidence requires a larger value and produces a wider interval.' },
      { symbol: 'SE, MOE', name: 'Standard Error & Margin of Error', description: 'SE = s/√n measures sampling variability. MOE = t × SE is the ± range around the mean that creates the confidence interval.' },
    ],
    howToUse: [
      'Enter your sample mean, sample size, and standard deviation.',
      'Select the desired confidence level (95% is the standard for most published research).',
      'Say whether the standard deviation is the sample s (the usual case, Student t is used) or a known population σ (normal Z is used).',
      'View the confidence interval range, margin of error, and the exact critical value used.',
      'The MOE is explicitly broken out — researchers often need this for reporting in papers and tables.',
    ],
    explanation:
      'Confidence intervals are fundamental to inferential statistics. They express the uncertainty inherent in estimating a population parameter from a sample. A 95% confidence interval means: if you repeated the sampling process 100 times under identical conditions, approximately 95 of those intervals would contain the true population mean. It does NOT mean there is a 95% probability that the true mean lies within your specific interval — the true mean either is or is not in that interval, and you do not know which. The margin of error (MOE) is the key number reported in opinion polls, market research, and clinical studies — it communicates the precision of the estimate. The standard error (SE) shrinks as sample size increases, which means larger samples produce narrower intervals with more precise estimates. Doubling the sample size reduces the SE by about 29% (1/√2). When the standard deviation is estimated from the same sample, the t-distribution (not the normal) is the correct reference at every sample size, because s is an imperfect estimate of the true population σ; its heavier tails give slightly wider intervals that account for this extra uncertainty. This calculator therefore uses t with n − 1 degrees of freedom by default and switches to the normal Z only if you tell it σ is known. The interval assumes the data are roughly normal (or n is large enough for the central limit theorem).',
    faqs: [
      {
        question: 'What does 95% confidence actually mean?',
        answer: 'A 95% confidence level means that if you were to repeat your sampling procedure 100 times, approximately 95 of the calculated confidence intervals would contain the true population mean. It does NOT mean there is a 95% probability that the true mean lies within your specific interval — the true mean either is or is not in that interval. The "95%" refers to the long-run success rate of the procedure, not a probability for a single interval.',
      },
      {
        question: 'What is the difference between MOE and confidence interval?',
        answer: 'The margin of error (MOE) is the ± value around the sample mean. The confidence interval is the full range: [x̄ − MOE, x̄ + MOE]. Researchers often report just the MOE in papers and tables, while the confidence interval gives the complete range. The MOE depends on three things: confidence level (higher Z = larger MOE), standard deviation (more variable data = larger MOE), and sample size (more data = smaller MOE).',
      },
      {
        question: 'When should I use the t-distribution instead of Z?',
        answer: 'When the population standard deviation (σ) is unknown and you are using the sample standard deviation (s) to estimate it — which is almost always the case in real research — you should use the t-distribution. For large samples the t-distribution is close to the normal (95% critical value 1.984 at n = 100 versus 1.960 for Z), so Z is only a small underestimate there. For small samples, especially n < 15, the t critical value is notably larger than Z (2.262 at n = 10), producing wider, correctly calibrated intervals. This calculator applies t automatically unless you select a known population σ.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Confidence Interval', url: 'https://en.wikipedia.org/wiki/Confidence_interval' },
      { source: 'Wolfram MathWorld', title: 'Confidence Interval', url: 'https://mathworld.wolfram.com/ConfidenceInterval.html' },
    ],
  },
};

export default confidenceIntervalConfig;
