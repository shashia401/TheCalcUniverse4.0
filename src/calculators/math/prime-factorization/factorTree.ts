import { factorize } from '../../../utils/numberTheory';

export interface TreeNode {
  value: number;
  isPrime?: boolean;
  left?: TreeNode;
  right?: TreeNode;
}

/** Sorted primes with multiplicity: 72 -> [2,2,2,3,3]. */
export function primeList(n: number): number[] {
  return factorize(n).flatMap(([p, e]) => Array<number>(e).fill(p));
}

/**
 * Factor tree built by repeatedly splitting the sorted prime list in half, so the depth is log2 of the number of
 * prime factors (at most ~6 even for 2^53) instead of one level per factor. Every node's value is the exact product
 * of the primes below it, so leaf primes always multiply back to n.
 */
export function buildFactorTree(n: number): TreeNode {
  const build = (ps: number[]): TreeNode => {
    if (ps.length === 1) return { value: ps[0], isPrime: true };
    const mid = Math.ceil(ps.length / 2);
    const left = build(ps.slice(0, mid));
    const right = build(ps.slice(mid));
    return { value: left.value * right.value, left, right };
  };
  const ps = primeList(n);
  return ps.length ? build(ps) : { value: n, isPrime: true };
}

export interface LaidOutTree {
  nodes: { value: number; isPrime: boolean; x: number; y: number }[];
  edges: { x1: number; y1: number; x2: number; y2: number }[];
  width: number;
  height: number;
}

export const TREE_X = 44; // horizontal distance between leaves
export const TREE_Y = 62; // vertical distance between levels
const PAD = 24;

/** Leaves sit one per column; a parent is centred above its children. */
export function layoutTree(root: TreeNode): LaidOutTree {
  const nodes: LaidOutTree['nodes'] = [];
  const edges: LaidOutTree['edges'] = [];
  let leaf = 0;
  let maxDepth = 0;
  const place = (node: TreeNode, depth: number): { x: number; y: number } => {
    maxDepth = Math.max(maxDepth, depth);
    const y = PAD + depth * TREE_Y;
    if (!node.left || !node.right) {
      const x = PAD + leaf++ * TREE_X;
      nodes.push({ value: node.value, isPrime: !!node.isPrime, x, y });
      return { x, y };
    }
    const l = place(node.left, depth + 1);
    const r = place(node.right, depth + 1);
    const x = (l.x + r.x) / 2;
    nodes.push({ value: node.value, isPrime: false, x, y });
    edges.push({ x1: x, y1: y, x2: l.x, y2: l.y }, { x1: x, y1: y, x2: r.x, y2: r.y });
    return { x, y };
  };
  place(root, 0);
  return { nodes, edges, width: PAD * 2 + Math.max(0, leaf - 1) * TREE_X, height: PAD * 2 + maxDepth * TREE_Y + 14 };
}
