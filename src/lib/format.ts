// Shared number-formatting helpers extracted from calculators that defined
// the exact same one-line `fmt` locally (verified byte-for-byte identical
// before extraction). Each calculator still owns which of these it needs;
// nothing here changes per-calculator formatting choices, it just removes
// the literal duplicate.

export const roundStr6 = (n: number) => parseFloat(n.toFixed(6)).toString();
export const roundStr8 = (n: number) => parseFloat(n.toFixed(8)).toString();
export const roundStr4 = (n: number) => parseFloat(n.toFixed(4)).toString();
export const roundStr2 = (n: number) => parseFloat(n.toFixed(2)).toString();
export const roundStrD = (n: number, d = 1) => parseFloat(n.toFixed(d)).toString();
export const fixed1 = (n: number) => n.toFixed(1);
export const fixed2 = (n: number) => n.toFixed(2);
export const roundLocale = (n: number) => Math.round(n).toLocaleString(undefined);
export const sigFig4 = (n: number) => n.toLocaleString(undefined, { maximumSignificantDigits: 4 });
export const money2dp = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const plainLocale = (n: number) => n.toLocaleString(undefined);
