import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import BasicCalcPanel from './BasicCalcPanel';

function safeEval(expr: string): number | string {
  const trimmed = expr.trim();
  if (!trimmed) return 'empty';
  // Only allow digits, operators, parentheses, spaces, decimal points
  const sanitized = trimmed.replace(/\s/g, '');
  if (!/^[\d+\-*/().%^]+$/.test(sanitized)) return 'invalid';
  try {
    // Replace × and ÷ with * and /
    // ^ would be bitwise XOR in JS; users expect exponentiation
    const clean = sanitized.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
     
    const result = new Function(`return (${clean})`)();
    if (typeof result === 'number' && isFinite(result)) return result;
    return 'invalid';
  } catch {
    return 'invalid';
  }
}

// This calculator is a special case — the keypad panel is the primary interface.
// The form inputs are intentionally empty; the panel handles all interaction internally.

const basicCalcConfig: CalculatorConfig = {
  inputs: [],
  calculate: (values: Record<string, string>): CalculatorResult[] => {
    const expr = values.expression || '';
    if (!expr.trim()) return [];
    const result = safeEval(expr);
    if (result === 'empty') return [];
    if (result === 'invalid') return [{ id: 'error', label: 'Error', value: 'Invalid expression' }];
    return [
      { id: 'result', label: 'Result', value: String(result), highlight: true, color: 'positive' as const },
      { id: 'expression', label: 'Expression', value: expr },
    ];
  },
  extraPanel: () => {
    return createElement(BasicCalcPanel);
  },
  educational: {
    formula: 'Standard arithmetic: +, −, ×, ÷',
    formulaDescription:
      'A basic calculator for simple arithmetic operations: addition, subtraction, multiplication, and division. The history tape logs all your calculations for easy reference. The percent button divides the current value by 100, useful for quick percentage calculations like tips and discounts. Results are displayed with a clean, readable format that strips unnecessary trailing zeros.',
    diagram: {
      svg: '<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="20" width="280" height="200" rx="12" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="2"/><rect x="80" y="40" width="240" height="36" rx="6" fill="var(--svg-f1f5f9)" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="310" y="64" font-family="monospace" font-size="18" fill="var(--svg-1e293b)" text-anchor="end" font-weight="bold">42</text><rect x="80" y="88" width="54" height="34" rx="6" fill="var(--svg-e2e8f0)"/><text x="107" y="110" font-family="monospace" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="bold">7</text><rect x="142" y="88" width="54" height="34" rx="6" fill="var(--svg-e2e8f0)"/><text x="169" y="110" font-family="monospace" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="bold">8</text><rect x="204" y="88" width="54" height="34" rx="6" fill="var(--svg-e2e8f0)"/><text x="231" y="110" font-family="monospace" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="bold">9</text><rect x="266" y="88" width="54" height="34" rx="6" fill="var(--svg-3b82f6)"/><text x="293" y="110" font-family="monospace" font-size="16" fill="var(--svg-ffffff)" text-anchor="middle" font-weight="bold">+</text><rect x="80" y="130" width="54" height="34" rx="6" fill="var(--svg-e2e8f0)"/><text x="107" y="152" font-family="monospace" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="bold">4</text><rect x="142" y="130" width="54" height="34" rx="6" fill="var(--svg-e2e8f0)"/><text x="169" y="152" font-family="monospace" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="bold">5</text><rect x="204" y="130" width="54" height="34" rx="6" fill="var(--svg-e2e8f0)"/><text x="231" y="152" font-family="monospace" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="bold">6</text><rect x="266" y="130" width="54" height="34" rx="6" fill="var(--svg-f59e0b)"/><text x="293" y="152" font-family="monospace" font-size="16" fill="var(--svg-ffffff)" text-anchor="middle" font-weight="bold">-</text><rect x="80" y="172" width="54" height="34" rx="6" fill="var(--svg-e2e8f0)"/><text x="107" y="194" font-family="monospace" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="bold">1</text><rect x="142" y="172" width="54" height="34" rx="6" fill="var(--svg-e2e8f0)"/><text x="169" y="194" font-family="monospace" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="bold">2</text><rect x="204" y="172" width="54" height="34" rx="6" fill="var(--svg-e2e8f0)"/><text x="231" y="194" font-family="monospace" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="bold">3</text><rect x="266" y="172" width="54" height="34" rx="6" fill="var(--svg-22c55e)"/><text x="293" y="194" font-family="monospace" font-size="16" fill="var(--svg-ffffff)" text-anchor="middle" font-weight="bold">=</text></svg>',
      alt: 'Basic calculator keypad layout with number buttons 1-9 and operator buttons for addition, subtraction, and equals',
      caption: 'Standard four-function calculator layout with display screen, number pad, and basic operation buttons',
    },
    variables: [
      { symbol: '+, −', name: 'Addition & Subtraction', description: 'Basic additive operations: addition combines values, subtraction finds the difference between two numbers.' },
      { symbol: '×', name: 'Multiplication', description: 'Repeated addition. Multiplies numbers together to find the product.' },
      { symbol: '÷', name: 'Division', description: 'Splits a number into equal parts. Shows how many times one number fits into another.' },
    ],
    howToUse: [
      'Click the number buttons and operators to build an expression in the display.',
      'Press = or the Enter key on your keyboard to calculate the result instantly.',
      'The history tape on the right logs every calculation you perform during the session for easy review.',
      'Use the C (clear) button to reset the current expression. Use CE to clear the last entry only.',
      'The percentage button (%) divides by 100, letting you quickly compute percentages without extra steps.',
      'Keyboard support: type numbers and operators directly using your keyboard for faster calculations.',
    ],
    quickReference: [
      { label: '15 + 27', value: '42' },
      { label: '100 − 37', value: '63' },
      { label: '12 × 12', value: '144' },
      { label: '144 ÷ 12', value: '12' },
      { label: '15% of 200 (chain)', value: '30' },
      { label: '(2 + 3) × 4', value: '20 (parentheses change order)' },
      { label: '2 + 3 × 4', value: '14 (PEMDAS/BODMAS order)' },
      { label: '100 ÷ 3', value: '33.3333...' },
    ],
    commonUses: [
      'Quick mental arithmetic — add up grocery totals, split dinner bills, or calculate running sums without reaching for a phone',
      'Shopping and budgeting — compare unit prices, add up cart totals, and verify register totals while in a store',
      'Home improvement — measure and calculate areas, material quantities, and cost estimates for DIY projects',
      'Business calculations — compute profit margins, sales totals, inventory counts, and expense summaries on the fly',
      'Educational practice — students learning arithmetic and order of operations can use the history tape to verify their manual calculations',
    ],
    explanation:
      'This basic calculator handles addition, subtraction, multiplication, and division following the standard order of operations (PEMDAS/BODMAS). The history tape keeps a running log of all calculations so you can review your work, verify entries, or recapture intermediate results without re-entering them. Unlike mobile calculators that only show the last result, this calculator preserves your full calculation session. The percentage button (%) divides the displayed number by 100, which is useful for converting percentages to decimals before multiplication. For example, to find 15% of 200, type 200, press ×, type 15, press %, then press = to see 30. This follows the standard calculator percentage workflow used by accountants, cashiers, and financial professionals. The calculator also supports parentheses for grouping operations, allowing expressions like (2 + 3) × 4 to produce the correct result of 20 rather than 14.',
    faqs: [
      {
        question: 'How does the history tape work?',
        answer: 'Every calculation you perform is logged in the history tape on the right side. Each entry shows the expression and its result. Click "Clear History" to reset it. The tape persists as long as the page is open, making it easy to verify a series of related calculations or go back to check a previous result.',
      },
      {
        question: 'Does this calculator support order of operations?',
        answer: 'Yes, the calculator evaluates expressions using standard order of operations (PEMDAS/BODMAS): parentheses first, then multiplication and division (left to right), then addition and subtraction (left to right). This means 2 + 3 × 4 = 14, not 20. Use parentheses to change the order: (2 + 3) × 4 = 20.',
      },
      {
        question: 'What does the percentage button do exactly?',
        answer: 'The percentage button divides the current displayed value by 100. It is designed for chain calculations like finding a tip: enter the bill amount, press ×, enter the tip percentage, press %, then press = to see the tip amount. The button converts a percentage to its decimal equivalent for use in multiplication.',
      },
      {
        question: 'What is the keyboard shortcut support?',
        answer: 'The calculator supports full keyboard input. You can type numbers directly with the number keys, use +, -, *, / for operators, press Enter or = to calculate, and use Escape or Delete to clear. This makes it much faster than clicking buttons for frequent calculations, especially when doing data entry or working with the history tape for multiple related calculations.',
      },
      {
        question: 'How do I fix a mistake without starting over?',
        answer: 'You have several options. The CE (Clear Entry) button clears the last number you entered without resetting the entire expression. You can delete individual characters using the backspace key. The C (Clear) button resets everything. If you made a mistake in a previous calculation, you can scroll through the history tape, find the correct entry, and click it to load those numbers back into the display.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Arithmetic', url: 'https://en.wikipedia.org/wiki/Arithmetic' },
      { source: 'Wolfram MathWorld - Order of Operations', url: 'https://mathworld.wolfram.com/OrderofOperations.html' },
    ],
  },
};

export default basicCalcConfig;
