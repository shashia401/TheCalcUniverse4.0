import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import AspectRatioPanel from './AspectRatioPanel';

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b > 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

interface AspectPreset {
  label: string;
  ratio: number; // w/h
  display: string;
}

const PRESETS: AspectPreset[] = [
  { label: '16:9 — Widescreen HD', ratio: 16 / 9, display: '16:9' },
  { label: '4:3 — Standard / Classic', ratio: 4 / 3, display: '4:3' },
  { label: '1:1 — Square', ratio: 1 / 1, display: '1:1' },
  { label: '3:2 — Classic Photo', ratio: 3 / 2, display: '3:2' },
  { label: '21:9 — Ultrawide', ratio: 21 / 9, display: '21:9' },
  { label: '9:16 — Vertical / TikTok / IG Story', ratio: 9 / 16, display: '9:16' },
];

function findPreset(w: number, h: number): string | null {
  const r = w / h;
  for (const preset of PRESETS) {
    if (Math.abs(r - preset.ratio) < 0.02) {
      return preset.label;
    }
  }
  return null;
}

const aspectRatioConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      required: true,
      helpText: 'Calculate ratio from dimensions or find a missing dimension',
      options: [
        { label: 'Calculate aspect ratio from dimensions', value: 'calculate-ratio' },
        { label: 'Find missing dimension from ratio', value: 'find-missing' },
      ],
    },
    // ── Calculate Ratio Mode ─────────────────────────────────────────────
    {
      id: 'width',
      label: 'Width (pixels)',
      type: 'number',
      placeholder: '1920',
      min: 1,
      step: 1,
      required: true,
      helpText: 'Width of the image or screen in pixels',
      showWhen: (values) => values.mode === 'calculate-ratio',
    },
    {
      id: 'height',
      label: 'Height (pixels)',
      type: 'number',
      placeholder: '1080',
      min: 1,
      step: 1,
      required: true,
      helpText: 'Height of the image or screen in pixels',
      showWhen: (values) => values.mode === 'calculate-ratio',
    },
    // ── Find Missing Mode ────────────────────────────────────────────────
    {
      id: 'ratioA',
      label: 'Ratio Width (A)',
      type: 'number',
      placeholder: '16',
      min: 1,
      step: 1,
      required: true,
      helpText: 'First number of the aspect ratio (e.g., 16 in 16:9)',
      showWhen: (values) => values.mode === 'find-missing',
    },
    {
      id: 'ratioB',
      label: 'Ratio Height (B)',
      type: 'number',
      placeholder: '9',
      min: 1,
      step: 1,
      required: true,
      helpText: 'Second number of the aspect ratio (e.g., 9 in 16:9)',
      showWhen: (values) => values.mode === 'find-missing',
    },
    {
      id: 'knownDimension',
      label: 'Known Dimension',
      type: 'select',
      required: true,
      options: [
        { label: 'Width', value: 'width' },
        { label: 'Height', value: 'height' },
      ],
      showWhen: (values) => values.mode === 'find-missing',
    },
    {
      id: 'knownValue',
      label: 'Known Value (pixels)',
      type: 'number',
      placeholder: '1920',
      min: 1,
      step: 1,
      required: true,
      helpText: 'The known dimension in pixels',
      showWhen: (values) => values.mode === 'find-missing',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'calculate-ratio';
    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const results: CalculatorResult[] = [];

    if (mode === 'calculate-ratio') {
      const width = parseFloat(values.width);
      const height = parseFloat(values.height);

      if (isNaN(width) || width <= 0 || isNaN(height) || height <= 0) return [];

      const g = gcd(width, height);
      const ratioW = width / g;
      const ratioH = height / g;
      const preset = findPreset(width, height);

      results.push({
        id: 'simplifiedRatio',
        label: 'Aspect Ratio',
        value: `${ratioW}:${ratioH}`,
        highlight: true,
        color: 'neutral',
      });

      results.push({
        id: 'gcd',
        label: 'GCD (Greatest Common Divisor)',
        value: fmtInt(g),
        color: 'neutral',
      });

      results.push({
        id: 'widthResult',
        label: 'Width',
        value: `${fmtInt(width)} px`,
        color: 'neutral',
      });

      results.push({
        id: 'heightResult',
        label: 'Height',
        value: `${fmtInt(height)} px`,
        color: 'neutral',
      });

      if (preset) {
        results.push({
          id: 'presetMatch',
          label: 'Preset Match',
          value: preset,
          color: 'positive',
        });
      }

      // Orientation
      let orientation = '';
      if (width > height) orientation = 'Landscape';
      else if (height > width) orientation = 'Portrait';
      else orientation = 'Square';
      results.push({
        id: 'orientation',
        label: 'Orientation',
        value: orientation,
        color: 'neutral',
      });
    }

    if (mode === 'find-missing') {
      const ratioA = parseFloat(values.ratioA);
      const ratioB = parseFloat(values.ratioB);
      const knownDimension = values.knownDimension || 'width';
      const knownValue = parseFloat(values.knownValue);

      if (isNaN(ratioA) || ratioA <= 0 || isNaN(ratioB) || ratioB <= 0) return [];
      if (isNaN(knownValue) || knownValue <= 0) return [];

      let missingWidth: number;
      let missingHeight: number;

      if (knownDimension === 'width') {
        missingWidth = knownValue;
        missingHeight = (knownValue / ratioA) * ratioB;
      } else {
        missingHeight = knownValue;
        missingWidth = (knownValue / ratioB) * ratioA;
      }

      const g = gcd(missingWidth, missingHeight);
      const ratioW = missingWidth / g;
      const ratioH = missingHeight / g;
      const preset = findPreset(missingWidth, missingHeight);

      results.push({
        id: 'missingDimension',
        label: knownDimension === 'width' ? 'Calculated Height' : 'Calculated Width',
        value: `${fmtInt(knownDimension === 'width' ? missingHeight : missingWidth)} px`,
        highlight: true,
        color: 'positive',
      });

      results.push({
        id: 'givenWidth',
        label: knownDimension === 'width' ? 'Width' : 'Calculated Width',
        value: `${fmtInt(missingWidth)} px`,
        color: 'neutral',
      });

      results.push({
        id: 'givenHeight',
        label: knownDimension === 'height' ? 'Height' : 'Calculated Height',
        value: `${fmtInt(missingHeight)} px`,
        color: 'neutral',
      });

      results.push({
        id: 'ratio',
        label: 'Aspect Ratio',
        value: `${ratioW}:${ratioH}`,
        color: 'neutral',
      });

      if (preset) {
        results.push({
          id: 'presetMatch',
          label: 'Preset Match',
          value: preset,
          color: 'positive',
        });
      }
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AspectRatioPanel, { values, results });
  },
  educational: {
    formula: 'Simplified Ratio = W÷GCD(W,H) : H÷GCD(W,H) | Missing = (Known × RatioB) ÷ RatioA',
    formulaDescription:
      'The aspect ratio is the proportional relationship between width and height. To simplify a ratio, divide both dimensions by their greatest common divisor (GCD). When finding a missing dimension, multiply the known value by the proportional ratio component.',
    diagram: {
      svg: '<svg viewBox="0 0 460 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Common Aspect Ratios</text><!-- 16:9 --><rect x="30" y="30" width="100" height="56" rx="4" fill="var(--svg-3b82f6)" opacity="0.2" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="80" y="64" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-3b82f6)" font-weight="700" text-anchor="middle">16:9</text><text x="80" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Widescreen</text><!-- 4:3 --><rect x="165" y="30" width="75" height="56" rx="4" fill="var(--svg-22c55e)" opacity="0.2" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="202" y="64" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-22c55e)" font-weight="700" text-anchor="middle">4:3</text><text x="202" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Classic</text><!-- 1:1 --><rect x="275" y="30" width="56" height="56" rx="4" fill="var(--svg-f59e0b)" opacity="0.2" stroke="var(--svg-f59e0b)" stroke-width="2"/><text x="303" y="64" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-f59e0b)" font-weight="700" text-anchor="middle">1:1</text><text x="303" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Square</text><!-- 21:9 --><rect x="365" y="30" width="75" height="56" rx="4" fill="var(--svg-8b5cf6)" opacity="0.2" stroke="var(--svg-8b5cf6)" stroke-width="2"/><text x="402" y="64" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-8b5cf6)" font-weight="700" text-anchor="middle">21:9</text><text x="402" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Ultrawide</text><!-- Labels --><text x="230" y="110" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Width-to-height proportional relationship — the ratio remains constant regardless of absolute size</text></svg>',
      alt: 'Four rectangles illustrating common aspect ratios: 16:9 widescreen, 4:3 classic, 1:1 square, and 21:9 ultrawide',
      caption: 'Aspect ratio expresses the proportional relationship between width and height — simplifying by GCD gives the smallest whole-number representation.',
    },
    variables: [
      { symbol: 'GCD', name: 'Greatest Common Divisor', description: 'The largest number that divides both width and height evenly. Dividing both dimensions by the GCD yields the simplest whole-number aspect ratio.' },
      { symbol: 'Aspect Ratio', name: 'Width:Height Ratio', description: 'The proportional relationship expressed as two numbers separated by a colon. Common ratios include 16:9 (widescreen), 4:3 (classic), and 1:1 (square).' },
      { symbol: 'Orientation', name: 'Landscape or Portrait', description: 'Determined by whether the width exceeds the height (landscape), height exceeds width (portrait), or they are equal (square).' },
    ],
    quickReference: [
      { label: 'YouTube', value: '16:9' },
      { label: 'TikTok / IG Story', value: '9:16' },
      { label: 'IG Feed (Square)', value: '1:1' },
      { label: 'Facebook Feed', value: '16:9 or 1:1' },
      { label: 'Classic Photo', value: '3:2' },
      { label: 'Ultrawide Monitor', value: '21:9' },
    ],
    commonUses: [
      'Simplifying a display or image resolution (e.g., 1920x1080) to its standard aspect ratio for production specs',
      'Calculating the missing dimension when resizing images or videos to fit a specific ratio like 16:9 or 4:3',
      'Checking which social media format matches your content (Instagram feed, YouTube, TikTok, etc.)',
      'Determining the orientation and comparing aspect ratios for web design, photography, or video editing',
    ],
    howToUse: [
      'Select "Calculate aspect ratio from dimensions" to find the simplified ratio of a known width and height.',
      'Select "Find missing dimension from ratio" to solve for the unknown dimension when you know the ratio and one measurement.',
      'Review the simplified ratio, preset match, social media format suggestions, and orientation.',
    ],
    explanation:
      'Aspect ratio is a fundamental concept in visual media that describes the proportional relationship between width and height. It is expressed as two numbers separated by a colon (e.g., 16:9). Understanding aspect ratios is crucial for creating content that displays correctly across different platforms and devices. The most common modern display ratio is 16:9, which is the standard for HDTV, YouTube, and most computer monitors. However, the rise of mobile-first content has made 9:16 (vertical video) increasingly important for platforms like TikTok, Instagram Stories, and Snapchat. When preparing images or videos, using the wrong aspect ratio results in awkward letterboxing, cropping, or distorted content. The GCD method ensures the ratio is expressed in its simplest whole-number form — for example, a 1920×1080 display has a GCD of 120, yielding the simplified ratio 16:9. Social media platforms each have their own recommended aspect ratios: Instagram feed posts work best at 1:1 (square) or 4:5 (portrait), Facebook and YouTube prefer 16:9, and Pinterest images perform well at 2:3. Knowing how to calculate and convert between aspect ratios is an essential skill for photographers, videographers, web designers, and social media managers.',
    faqs: [
      {
        question: 'What is the most common aspect ratio for video?',
        answer: '16:9 is the most common aspect ratio for video content — used by YouTube, Netflix, HDTV, and most streaming platforms. For vertical video (mobile-first), 9:16 is standard for TikTok, Instagram Reels, YouTube Shorts, and Instagram Stories. Traditional TV and pre-HD content used 4:3. Cinema films often use wider ratios like 2.39:1 or 1.85:1.',
      },
      {
        question: 'Why does my video have black bars?',
        answer: 'Black bars (letterboxing or pillarboxing) appear when the video aspect ratio does not match the display aspect ratio. If you play a 4:3 video on a 16:9 screen, you get vertical black bars on the sides (pillarboxing). If you play a 2.39:1 widescreen film on a 16:9 screen, you get horizontal black bars on top and bottom (letterboxing). This maintains the original aspect ratio without cropping or stretching.',
      },
      {
        question: 'What aspect ratio should I use for Instagram?',
        answer: 'Instagram supports several aspect ratios depending on the format: Feed posts work best at 1:1 (square, 1080×1080), 4:5 (portrait, 1080×1350), or 1.91:1 (landscape, 1080×566). Instagram Stories and Reels use 9:16 (1080×1920). For IGTV and longer videos, 4:5 portrait orientation is recommended. Using the correct ratio ensures your content displays fully without awkward cropping in the feed.',
      },
      {
        question: 'How do I calculate the missing dimension from an aspect ratio?',
        answer: 'To find the missing dimension: multiply the known dimension by the target ratio, then divide by the known ratio. If you know the width (1920) and want a 16:9 ratio: height = (1920 × 9) / 16 = 1080. If you know the height (1080) and want 16:9: width = (1080 × 16) / 9 = 1920. This works for any ratio, whether you are calculating width or height.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Aspect Ratio (Image)', url: 'https://en.wikipedia.org/wiki/Aspect_ratio_(image)' },
      { source: 'Wolfram MathWorld', title: 'Aspect Ratio', url: 'https://mathworld.wolfram.com/AspectRatio.html' },
    ],
  },
};

export default aspectRatioConfig;
