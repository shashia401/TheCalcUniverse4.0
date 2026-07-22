import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import ReadingTimePanel from './ReadingTimePanel';

const readingTimeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'wordCount',
      label: 'Word Count',
      type: 'number',
      placeholder: '1000',
      min: 1,
      required: true,
      helpText: 'Total number of words to read',
    },
    {
      id: 'readingSpeed',
      label: 'Reading Speed',
      type: 'select',
      helpText: 'Your typical reading pace in words per minute',
      options: [
        { label: 'Slow (150 wpm)', value: '150' },
        { label: 'Average (200 wpm)', value: '200' },
        { label: 'Fast (250 wpm)', value: '250' },
        { label: 'Skimming (400 wpm)', value: '400' },
      ],
    },
    {
      id: 'includePauses',
      label: 'Include Pauses',
      type: 'select',
      options: [
        { label: 'No', value: 'none' },
        { label: 'Yes — light break', value: 'short' },
        { label: 'Yes — full break', value: 'full' },
      ],
      helpText: 'Whether to include short breaks for long reading sessions',
    },
    {
      id: 'contentType',
      label: 'Content Type',
      type: 'select',
      options: [
        { label: 'General', value: 'general' },
        { label: 'Technical', value: 'technical' },
        { label: 'Academic', value: 'academic' },
      ],
      helpText: 'Technical and academic content is slower to comprehend',
    },
  ],
  calculate: (values) => {
    const wordCount = parseInt(values.wordCount, 10);
    if (isNaN(wordCount) || wordCount < 1) return [];

    const readingSpeed = parseInt(values.readingSpeed || '200', 10);
    const pauses = values.includePauses || 'none';
    const contentType = values.contentType || 'general';

    const contentMultipliers: Record<string, number> = {
      general: 1.0,
      technical: 1.3,
      academic: 1.5,
    };
    const contentMultiplier = contentMultipliers[contentType] ?? 1.0;

    const baseTimeMinutes = wordCount / readingSpeed;
    const adjustedTimeMinutes = baseTimeMinutes * contentMultiplier;

    // Break calculation
    let totalBreakMinutes = 0;
    const breakItems: string[] = [];

    if (adjustedTimeMinutes >= 30 && pauses !== 'none') {
      if (pauses === 'short') {
        const shortBreakCount = Math.floor(adjustedTimeMinutes / 30);
        totalBreakMinutes = shortBreakCount * 5;
        if (shortBreakCount > 0) {
          breakItems.push(`${shortBreakCount} x 5-min break${shortBreakCount > 1 ? 's' : ''}`);
        }
      } else if (pauses === 'full') {
        const fullBreakCount = Math.floor(adjustedTimeMinutes / 60);
        totalBreakMinutes = fullBreakCount * 15;
        if (fullBreakCount > 0) {
          breakItems.push(`${fullBreakCount} x 15-min break${fullBreakCount > 1 ? 's' : ''}`);
        }
      }
    }

    const totalMinutes = adjustedTimeMinutes + totalBreakMinutes;

    // Format time nicely: "1 hour 30 minutes" or "45 minutes"
    const formatMinutes = (mins: number): string => {
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      if (h > 0 && m > 0) {
        return `${h} hour${h !== 1 ? 's' : ''} ${m} minute${m !== 1 ? 's' : ''}`;
      }
      if (h > 0) {
        return `${h} hour${h !== 1 ? 's' : ''}`;
      }
      if (m > 0) {
        return `${m} minute${m !== 1 ? 's' : ''}`;
      }
      return 'Less than a minute';
    };

    const estimatedPages = Math.ceil(wordCount / 250);

    const results: CalculatorResult[] = [
      {
        id: 'readingTime',
        label: 'Estimated Reading Time',
        value: formatMinutes(totalMinutes),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'totalWords',
        label: 'Total Words',
        value: wordCount.toLocaleString(undefined),
        color: 'neutral',
      },
      {
        id: 'readingSpeed',
        label: 'Reading Speed',
        value: `${readingSpeed} wpm`,
        color: 'neutral',
      },
      {
        id: 'estimatedPages',
        label: 'Estimated Pages (at 250 words/page)',
        value: estimatedPages.toLocaleString(undefined),
        color: 'neutral',
      },
    ];

    if (totalBreakMinutes > 0) {
      results.push({
        id: 'breakDetails',
        label: 'Recommended Breaks',
        value: breakItems.join(', '),
        color: 'neutral',
      });
    }

    if (contentType !== 'general') {
      const adjLabel = contentType === 'technical' ? 'Technical' : 'Academic';
      results.push({
        id: 'contentAdjustment',
        label: 'Content Adjustment',
        value: `${adjLabel} (x${contentMultiplier})`,
        color: 'neutral',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ReadingTimePanel, { values, results });
  },
  educational: {
    formula:
      'Reading Time = Word Count / Reading Speed x Content Multiplier + Optional Breaks',
    formulaDescription:
      'Reading time is estimated by dividing the total word count by your reading speed (measured in words per minute), then adjusting for content complexity. Technical and academic materials take longer to comprehend than general text because they introduce unfamiliar terminology, complex sentence structures, and dense information that requires more cognitive processing. A content multiplier accounts for this difference. For long reading sessions extending beyond 30 minutes, optional pauses can be added to improve comprehension and reduce fatigue. Short breaks add 5 minutes per 30 minutes of reading, while full breaks add 15 minutes per 60 minutes of reading.',
    diagram: {
      svg: '<svg viewBox="0 0 440 260" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="10" y="0" width="420" height="260" fill="none" rx="8"/><text x="220" y="24" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Reading Time by Content Type (1,000 words at 200 wpm)</text><!-- General bar --><text x="55" y="68" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="end">General</text><rect x="65" y="54" width="160" height="22" rx="4" fill="var(--svg-22c55e)"/><text x="235" y="69" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">5.0 min (x1.0)</text><!-- Technical bar --><text x="55" y="108" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="end">Technical</text><rect x="65" y="94" width="208" height="22" rx="4" fill="var(--svg-f59e0b)"/><text x="283" y="109" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">6.5 min (x1.3)</text><!-- Academic bar --><text x="55" y="148" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="end">Academic</text><rect x="65" y="134" width="240" height="22" rx="4" fill="var(--svg-ef4444)"/><text x="315" y="149" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">7.5 min (x1.5)</text><!-- Scale line --><line x1="65" y1="180" x2="305" y2="180" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="65" y="197" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-94a3b8)">0</text><text x="185" y="197" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-94a3b8)" text-anchor="middle">5 min</text><text x="305" y="197" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-94a3b8)" text-anchor="end">10 min</text><!-- Footnote --><text x="220" y="230" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Technical and academic content takes 30-50% longer to read</text></svg>',
      alt: 'Horizontal bar chart comparing reading times for general (5 min), technical (6.5 min), and academic (7.5 min) content',
      caption:
        'Content type significantly affects reading time. Technical content takes 30% longer and academic content takes 50% longer than general content for the same word count.',
    },
    variables: [
      {
        symbol: 'WC',
        name: 'Word Count',
        description: 'The total number of words in the text to be read. This is the primary input that drives the reading time estimate.',
      },
      {
        symbol: 'WPM',
        name: 'Reading Speed',
        description: 'Your reading speed in words per minute. The average adult reads 200-250 wpm for general content, but this varies based on material complexity and individual skill.',
      },
      {
        symbol: 'CT',
        name: 'Content Type',
        description: 'The type of content being read: general (x1.0), technical (x1.3), or academic (x1.5). Dense or unfamiliar material requires more time to process and comprehend fully.',
      },
      {
        symbol: 'TT',
        name: 'Total Time',
        description: 'The final estimated reading time including content type adjustments and any optional breaks. This is the practical total time to budget for reading the text from start to finish.',
      },
    ],
    howToUse: [
      'Enter the word count of your text. You can get this from any word processor, the word count calculator on this site, or by estimating from page count (approx. 250 words per page).',
      'Select your reading speed and content type. Choose a slower speed and higher multiplier for dense technical or academic material, and a faster speed for light or familiar content.',
      'Optionally enable breaks for longer reading sessions (30+ minutes). The calculator will automatically add short 5-minute or full 15-minute breaks based on your selection and display the total estimated time.',
    ],
    quickReference: [
      { label: 'General content', value: 'x1.0 (baseline)' },
      { label: 'Technical content', value: 'x1.3 (30% longer)' },
      { label: 'Academic content', value: 'x1.5 (50% longer)' },
      { label: 'Standard page', value: '250 words' },
    ],
    commonUses: [
      'Plan article and blog post lengths to match reader attention spans and engagement windows for better content strategy',
      'Estimate audiobook narration duration for production scheduling and narrator cost estimation',
      'Schedule study sessions by calculating how long assigned academic readings will take to complete thoroughly',
    ],
    explanation:
      'Reading speed varies significantly from person to person and depends on multiple factors including the complexity of the material, the reader\'s familiarity with the subject matter, their purpose for reading (skimming for information vs. deep comprehension), and their overall reading proficiency. The average adult reads prose text at approximately 200 to 250 words per minute (wpm) with typical comprehension. However, reading dense technical documentation, academic papers, or content in a second language can reduce effective reading speed to 100-150 wpm. Conversely, skimming familiar content can increase apparent speed to 400 wpm or more, though at the cost of reduced comprehension. Research on reading suggests that comprehension and speed have a complex relationship: increasing speed beyond one\'s natural rate often leads to a decline in retention and understanding. The most effective approach is to match your reading speed to your purpose: read slowly and deliberately for complex material requiring deep understanding, and read more quickly for lighter content where general awareness is sufficient. Content type multipliers in this calculator are based on established readability research showing that specialized vocabulary, longer sentence structures, and abstract concepts increase cognitive load and processing time. To improve reading speed over time, try techniques like reducing subvocalization (the inner voice that reads aloud in your head), expanding your peripheral vision to take in more words per fixation, and practicing with progressively more difficult material. Regular reading itself is one of the most effective ways to improve both speed and comprehension over the long term.',
    faqs: [
      {
        question: 'How can I improve my reading speed?',
        answer: 'To improve reading speed, try reducing subvocalization (the habit of silently pronouncing each word as you read), practice chunking words together into groups, use a guide like your finger or a pen to track your eyes, and gradually push your pace slightly above your comfort zone. Regular practice with progressively challenging material helps build both speed and stamina over time. Most importantly, match your reading strategy to your goal: skim for overview, read at a moderate pace for general comprehension, and slow down for deep understanding of complex material.',
      },
      {
        question: 'Can I maintain comprehension at high reading speeds?',
        answer: 'Comprehension generally decreases as reading speed increases beyond your natural pace. Speed reading techniques like skimming and scanning are effective for getting the gist of a text but are not suitable for deep learning, critical analysis, or technical material where every detail matters. For academic and professional reading, maintaining 70-80% comprehension is generally considered acceptable. The best approach is to vary your reading speed based on the material: read complex or important content at a slower, more deliberate pace and use faster speeds for review or less critical passages.',
      },
      {
        question: 'How is the estimated page count calculated?',
        answer: 'The page count is estimated using the standard publishing industry convention of 250 words per page. This is the most commonly used metric in book publishing for estimating manuscript length and printed book size. A standard novel page contains roughly 250 words, though this can vary based on font size, margins, spacing, and trim size. Academic papers typically have around 300 words per double-spaced page, and mass-market paperbacks can have 300-350 words per page due to smaller formats. The 250-word standard provides a consistent baseline for estimation across different formats.',
      },
    ],
    citations: [
      {
        source: 'Forbes — Improve Your Reading Speed',
        url: 'https://www.forbes.com/sites/brettnelson/2022/06/01/how-to-improve-your-reading-speed/',
      },
      {
        source: 'American Psychological Association — Reading Comprehension Research',
        url: 'https://www.apa.org/pubs/journals/releases/xlm-34-3-564.pdf',
      },
    ],
  },
};

export default readingTimeConfig;
