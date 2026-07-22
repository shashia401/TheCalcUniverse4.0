import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ColorConverterPanel from './ColorConverterPanel';

// ─── Color conversion utilities ───────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.startsWith('#') ? hex.slice(1) : hex;
  if (!/^[0-9A-Fa-f]{6}$/.test(cleaned)) return null;
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
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
  // Normalize to [0, 1]
  const hN = ((h % 360) + 360) % 360 / 360;
  const sN = Math.max(0, Math.min(100, s)) / 100;
  const lN = Math.max(0, Math.min(100, l)) / 100;

  if (sN === 0) {
    const gray = Math.round(lN * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
  const p = 2 * lN - q;

  return {
    r: Math.round(hue2rgb(p, q, hN + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hN) * 255),
    b: Math.round(hue2rgb(p, q, hN - 1 / 3) * 255),
  };
}

// ─── Calculator config ────────────────────────────────────────────────────────

const colorConverterConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Conversion Mode',
      type: 'select',
      helpText: 'Choose the direction of color conversion',
      options: [
        { label: 'HEX → RGB/HSL', value: 'HEX → RGB/HSL' },
        { label: 'RGB → HEX/HSL', value: 'RGB → HEX/HSL' },
        { label: 'HSL → HEX/RGB', value: 'HSL → HEX/RGB' },
      ],
      required: true,
    },
    {
      id: 'hexInput',
      label: 'HEX Value',
      type: 'text',
      placeholder: '#FF0000 or FF0000...',
      helpText: 'Enter a hex color code with or without the # prefix',
      showWhen: (v) => v.mode === 'HEX → RGB/HSL',
    },
    {
      id: 'r',
      label: 'Red',
      type: 'number',
      min: 0,
      max: 255,
      placeholder: '0-255',
      helpText: 'Red channel value from 0 to 255',
      showWhen: (v) => v.mode === 'RGB → HEX/HSL',
    },
    {
      id: 'g',
      label: 'Green',
      type: 'number',
      min: 0,
      max: 255,
      placeholder: '0-255',
      helpText: 'Green channel value from 0 to 255',
      showWhen: (v) => v.mode === 'RGB → HEX/HSL',
    },
    {
      id: 'b',
      label: 'Blue',
      type: 'number',
      min: 0,
      max: 255,
      placeholder: '0-255',
      helpText: 'Blue channel value from 0 to 255',
      showWhen: (v) => v.mode === 'RGB → HEX/HSL',
    },
    {
      id: 'h',
      label: 'Hue',
      type: 'number',
      min: 0,
      max: 360,
      placeholder: '0-360',
      helpText: 'Hue angle on the color wheel (0-360)',
      showWhen: (v) => v.mode === 'HSL → HEX/RGB',
    },
    {
      id: 's',
      label: 'Saturation',
      type: 'number',
      min: 0,
      max: 100,
      placeholder: '0-100',
      unit: '%',
      helpText: 'Color purity from 0 (gray) to 100 (vivid)',
      showWhen: (v) => v.mode === 'HSL → HEX/RGB',
    },
    {
      id: 'l',
      label: 'Lightness',
      type: 'number',
      min: 0,
      max: 100,
      placeholder: '0-100',
      unit: '%',
      helpText: 'Brightness from 0 (black) to 100 (white)',
      showWhen: (v) => v.mode === 'HSL → HEX/RGB',
    },
  ],

  calculate: (values) => {
    const mode = values.mode || '';

    let r: number;
    let g: number;
    let b: number;

    if (mode === 'HEX → RGB/HSL') {
      const hex = (values.hexInput || '').trim();
      if (!hex) return [];

      const parsed = hexToRgb(hex);
      if (!parsed) return [];

      r = parsed.r;
      g = parsed.g;
      b = parsed.b;
    } else if (mode === 'RGB → HEX/HSL') {
      const red = parseInt(values.r, 10);
      const green = parseInt(values.g, 10);
      const blue = parseInt(values.b, 10);

      if (isNaN(red) || isNaN(green) || isNaN(blue)) return [];
      if (red < 0 || red > 255 || green < 0 || green > 255 || blue < 0 || blue > 255) return [];

      r = red;
      g = green;
      b = blue;
    } else if (mode === 'HSL → HEX/RGB') {
      const hue = parseFloat(values.h);
      const sat = parseFloat(values.s);
      const lit = parseFloat(values.l);

      if (isNaN(hue) || isNaN(sat) || isNaN(lit)) return [];
      if (hue < 0 || hue > 360 || sat < 0 || sat > 100 || lit < 0 || lit > 100) return [];

      const rgb = hslToRgb(hue, sat, lit);
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    } else {
      return [];
    }

    const hexResult = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);

    return [
      { id: 'hex', label: 'HEX', value: hexResult, highlight: true },
      { id: 'rgb', label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
      { id: 'hsl', label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ColorConverterPanel, { values, results });
  },
  educational: {
    formula:
      'HEX → RGB: Parse hex string, R = int(pair[0],16), G = int(pair[1],16), B = int(pair[2],16) | RGB → HSL: Normalize to [0,1]; H determined by dominant channel; S = Δ/(1-|2L-1|); L = (max+min)/2 | HSL → RGB: Q = L<0.5 ? L×(1+S) : L+S-L×S; P = 2L-Q; hue2rgb(P,Q,t) interpolates the six hue sectors',
    formulaDescription:
      'Color conversion between HEX, RGB, and HSL involves mathematical transformations between three different coordinate systems. HEX is a base-16 encoding of the three RGB channels, making the conversion between HEX and RGB a simple radix change. Converting between RGB and HSL is more involved: RGB values are normalized to the 0-1 range, then luminance L is calculated as the midpoint between the brightest and dimmest channel. Saturation measures how far the color is from gray, computed from the range of the three channels divided by the distance from the luminance to the nearest edge. Hue is determined by which primary channel dominates and the relative strength of the other two, giving an angle on the color wheel. The reverse HSL-to-RGB conversion decomposes the hue angle into one of six sectors, computes chroma and lightness offsets, and produces the final RGB values through the hue2rgb interpolation function.',
    variables: [
      {
        symbol: 'HEX (#RRGGBB)',
        name: 'Hexadecimal Color Code',
        description: 'A six-character base-16 encoding of RGB values. Each pair of hexadecimal digits (00-FF) represents one channel intensity. Widely used in HTML, CSS, and web development for its compact representation.',
      },
      {
        symbol: 'RGB (0-255)',
        name: 'RGB Additive Channels',
        description: 'Three channel values (Red, Green, Blue) each ranging from 0 to 255. This additive color model combines light at different intensities to produce the visible spectrum on digital displays.',
      },
      {
        symbol: 'HSL (H°, S%, L%)',
        name: 'Hue, Saturation, Lightness',
        description: 'A cylindrical coordinate system where Hue (0-360°) is the angle on the color wheel, Saturation (0-100%) controls color purity, and Lightness (0-100%) controls brightness from black to white.',
      },
      {
        symbol: 'Δ (Delta)',
        name: 'Channel Range',
        description: 'The difference between the maximum and minimum RGB values after normalization. Used in the RGB-to-HSL conversion to determine saturation and help identify the dominant hue sector.',
      },
    ],
    howToUse: [
      'Select your input format from the dropdown: HEX → RGB/HSL, RGB → HEX/HSL, or HSL → HEX/RGB.',
      'Enter your color value in the fields shown for that mode — a hex code like #FF0000, RGB values (0-255 each), or HSL values (hue 0-360, saturation and lightness 0-100).',
      'The calculator instantly displays the converted color in all three formats: the hex code, RGB notation, and HSL notation.',
      'Use the results to copy any format into your CSS, design tool, or code editor — all three representations describe the exact same color.',
    ],
    quickReference: [
      { label: 'White', value: '#FFFFFF = rgb(255, 255, 255) = hsl(0, 0%, 100%)' },
      { label: 'Black', value: '#000000 = rgb(0, 0, 0) = hsl(0, 0%, 0%)' },
      { label: 'Pure Red', value: '#FF0000 = rgb(255, 0, 0) = hsl(0, 100%, 50%)' },
      { label: 'Pure Blue', value: '#0000FF = rgb(0, 0, 255) = hsl(240, 100%, 50%)' },
    ],
    commonUses: [
      'Converting CSS color values between HEX, RGB, and HSL for front-end web development and styling.',
      'Understanding color properties in graphic design tools like Figma, Photoshop, and Sketch that use different color models.',
      'Building accessible color systems by adjusting HSL lightness and saturation independently for WCAG contrast compliance.',
      'Debugging color values from APIs or design tokens that use different formats across platforms.',
      'Interoperability between web development, mobile app development, and print design that each favor different color representations.',
    ],
    explanation:
      'Color representation is fundamental to digital design and web development. Three color models dominate: HEX, RGB, and HSL. The HEX color code is a base-16 (hexadecimal) encoding of RGB values, where each pair of hex digits (00-FF, or 0-255 in decimal) represents the intensity of one of the three additive channels: Red, Green, and Blue. HEX is compact (six characters) and is the standard format in HTML and CSS for defining colors. RGB (Red, Green, Blue) is an additive color model where light is emitted to create color. The absence of all three channels yields black, and full intensity of all three yields white. This model is native to computer monitors, phone screens, and any display that emits light. It is a cube-based coordinate system with three axes ranging from 0 to 255. HSL (Hue, Saturation, Lightness) provides an alternative coordinate system that maps more naturally to human color perception. Instead of mixing three channel intensities, HSL separates color into three perceptual attributes: hue determines the base wavelength (the angle on a color wheel from 0° red through 120° green and 240° blue back to 360° red), saturation controls the intensity or purity of the color (from gray at 0% to fully vivid at 100%), and lightness controls the brightness (from black at 0% through the pure color at 50% to white at 100%). Converting between these models requires understanding their different geometric representations. HEX-to-RGB is a straightforward base conversion. RGB-to-HSL requires calculating luminance, saturation index, and hue angle through conditional logic based on which channel dominates. HSL-to-RGB reverses this by decomposing the hue into one of six 60-degree sectors, computing intermediate chroma values, and offsetting by lightness. The hue2rgb interpolation function is the key to this conversion: it takes a pair of pivot points (p and q) derived from saturation and lightness, then calculates the contribution of a given normalized hue coordinate within a six-sector color wheel. This mathematical framework allows seamless and bidirectional conversion between all three formats, enabling developers and designers to work in whichever color model best suits their task.',
    faqs: [
      {
        question: 'What is the difference between HEX and RGB if they represent the same colors?',
        answer: 'HEX and RGB encode the exact same 24-bit color space — there is no difference in the colors they can represent. The only difference is notation: HEX uses base-16 (hexadecimal) with two digits per channel (#FF0000), while RGB uses base-10 decimal notation with values 0-255 (rgb(255, 0, 0)). HEX is more compact (7 characters vs. 12+ characters) and is the historical standard in HTML and CSS. RGB notation became popular in CSS3 and is sometimes preferred for its decimal readability. They convert losslessly in both directions.',
      },
      {
        question: 'Why does HSL make it easier to create color schemes than RGB?',
        answer: 'HSL separates color into Hue (the base color), Saturation (purity), and Lightness (brightness), which aligns with how humans describe and reason about color. In RGB, creating a complementary color scheme requires unintuitive math: to find red’s complement, you subtract each channel from 255 (cyan = rgb(0, 255, 255)). In HSL, you simply add or subtract 180 from the hue. A monochromatic scheme means keeping hue constant and varying saturation and lightness — trivially easy in HSL but requiring complex logic in RGB.',
      },
      {
        question: 'Is there any data loss when converting between color models?',
        answer: 'HEX-to-RGB conversion is lossless because both formats represent the same 24-bit color space (16.7 million colors). However, conversions involving HSL may introduce minor rounding errors. HSL is a continuous cylindrical coordinate system, and converting to discrete 8-bit RGB values (0-255 per channel) requires rounding. When round-tripping RGB → HSL → RGB, you may occasionally see a difference of ±1 in one or two channels. This is visually imperceptible and is considered normal in all color conversion software.',
      },
      {
        question: 'Can I use HSL in CSS, and what does the syntax look like?',
        answer: 'Yes, modern CSS fully supports HSL colors with the hsl() and hsla() functions. The syntax is: hsl(hue, saturation%, lightness%) where hue is 0-360, saturation is 0-100%, and lightness is 0-100%. For example, hsl(0, 100%, 50%) produces pure red. CSS Color Module Level 4 also supports hsla() with an alpha channel and newer color spaces like LCH (perceptually uniform) and OKLCH, which offer even better interpolation for gradients.',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="240" y="16" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">RGB vs HSL Color Models</text><g transform="translate(10, 28)"><text x="110" y="12" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">RGB Additive Model</text><circle cx="75" cy="50" r="24" fill="none" stroke="var(--svg-64748b)" stroke-width="0.5" stroke-dasharray="2,2"/><circle cx="75" cy="50" r="24" fill="var(--svg-ff0000)" opacity="0.35" stroke="var(--svg-ef4444)" stroke-width="1"/><circle cx="135" cy="50" r="24" fill="var(--svg-00ff00)" opacity="0.35" stroke="var(--svg-22c55e)" stroke-width="1"/><circle cx="105" cy="80" r="24" fill="var(--svg-0000ff)" opacity="0.35" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="75" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">R</text><text x="135" y="54" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">G</text><text x="105" y="84" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">B</text><text x="110" y="115" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">Red + Green + Blue</text><text x="110" y="127" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">mixed additively</text></g><g transform="translate(235, 28)"><text x="115" y="12" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">HSL Cylindrical Model</text><defs><linearGradient id="hue" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#FF0000"/><stop offset="16%" stop-color="#FFFF00"/><stop offset="33%" stop-color="#00FF00"/><stop offset="50%" stop-color="#00FFFF"/><stop offset="66%" stop-color="#0000FF"/><stop offset="83%" stop-color="#FF00FF"/><stop offset="100%" stop-color="#FF0000"/></linearGradient></defs><rect x="0" y="28" width="230" height="16" rx="3" fill="url(#hue)"/><text x="115" y="56" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="500" text-anchor="middle">Hue 0°–360° (color wheel)</text><defs><linearGradient id="sat" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#808080"/><stop offset="100%" stop-color="#FF0000"/></linearGradient></defs><rect x="0" y="70" width="230" height="16" rx="3" fill="url(#sat)"/><text x="115" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="500" text-anchor="middle">Saturation 0% (gray) → 100% (pure)</text><defs><linearGradient id="light" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#000000"/><stop offset="50%" stop-color="#FF0000"/><stop offset="100%" stop-color="#FFFFFF"/></linearGradient></defs><rect x="0" y="112" width="230" height="16" rx="3" fill="url(#light)"/><text x="115" y="140" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" font-weight="500" text-anchor="middle">Lightness 0% (black) → 100% (white)</text></g></svg>',
      alt: 'Side-by-side comparison of RGB additive color model with overlapping red, green, blue circles and HSL cylindrical model showing hue, saturation, and lightness gradient bars',
      caption: 'RGB uses additive mixing of three channels (0-255 each). HSL uses a cylindrical coordinate system: hue (angle), saturation (radius), lightness (height).',
    },
    citations: [
      { title: 'MDN Web Docs — CSS Color Values', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/color_value' },
      { title: 'Wikipedia — HSL and HSV', url: 'https://en.wikipedia.org/wiki/HSL_and_HSV' },
    ],
  },
};

export default colorConverterConfig;
