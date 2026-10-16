// The single °C <-> °F conversion pair (it used to be copied into heatIndex, ovenTemp, wind-chill and dew-point).

export const cToF = (c: number): number => (c * 9) / 5 + 32;
export const fToC = (f: number): number => ((f - 32) * 5) / 9;

/** Absolute zero: no physical temperature is below this. */
export const ABSOLUTE_ZERO_C = -273.15;
export const ABSOLUTE_ZERO_F = -459.67;
