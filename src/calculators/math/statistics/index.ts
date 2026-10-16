import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import StatisticsPanel from './StatisticsPanel';
import { parseDataset, summarize, fmtDec, ignoredRow, type QuartileMethod } from '../../../utils/stats';

const QUARTILE_METHODS: Record<QuartileMethod, string> = {
  halves: 'Median of halves (textbooks, TI-83/84)',
  inclusive: 'Inclusive / linear (Excel QUARTILE.INC, R type 7, NumPy)',
  exclusive: 'Exclusive (Excel QUARTILE.EXC, R type 6, Minitab)',
};

const statisticsConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'data',
      label: 'Data Set',
      type: 'text',
      placeholder: 'e.g. 12, 15, 22, 24, 25, 30, 33, 38, 45, 52',
      required: true,
      inputMode: 'decimal',
      helpText: 'Enter numbers separated by commas, spaces, or semicolons. Works with decimals and negative values.',
    },
    {
      id: 'type',
      label: 'Data Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Sample (estimate of a larger population)', value: 'sample' },
        { label: 'Population (entire group)', value: 'population' },
      ],
    },
    {
      id: 'quartileMethod',
      label: 'Quartile Method',
      type: 'select',
      options: (Object.keys(QUARTILE_METHODS) as QuartileMethod[]).map((k) => ({ label: QUARTILE_METHODS[k], value: k })),
      helpText: 'Textbooks, Excel and R disagree on quartiles for small data sets; pick the convention your course or software uses.',
    },
  ],
  calculate: (values) => {
    const { values: data, ignored } = parseDataset(values.data);
    const isSample = values.type !== 'population';
    const method: QuartileMethod = values.quartileMethod === 'inclusive' || values.quartileMethod === 'exclusive' ? values.quartileMethod : 'halves';

    if (data.length < 3) return [];

    // Exact decimal engine (src/utils/stats.ts); mean/SD/variance are exact, not rounded between steps.
    const sum = summarize(data, method);
    const s = sum.sorted;
    const n = sum.n;
    const q = { q1: sum.q1, q2: sum.median, q3: sum.q3, iqr: sum.iqr };
    const out = sum.outliers;
    const m = sum.mean;
    const sd = isSample ? sum.sdSample! : sum.sdPop;
    const variance = isSample ? sum.varianceSample! : sum.variancePop;
    const fmt = (num: typeof m) => fmtDec(num, 8);

    return [
      {
        id: 'count',
        label: 'Count (n)',
        value: n.toString(),
        color: 'neutral' as const,
      },
      {
        id: 'mean',
        label: 'Mean',
        value: fmt(m),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'stddev',
        label: `Std Deviation (${isSample ? 's' : 'σ'})`,
        value: fmt(sd),
        color: 'neutral' as const,
      },
      {
        id: 'variance',
        label: `Variance (${isSample ? 's²' : 'σ²'})`,
        value: fmt(variance),
        color: 'neutral' as const,
      },
      {
        id: 'min',
        label: 'Minimum',
        value: fmt(s[0]),
        color: 'neutral' as const,
      },
      {
        id: 'q1',
        label: 'Q1 (First Quartile)',
        value: fmt(q.q1),
        color: 'neutral' as const,
      },
      {
        id: 'q2',
        label: 'Q2 (Median)',
        value: fmt(q.q2),
        color: 'neutral' as const,
      },
      {
        id: 'q3',
        label: 'Q3 (Third Quartile)',
        value: fmt(q.q3),
        color: 'neutral' as const,
      },
      {
        id: 'max',
        label: 'Maximum',
        value: fmt(s[n - 1]),
        color: 'neutral' as const,
      },
      {
        id: 'iqr',
        label: 'IQR (Interquartile Range)',
        value: fmt(q.iqr),
        color: 'neutral' as const,
      },
      {
        id: 'range',
        label: 'Range',
        value: fmt(s[n - 1].minus(s[0])),
        color: 'neutral' as const,
      },
      {
        id: 'outliers',
        label: 'Outliers',
        value: out.length === 0
          ? 'None detected'
          : out.map(fmt).join(', '),
        color: out.length > 0 ? 'negative' as const : 'neutral' as const,
      },
      {
        id: 'outlierCount',
        label: 'Outlier Count',
        value: out.length.toString(),
        color: 'neutral' as const,
      },
      {
        id: 'fences',
        label: 'Fences (Lower, Upper)',
        value: `[${fmt(sum.lowerFence)}, ${fmt(sum.upperFence)}]`,
        color: 'neutral' as const,
      },
      ...ignoredRow(ignored),
      {
        id: '_boxPlotData',
        label: '',
        value: JSON.stringify({
          min: s[0].toNumber(),
          q1: q.q1.toNumber(),
          median: q.q2.toNumber(),
          q3: q.q3.toNumber(),
          max: s[n - 1].toNumber(),
          mean: m.toNumber(),
          whiskerLo: (s.find((d) => !out.includes(d)) ?? s[0]).toNumber(),
          whiskerHi: ([...s].reverse().find((d) => !out.includes(d)) ?? s[n - 1]).toNumber(),
          outliers: out.map((d) => d.toNumber()),
        }),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(StatisticsPanel, { values, results });
  },
  educational: {
    formula: 'Q1 = median of lower half | Q3 = median of upper half | IQR = Q3 − Q1 | Outliers = x < Q1−1.5×IQR or x > Q3+1.5×IQR',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Box Plot &amp; Quartiles</text><text x="220" y="55" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Data distribution showing quartiles and outliers</text><line x1="40" y1="200" x2="400" y2="200" stroke="var(--svg-999999)" stroke-width="1.5"/><line x1="80" y1="190" x2="80" y2="210" stroke="var(--svg-666666)" stroke-width="2"/><text x="80" y="225" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Min</text><line x1="155" y1="190" x2="155" y2="210" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="155" y="225" text-anchor="middle" font-size="11" fill="var(--svg-3b82f6)">Q1</text><line x1="220" y1="190" x2="220" y2="210" stroke="var(--svg-ef4444)" stroke-width="2.5"/><text x="220" y="225" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)">Median</text><line x1="285" y1="190" x2="285" y2="210" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="285" y="225" text-anchor="middle" font-size="11" fill="var(--svg-3b82f6)">Q3</text><line x1="360" y1="190" x2="360" y2="210" stroke="var(--svg-666666)" stroke-width="2"/><text x="360" y="225" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Max</text><rect x="155" y="170" width="130" height="30" fill="var(--svg-3b82f6)" fill-opacity=".12" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="80" y1="185" x2="155" y2="185" stroke="var(--svg-666666)" stroke-width="1.5"/><line x1="285" y1="185" x2="360" y2="185" stroke="var(--svg-666666)" stroke-width="1.5"/><text x="220" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-3b82f6)">IQR (middle 50%)</text><text x="220" y="260" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Five-Number Summary</text><text x="220" y="280" text-anchor="middle" font-size="12" fill="var(--svg-555555)">Min, Q1, Median, Q3, Max</text><text x="220" y="300" text-anchor="middle" font-size="12" fill="var(--svg-555555)">IQR = Q3 &minus; Q1 measures spread of middle 50%</text><text x="220" y="320" text-anchor="middle" font-size="12" fill="var(--svg-555555)">Outliers: x &lt; Q1&minus;1.5&times;IQR or x &gt; Q3+1.5&times;IQR</text></svg>',
      alt: 'Box-and-whisker plot showing minimum, first quartile, median, third quartile, maximum, and interquartile range',
      caption: 'A box plot visualizes data spread through the five-number summary and IQR',
    },
    formulaDescription:
      'A box-and-whisker plot (Tukey box plot) visualizes the spread of data through five key numbers: minimum, Q1 (first quartile), median (Q2), Q3 (third quartile), and maximum. The interquartile range (IQR) measures the spread of the middle 50% of data. Data points beyond 1.5xIQR from the quartiles are considered mathematical outliers.',
    variables: [
      { symbol: 'Q1', name: 'First Quartile (25th percentile)', description: 'The median of the lower half of the data. 25% of values fall below Q1. Also called the lower quartile.' },
      { symbol: 'Q2', name: 'Median (50th percentile)', description: 'The middle value of the sorted data set. Same as Q2 in the five-number summary.' },
      { symbol: 'Q3', name: 'Third Quartile (75th percentile)', description: 'The median of the upper half of the data. 75% of values fall below Q3. Also called the upper quartile.' },
      { symbol: 'IQR', name: 'Interquartile Range', description: 'The range of the middle 50% of data: Q3 - Q1. Resistant to outliers, unlike the full range.' },
      { symbol: 'σ/s', name: 'Standard Deviation', description: 'A measure of data spread. sigma is used for population, s for sample (uses n-1 for unbiased estimate).' },
    ],
    howToUse: [
      'Enter your data set as numbers separated by commas, spaces, or semicolons.',
      'Select whether the data represents a sample (most common) or the full population.',
      'View the comprehensive summary statistics including quartiles, IQR, minimum, maximum, mean, and standard deviation.',
      'The box-and-whisker plot visually shows the data distribution with the median, quartiles, and any highlighted outliers.',
      'Outliers beyond 1.5xIQR from the quartiles are flagged for investigation.',
    ],
    explanation:
      'Descriptive statistics summarize and organize data so it can be easily understood. The five-number summary (minimum, Q1, median, Q3, maximum) provides a complete picture of data spread with just five values. The box plot was invented by John Tukey in 1970 and has become the standard way to visualize statistical distributions. Outliers -- data points more than 1.5xIQR from the quartiles -- are flagged because they may represent measurement errors, data entry mistakes, or genuinely unusual values that warrant investigation. The difference between sample and population standard deviation is critical: sample standard deviation uses n-1 (Bessel\'s correction) to provide an unbiased estimate of the population parameter. Without this correction, the sample standard deviation would tend to underestimate the true population value, especially for small samples. The IQR is a robust measure of spread because it ignores the extreme 25% of values on each side, making it resistant to outliers. A small IQR relative to the range indicates that most data is concentrated in the middle, while a large IQR indicates wide dispersion in the central portion of the data.',
    commonUses: [
      'Quality control in manufacturing: monitoring part dimensions with box plots to detect production drift before defects occur',
      'Finance: analyzing stock return distributions to identify unusual trading days and assess portfolio risk through the interquartile range',
      'Education: comparing test score distributions across classrooms or schools to identify achievement gaps and outliers',
      'Healthcare: analyzing patient wait times and lab results to identify facilities with unusually long delays or abnormal readings',
      'Environmental science: comparing pollution measurements across monitoring stations to detect sources of contamination spikes',
    ],
    workedExamples: [
      {
        scenario: 'Dr. Patel, a quality control engineer, is monitoring the fill weight of 500mL bottled beverages. She samples 10 bottles from today\'s production run and gets: 498, 501, 503, 497, 502, 500, 499, 504, 496, 502 mL. She needs to check if any fills are statistical outliers and report the IQR.',
        inputs: { data: '498, 501, 503, 497, 502, 500, 499, 504, 496, 502', type: 'sample' },
        result: 'Q1=498, Median=500.5, Q3=502, IQR=4; Fences [492, 508]; 0 outliers detected',
        insight: 'Sorted: 496, 497, 498, 499, 500, 501, 502, 502, 503, 504. Q1=498, Median=500.5, Q3=502, IQR=4. The fences are 492 and 508. All fills fall within the fences, so there are no outliers. The tight IQR of 4mL indicates excellent process control. Dr. Patel can report that fill variation is well within acceptable limits.',
      },
      {
        scenario: 'Marcus, a real estate analyst, is evaluating sale prices in a neighborhood. Last month\'s sales were: $285,000, $310,000, $295,000, $305,000, $1,200,000, $290,000, $300,000, $315,000. The $1.2M sale was a commercial property that was accidentally included. Marcus wants to confirm it is a statistical outlier.',
        inputs: { data: '285000, 310000, 295000, 305000, 1200000, 290000, 300000, 315000', type: 'sample' },
        result: 'Q1=$292,500, Q3=$312,500, IQR=$20,000; Upper fence $342,500; 1 outlier detected: $1,200,000',
        insight: 'The $1.2M sale is well beyond the upper fence and is flagged as an outlier. Marcus should remove it from the residential analysis. After removal, the remaining 7 sales have a mean of about $300,000 with an IQR of $20,000, giving a much more accurate picture of the residential market.',
      },
      {
        scenario: 'Lisa, a biology teacher, has her students measure the growth of bean plants over 30 days. The results (in cm) are: 12.5, 14.2, 11.8, 13.9, 3.2, 15.1, 13.4, 12.9, 14.6, 13.1. One student\'s plant barely grew. Lisa wants to check if it is a statistical outlier before discussing experimental errors with the class.',
        inputs: { data: '12.5, 14.2, 11.8, 13.9, 3.2, 15.1, 13.4, 12.9, 14.6, 13.1', type: 'sample' },
        result: 'Q1=12.5, Q3=14.2, IQR=1.7; Lower fence 9.95; 1 outlier detected: 3.2 cm',
        insight: 'Q1=12.5, Q3=14.2, IQR=1.7. Lower fence = 12.5 - 1.5×1.7 = 12.5 - 2.55 = 9.95. The 3.2cm value is well below the lower fence and is flagged as an outlier. Lisa can use this to discuss possible causes: the student may have overwatered, used poor soil, or measured incorrectly.',
      },
    ],
    proTips: [
      'Use the IQR instead of standard deviation when your data has extreme outliers or is heavily skewed. The IQR is computed from only the middle 50% of data, so a single wild value cannot inflate it the way it inflates variance.',
      'When comparing two or more groups, overlay their box plots side by side rather than comparing means alone. Box plots reveal differences in spread, skewness, and outliers that a single number like the mean completely obscures.',
      'Always investigate outliers flagged by the 1.5xIQR rule before deciding to exclude them. Many of the most important scientific discoveries (ozone hole, gravitational waves) started as data points that looked like "outliers" but turned out to be the signal.',
      'The five-number summary (Min, Q1, Median, Q3, Max) gives you everything you need for a box plot: draw the box from Q1 to Q3, draw the median line inside the box, and draw whiskers to the min and max. It takes 30 seconds on paper.',
      'For small datasets (n < 10), be cautious about outlier detection. With very few data points, the quartile boundaries are coarsely estimated and may flag legitimate values as outliers.',
    ],
    limitations: [
      'Do not use this calculator for data with fewer than 3 values -- quartiles require at least 3 points to be meaningful.',
      'The 1.5xIQR outlier rule assumes roughly symmetric data; for heavily skewed distributions (exponential, lognormal), consider using Grubbs test or the modified Z-score method instead.',
      'Do not use this tool to make causal inferences -- correlation analysis requires a different calculator. Outlier detection is a descriptive tool, not a test of causation.',
      'Do not use IQR-based outlier detection on time series data where outliers may be events rather than errors. Seasonal spikes, regime changes, and structural breaks are not "outliers" to be removed.',
      'Quartiles default to the median-of-halves method (the median is left out of both halves when n is odd; used by many textbooks and the TI-83/84). Excel, R, NumPy and Minitab use interpolation instead and give different Q1/Q3 for small data sets: for 85, 92, 78, 95, 88 the three methods in the Quartile Method menu give Q1 = 81.5 (halves), 85 (inclusive) and 81.5 (exclusive). Pick the one your course or software uses.',
    ],
    quickReference: [
      { label: 'Five-number summary', value: 'Min, Q1, Median, Q3, Max' },
      { label: 'IQR', value: 'Q3 - Q1 (spread of middle 50%)' },
      { label: 'Lower fence', value: 'Q1 - 1.5 x IQR' },
      { label: 'Upper fence', value: 'Q3 + 1.5 x IQR' },
      { label: 'Sample SD', value: 'Divides by n-1 (Bessel correction)' },
      { label: 'Population SD', value: 'Divides by n (exact parameter)' },
      { label: 'Mild outlier', value: '1.5 to 3 x IQR beyond the quartiles' },
      { label: 'Extreme outlier', value: 'More than 3 x IQR beyond the quartiles' },
    ],
    faqs: [
      {
        question: 'How do you identify outliers?',
        answer: 'Outliers are identified using the 1.5xIQR rule. Calculate IQR = Q3 - Q1. The lower fence is Q1 - 1.5xIQR and the upper fence is Q3 + 1.5xIQR. Any data point below the lower fence or above the upper fence is flagged. This rule, proposed by John Tukey, is calibrated so that for normally-distributed data, only about 0.7% of values would be flagged as outliers by chance alone.',
      },
      {
        question: 'What is the difference between sample and population?',
        answer: 'A population includes every member of a group. A sample is a subset used to estimate population parameters. Sample standard deviation divides by n-1 instead of n (Bessel\'s correction) to give an unbiased estimate. If you have data for everyone in your group (e.g., all students in a class), use "population." If you have a sample drawn from a larger group (e.g., a survey of 100 people), use "sample."',
      },
      {
        question: 'What does the IQR tell me?',
        answer: 'The IQR measures the spread of the middle 50% of your data. A small IQR means the middle half of your data is tightly clustered. A large IQR means it is spread out. Unlike the range, the IQR is not affected by outliers -- it is a robust measure of spread. For skewed data (income, house prices), the IQR is a far more reliable measure of dispersion than standard deviation.',
      },
      {
        question: 'Why are there multiple methods for computing quartiles?',
        answer: 'Different software packages and textbooks use slightly different algorithms for quartile calculation. The default here (median of halves) computes Q1 as the median of the lower half and Q3 as the median of the upper half, excluding the overall median when n is odd. Excel QUARTILE.INC, R type 7 and NumPy interpolate at position (n−1)p; Excel QUARTILE.EXC, R type 6 and Minitab interpolate at (n+1)p. R has 9 quantile algorithms (types 1-9) in total, and you can choose among the three most common ones with the Quartile Method menu. For large datasets, the differences are negligible; for small datasets (n < 20) they can be visible.',
      },
      {
        question: 'Should I always remove outliers from my data?',
        answer: 'No. Outliers flagged by the 1.5xIQR rule are mathematical flags -- not automatic grounds for removal. Investigate each outlier first: is it a data entry error, a measurement mistake, or a genuine extreme value? Genuine extreme values (like the wealth of billionaires in income data, or an earthquake of magnitude 9.0 in seismic data) contain important information and should typically be kept. Removing them without justification constitutes data manipulation and can bias your results.',
      },
      {
        question: 'How do I know if my data is normally distributed?',
        answer: 'A quick visual check: if your data is normally distributed, the box plot will have roughly symmetric whiskers and the median will sit near the center of the box. The distance from Q1 to Median should be approximately equal to the distance from Median to Q3. For a formal test, use a normality test like Shapiro-Wilk or the Kolmogorov-Smirnov test, or create a Q-Q plot. The 68-95-99.7 rule (empirical rule) only applies when data is approximately normal.',
      },
      {
        question: 'What is the difference between range, IQR, and standard deviation?',
        answer: 'Range = Max - Min: uses only the two most extreme values, highly sensitive to outliers, gives a quick sense of total spread. IQR = Q3 - Q1: uses the middle 50%, robust to outliers, tells you the spread of the typical data. Standard Deviation: uses every data point, measured in the original units, tells you the average distance from the mean. Use range for a quick sense, IQR when outliers are present, and SD when data is symmetric and you need to apply the empirical rule.',
      },
      {
        question: 'Can I use the box plot to detect skewness?',
        answer: 'Yes. In a symmetric distribution, the median sits near the center of the box, and the whiskers are roughly equal in length. In a right-skewed distribution, the upper whisker is longer than the lower whisker, and the median is closer to Q1. In a left-skewed distribution, the lower whisker is longer, and the median is closer to Q3. Skewness visible in the box plot is a sign that you should use the median (not the mean) for your central tendency reporting.',
      },
    ],
    citations: [
      { source: 'NIST - Engineering Statistics Handbook', url: 'https://www.itl.nist.gov/div898/handbook/' },
      { source: 'Wikipedia - Box Plot', url: 'https://en.wikipedia.org/wiki/Box_plot' },
      { source: 'Tukey, J.W. - Exploratory Data Analysis (1977)', url: 'https://en.wikipedia.org/wiki/Exploratory_Data_Analysis' },
    ],
  },
};

export default statisticsConfig;
