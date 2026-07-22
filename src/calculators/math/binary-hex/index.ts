import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import BinaryHexPanel from './BinaryHexPanel';

// ─── Base helpers ───────────────────────────────────────────────────────────
const BASE_MAP: Record<string, number> = {
  Binary: 2,
  Octal: 8,
  Decimal: 10,
  Hex: 16,
};


/** Character → numeric value (0-15). Returns NaN for invalid characters. */
function digitValue(c: string): number {
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
  if (c >= 'A' && c <= 'F') return c.charCodeAt(0) - 65 + 10;
  if (c >= 'a' && c <= 'f') return c.charCodeAt(0) - 97 + 10;
  return NaN;
}

/** Numeric value (0-15) → character (0-9, A-F). */
function digitChar(v: number): string {
  if (v < 10) return v.toString();
  return String.fromCharCode(65 + v - 10);
}

/** Return a superscript numeral string (via unicode superscript characters). */
function superscript(n: number): string {
  const sups: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
  };
  return String(n).split('').map((c) => sups[c] || c).join('');
}

// ─── BigInt helpers ─────────────────────────────────────────────────────────

/** Parse a value string in the given base to BigInt. Supports 0x/0b/0o prefixes and negative sign. */
function parseBigInt(value: string, base: number): bigint | null {
  let v = value.trim();
  if (v.length === 0) return null;
  if (/^0x/i.test(v)) v = v.slice(2);
  else if (/^0b/i.test(v)) v = v.slice(2);
  else if (/^0o/i.test(v)) v = v.slice(2);
  if (v.length === 0) return null;

  const neg = v.startsWith('-');
  if (neg) v = v.slice(1);
  if (v.length === 0) return null;

  let result = 0n;
  const baseBI = BigInt(base);
  for (const c of v) {
    const d = digitValue(c);
    if (Number.isNaN(d) || d >= base) return null;
    result = result * baseBI + BigInt(d);
  }
  return neg ? -result : result;
}

/** Convert a BigInt to a string in the given base (2, 8, 10, 16). */
function toBaseStr(n: bigint, base: number): string {
  if (n === 0n) return '0';
  const neg = n < 0n;
  let val = neg ? -n : n;
  const digits: string[] = [];
  const baseBI = BigInt(base);
  while (val > 0n) {
    digits.push(digitChar(Number(val % baseBI)));
    val = val / baseBI;
  }
  return (neg ? '-' : '') + digits.reverse().join('');
}

/** Mask a BigInt to `bits` bits (unsigned). */
function toUnsigned(n: bigint, bits: number): bigint {
  if (bits <= 0) return n;
  return n & ((1n << BigInt(bits)) - 1n);
}

/** Interpret an unsigned BigInt as signed at `bits` bits. */
function toSigned(n: bigint, bits: number): bigint {
  if (bits <= 0) return n;
  const signBit = 1n << BigInt(bits - 1);
  if (n & signBit) return n - (1n << BigInt(bits));
  return n;
}

/** Format a binary string with spaces every 4 bits (e.g. "1010 1111"). */
function formatBinary(bin: string): string {
  return bin.replace(/(.{4})/g, '$1 ').trim();
}

/** Binary string padded to `bits`, formatted with 4-bit grouping. */
function toBinaryPadded(n: bigint, bits: number): string {
  return formatBinary(toUnsigned(n, bits).toString(2).padStart(bits, '0'));
}

/** Hex string padded to `bits`. */
function toHexPadded(n: bigint, bits: number): string {
  return toUnsigned(n, bits).toString(16).toUpperCase().padStart(Math.ceil(bits / 4), '0');
}

/** True when the signed result at `bits` differs from the raw mathematical result. */
function hasSignedOverflow(raw: bigint, bits: number): boolean {
  if (bits <= 0) return false;
  return raw !== toSigned(toUnsigned(raw, bits), bits);
}

// ─── Byte layout (endianness) helpers ───────────────────────────────────────

interface ByteLayoutBytes {
  bigEndian: string[];    // most significant byte first
  littleEndian: string[]; // least significant byte first
  numBytes: number;
  bits: number;
}

/** Compute the byte-by-byte hex breakdown of `value` at the given bit width. */
function computeByteLayout(value: bigint, bits: number): ByteLayoutBytes | null {
  if (bits <= 0 || bits % 8 !== 0) return null;
  const numBytes = bits / 8;
  const unsigned = toUnsigned(value, bits);
  const bytesLE: string[] = [];
  for (let i = 0; i < numBytes; i++) {
    const byteVal = Number((unsigned >> BigInt(i * 8)) & 0xFFn);
    bytesLE.push(byteVal.toString(16).toUpperCase().padStart(2, '0'));
  }
  return {
    littleEndian: bytesLE,
    bigEndian: [...bytesLE].reverse(),
    numBytes,
    bits,
  };
}

// ─── Bit-width helpers for display ──────────────────────────────────────────

const BIT_WIDTH_OPTIONS = [
  { label: 'None', value: '0' },
  { label: '8-bit', value: '8' },
  { label: '16-bit', value: '16' },
  { label: '32-bit', value: '32' },
  { label: '64-bit', value: '64' },
  { label: '128-bit', value: '128' },
];

function parseBits(raw: string | undefined): number {
  const b = parseInt(raw || '0', 10);
  return [0, 8, 16, 32, 64, 128].includes(b) ? b : 0;
}

// ─── Operations ─────────────────────────────────────────────────────────────

type OpFnBI = (a: bigint, b: bigint) => bigint | null;

const OPERATIONS: Record<string, { label: string; fn: OpFnBI; needsSecond: boolean }> = {
  Add:         { label: '+', fn: (a, b) => a + b, needsSecond: true },
  Subtract:    { label: '−', fn: (a, b) => a - b, needsSecond: true },
  Multiply:    { label: '×', fn: (a, b) => a * b, needsSecond: true },
  Divide:      { label: '÷', fn: (a, b) => (b === 0n ? null : a / b), needsSecond: true },
  AND:         { label: '&', fn: (a, b) => a & b, needsSecond: true },
  OR:          { label: '|', fn: (a, b) => a | b, needsSecond: true },
  XOR:         { label: '^', fn: (a, b) => a ^ b, needsSecond: true },
  NOT:         { label: '~', fn: (a) => ~a, needsSecond: false },
  'Left Shift':  { label: '<<', fn: (a, b) => a << b, needsSecond: true },
  'Right Shift': { label: '>>', fn: (a, b) => a >> b, needsSecond: true },
};

// ─── Config ─────────────────────────────────────────────────────────────────
const binaryHexConfig: CalculatorConfig = {
  inputs: [
    // ── Mode ──
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      required: true,
      helpText: 'Convert: translate between bases. Calculate: perform bitwise arithmetic operations on values.',
      options: [
        { label: 'Convert', value: 'Convert' },
        { label: 'Calculate', value: 'Calculate' },
      ],
    },

    // ── Convert inputs ──
    {
      id: 'fromBase',
      label: 'From Base',
      type: 'select',
      required: true,
      options: [
        { label: 'Decimal', value: 'Decimal' },
        { label: 'Binary', value: 'Binary' },
        { label: 'Hexadecimal', value: 'Hex' },
        { label: 'Octal', value: 'Octal' },
      ],
      showWhen: (values) => values.mode === 'Convert',
    },
    {
      id: 'toBase',
      label: 'To Base',
      type: 'select',
      required: true,
      options: [
        { label: 'Decimal', value: 'Decimal' },
        { label: 'Binary', value: 'Binary' },
        { label: 'Hexadecimal', value: 'Hex' },
        { label: 'Octal', value: 'Octal' },
      ],
      showWhen: (values) => values.mode === 'Convert',
    },
    {
      id: 'value',
      label: 'Value',
      type: 'text',
      inputMode: 'text',
      placeholder: 'e.g. 1010, FF, 42',
      required: true,
      helpText: 'The value to convert — enter digits valid for the selected "From" base',
      showWhen: (values) => values.mode === 'Convert',
    },

    // ── Calculate inputs ──
    {
      id: 'base',
      label: 'Base',
      type: 'select',
      required: true,
      options: [
        { label: 'Decimal', value: 'Decimal' },
        { label: 'Binary', value: 'Binary' },
        { label: 'Hexadecimal', value: 'Hex' },
        { label: 'Octal', value: 'Octal' },
      ],
      showWhen: (values) => values.mode === 'Calculate',
    },
    {
      id: 'operation',
      label: 'Operation',
      type: 'select',
      required: true,
      options: [
        { label: 'Add (+)', value: 'Add' },
        { label: 'Subtract (−)', value: 'Subtract' },
        { label: 'Multiply (×)', value: 'Multiply' },
        { label: 'Divide (÷)', value: 'Divide' },
        { label: 'AND (&)', value: 'AND' },
        { label: 'OR (|)', value: 'OR' },
        { label: 'XOR (^)', value: 'XOR' },
        { label: 'NOT (~)', value: 'NOT' },
        { label: 'Left Shift (<<)', value: 'Left Shift' },
        { label: 'Right Shift (>>)', value: 'Right Shift' },
      ],
      showWhen: (values) => values.mode === 'Calculate',
    },
    {
      id: 'value1',
      label: 'First Operand',
      type: 'text',
      placeholder: 'e.g. 1010',
      required: true,
      helpText: 'Enter digits valid for the selected base',
      showWhen: (values) => values.mode === 'Calculate',
    },
    {
      id: 'value2',
      label: 'Second Operand',
      type: 'text',
      placeholder: 'e.g. 0011',
      required: true,
      helpText: 'Enter digits valid for the selected base (shift amount for shift operations)',
      showWhen: (values) =>
        values.mode === 'Calculate' && values.operation !== 'NOT',
    },

    // ── Bit width (shows in both modes) ──
    {
      id: 'bitWidth',
      label: 'Bit Width',
      type: 'select',
      options: BIT_WIDTH_OPTIONS,
      helpText:
        'Controls padding and two\'s complement display. For Calculate mode, bitwise operations mask to this width and arithmetic wraps at this boundary.',
    },
  ],

  // ─── Calculate ──
  calculate: (values): CalculatorResult[] => {
    const mode = values.mode;
    if (mode === 'Convert') return doConvert(values);
    if (mode === 'Calculate') return doCalculate(values);
    return [];
  },

  // ─── Extra Panel ──
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BinaryHexPanel, { values, results });
  },

  // ─── Educational ──
  educational: {
    formula:
      'Binary: dₙ₋₁×2ⁿ⁻¹ + … + d₀×2⁰ | Signed: −2ⁿ⁻¹ … 2ⁿ⁻¹−1 | Unsigned: 0 … 2ⁿ−1',
    formulaDescription:
      'Every number in a positional numeral system can be expressed as the sum of each digit multiplied by its base raised to the digit\'s position. With a fixed bit width, the leftmost bit acts as the sign bit in two\'s complement: 0 = positive, 1 = negative. A negative number is stored as the two\'s complement of its absolute value (invert all bits, add 1). Bitwise operations (AND, OR, XOR, NOT, shifts) operate on the binary representation masked to the selected width. Endianness determines the byte order in memory: big-endian stores the most significant byte first (at the lowest address), while little-endian stores the least significant byte first. x86/x64 systems use little-endian; network protocols use big-endian.',
    variables: [
      {
        symbol: 'Base (b)',
        name: 'Numeral System Base',
        description:
          'The number of unique digits used. Binary = 2 (0-1), Octal = 8 (0-7), Decimal = 10 (0-9), Hexadecimal = 16 (0-9, A-F).',
      },
      {
        symbol: 'Bit Width (n)',
        name: 'Fixed Bit Width',
        description:
          'The number of bits used to represent a value. 8-bit: range 0-255 unsigned or -128 to 127 signed. 32-bit: 0-4,294,967,295 unsigned. 128-bit: 0-3.4×10³⁸ unsigned. Arithmetic wraps at this boundary (modulo 2ⁿ).',
      },
      {
        symbol: 'Two\'s Complement',
        name: 'Two\'s Complement Representation',
        description:
          'The standard way to represent signed integers in binary. The most significant bit is the sign bit (1 = negative). To negate a number: invert all bits and add 1. For example, -1 in 8-bit is 11111111₂. Same bit pattern interpreted as unsigned is 255.',
      },
      {
        symbol: 'Bitwise Op, Shift',
        name: 'Bitwise & Shift Operations',
        description:
          'AND, OR, XOR, NOT operate on individual bits. Left shift (<<) moves bits left (multiply by 2ⁿ), right shift (>>) moves bits right (divide by 2ⁿ, sign-extending for signed). In this calculator, bitwise ops are masked to the selected bit width.',
      },
      {
        symbol: 'BE / LE',
        name: 'Big Endian vs. Little Endian',
        description:
          'Endianness describes byte ordering in memory. Big-endian stores the most significant byte at the lowest address (network byte order). Little-endian stores the least significant byte at the lowest address (x86, x64, most ARM). The value 0x0A0B0C0D in 32-bit: big-endian = [0A, 0B, 0C, 0D], little-endian = [0D, 0C, 0B, 0A].',
      },
    ],
    howToUse: [
      'Select "Convert" to translate a number between bases (Decimal, Binary, Hex, Octal). The positional breakdown shows how each digit contributes.',
      'Select "Calculate" to perform arithmetic or bitwise operations between two numbers in a chosen base.',
      'Use the "Bit Width" selector to see values padded to a specific width (8 to 128 bits). With a width set, you see both signed and unsigned decimal interpretations, and two\'s complement binary representation for negative numbers.',
      'For bitwise operations (AND, OR, XOR, NOT, shifts), values are masked to the selected bit width before and after the operation. This lets you explore what happens in real CPU registers.',
      'For arithmetic (Add, Subtract), the calculator shows both the raw result and the wrapped (truncated to bit width) result, plus overflow and carry flags.',
      'When a bit width is selected, the byte layout table shows the value\'s memory representation in both big-endian and little-endian order — essential for understanding binary file formats and network protocols.',
      'Results are shown in all four bases automatically for easy cross-reference.',
    ],
    explanation:
      'Number base conversion is fundamental to computing and digital electronics. Every positional numeral system works the same way: each position represents the base raised to a power (position counting from 0 at the right). Binary (base 2) uses only 0 and 1 — the language of computers. Octal (base 8) and Hexadecimal (base 16) are compact ways to represent binary data since 8 = 2³ and 16 = 2⁴. Bit width matters because computers store numbers in fixed-size registers (8, 16, 32, 64, or 128 bits). The same binary pattern can represent different values depending on whether you interpret it as signed (two\'s complement) or unsigned. For example, 11111111₂ in 8-bit is 255 unsigned but -1 signed. Two\'s complement is used because addition and subtraction work the same way regardless of sign — the same hardware circuit handles both. Overflow occurs when the result of an operation exceeds the signed range, and the carry flag indicates when the result exceeds the unsigned range. Understanding these concepts is essential for low-level programming, embedded systems, network protocol design, and digital logic.',
    diagram: {
      svg: '<svg viewBox="0 0 480 140" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="240" y="16" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Two\'s Complement — Signed vs. Unsigned in 8-bit</text>' +
        '<rect x="30" y="25" width="200" height="90" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
        '<text x="130" y="40" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">Unsigned: 0 to 255</text>' +
        '<rect x="50" y="46" width="40" height="16" rx="2" fill="var(--svg-e0e7ff)" stroke="var(--svg-6366f1)" stroke-width="1"/>' +
        '<text x="70" y="58" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-4338ca)" text-anchor="middle">0</text>' +
        '<rect x="170" y="46" width="40" height="16" rx="2" fill="var(--svg-e0e7ff)" stroke="var(--svg-6366f1)" stroke-width="1"/>' +
        '<text x="190" y="58" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-4338ca)" text-anchor="middle">255</text>' +
        '<rect x="100" y="48" width="60" height="12" rx="1" fill="var(--svg-cbd5e1)" opacity="0.5"/>' +
        '<text x="130" y="80" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">Signed: -128 to 127</text>' +
        '<rect x="50" y="88" width="40" height="16" rx="2" fill="var(--svg-fee2e2)" stroke="var(--svg-ef4444)" stroke-width="1"/>' +
        '<text x="70" y="100" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-dc2626)" text-anchor="middle">-128</text>' +
        '<rect x="170" y="88" width="40" height="16" rx="2" fill="var(--svg-e0e7ff)" stroke="var(--svg-6366f1)" stroke-width="1"/>' +
        '<text x="190" y="100" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-4338ca)" text-anchor="middle">127</text>' +
        '<rect x="102" y="90" width="56" height="12" rx="1" fill="var(--svg-cbd5e1)" opacity="0.5"/>' +
        '<text x="130" y="74" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">same bit pattern</text>' +
        '<line x1="130" y1="64" x2="130" y2="74" stroke="var(--svg-64748b)" stroke-width="0.5" stroke-dasharray="2,1"/>' +
        '<line x1="130" y1="76" x2="130" y2="86" stroke="var(--svg-64748b)" stroke-width="0.5" stroke-dasharray="2,1"/>' +
        '<text x="310" y="35" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">Example: 0b11111111</text>' +
        '<text x="310" y="50" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">Unsigned: 255</text>' +
        '<text x="310" y="65" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">Signed: -1</text>' +
        '<text x="310" y="85" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Negate: invert all bits, add 1</text>' +
        '<text x="310" y="100" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">00000001 → 11111110 → 11111111</text>' +
        '<text x="240" y="125" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">The same 8-bit pattern has two valid interpretations: signed vs. unsigned</text>' +
        '</svg>',
      alt: 'Diagram showing the difference between signed and unsigned interpretation of 8-bit binary numbers, with two\'s complement example',
      caption: 'The same binary pattern represents different values depending on signed vs. unsigned interpretation. In two\'s complement, the most significant bit is the sign bit.',
    },
    faqs: [
      {
        question: 'How do I convert between binary and hexadecimal?',
        answer:
          'Group binary digits into sets of 4 (from right to left), then convert each group: 0000=0, 0001=1, …, 1111=F. For example, 11011011₂ = 1101 1011 = DB₁₆. Going the other way, each hex digit becomes 4 binary digits. With this calculator, set From = Binary, To = Hex and the bit width to pad the output to the desired width.',
      },
      {
        question: 'What is two\'s complement and why is it used?',
        answer:
          'Two\'s complement is the standard way computers represent signed integers. The most significant bit is the sign bit (0 = positive, 1 = negative). To negate a number: invert all bits and add 1. For example, +5 in 8-bit is 00000101₂. Invert: 11111010₂. Add 1: 11111011₂ = -5. The beauty is that addition hardware works identically for signed and unsigned numbers — the same binary adder handles both, and the programmer just decides how to interpret the result. A CPU\'s overflow flag detects signed overflow, while the carry flag detects unsigned overflow.',
      },
      {
        question: 'What bit width should I use for my calculation?',
        answer:
          '8-bit: good for learning and practice (range -128 to 127 signed). 16-bit: common in embedded systems and older hardware (range -32,768 to 32,767). 32-bit: standard for bitwise operations in most programming languages (range -2.1×10⁹ to 2.1×10⁹). 64-bit: modern CPU architecture, memory addresses (range -9.2×10¹⁸ to 9.2×10¹⁸). 128-bit: IPv6 addresses, UUIDs, cryptography (huge range). Choose the width that matches your target system or the data type you are working with.',
      },
      {
        question: 'Why does 127 + 1 in 8-bit give -128?',
        answer:
          'Because the result (128) exceeds the maximum signed 8-bit value (127). In binary: 01111111₂ + 00000001₂ = 10000000₂. The most significant bit flips from 0 to 1, which the signed interpretation reads as -128. This is "signed overflow" — the CPU sets its overflow flag. The same bit pattern interpreted as unsigned gives 128, which is correct. This is why understanding both signed and unsigned interpretations matters when working with fixed-width arithmetic.',
      },
      {
        question: 'How does left shift relate to multiplication?',
        answer:
          'Each left shift by 1 position multiplies the number by 2. So x << 3 = x × 2³ = x × 8. The bits move into higher-value positions. However, bits shifted beyond the bit width are lost (truncated). In 8-bit: 11111111₂ (255) << 1 = 11111110₂ (254). Mathematically 255×2=510, but 510 & 0xFF = 254. Right shift (>>) divides by 2, rounding toward negative infinity for signed integers. Both behaviors match real CPU operation.',
      },
      {
        question: 'What do bitwise AND, OR, and XOR actually do?',
        answer:
          'AND: each bit is 1 only if BOTH input bits are 1. Used for masking (isolating specific bits). OR: each bit is 1 if EITHER input bit is 1. Used for setting bits. XOR: each bit is 1 if the input bits are DIFFERENT. Used for toggling bits. These three operations, combined with shifts, can implement any boolean function. They are fundamental to cryptography, graphics (color channel extraction), networking (subnet masks), and hardware register manipulation.',
      },
      {
        question: 'What is the difference between big endian and little endian?',
        answer:
          'Endianness describes the byte order of multi-byte values in computer memory. Big endian stores the most significant byte first (at the lowest memory address), like how we write numbers — 0x1234 is stored as [0x12, 0x34]. Little endian stores the least significant byte first — 0x1234 is stored as [0x34, 0x12]. x86 and x64 processors use little-endian, while network protocols (TCP/IP, HTTP) use big-endian (also called network byte order). Some architectures like ARM are bi-endian and can switch. Endianness only matters for multi-byte values — 8-bit values are always the same. When reading binary file formats or network packets, knowing the endianness is essential for correct interpretation.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld', title: 'Binary Number System', url: 'https://mathworld.wolfram.com/Binary.html' },
      { source: 'Wikipedia', title: 'Numeral System', url: 'https://en.wikipedia.org/wiki/Numeral_system' },
      { source: 'Wikipedia', title: "Two's Complement", url: 'https://en.wikipedia.org/wiki/Two%27s_complement' },
    ],
    workedExamples: [
      {
        scenario: 'A programmer wants to understand how 127 + 1 = -128 in 8-bit signed arithmetic. They convert 127 to binary (01111111₂), add 1, and get 10000000₂ which the signed interpretation reads as -128.',
        inputs: { mode: 'Calculate', base: 'Decimal', operation: 'Add', value1: '127', value2: '1', bitWidth: '8' },
        result: 'Result is 10000000₂ = -128 signed, 128 unsigned. Signed overflow flag is set.',
        insight: 'This demonstrates two\'s complement overflow — adding 1 to the maximum positive value wraps to the minimum negative value. The same bit pattern interpreted as unsigned gives 128, the correct mathematical result.',
      },
      {
        scenario: 'A network engineer is converting the IPv4 address 192.168.1.1 to hexadecimal to match a firewall rule. They convert each decimal octet to hex.',
        inputs: { mode: 'Convert', fromBase: 'Decimal', toBase: 'Hex', value: '192' },
        result: '192 decimal = C0 hex. The full address 192.168.1.1 becomes C0.A8.01.01 in hex.',
        insight: 'Networking uses hex extensively: MAC addresses are 12 hex digits, IPv6 addresses use 8 groups of 4 hex digits each, and many protocol fields are defined in hex. This conversion is essential for configuring routers, firewalls, and network monitoring tools.',
      },
    ],
    proTips: [
      'Use 8-bit mode when learning two\'s complement — it has only 256 possible values (-128 to 127) and the patterns are easy to memorize.',
      'The AND operation with 0xFF (255 decimal, 11111111 binary) is the standard way to extract the lowest byte of a value. Use this pattern for byte-level manipulation.',
      'XOR of two identical values always gives 0 — this property is used for fast register clearing (XOR EAX, EAX) and simple encryption (XOR cipher).',
      'Left shift by 1 (x << 1) multiplies by 2; by n multiplies by 2^n. This is faster than multiplication on many CPUs, though modern compilers optimize `x * 8` to `x << 3` automatically.',
      'Hexadecimal is more compact than binary (1 hex digit = 4 bits) and is widely used for memory addresses, color codes, and debugging. Learning to convert between binary, hex, and decimal mentally is a valuable skill.',
    ],
    limitations: [
      'This calculator handles integer arithmetic only — floating-point binary representation (IEEE 754) is a completely different format and is not supported.',
      'Bit widths are limited to standard sizes (8, 16, 32, 64, 128 bits). Arbitrary bit widths and custom word sizes are not supported.',
      'The calculator assumes two\'s complement for signed representation. Other signed integer formats (ones\' complement, sign-magnitude) used in some legacy and specialized systems are not available.',
      'Overflow and carry detection is based on the selected bit width. Without a bit width selected (None), no overflow or carry flags are computed.',
    ],
  },
};

// ─── Conversion logic ───────────────────────────────────────────────────────

interface BreakdownRow {
  digit: string;
  digitValue: number;
  position: number;
  basePower: number;
  contribution: string; // exact decimal string (BigInt-safe)
}

function doConvert(values: Record<string, string>): CalculatorResult[] {
  const fromBaseName = values.fromBase;
  const toBaseName = values.toBase;
  const rawValue = values.value || '';
  const bits = parseBits(values.bitWidth);

  if (!fromBaseName || !toBaseName) return [];

  const fromBase = BASE_MAP[fromBaseName];
  const toBase = BASE_MAP[toBaseName];
  if (fromBase === undefined || toBase === undefined) return [];

  const decimal = parseBigInt(rawValue, fromBase);
  if (decimal === null) return [];

  // Positional breakdown (BigInt-safe)
  const upper = rawValue.trim().toUpperCase();
  const clean = upper.replace(/^-/, '');
  const chars = clean.split('').reverse();
  const breakdownRows: BreakdownRow[] = [];
  let breakdownSum = 0n;
  const baseBI = BigInt(fromBase);

  for (let i = 0; i < chars.length; i++) {
    const d = digitValue(chars[i]);
    if (Number.isNaN(d)) continue;
    const contribution = BigInt(d) * (baseBI ** BigInt(i));
    breakdownSum += contribution;
    breakdownRows.push({
      digit: chars[i],
      digitValue: d,
      position: i,
      basePower: fromBase,
      contribution: contribution.toString(),
    });
  }
  breakdownRows.reverse();

  // Formula string
  const formulaParts = breakdownRows.map(
    (r) => `(${r.digit}×${fromBase}${superscript(r.position)})`
  );
  const formulaStr = formulaParts.join('+') + '=' + decimal.toString();

  // Convert to target base
  const convertedStr = toBaseStr(decimal, toBase);

  const results: CalculatorResult[] = [
    {
      id: 'inputDisplay',
      label: `Input (${fromBaseName})`,
      value: rawValue.trim().toUpperCase(),
    },
    {
      id: 'convertedResult',
      label: `Result (${toBaseName})`,
      value: convertedStr,
      highlight: true,
      color: 'positive',
    },
    {
      id: 'formulaString',
      label: 'Positional Breakdown',
      value: formulaStr,
    },
    {
      id: '_positionalData',
      label: '',
      value: JSON.stringify(breakdownRows),
    },
    ...allBaseResults(decimal, bits),
  ];

  if (fromBase !== toBase) {
    results.push({
      id: 'breakdownSum',
      label: 'Sum of Positional Values',
      value: `${breakdownSum.toString()} (decimal)`,
    });
  }

  // Bit-width context
  if (bits > 0) {
    const masked = toUnsigned(decimal, bits);
    const signed = toSigned(masked, bits);
    results.push({
      id: 'resultBinaryWidth',
      label: `Binary (${bits}-bit, two\'s complement)`,
      value: toBinaryPadded(signed, bits),
    });
    results.push({
      id: 'resultSigned',
      label: `Signed (${bits}-bit decimal)`,
      value: signed.toString(),
    });
    results.push({
      id: 'resultUnsigned',
      label: `Unsigned (${bits}-bit decimal)`,
      value: masked.toString(),
    });

    // Byte layout (endianness)
    const layout = computeByteLayout(masked, bits);
    if (layout) {
      results.push({ id: '_byteLayout', label: '', value: JSON.stringify(layout) });
    }
  }

  return results;
}

// ─── All-base display ───────────────────────────────────────────────────────

function allBaseResults(value: bigint, bits: number, prefix = ''): CalculatorResult[] {
  const base: CalculatorResult[] = [
    { id: prefix + 'resultDecimal', label: 'Decimal', value: value.toString() },
    { id: prefix + 'resultBinary', label: 'Binary', value: formatBinary(toBaseStr(value, 2)) },
    { id: prefix + 'resultHex', label: 'Hexadecimal', value: toBaseStr(value, 16) },
    { id: prefix + 'resultOctal', label: 'Octal', value: toBaseStr(value, 8) },
  ];

  if (bits > 0) {
    const unsigned = toUnsigned(value, bits);
    const signed = toSigned(unsigned, bits);
    base.push(
      { id: prefix + 'resultPaddedBinary', label: `Binary (${bits}-bit)`, value: toBinaryPadded(signed, bits) },
      { id: prefix + 'resultPaddedHex', label: `Hex (${bits}-bit)`, value: toHexPadded(value, bits) },
    );
  }

  return base;
}

// ─── Binary addition detail ─────────────────────────────────────────────────

interface BinaryAddDetail {
  carryBits: string;  // carry-IN to each column, left-to-right
  sumBits: string;
  finalCarry: bigint; // carry out from the most significant bit
}

function computeBinaryAddDetail(a: bigint, b: bigint, bits: number): BinaryAddDetail {
  let carryIn = 0n;
  const carries: string[] = [];
  const sums: string[] = [];

  for (let i = 0; i < bits; i++) {
    const bitA = (a >> BigInt(i)) & 1n;
    const bitB = (b >> BigInt(i)) & 1n;
    const s = bitA ^ bitB ^ carryIn;
    const carryOut = (bitA & bitB) | (bitA & carryIn) | (bitB & carryIn);
    carries.push(carryIn.toString());
    sums.push(s.toString());
    carryIn = carryOut;
  }

  return {
    carryBits: carries.reverse().join(''),
    sumBits: sums.reverse().join(''),
    finalCarry: carryIn,
  };
}

// ─── Calculation logic ──────────────────────────────────────────────────────

function doCalculate(values: Record<string, string>): CalculatorResult[] {
  const baseName = values.base;
  const opKey = values.operation;
  const v1 = (values.value1 || '').trim();
  const v2 = (values.value2 || '').trim();
  const bits = parseBits(values.bitWidth);

  if (!baseName || !opKey) return [];

  const base = BASE_MAP[baseName];
  if (base === undefined) return [];

  const op = OPERATIONS[opKey];
  if (!op) return [];

  const a = parseBigInt(v1, base);
  if (a === null) return [];

  let b = 0n;
  if (op.needsSecond) {
    const parsed = parseBigInt(v2, base);
    if (parsed === null) return [];
    b = parsed;
  }

  // --- Perform operation ---
  let rawResult: bigint;
  if (opKey === 'NOT') {
    // For NOT, we operate on the unsigned value at the bit width, then mask
    const aUnsigned = bits > 0 ? toUnsigned(a, bits) : a;
    const notResult = op.fn(aUnsigned, b);
    if (notResult === null) return [];
    rawResult = bits > 0 ? toUnsigned(notResult, bits) : notResult;
  } else if (['AND', 'OR', 'XOR'].includes(opKey)) {
    // For bitwise binary ops, operate on unsigned values at the bit width
    const aOp = bits > 0 ? toUnsigned(a, bits) : a;
    const bOp = bits > 0 ? toUnsigned(b, bits) : b;
    const result = op.fn(aOp, bOp);
    if (result === null) return [];
    rawResult = bits > 0 ? toUnsigned(result, bits) : result;
  } else if (opKey === 'Left Shift' || opKey === 'Right Shift') {
    // For shifts, left shift the unsigned value, mask; right shift the unsigned value
    const aOp = bits > 0 ? toUnsigned(a, bits) : a;
    const shiftAmount = b < 0n ? 0n : b; // negative shift = no shift
    const shifted = op.fn(aOp, shiftAmount);
    if (shifted === null) return [];
    rawResult = opKey === 'Left Shift' && bits > 0 ? toUnsigned(shifted, bits) : shifted;
  } else {
    // Arithmetic: raw result, but we show both wrapped and unwrapped
    const result = op.fn(a, b);
    if (result === null) return [];
    rawResult = result;
  }

  // --- Build results ---
  const baseStrA = toBaseStr(a, base);
  const baseStrB = op.needsSecond ? toBaseStr(b, base) : '';
  const operatorSymbol = op.label;

  // Wrapped (bit-width-truncated) and signed result
  const masked = bits > 0 ? toUnsigned(rawResult, bits) : rawResult;
  const resultSigned = bits > 0 ? toSigned(masked, bits) : rawResult;
  const resultStr = toBaseStr(resultSigned, base);

  // Operation display
  let operationDisplay: string;
  if (opKey === 'NOT') {
    operationDisplay = `~(${baseStrA})`;
  } else if (opKey === 'Left Shift' || opKey === 'Right Shift') {
    operationDisplay = `${baseStrA} ${operatorSymbol} ${b.toString()}`;
  } else {
    operationDisplay = `${baseStrA} ${operatorSymbol} ${baseStrB}`;
  }

  // Step detail
  let stepDetail = '';
  if (opKey === 'NOT') {
    const binA = bits > 0 ? toBinaryPadded(a, bits) : toBaseStr(a, 2);
    const binR = bits > 0 ? toBinaryPadded(resultSigned, bits) : toBaseStr(resultSigned, 2);
    stepDetail = `NOT flips every bit:\n  Input:   ${binA}₂\n  Output:  ${binR}₂`;
  } else if (opKey === 'Left Shift' || opKey === 'Right Shift') {
    const binA = bits > 0 ? toBinaryPadded(a, bits) : toBaseStr(a, 2);
    const binR = bits > 0 ? toBinaryPadded(resultSigned, bits) : toBaseStr(resultSigned, 2);
    const shiftOp = opKey === 'Left Shift' ? 'left' : 'right';
    stepDetail = `${baseStrA} shifted ${shiftOp} by ${b.toString()}:\n` +
      `  Input:  ${binA}₂\n` +
      `  Shift:  ${b.toString()}\n` +
      `  Result: ${binR}₂`;
  } else if (['AND', 'OR', 'XOR'].includes(opKey)) {
    const binA = bits > 0 ? toBinaryPadded(a, bits) : toBaseStr(a, 2).padStart(8, '0');
    const binB = bits > 0 ? toBinaryPadded(b, bits) : toBaseStr(b, 2).padStart(8, '0');
    const binR = bits > 0 ? toBinaryPadded(resultSigned, bits) : toBaseStr(resultSigned, 2).padStart(8, '0');
    stepDetail = `${binA}₂\n${operatorSymbol} ${binB}₂\n${'─'.repeat(Math.max(binA.length, binB.length, binR.length) + 2)}\n${binR}₂`;
  } else {
    // Arithmetic
    stepDetail = `${baseStrA} ${operatorSymbol} ${baseStrB} = ${toBaseStr(rawResult, base)}`;
    if (bits > 0 && rawResult !== resultSigned) {
      stepDetail += `\n  (wrapped to ${bits}-bit: ${resultStr})`;
    }
  }

  const results: CalculatorResult[] = [
    { id: 'operationDisplay', label: 'Operation', value: operationDisplay },
    {
      id: 'calcResult',
      label: bits > 0 ? `Result (${bits}-bit ${baseName})` : `Result (${baseName})`,
      value: resultStr,
      highlight: true,
      color: 'positive',
    },
  ];

  // Overflow & carry
  if (bits > 0) {
    const overflow = hasSignedOverflow(rawResult, bits);
    const carry = rawResult !== masked;
    if (overflow || carry) {
      const flags: string[] = [];
      if (overflow) flags.push('⚠️ Signed overflow — result exceeds the signed range');
      if (carry) flags.push('⚠️ Carry/borrow — result exceeds the unsigned range');
      results.push({ id: 'flags', label: 'Flags', value: flags.join(' | ') });
    }
  }

  // Binary addition detail for Add/Subtract
  const isAddSub = opKey === 'Add' || opKey === 'Subtract';
  if (isAddSub && bits > 0) {
    const aBI = toUnsigned(a, bits);
    const bBI = opKey === 'Subtract'
      ? toUnsigned(-b, bits) // a - b = a + (-b) in two's complement
      : toUnsigned(b, bits);
    const addDetail = computeBinaryAddDetail(aBI, bBI, bits);
    results.push({
      id: '_binaryAddDetail',
      label: '',
      value: JSON.stringify({ ...addDetail, finalCarry: addDetail.finalCarry.toString() }),
    });
    // The operands for the addition display
    results.push({
      id: '_binaryAddOperands',
      label: '',
      value: JSON.stringify({ a: toBinaryPadded(aBI, bits), b: toBinaryPadded(bBI, bits) }),
    });
  }

  results.push({ id: 'stepDetail', label: 'Step Details', value: stepDetail });

  // Signed/unsigned display
  if (bits > 0) {
    const absMasked = toUnsigned(rawResult, bits);
    const signedVal = toSigned(absMasked, bits);
    results.push(
      { id: 'signedDecimal', label: 'Signed (Decimal)', value: signedVal.toString() },
      { id: 'unsignedDecimal', label: 'Unsigned (Decimal)', value: absMasked.toString() },
    );

    // Byte layout (endianness)
    const layout = computeByteLayout(absMasked, bits);
    if (layout) {
      results.push({ id: '_byteLayout', label: '', value: JSON.stringify(layout) });
    }
  }

  // All-base results
  results.push(...allBaseResults(resultSigned, bits));

  return results;
}

export default binaryHexConfig;
