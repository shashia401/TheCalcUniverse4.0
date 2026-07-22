import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import GolfPanel from './GolfPanel';

interface RoundData {
  score: number;
  rating: number;
  slope: number;
}

function parseRounds(text: string): RoundData[] {
  const lines = text.trim().split('\n');
  const rounds: RoundData[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(',').map((s) => s.trim());
    if (parts.length < 3) continue;
    const score = parseFloat(parts[0]);
    const rating = parseFloat(parts[1]);
    const slope = parseFloat(parts[2]);
    if (isNaN(score) || isNaN(rating) || isNaN(slope)) continue;
    if (slope <= 0) continue;
    rounds.push({ score, rating, slope });
  }
  return rounds;
}

function calcDifferential(round: RoundData): number {
  return ((round.score - round.rating) * 113) / round.slope;
}

function getLowestCount(numRounds: number): number {
  if (numRounds <= 6) return 1;
  if (numRounds <= 8) return 2;
  if (numRounds <= 11) return 3;
  if (numRounds <= 14) return 4;
  if (numRounds <= 16) return 5;
  if (numRounds <= 18) return 6;
  if (numRounds === 19) return 7;
  return 8;
}

const golfConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'rounds',
      label: 'Recent Rounds',
      type: 'text',
      placeholder: 'Score, Course Rating, Slope Rating\n85, 72.5, 130\n92, 74.0, 140',
      helpText: 'One round per line. Format: Score, CourseRating, SlopeRating',
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
  ],
  calculate: (values) => {
    const roundsText = values.rounds || '';
    const maxRounds = parseInt(values.numRounds || '20', 10);

    const allRounds = parseRounds(roundsText);
    if (allRounds.length === 0) return [];

    // Take only the last N rounds as specified
    const rounds = allRounds.slice(0, maxRounds);

    const diffs = rounds.map(calcDifferential);
    const count = getLowestCount(rounds.length);
    // Use index-based selection to avoid duplicate values inflating the count
    const sortedWithIdx = diffs.map((d, i) => ({ d, i })).sort((a, b) => a.d - b.d);
    const selectedItems = sortedWithIdx.slice(0, count);
    const selectedDiffs = selectedItems.map(x => x.d);
    const selectedIndices = new Set(selectedItems.map(x => x.i));
    const avgDiff = selectedDiffs.reduce((s, d) => s + d, 0) / selectedDiffs.length;
    const index = Math.round(avgDiff * 0.96 * 10) / 10;
    const courseHandicap = Math.round(index);

    const roundsUsedStr = `Lowest ${count} of ${rounds.length}`;
    const avgDiffStr = avgDiff.toFixed(2);

    return [
      {
        id: 'handicapIndex',
        label: 'Handicap Index',
        value: String(index),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'differentials',
        label: 'Round Differentials',
        value: JSON.stringify(
          diffs.map((d, i) => ({
            round: i + 1,
            score: rounds[i].score,
            rating: rounds[i].rating,
            slope: rounds[i].slope,
            differential: Math.round(d * 100) / 100,
            used: selectedIndices.has(i),
          }))
        ),
      },
      {
        id: 'roundsUsed',
        label: 'Rounds Used',
        value: roundsUsedStr,
      },
      {
        id: 'averageDifferential',
        label: 'Avg Differential',
        value: avgDiffStr,
      },
      {
        id: 'courseHandicap',
        label: 'Course Handicap (slope 113)',
        value: String(courseHandicap),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(GolfPanel, { values, results });
  },
  educational: {
    formula:
      'Differential = (Score - Course Rating) × 113 / Slope Rating | Index = Avg(Lowest 8 of 20) × 0.96',
    formulaDescription:
      'The World Handicap System (WHS) calculates a Handicap Index from your recent scores, adjusted for course difficulty. Each round produces a Score Differential, and the best differentials are averaged and reduced by 4%.',
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
      'Enter your recent rounds in the format: Score, CourseRating, SlopeRating (one per line).',
      'Select the number of rounds to consider (5, 10, or the WHS standard 20).',
      'Read your Handicap Index, differentials, and category.',
      'Use the Course Handicap to determine your playing handicap for a specific course.',
    ],
    explanation:
      'The World Handicap System (WHS) unified six previous handicap systems in 2020. It measures a golfer\'s demonstrated ability by calculating score differentials relative to course difficulty. The Handicap Index represents the average of the best 8 differentials from the last 20 rounds, with a 4% reduction factor. This ensures your handicap reflects your potential, not your average. Practical example: a golfer posts scores of 85, 92, 88, 80, and 83 from a course with rating 72.5 and slope 130. The differentials are: (85-72.5)×113/130 = 10.9, (92-72.5)×113/130 = 17.0, (88-72.5)×113/130 = 13.5, (80-72.5)×113/130 = 6.5, (83-72.5)×113/130 = 9.1. With only 5 rounds, the lowest 1 differential is used: 6.5 × 0.96 = 6.2 handicap index. Edge cases: for nine-hole rounds, the system combines two nine-hole scores to create an 18-hole differential before calculating the index. If you play from different tee boxes (e.g., forward tees with a different course rating), each set of tees produces a different differential for the same score. A golfer who plays only easy courses may have a lower index than their skill warrants because the slope rating amplifies score differences on harder courses. The maximum handicap index under WHS is 54.0 for both men and women, accommodating beginner golfers. Equitable Stroke Control (ESC) limits the maximum score per hole based on your course handicap to prevent one bad hole from inflating your index.',
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
          'Yes. With fewer rounds, the system adjusts how many differentials are used. For 5-6 rounds, only the lowest 1 is used. For 7-8 rounds, the lowest 2 are used, and so on up to 20 rounds where the lowest 8 are used.',
      },
      {
        question: 'How does playing different tee boxes affect my handicap calculation?',
        answer: 'Different tee boxes have different course ratings and slope ratings, which means the same gross score produces different differentials. For example, shooting 90 from the back tees (rating 74.0, slope 140) gives a differential of (90 - 74.0) × 113 / 140 = 12.9. Shooting 90 from the forward tees (rating 69.5, slope 120) gives a differential of (90 - 69.5) × 113 / 120 = 19.3. The difference of 6.4 strokes reflects that the forward tees are significantly easier. The WHS system handles this correctly by using each round\'s specific course rating and slope rating. This is why you should always record which tees you played when posting scores. For match play, when players use different tee boxes, the player playing the more difficult tees receives additional strokes equal to the difference in course ratings rounded to the nearest whole number. For example, if the back tees are rated 73.2 and the forward tees are rated 68.7, the back-tee player gets an additional 4 strokes (73.2 - 68.7 = 4.5, rounded to 4) for that match.',
      },
    ],
    citations: [
      { source: 'USGA - Handicap System', url: 'https://www.usga.org/content/usga/home-page/handicapping.html' },
      { source: 'Wikipedia - Handicap (Golf)', url: 'https://en.wikipedia.org/wiki/Handicap_(golf)' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">World Handicap System</text><rect x="10" y="35" width="300" height="50" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="20" y="55" font-size="9" fill="var(--svg-555555)">Step 1: Score Differential per round</text><text x="20" y="72" font-size="11" fill="var(--svg-3b82f6)" font-weight="bold">Differential = (Score − CourseRating) × 113 / SlopeRating</text><rect x="10" y="95" width="300" height="50" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="20" y="115" font-size="9" fill="var(--svg-555555)">Step 2: Average best differentials</text><text x="20" y="132" font-size="11" fill="var(--svg-3b82f6)" font-weight="bold">Index = Avg(Lowest 8 of 20) × 0.96</text><rect x="10" y="155" width="300" height="38" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="20" y="172" font-size="9" fill="var(--svg-555555)">Example: Score 85, Rating 72.5, Slope 130</text><text x="20" y="187" font-size="10" fill="var(--svg-333333)">Differential = (85−72.5) × 113/130 = 10.9</text></svg>',
      alt: 'Golf handicap formula showing differential calculation and index formula',
      caption: 'Handicap Index uses score differentials adjusted for course difficulty, averaging the best 8 of 20 rounds.',
    },
  },
};

export default golfConfig;
