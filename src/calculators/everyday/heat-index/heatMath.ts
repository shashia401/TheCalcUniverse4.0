import { cToF, fToC, heatIndexF, heatRecommendations, heatTier } from '../../../utils/heatIndex';

export interface HeatInfo {
  unit: 'F' | 'C';
  rawTemp: number;
  /** air temperature, F */
  tempF: number;
  humidity: number;
  /** NWS heat index in F, rounded to the 0.1 shown to the user (tiers are decided on this value) */
  hiF: number;
  hiC: number;
  tier: { label: string; color: string };
  recommendations: string[];
}

/** Shared by index.ts and the panel (the panel must not parse result strings or JSON blobs). */
export function heatInfo(values: Record<string, string>): HeatInfo | null {
  const rawTemp = parseFloat(values.temperature);
  const RH = parseFloat(values.humidity);
  if (!Number.isFinite(rawTemp) || !Number.isFinite(RH) || RH < 0 || RH > 100) return null;
  const unit = values.tempUnit === 'C' ? 'C' : 'F';
  const tempF = unit === 'C' ? cToF(rawTemp) : rawTemp;
  const hiF = Math.round(heatIndexF(tempF, RH) * 10) / 10;
  return { unit, rawTemp, tempF, humidity: RH, hiF, hiC: fToC(hiF), tier: heatTier(hiF), recommendations: heatRecommendations(hiF) };
}
