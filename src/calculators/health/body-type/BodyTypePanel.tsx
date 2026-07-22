import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const shapeData: Record<string, { label: string; emoji: string; description: string; styling: string; examples: string }> = {
  pear: {
    label: 'Pear (Triangle)',
    emoji: '🍐',
    description: 'Hips are wider than shoulders and bust. Weight gathers below the waist.',
    styling: 'Draw attention upward with lighter colors on top, darker bottoms. A-line skirts, fitted tops, and V-necks balance the silhouette.',
    examples: 'Rihanna, Beyoncé, Jennifer Lopez',
  },
  hourglass: {
    label: 'Hourglass',
    emoji: '⏳',
    description: 'Bust and hips are balanced with a well-defined, narrower waist.',
    styling: 'Wrap dresses, belted waists, fitted silhouettes, and high-waisted bottoms accentuate the natural waist definition.',
    examples: 'Scarlett Johansson, Marilyn Monroe, Sofia Vergara',
  },
  invertedTriangle: {
    label: 'Inverted Triangle',
    emoji: '🔺',
    description: 'Shoulders and bust wider than hips. Weight gathers in the upper body.',
    styling: 'Minimize shoulders with darker tops and V-necks. Add volume to the lower body with A-line skirts, wide-leg pants, and lighter colors on bottom.',
    examples: 'Naomi Campbell, Demi Moore, Angelina Jolie',
  },
  apple: {
    label: 'Apple (Round)',
    emoji: '🍎',
    description: 'Weight gathers around the midsection. Bust, waist, and hips are similar.',
    styling: 'Empire waistlines, V-necks, and flowy fabrics that skim the midsection. Darker colors on the waist area create vertical visual lines.',
    examples: 'Queen Latifah, Lizzo, Catherine Zeta-Jones',
  },
  rectangle: {
    label: 'Rectangle (Straight)',
    emoji: '▬',
    description: 'Bust, waist, and hips are similar in circumference. Athletic, balanced silhouette.',
    styling: 'Belts to create waist definition, peplum tops, layered looks, and structured blazers add curves and visual interest.',
    examples: 'Mila Kunis, Emma Watson, Kate Middleton',
  },
};

export default function BodyTypePanel({ results }: Props) {
  const shapeResult = results.find(r => r.id === 'bodyShape');
  if (!shapeResult) return null;

  const shapeKey = results.find(r => r.id === 'bodyShape')?.value.toLowerCase();
  const matched = Object.keys(shapeData).find(k => shapeKey?.includes(shapeData[k].label.split(' ')[0].toLowerCase()) || shapeData[k].label.toLowerCase().includes(shapeKey || ''));
  const data = matched ? shapeData[matched] : null;

  const [hoverShape, setHoverShape] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Body Shape Guide</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Active shape card */}
        {data && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{data.emoji}</span>
              <div>
                <p className="text-sm font-bold text-blue-800">{data.label}</p>
                <p className="text-xs text-blue-600">{data.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* All shapes reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(shapeData).map(([key, s]) => {
            const isActive = matched === key;
            const isHovered = hoverShape === key;
            return (
              <div
                key={key}
                onMouseEnter={() => setHoverShape(key)}
                onMouseLeave={() => setHoverShape(null)}
                className={`rounded-xl border p-4 cursor-pointer transition-all ${
                  isActive
                    ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200'
                    : isHovered
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{s.emoji}</span>
                  <p className={`text-xs font-bold ${isActive ? 'text-blue-700' : isHovered ? 'text-blue-600' : 'text-slate-600'}`}>{s.label}</p>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{s.examples}</p>

                {/* Hover tooltip with SVG */}
                {isHovered && (
                  <div className="mt-2 pt-2 border-t border-blue-200/60">
                    <div className="flex items-start gap-1.5">
                      <svg className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{s.description}</p>
                    </div>
                    <div className="flex items-start gap-1.5 mt-1">
                      <svg className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{s.styling}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Styling tip */}
        {data && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">Styling Tip for {data.label}</p>
            <p className="text-xs text-amber-800 leading-relaxed">{data.styling}</p>
          </div>
        )}

        {/* Somatotype Disclaimer */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">About Somatotypes (Ectomorph / Mesomorph / Endomorph)</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            The concept of classifying people into rigid somatotype categories (ectomorph, mesomorph, endomorph)
            originates from 1940s psychology and is <strong>not supported by modern exercise physiology</strong> as a
            fixed classification system. While elite athletes in different sports do tend toward certain body
            compositions, these are trainable characteristics — your body responds to nutrition and exercise.
            <strong>View somatotypes as a spectrum describing your current state, not a biological destiny.</strong>
            For fitness purposes, your goals, consistency, and progressive training matter far more than any
            body type label.
          </p>
        </div>
      </div>
    </div>
  );
}
