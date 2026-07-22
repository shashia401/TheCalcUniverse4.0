import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import BigNumberPanel from './BigNumberPanel';
import { createElement } from 'react';

function bigIntOperation(a: string, b: string, op: string): { result: string; remainder?: string; steps: string[] } {
  try {
    const bigA = BigInt(a);
    const bigB = BigInt(b);
    const steps: string[] = [];

    let result: bigint;
    let remainder: string | undefined;
    switch (op) {
      case 'add':
        result = bigA + bigB;
        steps.push(`${a} + ${b} = ${result}`);
        break;
      case 'subtract':
        result = bigA - bigB;
        steps.push(`${a} - ${b} = ${result}`);
        break;
      case 'multiply':
        result = bigA * bigB;
        steps.push(`${a} × ${b} = ${result}`);
        break;
      case 'divide':
        if (bigB === 0n) return { result: '', steps: ['Cannot divide by zero'] };
        result = bigA / bigB;
        const rem = bigA % bigB;
        if (rem !== 0n) remainder = rem.toString();
        steps.push(`${a} ÷ ${b} = ${result}${rem ? ` (remainder ${rem})` : ''}`);
        break;
      case 'power':
        if (bigB < 0n || bigB > 100n) return { result: '', steps: ['Exponent must be 0-100'] };
        result = 1n;
        for (let i = 0n; i < bigB; i++) {
          result *= bigA;
          if (result.toString().length > 10000) {
            return { result: '', steps: ['Result too large (>10,000 digits)'] };
          }
        }
        steps.push(`${a}^${b} = ${result}`);
        break;
      default:
        return { result: '', steps: ['Unknown operation'] };
    }

    return { result: result.toString(), remainder, steps };
  } catch {
    return { result: '', steps: ['Invalid integer input'] };
  }
}

const bigNumberConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'a',
      label: 'Value 1',
      type: 'text',
      placeholder: '12345678901234567890',
      helpText: 'Enter any integer (supports arbitrarily large numbers)',
    },
    {
      id: 'op',
      label: 'Operation',
      type: 'select',
      required: true,
      helpText: 'Choose the arithmetic operation to perform on the two big integers',
      options: [
        { label: 'Add (+)', value: 'add' },
        { label: 'Subtract (−)', value: 'subtract' },
        { label: 'Multiply (×)', value: 'multiply' },
        { label: 'Divide (÷)', value: 'divide' },
        { label: 'Power (^)', value: 'power' },
      ],
    },
    {
      id: 'b',
      label: 'Value 2',
      type: 'text',
      placeholder: '9876543210987654321',
      helpText: 'Second operand (for division and power)',
    },
  ],
  calculate: (values) => {
    const a = values.a?.trim();
    const b = values.b?.trim();
    const op = values.op || 'add';

    if (!a || !b) return [];
    if (!/^-?\d+$/.test(a) || !/^-?\d+$/.test(b)) return [];
    if (isNaN(Number(a)) || isNaN(Number(b))) return [];

    const { result, remainder, steps } = bigIntOperation(a, b, op);
    if (!result) return [];

    // Canonical digit counts (strip leading zeros via BigInt re-parse)
    const canonicalA = BigInt(a).toString();
    const canonicalB = BigInt(b).toString();
    const digitCountA = Math.round(canonicalA.replace(/^-/, '').length);
    const digitCountB = Math.round(canonicalB.replace(/^-/, '').length);
    const digitCountR = Math.round(result.replace(/^-/, '').length);

    const output: CalculatorResult[] = [
      { id: 'result', label: 'Result', value: result, highlight: true, color: 'positive' },
      { id: 'digitCount', label: 'Digits in Result', value: digitCountR.toString() },
      { id: 'digitCountA', label: 'Digits in Value 1', value: digitCountA.toString() },
      { id: 'digitCountB', label: 'Digits in Value 2', value: digitCountB.toString() },
      { id: 'steps', label: 'Steps', value: steps.join(' | ') },
    ];

    if (remainder !== undefined) {
      output.push({ id: 'remainder', label: 'Remainder', value: remainder });
    }

    return output;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BigNumberPanel, { values, results });
  },
  educational: {
    formula: 'Arbitrary-precision integer arithmetic: a + b, a - b, a x b, a / b, a^b',
    formulaDescription:
      'Big number arithmetic uses JavaScript BigInt to handle integers of any size, limited only by available memory. Standard 64-bit numbers overflow at roughly 9 quadrillion (about 16 digits). BigInt handles numbers with thousands of digits, making it essential for cryptography, astronomy, and advanced combinatorics where exact integer precision matters. Addition and subtraction operate directly on the BigInt values. Multiplication computes the full product without truncation. Integer division returns both the quotient and remainder, preserving all information from the operation. The power function uses iterative multiplication with safety caps at exponent 100 and 10,000 digit results.',
    variables: [
      { symbol: 'a, b', name: 'Operands', description: 'The two integers to operate on. Can be positive or negative and can have hundreds or thousands of digits. Only integer values are supported — decimal numbers are not supported by BigInt. Enter numbers as plain digits with an optional leading minus sign for negative values.' },
      { symbol: 'Digit Count', name: 'Result Length', description: 'Shows how many digits are in the result, useful for estimating magnitude at a glance. A result with 500 digits is astronomically larger than one with 50 digits — each additional digit multiplies the possible range by 10.' },
      { symbol: 'Remainder', name: 'Integer Division Remainder', description: 'For division operations, shows the remainder after integer division. This is the amount left over after dividing the two numbers evenly. Together with the quotient, the remainder provides the complete division result.' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" fill="var(--svg-374151)" font-size="11" font-weight="bold">Place Value &amp; Big Number Precision</text><rect x="10" y="30" width="43" height="50" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="31" y="50" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="9">Trill</text><text x="31" y="64" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="8">ions</text><rect x="53" y="30" width="43" height="50" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="74" y="50" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="9">Bill</text><text x="74" y="64" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="8">ions</text><rect x="96" y="30" width="43" height="50" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="117" y="50" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="9">Mill</text><text x="117" y="64" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="8">ions</text><rect x="139" y="30" width="43" height="50" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="160" y="50" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="9">Thous</text><text x="160" y="64" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="8">ands</text><rect x="182" y="30" width="43" height="50" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><text x="203" y="50" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="9">Ones</text><rect x="225" y="30" width="43" height="50" fill="var(--svg-fef3c7)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="3"/><text x="246" y="50" text-anchor="middle" fill="var(--svg-991b1b)" font-size="8">Limit</text><text x="246" y="64" text-anchor="middle" fill="var(--svg-991b1b)" font-size="8">~9Q</text><rect x="268" y="30" width="43" height="50" fill="var(--svg-fecaca)" stroke="var(--svg-ef4444)" stroke-width="1.5" stroke-dasharray="3" rx="3"/><text x="289" y="55" text-anchor="middle" fill="var(--svg-991b1b)" font-size="8">Big</text><text x="289" y="68" text-anchor="middle" fill="var(--svg-991b1b)" font-size="8">Int!</text><line x1="225" y1="85" x2="270" y2="85" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="245" y="95" text-anchor="middle" fill="var(--svg-ef4444)" font-size="9">Standard 64-bit overflow</text><text x="160" y="115" text-anchor="middle" fill="var(--svg-059669)" font-size="11" font-weight="bold">BigInt handles thousands of digits</text><text x="160" y="135" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">Example: 2^100 has 31 digits</text><text x="160" y="155" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">2^500 has >150 digits</text><rect x="30" y="170" width="260" height="22" fill="var(--svg-e5e7eb)" rx="4"/><text x="160" y="184" text-anchor="middle" fill="var(--svg-374151)" font-size="10">Exact integer arithmetic, no rounding</text></svg>',
      alt: 'Place value chart showing standard number limit and BigInt arbitrary-precision extension',
      caption: 'Big Number arithmetic handles integers of any size using JavaScript BigInt, beyond the 64-bit precision limit.',
    },
    howToUse: [
      'Enter two integers of any size — numbers with hundreds of digits are supported. You can copy-paste large numbers directly from other sources.',
      'Select an operation: add, subtract, multiply, divide (integer division with remainder), or power (exponent). Each operation shows the exact result immediately.',
      'View the exact result without any precision loss, rounding, or scientific notation. Every digit is preserved exactly as computed.',
      'Check the digit counts for each value to appreciate the magnitude of the numbers and result at a glance.',
      'Power operations are capped at exponent 100 and results are limited to 10,000 digits to prevent browser freezing or excessive memory consumption.',
      'Use the extra panel visualization to see the place value breakdown and understand where standard 64-bit arithmetic would fail.',
    ],
    explanation:
      'Arbitrary-precision integer arithmetic is the ability to perform calculations on integers of any size without losing precision. Standard JavaScript numbers use the IEEE 754 64-bit floating-point format, which can only represent integers exactly up to 2^53 (about 9 quadrillion or 9,007,199,254,740,991). Beyond this point, precision is silently lost — digits are rounded off and results become incorrect. This is known as the "integer precision limit" and has caused real-world bugs in financial systems, scientific computing, and database operations. The concept of arbitrary-precision computation dates back to the earliest days of computing: John von Neumann discussed the need for exact arithmetic in his 1945 "First Draft of a Report on the EDVAC," and early Lisp systems in the 1950s included "bignum" libraries. Today, modern cryptography depends on arbitrary-precision arithmetic: RSA encryption uses prime numbers with hundreds of digits, and elliptic curve cryptography requires exact operations on large integers. This calculator uses JavaScript BigInt, introduced in ES2020, which can handle integers with thousands of digits — limited only by available browser memory. For perspective, a number with just 100 digits is already larger than the estimated number of atoms in the observable universe (about 10^80). The calculator supports five basic operations: addition, subtraction, multiplication, integer division (with remainder), and exponentiation. The digit count display helps you quickly grasp the magnitude of results — each additional digit increases the number range tenfold.',
    commonUses: [
      'Cryptography and cybersecurity: working with RSA keys (typically 2048-bit, about 617 digits) and Diffie-Hellman key exchange parameters that require exact big-integer arithmetic',
      'Number theory research: exploring properties of very large primes, Mersenne primes (the largest known primes have over 24 million digits), and perfect numbers',
      'Combinatorics and probability: computing exact factorial values, binomial coefficients, and permutation counts for large n where approximations are insufficient',
      'Astronomy and physics: calculating extremely large distances (the observable universe is about 8.8 x 10^26 meters across), particle counts, and cosmological parameters',
      'Educational demonstrations: showing students the limits of standard floating-point arithmetic and the importance of arbitrary-precision computation in computer science',
    ],
    workedExamples: [
      {
        scenario: 'A cryptographer, Dr. Patel, is verifying an RSA key generation routine. The public modulus n = p x q where p and q are large primes. She needs to multiply 1,234,567,890,123,456,789,012,345 by 9,876,543,210,987,654,321,098,765 to verify the library produces the correct result.',
        inputs: { a: '1234567890123456789012345', b: '9876543210987654321098765', op: 'multiply' },
        result: '12193263113702179522618503273362292307411849925 (49 digits)',
        insight: 'The result has 49 digits and equals the full product without any rounding. A standard JavaScript multiplication would lose precision after about 16 digits and produce an incorrect scientific-notation approximation. The exact product can be verified against the cryptographic library implementation to ensure correctness.',
      },
      {
        scenario: 'Professor Chen is teaching number theory and wants to demonstrate how factorials grow. She computes 2^100 exactly to show how fast exponential functions grow compared to polynomial ones — a key insight for algorithm complexity analysis.',
        inputs: { a: '2', b: '100', op: 'power' },
        result: '1267650600228229401496703205376 (31 digits)',
        insight: '2^100 = 1,267,650,600,228,229,401,496,703,205,376 — a 31-digit number. This exceeds JavaScript\'s safe integer limit by many orders of magnitude. Standard floating-point would give only "1.2676506002282294e30" which rounds about 18 significant digits. The exact value reveals all 31 digits precisely.',
      },
      {
        scenario: 'An astronomer is comparing the mass of the Sun (1.989 x 10^30 kg) to the estimated number of stars in the observable universe (about 10^23). She needs the exact product to estimate total stellar mass without floating-point error.',
        inputs: { a: '1989000000000000000000000000000', b: '100000000000000000000000', op: 'multiply' },
        result: '198900000000000000000000000000000000000000000000000000 (54 digits)',
        insight: 'The exact product shows the total stellar mass estimate without any floating-point rounding. The digit count comparison between the inputs and output illustrates how astronomical numbers compound when multiplied — a key insight for astrophysics calculations where precision matters for gravitational models.',
      },
    ],
    proTips: [
      'For cryptography work, always verify your BigInt results using an independent implementation or known test vectors. RSA key generation bugs from incorrect big-integer multiplication have caused real-world security vulnerabilities.',
      'When working with extremely large exponents, remember that the number of digits in a^b is approximately b x log10(a). A 10-digit base raised to the 100th power produces roughly 1,000 digits — right at the edge of practical computation in a browser.',
      'BigInt operations in JavaScript are generally slower than native 64-bit arithmetic because they are implemented in software, not hardware. For repeated operations on numbers under 2^53, consider using regular Number type for performance.',
      'Use the digit count feature as a quick sanity check: if your expected result should have roughly n digits but the output shows significantly more or fewer digits, you likely have an input error or operand swap.',
      'For division, remember that BigInt division truncates toward zero (not floor). The remainder has the same sign as the dividend, which matches the Euclidean division convention used in most mathematical contexts.',
    ],
    limitations: [
      'This calculator only supports integer arithmetic — decimal numbers and fractions are not supported by JavaScript BigInt. For decimal arithmetic with large numbers, scale your values by an appropriate power of 10 (e.g., work in cents instead of dollars) or use a specialized decimal library.',
      'Power operations are capped at exponent 100 for safety. Computing a^b where b > 100 could cause the browser to become unresponsive. Results exceeding 10,000 digits are rejected to prevent memory exhaustion.',
      'Division uses integer division (truncation toward zero), not floating-point division. The remainder is shown separately. Negative numbers are supported for basic operations, but power operations with negative exponents are not supported because they produce non-integer results.',
      'This tool does not support modular arithmetic, greatest common divisor, primality testing, or modular exponentiation — all common needs in number theory and cryptography. Use our specialized GCF, LCM, and Prime Number calculators for those operations.',
    ],
    quickReference: [
      { label: 'BigInt range', value: 'Arbitrary size, limited by memory' },
      { label: 'Standard JS limit', value: '2^53 ≈ 9,007,199,254,740,991' },
      { label: 'Addition', value: 'a + b (direct BigInt)' },
      { label: 'Subtraction', value: 'a - b (direct BigInt)' },
      { label: 'Multiplication', value: 'a x b (full product)' },
      { label: 'Division', value: 'quotient + remainder' },
      { label: 'Power max exponent', value: '100 (safety limit)' },
      { label: 'Max result digits', value: '10,000 (memory limit)' },
    ],
    faqs: [
      {
        question: 'How big of numbers can this calculator handle?',
        answer: 'This calculator uses JavaScript BigInt, which supports arbitrarily large integers limited only by available memory. Numbers with thousands of digits work reliably. However, power operations are capped at exponent 100 to prevent browser slowdown, and results exceeding 10,000 digits are rejected. In practice, numbers with even 100 digits are far larger than the number of atoms in the observable universe (about 10^80), so the practical limit is more than sufficient for almost all real-world applications.',
      },
      {
        question: 'Why not use a regular calculator for big numbers?',
        answer: 'Standard calculators and JavaScript numbers use 64-bit floating-point format (IEEE 754 double precision). This gives about 15-17 significant digits of precision. Beyond that, digits are silently dropped, producing incorrect results. For example, 10,000,000,000,000,000 + 1 equals 10,000,000,000,000,000 in standard JavaScript — the +1 is lost entirely. This calculator gives exact results for integers of any size, which is essential for cryptography, scientific computing, and number theory.',
      },
      {
        question: 'Does BigInt support decimal numbers?',
        answer: 'No, BigInt only works with integers. For decimal arithmetic with large numbers, you would need a specialized decimal library such as decimal.js or big.js. This calculator focuses on exact integer arithmetic, which is the most common use case for arbitrary-precision computation. If you need to work with large decimal numbers, consider scaling them by a power of 10 first — for example, work in cents instead of dollars, or nanometers instead of meters.',
      },
      {
        question: 'What happens when I divide two BigInts?',
        answer: 'BigInt division performs integer division (truncation toward zero) and the calculator shows both the quotient and the remainder. For example, 10 divided by 3 gives quotient 3 with remainder 1. The remainder always has the same sign as the dividend (the number being divided). This follows the Euclidean division convention and preserves all information from the division — the original dividend equals (quotient x divisor) + remainder.',
      },
      {
        question: 'Why is the power operation limited to exponent 100?',
        answer: 'Exponentiation grows extremely fast. Even a small base like 2 raised to the 1000th power produces a number with over 300 digits. For large bases, the result can quickly consume gigabytes of memory and freeze the browser. The exponent cap of 100 and the 10,000-digit result limit are safety measures to ensure the calculator remains responsive. For most practical applications — including cryptography, where RSA exponents are typically 65,537 (the F4 prime) — exponent 100 is more than sufficient.',
      },
      {
        question: 'How does this compare to Python\'s arbitrary-precision integers?',
        answer: 'Python has supported arbitrary-precision integers natively since its inception — in Python, integers automatically expand to accommodate any size. JavaScript BigInt (introduced in ES2020) provides similar capabilities but with some differences: BigInt requires the "n" suffix for literals (e.g., 123n), cannot be mixed with regular Number types without explicit conversion, and does not support decimals (unlike Python\'s decimal module). Both languages implement arbitrary-precision using similar algorithms (Karatsuba multiplication for medium-sized numbers, Toom-Cook or FFT for very large ones). This calculator provides a Python-like experience in the browser by handling all the BigInt details for you.',
      },
      {
        question: 'Can I use this for modular arithmetic or prime number testing?',
        answer: 'This calculator focuses on the five basic arithmetic operations (add, subtract, multiply, divide, power) and does not include modular arithmetic functions like modulo, modular exponentiation, or modular inverse. For prime number testing, factorization, or modular arithmetic, check out our specialized calculators: Prime Number Calculator (primality testing and factorization), GCF Calculator (greatest common factor), and LCM Calculator (least common multiple), all linked below in the related calculators section.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Arbitrary-Precision Arithmetic', url: 'https://en.wikipedia.org/wiki/Arbitrary-precision_arithmetic' },
      { source: 'Wolfram MathWorld - Large Numbers', url: 'https://mathworld.wolfram.com/LargeNumber.html' },
      { source: 'MDN Web Docs - BigInt', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt' },
    ],
  },
};

export default bigNumberConfig;
