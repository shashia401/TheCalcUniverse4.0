# ADR-002: Calculation API + MCP endpoint (post-launch)

**Status:** Accepted (decision recorded; implementation deferred to post-launch)
**Date:** 2026-07-21 · **Deciders:** shashi (owner), with Claude analysis
**Supersedes/relates to:** ADR-001 (static-only architecture)

## Context

ADR-001 chose a **static-only** architecture (no server runtime) for security and cost.
Separately, the roadmap identifies "be the engine AI cites and calls" as the highest-
leverage, least-copied differentiator (Workstream B). Two levels exist:

- **B1 — static data JSON** (`/data/**.json`): machine-readable calculator metadata.
  Pure static, no backend. **Already shipped** — does not need this ADR.
- **B2/B3 — a live calculation API + MCP endpoint**: `POST /api/calc/{id}` runs a
  calculator's `calculate()` on caller-supplied inputs and returns results; the MCP
  variant exposes calculators as callable tools. This **requires a server runtime**,
  which breaks the static-only decision of ADR-001. Hence this ADR.

## Decision

Build B2/B3 **after launch**, on **Cloudflare Pages Functions** (same host as the
static site), as a deliberate, scoped exception to static-only:

- `functions/api/calc/[id].ts` — imports the same calculator config modules, calls
  `calculate(inputs)`, returns JSON. **Read-only. No database. No auth. No secrets.**
- Rate-limited at the Cloudflare edge. CORS open (it is public math).
- MCP manifest generated at build time from the registry (each calculator → one tool
  with an input schema derived from `config.inputs`).

## Threat model + mitigations (the reason this is an ADR)

| Risk | Mitigation |
|---|---|
| Abusive input / DoS | Edge rate limiting; pure functions with no I/O; hard caps on input size |
| Code execution via input | Inputs are strings parsed by the same `calculate()` the site already runs client-side; no `eval`, no dynamic import of user data |
| Data exposure | No database, no user data, no secrets exist to expose |
| Supply chain | Same lockfile/`npm audit` gate as the site |
| Cost blowout | Cloudflare Functions free tier + rate limits; static site unaffected if the function is disabled |

The net new attack surface is **one stateless, read-only compute endpoint**. That is a
real but small and well-bounded cost, justified by making TheCalcUniverse the
deterministic calculator that AI assistants call instead of hallucinating.

## Consequences

- (+) Turns "people just use AI" from a threat into distribution; novel positioning.
- (+) Reuses every `calculate()` unchanged — thin handler, low maintenance.
- (−) Introduces a server runtime (first one) — CI must add function tests + an
  endpoint smoke test; the security posture is no longer "zero runtime".
- (−) Attribution/monetization from AI-driven calls is unproven — this is a bet.

## Preconditions before building B2/B3
1. Site launched and stable on Cloudflare Pages.
2. This ADR reviewed by the owner.
3. Edge rate-limiting configured.
4. A CI job that smoke-tests the endpoint against 5 calculators (result parity with
   the on-page result).

Until all four hold, only B1 (static data, already shipped) is live.
