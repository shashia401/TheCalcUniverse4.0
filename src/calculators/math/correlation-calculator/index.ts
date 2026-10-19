import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import CorrelationPanel from './CorrelationPanel';
import { parseDataset, pearson, spearman, fmtDec, ignoredRow, sumOf, D, type Dec } from '../../../utils/stats';
import { tTwoTail } from '../../../utils/distributions';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

/** Conventional |r| bands (Evans 1996); classified on the 4-decimal value that is displayed. */
function strengthOf(absR: number): string {
  if (absR >= 0.8) return 'Very strong';
  if (absR >= 0.6) return 'Strong';
  if (absR >= 0.4) return 'Moderate';
  if (absR >= 0.2) return 'Weak';
  return 'Very weak';
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
      helpText: 'Enter Y values separated by commas, spaces, or semicolons. You need the same number of Y values as X values (at least 3 pairs).',
    },
  ],
  calculate: (values) => {
    const xs = parseDataset(values.xValues);
    const ys = parseDataset(values.yValues);
    const xVals = xs.values;
    const yVals = ys.values;

    if (xVals.length < 3 || yVals.length < 3) return [];
    if (xVals.length !== yVals.length) return [];

    const n = xVals.length;
    // Exact two-pass decimal arithmetic (src/utils/stats.ts): the old n*Σxy − Σx*Σy shortcut cancels
    // catastrophically for data with a large common offset.
    const c = pearson(xVals, yVals);
    const ignored = [...xs.ignored, ...ys.ignored];
    const fmt4 = (d: Dec) => fmtDec(d.toDecimalPlaces(4), 12);

    // Sample covariance (n-1), like Excel COVARIANCE.S / numpy.cov; the population value is shown too.
    const covSample = c.sxy.div(n - 1);
    const covPop = c.sxy.div(n);

    if (!c.r) {
      // Zero variance in X or Y: r = 0/0 is undefined (not 0).
      return [
        {
          id: 'r',
          label: 'Pearson Correlation Coefficient (r)',
          value: 'Undefined',
          highlight: true,
          color: 'negative' as const,
          warning: 'One of the variables is constant (all values equal), so its standard deviation is 0 and r is undefined.',
        },
        { id: 'meanX', label: 'Mean of X', value: fmtDec(c.meanX), color: 'neutral' as const },
        { id: 'meanY', label: 'Mean of Y', value: fmtDec(c.meanY), color: 'neutral' as const },
        { id: 'n', label: 'Sample Size (n)', value: String(n), color: 'neutral' as const },
        ...ignoredRow(ignored),
      ];
    }

    const r = c.r;
    const rNum = r.toNumber();
    const rSquared = r.times(r);
    // Classify the 4-decimal value that is shown, so 0.79996 (displayed 0.8) is "Very strong", not "Strong".
    const absShown = r.abs().toDecimalPlaces(4).toNumber();
    const strength = strengthOf(absShown);
    const direction = rNum >= 0 ? 'Positive' : 'Negative';

    // Significance: t = r sqrt((n-2)/(1-r^2)), df = n-2, two-tailed (exact p = 0 only for |r| = 1).
    const df = n - 2;
    const t = Math.abs(rNum) >= 1 ? Infinity : (rNum * Math.sqrt(df)) / Math.sqrt(1 - rNum * rNum);
    const p = tTwoTail(t, df);
    const rho = spearman(xVals, yVals);

    const slope = c.sxx.isZero() ? null : c.sxy.div(c.sxx);
    const intercept = slope ? c.meanY.minus(slope.times(c.meanX)) : null;

    const sumX = sumOf(xVals);
    const sumY = sumOf(yVals);
    const sumXY = xVals.reduce((acc, x, i) => acc.plus(x.times(yVals[i])), new D(0));
    const sumX2 = xVals.reduce((acc, x) => acc.plus(x.times(x)), new D(0));
    const sumY2 = yVals.reduce((acc, y) => acc.plus(y.times(y)), new D(0));
    const f = (d: Dec) => fmtDec(d, 20);

    const pText = p < 0.0001 ? '< 0.0001' : p.toFixed(4);

    return [
      {
        id: 'r',
        label: 'Pearson Correlation Coefficient (r)',
        value: fmt4(r),
        highlight: true,
        color: rNum >= 0 ? ('positive' as const) : ('negative' as const),
      },
      {
        id: 'rSquared',
        label: 'Coefficient of Determination (r²)',
        value: fmt4(rSquared),
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
        id: 'pValue',
        label: `p-value (two-tailed t-test, df = ${df})`,
        value: pText,
        color: p < 0.05 ? ('positive' as const) : ('neutral' as const),
        interpretation:
          p < 0.05
            ? `p ${p < 0.0001 ? '< 0.0001' : '= ' + pText} is below 0.05: the correlation is statistically significant at the 5% level.`
            : `p = ${pText} is not below 0.05: with n = ${n} this correlation is not statistically significant at the 5% level.`,
      },
      {
        id: 'spearman',
        label: 'Spearman Rank Correlation (ρ, ties averaged)',
        value: rho ? fmt4(rho) : 'Undefined',
        color: 'neutral' as const,
      },
      {
        id: 'meanX',
        label: 'Mean of X',
        value: fmtDec(c.meanX),
        color: 'neutral' as const,
      },
      {
        id: 'meanY',
        label: 'Mean of Y',
        value: fmtDec(c.meanY),
        color: 'neutral' as const,
      },
      {
        id: 'covariance',
        label: 'Covariance (sample, n − 1)',
        value: fmtDec(covSample),
        color: 'neutral' as const,
      },
      {
        id: 'covariancePop',
        label: 'Covariance (population, n)',
        value: fmtDec(covPop),
        color: 'neutral' as const,
      },
      ...(slope && intercept
        ? [
            {
              id: 'regression',
              label: 'Least-Squares Line (y = a + bx)',
              value: `y = ${fmtDec(intercept, 14)} ${slope.isNegative() ? '−' : '+'} ${fmtDec(slope.abs(), 14)}x`,
              color: 'neutral' as const,
            },
          ]
        : []),
      {
        id: 'n',
        label: 'Sample Size (n)',
        value: n.toString(),
        color: 'neutral' as const,
      },
      {
        id: 'formula',
        label: 'Formula Applied',
        value: `r = (${n}×${f(sumXY)} − ${f(sumX)}×${f(sumY)}) / √((${n}×${f(sumX2)} − ${f(sumX)}²)(${n}×${f(sumY2)} − ${f(sumY)}²)) = ${fmt4(r)}`,
        color: 'neutral' as const,
      },
      ...ignoredRow(ignored),
      { id: '_data', label: '', value: JSON.stringify({ r: rNum, r2: rSquared.toNumber(), rho: rho ? rho.toNumber() : null, p, n }) },
    ];
  },
  explainSteps: (values) => {
    const rows = correlationConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const r = resultValue(rows, 'r');
    if (!r || r === 'Undefined') return []; // a constant variable: r = 0/0 has no worked solution
    const c = pearson(parseDataset(values.xValues).values, parseDataset(values.yValues).values);
    const f = (d: Dec) => fmtDec(d, 10);
    const p = rows.find((row) => row.id === 'pValue')!;
    return [
      { label: 'Find the mean of each variable', expr: `x̄ = ${resultValue(rows, 'meanX')},  ȳ = ${resultValue(rows, 'meanY')}  (n = ${resultValue(rows, 'n')})` },
      {
        label: 'Add up how X and Y vary, alone and together',
        expr: `Sxy = Σ(x − x̄)(y − ȳ) = ${f(c.sxy)},  Sxx = Σ(x − x̄)² = ${f(c.sxx)},  Syy = Σ(y − ȳ)² = ${f(c.syy)}`,
      },
      {
        label: 'Divide: r = Sxy ÷ √(Sxx × Syy)',
        expr: `r = ${f(c.sxy)} ÷ √(${f(c.sxx)} × ${f(c.syy)}) = ${r}`,
        note: `${resultValue(rows, 'strength')}, ${resultValue(rows, 'direction')?.toLowerCase()} relationship.`,
      },
      { label: 'Square it to get r²', expr: `r² = ${resultValue(rows, 'rSquared')}`, note: 'The share of the ups and downs in Y that a straight line on X accounts for.' },
      {
        label: 'Test whether r could be chance (t-test, df = n − 2)',
        expr: `${p.label} = ${p.value}`,
        ...(p.interpretation ? { note: p.interpretation } : {}),
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
      'The calculator computes the Pearson correlation coefficient r, along with r², a two-tailed p-value (t-test with n − 2 degrees of freedom), the Spearman rank correlation (ties averaged), sample covariance, the least-squares line, and the means of both variables.',
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
        answer: 'Pearson correlation measures linear relationships between continuous variables (its p-value assumes roughly bivariate-normal data). Spearman correlation is a rank-based measure that captures monotonic relationships (linear or nonlinear) and works with ordinal data or data that violates normality assumptions. Spearman is less sensitive to outliers than Pearson.',
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
