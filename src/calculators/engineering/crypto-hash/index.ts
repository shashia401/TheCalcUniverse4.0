import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CryptoHashPanel from './CryptoHashPanel';
import { computeHash } from './hashUtils';

const cryptoHashConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'inputText',
      label: 'Input Text',
      type: 'text',
      inputMode: 'text',
      placeholder: 'Enter text to hash...',
      helpText: 'Type or paste the text you want to hash',
    },
    {
      id: 'algorithm',
      label: 'Hash Algorithm',
      type: 'select',
      required: true,
      helpText: 'SHA-256 is the standard. MD5 and SHA-1 are shown for compatibility only.',
      options: [
        { label: 'SHA-256', value: 'sha-256' },
        { label: 'MD5', value: 'md5' },
        { label: 'SHA-1', value: 'sha-1' },
        { label: 'SHA-384', value: 'sha-384' },
        { label: 'SHA-512', value: 'sha-512' },
        { label: 'Keccak-256 (SHA3-256)', value: 'keccak-256' },
      ],
    },
  ],
  calculate: (values) => {
    const inputText = values.inputText ?? '';
    const algorithm = values.algorithm || 'sha-256';

    // Only bail if inputText key is missing entirely (not provided).
    // Empty string hashing is a valid cryptographic operation.
    if (!(values.inputText?.length >= 0)) return [];

    const result = computeHash(algorithm, inputText);
    const inputPreview = inputText.length > 50 ? inputText.substring(0, 50) + '...' : inputText;

    return [
      { id: 'hash', label: `${result.algorithm} Hash`, value: result.hash, highlight: true },
      { id: 'inputLength', label: 'Input Length', value: `${inputText.length} characters`, color: 'neutral' },
      { id: 'hashLength', label: 'Hash Length', value: `${(result.hash.length / 2)} bytes`, color: 'neutral' },
      { id: 'hashBytes', label: 'Hash Size', value: `${result.hash.length * 4} bits`, color: 'neutral' },
      { id: 'algorithm', label: 'Algorithm', value: result.algorithm },
      { id: 'inputPreview', label: 'Input Preview', value: inputPreview, color: 'neutral' },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CryptoHashPanel, { values, results });
  },
  educational: {
    formula: 'Hash = H(message) | H is a one-way cryptographic function with fixed output size',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="130" width="120" height="60" fill="var(--svg-3b82f6)" rx="8"/><text x="100" y="158" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Input</text><text x="100" y="175" text-anchor="middle" font-size="11" fill="var(--svg-bfdbfe)">"Hello"</text><line x1="160" y1="160" x2="200" y2="160" stroke="var(--svg-666666)" stroke-width="2"/><polygon points="200,155 210,160 200,165" fill="var(--svg-666666)"/><rect x="215" y="115" width="190" height="90" fill="var(--svg-8b5cf6)" rx="8"/><text x="310" y="148" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Hash Function</text><text x="310" y="165" text-anchor="middle" font-size="11" fill="var(--svg-ddd6fe)">SHA-256</text><text x="310" y="182" text-anchor="middle" font-size="11" fill="var(--svg-ddd6fe)">One-way</text><line x1="310" y1="205" x2="310" y2="230" stroke="var(--svg-666666)" stroke-width="2"/><polygon points="305,230 310,240 315,230" fill="var(--svg-666666)"/><rect x="250" y="245" width="120" height="40" fill="var(--svg-22c55e)" rx="8"/><text x="310" y="270" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Fixed Output</text></svg>',
      alt: 'Flow diagram showing input data passing through a hash function to produce a fixed-size output',
      caption: 'Cryptographic hash — one-way function from arbitrary input to fixed-size digest',
    },
    formulaDescription:
      'A cryptographic hash function maps input data of arbitrary size to a fixed-size output (the hash/digest). Hashing is a one-way operation: you cannot reverse a hash to recover the original input. Small changes in input produce dramatically different hashes (avalanche effect).',
    variables: [
      { symbol: 'SHA-256', name: 'Secure Hash Algorithm 256-bit', description: 'NIST-standard 256-bit hash. Used in Bitcoin, TLS, and file integrity verification. Outputs 32 bytes (64 hex chars).' },
      { symbol: 'MD5', name: 'Message Digest 5', description: '128-bit hash. Fast but cryptographically broken — vulnerable to collision attacks. Do not use for security. Still used for checksums.' },
      { symbol: 'SHA-1', name: 'Secure Hash Algorithm 1', description: '160-bit hash. Deprecated after SHAttered collision attack in 2017. Being phased out of TLS certificates.' },
      { symbol: 'SHA-512', name: 'Secure Hash Algorithm 512-bit', description: '256-bit security level. Outputs 64 bytes (128 hex chars). Used in high-security applications.' },
      { symbol: 'Keccak-256', name: 'Keccak (SHA-3) 256-bit', description: 'SHA-3 winner. Uses sponge construction instead of Merkle-Damgard. Different internals than SHA-2.' },
    ],
    howToUse: [
      'Type or paste text into the input field.',
      'Select a hash algorithm from the dropdown.',
      'The hash is computed instantly in your browser — no data is sent to any server.',
      'Compare hashes across algorithms to see different output sizes.',
      'Try changing one character in the input to see the avalanche effect.',
    ],
    explanation:
      'Cryptographic hashing is a fundamental building block of modern security. Unlike encryption, hashing is one-way: you cannot "decrypt" a hash. This makes hashes ideal for password storage (systems store hashes, not passwords), file integrity verification (compare checksums), digital signatures, and blockchain technology. The avalanche effect means changing even one bit of input flips approximately 50% of output bits. SHA-256 is currently the most widely deployed secure hash; MD5 and SHA-1 should not be used for security purposes as they are vulnerable to collision attacks where two different inputs produce the same hash.',
    commonUses: [
      'Verifying file integrity by computing and comparing SHA-256 checksums after downloading software, firmware, or data archives',
      'Understanding how cryptographic hashing works for password storage, digital signatures, and blockchain applications',
      'Comparing hash algorithms such as SHA-256, MD5, and SHA-512 to understand output sizes and security properties for different use cases',
      'Demonstrating the avalanche effect by observing how small input changes produce completely different hash outputs',
    ],
    quickReference: [
      { label: 'SHA-256 (32 bytes / 256 bits)', value: 'NIST standard. Used in Bitcoin, TLS 1.3, file integrity. Output: 64 hex chars.' },
      { label: 'MD5 (16 bytes / 128 bits)', value: 'Broken — collisions found. Use only for non-security checksums. Output: 32 hex chars.' },
      { label: 'SHA-1 (20 bytes / 160 bits)', value: 'Deprecated — SHAttered collision (2017). Phased out of TLS. Output: 40 hex chars.' },
      { label: 'SHA-512 (64 bytes / 512 bits)', value: 'High-security variant. Used in PGP, DNSSEC. Output: 128 hex chars.' },
      { label: 'Keccak-256 (32 bytes)', value: 'SHA-3 winner. Sponge construction. Different internals than SHA-2 family.' },
      { label: 'SHA-384 (48 bytes / 384 bits)', value: 'Truncated SHA-512. Used where 256-bit security margin needed. Output: 96 hex chars.' },
    ],
    workedExamples: [
      {
        scenario: 'Verifying a downloaded file with SHA-256',
        inputs: { inputText: 'The quick brown fox jumps over the lazy dog', algorithm: 'sha-256' },
        result: 'SHA-256 hash: d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592.',
        insight: 'This pangram is a standard test vector. The SHA-256 hash is d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592. After downloading a file, compute its SHA-256 and compare with the publisher\'s published hash — if they differ even by one character, the file was corrupted or tampered with.',
      },
      {
        scenario: 'Demonstrating the avalanche effect',
        inputs: { inputText: 'password123', algorithm: 'sha-256' },
        result: 'SHA-256 hash of "password123": ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f.',
        insight: 'Try changing one character from "password123" to "Password123" (uppercase P). Despite the tiny change, the SHA-256 hashes are completely unrecognizable. The avalanche effect ensures no attacker can predict the output from partial changes, preventing hash-based password guessing.',
      },
      {
        scenario: 'Checking a password against a stored hash (non-reversible)',
        inputs: { inputText: 'mySecretP@ss1', algorithm: 'sha-256' },
        result: 'SHA-256 hash generated. Stored hashes cannot be reversed to recover the original password.',
        insight: 'Secure systems store hashes, not passwords. When you log in, the system hashes what you typed and compares it to the stored hash. If they match, you entered the right password. This calculator shows you exactly what a server would store — without any way to reverse the hash back to the password.',
      },
      {
        scenario: 'Generating a content-based cache key',
        inputs: { inputText: '{"name":"Alice","age":30,"city":"New York"}', algorithm: 'md5' },
        result: 'MD5 hash generated as a compact 32-character hex digest for cache invalidation.',
        insight: 'Quick hash for cache invalidation. MD5 is fast and produces a short 32-char key. If the JSON object changes, the MD5 changes entirely — useful for detecting stale cached data in web apps. For security-sensitive hashing, use SHA-256 instead.',
      },
    ],
    proTips: [
      'Use SHA-256 for all new projects. It has no known practical vulnerabilities and is the most widely supported secure hash algorithm across platforms and languages.',
      'For password storage, never hash alone — use a key-derivation function like bcrypt, Argon2, or PBKDF2 with a random salt. Hashing alone is vulnerable to rainbow table attacks.',
      'When verifying file downloads, always check the hash from the official website (not from a forum post). Attackers have been known to replace both the file and the posted hash on compromised sites.',
      'The Web Crypto API used by this calculator runs entirely in your browser. No data is sent to any server — you can verify this by disconnecting from the internet and still generating hashes.',
      'For blockchain and Merkle tree applications, double-SHA-256 (SHA-256 of SHA-256) is standard. Bitcoin uses this two-round approach to protect against length-extension attacks.',
    ],
    limitations: [
      'This calculator performs hashing entirely in the browser using the Web Crypto API (SubtleCrypto). It does NOT perform keyed hashing (HMAC) or password-based key derivation (PBKDF2/bcrypt/Argon2).',
      'MD5 and SHA-1 are included for educational and compatibility purposes only — both are cryptographically broken and should never be used for security-sensitive applications.',
      'The calculator does not detect hash type (you cannot paste a hash to identify the algorithm). For production password storage, use a proper key-derivation function with a random salt, not plain hashing.',
    ],
    faqs: [
      {
        question: 'What is the difference between hashing and encryption?',
        answer: 'Hashing is one-way: you cannot reverse a hash to get the original input. Encryption is two-way: encrypted data can be decrypted with the correct key. Hashing produces a fixed-size output regardless of input size; encryption output size varies with input size. Hashes are deterministic (same input always produces same hash).',
      },
      {
        question: 'Why is MD5 considered broken?',
        answer: 'MD5 is vulnerable to collision attacks — it is computationally feasible to find two different inputs that produce the same MD5 hash (first demonstrated in 2004). This breaks the collision resistance property. MD5 should not be used for security-sensitive applications, though it remains acceptable for non-security checksums.',
      },
      {
        question: 'What is the avalanche effect?',
        answer: 'A desirable property of cryptographic hash functions where a small change in input (e.g., changing one bit) causes approximately half the output bits to change. This makes it impossible to predict how changing the input will affect the output, which is crucial for security. Try it here: hash "hello" and "Hello" and see how completely different the outputs are.',
      },
      {
        question: 'Can I reverse a hash to get the original input?',
        answer: 'No, that is mathematically impossible by design. Hash functions are one-way operations — they are deliberately constructed to lose information. Given a SHA-256 hash like e3b0c44..., there is no algorithm to compute what input produced it. The only attack is brute-force: trying every possible input until one matches. For a strong hash with a long random input, this is computationally infeasible.',
      },
      {
        question: 'What is the difference between SHA-256 and SHA3-256?',
        answer: 'Despite the similar naming, they are completely different hash functions with different internal designs. SHA-256 uses the Merkle-Damgard construction with the Davies-Meyer compression function. SHA3-256 (Keccak) uses a sponge construction. SHA-3 was selected through an open NIST competition after concerns about SHA-2 emerged. Both are considered secure as of 2026, but SHA-3 offers a structurally different backup in case weaknesses are ever found in the SHA-2 family.',
      },
      {
        question: 'Why does SHA-512 produce 128 hex characters when it says 512 bits?',
        answer: 'Each byte (8 bits) is represented by 2 hex characters. SHA-512 produces 512 bits (64 bytes), so the hex representation is 64 x 2 = 128 characters. Similarly, SHA-256 produces 256 bits (32 bytes), which is 64 hex characters. The hex output is always exactly twice the byte length.',
      },
      {
        question: 'What is a collision attack and why is it dangerous?',
        answer: 'A collision attack occurs when an attacker can find two different inputs that produce the same hash output. This is dangerous because it means a malicious file could have the same hash as a legitimate one. Digital signatures and certificates rely on collision resistance — if an attacker can create a fake certificate that hashes the same as a real one, they can impersonate any website. MD5 collisions can be computed in seconds on a laptop; SHA-1 collisions were demonstrated in 2017 using Google\'s computing power. No practical collision attack is known against SHA-256 or SHA-3 as of 2026.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Cryptographic Hash Function', url: 'https://en.wikipedia.org/wiki/Cryptographic_hash_function' },
      { source: 'Wolfram MathWorld', title: 'Hash Function', url: 'https://mathworld.wolfram.com/HashFunction.html' },
      { source: 'NIST FIPS 180-4', title: 'Secure Hash Standard (SHS)', url: 'https://csrc.nist.gov/publications/detail/fips/180/4/final' },
    ],
  },
};

export default cryptoHashConfig;
