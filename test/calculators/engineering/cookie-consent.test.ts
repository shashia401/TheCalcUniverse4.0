import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/cookie-consent/index';
import { getValue } from '../../helpers';

describe('cookie-consent', () => {
  const baseValues = {
    siteName: 'My Test Site',
    position: 'bottom-banner',
    layout: 'default',
    colorTheme: 'Light',
  };

  it('generates HTML code for default settings', () => {
    const r = config.calculate(baseValues);
    const html = getValue(r, 'htmlCode');
    expect(html).toContain('My Test Site');
    expect(html).toContain('Accept');
    expect(html).toContain('Customize');
    expect(html).toContain('Privacy Policy');
    expect(html).toContain('Cookie Policy');
    expect(html).toContain('cursor: pointer');
  });

  it('generates CSS code', () => {
    const r = config.calculate(baseValues);
    const css = getValue(r, 'cssCode');
    expect(css).toContain('cookie-banner-overlay');
    expect(css).toContain('cookie-consent-banner');
  });

  it('generates full combined code', () => {
    const r = config.calculate(baseValues);
    const full = getValue(r, 'fullCode');
    expect(full).toContain('My Test Site');
    expect(full).toContain('bottom-banner');
  });

  it('generates preview text', () => {
    const r = config.calculate(baseValues);
    const preview = getValue(r, 'previewText');
    expect(preview).toContain('My Test Site');
    expect(preview).toContain('bottom banner');
    expect(preview).toContain('GDPR-compliant');
  });

  it('shows correct position for center modal', () => {
    const r = config.calculate({
      ...baseValues,
      position: 'center-modal',
    });
    expect(getValue(r, 'position')).toBe('Center Modal');
  });

  it('shows correct position for corner widget', () => {
    const r = config.calculate({
      ...baseValues,
      position: 'corner-widget',
    });
    expect(getValue(r, 'position')).toBe('Corner Widget');
  });

  it('handles minimal layout', () => {
    const r = config.calculate({
      ...baseValues,
      layout: 'minimal',
    });
    const html = getValue(r, 'htmlCode');
    expect(html).not.toContain('Customize');
    expect(html).toContain('Decline');
    expect(getValue(r, 'layout')).toBe('Minimal');
  });

  it('handles developer layout', () => {
    const r = config.calculate({
      ...baseValues,
      layout: 'developer',
    });
    const html = getValue(r, 'htmlCode');
    expect(html).toContain('Cookie Settings');
    expect(html).toContain('Accept All');
    expect(getValue(r, 'layout')).toBe('Developer');
  });

  it('handles dark theme', () => {
    const r = config.calculate({
      ...baseValues,
      colorTheme: 'Dark',
    });
    expect(getValue(r, 'colorTheme')).toBe('Dark');
  });

  it('handles custom theme', () => {
    const r = config.calculate({
      ...baseValues,
      colorTheme: 'Custom',
    });
    expect(getValue(r, 'colorTheme')).toBe('Custom');
  });

  it('generates valid HTML for all combinations', () => {
    const positions = ['bottom-banner', 'center-modal', 'corner-widget'];
    const layouts = ['default', 'minimal', 'developer'];
    const themes = ['Light', 'Dark', 'Custom'];

    for (const pos of positions) {
      for (const lay of layouts) {
        for (const theme of themes) {
          const r = config.calculate({
            siteName: 'Test',
            position: pos,
            layout: lay,
            colorTheme: theme,
          });
          const html = getValue(r, 'htmlCode');
          // minimal layout doesn't include the site name in its compact output
          if (lay !== 'minimal') {
            expect(html).toContain('Test');
          }
          expect(html).toContain('cursor: pointer');
        }
      }
    }
  });

  it('uses default site name when not provided', () => {
    const r = config.calculate({
      siteName: '',
      position: 'bottom-banner',
      layout: 'default',
      colorTheme: 'Light',
    });
    const html = getValue(r, 'htmlCode');
    expect(html).toContain('My Website');
  });
});
