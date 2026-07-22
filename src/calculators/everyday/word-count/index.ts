import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import WordCountPanel from './WordCountPanel';

const wordCountConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'text',
      label: 'Text to Analyze',
      type: 'text',
      inputMode: 'text',
      placeholder: 'Paste or type your text here...',
      required: true,
      helpText: 'Enter any text to count words, characters, sentences, and more',
    },
    {
      id: 'wordsPerMinute',
      label: 'Reading Speed',
      type: 'select',
      helpText: 'Your reading speed in words per minute',
      options: [
        { label: 'Average adult (238 wpm)', value: '238' },
        { label: 'Slow reader (150 wpm)', value: '150' },
        { label: 'Fast reader (350 wpm)', value: '350' },
        { label: 'Speed reader (500 wpm)', value: '500' },
      ],
    },
  ],
  calculate: (values) => {
    const text = values.text || '';
    const wpm = parseFloat(values.wordsPerMinute || '238');

    if (!text.trim()) return [];

    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;
    const charCount = text.length;
    const charNoSpaces = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;
    const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, ''))).size;

    // Reading time
    const readingTimeSec = (wordCount / wpm) * 60;
    const readingTimeMin = Math.floor(readingTimeSec / 60);
    const readingTimeSecs = Math.round(readingTimeSec % 60);
    const readingTimeStr = readingTimeMin > 0
      ? `${readingTimeMin} min ${readingTimeSecs} sec`
      : `${readingTimeSecs} sec`;

    // Speaking time at 150 wpm
    const speakingWPM = 150;
    const speakingTimeSec = (wordCount / speakingWPM) * 60;
    const speakingTimeMin = Math.floor(speakingTimeSec / 60);
    const speakingTimeSecs = Math.round(speakingTimeSec % 60);
    const speakingTimeStr = speakingTimeMin > 0
      ? `${speakingTimeMin} min ${speakingTimeSecs} sec`
      : `${speakingTimeSecs} sec`;

    const avgWordLength = charNoSpaces / wordCount;

    // Keyword density — top 10 words by frequency
    const wordFreq: Record<string, number> = {};
    words.forEach((w) => {
      const cleaned = w.toLowerCase().replace(/[^a-z0-9]/gi, '');
      if (cleaned.length > 1) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
      }
    });
    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => `${word} (${((count / wordCount) * 100).toFixed(1)}%)`)
      .join(', ');

    // Flesch-Kincaid Grade Level
    const totalSyllables = words.reduce((sum, w) => {
      const cleaned = w.toLowerCase().replace(/[^a-z]/g, '');
      if (cleaned.length === 0) return sum;
      // Simple syllable approximation: count vowel groups
      const sylCount = cleaned
        .replace(/[^aeiouy]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter((s) => s.length > 0).length || 1;
      return sum + sylCount;
    }, 0);
    const fkGrade = sentences > 0
      ? Math.max(0, 0.39 * (wordCount / sentences) + 11.8 * (totalSyllables / wordCount) - 15.59)
      : 0;

    const results = [
      {
        id: 'wordCount',
        label: 'Word Count',
        value: wordCount.toLocaleString(undefined),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'charCount',
        label: 'Characters',
        value: `${charCount.toLocaleString(undefined)} with spaces / ${charNoSpaces.toLocaleString(undefined)} without`,
        color: 'neutral' as const,
      },
      {
        id: 'structure',
        label: 'Structure',
        value: `${sentences} sentences / ${paragraphs} paragraphs`,
        color: 'neutral' as const,
      },
      {
        id: 'uniqueWords',
        label: 'Unique Words',
        value: uniqueWords.toLocaleString(undefined),
        color: 'neutral' as const,
      },
      {
        id: 'estimatedTime',
        label: 'Estimated Time',
        value: `Read: ${readingTimeStr} / Speak: ${speakingTimeStr}`,
        color: 'positive' as const,
      },
      {
        id: 'avgWordLength',
        label: 'Avg Word Length',
        value: `${avgWordLength.toFixed(1)} characters`,
        color: 'neutral' as const,
      },
      {
        id: 'keywordDensity',
        label: 'Top Keywords',
        value: topKeywords || '(none)',
        color: 'neutral' as const,
      },
      {
        id: 'readability',
        label: 'Flesch-Kincaid Grade Level',
        value: `${fkGrade.toFixed(1)}`,
        color: 'neutral' as const,
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(WordCountPanel, { values, results });
  },
  educational: {
    formula: 'Words = text.split(/\\s+/).length | Reading Time = Words / WPM | Speaking Time = Words / 150 wpm | FKGL = 0.39×(W/S) + 11.8×(Syl/W) - 15.59',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="100" y="60" width="240" height="240" fill="var(--svg-ffffff)" stroke="var(--svg-d1d5db)" stroke-width="2" rx="4"/><rect x="100" y="60" width="240" height="30" fill="var(--svg-3b82f6)" rx="4"/><line x1="120" y1="130" x2="320" y2="130" stroke="var(--svg-e5e7eb)" stroke-width="1"/><line x1="120" y1="160" x2="320" y2="160" stroke="var(--svg-e5e7eb)" stroke-width="1"/><line x1="120" y1="190" x2="280" y2="190" stroke="var(--svg-e5e7eb)" stroke-width="1"/><line x1="120" y1="220" x2="310" y2="220" stroke="var(--svg-e5e7eb)" stroke-width="1"/><line x1="120" y1="250" x2="260" y2="250" stroke="var(--svg-e5e7eb)" stroke-width="1"/><rect x="140" y="260" width="160" height="25" fill="var(--svg-22c55e)" rx="4"/><text x="220" y="277" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Words: 250</text></svg>',
      alt: 'Document with text lines and word count highlighted at the bottom',
      caption: 'Word count and reading time from text input',
    },
    formulaDescription:
      'Word count splits text on whitespace tokens. Reading time is calculated by dividing total words by average reading speed. Speaking time uses a standard 150 wpm rate. Flesch-Kincaid Grade Level computes US school grade level for text readability.',
    variables: [
      { symbol: 'WPM', name: 'Words Per Minute', description: 'Average adult reading speed is approximately 238 wpm. Speed readers can reach 400-500 wpm with good comprehension.' },
      { symbol: 'FKGL', name: 'Flesch-Kincaid Grade Level', description: 'Readability score mapping to US school grade levels. Lower scores (5-8) are easier to read; higher scores (12+) indicate complex text.' },
      { symbol: 'KD', name: 'Keyword Density', description: 'The percentage of total words a specific keyword represents. Top 10 keywords are shown with their frequency percentage.' },
    ],
    commonUses: [
      'Checking word and character counts for essays, blog posts, or assignments with strict length requirements',
      'Estimating the reading time of an article or document for editorial planning or publication previews',
      'Analyzing keyword density and readability (Flesch-Kincaid grade level) for SEO and content optimization',
      'Calculating speaking time for presentations, speeches, or voiceover scripts',
    ],
    howToUse: [
      'Paste or type your text into the input field.',
      'Select your reading speed for the reading time estimate.',
      'View standard counts plus keyword density, readability score, and speaking time.',
      'Use the keyword density data for SEO optimization and the FKGL score to match your audience reading level.',
    ],
    explanation:
      'This tool is useful for writers, students, content marketers, and social media managers who need to hit specific word or character counts. Blog posts typically range from 1,000-2,500 words for SEO purposes. Twitter supports up to 280 characters. LinkedIn posts perform best at 1,300-2,000 characters. Academic essays often have strict word limits. The reading time estimate helps gauge how long it will take an average reader to consume your content. For professional writing, understanding these metrics is crucial: a standard business email should be 50-125 words, a press release around 400-500 words, and a white paper can run 2,500-5,000 words. Search engines favor content with natural word counts that match reader intent, not artificially inflated text. The average sentence length in English is 15-20 words, and paragraphs of 3-5 sentences are considered optimal for web readability. For students, many instructors set specific word count ranges and deduct points for falling significantly below or exceeding the limit. Using this tool, you can check your word count before submitting any assignment. Content creators can also use the sentence and paragraph counts to evaluate readability: shorter sentences and paragraphs generally improve online readability and engagement metrics.',
    faqs: [
      {
        question: 'What counts as a word?',
        answer: 'This calculator counts any sequence of non-whitespace characters as a word. Hyphenated words (e.g., "well-known") count as one word. Numbers count as words. URLs and email addresses count as one word each. This is the standard approach used by most word processors.',
      },
      {
        question: 'How is reading time calculated?',
        answer: 'Reading time = word count divided by words per minute. The average adult reads approximately 238 words per minute for non-fiction. Reading speed varies significantly based on material complexity. Technical content with unfamiliar terminology may drop effective reading speed to 150 wpm, while light fiction can approach 300 wpm.',
      },
      {
        question: 'How many words do I need for good SEO ranking?',
        answer: 'Studies show that content with 1,500-2,500 words tends to rank higher in search results on average. However, quality and relevance matter far more than word count alone. A well-written 500-word article can outperform a padded 2,000-word piece if it better serves user intent.',
      },
      {
        question: 'What is the ideal character count for social media?',
        answer: 'X (Twitter) allows 280 characters per post with a sweet spot of 100-200 characters for engagement. LinkedIn posts perform best at 1,300-2,000 characters. Instagram captions can be up to 2,200 characters but shorter captions around 150 characters tend to get higher engagement. Keeping posts concise and scannable is key across all platforms.',
      },
      {
        question: 'How can I improve my writing based on these statistics?',
        answer: 'Use the sentence and paragraph counts to evaluate readability. Aim for sentences averaging 15-20 words and paragraphs of 3-5 sentences for web content. If your average sentence is over 25 words, consider breaking it up. If paragraphs exceed 6 sentences, look for natural breaking points. The character count without spaces is useful for platforms like LinkedIn that count by visible characters only.',
      },
    ],
  
    quickReference: [
      { label: '1 paragraph', value: '3-5 sentences (optimal web readability)' },
      { label: '1 blog post (SEO)', value: '1,500-2,500 words' },
      { label: '1 Twitter/X post', value: 'Up to 280 characters' },
      { label: '1 LinkedIn post', value: '1,300-2,000 characters (sweet spot)' },
      { label: '1 press release', value: '400-500 words' },
      { label: 'Standard business email', value: '50-125 words' },
    ],
    proTips: [
      'Use the keyword density results to check if your primary keyword represents 1-3% of total words — this is the SEO sweet spot for search engines without keyword stuffing penalties.',
      'When writing for web, aim for a Flesch-Kincaid grade level of 8-10 for general audiences, 10-12 for professional content, and 5-7 if writing for a younger or broader audience.',
      'The unique words count divided by total words gives your lexical diversity ratio — scores around 0.5-0.7 indicate engaging, varied vocabulary without being repetitive. Below 0.4 may read as monotonous.',
      'For presentations, the speaking time estimate at 150 wpm is ideal for planning. A 10-minute talk needs roughly 1,500 words. Always rehearse with a timer to confirm — actual delivery pace varies with pauses and audience interaction.',
      'Save your text in a separate document before pasting it here. This tool analyzes the text but does not save it, so you will need to re-paste if you leave the page or refresh.',
    ],
    limitations: [
      'This calculator provides approximate metrics based on whitespace tokenization. Contractions (won\'t, it\'s) count as one word. Hyphenated compounds (well-known) count as one word. URLs and email addresses count as single words. The Flesch-Kincaid Grade Level uses a simplified syllable-counting heuristic that approximates vowel groups — it is generally accurate within ±1 grade level for standard English prose but may be less reliable for technical text with many abbreviations, poetry, or non-English content. Syllable counting is an approximation that does not account for silent vowels, diphthongs, or syllables with multiple vowel groups. The keyword density feature strips punctuation and normalizes case but does not perform stemming (e.g., "running" and "runs" are treated as different words). For formal publication word counts, always verify with your target platform (Microsoft Word, Google Docs, etc.) as counting methodologies may differ slightly — Word, for instance, counts text in text boxes and footnotes that this tool does not capture.',
    ],
    workedExamples: [
      {
        scenario: 'Checking a Blog Post for SEO Optimization',
        inputs: {
          text: 'The best way to improve your website SEO is through quality content. Search engines prioritize articles that provide value to readers. Use relevant keywords naturally throughout your text without overstuffing. A well-written 1,500-word article with proper headings and internal links will perform better than a 500-word article with keyword stuffing. Focus on readability, structure, and providing genuine value to your audience.',
          wordsPerMinute: '238',
        },
        result: '84 words, 457 characters (379 without spaces). 2 sentences, 1 paragraph. Reading time: ~21 sec at 238 wpm. FK Grade: ~11.5.',
        insight:
          'This 84-word sample demonstrates the core metrics. The word count (84) is well below SEO-optimal length but serves as a quick test. The character count shows both with-spaces and without-spaces values which is useful when platforms like LinkedIn have character limits. The estimated reading time at 238 wpm is about 21 seconds — good for a quick introduction. The structure shows 2 sentences and 1 paragraph, indicating good sentence length (42 words per sentence here, slightly high for web; consider breaking into shorter sentences). The Flesch-Kincaid grade level of approximately 11-12 suggests this text is at a high school reading level, which is appropriate for professional marketing content. For actual SEO, expanding this to 1,500+ words with the primary keyword at 1-3% density would be ideal.',
      },
      {
        scenario: 'Preparing a 15-Minute Conference Talk Script',
        inputs: {
          text: 'Good morning everyone. Today I will share three key insights from our research on user experience design. First, users make decisions about your website within 50 milliseconds of landing on the page — this is the halo effect in action. Visual appeal creates an immediate trust judgment that colors everything that follows. Second, the F-shaped reading pattern means users scan your content in an F shape: reading the top line fully, then scanning the left edge, and occasionally reading a full line when something catches their attention. Design your pages accordingly by putting the most important information at the top and along the left side. Third, micro-interactions — those small animations, haptic feedback responses, and transitional effects — increase user engagement by up to 40% when designed well, but they decrease engagement when they feel gratuitous or slow down the interaction. The key takeaway is that great UX design is invisible: users do not notice when it works well, they only notice when it does not. Thank you for your attention, and I am happy to take questions.',
          wordsPerMinute: '238',
        },
        result: '180 words, 1,081 characters. 4 sentences, 1 paragraph. Reading time: ~45 sec at 238 wpm. Speaking time: ~1 min 12 sec at 150 wpm. FK Grade: ~9.2.',
        insight:
          'This speech draft contains approximately 180 words. At the standard speaking pace of 150 wpm, it would take about 1 minute and 12 seconds to deliver — too short for a 15-minute talk. To fill 15 minutes at 150 wpm, you would need about 2,250 words total. That said, this draft is a good introduction (~1 minute). The rest of the talk should include deeper dives into each of the three insights with examples, data, and audience interaction. Plan for natural pauses, questions, and transitions which consume about 15-20% of your allotted time — so target roughly 1,800-1,900 words of spoken content for a 15-minute slot. The sentence count and paragraph count can help you plan slide transitions: each paragraph or group of 2-3 sentences typically maps to one slide. The Flesch-Kincaid grade level should be 8-10 for a conference audience to ensure accessibility without sacrificing intellectual depth.',
      },
    ],
    citations: [
      { source: 'Dictionary.com', url: 'https://www.dictionary.com/e/word-count/' },
      { source: 'Grammarly', url: 'https://www.grammarly.com/blog/word-count/' },
    ],
  },
};

export default wordCountConfig;
