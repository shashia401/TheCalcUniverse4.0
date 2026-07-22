import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface TreeNode {
  value: number;
  isPrime?: boolean;
  left?: TreeNode;
  right?: TreeNode;
}

function renderTree(node: TreeNode, x: number, y: number, xSpacing: number, level: number): JSX.Element | null {
  const hasChildren = node.left && node.right;
  return (
    <g key={`${x}-${y}`}>
      {/* Node circle */}
      <circle cx={x} cy={y} r="16" fill={node.isPrime ? '#dbeafe' : '#f1f5f9'} stroke={node.isPrime ? '#3b82f6' : '#94a3b8'} strokeWidth="1.5" />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold" fill={node.isPrime ? '#1d4ed8' : '#334155'}>
        {node.value}
      </text>

      {/* Branches */}
      {hasChildren && (
        <>
          <line x1={x - 8} y1={y + 12} x2={x - xSpacing / 2} y2={y + 60} stroke="#94a3b8" strokeWidth="1" />
          <line x1={x + 8} y1={y + 12} x2={x + xSpacing / 2} y2={y + 60} stroke="#94a3b8" strokeWidth="1" />
          {renderTree(node.left!, x - xSpacing / 2, y + 65, xSpacing / 1.8, level + 1)}
          {renderTree(node.right!, x + xSpacing / 2, y + 65, xSpacing / 1.8, level + 1)}
        </>
      )}

      {/* Prime indicator */}
      {node.isPrime && !hasChildren && (
        <text x={x} y={y + 30} textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="bold">prime</text>
      )}
    </g>
  );
}

export default function PrimeFactorizationPanel({ values, results }: Props) {
  const n = parseInt(values.number) || 0;
  const factorization = results.find(r => r.id === 'factorization')?.value || '';
  const treeData = results.find(r => r.id === '_treeData')?.value;

  if (!n || results.length === 0) return null;

  let tree: TreeNode[] = [];
  try {
    if (treeData) tree = JSON.parse(treeData);
  } catch { /* ignore */ }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Factor Tree</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Factor Tree SVG */}
        {tree.length > 0 && (
          <div className="flex justify-center overflow-auto">
            <svg width={280} height={200} viewBox="0 0 280 200" role="img" aria-label={'Prime factor tree diagram showing factorization of ' + n}>
              {renderTree(tree[0], 140, 25, 80, 0)}
            </svg>
          </div>
        )}

        {/* Prime factorization */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Prime Factorization</p>
          <p className="text-lg font-mono font-bold text-emerald-700">{factorization}</p>
          <p className="text-xs text-emerald-500 mt-1">{n} = {factorization}</p>
        </div>
      </div>
    </div>
  );
}
