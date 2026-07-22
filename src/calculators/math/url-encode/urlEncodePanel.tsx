import React, { useState, useMemo, useCallback } from 'react';
import { calculate } from './index';

const SPECIAL_CHAR_MAP: Array<{ char: string; encoded: string; desc: string }> = [
  { char: ' ', encoded: '%20', desc: 'space' },
  { char: '!', encoded: '%21', desc: 'exclamation' },
  { char: '"', encoded: '%22', desc: 'double quote' },
  { char: '#', encoded: '%23', desc: 'hash' },
  { char: '$', encoded: '%24', desc: 'dollar' },
  { char: '%', encoded: '%25', desc: 'percent' },
  { char: '&', encoded: '%26', desc: 'ampersand' },
  { char: "'", encoded: '%27', desc: 'apostrophe' },
  { char: '(', encoded: '%28', desc: 'left paren' },
  { char: ')', encoded: '%29', desc: 'right paren' },
  { char: '*', encoded: '%2A', desc: 'asterisk' },
  { char: '+', encoded: '%2B', desc: 'plus' },
  { char: ',', encoded: '%2C', desc: 'comma' },
  { char: '/', encoded: '%2F', desc: 'slash' },
  { char: ':', encoded: '%3A', desc: 'colon' },
  { char: ';', encoded: '%3B', desc: 'semicolon' },
  { char: '<', encoded: '%3C', desc: 'less than' },
  { char: '=', encoded: '%3D', desc: 'equals' },
  { char: '>', encoded: '%3E', desc: 'greater than' },
  { char: '?', encoded: '%3F', desc: 'question mark' },
  { char: '@', encoded: '%40', desc: 'at sign' },
  { char: '[', encoded: '%5B', desc: 'left bracket' },
  { char: '\\', encoded: '%5C', desc: 'backslash' },
  { char: ']', encoded: '%5D', desc: 'right bracket' },
  { char: '^', encoded: '%5E', desc: 'caret' },
  { char: '{', encoded: '%7B', desc: 'left brace' },
  { char: '|', encoded: '%7C', desc: 'pipe' },
  { char: '}', encoded: '%7D', desc: 'right brace' },
  { char: '~', encoded: '%7E', desc: 'tilde' },
];

const UrlEncodePanel: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('Encode');
  const [copied, setCopied] = useState(false);

  const results = useMemo(
    () => calculate({ inputText, mode }),
    [inputText, mode]
  );

  const getResult = (label: string): string => {
    const r = results.find((res) => res.label === label);
    return r ? r.value : '';
  };

  const outputText = getResult('Output');
  const originalChars = getResult('Original Character Count');
  const resultChars = getResult('Encoded Character Count') || getResult('Decoded Character Count');
  const isError = outputText === '[Invalid URL Encoding]';

  const handleCopy = useCallback(async () => {
    if (!outputText || isError) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [outputText, isError]);

  const handleClear = useCallback(() => {
    setInputText('');
  }, []);

  // Find matched special characters in the input text (for Encode mode)
  const matchedChars = useMemo(() => {
    if (mode !== 'Encode' || !inputText) return [];
    const chars = new Set(inputText);
    return SPECIAL_CHAR_MAP.filter((entry) => chars.has(entry.char));
  }, [inputText, mode]);

  return (
    <div className="url-encode-calculator" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Controls */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="url-mode" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>
          Mode
        </label>
        <select
          id="url-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            background: 'var(--bg-default, #fff)',
          }}
        >
          <option value="Encode">Encode</option>
          <option value="Decode">Decode</option>
        </select>
      </div>

      {/* Input Textarea */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="url-input" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>
          {mode === 'Encode' ? 'Text to URL-Encode' : 'URL-Encoded String to Decode'}
        </label>
        <textarea
          id="url-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          placeholder={
            mode === 'Encode'
              ? 'Enter text containing special characters to encode...'
              : 'Enter %-encoded URL string to decode...'
          }
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'monospace',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          <span>{inputText.length} character{inputText.length !== 1 ? 's' : ''}</span>
          {inputText && (
            <button type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* SVG: Encoding Process Visualization */}
      {inputText && mode === 'Encode' && (
        <div
          style={{
            marginBottom: '16px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <svg
            viewBox="0 0 500 60"
            style={{ width: '100%', maxWidth: '500px', display: 'block', margin: '0 auto' }}
            role="img"
            aria-label="URL encoding and decoding flow diagram showing input text conversion to encoded format"
          >
            {/* Input box */}
            <rect x="10" y="10" width="120" height="40" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="70" y="35" textAnchor="middle" fill="#1e40af" fontSize="12" fontWeight="bold">
              Plain Text
            </text>

            {/* Arrow */}
            <line x1="135" y1="30" x2="175" y2="30" stroke="#93c5fd" strokeWidth="2" />
            <polygon points="170,24 180,30 170,36" fill="#93c5fd" />

            {/* Encode box */}
            <rect x="180" y="5" width="105" height="50" rx="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
            <text x="232" y="28" textAnchor="middle" fill="#15803d" fontSize="11" fontWeight="bold">
              URL ENCODE
            </text>
            <text x="232" y="44" textAnchor="middle" fill="#6b7280" fontSize="9">
              percent-encoding
            </text>

            {/* Arrow 2 */}
            <line x1="290" y1="30" x2="330" y2="30" stroke="#93c5fd" strokeWidth="2" />
            <polygon points="325,24 335,30 325,36" fill="#93c5fd" />

            {/* Output box */}
            <rect x="335" y="10" width="120" height="40" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
            <text x="395" y="35" textAnchor="middle" fill="#15803d" fontSize="12" fontWeight="bold">
              %20 %26 %23 ...
            </text>
          </svg>
        </div>
      )}

      {/* Results Output */}
      {inputText && results.length > 0 && (
        <div
          style={{
            padding: '16px',
            background: 'var(--bg-default, #fff)',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
              {mode === 'Encode' ? 'URL-Encoded Output' : 'Decoded Output'}
            </span>
            {!isError && (
              <button type="button"
                onClick={handleCopy}
                style={{
                  padding: '4px 12px',
                  background: copied ? '#dcfce7' : '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: copied ? '#15803d' : '#374151',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div
            style={{
              padding: '12px',
              background: isError ? '#fef2f2' : '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              color: isError ? '#dc2626' : '#111827',
              lineHeight: 1.6,
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            {outputText || ' '}
          </div>

          {/* Character Counts */}
          {!isError && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginTop: '8px',
                fontSize: '12px',
                color: '#6b7280',
              }}
            >
              <span>Original: <strong>{originalChars}</strong> chars</span>
              {mode === 'Encode' && resultChars && (
                <span>Encoded: <strong>{resultChars}</strong> chars (+{Number(resultChars) - Number(originalChars)})</span>
              )}
              {mode === 'Decode' && resultChars && (
                <span>Decoded: <strong>{resultChars}</strong> chars</span>
              )}
            </div>
          )}

          {isError && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: '#fef2f2',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#dc2626',
              }}
            >
              The input string is not valid URL-encoded data. Check for invalid percent sequences like %GG or truncated % codes.
            </div>
          )}
        </div>
      )}

      {/* Visual Character Mapping (Encode Mode) */}
      {mode === 'Encode' && matchedChars.length > 0 && (
        <div
          style={{
            padding: '16px',
            background: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd',
            marginBottom: '16px',
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#0369a1' }}>
            Character Encoding Map
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '8px',
            }}
          >
            {matchedChars.map((entry) => (
              <div
                key={entry.char}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  background: 'var(--bg-default, #fff)',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    background: '#dbeafe',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#1d4ed8',
                    fontFamily: 'monospace',
                  }}
                >
                  {entry.char === ' ' ? '␣' : entry.char}
                </span>
                <span style={{ color: '#6b7280', fontSize: '12px' }}>&rarr;</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: '#059669',
                    fontSize: '13px',
                  }}
                >
                  {entry.encoded}
                </span>
                <span style={{ color: '#9ca3af', fontSize: '11px', marginLeft: 'auto' }}>
                  {entry.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Reference Table */}
      {mode === 'Encode' && inputText && (
        <details style={{ marginBottom: '16px' }}>
          <summary
            style={{
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: '#6b7280',
              padding: '8px 0',
            }}
          >
            Full URL Encoding Reference Table
          </summary>
          <div
            style={{
              marginTop: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '6px',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            {SPECIAL_CHAR_MAP.map((entry) => (
              <div
                key={entry.char}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                <span style={{ color: '#374151', fontWeight: 600, width: '16px', textAlign: 'center' }}>
                  {entry.char === ' ' ? '␣' : entry.char}
                </span>
                <span style={{ color: '#9ca3af' }}>&rarr;</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>{entry.encoded}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {!inputText && (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '14px',
            background: '#f9fafb',
            borderRadius: '8px',
          }}
        >
          {mode === 'Encode'
            ? 'Enter text to URL-encode special characters'
            : 'Enter a URL-encoded string to decode'}
        </div>
      )}
    </div>
  );
};

export default UrlEncodePanel;
