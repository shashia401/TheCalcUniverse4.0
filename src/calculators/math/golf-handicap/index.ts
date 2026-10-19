import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { hasAnswer, resultValue } from '../../../utils/explainResults';
import GolfPanel from './GolfPanel';
import { parseNumberStrict } from '../../../utils/parseNumber';
// World Handicap System arithmetic (Rules 5.1, 5.2, 6.1) lives in whs.ts so it is tested on its own.
import { courseHandicap, formatCourseHandicap, formatIndex, handicapIndex, scoreDifferential } from './whs';

interface RoundData {
  score: number;
  rating: number;
  slope: number;
  pcc: number;
}

/**
 * One round per line: "Score, CourseRating, SlopeRating" with an optional 4th number, the Playing Conditions
 * Calculation (PCC, −1 to +3). Malformed lines and values outside the WHS limits (Slope Rating 55–155) are skipped.
 */
function parseRounds(text: string): RoundData[] {
  const rounds: RoundData[] = [];
  for (const line of text.trim().split('\n')) {
    const parts = line.trim().split(',').map((s) => s.trim());
    if (parts.length < 3) continue;
    const score = parseNumberStrict(parts[0]);
    const rating = parseNumberStrict(parts[1]);
    const slope = parseNumberStrict(parts[2]);
    const pcc = parts.length >= 4 && parts[3] !== '' ? parseNumberStrict(parts[3]) : 0;
    if ([score, rating, slope, pcc].some(isNaN)) continue;
    if (score <= 0 || rating <= 0 || slope < 55 || slope > 155 || pcc < -1 || pcc > 3) continue;
    rounds.push({ score, rating, slope, pcc });
  }
  return rounds;
}

/** The chosen number of most recent rounds, their score differentials and the resulting Handicap Index (null index below 3 scores). */
function readRounds(values: Record<string, string>) {
  const parsedMax = parseInt(values.numRounds || '20', 10);
  const maxRounds = Number.isNaN(parsedMax) ? 20 : parsedMax;

  const allRounds = parseRounds(values.rounds || '');
  if (allRounds.length === 0) return null;

  // Most recent first; only the chosen number of rounds (never more than the WHS 20) are considered.
  const rounds = allRounds.slice(0, maxRounds);
  const diffs = rounds.map((r) => scoreDifferential(r.score, r.rating, r.slope, r.pcc));
  return { rounds, diffs, hi: handicapIndex(diffs) };
}

/** The optional course to play; null unless slope, rating and par are all given and sensible. */
function readCourse(values: Record<string, string>) {
  const slope = parseNumberStrict(values.courseSlope);
  const rating = parseNumberStrict(values.courseRating);
  const par = parseNumberStrict(values.coursePar);
  const ok = !isNaN(slope) && !isNaN(rating) && !isNaN(par) && slope >= 55 && slope <= 155 && rating > 0 && par > 0;
  return ok ? { slope, rating, par } : null;
}

const golfConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'rounds',
      label: 'Recent Rounds',
      type: 'text',
      placeholder: 'Score, Course Rating, Slope Rating\n85, 72.5, 130\n92, 74.0, 140',
      helpText: 'One round per line, most recent first. Format: Score, CourseRating, SlopeRating (optional 4th number: PCC, −1 to +3). At least 3 scores are needed.',
    },
    {
      id: 'numRounds',
      label: 'Number of Rounds',
      type: 'select',
      options: [
        { label: 'Last 5 rounds', value: '5' },
        { label: 'Last 10 rounds', value: '10' },
        { label: 'Last 20 rounds (WHS standard)', value: '20' },
      ],
    },
    {
      id: 'courseSlope',
      label: 'Course to Play: Slope Rating (optional)',
      type: 'number',
      placeholder: '125',
      min: 55,
      max: 155,
      step: 1,
      helpText: 'With the course rating and par below, shows your Course Handicap for that set of tees.',
    },
    {
      id: 'courseRating',
      label: 'Course to Play: Course Rating (optional)',
      type: 'number',
      placeholder: '71.4',
      min: 50,
      max: 90,
      step: 0.1,
    },
    {
      id: 'coursePar',
      label: 'Course to Play: Par (optional)',
      type: 'number',
      placeholder: '72',
      min: 54,
      max: 80,
      step: 1,
    },
  ],
  calculate: (values) => {
    const read = readRounds(values);
    if (!read) return [];
    const { rounds, diffs, hi } = read;

    if (!hi) {
      return [
        {
          id: 'warning',
          label: 'Not enough scores',
          value: `A Handicap Index needs at least 3 scores (you entered ${rounds.length}). Add more rounds, most recent first.`,
          highlight: true,
          color: 'negative',
        },
      ];
    }

    const used = new Set(hi.usedIndices);

    // Course Handicap (WHS Rule 6.1) for the course to be played, when its slope, rating and par are all given;
    // otherwise for a neutral course (slope 113, course rating = par), which is just the index rounded.
    const course = readCourse(values);
    const haveCourse = course !== null;
    const ch = course ? courseHandicap(hi.index, course.slope, course.rating, course.par) : courseHandicap(hi.index, 113, 0, 0);

    const results: CalculatorResult[] = [
      {
        id: 'handicapIndex',
        label: 'Handicap Index',
        value: formatIndex(hi.index),
        highlight: true,
        color: 'positive',
      },
      {
        id: '_differentials',
        label: 'Round Differentials',
        value: JSON.stringify(
          diffs.map((d, i) => ({
            round: i + 1,
            score: rounds[i].score,
            rating: rounds[i].rating,
            slope: rounds[i].slope,
            differential: d,
            used: used.has(i),
          }))
        ),
      },
      {
        id: 'roundsUsed',
        label: 'Rounds Used',
        value: `Lowest ${hi.count} of ${hi.scoresUsed}`,
      },
      {
        id: 'averageDifferential',
        label: 'Avg Differential',
        value: hi.average.toFixed(2),
      },
    ];

    if (hi.adjustment !== 0) {
      results.push({
        id: 'adjustment',
        label: 'Adjustment (fewer than 20 scores)',
        value: `−${Math.abs(hi.adjustment).toFixed(1)}`,
      });
    }

    results.push({
      id: 'courseHandicap',
      label: haveCourse ? 'Course Handicap (course to play)' : 'Course Handicap (slope 113, rating = par)',
      value: formatCourseHandicap(ch),
    });

    return results;
  },
  explainSteps: (values) => {
    const rows = golfConfig.calculate(values);
    const read = readRounds(values);
    if (!hasAnswer(rows) || !read || !read.hi || !resultValue(rows, 'handicapIndex')) return [];
    const { rounds, diffs, hi } = read;
    const shown = rounds
      .slice(0, 6)
      .map((r, i) => `#${i + 1}: (113 ÷ ${r.slope}) × (${r.score} − ${r.rating}${r.pcc ? ` − ${r.pcc}` : ''}) = ${diffs[i]}`);
    const used = hi.usedIndices.map((i) => diffs[i]);
    const index = resultValue(rows, 'handicapIndex')!;
    const course = readCourse(values);
    return [
      {
        label: 'Score differential of each round = (113 ÷ slope) × (score − course rating − PCC)',
        expr: shown.join('  |  ') + (rounds.length > 6 ? `  |  … ${rounds.length - 6} more rounds` : ''),
        note: 'Each differential is rounded to one decimal place. PCC is the Playing Conditions Calculation (0 unless you entered one).',
      },
      {
        label: `Pick the ${hi.count} lowest of your ${hi.scoresUsed} differential${hi.scoresUsed === 1 ? '' : 's'}`,
        expr: used.join(', '),
        note: 'The World Handicap System counts only your best rounds: 1 of 3, 2 of 6, 3 of 9, up to 8 of 20.',
      },
      {
        label: hi.adjustment ? 'Average them, then apply the small-sample adjustment' : 'Average them',
        expr: `(${used.join(' + ')}) ÷ ${hi.count} = ${hi.average}${hi.adjustment ? `  ${hi.adjustment < 0 ? '−' : '+'} ${Math.abs(hi.adjustment)}` : ''} → Handicap Index ${index}`,
      },
      course
        ? {
            label: 'Course Handicap = Index × (slope ÷ 113) + (course rating − par)',
            expr: `${index} × (${course.slope} ÷ 113) + (${course.rating} − ${course.par}) = ${resultValue(rows, 'courseHandicap')}`,
            note: 'Rounded to a whole number.',
          }
        : {
            label: 'Course Handicap for a neutral course (slope 113, rating = par)',
            expr: `${index} rounds to ${resultValue(rows, 'courseHandicap')}`,
            note: 'Enter a course slope, rating and par above to see the handicap for that course.',
          },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(GolfPanel, { values, results });
  },
  educational: {
    formula:
      'Differential = (113 ÷ Slope) × (Adjusted Gross − Course Rating − PCC) | Index = average of the lowest 8 of your last 20 differentials',
    formulaDescription:
      'The World Handicap System (WHS) calculates a Handicap Index from your recent scores, adjusted for course difficulty. Each round produces a Score Differential (rounded to one decimal), and the best differentials are averaged and rounded to one decimal. There is no 0.96 multiplier: that "bonus of excellence" belonged to the old pre-2020 USGA system and was removed when the WHS began. With fewer than 20 scores, fewer differentials are used and, for 3, 4 or 6 scores, a small adjustment is subtracted.',
    variables: [
      {
        symbol: 'Score',
        name: 'Gross Score',
        description: 'Your total strokes for the round (adjusted for maximum hole score per WHS).',
      },
      {
        symbol: 'Rating',
        name: 'Course Rating',
        description: "The expected score for a scratch golfer on the tees played. Typically between 67 and 77.",
      },
      {
        symbol: 'Slope',
        name: 'Slope Rating',
        description: 'A measure of course difficulty for a bogey golfer relative to scratch. Ranges from 55 to 155, with 113 as standard.',
      },
    ],
    howToUse: [
      'Enter your recent rounds, most recent first, in the format: Score, CourseRating, SlopeRating (one per line). At least 3 scores are needed.',
      'Select the number of rounds to consider (5, 10, or the WHS standard 20).',
      'Read your Handicap Index, the differentials that were used, and the category.',
      'Optionally enter the slope rating, course rating and par of the course you are about to play to see your Course Handicap there.',
    ],
    explanation:
      'The World Handicap System (WHS) unified six previous handicap systems in 2020. It measures a golfer\'s demonstrated ability by calculating score differentials relative to course difficulty. The Handicap Index represents the average of the best 8 differentials from the last 20 rounds, so it reflects your potential rather than your average score. Practical example: a golfer posts scores of 85, 92, 88, 80, and 83 from a course with rating 72.5 and slope 130. The differentials are: (85−72.5)×113/130 = 10.9, (92−72.5)×113/130 = 17.0, (88−72.5)×113/130 = 13.5, (80−72.5)×113/130 = 6.5, (83−72.5)×113/130 = 9.1. With 5 scores, the lowest 1 differential is used with no adjustment, so the Handicap Index is 6.5. With only the first 3 of those scores (10.9, 17.0, 13.5) the lowest differential, 10.9, is reduced by 2.0 to give 8.9. Course Handicap = Handicap Index × (Slope ÷ 113) + (Course Rating − Par): an index of 12.4 on a course with slope 125, rating 71.4 and par 72 gives 12.4 × 125 ÷ 113 − 0.6 = 13.1, rounded to 13. Edge cases: for nine-hole rounds, the system combines two nine-hole scores to create an 18-hole differential before calculating the index. If you play from different tee boxes (e.g., forward tees with a different course rating), each set of tees produces a different differential for the same score. The maximum Handicap Index under WHS is 54.0 for both men and women. Scores are entered as adjusted gross scores (each hole capped at net double bogey), and this calculator does not apply the soft/hard cap against your Low Handicap Index or the Exceptional Score Reduction, which need your full history.',
    faqs: [
      {
        question: 'What is a good handicap index?',
        answer:
          'A handicap index of 0 or below is considered scratch (professional level). 0-5 is excellent, 5-15 is good, 15-25 is average, and above 25 is developing. The average male golfer in the US has a handicap around 14-15.',
      },
      {
        question: 'What does slope 113 mean?',
        answer:
          '113 is the standard slope rating. A course with slope 113 is considered of average difficulty. Higher slopes (up to 155) indicate harder courses; lower slopes (down to 55) indicate easier courses.',
      },
      {
        question: 'How is Course Handicap different from Handicap Index?',
        answer:
          'Your Handicap Index measures your potential ability on a course of standard difficulty. The Course Handicap adjusts your index for the specific course and tees you\'re playing, incorporating the slope rating.',
      },
      {
        question: 'Can I track fewer than 20 rounds?',
        answer:
          'Yes, from 3 scores up. The WHS uses fewer differentials when you have fewer scores: 3 scores use the lowest 1 minus 2.0; 4 scores the lowest 1 minus 1.0; 5 scores the lowest 1; 6 scores the lowest 2 minus 1.0; 7-8 scores the lowest 2; 9-11 the lowest 3; 12-14 the lowest 4; 15-16 the lowest 5; 17-18 the lowest 6; 19 the lowest 7; and 20 scores the lowest 8. With fewer than 3 scores no Handicap Index can be established.',
      },
      {
        question: 'How does playing different tee boxes affect my handicap calculation?',
        answer: 'Different tee boxes have different course ratings and slope ratings, which means the same gross score produces different differentials. For example, shooting 90 from the back tees (rating 74.0, slope 140) gives a differential of (90 - 74.0) × 113 / 140 = 12.9. Shooting 90 from the forward tees (rating 69.5, slope 120) gives a differential of (90 - 69.5) × 113 / 120 = 19.3. The difference of 6.4 strokes reflects that the forward tees are significantly easier. The WHS system handles this correctly by using each round\'s specific course rating and slope rating. This is why you should always record which tees you played when posting scores. When you play, your Course Handicap for those tees is Handicap Index × (Slope ÷ 113) + (Course Rating − Par), so a player on harder tees automatically receives more strokes than one on easier tees.',
      },
    ],
    citations: [
      { source: 'Wikipedia - World Handicap System', url: 'https://en.wikipedia.org/wiki/World_Handicap_System' },
      { source: 'Wikipedia - Handicap (Golf)', url: 'https://en.wikipedia.org/wiki/Handicap_(golf)' },
    ],
    limitations: [
      'Needs at least 3 scores. The soft cap and hard cap against your Low Handicap Index, the Exceptional Score Reduction, and the conversion of nine-hole scores depend on your full history and are not modelled; your official Handicap Index from your golf association is the only one valid for competition.',
      'Scores must already be adjusted gross scores (each hole limited to net double bogey). The calculator does not apply that limit for you.',
      'Slope Rating must be between 55 and 155. Lines outside that range, or with a malformed number, are skipped.',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">World Handicap System</text><rect x="10" y="35" width="300" height="50" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="20" y="55" font-size="9" fill="var(--svg-555555)">Step 1: Score Differential per round</text><text x="20" y="72" font-size="11" fill="var(--svg-3b82f6)" font-weight="bold">Differential = (Score − CourseRating) × 113 / Slope</text><rect x="10" y="95" width="300" height="50" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="20" y="115" font-size="9" fill="var(--svg-555555)">Step 2: Average best differentials</text><text x="20" y="132" font-size="11" fill="var(--svg-3b82f6)" font-weight="bold">Index = Avg(Lowest 8 of 20 differentials)</text><rect x="10" y="155" width="300" height="38" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="20" y="172" font-size="9" fill="var(--svg-555555)">Example: Score 85, Rating 72.5, Slope 130</text><text x="20" y="187" font-size="10" fill="var(--svg-333333)">Differential = (85−72.5) × 113/130 = 10.9</text></svg>',
      alt: 'Golf handicap formula showing differential calculation and index formula',
      caption: 'Handicap Index uses score differentials adjusted for course difficulty, averaging the best 8 of 20 rounds.',
    },
  },
};

export default golfConfig;
