/**
 * Safe math expression evaluator.
 *
 * Recursive-descent parser that ONLY supports:
 *   - Digits (0-9) and decimals (.)
 *   - Operators: +, -, *, /, ^, %
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
      // Validate number format – at most one dot
      const dotCount = (num.match(/\./g) || []).length;
      if (dotCount > 1) {
        throw new SafeEvalError(`Invalid number: "${num}"`);
      }
      if (num === '.') {
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
 *   factor      → unary ('^' factor)?          // right-associative exponentiation
 *   unary       → '-' unary | '+' unary | postfix
 *   postfix     → call '%'?
 *   call        → IDENT '(' expression ')' | atom
 *   atom        → NUMBER | IDENT | '(' expression ')'
 *
 *  `%` is a postfix "divide by 100" operator (e.g. 15% → 0.15).
 */

class Parser {
  private tokens: Token[];
  private pos: number;
  private vars: Record<string, number>;

  constructor(tokens: Token[], vars: Record<string, number>) {
    this.tokens = tokens;
    this.pos = 0;
    this.vars = vars;
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
    let left = this.factor();
    while (this.peek().type === 'STAR' || this.peek().type === 'SLASH') {
      if (this.match('STAR')) {
        left *= this.factor();
      } else {
        this.consume('SLASH');
        const right = this.factor();
        if (right === 0) throw new SafeEvalError('Division by zero');
        left /= right;
      }
    }
    return left;
  }

  /** factor → unary ('^' factor)?  (right-associative) */
  private factor(): number {
    const left = this.unary();
    if (this.peek().type === 'CARET') {
      this.consume('CARET');
      const right = this.factor(); // right-associative – recurse, not loop
      if (left < 0 && !Number.isInteger(right)) {
        throw new SafeEvalError(
          'Negative base with fractional exponent',
        );
      }
      return Math.pow(left, right);
    }
    return left;
  }

  /** unary → '-' unary | '+' unary | postfix */
  private unary(): number {
    if (this.match('MINUS')) return -this.unary();
    if (this.match('PLUS')) return this.unary();
    return this.postfix();
  }

  /** postfix → call '%'? */
  private postfix(): number {
    const value = this.call();
    if (this.peek().type === 'PERCENT') {
      this.consume('PERCENT');
      return value / 100;
    }
    return value;
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
        return Math.sin(arg);
      case 'cos':
        return Math.cos(arg);
      case 'tan':
        return Math.tan(arg);
      case 'asin':
        return Math.asin(arg);
      case 'acos':
        return Math.acos(arg);
      case 'atan':
        return Math.atan(arg);
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
 * @returns The numeric result.
 * @throws SafeEvalError on invalid input, unknown identifiers, or arithmetic errors.
 */
export function safeEval(
  expression: string,
  vars: Record<string, number> = {},
): number {
  if (!expression || expression.trim().length === 0) {
    throw new SafeEvalError('Empty expression');
  }
  const tokens = tokenize(expression);
  const parser = new Parser(tokens, vars);
  return parser.parse();
}
