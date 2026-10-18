import { describe, it, expect } from 'vitest';
import qr from '../../../src/calculators/devtools/qr-code-generator';
import htmlMinifier from '../../../src/calculators/devtools/html-minifier';
import { minifyCss, minifyHtml, minifyJs } from '../../../src/calculators/devtools/html-minifier/minify';
import windChill from '../../../src/calculators/math/wind-chill';
import golf from '../../../src/calculators/math/golf-handicap';
import { byteCapacity, encodeQr, type Ecl } from '../../../src/utils/qrcode';

const val = (r: { id: string; value: string }[], id: string) => r.find((x) => x.id === id)?.value;

// ───────────────────────────── qr-code-generator ─────────────────────────────
// Oracles: ISO/IEC 18004 capacity tables and format/version-information tables; every symbol was also decoded back to its
// input text with OpenCV 4.12 (QRCodeDetectorAruco), an independent decoder, for all 40 versions x L/M/Q/H.
describe('qr-code-generator: ISO 18004 facts and a decoder-verified symbol', () => {
  it('byte-mode capacities (ISO 18004 table 7): version 1, 10 and 40 at L/M/Q/H', () => {
    const levels: Ecl[] = ['L', 'M', 'Q', 'H'];
    expect(levels.map((e) => byteCapacity(1, e))).toEqual([17, 14, 11, 7]);
    expect(levels.map((e) => byteCapacity(10, e))).toEqual([271, 213, 151, 119]);
    expect(levels.map((e) => byteCapacity(40, e))).toEqual([2953, 2331, 1663, 1273]);
  });

  it('page text: "https://example.com/" at M is version 2, 25 x 25, 20 of 26 bytes', () => {
    const r = qr.calculate({ content: 'https://example.com/', size: '200', errorCorrection: 'M' });
    expect(val(r, 'version')).toBe('Version 2 (25 × 25 modules)'); // size = 17 + 4 x 2
    expect(val(r, 'capacity')).toBe('20 of 26 bytes at level M');
  });

  it('the worked-example connection string is 76 bytes and needs version 5 at M (v4 holds 62, v5 holds 84)', () => {
    const s = 'postgresql://user:password@db.internal.example.com:5432/mydb?sslmode=require';
    expect(new TextEncoder().encode(s).length).toBe(76);
    expect(byteCapacity(4, 'M')).toBe(62);
    expect(byteCapacity(5, 'M')).toBe(84);
    expect(val(qr.calculate({ content: s, errorCorrection: 'M' }), 'version')).toMatch(/^Version 5 /);
  });

  it('size is 17 + 4v for every version and the smallest fitting version is chosen', () => {
    for (const ecl of ['L', 'M', 'Q', 'H'] as Ecl[]) {
      for (let v = 2; v <= 40; v += 3) {
        const q = encodeQr('a'.repeat(byteCapacity(v - 1, ecl) + 1), ecl)!;
        expect(q.version).toBe(v);
        expect(q.size).toBe(17 + 4 * v);
        expect(q.modules).toHaveLength(q.size);
      }
    }
  });

  // Matrix of "https://example.com/" at level M, decoded back to the same text by OpenCV 4.12.
  const GOLDEN = [
    '1111111010011011101111111', '1000001001110000101000001', '1011101001000010101011101', '1011101011101111101011101',
    '1011101010010011101011101', '1000001011000100001000001', '1111111010101010101111111', '0000000011001010000000000',
    '1000101111010011011111001', '1001010011010011010011010', '1001011011011111011101100', '1010010100110011010100110',
    '1110101010000110011101111', '1100000011101011100010010', '0000101101011111110111100', '0010100100110101000110110',
    '1111001011101101111111100', '0000000010000110100010000', '1111111010100000101010000', '1000001001001010100011110',
    '1011101011110110111111111', '1011101000101000011100111', '1011101001111111111001010', '1000001000010100001111110',
    '1111111011101101011000111',
  ];
  const q = encodeQr('https://example.com/', 'M')!;

  it('module matrix equals the OpenCV-verified symbol (mask 4)', () => {
    expect(q.mask).toBe(4);
    expect(q.modules.map((r) => r.map((b) => (b ? '1' : '0')).join(''))).toEqual(GOLDEN);
  });

  it('structure: three 7x7 finder patterns with light separators, timing lines, dark module', () => {
    const n = q.size;
    const m = q.modules;
    const finder = (x0: number, y0: number) => {
      for (let dy = 0; dy < 7; dy++)
        for (let dx = 0; dx < 7; dx++) {
          const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
          expect(m[y0 + dy][x0 + dx]).toBe(ring !== 2); // 1:1:3:1:1 -> dark, light, dark core
        }
    };
    finder(0, 0);
    finder(n - 7, 0);
    finder(0, n - 7);
    for (let i = 0; i < 8; i++) {
      expect(m[7][i]).toBe(false);
      expect(m[i][7]).toBe(false);
      expect(m[7][n - 1 - i]).toBe(false);
      expect(m[i][n - 8]).toBe(false);
      expect(m[n - 8][i]).toBe(false);
      expect(m[n - 1 - i][7]).toBe(false);
    }
    for (let i = 8; i < n - 8; i++) {
      expect(m[6][i]).toBe(i % 2 === 0); // timing patterns alternate, starting dark
      expect(m[i][6]).toBe(i % 2 === 0);
    }
    expect(m[n - 8][8]).toBe(true); // the always-dark module
    expect(m[n - 7 - 4][n - 7 - 4]).toBe(true); // version 2 alignment pattern centre at (18,18)
  });

  it('format information: both copies equal, a valid BCH(15,5) word, level M and mask 4 (ISO 18004 annex C)', () => {
    const n = q.size;
    const m = q.modules;
    const f1: number[] = [];
    for (let i = 0; i <= 5; i++) f1[i] = +m[i][8];
    f1[6] = +m[7][8];
    f1[7] = +m[8][8];
    f1[8] = +m[8][7];
    for (let i = 9; i < 15; i++) f1[i] = +m[8][14 - i];
    const f2: number[] = [];
    for (let i = 0; i < 8; i++) f2[i] = +m[8][n - 1 - i];
    for (let i = 8; i < 15; i++) f2[i] = +m[n - 15 + i][8];
    expect(f2).toEqual(f1);
    const word = f1.reduce((a, b, i) => a | (b << i), 0);
    // ISO 18004 annex C, level M, masks 0..7 (already XOR-masked with 101010000010010)
    const M_WORDS = ['101010000010010', '101000100100101', '101111001111100', '101101101001011', '100010111111001', '100000011001110', '100111110010111', '100101010100000'];
    expect(word.toString(2).padStart(15, '0')).toBe(M_WORDS[q.mask]);
  });

  it('version information of a version 7 symbol is 0x07C94 (ISO 18004 table D.1)', () => {
    const s7 = encodeQr('a'.repeat(byteCapacity(6, 'M') + 1), 'M')!;
    expect(s7.version).toBe(7);
    let v = 0;
    for (let i = 0; i < 18; i++) if (s7.modules[Math.floor(i / 3)][s7.size - 11 + (i % 3)]) v |= 1 << i;
    expect(v).toBe(0x07c94);
  });

  it('too-long input is reported, not drawn; UTF-8 is counted in bytes', () => {
    expect(qr.calculate({ content: 'a'.repeat(2954), errorCorrection: 'L' })[0].id).toBe('error');
    expect(val(qr.calculate({ content: '日本語', errorCorrection: 'L' }), 'capacity')).toBe('9 of 17 bytes at level L');
  });
});

// ───────────────────────────── html-minifier ─────────────────────────────
// Oracle: HTML / CSS / JS semantics by hand (what a browser renders must not change) and hand-counted lengths.
describe('html-minifier: behaviour that must be preserved', () => {
  it('whitespace inside <pre>, <textarea>, <script>, <style> is untouched (any case)', () => {
    for (const s of [
      '<pre>  a\n   b  </pre>',
      '<textarea>  x   y\n </textarea>',
      '<script>\n  var a  =  1;\n  // keep\n</script>',
      '<style>\n  a   { color : red }\n</style>',
      '<PRE>  A </PRE>',
    ]) {
      expect(minifyHtml(s)).toBe(s);
    }
  });

  it('IE conditional comments survive in both forms; ordinary comments go', () => {
    expect(minifyHtml('<!--[if IE 8]>\n<p>  IE  </p>\n<![endif]--><!-- gone --><p>a</p>')).toBe('<!--[if IE 8]><p>IE</p><![endif]--><p>a</p>');
    // downlevel-revealed form: the "<!-->" must not start an ordinary comment that swallows the content
    expect(minifyHtml('<!--[if !IE]><!--><p>x</p><!--<![endif]-->')).toBe('<!--[if !IE]><!--><p>x</p><!--<![endif]-->');
    expect(minifyHtml('<!--[if gt IE 8]><!--> <html class="x"> <!--<![endif]-->\n<body>  hi </body>')).toBe(
      '<!--[if gt IE 8]><!--><html class=x><!--<![endif]--><body>hi</body>',
    );
    expect(minifyHtml('<p>a</p><!----><p>b</p><!-- x - y --><p>c</p>')).toBe('<p>a</p><p>b</p><p>c</p>');
  });

  it('attribute quoting: only simple values lose their quotes; values with spaces or ">" keep them', () => {
    expect(minifyHtml('<a   href = "x.html"   class="btn  big"  data-x=\'a b\' title="a>b" >  link  </a>')).toBe(
      '<a href=x.html class="btn  big" data-x=\'a b\' title="a>b"> link </a>',
    );
    expect(minifyHtml('<a href="/p?x=1&y=2">q</a>')).toBe('<a href="/p?x=1&y=2">q</a>'); // "/" "?" "=" force quotes
    expect(minifyHtml('<input value="" disabled />')).toBe('<input value="" disabled>'); // empty value keeps quotes
  });

  it('spaces between inline elements are kept, around block elements dropped', () => {
    expect(minifyHtml('<p>a <b>b</b> <i>c</i> </p>')).toBe('<p>a <b>b</b> <i>c</i></p>');
    expect(minifyHtml('<ul>\n <li>One</li>\n <li>Two</li>\n</ul>')).toBe('<ul><li>One</li><li>Two</li></ul>');
    expect(minifyHtml('<p>Hello   world\n\n  again</p>')).toBe('<p>Hello world again</p>');
  });

  it('CSS: strings, url() and calc() are untouched; descendant and pseudo-class selectors keep their meaning', () => {
    expect(minifyCss('a  >  b { margin : 0  auto ; }')).toBe('a>b{margin:0 auto}');
    expect(minifyCss('a :hover { color : red }')).toBe('a :hover{color:red}'); // "a :hover" != "a:hover"
    expect(minifyCss('.x { width : calc( 100%  -  10px ) ; content : "a  b" }')).toBe('.x{width:calc( 100%  -  10px );content:"a  b"}');
    expect(minifyCss('/* c */ a{background:url( "a b.png" )}')).toBe('a{background:url( "a b.png" )}');
  });

  it('JS: comments go, strings/templates/regex untouched, line breaks kept', () => {
    expect(minifyJs('var s = "http://x.com"; // c')).toBe('var s = "http://x.com";');
    expect(minifyJs('var t = `a  //  b\n  c`;')).toBe('var t = `a  //  b\n  c`;');
    expect(minifyJs('x = /ab+c/gi.test(s) // t')).toBe('x = /ab+c/gi.test(s)');
    expect(minifyJs('a + +b')).toBe('a + +b'); // must not become a++b
    expect(minifyJs('let a = 1;\n\n\n  let b = 2;   \n/* multi\nline */\nlet c = 3;')).toBe('let a = 1;\nlet b = 2;\nlet c = 3;');
  });

  it('reported sizes are string lengths (characters), hand counted', () => {
    // "<p>  hi  </p>" is 13 characters, "<p>hi</p>" is 9; savings = 4/13 = 30.8%
    const r = htmlMinifier.calculate({ codeType: 'HTML', code: '<p>  hi  </p>' });
    expect(val(r, 'minified')).toBe('<p>hi</p>');
    expect(val(r, 'originalSize')).toBe('13 characters');
    expect(val(r, 'minifiedSize')).toBe('9 characters');
    expect(val(r, 'savingsPercent')).toBe('30.8%');
    // the page's own worked examples: 241 -> 185 and 247 -> 155 characters
    const [h, c] = htmlMinifier.educational.workedExamples!;
    expect(val(htmlMinifier.calculate(h.inputs), 'originalSize')).toBe('241 characters');
    expect(val(htmlMinifier.calculate(h.inputs), 'minifiedSize')).toBe('185 characters');
    expect(val(htmlMinifier.calculate(c.inputs), 'originalSize')).toBe('247 characters');
    expect(val(htmlMinifier.calculate(c.inputs), 'minifiedSize')).toBe('155 characters');
  });
});

// ───────────────────────────── wind-chill-calculator ─────────────────────────────
// Oracle: NWS / Environment Canada 2001 formula evaluated in Python: 35.74 + 0.6215T - 35.75 V^0.16 + 0.4275 T V^0.16
// (T in F, V in mph) and the metric form 13.12 + 0.6215T - 11.37 V^0.16 + 0.3965 T V^0.16 (C, km/h).
describe('wind-chill-calculator', () => {
  const run = (temperature: string, tempUnit: string, windSpeed: string, speedUnit: string) =>
    windChill.calculate({ temperature, tempUnit, windSpeed, speedUnit });
  const chart = (r: { id: string; value: string }[]) => JSON.parse(val(r, '_chartData')!);

  it('20 F at 25 mph = 2.646 F (-16.31 C); the page example', () => {
    const r = run('20', 'F', '25', 'mph');
    expect(val(r, 'windChill')).toBe('2.6°F / -16.3°C');
    expect(chart(r).windChillF).toBeCloseTo(2.646116, 5);
  });

  it('NWS chart point: 0 F at 15 mph = -19.4 F, frostbite possible in about 30 minutes', () => {
    const r = run('0', 'F', '15', 'mph');
    expect(val(r, 'windChill')).toBe('-19.4°F / -28.6°C');
    expect(val(r, 'frostbiteRisk')).toBe('High risk (frostbite possible in 10 to 30 minutes)');
  });

  it('metric input agrees with the metric formula within 0.1 C (coefficients are rounded differently)', () => {
    const metric = (T: number, V: number) => 13.12 + 0.6215 * T - 11.37 * V ** 0.16 + 0.3965 * T * V ** 0.16;
    const cases: [number, number, number][] = [
      [-20, 30, -32.568044],
      [-10, 20, -17.860584],
      [-40, 60, -64.166618],
    ];
    for (const [T, V, expected] of cases) {
      expect(metric(T, V)).toBeCloseTo(expected, 5);
      const c = chart(run(String(T), 'C', String(V), 'kmh')).windChillC as number;
      expect(Math.abs(c - expected)).toBeLessThan(0.1);
    }
    expect(val(run('-20', 'C', '30', 'kmh'), 'windChill')).toBe('-26.6°F / -32.5°C');
  });

  it('24.14016 km/h is exactly 15 mph, so units give the same wind chill', () => {
    expect(chart(run('0', 'F', '15', 'mph')).windChillF).toBeCloseTo(chart(run('-17.777777777777779', 'C', '24.14016', 'kmh')).windChillF, 9);
  });

  it('outside the formula (above 50 F, or wind of 3 mph or less) the air temperature is returned', () => {
    expect(val(run('55', 'F', '20', 'mph'), 'windChill')).toBe('55°F / 12.8°C');
    expect(val(run('30', 'F', '3', 'mph'), 'windChill')).toBe('30°F / -1.1°C');
    expect(chart(run('50', 'F', '3.01', 'mph')).windChillF).toBeLessThan(50);
  });

  it('Environment Canada risk bands, on the wind chill in whole C', () => {
    const risk = (c: number) => val(run(String(c), 'C', '0', 'kmh'), 'frostbiteRisk'); // no wind: wind chill = air temperature
    expect(risk(-9)).toBe('Low risk');
    expect(risk(-10)).toMatch(/^Moderate/);
    expect(risk(-27)).toMatch(/^Moderate/);
    expect(risk(-28)).toMatch(/10 to 30 minutes/);
    expect(risk(-39)).toMatch(/10 to 30 minutes/);
    expect(risk(-40)).toMatch(/5 to 10 minutes/);
    expect(risk(-47)).toMatch(/5 to 10 minutes/);
    expect(risk(-48)).toMatch(/2 to 5 minutes/);
    expect(risk(-54)).toMatch(/2 to 5 minutes/);
    expect(risk(-55)).toMatch(/under 2 minutes/);
  });

  it('invalid input returns no results', () => {
    expect(run('', 'F', '10', 'mph')).toEqual([]);
    expect(run('10', 'F', '-1', 'mph')).toEqual([]);
  });
});

// ───────────────────────────── golf-handicap-calculator ─────────────────────────────
// Oracle: World Handicap System Rules 5.1, 5.2a/b, 6.1 (USGA/R&A Rules of Handicapping), computed with Python Decimal and
// round-half-up: Differential = 113/Slope x (AGS - Course Rating - PCC) to 0.1; index = mean of the lowest N differentials
// (+ adjustment) to 0.1 with N per the table: 3:1(-2.0) 4:1(-1.0) 5:1 6:2(-1.0) 7-8:2 9-11:3 12-14:4 15-16:5 17-18:6 19:7 20:8.
describe('golf-handicap-calculator', () => {
  const idx = (rounds: string, extra: Record<string, string> = {}) => golf.calculate({ rounds, numRounds: '20', ...extra });
  const lines = (scores: number[], rating = 70, slope = 113) => scores.map((s) => `${s}, ${rating}, ${slope}`).join('\n');

  it('page example: five rounds 85, 92, 88, 80, 83 at 72.5/130 -> differentials 10.9 17.0 13.5 6.5 9.1, index 6.5', () => {
    const text = [85, 92, 88, 80, 83].map((s) => `${s}, 72.5, 130`).join('\n');
    const r = idx(text);
    expect(val(r, 'handicapIndex')).toBe('6.5');
    const d = JSON.parse(val(r, '_differentials')!).map((x: { differential: number }) => x.differential);
    expect(d).toEqual([10.9, 17.0, 13.5, 6.5, 9.1]);
    expect(val(r, 'roundsUsed')).toBe('Lowest 1 of 5');
    expect(r.find((x) => x.id === 'adjustment')).toBeUndefined();
  });

  it('WHS Rule 5.2a with 3, 4 scores: lowest 1 minus 2.0 / minus 1.0', () => {
    const text = [85, 92, 88, 80].map((s) => `${s}, 72.5, 130`).join('\n');
    expect(val(idx(text.split('\n').slice(0, 3).join('\n')), 'handicapIndex')).toBe('8.9'); // 10.9 - 2.0
    expect(val(idx(text), 'handicapIndex')).toBe('5.5'); // 6.5 - 1.0
    expect(val(idx(text.split('\n').slice(0, 3).join('\n')), 'adjustment')).toBe('−2.0');
  });

  it('fewer than 3 scores gives no index', () => {
    const r = idx('85, 72.5, 130\n90, 72.5, 130');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('warning');
  });

  it('Rule 5.2a table: 6 scores (lowest 2 - 1.0 = 9.5), 7 scores (lowest 2 = 10.5), 4 scores (10.0 - 1.0 = 9.0)', () => {
    expect(val(idx(lines([80, 81, 82, 83, 84, 85])), 'handicapIndex')).toBe('9.5');
    expect(val(idx(lines([80, 81, 82, 83, 84, 85, 86])), 'handicapIndex')).toBe('10.5');
    expect(val(idx(lines([80, 85, 90, 95])), 'handicapIndex')).toBe('9.0');
  });

  it('12 scores use the lowest 4 (mean 6.75 rounds half up to 6.8); 19 use the lowest 7 (8.0); 20 use the lowest 8 (8.5)', () => {
    const sc = [75, 94, 80, 88, 77, 91, 79, 85, 90, 76, 93, 82, 86, 78, 92, 81, 84, 89, 87, 83];
    expect(val(idx(lines(sc.slice(0, 12))), 'handicapIndex')).toBe('6.8');
    expect(val(idx(lines(sc.slice(0, 19))), 'handicapIndex')).toBe('8.0');
    const r = idx(lines(sc));
    expect(val(r, 'handicapIndex')).toBe('8.5');
    expect(val(r, 'roundsUsed')).toBe('Lowest 8 of 20');
  });

  it('only the 20 most recent rounds count (a 21st, very low score is ignored)', () => {
    const sc = [75, 94, 80, 88, 77, 91, 79, 85, 90, 76, 93, 82, 86, 78, 92, 81, 84, 89, 87, 83];
    expect(val(idx(lines([...sc, 50])), 'handicapIndex')).toBe('8.5');
  });

  it('rounding: lowest two of six are 7.2 and 8.1, mean 7.65 - 1.0 = 6.65 rounds half up to 6.7', () => {
    const text = ['80, 72.8, 113', '81, 72.9, 113', '95, 70, 113', '95, 70, 113', '95, 70, 113', '95, 70, 113'].join('\n');
    expect(val(idx(text), 'handicapIndex')).toBe('6.7');
    expect(val(idx(text), 'averageDifferential')).toBe('7.65');
  });

  it('PCC enters the differential: (80 - 72 - 1) x 113/120 = 6.6', () => {
    const d = JSON.parse(val(idx('80, 72, 120, 1\n82, 72, 120\n84, 72, 120'), '_differentials')!)[0].differential;
    expect(d).toBe(6.6);
  });

  it('plus handicap prints as +2.1; maximum index is 54.0', () => {
    expect(val(idx(lines([70, 70, 70, 70, 70], 72.1)), 'handicapIndex')).toBe('+2.1');
    expect(val(idx(lines([150, 150, 150, 150, 150])), 'handicapIndex')).toBe('54.0');
  });

  it('Course Handicap = index x slope/113 + (rating - par): 12.4 at 125/71.4/72 -> 13.117 -> 13; plus index -> "+2"', () => {
    const five = lines([82, 82, 82, 82, 82], 69.6); // every differential 12.4
    const r = idx(five, { courseSlope: '125', courseRating: '71.4', coursePar: '72' });
    expect(val(r, 'handicapIndex')).toBe('12.4');
    expect(val(r, 'courseHandicap')).toBe('13');
    expect(val(idx(lines([70, 70, 70, 70, 70], 72.1)), 'courseHandicap')).toBe('+2');
  });

  it('forward vs back tees (page FAQ): 90 at 74.0/140 = 12.9, at 69.5/120 = 19.3', () => {
    const d = JSON.parse(val(idx('90, 74.0, 140\n90, 69.5, 120\n90, 70, 113'), '_differentials')!).map((x: { differential: number }) => x.differential);
    expect(d.slice(0, 2)).toEqual([12.9, 19.3]);
  });

  it('slope outside 55-155 skips the line; the round-count selector limits the rounds used', () => {
    expect(idx('85, 72, 54\n85, 72, 160')).toEqual([]);
    const six = lines([80, 81, 82, 83, 84, 85]);
    expect(val(golf.calculate({ rounds: six, numRounds: '5' }), 'roundsUsed')).toBe('Lowest 1 of 5');
  });
});
