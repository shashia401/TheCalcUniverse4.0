import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ConfidenceIntervalPanel from './ConfidenceIntervalPanel';

const Z_VALUES: Record<string, { label: string; z: number }> = {
  '90': { label: '90%', z: 1.645 },
  '95': { label: '95%', z: 1.96 },
  '99': { label: '99%', z: 2.576 },
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
      helpText: 'The number of observations in your sample',
    },
    {
      id: 'stddev',
      label: 'Standard Deviation (s or σ)',
      type: 'number',
      placeholder: '10',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'Sample standard deviation (use s if σ is unknown)',
    },
    {
      id: 'confidence',
      label: 'Confidence Level',
      type: 'select',
      required: true,
      options: [
        { label: '90%', value: '90' },
        { label: '95%', value: '95' },
        { label: '99%', value: '99' },
      ],
    },
  ],
  calculate: (values) => {
    const sampleMean = parseFloat(values.sampleMean);
    const sampleSize = parseInt(values.sampleSize);
    const stddev = parseFloat(values.stddev);
    const confidence = values.confidence || '95';

    if ([sampleMean, stddev].some(isNaN) || isNaN(sampleSize)) return [];
    if (sampleSize < 1 || stddev <= 0) return [];
    if (!Z_VALUES[confidence]) return [];

    const zInfo = Z_VALUES[confidence];
    const se = stddev / Math.sqrt(sampleSize);
    const moe = zInfo.z * se;
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
        label: 'Critical Value (Z)',
        value: `${zInfo.z} (${zInfo.label} confidence)`,
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
        value: `${sampleSize} ${sampleSize < 30 ? '(small sample — consider t-distribution)' : sampleSize < 100 ? '(moderate sample)' : '(large sample)'}`,
        color: 'neutral' as const,
      },
      {
        id: 'formula',
        label: 'Formula',
        value: `CI = x̄ ± Z × (s/√n) = ${fmt(sampleMean)} ± ${fmt(zInfo.z)} × (${fmt(stddev)}/√${sampleSize}) = [${fmt(lower)}, ${fmt(upper)}]`,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ConfidenceIntervalPanel, { values, results });
  },
  educational: {
    formula: 'CI = x̄ ± Z × (σ/√n) | MOE = Z × (σ/√n) | SE = σ/√n',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Confidence Interval</text><line x1="30" y1="130" x2="410" y2="130" stroke="var(--svg-999999)" stroke-width="2"/><line x1="80" y1="125" x2="80" y2="135" stroke="var(--svg-666666)" stroke-width="2"/><text x="80" y="160" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Lower</text><text x="80" y="175" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Bound</text><line x1="360" y1="125" x2="360" y2="135" stroke="var(--svg-666666)" stroke-width="2"/><text x="360" y="160" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Upper</text><text x="360" y="175" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Bound</text><line x1="220" y1="125" x2="220" y2="135" stroke="var(--svg-3b82f6)" stroke-width="3"/><text x="220" y="160" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">x&#773; (sample mean)</text><line x1="80" y1="130" x2="360" y2="130" stroke="var(--svg-8b5cf6)" stroke-width="5" stroke-linecap="round" opacity=".4"/><text x="220" y="115" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-8b5cf6)">Confidence Interval</text><text x="220" y="210" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Key Components</text><text x="220" y="233" text-anchor="middle" font-size="12" fill="var(--svg-555555)">CI = x&#773; &plusmn; Z &times; (&sigma;/&radic;n)</text><text x="220" y="255" text-anchor="middle" font-size="12" fill="var(--svg-555555)">MOE = Z &times; (&sigma;/&radic;n) &nbsp;&nbsp; SE = &sigma;/&radic;n</text><text x="220" y="277" text-anchor="middle" font-size="12" fill="var(--svg-555555)">Z = 1.645 (90%) | 1.96 (95%) | 2.576 (99%)</text><text x="220" y="303" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Wider interval = more confidence but less precision</text></svg>',
      alt: 'Number line with a confidence interval marked between lower and upper bounds and the sample mean at center',
      caption: 'A confidence interval provides a range of plausible values for a population parameter',
    },
    formulaDescription:
      'A confidence interval provides a range of plausible values for an unknown population parameter. The margin of error (MOE) is the critical value (Z) times the standard error (SE). The standard error measures how much the sample mean is expected to vary from the true population mean.',
    variables: [
      { symbol: 'x̄', name: 'Sample Mean', description: 'The average of your sample data. The point estimate of the population mean.' },
      { symbol: 'Z', name: 'Critical Value (Z-score)', description: '1.645 for 90%, 1.96 for 95%, 2.576 for 99% confidence. Higher confidence requires a larger Z-value and produces a wider interval.' },
      { symbol: 'SE, MOE', name: 'Standard Error & Margin of Error', description: 'SE = σ/√n measures sampling variability. MOE = Z × SE is the ± range around the mean that creates the confidence interval.' },
    ],
    howToUse: [
      'Enter your sample mean, sample size, and standard deviation.',
      'Select the desired confidence level (95% is the standard for most published research).',
      'View the confidence interval range, margin of error, and critical Z-value used.',
      'The MOE is explicitly broken out — researchers often need this for reporting in papers and tables.',
      'A note indicates whether your sample is small (<30), moderate, or large to guide interpretation.',
    ],
    explanation:
      'Confidence intervals are fundamental to inferential statistics. They express the uncertainty inherent in estimating a population parameter from a sample. A 95% confidence interval means: if you repeated the sampling process 100 times under identical conditions, approximately 95 of those intervals would contain the true population mean. It does NOT mean there is a 95% probability that the true mean lies within your specific interval — the true mean either is or is not in that interval, and you do not know which. The margin of error (MOE) is the key number reported in opinion polls, market research, and clinical studies — it communicates the precision of the estimate. The standard error (SE) shrinks as sample size increases, which means larger samples produce narrower intervals with more precise estimates. Doubling the sample size reduces the SE by about 29% (1/√2). For small samples (n < 30), the t-distribution should be used instead of the normal distribution because the sample standard deviation s is an imperfect estimate of the true population σ. The t-distribution has heavier tails, producing wider (more conservative) intervals that account for this additional uncertainty.',
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
        answer: 'When the population standard deviation (σ) is unknown and you are using the sample standard deviation (s) to estimate it — which is almost always the case in real research — you should use the t-distribution. For large samples (n ≥ 30), the t-distribution closely approximates the normal distribution, so Z is a reasonable approximation. For small samples (n < 30), especially n < 15, the t-critical value is notably larger than Z, producing wider (more conservative) intervals.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Confidence Interval', url: 'https://en.wikipedia.org/wiki/Confidence_interval' },
      { source: 'Wolfram MathWorld', title: 'Confidence Interval', url: 'https://mathworld.wolfram.com/ConfidenceInterval.html' },
    ],
  },
};

export default confidenceIntervalConfig;
