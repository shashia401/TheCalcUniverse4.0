import { parseIsoDate } from '../../../utils/dates';
import { zodiacSign } from '../../../utils/zodiac';

// Moon phase from the real Sun-Moon elongation (Meeus, "Astronomical Algorithms" ch. 47: mean elements +
// the 16 largest periodic terms for the Moon, Sun equation of centre). Checked against published events:
// new moon 2000-01-06 18:14 UTC, full moon 2024-01-25 17:54 UTC, new moon 2024-04-08 18:21 UTC (all within ~4 minutes).
// This replaces a mean-synodic-month shortcut that can be wrong by up to ~14 hours.

export const SYNODIC_MONTH = 29.530588861; // mean synodic month, days
const RAD = Math.PI / 180;
const MEAN_RATE = 12.1907; // mean elongation rate, degrees per day

const norm = (x: number) => ((x % 360) + 360) % 360;
const jdOf = (ms: number) => ms / 86400000 + 2440587.5;

// [D, M, M', F, amplitude in degrees]
const MOON_TERMS: [number, number, number, number, number][] = [
  [0, 0, 1, 0, 6.288774], [2, 0, -1, 0, 1.274027], [2, 0, 0, 0, 0.658314], [0, 0, 2, 0, 0.213618],
  [0, 1, 0, 0, -0.185116], [0, 0, 0, 2, -0.114332], [2, 0, -2, 0, 0.058793], [2, -1, -1, 0, 0.057066],
  [2, 0, 1, 0, 0.053322], [2, -1, 0, 0, 0.045758], [0, 1, -1, 0, -0.040923], [1, 0, 0, 0, -0.03472],
  [0, 1, 1, 0, -0.030383], [2, 0, 0, -2, 0.015327], [0, 0, 1, 2, -0.012528], [0, 0, 1, -2, 0.01098],
];

/** Moon minus Sun ecliptic longitude in degrees [0, 360): 0 = new, 90 = first quarter, 180 = full, 270 = last quarter. */
export function elongation(ms: number): number {
  const T = (jdOf(ms) - 2451545.0) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
  let moon = Lp;
  for (const [d, m, mp, f, c] of MOON_TERMS) moon += c * Math.sin((d * D + m * M + mp * Mp + f * F) * RAD);
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * RAD) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M * RAD) +
    0.000289 * Math.sin(3 * M * RAD);
  return norm(moon - (L0 + C));
}

/** First time at or after `fromMs` when the elongation equals `target` degrees (0, 90, 180, 270). */
export function nextPhaseTime(fromMs: number, target: number): number {
  let t = fromMs + (norm(target - elongation(fromMs)) / MEAN_RATE) * 86400000;
  for (let i = 0; i < 6; i++) {
    const err = ((target - elongation(t) + 540) % 360) - 180;
    t += (err / MEAN_RATE) * 86400000;
  }
  return t;
}

export interface PhaseInfo {
  name: string;
  emoji: string;
}

/** Named phase from the cycle fraction (elongation / 360); each principal phase owns +-0.5 day around its instant. */
export function phaseName(fraction: number): PhaseInfo {
  const w = 0.5 / SYNODIC_MONTH;
  const near = (c: number) => Math.abs(fraction - c) <= w;
  if (fraction <= w || fraction >= 1 - w) return { name: 'New Moon', emoji: '🌑' };
  if (near(0.25)) return { name: 'First Quarter', emoji: '🌓' };
  if (near(0.5)) return { name: 'Full Moon', emoji: '🌕' };
  if (near(0.75)) return { name: 'Last Quarter', emoji: '🌗' };
  if (fraction < 0.25) return { name: 'Waxing Crescent', emoji: '🌒' };
  if (fraction < 0.5) return { name: 'Waxing Gibbous', emoji: '🌔' };
  if (fraction < 0.75) return { name: 'Waning Gibbous', emoji: '🌖' };
  return { name: 'Waning Crescent', emoji: '🌘' };
}

export interface MoonInfo {
  /** UTC midnight of the chosen calendar date */
  dayMs: number;
  /** phase is evaluated at 12:00 UTC of that date */
  instantMs: number;
  elongation: number;
  fraction: number;
  illumination: number;
  ageDays: number;
  phase: PhaseInfo;
  waxing: boolean;
  nextFullMs: number;
  daysUntilFull: number;
  zodiac: string;
}

export function moonInfo(values: Record<string, string>): MoonInfo | null {
  const date = parseIsoDate(values.dateOfBirth);
  if (!date) return null;
  const dayMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const instantMs = dayMs + 12 * 3600000;
  const e = elongation(instantMs);
  const fraction = e / 360;
  const nextFullMs = nextPhaseTime(dayMs, 180);
  return {
    dayMs,
    instantMs,
    elongation: e,
    fraction,
    illumination: ((1 - Math.cos(e * RAD)) / 2) * 100,
    ageDays: fraction * SYNODIC_MONTH,
    phase: phaseName(fraction),
    waxing: e < 180,
    nextFullMs,
    daysUntilFull: Math.floor(nextFullMs / 86400000) - Math.floor(dayMs / 86400000),
    zodiac: zodiacSign(date.getMonth(), date.getDate()),
  };
}

