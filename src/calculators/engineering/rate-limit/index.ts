import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RateLimitPanel from './RateLimitPanel';

const serverDefaults: Record<string, { burstRpm: number; maxConcurrent: number; label: string }> = {
  'aws-api-gateway': { burstRpm: 10000, maxConcurrent: 5000, label: 'AWS API Gateway' },
  'cloudflare': { burstRpm: Infinity, maxConcurrent: 15000, label: 'Cloudflare' },
  'nginx': { burstRpm: 5000, maxConcurrent: 3000, label: 'Nginx' },
  'custom': { burstRpm: 5000, maxConcurrent: 2000, label: 'Custom' },
};

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
      step: 100,
      required: true,
      helpText: 'The maximum number of requests your API can handle per minute',
    },
    {
      id: 'avgPayloadSize',
      label: 'Average Payload Size',
      type: 'number',
      placeholder: '50',
      unit: 'KB',
      inputMode: 'decimal',
      min: 0.01,
      step: 1,
      required: true,
      helpText: 'Average size of each API response payload in kilobytes',
    },
    {
      id: 'peakConcurrentUsers',
      label: 'Peak Concurrent Users (optional)',
      type: 'number',
      placeholder: '1000',
      unit: 'users',
      inputMode: 'decimal',
      min: 1,
      step: 10,
      helpText: 'Estimated number of concurrent users during peak traffic',
    },
    {
      id: 'serverType',
      label: 'Server Type',
      type: 'select',
      required: true,
      options: [
        { label: 'AWS API Gateway', value: 'aws-api-gateway' },
        { label: 'Cloudflare', value: 'cloudflare' },
        { label: 'Nginx', value: 'nginx' },
        { label: 'Custom', value: 'custom' },
      ],
      helpText: 'Select your server type for burst capacity defaults',
    },
  ],
  calculate: (values) => {
    const rpm = parseFloat(values.maxRpm);
    const payloadSizeKB = parseFloat(values.avgPayloadSize);
    const peakConcurrent = parseFloat(values.peakConcurrentUsers);
    const serverType = (values.serverType || 'custom') as string;

    if (isNaN(rpm) || isNaN(payloadSizeKB) || rpm <= 0 || payloadSizeKB <= 0) return [];

    const rps = rpm / 60;
    const bandwidthKbps = rps * payloadSizeKB;
    const bandwidthMbps = bandwidthKbps / 1024;
    const dailyCapacity = rpm * 60 * 24;
    const serverInfo = serverDefaults[serverType] || serverDefaults['custom'];

    let burstLimit: number;
    let burstLabel: string;
    if (serverInfo.burstRpm === Infinity) {
      burstLimit = rpm * 10;
      burstLabel = 'Unlimited (theoretical)';
    } else {
      burstLimit = Math.min(serverInfo.burstRpm, rpm * 10);
      burstLabel = `${burstLimit.toLocaleString()} RPM`;
    }

    const maxConcurrent = serverInfo.maxConcurrent;
    const perUserRpm = peakConcurrent && peakConcurrent > 0 ? rpm / peakConcurrent : 0;

    return [
      {
        id: 'rps',
        label: 'Requests Per Second (RPS)',
        value: `${rps.toLocaleString(undefined, { maximumFractionDigits: 1 })} req/s`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'bandwidthKbps',
        label: 'Bandwidth Required',
        value: `${bandwidthKbps.toLocaleString(undefined, { maximumFractionDigits: 1 })} KB/s`,
        color: 'neutral',
      },
      {
        id: 'bandwidthMbps',
        label: 'Bandwidth (Mbps)',
        value: `${bandwidthMbps.toLocaleString(undefined, { maximumFractionDigits: 2 })} Mbps`,
        color: bandwidthMbps > 1000 ? 'negative' : bandwidthMbps > 100 ? 'neutral' : 'positive',
      },
      {
        id: 'dailyCapacity',
        label: 'Daily Request Capacity',
        value: `${dailyCapacity.toLocaleString(undefined, { maximumFractionDigits: 0 })} req/day`,
        color: 'neutral',
      },
      {
        id: 'burstLimit',
        label: `Burst Capacity (${serverInfo.label})`,
        value: burstLabel,
        color: 'neutral',
      },
      {
        id: 'maxConcurrent',
        label: 'Max Recommended Concurrent Users',
        value: `${maxConcurrent.toLocaleString()} users`,
        color: 'neutral',
      },
      {
        id: 'serverType',
        label: 'Server Type',
        value: serverInfo.label,
        color: 'neutral',
      },
      {
        id: 'rpm',
        label: 'Requests Per Minute',
        value: `${rpm.toLocaleString(undefined, { maximumFractionDigits: 0 })} RPM`,
        color: 'neutral',
      },
      {
        id: 'perUserRpm',
        label: 'RPM Per User',
        value: perUserRpm > 0
          ? `${perUserRpm.toFixed(2)} RPM/user`
          : 'N/A (no concurrent users)',
        color: perUserRpm > 0 && perUserRpm < 1 ? 'neutral' : 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RateLimitPanel, { values, results });
  },
  educational: {
    formula:
      'RPS = RPM / 60\nBandwidth = RPS × Payload Size\nDaily Capacity = RPM × 60 × 24\nPer-User RPM = RPM / Peak Users',
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
      'Select your server type to see burst capacity defaults.',
      'Use the results to plan infrastructure scaling and set appropriate rate limits.',
    ],
    explanation:
      'Rate limiting is a critical API management strategy that protects your backend from being overwhelmed by too many requests. When a client exceeds the allowed rate, the server returns HTTP 429 (Too Many Requests). The difference between burst and steady-state capacity is key: burst allows short spikes above the sustained limit, while the sustained rate is what your infrastructure can handle long-term. AWS API Gateway has a default burst limit of 10,000 RPM. Cloudflare offers effectively unlimited burst. Nginx burst depends on worker configurations. For production APIs, set rate limits at 2-3x your expected peak traffic to handle spikes while protecting your backend.',
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
        answer: 'Burst allows short-term spikes above the sustained limit (e.g., 10,000 RPM burst on a 1,000 RPM sustained limit). Sustained is the average rate your system can handle over longer periods.',
      },
      {
        question: 'What is a reasonable rate limit for my API?',
        answer: 'A common approach is to set the rate limit at 2-3x your expected peak traffic. For a public API, 1000-10000 RPM per user is typical. Adjust based on your infrastructure and user base.',
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
        scenario: 'AcmeTech runs a public REST API behind AWS API Gateway with a 60,000 RPM rate limit, serving 50 KB average payload responses to an estimated 1,000 peak concurrent users. Their DevOps team needs to plan bandwidth provisioning and understand per-user allocation.',
        inputs: {
          'Max RPM': '60000',
          'Avg Payload Size': '50 KB',
          'Peak Concurrent Users': '1000',
          'Server Type': 'AWS API Gateway',
        },
        result: 'RPS: 1,000 req/s. Bandwidth: 48.83 Mbps. Daily Capacity: 86,400,000 req/day. Burst: 10,000 RPM (AWS default). Max Concurrent: 5,000 users. Per-User RPM: 60 RPM/user.',
        insight: 'At 60,000 RPM (1,000 RPS) and 50 KB per response, AcmeTech needs ~49 Mbps of sustained egress bandwidth. A typical AWS NAT gateway supports up to 4.5 Gbps, so bandwidth is not the bottleneck here. The more important finding is the burst limit: AWS API Gateway caps burst at 10,000 RPM, meaning AcmeTech\'s configured 60,000 RPM limit can only sustain that rate — burst capacity is actually lower than the sustained limit due to the AWS default. With 1,000 concurrent users, each user gets 60 RPM (1 RPS), which is reasonable for most client applications. If AcmeTech expects traffic spikes beyond 10,000 burst RPM, they need to either raise the AWS burst quota or implement client-side throttling with exponential backoff to avoid 429 errors during surges.',
      },
      {
        scenario: 'A small startup runs an Nginx-reverse-proxied microservice with a modest 5,000 RPM capacity and lightweight 2 KB JSON responses. They don\'t yet have concurrent user data but want to understand their daily throughput headroom and bandwidth costs.',
        inputs: {
          'Max RPM': '5000',
          'Avg Payload Size': '2 KB',
          'Peak Concurrent Users': '',
          'Server Type': 'Nginx',
        },
        result: 'RPS: 83.3 req/s. Bandwidth: 0.16 Mbps. Daily Capacity: 7,200,000 req/day. Burst: 5,000 RPM (Nginx). Max Concurrent: 3,000 users. Per-User RPM: N/A.',
        insight: 'With only 83 RPS and 0.16 Mbps bandwidth, this microservice can run on minimal infrastructure — even a $5/month VPS with 1 TB transfer could serve ~500 million requests before hitting bandwidth limits. The 7.2 million daily request capacity is generous for a small startup. The Nginx burst limit matching the sustained RPM (5,000) means there is no additional burst headroom beyond the steady-state rate — any traffic spike above 5,000 RPM will immediately trigger rate limiting. The startup should configure Nginx\'s rate-limiting module (`limit_req_zone`) to enforce this limit and return 429 with a `Retry-After` header rather than letting the server crash under unexpected load. Without concurrent user data, per-user allocation cannot be estimated — the team should instrument their app to collect this data before designing per-user rate tiers.',
      },
    ],

    proTips: [
      'Set your API rate limit at 2–3× expected peak traffic, not at your infrastructure\'s breaking point. This gives you headroom for organic growth and unexpected traffic while still protecting the backend. A limit that is exactly at peak means your users will hit 429s during normal usage.',
      'Always pair rate-limited APIs with exponential-backoff client libraries. A well-behaved client that retries with 1s → 2s → 4s → 8s delays can reduce perceived downtime from seconds to unnoticeable milliseconds. Return the `Retry-After` header to guide client behavior.',
      'Per-user RPM allocation is a critical metric for API pricing tiers. If your per-user RPM drops below 10, interactive use (e.g., a dashboard polling an endpoint) becomes sluggish. Aim for 30–60 RPM/user for a responsive experience, and 10+ RPM/user for background/batch operations.',
      'Bandwidth costs scale with payload size, not request count. If your 50 KB responses are at 1,000 RPS, that\'s ~126 TB/month of egress. At AWS\'s ~$0.09/GB egress rate, that\'s roughly $11,340/month just in data transfer. Consider response compression (gzip/brotli), pagination, and field filtering to reduce payload size before scaling infrastructure.',
    ],

    quickReference: [
      { label: 'AWS API Gateway', value: '10,000 burst RPM · 5,000 max concurrent' },
      { label: 'Cloudflare', value: 'Unlimited burst · 15,000 max concurrent' },
      { label: 'Nginx', value: '5,000 burst RPM · 3,000 max concurrent' },
      { label: 'HTTP 429', value: 'Too Many Requests — retry after Retry-After seconds' },
      { label: 'RPS Formula', value: 'RPS = RPM ÷ 60' },
      { label: 'Bandwidth Formula', value: 'Mbps = (RPS × KB) ÷ 1024' },
      { label: 'Daily Capacity', value: 'Daily = RPM × 60 × 24' },
      { label: 'Exponential Backoff', value: '1s → 2s → 4s → 8s → 16s (max 5 retries)' },
      { label: 'Token Bucket', value: 'Tokens refill at sustained rate; bucket depth = burst capacity' },
      { label: 'Leaky Bucket', value: 'Requests processed at fixed rate; excess queued or dropped' },
    ],

    limitations: [
      'This calculator models steady-state throughput and does not account for traffic burst patterns, cold starts, cache hit ratios, database query latency, or downstream service bottlenecks — all of which affect real-world API capacity.',
      'Burst capacity server defaults are approximations. Actual burst limits depend on your specific configuration (Nginx worker settings, AWS account quotas, Cloudflare plan tier). Always verify against your provider\'s actual limits.',
      'Bandwidth estimates assume uncompressed payloads. Real-world bandwidth with gzip/brotli compression can be 50–80% lower for text-based responses (JSON, HTML, XML), making the calculator conservative for compressible payloads.',
      'Per-user RPM assumes uniform load distribution across users, which is rarely true in practice. A small fraction of power users often generates the majority of requests. Use this calculator for aggregate planning, then instrument actual usage to identify your real per-user distribution.',
    ],
citations: [
      { source: 'Wikipedia', title: 'Rate Limiting', url: 'https://en.wikipedia.org/wiki/Rate_limiting' },
      { source: 'Wolfram MathWorld', title: 'Rate Limiting', url: 'https://mathworld.wolfram.com/' },
    ],
  },
};

export default rateLimitConfig;
