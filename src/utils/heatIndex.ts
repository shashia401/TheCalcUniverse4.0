// NWS heat index, shared by everyday/heat-index and math/heat-index so the two can never disagree.
// Source: NWS Weather Prediction Center, "The Heat Index Equation" (Rothfusz 1990 regression of
// Steadman's apparent-temperature model): https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml

import { cToF, fToC } from './temperature';
export { cToF, fToC };

/**
 * Heat index in degrees F for air temperature `T` (F) and relative humidity `RH` (%).
 * 1. Steadman's simple formula: HI = 0.5 * (T + 61 + 1.2 * (T - 68) + 0.094 * RH).
 * 2. If the average of that and T is below 80 F, that simple value is the answer.
 * 3. Otherwise use the Rothfusz regression, with the two NWS adjustments:
 *    RH < 13 % and 80 <= T <= 112 F: subtract ((13 - RH) / 4) * sqrt((17 - |T - 95|) / 17)
 *    RH > 85 % and 80 <= T <= 87 F: add ((RH - 85) / 10) * ((87 - T) / 5)
 */
export interface HeatIndexParts {
  hi: number;
  /** Steadman's simple value */
  simple: number;
  method: 'simple' | 'regression';
  /** The Rothfusz regression value before the adjustments (equals `simple` when the simple formula is used) */
  regression: number;
  /** Added by the low-humidity / high-humidity corrections (0 when neither applies) */
  adjustment: number;
}

/** The pieces of the NWS calculation (see heatIndexF), so a worked solution can show which branch ran. */
export function heatIndexParts(T: number, RH: number): HeatIndexParts {
  const simple = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094);
  if ((simple + T) / 2 < 80) return { hi: simple, simple, method: 'simple', regression: simple, adjustment: 0 };
  const regression =
    -42.379 +
    2.04901523 * T +
    10.14333127 * RH -
    0.22475541 * T * RH -
    0.00683783 * T * T -
    0.05481717 * RH * RH +
    0.00122874 * T * T * RH +
    0.00085282 * T * RH * RH -
    0.00000199 * T * T * RH * RH;
  let adjustment = 0;
  if (RH < 13 && T >= 80 && T <= 112) adjustment = -(((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17));
  else if (RH > 85 && T >= 80 && T <= 87) adjustment = ((RH - 85) / 10) * ((87 - T) / 5);
  return { hi: regression + adjustment, simple, method: 'regression', regression, adjustment };
}

export function heatIndexF(T: number, RH: number): number {
  return heatIndexParts(T, RH).hi;
}

export interface HeatTier {
  label: string;
  color: string;
}

/** NWS heat index categories: <80 (not classified, "Safe"), 80-90, 90-103, 103-125, 125+. Pass the displayed (rounded) value. */
export function heatTier(hi: number): HeatTier {
  if (hi < 80) return { label: 'Safe', color: '#22c55e' };
  if (hi < 90) return { label: 'Caution', color: '#eab308' };
  if (hi < 103) return { label: 'Extreme Caution', color: '#f97316' };
  if (hi < 125) return { label: 'Danger', color: '#ef4444' };
  return { label: 'Extreme Danger', color: '#7c3aed' };
}

/** Plain-English guidance per tier, following the NWS category descriptions. */
export function heatRecommendations(hi: number): string[] {
  if (hi < 80) return ['No heat-related precautions necessary.'];
  if (hi < 90)
    return [
      'Fatigue possible with prolonged exposure or physical activity.',
      'Stay hydrated and take breaks in the shade or air conditioning.',
    ];
  if (hi < 103)
    return [
      'Heatstroke, heat cramps and heat exhaustion possible with prolonged exposure or physical activity.',
      'Limit strenuous outdoor activities to early morning or evening.',
      "Drink water frequently — don't wait until you're thirsty.",
      'Wear lightweight, light-colored, loose-fitting clothing.',
    ];
  if (hi < 125)
    return [
      'Heat cramps and heat exhaustion likely. Heatstroke probable with continued activity.',
      'Avoid outdoor activities during midday heat.',
      'Schedule frequent rest breaks in air-conditioned environments.',
      'Watch for signs of heat exhaustion: heavy sweating, weakness, cold/clammy skin.',
      'Seek medical attention if symptoms worsen or persist.',
    ];
  return [
    'Heatstroke highly likely with continued exposure.',
    'Avoid outdoor activities.',
    'Stay in air-conditioned environments — fans alone may not be enough.',
    'Monitor for heatstroke symptoms: hot/dry skin, confusion, loss of consciousness.',
    'CALL 911 immediately if heatstroke is suspected.',
    'While waiting for help: move to a cool area, remove excess clothing, cool with water/ice.',
  ];
}
