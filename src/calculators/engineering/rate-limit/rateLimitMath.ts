/** Throughput math shared by index.ts and RateLimitPanel.tsx. KB = 1024 bytes; Mbps = 10^6 bits per second. */
export interface Throughput {
  rps: number;
  kBps: number;
  /** Megabits per second (payload bytes x 8). */
  mbps: number;
  requestsPerDay: number;
  /** Decimal terabytes transferred in a 30-day month at this sustained rate. */
  tbPerMonth: number;
}

export function computeThroughput(rpm: number, payloadKB: number): Throughput {
  const rps = rpm / 60;
  const kBps = rps * payloadKB;
  const bytesPerSecond = kBps * 1024;
  return {
    rps,
    kBps,
    mbps: (bytesPerSecond * 8) / 1e6,
    requestsPerDay: rpm * 60 * 24,
    tbPerMonth: (bytesPerSecond * 86400 * 30) / 1e12,
  };
}
