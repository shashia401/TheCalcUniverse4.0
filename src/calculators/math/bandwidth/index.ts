import { createElement } from 'react';
import type { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import BandwidthPanel from './bandwidthPanel';
import { parseNumberStrict } from '../../../utils/parseNumber';

const FILE_UNIT_TO_MBIT: Record<string, number> = {
  MB: 8,
  GB: 8000,
  TB: 8000000,
};

const FILE_UNIT_TO_BYTES: Record<string, number> = {
  MB: 1_000_000,
  GB: 1_000_000_000,
  TB: 1_000_000_000_000,
};

export function formatTime(totalSeconds: number): string {
  if (totalSeconds < 0) return '0s';
  // Round to whole seconds FIRST: rounding only the remainder printed 119.6 s as "1m 60s".
  const whole = Math.round(totalSeconds);
  const days = Math.floor(whole / 86400);
  const hours = Math.floor((whole % 86400) / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function calculate(
  values: Record<string, unknown>
): CalculatorResult[] {
  const fileSize = parseNumberStrict(String(values.fileSize ?? ''));
  const fileSizeUnit = String(values.fileSizeUnit || 'MB');
  const connectionSpeed = parseNumberStrict(String(values.connectionSpeed ?? ''));
  const speedUnit = String(values.speedUnit || 'Mbps');
  const tcpOverhead = String(values.tcpOverhead || 'No');

  if (!(fileSize > 0) || !(connectionSpeed > 0) || fileSize > 1e12 || connectionSpeed > 1e9) {
    return [];
  }

  const mbitMultiplier = FILE_UNIT_TO_MBIT[fileSizeUnit];
  const byteMultiplier = FILE_UNIT_TO_BYTES[fileSizeUnit];
  if (mbitMultiplier === undefined || byteMultiplier === undefined) return [];

  const fileSizeMbits = fileSize * mbitMultiplier;
  const fileSizeBytes = fileSize * byteMultiplier;
  const speedMbps = speedUnit === 'Gbps' ? connectionSpeed * 1000 : connectionSpeed;

  if (speedMbps <= 0) return [];

  const overhead = tcpOverhead === 'Yes' ? 0.1 : 0;
  const effectiveSpeedMbps = speedMbps * (1 - overhead);

  if (effectiveSpeedMbps <= 0) return [];

  const timeSeconds = fileSizeMbits / effectiveSpeedMbps;
  const speedMBps = speedMbps / 8;
  const effectiveMBps = effectiveSpeedMbps / 8;
  const fileSizeMB = fileSizeBytes / 1_000_000;

  return [
    { id: 'Transfer Time', label: 'Transfer Time', value: formatTime(timeSeconds) },
    { id: 'Transfer Time (seconds)', label: 'Transfer Time (seconds)', value: timeSeconds.toFixed(2) },
    { id: 'File Size (Mbits)', label: 'File Size (Mbits)', value: fileSizeMbits.toFixed(2) },
    { id: 'File Size (MB)', label: 'File Size (MB)', value: fileSizeMB.toFixed(2) },
    { id: 'Connection Speed (Mbps)', label: 'Connection Speed (Mbps)', value: speedMbps.toFixed(2) },
    { id: 'Connection Speed (MB/s)', label: 'Connection Speed (MB/s)', value: speedMBps.toFixed(2) },
    { id: 'TCP Overhead', label: 'TCP Overhead', value: overhead > 0 ? '10% (enabled)' : 'None (disabled)' },
    { id: 'Effective Speed (Mbps)', label: 'Effective Speed (Mbps)', value: effectiveSpeedMbps.toFixed(2) },
    { id: 'Effective Speed (MB/s)', label: 'Effective Speed (MB/s)', value: effectiveMBps.toFixed(2) },
  ];
}

const bandwidthConfig: CalculatorConfig = {
  inputs: [
    { id: 'fileSize', label: 'File Size', type: 'number', placeholder: 'Enter file size', required: true, helpText: 'Enter the size of the file you want to transfer' },
    {
      id: 'fileSizeUnit', label: 'File Size Unit', type: 'select', required: true,
      options: [
        { value: 'MB', label: 'MB (Megabyte)' },
        { value: 'GB', label: 'GB (Gigabyte)' },
        { value: 'TB', label: 'TB (Terabyte)' },
      ],
      helpText: 'Select the unit for the file size',
    },
    { id: 'connectionSpeed', label: 'Connection Speed', type: 'number', placeholder: 'Enter speed', required: true, helpText: 'Enter your internet connection speed' },
    {
      id: 'speedUnit', label: 'Speed Unit', type: 'select', required: true,
      options: [
        { value: 'Mbps', label: 'Mbps (Megabits/sec)' },
        { value: 'Gbps', label: 'Gbps (Gigabits/sec)' },
      ],
      helpText: 'Select the speed unit for your connection',
    },
    {
      id: 'tcpOverhead', label: 'TCP Overhead (10%)', type: 'select', required: true,
      options: [
        { value: 'No', label: 'Disabled' },
        { value: 'Yes', label: 'Enabled' },
      ],
      helpText: 'Enable to account for ~10% TCP protocol overhead',
    },
  ],

  calculate: (values): CalculatorResult[] => calculate(values),

  extraPanel: (values, results) => createElement(BandwidthPanel, { values, results }),

  educational: {
    formula: 'Transfer Time = (FileSize × 8) / (Speed × (1 - Overhead))',
    formulaDescription: 'Calculate how long it takes to transfer a file given connection speed and optional TCP overhead.',
    variables: [
      { symbol: 'FileSize', name: 'File Size', description: 'Size of the file to transfer (MB, GB, or TB).' },
      { symbol: 'Speed', name: 'Connection Speed', description: 'Network bandwidth in Mbps or Gbps.' },
      { symbol: 'Overhead', name: 'TCP Overhead', description: 'Protocol overhead reducing effective throughput (10% when enabled).' },
    ],
    howToUse: [
      'Enter the file size and select the unit (MB, GB, TB).',
      'Enter your connection speed and select Mbps or Gbps.',
      'Toggle TCP overhead to see its effect on transfer time (recommended for real-world estimates).',
      'The calculator shows both bits (Mbps) and bytes (MB/s) for clarity.',
      'Review the effective speed to account for real-world protocol overhead.',
    ],
    explanation: 'Bandwidth (data transfer rate) is the amount of data that can be transmitted over a connection in a given time. File sizes are typically measured in bytes (MB, GB), while connection speeds are measured in bits per second (Mbps). Since 1 byte = 8 bits, you divide the speed by 8 to get the theoretical byte transfer rate. TCP/IP protocol overhead typically costs 5-10% of throughput (about 5% on Ethernet; the 10% option is a cautious planning figure). Sizes use decimal units (1 GB = 1,000,000,000 bytes), as file sizes and ISPs do. Practical example: downloading a 25 GB game on a 100 Mbps connection. File size in megabits: 25 × 8000 = 200,000 Mb. Without overhead: transfer time = 200,000 / 100 = 2,000 seconds (33.3 minutes). With 10% TCP overhead, effective speed is 90 Mbps, so transfer time = 200,000 / 90 = 2,222 seconds (37 minutes). Edge cases: on Wi-Fi connections, actual throughput is typically 40-60% of the rated speed due to interference, distance from the router, and competing networks. A 300 Mbps-rated Wi-Fi connection might deliver only 120-180 Mbps in practice. For cloud uploads, the provider often throttles speeds or imposes data caps. For streaming, the required bandwidth varies: Netflix 4K needs about 25 Mbps, Zoom HD calls need about 3-4 Mbps, and online gaming needs only about 3-10 Mbps but requires low latency. When multiple devices share the same connection, the available bandwidth is divided among them, so transfer times increase proportionally.',
    faqs: [
      {
        question: 'What is the difference between Mbps and MB/s?',
        answer: 'Mbps (megabits per second) measures data rate, while MB/s (megabytes per second) measures actual file transfer speed. 1 byte = 8 bits, so 100 Mbps = 12.5 MB/s.',
      },
      {
        question: 'Why does TCP overhead matter?',
        answer: 'TCP/IP headers, acknowledgments and retransmissions use up part of the link: roughly 5% on a clean Ethernet connection and up to 10% or more on a lossy or high-latency one. The calculator\'s 10% option is a cautious figure, so a 100 Mbps connection is treated as delivering ~90 Mbps of file data.',
      },
      {
        question: 'How does latency affect transfer time?',
        answer: 'Latency (ping) measures the delay in data transmission, not the speed. For large file transfers, bandwidth is the limiting factor, but for many small files (like loading a webpage with 100 images), latency becomes critical because each request requires a round trip. This is called the bandwidth-delay product: the maximum amount of data that can be in transit at any time equals bandwidth × latency. For a 100 Mbps connection with 50 ms latency, the bandwidth-delay product is 100 Mbps × 0.05 s = 5 Mb (about 0.6 MB). This means that even with high bandwidth, connections with high latency will transfer data in small bursts, potentially reducing effective throughput for protocols that require acknowledgments for each window of data. For satellite internet with 600 ms latency, a 50 Mbps connection may feel slower than a 25 Mbps fiber connection with 10 ms latency for web browsing, even though large file downloads will eventually saturate the higher bandwidth.',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Bandwidth &amp; Transfer Time</text><rect x="20" y="35" width="90" height="36" rx="6" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="65" y="50" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">File</text><text x="65" y="65" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">25 GB</text><line x1="110" y1="48" x2="145" y2="48" stroke="var(--svg-333333)" stroke-width="2"/><polygon points="145,43 155,48 145,53" fill="var(--svg-333333)"/><rect x="155" y="28" width="50" height="50" rx="6" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="180" y="44" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">x 8</text><text x="180" y="58" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">bits</text><text x="180" y="72" text-anchor="middle" font-size="9" fill="var(--svg-888888)">200 Gb</text><line x1="205" y1="48" x2="230" y2="48" stroke="var(--svg-333333)" stroke-width="2"/><polygon points="230,43 240,48 230,53" fill="var(--svg-333333)"/><rect x="240" y="35" width="70" height="36" rx="6" fill="var(--svg-ef4444)" opacity="0.8"/><text x="275" y="50" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold">Result</text><text x="275" y="65" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">33.3 min</text><rect x="15" y="90" width="290" height="100" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="110" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Transfer Time = (FileSize × 8) / (Speed × (1 − Overhead))</text><text x="160" y="132" text-anchor="middle" font-size="10" fill="var(--svg-555555)">Example: 100 Mbps connection</text><line x1="20" y1="142" x2="300" y2="142" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="160" font-size="10" fill="var(--svg-333333)">Without TCP overhead:</text><text x="310" y="160" text-anchor="end" font-size="10" fill="var(--svg-3b82f6)">33.3 min</text><line x1="20" y1="168" x2="300" y2="168" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="185" font-size="10" fill="var(--svg-333333)">With 10% TCP overhead:</text><text x="310" y="185" text-anchor="end" font-size="10" fill="var(--svg-ef4444)">37.0 min</text></svg>',
      alt: 'Bandwidth transfer diagram showing file size conversion and transfer time',
      caption: 'Transfer time = file size in bits / connection speed. TCP overhead reduces effective throughput by ~10%.',
    },
    citations: [
      { source: 'Wikipedia', title: 'Bandwidth (Computing)', url: 'https://en.wikipedia.org/wiki/Bandwidth_(computing)' },
      { source: 'Wikipedia', title: 'Data-rate units', url: 'https://en.wikipedia.org/wiki/Data-rate_units' },
    ],
  },
};

export default bandwidthConfig;
