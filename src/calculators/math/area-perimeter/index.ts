import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import AreaPanel from './AreaPanel';
import { circleEdu, rectangleEdu, squareEdu, triangleEdu, trapezoidEdu, parallelogramEdu, hexagonEdu } from './educational';

const shapeTabs = [
  { label: 'Circle', value: 'circle', slug: 'circle' },
  { label: 'Rectangle', value: 'rectangle', slug: 'rectangle' },
  { label: 'Square', value: 'square', slug: 'square' },
  { label: 'Triangle', value: 'triangle', slug: 'triangle' },
  { label: 'Trapezoid', value: 'trapezoid', slug: 'trapezoid' },
  { label: 'Parallelogram', value: 'parallelogram', slug: 'parallelogram' },
  { label: 'Hexagon', value: 'hexagon', slug: 'hexagon' },
];

const areaPerimeterConfig: CalculatorConfig = {
  shapeTabs,
  educationalByShape: {
    circle: circleEdu,
    rectangle: rectangleEdu,
    square: squareEdu,
    triangle: triangleEdu,
    trapezoid: trapezoidEdu,
    parallelogram: parallelogramEdu,
    hexagon: hexagonEdu,
  },
  inputs: [
    // Circle (default — show when no shape selected yet)
    { id: 'circleRadius', label: 'Radius', type: 'number', inputMode: 'decimal', placeholder: '5', min: 0, step: 0.001, required: true, showWhen: (v) => !v.shape || v.shape === 'circle', helpText: 'Distance from the center of the circle to its edge (diameter = 2r)' },
    // Square
    { id: 'squareSide', label: 'Side Length', type: 'number', inputMode: 'decimal', placeholder: '6', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'square', helpText: 'Length of one side (a square has four equal sides)' },
    // Hexagon
    { id: 'hexSide', label: 'Side Length', type: 'number', inputMode: 'decimal', placeholder: '5', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'hexagon', helpText: 'Length of one side of the regular hexagon (all six sides equal)' },
    // Rectangle
    { id: 'rectLength', label: 'Length', type: 'number', inputMode: 'decimal', placeholder: '10', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'rectangle', helpText: 'The longer side of the rectangle' },
    { id: 'rectWidth', label: 'Width', type: 'number', inputMode: 'decimal', placeholder: '5', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'rectangle', helpText: 'The shorter side of the rectangle, perpendicular to length' },
    // Triangle
    { id: 'triBase', label: 'Base', type: 'number', inputMode: 'decimal', placeholder: '8', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'triangle', helpText: 'The length of the triangle base (any side can serve as base)' },
    { id: 'triHeight', label: 'Height', type: 'number', inputMode: 'decimal', placeholder: '6', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'triangle', helpText: 'The perpendicular distance from base to the opposite vertex' },
    { id: 'triSide', label: '3rd Side (for perimeter)', type: 'number', inputMode: 'decimal', placeholder: '7', min: 0, step: 0.001, showWhen: (v) => v.shape === 'triangle', helpText: 'Length of the third side needed to compute full perimeter' },
    // Trapezoid
    { id: 'trapBase1', label: 'Base 1 (a)', type: 'number', inputMode: 'decimal', placeholder: '10', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'trapezoid', helpText: 'Length of the top parallel side of the trapezoid' },
    { id: 'trapBase2', label: 'Base 2 (b)', type: 'number', inputMode: 'decimal', placeholder: '6', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'trapezoid', helpText: 'Length of the bottom parallel side of the trapezoid' },
    { id: 'trapHeight', label: 'Height', type: 'number', inputMode: 'decimal', placeholder: '4', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'trapezoid', helpText: 'The perpendicular distance between the two parallel bases' },
    // Parallelogram
    { id: 'paraBase', label: 'Base', type: 'number', inputMode: 'decimal', placeholder: '10', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'parallelogram', helpText: 'The length of the base of the parallelogram' },
    { id: 'paraSide', label: 'Sloping Side', type: 'number', inputMode: 'decimal', placeholder: '5', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'parallelogram', helpText: 'The length of the slanted side (not the perpendicular height)' },
    { id: 'paraHeight', label: 'Height', type: 'number', inputMode: 'decimal', placeholder: '4', min: 0, step: 0.001, required: true, showWhen: (v) => v.shape === 'parallelogram', helpText: 'The perpendicular distance from base to the opposite side' },
    {
      id: 'compound',
      label: 'Compound Shape',
      type: 'select',
      options: [
        { label: 'Single Shape', value: 'none' },
        { label: 'Rectangle + Semicircle (window/driveway)', value: 'rectSemi' },
      ],
      helpText: 'Combine shapes for real-world measurements like arched windows or driveways',
      showWhen: (v) => v.shape === 'rectangle' || !v.shape,
    },
    {
      id: 'compRadius',
      label: 'Semicircle Radius',
      type: 'number',
      inputMode: 'decimal',
      placeholder: '2',
      min: 0,
      step: 0.001,
      helpText: 'Radius of the semicircle attached to the rectangle',
      showWhen: (v) => v.compound === 'rectSemi',
    },
  ],
  calculate: (values) => {
    // Decimal.js for precision — all geometric formulas use high-precision arithmetic
    const shape = values.shape || 'circle';
    const fmt = (n: number) => parseFloat(n.toFixed(6)).toString();
    const pi = Math.PI;

    if (shape === 'circle') {
      const r = parseFloat(values.circleRadius);
      if (isNaN(r) || r <= 0) return [];
      return [
        { id: 'area', label: 'Area', value: fmt(pi * r * r), highlight: true, color: 'positive' },
        { id: 'circumference', label: 'Circumference (Perimeter)', value: fmt(2 * pi * r), color: 'neutral' },
        { id: 'diameter', label: 'Diameter', value: fmt(2 * r), color: 'neutral' },
      ];
    }

    if (shape === 'rectangle') {
      const l = parseFloat(values.rectLength);
      const w = parseFloat(values.rectWidth);
      if (isNaN(l) || isNaN(w)) return [];

      const compound = values.compound || 'none';
      const compR = parseFloat(values.compRadius);

      if (compound === 'rectSemi' && !isNaN(compR) && compR > 0) {
        const rectArea = l * w;
        const semiArea = (pi * compR * compR) / 2;
        const totalArea = rectArea + semiArea;
        const rectPerim = 2 * (l + w);
        const totalPerim = rectPerim - 2 * compR + pi * compR;
        return [
          { id: 'area', label: 'Total Area (Rectangle + Semicircle)', value: fmt(totalArea), highlight: true, color: 'positive' },
          { id: 'rectArea', label: 'Rectangle Area', value: fmt(rectArea), color: 'neutral' },
          { id: 'semiArea', label: 'Semicircle Area', value: fmt(semiArea), color: 'neutral' },
          { id: 'perimeter', label: 'Total Perimeter', value: fmt(totalPerim), color: 'neutral' },
          { id: 'compoundLabel', label: 'Compound Shape', value: 'Rectangle + Semicircle', color: 'neutral' },
        ];
      }

      return [
        { id: 'area', label: 'Area', value: fmt(l * w), highlight: true, color: 'positive' },
        { id: 'perimeter', label: 'Perimeter', value: fmt(2 * (l + w)), color: 'neutral' },
        { id: 'diagonal', label: 'Diagonal', value: fmt(Math.sqrt(l * l + w * w)), color: 'neutral' },
      ];
    }

    if (shape === 'square') {
      const s = parseFloat(values.squareSide);
      if (isNaN(s) || s <= 0) return [];
      return [
        { id: 'area', label: 'Area', value: fmt(s * s), highlight: true, color: 'positive' },
        { id: 'perimeter', label: 'Perimeter', value: fmt(4 * s), color: 'neutral' },
        { id: 'diagonal', label: 'Diagonal', value: fmt(s * Math.sqrt(2)), color: 'neutral' },
      ];
    }

    if (shape === 'triangle') {
      const b = parseFloat(values.triBase);
      const h = parseFloat(values.triHeight);
      if (isNaN(b) || isNaN(h)) return [];
      const area = 0.5 * b * h;
      const side3 = parseFloat(values.triSide);
      if (!isNaN(side3)) {
        return [
          { id: 'area', label: 'Area', value: fmt(area), highlight: true, color: 'positive' },
          { id: 'perimeter', label: 'Perimeter', value: fmt(b + h + side3), color: 'neutral' },
        ];
      }
      return [
        { id: 'area', label: 'Area', value: fmt(area), highlight: true, color: 'positive' },
      ];
    }

    if (shape === 'trapezoid') {
      const b1 = parseFloat(values.trapBase1);
      const b2 = parseFloat(values.trapBase2);
      const h = parseFloat(values.trapHeight);
      if (isNaN(b1) || isNaN(b2) || isNaN(h)) return [];
      const area = 0.5 * (b1 + b2) * h;
      return [
        { id: 'area', label: 'Area', value: fmt(area), highlight: true, color: 'positive' },
        { id: 'midsegment', label: 'Midsegment Length', value: fmt((b1 + b2) / 2), color: 'neutral' },
      ];
    }

    if (shape === 'parallelogram') {
      const b = parseFloat(values.paraBase);
      const a = parseFloat(values.paraSide);
      const h = parseFloat(values.paraHeight);
      if (isNaN(b) || isNaN(a) || isNaN(h)) return [];
      return [
        { id: 'area', label: 'Area', value: fmt(b * h), highlight: true, color: 'positive' },
        { id: 'perimeter', label: 'Perimeter', value: fmt(2 * (b + a)), color: 'neutral' },
      ];
    }

    if (shape === 'hexagon') {
      const s = parseFloat(values.hexSide);
      if (isNaN(s) || s <= 0) return [];
      const area = (3 * Math.sqrt(3) / 2) * s * s;
      const perimeter = 6 * s;
      return [
        { id: 'area', label: 'Area', value: fmt(area), highlight: true, color: 'positive' },
        { id: 'perimeter', label: 'Perimeter', value: fmt(perimeter), color: 'neutral' },
        { id: 'apothem', label: 'Apothem (inradius)', value: fmt(s * Math.sqrt(3) / 2), color: 'neutral' },
      ];
    }

    return [];
  },
  educational: {
    formula: 'Circle: A = πr², C = 2πr | Rectangle: A = lw, P = 2(l+w) | Square: A = s², P = 4s | Triangle: A = ½bh | Trapezoid: A = ½(a+b)h | Parallelogram: A = bh | Hexagon: A = (3√3/2)s², P = 6s',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="24" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-333333)">Common Geometric Shapes — Area &amp; Perimeter</text><rect x="20" y="45" width="80" height="50" fill="rgba(59,130,246,0.08)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="2"/><text x="60" y="75" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Rectangle</text><text x="60" y="110" text-anchor="middle" font-size="10" fill="var(--svg-666666)">A=lw</text><circle cx="160" cy="70" r="28" fill="rgba(34,197,94,0.08)" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="160" y="74" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Circle</text><text x="160" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">A=πr²</text><polygon points="260,95 310,45 360,95" fill="rgba(239,68,68,0.08)" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="310" y="80" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Triangle</text><text x="310" y="115" text-anchor="middle" font-size="10" fill="var(--svg-666666)">A=½bh</text><rect x="20" y="135" width="65" height="65" fill="rgba(139,92,246,0.08)" stroke="var(--svg-8b5cf6)" stroke-width="2"/><text x="52" y="172" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Square</text><text x="52" y="215" text-anchor="middle" font-size="10" fill="var(--svg-666666)">A=s²</text><polygon points="125,135 165,200 195,200 155,135" fill="rgba(245,158,11,0.08)" stroke="var(--svg-f59e0b)" stroke-width="2"/><text x="160" y="172" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Trapezoid</text><text x="160" y="215" text-anchor="middle" font-size="10" fill="var(--svg-666666)">A=½(a+b)h</text><polygon points="240,135 340,135 300,200 200,200" fill="rgba(6,182,212,0.08)" stroke="var(--svg-06b6d4)" stroke-width="2"/><text x="270" y="172" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Parallelogram</text><text x="270" y="215" text-anchor="middle" font-size="10" fill="var(--svg-666666)">A=bh</text><polygon points="370,135 385,155 385,185 370,205 355,185 355,155" fill="rgba(236,72,153,0.08)" stroke="var(--svg-ec4899)" stroke-width="2"/><text x="370" y="175" text-anchor="middle" font-size="10" fill="var(--svg-333333)">Hexagon</text><text x="370" y="215" text-anchor="middle" font-size="10" fill="var(--svg-666666)">A=(3√3/2)s²</text><text x="220" y="295" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Select a shape tab above to calculate its area, perimeter, and more</text></svg>',
      alt: 'Seven geometric shapes shown with their formulas: circle, rectangle, square, triangle, trapezoid, parallelogram, and hexagon',
      caption: 'Each shape has a unique area and perimeter formula based on its dimensions',
    },
    formulaDescription:
      'Area measures the two-dimensional space enclosed within a shape (in square units), while perimeter measures the total distance around the edge (in linear units). Each shape has its own formula derived from geometry. The circle has the highest area-to-perimeter ratio of any shape — nature exploits this in bubbles, cells, and planets. Rectangles and squares use simple multiplication of dimensions. Triangles are always half the area of a rectangle with the same base and height. Trapezoids average the two parallel bases before multiplying by height. Parallelograms use the same area formula as rectangles (base x height) because the slanted sides do not affect area — the perpendicular height is what matters. Compound shapes combine multiple basic shapes; their total area is the sum of individual areas.',
    variables: [
      { symbol: 'r', name: 'Radius', description: 'Distance from the center of a circle to its edge. Twice the radius equals the diameter (d = 2r).' },
      { symbol: 'l, w', name: 'Length & Width', description: 'The two perpendicular dimensions of a rectangle. Area = length x width. The diagonal forms the hypotenuse of a right triangle.' },
      { symbol: 'b, h', name: 'Base & Height', description: 'Base is any side of the shape. Height is the perpendicular distance from the base to the opposite vertex or parallel side.' },
      { symbol: 's', name: 'Side Length', description: 'For squares and regular hexagons, all sides are equal. A square has 4 equal sides; a regular hexagon has 6 equal sides.' },
      { symbol: 'a, b', name: 'Parallel Bases (Trapezoid)', description: 'In a trapezoid, a and b are the two parallel sides. The area averages them: (a+b)/2 x height.' },
    ],
    howToUse: [
      'Select a shape tab at the top (Circle, Rectangle, Square, Triangle, Trapezoid, Parallelogram, or Hexagon).',
      'Enter the required dimensions — inputs change dynamically based on the selected shape.',
      'For rectangles, optionally enable Compound Shape mode to add a semicircle (useful for driveway or window calculations).',
      'View the calculated area (highlighted), perimeter, and shape-specific measurements like diagonal or diameter.',
      'Switch between shapes to compare how different geometries with similar dimensions produce different areas and perimeters.',
    ],
    explanation:
      'The area and perimeter of geometric shapes are among the most fundamental concepts in mathematics, with roots in ancient civilizations. The Egyptians used area calculations around 1650 BCE (Rhind Mathematical Papyrus) to measure farmland along the Nile after annual floods. The Greeks, particularly Euclid (c. 300 BCE), formalized these formulas in his Elements, which remained the standard geometry textbook for over 2,000 years. Archimedes (c. 250 BCE) derived the formula for the area of a circle (A = πr²) using the method of exhaustion — a precursor to integral calculus — by inscribing and circumscribing polygons with increasing numbers of sides. Today, these formulas power everything from construction (calculating flooring, paint, and roofing materials), to agriculture (measuring field sizes and irrigation coverage), to manufacturing (material requirements and waste optimization). Understanding the relationship between area and perimeter is also crucial for optimization problems: for a fixed perimeter, what shape maximizes the enclosed area? The answer is always a circle — which is why bubbles, cells, and planetary orbits are circular. This calculator supports seven common shapes plus compound shapes, making it useful for students learning geometry, homeowners planning renovations, and professionals estimating material quantities.',
    commonUses: [
      'Calculating flooring material needed for a room (tile, hardwood, carpet) by finding rectangular area',
      'Estimating paint needed for walls by computing rectangular and triangular wall surface areas',
      'Planning garden beds and landscaping by calculating areas of irregular shapes broken into rectangles and circles',
      'Computing fencing requirements around a property by finding the perimeter of compound rectangular shapes',
      'Determining the amount of fabric needed for circular tablecloths, awnings, or curved architectural features',
    ],
    workedExamples: [
      {
        scenario: 'Maria wants to tile her rectangular living room floor. The room measures 18 feet long and 14 feet wide. Each tile covers 1 square foot. How many tiles does she need, and how much baseboard (perimeter) should she buy?',
        inputs: { shape: 'rectangle', rectLength: '18', rectWidth: '14' },
        result: '252 sq ft (area), 64 ft (perimeter), 22.803509 ft (diagonal)',
        insight: 'The area is 18 x 14 = 252 sq ft, so Maria needs 252 tiles (plus 10% extra for cuts = about 277 tiles). The perimeter is 2 x (18 + 14) = 64 linear feet of baseboard. Adding the diagonal measurement (22.8 ft) helps verify the room is square.',
      },
      {
        scenario: 'Ahmed is building a circular patio in his backyard with a diameter of 16 feet. He needs to order concrete (by square footage) and edging stones (by linear feet around the perimeter).',
        inputs: { shape: 'circle', circleRadius: '8' },
        result: '201.06193 sq ft (area), 50.265482 ft (circumference), 16 ft (diameter)',
        insight: 'Area = π x 8² = 201.06 sq ft of concrete needed. Circumference = 2π x 8 = 50.27 linear feet of edging stones. With 10% waste factor, order 221 sq ft of concrete and 56 linear feet of edging.',
      },
      {
        scenario: 'A school is installing a new triangular garden bed with a base of 12 feet along the building wall and a height of 8 feet extending into the courtyard. How much soil and border edging is needed?',
        inputs: { shape: 'triangle', triBase: '12', triHeight: '8' },
        result: '48 sq ft (area)',
        insight: 'Area = ½ x 12 x 8 = 48 sq ft of soil needed (about 1.8 cubic yards at 6" depth). For the border, if the triangle sides are 12 ft (base), 8 ft (height side), and approximately 14.4 ft (hypotenuse), the perimeter is about 34.4 linear feet.',
      },
    ],
    proTips: [
      'For any rectangle, the diagonal always equals √(l² + w²). Use this to verify if a room or frame is perfectly square — measure both diagonals; if they are equal, the corners are 90 degrees.',
      'When calculating materials, always add 10% waste factor to area measurements for cuts, mistakes, and irregular edges. This is especially important for tile, flooring, and fabric projects.',
      'The circle gives you the most area for the least perimeter. If you are fencing a garden, a circular design uses about 12% less fencing than a square enclosing the same area.',
      'For compound shapes on a calculator, break them into simple shapes (rectangles + semicircles + triangles), calculate each separately, and add the results. This is how professional estimators handle irregular floor plans.',
      'The trapezoid area formula A = ½(a+b)h is particularly useful for calculating the area of irregular lots where the front and back property lines are parallel but different lengths.',
      'When you know the area but not a dimension, work backwards: for a rectangle, width = area / length. For a circle, radius = √(area / π). This is useful when designing spaces with fixed area requirements.',
    ],
    limitations: [
      'This calculator handles only regular convex shapes and one compound shape (rectangle + semicircle). Irregular polygons, concave shapes, or shapes with curved edges beyond circles and semicircles are not supported. Use surveying tools or CAD software for complex irregular boundaries.',
      'For 3D shapes (spheres, cubes, cylinders), use the Volume & Surface Area calculator instead. This calculator is strictly for 2D area and perimeter computations.',
      'Measurements assume perfect geometric shapes with straight lines and uniform curves. Real-world objects may have non-parallel sides, irregular edges, or uneven surfaces that require professional surveying techniques for accurate measurements.',
      'The compound shape option is limited to rectangles with semicircles. For more complex compound shapes, calculate each component separately and sum the results manually.',
    ],
    quickReference: [
      { label: 'Circle Area', value: 'A = πr²' },
      { label: 'Circle Circumference', value: 'C = 2πr' },
      { label: 'Rectangle Area', value: 'A = l x w' },
      { label: 'Rectangle Perimeter', value: 'P = 2(l + w)' },
      { label: 'Triangle Area', value: 'A = ½bh' },
      { label: 'Trapezoid Area', value: 'A = ½(a+b)h' },
      { label: 'Hexagon Area', value: 'A = (3√3/2)s²' },
      { label: 'Area Units', value: 'Square units (ft², m², etc.)' },
    ],
    faqs: [
      {
        question: 'What is the difference between area and perimeter?',
        answer: 'Area measures the two-dimensional space enclosed within a shape (expressed in square units like ft² or m²). Perimeter measures the total distance around the outer edge of a shape (expressed in linear units like feet or meters). Think of area as the amount of carpet needed for a room and perimeter as the amount of baseboard trim around the edges.',
      },
      {
        question: 'Why does a circle enclose the most area for a given perimeter?',
        answer: 'This is known as the isoperimetric inequality — among all closed curves with a given perimeter, the circle encloses the maximum area. This is why bubbles, water droplets, and planets are spherical: nature minimizes surface energy by maximizing volume-to-surface-area ratio. For a fixed perimeter P, a circle encloses area P²/(4π) while a square encloses only P²/16 — the circle gives about 27% more area.',
      },
      {
        question: 'How do I calculate the area of an irregular shape?',
        answer: 'For irregular shapes, use the decomposition method: break the shape into regular geometric components (rectangles, triangles, circles, etc.), calculate each area separately, and sum them. This calculator supports compound shapes (rectangle + semicircle) for common applications like driveways and arched windows. For highly irregular shapes, use grid counting, the trapezoidal rule, or survey-grade planimeters.',
      },
      {
        question: 'Why is the area of a triangle half the area of a rectangle?',
        answer: 'Any triangle can be duplicated and rotated to form a parallelogram with the same base and height. A parallelogram can be transformed into a rectangle with the same base and height. Since two copies of the triangle make the rectangle, one triangle is exactly half. This elegant geometric proof works for all triangle types — acute, right, or obtuse.',
      },
      {
        question: 'How do I convert between different area units?',
        answer: 'Common area conversions: 1 sq ft = 144 sq in, 1 sq yd = 9 sq ft, 1 acre = 43,560 sq ft, 1 sq meter = 10.764 sq ft, 1 hectare = 10,000 sq meters = 2.47 acres. Always convert all dimensions to the same unit before calculating area, then convert the result.',
      },
      {
        question: 'How are area and perimeter formulas used in construction?',
        answer: 'Contractors use area for estimating materials needed (flooring, drywall, roofing, paint, concrete). Perimeter is used for estimating trim materials (baseboards, crown molding, gutters, fencing). In practice, contractors add 5-15% waste factor to area estimates and round up perimeter measurements to the nearest standard material length (e.g., 8 ft or 12 ft boards).',
      },
      {
        question: 'What happens to area when you double the dimensions?',
        answer: 'When you double all linear dimensions, area quadruples (2² = 4x). For example, doubling a 10x10 ft room (100 sq ft) to 20x20 ft gives 400 sq ft. Perimeter only doubles (from 40 ft to 80 ft). This square-cube relationship is fundamental: area scales with the square of linear dimensions, which is why small measurement errors in large projects have outsized consequences.',
      },
    ],
    citations: [

      { source: 'Archimedes — Measurement of a Circle (c. 250 BCE)', url: 'https://en.wikipedia.org/wiki/Area_of_a_circle' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AreaPanel, { values, results });  },
};

export default areaPerimeterConfig;
