import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import RateLimitPanel from './RateLimitPanel';
import { computeThroughput } from './rateLimitMath';
import { finiteSteps } from '../../../utils/explainGuard';
import type { ExplainStep } from '../../../types/calculator';

const rateLimitConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'maxRpm',
      label: 'Maximum Requests Per Minute (RPM)',
      type: 'number',
      placeholder: '60000',
      unit: 'req/min',
      inputMode: 'decimal',
      min: 1,
      max: 1e9,
      step: 100,
      required: true,
      helpText: 'The sustained requests per minute you expect or allow (your rate limit)',
    },
    {
      id: 'avgPayloadSize',
      label: 'Average Payload Size',
      type: 'number',
      placeholder: '50',
      unit: 'KB',
      inputMode: 'decimal',
      min: 0.01,
      max: 1e7,
      step: 1,
      required: true,
      helpText: 'Average size of each API response payload in kilobytes (1 KB = 1,024 bytes)',
    },
    {
      id: 'peakConcurrentUsers',
      label: 'Peak Concurrent Users (optional)',
      type: 'number',
      placeholder: '1000',
      unit: 'users',
      inputMode: 'decimal',
      min: 1,
      max: 1e9,
      step: 10,
      helpText: 'Estimated number of concurrent users during peak traffic',
    },
    {
      id: 'burstRpm',
      label: 'Burst Limit You Configured (optional)',
      type: 'number',
      placeholder: '120000',
      unit: 'req/min',
      inputMode: 'decimal',
      min: 1,
      max: 1e9,
      step: 100,
      helpText: 'Short-term limit above the sustained rate, e.g. your gateway\'s configured burst. Look it up in your provider\'s documentation or console; this calculator has no built-in provider limits.',
    },
  ],
  calculate: (values) => {
    const rpm = parseFloat(values.maxRpm);
    const payloadSizeKB = parseFloat(values.avgPayloadSize);
    const peakConcurrent = parseFloat(values.peakConcurrentUsers);
    const burst = parseFloat(values.burstRpm);

    if (![rpm, payloadSizeKB].every(Number.isFinite) || rpm <= 0 || payloadSizeKB <= 0) return [];

    const t = computeThroughput(rpm, payloadSizeKB);
    const perUserRpm = Number.isFinite(peakConcurrent) && peakConcurrent > 0 ? rpm / peakConcurrent : 0;
    const loc = (n: number, d: number) => n.toLocaleString(undefined, { maximumFractionDigits: d });

    const results: CalculatorResult[] = [
      { id: 'rps', label: 'Requests Per Second (RPS)', value: `${loc(t.rps, 1)} req/s`, highlight: true, color: 'positive' },
      { id: 'bandwidthKbps', label: 'Payload Throughput', value: `${loc(t.kBps, 1)} KB/s`, color: 'neutral' },
      { id: 'bandwidthMbps', label: 'Bandwidth (megabits per second)', value: `${loc(t.mbps, 2)} Mbps`, color: 'neutral' },
      { id: 'monthlyTransfer', label: 'Data Transferred per 30 Days at This Rate', value: `${loc(t.tbPerMonth, 2)} TB`, color: 'neutral' },
      { id: 'dailyCapacity', label: 'Daily Request Capacity', value: `${loc(t.requestsPerDay, 0)} req/day`, color: 'neutral' },
      { id: 'rpm', label: 'Requests Per Minute', value: `${loc(rpm, 0)} RPM`, color: 'neutral' },
      {
        id: 'perUserRpm',
        label: 'RPM Per User',
        value: perUserRpm > 0 ? `${perUserRpm.toFixed(2)} RPM/user` : 'N/A (no concurrent users)',
        color: 'neutral',
      },
    ];
    if (Number.isFinite(burst) && burst > 0) {
      results.splice(5, 0, {
        id: 'burstLimit',
        label: 'Burst vs Sustained',
        value: `${loc(burst, 0)} RPM burst (${loc(burst / rpm, 2)}x the sustained rate)`,
        color: 'neutral',
        ...(burst < rpm ? { warning: 'The burst limit is below the sustained rate, so the sustained rate can never be reached.' } : {}),
      });
    }
    return results;
  },
  explainSteps: (values) => {
    const rpm = parseFloat(values.maxRpm);
    const payloadSizeKB = parseFloat(values.avgPayloadSize);
    const peakConcurrent = parseFloat(values.peakConcurrentUsers);
    if (![rpm, payloadSizeKB].every(Number.isFinite) || rpm <= 0 || payloadSizeKB <= 0) return [];
    const t = computeThroughput(rpm, payloadSizeKB);
    const loc = (n: number, d: number) => n.toLocaleString(undefined, { maximumFractionDigits: d });
    const steps: ExplainStep[] = [
      { label: 'Requests per second', expr: `${loc(rpm, 0)} RPM ÷ 60 = ${loc(t.rps, 1)} req/s` },
      { label: 'Payload throughput', expr: `${loc(t.rps, 1)} req/s × ${loc(payloadSizeKB, 2)} KB = ${loc(t.kBps, 1)} KB/s`, note: 'Here 1 KB is 1,024 bytes.' },
      { label: 'Convert to megabits per second', expr: `${loc(t.kBps, 1)} KB/s × 1,024 bytes × 8 bits ÷ 1,000,000 = ${loc(t.mbps, 2)} Mbps` },
      { label: 'Data moved in a 30-day month at this sustained rate', expr: `${loc(t.kBps, 1)} KB/s × 1,024 × 86,400 s × 30 ÷ 10¹² = ${loc(t.tbPerMonth, 2)} TB`, note: 'Decimal terabytes, assuming the limit is hit around the clock.' },
      { label: 'Requests in a day', expr: `${loc(rpm, 0)} × 60 × 24 = ${loc(t.requestsPerDay, 0)} req/day` },
    ];
    if (Number.isFinite(peakConcurrent) && peakConcurrent > 0) {
      steps.push({ label: 'Share per concurrent user', expr: `${loc(rpm, 0)} RPM ÷ ${loc(peakConcurrent, 0)} users = ${(rpm / peakConcurrent).toFixed(2)} RPM/user` });
    }
    return finiteSteps(steps);
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RateLimitPanel, { values, results });
  },
  educational: {
    formula:
      'RPS = RPM / 60\nPayload throughput (KB/s) = RPS × Payload Size\nBandwidth (Mbps) = KB/s × 1,024 × 8 / 1,000,000\nDaily Capacity = RPM × 60 × 24\nPer-User RPM = RPM / Peak Users',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="50" width="320" height="240" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/><line x1="60" y1="100" x2="380" y2="100" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="8,4"/><text x="385" y="104" font-size="11" fill="var(--svg-ef4444)">Limit</text><rect x="80" y="240" width="20" height="50" fill="var(--svg-3b82f6)" rx="2"/><rect x="110" y="220" width="20" height="70" fill="var(--svg-3b82f6)" rx="2"/><rect x="140" y="190" width="20" height="100" fill="var(--svg-3b82f6)" rx="2"/><rect x="170" y="160" width="20" height="130" fill="var(--svg-3b82f6)" rx="2"/><rect x="200" y="140" width="20" height="150" fill="var(--svg-3b82f6)" rx="2"/><rect x="230" y="170" width="20" height="120" fill="var(--svg-3b82f6)" rx="2"/><rect x="260" y="200" width="20" height="90" fill="var(--svg-3b82f6)" rx="2"/><rect x="290" y="230" width="20" height="60" fill="var(--svg-3b82f6)" rx="2"/><rect x="320" y="250" width="20" height="40" fill="var(--svg-3b82f6)" rx="2"/><text x="220" y="310" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Time</text></svg>',
      alt: 'Bar chart showing request volume over time with a red dashed rate limit line',
      caption: 'Rate limiting — requests per time window with a maximum limit threshold',
    },
    formulaDescription:
      'Rate limiting controls how many requests a client can make to an API within a given time window. Understanding your throughput helps you plan capacity and avoid 429 (Too Many Requests) errors.',
    variables: [
      {
        symbol: 'RPM',
        name: 'Requests Per Minute',
        description: 'The maximum number of API requests allowed per minute.',
      },
      {
        symbol: 'RPS',
        name: 'Requests Per Second',
        description: 'Throughput in requests per second — the steady-state rate your API serves.',
      },
      {
        symbol: 'Burst',
        name: 'Burst Capacity',
        description: 'The maximum short-term throughput your API can handle before rate limiting kicks in.',
      },
      {
        symbol: '429',
        name: 'HTTP 429 Too Many Requests',
        description: 'The HTTP status code returned when a client exceeds the rate limit.',
      },
    ],
    howToUse: [
      'Enter your API\'s maximum requests per minute (RPM).',
      'Enter the average payload size in KB to calculate bandwidth requirements.',
      'Optionally enter peak concurrent users to see per-user allocation.',
      'Optionally enter the burst limit you have configured to compare it with the sustained rate.',
      'Use the results to plan infrastructure scaling and set appropriate rate limits.',
    ],
    explanation:
      'Rate limiting is a critical API management strategy that protects your backend from being overwhelmed by too many requests. When a client exceeds the allowed rate, the server returns HTTP 429 (Too Many Requests). The difference between burst and steady-state capacity is key: burst allows short spikes above the sustained limit, while the sustained rate is what your infrastructure can handle long-term. Providers publish their own default throttling quotas (for example Amazon API Gateway documents account-level steady-state and burst quotas in requests per second), and Nginx\'s limit_req module takes a rate and a burst you configure yourself, so look up the numbers for your setup rather than assuming defaults. A common practice is to leave headroom above your expected peak traffic so normal usage does not hit 429s, while still protecting the backend.',
    commonUses: [
      'Planning API infrastructure capacity by calculating requests per second, bandwidth requirements, and daily throughput',
      'Setting appropriate rate limits for public APIs to protect backend services from abuse and unexpected traffic spikes',
      'Determining burst capacity and per-user rate limits when designing API pricing tiers or usage plans',
      'Estimating bandwidth costs and infrastructure needs for high-traffic web applications and microservices deployments',
    ],
    faqs: [
      {
        question: 'What happens when a user exceeds the rate limit?',
        answer: 'The server returns HTTP 429 (Too Many Requests) with a Retry-After header indicating how long the client should wait before retrying. Well-designed clients should implement exponential backoff.',
      },
      {
        question: 'What is the difference between burst and sustained rate limits?',
        answer: 'Burst allows short-term spikes above the sustained limit (e.g., a 10,000 RPM burst on top of a 1,000 RPM sustained limit). Sustained is the average rate your system can handle over longer periods.',
      },
      {
        question: 'What is a reasonable rate limit for my API?',
        answer: 'Start from measured traffic: set the limit comfortably above your expected legitimate peak so normal usage never sees a 429, and below the rate your backend can sustain. There is no universal per-user number; it depends on your clients and your capacity, so measure real usage first.',
      },
      {
        question: 'How should clients handle 429 errors?',
        answer: 'Clients should implement exponential backoff: wait 1 second on first retry, 2 seconds on second, 4 seconds on third, etc., up to a maximum. This prevents thundering herd problems.',
      },
    
      {
        question: 'Which rate-limiting algorithm should I use?',
        answer: 'The token bucket algorithm (used by AWS and most API gateways) is ideal for most APIs — it allows short bursts while enforcing a long-term average rate. The leaky bucket smooths traffic to a fixed rate (better for bandwidth shaping). The fixed window counter is simplest but can allow double the rate at window boundaries. Sliding window log provides the most accurate enforcement at the cost of more memory.',
      },],
    
    workedExamples: [
      {
        scenario: 'A public REST API is limited to 60,000 RPM, serving 50 KB average responses to an estimated 1,000 peak concurrent users. The team needs to plan bandwidth and per-user allocation.',
        inputs: { maxRpm: '60000', avgPayloadSize: '50', peakConcurrentUsers: '1000' },
        result: 'RPS: 1,000 req/s. Payload throughput: 50,000 KB/s. Bandwidth: 409.6 Mbps (50,000 KB/s × 1,024 B × 8 ÷ 10⁶). Daily capacity: 86,400,000 req/day. About 132.71 TB per 30 days. Per-user RPM: 60.',
        insight: 'Megabits, not megabytes: 50,000 KB/s is about 48.8 MB/s, which is 409.6 Mbps on the wire, so a 1 Gbps link is already ~41% utilised by response payloads alone (headers, TLS overhead and requests are extra). At roughly 132.7 TB a month, egress charges can matter more than request fees; check your provider\'s transfer pricing. With 1,000 concurrent users each user can make 60 RPM (1 per second) at the limit.',
      },
      {
        scenario: 'A small Nginx-proxied microservice has a 5,000 RPM limit and 2 KB JSON responses. There is no concurrent-user data yet.',
        inputs: { maxRpm: '5000', avgPayloadSize: '2', peakConcurrentUsers: '' },
        result: 'RPS: 83.3 req/s. Payload throughput: 166.7 KB/s. Bandwidth: 1.37 Mbps. Daily capacity: 7,200,000 req/day. About 0.44 TB per 30 days. Per-user RPM: N/A.',
        insight: 'At 83 RPS and 1.37 Mbps the traffic is tiny for modern infrastructure, so the limit is about protecting the application, not the network. Enforce it in the proxy (for example with Nginx limit_req) and return 429 with a Retry-After header. Collect concurrent-user data before designing per-user tiers.',
      },
    ],

    proTips: [
      'Leave headroom between your limit and expected legitimate peak traffic: a limit set exactly at peak means users hit 429s during normal use.',
      'Pair rate-limited APIs with client libraries that back off exponentially (for example 1s, 2s, 4s, 8s) with random jitter, and honour the Retry-After header.',
      'Check both numbers: the sustained rate (tokens refilled per second) and the burst (bucket size). Many gateways let you set them separately.',
      'Bandwidth cost scales with payload size, not request count. At 1,000 RPS, 50 KB responses move about 132 TB a month; compression (gzip/brotli), pagination and field filtering cut that directly.',
    ],

    quickReference: [
      { label: 'HTTP 429', value: 'Too Many Requests — retry after Retry-After seconds' },
      { label: 'RPS Formula', value: 'RPS = RPM ÷ 60' },
      { label: 'Bandwidth Formula', value: 'Mbps = RPS × KB × 1,024 × 8 ÷ 1,000,000' },
      { label: 'Daily Capacity', value: 'Daily = RPM × 60 × 24' },
      { label: 'Exponential Backoff', value: '1s → 2s → 4s → 8s → 16s (with jitter, limited retries)' },
      { label: 'Token Bucket', value: 'Tokens refill at the sustained rate; bucket depth = burst capacity' },
      { label: 'Leaky Bucket', value: 'Requests processed at a fixed rate; excess queued or dropped' },
    ],

    limitations: [
      'This calculator models steady-state throughput and does not account for traffic burst patterns, cold starts, cache hit ratios, database query latency, or downstream service bottlenecks — all of which affect real-world API capacity.',
      'Provider limits are not built in: quotas and burst settings differ by provider, plan and configuration, so enter yours (burst is optional) or look them up in your provider\'s documentation.',
      'Bandwidth estimates use the payload size you enter; if that is the uncompressed size, compression (gzip/brotli) will reduce the wire size of text responses, often by a large factor. Protocol overhead (headers, TLS, TCP) is not included.',
      'Per-user RPM assumes uniform load distribution across users, which is rarely true in practice. A small fraction of power users often generates the majority of requests. Use this calculator for aggregate planning, then instrument actual usage to identify your real per-user distribution.',
    ],
citations: [
      { source: 'Wikipedia', title: 'Rate Limiting', url: 'https://en.wikipedia.org/wiki/Rate_limiting' },
      { source: 'IETF RFC 6585', title: 'Additional HTTP Status Codes (429 Too Many Requests)', url: 'https://www.rfc-editor.org/rfc/rfc6585' },
    ],
  },
};

export default rateLimitConfig;
