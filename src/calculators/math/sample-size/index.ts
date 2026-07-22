import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SampleSizePanel from './SampleSizePanel';

const Z_SCORES: Record<string, number> = {
  '90': 1.645,
  '95': 1.96,
  '99': 2.576,
};

const sampleSizeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'population',
      label: 'Population Size (N)',
      type: 'number',
      placeholder: '10000',
      step: 1,
      min: 1,
      required: true,
      helpText: 'Total size of the population you want to study',
    },
    {
      id: 'confidence',
      label: 'Confidence Level',
      type: 'select',
      required: true,
      options: [
        { label: '90%', value: '90' },
        { label: '95% (standard)', value: '95' },
        { label: '99%', value: '99' },
      ],
    },
    {
      id: 'margin',
      label: 'Margin of Error (%)',
      type: 'number',
      placeholder: '5',
      step: 0.1,
      min: 0.1,
      max: 50,
      required: true,
      helpText: 'The acceptable margin of error in percentage points',
    },
  ],
  calculate: (values) => {
    const N = parseInt(values.population) || 0;
    const confidence = values.confidence || '95';
    const marginRaw = parseFloat(values.margin);
    if (isNaN(marginRaw) || marginRaw <= 0) return [];
    const E = marginRaw / 100;

    if (N <= 0 || E <= 0 || E >= 1) return [];
    if (!Z_SCORES[confidence]) return [];

    const Z = Z_SCORES[confidence];
    const p = 0.5; // conservative estimate for maximum variability

    // Infinite population sample size
    const nInfinite = (Z * Z * p * (1 - p)) / (E * E);

    // Finite population correction
    const n = Math.ceil(nInfinite / (1 + (nInfinite - 1) / N));

    const confidenceLabel = confidence === '90' ? '90%' : confidence === '95' ? '95%' : '99%';

    return [
      {
        id: 'sampleSize',
        label: `Recommended Sample Size (${confidenceLabel} CL, ${values.margin || '5'}% MOE)`,
        value: n.toLocaleString(),
        highlight: true,
        color: n <= 100 ? 'positive' as const : n <= 1000 ? 'neutral' as const : 'negative' as const,
      },
      {
        id: 'responseRate',
        label: 'Target Responses Needed',
        value: n.toLocaleString(),
        color: 'neutral' as const,
      },
      {
        id: 'marginSize',
        label: 'Margin of Error',
        value: `${values.margin || '5'}%`,
        color: 'neutral' as const,
      },
      {
        id: 'zScore',
        label: 'Z-Score Used',
        value: `${Z} (${confidenceLabel} confidence)`,
        color: 'neutral' as const,
      },
      {
        id: 'populationInfo',
        label: 'Population',
        value: `${N.toLocaleString()} (${N < 1000 ? 'small' : N < 100000 ? 'medium' : 'large'} population)`,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SampleSizePanel, { values, results });
  },
  educational: {
    formula: 'n = (Z² × p × (1-p)) / E² | n_adjusted = n / (1 + (n-1)/N)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Sample Size &amp; Population</text><ellipse cx="220" cy="140" rx="180" ry="90" fill="var(--svg-3b82f6)" fill-opacity=".1" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><text x="220" y="145" text-anchor="middle" font-size="20" font-weight="bold" fill="var(--svg-3b82f6)">Population (N)</text><text x="220" y="168" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Everyone you want to study</text><circle cx="220" cy="240" r="50" fill="var(--svg-ef4444)" fill-opacity=".15" stroke="var(--svg-ef4444)" stroke-width="2.5"/><text x="220" y="240" text-anchor="middle" font-size="18" font-weight="bold" fill="var(--svg-ef4444)">Sample</text><text x="220" y="260" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ef4444)">(n)</text><text x="220" y="308" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Sample Size Formula</text><text x="220" y="328" text-anchor="middle" font-size="12" fill="var(--svg-555555)">n = Z&sup2;p(1-p)/E&sup2; &nbsp;|&nbsp; adj: n / (1 + (n-1)/N)</text></svg>',
      alt: 'Large ellipse representing the population with a smaller circle inside representing the sample, showing the relationship between population N and sample size n',
      caption: 'A sample is a subset of the population used to estimate population parameters',
    },
    formulaDescription:
      'The sample size formula determines how many survey responses are needed for statistically significant results. Z is the Z-score for your confidence level (1.96 for 95%), p is the estimated proportion (0.5 is most conservative), E is the margin of error, and N is the population size. The finite population correction adjusts the sample size when the population is small.',
    variables: [
      { symbol: 'Z', name: 'Z-Score', description: '1.645 for 90% confidence, 1.96 for 95%, 2.576 for 99%. Higher confidence levels require larger Z-scores and larger samples.' },
      { symbol: 'p', name: 'Proportion', description: 'Estimated response proportion. 0.5 = 50% (most conservative estimate, gives the largest sample size). If you know the approximate proportion, use it.' },
      { symbol: 'E', name: 'Margin of Error', description: 'The acceptable error range, e.g., 0.05 for ±5%. Smaller margins require larger sample sizes.' },
      { symbol: 'N', name: 'Population Size', description: 'Total size of the group being studied. For very large populations (>100,000), the infinite population formula dominates.' },
    ],
    howToUse: [
      'Enter your total population size (the group you want to study).',
      'Select your desired confidence level (95% is the standard for most research).',
      'Set your acceptable margin of error (5% is common for market research).',
      'Review the recommended sample size and the margin comparison table showing how sample size changes with different margins.',
      'Remember: the calculated number is the number of COMPLETED responses you need, not the number of surveys sent (account for non-response rates).',
    ],
    explanation:
      'Sample size determination is critical in market research, UX research, clinical trials, and opinion polling. A sample that is too small may fail to detect real effects (false negative), while one that is too large wastes time and money. The 95% confidence level is the industry standard — it means that if you repeated the survey 100 times, the results would fall within the margin of error 95 times out of 100. The formula uses p = 0.5 (maximum variability) by default, which gives the most conservative (largest) sample size estimate. If you have prior knowledge that the proportion is near 0.2 or 0.8, the required sample size would be smaller. The finite population correction (FPC) adjusts the sample size downward when the sample is a significant fraction of the population. For populations over 100,000, the FPC has minimal effect and the infinite population formula dominates. Remember that the calculated number is the number of completed responses needed — if you expect a 20% response rate, you need to invite five times as many participants.',
    faqs: [
      {
        question: 'Why is 95% confidence the standard?',
        answer: 'The 95% confidence level (Z = 1.96) is the widely accepted standard in social sciences, market research, and medical studies. It provides a good balance between precision and practicality. A 99% level requires significantly larger samples, while 90% may not be rigorous enough for publication.',
      },
      {
        question: 'What does margin of error mean?',
        answer: 'The margin of error is the range within which the true population value is expected to fall. For example, if 60% of your sample prefers Product A with a ±5% margin of error, the true population preference is between 55% and 65% (at your chosen confidence level).',
      },
      {
        question: 'Do I need to use finite population correction?',
        answer: 'The finite population correction (FPC) matters when your sample is a significant fraction (>5%) of the total population. For small populations (under 10,000), the FPC noticeably reduces the required sample size. For very large populations (over 100,000), it has minimal effect and the infinite formula is sufficient.',
      },
      {
        question: 'What is a good response rate for surveys?',
        answer: 'Response rates vary widely by method: email surveys typically get 10-30%, in-person interviews 50-80%, and online panels 30-50%. To achieve your target completed responses, divide the sample size by your expected response rate. For example, if you need 385 responses and expect a 20% response rate, send 1,925 invitations.',
      },
      {
        question: 'How does confidence level affect sample size?',
        answer: 'Higher confidence levels require larger samples. A 99% confidence level (Z=2.576) requires about 77% more respondents than 95% (Z=1.96) for the same margin of error. Most research uses 95% as the standard because 99% often requires prohibitively large samples for marginal gain in certainty.',
      },
      {
        question: 'Can I calculate sample size for different types of studies?',
        answer: 'This calculator uses the proportion-based formula, which is ideal for surveys and polls where the outcome is categorical (yes/no, prefer/do not prefer). For continuous outcomes (e.g., measuring blood pressure), a mean-based formula using standard deviation is more appropriate. For A/B testing, specialized calculators using power analysis and minimum detectable effect are recommended.',
      },
      {
        question: 'What if my population is unknown or infinite?',
        answer: 'Enter a very large number (like 1,000,000) for the population. The finite population correction will have negligible effect, and the result will be the standard infinite-population sample size. This is common when studying broad consumer markets or internet users where the total population cannot be precisely counted.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A market researcher wants to survey customers of a regional bank with 50,000 account holders. They want 95% confidence with a ±5% margin of error.',
        inputs: { population: '50000', confidence: '95', margin: '5' },
        result: 'Recommended sample size: approximately 381 respondents.',
        insight: 'This is the standard sample size for most market research. Notice that even for 50,000 people, only 381 responses are needed — the sample size does not need to scale proportionally with the population.',
      },
      {
        scenario: 'A UX researcher is testing a prototype with a small user base of 200 enterprise customers and wants 95% confidence with ±5% margin.',
        inputs: { population: '200', confidence: '95', margin: '5' },
        result: 'Recommended sample size: approximately 132 respondents.',
        insight: 'With a small population, the finite population correction significantly reduces the required sample size. However, 132 out of 200 is a 66% response rate — this may require incentives or mandatory participation to achieve.',
      },
      {
        scenario: 'A political pollster wants to survey voters in a city of 500,000 with 99% confidence and a ±3% margin of error.',
        inputs: { population: '500000', confidence: '99', margin: '3' },
        result: 'Recommended sample size: approximately 1,849 respondents.',
        insight: 'The jump from 95% to 99% confidence nearly triples the required sample. This level of rigor is typical for published academic research and high-stakes polling, but the cost of reaching 1,849 respondents must be weighed against the marginal increase in certainty.',
      },
    ],
    proTips: [
      'Always plan for non-response: divide your target sample size by your expected response rate to get the number of invitations to send.',
      'Use p=0.5 (the default) when you have no prior knowledge — it gives the largest and most conservative sample size estimate.',
      'For populations over 100,000, the infinite population formula dominates — increasing the population further has almost no effect on sample size.',
      'If budget is tight, increase the margin of error from 5% to 8% — the required sample size drops dramatically (from 385 to 150 at 95% confidence).',
    ],
    limitations: [
      'This calculator assumes simple random sampling. Stratified, cluster, or convenience sampling methods require different formulas.',
      'Results assume a perfectly representative sample. Real-world non-response bias, selection bias, and measurement error can reduce effective precision.',
      'The proportion-based formula is designed for categorical survey questions (yes/no). For continuous measurements, use a mean-based sample size formula.',
    ],
    commonUses: [
      'Market research surveys — determining how many customers to poll for statistically valid brand or product feedback',
      'Political polling — calculating the sample needed for accurate election predictions within a stated margin of error',
      'UX research and usability testing — planning how many users to recruit for statistically meaningful task completion rates',
      'Clinical trials and medical research — estimating the number of subjects needed to detect treatment effects',
      'Quality control and manufacturing — determining how many units to inspect from a production batch',
    ],
    quickReference: [
      { label: '95% CL, ±5% margin, large pop.', value: '385 respondents' },
      { label: '95% CL, ±3% margin, large pop.', value: '1,067 respondents' },
      { label: '99% CL, ±5% margin, large pop.', value: '666 respondents' },
      { label: '90% CL, ±5% margin, large pop.', value: '271 respondents' },
      { label: 'Z-score for 95%', value: '1.96' },
      { label: 'Z-score for 99%', value: '2.576' },
      { label: 'Most conservative p', value: '0.5 (50%)' },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Sample Size Determination', url: 'https://en.wikipedia.org/wiki/Sample_size_determination' },
      { source: 'Wolfram MathWorld', title: 'Sample Size', url: 'https://mathworld.wolfram.com/SampleSize.html' },
    ],
  },
};

export default sampleSizeConfig;
