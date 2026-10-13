// Western (tropical) sun sign and Chinese zodiac animal lookups, shared by age-calculator and moon-phase.
// Entertainment only - these are cultural conventions, not science.

const ZODIAC_END = [
  ['Capricorn', 0, 19], ['Aquarius', 1, 18], ['Pisces', 2, 20], ['Aries', 3, 19], ['Taurus', 4, 20],
  ['Gemini', 5, 20], ['Cancer', 6, 22], ['Leo', 7, 22], ['Virgo', 8, 22], ['Libra', 9, 22],
  ['Scorpio', 10, 21], ['Sagittarius', 11, 21],
] as const;

/** Sun sign by the commonly published date ranges; month is 0-based. */
export function zodiacSign(month: number, day: number): string {
  for (const [name, m, d] of ZODIAC_END) if (month < m || (month === m && day <= d)) return name;
  return 'Capricorn';
}

const CHINESE = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
/** Animal for a Gregorian year (1900 = Rat). The Chinese year really starts at Lunar New Year (21 Jan - 20 Feb). */
export const chineseAnimal = (year: number) => CHINESE[(((year - 4) % 12) + 12) % 12];
