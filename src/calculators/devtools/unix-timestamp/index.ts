import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import UnixTimestampPanel from './UnixTimestampPanel';

const unixTimestampConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Conversion Mode',
      type: 'select',
      defaultValue: 'ts-to-date',
      helpText: 'Choose which direction to convert',
      options: [
        { label: 'Timestamp → Date', value: 'ts-to-date' },
        { label: 'Date → Timestamp', value: 'date-to-ts' },
      ],
      required: true,
    },
    {
      id: 'timestamp',
      label: 'Unix Timestamp',
      type: 'number',
      inputMode: 'numeric',
      defaultValue: '1715875200',
      placeholder: 'Enter Unix timestamp...',
      step: 1,
      helpText: 'Seconds (or milliseconds) since Jan 1, 1970 UTC',
      showWhen: (values) => values.mode === 'ts-to-date',
    },
    {
      id: 'dateInput',
      label: 'Date or ISO 8601 String',
      type: 'text',
      defaultValue: '2026-01-01T00:00:00Z',
      placeholder: 'YYYY-MM-DD or ISO 8601...',
      helpText: 'Enter a date string to convert to a Unix timestamp',
      showWhen: (values) => values.mode === 'date-to-ts',
    },
  ],
  calculate: (values: Record<string, string>) => {
    const mode = values.mode || 'ts-to-date';

    if (mode === 'ts-to-date') {
      const rawTs = values.timestamp || '';
      if (!rawTs.trim()) return [];

      const ts = parseFloat(rawTs);
      if (isNaN(ts)) return [];

      const isMs = ts > 1e11;
      const date = new Date(isMs ? ts : ts * 1000);
      if (isNaN(date.getTime())) return [];

      return [
        { id: 'localDate', label: 'Local Date/Time', value: date.toLocaleString(), color: 'positive' },
        { id: 'utcDate', label: 'UTC Date/Time', value: date.toUTCString(), color: 'neutral' },
        { id: 'isoString', label: 'ISO 8601', value: date.toISOString(), color: 'neutral' },
        {
          id: 'milliseconds',
          label: 'Milliseconds Since Epoch',
          value: String(date.getTime()),
          color: 'neutral',
        },
      ];
    }

    if (mode === 'date-to-ts') {
      const dateStr = values.dateInput || '';
      if (!dateStr.trim()) return [];

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return [];

      const ms = date.getTime();
      const seconds = Math.floor(ms / 1000);

      return [
        {
          id: 'seconds',
          label: 'Unix Timestamp (Seconds)',
          value: String(seconds),
          highlight: true,
          color: 'positive',
        },
        {
          id: 'ms',
          label: 'Unix Timestamp (Milliseconds)',
          value: String(ms),
          color: 'neutral',
        },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(UnixTimestampPanel, { values, results });
  },
  educational: {
    formula: 'Unix time = seconds elapsed since 1970-01-01T00:00:00 UTC (the Unix epoch)',
    diagram: {
      svg: '<svg viewBox="0 0 440 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="30" y="15" width="380" height="270" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1.5" rx="8"/><text x="220" y="45" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e293b)">Unix Timestamp</text><line x1="60" y1="85" x2="380" y2="85" stroke="var(--svg-64748b)" stroke-width="1.5"/><circle cx="100" cy="85" r="6" fill="var(--svg-3b82f6)"/><text x="100" y="72" text-anchor="middle" font-size="10" fill="var(--svg-2563eb)">1970</text><circle cx="190" cy="85" r="6" fill="var(--svg-3b82f6)"/><text x="190" y="72" text-anchor="middle" font-size="10" fill="var(--svg-2563eb)">2000</text><circle cx="280" cy="85" r="6" fill="var(--svg-3b82f6)"/><text x="280" y="72" text-anchor="middle" font-size="10" fill="var(--svg-2563eb)">2024</text><circle cx="350" cy="85" r="6" fill="var(--svg-3b82f6)"/><text x="350" y="72" text-anchor="middle" font-size="10" fill="var(--svg-2563eb)">2038</text><line x1="350" y1="85" x2="380" y2="85" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="6,3"/><text x="365" y="102" font-size="9" fill="var(--svg-ef4444)">Y2K38</text><rect x="60" y="120" width="320" height="45" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="220" y="140" text-anchor="middle" font-size="11" fill="var(--svg-2563eb)">Seconds since 1970-01-01 00:00:00 UTC</text><text x="220" y="155" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Excludes leap seconds</text><line x1="220" y1="165" x2="220" y2="190" stroke="var(--svg-64748b)" stroke-width="1.5"/><polygon points="215,190 220,200 225,190" fill="var(--svg-64748b)"/><rect x="120" y="205" width="200" height="40" fill="var(--svg-22c55e)" rx="6"/><text x="220" y="230" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Human-Readable Date</text></svg>',
      alt: 'Timeline showing the Unix epoch starting in 1970 with key dates and the Y2K38 threshold',
      caption: 'Unix time counts seconds since January 1, 1970 UTC — a single increasing number shared across all time zones',
    },
    formulaDescription:
      'Unix time (also known as Epoch time or POSIX time) is a system for describing instants in time as the number of seconds that have elapsed since 00:00:00 Coordinated Universal Time (UTC) on Thursday, January 1, 1970, excluding leap seconds. This simple integer representation makes it easy to store, compare, and transmit timestamps across systems regardless of time zone.',
    variables: [
      {
        symbol: 'Unix Epoch',
        name: 'Unix Epoch Reference',
        description: 'The reference point for Unix time: January 1, 1970 at 00:00:00 UTC. All Unix timestamps count seconds from this moment.',
      },
      {
        symbol: 'Seconds',
        name: 'Unix Timestamp (Seconds)',
        description: 'The number of whole seconds elapsed since the Unix epoch. This is the standard representation used by most systems.',
      },
      {
        symbol: 'Milliseconds',
        name: 'Unix Timestamp (Milliseconds)',
        description: 'The number of milliseconds elapsed since the Unix epoch. JavaScript\'s Date.getTime() returns this value, which is 1000x the seconds value.',
      },
    ],
    howToUse: [
      'Select the conversion direction: Timestamp to Date or Date to Timestamp using the dropdown at the top.',
      'For timestamp to date: enter a Unix timestamp (seconds or milliseconds) and the converter will display the human-readable date in local time, UTC, and ISO 8601 formats.',
      'For date to timestamp: enter a date string in YYYY-MM-DD, ISO 8601, or any format parseable by the JavaScript Date constructor.',
      'View the converted result with time zone details, ISO 8601 representation, and millisecond precision in the results panel below the form.',
      'Use the copy button next to each result to quickly copy the converted value to your clipboard for use in code or configuration.',
    ],
    quickReference: [
      { label: 'Epoch start', value: '1970-01-01 00:00:00 UTC' },
      { label: 'Y2K38 threshold', value: '2038-01-19 03:14:07 UTC' },
      { label: 'Current timestamp', value: 'Math.floor(Date.now() / 1000)' },
      { label: 'Seconds vs ms check', value: '> 1e11 = milliseconds' },
    ],
    commonUses: [
      'Converting database timestamps to human-readable dates for debugging and analysis.',
      'Generating Unix timestamps for API requests and database records in backend services.',
      'Comparing time across different systems and time zones using a universal reference point.',
      'Working with log files that use epoch-based timestamps for event correlation and timeline analysis.',
    ],
    explanation:
      `Unix time is a fundamental concept in computing that provides a universal, timezone-independent way to represent moments in time. Invented in the late 1960s by Ken Thompson and Dennis Ritchie at Bell Labs for the Unix operating system, the epoch was chosen as January 1, 1970 for its convenience in that era of computing history. Unlike human-readable date formats that vary by locale and time zone, Unix time is always an integer that increases monotonically (ignoring leap seconds). The system was originally developed by the Unix team and has been adopted universally across programming languages, databases, file systems, and network protocols throughout computing history. One important consideration is the year 2038 problem (Y2K38): when using a signed 32-bit integer, Unix time will overflow on January 19, 2038. Modern systems use 64-bit integers or higher-level abstractions to avoid this issue. JavaScript's Date object uses milliseconds internally, so Date.now() returns milliseconds since epoch rather than seconds. When converting between systems, always verify whether timestamps are expected in seconds or milliseconds — a common source of bugs.`,
    faqs: [
      {
        question: 'What is the year 2038 problem (Y2K38)?',
        answer: 'The year 2038 problem is a time formatting bug where signed 32-bit integers storing Unix time will overflow on January 19, 2038 at 03:14:07 UTC. At this point, the value will wrap to a negative number, representing dates in 1901. Modern systems use 64-bit integers which avoid this problem for billions of years.',
      },
      {
        question: 'Why are there two versions of Unix timestamps (seconds vs milliseconds)?',
        answer: 'Unix was originally defined in seconds, and most POSIX systems use seconds. JavaScript uses milliseconds because its Date object needs higher precision for UI timing and animation. When converting between systems, always check which unit is expected — accidentally using milliseconds where seconds are expected will give a date far in the future.',
      },
      {
        question: 'What is the current Unix timestamp right now?',
        answer: 'The current Unix timestamp is the number of seconds that have elapsed since the Unix epoch (January 1, 1970 00:00:00 UTC). You can get the current timestamp in JavaScript with Math.floor(Date.now() / 1000), in Python with int(time.time()), or in the command line with date +%s on Linux/macOS. The value increases by exactly 1 per second.',
      },
      {
        question: 'How do I handle Unix timestamps in different programming languages?',
        answer: 'JavaScript: new Date(timestamp * 1000) for seconds, new Date(timestamp) for milliseconds. Python: datetime.fromtimestamp(timestamp) for local time. PHP: date("Y-m-d H:i:s", $timestamp). Java: new java.util.Date(timestamp * 1000). Go: time.Unix(timestamp, 0). Always verify whether the library expects seconds or milliseconds — confusing the two produces dates centuries off.',
      },
      {
        question: 'What are leap seconds and how do they affect Unix time?',
        answer: 'Leap seconds are occasional one-second adjustments to UTC to keep it synchronized with Earth\'s rotation. Unix time excludes leap seconds, so most systems handle them by either repeating the same timestamp or applying a step adjustment. As of 2024, 27 leap seconds have been inserted. For most applications this drift is negligible, but for precise astronomical timing, systems like TAI should be used instead.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A developer is debugging a production error log entry that shows timestamp 1715875200. They need to know exactly when the error occurred to correlate it with a deployment.',
        inputs: {
          'Mode': 'Timestamp to Date',
          'Unix Timestamp': '1715875200',
        },
        result: 'May 16, 2024 at 10:00:00 AM (local time) / Thu, 16 May 2024 14:00:00 GMT (UTC)',
        insight: 'The timestamp 1715875200 corresponds to 2024-05-16T14:00:00Z UTC. This is in seconds (not milliseconds) because the value is around 1.7 billion. If mistakenly treated as milliseconds, the result would be January 20, 1970 — clearly wrong. Always check magnitude: values around 1.5-2 billion are seconds; values around 1.5-2 trillion are milliseconds.',
      },
      {
        scenario: 'An API integration requires sending dates as Unix timestamps. The user needs to convert "July 4, 2026 at 12:00:00 UTC" to its Unix timestamp for the API request.',
        inputs: {
          'Mode': 'Date to Timestamp',
          'Date Input': '2026-07-04T12:00:00Z',
        },
        result: 'Unix Timestamp (seconds): 1782753600 / Unix Timestamp (milliseconds): 1782753600000',
        insight: 'The ISO 8601 date "2026-07-04T12:00:00Z" converts to Unix timestamp 1782753600 in seconds. The Z suffix explicitly marks UTC time, which is critical for accurate conversion. Without the Z, JavaScript\'s Date parser may interpret the string as local time, producing a different timestamp — a common pitfall in API integrations.',
      },
    ],
    proTips: [
      'Always validate the magnitude of a Unix timestamp before conversion. Values in the billions (1.5B-2B) are seconds; values in the trillions (1.5T-2T) are milliseconds. A timestamp of 17000 could be either seconds or milliseconds — context matters.',
      'When storing timestamps in databases, use 64-bit integers (BIGINT) rather than 32-bit integers (INT) to avoid the year 2038 problem. Most modern databases support 64-bit integers by default, but legacy schemas may still use INT.',
      'For API design, always document whether your timestamps are in seconds or milliseconds. The industry convention for REST APIs is seconds (aligned with POSIX), while JavaScript-heavy services often use milliseconds (aligned with Date.now()).',
      'Use ISO 8601 strings (e.g., "2026-07-04T12:00:00Z") when human readability matters in logs or config files. Unix timestamps are more compact for machine-to-machine communication, but ISO 8601 strings are self-documenting and timezone-explicit.',
      'When converting user-entered dates, always include a timezone. Without one, the conversion depends on the browser\'s or server\'s local timezone. Adding Z (UTC) or a UTC offset eliminates ambiguity.',
    ],
    limitations: [
      'The year 2038 problem: if you store Unix timestamps in a signed 32-bit integer, the maximum representable timestamp is 2,147,483,647 (January 19, 2038). Use 64-bit integers (BIGINT) to avoid this limit. When not to use 32-bit integers: any system expected to operate beyond 2038.',
      'JavaScript\'s Date object only supports millisecond precision. If you need microsecond or nanosecond precision, you must use BigInt values or a third-party library. The Date constructor rounds to the nearest millisecond.',
      'Unix timestamps do not account for leap seconds. Over time, this creates a growing discrepancy between Unix time and UTC (27 seconds as of 2024). When not to use Unix time: astronomical calculations, satellite navigation, or high-frequency trading systems.',
      'Not all dates are representable as Unix timestamps. Dates before January 1, 1970 produce negative timestamps. Dates before 1901 or after 2038 cannot be represented in 32-bit signed integers. When not to use for: historical dates before 1901 or far-future scheduling beyond 2038.',
    ],
    citations: [
      { title: 'Epoch Converter — Unix Timestamp Converter', url: 'https://www.epochconverter.com/' },
      { title: 'Wikipedia — Unix Time', url: 'https://en.wikipedia.org/wiki/Unix_time' },
    ],
  },
};

export default unixTimestampConfig;
