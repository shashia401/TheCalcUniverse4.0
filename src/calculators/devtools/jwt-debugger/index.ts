import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import JwtDebuggerPanel from './JwtDebuggerPanel';

function base64UrlDecode(str: string): string {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with = signs
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  try {
    const decoded = atob(base64);
    // Check if the decoded output is valid UTF-8
    try {
      return decodeURIComponent(
        decoded
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      // If UTF-8 decoding fails, return raw binary string
      return decoded;
    }
  } catch {
    return '';
  }
}

function isValidBase64Url(str: string): boolean {
  return /^[A-Za-z0-9\-_]+$/.test(str);
}

function formatJson(str: string): string {
  try {
    const parsed = JSON.parse(str);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return str;
  }
}

const jwtDebuggerConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'token',
      label: 'JWT Token',
      type: 'text',
      inputMode: 'text',
      required: true,
      placeholder: 'Paste your JWT token here...',
      helpText: 'Paste a complete JWT with three dot-separated segments',
    },
  ],
  calculate: (values) => {
    const token = (values.token || '').trim();
    if (!token) return [];

    const parts = token.split('.');
    if (parts.length !== 3) {
      return [
        {
          id: 'isValid',
          label: 'Validation',
          value: 'Invalid JWT format: token must have exactly 3 parts separated by dots',
          color: 'negative',
        },
        {
          id: 'header',
          label: 'Header',
          value: 'N/A',
        },
        {
          id: 'payload',
          label: 'Payload',
          value: 'N/A',
        },
        {
          id: 'signature',
          label: 'Signature',
          value: 'N/A',
        },
      ];
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    if (!isValidBase64Url(headerB64) || !isValidBase64Url(payloadB64) || !isValidBase64Url(signatureB64)) {
      return [
        {
          id: 'isValid',
          label: 'Validation',
          value: 'Invalid JWT format: parts contain invalid base64url characters',
          color: 'negative',
        },
        {
          id: 'header',
          label: 'Header',
          value: 'N/A',
        },
        {
          id: 'payload',
          label: 'Payload',
          value: 'N/A',
        },
        {
          id: 'signature',
          label: 'Signature',
          value: 'N/A',
        },
      ];
    }

    const decodedHeader = base64UrlDecode(headerB64);
    const decodedPayload = base64UrlDecode(payloadB64);

    if (!decodedHeader || !decodedPayload) {
      return [
        {
          id: 'isValid',
          label: 'Validation',
          value: 'Invalid JWT format: could not decode base64url content',
          color: 'negative',
        },
        {
          id: 'header',
          label: 'Header',
          value: 'N/A',
        },
        {
          id: 'payload',
          label: 'Payload',
          value: 'N/A',
        },
        {
          id: 'signature',
          label: 'Signature',
          value: 'N/A',
        },
      ];
    }

    const formattedHeader = formatJson(decodedHeader);
    const formattedPayload = formatJson(decodedPayload);
    const truncatedSignature = signatureB64.length > 20
      ? signatureB64.substring(0, 20) + '...'
      : signatureB64;

    return [
      {
        id: 'isValid',
        label: 'Validation',
        value: 'Valid JWT format',
        color: 'positive',
      },
      {
        id: 'header',
        label: 'Header',
        value: formattedHeader,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'payload',
        label: 'Payload',
        value: formattedPayload,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'signature',
        label: 'Signature',
        value: truncatedSignature,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(JwtDebuggerPanel, { values, results });
  },
  educational: {
    formula:
      'JWT = Base64Url(Header) + "." + Base64Url(Payload) + "." + Signature\nHeader: {"alg": "HS256", "typ": "JWT"}\nPayload: {"sub": "123", "iat": 1516239022}',
    diagram: {
      svg: '<svg viewBox="0 0 500 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="10" y="10" width="480" height="285" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="8"/><text x="250" y="35" text-anchor="middle" font-size="14" fill="var(--svg-1e293b)" font-weight="bold">JWT Token Structure: header.payload.signature</text><rect x="30" y="55" width="140" height="90" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="6"/><text x="100" y="80" text-anchor="middle" font-size="13" fill="var(--svg-1e293b)" font-weight="bold">Header</text><text x="100" y="98" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">{"alg":"HS256"}</text><text x="100" y="113" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">{"typ":"JWT"}</text><text x="100" y="135" text-anchor="middle" font-size="10" fill="var(--svg-2563eb)">Algorithm &amp; Type</text><rect x="195" y="55" width="140" height="90" fill="var(--svg-d1fae5)" stroke="var(--svg-22c55e)" stroke-width="2" rx="6"/><text x="265" y="80" text-anchor="middle" font-size="13" fill="var(--svg-1e293b)" font-weight="bold">Payload</text><text x="265" y="98" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">{"sub":"123456"}</text><text x="265" y="113" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">{"name":"John"}</text><text x="265" y="135" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)">Claims (Data)</text><rect x="360" y="55" width="120" height="90" fill="var(--svg-fce7f3)" stroke="var(--svg-ef4444)" stroke-width="2" rx="6"/><text x="420" y="80" text-anchor="middle" font-size="13" fill="var(--svg-1e293b)" font-weight="bold">Signature</text><text x="420" y="100" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">HMACSHA256(</text><text x="420" y="115" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">base64Url(header)</text><text x="420" y="130" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">+ "." + payload)</text><text x="420" y="145" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)" rx="6">Verification</text><text x="100" y="165" text-anchor="middle" font-size="16" fill="var(--svg-94a3b8)">.</text><text x="265" y="165" text-anchor="middle" font-size="16" fill="var(--svg-94a3b8)">.</text><line x1="100" y1="175" x2="100" y2="195" stroke="var(--svg-3b82f6)" stroke-width="1" stroke-dasharray="4,2"/><line x1="265" y1="175" x2="265" y2="195" stroke="var(--svg-22c55e)" stroke-width="1" stroke-dasharray="4,2"/><line x1="420" y1="175" x2="420" y2="195" stroke="var(--svg-ef4444)" stroke-width="1" stroke-dasharray="4,2"/><text x="100" y="210" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)">eyJhbGciOiJI</text><text x="100" y="225" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)">UzI1NiJ9</text><text x="265" y="210" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)">eyJzdWIiOiIx</text><text x="265" y="225" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)">MjM0NTYifQ</text><text x="420" y="210" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">SflKxwRJSMeK</text><text x="420" y="225" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">KFPT0</text><rect x="30" y="250" width="440" height="30" fill="var(--svg-f8fafc)" stroke="var(--svg-3b82f6)" stroke-width="1" rx="4"/><text x="250" y="270" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiIxMjM0NTYifQ . SflKxwRJSMeKKF2PT0</text></svg>',
      alt: 'JWT token structure diagram showing the three parts: header (blue), payload (green), and signature (red) separated by dots',
      caption: 'JSON Web Token structure with three base64url-encoded segments separated by dots',
    },
    formulaDescription:
      'A JSON Web Token (JWT) is a compact, URL-safe token format consisting of three base64url-encoded segments separated by dots: a header containing the signing algorithm and token type, a payload containing claims (data), and a cryptographic signature that verifies the token integrity. The signature is created by signing the encoded header and payload with a secret key.',
    variables: [
      {
        symbol: 'Header',
        name: 'JWT Header',
        description: 'JSON object containing metadata about the token, typically including the signing algorithm (alg) and token type (typ). Common algorithms: HS256, RS256, ES256.',
      },
      {
        symbol: 'Payload',
        name: 'JWT Payload (Claims)',
        description: 'JSON object containing the claims — statements about the user or entity. Includes registered claims (iss, sub, exp, iat), public claims, and private claims.',
      },
      {
        symbol: 'Signature',
        name: 'JWT Signature',
        description: 'Cryptographic hash of the encoded header and payload combined with a secret key. Verifies that the token was not tampered with and, for HS algorithms, confirms the issuer knows the secret.',
      },
      {
        symbol: 'Base64URL',
        name: 'Base64URL Encoding',
        description: 'A URL-safe variant of base64 encoding that uses "-" instead of "+", "_" instead of "/", and omits padding "=" characters. Used to make JWT tokens safe for HTTP headers and URLs.',
      },
      {
        symbol: 'Claims',
        name: 'Registered Claims',
        description: 'Standardized JWT claim names: iss (issuer), sub (subject), aud (audience), exp (expiration), nbf (not before), iat (issued at), jti (JWT ID). These provide interoperability between systems.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Inspecting an OAuth2 access token to check expiration time',
        inputs: { token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0xMjMifQ.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmV4YW1wbGUuY29tIiwiYXVkIjoiYXBpLmV4YW1wbGUuY29tIiwiZXhwIjoxOTkyNTkyODAwLCJpYXQiOjE5OTI1OTEwMDAsInNjb3BlIjoicmVhZDpwcm9maWxlIHdyaXRlOnBvc3RzIn0.dGVzdC1zaWduYXR1cmU' },
        result: 'Valid JWT format — Header: RS256 algorithm, Payload: user@example.com with read/write scope, expiring at Unix timestamp 1992592800',
        insight: 'Paste any JWT into the debugger and look at the payload. The "exp" claim (Unix timestamp) tells you exactly when the token expires. The "iat" claim shows when it was issued. The "aud" claim should match the API you are calling — if it says "api.example.com" but you are calling "other-api.com", the token will be rejected. The "scope" claim reveals what permissions the token grants. This is the fastest way to debug "401 Unauthorized" errors in OAuth2 flows.',
      },
      {
        scenario: 'Checking if a JWT uses a secure signing algorithm',
        inputs: { token: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' },
        result: 'Valid JWT format (but algorithm "none" indicates no cryptographic signature — DO NOT accept in production)',
        insight: 'Look at the decoded header\'s "alg" field. If it says "none" (as in this example), the token has NO signature and should NEVER be accepted by a server — this is the infamous "alg:none" attack. Valid algorithms include HS256, HS384, HS512 (symmetric/HMAC) and RS256, RS384, RS512, ES256, ES384, ES512 (asymmetric). If you see "none", "NONE", or "None" in production tokens, your JWT library is misconfigured and vulnerable.',
      },
      {
        scenario: 'Verifying a rarely-seen custom claim in a vendor API token',
        inputs: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInRlbmFudF9pZCI6InRlbmFudC1hYmMxMjMiLCJyb2xlIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXSwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5OTI1OTI4MDB9.dGVzdC1zaWduYXR1cmUtZm9yLWRlbW9uc3RyYXRpb24' },
        result: 'Valid JWT format — Payload contains custom claims: tenant_id=tenant-abc123, role=admin, permissions=[read,write,delete]',
        insight: 'Beyond standard claims (sub, iss, aud, exp, iat), many vendors add custom claims like "tenant_id", "role", "permissions", or "org_id". The JWT debugger shows ALL claims in the payload, even non-standard ones. This is critical when integrating with third-party APIs that embed routing or authorization data in the JWT — you can see exactly what the vendor expects your system to consume.',
      },
    ],
    proTips: [
      'Always validate the "alg" field against an allowed list on the server. Never trust the token\'s own algorithm claim without verification. This prevents algorithm confusion attacks where an attacker changes RS256 to HS256.',
      'Check the "exp" (expiration) claim in human-readable form. A Unix timestamp like 1992592800 corresponds to a specific date. Many "auth errors" in production are simply expired tokens — check exp first before debugging anything else.',
      'Be cautious with sensitive data in JWT payloads. The payload is base64url-encoded (not encrypted), so anyone with the token can read it. Never put passwords, credit card numbers, or PII in JWT claims. Use opaque tokens or JWE (JSON Web Encryption) for confidential payloads.',
      'Set short expiration times for access tokens (15-60 minutes) and use refresh tokens for longer sessions. This limits the damage if an access token is leaked. Rotate signing keys regularly, especially for RS256/ES256 where the public key might be widely distributed.',
      'Always transmit JWTs over HTTPS. A JWT sent over plain HTTP can be intercepted and replayed by anyone on the network. Add the "jti" (JWT ID) claim to enable token revocation — without it, you cannot invalidate a specific token before it expires.',
    ],
    limitations: [
      'This tool decodes and inspects JWT structure only. It does NOT perform cryptographic signature verification — that requires the secret key (for HMAC) or public key (for RSA/ECDSA). A token that "passes" validation here may still be cryptographically invalid or tampered.',
      'The tool does not check token expiration (exp claim) against the current time — it displays the raw value for you to interpret. It does not detect if the token has been revoked.',
      'For JWE (JSON Web Encryption) tokens, the payload cannot be decoded without the decryption key — this tool only handles unencrypted JWS (JSON Web Signature) tokens.',
      'Always use server-side JWT libraries with proper key management for production authentication.',
    ],
    howToUse: [
      'Copy your JWT token from your application, authentication provider, or API response.',
      'Paste the complete JWT token (all three dot-separated segments) into the input field.',
      'Review the decoded header to see the signing algorithm and token type used.',
      'Examine the decoded payload to inspect all claims, including expiration (exp) and issuer (iss).',
      'Check the signature segment and validation status to confirm the token has the correct structure.',
    ],
    quickReference: [
      { label: 'HS256 (HMAC + SHA-256)', value: 'Symmetric signing — same secret for sign and verify. Fast but requires shared secret.' },
      { label: 'RS256 (RSA + SHA-256)', value: 'Asymmetric signing — private key signs, public key verifies. No shared secret needed.' },
      { label: 'exp claim', value: 'Expiration time (Unix timestamp). Tokens should not be accepted after this time.' },
      { label: 'iat claim', value: 'Issued-at time (Unix timestamp). When the token was created.' },
    ],
    commonUses: [
      'Authenticating users in single-page applications and mobile apps via bearer tokens',
      'Securing API-to-API communication with signed tokens that verify the caller identity',
      'Implementing stateless session management where the server does not store session data',
      'Exchanging identity information between services in microservice and OAuth2/OIDC architectures',
      'Creating secure password reset links and email verification tokens with expiration',
    ],
    explanation:
      'JSON Web Tokens (JWT) have become the de facto standard for authentication and information exchange in modern web applications and API-driven architectures. A JWT is composed of three parts, each base64url-encoded and separated by a dot character. The header typically specifies the signing algorithm (e.g., HS256 for HMAC with SHA-256, or RS256 for RSA with SHA-256) and the token type ("JWT"). The payload contains claims — statements about the entity (usually a user) and additional metadata. Registered claims like "exp" (expiration time), "iat" (issued at), "sub" (subject), and "iss" (issuer) provide standardized fields that any JWT-compliant system can understand. The signature is the most critical part for security. For HMAC-based algorithms (HS256), the signature is computed by taking the base64url-encoded header and payload separated by a dot, and signing them with a shared secret key. For RSA-based algorithms (RS256), a private key is used for signing and a public key for verification. The signature ensures the token has not been tampered with and, for HS algorithms, proves that the signer knows the shared secret. JWTs are commonly used in OAuth2 and OpenID Connect flows, where an authorization server issues a token to a client application after successful authentication. The client then presents this token to APIs, which verify the token\'s signature and check its claims before granting access. One critical security consideration is that JWTs should always be transmitted over HTTPS and should have short expiration times (typically 15-60 minutes for access tokens). The token payload is base64-encoded, not encrypted — anyone who intercepts the token can decode and read the payload contents, so sensitive data should never be placed in the payload without additional encryption. JWTs are also a common attack vector for vulnerabilities like algorithm confusion attacks, where an attacker changes the "alg" header to "none" to bypass signature verification.',
    faqs: [
      {
        question: 'Does the JWT Debugger verify the signature?',
        answer: 'No, this tool only decodes and inspects the JWT structure. It does not verify the cryptographic signature, which requires the secret key (for HMAC) or public key (for RSA). Signature verification must be done server-side with the appropriate key material.',
      },
      {
        question: 'What is the algorithm confusion attack?',
        answer: 'An attacker modifies the JWT header to change the "alg" field from a public-key algorithm like RS256 to a symmetric algorithm like HS256. If the server\'s verification code does not enforce the expected algorithm, the attacker can sign the token using the public key (which is often publicly available) as the HMAC secret. Always validate the algorithm against an expected allowlist.',
      },
      {
        question: 'Is JWT payload data encrypted?',
        answer: 'No, JWT payloads are base64url-encoded, not encrypted. Anyone with access to the token can decode and read the payload. Do not put sensitive information like passwords, credit card numbers, or personal health data in a JWT payload. For confidentiality, use JWE (JSON Web Encryption) which encrypts the payload.',
      },
      {
        question: 'What is the maximum size of a JWT?',
        answer: 'JWTs can theoretically be any size, but in practice they should be kept under 8KB or even 4KB. Many HTTP servers and proxies have header size limits (e.g., NGINX defaults to 8KB for headers). Since JWTs are typically sent in the Authorization header, exceeding header size limits will cause requests to fail.',
      },
      {
        question: 'What happens when a JWT expires?',
        answer: 'The "exp" claim contains a Unix timestamp after which the token should not be accepted. The verifying server checks this timestamp and rejects expired tokens with a 401 Unauthorized response. Clients must then obtain a new token, typically using a refresh token in OAuth2 flows.',
      },
    ],
    citations: [
      { title: 'RFC 7519 — JSON Web Token (JWT)', url: 'https://datatracker.ietf.org/doc/html/rfc7519' },
      { title: 'JWT.io — JSON Web Token Debugger', url: 'https://jwt.io/' },
    ],
  },
};

export default jwtDebuggerConfig;
