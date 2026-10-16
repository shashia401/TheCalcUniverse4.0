/**
 * Tiny, dependency-free symbolic engine for the calculus calculators (derivative, Taylor, integral, limit).
 *
 * parse()  -> AST (recursive descent, NO eval / new Function; identifiers are limited to a fixed whitelist
 *             of functions, the variable x and the constants pi and e, so there is no property access,
 *             no constructor/prototype reach, and input size/depth are capped).
 * diff()   -> exact symbolic derivative (sum, product, quotient, power, chain rule), simplify() cleans it up.
 * evalNode() -> fast numeric evaluation (the AST is built once, then evaluated thousands of times).
 * taylorCoefficients() -> f^(k)(a)/k! via truncated power series arithmetic (no finite differences).
 *
 * Grammar (standard precedence, so -x^2 = -(x^2) and 2^3^2 = 2^9):
 *   expr   -> term (('+'|'-') term)*
 *   term   -> unary (('*'|'/'| implicit) unary)*     implicit: 2x, 3(x+1), x sin(x), (x+1)(x-1)
 *   unary  -> ('-'|'+') unary | power
 *   power  -> primary ('^' unary)?
 *   primary-> NUMBER | NAME '(' expr ')' | NAME | '(' expr ')'
 */

export class CasError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CasError';
  }
}

export type FnName =
  | 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'sinh' | 'cosh' | 'tanh'
  | 'exp' | 'ln' | 'log' | 'sqrt' | 'abs';

export type Node =
  | { t: 'num'; v: number }
  | { t: 'var' }
  | { t: 'const'; name: 'pi' | 'e' }
  | { t: 'add'; a: Node[] }
  | { t: 'mul'; a: Node[] }
  | { t: 'pow'; b: Node; e: Node }
  | { t: 'fn'; name: FnName; arg: Node };

const FN_NAMES: readonly string[] = [
  'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'sin', 'cos', 'tan', 'exp', 'sqrt', 'abs', 'ln', 'log',
];
const MAX_LEN = 400;
const MAX_DEPTH = 60;

// ───────────────────────────── parser ─────────────────────────────

type Tok = { k: 'num'; v: number } | { k: 'word'; s: string } | { k: 'op'; s: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
      if (!m) throw new CasError(`Invalid number near "${src.slice(i, i + 6)}"`);
      const v = Number(m[0]);
      if (!Number.isFinite(v)) throw new CasError('Number too large');
      out.push({ k: 'num', v });
      i += m[0].length;
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      let s = '';
      while (i < src.length && /[a-zA-Z]/.test(src[i])) s += src[i++];
      out.push({ k: 'word', s: s.toLowerCase() });
      continue;
    }
    if ('+-*/^()'.includes(ch)) { out.push({ k: 'op', s: ch }); i++; continue; }
    if (ch === '×' || ch === '·') { out.push({ k: 'op', s: '*' }); i++; continue; }
    if (ch === '−') { out.push({ k: 'op', s: '-' }); i++; continue; }
    if (ch === 'π') { out.push({ k: 'word', s: 'pi' }); i++; continue; }
    throw new CasError(`Unexpected character "${ch}"`);
  }
  return out;
}

const num = (v: number): Node => ({ t: 'num', v });
const X: Node = { t: 'var' };

/** Split an identifier like "xsin" / "2pi" into atoms: x, pi, e or a function name (only when "(" follows). */
function splitWord(word: string, nextIsParen: boolean): ({ fn: FnName } | { atom: Node })[] {
  const out: ({ fn: FnName } | { atom: Node })[] = [];
  let rest = word;
  while (rest) {
    if (nextIsParen && FN_NAMES.includes(rest)) { out.push({ fn: rest as FnName }); return out; }
    if (rest.startsWith('pi')) { out.push({ atom: { t: 'const', name: 'pi' } }); rest = rest.slice(2); }
    else if (rest.startsWith('x')) { out.push({ atom: X }); rest = rest.slice(1); }
    else if (rest.startsWith('e')) { out.push({ atom: { t: 'const', name: 'e' } }); rest = rest.slice(1); }
    else throw new CasError(`Unknown name "${word}" (use x, pi, e and functions such as sin(x), exp(x), ln(x))`);
  }
  return out;
}

const tokText = (t: Tok): string => (t.k === 'num' ? String(t.v) : t.s);

export function parse(src: string): Node {
  if (src.length > MAX_LEN) throw new CasError(`Expression too long (max ${MAX_LEN} characters)`);
  const toks = tokenize(src);
  if (!toks.length) throw new CasError('Empty expression');
  let p = 0;
  let depth = 0;
  const peek = () => toks[p];
  const isOp = (s: string) => { const t = toks[p]; return t !== undefined && t.k === 'op' && t.s === s; };

  const startsPrimary = (): boolean => {
    const t = toks[p];
    return t !== undefined && (t.k === 'word' || (t.k === 'op' && t.s === '('));
  };

  function expr(): Node {
    if (++depth > MAX_DEPTH) throw new CasError('Expression nested too deeply');
    const terms: Node[] = [term()];
    while (isOp('+') || isOp('-')) {
      const neg = (peek() as { s: string }).s === '-';
      p++;
      const t = term();
      terms.push(neg ? { t: 'mul', a: [num(-1), t] } : t);
    }
    depth--;
    return terms.length === 1 ? terms[0] : { t: 'add', a: terms };
  }

  function term(): Node {
    let left = unary();
    for (;;) {
      if (isOp('*')) { p++; left = { t: 'mul', a: [left, unary()] }; }
      else if (isOp('/')) { p++; left = { t: 'mul', a: [left, { t: 'pow', b: unary(), e: num(-1) }] }; }
      else if (startsPrimary()) left = { t: 'mul', a: [left, unary()] }; // implicit multiplication
      else return left;
    }
  }

  function unary(): Node {
    if (isOp('-')) { p++; return { t: 'mul', a: [num(-1), unary()] }; }
    if (isOp('+')) { p++; return unary(); }
    return power();
  }

  function power(): Node {
    const base = primary();
    if (isOp('^')) { p++; return { t: 'pow', b: base, e: unary() }; }
    return base;
  }

  function primary(): Node {
    const t = toks[p];
    if (!t) throw new CasError('Unexpected end of expression');
    if (t.k === 'num') { p++; return num(t.v); }
    if (t.k === 'op' && t.s === '(') {
      p++;
      const inner = expr();
      if (!isOp(')')) throw new CasError('Missing closing parenthesis');
      p++;
      return inner;
    }
    if (t.k === 'word') {
      p++;
      const nextIsParen = isOp('(');
      const parts = splitWord(t.s, nextIsParen);
      const last = parts[parts.length - 1];
      let tail: Node | null = null;
      if ('fn' in last) {
        parts.pop();
        p++; // '('
        const arg = expr();
        if (!isOp(')')) throw new CasError('Missing closing parenthesis');
        p++;
        tail = { t: 'fn', name: last.fn, arg };
      }
      const factors: Node[] = parts.map((q) => ('atom' in q ? q.atom : X));
      if (tail) factors.push(tail);
      return factors.length === 1 ? factors[0] : { t: 'mul', a: factors };
    }
    throw new CasError(`Unexpected "${tokText(t)}"`);
  }

  const tree = expr();
  if (p < toks.length) throw new CasError(`Unexpected "${tokText(toks[p])}"`);
  return tree;
}

// ───────────────────────────── numeric evaluation ─────────────────────────────

export function evalNode(n: Node, x: number): number {
  switch (n.t) {
    case 'num': return n.v;
    case 'var': return x;
    case 'const': return n.name === 'pi' ? Math.PI : Math.E;
    case 'add': { let s = 0; for (const a of n.a) s += evalNode(a, x); return s; }
    case 'mul': { let s = 1; for (const a of n.a) s *= evalNode(a, x); return s; }
    case 'pow': return Math.pow(evalNode(n.b, x), evalNode(n.e, x));
    case 'fn': {
      const u = evalNode(n.arg, x);
      switch (n.name) {
        case 'sin': return Math.sin(u);
        case 'cos': return Math.cos(u);
        case 'tan': return Math.tan(u);
        case 'asin': return Math.asin(u);
        case 'acos': return Math.acos(u);
        case 'atan': return Math.atan(u);
        case 'sinh': return Math.sinh(u);
        case 'cosh': return Math.cosh(u);
        case 'tanh': return Math.tanh(u);
        case 'exp': return Math.exp(u);
        case 'ln': return Math.log(u);
        case 'log': return Math.log10(u);
        case 'sqrt': return Math.sqrt(u);
        case 'abs': return Math.abs(u);
      }
    }
  }
  return NaN;
}

export const hasVar = (n: Node): boolean => {
  switch (n.t) {
    case 'var': return true;
    case 'num': case 'const': return false;
    case 'add': case 'mul': return n.a.some(hasVar);
    case 'pow': return hasVar(n.b) || hasVar(n.e);
    case 'fn': return hasVar(n.arg);
  }
};

// ───────────────────────────── simplification ─────────────────────────────

type NumNode = { t: 'num'; v: number };
const isNum = (n: Node, v?: number): boolean => n.t === 'num' && (v === undefined || n.v === v);
const nv = (n: Node): number => (n as NumNode).v;

/** Split a product into (numeric coefficient, remaining factors). */
function coefOf(n: Node): [number, Node[]] {
  if (n.t === 'num') return [n.v, []];
  if (n.t === 'mul') {
    let c = 1;
    const rest: Node[] = [];
    for (const f of n.a) (f.t === 'num' ? (c *= f.v) : rest.push(f));
    return [c, rest];
  }
  return [1, [n]];
}

/** Base and exponent view of a factor (x -> x^1). */
function baseExp(n: Node): [Node, Node] {
  return n.t === 'pow' ? [n.b, n.e] : [n, num(1)];
}

export function simplify(n: Node): Node {
  switch (n.t) {
    case 'num': case 'var': case 'const': return n;
    case 'fn': {
      const arg = simplify(n.arg);
      if (isNum(arg)) {
        const v = nv(arg);
        if (n.name === 'sin' && v === 0) return num(0);
        if (n.name === 'tan' && v === 0) return num(0);
        if (n.name === 'cos' && v === 0) return num(1);
        if (n.name === 'exp' && v === 0) return num(1);
        if (n.name === 'ln' && v === 1) return num(0);
        if (n.name === 'sqrt' && v >= 0 && Number.isInteger(Math.sqrt(v))) return num(Math.sqrt(v));
        if (n.name === 'abs') return num(Math.abs(v));
      }
      if (n.name === 'exp' && arg.t === 'fn' && arg.name === 'ln') return arg.arg;
      if (n.name === 'ln' && arg.t === 'fn' && arg.name === 'exp') return arg.arg;
      if (n.name === 'ln' && arg.t === 'const' && arg.name === 'e') return num(1);
      return { t: 'fn', name: n.name, arg };
    }
    case 'pow': {
      const b = simplify(n.b);
      const e = simplify(n.e);
      if (isNum(e, 0)) return num(1);
      if (isNum(e, 1)) return b;
      if (isNum(b, 1)) return num(1);
      if (isNum(b) && isNum(e)) {
        const v = Math.pow(nv(b), nv(e));
        if (Number.isFinite(v) && (Number.isInteger(nv(e)) || nv(b) >= 0)) return num(v);
      }
      if (b.t === 'pow' && isNum(e) && Number.isInteger(nv(e))) return simplify({ t: 'pow', b: b.b, e: { t: 'mul', a: [b.e, e] } });
      if (b.t === 'fn' && b.name === 'sqrt' && isNum(e, 2)) return b.arg;
      if (b.t === 'const' && b.name === 'e' && e.t === 'fn' && e.name === 'ln') return e.arg;
      return { t: 'pow', b, e };
    }
    case 'add': {
      const flat: Node[] = [];
      const push = (m: Node) => (m.t === 'add' ? m.a.forEach(push) : flat.push(m));
      n.a.forEach((m) => push(simplify(m)));
      // collect like terms: key = printed non-numeric part
      const buckets = new Map<string, { c: number; rest: Node[] }>();
      let konst = 0;
      for (const t of flat) {
        const [c, rest] = coefOf(t);
        if (!rest.length) { konst += c; continue; }
        const key = rest.map(show).join('*');
        const b = buckets.get(key);
        if (b) b.c += c; else buckets.set(key, { c, rest });
      }
      const terms: Node[] = [];
      for (const { c, rest } of buckets.values()) {
        if (c === 0) continue;
        terms.push(simplify(c === 1 && rest.length === 1 ? rest[0] : { t: 'mul', a: [num(c), ...rest] }));
      }
      terms.sort((a, b) => termRank(b) - termRank(a));
      if (konst !== 0 || !terms.length) terms.push(num(konst));
      return terms.length === 1 ? terms[0] : { t: 'add', a: terms };
    }
    case 'mul': {
      const flat: Node[] = [];
      const push = (m: Node) => (m.t === 'mul' ? m.a.forEach(push) : flat.push(m));
      n.a.forEach((m) => push(simplify(m)));
      let c = 1;
      const powers = new Map<string, { base: Node; exps: Node[] }>();
      const order: string[] = [];
      for (const f of flat) {
        if (f.t === 'num') { c *= f.v; continue; }
        const [b, e] = baseExp(f);
        const key = show(b);
        const slot = powers.get(key);
        if (slot) slot.exps.push(e); else { powers.set(key, { base: b, exps: [e] }); order.push(key); }
      }
      if (c === 0) return num(0);
      const factors: Node[] = [];
      for (const key of order) {
        const { base, exps } = powers.get(key)!;
        const e = exps.length === 1 ? exps[0] : simplify({ t: 'add', a: exps });
        const f = simplify({ t: 'pow', b: base, e });
        if (isNum(f)) c *= nv(f); else factors.push(f);
      }
      factors.sort((a, b) => factorRank(a) - factorRank(b));
      if (!factors.length) return num(c);
      if (c === 1 && factors.length === 1) return factors[0];
      return { t: 'mul', a: c === 1 ? factors : [num(c), ...factors] };
    }
  }
}

/** Order inside sums: x-power monomials by descending degree, then other terms, constants last. */
function termRank(t: Node): number {
  const [, rest] = coefOf(t);
  if (!rest.length) return -1e9;
  if (rest.length === 1) {
    const [b, e] = baseExp(rest[0]);
    if (b.t === 'var' && isNum(e)) return 1e6 + nv(e);
  }
  return 0;
}
function factorRank(f: Node): number {
  const [b, e] = baseExp(f);
  if (b.t === 'var') return isNum(e) && nv(e) < 0 ? 5 : 0;
  if (b.t === 'const') return 1;
  if (b.t === 'fn') return isNum(e) && nv(e) < 0 ? 6 : 3;
  return isNum(e) && nv(e) < 0 ? 7 : 2;
}

// ───────────────────────────── differentiation ─────────────────────────────

export function diff(n: Node): Node {
  switch (n.t) {
    case 'num': case 'const': return num(0);
    case 'var': return num(1);
    case 'add': return { t: 'add', a: n.a.map(diff) };
    case 'mul': {
      const terms: Node[] = n.a.map((_, i) => ({ t: 'mul', a: n.a.map((f, j) => (i === j ? diff(f) : f)) }) as Node);
      return { t: 'add', a: terms };
    }
    case 'pow': {
      const { b, e } = n;
      if (!hasVar(e)) return { t: 'mul', a: [e, { t: 'pow', b, e: { t: 'add', a: [e, num(-1)] } }, diff(b)] };
      if (!hasVar(b)) return { t: 'mul', a: [n, { t: 'fn', name: 'ln', arg: b }, diff(e)] };
      // b^e (e' ln b + e b'/b)
      return {
        t: 'mul',
        a: [n, { t: 'add', a: [
          { t: 'mul', a: [diff(e), { t: 'fn', name: 'ln', arg: b }] },
          { t: 'mul', a: [e, diff(b), { t: 'pow', b, e: num(-1) }] },
        ] }],
      };
    }
    case 'fn': {
      const u = n.arg;
      const du = diff(u);
      const f = (name: FnName, arg: Node = u): Node => ({ t: 'fn', name, arg });
      const pw = (b: Node, e: number): Node => ({ t: 'pow', b, e: num(e) });
      const oneMinusU2: Node = { t: 'add', a: [num(1), { t: 'mul', a: [num(-1), pw(u, 2)] }] };
      const onePlusU2: Node = { t: 'add', a: [num(1), pw(u, 2)] };
      switch (n.name) {
        case 'sin': return { t: 'mul', a: [f('cos'), du] };
        case 'cos': return { t: 'mul', a: [num(-1), f('sin'), du] };
        case 'tan': return { t: 'mul', a: [du, pw(f('cos'), -2)] };
        case 'asin': return { t: 'mul', a: [du, pw(oneMinusU2, -0.5)] };
        case 'acos': return { t: 'mul', a: [num(-1), du, pw(oneMinusU2, -0.5)] };
        case 'atan': return { t: 'mul', a: [du, pw(onePlusU2, -1)] };
        case 'sinh': return { t: 'mul', a: [f('cosh'), du] };
        case 'cosh': return { t: 'mul', a: [f('sinh'), du] };
        case 'tanh': return { t: 'mul', a: [du, pw(f('cosh'), -2)] };
        case 'exp': return { t: 'mul', a: [n, du] };
        case 'ln': return { t: 'mul', a: [du, pw(u, -1)] };
        case 'log': return { t: 'mul', a: [du, pw(u, -1), pw(f('ln', num(10)), -1)] };
        case 'sqrt': return { t: 'mul', a: [num(0.5), du, pw(u, -0.5)] };
        case 'abs': return { t: 'mul', a: [du, u, pw(f('abs'), -1)] };
      }
    }
  }
  return num(NaN);
}

/** k-th derivative, simplified at every step so expressions stay readable. */
export function derivativeOrder(n: Node, order: number): Node {
  let cur = simplify(n);
  for (let i = 0; i < order; i++) {
    cur = simplify(diff(cur));
    if (size(cur) > 4000) throw new CasError('The derivative became too large to display; try a lower order or a simpler function');
  }
  return cur;
}

const size = (n: Node): number => {
  switch (n.t) {
    case 'add': case 'mul': return 1 + n.a.reduce((s, m) => s + size(m), 0);
    case 'pow': return 1 + size(n.b) + size(n.e);
    case 'fn': return 1 + size(n.arg);
    default: return 1;
  }
};

// ───────────────────────────── printing ─────────────────────────────

/** Number as text: integers, small exact fractions (1/3, -2/3) or up to 12 significant digits. */
export function fmtNum(v: number): string {
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
  const a = Math.abs(v);
  const gcd = (p: number, q: number): number => (q ? gcd(q, p % q) : p);
  for (let d = 2; d <= 64; d++) {
    // denominators with a factor 5 but no 3/7 are decimals in disguise (0.1, 0.35): keep them as decimals
    if (d % 5 === 0 && d % 3 !== 0 && d % 7 !== 0) continue;
    const nn = Math.round(a * d);
    if (nn !== 0 && gcd(nn, d) === 1 && Math.abs(nn / d - a) < 1e-12 * a) return `${v < 0 ? '-' : ''}${nn}/${d}`;
  }
  return String(Number(v.toPrecision(12)));
}

const PREC = { add: 1, mul: 2, pow: 4, atom: 5 } as const;

export function show(n: Node): string {
  return print(n, 0);
}

function print(n: Node, ctx: number): string {
  switch (n.t) {
    case 'num': {
      const s = fmtNum(n.v);
      return (n.v < 0 || s.includes('/')) && ctx > PREC.add ? `(${s})` : s;
    }
    case 'var': return 'x';
    case 'const': return n.name;
    case 'fn': return `${n.name}(${print(n.arg, 0)})`;
    case 'add': {
      let s = '';
      n.a.forEach((t, i) => {
        const [c] = coefOf(t);
        const neg = c < 0;
        const body = neg ? negate(t) : t;
        const txt = print(body, PREC.add + 1);
        s += i === 0 ? (neg ? `-${txt}` : txt) : neg ? ` - ${txt}` : ` + ${txt}`;
      });
      return ctx > PREC.add ? `(${s})` : s;
    }
    case 'mul': {
      const [c, rest] = coefOf(n);
      const numer: Node[] = [];
      const denom: Node[] = [];
      for (const f of rest) {
        if (f.t === 'pow' && isNum(f.e) && nv(f.e) < 0) denom.push(nv(f.e) === -1 ? f.b : { t: 'pow', b: f.b, e: num(-nv(f.e)) });
        else numer.push(f);
      }
      const isFrac = c !== 1 && c !== -1 && !Number.isInteger(c) && fmtNum(c).includes('/');
      let nTxt = numer.map((f) => print(f, PREC.mul)).join('*');
      let coefTxt = '';
      let denTxt = '';
      if (isFrac) {
        const [p, q] = fmtNum(Math.abs(c)).split('/');
        coefTxt = p === '1' ? '' : `${p}*`;
        denTxt = q;
      } else if (Math.abs(c) !== 1) coefTxt = `${fmtNum(Math.abs(c))}*`;
      if (!nTxt) { nTxt = coefTxt ? coefTxt.slice(0, -1) : '1'; coefTxt = ''; }
      const dTxt = denom.map((f) => print(f, PREC.pow)).join('*');
      let out = coefTxt + nTxt;
      const den = [denTxt, dTxt].filter(Boolean);
      if (den.length) {
        const joined = den.join('*');
        out += `/${den.length > 1 || (denom.length === 1 && !isSimple(denom[0])) ? `(${joined})` : joined}`;
      }
      if (c < 0) out = `-${out}`;
      return ctx > PREC.mul || (c < 0 && ctx > PREC.add) ? `(${out})` : out;
    }
    case 'pow': {
      if (isNum(n.e, 0.5)) return `sqrt(${print(n.b, 0)})`;
      if (isNum(n.e) && nv(n.e) < 0) return `1/${print(nv(n.e) === -1 ? n.b : { t: 'pow', b: n.b, e: num(-nv(n.e)) }, PREC.pow)}`;
      const base = print(n.b, PREC.pow + 1);
      const expTxt = isNum(n.e) && Number.isInteger(nv(n.e)) && nv(n.e) >= 0 ? String(nv(n.e)) : n.e.t === 'var' || n.e.t === 'const' ? print(n.e, 0) : `(${print(n.e, 0)})`;
      return `${base}^${expTxt}`;
    }
  }
}

const isSimple = (n: Node): boolean =>
  n.t === 'var' || n.t === 'fn' || n.t === 'const' || isNum(n) || (n.t === 'pow' && isSimple(n.b) && isNum(n.e) && Number.isInteger(nv(n.e)));

function negate(t: Node): Node {
  if (t.t === 'num') return num(-t.v);
  const [c, rest] = coefOf(t);
  return { t: 'mul', a: [num(-c), ...rest] };
}

// ───────────────────────────── Taylor coefficients (power series arithmetic) ─────────────────────────────

type Series = number[];

const sAdd = (a: Series, b: Series): Series => a.map((v, i) => v + b[i]);
const sScale = (a: Series, k: number): Series => a.map((v) => v * k);
function sMul(a: Series, b: Series): Series {
  const out = new Array<number>(a.length).fill(0);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === 0) continue;
    for (let j = 0; i + j < a.length; j++) out[i + j] += a[i] * b[j];
  }
  return out;
}
function sRecip(a: Series): Series {
  if (a[0] === 0) throw new CasError('Division by zero at the centre (the function has a pole there)');
  const out = new Array<number>(a.length).fill(0);
  out[0] = 1 / a[0];
  for (let k = 1; k < a.length; k++) {
    let s = 0;
    for (let j = 1; j <= k; j++) s += a[j] * out[k - j];
    out[k] = -s / a[0];
  }
  return out;
}
function sExp(f: Series): Series {
  const e = new Array<number>(f.length).fill(0);
  e[0] = Math.exp(f[0]);
  for (let k = 1; k < f.length; k++) {
    let s = 0;
    for (let j = 1; j <= k; j++) s += j * f[j] * e[k - j];
    e[k] = s / k;
  }
  return e;
}
function sLn(f: Series): Series {
  if (!(f[0] > 0)) throw new CasError('ln/log/non-integer powers need a positive value at the centre');
  const l = new Array<number>(f.length).fill(0);
  l[0] = Math.log(f[0]);
  for (let k = 1; k < f.length; k++) {
    let s = 0;
    for (let j = 1; j < k; j++) s += j * l[j] * f[k - j];
    l[k] = (f[k] - s / k) / f[0];
  }
  return l;
}
function sSinCos(f: Series): [Series, Series] {
  const s = new Array<number>(f.length).fill(0);
  const c = new Array<number>(f.length).fill(0);
  s[0] = Math.sin(f[0]);
  c[0] = Math.cos(f[0]);
  for (let k = 1; k < f.length; k++) {
    let a = 0;
    let b = 0;
    for (let j = 1; j <= k; j++) { a += j * f[j] * c[k - j]; b += j * f[j] * s[k - j]; }
    s[k] = a / k;
    c[k] = -b / k;
  }
  return [s, c];
}
const sDeriv = (a: Series): Series => a.map((_, k) => (k + 1 < a.length ? a[k + 1] * (k + 1) : 0));
function sIntegrate(a: Series, c0: number): Series {
  return a.map((_, k) => (k === 0 ? c0 : a[k - 1] / k));
}
/** F(f) for F' = g(f)·f' : integrate (g series × f') — used for atan/asin. */
const sPowInt = (a: Series, p: number): Series => {
  if (p === 0) return a.map((_, i) => (i === 0 ? 1 : 0));
  let base = p > 0 ? a : sRecip(a);
  let n = Math.abs(p);
  let acc: Series | null = null;
  while (n > 0) {
    if (n & 1) acc = acc ? sMul(acc, base) : base;
    n = Math.floor(n / 2);
    if (n) base = sMul(base, base);
  }
  return acc!;
};

function series(n: Node, a: number, N: number): Series {
  const zero = (): Series => new Array<number>(N).fill(0);
  switch (n.t) {
    case 'num': { const s = zero(); s[0] = n.v; return s; }
    case 'const': { const s = zero(); s[0] = n.name === 'pi' ? Math.PI : Math.E; return s; }
    case 'var': { const s = zero(); s[0] = a; if (N > 1) s[1] = 1; return s; }
    case 'add': return n.a.map((m) => series(m, a, N)).reduce(sAdd);
    case 'mul': return n.a.map((m) => series(m, a, N)).reduce(sMul);
    case 'pow': {
      const b = series(n.b, a, N);
      if (!hasVar(n.e) && Number.isInteger(evalNode(n.e, 0)) && Math.abs(evalNode(n.e, 0)) <= 1000) {
        return sPowInt(b, evalNode(n.e, 0));
      }
      return sExp(sMul(series(n.e, a, N), sLn(b)));
    }
    case 'fn': {
      const u = series(n.arg, a, N);
      switch (n.name) {
        case 'sin': return sSinCos(u)[0];
        case 'cos': return sSinCos(u)[1];
        case 'tan': { const [s, c] = sSinCos(u); return sMul(s, sRecip(c)); }
        case 'exp': return sExp(u);
        case 'ln': return sLn(u);
        case 'log': return sScale(sLn(u), 1 / Math.LN10);
        case 'sqrt': return sExp(sScale(sLn(u), 0.5));
        case 'sinh': { const e = sExp(u); const m = sExp(sScale(u, -1)); return sScale(sAdd(e, sScale(m, -1)), 0.5); }
        case 'cosh': { const e = sExp(u); const m = sExp(sScale(u, -1)); return sScale(sAdd(e, m), 0.5); }
        case 'tanh': {
          const e = sExp(sScale(u, 2));
          const one = zero(); one[0] = 1;
          return sMul(sAdd(e, sScale(one, -1)), sRecip(sAdd(e, one)));
        }
        case 'atan': {
          const one = zero(); one[0] = 1;
          return sIntegrate(sMul(sDeriv(u), sRecip(sAdd(one, sMul(u, u)))), Math.atan(u[0]));
        }
        case 'asin': {
          const one = zero(); one[0] = 1;
          if (!(Math.abs(u[0]) < 1)) throw new CasError('asin/acos expansions need |value| < 1 at the centre');
          const inv = sExp(sScale(sLn(sAdd(one, sScale(sMul(u, u), -1))), -0.5));
          return sIntegrate(sMul(sDeriv(u), inv), Math.asin(u[0]));
        }
        case 'acos': {
          const one = zero(); one[0] = 1;
          if (!(Math.abs(u[0]) < 1)) throw new CasError('asin/acos expansions need |value| < 1 at the centre');
          const inv = sExp(sScale(sLn(sAdd(one, sScale(sMul(u, u), -1))), -0.5));
          return sIntegrate(sScale(sMul(sDeriv(u), inv), -1), Math.acos(u[0]));
        }
        case 'abs': {
          if (u[0] === 0) throw new CasError('|x| is not differentiable at 0');
          return u[0] > 0 ? u : sScale(u, -1);
        }
      }
    }
  }
  return zero();
}

/** c_k = f^(k)(a) / k! for k = 0..order. Throws CasError when f is not analytic at a. */
export function taylorCoefficients(n: Node, a: number, order: number): number[] {
  const s = series(n, a, order + 1);
  if (!s.every(Number.isFinite)) throw new CasError('The function is not defined at the centre');
  return s;
}
