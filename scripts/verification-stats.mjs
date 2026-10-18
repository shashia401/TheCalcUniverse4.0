// Writes src/data/verification.json: which calculators are pinned by an independent audit test, and when.
// "Audited" here means an audit test imports the calculator and asserts values taken from an outside
// source (a standard, a published table, or a separate calculation), not the calculator's own output.
//
//   node scripts/verification-stats.mjs --tests 10560
//
// --tests is the passing unit-test count from `npx vitest run` (counting tests needs a full run, so it
// is passed in rather than recomputed here).
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// registry: id -> "category/dir" (the folder under src/calculators)
const idToDir = new Map();
const regDir = join(root, 'src/calculators/registry');
for (const f of readdirSync(regDir).filter((n) => n.endsWith('.ts') && n !== 'index.ts')) {
  const text = readFileSync(join(regDir, f), 'utf8');
  for (const m of text.matchAll(/\bid:\s*'([^']+)'[\s\S]*?loader:\s*\(\)\s*=>\s*import\('\.\.\/([^']+?)(?:\/index)?'\)/g)) {
    idToDir.set(m[1], m[2]);
  }
}
const dirToIds = new Map();
for (const [id, dir] of idToDir) dirToIds.set(dir, [...(dirToIds.get(dir) ?? []), id]);

const audited = {};
const auditTests = walk(join(root, 'test')).filter((p) => /audit/i.test(basename(p)) && p.endsWith('.test.ts'));
for (const file of auditTests) {
  const text = readFileSync(file, 'utf8');
  const rel = file.slice(root.length).replace(/\\/g, '/');
  const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', rel], { cwd: root }).toString().trim();
  if (!date) continue; // not committed yet
  const dirs = new Set();
  for (const m of text.matchAll(/from\s+'(?:\.\.\/)+src\/calculators\/([^']+?)(?:\/index)?'/g)) dirs.add(m[1]);
  for (const m of text.matchAll(/import\('(?:\.\.\/)+src\/calculators\/([^']+?)(?:\/index)?'\)/g)) dirs.add(m[1]);
  for (const d of dirs) {
    for (const id of dirToIds.get(d) ?? []) {
      if (!audited[id] || date > audited[id]) audited[id] = date;
    }
  }
}

const testsArg = process.argv.indexOf('--tests');
const previous = (() => {
  try { return JSON.parse(readFileSync(join(root, 'src/data/verification.json'), 'utf8')); } catch { return {}; }
})();
const out = {
  generated: new Date().toISOString().slice(0, 10),
  tests: testsArg > -1 ? Number(process.argv[testsArg + 1]) : (previous.tests ?? 0),
  calculators: idToDir.size,
  audited: Object.fromEntries(Object.entries(audited).sort(([a], [b]) => a.localeCompare(b))),
};
writeFileSync(join(root, 'src/data/verification.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`${Object.keys(audited).length} of ${out.calculators} calculators pinned by ${auditTests.length} audit test files; tests=${out.tests}`);
