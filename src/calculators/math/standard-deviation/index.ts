import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import StandardDeviationPanel from './StandardDeviationPanel';

// Decimal.js for variance and standard deviation calculations — prevents
// catastrophic cancellation and floating-point rounding errors when computing
// squared deviations from the mean, especially for datasets with many values
// or values of very different magnitudes.
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

function parseData(input: string): Decimal[] {
  if (!input || !input.trim()) return [];
  const nums = input
    .split(/[,;\s]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => { try { return new Decimal(s); } catch { return null; } })
    .filter((d): d is Decimal => d !== null && d.isFinite());
  return nums;
}

const standardDeviationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'dataSet',
      label: 'Data Set',
      type: 'text',
      placeholder: '12, 15, 18, 22, 14, 19, 16, 21',
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter comma-separated numbers. Also accepts spaces, semicolons, and newlines.',
    },
    {
      id: 'population',
      label: 'Data Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Sample (use n-1, most common)', value: 'sample' },
        { label: 'Population (use n)', value: 'population' },
      ],
    },
  ],
  calculate: (values) => {
    const raw = values.dataSet;
    const dataType = values.population || 'sample';

    if (!raw) return [];

    const nums = parseData(raw);
    if (nums.length < 2) return [];

    const n = nums.length;
    const m = nums.reduce((s, v) => s.plus(v), new Decimal(0)).div(n);
    const sumSquaredDiffs = nums.reduce((acc, x) => acc.plus(x.minus(m).pow(2)), new Decimal(0));
    const variance = dataType === 'sample'
      ? sumSquaredDiffs.div(n - 1)
      : sumSquaredDiffs.div(n);
    const stdDev = variance.sqrt();

    const sorted = [...nums].sort((a, b) => a.comparedTo(b));
    const min = sorted[0];
    const max = sorted[n - 1];
    const rangeVal = max.minus(min);
    const medianVal = n % 2 === 0
      ? sorted[n / 2 - 1].plus(sorted[n / 2]).div(2)
      : sorted[Math.floor(n / 2)];
    const cvPct = m.abs().greaterThan(0)
      ? stdDev.div(m.abs()).times(100)
      : new Decimal(0);

    const fmt = (x: Decimal) => {
      if (x.isInteger() && x.abs().lessThan(1e15)) return x.toFixed(0);
      return parseFloat(x.toFixed(6)).toString();
    };

    return [
      {
        id: 'stdDev',
        label: `Standard Deviation (${dataType === 'sample' ? 's' : 'σ'})`,
        value: fmt(stdDev),
        highlight: true,
        color: 'positive',
      },
      { id: 'mean', label: 'Mean (Average)', value: fmt(m), color: 'neutral' },
      { id: 'variance', label: 'Variance', value: fmt(variance), color: 'neutral' },
      { id: 'median', label: 'Median', value: fmt(medianVal), color: 'neutral' },
      { id: 'count', label: 'Count (n)', value: n.toString(), color: 'neutral' },
      { id: 'range', label: 'Range', value: `${fmt(min)} to ${fmt(max)} (span: ${fmt(rangeVal)})`, color: 'neutral' },
      { id: 'cv', label: 'Coefficient of Variation', value: `${cvPct.toFixed(2)}%`, color: 'neutral' },
    ];
  },
  educational: {
    formula: 'σ = √[Σ(xᵢ − μ)² / N] | s = √[Σ(xᵢ − x̄)² / (n−1)]',
    formulaDescription:
      'Standard deviation measures the spread of data around the mean. Population SD (σ) divides by N; sample SD (s) divides by n-1 (Bessel\'s correction) to provide an unbiased estimate of the population parameter. The variance is the square of the standard deviation and represents the average squared distance from the mean.',
    diagram: {
      svg: '<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="210" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Normal Distribution — Standard Deviation</text>' +
        '<!-- Bell curve -->' +
        '<path d="M10,170 C60,170 100,110 130,80 C160,50 190,20 210,20 C230,20 260,50 290,80 C320,110 360,170 410,170 Z" fill="rgba(59,130,246,0.12)" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
        '<!-- mean line --><line x1="210" y1="20" x2="210" y2="170" stroke="var(--svg-1e293b)" stroke-width="1.5" stroke-dasharray="4,3"/>' +
        '<text x="210" y="185" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Mean</text>' +
        '<!-- -1SD, +1SD --><line x1="155" y1="55" x2="155" y2="170" stroke="var(--svg-f59e0b)" stroke-width="1" stroke-dasharray="3,3"/>' +
        '<text x="155" y="185" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-f59e0b)" text-anchor="middle">-1 SD</text>' +
        '<line x1="265" y1="55" x2="265" y2="170" stroke="var(--svg-f59e0b)" stroke-width="1" stroke-dasharray="3,3"/>' +
        '<text x="265" y="185" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-f59e0b)" text-anchor="middle">+1 SD</text>' +
        '<!-- 68% label --><text x="210" y="95" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">68%</text>' +
        '<text x="210" y="112" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">of data falls within ±1 SD</text>' +
        '</svg>',
      alt: 'Bell curve showing normal distribution with mean and standard deviation markers, 68% of data within 1 standard deviation',
      caption: 'In a normal distribution, 68% of values fall within one standard deviation of the mean, 95% within two',
    },
    variables: [
      { symbol: 'μ (or x̄)', name: 'Mean', description: 'The arithmetic average of the data set. μ is the population mean; x̄ is the sample mean.' },
      { symbol: 'σ (or s)', name: 'Standard Deviation', description: 'The average distance of each data point from the mean. σ is population SD; s is sample SD.' },
      { symbol: 'N (or n-1)', name: 'Divisor', description: 'Population SD divides by N; sample SD divides by n-1 to correct for bias (Bessel\'s correction).' },
      { symbol: 'CV', name: 'Coefficient of Variation', description: 'SD divided by the mean, expressed as a percentage. Allows comparison of variability across datasets with different units or scales.' },
    ],
    howToUse: [
      'Enter your data set as comma-separated numbers (e.g., "12, 15, 18, 22, 14").',
      'Select whether your data represents a sample (most common) or the full population.',
      'View the standard deviation, variance, mean, median, range, and coefficient of variation.',
      'Use the coefficient of variation to compare variability across datasets with different scales or units.',
    ],
    explanation:
      'Standard deviation (SD) is the most widely used measure of statistical dispersion. A low SD means data is clustered close to the mean; a high SD means data is spread widely. In a normal distribution, approximately 68% of data falls within 1 SD of the mean, 95% within 2 SDs, and 99.7% within 3 SDs -- this is known as the empirical rule or the 68-95-99.7 rule. The choice between sample and population SD is critical: sample SD uses n-1 (Bessel\'s correction) because a sample tends to underestimate the true population variability. Without this correction, the sample SD would be biased. In practice, almost all real-world research uses sample SD since data is almost always a sample drawn from a larger population. The coefficient of variation (CV) normalizes the SD by the mean, allowing you to compare variability between datasets with different units -- for example, comparing the consistency of test scores (points) with heights (centimeters). Finance uses SD to measure investment volatility: a stock with a higher SD has more price fluctuation and is considered riskier.',
    commonUses: [
      'Finance: measuring investment risk and portfolio volatility -- a stock with SD=25% has twice the price swings of one with SD=12.5%',
      'Manufacturing: monitoring process capability with Six Sigma methodologies -- parts must stay within ±3σ of target specifications',
      'Education: comparing test score consistency across classrooms -- a class with low SD is more uniformly prepared than one with high SD',
      'Healthcare: evaluating the reliability of blood pressure measurements and other vital signs over repeated readings',
      'Meteorology: assessing the reliability of weather forecasts by computing the SD of historical temperature prediction errors',
    ],
    workedExamples: [
      {
        scenario: 'Dr. Chen, a pharmaceutical quality manager, is testing the weight consistency of 500mg ibuprofen tablets. A sample of 8 tablets weighs: 498, 502, 499, 505, 497, 503, 501, 500 mg. The FDA requires that the relative standard deviation (CV) stay under 2%. Is this batch compliant?',
        inputs: { dataSet: '498, 502, 499, 505, 497, 503, 501, 500', population: 'sample' },
        result: 'Sample SD (s) ≈ 2.669. Mean = 500.625. Variance ≈ 7.125. Median = 500.5. Count (n) = 8. Range: 497 to 505 (span: 8). CV = 0.53%. Batch is FDA compliant (CV < 2%).',
        insight: 'Mean = 500.625 mg, Sample SD ≈ 2.67 mg, CV = (2.67 / 500.625) × 100 = 0.53%. The CV is well under the FDA 2% limit. The process is well-controlled and the batch passes quality standards. Dr. Chen can release the batch with confidence.',
      },
      {
        scenario: 'Maria, a high school counselor, wants to compare the consistency of math scores versus English scores from a standardized test. Math: 72, 85, 91, 78, 88, 76, 84, 90. English: 80, 82, 81, 84, 79, 83, 81, 80. Which subject has more consistent scores?',
        inputs: { dataSet: '72, 85, 91, 78, 88, 76, 84, 90', population: 'sample' },
        result: 'Sample SD (s) ≈ 6.760. Mean = 83. Variance ≈ 45.714. Median = 81. Count (n) = 8. Range: 72 to 91 (span: 19). CV = 8.15%. Math scores show moderate variability.',
        insight: 'Math: Mean = 83, SD ≈ 6.76, CV = 8.14%. English: Mean = 81.25, SD ≈ 1.67, CV = 2.05%. English scores are far more consistent (CV of 2% vs 8% for math). This suggests that student ability in English is more uniform, while math performance varies significantly. The counselor might recommend differentiated math instruction to address the wider spread.',
      },
      {
        scenario: 'James, an investor, is comparing two mutual funds. Fund A had annual returns: 8%, 12%, -3%, 15%, 7%. Fund B had annual returns: 9%, 10%, 8%, 9%, 11%. Both have similar means but James wants to understand the risk difference.',
        inputs: { dataSet: '8, 12, -3, 15, 7', population: 'sample' },
        result: 'Sample SD (s) ≈ 7.190. Mean = 7.8. Variance ≈ 51.7. Median = 8. Count (n) = 5. Range: -3 to 15 (span: 18). CV = 92.18%. Fund A has very high volatility — returns swing wildly including a loss year.',
        insight: 'Fund A: Mean = 7.8%, SD ≈ 7.19%, CV = 92.2%. Fund B: Mean = 9.4%, SD ≈ 1.14%, CV = 12.1%. Fund B has lower returns on average but dramatically lower volatility. Fund A\'s 92% CV means returns swing wildly year to year (including a loss of -3%). James should choose Fund B if he wants steady returns, or Fund A if he can tolerate high volatility for occasional big gains.',
      },
    ],
    proTips: [
      'The coefficient of variation (CV) is the most underused statistic. Always compute it when comparing variability across datasets with different means or units -- raw SD alone is not comparable between groups.',
      'For normally distributed data, check the empirical rule: about 68% of your data should be within 1 SD of the mean. If it is not, your data may not be normal, and you should consider non-parametric methods.',
      'The variance is in squared units (e.g., "dollars squared"). Always report the standard deviation alongside it so readers can interpret the spread in the original units.',
      'When collecting data, plan your sample size knowing that the standard error of the mean (SEM = SD/√n) shrinks with the square root of n. To halve your SEM, you need 4x the sample size.',
      'If you compute the SD and get zero (or near zero), check whether all your values are identical, or whether you accidentally entered the same value multiple times. Zero SD is mathematically possible but rare in real-world data.',
    ],
    limitations: [
      'Do NOT use standard deviation for ordinal data (e.g., Likert scale survey responses 1-5). The arithmetic mean is not meaningful for ordinal scales. Use median-based measures (IQR, median absolute deviation) for ordinal data instead.',
      'Do not use the empirical rule (68-95-99.7) for data that is clearly non-normal (skewed or bimodal). The empirical rule only applies to normally distributed data. For non-normal data, use percentile-based methods.',
      'Do not use the coefficient of variation when the mean is zero or very close to zero — CV becomes meaningless as the denominator approaches zero. CV also cannot be negative, so it loses interpretability near zero means.',
      'Do not use sample SD (n-1) when you genuinely have the entire population (e.g., census data or a complete company database). In that case, switch to population SD (n) for the exact parameter value.',
      'This calculator uses the standard two-pass formula for variance. It does not implement Welford\'s online algorithm, which would be more numerically stable for datasets with extreme value ranges or millions of entries.',
    ],
    quickReference: [
      { label: 'Sample SD (s)', value: 'sqrt(Σ(x-x̄)² / (n-1))' },
      { label: 'Population SD (σ)', value: 'sqrt(Σ(x-μ)² / n)' },
      { label: 'Variance', value: 'SD², in squared units' },
      { label: 'CV < 10%', value: 'Low variability (consistent)' },
      { label: 'CV 10-30%', value: 'Moderate variability' },
      { label: 'CV > 30%', value: 'High variability (inconsistent)' },
      { label: 'Within ±1 SD', value: '≈ 68% of normal data' },
      { label: 'Within ±3 SD', value: '≈ 99.7% of normal data' },
    ],
    faqs: [
      {
        question: 'When should I use sample vs. population standard deviation?',
        answer: 'Use sample SD (n-1) when your data is a sample drawn from a larger population -- which is almost always true in practice. Use population SD (n) only when you have data for every member of the entire population, such as all students in a specific classroom or all countries in the UN. When in doubt, use sample SD: it is the conservative choice that does not underestimate the true variability.',
      },
      {
        question: 'What is the coefficient of variation (CV)?',
        answer: 'The coefficient of variation (CV) is the standard deviation divided by the mean, expressed as a percentage. It normalizes variability for comparison between data sets with different units or scales. For example, you can compare the consistency of weights (kg) with heights (cm) because the CV is unitless. A CV under 10% generally indicates low variability; over 30% indicates high variability. CV is widely used in quality control, finance, and laboratory sciences.',
      },
      {
        question: 'What does the 68-95-99.7 rule tell us?',
        answer: 'In a normal distribution, about 68% of values fall within 1 standard deviation of the mean, 95% within 2 standard deviations, and 99.7% within 3 standard deviations. This is useful for identifying outliers: values beyond 3 SDs are very rare (about 0.3% chance). However, this rule only applies to normally-distributed data. If your data is skewed, the percentages will be different.',
      },
      {
        question: 'Why is variance in squared units?',
        answer: 'Variance is the average of squared deviations from the mean. Squaring ensures that positive and negative deviations do not cancel each other out. The trade-off is that variance is in squared units -- if your data is in dollars, variance is in "dollars squared," which is hard to interpret. That is why standard deviation (the square root of variance) is reported alongside it: SD is in the original units and is directly interpretable.',
      },
      {
        question: 'What is the difference between standard deviation and standard error?',
        answer: 'Standard deviation (SD) measures the spread of individual data points around the sample mean. Standard error of the mean (SEM = SD/√n) measures how precisely the sample mean estimates the population mean. As your sample size grows, SEM shrinks (you get more precise), but SD stabilizes around the true population SD. SD describes your data; SEM describes your estimate\'s precision.',
      },
      {
        question: 'Why does sample SD use n-1?',
        answer: 'Bessel\'s correction (n-1) is used because a sample tends to be less variable than the population it came from -- by chance, you may miss the most extreme values. Dividing by a smaller number (n-1 instead of n) produces a slightly larger SD that corrects for this downward bias. For large samples (n > 100), the difference between dividing by n and n-1 is negligible, but for small samples (n < 30), the correction is important.',
      },
      {
        question: 'Can standard deviation be larger than the mean?',
        answer: 'Yes. When SD exceeds the mean, the coefficient of variation is above 100%, indicating extremely high variability. This is common with financial returns (stock prices can swing wildly), count data with many zeros, and measurements with high measurement error. When CV > 100%, consider whether the mean is a good summary statistic at all -- your data may be too variable to summarize with a single number.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Standard Deviation', url: 'https://en.wikipedia.org/wiki/Standard_deviation' },
      { source: 'NIST - Standard Deviation', url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda35a.htm' },
      { source: 'Wikipedia - Bessel\'s Correction', url: 'https://en.wikipedia.org/wiki/Bessel%27s_correction' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(StandardDeviationPanel, { values, results });
  },
};

export default standardDeviationConfig;
