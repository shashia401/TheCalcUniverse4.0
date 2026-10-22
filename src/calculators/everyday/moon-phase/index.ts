import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import MoonPhasePanel from './MoonPhasePanel';
import { SYNODIC_MONTH, moonInfo } from './moonMath';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';

const fmtDay = (ms: number) =>
  new Date(ms).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const fmtTime = (ms: number) => new Date(ms).toISOString().slice(11, 16);

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
    const m = moonInfo(values);
    if (!m) return [];
    const days = m.daysUntilFull;

    return [
      {
        id: 'moonPhase',
        label: 'Moon Phase',
        value: m.phase.name,
        highlight: true,
        color: 'positive',
        interpretation: `Evaluated at 12:00 UTC on the chosen date: the Moon is ${m.ageDays.toFixed(1)} days into its ${SYNODIC_MONTH.toFixed(2)}-day cycle (Sun-Moon elongation ${m.elongation.toFixed(1)}°).`,
      },
      { id: 'illumination', label: 'Illumination', value: `${m.illumination.toFixed(1)}%`, color: 'neutral' },
      { id: 'phaseEmoji', label: 'Phase Symbol', value: m.phase.emoji },
      {
        id: 'nextFullMoon',
        label: 'Next Full Moon (UTC date)',
        value: fmtDay(m.nextFullMs),
        color: 'neutral',
        interpretation: `Exact moment ${fmtTime(m.nextFullMs)} UTC; in your time zone the date can differ by one day.`,
      },
      { id: 'daysUntilNextFull', label: 'Days Until Next Full Moon', value: days.toString(), interpretation: days === 0 ? 'The full moon falls on the chosen date (UTC).' : undefined },
      { id: 'zodiacSign', label: 'Zodiac Sign (Western, for fun)', value: m.zodiac, color: 'positive' },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MoonPhasePanel, { values, results });
  },
  explainSteps: (values) => {
    const m = moonInfo(values);
    if (!m) return [];
    const results = moonPhaseConfig.calculate(values);
    const val = (id: string) => resultValue(results, id) ?? '';
    const n = (x: number, d = 1) => x.toLocaleString('en-US', { maximumFractionDigits: d });
    return finiteSteps([
      {
        label: 'Fix the instant to evaluate',
        expr: `${new Date(m.dayMs).toISOString().slice(0, 10)} 12:00 UTC`,
        note: 'Every date is evaluated at 12:00 UTC.',
      },
      {
        label: 'Sun-Moon elongation',
        expr: `Moon ecliptic longitude − Sun ecliptic longitude = ${n(m.elongation)}°`,
        note: '0° is new, 90° first quarter, 180° full and 270° last quarter (Meeus, Astronomical Algorithms ch. 47).',
      },
      {
        label: 'Position in the cycle',
        expr: `${n(m.elongation)}° ÷ 360 = ${n(m.fraction, 4)} of the cycle; × ${SYNODIC_MONTH} days = ${n(m.ageDays)} days old`,
      },
      { label: 'Illumination', expr: `(1 − cos ${n(m.elongation)}°) ÷ 2 = ${val('illumination')}` },
      {
        label: 'Name the phase',
        expr: `${n(m.fraction, 4)} of the cycle → ${m.phase.name}`,
        note: 'Each principal phase owns half a day either side of its instant.',
      },
      {
        label: 'Next full moon',
        expr: `next elongation of 180° after this date: ${val('nextFullMoon')}, ${val('daysUntilNextFull')} days later`,
      },
    ]);
  },
  educational: {
    formula: 'Elongation = Moon longitude − Sun longitude;  Illumination = (1 − cos elongation) ÷ 2',
    diagram: {
      svg: '<svg viewBox="0 0 460 230" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Moon phases over one 29.53-day cycle</text><circle cx="80" cy="150" r="40" fill="var(--svg-1e293b)"/><text x="80" y="215" text-anchor="middle" font-size="11" fill="var(--svg-333333)">New</text><circle cx="180" cy="150" r="40" fill="var(--svg-1e293b)"/><path d="M 180 110 A 40 40 0 0 1 180 190 Z" fill="var(--svg-fde68a)"/><text x="180" y="215" text-anchor="middle" font-size="11" fill="var(--svg-333333)">First Quarter</text><circle cx="280" cy="150" r="40" fill="var(--svg-fde68a)"/><text x="280" y="215" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Full</text><circle cx="380" cy="150" r="40" fill="var(--svg-1e293b)"/><path d="M 380 110 A 40 40 0 0 0 380 190 Z" fill="var(--svg-fde68a)"/><text x="380" y="215" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Last Quarter</text></svg>',
      alt: 'Four moon phase illustrations showing new, first quarter, full, and last quarter',
      caption: 'Moon phases cycle every 29.53 days from new to full and back',
    },
    formulaDescription:
      'The phase is set by the elongation: the angle between the Moon and the Sun as seen from Earth. The calculator computes the Moon\'s ecliptic longitude from Meeus\'s lunar series (mean elements plus the 16 largest periodic terms) and the Sun\'s from its equation of centre; 0° is new moon, 90° first quarter, 180° full moon, 270° last quarter. Illumination is (1 − cos elongation) ÷ 2 and the cycle fraction is elongation ÷ 360°. The next full moon is found by solving elongation = 180°. A plain mean-cycle formula (new moon on 6 January 2000 plus multiples of 29.530589 days) can be off by up to about 14 hours because the Moon\'s speed varies; this method matches published new and full moon times to within a few minutes.',
    variables: [
      { symbol: 'Lunar Cycle', name: 'Synodic Month', description: 'The mean time between successive new moons: 29.530589 days (individual months range from about 29.3 to 29.8 days).' },
      { symbol: 'Phase Fraction', name: 'Phase Position', description: 'Elongation ÷ 360°: a value from 0 to 1 representing where the moon is in its cycle (0 = new, 0.5 = full).' },
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
      'The calculator shows the phase name (a principal phase covers the day it occurs, ±12 hours around 12:00 UTC), illumination percentage, and an SVG rendering.',
      'The next full moon on or after your date is found from the Moon\'s position, with its date and time in UTC.',
      'The Western zodiac sign for the date is also displayed, for fun only.',
      'Use the phase and illumination to plan stargazing (new moon = darkest skies), lunar photography (full moon), or track cultural events tied to the lunar calendar.',
    ],
    explanation:
      'The moon orbits Earth approximately every 27.3 days (sidereal month), but because Earth is also moving around the sun, it takes about 29.53 days for the moon to return to the same phase (synodic month). This calculator evaluates the Sun-Moon geometry directly for 12:00 UTC on the chosen date. The phase is determined by the angular distance between the moon and the sun as seen from Earth. When the moon is between Earth and the sun, we see the dark side (new moon). When Earth is between the sun and the moon, we see the fully illuminated face (full moon). The in-between phases — crescent, quarter, and gibbous — occur as the moon moves through its orbit. Practical applications include planning stargazing nights around new moons for darker skies, timing lunar photography sessions during full moons, and understanding cultural celebrations like Ramadan and Chinese New Year that follow the lunar calendar.',
    faqs: [
      {
        question: 'How accurate is this moon phase calculation?',
        answer: 'It computes the Moon\'s and Sun\'s positions from a truncated Meeus series, which reproduces published new and full moon times to within about 5 minutes for modern dates (e.g. new moon 2000-01-06 18:14 UTC, full moon 2024-01-25 17:54 UTC). The phase is evaluated at 12:00 UTC on the date you enter, so the displayed illumination can differ from the value at your local time of day by a few percent near the full and new moons. Official phase tables (US Naval Observatory) are the reference for exact times.',
      },
      {
        question: 'Why does the moon have phases?',
        answer: 'The moon phases are caused by the changing angle of the sun\'s illumination as the moon orbits Earth. Half the moon is always lit by the sun, but from Earth we see varying portions of the lit half. This creates the cycle of phases from new to full and back.',
      },
      {
        question: 'What is a "blue moon"?',
        answer: 'A blue moon is the second full moon occurring within a single calendar month. Since the lunar cycle is about 29.5 days, most months have one full moon, but occasionally a month will have two. This happens roughly every 2-3 years.',
      },
      {
        question: 'Can the moon phase affect human behavior?',
        answer: 'Scientific studies have found no consistent evidence that the moon phase significantly affects human behavior, despite popular folklore about the full moon causing increased hospital visits, crime, or unusual behavior. The "lunar effect" remains a topic of folk tradition rather than scientific consensus.',
      },
      {
        question: 'What is a lunar eclipse and when does it happen?',
        answer: 'A lunar eclipse occurs when Earth comes between the sun and the moon, casting its shadow on the moon. This can only happen during a full moon when the sun, Earth, and moon are aligned. Total lunar eclipses are visible from any given place roughly every couple of years and give the moon a distinctive reddish hue — often called a "blood moon." Unlike solar eclipses, lunar eclipses are safe to view with the naked eye.',
      },
    ],
  
    citations: [
      { source: 'NASA - Moon Phase Data', url: 'https://science.nasa.gov/moon/' },
      { source: 'US Naval Observatory', url: 'https://aa.usno.navy.mil/data/MoonPhases' },
    ],
  },
};

export default moonPhaseConfig;
