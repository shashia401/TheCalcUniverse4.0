// Build gate: educational SVG diagrams are first-party content rendered into
// static HTML via dangerouslySetInnerHTML (EducationalSection.tsx). This scan
// enforces that they stay pure vector markup — no scripts, event handlers, or
// external loads. Runs in CI before build.
//
// SCOPE: the SVG that ends up in a diagram's `svg:` field. That covers three
// authoring styles, all captured here:
//   1. inline           →  diagram: { svg: `<svg…>` }
//   2. local const      →  const fooSvg = `<svg…>`;  diagram: { svg: fooSvg }
//   3. separate module  →  diagrams.ts exports `{ svg: `<svg…>` }`, imported by index
// It deliberately does NOT scan `<svg>` icons inside React panel components —
// those render as escaped JSX, not via dangerouslySetInnerHTML, so they are not
// this sink's threat surface (scanning them produced false positives on legit
// onClick/href in interactive panels).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../src/calculators', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const BANNED = [
  /<script/i,
  /\son[a-z]+\s*=/i,          // onload=, onclick=, …
  /javascript:/i,
  /<foreignObject/i,
  /href\s*=\s*["'](?!#)/i,    // external href (allow internal #refs)
  /xlink:href\s*=\s*["'](?!#)/i,
  /<iframe|<embed|<object/i,
];

// Capture string/template literals that are the value of an `svg:` field OR are
// assigned to a `const/let/var …Svg` (referenced by a diagram). Covers all three
// authoring styles above; a diagram module is scanned because it contains `svg:`.
const EXTRACT =
  /(?:svg:\s*|(?:const|let|var)\s+\w*[Ss]vg\w*\s*=\s*)(?:`([^`]*)`|'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/gs;

let svgLiterals = 0;
let bad = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) {
      const src = readFileSync(p, 'utf-8');
      // Scan any file that could hold diagram SVG: has a `diagram:` reference
      // OR an `svg:` field (imported diagram modules) OR a `…Svg` const.
      if (!/\bdiagram:|\bsvg:|(?:const|let|var)\s+\w*[Ss]vg\w*\s*=/.test(src)) continue;
      const svgs = [...src.matchAll(EXTRACT)]
        .map((m) => m[1] ?? m[2] ?? m[3] ?? '')
        .filter((s) => /<svg/i.test(s)); // only actual SVG payloads
      for (const svg of svgs) {
        svgLiterals++;
        for (const rule of BANNED) {
          const m = svg.match(rule);
          if (m) {
            console.error(`UNSAFE ${p}: matches ${rule} → ${m[0].slice(0, 60)}`);
            bad++;
          }
        }
      }
    }
  }
}

walk(ROOT);
console.log(`scanned ${svgLiterals} diagram SVGs, ${bad} violations`);
process.exit(bad > 0 ? 1 : 0);
