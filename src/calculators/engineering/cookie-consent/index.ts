import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CookieConsentPanel from './CookieConsentPanel';
import { bannerTheme, escapeHtml } from './bannerTheme';

// Banner choices are stored in localStorage as 'cookie_consent' = 'accepted' | 'rejected' and the banner is removed.
// Your site must still only load analytics/advertising scripts when the stored value is 'accepted'.
const choose = (value: 'accepted' | 'rejected') =>
  `localStorage.setItem('cookie_consent','${value}');document.getElementById('cookie-consent-banner').remove()`;

function generateHtmlCode(siteName: string, position: string, layout: string, colorTheme: string): string {
  const name = escapeHtml(siteName || 'My Website');
  const t = bannerTheme(colorTheme);
  const { bg, text, accent, btnText, border, muted, link } = t;

  let positionCss: string;
  switch (position) {
    case 'center-modal':
      positionCss = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999; max-width: 440px;';
      break;
    case 'corner-widget':
      positionCss = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; max-width: 360px;';
      break;
    default: // bottom banner
      positionCss = 'position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;';
  }

  const isMinimal = layout === 'minimal';
  const isDev = layout === 'developer';
  const outline = (pad: string, radius: string, extra = '') => `background: transparent; color: ${text}; border: 1px solid ${border}; padding: ${pad}; border-radius: ${radius}; cursor: pointer; font-size: 13px;${extra}`;
  const primary = (pad: string, radius: string) => `background: ${accent}; color: ${btnText}; border: none; padding: ${pad}; border-radius: ${radius}; cursor: pointer; font-size: 13px; font-weight: 600;`;

  const html = `<!-- Cookie consent banner template (not legal advice) for ${name} -->
<div id="cookie-consent-banner" role="dialog" aria-label="Cookie consent" style="
  ${positionCss}
  background: ${bg};
  color: ${text};
  padding: ${isMinimal ? '12px 16px' : '20px 24px'};
  border-radius: ${position === 'bottom-banner' ? '0' : '12px'};
  border: 1px solid ${border};
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
">
  ${isMinimal
    ? `<div style="display: flex; align-items: center; gap: 12px; justify-content: space-between;">
        <p style="margin: 0; color: ${text};">This site uses cookies to improve your experience.</p>
        <div style="display: flex; gap: 8px;">
          <button type="button" onclick="${choose('rejected')}" style="${outline('6px 12px', '6px')}">Decline</button>
          <button type="button" onclick="${choose('accepted')}" style="${primary('6px 16px', '6px')}">Accept</button>
        </div>
      </div>`
    : isDev
    ? `<div>
        <p style="margin: 0 0 12px 0; font-weight: 600; color: ${text};">🍪 Cookie Notice — ${name}</p>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: ${muted};">We use cookies and similar technologies. Choose whether to allow non-essential cookies; see our <a href="#" style="color: ${link}; text-decoration: underline;">Cookie Policy</a>.</p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" onclick="alert('Replace this with your cookie-settings panel')" style="${outline('8px 16px', '6px')}">Cookie Settings</button>
          <button type="button" onclick="${choose('accepted')}" style="${primary('8px 20px', '6px')}">Accept All</button>
          <button type="button" onclick="${choose('rejected')}" style="${outline('8px 20px', '6px', ' font-weight: 600;')}">Decline</button>
        </div>
      </div>`
    : `<div style="text-align: ${position === 'center-modal' ? 'center' : 'left'};">
        <div style="font-size: 24px; margin-bottom: 8px;" aria-hidden="true">🍪</div>
        <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 16px; color: ${text};">Cookies &amp; Privacy</p>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: ${muted};">${name} uses cookies to enhance your browsing experience, serve personalized content, and analyze traffic. You can accept or reject non-essential cookies.</p>
        <div style="display: flex; gap: 10px; justify-content: ${position === 'center-modal' ? 'center' : 'flex-start'}; flex-wrap: wrap;">
          <button type="button" onclick="alert('Replace this with your cookie-settings panel')" style="${outline('10px 18px', '8px')}">Customize</button>
          <button type="button" onclick="${choose('rejected')}" style="${outline('10px 24px', '8px', ' font-weight: 600;')}">Reject All</button>
          <button type="button" onclick="${choose('accepted')}" style="${primary('10px 24px', '8px')}">Accept All</button>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: ${muted};">
          <a href="#" style="color: ${link}; text-decoration: underline;">Privacy Policy</a>
          <span style="margin: 0 6px;">·</span>
          <a href="#" style="color: ${link}; text-decoration: underline;">Cookie Policy</a>
        </div>
      </div>`
  }
</div>`;

  return html;
}

function generateCssCode(position: string, colorTheme: string): string {
  return `/* Cookie Consent Banner Styles for ${position} position, ${colorTheme} theme */
.cookie-banner-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}
.cookie-consent-banner {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 9999;
}
@media (max-width: 640px) {
  .cookie-consent-banner {
    left: 10px !important;
    right: 10px !important;
    max-width: none !important;
    transform: none !important;
    top: auto !important;
    bottom: 10px !important;
  }
}`;
}

function generatePreviewText(siteName: string, position: string, layout: string): string {
  const name = siteName || 'My Website';
  return `Cookie Consent Banner for "${name}"
- Position: ${position}
- Layout: ${layout}
- Description: A ${layout.toLowerCase()} cookie consent banner that appears as a ${position === 'bottom-banner' ? 'bottom banner' : position === 'center-modal' ? 'center modal' : 'corner widget'}.
- Offers Accept and Reject/Decline choices of equal prominence, and links to your policies.
- A template only: whether your site is compliant depends on what you load, what you disclose, and local law.`;
}

const cookieConsentConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'siteName',
      label: 'Site Name',
      type: 'text',
      placeholder: 'My Website',
      helpText: 'Your website name — appears in the banner text',
    },
    {
      id: 'position',
      label: 'Banner Position',
      type: 'select',
      required: true,
      helpText: 'Choose where the cookie consent banner appears on the page',
      options: [
        { label: 'Bottom Banner', value: 'bottom-banner' },
        { label: 'Center Modal', value: 'center-modal' },
        { label: 'Corner Widget', value: 'corner-widget' },
      ],
    },
    {
      id: 'layout',
      label: 'Layout Style',
      type: 'select',
      required: true,
      helpText: 'Default is full, Minimal is compact, Developer includes cookie settings options',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Minimal', value: 'minimal' },
        { label: 'Developer', value: 'developer' },
      ],
    },
    {
      id: 'colorTheme',
      label: 'Color Theme',
      type: 'select',
      required: true,
      helpText: 'Choose a light, dark, or custom color scheme for the banner',
      options: [
        { label: 'Light', value: 'Light' },
        { label: 'Dark', value: 'Dark' },
        { label: 'Custom (navy dark)', value: 'Custom' },
      ],
    },
  ],
  calculate: (values) => {
    const siteName = values.siteName || 'My Website';
    const position = values.position || 'bottom-banner';
    const layout = values.layout || 'default';
    const colorTheme = values.colorTheme || 'Light';

    const htmlCode = generateHtmlCode(siteName, position, layout, colorTheme);
    const cssCode = generateCssCode(position, colorTheme);
    const fullCode = `<!-- Cookie Consent Banner for ${siteName} -->\n<style>\n${cssCode}\n</style>\n${htmlCode}`;
    const previewText = generatePreviewText(siteName, position, layout);

    const posLabels: Record<string, string> = {
      'bottom-banner': 'Bottom Banner',
      'center-modal': 'Center Modal',
      'corner-widget': 'Corner Widget',
    };

    const layoutLabels: Record<string, string> = {
      default: 'Default',
      minimal: 'Minimal',
      developer: 'Developer',
    };

    return [
      { id: 'htmlCode', label: 'HTML Code', value: htmlCode, highlight: true },
      { id: 'cssCode', label: 'CSS Code', value: cssCode, color: 'neutral' },
      { id: 'fullCode', label: 'Full Code (HTML + CSS)', value: fullCode, highlight: true },
      { id: 'previewText', label: 'Preview Description', value: previewText, color: 'neutral' },
      { id: 'position', label: 'Banner Position', value: posLabels[position] || position },
      { id: 'layout', label: 'Layout Style', value: layoutLabels[layout] || layout },
      { id: 'colorTheme', label: 'Color Theme', value: colorTheme },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CookieConsentPanel, { values, results });
  },
  educational: {
    formula: 'GDPR (Art. 4(11), 7): valid consent must be freely given, specific, informed, and unambiguous | ePrivacy Directive Art. 5(3): consent required before storing or reading non-essential information on a device',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="60" width="360" height="240" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="8"/><text x="220" y="100" text-anchor="middle" font-size="16" fill="var(--svg-333333)">This site uses cookies</text><text x="220" y="130" text-anchor="middle" font-size="12" fill="var(--svg-666666)">We use cookies to improve your experience.</text><rect x="60" y="160" width="140" height="40" fill="var(--svg-22c55e)" rx="8"/><text x="130" y="185" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Accept All</text><rect x="220" y="160" width="140" height="40" fill="var(--svg-ef4444)" rx="8"/><text x="290" y="185" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Decline</text><rect x="140" y="220" width="160" height="30" fill="var(--svg-3b82f6)" rx="6"/><text x="220" y="240" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Cookie Settings</text></svg>',
      alt: 'Cookie consent banner with Accept, Decline, and Settings buttons',
      caption: 'Cookie consent banner — users must actively choose before non-essential cookies load',
    },
    formulaDescription:
      'Under the ePrivacy Directive (Art. 5(3), the "cookie law") and the GDPR, sites serving people in the EU/EEA need prior consent before setting non-essential cookies. A consent banner is the usual way to collect it. Regulators expect clear information, a way to refuse that is as easy as the way to accept, and no non-essential cookies before the user chooses. This generator produces a banner template only; it does not block your scripts or make a site compliant by itself.',
    variables: [
      { symbol: 'GDPR', name: 'General Data Protection Regulation', description: 'EU regulation governing data protection and privacy. Requires valid consent for personal data processing, including cookie tracking.' },
      { symbol: 'ePrivacy', name: 'ePrivacy Directive (Cookie Law)', description: 'EU directive requiring opt-in consent for storing/accessing information on a user\'s device. This is the "cookie law".' },
      { symbol: 'Essential Cookies', name: 'Strictly Necessary Cookies', description: 'Cookies required for basic website functionality (session management, authentication). These do NOT require consent.' },
      { symbol: 'Non-Essential Cookies', name: 'Non-Essential Cookies', description: 'Cookies for analytics, advertising, tracking, and personalization. These generally require prior opt-in consent in the EU/EEA and UK (some jurisdictions exempt limited analytics).' },
    ],
    limitations: [
      'This generates banner HTML/CSS only. It does not block cookies or scripts before consent, keep consent records, or provide a real preferences panel (the Customize / Cookie Settings button is a placeholder).',
      'Not legal advice. Compliance depends on which cookies and trackers you use, what your policies say and the law that applies to your audience.',
    ],
    howToUse: [
      'Enter your website name.',
      'Choose the banner position (bottom, center modal, or corner widget).',
      'Select a layout style (default, minimal, or developer).',
      'Choose a color theme (light, dark, or custom).',
      'Copy the generated HTML/CSS code and paste it into your website, then make your analytics and advertising scripts load only when localStorage cookie_consent is accepted.',
      'The live preview updates in real time as you change settings.',
    ],
    explanation:
      'Consent is required before non-essential cookies or similar technologies are used on devices of people in the EU/EEA (ePrivacy Directive Art. 5(3), implemented nationally) and the UK (PECR). Where the data is personal data, the GDPR sets the standard for valid consent: "freely given, specific, informed, and unambiguous" (Art. 4(11)), shown by a clear affirmative act, so pre-ticked boxes and implied consent do not count (CJEU Planet49, 2019). Regulators expect refusing to be as easy as accepting. Strictly necessary cookies (for example session or load-balancing cookies needed to deliver the service the user asked for) are exempt. GDPR infringements of the consent rules can be fined up to EUR 20 million or 4% of worldwide annual turnover, whichever is higher; penalties for breaching ePrivacy cookie rules are set by each member state.',
    commonUses: [
      'Adding a consent banner template to European-facing websites as the front end of a consent flow',
      'Generating ready-to-use HTML and CSS code for cookie consent banners with different layouts, positions, and color themes',
      'Understanding cookie consent legal requirements under GDPR and the ePrivacy Directive to avoid regulatory fines',
    ],
    faqs: [
      {
        question: 'Is a cookie consent banner really required?',
        answer: 'You need consent before non-essential cookies if your site is aimed at users in the EU/EEA or UK; a banner is the usual way to get it. Strictly necessary cookies are exempt. Other places differ: for example the California CCPA/CPRA is mainly an opt-out regime (a "Do Not Sell or Share" link and honouring opt-out signals) rather than an opt-in banner, and Brazil\'s LGPD requires a legal basis such as consent. Check the rules that apply to your audience.',
      },
      {
        question: 'What is the difference between GDPR and ePrivacy?',
        answer: 'The GDPR covers all processing of personal data, including data collected through cookies, and defines what valid consent is. The ePrivacy Directive (Art. 5(3)) separately requires consent before storing or accessing information on a user\'s device unless it is strictly necessary. For non-essential cookies you need to satisfy both.',
      },
      {
        question: 'What are "dark patterns" in cookie banners?',
        answer: 'Dark patterns are UI designs that make it easier to accept cookies than to reject them. Examples: making the Decline button grayed out or harder to find, requiring multiple clicks to reject vs. one click to accept, or using confusing language. These can mean the consent is not "freely given" under the GDPR and has been the basis of regulator action against several sites.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Cookie Consent', url: 'https://en.wikipedia.org/wiki/Cookie_consent' },
      { source: 'EUR-Lex', title: 'Directive 2002/58/EC (ePrivacy), Article 5(3)', url: 'https://eur-lex.europa.eu/eli/dir/2002/58/oj' },
      { source: 'EUR-Lex', title: 'Regulation (EU) 2016/679 (GDPR), Articles 4(11) and 7', url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' },
      { source: 'GDPR.eu', title: 'Cookie Consent Under GDPR', url: 'https://gdpr.eu/cookies/' },
    ],
  },
};

export default cookieConsentConfig;
