/**
 * Safe math expression evaluator.
 *
 * Recursive-descent parser that ONLY supports:
 *   - Digits (0-9), decimals (.) and E-notation (1.5e-3)
 *   - Operators: +, -, *, /, ^, %, and postfix ! (factorial, integers 0..170)
 *   - Parentheses: (, )
 *   - Named functions: sqrt, sin, cos, tan, asin, acos, atan, log, ln, abs, exp, ceil, floor
 *   - Constants: PI (pi), E (e)
 *   - Variables passed via the `vars` record (e.g. { x: 5 })
 *
 * NO eval / new Function / dynamic code execution is used.
 * All input is parsed character-by-character through a deterministic tokenizer.
 */

// ─── Tokenizer ─────────────────────────────────────────────────────────────────

type TokenType =
  | 'NUMBER'
  | 'IDENT'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'CARET'
  | 'PERCENT'
  | 'BANG'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

export class SafeEvalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeEvalError';
  }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Numbers (including decimals)
    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i];
        i++;
      }
      // E-notation: 1e5, 2.5E-3 (a bare "e" with no digits after it stays the constant e)
      const expMatch = /^[eE][+-]?\d+/.exec(input.slice(i));
      if (expMatch) {
        num += expMatch[0];
        i += expMatch[0].length;
      }
      // Validate number format – at most one dot
      const dotCount = (num.replace(/[eE].*$/, '').match(/\./g) || []).length;
      if (dotCount > 1) {
        throw new SafeEvalError(`Invalid number: "${num}"`);
      }
      if (num === '.' || /^\.[eE]/.test(num)) {
        throw new SafeEvalError('Lone decimal point');
      }
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }

    // Identifiers (function names, constants, variables)
    if (/[a-zA-Z]/.test(ch)) {
      let ident = '';
      while (i < input.length && /[a-zA-Z]/.test(input[i])) {
        ident += input[i];
        i++;
      }
      tokens.push({ type: 'IDENT', value: ident });
      continue;
    }

    // Single-character tokens
    switch (ch) {
      case '+':
        tokens.push({ type: 'PLUS', value: '+' });
        break;
      case '-':
        tokens.push({ type: 'MINUS', value: '-' });
        break;
      case '*':
        tokens.push({ type: 'STAR', value: '*' });
        break;
      case '/':
        tokens.push({ type: 'SLASH', value: '/' });
        break;
      case '^':
        tokens.push({ type: 'CARET', value: '^' });
        break;
      case '%':
        tokens.push({ type: 'PERCENT', value: '%' });
        break;
      case '!':
        tokens.push({ type: 'BANG', value: '!' });
        break;
      case '(':
        tokens.push({ type: 'LPAREN', value: '(' });
        break;
      case ')':
        tokens.push({ type: 'RPAREN', value: ')' });
        break;
      default:
        throw new SafeEvalError(`Unexpected character: "${ch}"`);
    }
    i++;
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// ─── Recursive-descent parser ──────────────────────────────────────────────────

/**
 * Grammar (lowest to highest precedence):
 *
 *   expression  → term (('+' | '-') term)*
 *   term        → factor (('*' | '/') factor)*
 *   unary       → '-' unary | '+' unary | power      // so -2^2 = -(2^2) = -4, as in maths
 *   power       → postfix ('^' unary)?              // right-associative; 2^-3 and 2^3^2 work
 *   postfix     → call ('%' | '!')*
 *   call        → IDENT '(' expression ')' | atom
 *   atom        → NUMBER | IDENT | '(' expression ')'
 *
 *  `%` is a postfix "divide by 100" operator (e.g. 15% → 0.15).
 */

/** sin of an angle in degrees, exact at multiples of 30 degrees so sin(180) is 0 and sin(30) is 0.5 (not 1.2e-16 / 0.49999999999999994). */
function sinDeg(x: number): number {
  const r = ((x % 360) + 360) % 360;
  if (r === 0 || r === 180) return 0;
  if (r === 90) return 1;
  if (r === 270) return -1;
  if (r === 30 || r === 150) return 0.5;
  if (r === 210 || r === 330) return -0.5;
  return Math.sin((x * Math.PI) / 180);
}

function tanDeg(x: number): number {
  const r = ((x % 180) + 180) % 180;
  if (r === 90) throw new SafeEvalError('tan has no value at 90 degrees');
  if (r === 0) return 0;
  if (r === 45) return 1;
  if (r === 135) return -1;
  return Math.tan((x * Math.PI) / 180);
}

/** n! for an integer 0 <= n <= 170 (171! overflows a double); anything else is an error, never a long loop. */
function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new SafeEvalError('Factorial needs a non-negative whole number');
  if (n > 170) throw new SafeEvalError('Factorial is limited to 170! (the largest that fits in a double)');
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

class Parser {
  private tokens: Token[];
  private pos: number;
  private vars: Record<string, number>;
  private deg: boolean;

  constructor(tokens: Token[], vars: Record<string, number>, deg = false) {
    this.tokens = tokens;
    this.pos = 0;
    this.vars = vars;
    this.deg = deg;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(type: TokenType): Token {
    const token = this.tokens[this.pos];
    if (token.type !== type) {
      throw new SafeEvalError(
        `Expected ${type} but got ${token.type}: "${token.value}"`,
      );
    }
    this.pos++;
    return token;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.peek().type === type) {
        this.pos++;
        return true;
      }
    }
    return false;
  }

  /** expression → term (('+' | '-') term)* */
  private expression(): number {
    let left = this.term();
    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      if (this.match('PLUS')) {
        left += this.term();
      } else {
        this.consume('MINUS');
        left -= this.term();
      }
    }
    return left;
  }

  /** term → factor (('*' | '/') factor)* */
  private term(): number {
    let left = this.unary();
    while (this.peek().type === 'STAR' || this.peek().type === 'SLASH') {
      if (this.match('STAR')) {
        left *= this.unary();
      } else {
        this.consume('SLASH');
        const right = this.unary();
        if (right === 0) throw new SafeEvalError('Division by zero');
        left /= right;
      }
    }
    return left;
  }

  /** power → postfix ('^' unary)?  (right-associative: the exponent is a unary, which recurses into power) */
  private factor(): number {
    const left = this.postfix();
    if (this.peek().type === 'CARET') {
      this.consume('CARET');
      const right = this.unary();
      if (left < 0 && !Number.isInteger(right)) {
        throw new SafeEvalError(
          'Negative base with fractional exponent',
        );
      }
      return Math.pow(left, right);
    }
    return left;
  }

  /** unary → '-' unary | '+' unary | power */
  private unary(): number {
    if (this.match('MINUS')) return -this.unary();
    if (this.match('PLUS')) return this.unary();
    return this.factor();
  }

  /** postfix → call ('%' | '!')* */
  private postfix(): number {
    let value = this.call();
    for (;;) {
      if (this.peek().type === 'PERCENT') {
        this.consume('PERCENT');
        value /= 100;
      } else if (this.peek().type === 'BANG') {
        this.consume('BANG');
        value = factorial(value);
      } else {
        return value;
      }
    }
  }

  /** call → IDENT '(' expression ')' | atom */
  private call(): number {
    // Look-ahead: IDENT followed by '(' means function call
    if (
      this.peek().type === 'IDENT' &&
      this.tokens[this.pos + 1]?.type === 'LPAREN'
    ) {
      const name = this.consume('IDENT').value;
      this.consume('LPAREN');
      const arg = this.expression();
      this.consume('RPAREN');
      return this.applyFunction(name, arg);
    }
    return this.atom();
  }

  private applyFunction(name: string, arg: number): number {
    switch (name.toLowerCase()) {
      case 'sqrt':
        return Math.sqrt(arg);
      case 'sin':
        return this.deg ? sinDeg(arg) : Math.sin(arg);
      case 'cos':
        return this.deg ? sinDeg(arg + 90) : Math.cos(arg);
      case 'tan':
        return this.deg ? tanDeg(arg) : Math.tan(arg);
      case 'asin':
        return this.deg ? (Math.asin(arg) * 180) / Math.PI : Math.asin(arg);
      case 'acos':
        return this.deg ? (Math.acos(arg) * 180) / Math.PI : Math.acos(arg);
      case 'atan':
        return this.deg ? (Math.atan(arg) * 180) / Math.PI : Math.atan(arg);
      case 'log':
        return Math.log10(arg);
      case 'ln':
        return Math.log(arg);
      case 'abs':
        return Math.abs(arg);
      case 'exp':
        return Math.exp(arg);
      case 'ceil':
        return Math.ceil(arg);
      case 'floor':
        return Math.floor(arg);
      default:
        throw new SafeEvalError(`Unknown function: "${name}"`);
    }
  }

  /** atom → NUMBER | IDENT (constant / variable) | '(' expression ')' */
  private atom(): number {
    if (this.match('LPAREN')) {
      const val = this.expression();
      this.consume('RPAREN');
      return val;
    }

    if (this.peek().type === 'NUMBER') {
      return parseFloat(this.consume('NUMBER').value);
    }

    if (this.peek().type === 'IDENT') {
      const raw = this.consume('IDENT').value;
      return this.resolveIdentifier(raw);
    }

    throw new SafeEvalError(
      `Unexpected token: "${this.peek().value}" (${this.peek().type})`,
    );
  }

  private resolveIdentifier(raw: string): number {
    const key = raw.toLowerCase();

    // Built-in constants
    if (key === 'pi') return Math.PI;
    if (key === 'e') return Math.E;

    // User-supplied variables (case-insensitive lookup for flexibility)
    for (const [k, v] of Object.entries(this.vars)) {
      if (k.toLowerCase() === key) return v;
    }

    throw new SafeEvalError(`Unknown identifier: "${raw}"`);
  }

  /** Entry point */
  public parse(): number {
    const result = this.expression();
    if (this.peek().type !== 'EOF') {
      throw new SafeEvalError(
        `Unexpected token after expression: "${this.peek().value}"`,
      );
    }
    return result;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Safely evaluate a math expression string.
 *
 * @param expression - The expression to evaluate (e.g. "2+3*4", "sin(pi/2)").
 * @param vars       - Optional variable bindings (e.g. `{ x: 5 }`).
 * @param options    - `{ angle: 'deg' }` makes sin/cos/tan take, and asin/acos/atan return, degrees.
 * @returns The numeric result.
 * @throws SafeEvalError on invalid input, unknown identifiers, or arithmetic errors.
 */
export function safeEval(
  expression: string,
  vars: Record<string, number> = {},
  options: { angle?: 'rad' | 'deg' } = {},
): number {
  if (!expression || expression.trim().length === 0) {
    throw new SafeEvalError('Empty expression');
  }
  const tokens = tokenize(expression);
  const parser = new Parser(tokens, vars, options.angle === 'deg');
  return parser.parse();
}
