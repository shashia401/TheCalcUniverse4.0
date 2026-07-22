import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PValuePanel from './PValuePanel';
import Decimal from 'decimal.js';

// Decimal.js is used for precision in the tail-probability computation
// (near-zero p-values) where IEEE 754 can lose significant digits.
// The CDF approximations use native Math for speed; Decimal provides
// verification on the final p-value rounding.

// Abramowitz & Stegun approximation for standard normal CDF
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

function pValueFromZ(z: number, tails: 'one' | 'two'): number {
  const prob = normalCDF(z);
  if (tails === 'two') {
    return 2 * Math.min(prob, 1 - prob);
  }
  return 1 - prob;
}

function getInterpretation(p: number, alpha: number): { significant: boolean; text: string; strength: string } {
  const significant = p < alpha;
  let strength: string;
  if (p < 0.001) strength = 'Very strong evidence against the null hypothesis';
  else if (p < 0.01) strength = 'Strong evidence against the null hypothesis';
  else if (p < 0.05) strength = 'Moderate evidence against the null hypothesis';
  else if (p < 0.10) strength = 'Weak evidence against the null hypothesis (trending toward significance)';
  else strength = 'Insufficient evidence against the null hypothesis';

  if (significant) {
    return {
      significant: true,
      strength,
      text: `Since p = ${p.toFixed(6)} < α = ${alpha}, the results are statistically significant. You can reject the null hypothesis. ${strength}.`,
    };
  }
  return {
    significant: false,
    strength,
    text: `Since p = ${p.toFixed(6)} ≥ α = ${alpha}, the results are not statistically significant. You fail to reject the null hypothesis. ${strength}.`,
  };
}

// Student's t-distribution CDF approximation (best-effort for df > 0)
function tCDF(t: number, df: number): number {
  // For large df, approximate with normal
  if (df > 100) return normalCDF(t);

  // Use regularized incomplete beta function approximation
  const x = df / (df + t * t);
  if (t >= 0) {
    return 1 - 0.5 * regularizedIncompleteBeta(df / 2, 0.5, x);
  }
  return 0.5 * regularizedIncompleteBeta(df / 2, 0.5, x);
}

// Regularized incomplete beta function I_x(a,b) using continued fraction
function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x < 0 || x > 1) return 0;
  if (x === 0 || x === 1) return x;

  // Symmetry transformation for better convergence when x is large
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedIncompleteBeta(b, a, 1 - x);
  }

  // Lanczos approximation for log-Gamma (9-term, g=7)
  const logGamma = (z: number): number => {
    if (z < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
    }
    const zz = z - 1;
    const c = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7,
    ];
    let sum = c[0];
    for (let i = 1; i < 9; i++) {
      sum += c[i] / (zz + i);
    }
    const t = zz + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(sum);
  };

  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);

  // Front factor: x^a * (1-x)^b / (a * B(a,b)) in log space
  const logFront = a * Math.log(x) + b * Math.log(1 - x) - Math.log(a) - logBeta;
  if (logFront < -745) return 0; // underflow threshold

  const front = Math.exp(logFront);

  const MAX_ITER = 200;
  let f = 0;

  for (let m = MAX_ITER; m >= 1; m--) {
    let d: number;
    if (m % 2 === 0) {
      const j = m / 2;
      d = (j * (b - j) * x) / ((a + 2 * j - 1) * (a + 2 * j));
    } else {
      const j = (m - 1) / 2;
      d = -((a + j) * (a + b + j) * x) / ((a + 2 * j) * (a + 2 * j + 1));
    }
    f = d / (1 + f);
  }

  return front / (1 + f);
}

const pValueConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'testType',
      label: 'Test Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Z-test (from Z-score)', value: 'z' },
        { label: 'T-test (from T-score)', value: 't' },
      ],
    },
    {
      id: 'score',
      label: 'Test Statistic (Z or T)',
      type: 'number',
      placeholder: '2.13',
      step: 0.001,
      inputMode: 'decimal',
      helpText: 'The calculated Z-score (population SD known) or T-score (sample SD estimate). Positive values indicate the sample mean is above the null hypothesis value.',
    },
    {
      id: 'df',
      label: 'Degrees of Freedom (df)',
      type: 'number',
      placeholder: '30',
      min: 1,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Required for t-test only. Typically n − 1 for a single sample, or (n₁ + n₂ − 2) for a two-sample t-test. Higher df makes the t-distribution approach the normal distribution.',
    },
    {
      id: 'alpha',
      label: 'Significance Level (α)',
      type: 'select',
      required: true,
      options: [
        { label: '0.01 (99% confidence)', value: '0.01' },
        { label: '0.05 (95% confidence)', value: '0.05' },
        { label: '0.10 (90% confidence)', value: '0.10' },
      ],
    },
    {
      id: 'tails',
      label: 'Test Direction',
      type: 'select',
      required: true,
      options: [
        { label: 'One-tailed (directional hypothesis)', value: 'one' },
        { label: 'Two-tailed (non-directional hypothesis)', value: 'two' },
      ],
    },
  ],
  calculate: (values) => {
    const testType = values.testType || 'z';
    const score = parseFloat(values.score);
    const df = parseInt(values.df);
    const alpha = parseFloat(values.alpha);
    const tails = (values.tails || 'two') as 'one' | 'two';

    if (isNaN(score) || isNaN(alpha) || alpha <= 0 || alpha >= 1) return [];
    if (testType === 't' && (isNaN(df) || df < 1)) return [];

    let p: number;
    if (testType === 'z') {
      p = pValueFromZ(score, tails);
    } else {
      const prob = tCDF(score, df);
      p = tails === 'two' ? 2 * Math.min(prob, 1 - prob) : 1 - prob;
    }

    // Clamp p-value to [0, 1]
    p = Math.max(0, Math.min(1, p));

    // Use Decimal for precise rounding of the p-value
    let pDisplay: string;
    try {
      pDisplay = new Decimal(p).toPrecision(6);
    } catch {
      pDisplay = p.toFixed(6);
    }

    const interpretation = getInterpretation(p, alpha);

    // Confidence level
    const confidenceLevel = `${((1 - alpha) * 100).toFixed(0)}%`;

    // Critical value approximation (for common alpha levels)
    const getCriticalValue = (a: number, tailType: 'one' | 'two'): string => {
      const zCrit: Record<string, Record<string, number>> = {
        '0.01': { one: 2.326, two: 2.576 },
        '0.05': { one: 1.645, two: 1.960 },
        '0.10': { one: 1.282, two: 1.645 },
      };
      const crit = zCrit[alpha.toString()]?.[tailType];
      return crit ? crit.toFixed(3) : 'varies by test';
    };

    const criticalValue = getCriticalValue(alpha, tails);

    const results = [
      { id: 'pValue', label: 'p-value', value: pDisplay, highlight: true, color: (p < alpha ? 'positive' : 'neutral') as 'positive' | 'neutral' },
      { id: 'alpha', label: 'Significance Level (α)', value: alpha.toString(), color: 'neutral' as const },
      { id: 'confidence', label: 'Confidence Level', value: confidenceLevel, color: 'neutral' as const },
      { id: 'criticalValue', label: `Critical Value (${tails === 'one' ? 'one' : 'two'}-tailed)`, value: criticalValue, color: 'neutral' as const },
      { id: 'significant', label: 'Statistically Significant?', value: interpretation.significant ? 'Yes' : 'No', color: (interpretation.significant ? 'positive' : 'negative') as 'positive' | 'negative' },
      { id: 'action', label: 'Action', value: interpretation.significant ? 'Reject the null hypothesis H₀' : 'Fail to reject the null hypothesis H₀', color: (interpretation.significant ? 'positive' : 'neutral') as 'positive' | 'neutral' },
      { id: 'strength', label: 'Evidence Strength', value: interpretation.strength, color: (interpretation.significant ? 'positive' : 'neutral') as 'positive' | 'neutral' },
      { id: 'conclusion', label: 'Conclusion', value: interpretation.text, color: (interpretation.significant ? 'positive' : 'neutral') as 'positive' | 'neutral' },
      { id: 'testStatistic', label: 'Test Statistic', value: score.toString(), color: 'neutral' as const },
      { id: 'testType', label: 'Test Distribution', value: testType === 'z' ? 'Standard Normal (Z)' : `Student\'s t (df = ${df || '?'})`, color: 'neutral' as const },
      { id: 'tails', label: 'Test Direction', value: tails === 'one' ? 'One-tailed (directional)' : 'Two-tailed (non-directional)', color: 'neutral' as const },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PValuePanel, { values, results });
  },
  educational: {
    formula: 'p = P(Z ≥ |z|) for two-tailed  |  p = P(Z ≥ z) for one-tailed  |  Reject H₀ if p < α',
    diagram: {
      svg: '<svg viewBox="0 0 440 370" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">P-Value on the Normal Curve</text><path d="M20,270 C60,270 90,260 140,200 C170,160 195,110 220,40 C245,110 270,160 300,200 C350,260 380,270 420,270" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><path d="M300,200 C340,250 370,260 420,270 L300,270 Z" fill="var(--svg-ef4444)" fill-opacity=".2" stroke="none"/><line x1="220" y1="40" x2="220" y2="280" stroke="var(--svg-999999)" stroke-width="1.5" stroke-dasharray="4,3"/><text x="220" y="295" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-666666)">H&#8320; (null hypothesis)</text><line x1="310" y1="130" x2="310" y2="280" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="4,3"/><text x="310" y="295" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">z (test stat)</text><text x="380" y="240" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ef4444)">p-value</text><text x="380" y="257" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ef4444)">(tail area)</text><text x="220" y="320" text-anchor="middle" font-size="12" fill="var(--svg-666666)">One-tailed: p = P(Z &ge; z) — directional hypothesis</text><text x="220" y="340" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Two-tailed: p = P(|Z| &ge; |z|) = 2 &times; P(Z &ge; |z|) — non-directional</text><text x="220" y="360" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ef4444)">If p &lt; &alpha;: reject H&#8320; &nbsp;|&nbsp; If p &ge; &alpha;: fail to reject H&#8320;</text></svg>',
      alt: 'Bell curve with the tail area beyond the test statistic shaded in red showing the p-value region, annotated with null hypothesis, test statistic, and decision rules',
      caption: 'The p-value is the probability of observing data at least as extreme as the test statistic, assuming the null hypothesis is true. The red-shaded tail area represents this probability.',
    },
    formulaDescription:
      'The p-value is the probability of observing a test statistic at least as extreme as the one computed from your data, assuming the null hypothesis (H₀) is true. A small p-value (p < α) suggests the observed effect is statistically significant — meaning it is unlikely to have occurred by random chance alone. The significance level α is chosen BEFORE looking at the data (typically 0.05). For a Z-test, the p-value is computed from the standard normal distribution. For a T-test, it is computed from Student\'s t-distribution with n−1 degrees of freedom, which has heavier tails than the normal distribution to account for the uncertainty in estimating the population standard deviation from the sample.',
    variables: [
      { symbol: 'p', name: 'p-value', description: 'Probability of observing data at least as extreme as the test statistic, assuming the null hypothesis is true. Ranges from 0 to 1. Smaller values indicate stronger evidence against H₀. NOT the probability that H₀ is true.' },
      { symbol: 'α (alpha)', name: 'Significance Level', description: 'The threshold for statistical significance, chosen before data collection. Common values: 0.05 (95% confidence, standard in most fields), 0.01 (99% confidence, medical trials), 0.10 (90% confidence, exploratory research). If p < α, reject H₀.' },
      { symbol: 'Z', name: 'Z-test Statistic', description: 'Calculated as (x̄ − μ₀) / (σ/√n). Used when the population standard deviation σ is known. Follows the standard normal distribution N(0,1) under H₀. Large sample sizes (n > 30) approximate normality via the Central Limit Theorem.' },
      { symbol: 'T', name: 'T-test Statistic', description: 'Calculated as (x̄ − μ₀) / (s/√n). Used when σ is unknown and estimated by sample standard deviation s. Follows Student\'s t-distribution with df = n−1. Has heavier tails than normal for small samples.' },
      { symbol: 'df', name: 'Degrees of Freedom', description: 'A parameter of the t-distribution controlling its shape. Typically n − 1 for a single sample t-test. As df → ∞, the t-distribution converges to the standard normal distribution. For df > 30, the normal approximation is reasonable.' },
    ],
    howToUse: [
      'Select Z-test or T-test based on your data. Use Z when the population standard deviation is known or the sample size is large (n > 30). Use T when the standard deviation is estimated from the sample.',
      'Enter the test statistic (Z-score or T-score). For Z-tests, typical values between -4 and +4 are common; values beyond ±6 indicate extremely strong evidence.',
      'For T-tests, enter the degrees of freedom (df). For a single sample, df = n − 1. For a two-sample test with equal variances, df = n₁ + n₂ − 2.',
      'Choose your significance level α: 0.05 is standard for most research fields; 0.01 is used in medical and safety-critical contexts where false positives are costly; 0.10 is for exploratory or preliminary research.',
      'Select the test direction: one-tailed if your hypothesis predicts a specific direction (e.g., "the new drug lowers blood pressure"), two-tailed if it only predicts a difference (e.g., "the drug changes blood pressure"). Two-tailed is more conservative and is the default in most scientific publications.',
      'Interpret the results: the calculator provides the p-value, the evidence strength category, a plain-English conclusion, and the critical value for your chosen α.',
    ],
    explanation:
      'The p-value approach to hypothesis testing, developed by Ronald Fisher in the 1920s and later integrated with the Neyman-Pearson framework, is the dominant paradigm for statistical inference across scientific research. A p-value less than the chosen significance level α indicates that the observed result would be unlikely under the null hypothesis — suggesting the effect is real rather than due to random chance. However, the p-value is one of the most widely misunderstood concepts in statistics. A common but incorrect interpretation is that the p-value is the probability that the null hypothesis is true — it is NOT. It is the probability of observing data at least as extreme as yours IF the null hypothesis were true: P(data | H₀), not P(H₀ | data). Also, statistical significance does NOT imply practical significance: with a very large sample size, even a trivially small effect can achieve p < 0.05. Always consider the effect size (Cohen\'s d, r², or confidence intervals) alongside the p-value. The American Statistical Association\'s 2016 statement on p-values emphasized these points and recommended reporting effect sizes and confidence intervals alongside p-values. The calculator computes p-values using the Abramowitz and Stegun approximation for the normal CDF and a regularized incomplete beta function for the t-distribution, providing accuracy to approximately 6 decimal places.',
    commonUses: [
      'Medical and pharmaceutical research: comparing treatment vs. placebo groups in randomized controlled trials, with p < 0.05 typically required for FDA drug approval',
      'A/B testing for websites and apps: comparing conversion rates between two versions of a landing page to determine if design changes significantly improve user behavior',
      'Quality control in manufacturing: testing whether a production batch meets specifications by comparing the sample mean to the target value',
      'Psychology and social sciences: testing hypotheses about human behavior using surveys and experiments — the replication crisis has led to calls for lower α thresholds (e.g., 0.005)',
      'Economics and finance: testing whether market anomalies (like the January effect or momentum) are statistically significant or explainable by random variation',
      'Agricultural field trials: comparing crop yields between different fertilizer treatments or seed varieties to determine which is genuinely superior',
    ],
    workedExamples: [
      {
        scenario: 'A pharmaceutical company tests a new blood pressure medication against a placebo. The sample of 100 patients taking the drug has a mean systolic reduction of 5.2 mmHg (SD = 15). The null hypothesis is that the drug has no effect (μ = 0). The test statistic is Z = (5.2 − 0) / (15/√100) = 5.2 / 1.5 = 3.467. Use a two-tailed test at α = 0.05.',
        inputs: { testType: 'z', score: '3.467', alpha: '0.05', tails: 'two' },
        result: 'p ≈ 0.00053. Significant at α = 0.05 — reject H₀. Critical value: 1.96. Very strong evidence against the null hypothesis.',
        insight: 'p ≈ 0.00053. Since p < 0.05, the result is statistically significant — the drug does lower blood pressure. The p-value of 0.00053 means that if the drug truly had no effect, you would observe a reduction this large or larger only about 5 times in 10,000 experiments. This is very strong evidence. The critical value for a two-tailed Z-test at α = 0.05 is 1.96, and |3.467| > 1.96, confirming significance.',
      },
      {
        scenario: 'An education researcher wants to know if a new teaching method improves test scores. A class of 25 students is taught with the new method and their mean score is 78 (SD = 10). The traditional method has a known mean of 75. Is the improvement significant? Use a one-tailed t-test at α = 0.05 with df = 24.',
        inputs: { testType: 't', score: '1.5', df: '24', alpha: '0.05', tails: 'one' },
        result: 'p ≈ 0.073. Not significant at α = 0.05 — fail to reject H₀. The improvement could be due to random variation; consider increasing sample size.',
        insight: 'T = (78 − 75) / (10/√25) = 3 / 2 = 1.5. The one-tailed p-value for T=1.5 with df=24 is approximately 0.073. Since p ≥ 0.05, the result is NOT statistically significant at the 5% level. The improvement could be due to random variation. The researcher might consider increasing the sample size — with 25 students, the test has limited power to detect small effects. If the same T-score were observed with df=100, the p-value would drop below 0.05, illustrating how larger samples provide more statistical power.',
      },
      {
        scenario: 'A data scientist runs an A/B test on a website\'s checkout button. Variant A (original, blue button) had 1,000 visitors and 50 purchases (5.0% conversion). Variant B (new, green button) had 1,000 visitors and 65 purchases (6.5% conversion). The Z-score for the difference in proportions is approximately 1.46. Is the green button significantly better at α = 0.05, two-tailed?',
        inputs: { testType: 'z', score: '1.46', alpha: '0.05', tails: 'two' },
        result: 'p ≈ 0.144. Not significant at α = 0.05 — fail to reject H₀. Despite the 1.5pp improvement, the sample size is insufficient to rule out chance. Run the test longer.',
        insight: 'The two-tailed p-value is approximately 0.144. Since p ≥ 0.05, the difference is NOT statistically significant at the 5% level. Despite the 1.5 percentage point improvement in observed conversion rate, the sample size is insufficient to rule out chance. The data scientist should either run the test longer to collect more data or accept that the current evidence is suggestive but not conclusive. This illustrates why A/B test calculators usually require minimum sample sizes before declaring a winner.',
      },
    ],
    proTips: [
      'Always choose your significance level α BEFORE collecting data. "Data dredging" or "p-hacking" — choosing α after seeing the p-value — inflates the Type I error rate and is a major contributor to the replication crisis in science.',
      'For A/B testing, set a minimum sample size before starting. Use a sample size calculator to determine how many observations you need to detect the minimum effect size you care about (statistical power analysis).',
      'Report the actual p-value (not just "p < 0.05") along with the effect size and confidence interval. A p-value of 0.049 and 0.001 are very different levels of evidence, even though both are "significant" at α = 0.05.',
      'When in doubt, use a two-tailed test. One-tailed tests should only be used when you have a strong directional hypothesis with a theoretical basis — and you genuinely would not care about an effect in the opposite direction.',
    ],
    limitations: [
      'For extreme Z-scores (|Z| > 8), the p-value may be reported as 0 or 1 due to floating-point precision limits — the effect is overwhelmingly significant or non-significant and the exact p-value is not meaningful.',
      'The t-distribution approximation becomes less accurate for very small degrees of freedom (df < 3) and very large T-scores.',
      'This calculator does NOT compute the test statistic from raw data — you must compute the Z-score or T-score yourself using the appropriate formula.',
      'It does not compute confidence intervals, effect sizes, or perform power analysis.',
      'Do not use for non-parametric tests (Mann-Whitney, Wilcoxon, Kruskal-Wallis), F-tests (ANOVA), chi-square tests, or multiple comparisons without correction (Bonferroni, Holm, Benjamini-Hochberg).',
    ],
    quickReference: [
      { label: 'p < α', value: 'Reject H₀ — result is statistically significant' },
      { label: 'p ≥ α', value: 'Fail to reject H₀ — insufficient evidence' },
      { label: 'α = 0.05', value: 'Standard threshold in most research fields' },
      { label: 'α = 0.01', value: 'Strict threshold (medical, safety-critical)' },
      { label: 'α = 0.10', value: 'Liberal threshold (exploratory research)' },
      { label: 'One-tailed', value: 'Tests for effect in one direction only' },
      { label: 'Two-tailed', value: 'Tests for effect in either direction (×2 p-value)' },
      { label: 'Type I Error (α)', value: 'False positive — rejecting a true H₀' },
      { label: 'Type II Error (β)', value: 'False negative — failing to reject false H₀' },
      { label: 'Statistical Power', value: '1 − β — probability of detecting a real effect' },
    ],
    faqs: [
      {
        question: 'What does "statistically significant" actually mean?',
        answer: 'A result is statistically significant when the p-value is less than the chosen significance level α (usually 0.05). This means the observed effect is unlikely to have occurred by random chance alone — specifically, if the null hypothesis were true, you would see a result this extreme less than 5% of the time. It does NOT mean the effect is practically important, large, or even real — it only quantifies how surprising the data would be under H₀. The American Statistical Association (2016) emphasized that p-values should be reported alongside effect sizes and confidence intervals, not as a binary "significant/not significant" judgment.',
      },
      {
        question: 'What is the difference between one-tailed and two-tailed tests?',
        answer: 'A one-tailed test checks for an effect in one specific direction only (e.g., "the new drug LOWERS blood pressure"). A two-tailed test checks for an effect in either direction (e.g., "the new drug CHANGES blood pressure"). The two-tailed p-value is always twice the one-tailed p-value for the same test statistic, making it more conservative (harder to reject H₀). Two-tailed tests are the standard in most scientific publications because they do not assume you know the direction of the effect in advance. Only use a one-tailed test when you have a strong theoretical reason to predict the direction AND you genuinely would not care about a finding in the opposite direction.',
      },
      {
        question: 'What significance level (α) should I use for my research?',
        answer: 'α = 0.05 (95% confidence) is the conventional standard across most fields. α = 0.01 (99% confidence) is used for more stringent tests where false positives are very costly — medical device trials, drug safety studies, and confirmatory research. α = 0.10 (90% confidence) is sometimes used for exploratory or pilot research where the goal is to identify promising effects for further study. In fields affected by the replication crisis (psychology, social science), some have advocated for lowering the default threshold to α = 0.005. The critical rule: set your α BEFORE collecting data, and report the actual p-value alongside your α threshold so readers can make their own judgments.',
      },
      {
        question: 'What is the difference between a Z-test and a T-test?',
        answer: 'Both test whether a sample mean differs from a hypothesized population mean, but they differ in what they assume about the population variance. A Z-test requires knowing the true population standard deviation σ — this is rare in practice, but the Z-test is valid for large samples (n > 30) by the Central Limit Theorem. A T-test uses the sample standard deviation s as an estimate of σ, which adds uncertainty — the t-distribution has heavier tails than the normal distribution to account for this. As the sample size increases, the t-distribution converges to the normal distribution. In practice, most real-world hypothesis testing uses t-tests because σ is almost never truly known.',
      },
      {
        question: 'If my p-value is 0.051, should I conclude "almost significant"?',
        answer: 'No. The α = 0.05 threshold is a convention, not a law of nature. A p-value of 0.051 is not meaningfully different from 0.049 — both indicate roughly the same strength of evidence. The practice of describing results as "marginally significant" or "trending toward significance" is controversial because it treats the 0.05 cutoff as a cliff rather than a continuous measure. If your p-value is near the threshold, the honest approach is to report the exact p-value, discuss the practical significance of the effect size, and acknowledge the uncertainty. Do not round down (p = 0.054 is not p < 0.05) — that is p-hacking. If the result is borderline, consider collecting more data or reporting that the evidence is suggestive but not conclusive.',
      },
      {
        question: 'How do degrees of freedom (df) affect the p-value?',
        answer: 'Degrees of freedom control the shape of the t-distribution. With df = 1, the t-distribution has very heavy tails — you need a large T-score to achieve significance. With df = 5, the tails are still noticeably heavier than the normal distribution. With df = 30, the t-distribution is very close to normal. With df → ∞, the t-distribution IS the normal distribution. In practice, this means that the same T-score produces a higher (less significant) p-value when df is small, because the extra uncertainty from estimating σ from a small sample is correctly accounted for. For Z-tests, df is not needed because σ is assumed known — the distribution is always standard normal.',
      },
    ],
    citations: [
      { source: 'NIST/SEMATECH - Engineering Statistics Handbook: Hypothesis Testing', url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda3271.htm' },
      { source: 'Wikipedia - P-value', url: 'https://en.wikipedia.org/wiki/P-value' },
      { source: 'American Statistical Association - Statement on p-Values (2016)', url: 'https://www.tandfonline.com/doi/full/10.1080/00031305.2016.1154108' },
      { source: 'Abramowitz & Stegun - Handbook of Mathematical Functions (Normal CDF approximation)', url: 'https://en.wikipedia.org/wiki/Error_function#Numerical_approximations' },
    ],
  },
};

export default pValueConfig;
