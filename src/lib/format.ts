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

/**
 * n to `dp` decimals with trailing zeros trimmed, but a non-zero value smaller than 10^-dp keeps 6 significant
 * digits ("3e-10") instead of collapsing to "0" (a 1e-9 m result is not zero). -0 prints as "0".
 */
export const roundStrAuto = (n: number, dp = 6): string => {
  if (n === 0) return '0';
  if (Math.abs(n) < 10 ** -dp) return Number(n.toPrecision(6)).toString();
  return parseFloat(n.toFixed(dp)).toString();
};
