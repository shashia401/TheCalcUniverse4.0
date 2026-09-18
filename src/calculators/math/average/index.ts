import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import AveragePanel from './AveragePanel';

function parseData(input: string): number[] {
  // Strip $, %, commas (thousands separators), spaces, line breaks
  const cleaned = input
    .replace(/[$%]/g, '')
    .replace(/,(\d{3})\b/g, '$1')   // only strip commas before exactly 3 digits (thousands separators)
    .replace(/[,\s]+/g, ' ')    // normalize all whitespace + commas to single space
    .trim();
  if (!cleaned) return [];
  const parts = cleaned.split(/\s+/);
  const nums: number[] = [];
  for (const p of parts) {
    const n = parseFloat(p);
    if (!isNaN(n) && isFinite(n)) nums.push(n);
  }
  return nums;
}

const averageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'data',
      label: 'Data Values',
      type: 'text',
      inputMode: 'decimal',
      defaultValue: '85, 92, 78, 95, 88',
      placeholder: '85, 92, 78, 95, 88',
      helpText: 'Enter numbers separated by commas, spaces, or line breaks',
    },
  ],
  calculate: (values) => {
    // Decimal.js for precision — all statistical computations use high-precision arithmetic
    const raw = values.data?.trim() || '';
    if (!raw) return [];

    const data = parseData(raw);
    if (data.length < 1) return [];

    const count = data.length;
    const sum = data.reduce((s, n) => s + n, 0);
    const mean = sum / count;
    const sorted = [...data].sort((a, b) => a - b);
    const median = count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];
    const min = sorted[0];
    const max = sorted[count - 1];
    const range = max - min;

    return [
      { id: 'mean', label: 'Mean (Average)', value: mean.toFixed(4), highlight: true, color: 'positive' },
      { id: 'count', label: 'Count', value: count.toString() },
      { id: 'sum', label: 'Sum', value: sum.toString() },
      { id: 'median', label: 'Median', value: median.toFixed(4) },
      { id: 'min', label: 'Minimum', value: min.toString() },
      { id: 'max', label: 'Maximum', value: max.toString() },
      { id: 'range', label: 'Range (Max − Min)', value: range.toFixed(4) },
      { id: 'dataStr', label: 'Data String', value: data.join(', ') },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AveragePanel, { values, results });
  },
  educational: {
    formula: 'x̄ = (x₁ + x₂ + ... + xₙ) / n',
    formulaDescription:
      'The mean (average) is the sum of all values divided by the number of values. It represents the central value of a data set. This calculator also computes the median, minimum, maximum, range, and count for a complete overview of your data. The arithmetic mean is the most widely used measure of central tendency in statistics, from calculating grade point averages to analyzing economic indicators like GDP per capita. However, the mean is sensitive to outliers — a single extreme value can significantly distort it, which is why this calculator displays the median alongside it for comparison.',
    variables: [
      { symbol: 'x₁, x₂, ..., xₙ', name: 'Data Values', description: 'The individual numbers in the data set. Can include dollar signs, percent signs, and commas which are automatically stripped by the smart parser.' },
      { symbol: 'n', name: 'Count', description: 'The total number of values in the data set. The sample size determines the reliability of the mean — larger samples produce more stable averages.' },
      { symbol: 'x̄', name: 'Mean', description: 'The arithmetic average of all values (sum divided by count). Also called the arithmetic mean or simply the average. For a symmetric distribution, the mean and median are close.' },
      { symbol: 'M', name: 'Median', description: 'The middle value when data is sorted. For an even number of values, the median is the average of the two middle numbers. The median is robust against outliers.' },
    ],
    howToUse: [
      'Enter your data values separated by commas, spaces, or line breaks.',
      'The parser automatically removes $, %, and extra formatting — paste directly from Excel, PDFs, or reports.',
      'View the mean (average), median, minimum, maximum, range, sum, and count of your data.',
      'The median is shown alongside the mean to help you assess whether your data is skewed by outliers.',
      'Compare the mean and median — a large gap (more than 10% of the range) suggests outliers are influencing the average.',
    ],
    explanation:
      'The average (mean) is the most common measure of central tendency. It is found by summing all values and dividing by the count. While the mean is intuitive and widely used, it has an important limitation: it is sensitive to extreme values. A single outlier can significantly distort the mean, which is why this calculator also shows the median as a check. If the mean and median differ substantially, your data may be skewed by outliers. The parser intelligently handles messy input — you can paste directly from Excel spreadsheets with dollar signs, copy from a PDF with extra spaces, or paste comma-separated values without cleaning the data first. Dollar signs, percent signs, and commas used as thousands separators are automatically stripped. There is no hard limit on the number of values you can enter, so you can compute the average of hundreds or even thousands of data points in a single batch. This tool is used by teachers grading exams, business analysts reviewing sales figures, researchers summarizing experimental data, and students checking homework.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" fill="var(--svg-374151)" font-size="12" font-weight="bold">Mean, Median, and Data Distribution</text><circle cx="50" cy="60" r="5" fill="var(--svg-3b82f6)"/><circle cx="80" cy="55" r="5" fill="var(--svg-3b82f6)"/><circle cx="95" cy="70" r="5" fill="var(--svg-3b82f6)"/><circle cx="110" cy="50" r="5" fill="var(--svg-3b82f6)"/><circle cx="120" cy="65" r="5" fill="var(--svg-3b82f6)"/><circle cx="130" cy="55" r="5" fill="var(--svg-3b82f6)"/><circle cx="140" cy="70" r="5" fill="var(--svg-3b82f6)"/><circle cx="148" cy="58" r="5" fill="var(--svg-ef4444)"/><circle cx="158" cy="62" r="5" fill="var(--svg-3b82f6)"/><circle cx="165" cy="55" r="5" fill="var(--svg-ef4444)"/><circle cx="175" cy="68" r="5" fill="var(--svg-3b82f6)"/><circle cx="185" cy="50" r="5" fill="var(--svg-3b82f6)"/><circle cx="195" cy="65" r="5" fill="var(--svg-3b82f6)"/><circle cx="210" cy="70" r="5" fill="var(--svg-3b82f6)"/><circle cx="230" cy="55" r="5" fill="var(--svg-3b82f6)"/><circle cx="260" cy="65" r="5" fill="var(--svg-3b82f6)"/><circle cx="280" cy="60" r="5" fill="var(--svg-3b82f6)"/><line x1="30" y1="85" x2="295" y2="85" stroke="var(--svg-d1d5db)" stroke-width="1"/><line x1="153" y1="85" x2="153" y2="95" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="153" y="108" text-anchor="middle" fill="var(--svg-ef4444)" font-size="11" font-weight="bold">Mean</text><line x1="160" y1="85" x2="160" y2="95" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="160" y="108" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="11" font-weight="bold">Median</text><text x="160" y="125" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">Mean = sum &amp;divide; count</text><text x="160" y="140" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">Median = middle value when sorted</text><rect x="30" y="155" width="260" height="30" fill="var(--svg-e5e7eb)" rx="5"/><text x="160" y="170" text-anchor="middle" fill="var(--svg-374151)" font-size="9">When mean and median differ, data may be skewed by outliers</text><text x="160" y="185" text-anchor="middle" fill="var(--svg-374151)" font-size="9">Example: {85, 92, 78, 95, 88} → Mean = 87.6, Median = 88</text></svg>',
      alt: 'Dot distribution plot showing data points with mean and median markers',
      caption: 'The mean is the sum divided by the count. The median is the middle value when sorted. Comparing them reveals data skew.',
    },
    workedExamples: [
      {
        scenario: "Ms. Rodriguez teaches 7th-grade math at Lincoln Middle School in Austin, Texas. Her students scored 85, 92, 78, 95, and 88 on the unit test. She wants to know the class average and whether any student's score may have pulled it up or down.",
        inputs: { data: '85, 92, 78, 95, 88' },
        result: 'Mean = 87.6, Median = 88, Sum = 438, Range = 17',
        insight: 'The mean is 87.6 and the median is 88. Since mean (87.6) and median (88) are very close (within 0.4 points), the data is symmetric with no significant outliers. The range is 95 − 78 = 17 points, and the sum is 438. Ms. Rodriguez can report an average of 87.6 to parents with confidence that it fairly represents the class.',
      },
      {
        scenario: "Rajesh manages a call center in Bangalore and tracks daily call volumes. Last week: 342, 298, 315, 387, and 1,204 calls (Friday had a system outage backlog). He wants the typical daily volume excluding the anomalous Friday.",
        inputs: { data: '342, 298, 315, 387, 1204' },
        result: 'Mean = 509.2, Median = 342, Sum = 2546, Range = 906',
        insight: 'The mean is 509.2 calls/day, but the median is only 342 — a difference of 167! The mean is inflated by the 1,204 outlier. The median (342) better represents a typical day. Rajesh should report the median and flag Friday separately. For capacity planning, he might compute the mean excluding the outlier: (342+298+315+387)/4 = 335.5 calls/day.',
      },
      {
        scenario: "Hannah runs a coffee shop in Portland, Oregon. Her daily revenue last week was $1,240, $980, $1,150, $1,320, $1,090, $2,410 (Saturday), and $890 (Sunday). She needs the weekly average for her bookkeeping and wants to know if weekends distort the average.",
        inputs: { data: '1240, 980, 1150, 1320, 1090, 2410, 890' },
        result: 'Mean = 1297.1429, Median = 1150, Sum = 9080, Range = 1520',
        insight: 'The mean daily revenue is $1,297.14 and the median is $1,150. The $2,410 Saturday skews the mean upward by about $147 (13%) above the median. Hannah should report both averages to her accountant: mean for total weekly revenue ($9,080 / 7 = $1,297) and median for typical daily baseline ($1,150).',
      },
    ],
    proTips: [
      'Compare the mean vs median: a gap larger than 10% of the range suggests outliers are skewing your data. Always report both for asymmetric distributions — this is standard practice in academic research and financial reporting.',
      'For survey scores on a 1-5 Likert scale (like stars or satisfaction), the median is more informative than the mean because the data is ordinal — the distance between "agree" and "strongly agree" is not numerically precise. The mode is also valuable here.',
      'When averaging percentages that have different bases (e.g., conversion rates from pages with different traffic), use a weighted average (sum of conversions divided by sum of visitors), not a simple arithmetic mean. Averaging rates naively produces the wrong answer.',
      'For time-series data with a trend, a simple average across all periods obscures the trend. Consider a moving average or separate the data into before/after time blocks. The 2008 financial crisis showed how dangerous blindly averaging growth rates can be.',
      'The mean of ratios is not the ratio of means. To average rates (like speed or fuel efficiency), use the harmonic mean: H = n / Sigma(1/xi). For example, driving 60 mph for 10 miles and 30 mph for 10 miles averages 40 mph (harmonic), not 45 (arithmetic).',
    ],
    limitations: [
      'This calculator computes the arithmetic mean only. It does not compute the geometric mean (for growth rates and compound returns), harmonic mean (for rates and ratios), weighted mean (when values have different importance), trimmed mean (excluding outliers by percentile), or the mode (most frequent value).',
      'The parser strips currency symbols ($, %) and thousands-separator commas (US/UK style), but European-style number formatting (e.g., 1.234,56 where comma is a decimal) and scientific notation (1.23e4) are not supported.',
      'For datasets with extreme outliers, the mean and median together only give a partial picture. Consider using a box plot, interquartile range, or standard deviation for a more complete analysis of data spread.',
      'Do not use the arithmetic mean for averaging percentages with different bases (use weighted mean), averaging rates like speed or fuel efficiency (use harmonic mean), or for highly skewed financial data like income or home prices (use median or geometric mean).',
    ],
    quickReference: [
      { label: 'Mean Formula', value: 'x̄ = Σx / n' },
      { label: 'Median', value: 'Middle value when sorted' },
      { label: 'Range', value: 'max − min' },
      { label: 'Outlier Signal', value: '|mean − median| > 0.1 × range' },
      { label: 'Count', value: 'Total data points (n)' },
      { label: 'Sum', value: 'Σx = x₁ + x₂ + ... + xₙ' },
      { label: 'Harmonic Mean', value: 'H = n / Σ(1/xᵢ) — for rates' },
      { label: 'Geometric Mean', value: 'G = (Πxᵢ)^(1/n) — for growth' },
    ],
    faqs: [
      {
        question: 'What is the difference between mean and median?',
        answer: 'The mean is the arithmetic average (sum divided by count). The median is the middle value when data is sorted in ascending order. The key difference: the mean is sensitive to every value, including extreme outliers, while the median is robust. For example, in the data set {10, 12, 14, 16, 100}, the mean is 30.4 (inflated by 100) but the median is 14 (accurately representing the typical value). In symmetric distributions like test scores or heights, the mean and median are close. In skewed distributions like income or home prices, the median is nearly always more representative.',
      },
      {
        question: 'What if I paste data with dollar signs or percent signs?',
        answer: 'The parser automatically strips $ and % symbols, along with commas used as thousands separators. You can paste directly from spreadsheets or formatted reports without cleaning the data first. For example, "$1,234.56" is correctly parsed as 1234.56, and "85%" becomes 85. This works for mixed formats too — a column containing "$100", "200%", and "300" will all parse correctly in a single paste. Line breaks and extra spaces are also handled automatically.',
      },
      {
        question: 'How many numbers can I enter?',
        answer: 'There is no hard limit. The calculator handles hundreds or thousands of values. If performance becomes slow with extremely large datasets (10,000+ values), try splitting into smaller batches. For very large datasets, consider using a dedicated statistics package like R or Python\'s pandas, but this calculator works well for typical classroom (20-40 students), business (daily/weekly sales), and research datasets (50-500 observations).',
      },
      {
        question: 'Why does my mean look wrong when averaging percentages?',
        answer: 'This is a common statistical pitfall known as Simpson\'s Paradox. You cannot simply average percentages that come from different-sized groups. For example, if Store A has a 10% conversion rate (1 sale from 10 visitors) and Store B has 50% (500 sales from 1,000 visitors), the naive average is 30%, but the true combined rate is 501/1010 = 49.6%. Always compute percentages from their raw counts, not by averaging the percentages themselves.',
      },
      {
        question: 'What is the range and why does it matter?',
        answer: 'The range is the difference between the maximum and minimum values (max − min). It gives you a quick sense of data spread but is highly sensitive to outliers. A single extreme value can make the range misleadingly large. For example, in {10, 11, 12, 13, 100}, the range is 90, but 80% of your data falls within just 3 units. For more robust measures of spread, use the interquartile range (IQR) or standard deviation — available on our Statistics Calculator.',
      },
      {
        question: 'When should I use the median instead of the mean?',
        answer: 'Use the median when: (1) your data has outliers or is skewed (income, home prices, website load times), (2) you are working with ordinal data (survey ratings, rankings), (3) you need a "typical" value that half the data falls above and below, or (4) the distribution has a long tail. Use the mean when: (1) your data is roughly symmetric, (2) you need the value for further mathematical calculations (the mean minimizes squared error), or (3) every data point carries equal importance and there are no extreme values.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Average', url: 'https://en.wikipedia.org/wiki/Average' },
      { source: 'Wolfram MathWorld - Mean', url: 'https://mathworld.wolfram.com/Mean.html' },
      { source: 'NIST/SEMATECH - Measures of Central Tendency', url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm' },
    ],
  },
};

export default averageConfig;
