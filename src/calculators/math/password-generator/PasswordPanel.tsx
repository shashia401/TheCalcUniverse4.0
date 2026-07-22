import { useState, useCallback } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getStrengthColor(strength: string): { bg: string; bar: string; text: string; label: string } {
  switch (strength) {
    case 'Weak':
      return { bg: 'bg-red-100', bar: 'bg-red-500', text: 'text-red-700', label: 'Weak — easily cracked' };
    case 'Fair':
      return { bg: 'bg-orange-100', bar: 'bg-orange-500', text: 'text-orange-700', label: 'Fair — better, but still vulnerable' };
    case 'Good':
      return { bg: 'bg-yellow-100', bar: 'bg-yellow-500', text: 'text-yellow-700', label: 'Good — adequate for most purposes' };
    case 'Strong':
      return { bg: 'bg-lime-100', bar: 'bg-lime-500', text: 'text-lime-700', label: 'Strong — resistant to brute-force' };
    case 'Very Strong':
      return { bg: 'bg-emerald-100', bar: 'bg-emerald-500', text: 'text-emerald-700', label: 'Very Strong — excellent security' };
    default:
      return { bg: 'bg-slate-100', bar: 'bg-slate-500', text: 'text-slate-700', label: strength };
  }
}

function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

export default function PasswordPanel({ results }: Props) {
  const password = results.find(r => r.id === 'password');
  const entropy = results.find(r => r.id === 'entropy');
  const strength = results.find(r => r.id === 'strength');
  const crackTime = results.find(r => r.id === 'crackTime');
  const charset = results.find(r => r.id === 'charset');
  const length = results.find(r => r.id === 'length');

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!password) return;
    copyToClipboard(password.value).then(success => {
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  }, [password]);

  if (!password) return null;

  const strengthInfo = strength ? getStrengthColor(strength.value) : null;
  const entropyValue = entropy ? parseFloat(entropy.value) : 0;

  // Strength meter: scale 0-150+ bits
  const meterPercent = Math.min(100, (entropyValue / 150) * 100);

  // Security tips
  const tips = [
    { label: 'Length', good: parseInt(length?.value || '0') >= 12, text: '12+ characters recommended' },
    { label: 'Entropy', good: entropyValue >= 80, text: '80+ bits for strong security' },
    { label: 'Mix', good: hasStrongMix(results), text: 'Use uppercase, lowercase, numbers, and symbols' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Generated Password
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* ── Password Display ─────────────────────────────────────────── */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-lg md:text-xl font-mono font-bold text-indigo-900 break-all select-all leading-relaxed">
                {password.value}
              </p>
            </div>
            <button type="button"
              onClick={handleCopy}
              className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                copied
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 active:scale-95'
              }`}
              title="Copy to clipboard"
            >
              <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* ── Strength Meter ───────────────────────────────────────────── */}
        {strengthInfo && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Strength
              </span>
              <span className={`text-xs font-bold ${strengthInfo.text}`}>
                {strength?.value} — {entropy?.value}
              </span>
            </div>
            <div className={`h-2.5 rounded-full ${strengthInfo.bg} overflow-hidden`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${strengthInfo.bar}`}
                style={{ width: `${meterPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{strengthInfo.label}</p>
          </div>
        )}

        {/* ── Time to Crack ────────────────────────────────────────────── */}
        {crackTime && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Time to Crack (Brute Force @ 1B guess/sec)
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">
              {crackTime.value}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Estimated time for an attacker to try every possible combination
            </p>
          </div>
        )}

        {/* ── Character Set Summary ────────────────────────────────────── */}
        {(charset || length) && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Password Composition
            </p>
            <div className="flex flex-wrap gap-2">
              {length && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {length.value} chars
                </span>
              )}
              {charset && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                  <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  {charset.value} character set
                </span>
              )}
              <CharacterChips results={results} />
            </div>
          </div>
        )}

        {/* ── Security Audit Tips ──────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Security Audit Tips
          </p>
          <ul className="space-y-1.5">
            {tips.map((tip) => (
              <li key={tip.label} className="flex items-start gap-2 text-xs">
                {tip.good ? (
                  <svg aria-hidden="true" className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                <span className={tip.good ? 'text-slate-600' : 'text-amber-700'}>{tip.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: Character set chip indicators ───────────────────────

function CharacterChips({ results }: { results: CalculatorResult[] }) {
  const password = results.find(r => r.id === 'password');
  const pw = password?.value || '';

  const items = [
    { label: 'A-Z', enabled: /[A-Z]/.test(pw), color: 'bg-blue-100 text-blue-700' },
    { label: 'a-z', enabled: /[a-z]/.test(pw), color: 'bg-green-100 text-green-700' },
    { label: '0-9', enabled: /[0-9]/.test(pw), color: 'bg-purple-100 text-purple-700' },
    { label: '!@#$%', enabled: /[^a-zA-Z0-9]/.test(pw), color: 'bg-rose-100 text-rose-700' },
  ];

  return (
    <>
      {items.filter(item => item.enabled).map((item) => (
        <span
          key={item.label}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.color}`}
        >
          {item.label}
        </span>
      ))}
    </>
  );
}

function hasStrongMix(results: CalculatorResult[]): boolean {
  // Check if the charset size suggests a good mix
  const charset = results.find(r => r.id === 'charset');
  if (!charset) return false;
  const size = parseInt(charset.value);
  return size >= 60; // Mix of at least 3 types roughly
}
