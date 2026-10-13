import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import WpmTypingPanel from './WpmTypingPanel';
import { typingStats } from './wpmMath';

const wpmTypingTestConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sourceText',
      label: 'Source Text',
      type: 'textarea',
      placeholder: 'The quick brown fox jumps over the lazy dog',
      required: true,
      helpText: 'The text you were supposed to type',
    },
    {
      id: 'typedText',
      label: 'Your Typing',
      type: 'textarea',
      placeholder: 'Paste what you typed...',
      required: true,
      helpText: 'What you actually typed. Compared with the source as a whole, so one extra or missing letter counts as a single error.',
    },
    {
      id: 'timerMinutes',
      label: 'Test Duration (min)',
      type: 'number',
      defaultValue: '1',
      min: 0.25,
      max: 10,
      step: 0.25,
      helpText: 'How long you took, in minutes (0.25 = 15 seconds).',
    },
  ],
  calculate: (values) => {
    // The old "practice" mode never produced results; it is no longer offered but is still accepted and ignored.
    if (values.mode === 'practice') return [];
    const t = typingStats(values);
    if (!t) return [];
    const fmt = (n: number, decimals = 1) => n.toFixed(decimals);
    const n = (x: number) => x.toLocaleString('en-US');

    return [
      { id: 'grossWpm', label: 'Gross WPM', value: `${fmt(t.grossWpm)} wpm`, highlight: true, color: 'positive', interpretation: `${n(t.totalChars)} characters ÷ 5 ÷ ${t.minutes} min (one "word" = 5 characters).` },
      { id: 'netWpm', label: 'Net WPM', value: `${fmt(t.netWpm)} wpm`, highlight: true, color: 'positive', interpretation: `Only correctly typed characters count: ${n(t.correctChars)} ÷ 5 ÷ ${t.minutes} min.` },
      { id: 'accuracy', label: 'Accuracy', value: `${fmt(t.accuracy, 1)}%`, color: t.accuracy >= 90 ? 'positive' : t.accuracy >= 70 ? 'neutral' : 'negative' },
      { id: 'errorCount', label: 'Error Count', value: n(t.errorCount), color: t.errorCount === 0 ? 'positive' : 'negative', interpretation: 'Typed characters that do not match the source (wrong or extra letters).' },
      { id: 'totalChars', label: 'Total Characters Typed', value: n(t.totalChars), color: 'neutral' },
      { id: 'correctChars', label: 'Correct Characters', value: n(t.correctChars), color: 'positive' },
      { id: 'wordsAttempted', label: 'Words in Source', value: n(t.wordsInSource), color: 'neutral' },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(WpmTypingPanel, { values, results });
  },
  educational: {
    formula: 'Gross WPM = Characters Typed / 5 / Minutes | Accuracy (%) = Correct Characters / Characters Typed x 100 | Net WPM = Correct Characters / 5 / Minutes',
    formulaDescription:
      'Gross WPM calculates raw typing speed by dividing total characters typed by 5 (the standard word length in typing tests). Accuracy is the share of typed characters that match the source text; matching uses the longest common subsequence, so a single missed or extra letter is one error rather than throwing off everything after it. Net WPM counts only the correct characters (equal to gross speed multiplied by accuracy), giving a realistic measure of productive typing speed. Some tests instead subtract uncorrected errors per minute; the two definitions differ slightly.',
    diagram: {
      svg: '<svg viewBox="0 0 460 120" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Typing Speed Scale</text><!-- Speed gauge bar --><rect x="30" y="35" width="400" height="30" rx="15" fill="var(--svg-e2e8f0)"/><rect x="30" y="35" width="80" height="30" rx="15" fill="var(--svg-ef4444)" opacity="0.7"/><rect x="110" y="35" width="100" height="30" fill="var(--svg-f59e0b)" opacity="0.7"/><rect x="210" y="35" width="100" height="30" fill="var(--svg-22c55e)" opacity="0.7"/><rect x="310" y="35" width="120" height="30" rx="15" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="70" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">Slow</text><text x="160" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">Average</text><text x="260" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">Good</text><text x="370" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">Professional</text><text x="70" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">&lt; 20 WPM</text><text x="160" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">20-40 WPM</text><text x="260" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">40-60 WPM</text><text x="370" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">60+ WPM</text><text x="230" y="105" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Net WPM = Gross WPM × Accuracy % — Both speed and accuracy matter</text><text x="230" y="116" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-94a3b8)" text-anchor="middle">Gross = Total chars ÷ 5 ÷ minutes  |  Accuracy = Correct chars ÷ Total chars × 100</text></svg>',
      alt: 'Illustrative typing speed gauge: slow under 20 WPM, average 20-40, good 40-60, professional 60 and above',
      caption: 'Net WPM = Gross WPM × Accuracy. A typist at 50 WPM with 90% accuracy has a Net WPM of 45.',
    },
    variables: [
      { symbol: 'Gross WPM', name: 'Gross Words Per Minute', description: 'Raw typing speed calculated as total characters typed divided by 5 (standard word length). Does not account for errors.' },
      { symbol: 'Net WPM', name: 'Net Words Per Minute', description: 'Adjusted typing speed that accounts for errors. Calculated as Gross WPM multiplied by accuracy percentage. This is the most useful measure of productive typing speed.' },
      { symbol: 'Accuracy', name: 'Typing Accuracy Percentage', description: 'The percentage of characters typed correctly compared to the source text. Many typing courses suggest aiming for 95%+ accuracy.' },
    ],
    commonUses: [
      'Measuring your typing speed (WPM) and accuracy after a timed typing test to track improvement over time',
      'Comparing gross and net WPM to understand how much accuracy penalties affect your productive typing speed',
      'Identifying specific error counts and accuracy gaps to focus practice on problem areas',
      'Evaluating whether your typing speed meets requirements for transcription, data entry, or office job roles',
    ],
    howToUse: [
      'Paste the source text you were supposed to type.',
      'Paste what you actually typed into the "Your Typing" field.',
      'View your Gross WPM, Net WPM, and accuracy percentage instantly.',
      'Use the error count to identify areas for improvement.',
    ],
    explanation:
      'Words per minute (WPM) is the standard measure of typing speed, originating from the era of mechanical typewriters and secretarial skill testing. One "word" is standardized as 5 keystrokes, regardless of actual word length, making the metric consistent across different text samples. This standardization means that typing "a" (1 character) counts as 0.2 words, while typing "length" (6 characters) counts as 1.2 words. Gross WPM simply divides total keystrokes by 5, then by the time in minutes. Net WPM is the more meaningful metric because it penalizes errors: a typist at 100 WPM with 35% of characters wrong has a net speed of 65 WPM, no better than a steady 65 WPM typist with perfect accuracy. In real work, correcting mistakes costs extra time on top of that. Stenography (court reporting) can exceed 200 WPM. A large 2018 study of 136 million keystrokes from 168,000 volunteers (Dhakal et al., CHI 2018) found an average of about 52 WPM, with the fastest typists above 100 WPM; older figures often quote about 40 WPM. Touch typing (typing without looking at the keyboard) is generally faster than hunt-and-peck. Regular practice with deliberate focus on accuracy first, then speed, produces the fastest long-term improvement. Many typing tests use a 1-minute or 3-minute duration. This calculator uses the standard 5-character word length and aligns your typed text with the source (longest common subsequence) to count correct characters. Note that autocorrect and spell-check are disabled in formal typing tests because they mask true proficiency.',
    faqs: [
      {
        question: 'What is a good typing speed?',
        answer: 'A large 2018 study of 136 million keystrokes (Dhakal et al., CHI 2018) found an average of about 52 WPM, and older sources often quote about 40 WPM. Roughly 50-60 WPM is enough for most office work; 70-80 WPM is fast, and data-entry or transcription roles often ask for higher. Job requirements vary, so check the employer\'s own test. The ranges in the diagram are illustrative, not an official standard.',
      },
      {
        question: 'How can I improve my typing speed and accuracy?',
        answer: 'Focus on accuracy first, speed will follow. Practice with online typing tutors that emphasize proper finger placement on the home row. Use all fingers rather than hunt-and-peck. Practice for 15-30 minutes daily rather than long irregular sessions. Set goals for accuracy (95%+) before pushing for higher WPM. Take breaks to avoid developing bad habits from fatigue.',
      },
      {
        question: 'Does the keyboard type affect typing speed?',
        answer: 'Somewhat. Keyboards differ in key travel, feedback and layout, and some typists feel faster or more comfortable on one type, but the evidence for large speed gains is weak. Ergonomic keyboards can improve comfort for long sessions. The keyboard matters much less than technique and practice.',
      },
      {
        question: 'Why does accuracy matter more than raw speed?',
        answer: 'Errors cost time to correct. Every backspace and retype effectively doubles the time spent on that word. A typist doing 80 WPM with 75% accuracy has a net speed of only 60 WPM, which is slower than someone doing 65 WPM with 98% accuracy (net 63.7 WPM). In real-world typing, errors also break concentration and flow, leading to more errors downstream. Professional contexts value accuracy because incorrect data entry, mis-typed code, or typos in client communications have real costs beyond typing speed.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Words Per Minute', url: 'https://en.wikipedia.org/wiki/Words_per_minute' },
      { source: 'Wolfram MathWorld', title: 'Statistics', url: 'https://mathworld.wolfram.com/Statistics.html' },
    ],
  },
};

export default wpmTypingTestConfig;
