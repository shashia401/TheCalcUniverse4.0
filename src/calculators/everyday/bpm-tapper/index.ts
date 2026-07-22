import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import BpmTapperPanel from './BpmTapperPanel';

const noteFactorMap: Record<string, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'dotted-quarter': 1.5,
  'dotted-eighth': 0.75,
  'quarter-triplet': 2 / 3,
};

const allNotes: { id: string; label: string; factor: number }[] = [
  { id: 'whole', label: 'Whole (1/1)', factor: 4 },
  { id: 'half', label: 'Half (1/2)', factor: 2 },
  { id: 'quarter', label: 'Quarter (1/4)', factor: 1 },
  { id: 'eighth', label: 'Eighth (1/8)', factor: 0.5 },
  { id: 'sixteenth', label: 'Sixteenth (1/16)', factor: 0.25 },
  { id: 'dotted-quarter', label: 'Dotted 1/4', factor: 1.5 },
  { id: 'dotted-eighth', label: 'Dotted 1/8', factor: 0.75 },
  { id: 'quarter-triplet', label: 'Triplet 1/4', factor: 2 / 3 },
];

const bpmTapperConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      helpText: 'Convert BPM to delay time or vice versa',
      options: [
        { label: 'BPM to Delay (ms)', value: 'bpm-to-ms' },
        { label: 'ms to BPM', value: 'ms-to-bpm' },
      ],
    },
    {
      id: 'bpm',
      label: 'BPM',
      type: 'number',
      placeholder: '120',
      min: 20,
      max: 300,
      step: 1,
      helpText: 'House: 120-130 | Trap: 140-160 | DnB: 170-180 | Lo-fi: 80-90',
      showWhen: (values) => values.mode !== 'ms-to-bpm',
    },
    {
      id: 'noteValue',
      label: 'Note Value',
      type: 'select',
      helpText: 'Musical note division for the delay time calculation',
      options: [
        { label: '1/1 Whole', value: 'whole' },
        { label: '1/2 Half', value: 'half' },
        { label: '1/4 Quarter', value: 'quarter' },
        { label: '1/8 Eighth', value: 'eighth' },
        { label: '1/16 Sixteenth', value: 'sixteenth' },
        { label: '1/4 Dotted', value: 'dotted-quarter' },
        { label: '1/8 Dotted', value: 'dotted-eighth' },
        { label: '1/4 Triplet', value: 'quarter-triplet' },
      ],
    },
    {
      id: 'targetMs',
      label: 'Target Delay (ms)',
      type: 'number',
      placeholder: '500',
      helpText: 'Known delay time in milliseconds to convert back to BPM',
      showWhen: (values) => values.mode === 'ms-to-bpm',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'bpm-to-ms';
    const noteValue = values.noteValue || 'quarter';
    const factor = noteFactorMap[noteValue] || 1;

    if (mode === 'bpm-to-ms') {
      const bpm = parseFloat(values.bpm);
      if (isNaN(bpm) || bpm <= 0) return [];

      const delayMs = (60000 / bpm) * factor;
      const freqHz = 1000 / delayMs;

      const results: CalculatorResult[] = [
        {
          id: 'delayMs',
          label: `Delay`,
          value: `${delayMs.toFixed(2)} ms`,
          highlight: true,
          color: 'positive',
        },
        {
          id: 'frequencyHz',
          label: 'Frequency',
          value: `${freqHz.toFixed(2)} Hz`,
          color: 'neutral',
        },
      ];

      allNotes.forEach((nv) => {
        const ms = (60000 / bpm) * nv.factor;
        results.push({
          id: `note-${nv.id}`,
          label: nv.label,
          value: `${ms.toFixed(2)} ms`,
          color: 'neutral' as const,
        });
      });

      return results;
    }

    // ms-to-bpm mode
    const targetMs = parseFloat(values.targetMs);
    if (isNaN(targetMs) || targetMs <= 0) return [];

    const bpm = (60000 / targetMs) * factor;
    const freqHz = 1000 / targetMs;

    return [
      {
        id: 'calculatedBpm',
        label: 'Calculated BPM',
        value: `${bpm.toFixed(2)} BPM`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'frequencyHz',
        label: 'Frequency',
        value: `${freqHz.toFixed(2)} Hz`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BpmTapperPanel, { values, results });
  },
  educational: {
    formula: 'Delay (ms) = 60,000 / BPM x Divisor Factor | BPM = 60,000 / Delay (ms) x Divisor Factor',
    formulaDescription:
      'The delay time in milliseconds is calculated by dividing 60,000 (the number of milliseconds in one minute) by the BPM, then multiplying by the note value divisor factor. A quarter note has a factor of 1, a half note doubles the delay, and an eighth note halves it. For reverse conversion, the same formula solves for BPM given a known delay time.',
    diagram: {
      svg: '<svg viewBox="0 0 460 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">BPM to Delay Time — Note Values at 120 BPM</text><!-- Beats --><circle cx="35" cy="45" r="12" fill="var(--svg-3b82f6)" opacity="0.3" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="35" y="49" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">♩</text><circle cx="100" cy="45" r="12" fill="var(--svg-3b82f6)" opacity="0.3" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="100" y="49" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">♩</text><circle cx="165" cy="45" r="12" fill="var(--svg-3b82f6)" opacity="0.3" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="165" y="49" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">♩</text><circle cx="230" cy="45" r="12" fill="var(--svg-3b82f6)" opacity="0.3" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="230" y="49" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">♩</text><text x="310" y="45" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600">= 500 ms</text><!-- note values table --><rect x="20" y="70" width="100" height="22" rx="4" fill="var(--svg-e2e8f0)"/><text x="70" y="84" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Quarter = 500 ms</text><rect x="140" y="70" width="110" height="22" rx="4" fill="var(--svg-e2e8f0)"/><text x="195" y="84" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Half = 1000 ms</text><rect x="270" y="70" width="110" height="22" rx="4" fill="var(--svg-e2e8f0)"/><text x="325" y="84" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Eighth = 250 ms</text><rect x="80" y="100" width="130" height="22" rx="4" fill="var(--svg-f1f5f9)" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="145" y="114" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Dotted Quarter = 750 ms</text><rect x="240" y="100" width="130" height="22" rx="4" fill="var(--svg-f1f5f9)" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="305" y="114" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Sixteenth = 125 ms</text></svg>',
      alt: 'Beat circles showing quarter notes at 120 BPM with corresponding delay times for each note value',
      caption: 'At 120 BPM, one beat = 500 ms. Multiply by note value factors: half note doubles (1000 ms), eighth note halves (250 ms).',
    },
    variables: [
      { symbol: 'BPM', name: 'Beats Per Minute', description: 'The tempo of the music, measured as the number of beats occurring in one minute. Common tempos range from 60 BPM (slow) to 180 BPM (very fast).' },
      { symbol: 'ms', name: 'Milliseconds', description: 'The delay time in milliseconds. One second equals 1,000 ms. Delay times for musical notes typically range from 50 ms (fast sixteenth notes) to 2,000 ms (slow whole notes).' },
      { symbol: 'Hz', name: 'Hertz', description: 'Frequency measured in cycles per second. Calculated as 1,000 / delayMs. Useful for finding the fundamental frequency of a delay or reverb tail.' },
    ],
    commonUses: [
      'Setting delay, reverb, and echo effect times to match the tempo of a track in music production',
      'Converting a known delay time back to BPM when building a sample or loop from an unmetered source',
      'Aligning live sound speaker arrays by calculating delay times for coherent venue coverage',
      'Finding all note-value delay divisions (quarter, eighth, sixteenth, dotted, triplet) at a given tempo for creative sound design',
    ],
    howToUse: [
      'Select a mode: convert BPM to delay time or convert a known delay time back to BPM.',
      'For BPM to ms: enter the tempo, select the note value you want the delay for, and see the result instantly.',
      'For ms to BPM: enter the delay time in milliseconds and select what note value it represents to find your tempo.',
      'Use the full note value table to see delay times for every note division at your tempo.',
      'Reference the preset BPM ranges for common electronic music genres like house (120-130), trap (140-160), drum & bass (170-180), and lo-fi (80-90).',
    ],
    explanation:
      'Delay time calculation is a fundamental skill for music producers, audio engineers, and live sound technicians. Setting delay and reverb times to match the tempo of a track keeps the effect musically in time rather than clashing with the beat. The core formula is simple: there are 60,000 milliseconds in one minute, so dividing by the BPM gives the duration of one beat (a quarter note in 4/4 time). From there, multiplying by note value factors gives every other note division. Whole notes (factor 4) last four beats, half notes (factor 2) last two beats, eighth notes (factor 0.5) are half a beat, and sixteenth notes (factor 0.25) are a quarter of a beat. Dotted notes multiply the base duration by 1.5, creating a characteristic "long-short" rhythmic feel used extensively in dub, reggae, and ambient music. Triplets divide a beat into three equal parts, giving a swing or shuffle feel. Understanding these relationships lets you dial in professional-sounding effects without guessing. For example, a 120 BPM track has a quarter note delay of 500 ms. Setting a reverb predelay to 250 ms (an eighth note) ensures the reverb tail starts exactly on the next subdivision. Many hardware delay units and plugins include a tap tempo or sync feature that does this math automatically, but knowing how it works helps you troubleshoot when sync is unavailable or when you want creative, unsynced delay timings. Live sound engineers use delay time calculations to align speaker arrays, timing delays between main speakers and fill speakers for coherent coverage across a venue. The same math applies: a 1 ms delay corresponds to roughly 1 foot of sound travel distance at sea level.',
    faqs: [
      {
        question: 'What is the difference between dotted and triplet notes?',
        answer: 'A dotted note extends the base note duration by 50% (multiply by 1.5). A dotted quarter note at 120 BPM lasts 750 ms (500 ms x 1.5). A triplet divides a beat into three equal parts. A quarter-note triplet at 120 BPM lasts approximately 333 ms (500 ms x 2/3). Dotted notes create a skipping rhythm while triplets produce a galloping feel commonly heard in shuffle and swing patterns.',
      },
      {
        question: 'Why do audio engineers use delay time calculations?',
        answer: 'Delay time math is essential for timing effects like echo, slapback, ping-pong delay, and reverb predelay to the tempo of a song. When delay times are synchronized to the beat, the effect becomes part of the musical arrangement rather than a distraction. Engineers also use these calculations for aligning PA systems, where precise delay times ensure sound from different speaker clusters arrives at the listener simultaneously.',
      },
      {
        question: 'Can I use these same formulas for reverb settings?',
        answer: 'Yes. Reverb predelay (the gap between the dry signal and the onset of reverb) is commonly set to an eighth note or sixteenth note delay to preserve clarity while still adding ambience. Reverb decay time can be set to match a quarter note or half note for a natural sounding tail that does not wash out the next beat. Many engineers set reverb decay to roughly 60-70% of a quarter note value for a balanced sound.',
      },
      {
        question: 'What are typical BPM ranges for different music genres?',
        answer: 'Electronic music genres have characteristic tempo ranges: House music typically sits between 120-130 BPM; Techno ranges from 125-140 BPM; Trap and hip-hop usually fall between 130-160 BPM; Drum and Bass runs fast at 170-180 BPM; Lo-fi and chillhop are relaxed at 80-90 BPM; Pop music generally ranges from 100-130 BPM; Rock spans 110-140 BPM; and ambient/drone music can be as slow as 50-80 BPM. These are guidelines, and many artists intentionally work outside these ranges for creative effect.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Tempo', url: 'https://en.wikipedia.org/wiki/Tempo' },
      { source: 'Wolfram MathWorld', title: 'Frequency', url: 'https://mathworld.wolfram.com/Frequency.html' },
    ],
  },
};

export default bpmTapperConfig;
