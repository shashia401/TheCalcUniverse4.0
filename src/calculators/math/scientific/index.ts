import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ScientificPanel from './ScientificPanel';
import { safeEval as sharedSafeEval } from '../shared/safeEval';

function safeEval(expr: string): string {
  try {
    // Preprocess display characters and factorial expansion only.
    // Everything else (sin, cos, pi, e, ^, etc.) is handled by the shared safe evaluator.
    const sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/(\d+)!/g, (_, n: string) => {
        let f = 1;
        for (let i = 2; i <= parseInt(n, 10); i++) f *= i;
        return f.toString();
      });

    const result = sharedSafeEval(sanitized);
    if (!isFinite(result)) return 'Error';
    const rounded = Math.round(result * 1e10) / 1e10;
    return rounded.toPrecision(12).replace(/\.?0+$/, '');
  } catch {
    return 'Error';
  }
}

const scientificConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'expression',
      label: 'Math Expression',
      type: 'text',
      placeholder: 'e.g., 2 + 2 × 5',
      helpText: 'Enter a math expression or use the interactive calculator below',
    },
  ],
  calculate: (values) => {
    const expr = (values.expression || '').trim();
    if (!expr) return [];
    if (isNaN(Number(expr)) && !/[a-z_]/i.test(expr) && !/[+\-*/^%()]/.test(expr)) return [];

    const result = safeEval(expr);
    if (result === 'Error') return [];

    return [
      {
        id: 'expression',
        label: 'Expression',
        value: expr,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'result',
        label: 'Result',
        value: result,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (_values, _results) => {
    return createElement(ScientificPanel);
  },
  educational: {
    formula: 'Follows standard PEMDAS/BODMAS operator precedence: Parentheses, Exponents, Multiplication/Division (L→R), Addition/Subtraction (L→R)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="25" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Powers of 10 — Scientific Notation</text><rect x="20" y="40" width="280" height="120" fill="rgba(59,130,246,0.06)" stroke="var(--svg-3b82f6)" stroke-width="1" rx="6"/><text x="30" y="62" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="13">10&#x2079; = 1,000,000,000 &emsp; Giga (G)</text><text x="30" y="82" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13">10&#x2076; = 1,000,000 &emsp; Mega (M)</text><text x="30" y="102" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13">10&#xB3; = 1,000 &emsp; Kilo (k)</text><text x="30" y="122" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13">10&#xB0; = 1 &emsp; Base</text><text x="30" y="142" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13">10&#x207B;&#xB3; = 0.001 &emsp; Milli (m)</text><text x="220" y="62" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13">10&#x2076; = 1,000,000 &emsp; Mega (M)</text><text x="220" y="82" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13">10&#xB3; = 1,000 &emsp; Kilo (k)</text><text x="220" y="102" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13">10&#xB0; = 1 &emsp; Base</text><text x="220" y="122" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13">10&#x207B;&#xB3; = 0.001 &emsp; Milli (m)</text><text x="220" y="142" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="13">10&#x207B;&#x2076; = 0.000001 &emsp; Micro (u)</text><line x1="20" y1="165" x2="300" y2="165" stroke="var(--svg-3b82f6)" stroke-width="2"/><polygon points="300,165 295,161 295,169" fill="var(--svg-3b82f6)"/><polygon points="20,165 25,161 25,169" fill="var(--svg-3b82f6)"/><text x="160" y="185" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="11">&#x2190; Larger &emsp;&emsp;&emsp;&emsp; Smaller &#x2192;</text></svg>',
      alt: 'Scientific notation scale showing powers of 10 from giga to micro',
      caption: 'Scientific notation uses powers of 10 for very large and very small numbers',
    },
    formulaDescription:
      'A scientific calculator supports basic arithmetic (+, -, x, /) along with trigonometric functions (sin, cos, tan), logarithms (log base 10, natural log ln), powers, square roots, and mathematical constants (pi, e). It follows standard PEMDAS/BODMAS operator precedence: Parentheses first, then Exponents (powers and roots), then Multiplication and Division (evaluated left to right), then Addition and Subtraction (evaluated left to right). Memory functions (M+, M-, MR, MC) let you store and recall intermediate results during multi-step calculations. The expression input accepts standard mathematical notation and evaluates it in a sandboxed environment for safety.',
    variables: [
      { symbol: 'M+', name: 'Memory Add', description: 'Adds the current display value to the memory register. Useful for accumulating subtotals during multi-step calculations like summing a series of computed values.' },
      { symbol: 'M-', name: 'Memory Subtract', description: 'Subtracts the current display value from the memory register. Convenient for deducting amounts from a running total.' },
      { symbol: 'MR', name: 'Memory Recall', description: 'Inserts the stored memory value into the current expression without removing it from memory. You can recall the same stored value multiple times.' },
      { symbol: 'MC', name: 'Memory Clear', description: 'Clears the memory register to zero. The memory indicator turns off when memory is empty. Always clear memory before starting a new multi-step calculation to avoid carrying over stale values.' },
      { symbol: 'pi', name: 'Pi (3.14159...)', description: 'The mathematical constant representing the ratio of a circle\'s circumference to its diameter. Used extensively in trigonometry, geometry, and physics calculations involving circles and periodic phenomena.' },
      { symbol: 'e', name: 'Euler\'s Number (2.71828...)', description: 'The base of natural logarithms. Appears in exponential growth, compound interest, population dynamics, and in the normal distribution in statistics.' },
    ],
    howToUse: [
      'Type a mathematical expression directly into the input field, or use the interactive keypad panel to click buttons and build your calculation visually.',
      'Use parentheses to group sub-expressions and control the order of operations. For example, (2+3)*4 evaluates to 20, while 2+3*4 evaluates to 14.',
      'Scientific functions (sin, cos, tan, log, ln, sqrt) operate on the number that immediately follows them or on the value in parentheses. Use the keypad for quick access.',
      'Memory buttons (M+, M-, MR, MC) store and retrieve values. This is especially useful when a calculation produces an intermediate result you need later.',
      'View the history tape below the calculator to review your last 10 calculations. Each entry shows the expression and the computed result.',
      'All trigonometric functions use radians by default. To work in degrees, multiply your angle by pi/180 before applying the trig function.',
    ],
    explanation:
      `A scientific calculator is an electronic calculator designed to handle advanced mathematical functions beyond basic arithmetic. It is a fundamental tool for students, engineers, scientists, and anyone working with mathematics above the elementary level. The first handheld scientific calculator, the Hewlett-Packard HP-35, was introduced in 1972 at a price of $395 (about $2,800 in today's dollars). It could compute trigonometric functions, logarithms, and exponentials — capabilities that previously required slide rules or expensive mainframe computers. Before electronic calculators, engineers and scientists used slide rules for centuries, dating back to William Oughtred's invention of the logarithmic slide rule in 1622. The slide rule worked on the principle that logarithms convert multiplication into addition: log(a x b) = log(a) + log(b). This calculator implements modern equivalents of those functions using JavaScript's Math library. The operator precedence follows the standard mathematical convention known as PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction) or BODMAS (Brackets, Orders, Division/Multiplication, Addition/Subtraction). Operator precedence is crucial for correct evaluation: the expression 2 + 3 x 4 equals 14 (not 20) because multiplication has higher precedence than addition. The memory register allows you to store intermediate results during complex multi-step calculations, which was a key innovation in early electronic calculators. The history tape preserves the last 10 calculations with their expressions and results, providing an audit trail that is particularly valuable during problem-solving and homework.`,
    commonUses: [
      'Engineering calculations: computing stress, strain, beam deflections, electrical circuit analysis, and thermodynamics using trigonometric and logarithmic functions',
      'Physics problem solving: calculating projectile motion, wave mechanics, gravitational forces, and energy conversions requiring trigonometric identities and scientific notation',
      'Statistics and data science: computing standard deviations, z-scores, correlation coefficients, and probability distributions using exponential and power functions',
      'Chemistry and biology: calculating pH values (logarithmic), reaction rates (exponential), solution concentrations, and population growth models',
      'Financial mathematics: computing compound interest with continuous compounding (uses e), present value calculations, and logarithmic returns',
    ],
    workedExamples: [
      {
        scenario: 'Maria, a civil engineering student, needs to calculate the length of a cable supporting a bridge tower. The cable forms a right triangle with the tower height of 50 meters and a base of 30 meters. She needs the hypotenuse length.',
        inputs: { expression: 'sqrt(50^2 + 30^2)' },
        result: '58.3095189485 (approximately 58.31 meters). The cable length matches the Pythagorean theorem result: sqrt(2500 + 900) = sqrt(3400) ≈ 58.31 m.',
        insight: 'The expression computes the Pythagorean theorem directly. The result (approximately 58.31 meters) gives the exact cable length needed. By using the calculator\'s sqrt and power functions, Maria avoids manual square root computation and gets a precise result to 12 significant digits.',
      },
      {
        scenario: 'Dr. Thompson, a chemistry professor, needs to calculate the pH of a solution with hydrogen ion concentration [H+] = 3.5 x 10^(-5) mol/L. pH is defined as -log10[H+].',
        inputs: { expression: '-log(3.5*10^(-5))' },
        result: '4.45593195565 (approximately pH = 4.46). Since pH < 7, the solution is acidic. The calculation uses the log function with correct operator precedence for exponent and multiplication.',
        insight: 'The calculator evaluates -log(3.5E-5) = 4.456. This means the solution is acidic (pH < 7). The calculation uses both the logarithm function and the exponent operator, demonstrating how scientific calculators handle multi-operation expressions with correct operator precedence.',
      },
      {
        scenario: 'James, a financial analyst, is computing the continuously compounded annual growth rate of an investment that grew from $10,000 to $27,000 over 8 years. Continuous compounding uses the formula r = ln(A/P) / t.',
        inputs: { expression: 'ln(27000/10000)/8' },
        result: '0.12411612881 (approximately 12.41% continuously compounded annual growth rate). The natural log function is the inverse of exponential growth, giving the exact continuous rate.',
        insight: 'The expression evaluates to approximately 0.1241, or a 12.41% continuously compounded annual growth rate. Using the natural log (ln) function is essential here — it is the inverse of the exponential growth function and gives the exact continuous rate.',
      },
    ],
    proTips: [
      'Use parentheses liberally to make your intention clear and avoid operator precedence surprises. Even when parentheses are mathematically unnecessary, they improve readability and reduce errors.',
      'The memory functions are underutilized gems. For multi-step problems, compute each sub-result, add it to memory with M+, then use MR to build up the final expression. This is faster and less error-prone than writing down intermediate values.',
      'Always verify your expression by checking the history tape after pressing equals. If the result seems unexpected, review the expression for missing parentheses or incorrect operator order.',
      'For trigonometry, remember that radians and degrees are different units. A full circle is 2pi radians (about 6.283) or 360 degrees. If your trig result seems wrong, check whether you meant radians or degrees.',
      'When computing very large or very small results, the calculator shows up to 12 significant digits. For results beyond this range, use scientific notation to preserve precision and avoid rounding errors in subsequent calculations.',
    ],
    limitations: [
      'Trigonometric functions (sin, cos, tan) operate in radians only — there is no built-in degree mode toggle. You must manually convert degrees to radians by multiplying by pi/180 before applying trig functions.',
      'The calculator uses double-precision floating-point arithmetic (IEEE 754), which provides about 15-17 significant digits but can produce tiny rounding errors in edge cases, particularly with very large or very small numbers.',
      'Complex numbers are not supported. Expressions like sqrt(-1) will produce "Error" rather than returning the imaginary unit i. For complex number calculations, use a dedicated complex number tool or computer algebra system.',
      'Implicit multiplication is not supported — 4pi must be written as 4*pi, and 3(2+1) must be written as 3*(2+1). Always use the explicit multiplication operator (*).',
      'This is a numeric scientific calculator, not a computer algebra system. It cannot solve equations for a variable, simplify algebraic expressions, or perform symbolic differentiation/integration — for those, use the polynomial, equation solver, or derivative calculators.',
    ],
    quickReference: [
      { label: 'Operator Precedence', value: 'PEMDAS: (), ^, x//, +-' },
      { label: 'Pi constant', value: 'pi (3.14159265358979)' },
      { label: 'Euler\'s number', value: 'e (2.71828182845905)' },
      { label: 'Natural log', value: 'ln(x)' },
      { label: 'Log base 10', value: 'log(x)' },
      { label: 'Square root', value: 'sqrt(x)' },
      { label: 'Sine (radians)', value: 'sin(x)' },
      { label: 'Cosine (radians)', value: 'cos(x)' },
    ],
    faqs: [
      {
        question: 'What is the operator precedence?',
        answer: 'The calculator follows standard PEMDAS/BODMAS: Parentheses first, then Exponents (powers and roots), then Multiplication and Division (evaluated left to right), then Addition and Subtraction (evaluated left to right). For example, 2 + 3 x 4 evaluates to 14 (not 20) because multiplication happens before addition. Use parentheses to override this order: (2 + 3) x 4 = 20.',
      },
      {
        question: 'Are trigonometric functions in degrees or radians?',
        answer: 'Trig functions (sin, cos, tan) use radians by default, which is the standard unit in higher mathematics, physics, and engineering. To convert degrees to radians, multiply by pi/180. For example, sin(90 degrees) = sin(90 x pi/180) = sin(pi/2) = 1. A full circle is 2pi radians (about 6.283) or 360 degrees. Always double-check whether your problem uses radians or degrees.',
      },
      {
        question: 'How do I use the memory functions?',
        answer: 'M+ adds the current displayed value to the memory register. M- subtracts it from memory. MR (Memory Recall) inserts the stored memory value into the current expression without clearing it. MC (Memory Clear) resets the memory to zero. The memory indicator lights up on the keypad when a non-zero value is stored. Memory persists across multiple calculations until cleared, making it ideal for accumulating sums or keeping a constant you need to reuse.',
      },
      {
        question: 'Why does my expression show "Error"?',
        answer: 'An "Error" result typically means one of several things: you typed a mathematically undefined expression (like division by zero or sqrt of a negative number), used an unrecognized function name, had mismatched parentheses, or wrote an expression that JavaScript cannot parse. Check for balanced parentheses, correct function names (sin not sine, log not log10), and ensure you are not dividing by zero. The calculator also shows "Error" if the result is not a finite number (Infinity or NaN).',
      },
      {
        question: 'How precise are the results?',
        answer: 'The calculator displays results with up to 12 significant digits of precision, using JavaScript\'s 64-bit floating-point arithmetic (IEEE 754 double precision). This provides about 15-17 significant digits internally, with the display rounding to 12 digits for readability. For most practical applications — engineering, physics, finance, chemistry — this precision is more than sufficient. However, like all floating-point calculators, there can be tiny rounding errors in edge cases, particularly with very large or very small numbers near the limits of the number format.',
      },
      {
        question: 'Can I use this calculator for statistical calculations?',
        answer: 'This scientific calculator handles individual mathematical expressions and is ideal for computing individual statistical values like standard deviations, z-scores, or correlation coefficients manually. However, for comprehensive statistical analysis involving datasets (mean, median, mode, quartiles, box plots), we recommend using our specialized Statistics Calculator or Standard Deviation Calculator, which accept data arrays and provide complete statistical summaries with visualizations.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Scientific Calculator', url: 'https://en.wikipedia.org/wiki/Scientific_calculator' },
      { source: 'Wolfram MathWorld - Scientific Notation', url: 'https://mathworld.wolfram.com/ScientificNotation.html' },
      { source: 'HP Museum - HP-35 Scientific Calculator', url: 'https://www.hpmuseum.org/hp35.htm' },
    ],
  },
};

export { safeEval };
export default scientificConfig;
