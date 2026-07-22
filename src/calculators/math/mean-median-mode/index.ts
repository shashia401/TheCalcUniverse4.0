import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import MeanMedianModePanel from './MeanMedianModePanel';

// Decimal.js with 20-digit precision for consistent mean, sum, and range
// calculations — eliminates the floating-point approximation errors that can
// occur when summing many decimal values (e.g., 0.1 + 0.2 ≠ 0.3 in native JS).
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

function parseData(input: string): Decimal[] {
  const nums = input
    .split(/[,;\s]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => { try { return new Decimal(s); } catch { return null; } })
    .filter((d): d is Decimal => d !== null && d.isFinite());
  return nums;
}

function mean(arr: Decimal[]): Decimal {
  if (arr.length === 0) return new Decimal(0);
  return arr.reduce((s, v) => s.plus(v), new Decimal(0)).div(arr.length);
}

function median(arr: Decimal[]): { value: Decimal; sorted: Decimal[]; middleTwo: [Decimal, Decimal] | null } {
  const sorted = [...arr].sort((a, b) => a.comparedTo(b));
  const n = sorted.length;
  let value: Decimal;
  let middleTwo: [Decimal, Decimal] | null = null;

  if (n % 2 === 1) {
    value = sorted[Math.floor(n / 2)];
  } else {
    const mid = n / 2;
    middleTwo = [sorted[mid - 1], sorted[mid]];
    value = sorted[mid - 1].plus(sorted[mid]).div(2);
  }

  return { value, sorted, middleTwo };
}

function mode(arr: Decimal[]): Decimal[] {
  const freq = new Map<string, { value: Decimal; count: number }>();
  arr.forEach(v => {
    const key = v.toString();
    const entry = freq.get(key);
    if (entry) {
      entry.count++;
    } else {
      freq.set(key, { value: v, count: 1 });
    }
  });
  const maxFreq = Math.max(1, ...Array.from(freq.values()).map(e => e.count));
  if (maxFreq === 1) return [];
  return Array.from(freq.values())
    .filter(e => e.count === maxFreq)
    .map(e => e.value)
    .sort((a, b) => a.comparedTo(b));
}

function range(arr: Decimal[]): Decimal {
  if (arr.length === 0) return new Decimal(0);
  const max = Decimal.max(...arr);
  const min = Decimal.min(...arr);
  return max.minus(min);
}

const meanMedianModeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'data',
      label: 'Data Set',
      type: 'text',
      placeholder: 'e.g. 12, 15, 18, 20, 22, 25, 30',
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter numbers separated by commas, spaces, or semicolons',
    },
  ],
  calculate: (values) => {
    const data = parseData(values.data || '');
    if (data.length < 2) return [];

    const m = mean(data);
    const med = median(data);
    const mod = mode(data);
    const r = range(data);

    const fmt = (n: Decimal) => {
      if (n.isInteger() && n.abs().lessThan(1e15)) return n.toFixed(0);
      const str = n.toPrecision(10);
      return parseFloat(str).toString();
    };

    const results = [
      {
        id: 'mean',
        label: 'Mean (Average)',
        value: fmt(m),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'median',
        label: 'Median',
        value: fmt(med.value),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'mode',
        label: 'Mode',
        value: mod.length === 0 ? 'No mode (all values unique)' : mod.map(fmt).join(', '),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'range',
        label: 'Range',
        value: fmt(r),
        color: 'neutral' as const,
      },
      {
        id: 'sortedData',
        label: 'Sorted Data',
        value: med.sorted.map(fmt).join(', '),
        color: 'neutral' as const,
      },
      {
        id: 'dataCount',
        label: 'Count (n)',
        value: data.length.toString(),
        color: 'neutral' as const,
      },
      {
        id: 'sum',
        label: 'Sum',
        value: fmt(data.reduce((s, v) => s.plus(v), new Decimal(0))),
        color: 'neutral' as const,
      },
      ...(med.middleTwo
        ? [{
            id: 'medianDetail' as const,
            label: 'Median (Even Dataset)',
            value: `(${fmt(med.middleTwo[0])} + ${fmt(med.middleTwo[1])}) / 2 = ${fmt(med.value)}`,
            color: 'neutral' as const,
          }]
        : []),
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MeanMedianModePanel, { values, results });
  },
  educational: {
    formula: 'x̄ = Σx/n | Median = middle value (sorted) | Range = max − min',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Mean, Median &amp; Mode</text><line x1="40" y1="120" x2="400" y2="120" stroke="var(--svg-999999)" stroke-width="2"/><circle cx="80" cy="120" r="6" fill="var(--svg-3b82f6)"/><circle cx="130" cy="120" r="6" fill="var(--svg-3b82f6)"/><circle cx="180" cy="120" r="8" fill="var(--svg-ef4444)" stroke="var(--svg-ef4444)" stroke-width="2"/><circle cx="180" cy="120" r="6" fill="var(--svg-ef4444)"/><circle cx="180" cy="120" r="6" fill="var(--svg-3b82f6)"/><circle cx="240" cy="120" r="6" fill="var(--svg-3b82f6)"/><circle cx="300" cy="120" r="6" fill="var(--svg-3b82f6)"/><circle cx="350" cy="120" r="6" fill="var(--svg-3b82f6)"/><text x="180" y="145" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">Mode (most frequent)</text><text x="180" y="160" text-anchor="middle" font-size="12" fill="var(--svg-ef4444)">Value appears twice</text><line x1="180" y1="170" x2="180" y2="200" stroke="var(--svg-ef4444)" stroke-width="1" stroke-dasharray="3,2"/><text x="220" y="230" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Calculations</text><text x="220" y="253" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Mean = sum of all values ÷ count</text><text x="220" y="273" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Median = middle value when sorted</text><text x="220" y="293" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Mode = most frequently occurring value</text><text x="220" y="317" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Range = max value − min value</text></svg>',
      alt: 'Number line with data points as dots, one value highlighted as the mode, with labels for mean, median, and mode calculations',
      caption: 'Mean, median, and mode describe the center of a dataset in different ways',
    },
    formulaDescription:
      'Mean, median, mode, and range are the most fundamental measures of central tendency and spread in descriptive statistics. The mean is the arithmetic average, the median is the middle value when sorted, the mode is the most frequent value, and the range measures the spread between extreme values.',
    variables: [
      { symbol: 'x̄, Median', name: 'Mean & Median', description: 'Mean is the arithmetic average (sum/count), sensitive to outliers. Median is the middle value when sorted, resistant to outliers.' },
      { symbol: 'Mode', name: 'Mode', description: 'The most frequently occurring value(s). A dataset can have one mode (unimodal), multiple modes (multimodal), or no mode (all unique values). Useful for categorical data.' },
      { symbol: 'Range', name: 'Range', description: 'The difference between the maximum and minimum values. A simple but crude measure of spread, since it only uses two values and is highly sensitive to outliers.' },
    ],
    howToUse: [
      'Enter your data set as numbers separated by commas, spaces, or semicolons.',
      'View the mean, median, mode, and range calculated instantly in the results.',
      'The sorted data is shown below to help you verify the median calculation visually.',
      'For even-numbered datasets, the calculator shows the step-by-step median calculation: (middle value 1 + middle value 2) / 2.',
      'The sum and count are also displayed, useful for statistical reporting and further calculations.',
    ],
    explanation:
      'These four descriptive statistics are the foundation of exploratory data analysis. The mean is the most commonly used measure of central tendency, but it has a critical weakness: it is sensitive to outliers. A single extreme value can pull the mean in its direction, giving a misleading picture of a typical value. For example, if nine people earn $50,000 and one person earns $5,000,000, the mean is $545,000 -- which does not represent anyone in the group. The median ($50,000) is far more representative here. The median is preferred for skewed distributions like income, housing prices, and reaction times. The mode is unique among these statistics because it works with categorical data (fruit types, colors, brands) where mean and median are meaningless. The range is the simplest measure of spread but only uses the two most extreme values, making it highly sensitive to outliers. For a more robust measure of spread, use the interquartile range (IQR) available in the statistics calculator. Together, these statistics give a quick but comprehensive overview of any data set.',
    commonUses: [
      'Business: analyzing average customer spend (mean), typical order value (median), and most popular product (mode) from transaction data',
      'Education: computing class average test scores (mean), finding the middle-performing student (median), and identifying the most common score (mode)',
      'Real estate: comparing average home prices (mean) vs. median home prices -- the gap between them reveals income or price inequality',
      'Healthcare: calculating average patient recovery time (mean) and identifying the most common diagnosis in a hospital (mode)',
      'Sports analytics: computing player batting averages (mean), finding the median salary on a team, and identifying the most common score in a game',
    ],
    workedExamples: [
      {
        scenario: 'Elena, a small business owner, is analyzing daily coffee shop sales for the past week: $342, $298, $415, $389, $352, $1,105, $367. The $1,105 day was during a street festival. She wants to know the average daily sales and whether the mean or median gives a better picture of typical revenue.',
        inputs: { data: '342, 298, 415, 389, 352, 1105, 367' },
        result: 'Mean = $466.86, Median = $367, Mode = none, Range = $807. Mean is inflated by the $1,105 festival day — median of $367 is the better estimate of daily revenue.',
        insight: 'Mean = $466.86, Median = $367. The mean is inflated by $100 due to the single festival day. The median of $367 gives Elena a much better estimate of typical daily revenue for planning purposes. If she used the mean for inventory ordering, she would consistently over-order. She should use the median for daily operations and note the festival day separately.',
      },
      {
        scenario: 'Mr. Thompson, a math teacher, graded his students\' final exams. The scores were: 72, 85, 91, 78, 85, 63, 85, 94, 88, 76. He wants to report the class average, find the middle score, and identify if there is a most common score.',
        inputs: { data: '72, 85, 91, 78, 85, 63, 85, 94, 88, 76' },
        result: 'Mean = 81.7, Median = 85, Mode = 85 (appears 3 times), Range = 31. The mode of 85 is the most common score, and the median indicates half the class scored above 85.',
        insight: 'Mean = 81.7, Median = 85, Mode = 85. The mode of 85 appears three times -- it is the most common score. The median of 85 means half the students scored above 85 and half below. The mean of 81.7 is slightly below the median because one low score of 63 pulled the average down. Mr. Thompson can use these statistics to discuss whether the exam was appropriately challenging.',
      },
      {
        scenario: 'Raj, a product manager, surveyed customers about how many times they used his app last month. The responses: 15, 2, 8, 42, 7, 3, 12, 5, 0, 6, 4, 11. He needs to understand typical usage to set engagement targets.',
        inputs: { data: '15, 2, 8, 42, 7, 3, 12, 5, 0, 6, 4, 11' },
        result: 'Sorted: 0, 2, 3, 4, 5, 6, 7, 8, 11, 12, 15, 42. Mean = 9.58, Median = 6.5, Mode = none, Range = 42. Mean is pulled up by the power user with 42 sessions — median of 6.5 better represents a typical user.',
        insight: 'Sorted: 0, 2, 3, 4, 5, 6, 7, 8, 11, 12, 15, 42. Mean = 9.58, Median = 6.5. The mean of 9.58 is pulled up by the power user with 42 sessions. The median of 6.5 tells Raj that a typical user opens the app 6-7 times per month. If Raj targets 10 sessions/month as "engaged," more than half of users are currently below that threshold. The range of 42 reveals a massive gap between casual and power users that the product team should investigate.',
      },
    ],
    proTips: [
      'Always report the median alongside the mean. If they differ significantly, your data is skewed and the median is likely the better measure of "typical."',
      'The mode is the only measure of central tendency that works with categorical data. If you need to find the "average" color, brand, or category, the mode is your only option.',
      'For even-sized datasets, the median calculation averages the two middle values. This is correct but means the median may not match any actual data point -- that is normal and expected.',
      'The range is a quick-and-dirty measure of spread. For a more reliable picture, follow up with the IQR or standard deviation from the related statistics calculators.',
      'When data has multiple modes (bimodal or multimodal), it often means your dataset contains two or more distinct subpopulations. For example, test scores with modes at 65 and 90 might indicate two groups of students with different levels of preparation.',
    ],
    limitations: [
      'Do not use the mean when your data is heavily skewed or contains extreme outliers — the median is more appropriate in those cases.',
      'Do not use the mode for continuous data with many unique values, as it will likely report "no mode" or a meaningless value.',
      'Do not use mean/median/mode to compare groups with very different sample sizes without normalizing.',
      'Do not use the range alone as a measure of spread if your data has outliers — follow up with IQR or standard deviation.',
      'Do not use the mode as a substitute for proper frequency analysis when you need to understand the full distribution of categorical data.',
      'This calculator uses standard sample statistics formulas and does not compute confidence intervals, hypothesis tests, or trimmed/weighted means — use the statistics or descriptive-stats calculators for those advanced features.',
    ],
    quickReference: [
      { label: 'Mean (Average)', value: 'Sum of all values / count' },
      { label: 'Median (odd count)', value: 'Middle value of sorted data' },
      { label: 'Median (even count)', value: 'Average of two middle values' },
      { label: 'Mode', value: 'Most frequently occurring value' },
      { label: 'No mode', value: 'All values appear exactly once' },
      { label: 'Range', value: 'Maximum - Minimum' },
      { label: 'Data skewed right', value: 'Mean > Median (use median)' },
      { label: 'Data skewed left', value: 'Mean < Median (use median)' },
    ],
    faqs: [
      {
        question: 'What if all my numbers are unique?',
        answer: 'When every value appears exactly once, there is no mode. The calculator will display "No mode (all values unique)." Some textbooks say a data set with no repeating values has no mode, while others say every value is a mode. The calculator follows the convention of reporting no mode when all frequencies are equal to 1. In practice, this is common with continuous data like precise measurements.',
      },
      {
        question: 'How do you find the median with an even number of values?',
        answer: 'With an even number of values, there are two middle numbers. The median is their average: (x + y) / 2. For example, in the sorted set [2, 4, 6, 8], the median is (4 + 6) / 2 = 5. The calculator shows this step explicitly, displaying both middle numbers and the computed average so you can verify the calculation.',
      },
      {
        question: 'What is the difference between mean and median?',
        answer: 'The mean is the arithmetic average (sum divided by count). The median is the middle value when sorted. For symmetric distributions, they are close or identical. For skewed data (like income, housing prices, or earthquake magnitudes), the median better represents a typical value because it is not pulled by extreme outliers. When reporting statistics, both the mean and median are often provided -- the gap between them is itself informative about skewness.',
      },
      {
        question: 'Can a dataset have more than one mode?',
        answer: 'Yes. A dataset with two modes is called bimodal, and one with more than two is multimodal. Bimodal data often indicates two underlying subpopulations. For example, height data combining men and women is bimodal (peaks around 170cm and 183cm). When you see multiple modes, consider whether your data is actually a mix of distinct groups that should be analyzed separately.',
      },
      {
        question: 'When should I use the median instead of the mean?',
        answer: 'Use the median when your data is skewed, contains outliers, or is ordinal (like survey ratings 1-5). Use the mean when your data is roughly symmetric and you need a value that incorporates every data point. A practical rule of thumb: if the mean and median differ by more than 10%, your data is likely skewed and the median is the safer choice. Government statistics offices typically report median household income (not mean) because income distributions are always right-skewed.',
      },
      {
        question: 'What does the range tell me that the IQR does not?',
        answer: 'The range tells you the absolute boundaries of your data -- the total span from smallest to largest. This is useful for understanding the full extent of possible values (e.g., "temperatures ranged from -5 to 38 degrees this year"). The IQR ignores extremes and focuses on the middle 50%, which is better for understanding typical variation. Use range for context; use IQR for the statistical measure of spread.',
      },
      {
        question: 'Does the order I enter data matter?',
        answer: 'No. The calculator automatically sorts your data before computing the median and range. The sum, count, and mean are independent of order. You can enter numbers in any sequence -- messy, sorted, or random -- and the results will be identical.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Mean', url: 'https://en.wikipedia.org/wiki/Mean' },
      { source: 'NIST - Measures of Central Tendency', url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm' },
      { source: 'Wikipedia - Median', url: 'https://en.wikipedia.org/wiki/Median' },
    ],
  },
};

export default meanMedianModeConfig;
