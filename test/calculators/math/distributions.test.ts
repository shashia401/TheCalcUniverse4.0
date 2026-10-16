import { describe, it, expect } from 'vitest';
import { normSf, normCdf, normQuantile, tTwoTail, tSf, tCdf, tCritical, chiSqSf, chiSqCdf, fSf, fCdf, chiSqCritical, fCritical } from '../../../src/utils/distributions';

// Every reference value below was produced independently with scipy 1.17.1 (scipy.stats norm/t/chi2/f: sf, isf, ppf).
const rel = (actual: number, expected: number, tol = 1e-10) =>
  expect(Math.abs(actual - expected) / Math.max(Math.abs(expected), 1e-300)).toBeLessThan(tol);

describe('distributions vs scipy', () => {
  it('normSf (including deep tail)', () => {
    const ref: [number, number][] = [[0, 0.5], [0.5, 0.3085375387259869], [1, 0.15865525393145707], [1.96, 0.024997895148220435],
      [3, 0.001349898031630093], [5, 2.8665157187919333e-07], [8, 6.22096057427174e-16], [10, 7.61985302416047e-24], [-1, 0.8413447460685429], [-3.5, 0.9997673709209645]];
    for (const [z, p] of ref) rel(normSf(z), p);
    rel(normCdf(-5), 2.8665157187919333e-07);
  });
  it('normQuantile', () => {
    const ref: [number, number][] = [[0.975, 1.959963984540054], [0.95, 1.6448536269514722], [0.995, 2.5758293035489004], [0.9, 1.2815515655446004],
      [0.8, 0.8416212335729143], [0.99, 2.3263478740408408], [0.001, -3.090232306167813], [1e-10, -6.361340902404056], [0.9999, 3.719016485455709]];
    for (const [p, z] of ref) rel(normQuantile(p), z, 1e-12);
    expect(normQuantile(0.5)).toBe(0);
  });
  it('t two-tail and one-tail', () => {
    const ref: [number, number, number][] = [[2.13, 30, 0.04148887216619861], [0.5, 1, 0.7048327646991335], [1, 2, 0.42264973081037416],
      [2.5, 5, 0.05449009934237624], [1.96, 1000, 0.050273184955748736], [3.2, 10, 0.009491695795303836], [10, 3, 0.0021283990584141494],
      [0.1, 200, 0.920444492504321], [5.5, 15, 6.105377183135843e-05], [2.0, 101, 0.0481852112073907], [-2.2, 7, 0.06373101530263678]];
    for (const [t, df, p] of ref) rel(tTwoTail(t, df), p);
    rel(tSf(2.13, 30), 0.020744436083099307);
    rel(tSf(-1.5, 8), 0.9139983540240444);
    rel(tSf(0.3, 4), 0.3895607141387299);
    rel(tSf(4, 60), 8.816119353198712e-05);
    rel(tCdf(-4, 60), 8.816119353198712e-05);
  });
  it('t critical values', () => {
    const ref: [number, number, number][] = [[0.05, 1, 12.706204736174705], [0.05, 2, 4.302652729749464], [0.05, 5, 2.5705818356363155],
      [0.05, 10, 2.2281388519862753], [0.05, 29, 2.0452296421327043], [0.05, 99, 1.9842169515864179], [0.01, 10, 3.1692726726169504],
      [0.1, 20, 1.7247182429207872], [0.05, 1000, 1.9623390808264085]];
    for (const [a, df, c] of ref) rel(tCritical(a, df), c, 1e-11);
  });
  it('chi-square upper tail', () => {
    const ref: [number, number, number][] = [[3.84, 1, 0.05004352124870519], [5.99, 2, 0.05003662708658629], [10, 5, 0.07523524614651217],
      [20, 10, 0.029252688076961124], [100, 50, 3.4549313829848716e-05], [0.5, 3, 0.9188914116546758], [30, 2, 3.0590232050182594e-07],
      [7.8, 3, 0.050331097859853326], [1, 1, 0.31731050786291115]];
    for (const [x, k, p] of ref) rel(chiSqSf(x, k), p);
    rel(chiSqCdf(1, 1), 1 - 0.31731050786291115);
  });
  it('F upper tail', () => {
    const ref: [number, number, number, number][] = [[4.0, 2, 10, 0.05292214940134466], [3.5, 5, 20, 0.019583556387980403], [1.2, 10, 10, 0.38936269812272073],
      [10, 1, 30, 0.003568523308817683], [2.2, 7, 100, 0.04040415498641125], [0.5, 4, 4, 0.7407407407407407]];
    for (const [x, a, b, p] of ref) rel(fSf(x, a, b), p);
    rel(fCdf(4, 2, 10), 1 - 0.05292214940134466);
  });
  it('chi-square and F critical values (scipy chi2.isf / f.isf)', () => {
    const chi: [number, number, number][] = [[0.05, 1, 3.8414588206941285], [0.05, 5, 11.070497693516355], [0.01, 10, 23.20925115895436],
      [0.975, 10, 3.246972780236842], [0.025, 10, 20.48317735080739], [0.05, 30, 43.77297182574217]];
    for (const [a, k, c] of chi) rel(chiSqCritical(a, k), c, 1e-11);
    const f: [number, number, number, number][] = [[0.05, 2, 10, 4.1028210151304], [0.05, 5, 20, 2.7108898372096903], [0.01, 3, 30, 4.509739562459062],
      [0.025, 10, 10, 3.716791864597364], [0.975, 10, 10, 0.26904923289491994]];
    for (const [a, d1, d2, c] of f) rel(fCritical(a, d1, d2), c, 1e-11);
  });
  it('degenerate inputs give NaN or boundary values, never throw', () => {
    expect(Number.isNaN(tTwoTail(1, 0))).toBe(true);
    expect(Number.isNaN(normSf(NaN))).toBe(true);
    expect(fSf(0, 3, 3)).toBe(1);
    expect(chiSqSf(0, 3)).toBe(1);
    expect(tTwoTail(0, 5)).toBe(1);
  });
});
