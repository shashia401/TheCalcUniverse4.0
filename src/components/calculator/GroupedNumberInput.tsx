// Number input that shows thousands separators as you type and keeps the caret where it was.
// Shared by the calculator form and the decision tools.

import { useLayoutEffect, useRef, type HTMLAttributes } from 'react';

// Thousands-separator grouping for number inputs, keyed off each input's own
// currency `prefix` — ₹ gets Indian lakh/crore grouping (1,00,00,000), every
// other currency (or none) gets Western 3-digit grouping (10,000,000). Not
// tied to the results-panel currency dropdown: that only exists for calcs
// whose results already contain "$", so it wouldn't apply to e.g. SIP's
// fixed-INR inputs.
export const groupDigits = (raw: string, prefix?: string): string => {
  if (!raw) return '';
  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const dotIdx = unsigned.indexOf('.');
  const intPart = dotIdx === -1 ? unsigned : unsigned.slice(0, dotIdx);
  const decPart = dotIdx === -1 ? '' : '.' + unsigned.slice(dotIdx + 1);
  let groupedInt: string;
  if (prefix === '₹' && intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    groupedInt = `${rest},${last3}`;
  } else {
    groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return `${negative ? '-' : ''}${groupedInt}${decPart}`;
};

// Keep digits, at most one leading '-', at most one '.' — strips grouping
// commas and anything else a paste/typo might introduce.
export const sanitizeNumeric = (s: string): string => {
  const negative = s.trim().startsWith('-');
  let cleaned = s.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  return (negative ? '-' : '') + cleaned;
};

// A plain rAF-timed cursor restore races React's own re-render of a controlled
// input's value — React can reset the caret to the end on commit regardless
// of what a later rAF callback sets. useLayoutEffect keyed to the displayed
// (grouped) string is the reliable fix: it runs synchronously right after
// THIS component's DOM commit, so there's no window for React to win the race.
export function GroupedNumberInput({
  id,
  rawValue,
  prefix,
  placeholder,
  inputMode,
  required,
  className,
  onRawChange,
}: {
  id: string;
  rawValue: string;
  prefix?: string;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  required?: boolean;
  className: string;
  onRawChange: (raw: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const pendingCursorRef = useRef<number | null>(null);
  const grouped = groupDigits(rawValue, prefix);

  useLayoutEffect(() => {
    if (pendingCursorRef.current !== null && ref.current) {
      ref.current.setSelectionRange(pendingCursorRef.current, pendingCursorRef.current);
      pendingCursorRef.current = null;
    }
  }, [grouped]);

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode={inputMode ?? 'decimal'}
      value={grouped}
      placeholder={placeholder}
      required={required}
      aria-required={required || undefined}
      onChange={(e) => {
        const el = e.target;
        const cursorPos = el.selectionStart ?? el.value.length;
        const digitsBeforeCursor = (el.value.slice(0, cursorPos).match(/[\d.]/g) || []).length;
        const nextRaw = sanitizeNumeric(el.value);
        const nextGrouped = groupDigits(nextRaw, prefix);
        let count = 0;
        let newPos = nextGrouped.length;
        for (let i = 0; i < nextGrouped.length; i++) {
          if (/[\d.]/.test(nextGrouped[i])) count++;
          if (count === digitsBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }
        pendingCursorRef.current = newPos;
        onRawChange(nextRaw);
      }}
      className={className}
    />
  );
}
