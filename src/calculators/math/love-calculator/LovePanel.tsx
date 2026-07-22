import React from 'react';
import type { CalculatorResult } from '../../../types/calculator';
import { Heart, Sparkles, RefreshCw, Share2, Star } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getVal(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

/* ------------------------------------------------------------------ */
/*  Score ring (SVG)                                                   */
/* ------------------------------------------------------------------ */

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const strokeW = 10;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" className="transform -rotate-90" role="img" aria-label={'Love compatibility score gauge showing ' + score + ' percent'}>
        {/* Background ring */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeW}
        />
        {/* Score ring */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Heart
          size={28}
          style={{ color }}
          fill={color}
          className="mb-0.5"
        />
        <span
          className="text-3xl font-black leading-none"
          style={{ color }}
        >
          {score}%
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Share button (client-only copy)                                    */
/* ------------------------------------------------------------------ */

function ShareButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  return (
    <button type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200"
      style={{
        backgroundColor: copied ? '#10b981' : '#f1f5f9',
        color: copied ? '#ffffff' : '#475569',
      }}
    >
      {copied ? (
        <>Copied!</>
      ) : (
        <>
          <Share2 size={14} />
          Share Result
        </>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Zodiac card                                                        */
/* ------------------------------------------------------------------ */

function ZodiacCard({ hint }: { hint: string }) {
  return (
    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 shadow-sm shadow-purple-200/40">
      <div className="flex items-center gap-2 mb-2">
        <Star size={14} className="text-purple-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">
          Zodiac Insight
        </span>
      </div>
      <p className="text-sm text-purple-800 leading-relaxed">{hint}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                         */
/* ------------------------------------------------------------------ */

export default function LovePanel({ results }: Props) {
  const scoreRaw = getVal(results, 'loveScore');
  const compatText = getVal(results, 'compatibility');
  const flavorText = getVal(results, 'flavorText');
  const zodiacHint = getVal(results, 'zodiacHint');
  const scoreColor = getVal(results, '_scoreColor');
  const shareText = getVal(results, 'shareText');

  if (!scoreRaw) return null;

  const score = parseInt(scoreRaw, 10) || 0;
  const color = scoreColor || '#e91e63';

  return (
    <div className="space-y-6">
      {/* Score Display Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-pink-50 to-rose-50">
          <Heart size={18} className="text-pink-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-pink-600">
            Love Score
          </span>
        </div>
        <div className="p-6 flex flex-col items-center">
          {/* Score ring */}
          <ScoreRing score={score} color={color} />

          {/* Compatibility label */}
          <div className="mt-4 text-center">
            <span
              className="inline-block text-lg font-bold px-5 py-1.5 rounded-full"
              style={{
                backgroundColor: `${color}15`,
                color,
                border: `2px solid ${color}30`,
              }}
            >
              {compatText}
            </span>
          </div>
        </div>
      </div>

      {/* Zodiac Insight */}
      {zodiacHint && (
        <ZodiacCard hint={zodiacHint} />
      )}

      {/* Flavor Text / Verdict */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-gray-50">
          <Sparkles size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Verdict</span>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-700 leading-relaxed text-center italic">
            &ldquo;{flavorText}&rdquo;
          </p>
        </div>
      </div>

      {/* Share + Try Again Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="p-5 flex flex-col items-center gap-3">
          {shareText && <ShareButton text={shareText} />}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <RefreshCw size={12} />
            <span>Try again with different names!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
