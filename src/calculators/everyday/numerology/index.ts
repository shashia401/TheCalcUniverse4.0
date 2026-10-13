import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import NumerologyPanel from './NumerologyPanel';
import { LIFE_PATH_DESCRIPTIONS } from './numerologyData';
import { lifePathInfo } from './numerologyMath';

const MONTHS = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => ({
  label: `${i + 1}`,
  value: `${i + 1}`,
}));

const numerologyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'birthMonth',
      label: 'Birth Month',
      type: 'select',
      helpText: 'Select your birth month',
      options: MONTHS,
    },
    {
      id: 'birthDay',
      label: 'Birth Day',
      type: 'select',
      helpText: 'Select your birth day of the month',
      options: DAYS,
    },
    {
      id: 'birthYear',
      label: 'Birth Year',
      type: 'number',
      inputMode: 'numeric',
      placeholder: '1990',
      min: 1900,
      max: 2030,
      step: 1,
      required: true,
      helpText: 'Your four-digit birth year',
    },
  ],
  calculate: (values) => {
    const info = lifePathInfo(values);
    if (!info) return [];
    if (info === 'invalid') {
      return [
        {
          id: 'invalidDate',
          label: 'Birth date',
          value: '—',
          color: 'negative',
          warning: 'That day does not exist in the chosen month and year (for example 31 April or 29 February in a non-leap year).',
        },
      ];
    }

    const { month, day, year, lifePath, isMaster } = info;
    const description = LIFE_PATH_DESCRIPTIONS[String(lifePath)];
    const monthName = MONTHS[month - 1]?.label || `Month ${month}`;
    const formatSteps = (steps: number[]): string => steps.join(' → ');

    const results = [
      {
        id: 'lifePathNumber',
        label: 'Life Path Number',
        value: `${lifePath}${isMaster ? ` (Master Number ${lifePath})` : ''}`,
        highlight: true,
        color: isMaster ? 'positive' : 'neutral',
        interpretation: 'Numerology is a traditional belief system with no scientific basis: read this as entertainment and a prompt for reflection, not as a prediction or a personality test.',
      },
      {
        id: 'lifePathTitle',
        label: 'Archetype',
        value: description?.title || '',
        color: 'neutral',
      },
      { id: 'monthReduction', label: `Month (${monthName})`, value: formatSteps(info.monthSteps), color: 'neutral' },
      { id: 'dayReduction', label: `Day (${day})`, value: formatSteps(info.daySteps), color: 'neutral' },
      { id: 'yearReduction', label: `Year (${year})`, value: formatSteps(info.yearSteps), color: 'neutral' },
      {
        id: 'totalSum',
        label: 'Sum of Reduced Values',
        value: `${info.monthReduced} + ${info.dayReduced} + ${info.yearReduced} = ${formatSteps(info.sumSteps)}`,
        color: 'neutral',
      },
      {
        id: 'personality',
        label: 'Personality Profile (traditional lore)',
        value: description?.personality || '',
        color: 'neutral',
      },
    ] as CalculatorResult[];

    results.push({
      id: 'zodiacSign',
      label: 'Zodiac Sign (Western, for fun)',
      value: `${info.sign} (${info.zodiac.symbol}) — ${info.zodiac.element} sign ruled by ${info.zodiac.rulingPlanet}`,
      color: 'neutral',
    });

    if (description?.strengths) {
      results.push({ id: 'strengths', label: 'Key Strengths', value: description.strengths.join(' • '), color: 'positive' });
    }
    if (description?.weaknesses) {
      results.push({ id: 'weaknesses', label: 'Growth Areas', value: description.weaknesses.join(' • '), color: 'negative' });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(NumerologyPanel, { values, results });
  },
  educational: {
    formula: 'Life Path = reduce(MM) + reduce(DD) + reduce(YYYY) → single digit (except 11, 22, 33)',
    formulaDescription:
      'The Life Path Number is calculated by reducing the birth month, day, and year to single digits (or master numbers), summing them, and reducing the sum again to a single digit unless it is a master number (11, 22, or 33). This is the "Pythagorean" method of numerology, the most common system in the West. It is a traditional belief system, offered here for entertainment: there is no scientific evidence that birth-date numbers describe personality or predict events. Master numbers are kept at every step (a month of 11, a year that sums to 22, and so on), which is the most common convention; some numerologists reduce only the final total.',
    diagram: {
      svg: '<svg viewBox="0 0 460 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Life Path Number Calculation — July 4, 1990</text><!-- Month --><rect x="15" y="32" width="80" height="55" rx="6" fill="var(--svg-3b82f6)" opacity="0.12" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="55" y="52" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-3b82f6)" font-weight="700" text-anchor="middle">Month</text><text x="55" y="68" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">07</text><text x="55" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">→ 7</text><!-- Day --><rect x="115" y="32" width="80" height="55" rx="6" fill="var(--svg-22c55e)" opacity="0.12" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="155" y="52" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-22c55e)" font-weight="700" text-anchor="middle">Day</text><text x="155" y="68" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">04</text><text x="155" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">→ 4</text><!-- Year --><rect x="215" y="32" width="90" height="55" rx="6" fill="var(--svg-f59e0b)" opacity="0.12" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="260" y="52" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-f59e0b)" font-weight="700" text-anchor="middle">Year</text><text x="260" y="68" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">1990</text><text x="260" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">→ 1+9+9+0 = 19 → 10 → 1</text><!-- Plus arrows --><text x="98" y="62" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-94a3b8)">+</text><text x="198" y="62" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-94a3b8)">+</text><!-- Sum --><rect x="315" y="38" width="55" height="44" rx="8" fill="var(--svg-8b5cf6)" opacity="0.9"/><text x="342" y="58" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">Sum</text><text x="342" y="74" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">12</text><!-- Equal --><text x="373" y="62" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-94a3b8)">→</text><!-- Result --><rect x="393" y="38" width="50" height="44" rx="25" fill="var(--svg-22c55e)"/><text x="418" y="64" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-ffffff)" font-weight="800" text-anchor="middle">3</text><text x="418" y="115" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-22c55e)" font-weight="600" text-anchor="middle">Life Path 3</text><text x="230" y="118" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-94a3b8)" text-anchor="middle">Master numbers 11, 22, and 33 are NOT reduced further</text></svg>',
      alt: 'Step-by-step calculation of Life Path Number showing month (7) + day (4) + year (1990→1) = 12 → reduced to 3',
      caption: 'Life Path = reduce(month) + reduce(day) + reduce(year), then reduce sum to a single digit. Master numbers 11, 22, and 33 are exceptions.',
    },
    variables: [
      {
        symbol: 'Life Path Number',
        name: 'Life Path Number',
        description: 'The most important number in a numerology chart, representing your life\'s purpose, natural talents, and the challenges you will face. It is derived from your complete birth date and remains constant throughout your life.',
      },
      {
        symbol: 'Master Numbers (11, 22, 33)',
        name: 'Master Numbers',
        description: 'Special numbers in numerology that carry higher spiritual vibrations and greater potential — but also greater challenges. They are not reduced to a single digit. 11 is the Intuitive, 22 is the Master Builder, and 33 is the Master Teacher.',
      },
      {
        symbol: 'Reduction',
        name: 'Digit Sum Reduction',
        description: 'The process of adding the digits of a number repeatedly until a single digit (1–9) or master number (11, 22, 33) is obtained. For example, 1990 = 1+9+9+0 = 19 = 1+9 = 10 = 1+0 = 1.',
      },
      {
        symbol: 'Zodiac Sign',
        name: 'Zodiac Sign',
        description: 'The astrological sign corresponding to your birth date. While separate from numerology, it provides additional insight into your personality and is included as a complementary reference.',
      },
    ],
    commonUses: [
      'Discovering your Life Path Number and its associated personality archetype for self-reflection and personal growth',
      'Exploring the numerological significance of master numbers (11, 22, 33) and whether they apply to your birth date',
      'Reading detailed strengths, weaknesses, and life purpose descriptions tied to your numerological profile',
      'Using numerology alongside zodiac sign information as a complementary self-discovery tool',
    ],
    howToUse: [
      'Select your birth month from the dropdown menu.',
      'Select your birth day from the dropdown menu.',
      'Enter your birth year (four digits).',
      'Your Life Path number will be calculated automatically with full step-by-step reduction shown.',
      'Read your detailed personality profile and discover your key strengths and growth areas.',
    ],
    explanation:
      'Numerology is a traditional belief system that assigns mystical meaning to numbers; it is not a science and has no demonstrated predictive power. Number mysticism is often traced to the Greek philosopher Pythagoras (6th century BC), who taught that numbers underlie the order of the universe, but the "Pythagorean" life-path system used here is a modern (early 20th century) system that borrows his name. It assigns traditional meanings to the numbers 1 through 9 and to the master numbers 11, 22, and 33. The Life Path Number is the most significant number in a numerology reading — it reveals your natural talents, inherent challenges, and the overall purpose of your life journey. Practitioners describe it as a kind of personal blueprint, though this is a metaphor and not a claim backed by evidence. It is calculated using your full birth date and does not change throughout your life, providing a constant reference point for understanding your personality and life trajectory. Master numbers (11, 22, 33) are considered to carry higher spiritual potential but also greater challenges. People with master numbers in their charts are believed to have more intense life experiences and greater responsibilities. An 11 has the intuitive gifts of a 2 amplified to a higher level, a 22 has the building capacity of a 4 magnified, and a 33 has the nurturing qualities of a 6 elevated to a universal scale. While numerology offers fascinating insights into personality and life patterns, it is best used as a tool for self-reflection and personal growth rather than as a deterministic prediction system. Understanding your Life Path Number can help you recognize your natural strengths, be aware of your potential challenges, and make choices that align with your authentic self. The zodiac sign lookup is provided as an additional complementary reference — while astrology and numerology are different systems, they both offer valuable perspectives on character and life purpose.',
    faqs: [
      {
        question: 'What is the difference between a Life Path Number and a master number?',
        answer: 'Life Path Numbers range from 1 to 9, each representing a distinct archetype and set of characteristics. Master numbers (11, 22, 33) are the exceptions — they carry the qualities of their base numbers (2, 4, and 6 respectively) but at a much higher spiritual intensity. People with master numbers are believed to have greater potential and greater challenges, often feeling a strong sense of purpose or destiny from an early age.',
      },
      {
        question: 'Why are master numbers 11, 22, and 33 not reduced further?',
        answer: 'In Pythagorean numerology, master numbers are traditionally treated as carrying a higher spiritual significance and are not reduced. This calculator keeps 11, 22 and 33 wherever they appear: as the reduced month (November = 11), day (for example the 29th: 2+9 = 11), year (for example 2009: 2+0+0+9 = 11), or as the final total. Other numerologists reduce the components fully and keep a master number only in the final sum, so two sources can give different answers for some dates. Nothing in either convention is scientifically testable.',
      },
      {
        question: 'Is numerology scientifically proven?',
        answer: 'Numerology is considered a metaphysical or esoteric practice, not a science. There is no empirical scientific evidence that numbers influence personality or life events. Many people find value in numerology as a tool for introspection, self-discovery, and personal growth — similar to how personality tests like the Enneagram or Myers-Briggs can provide useful frameworks for self-understanding even without scientific validation.',
      },
      {
        question: 'Can my Life Path Number change over time?',
        answer: 'No, your Life Path Number is calculated from your birth date and remains the same throughout your life. However, numerology includes other numbers that do change, such as your Personal Year Number (which changes annually) and your Expression Number (based on your full name at birth). The Life Path Number is your fundamental, unchanging spiritual blueprint.',
      },
      {
        question: 'How is numerology different from astrology, and can they be used together?',
        answer: 'Numerology is the belief that numbers carry mystical significance for human life, with Western roots in the number mysticism of Pythagoras (6th century BC) and its modern system dating from the early 20th century. Astrology correlates celestial body positions at birth with personality and events. While they are different systems with different methods, they are often used together as complementary self-discovery tools. Neither has scientific support; some people enjoy the Life Path Number and zodiac sign as different perspectives for reflection — for example, such readings are for fun and discussion. Our calculator provides both your Life Path Number and zodiac sign for this reason, allowing you to explore both frameworks.',
      },
    ],
    quickReference: [
      { label: 'Numbers 1-9', value: 'Single-digit Life Paths: Leader, Peacemaker, Creative, Builder, Adventurer, Nurturer, Seeker, Achiever, Humanitarian' },
      { label: 'Master Number 11', value: 'The Intuitive — amplified spiritual vibration of 2' },
      { label: 'Master Number 22', value: 'The Master Builder — amplified practical power of 4' },
      { label: 'Master Number 33', value: 'The Master Teacher — amplified nurturing of 6' },
      { label: 'Reduction Method', value: 'Sum digits repeatedly until single digit or master number (11/22/33)' },
      { label: 'Zodiac Overlap', value: '12 signs with element (Fire/Earth/Air/Water) and ruling planet' },
    ],
    proTips: [
      'Your Life Path Number is just one piece of your numerology chart. For a fuller picture, also calculate your Expression Number (from your full birth name) and your Soul Urge Number (from the vowels in your name). These three numbers together form your core numerology profile.',
      'Master numbers (11, 22, 33) are said in numerology to carry both higher potential and higher challenges; that is tradition, not a finding. Many numerologists also read the reduced number (2, 4, or 6) alongside it.',
      'Use your Life Path insights as a tool for self-reflection, not as a rigid box. Your Life Path describes tendencies and potentials — you have free will to develop traits beyond your number\'s description. A Life Path 4 (The Builder) can absolutely be creative; a Life Path 3 (The Creative Communicator) can absolutely be disciplined.',
      'Numerology texts often pair numbers as "compatible" (1 and 5, 2 and 8, 6 and 9), but there is no evidence that Life Path numbers predict relationship outcomes - treat such pairings as conversation starters only.',
      'If you want to check the arithmetic by hand: reduce month, day and year separately (keeping 11, 22, 33), add the three results, and reduce the total unless it is 11, 22 or 33. A common mistake is reducing 11 to 2, which gives a different reading.',
    ],
    limitations: [
      'Numerology is a metaphysical belief system, not a scientifically validated personality assessment. The descriptions are traditional archetypes (and, like horoscopes, written so that most people can see themselves in them); use them for entertainment and reflection only.',
      'The personality descriptions are generalized — individual life experiences, upbringing, environment, and personal choices play a far greater role in shaping who you are than your birth date numbers.',
      'This calculator uses the Pythagorean (Western) system of numerology, which differs from Chaldean numerology (different letter-to-number values) and Chinese numerology (based on different principles entirely).',
      'The zodiac sign uses the commonly published tropical date ranges. Sign boundaries shift by a day from year to year, and sidereal (Vedic) astrology uses different dates (about 3-4 weeks earlier). Astrology has no scientific support.',
    ],
    workedExamples: [
      {
        scenario: 'Calculating Life Path for July 4, 1990 (Independence Day)',
        inputs: { birthMonth: '7', birthDay: '4', birthYear: '1990' },
        result: 'Life Path 3 (The Creative Communicator). Zodiac: Cancer (Crab) — Water sign ruled by Moon.',
        insight:
          'Month 7 → 7 (already single digit). Day 4 → 4 (already single digit). Year 1990 → 1+9+9+0 = 19 → 1+9 = 10 → 1+0 = 1. Sum: 7 + 4 + 1 = 12 → 1+2 = 3. Life Path 3: The Creative Communicator — a natural storyteller with charismatic energy, creativity, and social magnetism. This result includes the zodiac sign Cancer (June 21 - July 22), which adds emotional depth and nurturing tendencies to the expressive Life Path 3 personality.',
      },
      {
        scenario: 'Master Number 22 — The Master Builder (November 2, 1998)',
        inputs: { birthMonth: '11', birthDay: '2', birthYear: '1998' },
        result: 'Life Path 22 — Master Number (The Master Builder). Zodiac: Scorpio (Scorpion) — Water sign ruled by Pluto.',
        insight:
          'Month 11 → 11 (preserved as master number). Day 2 → 2. Year 1998 → 1+9+9+8 = 27 → 2+7 = 9. Sum: 11 + 2 + 9 = 22. Since 22 is a master number, it is NOT reduced to 4. Life Path 22: The Master Builder — a rare and powerful number combining the visionary intuition of 11 with the practical building ability of 4. People with this Life Path have the potential to turn ambitious dreams into concrete realities that benefit humanity on a large scale. This person also has Scorpio as their zodiac sign, which adds intensity and determination.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Numerology', url: 'https://en.wikipedia.org/wiki/Numerology' },
      { source: 'Wolfram MathWorld', title: 'Numerology', url: 'https://mathworld.wolfram.com/Numerology.html' },
    ],
  },
};

export default numerologyConfig;
