import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import { createElement } from 'react';
import PixelsToInchesPanel from './PixelsToInchesPanel';
import { pixelInfo } from './pixelsMath';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';

const pixelsToInchesConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'pixels',
      label: 'Pixels',
      type: 'number',
      placeholder: '1920',
      min: 1,
      max: 1000000,
      step: 1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Pixel dimension (width or height) to convert to physical print size.',
    },
    {
      id: 'pixelsB',
      label: 'Other Dimension (optional)',
      type: 'number',
      placeholder: '4000',
      min: 1,
      max: 1000000,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Optional: the image\'s other side in pixels. Gives its print size and the exact megapixel count (width x height).',
    },
    {
      id: 'dpi',
      label: 'DPI / PPI',
      type: 'select',
      required: true,
      helpText: 'Output resolution in dots per inch. 72 DPI for web screens, 150-200 DPI for draft printing, 300 DPI for high-quality photo prints.',
      options: [
        { label: '72 DPI (Web / Screen)', value: '72' },
        { label: '96 DPI (Windows Screen)', value: '96' },
        { label: '150 DPI (Draft Print)', value: '150' },
        { label: '200 DPI (Quality Print)', value: '200' },
        { label: '300 DPI (High Quality Print)', value: '300' },
        { label: 'Custom DPI', value: 'custom' },
      ],
    },
    {
      id: 'customDpi',
      label: 'Custom DPI',
      type: 'number',
      placeholder: '250',
      min: 1,
      max: 2400,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Enter a custom DPI value between 1 and 2400. Dots per inch determines the density of your printed output — higher values produce smaller but sharper prints.',
      showWhen: (values) => values.dpi === 'custom',
    },
    {
      id: 'outputUnits',
      label: 'Output Units',
      type: 'select',
      required: false,
      defaultValue: 'all',
      helpText: 'Choose which measurement units to display. All shows inches, centimeters, and millimeters. Single unit shows only your preferred measurement system.',
      options: [
        { label: 'All Units (Imperial + Metric)', value: 'all' },
        { label: 'Imperial Only (inches)', value: 'imperial' },
        { label: 'Metric Only (cm + mm)', value: 'metric' },
      ],
    },
  ],
  calculate: (values) => {
    const p = pixelInfo(values);
    if (!p) return [];

    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtInt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const outputUnits = values.outputUnits || 'all';
    const results: CalculatorResult[] = [];

    if (outputUnits === 'all' || outputUnits === 'imperial') {
      results.push({ id: 'inches', label: 'Print Size (Inches)', value: `${fmt(p.inches)}"`, highlight: true, color: 'neutral' });
    }
    if (outputUnits === 'all' || outputUnits === 'metric') {
      results.push(
        { id: 'cm', label: 'Print Size (Centimeters)', value: `${fmt(p.cm)} cm`, color: 'neutral' },
        { id: 'mm', label: 'Print Size (Millimeters)', value: `${fmt(p.mm)} mm`, color: 'neutral' },
      );
    }
    if (p.inchesB !== null && p.cmB !== null) {
      const imp = `${fmt(p.inches)}" × ${fmt(p.inchesB)}"`;
      const met = `${fmt(p.cm)} × ${fmt(p.cmB)} cm`;
      results.push({
        id: 'printSize',
        label: 'Full Print Size (width × height)',
        value: outputUnits === 'metric' ? met : outputUnits === 'imperial' ? imp : `${imp} (${met})`,
        color: 'neutral',
      });
    }

    results.push(
      { id: 'dpiUsed', label: 'DPI / PPI Used', value: fmtInt(p.dpi), color: 'neutral' },
      {
        id: 'megapixels',
        label: p.squareAssumed ? 'Megapixels (if the image is square)' : 'Resolution (Megapixels)',
        value: `${fmt(p.megapixels)} MP`,
        color: 'neutral',
        interpretation: p.squareAssumed
          ? 'Only one side was entered, so this assumes a square image. Enter the other dimension for the real megapixel count.'
          : `${fmtInt(p.pixels)} × ${fmtInt(p.pixelsB as number)} px ÷ 1,000,000.`,
      },
    );

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PixelsToInchesPanel, { values, results });
  },
  explainSteps: (values) => {
    const p = pixelInfo(values);
    if (!p) return [];
    const results = pixelsToInchesConfig.calculate(values);
    const f2 = (x: number) => x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const n = (x: number) => x.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const units = values.outputUnits || 'all';
    const steps: ExplainStep[] = [{ label: 'Divide the pixels by the DPI', expr: `${n(p.pixels)} px ÷ ${n(p.dpi)} DPI = ${f2(p.inches)}"` }];
    if (units !== 'imperial') {
      steps.push({ label: 'Convert inches to centimetres and millimetres', expr: `${f2(p.inches)}" × 2.54 = ${f2(p.cm)} cm; × 25.4 = ${f2(p.mm)} mm` });
    }
    if (p.pixelsB !== null && p.inchesB !== null && p.cmB !== null) {
      steps.push({ label: 'Do the same for the other side', expr: `${n(p.pixelsB)} px ÷ ${n(p.dpi)} DPI = ${f2(p.inchesB)}" (${f2(p.cmB)} cm)` });
      steps.push({ label: 'Megapixels', expr: `${n(p.pixels)} × ${n(p.pixelsB)} ÷ 1,000,000 = ${resultValue(results, 'megapixels')}` });
    } else {
      steps.push({
        label: 'Megapixels (square image assumed)',
        expr: `${n(p.pixels)} × ${n(p.pixels)} ÷ 1,000,000 = ${resultValue(results, 'megapixels')}`,
        note: 'Only one side was entered, so the image is assumed to be square.',
      });
    }
    return finiteSteps(steps);
  },
  educational: {
    formula: 'Inches = Pixels ÷ DPI | cm = Inches × 2.54 | mm = Inches × 25.4 | MP = Width px × Height px ÷ 1,000,000',
    formulaDescription:
      'Converting digital pixels to physical print dimensions requires knowing the output resolution in DPI (dots per inch) or PPI (pixels per inch). The core formula divides the pixel dimension by the DPI to get the physical size in inches using the imperial measurement system. To convert to metric, multiply inches by 2.54 for centimeters or by 25.4 for millimeters. The megapixel count is width in pixels multiplied by height in pixels, divided by one million; if you enter only one side, the calculator assumes a square image and says so. Understanding this conversion chain from digital dimensions through imperial inches to metric centimeters enables photographers and designers to prepare images correctly for any output medium.',
    diagram: {
      svg: '<svg viewBox="0 0 460 140" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Pixel to Print Size at Different DPIs</text><text x="60" y="42" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="end">3000 px</text><text x="70" y="42" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-94a3b8)">→</text><rect x="80" y="30" width="160" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.15" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="160" y="46" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">72 DPI → 41.7"</text><text x="250" y="42" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)">(screen)</text><text x="60" y="72" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="end">3000 px</text><text x="70" y="72" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-94a3b8)">→</text><rect x="80" y="60" width="160" height="24" rx="4" fill="var(--svg-22c55e)" opacity="0.15" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="160" y="76" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">150 DPI → 20.0"</text><text x="250" y="72" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)">(large print)</text><text x="60" y="102" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="end">3000 px</text><text x="70" y="102" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-94a3b8)">→</text><rect x="80" y="90" width="160" height="24" rx="4" fill="var(--svg-f59e0b)" opacity="0.15" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="160" y="106" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">300 DPI → 10.0"</text><text x="250" y="102" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)">(print quality)</text><rect x="80" y="120" width="300" height="8" rx="3" fill="var(--svg-f1f5f9)" stroke="var(--svg-cbd5e1)" stroke-width="1"/><rect x="80" y="120" width="50" height="8" rx="3" fill="var(--svg-3b82f6)" opacity="0.4"/><rect x="130" y="120" width="100" height="8" fill="var(--svg-22c55e)" opacity="0.4"/><rect x="230" y="120" width="150" height="8" rx="3" fill="var(--svg-f59e0b)" opacity="0.4"/><text x="105" y="136" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">0-10"</text><text x="180" y="136" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">10-30"</text><text x="305" y="136" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">30-40+"</text></svg>',
      alt: 'Ruler diagram showing 3000 pixels converts to different print sizes at 72 DPI (41.7 inches), 150 DPI (20.0 inches), and 300 DPI (10.0 inches)',
      caption: 'Higher DPI produces sharper but physically smaller prints. A 3000px image prints at 10" at 300 DPI versus 41.7" at 72 DPI.',
    },
    variables: [
      { symbol: 'DPI / PPI', name: 'Dots Per Inch / Pixels Per Inch', description: 'The resolution density at which the image will be rendered on the output device. Web and screen displays traditionally use 72 DPI, modern screens use 96 DPI, and standard high-quality printing requires 300 DPI. Large format printing for posters and banners often uses 150 to 200 DPI since viewing distance is greater.' },
      { symbol: 'Pixels', name: 'Pixel Dimension', description: 'The width or height of the digital image in pixels. Enter one dimension at a time — for full print sizing, calculate width and height separately using their respective pixel counts. A 6000 by 4000 pixel image is 24 megapixels total (width × height ÷ 1,000,000).' },
      { symbol: 'Inches', name: 'Print Size in Inches', description: 'The physical dimension in the imperial measurement system at which the image will print given the specified DPI. For example, a 3000 pixel wide image at 300 DPI prints at exactly 10 inches wide. This is the primary measurement used in United States print shops and photo labs.' },
      { symbol: 'Megapixels', name: 'Estimated Resolution', description: 'Total pixels divided by one million: width × height ÷ 1,000,000. If only one side is entered the calculator assumes a square image. A 24 MP image (6000 × 4000 px) prints 20 × 13.3 inches at 300 DPI.' },
    ],
    commonUses: [
      'Preparing digital images for photo printing at labs or home printers by calculating the maximum print size at a given resolution',
      'Determining whether an existing image has sufficient pixel resolution for a specific print size before sending it to a client or printer',
      'Converting web-resolution graphics (72 DPI) to print-ready dimensions (300 DPI) for brochures, magazines, and marketing materials',
      'Calculating optimal display dimensions for digital signage, trade show displays, and large-format presentations where viewing distance matters',
    ],
    quickReference: [
      { label: 'A4 Print (210×297 mm)', value: '8.27 × 11.69" — needs 2480×3508 px at 300 DPI' },
      { label: 'Letter Size', value: '8.5 × 11" — needs 2550×3300 px at 300 DPI' },
      { label: '4 × 6" Photo', value: 'Needs 1200×1800 px at 300 DPI (2.2 MP)' },
      { label: '5 × 7" Photo', value: 'Needs 1500×2100 px at 300 DPI (3.15 MP)' },
      { label: '8 × 10" Photo', value: 'Needs 2400×3000 px at 300 DPI (7.2 MP)' },
      { label: '11 × 14" Poster', value: 'Needs 3300×4200 px at 300 DPI (13.9 MP)' },
      { label: 'Passport Photo', value: '2 × 2" — needs 600×600 px at 300 DPI' },
      { label: 'Billboard (48×14 ft)', value: 'Often printed at 30 DPI or less because of the long viewing distance' },
    ],
    howToUse: [
      'Enter the pixel dimension of your image (width or height) into the pixels field — for example, 1920 for a Full HD image width.',
      'Select the DPI or PPI from the preset options: 72 for web graphics, 96 for Windows screens, 150-200 for draft prints, or 300 for high-quality photo printing.',
      'Choose Custom DPI to enter any resolution value between 1 and 2400 if your printer or output device requires a specific non-standard density.',
      'Select your preferred output units to view the physical size in imperial inches, metric centimeters and millimeters, or both measurement systems.',
      'Compare the estimated megapixel resolution against common camera specs to understand your image quality relative to professional equipment.',
      'Use the quick reference table to check standard print sizes and their pixel requirements at 300 DPI for common photo and document formats.',
    ],
    explanation:
      'Understanding the relationship between digital pixels and physical print size is essential for photographers, graphic designers, and anyone preparing images for print. Dots per inch comes from halftone printing, which reproduces photographs with dots of varying size (the idea goes back to William Fox Talbot in the 1850s and became practical in the 1880s). The first desktop laser printers of the mid-1980s printed at 300 DPI, a benchmark still used for high-quality office and photo printing. The key principle is resolution density: DPI (dots per inch) or PPI (pixels per inch) determines how tightly the image data is packed into each inch of physical output. Higher DPI produces smaller physical dimensions but sharper detail — a 3000 pixel image prints at 10 inches wide at 300 DPI but stretches to an impressive 41.7 inches at 72 DPI. For web and screen use, 72 DPI was the traditional standard for CRT monitors, though modern Retina and HiDPI displays run at roughly 220 to 460 PPI through device pixel ratios of 2x or 3x. For professional print, 300 DPI is the gold standard for photo lab prints, magazines, and any material viewed from a typical reading distance of 12 to 18 inches. At 300 DPI, the human eye cannot resolve individual dots at normal viewing distance. Large format prints like posters and banners can use 150 DPI since viewing distance is greater — the farther away the viewer, the lower the DPI requirement. A common mistake is confusing pixel count with print quality: a 4000 pixel wide image at 72 DPI produces a 55 inch print (too soft for close viewing), while the same image at 300 DPI prints at a crisp 13.3 inches. Image resolution in megapixels helps quantify total image data: a 3000 by 3000 pixel image contains 9 million pixels (9 megapixels). When preparing images for print, always calculate the minimum pixel dimensions needed by multiplying the desired print size in inches by the required DPI of the output device.',
    faqs: [
      {
        question: 'What DPI should I use for printing photos?',
        answer: 'For high-quality photo prints viewed up close, use 300 DPI as the standard. This is the benchmark for photo lab prints, magazines, brochures, and any printed material held at a typical reading distance of 12 to 18 inches. For large format prints like posters and banners viewed from several feet away, 150 DPI is usually sufficient. Canvas prints are often supplied at about 150 to 200 DPI. For professional offset printing, some publications require 300 DPI minimum. When not to use 300 DPI: billboards and vehicle wraps viewed from a long way off are often printed at 30 DPI or less because the eye cannot resolve fine detail at that distance. Always confirm the required resolution with your specific print service provider before preparing files.',
      },
      {
        question: 'What is the difference between DPI and PPI?',
        answer: 'DPI (Dots Per Inch) refers to printer resolution — how many tiny dots of ink a printer can lay down per inch of paper. Modern inkjet printers may advertise 4800 or even 9600 DPI, but this refers to the addressable dot grid, not the image resolution you need to supply. PPI (Pixels Per Inch) refers to digital image resolution — how many pixels are packed into each inch of the image file. In everyday practice, the terms are used interchangeably when discussing image preparation. A "300 DPI print file" is technically a 300 PPI image file. For print preparation, what matters is PPI: send your printer a 300 PPI file, and the printer\'s internal systems handle the conversion to its native ink dot pattern.',
      },
      {
        question: 'How many pixels do I need for a specific print size?',
        answer: 'Multiply the desired print size in inches by the target DPI. For an 8 by 10 inch print at 300 DPI: 8 × 300 = 2400 pixels for the width, and 10 × 300 = 3000 pixels for the height — a 7.2 megapixel image. For a 4 by 6 inch print at 300 DPI: 4 × 300 = 1200 pixels by 6 × 300 = 1800 pixels — only 2.2 megapixels. For a 16 by 20 inch large print at 300 DPI: 16 × 300 = 4800 pixels by 20 × 300 = 6000 pixels — 28.8 megapixels, requiring a professional full-frame camera. At 150 DPI (acceptable for wall art), the same 16 by 20 inch print only needs 2400 by 3000 pixels (7.2 megapixels), well within the capability of most modern smartphones.',
      },
      {
        question: 'Can I increase the DPI of an existing image to make it print larger?',
        answer: 'Technically yes through a process called upsampling or interpolation, but it will reduce print quality. Increasing DPI without adding new pixel data forces the software to mathematically guess (interpolate) the values of new pixels between existing ones, resulting in a softer, less detailed image. Modern AI upscaling tools like Adobe Super Resolution and Topaz Gigapixel can produce remarkably good results by analyzing image content and intelligently fabricating detail, but they cannot create real detail that was never captured. The best approach is always to capture images at sufficient resolution for your largest intended print size. Modest upsampling is often acceptable, but the more you enlarge, the more softness becomes visible.',
      },
      {
        question: 'Does DPI matter for images displayed on web screens?',
        answer: 'No — DPI metadata embedded in image files is completely ignored by web browsers and virtually all screen-based applications. An image that is 1200 pixels wide will display at exactly 1200 screen pixels on a standard display, regardless of whether the DPI metadata says 72, 300, or any other value. What matters for web and screen display is only the actual pixel dimensions. For Retina and HiDPI displays with 2x or 3x device pixel ratios, export images at 2x or 3x the CSS display size: a 300 pixel wide image container should receive a 600 pixel wide source file for 2x displays to appear sharp.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A photographer has a 6000 by 4000 pixel image from a 24-megapixel DSLR and wants to know the largest high-quality print possible. At 300 DPI, 6000 divided by 300 equals 20 inches wide, and 4000 divided by 300 equals 13.3 inches tall, so a 20 by 13.3 inch print. At 200 DPI (acceptable for canvas or wall art viewed from a few feet away), the same image prints at 30 by 20 inches.',
        inputs: { pixels: '6000', dpi: '300' },
        result: 'Print size: 20.00" (50.80 cm / 508.00 mm) at 300 DPI.',
        insight: 'The DPI needed depends entirely on viewing distance. Close-up viewing at 12-18 inches requires 300 DPI. Wall art viewed from 3-6 feet is fine at 150-200 DPI. A poster across the room at 10+ feet can get by with roughly 72-100 DPI. Billboards are often printed at 30 DPI or less. A 24 MP image can print very large as long as DPI is matched to the expected viewing distance.',
      },
      {
        scenario: 'A parent needs to prepare a 4 by 6 inch photo for printing at a drugstore photo kiosk at 300 DPI. Working backwards: 4 inches multiplied by 300 DPI equals 1200 pixels for the short edge, and 6 inches multiplied by 300 DPI equals 1800 pixels for the long edge. They need at least a 1200 by 1800 pixel image, which is only 2.16 megapixels. Any smartphone camera made in the last decade captures far more than this — most phone photos are 12 megapixels (4032 by 3024 pixels).',
        inputs: { pixels: '1200', dpi: '300' },
        result: 'Print size: 4.00" (10.16 cm / 101.60 mm) at 300 DPI.',
        insight: 'For 4 by 6 inch prints, just 2.2 megapixels is sufficient at 300 DPI. An 8 by 10 inch print needs 2400 by 3000 pixels (7.2 MP). A wallet-size 2 by 3 inch print needs only 600 by 900 pixels (0.5 MP). Most consumer cameras and smartphones from the last decade easily meet these requirements for small and medium print sizes. The limiting factor for print quality is rarely the camera — it is usually incorrect export settings or excessive compression.',
      },
      {
        scenario: 'A graphic designer is preparing a 24 by 36 inch poster for a trade show booth. The poster will be viewed from 4 to 8 feet away by attendees walking through the exhibit hall. At 300 DPI, the file would need to be 7200 by 10800 pixels (77.8 megapixels) — impractical for most design workflows. At 150 DPI (sufficient for this viewing distance), the file only needs 3600 by 5400 pixels (19.4 megapixels), which is manageable in Adobe Illustrator or Photoshop.',
        inputs: { pixels: '3600', dpi: '150' },
        result: 'Print size: 24.00" (60.96 cm / 609.60 mm) at 150 DPI.',
        insight: 'For trade show displays and large format posters, 150 DPI is a common choice because at a viewing distance of 4-8 feet the eye cannot make out finer detail. Pushing to 300 DPI for a large poster creates enormous file sizes with no visible quality improvement at the intended viewing distance. The 19.4 megapixel requirement at 150 DPI is well within the capability of a professional DSLR or mirrorless camera for photographic posters, or trivially handled by vector design software for text and graphic posters.',
      },
    ],
    proTips: [
      'Always prepare print files at 300 DPI for photo labs, magazines, and any material viewed up close. 300 DPI is the industry standard because at this density, the human eye cannot resolve individual dots from a typical reading distance of 12 to 18 inches.',
      'When scanning photos or documents, scan at the resolution needed for your final print size, not just "as high as possible." A 4 by 6 inch photo scanned at 600 DPI produces a 2400 by 3600 pixel image — enough for an 8 by 12 inch reprint at 300 DPI. Scanning at 1200 DPI for a small photo rarely provides additional real detail beyond what 600 DPI captures.',
      'For large format prints like posters, banners, and trade show displays, 150 DPI is usually sufficient. The larger the print, the farther away people naturally stand to view it, and the lower the DPI requirement. Pushing unnecessarily high DPI for large prints bloats file sizes and slows down design software without any visible quality improvement.',
      'Web images should always be exported at screen resolution, not print resolution. More importantly, pixel dimensions should match the display container — never upload a 6000 pixel wide image for an 800 pixel wide website container. This wastes bandwidth, dramatically slows page load times, and hurts SEO rankings through poor Core Web Vitals scores.',
      'For Retina and HiDPI displays (common on modern MacBooks, iPhones, and high-end Android devices), export images at 2x or 3x the CSS display size. A 300 pixel wide image slot on a webpage should receive a 600 pixel wide source file for 2x displays and 900 pixels for 3x displays. This ensures your images look razor-sharp on premium screens.',
      'The relationship between megapixels and print size is quadratic, not linear. Doubling the print dimensions requires quadrupling the megapixels. An 8 by 10 inch print at 300 DPI needs 7.2 MP, but a 16 by 20 inch print at the same DPI needs 28.8 MP — four times the resolution for a print with twice the dimensions.',
    ],
    limitations: [
      'The main result converts one pixel dimension to its print size; enter the optional other dimension to get both sides and the exact megapixel count.',
      'DPI metadata embedded in image files is completely ignored by web browsers, which display images at one image pixel per one screen pixel regardless of the DPI setting in the file.',
      'If you leave the other dimension blank, the megapixel figure assumes a square image; enter both sides for the real count.',
      'For images that will be cropped before printing, calculate based on the cropped dimensions, not the original full-file pixel count.',
      'Retina and HiDPI displays use device pixel ratios of 2x or 3x — this calculator does not account for device pixel ratios, which are a display concern not a print concern.',
      'For full image preparation workflows, pair this tool with an aspect ratio calculator to determine both dimensions simultaneously, and always soft-proof your images through your editing software before sending files to print.',
    ],
    citations: [
      { source: 'Wikipedia - Dots Per Inch', url: 'https://en.wikipedia.org/wiki/Dots_per_inch' },
      { source: 'Wikipedia - Pixel', url: 'https://en.wikipedia.org/wiki/Pixel' },
      { source: 'Wolfram MathWorld - Image Resolution', url: 'https://mathworld.wolfram.com/Resolution.html' },
    ],
  },
};

export default pixelsToInchesConfig;
