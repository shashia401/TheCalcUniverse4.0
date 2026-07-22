import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface DiffLine {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
}

interface DiffData {
  leftLines: DiffLine[];
  rightLines: DiffLine[];
}

interface DiffPanelProps {
  values: Record<string, string>;
  results: CalculatorResult[];
  onValuesChange?: (values: Record<string, string>) => void;
}

// ─── Syntax highlighting ──────────────────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Simple keyword highlighting for common languages
function highlightLine(code: string): string {
  const escaped = escapeHtml(code);
  return escaped
    .replace(/\b(function|const|let|var|if|else|for|while|return|import|export|from|class|extends|new|this|async|await|try|catch|throw|def|import|print|return|if|else|for|while|class|self|None|True|False)\b/g, '<span style="color:#8250df">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#0550ae">$1</span>')
    .replace(/"([^"]*)"/g, '<span style="color:#0a3069">"$1"</span>')
    .replace(/'([^']*)'/g, "<span style=\"color:#0a3069\">'$1'</span>")
    .replace(/(\/\/.*)$/gm, '<span style="color:#6e7781">$1</span>');
}

// ─── LCS-based diff ───────────────────────────────────────────────
function computeDiff(left: string[], right: string[]): DiffData {
  const m = left.length;
  const n = right.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = left[i - 1] === right[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const leftStack: DiffLine[] = [];
  const rightStack: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) {
      leftStack.unshift({ text: left[i - 1], type: 'unchanged' });
      rightStack.unshift({ text: right[j - 1], type: 'unchanged' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rightStack.unshift({ text: right[j - 1], type: 'added' }); j--;
    } else if (i > 0) {
      leftStack.unshift({ text: left[i - 1], type: 'removed' }); i--;
    }
  }
  return { leftLines: leftStack, rightLines: rightStack };
}

// ─── Build collapsible hunks from diff lines ──────────────────────
interface Hunk {
  leftStart: number;
  rightStart: number;
  lines: { left: DiffLine | null; right: DiffLine | null }[];
}

function buildHunks(data: DiffData): Hunk[] {
  const max = Math.max(data.leftLines.length, data.rightLines.length);
  const hunks: Hunk[] = [];
  let i = 0;
  while (i < max) {
    // Skip unchanged blocks
    while (i < max && data.leftLines[i]?.type === 'unchanged' && data.rightLines[i]?.type === 'unchanged') {
      i++;
    }
    if (i >= max) break;
    const hunk: Hunk = { leftStart: i + 1, rightStart: i + 1, lines: [] };
    let ctxBefore = 0;
    // Include up to 2 context lines before
    for (let c = Math.max(0, i - 2); c < i; c++) {
      hunk.lines.push({ left: data.leftLines[c] || null, right: data.rightLines[c] || null });
      ctxBefore++;
    }
    while (i < max) {
      const isChange = data.leftLines[i]?.type !== 'unchanged' || data.rightLines[i]?.type !== 'unchanged';
      if (!isChange) {
        // Include 2 context lines after
        for (let c = 0; c < 2 && i + c < max; c++) {
          const idx = i + c;
          hunk.lines.push({ left: data.leftLines[idx] || null, right: data.rightLines[idx] || null });
        }
        break;
      }
      hunk.lines.push({ left: data.leftLines[i] || null, right: data.rightLines[i] || null });
      i++;
    }
    hunks.push(hunk);
  }
  return hunks;
}

// ─── Diff View Component ─────────────────────────────────────────
function DiffView({ data }: { data: DiffData }) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const hunks = buildHunks(data);
  const adds = data.rightLines.filter(l => l.type === 'added').length;
  const dels = data.leftLines.filter(l => l.type === 'removed').length;

  const toggleHunk = (idx: number) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="w-full">
      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs font-semibold border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <span className="text-slate-500 dark:text-slate-400">{hunks.length} hunk{hunks.length !== 1 ? 's' : ''}</span>
        <span className="text-emerald-700 dark:text-emerald-400">+{adds} additions</span>
        <span className="text-red-600 dark:text-red-400">-{dels} deletions</span>
      </div>

      {/* Diff area */}
      <div className="flex" style={{ minHeight: '200px', maxHeight: '600px', overflow: 'auto' }}>
        {/* Left panel */}
        <div className="flex-1 min-w-0 border-r border-slate-200 dark:border-slate-700">
          {hunks.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-500">No differences found</div>
          )}
          {hunks.map((hunk, hi) => (
            <div key={hi}>
              <button
                onClick={() => toggleHunk(hi)}
                className="flex items-center w-full px-3 py-1 text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <span className={`mr-2 text-[10px] transition-transform ${collapsed.has(hi) ? '' : 'rotate-90'}`}>▶</span>
                <span>@@ -{hunk.leftStart},{hunk.lines.length} @@</span>
              </button>
              {!collapsed.has(hi) && hunk.lines.map((line, li) => {
                const leftType = line.left?.type;
                const isAdd = leftType === 'added' || (!line.left && line.right);
                const isDel = leftType === 'removed' || (line.left && !line.right);
                const bg = isAdd ? 'bg-green-50 dark:bg-green-900/20' : isDel ? 'bg-red-50 dark:bg-red-900/20' : '';
                const marker = isAdd ? '+' : isDel ? '-' : ' ';
                const content = line.left?.text ?? '';
                return (
                  <div key={li} className={`flex font-mono text-[12px] leading-[1.6] ${bg} border-b border-slate-100 dark:border-slate-800/50`}>
                    <span className="w-[50px] flex-shrink-0 text-right pr-2 text-slate-400 dark:text-slate-600 select-none py-0.5">{hunk.leftStart + li}</span>
                    <span className="w-[30px] flex-shrink-0 text-center text-slate-400 dark:text-slate-600 select-none py-0.5">{marker}</span>
                    <span className="flex-1 whitespace-pre-wrap break-all py-0.5 px-1 text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: content ? highlightLine(content) : '&nbsp;' }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0">
          {hunks.map((hunk, hi) => (
            <div key={hi}>
              <div className="flex items-center px-3 py-1 text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <span className="mr-2 text-[10px] invisible">▶</span>
                <span>@@ +{hunk.rightStart},{hunk.lines.length} @@</span>
              </div>
              {!collapsed.has(hi) && hunk.lines.map((line, li) => {
                const rightType = line.right?.type;
                const isAdd = rightType === 'added' || (!line.right && line.left);
                const isDel = rightType === 'removed' || (line.right && !line.left);
                const bg = isAdd ? 'bg-green-50 dark:bg-green-900/20' : isDel ? 'bg-red-50 dark:bg-red-900/20' : '';
                const marker = isAdd ? '+' : isDel ? '-' : ' ';
                const content = line.right?.text ?? '';
                return (
                  <div key={li} className={`flex font-mono text-[12px] leading-[1.6] ${bg} border-b border-slate-100 dark:border-slate-800/50`}>
                    <span className="w-[50px] flex-shrink-0 text-right pr-2 text-slate-400 dark:text-slate-600 select-none py-0.5">{hunk.rightStart + li}</span>
                    <span className="w-[30px] flex-shrink-0 text-center text-slate-400 dark:text-slate-600 select-none py-0.5">{marker}</span>
                    <span className="flex-1 whitespace-pre-wrap break-all py-0.5 px-1 text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: content ? highlightLine(content) : '&nbsp;' }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────
const DiffPanel: React.FC<DiffPanelProps> = ({ results, onValuesChange }) => {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [leftName, setLeftName] = useState('');
  const [rightName, setRightName] = useState('');
  const leftDropRef = useRef<HTMLDivElement>(null);
  const rightDropRef = useRef<HTMLDivElement>(null);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  const updateDiff = useCallback((left: string, right: string) => {
    const lLines = left ? left.split('\n') : [];
    const rLines = right ? right.split('\n') : [];
    if (lLines[lLines.length - 1] === '') lLines.pop();
    if (rLines[rLines.length - 1] === '') rLines.pop();
    if (left.endsWith('\n')) lLines.push('');
    if (right.endsWith('\n')) rLines.push('');
    const data = computeDiff(lLines, rLines);
    setDiffData(data);
  }, []);

  const handleLeftChange = (val: string) => {
    setLeftText(val);
    updateDiff(val, rightText);
  };

  const handleRightChange = (val: string) => {
    setRightText(val);
    updateDiff(leftText, val);
  };

  // File loading
  const loadFile = (side: 'left' | 'right') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (side === 'left') {
          setLeftName(file.name);
          handleLeftChange(content);
        } else {
          setRightName(file.name);
          handleRightChange(content);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Drag & drop
  useEffect(() => {
    const el = leftDropRef.current;
    if (!el) return;
    const onDragOver = (e: DragEvent) => { e.preventDefault(); el.classList.add('border-brand-400', 'bg-brand-50/50'); };
    const onDragLeave = () => el.classList.remove('border-brand-400', 'bg-brand-50/50');
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      el.classList.remove('border-brand-400', 'bg-brand-50/50');
      const file = e.dataTransfer?.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLeftName(file.name);
        handleLeftChange(ev.target?.result as string);
      };
      reader.readAsText(file);
    };
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    return () => { el.removeEventListener('dragover', onDragOver); el.removeEventListener('dragleave', onDragLeave); el.removeEventListener('drop', onDrop); };
  }, [leftText, rightText]);

  useEffect(() => {
    const el = rightDropRef.current;
    if (!el) return;
    const onDragOver = (e: DragEvent) => { e.preventDefault(); el.classList.add('border-brand-400', 'bg-brand-50/50'); };
    const onDragLeave = () => el.classList.remove('border-brand-400', 'bg-brand-50/50');
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      el.classList.remove('border-brand-400', 'bg-brand-50/50');
      const file = e.dataTransfer?.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRightName(file.name);
        handleRightChange(ev.target?.result as string);
      };
      reader.readAsText(file);
    };
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    return () => { el.removeEventListener('dragover', onDragOver); el.removeEventListener('dragleave', onDragLeave); el.removeEventListener('drop', onDrop); };
  }, [leftText, rightText]);

  // Extract diff from results (from the calculator flow)
  const diffResult = results.find((r) => r.id === '_diffData');
  const panelDiffData = diffResult?.value ? (() => { try { return JSON.parse(diffResult.value) as DiffData; } catch { return null; } })() : null;

  // If we have diff from the calculator input flow, use that
  const displayDiff = diffData || panelDiffData;

  return (
    <div className="w-full">
      {/* Disclaimer */}
      <div className="flex items-center gap-2 px-4 py-2 text-[11px] text-slate-500 dark:text-slate-500 bg-amber-50/50 dark:bg-amber-900/10 border-b border-slate-200 dark:border-slate-700">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Your code is processed entirely in your browser. Nothing is uploaded or stored.
      </div>

      {/* File drop zones for direct input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
        {/* Left zone */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Original</span>
            <div className="flex gap-1.5">
              <button onClick={() => loadFile('left')} className="text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium border border-slate-200 dark:border-slate-700">📁 Open File</button>
            </div>
          </div>
          <div
            ref={leftDropRef}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            onClick={() => loadFile('left')}
          >
            <textarea
              ref={leftInputRef as unknown as React.RefObject<HTMLTextAreaElement>}
              value={leftText}
              onChange={(e) => handleLeftChange(e.target.value)}
              placeholder={leftName ? `${leftName} — click or drag to replace` : 'Paste original text or click to open file...'}
              className="w-full h-40 p-3 text-[13px] font-mono bg-transparent resize-none focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
              spellCheck={false}
            />
          </div>
          {leftName && <div className="mt-1 text-[11px] text-brand-600 dark:text-brand-400 truncate px-1">📄 {leftName}</div>}
        </div>

        {/* Right zone */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Modified</span>
            <div className="flex gap-1.5">
              <button onClick={() => loadFile('right')} className="text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium border border-slate-200 dark:border-slate-700">📁 Open File</button>
            </div>
          </div>
          <div
            ref={rightDropRef}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            onClick={() => loadFile('right')}
          >
            <textarea
              ref={rightInputRef as unknown as React.RefObject<HTMLTextAreaElement>}
              value={rightText}
              onChange={(e) => handleRightChange(e.target.value)}
              placeholder={rightName ? `${rightName} — click or drag to replace` : 'Paste modified text or click to open file...'}
              className="w-full h-40 p-3 text-[13px] font-mono bg-transparent resize-none focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
              spellCheck={false}
            />
          </div>
          {rightName && <div className="mt-1 text-[11px] text-brand-600 dark:text-brand-400 truncate px-1">📄 {rightName}</div>}
        </div>
      </div>

      {/* Swap button */}
      {(leftText || rightText) && (
        <div className="flex justify-center pb-3">
          <button
            onClick={() => {
              const t = leftText; setLeftText(rightText); setRightText(t);
              const n = leftName; setLeftName(rightName); setRightName(n);
              updateDiff(rightText, leftText);
            }}
            className="text-[12px] px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium border border-slate-200 dark:border-slate-700"
          >
            ⇄ Swap Sides
          </button>
        </div>
      )}

      {/* Diff output */}
      {(leftText || rightText) && displayDiff && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          <DiffView data={displayDiff} />
        </div>
      )}

      {!leftText && !rightText && !diffResult && (
        <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-500">
          <div className="text-3xl mb-3">⇄</div>
          <p className="font-medium">Enter or load text on both sides to compare</p>
          <p className="text-xs mt-1 text-slate-400 dark:text-slate-600">Supports file upload, drag & drop, and paste</p>
        </div>
      )}
    </div>
  );
};

export default DiffPanel;
