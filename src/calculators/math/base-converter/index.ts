import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import BaseConverterPanel from './BaseConverterPanel';

/**
 * Check that every character in `input` is valid for the given `fromBase`.
 * Digits 0-9 are valid positions 0-9. Letters A-Z (case-insensitive) are
 * valid positions 10-35.
 */
function isValidForBase(input: string, fromBase: number): boolean {
  const upper = input.toUpperCase();
  for (const ch of upper) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      // 0-9
      if (code - 48 >= fromBase) return false;
    } else if (code >= 65 && code <= 90) {
      // A-Z
      if (code - 65 + 10 >= fromBase) return false;
    } else {
      // Not a valid digit character
      return false;
    }
  }
  return upper.length > 0;
}

/**
 * Parse the input string as a number in the given base (2-36) and
 * return the decimal value, or NaN if invalid.
 */
function parseInBase(input: string, fromBase: number): number {
  return parseInt(input, fromBase);
}

/**
 * Convert a decimal number to a target base (2-36) string.
 * Uses upper-case letters for digits > 9.
 */
function convertToBase(decimal: number, toBase: number): string {
  if (decimal === 0) return '0';
  return decimal.toString(toBase).toUpperCase();
}

const baseConverterConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'input',
      label: 'Input Number',
      type: 'text',
      placeholder: 'Enter number',
      required: true,
      helpText: 'Enter the digits of the number you want to convert. Use letters A-Z for digits above 9.',
    },
    {
      id: 'fromBase',
      label: 'From Base',
      type: 'number',
      placeholder: '10',
      defaultValue: '10',
      required: true,
      min: 2,
      max: 36,
      inputMode: 'numeric',
      helpText: 'The base of the input number (2 to 36).',
    },
    {
      id: 'toBase',
      label: 'To Base',
      type: 'number',
      placeholder: '2',
      defaultValue: '2',
      required: true,
      min: 2,
      max: 36,
      inputMode: 'numeric',
      helpText: 'The base to convert to (2 to 36).',
    },
  ],

  calculate: (values) => {
    const input = (values.input || '').trim().toUpperCase();
    const fromBaseRaw = values.fromBase;
    const toBaseRaw = values.toBase;

    if (!input || !fromBaseRaw || !toBaseRaw) return [];

    const fromBase = parseInt(fromBaseRaw, 10);
    const toBase = parseInt(toBaseRaw, 10);

    if (isNaN(fromBase) || isNaN(toBase)) return [];
    if (fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) return [];

    // Validate all digits are valid for the source base
    if (!isValidForBase(input, fromBase)) return [];

    // Parse as decimal
    const decimal = parseInBase(input, fromBase);
    if (isNaN(decimal)) return [];

    // Handle special large-number edge case: if parseInt can't represent it
    // (e.g., very large numbers), it returns NaN or Infinity
    if (!isFinite(decimal)) return [];

    // Convert to target base
    const converted = convertToBase(decimal, toBase);

    // Length of result (digit count)
    const length = converted.length;

    // Build validation info
    const originalValid = `All digits valid in base ${fromBase}`;

    return [
      {
        id: 'result',
        label: `Result (base ${toBase})`,
        value: converted,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'decimalValue',
        label: 'Intermediate Decimal',
        value: decimal.toString(),
      },
      {
        id: 'originalValid',
        label: 'Input Validation',
        value: originalValid,
      },
      {
        id: 'length',
        label: 'Digit Count in Result',
        value: length.toString(),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BaseConverterPanel, { values, results });
  },
  educational: {
    formula: 'N_b = d_{n-1} × b^{n-1} + d_{n-2} × b^{n-2} + ... + d_0 × b^0',
    formulaDescription:
      'A number in any base b is represented as a sequence of digits where each digit position represents a power of the base. Converting between bases involves first interpreting the number in its source base (expanding each digit multiplied by base raised to its positional power) and then expressing that decimal value in the target base by repeatedly dividing by the target base and collecting remainders.',
    variables: [
      {
        symbol: 'b',
        name: 'Base',
        description: 'The number of unique digits used in a positional numeral system. Binary (b=2) uses 0-1, decimal (b=10) uses 0-9, hexadecimal (b=16) uses 0-9 and A-F, and base-36 uses all digits 0-9 and letters A-Z representing values 10-35.',
      },
      {
        symbol: 'd_i',
        name: 'Digit at Position i',
        description: 'Each digit in the number represents a coefficient at a specific positional power of the base. Position i=0 is the rightmost (units) position, i=1 is the next (b^1 position), and so on. The value contributed by digit d at position i is d × b^i.',
      },
      {
        symbol: 'N_b',
        name: 'Number in Base b',
        description: 'The complete number expressed in the positional numeral system with base b. The total decimal value is the sum of all digit contributions: Σ (d_i × b^i) for all positions i from 0 to n-1, where n is the digit count.',
      },
      {
        symbol: 'n',
        name: 'Digit Count',
        description: 'The number of digits in the converted result. Also called the length of the representation. A larger base generally produces fewer digits to represent the same value. For example, 255 decimal = FF in hex (2 digits) = 11111111 in binary (8 digits).',
      },
    ],
    howToUse: [
      'Enter the number you want to convert in the "Input Number" field. Use uppercase letters A-Z for digits above 9 (e.g., "FF" for 255 in hex, "101010" for 42 in binary).',
      'Set "From Base" to the base of your input number (minimum 2, maximum 36). For example, set 16 for hexadecimal input, 2 for binary, 10 for decimal, 8 for octal.',
      'Set "To Base" to the target base you want to convert to. The calculator converts the input to decimal first, then to the target base using repeated division.',
      'Review the converted result (highlighted), the intermediate decimal value for verification, the input validation status confirming all digits are valid for the source base, and the digit count.',
      'For base conversions above 10, remember that letters A (10) through Z (35) represent digits beyond 9. For example, "1A" in base 16 = 1×16¹ + 10×16⁰ = 26 in decimal.',
    ],
    explanation:
      'Number base conversion is a fundamental concept in mathematics and computer science with roots in ancient civilizations. The Babylonians used a sexagesimal (base-60) system around 2000 BCE, which still influences our measurement of time (60 seconds per minute) and angles (360 degrees in a circle). The Mayans independently developed a vigesimal (base-20) system, while the Hindu-Arabic decimal system we use today originated in India around 500 CE and reached Europe through Arabic mathematicians in the 10th century. Every positional numeral system represents numbers using a fixed set of digits and positional weights that are powers of the base. In base 10 (decimal), which we use in everyday life, the digits 0-9 are multiplied by powers of 10: the number 342 means 3×10² + 4×10¹ + 2×10⁰ = 300 + 40 + 2. The same principle applies to any base. Binary (base 2) uses only two digits (0 and 1) and powers of 2, making it the natural language of digital circuits where each bit represents an on/off state — the German mathematician Gottfried Wilhelm Leibniz developed the modern binary system in 1679. Hexadecimal (base 16) is widely used in computing because one hex digit corresponds exactly to four binary digits (a nibble), making it much more compact for representing binary data. Converting a number from its source base to a target base follows a two-step process. First, interpret the source representation by expanding: multiply each digit by the source base raised to its positional power and sum the results to get the decimal value. Second, convert the decimal to the target base: repeatedly divide the decimal number by the target base, collecting the remainders from right to left, which become the digits of the result. This algorithm, known as the division-remainder method, works for any base between 2 and 36.',
    diagram: {
      svg: '<svg viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="300" y="24" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="var(--svg-1e293b)" text-anchor="middle">How Base Conversion Works — Two-Step Process</text>' +
        '<rect x="20" y="40" width="140" height="180" rx="8" fill="var(--svg-f0fdf4)" stroke="var(--svg-22c55e)" stroke-width="1.5"/>' +
        '<text x="90" y="62" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="var(--svg-15803d)" text-anchor="middle">Step 1: Parse</text>' +
        '<text x="90" y="80" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-475569)" text-anchor="middle">Source base → Decimal</text>' +
        '<text x="90" y="100" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Example: 2A₁₆</text>' +
        '<text x="90" y="116" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">= 2×16¹ + 10×16⁰</text>' +
        '<text x="90" y="132" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">= 32 + 10 = 42₁₀</text>' +
        '<rect x="90" y="150" width="40" height="24" rx="4" fill="var(--svg-15803d)"/>' +
        '<text x="110" y="166" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="var(--svg-ffffff)" text-anchor="middle">42</text>' +
        '<polygon points="168,130 188,130 178,115" fill="var(--svg-64748b)"/>' +
        '<polygon points="168,140 188,140 178,155" fill="var(--svg-64748b)"/>' +
        '<rect x="230" y="40" width="140" height="180" rx="8" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>' +
        '<text x="300" y="62" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="var(--svg-1d4ed8)" text-anchor="middle">Step 2: Convert</text>' +
        '<text x="300" y="80" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-475569)" text-anchor="middle">Decimal → Target base</text>' +
        '<text x="300" y="100" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">42 ÷ 2 = 21 r 0 ↑</text>' +
        '<text x="300" y="116" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">21 ÷ 2 = 10 r 1</text>' +
        '<text x="300" y="132" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">10 ÷ 2 = 5 r 0</text>' +
        '<text x="300" y="148" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">5 ÷ 2 = 2 r 1</text>' +
        '<text x="300" y="164" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">2 ÷ 2 = 1 r 0</text>' +
        '<text x="300" y="180" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">1 ÷ 2 = 0 r 1</text>' +
        '<rect x="280" y="192" width="40" height="24" rx="4" fill="var(--svg-1d4ed8)"/>' +
        '<text x="300" y="208" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="var(--svg-ffffff)" text-anchor="middle">101010</text>' +
        '<polygon points="378,130 398,130 388,115" fill="var(--svg-64748b)"/>' +
        '<polygon points="378,140 398,140 388,155" fill="var(--svg-64748b)"/>' +
        '<rect x="440" y="40" width="140" height="180" rx="8" fill="var(--svg-fdf4ff)" stroke="var(--svg-a855f7)" stroke-width="1.5"/>' +
        '<text x="510" y="62" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="var(--svg-7e22ce)" text-anchor="middle">Result</text>' +
        '<text x="510" y="85" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-475569)" text-anchor="middle">2A₁₆ = 101010₂</text>' +
        '<text x="510" y="110" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-475569)" text-anchor="middle">Same value</text>' +
        '<text x="510" y="128" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-475569)" text-anchor="middle">different representation</text>' +
        '<rect x="485" y="145" width="50" height="30" rx="6" fill="var(--svg-a855f7)"/>' +
        '<text x="510" y="164" font-family="system-ui,sans-serif" font-size="10" font-weight="700" fill="var(--svg-ffffff)" text-anchor="middle">1:1 Value</text>' +
        '<text x="510" y="200" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Source digits valid?</text>' +
        '<text x="510" y="214" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Result digit count</text>' +
        '<text x="300" y="248" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Parse using positional expansion, then repeatedly divide by the target base collecting remainders</text>' +
        '</svg>',
      alt: 'Diagram showing the two-step base conversion process: step 1 parses the source number to decimal, step 2 converts decimal to the target base by repeated division',
      caption: 'Base conversion is a two-step process: first parse the source representation into a decimal value, then convert that decimal to the target base by repeated division.',
    },
    commonUses: [
      'Computer science and programming — converting between binary, octal, hexadecimal, and decimal for low-level programming, memory addressing, color codes, and debugging.',
      'Digital electronics and embedded systems — working with register values, memory maps, and hardware configuration where hexadecimal and binary are standard notations.',
      'Networking — converting IP addresses between dotted-decimal and binary notation, subnet masks, and MAC addresses between decimal and hexadecimal representations.',
      'Cryptography and data encoding — understanding base-64 encoding concepts and working with hash values displayed in hexadecimal format, commonly used in blockchain and digital signatures.',
      'Educational settings — learning how positional numeral systems work across different cultures and building intuition about number representation in computer science curricula.',
    ],
    quickReference: [
      { label: 'Binary (base 2)', value: '0, 1' },
      { label: 'Octal (base 8)', value: '0–7' },
      { label: 'Decimal (base 10)', value: '0–9' },
      { label: 'Hexadecimal (base 16)', value: '0–9, A–F' },
      { label: 'Base 36', value: '0–9, A–Z' },
      { label: '255 decimal', value: 'FF in hex, 11111111 in binary' },
      { label: '42 decimal', value: '2A in hex, 101010 in binary, 52 in octal' },
      { label: 'Powers of 2 shortcut', value: '4 binary bits = 1 hex digit (nibble)' },
    ],
    workedExamples: [
      {
        scenario: 'Carlos, a firmware engineer, is debugging a microcontroller that reports a register value of 0x7B in hexadecimal. The datasheet says bits 3-5 control the clock divider. He needs to see the binary representation to extract those bits.',
        inputs: { input: '7B', fromBase: '16', toBase: '2' },
        result: '1111011 (base 2), Decimal = 123',
        insight: '0x7B in binary is 1111011 (or padded to 8 bits: 01111011). Bits 3-5 (counting from bit 0 at right) are positions 3, 4, 5: 111. The clock divider value is 7. Carlos can now configure the clock register correctly. Understanding binary-to-hex relationships is essential for embedded programming — each hex digit maps to exactly 4 binary digits, making hex the preferred notation for register values.',
      },
      {
        scenario: 'Aisha, a computer science student, is studying for her networking exam. She needs to convert the subnet mask 255.255.255.0 from dotted-decimal to binary notation to understand how many host bits are available.',
        inputs: { input: '255', fromBase: '10', toBase: '2' },
        result: '11111111 (base 2), Decimal = 255',
        insight: '255 in binary is 11111111, so the full mask in binary is 11111111.11111111.11111111.00000000. The eight zeros at the end mean there are 2^8 = 256 possible addresses (254 usable hosts excluding network and broadcast addresses). Aisha converts each octet individually using the calculator, verifying her understanding of subnetting fundamentals — the number of consecutive 1-bits in the binary mask determines the network prefix length (/24 in CIDR notation).',
      },
      {
        scenario: 'David, a web developer, is working with URL shorteners and needs to understand base conversion for generating compact IDs. He wants to encode a database ID like 1234567 into base-62 (0-9, a-z, A-Z) or the nearest supported base-36 for a compact URL-safe string.',
        inputs: { input: '1234567', fromBase: '10', toBase: '36' },
        result: 'QGLJ (base 36), Decimal = 1234567',
        insight: '1234567 in base 36 is QGLJ. This is a 4-character ID instead of a 7-character decimal ID — a 43% reduction in length. Base-36 encoding uses all alphanumeric characters (0-9, A-Z), making it URL-safe without case sensitivity issues. For production URL shorteners, base-62 (adding lowercase letters) would compress further, giving even shorter IDs, but base-36 is the maximum this calculator supports since base-62 requires additional character distinctions beyond the 36 alphanumeric symbols.',
      },
    ],
    proTips: [
      'When converting between binary and hexadecimal, use the nibble shortcut: each hex digit is exactly 4 binary digits. Group binary digits from right to left in groups of 4. For example, binary 11010011 groups as 1101 0011 = D3 in hex. This is far faster than converting to decimal first.',
      'For powers-of-two bases (2, 4, 8, 16, 32), conversions are exact and lossless. For bases that are not powers of two, there may be fractional representation differences, though this calculator handles integers only, so all conversions are exact.',
      'The digit count follows the formula: digits needed = floor(log_base(value)) + 1. Use this to predict how large your result will be before converting. A decimal number with d digits will have roughly d × log₁₀(base) digits in the target base.',
      'Invalid digit detection is automatic: if you try to parse "39" as octal (base 8), the calculator rejects it because digit 9 does not exist in base 8. Similarly, "G" is invalid in hexadecimal despite being a letter. Each base accepts digits from 0 to (base-1).',
      'For color code conversions in web development (e.g., #FF5733), each pair of hex digits represents one RGB channel. FF = 255 (red), 57 = 87 (green), 33 = 51 (blue). While this calculator handles the numeric conversion, specialized color picker tools integrate this logic with visual previews.',
      'The intermediate decimal value shown in results is your verification checkpoint. If the decimal looks wrong, the parse step had an error — double-check your input digits and source base. If the decimal is correct but the result looks wrong, the conversion step had an issue — verify the target base.',
    ],
    limitations: [
      'This calculator handles integer conversions only between bases 2 through 36. Fractional numbers (e.g., 10.5 in base 2) are not supported — fractional base conversion requires a separate algorithm that multiplies the fractional part by the base and collects integer parts.',
      'Numbers exceeding JavaScript\'s safe integer range (Number.MAX_SAFE_INTEGER = 9,007,199,254,740,991) may lose precision during the decimal intermediate step. For arbitrary-precision base conversion of very large integers, use the Big Number calculator with its BigInt support.',
      'Bases beyond 36 are not supported as they would require additional symbol sets beyond 0-9 and A-Z. Base-64 encoding (which uses + and /) and other non-standard positional systems like balanced ternary or negative bases are out of scope.',
      'Do not use this calculator for IEEE 754 floating-point representation analysis, bitwise operation visualization, or endianness conversion. These are specialized hardware-level concerns handled by dedicated tools.',
    ],
    faqs: [
      {
        question: 'How do I know if my input digits are valid for the selected source base?',
        answer: 'Each digit must be less than the base. In base 10, valid digits are 0-9. In base 2 (binary), only 0 and 1 are valid. In base 16 (hexadecimal), valid digits are 0-9 and A-F. In base 36, valid digits are 0-9 and A-Z. The calculator checks every digit and returns an empty result if any digit is invalid for the specified source base. For example, entering "2G" with base 16 would be invalid because G (value 16) equals the base and is not allowed for base 16.',
      },
      {
        question: 'Why does the same number have different digit counts in different bases?',
        answer: 'Digit count is inversely related to the size of the base. A larger base can represent more values per digit, so fewer digits are needed. For example, the number 255 (decimal) requires 8 digits in binary (11111111), 3 digits in octal (377), 2 digits in hex (FF), and 3 digits in decimal (255). This relationship follows from the formula: digit count = floor(log_base(value)) + 1. Understanding this helps explain why hexadecimal is preferred over binary for human readability in computing.',
      },
      {
        question: 'What happens if I use a base larger than 36?',
        answer: 'This calculator only supports bases 2 through 36. Bases beyond 36 would require additional symbols beyond the 10 decimal digits and 26 letters of the English alphabet. While arbitrary bases are theoretically possible, they are rarely used in practice. Base 36 is the largest base that can be represented using only alphanumeric characters (0-9 and A-Z). For contexts requiring larger bases, specialized notations exist (such as base-64 encoding), but they use additional characters like + and /.',
      },
      {
        question: 'How do I convert between bases without a calculator?',
        answer: 'To convert from any base to decimal, multiply each digit by the base raised to its positional power (starting from 0 at the rightmost position) and sum the results. To convert from decimal to another base, repeatedly divide by the target base and read the remainders from bottom to top. For powers-of-two bases (binary, octal, hex), there is a shortcut: group binary digits and convert each group directly (4 bits = 1 hex digit, 3 bits = 1 octal digit). For example, binary 11010011 can be grouped as 1101 0011 = D3 in hex.',
      },
      {
        question: 'What are the most common base conversions in programming?',
        answer: 'The most common conversions are: binary to hex (each group of 4 bits = 1 hex digit), hex to decimal (for color codes like #FF5733 and memory addresses), decimal to binary (for bitmask and flag calculations), and hex to binary (for understanding individual bit patterns). Most programming languages provide built-in functions for these: parseInt(str, radix) and Number.toString(radix) in JavaScript, int(str, base) in Python, and Integer.parseInt(str, radix)/Integer.toString(int, radix) in Java.',
      },
      {
        question: 'Why did ancient civilizations use different number bases?',
        answer: 'Different bases evolved from practical counting methods. The Babylonians used base-60 (sexagesimal) because 60 has many divisors (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30), making division without fractions easier for trade and astronomy. This system survives today in our 60-second minutes and 360-degree circles. The Mayans used base-20 (vigesimal), likely counting on fingers and toes. Base-12 (duodecimal) appears in dozens and grosses from medieval European trade. The decimal system (base-10) prevailed primarily because humans have 10 fingers, making it the most intuitive counting system across cultures.',
      },
      {
        question: 'What is the relationship between binary, octal, and hexadecimal?',
        answer: 'Binary, octal, and hexadecimal are all powers-of-two bases. Octal (base 8 = 2³) maps 3 binary digits to 1 octal digit, while hexadecimal (base 16 = 2⁴) maps 4 binary digits to 1 hex digit. This makes conversion between them trivial: group binary digits and convert each group directly. Octal was historically important in early computing (e.g., the PDP-11 used octal notation), but hexadecimal has largely replaced octal in modern computing because 8-bit bytes map cleanly to exactly 2 hex digits, whereas 8 bits do not divide evenly into octal groups.',
      },
    ],
    citations: [
      { source: 'Wikipedia — Positional Notation', url: 'https://en.wikipedia.org/wiki/Positional_notation' },
      { source: 'Khan Academy — Number Base Conversion', url: 'https://www.khanacademy.org/math/algebra-home/alg-intro-to-algebra/algebra-alternate-number-bases/v/number-systems-introduction' },
    ],
  },
};

export default baseConverterConfig;
