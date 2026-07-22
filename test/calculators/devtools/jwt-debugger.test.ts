import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/jwt-debugger/index';

const validToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('JWT Debugger', () => {
  it('decodes a valid JWT header', () => {
    const r = config.calculate({ token: validToken });
    const header = r.find((x) => x.id === 'header')?.value || '';
    expect(header).toContain('"alg"');
    expect(header).toContain('HS256');
  });

  it('decodes a valid JWT payload', () => {
    const r = config.calculate({ token: validToken });
    const payload = r.find((x) => x.id === 'payload')?.value || '';
    expect(payload).toContain('"sub"');
    expect(payload).toContain('1234567890');
    expect(payload).toContain('John Doe');
  });

  it('shorts signature to 20 chars plus ellipsis', () => {
    const r = config.calculate({ token: validToken });
    const sig = r.find((x) => x.id === 'signature')?.value || '';
    expect(sig.length).toBeGreaterThanOrEqual(20);
    expect(sig).toMatch(/\.\.\.$/);
  });

  it('marks valid JWT as valid format', () => {
    const r = config.calculate({ token: validToken });
    const isValid = r.find((x) => x.id === 'isValid')?.value;
    expect(isValid).toBe('Valid JWT format');
  });

  it('returns error for token without 3 parts', () => {
    const r = config.calculate({ token: 'not-a-jwt' });
    const isValid = r.find((x) => x.id === 'isValid')?.value;
    expect(isValid).toContain('Invalid');
  });

  it('returns error for token with 2 parts', () => {
    const r = config.calculate({ token: 'part1.part2' });
    const isValid = r.find((x) => x.id === 'isValid')?.value;
    expect(isValid).toContain('Invalid');
  });

  it('returns error for token with 4 parts', () => {
    const r = config.calculate({ token: 'a.b.c.d' });
    const isValid = r.find((x) => x.id === 'isValid')?.value;
    expect(isValid).toContain('Invalid');
  });

  it('returns empty for empty token', () => {
    const r = config.calculate({ token: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing token', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  it('handles token with invalid base64url characters', () => {
    const r = config.calculate({ token: 'header!!.payload.signature' });
    const isValid = r.find((x) => x.id === 'isValid')?.value;
    expect(isValid).toContain('Invalid');
  });

  it('returns N/A for header/payload/signature on invalid token', () => {
    const r = config.calculate({ token: 'invalid.token.here' });
    expect(r.find((x) => x.id === 'header')?.value).toBe('N/A');
    expect(r.find((x) => x.id === 'payload')?.value).toBe('N/A');
    expect(r.find((x) => x.id === 'signature')?.value).toBe('N/A');
  });

  it('has inputMode on text input', () => {
    const tokenInput = config.inputs.find((i) => i.id === 'token');
    expect(tokenInput?.inputMode).toBe('text');
  });

  it('has at least 5 FAQs', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
  });

  it('has workedExamples with scenarios and insights', () => {
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    config.educational.workedExamples!.forEach((ex) => {
      expect(ex.scenario).toBeTruthy();
      expect(ex.inputs).toBeTruthy();
      expect(ex.insight.length).toBeGreaterThan(100);
    });
  });

  it('has proTips', () => {
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
    config.educational.proTips!.forEach((tip) => {
      expect(tip.length).toBeGreaterThan(50);
    });
  });

  it('has limitations with real content', () => {
    expect(config.educational.limitations).toBeTruthy();
    expect(config.educational.limitations.length).toBeGreaterThan(0);
    expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('has all required educational sections', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
  });
});
