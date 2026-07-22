const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateULID(): string {
  const timestamp = Date.now();

  let ts = timestamp;
  const timeChars: string[] = [];
  for (let i = 0; i < 10; i++) {
    timeChars.unshift(CROCKFORD_BASE32[ts % 32]);
    ts = Math.trunc(ts / 32);
  }

  const randomChars: string[] = [];
  for (let i = 0; i < 16; i++) {
    randomChars.push(CROCKFORD_BASE32[Math.floor(Math.random() * 32)]);
  }

  return timeChars.join('') + randomChars.join('');
}

function generateIDs(format: string, count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    if (format === 'uuid') {
      ids.push(generateUUIDv4());
    } else if (format === 'ulid') {
      ids.push(generateULID());
    } else {
      ids.push(generateUUIDv4());
      ids.push(generateULID());
    }
  }
  return ids;
}

import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import UUIDPanel from './UUIDPanel';

const uuidGeneratorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'format',
      label: 'Format',
      type: 'select',
      helpText: 'Choose UUID v4, time-sortable ULID, or both',
      options: [
        { label: 'UUID v4', value: 'uuid' },
        { label: 'ULID', value: 'ulid' },
        { label: 'Both', value: 'both' },
      ],
      required: true,
    },
    {
      id: 'count',
      label: 'Number of IDs',
      type: 'number',
      min: 1,
      max: 50,
      step: 1,
      placeholder: '5',
      helpText: 'How many unique IDs to generate (max 50)',
    },
  ],
  calculate: (values: Record<string, string>) => {
    const format = values.format || 'uuid';
    const countStr = values.count || '';
    const count = countStr ? parseInt(countStr, 10) : 5;

    if (isNaN(count) || count < 1) {
      return [];
    }

    const clampedCount = Math.min(count, 50);
    const ids = generateIDs(format, clampedCount);

    return [
      {
        id: 'ids',
        label: 'Generated IDs',
        value: ids.join(', '),
        highlight: true,
      },
      {
        id: 'count',
        label: 'Number Generated',
        value: `${ids.length}`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(UUIDPanel, { values, results });
  },
  educational: {
    formula: 'UUID v4 = 128-bit random ID (36 chars) | ULID = 26-char Crockford base32 (timestamp + random)',
    diagram: {
      svg: '<svg viewBox="0 0 440 350" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="30" y="15" width="380" height="320" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1.5" rx="8"/><text x="220" y="42" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e293b)">UUID v4 vs ULID</text><rect x="50" y="60" width="310" height="50" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="205" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-2563eb)">UUID v4: 550e8400-e29b-41d4-a716-446655440000</text><text x="205" y="98" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">8-4-4-4-12 hex chars = 36 chars, 128 bits</text><rect x="50" y="130" width="310" height="50" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.5" rx="6"/><text x="205" y="150" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-d97706)">ULID: 01ARZ3NDEKTSV4RRFFQ69G5FAV</text><text x="205" y="168" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">10 char timestamp + 16 char random = 26 chars</text><line x1="205" y1="180" x2="205" y2="210" stroke="var(--svg-64748b)" stroke-width="1.5"/><polygon points="200,210 205,220 210,210" fill="var(--svg-64748b)"/><rect x="80" y="225" width="280" height="40" fill="var(--svg-22c55e)" rx="6"/><text x="220" y="250" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Universally Unique Identifier</text><rect x="80" y="275" width="280" height="40" fill="var(--svg-8b5cf6)" rx="6"/><text x="220" y="300" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Time-Sortable Unique ID</text></svg>',
      alt: 'Comparison diagram showing UUID v4 and ULID format structures side by side',
      caption: 'UUID v4 generates random 128-bit identifiers; ULID combines timestamp prefix with random suffix for time-sortable IDs',
    },
    formulaDescription:
      'UUID v4 (Universally Unique Identifier version 4) generates a 128-bit random identifier displayed as 36 hexadecimal characters in the format 8-4-4-4-12. ULID (Universally Unique Lexicographically Sortable Identifier) is a 26-character Crockford base32-encoded identifier where the first 10 characters encode a 48-bit millisecond timestamp and the last 16 characters are random, making ULIDs time-sortable.',
    variables: [
      {
        symbol: 'UUID v4',
        name: 'UUID Version 4',
        description: 'A 128-bit randomly generated identifier with 122 bits of randomness and 6 fixed variant/version bits. 5.3 x 10^36 possible values.',
      },
      {
        symbol: 'ULID',
        name: 'Universally Unique Lexicographically Sortable Identifier',
        description: 'A 26-character Crockford base32 encoded identifier with a 48-bit timestamp prefix and 80-bit random suffix. Sortable by creation time.',
      },
      {
        symbol: 'Crockford Base32',
        name: 'Crockford Base32 Encoding',
        description: 'An encoding scheme using 32 unambiguous characters (0-9, A-Z excluding I, L, O, U) to represent 5 bits per character. Used by ULID for compact, URL-safe representation.',
      },
      {
        symbol: 'Collision',
        name: 'Identifier Collision',
        description: 'The probability that two randomly generated identifiers are the same. UUID v4 collision probability is approximately 1 in 2^71 for 10^18 UUIDs generated.',
      },
    ],
    howToUse: [
      'Select the format: UUID v4, ULID, or Both to compare formats side by side.',
      'Enter the number of IDs to generate (1 to 50). Multiple IDs are separated by commas.',
      'Review the generated IDs and copy them for use in your application.',
      'UUID v4 IDs are fully random; ULIDs are prefixed with the current timestamp for time-sortable ordering.',
      'Generate multiple IDs in bulk for seeding databases or populating test data.',
    ],
    quickReference: [
      { label: 'UUID v4 Format', value: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx' },
      { label: 'ULID Format', value: 'TTTTTTTTTTRRRRRRRRRRRRRRRR (10T + 16R)' },
      { label: 'UUID v4 Entropy', value: '122 random bits (approx. 5.3 x 10^36 values)' },
    ],
    commonUses: [
      'Generating primary keys for database records that need to be unique across distributed systems.',
      'Creating unique session identifiers and API tokens for web applications.',
      'Generating order numbers and transaction IDs that need to be sortable by creation time (ULID).',
      'Producing unique identifiers for microservices communication where centralized ID generation is impractical.',
      'Populating test databases with realistic, unique identifier values for development and QA.',
    ],
    explanation:
      'Universally Unique Identifiers (UUIDs) and ULIDs serve the critical purpose of generating unique identifiers without requiring a central authority. UUID v4 is purely random: each of its 122 random bits (out of 128 total) is independently generated, making collisions astronomically unlikely. The version (4) and variant bits are fixed at positions 13 and 17 respectively. ULID was designed as a modern alternative that brings time-sortability to unique IDs: the first 10 characters encode a 48-bit millisecond timestamp using Crockford Base32, allowing ULIDs to be lexicographically sorted by creation time. This makes ULIDs particularly useful for database indexing where B-tree performance benefits from insertion-time ordering. ULIDs use Crockford Base32 encoding which excludes ambiguous characters (I, L, O, U) for human readability and case-insensitive processing. Both UUID v4 and ULID are 128-bit identifiers, but ULID is more compact at 26 characters vs 36 characters for UUID v4. The timestamp prefix in ULID provides approximately 1 millisecond precision and will not overflow until the year 10889.',
    faqs: [
      {
        question: 'When should I use UUID v4 vs ULID?',
        answer: 'Use UUID v4 when you need purely random identifiers with no timing information, such as security tokens or when you want to avoid leaking creation times. Use ULID when you want time-sortable identifiers for database indexing — ULIDs maintain insertion order which improves B-tree performance in databases like PostgreSQL and MySQL.',
      },
      {
        question: 'How unique are UUID v4 and ULID in practice?',
        answer: 'UUID v4 has 122 random bits, giving approximately 5.3 x 10^36 possible values. The chance of a collision after generating 10^18 UUIDs is about 1 in 2 x 10^15. ULID has 80 random bits (about 1.2 x 10^24 values per millisecond). For practical purposes, both are effectively unique, especially when combined with uniqueness constraints in your database.',
      },
      {
        question: 'Can ULIDs be decoded to extract the timestamp?',
        answer: 'Yes, the first 10 characters of a ULID encode the creation timestamp in Crockford Base32. You can decode these characters to get the millisecond-precision Unix timestamp. This makes ULIDs self-documenting — you can tell when an ID was created without querying the database.',
      },
      {
        question: 'Why does ULID exclude certain characters from its alphabet?',
        answer: 'ULID uses Crockford Base32 which intentionally excludes the letters I, L, O, and U to avoid confusion with digits 1, 0, and V. This makes ULIDs easier for humans to read, type, and communicate verbally without ambiguity.',
      },
      {
        question: 'Are ULIDs case-sensitive?',
        answer: 'Crockford Base32 is case-insensitive: lowercase letters are normalized to uppercase during decoding. ULID generation typically uses uppercase, but the spec requires decoders to accept both cases. Unlike Base64, the encoding is designed to be transmitted and handled in the same way as uppercase strings.',
      },
    ],
    citations: [
      { title: 'RFC 4122 — A Universally Unique IDentifier (UUID) URN Namespace', url: 'https://tools.ietf.org/html/rfc4122' },
      { title: 'ULID Spec — GitHub', url: 'https://github.com/ulid/spec' },
    ],
  },
};

export default uuidGeneratorConfig;
