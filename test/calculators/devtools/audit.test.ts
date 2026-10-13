import { describe, it, expect, vi, afterEach } from 'vitest';
import uuid, { generateUUIDv4, generateULID } from '../../../src/calculators/devtools/uuid-generator/index';
import markdown from '../../../src/calculators/devtools/markdown-editor/index';
import { parseMarkdown, sanitizeUrl } from '../../../src/calculators/devtools/markdown-editor/index';
import jwt from '../../../src/calculators/devtools/jwt-debugger/index';
import unix, { parseIsoStrict } from '../../../src/calculators/devtools/unix-timestamp/index';
import cron, { nextCronRuns, parseCronField } from '../../../src/calculators/devtools/cron-generator/index';
import regex, { catastrophicRisk, findMatches } from '../../../src/calculators/devtools/regex-tester/index';
import color, { parseHex, rgbToCmyk, rgbToHsv } from '../../../src/calculators/devtools/color-converter/index';
import entity, { decodeHtml, encodeHtml } from '../../../src/calculators/devtools/html-entity-encoder/index';
import json, { describeJsonError, scanAndFormatJson } from '../../../src/calculators/devtools/json-formatter/index';
import { minifyCss, minifyHtml, minifyJs } from '../../../src/calculators/devtools/html-minifier/minify';
import stringCase from '../../../src/calculators/devtools/string-case-converter/index';
import lorem from '../../../src/calculators/devtools/lorem-ipsum/index';
import diff from '../../../src/calculators/devtools/code-diff/index';
import { computeDiff, toLines } from '../../../src/calculators/devtools/code-diff/diffUtils';

const val = (r: { id: string; value: string }[], id: string) => r.find((x) => x.id === id)?.value;
afterEach(() => vi.unstubAllGlobals());

describe('uuid-generator: RFC 9562 layout and secure randomness', () => {
  it('v4 sets version nibble 4 and variant 10xx (all-ones and all-zeros random input)', () => {
    expect(generateUUIDv4(() => new Uint8Array(16).fill(0xff))).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    expect(generateUUIDv4(() => new Uint8Array(16))).toBe('00000000-0000-4000-8000-000000000000');
  });
  it('v4 never touches Math.random', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used');
    });
    expect(() => uuid.calculate({ format: 'both', count: '20' })).not.toThrow();
    vi.restoreAllMocks();
  });
  it('ULID timestamp vector from the ULID spec: 1469918176385 -> 01ARYZ6S41', () => {
    expect(generateULID(1469918176385, () => new Uint8Array(16)).slice(0, 10)).toBe('01ARYZ6S41');
    expect(generateULID(0, () => new Uint8Array(16))).toBe('00000000000000000000000000');
    expect(generateULID(0, () => new Uint8Array(16).fill(0xff)).slice(10)).toBe('ZZZZZZZZZZZZZZZZ');
  });
  it('1000 generated v4 ids are unique and well formed', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateUUIDv4()));
    expect(ids.size).toBe(1000);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it('without a secure random source it refuses instead of falling back to Math.random', () => {
    vi.stubGlobal('crypto', undefined);
    const r = uuid.calculate({ format: 'uuid', count: '3' });
    expect(r[0].id).toBe('error');
    expect(r[0].value).toMatch(/crypto\.getRandomValues/);
  });
  it('count must be a whole number', () => {
    expect(uuid.calculate({ format: 'uuid', count: '2.5' })).toEqual([]);
    expect(uuid.calculate({ format: 'uuid', count: '3abc' })).toEqual([]);
  });
});

describe('markdown-editor: XSS and rendering', () => {
  const html = (md: string) => parseMarkdown(md);
  const payloads = [
    '[x](javascript:alert(1))',
    '[x](JaVaScRiPt:alert(1))',
    '[x](java\tscript:alert(1))',
    '[x]( \u0001javascript:alert(1))',
    '[x](vbscript:msgbox(1))',
    '[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
    '![x](javascript:alert(1))',
    '![x](data:image/svg+xml,<svg onload=alert(1)>)',
  ];
  for (const p of payloads) {
    it(`neutralises ${JSON.stringify(p).slice(0, 40)}`, () => {
      const out = html(p);
      expect(out).not.toMatch(/(?:href|src)="[^"]*(?:javascript|vbscript|data):/i);
      expect(out).toMatch(/(?:href|src)=""/);
    });
  }
  it('escapes raw HTML, event handlers and attribute breakouts', () => {
    expect(html('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    expect(html('<img src=x onerror=alert(1)>')).not.toContain('<img');
    const out = html('[x](https://a.com" onclick="alert(1))');
    expect(out).not.toMatch(/ onclick="/);
    expect(out).toContain('&quot;');
    expect(html('[x](&#106;avascript:alert(1))')).toContain('&amp;#106;');
    expect(html('```\n<script>x</script>\n```')).toBe('<pre><code>&lt;script&gt;x&lt;/script&gt;</code></pre>');
  });
  it('keeps safe URLs', () => {
    expect(sanitizeUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(sanitizeUrl('mailto:a@b.co')).toBe('mailto:a@b.co');
    expect(sanitizeUrl('/relative/path')).toBe('/relative/path');
    expect(sanitizeUrl('#frag')).toBe('#frag');
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
  });
  it('markdown inside code spans is not formatted; lists group correctly', () => {
    expect(html('`**x** *y*`')).toBe('<p><code>**x** *y*</code></p>');
    expect(html('- a\n- b\n1. c\n2. d\n+ e')).toBe('<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n<ol>\n<li>c</li>\n<li>d</li>\n</ol>\n<ul>\n<li>e</li>\n</ul>');
  });
  it('calculate still returns the line count and html source', () => {
    const r = markdown.calculate({ markdown: '# T\n\nx', outputFormat: 'HTML Source' });
    expect(val(r, 'html')).toBe('<h1>T</h1>\n<p>x</p>');
    expect(val(r, 'lineCount')).toBe('3');
  });
});

const b64u = (o: unknown) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o), 'utf8').toString('base64url');

describe('jwt-debugger', () => {
  const tok = (h: unknown, p: unknown, s = 'c2ln') => `${b64u(h)}.${b64u(p)}.${s}`;
  it('shows iat / exp as UTC dates (1516239022 = 2018-01-18T01:30:22Z, jwt.io example)', () => {
    const r = jwt.calculate({ token: tok({ alg: 'HS256', typ: 'JWT' }, { sub: '1', iat: 1516239022, exp: 1516242622 }) });
    expect(val(r, 'claim_iat')).toBe('2018-01-18T01:30:22Z');
    expect(val(r, 'claim_exp')).toBe('2018-01-18T02:30:22Z');
    expect(val(r, 'isValid')).toBe('Valid JWT format');
  });
  it('alg none is flagged; signature is never claimed as verified', () => {
    const r = jwt.calculate({ token: tok({ alg: 'none' }, { a: 1 }, '') });
    expect(r.find((x) => x.id === 'isValid')!.warning).toMatch(/unsigned/);
    expect(r.find((x) => x.id === 'isValid')!.interpretation).toMatch(/NOT verified/);
  });
  it('decodes base64url without padding and with - _ characters, UTF-8 payloads', () => {
    const payload = { name: 'Zoë ✓', pad: '???>>>' };
    const r = jwt.calculate({ token: tok({ alg: 'HS256' }, payload) });
    expect(val(r, 'payload')).toContain('Zoë ✓');
    expect(val(r, 'payload')).toContain('???>>>');
  });
  it('rejects non-JSON header/payload and malformed tokens', () => {
    expect(val(jwt.calculate({ token: `${b64u('not json')}.${b64u({ a: 1 })}.x` }), 'isValid')).toMatch(/header is not a JSON object/);
    expect(val(jwt.calculate({ token: `${b64u({ alg: 'x' })}.${b64u('[1,2]')}.x` }), 'isValid')).toMatch(/payload is not a JSON object/);
    expect(val(jwt.calculate({ token: 'a.b' }), 'isValid')).toMatch(/exactly 3 parts/);
    expect(val(jwt.calculate({ token: 'a b.c.d' }), 'isValid')).toMatch(/invalid base64url/);
  });
  it('non-numeric or absurd exp does not throw', () => {
    const r = jwt.calculate({ token: tok({ alg: 'HS256' }, { exp: 'soon', iat: 1e30 }) });
    expect(r.some((x) => x.id.startsWith('claim_'))).toBe(false);
  });
});

describe('unix-timestamp', () => {
  const ts = (v: string) => unix.calculate({ mode: 'ts-to-date', timestamp: v });
  it('seconds vs milliseconds: |value| >= 1e11 is milliseconds (1e11 ms = 1973-03-03T09:46:40Z)', () => {
    expect(val(ts('100000000000'), 'isoString')).toBe('1973-03-03T09:46:40.000Z');
    expect(val(ts('99999999999'), 'isoString')).toBe('5138-11-16T09:46:39.000Z');
    expect(val(ts('-100000000000'), 'isoString')).toBe('1966-10-31T14:13:20.000Z');
  });
  it('epoch, negative and year-2038 values (independent: python datetime)', () => {
    expect(val(ts('0'), 'isoString')).toBe('1970-01-01T00:00:00.000Z');
    expect(val(ts('-1'), 'isoString')).toBe('1969-12-31T23:59:59.000Z');
    expect(val(ts('2147483648'), 'isoString')).toBe('2038-01-19T03:14:08.000Z');
    expect(val(ts('1516239022'), 'isoString')).toBe('2018-01-18T01:30:22.000Z');
  });
  it('rejects garbage and out-of-range values', () => {
    expect(ts('12abc')).toEqual([]);
    expect(ts('1e30')).toEqual([]);
  });
  const d2t = (s: string) => unix.calculate({ mode: 'date-to-ts', dateInput: s });
  it('date -> timestamp for valid ISO dates', () => {
    expect(val(d2t('2024-02-29T00:00:00Z'), 'seconds')).toBe('1709164800');
    expect(val(d2t('2026-01-01T00:00:00Z'), 'seconds')).toBe('1767225600');
    expect(val(d2t('2026-01-01T00:00:00+02:00'), 'seconds')).toBe('1767218400'); // 22:00Z the day before
    expect(val(d2t('2000-02-29'), 'seconds')).toBe('951782400');
    expect(val(d2t('1970-01-01'), 'seconds')).toBe('0');
  });
  it('impossible calendar dates are rejected instead of rolling over (new Date("2025-02-31") = 3 March)', () => {
    for (const s of ['2025-02-31', '2023-02-29', '2100-02-29', '2025-13-01', '2025-04-31', '2025-00-10', '2025-01-01T24:00:00Z', '2025-01-01T10:61:00Z']) {
      expect(d2t(s), s).toEqual([]);
    }
    expect(parseIsoStrict('2025-02-31')).toBeNull();
    expect(parseIsoStrict('Jan 5 2026')).toBeUndefined();
  });
  it('floors negative fractional seconds toward -infinity', () => {
    expect(val(d2t('1969-12-31T23:59:59.500Z'), 'seconds')).toBe('-1');
  });
});

describe('cron-generator', () => {
  const at = Date.UTC(2026, 0, 1, 0, 7); // Thursday 2026-01-01 00:07 UTC
  const iso = (a: number[]) => a.map((t) => new Date(t).toISOString().slice(0, 16));
  it('*/15 steps', () => {
    expect(iso(nextCronRuns('*/15 * * * *', at))).toEqual(['2026-01-01T00:15', '2026-01-01T00:30', '2026-01-01T00:45', '2026-01-01T01:00', '2026-01-01T01:15']);
  });
  it('day-of-week 1 = Monday (2026-01-05 is a Monday)', () => {
    expect(iso(nextCronRuns('0 12 * * 1', at, 2))).toEqual(['2026-01-05T12:00', '2026-01-12T12:00']);
  });
  it('7 and 0 are both Sunday (2026-01-04)', () => {
    expect(iso(nextCronRuns('0 0 * * 7', at, 1))).toEqual(['2026-01-04T00:00']);
    expect(iso(nextCronRuns('0 0 * * 0', at, 1))).toEqual(['2026-01-04T00:00']);
  });
  it('day-of-month AND day-of-week both set = OR (Vixie cron)', () => {
    expect(iso(nextCronRuns('0 0 13 * 5', at, 5))).toEqual(['2026-01-02T00:00', '2026-01-09T00:00', '2026-01-13T00:00', '2026-01-16T00:00', '2026-01-23T00:00']);
  });
  it('impossible schedule never fires; invalid fields are rejected', () => {
    expect(nextCronRuns('0 0 31 2 *', at)).toEqual([]);
    expect(nextCronRuns('60 * * * *', at)).toEqual([]);
    expect(nextCronRuns('* * * * 8', at)).toEqual([]);
    expect(parseCronField('*/0', 0, 59)).toBeNull();
    expect(parseCronField('5-3', 0, 59)).toBeNull();
    expect([...parseCronField('1-3,10,*/30', 0, 59)!].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 10, 30]);
  });
  it('custom validation: no NaN in the expression, ranges enforced, 7 normalised to 0', () => {
    const c = (o: Record<string, string>) => cron.calculate({ preset: 'Custom', minute: '5', hour: '4', ...o });
    expect(c({ dayOfMonth: 'abc' })).toEqual([]);
    expect(c({ dayOfMonth: '32' })).toEqual([]);
    expect(c({ month: '13' })).toEqual([]);
    expect(c({ dayOfWeek: '8' })).toEqual([]);
    expect(val(c({ dayOfWeek: '7' }), 'expression')).toBe('5 4 * * 0');
    expect(val(c({}), 'expression')).toBe('5 4 * * *');
    expect(val(c({ dayOfMonth: '31', month: '2' }), 'nextRuns')).toMatch(/Never fires/);
  });
  it('presets include a UTC next-runs preview', () => {
    const r = cron.calculate({ preset: 'Every 5 minutes' });
    expect(val(r, 'nextRuns')!.split(', ')).toHaveLength(5);
    expect(r.find((x) => x.id === 'nextRuns')!.interpretation).toMatch(/daylight-saving/);
  });
});

describe('regex-tester', () => {
  it('zero-length matches terminate (/a*/g used to loop forever)', () => {
    const { matches } = findMatches('a*', 'g', 'baaac');
    expect(matches.map((m) => [m.text, m.index])).toEqual([['', 0], ['aaa', 1], ['', 4], ['', 5]]);
  });
  it('reports positions', () => {
    const r = regex.calculate({ pattern: '\\d+', flags: 'g', testString: 'ab12cd345' });
    expect(val(r, 'matchCount')).toBe('2');
    expect(val(r, 'positions')).toBe('2–4, 6–9');
  });
  it('catastrophic backtracking shapes are not run on long input', () => {
    const r = regex.calculate({ pattern: '(a+)+$', flags: '', testString: 'a'.repeat(40) + '!' });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
    expect(catastrophicRisk('(a+)+$', 'aaa')).toBeNull(); // short input is fine
    expect(catastrophicRisk('^[a-z]+$', 'a'.repeat(1000))).toBeNull();
    expect(val(regex.calculate({ pattern: '(a+)+$', flags: '', testString: 'aaa!' }), 'isMatch')).toBe('No');
  });
  it('invalid pattern reports the engine message', () => {
    expect(regex.calculate({ pattern: '(', flags: '', testString: 'x' })[0].id).toBe('error');
  });
  it('flags: i, m, s change results', () => {
    expect(val(regex.calculate({ pattern: 'ABC', flags: 'gi', testString: 'abc' }), 'matchCount')).toBe('1');
    expect(val(regex.calculate({ pattern: '^b', flags: 'gm', testString: 'a\nb' }), 'matchCount')).toBe('1');
    expect(val(regex.calculate({ pattern: 'a.b', flags: 'gims', testString: 'a\nb' }), 'matchCount')).toBe('1');
    expect(val(regex.calculate({ pattern: 'a.b', flags: 'g', testString: 'a\nb' }), 'matchCount')).toBe('0');
  });
});

describe('color-converter', () => {
  it('3, 4, 6 and 8 digit hex', () => {
    expect(parseHex('#f00')).toEqual({ r: 255, g: 0, b: 0, a: null });
    expect(parseHex('f00a')).toEqual({ r: 255, g: 0, b: 0, a: 170 / 255 });
    expect(parseHex('#336699')).toEqual({ r: 51, g: 102, b: 153, a: null });
    expect(parseHex('#FF000080')!.a).toBeCloseTo(128 / 255, 12);
    expect(parseHex('#12345')).toBeNull();
    expect(parseHex('#GGG')).toBeNull();
  });
  it('#336699 in every model (hand-derived: HSL 210/50/40, HSV 210/67/60, CMYK 67/33/0/40)', () => {
    const r = color.calculate({ mode: 'HEX → RGB/HSL', hexInput: '#336699' });
    expect(val(r, 'rgb')).toBe('rgb(51, 102, 153)');
    expect(val(r, 'hsl')).toBe('hsl(210, 50%, 40%)');
    expect(val(r, 'hsv')).toBe('hsv(210, 67%, 60%)');
    expect(val(r, 'cmyk')).toBe('cmyk(67%, 33%, 0%, 40%)');
  });
  it('alpha is carried through', () => {
    const r = color.calculate({ mode: 'HEX → RGB/HSL', hexInput: '#FF000080' });
    expect(val(r, 'rgba')).toBe('rgba(255, 0, 0, 0.502)');
    expect(val(r, 'hex8')).toBe('#FF000080');
    expect(val(color.calculate({ mode: 'HEX → RGB/HSL', hexInput: '#abc' }), 'hex')).toBe('#AABBCC');
  });
  it('black, white, grey and hue wrap', () => {
    expect(rgbToCmyk(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 100 });
    expect(rgbToCmyk(255, 255, 255)).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    expect(rgbToHsv(128, 128, 128)).toEqual({ h: 0, s: 0, v: 50 });
    expect(val(color.calculate({ mode: 'HSL → HEX/RGB', h: '360', s: '100', l: '50' }), 'hex')).toBe('#FF0000');
  });
  it('RGB mode: strict numbers, no truncation surprises, out of range rejected', () => {
    expect(color.calculate({ mode: 'RGB → HEX/HSL', r: '12abc', g: '0', b: '0' })).toEqual([]);
    expect(color.calculate({ mode: 'RGB → HEX/HSL', r: '', g: '0', b: '0' })).toEqual([]);
    expect(color.calculate({ mode: 'RGB → HEX/HSL', r: '256', g: '0', b: '0' })).toEqual([]);
    expect(val(color.calculate({ mode: 'RGB → HEX/HSL', r: '254.6', g: '0', b: '0' }), 'hex')).toBe('#FF0000');
  });
});

describe('html-entity-encoder', () => {
  it('decodes in ONE pass (no double decoding)', () => {
    expect(decodeHtml('&amp;lt;')).toBe('&lt;');
    expect(decodeHtml('&amp;amp;')).toBe('&amp;');
    expect(decodeHtml('&lt;script&gt;')).toBe('<script>');
  });
  it('numeric references incl. astral plane (surrogate pairs) and invalid code points', () => {
    expect(decodeHtml('&#128512;')).toBe('😀');
    expect(decodeHtml('&#x1F600;')).toBe('😀');
    expect(decodeHtml('&#99999999;')).toBe('�'); // used to throw RangeError
    expect(decodeHtml('&#0;')).toBe('�');
    expect(decodeHtml('&#xD800;')).toBe('�');
    expect(decodeHtml('&#150;')).toBe('–'); // HTML5: 0x96 is windows-1252 en dash
    expect(decodeHtml('&bogus; &amp')).toBe('&bogus; &amp');
  });
  it('encode: markup characters, and non-ASCII as named/numeric (astral = ONE reference)', () => {
    expect(encodeHtml('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
    expect(encodeHtml('😀', true)).toBe('&#x1F600;');
    expect(encodeHtml('© café', true)).toBe('&copy; caf&#xE9;');
    expect(encodeHtml('café')).toBe('café');
  });
  it('round trip', () => {
    for (const s of ['a < b && c > "d"', '😀 © 日本', 'x&#y;']) expect(decodeHtml(encodeHtml(s, true))).toBe(s);
  });
  it('calculate offers the extra encode mode', () => {
    expect(val(entity.calculate({ mode: 'encode-all', input: 'é' }), 'output')).toBe('&#xE9;');
  });
});

describe('json-formatter', () => {
  it('keeps big integers exact and warns (JSON.parse would print 12345678901234567000)', () => {
    const r = json.calculate({ jsonInput: '{"id": 12345678901234567890}', indentSize: '2' });
    expect(val(r, 'formatted')).toBe('{\n  "id": 12345678901234567890\n}');
    expect(r.find((x) => x.id === 'status')!.warning).toMatch(/2\^53/);
  });
  it('flags duplicate keys and preserves key order (stringify would move "2","1" first)', () => {
    const r = json.calculate({ jsonInput: '{"a":1,"a":2,"b":1,"2":2,"1":3}', indentSize: '2' });
    expect(r.find((x) => x.id === 'status')!.warning).toMatch(/Duplicate key.*a/);
    expect(val(r, 'formatted')!.indexOf('"b"')).toBeLessThan(val(r, 'formatted')!.indexOf('"2"'));
  });
  it('matches JSON.stringify exactly for ordinary documents (2, 4 and tab)', () => {
    const docs = ['{"a":[1,2,{"b":null}],"c":"x,y:{z}\\"q\\"","d":{},"e":[],"f":-1.5,"g":true}', '[]', '[[]]', '{"k":[{"a":1},{"b":[true,false]}]}', '"str"', '12', '[1, 2,\n 3]'];
    for (const d of docs) {
      for (const [opt, expectIndent] of [['2', 2], ['4', 4], ['tab', '\t']] as const) {
        expect(val(json.calculate({ jsonInput: d, indentSize: opt }), 'formatted')).toBe(JSON.stringify(JSON.parse(d), null, expectIndent));
      }
    }
  });
  it('error messages carry line and column', () => {
    const r = json.calculate({ jsonInput: '{\n  "a": 1,\n}', indentSize: '2' });
    expect(val(r, 'status')).toMatch(/^Invalid JSON: .*line 3/);
    expect(describeJsonError('Unexpected token } in JSON at position 12', '{\n  "a": 1,\n}')).toBe('Unexpected token } in JSON at position 12 (line 3, column 1)');
  });
  it('scan reports nothing for safe documents', () => {
    const s = scanAndFormatJson('{"n": 9007199254740991, "m": 1.5}', '  ');
    expect(s.unsafeNumbers).toEqual([]);
    expect(s.duplicateKeys).toEqual([]);
    expect(scanAndFormatJson('[9007199254740993]', '  ').unsafeNumbers).toEqual(['9007199254740993']);
  });
});

describe('html-minifier', () => {
  it('HTML: pre, textarea, script, style are untouched', () => {
    const src = '<div>\n  <pre>  a\n   b  </pre>\n  <textarea>  x\n   y </textarea>\n  <script>\n  // keep\n  var a = 1;\n  </script>\n  <style>\n a  { b : c }\n </style>\n</div>';
    const out = minifyHtml(src);
    expect(out).toContain('<pre>  a\n   b  </pre>');
    expect(out).toContain('<textarea>  x\n   y </textarea>');
    expect(out).toContain('<script>\n  // keep\n  var a = 1;\n  </script>');
    expect(out).toContain('<style>\n a  { b : c }\n </style>');
    expect(out.startsWith('<div><pre>')).toBe(true);
  });
  it('HTML: text content and inline spacing survive', () => {
    expect(minifyHtml('<p>a = b</p>')).toBe('<p>a = b</p>'); // the old "remove spaces around =" rewrote text
    expect(minifyHtml('<b>a</b> <i>b</i>')).toBe('<b>a</b> <i>b</i>');
    expect(minifyHtml('<p>a</p>\n\n  <p>b</p>')).toBe('<p>a</p><p>b</p>');
    expect(minifyHtml('<p>  1 < 2 and   3 > 2 </p>')).toBe('<p>1 < 2 and 3 > 2</p>');
  });
  it('HTML: comments removed, conditional comments kept, svg self-closing kept', () => {
    expect(minifyHtml('<p>a</p><!-- gone --><p>b</p>')).toBe('<p>a</p><p>b</p>');
    expect(minifyHtml('<!--[if IE]><p>ie</p><![endif]-->')).toBe('<!--[if IE]><p>ie</p><![endif]-->');
    expect(minifyHtml('<svg><path d="M0 0" /></svg>')).toBe('<svg><path d="M0 0"/></svg>');
    expect(minifyHtml('<br /><img src="a.png" alt="x y" />')).toBe('<br><img src=a.png alt="x y">'.replace('src=a.png', 'src="a.png"'));
    expect(minifyHtml('<div class="a" id="b">x</div>')).toBe('<div class=a id=b>x</div>');
    expect(minifyHtml('<a title="a > b">x</a>')).toBe('<a title="a > b">x</a>');
  });
  it('CSS: strings, url(), calc(), selectors with spaces', () => {
    expect(minifyCss('a :hover { color : red ; margin : 0 2px ; }')).toBe('a :hover{color:red;margin:0 2px}');
    expect(minifyCss('a { content : "a  b /* x */" ; }')).toBe('a{content:"a  b /* x */"}');
    expect(minifyCss("/* don't */ a { b : c }")).toBe('a{b:c}');
    expect(minifyCss('a { width : calc( 100% - 10px ) ; }')).toBe('a{width:calc( 100% - 10px )}');
    expect(minifyCss('a { background : url( "x y.png" ) ; }')).toBe('a{background:url( "x y.png" )}');
    expect(minifyCss('ul > li , p + p { x : y }')).toBe('ul>li,p+p{x:y}');
  });
  it('JS: strings, URLs, regex literals, template literals and operators are untouched', () => {
    expect(minifyJs('var u = "http://x.com"; // c\nvar v = 1;')).toBe('var u = "http://x.com";\nvar v = 1;');
    expect(minifyJs('x = a + +b;')).toBe('x = a + +b;');
    expect(minifyJs('const r = /https?:\\/\\//g; // c')).toBe('const r = /https?:\\/\\//g;');
    expect(minifyJs('const t = `a\n    b`;\n\n\nf();')).toBe('const t = `a\n    b`;\nf();');
    expect(minifyJs('a = b / c; /* x */ d = e / f;')).toBe('a = b / c; d = e / f;');
    expect(minifyJs('  if (x) {\n\n    y();\n  }  ')).toBe('if (x) {\ny();\n}');
  });
});

describe('string-case-converter (Unicode)', () => {
  const run = (input: string) => stringCase.calculate({ input });
  it('non-ASCII letters are word characters', () => {
    expect(val(run('café au lait'), 'camelCase')).toBe('caféAuLait');
    expect(val(run('ÉCOLE normale'), 'PascalCase')).toBe('ÉcoleNormale');
    expect(val(run('привет мир'), 'snake_case')).toBe('привет_мир');
  });
  it('acronyms and digits', () => {
    expect(val(run('XMLHttpRequest'), 'snake_case')).toBe('xml_http_request');
    expect(val(run('HTML5Parser'), 'kebab-case')).toBe('html5-parser');
    expect(val(run('user_id2Name'), 'snake_case')).toBe('user_id2_name');
    expect(val(run('customerBillingAddress'), 'camelCase')).toBe('customerBillingAddress');
  });
  it('emoji are delimiters and astral letters survive capitalisation', () => {
    expect(val(run('😀 smile'), 'camelCase')).toBe('smile');
    expect(val(run('𐐨𐐯 x'), 'PascalCase')).toBe('𐐀𐐯X');
  });
});

describe('lorem-ipsum', () => {
  it('canonical Cicero opening and the "random start" option', () => {
    const classic = val(lorem.calculate({ count: '1', unit: 'Paragraphs', startWithClassic: 'yes' }), 'generatedText')!;
    expect(classic.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.')).toBe(true);
    const other = val(lorem.calculate({ count: '1', unit: 'Paragraphs', startWithClassic: 'no' }), 'generatedText')!;
    expect(other.startsWith('Sed ut perspiciatis unde omnis iste natus error')).toBe(true);
  });
  it('counts are strict integers; words/sentences exact', () => {
    expect(lorem.calculate({ count: '5abc', unit: 'Words' })).toEqual([]);
    expect(lorem.calculate({ count: '2.5', unit: 'Words' })).toEqual([]);
    expect(lorem.calculate({ count: '51', unit: 'Words' })).toEqual([]);
    expect(val(lorem.calculate({ count: '7', unit: 'Words' }), 'generatedText')).toBe('lorem ipsum dolor sit amet consectetur adipiscing');
    expect(val(lorem.calculate({ count: '7', unit: 'Words' }), 'wordCount')).toBe('7');
  });
});

describe('code-diff', () => {
  it('CRLF vs LF and a final newline are not changes', () => {
    const r = diff.calculate({ leftText: 'a\r\nb\r\n', rightText: 'a\nb' });
    expect(val(r, 'totalChanges')).toBe('0');
  });
  it('minimal diff counts', () => {
    expect(val(diff.calculate({ leftText: 'a\nb\nc', rightText: 'a\nc' }), 'deletions')).toBe('1');
    const r = diff.calculate({ leftText: 'x\ny\nz', rightText: 'y\nz\nw' });
    expect([val(r, 'additions'), val(r, 'deletions')]).toEqual(['1', '1']);
  });
  it('line lists: unchanged head/tail are kept in order around the change', () => {
    const d = computeDiff(['a', 'b', 'c', 'd'], ['a', 'X', 'c', 'd'])!;
    expect(d.leftLines.map((l) => l.type)).toEqual(['unchanged', 'removed', 'unchanged', 'unchanged']);
    expect(d.rightLines.map((l) => `${l.type}:${l.text}`)).toEqual(['unchanged:a', 'added:X', 'unchanged:c', 'unchanged:d']);
  });
  it('huge unrelated inputs are refused (no multi-GB DP table); huge near-identical inputs are fast', () => {
    const many = (p: string, n: number) => Array.from({ length: n }, (_, i) => `${p}${i}`);
    expect(computeDiff(many('l', 5000), many('r', 5000))).toBeNull();
    const base = many('same', 50000);
    const changed = [...base];
    changed[25000] = 'different';
    const d = computeDiff(base, changed)!;
    expect(d.leftLines.filter((l) => l.type === 'removed')).toHaveLength(1);
    expect(diff.calculate({ leftText: many('l', 5000).join('\n'), rightText: many('r', 5000).join('\n') })[0].id).toBe('error');
  });
  it('toLines', () => {
    expect(toLines('')).toEqual([]);
    expect(toLines('a\r\nb\rc\n')).toEqual(['a', 'b', 'c']);
    expect(toLines('a\n\n')).toEqual(['a', '']);
  });
});
