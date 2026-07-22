import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import CorrelationPanel from './CorrelationPanel';

function parseValues(input: string): number[] {
  if (!input || !input.trim()) return [];
  return input
    .trim()
    .split(/[\s,;]+/)
    .map((s) => parseFloat(s))
    .filter((v) => !isNaN(v));
}

const correlationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'xValues',
      label: 'X Values',
      type: 'textarea',
      placeholder: 'X values: 1, 2, 3, 4, 5',
      required: true,
      helpText: 'Enter X values separated by commas, spaces, or semicolons',
    },
    {
      id: 'yValues',
      label: 'Y Values',
      type: 'textarea',
      placeholder: 'Y values: 2, 4, 5, 4, 5',
      required: true,
      helpText: 'Enter Y values separated by commas, spaces, or semicolons',
    },
  ],
  calculate: (values) => {
    const xVals = parseValues(values.xValues ?? '');
    const yVals = parseValues(values.yValues ?? '');

    if (xVals.length < 3 || yVals.length < 3) return [];
    if (xVals.length !== yVals.length) return [];

    const n = xVals.length;

    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumY = yVals.reduce((a, b) => a + b, 0);
    const sumXY = xVals.reduce((acc, x, i) => acc + x * yVals[i], 0);
    const sumX2 = xVals.reduce((acc, x) => acc + x * x, 0);
    const sumY2 = yVals.reduce((acc, y) => acc + y * y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    let r = 0;
    if (denominator !== 0) {
      r = numerator / denominator;
    }

    // Clamp to [-1, 1]
    r = Math.max(-1, Math.min(1, r));

    const rSquared = r * r;
    const absR = Math.abs(r);

    let strength: string;
    if (absR >= 0.8) {
      strength = 'Very strong';
    } else if (absR >= 0.6) {
      strength = 'Strong';
    } else if (absR >= 0.4) {
      strength = 'Moderate';
    } else if (absR >= 0.2) {
      strength = 'Weak';
    } else {
      strength = 'Very weak';
    }

    const direction = r >= 0 ? 'Positive' : 'Negative';

    const meanX = sumX / n;
    const meanY = sumY / n;

    const covariance = xVals.reduce((acc, x, i) => acc + (x - meanX) * (yVals[i] - meanY), 0) / n;

    const fmt = (val: number): string => {
      if (Number.isInteger(val) && Math.abs(val) < 1e15) return val.toString();
      return parseFloat(val.toFixed(4)).toString();
    };

    const fmtFull = (val: number): string => {
      return parseFloat(val.toFixed(10)).toString();
    };

    return [
      {
        id: 'r',
        label: 'Pearson Correlation Coefficient (r)',
        value: fmt(r),
        highlight: true,
        color: r >= 0 ? ('positive' as const) : ('negative' as const),
      },
      {
        id: 'rSquared',
        label: 'Coefficient of Determination (r²)',
        value: fmt(rSquared),
        color: 'neutral' as const,
      },
      {
        id: 'strength',
        label: 'Strength',
        value: strength,
        color: 'neutral' as const,
      },
      {
        id: 'direction',
        label: 'Direction',
        value: direction,
        color: 'neutral' as const,
      },
      {
        id: 'meanX',
        label: 'Mean of X',
        value: fmtFull(meanX),
        color: 'neutral' as const,
      },
      {
        id: 'meanY',
        label: 'Mean of Y',
        value: fmtFull(meanY),
        color: 'neutral' as const,
      },
      {
        id: 'covariance',
        label: 'Covariance',
        value: fmtFull(covariance),
        color: 'neutral' as const,
      },
      {
        id: 'n',
        label: 'Sample Size (n)',
        value: n.toString(),
        color: 'neutral' as const,
      },
      {
        id: 'formula',
        label: 'Formula Applied',
        value: `r = (${n}×${sumXY} − ${sumX}×${sumY}) / √((${n}×${sumX2} − ${sumX}²)(${n}×${sumY2} − ${sumY}²)) = ${fmt(r)}`,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CorrelationPanel, { values, results });
  },
  educational: {
    formula: 'r = (n∑xy − ∑x∑y) / √((n∑x² − (∑x)²)(n∑y² − (∑y)²))',
    formulaDescription:
      "Pearson's correlation coefficient r measures the strength and direction of a linear relationship between two continuous variables. The value of r always falls between −1 and +1, where r = +1 indicates a perfect positive linear relationship, r = −1 indicates a perfect negative linear relationship, and r = 0 indicates no linear relationship. The coefficient is scale-invariant, meaning it does not depend on the units of measurement used for either variable.",
    variables: [
      {
        symbol: 'n',
        name: 'Sample Size',
        description: 'The number of paired observations in the dataset. Must be at least 3 for a meaningful correlation calculation.',
      },
      {
        symbol: '∑xy',
        name: 'Sum of Cross-Products',
        description: 'The sum of each x value multiplied by its corresponding y value. Represents the joint variability between the two variables.',
      },
      {
        symbol: '∑x, ∑y',
        name: 'Sum of X and Sum of Y',
        description: 'The sums of all x values and all y values respectively. Used to compute means and in the covariance numerator.',
      },
      {
        symbol: '∑x², ∑y²',
        name: 'Sum of Squares',
        description: 'The sum of each x value squared and each y value squared. Used in the denominator to normalize the correlation coefficient.',
      },
      {
        symbol: 'r',
        name: 'Pearson Correlation Coefficient',
        description: 'A standardized measure of linear correlation ranging from −1 (perfect negative) through 0 (no correlation) to +1 (perfect positive).',
      },
    ],
    howToUse: [
      'Enter paired X and Y values in the two text areas, separating numbers by commas, semicolons, spaces, or line breaks.',
      'Each dataset must contain at least 3 values, and both datasets must have the same number of values.',
      'The calculator computes the Pearson correlation coefficient r, along with r², covariance, and the means of both variables.',
      'Read the strength (Very strong, Strong, Moderate, Weak, or Very weak) and direction (Positive or Negative) of the relationship.',
      'Use the formula breakdown to verify each step of the calculation for learning or teaching purposes.',
    ],
    quickReference: [
      { label: 'r = +1.0', value: 'Perfect positive linear relationship' },
      { label: 'r = +0.7', value: 'Strong positive correlation' },
      { label: 'r = 0.0', value: 'No linear correlation' },
      { label: 'r = −0.7', value: 'Strong negative correlation' },
    ],
    commonUses: [
      'Analyzing the relationship between study hours and exam scores in educational research',
      'Measuring the correlation between advertising spend and sales revenue in marketing analytics',
      'Evaluating the relationship between temperature and energy consumption in utility forecasting',
      'Assessing test-retest reliability in psychological and medical measurements',
      'Investigating correlations between economic indicators such as GDP growth and unemployment rates',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="250" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor">Scatter Plot with Correlation Line</text><rect x="40" y="40" width="340" height="260" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="40" y1="220" x2="380" y2="80" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-dasharray="6,3"/><circle cx="100" cy="200" r="4" fill="var(--svg-ef4444)"/><circle cx="150" cy="180" r="4" fill="var(--svg-ef4444)"/><circle cx="200" cy="150" r="4" fill="var(--svg-ef4444)"/><circle cx="220" cy="160" r="4" fill="var(--svg-ef4444)"/><circle cx="260" cy="130" r="4" fill="var(--svg-ef4444)"/><circle cx="300" cy="120" r="4" fill="var(--svg-ef4444)"/><circle cx="310" cy="110" r="4" fill="var(--svg-ef4444)"/><circle cx="340" cy="100" r="4" fill="var(--svg-ef4444)"/><circle cx="180" cy="170" r="4" fill="var(--svg-ef4444)"/><circle cx="280" cy="125" r="4" fill="var(--svg-ef4444)"/><text x="30" y="170" text-anchor="middle" font-size="12" fill="currentColor" transform="rotate(-90,30,170)">Y Values</text><text x="210" y="320" text-anchor="middle" font-size="12" fill="currentColor">X Values</text><text x="210" y="370" text-anchor="middle" font-size="13" fill="currentColor">Positive Correlation (r &asymp; 0.9) &mdash; points cluster near the line</text></svg>',
      alt: 'Scatter plot showing a cluster of red data points with an upward-sloping blue dashed trend line, illustrating a positive correlation',
      caption: 'Scatter plot demonstrating a strong positive linear correlation (r ≈ 0.9)',
    },
    explanation:
      'The Pearson correlation coefficient, denoted as r, is the most widely used measure of linear association between two continuous variables. Developed by Karl Pearson in the late 19th century, it is computed as the covariance of the two variables divided by the product of their standard deviations. This normalization ensures that r is always between −1 and +1, regardless of the scales of the original variables. The square of r, called the coefficient of determination (r²), represents the proportion of variance in one variable that is predictable from the other variable. For example, an r of 0.8 means that 64% (0.8² = 0.64) of the variability in Y can be explained by X. It is crucial to note that correlation does not imply causation — a high correlation between two variables may be due to a confounding third variable, coincidence, or reverse causation. Additionally, Pearson r only captures linear relationships; variables with a strong nonlinear relationship (such as a U-shaped curve) may have an r close to zero even though they are clearly related. Always visualize your data with a scatter plot before interpreting correlation coefficients.',
    faqs: [
      {
        question: 'What is the difference between correlation and causation?',
        answer: 'Correlation measures the strength and direction of a statistical relationship between two variables, but it does not prove that one variable causes the other. A high correlation could be due to a hidden third variable (confounder), pure coincidence, or reverse causation. For example, ice cream sales and drowning incidents are highly correlated, but ice cream does not cause drowning — both are driven by hot weather (the confounder).',
      },
      {
        question: 'What does an r value of 0 mean?',
        answer: 'An r value of 0 means there is no linear correlation between the two variables. However, the variables could still have a nonlinear relationship (e.g., a parabolic or sinusoidal pattern). Always examine a scatter plot alongside the correlation coefficient to detect nonlinear patterns.',
      },
      {
        question: 'How many data points do I need for a reliable correlation?',
        answer: 'While the minimum is 3 data points, reliable correlation estimates typically require at least 10–30 paired observations. With very small samples, the correlation coefficient can be heavily influenced by individual data points (outliers). Statistical significance testing (p-value) should also be considered for small samples.',
      },
      {
        question: 'What is the difference between Pearson and Spearman correlation?',
        answer: 'Pearson correlation measures linear relationships and requires continuous, normally distributed data. Spearman correlation is a rank-based measure that captures monotonic relationships (linear or nonlinear) and works with ordinal data or data that violates normality assumptions. Spearman is less sensitive to outliers than Pearson.',
      },
      {
        question: 'Can r be greater than 1 or less than −1?',
        answer: 'No. The Pearson correlation coefficient is mathematically bounded between −1 and +1 inclusive. Values outside this range indicate a calculation error. If you compute r manually, double-check that the denominator (the product of standard deviations) is positive and correctly computed.',
      },
    ],
    citations: [
      { source: 'Pearson Correlation Coefficient — Wikipedia', url: 'https://en.wikipedia.org/wiki/Pearson_correlation_coefficient' },
      { source: 'NIST — Correlation', url: 'https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc442.htm' },
    ],
  },
};

export default correlationConfig;
