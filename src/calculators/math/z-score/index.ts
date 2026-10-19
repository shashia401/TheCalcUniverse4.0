import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ZScorePanel from './ZScorePanel';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { normCdf, normSf } from '../../../utils/distributions';

/** Significant-digit formatting that never collapses a tiny tail probability to "0" (6-decimal rounding did). */
const sig = (n: number, digits = 10): string => String(parseFloat(n.toPrecision(digits)));

const fmt = (n: number) => {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return parseFloat(n.toFixed(6)).toString();
};

const zScoreConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'rawScore',
      label: 'Raw Score (x)',
      type: 'number',
      placeholder: '85',
      step: 0.1,
      required: true,
      helpText: 'The individual data point to standardize',
    },
    {
      id: 'mean',
      label: 'Population Mean (μ)',
      type: 'number',
      placeholder: '70',
      step: 0.1,
      required: true,
      helpText: 'The mean of the population distribution',
    },
    {
      id: 'stddev',
      label: 'Standard Deviation (σ)',
      type: 'number',
      placeholder: '10',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'The standard deviation of the population (must be > 0)',
    },
  ],
  calculate: (values) => {
    const x = parseNumberStrict(values.rawScore);
    const mu = parseNumberStrict(values.mean);
    const sigma = parseNumberStrict(values.stddev);

    if ([x, mu, sigma].some(isNaN) || sigma <= 0) return [];

    const z = (x - mu) / sigma;
    if (!Number.isFinite(z)) return [];
    // Exact tails (src/utils/distributions.ts): the A&S erf approximation was only good to ~1.5e-7 and
    // 1 − Φ(z) lost every digit past z ≈ 5 (z = 8 showed "0%" instead of 6.2e-14 %).
    const probability = normCdf(z);
    const percentile = probability * 100;
    const aboveProbability = normSf(z) * 100;

    return [
      {
        id: 'zscore',
        label: 'Z-Score',
        value: fmt(z),
        highlight: true,
        color: z >= 0 ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'formula',
        label: 'Formula Applied',
        value: `z = (${fmt(x)} − ${fmt(mu)}) / ${fmt(sigma)} = ${fmt(z)}`,
        color: 'neutral' as const,
      },
      {
        id: 'probability',
        label: 'Cumulative Probability P(Z ≤ z)',
        value: sig(probability),
        color: 'neutral' as const,
      },
      {
        id: 'percentile',
        label: 'Percentile Rank (if normally distributed)',
        value: `${sig(percentile)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'aboveProb',
        label: 'P(Z > z) — Above This Score',
        value: `${sig(aboveProbability)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'interpretation',
        label: 'Interpretation',
        value: Math.abs(z) < 0.5
          ? `Close to average (within 0.5σ of mean)`
          : Math.abs(z) < 1
            ? `Slightly ${z > 0 ? 'above' : 'below'} average`
            : Math.abs(z) < 2
              ? `Moderately ${z > 0 ? 'above' : 'below'} average`
              : `Significantly ${z > 0 ? 'above' : 'below'} average (more than ${Math.floor(Math.abs(z))}σ from mean)`,
        color: 'neutral' as const,
      },
      {
        id: '_chartData',
        label: '',
        value: JSON.stringify({ z, probability }),
      },
    ];
  },
  explainSteps: (values) => {
    const x = parseNumberStrict(values.rawScore);
    const mu = parseNumberStrict(values.mean);
    const sigma = parseNumberStrict(values.stddev);
    if ([x, mu, sigma].some(isNaN) || sigma <= 0) return [];
    const z = (x - mu) / sigma;
    if (!Number.isFinite(z)) return [];
    const probability = normCdf(z);
    const diff = x - mu;
    return [
      { label: 'Subtract the mean from the score', expr: `x − μ = ${fmt(x)} − ${mu < 0 ? `(${fmt(mu)})` : fmt(mu)} = ${fmt(diff)}` },
      {
        label: 'Divide by the standard deviation',
        expr: `z = ${fmt(diff)} ÷ ${fmt(sigma)} = ${fmt(z)}`,
        note: 'A z-score counts how many standard deviations the score sits above (+) or below (−) the mean.',
      },
      {
        label: 'Convert the z-score to a percentile',
        expr: `P(Z ≤ ${fmt(z)}) = ${sig(probability)}  →  ${sig(probability * 100)}%`,
        note: 'This reading assumes the data follow a normal distribution.',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ZScorePanel, { values, results });
  },
  educational: {
    formula: 'z = (x − μ) / σ',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Z-Score on Normal Distribution</text><path d="M30,280 C70,280 100,270 150,210 C180,170 200,120 220,50 C240,120 260,170 290,210 C340,270 370,280 410,280" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><path d="M280,280 C310,260 340,260 410,280" fill="var(--svg-ef4444)" fill-opacity=".25" stroke="none"/><path d="M280,280 L280,210 C300,170 320,140 340,130 C360,120 380,120 410,280" fill="var(--svg-ef4444)" fill-opacity=".15" stroke="none"/><line x1="220" y1="50" x2="220" y2="290" stroke="var(--svg-999999)" stroke-width="1.5" stroke-dasharray="4,3"/><text x="220" y="305" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-666666)">&mu; = 0</text><line x1="310" y1="100" x2="310" y2="290" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="4,3"/><text x="310" y="305" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ef4444)">z = 1.5</text><text x="360" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ef4444)">Shaded</text><text x="360" y="177" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ef4444)">Tail</text><text x="220" y="240" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-8b5cf6)">z = (x &minus; &mu;) / &sigma;</text><text x="220" y="275" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Negative z: below mean &nbsp;|&nbsp; Positive z: above mean</text></svg>',
      alt: 'Bell curve of standard normal distribution with mean at center and a vertical line at z = 1.5 with the right tail shaded',
      caption: 'The Z-score measures how many standard deviations a value is from the mean',
    },
    formulaDescription:
      'The Z-score measures how many standard deviations a data point is from the population mean. A Z-score of 0 means the value is exactly at the mean. Positive Z-scores are above the mean; negative Z-scores are below. The standard normal distribution has a mean of 0 and a standard deviation of 1.',
    variables: [
      { symbol: 'x', name: 'Raw Score', description: 'The individual data point being standardized. Any value from the original distribution.' },
      { symbol: 'μ', name: 'Population Mean', description: 'The mean of the entire population. The center of the distribution.' },
      { symbol: 'σ', name: 'Standard Deviation', description: 'The standard deviation of the population. Must be greater than 0.' },
      { symbol: 'z', name: 'Z-Score', description: 'Number of standard deviations from the mean. Positive = above mean, negative = below mean, zero = at the mean.' },
    ],
    howToUse: [
      'Enter the raw score (x), population mean (μ), and standard deviation (σ).',
      'The Z-score is calculated and plotted on the standard normal distribution curve.',
      'View the cumulative probability P(Z ≤ z), percentile rank, and practical interpretation text.',
      'The bell curve visualization shows exactly where the score falls in the distribution relative to the mean.',
      'Use the "above this score" percentage to understand how rare or common the score is.',
    ],
    explanation:
      'The Z-score is one of the most important concepts in statistics. It transforms any normal distribution into the standard normal distribution (mean = 0, σ = 1), allowing comparison across different scales. For example, an SAT score of 650 with mean 500 and σ 100 gives a Z-score of 1.5, meaning it is 1.5 standard deviations above average. Z-scores are used for standardized testing (SAT, IQ tests, GRE), quality control (Six Sigma methodology), medical reference ranges (bone density, growth charts), and identifying outliers. The empirical rule (68-95-99.7 rule) states that approximately 68% of data falls within ±1σ, 95% within ±2σ, and 99.7% within ±3σ of the mean. A Z-score of 1.96 corresponds to the 97.5th percentile — this is the critical value used for 95% confidence intervals, which is why it is the most common Z-value in inferential statistics. The interpretation text in the results provides a plain-English description of what the Z-score means.',
    faqs: [
      {
        question: 'What does a Z-score of 0 mean?',
        answer: 'A Z-score of 0 means the raw score is exactly equal to the population mean. The data point is at the 50th percentile — exactly half the population scores below and half above.',
      },
      {
        question: 'What is a "good" Z-score?',
        answer: 'It depends on your context. In academic testing, Z > 1 (above the 84th percentile) is considered above average. Z > 2 (97.7th percentile) is exceptional. In quality control, a Z-score beyond ±3 signals a potential defect. In medical diagnostics, a Z-score beyond ±2 may indicate abnormality requiring investigation.',
      },
      {
        question: 'How do I calculate the probability from a Z-score?',
        answer: 'The cumulative probability P(Z ≤ z) is the area under the standard normal curve to the left of your Z-score. It represents the proportion of the population that scores at or below your value. The calculator evaluates the normal distribution with an incomplete-gamma series and continued fraction (accurate to roughly 14 significant digits, checked against SciPy), and computes the upper tail P(Z > z) directly so extreme z-scores such as z = 8 (6.2 × 10⁻¹⁴ % above) are not rounded to zero. Percentiles assume the data is approximately normally distributed.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Standard Score', url: 'https://en.wikipedia.org/wiki/Standard_score' },
      { source: 'NIST - Z-Score', url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm' },
    ],
  },
};

export default zScoreConfig;
