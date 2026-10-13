/** MTBF math shared by index.ts and MTBFPanel.tsx (the panel must never re-parse formatted result strings). */
export const HOURS_PER_YEAR = 8760;

/** Exponential-model reliability R(t) = e^(-t/MTBF), in percent. */
export const reliabilityPct = (hours: number, mtbf: number): number => Math.exp(-hours / mtbf) * 100;

/** Reliability percentage the result panel should draw for the current mode, or null when inputs are incomplete. */
export function panelReliability(values: Record<string, string>): number | null {
  const mode = values.mode || 'mtbf';
  if (mode === 'mtbf') {
    const h = parseFloat(values.operatingHours);
    const f = parseFloat(values.numberOfFailures);
    return h > 0 && f > 0 ? reliabilityPct(HOURS_PER_YEAR, h / f) : null;
  }
  if (mode === 'reliability') {
    const m = parseFloat(values.mtbf);
    const t = parseFloat(values.missionTime);
    return m > 0 && Number.isFinite(t) && t >= 0 ? reliabilityPct(t, m) : null;
  }
  return null;
}
