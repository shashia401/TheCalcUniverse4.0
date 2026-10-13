// Note-length table and BPM <-> delay maths shared by index.ts and the panel.
// A "factor" is the note's length in quarter-note beats (4/4: whole = 4 beats).

export const NOTES: { id: string; label: string; short: string; factor: number }[] = [
  { id: 'whole', label: 'Whole (1/1)', short: 'Whole', factor: 4 },
  { id: 'half', label: 'Half (1/2)', short: 'Half', factor: 2 },
  { id: 'quarter', label: 'Quarter (1/4)', short: 'Quarter', factor: 1 },
  { id: 'eighth', label: 'Eighth (1/8)', short: 'Eighth', factor: 0.5 },
  { id: 'sixteenth', label: 'Sixteenth (1/16)', short: '16th', factor: 0.25 },
  { id: 'dotted-quarter', label: 'Dotted 1/4', short: 'Dotted 1/4', factor: 1.5 },
  { id: 'dotted-eighth', label: 'Dotted 1/8', short: 'Dotted 1/8', factor: 0.75 },
  { id: 'quarter-triplet', label: 'Triplet 1/4', short: 'Triplet 1/4', factor: 2 / 3 },
];

export const noteFactor = (id: string | undefined) => NOTES.find((n) => n.id === id)?.factor ?? 1;

/** Delay of a note value at a tempo: (60000 / BPM) * factor milliseconds. */
export const delayMs = (bpm: number, factor: number) => (60000 / bpm) * factor;

/** Tempo implied by a delay that equals the given note value: 60000 * factor / delay. */
export const bpmFromDelay = (ms: number, factor: number) => (60000 / ms) * factor;
