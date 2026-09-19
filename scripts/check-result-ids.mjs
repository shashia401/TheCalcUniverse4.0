// Build gate: catches the "panel looks up a result id that calculate() never
// emits" bug class — the exact defect behind 4 real dead-panel bugs found in
// review (golf-handicap, gpa, molarity, molecular-weight), where an entire
// panel section silently never rendered because of a typo'd or mismatched
// `_` prefix between calculate()'s emitted id and the panel's lookup.
//
// Per calculator directory: collect every result id calculate() emits (in
// index.ts/index.tsx) and every result id any sibling *.tsx file looks up
// (getValue/getResult/findResult/`.id === '…'`). Flag any looked-up id with
// no matching emitted id in the same directory. Static-string-literal only —
// dynamically constructed ids are invisible to this check by design (no
// false positives from that), so this narrows the bug class, it doesn't
// eliminate it.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../src/calculators', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

// A result object literal: has `id:` and, within a short window, `value:`.
// (Distinguishes CalculatorResult from InputField, which has `id:` but no `value:`.)
// Window allows any character (not just non-brace) since label/value template
// literals routinely contain `${…}` interpolation braces.
const EMIT_RE = /\{\s*id:\s*['"]([^'"]+)['"][\s\S]{0,300}?value:/g;

const LOOKUP_RE =
  /(?:getValue|getResult|findResult)\(\s*results\s*,\s*['"]([^'"]+)['"]\s*\)|\.id\s*===\s*['"]([^'"]+)['"]/g;

function collectIds(src, re) {
  const ids = new Set();
  for (const m of src.matchAll(re)) ids.add(m[1]);
  return ids;
}

let dirsScanned = 0;
let violations = 0;

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && /\.tsx?$/.test(e.name)).map((e) => e.name);
  const calcFile = files.find((f) => /^index\.tsx?$/.test(f));
  const panelFiles = files.filter((f) => f !== calcFile);

  if (calcFile && panelFiles.length > 0) {
    dirsScanned++;
    const calcSrc = readFileSync(join(dir, calcFile), 'utf-8');
    const emitted = collectIds(calcSrc, EMIT_RE);

    for (const panelFile of panelFiles) {
      const panelSrc = readFileSync(join(dir, panelFile), 'utf-8');
      if (!/getValue|getResult|findResult|\.id\s*===/.test(panelSrc)) continue;
      const looked = new Set();
      for (const m of panelSrc.matchAll(LOOKUP_RE)) looked.add(m[1] ?? m[2]);

      for (const id of looked) {
        if (!emitted.has(id)) {
          console.error(`DEAD LOOKUP ${join(dir, panelFile)}: looks up '${id}', not emitted by ${calcFile}`);
          violations++;
        }
      }
    }
  }

  for (const e of entries) {
    if (e.isDirectory()) walk(join(dir, e.name));
  }
}

walk(ROOT);
console.log(`scanned ${dirsScanned} calculator directories, ${violations} dead lookups`);
process.exit(violations > 0 ? 1 : 0);
