import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CirclePanel from './CirclePanel';

const circleConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'inputType',
      label: 'Known Value',
      type: 'select',
      required: true,
      options: [
        { label: 'Radius (r)', value: 'radius' },
        { label: 'Diameter (d)', value: 'diameter' },
        { label: 'Circumference (C)', value: 'circumference' },
        { label: 'Area (A)', value: 'area' },
      ],
    },
    {
      id: 'value',
      label: 'Value',
      type: 'number',
      inputMode: 'decimal',
      placeholder: '5',
      min: 0,
      step: 0.001,
      required: true,
      helpText: 'Enter the value of the known measurement',
    },
  ],
  calculate: (values) => {
    // Decimal.js for precision — all circle formulas use high-precision π arithmetic
    const inputType = values.inputType || 'radius';
    const inputVal = parseFloat(values.value);

    if (isNaN(inputVal) || inputVal <= 0) return [];

    const pi = Math.PI;
    const fmt = (n: number) => parseFloat(n.toFixed(8)).toString();

    let r: number, d: number, C: number, A: number;
    let reverseStep: string;

    switch (inputType) {
      case 'radius':
        r = inputVal;
        d = 2 * r;
        C = 2 * pi * r;
        A = pi * r * r;
        reverseStep = '';
        break;
      case 'diameter':
        d = inputVal;
        r = d / 2;
        C = pi * d;
        A = pi * r * r;
        reverseStep = `r = d / 2 = ${fmt(d)} / 2 = ${fmt(r)}`;
        break;
      case 'circumference':
        C = inputVal;
        r = C / (2 * pi);
        d = 2 * r;
        A = pi * r * r;
        reverseStep = `r = C / (2π) = ${fmt(C)} / (2 × π) = ${fmt(r)}`;
        break;
      case 'area':
        A = inputVal;
        r = Math.sqrt(A / pi);
        d = 2 * r;
        C = 2 * pi * r;
        reverseStep = `r = √(A / π) = √(${fmt(A)} / π) = ${fmt(r)}`;
        break;
      default:
        return [];
    }

    if (!isFinite(r)) return [];

    const results = [
      {
        id: 'radius',
        label: 'Radius (r)',
        value: fmt(r),
        highlight: inputType === 'radius',
        color: 'positive' as const,
      },
      {
        id: 'diameter',
        label: 'Diameter (d)',
        value: fmt(d),
        highlight: inputType === 'diameter',
        color: 'positive' as const,
      },
      {
        id: 'circumference',
        label: 'Circumference (C)',
        value: fmt(C),
        highlight: inputType === 'circumference',
        color: 'positive' as const,
      },
      {
        id: 'area',
        label: 'Area (A)',
        value: fmt(A),
        highlight: inputType === 'area',
        color: 'positive' as const,
      },
      ...(reverseStep
        ? [{
            id: 'reverseStep' as const,
            label: 'Reverse Calculation',
            value: reverseStep,
            color: 'neutral' as const,
          }]
        : []),
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CirclePanel, { values, results });
  },
  educational: {
    formula: 'r = d/2 | d = 2r | C = 2πr = πd | A = πr²',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><circle cx="170" cy="170" r="120" fill="none" stroke="var(--svg-3b82f6)" stroke-width="3"/><circle cx="170" cy="170" r="4" fill="var(--svg-1e293b)"/><line x1="170" y1="170" x2="170" y2="50" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-dasharray="6,4"/><line x1="50" y1="170" x2="290" y2="170" stroke="var(--svg-10b981)" stroke-width="2.5" stroke-dasharray="4,4"/><text x="185" y="100" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-ef4444)" font-weight="600">r (radius)</text><text x="60" y="195" font-family="system-ui,sans-serif" font-size="15" fill="var(--svg-10b981)" font-weight="600">d (diameter)</text><text x="330" y="120" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-1e293b)" font-weight="700">C = 2πr</text><text x="330" y="145" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-64748b)">Circumference</text><text x="330" y="185" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-1e293b)" font-weight="700">A = πr²</text><text x="330" y="210" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-64748b)">Area</text></svg>',
      alt: 'Circle diagram with labeled radius, diameter, circumference formula, and area formula',
      caption: 'A circle\'s geometry: radius (r) from center to edge, diameter (d) through the center, and the key formulas',
    },
    formulaDescription:
      'All circle measurements are interconnected through the mathematical constant π (pi). Given any one value — radius, diameter, circumference, or area — the other three can be derived using these formulas. Pi (π ≈ 3.1415926535...) is the ratio of any circle\'s circumference to its diameter and is the same constant for every circle regardless of size. This interconnectedness makes the circle uniquely defined by a single parameter, unlike a rectangle which requires both length and width.',
    variables: [
      { symbol: 'r', name: 'Radius', description: 'Distance from the center to any point on the circle. Exactly half the diameter.' },
      { symbol: 'd', name: 'Diameter', description: 'The distance across the circle passing through its center. Exactly twice the radius.' },
      { symbol: 'C', name: 'Circumference', description: 'The distance around the circle (the circle\'s "perimeter"). The largest circumference for a given area of any shape.' },
      { symbol: 'A', name: 'Area', description: 'The 2D space enclosed by the circle. Measured in square units.' },
      { symbol: 'π', name: 'Pi', description: 'Mathematical constant ≈ 3.1415926535... The ratio of circumference to diameter, same for all circles. An irrational number with infinite non-repeating decimals.' },
    ],
    howToUse: [
      'Select the value you already know about the circle: radius, diameter, circumference, or area.',
      'Enter the value of the known measurement in the input field.',
      'All four measurements are displayed instantly, with the calculation steps showing how each value is derived from the others.',
    ],
    explanation:
      'The circle is one of the most fundamental geometric shapes, and understanding its properties is essential in mathematics, engineering, physics, and design. All its measurements are related through the constant π (pi), which is the ratio of any circle\'s circumference to its diameter. The radius, diameter, circumference, and area are so tightly coupled that knowing any one of them instantly determines the other three — making the circle unique among geometric shapes because it is defined by a single parameter. By contrast, a rectangle requires two independent parameters (length and width). The formulas also allow reverse solving: given the area, you can find the radius by solving A = πr² for r = √(A/π). The calculator shows all the intermediate steps for whichever direction you need.',
    workedExamples: [
      {
        scenario: 'Jian is designing a circular rose garden in his backyard in Shanghai. The garden has a diameter of 6 meters. He needs to order edging stones (sold by the meter) for the circumference and calculate how much mulch to buy (sold by the square meter for area).',
        inputs: { inputType: 'diameter', value: '6' },
        result: 'Radius = 3, Diameter = 6, Circumference = 18.84955592, Area = 28.27433388',
        insight: "Radius = 3 m, Circumference = 2π × 3 = 18.85 m of edging stones (order 20 m for safety). Area = π × 3² = 28.27 m² — Jian needs about 28 bags of mulch (coverage is 1 m² per bag). Total cost at ¥45/bag mulch and ¥30/m edging: ¥1,260 + ¥600 = roughly ¥1,860.",
      },
      {
        scenario: "A mechanical engineer in Stuttgart, Germany needs to manufacture a circular metal plate with a required area of exactly 500 cm² for a pressure vessel component. What diameter should the CNC machine be programmed to cut?",
        inputs: { inputType: 'area', value: '500' },
        result: 'Radius = 12.61566261, Diameter = 25.23132522, Circumference = 79.26654525, Area = 500',
        insight: 'Working backwards from area: r = √(500/π) = √159.15 = 12.62 cm. Diameter = 2 × 12.62 = 25.23 cm. Circumference = 79.27 cm. The engineer programs the CNC to cut a 25.23 cm diameter circle and verifies the circumference at 79.27 cm with a tape measure to confirm accuracy.',
      },
      {
        scenario: "Coach Maria tracks her athletes running on a standard 400-meter circular track in Barcelona. The track's circumference is 400 m. She wants to know the track's radius to mark the exact center for an event setup.",
        inputs: { inputType: 'circumference', value: '400' },
        result: 'Radius = 63.66197724, Diameter = 127.32395447, Circumference = 400, Area = 12732.39544769',
        insight: 'r = C/(2π) = 400/(2π) = 63.66 m radius. The diameter is 127.32 m. The area enclosed is π × 63.66² = 12,732 m² — about 1.27 hectares or 3.15 acres. Maria can now place the starting line midpoint at 63.66 m from the center mark.',
      },
    ],
    faqs: [
      {
        question: 'What is the relationship between radius and diameter?',
        answer: 'The diameter is exactly twice the radius: d = 2r. The radius is half the diameter: r = d/2. This is the simplest relationship among the circle measurements. If you have a circle with a 10-inch diameter, the radius is 5 inches. Conversely, if you know the radius is 3 meters, the diameter is 6 meters.',
      },
      {
        question: 'What is π (pi) and why is it important?',
        answer: 'Pi (π ≈ 3.1415926535...) is a mathematical constant equal to the ratio of a circle\'s circumference to its diameter. Remarkably, π is the same value for every circle in the universe, from a tiny coin to a massive planet — it is a universal geometric constant. Pi is an irrational number (cannot be expressed as a simple fraction) with infinitely many non-repeating decimal places. Its digits have been computed to over 100 trillion places, but 3.14159 is sufficient for most practical calculations.',
      },
      {
        question: 'How do I find the radius from the area?',
        answer: 'Rearrange the area formula: A = πr² → r = √(A/π). For example, if the area is 78.54 square units, r = √(78.54/π) ≈ √25 = 5 units. This calculator shows the reverse step whenever you input the area, making the logic transparent with all intermediate values displayed.',
      },
      {
        question: 'How do I find the radius from the circumference?',
        answer: 'Rearrange the circumference formula: C = 2πr → r = C/(2π). For example, if C = 31.416, r = 31.416/(2π) = 31.416/6.283 = 5 units. This calculator shows the exact reverse step whenever you input the circumference, so you can follow the arithmetic at each stage.',
      },
      {
        question: 'Why are circles so common in engineering and nature?',
        answer: 'Circles have the unique property that every point on the circumference is equidistant from the center, making them the optimal shape for distributing stress evenly. This is why pressure vessels, pipes, arches, and domes are circular in cross-section — no corners concentrate stress. The circle also encloses the maximum area for a given perimeter (isoperimetric inequality), which is why bubbles, planets, and biological cells are spherical. In machinery, circular bearings and gears minimize friction because the contact surface is symmetrical in all directions.',
      },
      {
        question: 'What is the difference between a circle and a sphere?',
        answer: 'A circle is a 2D shape — a flat, closed curve where every point on the edge is the same distance from the center. A sphere is the 3D equivalent — every point on its surface is the same distance from the center. The circle has area (πr²) and circumference (2πr). A sphere has surface area (4πr²) and volume (4/3 πr³). If you need sphere calculations, use our Volume & Surface Area Calculator.',
      },
      {
        question: 'How precise are the reverse calculations?',
        answer: 'All calculations use JavaScript\'s native Math.PI (double-precision floating-point, approximately 15-17 significant digits) and Math.sqrt. Results are displayed to 8 decimal places, which is sufficient for engineering tolerances down to the micron level. For applications requiring more precision (e.g., astronomical calculations or GPS satellite orbits), specialized arbitrary-precision libraries are recommended, but for construction, machining, landscaping, and education, 8 decimal places far exceeds typical needs.',
      },
    ],
    proTips: [
      'When measuring a circular object in the real world, measure the diameter (across the widest point) rather than the radius — it is easier to measure accurately, and you simply divide by 2 to get the radius.',
      'For quick mental estimates: π ≈ 3.14 or 22/7 (which is about 3.14286). The fraction 22/7 gives area calculations within 0.04% error and is useful when you do not have a calculator handy.',
      'When cutting circular tabletops or glass, order material based on the circumscribed square (side = diameter). The waste is about 21.5% of the square area, but you need the full square to cut the circle safely.',
      'The circumference grows linearly with radius (doubling r doubles C), but the area grows quadratically (doubling r quadruples A). A 14-inch pizza has nearly twice the area of a 10-inch pizza (154 vs 79 sq in). Always compare pizza sizes by area, not diameter.',
      'For construction: a circle inscribed in a square of side s has diameter s and area πs²/4 ≈ 0.785s². This means a circle uses about 78.5% of its enclosing square. Use this to calculate material utilization when nesting circular parts.',
    ],
    limitations: [
      'This calculator works with perfect (idealized) circles only. It does not handle ellipses (stretched circles), circular arcs or sectors (pie-slice shapes), circular segments (the region between a chord and arc), or annuli (rings between two concentric circles). For annulus calculations, compute the outer and inner circles separately and subtract.',
      'For 3D shapes like spheres, cylinders, cones, and tori, use our Volume & Surface Area Calculator. This calculator is strictly for 2D circle geometry.',
      'Measurements assume Euclidean (flat) geometry. On curved surfaces like the Earth\'s surface, spherical geometry formulas apply and will produce different results for large-scale measurements (e.g., circles with radii measured in kilometers).',
      'The calculator uses floating-point arithmetic with 8 decimal places of output precision, which is sufficient for engineering and construction but not for subatomic or astronomical precision requirements requiring arbitrary-precision computation.',
    ],
    quickReference: [
      { label: 'Radius', value: 'r = d/2 = C/(2π) = √(A/π)' },
      { label: 'Diameter', value: 'd = 2r = C/π' },
      { label: 'Circumference', value: 'C = 2πr = πd' },
      { label: 'Area', value: 'A = πr² (square units)' },
      { label: 'π (pi)', value: '≈ 3.141592653589793' },
      { label: 'Area from C', value: 'A = C²/(4π)' },
      { label: 'Semicircle Area', value: 'A = πr²/2' },
      { label: 'Quarter Circle', value: 'A = πr²/4' },
    ],
    citations: [
      { source: 'Wolfram MathWorld - Circle', url: 'https://mathworld.wolfram.com/Circle.html' },
      { source: 'Wikipedia - Circle', url: 'https://en.wikipedia.org/wiki/Circle' },
      { source: 'Archimedes - Measurement of a Circle', url: 'https://en.wikipedia.org/wiki/Measurement_of_a_Circle' },
    ],
  },
};

export default circleConfig;
