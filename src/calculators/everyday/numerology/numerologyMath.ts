import { zodiacSign } from '../../../utils/zodiac';

// Pythagorean life path arithmetic (entertainment): reduce month, day and year separately, keeping master numbers
// 11/22/33 at every step, add them, and reduce again (a master number total is kept).

const MASTER = new Set([11, 22, 33]);

export const sumDigits = (n: number) => String(n).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);

/** Successive digit sums down to 1-9, stopping early on a master number: 1990 -> [1990, 19, 10, 1]. */
export function reductionSteps(value: number): number[] {
  const steps = [value];
  let cur = value;
  while (cur > 9 && !MASTER.has(cur)) {
    cur = sumDigits(cur);
    steps.push(cur);
  }
  return steps;
}

export const ZODIAC_ATTRS: Record<string, { symbol: string; element: string; rulingPlanet: string }> = {
  Capricorn: { symbol: 'Sea-Goat', element: 'Earth', rulingPlanet: 'Saturn' },
  Aquarius: { symbol: 'Water Bearer', element: 'Air', rulingPlanet: 'Uranus' },
  Pisces: { symbol: 'Fishes', element: 'Water', rulingPlanet: 'Neptune' },
  Aries: { symbol: 'Ram', element: 'Fire', rulingPlanet: 'Mars' },
  Taurus: { symbol: 'Bull', element: 'Earth', rulingPlanet: 'Venus' },
  Gemini: { symbol: 'Twins', element: 'Air', rulingPlanet: 'Mercury' },
  Cancer: { symbol: 'Crab', element: 'Water', rulingPlanet: 'Moon' },
  Leo: { symbol: 'Lion', element: 'Fire', rulingPlanet: 'Sun' },
  Virgo: { symbol: 'Virgin', element: 'Earth', rulingPlanet: 'Mercury' },
  Libra: { symbol: 'Scales', element: 'Air', rulingPlanet: 'Venus' },
  Scorpio: { symbol: 'Scorpion', element: 'Water', rulingPlanet: 'Pluto' },
  Sagittarius: { symbol: 'Archer', element: 'Fire', rulingPlanet: 'Jupiter' },
};

export interface LifePathInfo {
  month: number;
  day: number;
  year: number;
  monthSteps: number[];
  daySteps: number[];
  yearSteps: number[];
  monthReduced: number;
  dayReduced: number;
  yearReduced: number;
  sum: number;
  sumSteps: number[];
  lifePath: number;
  isMaster: boolean;
  sign: string;
  zodiac: { symbol: string; element: string; rulingPlanet: string };
}

/** null = incomplete input; 'invalid' = the day does not exist in that month/year. Shared with the panel. */
export function lifePathInfo(values: Record<string, string>): LifePathInfo | 'invalid' | null {
  if (!values.birthMonth || !values.birthDay || !values.birthYear) return null;
  const month = parseInt(values.birthMonth, 10);
  const day = parseInt(values.birthDay, 10);
  const year = parseInt(values.birthYear, 10);
  if (![month, day, year].every(Number.isFinite) || month < 1 || month > 12 || day < 1 || year < 1) return null;
  const d = new Date(year, month - 1, day);
  d.setFullYear(year); // years 0-99 would otherwise map to 1900-1999
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return 'invalid';

  const monthSteps = reductionSteps(month);
  const daySteps = reductionSteps(day);
  const yearSteps = reductionSteps(year);
  const monthReduced = monthSteps[monthSteps.length - 1];
  const dayReduced = daySteps[daySteps.length - 1];
  const yearReduced = yearSteps[yearSteps.length - 1];
  const sum = monthReduced + dayReduced + yearReduced;
  const sumSteps = reductionSteps(sum);
  const lifePath = sumSteps[sumSteps.length - 1];
  const sign = zodiacSign(month - 1, day);
  return {
    month, day, year, monthSteps, daySteps, yearSteps, monthReduced, dayReduced, yearReduced,
    sum, sumSteps, lifePath, isMaster: MASTER.has(lifePath), sign, zodiac: ZODIAC_ATTRS[sign],
  };
}
