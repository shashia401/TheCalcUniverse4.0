import React, { useState, useMemo, useRef, useCallback } from 'react';
import { calculate } from './index';

const Base64Panel: React.FC<{
  values?: Record<string, unknown>;
  results?: Array<{ label: string; value: string }>;
}> = () => {
  const [inputType, setInputType] = useState('Text');
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('Encode');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const isError =
    outputText === '[Invalid Base64]' || outputText === '';

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isBinary = !file.type.startsWith('text/') && file.type !== '';
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
    };
    if (isBinary) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  }, []);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="base64-calculator" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>
            Input Type
          </label>
          <select
            value={inputType}
            onChange={(e) => {
              setInputType(e.target.value);
              setInputText('');
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'var(--bg-default, #fff)',
            }}
          >
            <option value="Text">Text</option>
            <option value="File">File</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>
            Mode
          </label>
          <select
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
      </div>

      {/* Input Section */}
      {inputType === 'Text' ? (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>
            {mode === 'Encode' ? 'Text to Encode' : 'Base64 to Decode'}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            placeholder={
              mode === 'Encode'
                ? 'Enter text to encode to Base64...'
                : 'Enter Base64 string to decode...'
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
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>
            Select File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            style={{
              display: 'block',
              padding: '8px 0',
              fontSize: '14px',
            }}
          />
          {inputText && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#6b7280',
                maxHeight: '100px',
                overflow: 'auto',
                wordBreak: 'break-all',
              }}
            >
              <strong>File content:</strong> {inputText.length} characters loaded
            </div>
          )}
        </div>
      )}

      {/* SVG: Encoding/Decoding Process Visualization */}
      {inputText && (
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
            viewBox="0 0 500 80"
            style={{ width: '100%', maxWidth: '500px', display: 'block', margin: '0 auto' }}
            role="img"
            aria-label="Base64 encoding and decoding flow diagram showing input, character conversion, and output process"
          >
            {/* Input box */}
            <rect x="10" y="15" width="130" height="50" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="75" y="35" textAnchor="middle" fill="#1e40af" fontSize="11" fontWeight="bold">
              {mode === 'Encode' ? 'Plain Text' : 'Base64 Input'}
            </text>
            <text x="75" y="50" textAnchor="middle" fill="#6b7280" fontSize="10">
              {inputText.length} chars
            </text>

            {/* Arrow */}
            <line x1="145" y1="40" x2="195" y2="40" stroke="#93c5fd" strokeWidth="2" />
            <polygon points="190,34 200,40 190,46" fill="#93c5fd" />

            {/* Process box */}
            <rect x="200" y="10" width="100" height="60" rx="10" fill={mode === 'Encode' ? '#dcfce7' : '#fef3c7'} stroke={mode === 'Encode' ? '#22c55e' : '#f59e0b'} strokeWidth="1.5" />
            <text x="250" y="32" textAnchor="middle" fill={mode === 'Encode' ? '#15803d' : '#92400e'} fontSize="11" fontWeight="bold">
              {mode === 'Encode' ? 'BASE64' : 'BASE64'}
            </text>
            <text x="250" y="48" textAnchor="middle" fill={mode === 'Encode' ? '#15803d' : '#92400e'} fontSize="10" fontWeight="bold">
              {mode === 'Encode' ? 'ENCODE' : 'DECODE'}
            </text>
            <text x="250" y="62" textAnchor="middle" fill="#6b7280" fontSize="9">
              64-char alphabet
            </text>

            {/* Arrow 2 */}
            <line x1="305" y1="40" x2="355" y2="40" stroke="#93c5fd" strokeWidth="2" />
            <polygon points="350,34 360,40 350,46" fill="#93c5fd" />

            {/* Output box */}
            <rect x="360" y="15" width="130" height="50" rx="8" fill={!isError ? '#dcfce7' : '#fce7f3'} stroke={!isError ? '#22c55e' : '#ef4444'} strokeWidth="1.5" />
            <text x="425" y="35" textAnchor="middle" fill={!isError ? '#15803d' : '#be123c'} fontSize="11" fontWeight="bold">
              {mode === 'Encode' ? 'Base64 Output' : 'Decoded Text'}
            </text>
            <text x="425" y="50" textAnchor="middle" fill="#6b7280" fontSize="10">
              {isError ? 'Error' : `${resultChars || '?'} chars`}
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
              {mode === 'Encode' ? 'Base64 Encoded' : 'Decoded Text'}
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
                <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
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
              {mode === 'Encode' && (
                <span>Encoded: <strong>{resultChars}</strong> chars (+{Number(resultChars) - Number(originalChars)})</span>
              )}
              {mode === 'Decode' && (
                <span>Decoded: <strong>{resultChars}</strong> chars</span>
              )}
            </div>
          )}

          {/* Invalid warning */}
          {outputText === '[Invalid Base64]' && (
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
              The input string is not valid Base64. Check for correct padding and characters.
            </div>
          )}
        </div>
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
            ? 'Enter text above to encode to Base64'
            : 'Enter Base64 text above to decode'}
        </div>
      )}
    </div>
  );
};

export default Base64Panel;
