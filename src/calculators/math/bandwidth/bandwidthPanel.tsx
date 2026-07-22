import React, { useState, useMemo } from 'react';
import { calculate, formatTime } from './index';

const COMMON_SCENARIOS = [
  { label: 'Email attachment', size: 5, unit: 'MB' },
  { label: 'HD movie', size: 5, unit: 'GB' },
  { label: 'Blu-ray disc', size: 25, unit: 'GB' },
  { label: 'Large dataset', size: 1, unit: 'TB' },
];

const BandwidthPanel: React.FC<{
  values?: Record<string, unknown>;
  results?: Array<{ label: string; value: string }>;
}> = () => {
  const [fileSize, setFileSize] = useState('100');
  const [fileSizeUnit, setFileSizeUnit] = useState('MB');
  const [connectionSpeed, setConnectionSpeed] = useState('50');
  const [speedUnit, setSpeedUnit] = useState('Mbps');
  const [tcpOverhead, setTcpOverhead] = useState('No');

  const results = useMemo(
    () =>
      calculate({
        fileSize: Number(fileSize),
        fileSizeUnit,
        connectionSpeed: Number(connectionSpeed),
        speedUnit,
        tcpOverhead,
      }),
    [fileSize, fileSizeUnit, connectionSpeed, speedUnit, tcpOverhead]
  );

  const getResult = (label: string): string => {
    const r = results.find((res) => res.label === label);
    return r ? r.value : '';
  };

  const timeSeconds = parseFloat(getResult('Transfer Time (seconds)'));
  const speedMbps = parseFloat(getResult('Connection Speed (Mbps)'));
  const effectiveSpeedMbps = parseFloat(getResult('Effective Speed (Mbps)'));
  const speedMBps = parseFloat(getResult('Connection Speed (MB/s)'));
  const fileSizeMB = parseFloat(getResult('File Size (MB)'));
  const fileSizeMbits = parseFloat(getResult('File Size (Mbits)'));
  const displayProgress = results.length > 0 ? 75 : 0;

  const overheadActive = tcpOverhead === 'Yes';

  return (
    <div className="bandwidth-calculator" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Input Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <div>
          <label htmlFor="bandwidth-file-size" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '14px' }}>
            File Size
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="bandwidth-file-size"
              type="number"
              min="0"
              step="any"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
              placeholder="Enter file size"
            />
            <select
              value={fileSizeUnit}
              onChange={(e) => setFileSizeUnit(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--bg-default, #fff)',
              }}
            >
              <option value="MB">MB</option>
              <option value="GB">GB</option>
              <option value="TB">TB</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="bandwidth-speed" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '14px' }}>
            Connection Speed
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="bandwidth-speed"
              type="number"
              min="0"
              step="any"
              value={connectionSpeed}
              onChange={(e) => setConnectionSpeed(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
              placeholder="Enter speed"
            />
            <select
              value={speedUnit}
              onChange={(e) => setSpeedUnit(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--bg-default, #fff)',
              }}
            >
              <option value="Mbps">Mbps</option>
              <option value="Gbps">Gbps</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="bandwidth-tcp" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '14px' }}>
            TCP Overhead (10%)
          </label>
          <select
            id="bandwidth-tcp"
            value={tcpOverhead}
            onChange={(e) => setTcpOverhead(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'var(--bg-default, #fff)',
              width: '100%',
            }}
          >
            <option value="No">Disabled</option>
            <option value="Yes">Enabled</option>
          </select>
        </div>
      </div>

      {/* SVG: Transfer Progress Visualization */}
      {results.length > 0 && (
        <>
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: '#f0f4ff',
              borderRadius: '8px',
              border: '1px solid #d0d9ff',
            }}
          >
            <svg
              viewBox="0 0 600 140"
              style={{ width: '100%', maxWidth: '600px', display: 'block', margin: '0 auto' }}
              role="img"
              aria-label="File transfer progress visualization showing server to client data transfer with estimated time"
            >
              {/* Background bar */}
              <rect x="20" y="30" width="560" height="24" rx="12" fill="#e2e8f0" />

              {/* Progress fill */}
              <rect
                x="20"
                y="30"
                width={560 * (displayProgress / 100)}
                height="24"
                rx="12"
                fill={overheadActive ? '#6366f1' : '#3b82f6'}
              >
                <animate
                  attributeName="width"
                  values={`${560 * (displayProgress / 100) - 20};${560 * (displayProgress / 100)}`}
                  dur="2s"
                  repeatCount="indefinite"
                />
              </rect>

              {/* Data packet dots */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <circle
                  key={`item-${i}`}
                  cx={40 + i * 70}
                  cy={30}
                  r="4"
                  fill="#93c5fd"
                >
                  <animate
                    attributeName="cy"
                    values="30;60;30"
                    dur={`${0.8 + i * 0.1}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;0.3;1"
                    dur={`${0.8 + i * 0.1}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}

              {/* Server icon */}
              <rect x="20" y="80" width="40" height="40" rx="4" fill="#3b82f6" />
              <text x="40" y="105" textAnchor="middle" className="fill-white" fontSize="12" fontWeight="bold">
                SV
              </text>
              <text x="40" y="130" textAnchor="middle" fill="#6b7280" fontSize="11">
                Server
              </text>

              {/* Arrow */}
              <line x1="65" y1="100" x2="120" y2="100" stroke="#93c5fd" strokeWidth="2" />
              <polygon points="115,94 125,100 115,106" fill="#93c5fd" />

              {/* Speed label */}
              <text x="135" y="95" fill="#4b5563" fontSize="13" fontWeight="600">
                {speedMbps} Mbps
              </text>
              <text x="135" y="110" fill="#6b7280" fontSize="11">
                ({speedMBps.toFixed(2)} MB/s)
              </text>

              {/* Arrow 2 */}
              <line x1="260" y1="100" x2="320" y2="100" stroke="#93c5fd" strokeWidth="2" />
              <polygon points="315,94 325,100 315,106" fill="#93c5fd" />

              {/* Progress label */}
              <text x="330" y="95" fill="#4b5563" fontSize="13" fontWeight="600">
                {getResult('Transfer Time') || '...'}
              </text>
              <text x="330" y="110" fill="#6b7280" fontSize="11">
                estimated time
              </text>

              {/* Client icon */}
              <rect x="540" y="80" width="40" height="40" rx="4" fill="#22c55e" />
              <text x="560" y="105" textAnchor="middle" className="fill-white" fontSize="12" fontWeight="bold">
                CL
              </text>
              <text x="560" y="130" textAnchor="middle" fill="#6b7280" fontSize="11">
                Client
              </text>

              {/* File size on bar */}
              <text x="300" y="22" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="600">
                {fileSize} {fileSizeUnit} file @ {connectionSpeed} {speedUnit}
              </text>
            </svg>
          </div>

          {/* Results Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            {[
              { label: 'Transfer Time', value: getResult('Transfer Time'), color: '#3b82f6' },
              { label: 'File Size', value: `${fileSizeMB.toFixed(2)} MB (${fileSizeMbits.toFixed(2)} Mbit)`, color: '#8b5cf6' },
              { label: 'Connection Speed', value: `${speedMbps} Mbps / ${speedMBps.toFixed(2)} MB/s`, color: '#22c55e' },
              { label: 'Effective Speed', value: `${effectiveSpeedMbps} Mbps`, color: overheadActive ? '#f59e0b' : '#22c55e' },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-default, #fff)',
                  borderRadius: '8px',
                  border: `1px solid ${card.color}33`,
                  borderLeft: `4px solid ${card.color}`,
                }}
              >
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{card.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* SVG: Bits vs Bytes Visual Comparison */}
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: '#fefce8',
              borderRadius: '8px',
              border: '1px solid #fde68a',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
              Bits vs Bytes - Know the Difference
            </h4>
            <svg viewBox="0 0 500 100" style={{ width: '100%', maxWidth: '500px', display: 'block', margin: '0 auto' }} role="img" aria-label="Bits versus bytes comparison diagram showing relationship between megabits per second and megabytes per second">
              {/* Bit box */}
              <rect x="30" y="10" width="80" height="60" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
              <text x="70" y="35" textAnchor="middle" fill="#1d4ed8" fontSize="18" fontWeight="bold">b</text>
              <text x="70" y="52" textAnchor="middle" fill="#1e40af" fontSize="11">bit</text>
              <text x="70" y="82" textAnchor="middle" fill="#6b7280" fontSize="11">Mbps (megabits/s)</text>

              {/* Division line */}
              <text x="175" y="45" textAnchor="middle" fill="#9ca3af" fontSize="28" fontWeight="bold">/</text>

              {/* Byte box */}
              <rect x="210" y="10" width="80" height="60" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
              <text x="250" y="35" textAnchor="middle" fill="#15803d" fontSize="18" fontWeight="bold">B</text>
              <text x="250" y="52" textAnchor="middle" fill="#166534" fontSize="11">byte</text>
              <text x="250" y="82" textAnchor="middle" fill="#6b7280" fontSize="11">MB/s (megabytes/s)</text>

              {/* Equals */}
              <text x="335" y="45" textAnchor="middle" fill="#9ca3af" fontSize="24" fontWeight="bold">=</text>

              {/* Conversion */}
              <rect x="365" y="15" width="120" height="50" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
              <text x="425" y="35" textAnchor="middle" fill="#92400e" fontSize="13" fontWeight="bold">1 Byte</text>
              <text x="425" y="52" textAnchor="middle" fill="#92400e" fontSize="13" fontWeight="bold">= 8 Bits</text>
            </svg>
            <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>
              <strong>Lowercase 'b'</strong> = bits (data rate), <strong>Uppercase 'B'</strong> = bytes (file size).
              Internet speeds are advertised in <strong>Mbps</strong> (megabits/sec), but file sizes are in{' '}
              <strong>MB</strong> (megabytes). Divide by 8 to convert: <strong>{speedMbps} Mbps = {speedMBps.toFixed(2)} MB/s</strong>.
            </p>
          </div>

          {/* Common Scenarios */}
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#166534' }}>
              Scenario Comparisons at {speedMbps} Mbps
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {COMMON_SCENARIOS.map((scenario) => {
                const calcResults = calculate({
                  fileSize: scenario.size,
                  fileSizeUnit: scenario.unit,
                  connectionSpeed: speedMbps,
                  speedUnit: 'Mbps',
                  tcpOverhead,
                });
                const time = calcResults.find((r) => r.label === 'Transfer Time')?.value || '';
                return (
                  <div
                    key={scenario.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--bg-default, #fff)',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                  >
                    <span style={{ color: '#374151' }}>{scenario.label} ({scenario.size} {scenario.unit})</span>
                    <span style={{ fontWeight: 600, color: '#166534' }}>{time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TCP Overhead Effect */}
          {overheadActive && (
            <div
              style={{
                padding: '12px 16px',
                background: '#fffbeb',
                borderRadius: '8px',
                border: '1px solid #fde68a',
                fontSize: '13px',
                color: '#78350f',
              }}
            >
              <strong>TCP Overhead Active:</strong> 10% of bandwidth ({speedMbps} Mbps) is consumed by protocol
              overhead, reducing effective throughput to <strong>{effectiveSpeedMbps} Mbps</strong>.
              Estimated transfer time increased from{' '}
              <strong>{timeSeconds > 0 ? formatTime(timeSeconds / 0.9) : '-'}</strong> to{' '}
              <strong>{getResult('Transfer Time')}</strong>.
            </div>
          )}
        </>
      )}

      {results.length === 0 && (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '14px',
            background: '#f9fafb',
            borderRadius: '8px',
          }}
        >
          Enter valid file size and connection speed to see transfer time estimates.
        </div>
      )}
    </div>
  );
};

export default BandwidthPanel;
