import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/cookie-consent';
import { bannerTheme, escapeHtml } from '../../../src/calculators/engineering/cookie-consent/bannerTheme';
import { getValue } from '../../helpers';

const html = (v: Record<string, string>) =>
  getValue(config.calculate({ siteName: 'Acme', position: 'bottom-banner', layout: 'default', colorTheme: 'Light', ...v }), 'htmlCode');

// WCAG relative luminance contrast, computed independently of the generator.
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe('cookie-consent audit', () => {
  it('site name is HTML-escaped in the generated code (no markup injection)', () => {
    const out = html({ siteName: '<img src=x onerror=alert(1)>"&' });
    expect(out).not.toContain('<img src=x');
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;&quot;&amp;');
    expect(escapeHtml("a'b")).toBe('a&#39;b');
  });
  it('every layout offers a reject/decline choice as prominent as accept (GDPR/EDPB expectation)', () => {
    expect(html({ layout: 'default' })).toContain('Reject All');
    expect(html({ layout: 'minimal' })).toContain('Decline');
    expect(html({ layout: 'developer' })).toContain('Decline');
  });
  it('buttons record the choice and remove the banner by id; dialog is labelled', () => {
    const out = html({});
    expect(out).toContain("localStorage.setItem('cookie_consent','accepted')");
    expect(out).toContain("localStorage.setItem('cookie_consent','rejected')");
    expect(out).toContain('id="cookie-consent-banner"');
    expect(out).toContain('role="dialog"');
  });
  it('no compliance guarantee in the output or educational text', () => {
    const all = JSON.stringify(config.calculate({ siteName: 'X', position: 'bottom-banner', layout: 'default', colorTheme: 'Light' })) + JSON.stringify(config.educational);
    expect(all).not.toMatch(/GDPR-compliant/);
  });
  it('all themes: body text, muted text, links and primary buttons meet WCAG AA (4.5:1)', () => {
    for (const t of ['Light', 'Dark', 'Custom']) {
      const c = bannerTheme(t);
      expect(contrast(c.text, c.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.muted, c.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.link, c.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.btnText, c.accent)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('legal text cites the right provisions and the fine ceiling (GDPR Art. 83(5): EUR 20M or 4%)', () => {
    const e = JSON.stringify(config.educational);
    expect(e).toContain('Art. 5(3)');
    expect(e).toContain('EUR 20 million or 4%');
    expect(e).not.toMatch(/CCPA\/CPRA\)\./);
  });
});
