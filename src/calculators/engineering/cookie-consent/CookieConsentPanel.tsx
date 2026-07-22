import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function CookieConsentPanel({ values, results }: Props) {
  const fullCode = results.find(r => r.id === 'fullCode');
  const position = results.find(r => r.id === 'position');
  const layout = results.find(r => r.id === 'layout');
  const colorTheme = results.find(r => r.id === 'colorTheme');

  const siteName = values.siteName || 'My Website';
  const posVal = values.position || 'bottom-banner';
  const layoutVal = values.layout || 'default';
  const themeVal = values.colorTheme || 'Light';

  const isDark = themeVal === 'Dark';
  const isCustom = themeVal === 'Custom';
  const bg = isDark ? '#1e293b' : isCustom ? '#0f172a' : '#ffffff';
  const text = isDark ? '#f1f5f9' : isCustom ? '#e2e8f0' : '#1e293b';
  const accent = isDark ? '#3b82f6' : isCustom ? '#06b6d4' : '#2563eb';
  const btnText = isDark ? '#ffffff' : isCustom ? '#0f172a' : '#ffffff';
  const border = isDark ? '#334155' : isCustom ? '#1e293b' : '#e2e8f0';
  const muted = isDark ? '#cbd5e1' : isCustom ? '#94a3b8' : '#64748b';

  const isMinimal = layoutVal === 'minimal';
  const isDev = layoutVal === 'developer';

  const handleCopy = () => {
    if (fullCode?.value) navigator.clipboard.writeText(fullCode.value);
  };

  const renderPreview = () => {
    const containerStyle: React.CSSProperties = {
      background: bg,
      color: text,
      padding: isMinimal ? '12px 16px' : '20px 24px',
      borderRadius: posVal === 'bottom-banner' ? '0' : '12px',
      border: `1px solid ${border}`,
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: '14px',
      lineHeight: 1.5,
      width: '100%',
    };

    if (isMinimal) {
      return (
        <div style={containerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, color: text, fontSize: '13px' }}>This site uses cookies to improve your experience.</p>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <span style={{ background: 'transparent', color: text, border: `1px solid ${border}`, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Decline</span>
              <span style={{ background: accent, color: btnText, border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Accept</span>
            </div>
          </div>
        </div>
      );
    }

    if (isDev) {
      return (
        <div style={containerStyle}>
          <p style={{ margin: '0 0 12px 0', fontWeight: 600, color: text, fontSize: '14px' }}>🍪 Cookie Notice — {siteName}</p>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: muted }}>We use cookies and similar technologies. By continuing, you agree to our <span style={{ color: accent, textDecoration: 'underline' }}>Cookie Policy</span>.</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: 'transparent', color: text, border: `1px solid ${border}`, padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cookie Settings</span>
            <span style={{ background: accent, color: btnText, border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Accept All</span>
            <span style={{ background: 'transparent', color: muted, border: `1px solid ${border}`, padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Decline</span>
          </div>
        </div>
      );
    }

    // Default layout
    return (
      <div style={{ ...containerStyle, textAlign: posVal === 'center-modal' ? 'center' : 'left' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🍪</div>
        <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '16px', color: text }}>Cookies & Privacy</p>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: muted }}>
          {siteName} uses cookies to enhance your browsing experience, serve personalized content, and analyze traffic.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: posVal === 'center-modal' ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
          <span style={{ background: 'transparent', color: text, border: `1px solid ${border}`, padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Customize</span>
          <span style={{ background: accent, color: btnText, border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Accept All</span>
        </div>
        <div style={{ marginTop: '12px', fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8' }}>
          <span style={{ color: accent, textDecoration: 'none' }}>Privacy Policy</span>
          <span style={{ margin: '0 6px' }}>&middot;</span>
          <span style={{ color: accent, textDecoration: 'none' }}>Cookie Policy</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Live Cookie Banner Preview</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Live Preview */}
        <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
            <svg aria-hidden="true" className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold text-slate-500">Browser Preview</span>
            <div className="ml-auto flex gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          </div>
          <div className="relative" style={{ minHeight: posVal === 'bottom-banner' ? '120px' : '280px', background: '#f8fafc' }}>
            {/* Simulated page content */}
            <div className="p-4">
              <div className="h-3 w-32 rounded bg-slate-200 mb-3" />
              <div className="h-2 w-full rounded bg-slate-100 mb-2" />
              <div className="h-2 w-3/4 rounded bg-slate-100 mb-2" />
              <div className="h-2 w-5/6 rounded bg-slate-100" />
            </div>
            {/* Banner overlay */}
            <div style={{
              position: 'absolute',
              ...(posVal === 'center-modal' ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px' } as const :
                 posVal === 'corner-widget' ? { bottom: '10px', right: '10px', width: '90%', maxWidth: '320px' } as const :
                 { bottom: 0, left: 0, right: 0 } as const)
            }}>
              {renderPreview()}
            </div>
          </div>
        </div>

        {/* Code Display */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Generated Code</p>
            <button type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
          <div className="max-h-40 overflow-auto p-4">
            <pre className="text-[10px] font-mono text-slate-600 whitespace-pre-wrap break-all select-all">
              {fullCode?.value?.substring(0, 500) || 'Configure your banner above to generate code...'}
              {(fullCode?.value?.length || 0) > 500 ? '\n... (truncated)' : ''}
            </pre>
          </div>
        </div>

        {/* Settings Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Position</p>
            <p className="text-xs font-bold text-slate-700">{position?.value || '-'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Layout</p>
            <p className="text-xs font-bold text-slate-700">{layout?.value || '-'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Theme</p>
            <p className="text-xs font-bold text-slate-700">{colorTheme?.value || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
