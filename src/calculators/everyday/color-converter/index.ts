import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ColorConverterPanel from './ColorConverterPanel';

// ─── Color conversion utilities ───────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.startsWith('#') ? hex : `#${hex}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(cleaned)) return null;
  return {
    r: parseInt(cleaned.slice(1, 3), 16),
    g: parseInt(cleaned.slice(3, 5), 16),
    b: parseInt(cleaned.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;

  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const delta = max - min;

  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));

  let h: number;
  if (max === rN) {
    h = ((gN - bN) / delta + (gN < bN ? 6 : 0)) * 60;
  } else if (max === gN) {
    h = ((bN - rN) / delta + 2) * 60;
  } else {
    h = ((rN - gN) / delta + 4) * 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hNorm = ((h % 360) + 360) % 360;
  const sNorm = Math.min(100, Math.max(0, s)) / 100;
  const lNorm = Math.min(100, Math.max(0, l)) / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hNorm < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (hNorm < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (hNorm < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (hNorm < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (hNorm < 300) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

// ─── Calculator config ────────────────────────────────────────────────────────

const colorConverterConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'format',
      label: 'Color Format',
      type: 'select',
      required: true,
      helpText: 'Choose the color format you want to enter',
      options: [
        { label: 'HEX (#RRGGBB)', value: 'hex' },
        { label: 'RGB (0-255)', value: 'rgb' },
        { label: 'HSL', value: 'hsl' },
      ],
    },
    // ── HEX input ──────────────────────────────────────────────────────────
    {
      id: 'hex',
      label: 'HEX Value',
      type: 'text',
      placeholder: '#FF5733',
      helpText: 'Enter a 6-character hex color code (with or without #)',
      showWhen: (values) => values.format === 'hex',
    },
    // ── RGB inputs ─────────────────────────────────────────────────────────
    {
      id: 'red',
      label: 'Red',
      type: 'number',
      min: 0,
      max: 255,
      step: 1,
      placeholder: '255',
      helpText: 'Red channel value (0-255)',
      showWhen: (values) => values.format === 'rgb',
    },
    {
      id: 'green',
      label: 'Green',
      type: 'number',
      min: 0,
      max: 255,
      step: 1,
      placeholder: '87',
      helpText: 'Green channel value (0-255)',
      showWhen: (values) => values.format === 'rgb',
    },
    {
      id: 'blue',
      label: 'Blue',
      type: 'number',
      min: 0,
      max: 255,
      step: 1,
      placeholder: '51',
      helpText: 'Blue channel value (0-255)',
      showWhen: (values) => values.format === 'rgb',
    },
    // ── HSL inputs ─────────────────────────────────────────────────────────
    {
      id: 'hue',
      label: 'Hue',
      type: 'number',
      min: 0,
      max: 360,
      step: 1,
      placeholder: '9',
      helpText: 'Hue angle on the color wheel (0-360 degrees)',
      showWhen: (values) => values.format === 'hsl',
    },
    {
      id: 'saturation',
      label: 'Saturation',
      type: 'percentage',
      min: 0,
      max: 100,
      step: 1,
      placeholder: '100',
      helpText: 'Saturation intensity (0% = gray, 100% = full color)',
      showWhen: (values) => values.format === 'hsl',
    },
    {
      id: 'lightness',
      label: 'Lightness',
      type: 'percentage',
      min: 0,
      max: 100,
      step: 1,
      placeholder: '60',
      helpText: 'Lightness level (0% = black, 100% = white)',
      showWhen: (values) => values.format === 'hsl',
    },
  ],

  calculate: (values) => {
    const format = values.format || 'hex';

    let r = 0;
    let g = 0;
    let b = 0;

    if (format === 'hex') {
      const hex = (values.hex || '').trim();
      if (!hex) return [];

      const parsed = hexToRgb(hex);
      if (!parsed) return [];

      r = parsed.r;
      g = parsed.g;
      b = parsed.b;
    } else if (format === 'rgb') {
      const red = parseInt(values.red, 10);
      const green = parseInt(values.green, 10);
      const blue = parseInt(values.blue, 10);

      if (isNaN(red) || isNaN(green) || isNaN(blue)) return [];
      if (red < 0 || red > 255 || green < 0 || green > 255 || blue < 0 || blue > 255) return [];

      r = red;
      g = green;
      b = blue;
    } else if (format === 'hsl') {
      const hue = parseFloat(values.hue);
      const saturation = parseFloat(values.saturation);
      const lightness = parseFloat(values.lightness);

      if (isNaN(hue) || isNaN(saturation) || isNaN(lightness)) return [];
      if (hue < 0 || hue > 360 || saturation < 0 || saturation > 100 || lightness < 0 || lightness > 100) return [];

      const rgb = hslToRgb(hue, saturation, lightness);
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    } else {
      return [];
    }

    const hexResult = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);

    return [
      {
        id: 'hex',
        label: 'HEX',
        value: hexResult,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'rgb',
        label: 'RGB',
        value: `rgb(${r}, ${g}, ${b})`,
        color: 'neutral',
      },
      {
        id: 'hsl',
        label: 'HSL',
        value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        color: 'neutral',
      },
      {
        id: 'colorPreview',
        label: 'Color Preview',
        value: hexResult,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ColorConverterPanel, { values, results });
  },
  educational: {
    formula: [
      'HEX → RGB: R = int(HEX[1:3], 16), G = int(HEX[3:5], 16), B = int(HEX[5:7], 16)',
      'RGB → HEX: #R(16)G(16)B(16) with zero-padding',
      'RGB → HSL: Normalize r,g,b to [0,1]; L = (max+min)/2; S = Δ/(1-|2L-1|); H determined by which channel is max',
      'HSL → RGB: Chroma C = (1-|2L-1|)×S; find RGB sector from H; add lightness offset m = L-C/2',
    ].join(' | '),
    formulaDescription:
      'Color conversion between HEX, RGB, and HSL involves mathematical transformations between coordinate systems. HEX and RGB are closely related — HEX is just a base-16 encoding of the three 0-255 RGB channels. HSL uses a cylindrical coordinate system where Hue is the angle around the color wheel (0-360 degrees), Saturation controls the intensity (0% gray to 100% pure), and Lightness controls the brightness (0% black to 100% white). Converting between RGB and HSL requires normalizing RGB values to the 0-1 range and applying trigonometric relationships derived from the RGB color cube.',
    diagram: {
      svg: '<svg viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="240" y="16" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">RGB vs HSL Color Models</text><g transform="translate(10, 28)"><text x="110" y="12" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">RGB Additive Model</text><circle cx="75" cy="50" r="24" fill="var(--svg-ff0000)" opacity="0.4" stroke="var(--svg-ef4444)" stroke-width="1"/><circle cx="135" cy="50" r="24" fill="var(--svg-00ff00)" opacity="0.4" stroke="var(--svg-22c55e)" stroke-width="1"/><circle cx="105" cy="80" r="24" fill="var(--svg-0000ff)" opacity="0.4" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="75" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">R</text><text x="135" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">G</text><text x="105" y="84" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">B</text><text x="110" y="115" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Red + Green + Blue</text><text x="110" y="127" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">mixed additively</text></g><g transform="translate(235, 28)"><text x="115" y="12" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">HSL Cylindrical Model</text><defs><linearGradient id="hue" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#FF0000"/><stop offset="16%" stop-color="#FFFF00"/><stop offset="33%" stop-color="#00FF00"/><stop offset="50%" stop-color="#00FFFF"/><stop offset="66%" stop-color="#0000FF"/><stop offset="83%" stop-color="#FF00FF"/><stop offset="100%" stop-color="#FF0000"/></linearGradient></defs><rect x="0" y="28" width="230" height="16" rx="3" fill="url(#hue)"/><text x="115" y="56" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="500" text-anchor="middle">Hue 0°–360° (color wheel)</text><defs><linearGradient id="sat" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#808080"/><stop offset="100%" stop-color="#FF0000"/></linearGradient></defs><rect x="0" y="70" width="230" height="16" rx="3" fill="url(#sat)"/><text x="115" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="500" text-anchor="middle">Saturation 0% (gray) → 100% (pure)</text><defs><linearGradient id="light" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#000000"/><stop offset="50%" stop-color="#FF0000"/><stop offset="100%" stop-color="#FFFFFF"/></linearGradient></defs><rect x="0" y="112" width="230" height="16" rx="3" fill="url(#light)"/><text x="115" y="140" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="500" text-anchor="middle">Lightness 0% (black) → 100% (white)</text></g></svg>',
      alt: 'Side-by-side comparison of RGB additive color model with overlapping red, green, blue circles and HSL cylindrical model showing hue gradient, saturation gradient, and lightness gradient bars',
      caption: 'RGB uses additive mixing of three channels (0-255 each). HSL uses a cylindrical coordinate system: hue (angle), saturation (radius), lightness (height).',
    },
    variables: [
      { symbol: '#RRGGBB', name: 'HEX Color Code', description: 'A six-digit hexadecimal representation of RGB values. Each pair of hex digits (00-FF) represents one channel: Red, Green, and Blue. Used extensively in HTML/CSS for web colors.' },
      { symbol: 'R, G, B', name: 'RGB Channels (0-255)', description: 'The additive primaries: Red, Green, and Blue. Each channel ranges from 0 (no intensity) to 255 (full intensity). When all three are at 255, the result is white. At 0,0,0 the result is black.' },
      { symbol: 'H, S, L', name: 'HSL Coordinates', description: 'Hue (0-360 degrees) is the angle on the color wheel starting at red (0), through green (120), blue (240), and back to red (360). Saturation (0-100%) controls color intensity. Lightness (0-100%) controls brightness from black through pure color to white.' },
    ],
    commonUses: [
      'Converting CSS color values between HEX, RGB, and HSL for web development',
      'Understanding and adjusting color properties in graphic design and digital art software',
      'Creating color palettes by manipulating HSL values (adjusting hue, saturation, or lightness independently)',
      'Accessibility testing — converting colors to verify WCAG contrast ratios',
      'Interoperability between design tools and code that use different color formats',
    ],
    howToUse: [
      'Select your input color format from the dropdown: HEX (#RRGGBB), RGB (0-255), or HSL.',
      'Enter your color values in the fields shown for that format — the default values illustrate a vibrant orange-red (#FF5733).',
      'The calculator instantly converts your color to all three formats: HEX, RGB, and HSL.',
      'Use the Color Preview result to see the color visually (the hex value displayed can be rendered as a swatch by the UI).',
      'Experiment with different HSL values to understand how adjusting hue, saturation, and lightness independently affects the resulting color.',
    ],
    explanation:
      'Color representation is a fundamental concept in digital design, computer graphics, and web development. Three of the most common color models are HEX, RGB, and HSL. The HEX color code is a base-16 encoding of RGB values, where each pair of hexadecimal digits (00-FF, or 0-255 in decimal) represents the intensity of one channel. RGB (Red, Green, Blue) is an additive color model where light is added to create color — the absence of all three channels produces black, and full intensity of all three produces white. This model is native to computer monitors, phone screens, and any display that emits light. HSL (Hue, Saturation, Lightness) provides a more intuitive way to think about color. Instead of mixing three channel intensities, HSL separates color into its perceptual attributes: hue determines which color (the wavelength on the visible spectrum), saturation determines how intense or vivid the color is (from gray to pure), and lightness determines how bright or dark the color appears. The HSL model is often preferred by designers because it maps more naturally to how humans describe color: "a slightly muted, dark blue" becomes a simple adjustment of saturation and lightness at the blue hue angle. Converting between these models requires understanding their geometric representations. RGB is a cube with three axes (R, G, B) from 0 to 255. HSL is a cylinder where hue is the angular coordinate (0-360 degrees), saturation is the radial distance from the center axis, and lightness is the height along the axis. The conversion formulas project points between these two coordinate systems, enabling seamless translation between any color format.',
    faqs: [
      {
        question: 'What is the difference between HEX and RGB?',
        answer: 'HEX and RGB represent the same information in different numeral systems. HEX uses base-16 (hexadecimal) where each channel is represented by two digits ranging from 00 to FF (0-255 in decimal). For example, the color red is #FF0000 in HEX and rgb(255, 0, 0) in RGB. HEX is more compact (6 characters vs. up to 12+ for RGB notation) and is the standard format in HTML/CSS for defining colors. Both formats describe the same RGB color space using additive color mixing.',
      },
      {
        question: 'Why is HSL considered more intuitive than RGB?',
        answer: 'HSL separates color into Hue (which color), Saturation (how vivid), and Lightness (how bright/dark) — attributes that align with how humans naturally describe and perceive color. With RGB, if you want to make a color "a bit darker and slightly less saturated," you need to adjust all three channels in a non-obvious way. With HSL, you simply decrease the lightness value and reduce saturation slightly. This makes HSL much easier to work with when creating color schemes, gradients, and design systems.',
      },
      {
        question: 'Can I use HSL values directly in CSS?',
        answer: 'Yes! Modern CSS fully supports HSL colors with the hsl() and hsla() functions. The syntax is hsl(hue, saturation%, lightness%) where hue is 0-360, saturation is 0-100%, and lightness is 0-100%. For example, hsl(0, 100%, 50%) produces pure red. HSL is also used in popular design tools like Figma, Adobe Photoshop, and Sketch for color picking and manipulation. CSS Color Module Level 4 also supports the more perceptually uniform LCH color space.',
      },
      {
        question: 'What happens when I convert between color models — is there any data loss?',
        answer: 'In theory, converting between HEX and RGB is lossless since they represent the same 24-bit color space. However, conversions involving HSL can introduce minor rounding errors because the HSL coordinate system uses continuous values (angles and percentages) that must be rounded to the nearest integer RGB channel. When round-tripping a color from RGB to HSL and back to RGB, you may see a difference of ±1 in one or two channels due to rounding. This is normal and visually imperceptible in most cases.',
      },
      {
        question: 'What is the range for each HSL component?',
        answer: 'Hue ranges from 0 to 360 degrees, representing the full color wheel: red at 0°, green at 120°, blue at 240°, and back to red at 360°. Saturation ranges from 0% (completely gray, no color) to 100% (fully saturated, pure color). Lightness ranges from 0% (completely black) through 50% (the pure color at maximum saturation) to 100% (completely white). A lightness of 50% with 100% saturation gives the purest form of any hue.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Color Model', url: 'https://en.wikipedia.org/wiki/Color_model' },
      { source: 'Wolfram MathWorld', title: 'RGB Color', url: 'https://mathworld.wolfram.com/RGBColor.html' },
    ],
  },
};

export default colorConverterConfig;
