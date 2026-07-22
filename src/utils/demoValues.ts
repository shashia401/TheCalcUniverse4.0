import { InputField } from '../types/calculator';

/**
 * For each input that has no value yet, fill a demo value:
 * 1. Use `defaultValue` if set
 * 2. Use the first real option for selects (skip "Select…")
 * 3. Parse numeric placeholder text
 * 4. Extract leading number from text placeholders ("e.g. 175" → "175")
 *
 * Assumption: selects are independent — cascading selects where option B
 * depends on option A's value could produce invalid combos (none exist yet).
 */
export function inferDemoValues(
  inputs: InputField[],
  existing: Record<string, string>,
): void {
  for (const input of inputs) {
    if (existing[input.id] !== undefined) continue;
    if (input.defaultValue !== undefined) {
      existing[input.id] = input.defaultValue;
    } else if (input.type === 'select' && input.options && input.options.length > 0) {
      const realOpt = input.options.find(o => o.value && o.value !== '' && !o.label.startsWith('Select'));
      if (realOpt) existing[input.id] = realOpt.value;
    } else if (input.placeholder) {
      const cleaned = input.placeholder.replace(/,/g, '');
      // Hex color code: use the entire placeholder as-is
      if (/^#[0-9A-Fa-f]{3,8}$/.test(cleaned)) {
        existing[input.id] = cleaned;
      }
      // Date format YYYY-MM-DD: use as-is, do not extract just the year
      else if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        existing[input.id] = cleaned;
      }
      // Time-like placeholder: extract the first clock time (e.g. "6:30 AM" from "e.g., 6:30 AM or 06:30")
      else if (/\d{1,2}:\d{2}/.test(cleaned)) {
        const timeMatch = cleaned.match(/(\d{1,2}:\d{2})\s*(AM|PM)?/i);
        if (timeMatch) {
          existing[input.id] = timeMatch[1] + (timeMatch[2] ? ' ' + timeMatch[2].toUpperCase() : '');
        }
      }
      else {
        const num = parseFloat(cleaned);
        if (!isNaN(num) && isFinite(num)) {
          existing[input.id] = cleaned;
        } else {
          const leadingNum = cleaned.match(/\d[\d.]*/);
          if (leadingNum) existing[input.id] = leadingNum[0];
        }
      }
    }
  }
}
