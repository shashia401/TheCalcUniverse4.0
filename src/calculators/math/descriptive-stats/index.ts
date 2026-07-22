import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import DescriptiveStatsPanel from './DescriptiveStatsPanel';

function parseValues(input: string): number[] {
  if (!input || !input.trim()) return [];
  return input
    .trim()
    .split(/[\s,;]+/)
    .map((s) => parseFloat(s))
    .filter((v) => !isNaN(v));
}

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  if (n % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function quartiles(sorted: number[]): { q1: number; q2: number; q3: number } {
  const n = sorted.length;
  const q2 = median(sorted);

  const lowerHalf = sorted.slice(0, Math.floor(n / 2));
  const upperHalf = sorted.slice(Math.ceil(n / 2));

  const q1 = median(lowerHalf);
  const q3 = median(upperHalf);

  return { q1, q2, q3 };
}

function findMode(sorted: number[]): number[] {
  if (sorted.length === 0) return [];

  const freq: Map<number, number> = new Map();
  for (const v of sorted) {
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }

  let maxFreq = 0;
  for (const f of freq.values()) {
    if (f > maxFreq) maxFreq = f;
  }

  if (maxFreq <= 1) return [];

  const modes: number[] = [];
  for (const [val, f] of freq) {
    if (f === maxFreq) modes.push(val);
  }

  return modes.sort((a, b) => a - b);
}

const descriptiveStatsConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'data',
      label: 'Data Set',
      type: 'textarea',
      placeholder: 'Enter numbers: 1, 2, 3, 4, 5, 6, 7',
      required: true,
      helpText: 'Enter your dataset numbers separated by commas, spaces, or semicolons',
    },
  ],
  calculate: (values) => {
    const data = parseValues(values.data ?? '');

    if (data.length < 2) return [];

    const n = data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const med = median(sorted);
    const mode = findMode(sorted);
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    const variance =
      data.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / n;
    const stdDev = Math.sqrt(variance);

    const { q1, q3 } = quartiles(sorted);
    const iqr = q3 - q1;

    const fmt = (val: number): string => {
      if (Number.isInteger(val) && Math.abs(val) < 1e15) return val.toString();
      return parseFloat(val.toFixed(6)).toString();
    };

    const results = [
      {
        id: 'count',
        label: 'Count (n) / Sum',
        value: `${n} / ${fmt(sum)}`,
        color: 'neutral' as const,
      },
      {
        id: 'mean',
        label: 'Mean (Average)',
        value: fmt(mean),
        highlight: true,
        color: 'neutral' as const,
      },
      {
        id: 'median',
        label: 'Median',
        value: fmt(med),
        highlight: true,
        color: 'neutral' as const,
      },
      {
        id: 'mode',
        label: 'Mode',
        value: mode.length > 0 ? mode.map(fmt).join(', ') : 'No mode (all values appear once)',
        color: 'neutral' as const,
      },
      {
        id: 'range',
        label: 'Range',
        value: fmt(range),
        color: 'neutral' as const,
      },
      {
        id: 'variance',
        label: 'Variance (σ²) / Std Dev (σ)',
        value: `${fmt(variance)} / ${fmt(stdDev)}`,
        highlight: true,
        color: 'neutral' as const,
      },
      {
        id: 'minmax',
        label: 'Min / Max',
        value: `${fmt(min)} / ${fmt(max)}`,
        color: 'neutral' as const,
      },
      {
        id: 'quartiles',
        label: 'Q1 / Q3 / IQR',
        value: `${fmt(q1)} / ${fmt(q3)} / ${fmt(iqr)}`,
        color: 'neutral' as const,
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DescriptiveStatsPanel, { values, results });
  },
  educational: {
    formula: 'x̄ = ∑x / n,  Median = middle value (sorted),  σ² = ∑(x − x̄)² / n',
    formulaDescription:
      'Descriptive statistics summarize a dataset using measures of central tendency (mean, median, mode) and measures of dispersion (range, variance, standard deviation, IQR). The mean is the arithmetic average, the median is the middle value when sorted, the mode is the most frequent value, the variance measures the average squared deviation from the mean, the standard deviation is its square root, and quartiles divide the sorted data into four equal parts.',
    variables: [
      {
        symbol: 'n',
        name: 'Sample Size',
        description: 'The total number of observations in the dataset. Also called the count.',
      },
      {
        symbol: 'x̄',
        name: 'Sample Mean',
        description: 'The arithmetic average of all values, calculated by dividing the sum of all values by the count.',
      },
      {
        symbol: 'σ²',
        name: 'Variance',
        description: 'The average of the squared differences from the mean. Measures the spread of the data distribution.',
      },
      {
        symbol: 'σ',
        name: 'Standard Deviation',
        description: 'The square root of the variance. Expressed in the same units as the original data for interpretability.',
      },
      {
        symbol: 'Q1, Q3',
        name: 'First and Third Quartiles',
        description: 'Q1 is the median of the lower half of the data (25th percentile), and Q3 is the median of the upper half (75th percentile). Their difference is the IQR.',
      },
    ],
    howToUse: [
      'Enter your dataset in the text area, separating numbers by commas, spaces, semicolons, or line breaks.',
      'The calculator automatically computes all major descriptive statistics including mean, median, mode, range, variance, standard deviation, and quartiles.',
      'Review the highlighted results (mean, median, and standard deviation) for a quick summary of central tendency and spread.',
      'Use the quartile values (Q1, Q3, IQR) to understand the data distribution and identify potential outliers (values below Q1 − 1.5×IQR or above Q3 + 1.5×IQR).',
      'Compare the mean and median values — a large difference between them indicates a skewed distribution.',
    ],
    quickReference: [
      { label: 'Mean > Median', value: 'Right-skewed distribution (positive skew)' },
      { label: 'Mean ≈ Median', value: 'Approximately symmetric distribution' },
      { label: 'Mean < Median', value: 'Left-skewed distribution (negative skew)' },
    ],
    commonUses: [
      'Summarizing test scores and student performance data in educational assessment',
      'Analyzing survey responses and customer satisfaction ratings in market research',
      'Monitoring process quality metrics and manufacturing tolerances in quality control',
      'Describing patient vital signs and lab results in clinical research and healthcare analytics',
      'Evaluating financial returns, portfolio risk, and economic indicators in finance and economics',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 500 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="250" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor">Box-and-Whisker Plot (Five-Number Summary)</text><line x1="50" y1="120" x2="450" y2="120" stroke="currentColor" stroke-width="2"/><line x1="100" y1="100" x2="100" y2="140" stroke="currentColor" stroke-width="2"/><text x="100" y="160" text-anchor="middle" font-size="12" fill="currentColor">Min</text><text x="100" y="95" text-anchor="middle" font-size="11" fill="currentColor">' + String.fromCharCode(0x2423) + '</text><rect x="160" y="100" width="180" height="40" fill="var(--svg-3b82f6)" fill-opacity="0.3" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="160" y1="100" x2="160" y2="140" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="160" y="160" text-anchor="middle" font-size="12" fill="currentColor">Q1</text><line x1="250" y1="100" x2="250" y2="140" stroke="var(--svg-ef4444)" stroke-width="2.5"/><text x="250" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ef4444)">Median</text><line x1="340" y1="100" x2="340" y2="140" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="340" y="160" text-anchor="middle" font-size="12" fill="currentColor">Q3</text><line x1="400" y1="100" x2="400" y2="140" stroke="currentColor" stroke-width="2"/><text x="400" y="160" text-anchor="middle" font-size="12" fill="currentColor">Max</text><text x="250" y="195" text-anchor="middle" font-size="11" fill="currentColor">IQR = Q3 &minus; Q1 (interquartile range)</text><text x="250" y="215" text-anchor="middle" font-size="11" fill="currentColor">Whiskers extend to min and max (excluding outliers)</text><text x="250" y="250" text-anchor="middle" font-size="12" fill="currentColor">Mean: Σx/n &nbsp;&nbsp; Variance: Σ(x−x̄)²/n &nbsp;&nbsp; SD: √Variance</text></svg>',
      alt: 'Box-and-whisker plot showing the five-number summary: minimum, first quartile, median, third quartile, and maximum with formulas for mean, variance, and standard deviation',
      caption: 'Box plot visualization of the five-number summary with formulas for key descriptive statistics',
    },
    explanation:
      'Descriptive statistics form the foundation of data analysis by providing concise summaries of large datasets. The mean (arithmetic average) is the most common measure of central tendency, but it is sensitive to outliers — a single extreme value can pull the mean significantly in one direction. The median provides a robust alternative that is unaffected by outliers, making it the preferred measure for skewed distributions such as income data or housing prices. The mode is useful for categorical and discrete data, identifying the most common value(s). For dispersion, the range (max − min) gives a quick but crude measure of spread, while the interquartile range (IQR = Q3 − Q1) describes the spread of the middle 50% of the data, making it resistant to outliers. Variance and standard deviation quantify the average distance of data points from the mean: a small standard deviation means values cluster tightly around the mean, while a large one means they are spread out. In a normal distribution, approximately 68% of data falls within ±1 standard deviation, 95% within ±2, and 99.7% within ±3 (the empirical rule). Quartiles divide the sorted data into four equal parts: Q1 (25th percentile), Q2 / median (50th percentile), and Q3 (75th percentile). The IQR is the standard measure used in box plots and for outlier detection via the 1.5×IQR rule.',
    faqs: [
      {
        question: 'What is the difference between population and sample variance?',
        answer: 'Population variance divides by n (the total number of observations) and is used when you have data for the entire population. Sample variance divides by n − 1 (Bessel\'s correction) and is used when your data is a sample from a larger population. This calculator computes population variance, as specified for the task.',
      },
      {
        question: 'When should I use the median instead of the mean?',
        answer: 'Use the median when your data is skewed or contains outliers. The median is resistant to extreme values, while the mean is not. For example, median household income is a more meaningful measure than mean household income because a few very wealthy individuals would inflate the mean. For symmetric distributions without outliers, the mean and median should be approximately equal.',
      },
      {
        question: 'How do I interpret the standard deviation?',
        answer: 'The standard deviation is in the same units as the original data, making it directly interpretable. If the mean test score is 75 and the standard deviation is 10, most scores (about 68%) fall between 65 and 85. A small standard deviation relative to the mean indicates low variability; a large one indicates high variability.',
      },
      {
        question: 'What does the IQR tell me about my data?',
        answer: 'The interquartile range (IQR) measures the spread of the middle 50% of your data. It is resistant to outliers, unlike the range. The IQR is also used for outlier detection: any data point below Q1 − 1.5×IQR or above Q3 + 1.5×IQR is considered a mild outlier. The IQR is the length of the box in a box plot.',
      },
      {
        question: 'What if my dataset has multiple modes?',
        answer: 'When multiple values appear with the same highest frequency, the dataset is multimodal. This calculator lists all modes when there are ties. A dataset with two modes is bimodal (common in mixture distributions), while three or more is multimodal. If no value repeats (all frequencies = 1), there is no mode.',
      },
    ],
    citations: [
      { source: 'Descriptive Statistics — Wikipedia', url: 'https://en.wikipedia.org/wiki/Descriptive_statistics' },
      { source: 'NIST — Exploratory Data Analysis', url: 'https://www.itl.nist.gov/div898/handbook/eda/eda.htm' },
    ],
  },
};

export default descriptiveStatsConfig;
