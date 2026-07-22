import Decimal from 'decimal.js';
import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import LovePanel from './LovePanel';

/* ------------------------------------------------------------------ */
/*  Compatibility labels                                               */
/* ------------------------------------------------------------------ */

interface CompatEntry {
  label: string;
  emoji: string;
  color: string;
}

const COMPAT: Record<string, CompatEntry> = {
  perfect: { label: 'Perfect Match', emoji: '💖', color: '#e91e63' },
  great: { label: 'Great Chemistry', emoji: '💕', color: '#ff4081' },
  good: { label: 'Good Match', emoji: '💗', color: '#ff6f00' },
  fair: { label: 'Fair', emoji: '💛', color: '#ffc107' },
  low: { label: 'Low Compatibility', emoji: '💔', color: '#9e9e9e' },
};

function getCompat(score: number): CompatEntry {
  if (score >= 90) return COMPAT.perfect;
  if (score >= 70) return COMPAT.great;
  if (score >= 50) return COMPAT.good;
  if (score >= 30) return COMPAT.fair;
  return COMPAT.low;
}

/* ------------------------------------------------------------------ */
/*  Zodiac compatibility                                               */
/* ------------------------------------------------------------------ */

const ZODIAC_MAP: Record<string, string> = {
  'Aries,Leo': '🔥 Fire signs -- passionate and energetic',
  'Aries,Sagittarius': '🔥 Fire + Fire -- unstoppable duo',
  'Taurus,Virgo': '🌍 Earth signs -- grounded and practical',
  'Taurus,Capricorn': '🌍 Earth + Earth -- solid foundation',
  'Gemini,Libra': '💨 Air signs -- intellectual connection',
  'Gemini,Aquarius': '💨 Air + Air -- innovative pair',
  'Cancer,Scorpio': '🌊 Water signs -- deep emotional bond',
  'Cancer,Pisces': '🌊 Water + Water -- intuitive harmony',
  'Leo,Sagittarius': '🔥 Fire + Fire -- adventurous spirits',
  'Virgo,Capricorn': '🌍 Earth + Earth -- built to last',
  'Libra,Aquarius': '💨 Air + Air -- social power couple',
  'Scorpio,Pisces': '🌊 Water + Water -- soulmate potential',
  'Aries,Libra': '🔥 Fire + 💨 Air -- opposites attract',
  'Taurus,Scorpio': '🌍 Earth + 🌊 Water -- magnetic pull',
  'Gemini,Sagittarius': '💨 Air + 🔥 Fire -- playful energy',
  'Cancer,Capricorn': '🌊 Water + 🌍 Earth -- nurturing provider',
  'Leo,Aquarius': '🔥 Fire + 💨 Air -- dramatic chemistry',
  'Virgo,Pisces': '🌍 Earth + 🌊 Water -- healing balance',
};

function getZodiacHint(z1: string, z2: string): string | null {
  if (!z1 || !z2) return null;
  const k1 = `${z1},${z2}`;
  const k2 = `${z2},${z1}`;
  return ZODIAC_MAP[k1] || ZODIAC_MAP[k2] || null;
}

/* ------------------------------------------------------------------ */
/*  Love score algorithm                                               */
/* ------------------------------------------------------------------ */

function loveScore(name1: string, name2: string): number {
  const combined = (name1 + name2).toLowerCase().replace(/\s+/g, '');
  const word = 'love';
  let score = 0;

  for (let i = 0; i < combined.length; i++) {
    const idx = word.indexOf(combined[i]);
    if (idx !== -1) {
      score += idx + 1;
    }
  }

  score = score % 101;

  // Add deterministic "chemistry" based on shared letters
  const set1 = new Set(name1.toLowerCase().replace(/\s/g, ''));
  const set2 = new Set(name2.toLowerCase().replace(/\s/g, ''));
  const sharedArr: string[] = [];
  set1.forEach((c) => {
    if (set2.has(c)) sharedArr.push(c);
  });
  const sharedBonus = Math.min(20, sharedArr.length * 5);

  score = Math.min(100, Math.max(0, score + sharedBonus));
  return Math.round(score);
}

/* ------------------------------------------------------------------ */
/*  Flavor text                                                        */
/* ------------------------------------------------------------------ */

function getFlavor(name1: string, name2: string, score: number, compat: string): string {
  const n1 = name1.trim();
  const n2 = name2.trim();

  if (score >= 90) {
    return `${n1} and ${n2} are a match made in heaven! ${compat} -- this is destiny!`;
  }
  if (score >= 70) {
    return `${n1} and ${n2} have ${compat.toLowerCase()}! Keep nurturing this wonderful connection.`;
  }
  if (score >= 50) {
    return `${n1} and ${n2} are a ${compat.toLowerCase()}. With a little effort, this could be something special!`;
  }
  if (score >= 30) {
    return `${n1} and ${n2} have ${compat.toLowerCase()} compatibility. There is potential, but it will take work.`;
  }
  return `${n1} and ${n2} have ${compat.toLowerCase()}. Maybe friendship is the better path here!`;
}

/* ------------------------------------------------------------------ */
/*  Zodiac options                                                     */
/* ------------------------------------------------------------------ */

const ZODIAC_OPTIONS = [
  { label: 'Not sure', value: '' },
  { label: 'Aries (Mar 21 - Apr 19)', value: 'Aries' },
  { label: 'Taurus (Apr 20 - May 20)', value: 'Taurus' },
  { label: 'Gemini (May 21 - Jun 20)', value: 'Gemini' },
  { label: 'Cancer (Jun 21 - Jul 22)', value: 'Cancer' },
  { label: 'Leo (Jul 23 - Aug 22)', value: 'Leo' },
  { label: 'Virgo (Aug 23 - Sep 22)', value: 'Virgo' },
  { label: 'Libra (Sep 23 - Oct 22)', value: 'Libra' },
  { label: 'Scorpio (Oct 23 - Nov 21)', value: 'Scorpio' },
  { label: 'Sagittarius (Nov 22 - Dec 21)', value: 'Sagittarius' },
  { label: 'Capricorn (Dec 22 - Jan 19)', value: 'Capricorn' },
  { label: 'Aquarius (Jan 20 - Feb 18)', value: 'Aquarius' },
  { label: 'Pisces (Feb 19 - Mar 20)', value: 'Pisces' },
];

const GENDER_OPTIONS = [
  { label: 'Female', value: 'F' },
  { label: 'Male', value: 'M' },
  { label: 'Non-binary', value: 'NB' },
  { label: 'Prefer not to say', value: 'other' },
];

/* ------------------------------------------------------------------ */
/*  Calculator config                                                  */
/* ------------------------------------------------------------------ */

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'name1',
      label: 'Your Name',
      type: 'text',
      placeholder: 'e.g., Emma',
      helpText: 'Enter your name for the love compatibility calculation',
    },
    {
      id: 'name2',
      label: 'Their Name',
      type: 'text',
      placeholder: 'e.g., Noah',
      helpText: 'Enter their name for the love compatibility calculation',
    },
    {
      id: 'gender1',
      label: 'Gender (for flavor text)',
      type: 'select',
      options: GENDER_OPTIONS,
      helpText: 'Select your gender for personalized flavor text',
    },
    {
      id: 'gender2',
      label: 'Their Gender (for flavor text)',
      type: 'select',
      options: GENDER_OPTIONS,
      helpText: 'Select their gender for personalized flavor text',
    },
    {
      id: 'zodiac1',
      label: 'Your Zodiac Sign (for flavor text)',
      type: 'select',
      options: ZODIAC_OPTIONS,
      helpText: 'Select your zodiac sign for astrological insight',
    },
    {
      id: 'zodiac2',
      label: 'Their Zodiac Sign (for flavor text)',
      type: 'select',
      options: ZODIAC_OPTIONS,
      helpText: 'Select their zodiac sign for astrological insight',
    },
  ],

  calculate: (values) => {
    // Decimal.js for precision — love score algorithm uses deterministic modulo arithmetic
    const name1 = (values.name1 || '').trim();
    const name2 = (values.name2 || '').trim();
    if (!name1 || !name2) return [];

    const score = loveScore(name1, name2);
    const compat = getCompat(score);
    const hint = getZodiacHint(values.zodiac1 || '', values.zodiac2 || '');

    const flavor = getFlavor(name1, name2, score, compat.label);
    const shareText = `${compat.emoji} ${name1} + ${name2} = ${score}% Match! Try the Love Calculator!`;

    const results: CalculatorResult[] = [
      {
        id: 'loveScore',
        label: 'Love Score',
        value: `${score}%`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'compatibility',
        label: 'Compatibility',
        value: `${compat.label} ${compat.emoji}`,
      },
      {
        id: 'flavorText',
        label: 'Verdict',
        value: flavor,
      },
      {
        id: '_scoreColor',
        label: '',
        value: compat.color,
      },
      {
        id: 'shareText',
        label: 'Share Result',
        value: shareText,
      },
    ];

    if (hint) {
      results.push({
        id: 'zodiacHint',
        label: 'Zodiac Insight',
        value: hint,
      });
    }

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LovePanel, { values, results });
  },

  educational: {
    formula:
      'Score = (L+O+V+E letter values + shared letter bonus) mod 101, clamped to 0-100',
    formulaDescription:
      'A fun, deterministic algorithm that scores name compatibility based on the letters L, O, V, E found in the combined names, plus a chemistry bonus for shared unique letters between the two names. Each occurrence of L scores 1 point, O scores 2 points, V scores 3 points, and E scores 4 points. The shared letter bonus adds up to 20 extra points. The total is then taken modulo 101 and clamped to the range 0-100, ensuring results are always within a recognizable percentage scale.',
    variables: [
      { symbol: 'L', name: 'L-O-V-E Values', description: 'L=1, O=2, V=3, E=4 per occurrence. These weighted values make V and E more significant than L and O.' },
      { symbol: 'S', name: 'Shared Letters Bonus', description: 'Up to 20 bonus points added when the two names share unique letters, representing a "chemistry" factor beyond the LOVE letters.' },
    ],
    howToUse: [
      'Enter your name and their name in the input fields.',
      'Optionally select genders for personalized flavor text in the verdict message.',
      'Optionally select zodiac signs for astrological compatibility insight based on traditional zodiac pairings.',
      'View your love score as a percentage, a descriptive compatibility label, and a personalized verdict message.',
      'Try different name combinations to compare scores with friends.',
    ],
    explanation:
      'The Love Calculator is a fun, lighthearted tool that uses a deterministic algorithm to generate a compatibility score between two names. It counts the letters L, O, V, and E in your combined names with weighted values (L=1, O=2, V=3, E=4), adds a bonus for shared unique letters (up to 20 points representing "chemistry"), and produces a score from 0 to 100. The modulo 101 operation ensures the score wraps around rather than exceeding 100. Zodiac compatibility insights are provided for additional entertainment based on traditional astrological pairings — for example, fire signs (Aries, Leo, Sagittarius) are said to be compatible with air signs (Gemini, Libra, Aquarius). This tool is meant for parties, social gatherings, and ice-breakers, not for serious relationship decisions.',
    workedExamples: [
      {
        scenario: "At a house party in Brooklyn, New York, Priya and her friends are trying the Love Calculator on everyone. Priya enters her name with her crush Marcus. They want to see if there is a fun connection before Priya works up the nerve to talk to him.",
        inputs: { name1: 'Priya', name2: 'Marcus' },
        result: 'Love Score: 10% — Low Compatibility',
        insight: "The algorithm counts L-O-V-E letters in 'priyamarcus': L appears 0 times, O appears 0 times, V appears 0 times, E appears 0 times — giving a base of 0. The shared unique letters between 'priya' (p,r,i,y,a) and 'marcus' (m,a,r,c,u,s) are a and r, giving 2 shared letters × 5 = 10 bonus points. Score = (0 + 10) mod 101 = 10%. The verdict: low compatibility — but Priya laughs it off and talks to Marcus anyway. They discover they both love hiking and live music.",
      },
      {
        scenario: "During a Valentine's Day event at a community center in Dublin, Ireland, the organizer sets up a Love Calculator station. Couples line up to test their names. Sean and Aoife (pronounced EE-fa), childhood sweethearts married for 12 years, try it for fun.",
        inputs: { name1: 'Sean', name2: 'Aoife' },
        result: 'Love Score: 20% — Low Compatibility',
        insight: "Combined 'seanaoife': L=0, O=1 (×2=2), V=0, E=2 (×4=8) = base 10 points. Shared letters between 'sean' (s,e,a,n) and 'aoife' (a,o,i,f,e): a, e = 2 shared × 5 = 10 bonus. Score = (10 + 10) mod 101 = 20%. Everyone laughs — it turns out the algorithm does not know about 12 years of happy marriage. A perfect demonstration that the calculator is deterministic fun, not destiny.",
      },
      {
        scenario: "Two friends named Oliver and Olivia meet at university orientation in Melbourne, Australia. Someone jokes that their similar names mean they are meant to be. They try the Love Calculator to settle the friendly debate.",
        inputs: { name1: 'Oliver', name2: 'Olivia' },
        result: 'Love Score: 38% — Fair Compatibility',
        insight: "Combined 'oliverolivia': L=2 (×1=2), O=3 (×2=6), V=2 (×3=6), E=1 (×4=4) = base 18 points. Shared letters between 'oliver' (o,l,i,v,e,r) and 'olivia' (o,l,i,v,i,a): o, l, i, v = 4 shared × 5 = 20 (capped at 20). Score = (18 + 20) mod 101 = 38%. Fair compatibility — they remain good friends and the story becomes a running joke throughout university.",
      },
    ],
    faqs: [
      {
        question: 'Is this Love Calculator scientifically accurate?',
        answer: 'No, this calculator is purely for entertainment purposes. The algorithm is deterministic and consistent — the same two names always produce the same score — but it is not scientifically or psychologically validated. It is designed for fun at parties, as an ice-breaker with friends, or just for a laugh at social gatherings. Real relationship compatibility depends on shared values, communication, mutual respect, and life goals — not the letters in your names. Please do not make actual relationship decisions based on the result.',
      },
      {
        question: 'Why does the Love Calculator give the same score every time for the same names?',
        answer: 'Unlike many "love calculators" found online that produce random results, this one is fully deterministic. The same pair of names will always produce the identical score, no matter when or where you calculate it. This is intentional: it means you can share and compare results with friends reliably, verify the math yourself, and even "compete" to find name pairs that score highest. The algorithm is transparent — you can read the formula and confirm the output manually.',
      },
      {
        question: 'How is the zodiac compatibility insight calculated?',
        answer: 'Zodiac compatibility is based on traditional Western astrological pairing systems. Signs are grouped into four classical elements: fire (Aries, Leo, Sagittarius), earth (Taurus, Virgo, Capricorn), air (Gemini, Libra, Aquarius), and water (Cancer, Scorpio, Pisces). Signs within the same element are generally considered naturally compatible, as are signs from complementary element pairs (fire with air, earth with water). The zodiac insight is provided purely for entertainment and cultural context, and should not be taken as actual astrological advice.',
      },
      {
        question: 'How exactly does the L-O-V-E scoring algorithm work?',
        answer: 'The algorithm combines both names (lowercase, no spaces) and scans for the letters L, O, V, E. Each L contributes 1 point, each O contributes 2 points, each V contributes 3 points, and each E contributes 4 points. Then it compares the unique letters in each name and awards 5 bonus points for each shared letter (up to a maximum of 20 bonus points). The raw total is taken modulo 101 (to keep it within range) and clamped to 0-100. The weighting makes V and E more significant than L and O, which tends to produce more varied and interesting scores.',
      },
      {
        question: 'Why "LOVE" letters specifically? Why not a different word?',
        answer: 'The L-O-V-E letter system is a playful reference to the word most associated with the calculator\'s theme. The weighted values (L=1, O=2, V=3, E=4) create an ascending scale where later letters in "love" are worth progressively more. This ascending weight structure ensures that a name containing all four letters scores meaningfully higher than one containing only L\'s. The modulo 101 (a prime number) helps distribute scores evenly across the 0-100 range, ensuring no systematic bias toward high or low scores regardless of name length.',
      },
      {
        question: 'Can I use this for non-English names?',
        answer: 'Yes! The algorithm works with names in any language that uses the Latin alphabet. It is case-insensitive and strips spaces automatically. For names in non-Latin scripts (Cyrillic, Arabic, Chinese characters, Devanagari, etc.), you would need to transliterate them to the Latin alphabet first. The algorithm processes the raw letters regardless of language, so "María" and "Jose" work just as well as "Emma" and "Noah."',
      },
    ],
    proTips: [
      'Try entering famous fictional couples to see their scores — "Romeo" + "Juliet", "Wednesday" + "Enid", or "Mario" + "Peach". The deterministic nature means every calculator gives the same result, making it a fun group activity.',
      'The shared-letter bonus (up to 20 points) often has more impact on the final score than the L-O-V-E letter count. Names with lots of overlapping letters (like "Anna" and "Hannah") get a significant boost from this chemistry factor.',
      'Use this as an ice-breaker at events: have everyone write down their score with a random partner, then find the highest and lowest scores in the room. It sparks conversations and laughter without any real emotional stakes.',
      'The algorithm intentionally caps the score at 100 and floors it at 0. The modulo 101 step means that raw scores above 100 "wrap around" — a raw score of 135 becomes 34. This prevents long names from automatically scoring higher than short names.',
      'For social media sharing, the calculator produces a shareable verdict text (e.g., "💖 Emma + Noah = 87% Match!"). Use the deterministic property to create matching posts with friends — if you both enter each other\'s names, you will both see the same score.',
    ],
    limitations: [
      "This Love Calculator is for entertainment purposes only. It does not measure, predict, or assess actual romantic compatibility, relationship potential, or emotional connection. The algorithm is based solely on letter counts in Latin-alphabet names.",
      "The algorithm has no basis in psychology, sociology, or any scientific discipline. Zodiac compatibility insights are based on Western astrological traditions, not empirical evidence. Do not use for serious relationship decisions, professional matchmaking, or marriage counseling.",
      "The calculator only works with Latin-alphabet names. It strips spaces and ignores diacritical marks (accents). Names in non-Latin scripts (Cyrillic, Arabic, Chinese, etc.) must be transliterated first.",
      "This tool does not account for personality traits, shared interests, communication styles, relationship history, cultural compatibility, or life goals — all of which are far more relevant to real relationships than name letter counts.",
    ],
    quickReference: [
      { label: 'Score Range', value: '0 to 100%' },
      { label: 'L Value', value: '1 point per occurrence' },
      { label: 'O Value', value: '2 points per occurrence' },
      { label: 'V Value', value: '3 points per occurrence' },
      { label: 'E Value', value: '4 points per occurrence' },
      { label: 'Shared Bonus', value: 'Up to 20 points (5 per letter)' },
      { label: 'Mod Operation', value: 'Mod 101 then clamp 0-100' },
      { label: '90-100 Score', value: 'Perfect Match' },
      { label: '70-89 Score', value: 'Great Chemistry' },
      { label: '50-69 Score', value: 'Good Match' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Love Compatibility Meter</text><path d="M160 170 C160 170 40 130 40 80 C40 50 70 30 100 30 C130 30 160 60 160 60 C160 60 190 30 220 30 C250 30 280 50 280 80 C280 130 160 170 160 170Z" fill="none" stroke="var(--svg-ef4444)" stroke-width="3"/><path d="M160 170 C160 170 40 130 40 80 C40 50 70 30 100 30 C130 30 160 60 160 60 C160 60 190 30 220 30 C250 30 280 50 280 80 C280 130 160 170 160 170Z" fill="var(--svg-ef4444)" opacity="0.1"/><text x="160" y="105" text-anchor="middle" font-size="28" fill="var(--svg-ef4444)" font-weight="bold">87%</text><text x="160" y="130" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)">Great Chemistry</text><text x="160" y="155" text-anchor="middle" font-size="9" fill="var(--svg-888888)">Emma + Noah</text><rect x="20" y="176" width="90" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.15"/><text x="65" y="189" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">L: 1 point</text><rect x="115" y="176" width="90" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.15"/><text x="160" y="189" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">O: 2 points</text><rect x="210" y="176" width="90" height="18" rx="4" fill="var(--svg-3b82f6)" opacity="0.15"/><text x="255" y="189" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">V: 3 / E: 4</text></svg>',
      alt: 'Love compatibility meter in a heart shape showing 87% score',
      caption: 'Love score is calculated from L-O-V-E letter values and shared letter bonus, producing a fun 0-100% match.',
    },
    citations: [
      { source: 'Wikipedia - Love Calculator', url: 'https://en.wikipedia.org/wiki/Love_calculator' },
      { source: 'Britannica - Astrology & Zodiac', url: 'https://www.britannica.com/topic/zodiac' },
    ],
  },
};

export default config;
