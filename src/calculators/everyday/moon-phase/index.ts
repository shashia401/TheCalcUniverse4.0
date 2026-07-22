import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import MoonPhasePanel from './MoonPhasePanel';

const LUNAR_CYCLE_DAYS = 29.53058867;
const KNOWN_NEW_MOON = new Date(2000, 0, 6); // Jan 6, 2000

interface PhaseInfo {
  name: string;
  emoji: string;
}

// Phase ranges: each entry covers [start, end)
const PHASES: [number, number, PhaseInfo][] = [
  [0, 0.03, { name: 'New Moon', emoji: '🌑' }],
  [0.03, 0.24, { name: 'Waxing Crescent', emoji: '🌒' }],
  [0.24, 0.26, { name: 'First Quarter', emoji: '🌓' }],
  [0.26, 0.49, { name: 'Waxing Gibbous', emoji: '🌔' }],
  [0.49, 0.51, { name: 'Full Moon', emoji: '🌕' }],
  [0.51, 0.74, { name: 'Waning Gibbous', emoji: '🌖' }],
  [0.74, 0.76, { name: 'Last Quarter', emoji: '🌗' }],
  [0.76, 0.97, { name: 'Waning Crescent', emoji: '🌘' }],
  [0.97, 1.0, { name: 'New Moon', emoji: '🌑' }],
];

function getPhaseInfo(phase: number): PhaseInfo {
  for (const [start, end, info] of PHASES) {
    if (phase >= start && phase < end) return info;
  }
  // edge case: phase exactly 1.0 or very close
  return { name: 'New Moon', emoji: '🌑' };
}

function getIllumination(phase: number): number {
  // Illumination: 0% at new moon, 100% at full moon
  // Using the formula: illumination = (1 - cos(2*PI*phase)) / 2 * 100
  return (1 - Math.cos(2 * Math.PI * phase)) / 2 * 100;
}

function getNextFullMoon(phase: number, baseDate: Date): Date {
  // days until next full moon (phase = 0.5)
  let daysUntil = (0.5 - phase + 1) % 1;
  if (daysUntil === 0) daysUntil = 1; // if exactly full moon, next full is one cycle later
  daysUntil *= LUNAR_CYCLE_DAYS;
  const next = new Date(baseDate);
  next.setDate(next.getDate() + Math.ceil(daysUntil));
  return next;
}

function getZodiacSign(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const moonPhaseConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'dateOfBirth',
      label: 'Date of Birth',
      type: 'date',
      required: true,
      helpText: 'Select the date to find the moon phase',
    },
  ],
  calculate: (values) => {
    const dateStr = values.dateOfBirth;
    if (!dateStr) return [];

    // Parse date parts in local time to match KNOWN_NEW_MOON construction
    const parts = dateStr.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    if (isNaN(date.getTime())) return [];

    // Calculate days since known new moon
    const diffMs = date.getTime() - KNOWN_NEW_MOON.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Calculate phase position in cycle [0, 1) using modulo to handle dates before reference
    const phase = (((diffDays % LUNAR_CYCLE_DAYS) / LUNAR_CYCLE_DAYS) + 1) % 1;

    const phaseInfo = getPhaseInfo(phase);
    const illumination = getIllumination(phase);
    const nextFullMoon = getNextFullMoon(phase, date);
    const daysUntilNextFull = Math.round((nextFullMoon.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const zodiacSign = getZodiacSign(date);

    return [
      { id: 'moonPhase', label: 'Moon Phase', value: phaseInfo.name, highlight: true, color: 'positive' },
      { id: 'illumination', label: 'Illumination', value: `${illumination.toFixed(1)}%`, color: 'neutral' },
      { id: 'phaseEmoji', label: 'Phase Symbol', value: phaseInfo.emoji },
      { id: 'nextFullMoon', label: 'Next Full Moon', value: formatDate(nextFullMoon), color: 'neutral' },
      { id: 'daysUntilNextFull', label: 'Days Until Next Full Moon', value: daysUntilNextFull.toString() },
      { id: 'zodiacSign', label: 'Zodiac Sign', value: zodiacSign, color: 'positive' },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MoonPhasePanel, { values, results });
  },
  educational: {
    formula: 'Phase = (Days Since Known New Moon) mod 29.53058867 ÷ 29.53058867',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><circle cx="80" cy="170" r="40" fill="var(--svg-1e293b)"/><circle cx="160" cy="170" r="40" fill="var(--svg-ffffff)"/><rect x="120" y="130" width="40" height="80" fill="var(--svg-1e293b)"/><circle cx="240" cy="170" r="40" fill="var(--svg-ffffff)"/><rect x="200" y="130" width="80" height="80" fill="var(--svg-1e293b)"/><circle cx="320" cy="170" r="40" fill="var(--svg-ffffff)"/><rect x="320" y="130" width="40" height="80" fill="var(--svg-1e293b)"/><text x="80" y="290" text-anchor="middle" font-size="11" fill="var(--svg-333333)">New</text><text x="160" y="290" text-anchor="middle" font-size="11" fill="var(--svg-333333)">1st Qtr</text><text x="240" y="290" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Full</text><text x="320" y="290" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Last Qtr</text></svg>',
      alt: 'Four moon phase illustrations showing new, first quarter, full, and last quarter',
      caption: 'Moon phases cycle every 29.53 days from new to full and back',
    },
    formulaDescription:
      'The moon phase is calculated by determining how many days have passed since a known new moon (January 6, 2000), then finding the remainder when divided by the lunar cycle length (29.53 days). This gives the moon\'s current position in its cycle, which is mapped to named phases.',
    variables: [
      { symbol: 'Lunar Cycle', name: 'Synodic Month', description: 'The time between successive new moons: approximately 29.53 days.' },
      { symbol: 'Phase Fraction', name: 'Phase Position', description: 'A value from 0 to 1 representing where the moon is in its 29.53-day cycle.' },
      { symbol: 'Illumination', name: 'Illumination Percentage', description: 'The fraction of the moon\'s visible disk that is illuminated by the sun.' },
      { symbol: 'New Moon', name: 'New Moon', description: 'When the moon is between Earth and the sun, making it nearly invisible from Earth.' },
      { symbol: 'Full Moon', name: 'Full Moon', description: 'When Earth is between the sun and the moon, making the entire face visible.' },
    ],
    commonUses: [
      'Planning stargazing or astrophotography sessions around new moons for the darkest skies and brightest stars',
      'Tracking the full moon schedule for lunar photography, cultural celebrations, or outdoor event planning',
      'Looking up the moon phase on a specific date such as a birthday, wedding, or historical event',
      'Understanding the illumination percentage and days until the next full moon for moon-related hobbies or traditions',
    ],
    howToUse: [
      'Enter any date to see the moon phase for that day.',
      'The calculator shows the phase name, illumination percentage, and an SVG rendering.',
      'The next full moon date is calculated based on the current phase.',
      'Your birth month\'s zodiac sign is also displayed for reference.',
      'Use the phase and illumination to plan stargazing (new moon = darkest skies), lunar photography (full moon), or track cultural events tied to the lunar calendar.',
    ],
    explanation:
      'The moon orbits Earth approximately every 27.3 days (sidereal month), but because Earth is also moving around the sun, it takes about 29.53 days for the moon to return to the same phase (synodic month). This astronomical algorithm uses a known new moon reference point to calculate the phase for any given date. The phase is determined by the angular distance between the moon and the sun as seen from Earth. When the moon is between Earth and the sun, we see the dark side (new moon). When Earth is between the sun and the moon, we see the fully illuminated face (full moon). The in-between phases — crescent, quarter, and gibbous — occur as the moon moves through its orbit. Practical applications include planning stargazing nights around new moons for darker skies, timing lunar photography sessions during full moons, and understanding cultural celebrations like Ramadan and Chinese New Year that follow the lunar calendar.',
    faqs: [
      {
        question: 'How accurate is this moon phase calculation?',
        answer: 'This calculator uses the standard astronomical algorithm based on the mean lunar cycle length of 29.53058867 days. It is accurate to within about 1-2 days for dates far in the past or future. For exact phase times (to the minute), more precise ephemeris calculations are needed.',
      },
      {
        question: 'Why does the moon have phases?',
        answer: 'The moon phases are caused by the changing angle of the sun\'s illumination as the moon orbits Earth. Half the moon is always lit by the sun, but from Earth we see varying portions of the lit half. This creates the cycle of phases from new to full and back.',
      },
      {
        question: 'What is a "blue moon"?',
        answer: 'A blue moon is the second full moon occurring within a single calendar month. Since the lunar cycle is about 29.5 days, most months have one full moon, but occasionally a month will have two. This happens roughly every 2.5 years.',
      },
      {
        question: 'Can the moon phase affect human behavior?',
        answer: 'Scientific studies have found no consistent evidence that the moon phase significantly affects human behavior, despite popular folklore about the full moon causing increased hospital visits, crime, or unusual behavior. The "lunar effect" remains a topic of folk tradition rather than scientific consensus.',
      },
      {
        question: 'What is a lunar eclipse and when does it happen?',
        answer: 'A lunar eclipse occurs when Earth comes between the sun and the moon, casting its shadow on the moon. This can only happen during a full moon when the sun, Earth, and moon are aligned. Total lunar eclipses happen approximately every 1.5 years and give the moon a distinctive reddish hue — often called a "blood moon." Unlike solar eclipses, lunar eclipses are safe to view with the naked eye.',
      },
    ],
  
    citations: [
      { source: 'NASA - Moon Phase Data', url: 'https://science.nasa.gov/moon/' },
      { source: 'US Naval Observatory', url: 'https://aa.usno.navy.mil/data/MoonPhases' },
    ],
  },
};

export default moonPhaseConfig;
