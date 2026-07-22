import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import QRCodePanel from './QRCodePanel';

const qrCodeGeneratorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'content',
      label: 'Content (text or URL)',
      type: 'textarea',
      defaultValue: 'https://example.com/',
      placeholder: 'Enter text or URL...',
      required: true,
      helpText: 'The text or URL to encode in the QR code',
    },
    {
      id: 'size',
      label: 'QR Code Size',
      type: 'number',
      inputMode: 'numeric',
      defaultValue: '200',
      min: 100,
      max: 500,
      step: 50,
      placeholder: '200',
      unit: 'px',
      helpText: 'Width and height of the QR code image in pixels',
    },
    {
      id: 'errorCorrection',
      label: 'Error Correction Level',
      type: 'select',
      defaultValue: 'M',
      helpText: 'Higher levels allow more damage recovery but reduce data capacity',
      options: [
        { label: 'L — Low (7% recovery)', value: 'L' },
        { label: 'M — Medium (15% recovery)', value: 'M' },
        { label: 'Q — Quartile (25% recovery)', value: 'Q' },
        { label: 'H — High (30% recovery)', value: 'H' },
      ],
      showWhen: (values) => (values.content || '').length > 0,
    },
  ],
  calculate: (values: Record<string, string>) => {
    const content = values.content || '';
    const sizeStr = values.size || '';
    const size = sizeStr ? parseInt(sizeStr, 10) : 200;

    if (!content.trim()) return [];

    const clampedSize = Math.round(Math.max(100, Math.min(500, isNaN(size) ? 200 : size)));
    const encodedContent = encodeURIComponent(content.trim());
    const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${clampedSize}x${clampedSize}&data=${encodedContent}`;
    const preview = content.length > 40 ? content.substring(0, 40) + '...' : content;

    return [
      {
        id: 'info',
        label: 'Info',
        value: `QR code generated for: ${preview}`,
        color: 'positive',
      },
      {
        id: '_qrData',
        label: 'QR Data',
        value: JSON.stringify({ content: content.trim(), size: clampedSize, imageUrl }),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(QRCodePanel, { values, results });
  },
  educational: {
    formula: 'QR Code = Error-corrected data modules + Finder patterns + Timing patterns',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="30" y="15" width="380" height="310" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1.5" rx="8"/><text x="220" y="42" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e293b)">QR Code Structure</text><rect x="70" y="65" width="200" height="200" fill="var(--svg-ffffff)" stroke="var(--svg-94a3b8)" stroke-width="1"/><rect x="80" y="75" width="50" height="50" fill="var(--svg-1e293b)" rx="2"/><rect x="130" y="75" width="50" height="50" fill="var(--svg-1e293b)" rx="2"/><rect x="80" y="125" width="50" height="50" fill="var(--svg-1e293b)" rx="2"/><rect x="190" y="75" width="40" height="40" fill="var(--svg-3b82f6)" rx="1"/><rect x="190" y="115" width="40" height="40" fill="var(--svg-3b82f6)" rx="1"/><rect x="230" y="65" width="140" height="200" fill="var(--svg-f8fafc)"/><text x="300" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Legend</text><rect x="240" y="105" width="16" height="16" fill="var(--svg-1e293b)" rx="2"/><text x="264" y="117" font-size="10" fill="var(--svg-1e293b)">Finder Pattern</text><rect x="240" y="130" width="16" height="16" fill="var(--svg-3b82f6)" rx="2"/><text x="264" y="142" font-size="10" fill="var(--svg-3b82f6)">Timing Pattern</text><rect x="240" y="155" width="16" height="16" fill="var(--svg-22c55e)" rx="2"/><text x="264" y="167" font-size="10" fill="var(--svg-22c55e)">Data Module</text><rect x="240" y="180" width="16" height="16" fill="var(--svg-ef4444)" rx="2"/><text x="264" y="192" font-size="10" fill="var(--svg-ef4444)">Error Correction</text></svg>',
      alt: 'Diagram showing the internal structure of a QR code including finder patterns, timing patterns, data modules, and error correction regions',
      caption: 'QR code anatomy: finder patterns (position detection), timing patterns, data modules, and error correction codewords',
    },
    formulaDescription:
      'A QR (Quick Response) code is a two-dimensional matrix barcode invented by Denso Wave in 1994. Data is encoded in black and white square modules arranged in a grid pattern. The structure includes finder patterns (the three large squares in corners for position detection), timing patterns for module alignment, format and version information, and the data area with error correction codewords using Reed-Solomon codes.',
    variables: [
      {
        symbol: 'Modules',
        name: 'QR Code Modules',
        description: 'The individual black and white squares that make up a QR code. Version 40 QR codes have 177 x 177 = 31,329 modules.',
      },
      {
        symbol: 'Finder Pattern',
        name: 'Position Detection Pattern',
        description: 'The three large square patterns in the corners of a QR code that allow scanners to detect the code orientation and position regardless of rotation.',
      },
      {
        symbol: 'Error Correction',
        name: 'Reed-Solomon Error Correction',
        description: 'QR codes use Reed-Solomon error correction with four levels (L, M, Q, H) allowing recovery of 7%, 15%, 25%, or 30% of the data respectively.',
      },
      {
        symbol: 'Version',
        name: 'QR Code Version',
        description: 'The size of the QR code matrix, from Version 1 (21 x 21 modules) to Version 40 (177 x 177 modules). Higher versions store more data.',
      },
    ],
    howToUse: [
      'Enter the text, URL, WiFi credentials, or any content you want to encode in the QR code.',
      'Adjust the pixel size (100px to 500px) using the slider or number input to control image resolution.',
      'Select the desired error correction level (L, M, Q, H) to balance between data capacity and damage resilience.',
      'The QR code image is generated via the QR Server API and displayed in the interactive preview panel below.',
      'Use the download button to save the QR code as a PNG image file for use in print, web, or sharing.',
    ],
    quickReference: [
      { label: 'Version 1 capacity', value: '25 alphanumeric / 17 bytes / 10 kanji' },
      { label: 'Version 40 capacity', value: '4,296 alphanumeric / 2,953 bytes / 1,817 kanji' },
      { label: 'Error Correction L', value: 'Recovers 7% of codewords' },
      { label: 'Error Correction H', value: 'Recovers 30% of codewords' },
    ],
    commonUses: [
      'Sharing website URLs and landing pages in print media, posters, and business cards.',
      'Encoding WiFi credentials for quick network access without typing passwords on mobile devices.',
      'Storing contact information (vCard format) for easy mobile phone import and address book integration.',
      'Providing product information, serial numbers, and authentication codes in manufacturing and logistics.',
      'Contactless payment and ticketing systems in retail, events, and public transportation.',
    ],
    explanation:
      'QR (Quick Response) codes are two-dimensional barcodes invented by Denso Wave, a subsidiary of Toyota, in 1994 for tracking automotive parts. The technology quickly spread beyond manufacturing into consumer applications worldwide. A QR code encodes data using black modules arranged in a square grid on a white background, read by cameras and image processing algorithms. The structure includes finder patterns (three identical squares in corners) that allow omnidirectional scanning, timing patterns that define module positions, alignment patterns for larger versions, format information, version information, and the actual data regions with error correction codewords. Reed-Solomon error correction is key to QR code reliability: even if a QR code is partially damaged, dirty, or obscured, the data can still be recovered. The four error correction levels (L, M, Q, H) allow users to trade data capacity for resilience. QR codes support four data modes: numeric, alphanumeric, byte/binary, and Kanji. The maximum capacity depends on both version and error correction level: a Version 40 QR code with L-level correction can store up to 4,296 alphanumeric characters or 2,953 bytes.',
    faqs: [
      {
        question: 'How much data can a QR code store?',
        answer: 'The capacity depends on the version and error correction level. The maximum is Version 40 with Level L correction: 7,089 numeric digits, 4,296 alphanumeric characters, 2,953 bytes, or 1,817 Kanji characters. Higher error correction levels reduce capacity but increase damage tolerance.',
      },
      {
        question: 'What is the difference between static and dynamic QR codes?',
        answer: 'Static QR codes encode data directly in the pattern — the data cannot be changed after generation. Dynamic QR codes encode a short URL that redirects to the actual content, allowing the destination to be changed without reprinting the code. Dynamic codes also support tracking scan statistics.',
      },
      {
        question: 'Can QR codes be scanned at any angle?',
        answer: 'Yes, QR codes use three finder patterns in corners that allow omnidirectional scanning. The scanner detects the patterns to determine orientation, regardless of whether the code is rotated 0, 90, 180, or 270 degrees. This is a key advantage over traditional barcodes which require alignment with a scanner.',
      },
      {
        question: 'Can I use a QR code to share WiFi credentials?',
        answer: 'Yes, WiFi QR codes use the format: WIFI:S:<SSID>;T:<WPA|WEP|>;P:<password>;;. For example, WIFI:S:MyNetwork;T:WPA;P:mypassword123;; encodes a WPA-protected network. When a smartphone scans this QR code, it automatically connects to the WiFi network. This is especially useful for guest networks in offices, cafes, and homes.',
      },
      {
        question: 'What are Micro QR codes and how are they different?',
        answer: 'Micro QR codes are a smaller variant with only one finder pattern instead of three, designed for applications where space is extremely limited, such as tiny electronic components or high-density data matrices. They can encode up to 35 numeric digits or 21 alphanumeric characters. Micro QR codes are commonly used in inventory management for small parts, printed circuit boards, and pharmaceutical packaging.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A marketing team is designing a brochure and wants to include a QR code linking to their product landing page at https://shop.example.com/brand-new-widget. They need the QR code to be large enough for print at 300 DPI.',
        inputs: {
          'Content': 'https://shop.example.com/brand-new-widget',
          'Size': '350 px',
        },
        result: 'QR code generated for: https://shop.example.com/brand-new-widget (350x350 px)',
        insight: 'For print use at 300 DPI, a 350 px QR code produces a physical size of approximately 1.17 inches (350/300). This is large enough for a standard brochure. Always test print a sample before mass production to verify scannability under real-world lighting conditions.',
      },
      {
        scenario: 'A developer needs to encode a PostgreSQL connection string: "postgresql://user:password@db.internal.example.com:5432/mydb?sslmode=require" and verify that special characters like colons, slashes, and question marks are handled correctly.',
        inputs: {
          'Content': 'postgresql://user:password@db.internal.example.com:5432/mydb?sslmode=require',
          'Size': '200 px',
        },
        result: 'QR code generated for: postgresql://user:password@db.internal.example.com:5432/... (200x200 px)',
        insight: 'QR codes handle special characters including colons, slashes, question marks, and @ symbols without any issue. However, for security, never encode passwords or connection strings in QR codes that will be shared publicly — anyone who scans the code can extract the full content.',
      },
    ],
    proTips: [
      'Always test scan a newly generated QR code with at least two different devices (iOS and Android) before distributing it. Different camera sensors and scanning apps handle contrast and lighting conditions differently.',
      'For printed QR codes, maintain at least a 4-module quiet zone (white border) around the code. Without sufficient white space, the scanner may fail to identify where the QR code begins and ends.',
      'When encoding URLs, prefer short URLs or use a URL shortener. Longer URLs require higher QR code versions with smaller modules, making them harder to scan reliably — especially for URLs over 50 characters.',
      'For logos overlaid on QR codes, limit the logo to no more than 30% of the QR code area and use the H (high) error correction level to ensure enough redundant data remains for successful scanning.',
      'QR codes work best with maximum contrast: black modules on a white background. Avoid gradient backgrounds, low-contrast color schemes, and patterned backgrounds behind QR codes.',
      'Dynamic QR codes (encoding a redirect URL) let you update the destination without reprinting. Services like Bitly or QR Code API can create trackable dynamic QR codes with scan analytics.',
    ],
    limitations: [
      'This generator uses a third-party API (api.qrserver.com) to generate QR code images, which means it requires an internet connection. Offline QR generation would require a JavaScript library like qrcode.js running entirely in the browser.',
      'The maximum data capacity depends on the QR code version and error correction level. Very long content (over ~2000 characters) may fail to generate as it exceeds even a Version 40 QR code with Level L correction. When not to use: encoding very large payloads like full documents or large JSON blobs.',
      'QR codes cannot encode binary data or non-UTF-8 character sets through this API interface. For binary data encoding, use a specialized QR library that supports byte mode directly.',
      'The generated QR code images are static — once created, the encoded data cannot be changed. When not to use for: updatable content like dynamic event schedules or changing URLs without a redirect service.',
      'Print scaling should maintain a 1:1 pixel ratio. If a 200px QR code is printed at 2x physical size, the effective resolution halves, making smaller modules harder to scan. The smallest module should be at least 0.4mm in physical size.',
    ],
    citations: [
      { title: 'QRcode.com — Denso Wave', url: 'https://www.qrcode.com/en/' },
      { title: 'Wikipedia — QR Code', url: 'https://en.wikipedia.org/wiki/QR_code' },
    ],
  },
};

export default qrCodeGeneratorConfig;
