// Wind chill: the 2001 NWS / Environment Canada formula and the Environment Canada frostbite-risk table.
// One copy of this logic is shared by the calculator and its panel (the panel used to keep its own zone table,
// and both applied the °C risk thresholds to °F values).
//
// Sources:
//  - NWS: "Wind Chill Temperature is only defined for temperatures at or below 50°F and wind speeds above 3 mph"
//    (weather.gov/safety/cold-wind-chill-chart); a wind chill of −19°F can freeze exposed skin in 30 minutes.
//  - Environment Canada, Wind Chill Index (canada.ca/en/services/environment/weather/severeweather/wind-chill-index.html):
//    risk bands in whole °C, with frostbite times of 10-30, 5-10, 2-5 and under 2 minutes from −28 °C down. The page says
//    wind chill is included "when temperatures are zero or below and the wind speed is 5 km/h or higher" and "when the
//    temperature is above zero, we don't show the wind chill". It does not print the formula; the metric form below is the
//    2001 JAG/TI index in °C and km/h. Its worked examples (−15 °C at 20 km/h → −24, −20 °C at 30 km/h → −33,
//    −30 °C at 40 km/h → −48) all match it to the whole degree.

import { cToF, fToC } from '../../../utils/temperature';
export { cToF, fToC };

export const KMH_PER_MPH = 1.609344;

export const kmhToMph = (kmh: number): number => kmh / KMH_PER_MPH;

/** NWS wind chill in °F for air temperature `Tf` (°F) and wind `Vmph`. Outside the formula's range it is just the air temperature. */
export function windChillF(Tf: number, Vmph: number): number {
  if (Tf > 50 || Vmph <= 3) return Tf;
  const v = Math.pow(Vmph, 0.16);
  return 35.74 + 0.6215 * Tf - 35.75 * v + 0.4275 * Tf * v;
}

/** Environment Canada publishes wind chill only for air at or below this temperature (°C)... */
export const EC_MAX_TEMP_C = 0;
/** ...and wind at or above this speed (km/h). */
export const EC_MIN_WIND_KMH = 5;

/** True when Environment Canada would report a wind chill for these conditions. */
export const inEcRange = (Tc: number, Vkmh: number): boolean => Tc <= EC_MAX_TEMP_C && Vkmh >= EC_MIN_WIND_KMH;

/**
 * Environment Canada wind chill in °C for air temperature `Tc` (°C) and wind `Vkmh` (km/h):
 * 13.12 + 0.6215T − 11.37 V^0.16 + 0.3965 T V^0.16. Outside the range Environment Canada reports (see `inEcRange`)
 * no wind chill is shown, so this returns the air temperature.
 */
export function windChillC(Tc: number, Vkmh: number): number {
  if (!inEcRange(Tc, Vkmh)) return Tc;
  const v = Math.pow(Vkmh, 0.16);
  return 13.12 + 0.6215 * Tc - 11.37 * v + 0.3965 * Tc * v;
}

export interface FrostbiteZone {
  key: 'low' | 'moderate' | 'high' | 'veryHigh' | 'severe' | 'extreme';
  /** Text shown for the "Frostbite Risk" result. */
  risk: string;
  /** Short legend label. */
  label: string;
  /** Wind chill range this band covers, in whole °C (Environment Canada reports whole degrees). */
  minC: number;
  maxC: number;
  color: string;
  textColor: string;
}

/** Coldest band first. Bands are matched on the wind chill rounded to a whole °C. */
export const FROSTBITE_ZONES: FrostbiteZone[] = [
  { key: 'extreme', risk: 'Extreme risk (frostbite possible in under 2 minutes)', label: 'Extreme: under 2 min', minC: -Infinity, maxC: -55, color: '#7c3aed', textColor: '#4c1d95' },
  { key: 'severe', risk: 'Severe risk (frostbite possible in 2 to 5 minutes)', label: 'Severe: 2 to 5 min', minC: -54, maxC: -48, color: '#dc2626', textColor: '#7f1d1d' },
  { key: 'veryHigh', risk: 'Very high risk (frostbite possible in 5 to 10 minutes)', label: 'Very high: 5 to 10 min', minC: -47, maxC: -40, color: '#ef4444', textColor: '#991b1b' },
  { key: 'high', risk: 'High risk (frostbite possible in 10 to 30 minutes)', label: 'High: 10 to 30 min', minC: -39, maxC: -28, color: '#f97316', textColor: '#9a3412' },
  { key: 'moderate', risk: 'Moderate risk (frostbite possible after long unprotected exposure)', label: 'Moderate', minC: -27, maxC: -10, color: '#eab308', textColor: '#854d0e' },
  { key: 'low', risk: 'Low risk', label: 'Low', minC: -9, maxC: Infinity, color: '#22c55e', textColor: '#166534' },
];

/** The band for a wind chill given in °C. */
export function frostbiteZone(windChillC: number): FrostbiteZone {
  const r = Math.round(windChillC);
  return FROSTBITE_ZONES.find((z) => r <= z.maxC) ?? FROSTBITE_ZONES[FROSTBITE_ZONES.length - 1];
}

/** True from the "High" band down: frostbite on exposed skin within about 30 minutes. */
export const isFrostbiteDanger = (windChillC: number): boolean => Math.round(windChillC) <= -28;
