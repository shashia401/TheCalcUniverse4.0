import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import WpmTypingPanel from './WpmTypingPanel';

const wpmTypingTestConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      helpText: 'Calculate WPM or practice with a timer',
      options: [
        { label: 'Calculate WPM from typing', value: 'calculate-wpm' },
        { label: 'Practice typing (timer)', value: 'practice' },
      ],
    },
    {
      id: 'sourceText',
      label: 'Source Text',
      type: 'text',
      placeholder: 'The quick brown fox jumps over the lazy dog',
      required: true,
      helpText: 'The text you were supposed to type',
      showWhen: (values) => values.mode === 'calculate-wpm',
    },
    {
      id: 'typedText',
      label: 'Your Typing',
      type: 'text',
      placeholder: 'Paste what you typed...',
      required: true,
      helpText: 'What you actually typed for comparison',
      showWhen: (values) => values.mode === 'calculate-wpm',
    },
    {
      id: 'timerMinutes',
      label: 'Test Duration (min)',
      type: 'number',
      defaultValue: '1',
      min: 0.25,
      max: 10,
      step: 0.25,
      helpText: 'Duration of the typing test in minutes',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'calculate-wpm';

    if (mode === 'practice') {
      return [];
    }

    // calculate-wpm mode
    const sourceText = values.sourceText || '';
    const typedText = values.typedText || '';

    if (!sourceText.trim() || !typedText.trim()) return [];

    const totalChars = typedText.length;
    const sourceChars = sourceText.length;

    // Count correct characters at the same position
    let correctChars = 0;
    const compareLen = Math.min(sourceChars, totalChars);
    for (let i = 0; i < compareLen; i++) {
      if (sourceText[i] === typedText[i]) {
        correctChars++;
      }
    }
    // Characters in typed text beyond source text length are errors (extra chars)
    // already accounted for by comparing only up to sourceChars

    const errorCount = totalChars - correctChars;
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;

    // Gross WPM: (total typed characters / 5) / duration in minutes
    const durationMin = parseFloat(values.timerMinutes || '1');
    const grossWpm = totalChars / 5 / durationMin;

    // Net WPM: Gross WPM * (accuracy / 100)
    const netWpm = grossWpm * (accuracy / 100);

    const wordsAttempted = sourceText.trim().split(/\s+/).filter(Boolean).length;

    const fmt = (n: number, decimals = 1) => n.toFixed(decimals);

    return [
      {
        id: 'grossWpm',
        label: 'Gross WPM',
        value: `${fmt(grossWpm)} wpm`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'netWpm',
        label: 'Net WPM',
        value: `${fmt(netWpm)} wpm`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'accuracy',
        label: 'Accuracy',
        value: `${fmt(accuracy, 1)}%`,
        color: accuracy >= 90 ? 'positive' : accuracy >= 70 ? 'neutral' : 'negative',
      },
      {
        id: 'errorCount',
        label: 'Error Count',
        value: errorCount.toLocaleString(undefined),
        color: errorCount === 0 ? 'positive' : 'negative',
      },
      {
        id: 'totalChars',
        label: 'Total Characters Typed',
        value: totalChars.toLocaleString(undefined),
        color: 'neutral',
      },
      {
        id: 'correctChars',
        label: 'Correct Characters',
        value: correctChars.toLocaleString(undefined),
        color: 'positive',
      },
      {
        id: 'wordsAttempted',
        label: 'Words in Source',
        value: wordsAttempted.toLocaleString(undefined),
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(WpmTypingPanel, { values, results });
  },
  educational: {
    formula: 'Gross WPM = Total Characters Typed / 5 | Accuracy (%) = Correct Characters / Total Characters x 100 | Net WPM = Gross WPM x (Accuracy / 100)',
    formulaDescription:
      'Gross WPM calculates raw typing speed by dividing total characters typed by 5 (the standard word length in typing tests). Accuracy measures the percentage of correctly typed characters compared to the source text. Net WPM adjusts gross speed downward by the accuracy percentage, giving a realistic measure of productive typing speed.',
    diagram: {
      svg: '<svg viewBox="0 0 460 120" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Typing Speed Scale</text><!-- Speed gauge bar --><rect x="30" y="35" width="400" height="30" rx="15" fill="var(--svg-e2e8f0)"/><rect x="30" y="35" width="80" height="30" rx="15" fill="var(--svg-ef4444)" opacity="0.7"/><rect x="110" y="35" width="100" height="30" fill="var(--svg-f59e0b)" opacity="0.7"/><rect x="210" y="35" width="100" height="30" fill="var(--svg-22c55e)" opacity="0.7"/><rect x="310" y="35" width="120" height="30" rx="15" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="70" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">Slow</text><text x="160" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">Average</text><text x="260" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">Good</text><text x="370" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">Professional</text><text x="70" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">&lt; 20 WPM</text><text x="160" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">20-40 WPM</text><text x="260" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">40-60 WPM</text><text x="370" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">60+ WPM</text><text x="230" y="105" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Net WPM = Gross WPM × Accuracy % — Both speed and accuracy matter</text><text x="230" y="116" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-94a3b8)" text-anchor="middle">Gross = Total chars ÷ 5 ÷ minutes  |  Accuracy = Correct chars ÷ Total chars × 100</text></svg>',
      alt: 'Typing speed gauge showing slow, average, good, and professional ranges from under 20 WPM to 60+ WPM',
      caption: 'Net WPM = Gross WPM × Accuracy. A typist at 50 WPM with 90% accuracy has a Net WPM of 45.',
    },
    variables: [
      { symbol: 'Gross WPM', name: 'Gross Words Per Minute', description: 'Raw typing speed calculated as total characters typed divided by 5 (standard word length). Does not account for errors.' },
      { symbol: 'Net WPM', name: 'Net Words Per Minute', description: 'Adjusted typing speed that accounts for errors. Calculated as Gross WPM multiplied by accuracy percentage. This is the most useful measure of productive typing speed.' },
      { symbol: 'Accuracy', name: 'Typing Accuracy Percentage', description: 'The percentage of characters typed correctly compared to the source text. Professional typists aim for 95%+ accuracy.' },
    ],
    commonUses: [
      'Measuring your typing speed (WPM) and accuracy after a timed typing test to track improvement over time',
      'Comparing gross and net WPM to understand how much accuracy penalties affect your productive typing speed',
      'Identifying specific error counts and accuracy gaps to focus practice on problem areas',
      'Evaluating whether your typing speed meets requirements for transcription, data entry, or office job roles',
    ],
    howToUse: [
      'Select "Calculate WPM" mode and paste the source text you were supposed to type.',
      'Paste what you actually typed into the "Your Typing" field.',
      'View your Gross WPM, Net WPM, and accuracy percentage instantly.',
      'Use the error count to identify areas for improvement.',
      'Switch to Practice mode and set a timer to test yourself in real-time.',
    ],
    explanation:
      'Words per minute (WPM) is the standard measure of typing speed, originating from the era of mechanical typewriters and secretarial skill testing. One "word" is standardized as 5 keystrokes, regardless of actual word length, making the metric consistent across different text samples. This standardization means that typing "a" (1 character) counts as 0.2 words, while typing "length" (6 characters) counts as 1.2 words. Gross WPM simply divides total keystrokes by 5, then by the time in minutes. Net WPM is the more meaningful metric because it penalizes errors. A typist who flies at 100 WPM but makes 20% errors is actually slower than a steady 60 WPM typist with 99% accuracy when you account for the time spent correcting mistakes in real-world scenarios. Professional transcriptionists and data entry specialists aim for net WPM above 60 with accuracy above 95%. Court reporters using stenography can reach 200-300 WPM. The average office worker types around 40 WPM. Touch typing (typing without looking at the keyboard) typically doubles speed compared to hunt-and-peck. Regular practice with deliberate focus on accuracy first, then speed, produces the fastest long-term improvement. Many typing tests use a 1-minute or 3-minute duration because accuracy tends to decrease with longer sessions due to fatigue. This calculator uses the standard 5-character word length and compares your typed text character by character against the source to ensure precise accuracy measurement. Note that autocorrect and spell-check are disabled in formal typing tests because they mask true proficiency.',
    faqs: [
      {
        question: 'What is a good typing speed?',
        answer: 'Average typing speed is around 40 WPM. A speed of 50-60 WPM is considered above average and sufficient for most office jobs. 70-80 WPM is considered fast and is often required for transcription, data entry, and court reporting roles. Professional typists and programmers often reach 90-120 WPM. The world record for a 50-minute typing test is around 212 WPM using a standard QWERTY keyboard.',
      },
      {
        question: 'How can I improve my typing speed and accuracy?',
        answer: 'Focus on accuracy first, speed will follow. Practice with online typing tutors that emphasize proper finger placement on the home row. Use all fingers rather than hunt-and-peck. Practice for 15-30 minutes daily rather than long irregular sessions. Set goals for accuracy (95%+) before pushing for higher WPM. Take breaks to avoid developing bad habits from fatigue. Many typists see significant improvement within 4-6 weeks of consistent practice.',
      },
      {
        question: 'Does the keyboard type affect typing speed?',
        answer: 'Yes. Mechanical keyboards with tactile switches (like Cherry MX Brown or Blue) often improve typing speed and accuracy compared to membrane keyboards because they provide tactile feedback for each keystroke. Ergonomic split keyboards can reduce strain and improve comfort for long typing sessions. Key rollover (NKRO) matters for fast typists who press multiple keys simultaneously. However, the keyboard matters less than proper technique and practice.',
      },
      {
        question: 'Why does accuracy matter more than raw speed?',
        answer: 'Errors cost time to correct. Every backspace and retype effectively doubles the time spent on that word. A typist doing 80 WPM with 85% accuracy has a net speed of only 68 WPM, which is slower than someone doing 65 WPM with 98% accuracy (net 63.7 WPM). In real-world typing, errors also break concentration and flow, leading to more errors downstream. Professional contexts value accuracy because incorrect data entry, mis-typed code, or typos in client communications have real costs beyond typing speed.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Words Per Minute', url: 'https://en.wikipedia.org/wiki/Words_per_minute' },
      { source: 'Wolfram MathWorld', title: 'Statistics', url: 'https://mathworld.wolfram.com/Statistics.html' },
    ],
  },
};

export default wpmTypingTestConfig;
