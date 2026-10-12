// DTI thresholds. Sources: Fannie Mae Selling Guide B3-6-02 (manual underwriting 36%, up to 45% with credit
// score/reserves; DU casefiles up to 50%) and HUD Handbook 4000.1 (FHA manual underwriting baseline 31/43,
// higher only with documented compensating factors).

export type Tone = 'positive' | 'neutral' | 'negative';
export interface Band { label: string; tone: Tone; hex: string; note: string }

/** Round to the 1 decimal shown to the user so the band always matches the displayed percentage. */
export const shown = (dti: number) => Math.round(dti * 10) / 10;

export function backEndBand(dti: number): Band {
  const d = shown(dti);
  if (d <= 36) return { label: 'Excellent', tone: 'positive', hex: '#15803d', note: 'Within the traditional 36% conventional guideline.' };
  if (d <= 43) return { label: 'Acceptable', tone: 'neutral', hex: '#c2410c', note: 'At or under the 43% back-end ratio used as the FHA baseline.' };
  if (d <= 50) return { label: 'High', tone: 'negative', hex: '#b91c1c', note: 'Above 43%: approvable by some lenders (FHA with compensating factors, Fannie Mae DU up to 50%) but expect stricter credit and reserve requirements.' };
  return { label: 'Needs Work', tone: 'negative', hex: '#991b1b', note: 'Above 50%: beyond most standard guidelines. Pay down debt or raise income before applying.' };
}

export function frontEndBand(dti: number): Band {
  const d = shown(dti);
  if (d <= 28) return { label: 'Excellent', tone: 'positive', hex: '#15803d', note: 'At or under the traditional 28% conventional guideline.' };
  if (d <= 31) return { label: 'Acceptable', tone: 'neutral', hex: '#c2410c', note: 'Over 28% but within the 31% FHA baseline housing ratio.' };
  return { label: 'High', tone: 'negative', hex: '#b91c1c', note: 'Above the 31% FHA baseline; lenders may want compensating factors or a cheaper home.' };
}
