import { EducationalSvgDiagram } from '../../../types/calculator';
import { EducationalContent } from '../../../types/calculator';

// ─── SVG Diagrams ──────────────────────────────────────────────────

export const circleDiagram: EducationalSvgDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <circle cx="120" cy="95" r="60" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" stroke-width="2.5"/>
  <circle cx="120" cy="95" r="4" fill="#3b82f6"/>
  <line x1="120" y1="95" x2="180" y2="95" stroke="#ef4444" stroke-width="3"/>
  <text x="155" y="89" text-anchor="middle" fill="#ef4444" font-size="20" font-weight="bold">r</text>
  <line x1="60" y1="118" x2="180" y2="118" stroke="#f59e0b" stroke-width="3"/>
  <text x="120" y="136" text-anchor="middle" fill="#f59e0b" font-size="20" font-weight="bold">d = 2r</text>
  <text x="120" y="185" text-anchor="middle" fill="#64748b" font-size="12">Circle — A = πr², C = 2πr</text>
</svg>`,
  alt: 'Circle diagram showing radius r and diameter d = 2r',
  caption: 'A circle has the highest area-to-perimeter ratio of any 2D shape',
};

export const rectangleDiagram: EducationalSvgDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <rect x="30" y="50" width="180" height="100" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" stroke-width="2.5" rx="2"/>
  <line x1="30" y1="170" x2="210" y2="170" stroke="#ef4444" stroke-width="3"/>
  <text x="120" y="185" text-anchor="middle" fill="#ef4444" font-size="20" font-weight="bold">length (l)</text>
  <line x1="223" y1="50" x2="223" y2="150" stroke="#f59e0b" stroke-width="3"/>
  <text x="235" y="105" text-anchor="start" fill="#f59e0b" font-size="20" font-weight="bold">width (w)</text>
  <text x="120" y="105" text-anchor="middle" fill="#6366f1" font-size="15" font-style="italic">A = l × w</text>
</svg>`,
  alt: 'Rectangle diagram showing length and width',
  caption: 'A rectangle — area is the product of length and width',
};

export const squareDiagram: EducationalSvgDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <rect x="30" y="35" width="130" height="130" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" stroke-width="2.5"/>
  <line x1="30" y1="180" x2="160" y2="180" stroke="#ef4444" stroke-width="3"/>
  <text x="95" y="196" text-anchor="middle" fill="#ef4444" font-size="20" font-weight="bold">side (s)</text>
  <line x1="175" y1="35" x2="175" y2="165" stroke="#f59e0b" stroke-width="3"/>
  <text x="192" y="106" text-anchor="start" fill="#f59e0b" font-size="20" font-weight="bold">s</text>
  <text x="95" y="105" text-anchor="middle" fill="#6366f1" font-size="15" font-style="italic">A = s²</text>
</svg>`,
  alt: 'Square diagram showing side length s',
  caption: 'A square — a rectangle with all sides equal',
};

export const triangleDiagram: EducationalSvgDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <polygon points="120,25 30,175 210,175" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" stroke-width="2.5"/>
  <line x1="120" y1="25" x2="120" y2="175" stroke="#ef4444" stroke-width="3"/>
  <text x="114" y="106" text-anchor="end" fill="#ef4444" font-size="20" font-weight="bold">h</text>
  <line x1="30" y1="192" x2="210" y2="192" stroke="#f59e0b" stroke-width="3"/>
  <text x="120" y="208" text-anchor="middle" fill="#f59e0b" font-size="20" font-weight="bold">base (b)</text>
  <text x="120" y="140" text-anchor="middle" fill="#6366f1" font-size="14" font-style="italic">A = ½bh</text>
</svg>`,
  alt: 'Triangle diagram showing base b and height h',
  caption: 'Any triangle has half the area of a rectangle with the same base and height',
};

export const trapezoidDiagram: EducationalSvgDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <polygon points="50,150 190,150 150,40 90,40" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" stroke-width="2.5"/>
  <line x1="50" y1="165" x2="190" y2="165" stroke="#f59e0b" stroke-width="3"/>
  <text x="120" y="182" text-anchor="middle" fill="#f59e0b" font-size="20" font-weight="bold">b (bottom base)</text>
  <line x1="90" y1="40" x2="150" y2="40" stroke="#06b6d4" stroke-width="3"/>
  <text x="120" y="28" text-anchor="middle" fill="#06b6d4" font-size="20" font-weight="bold">a (top base)</text>
  <line x1="90" y1="40" x2="90" y2="150" stroke="#ef4444" stroke-width="3"/>
  <text x="76" y="100" text-anchor="end" fill="#ef4444" font-size="20" font-weight="bold">h</text>
</svg>`,
  alt: 'Trapezoid diagram showing top base a, bottom base b, and height h',
  caption: 'A trapezoid — area is the average of the bases times the height',
};

export const parallelogramDiagram: EducationalSvgDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <polygon points="35,150 225,150 185,40 75,40" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" stroke-width="2.5"/>
  <line x1="35" y1="165" x2="225" y2="165" stroke="#f59e0b" stroke-width="3"/>
  <text x="130" y="182" text-anchor="middle" fill="#f59e0b" font-size="20" font-weight="bold">base (b)</text>
  <line x1="185" y1="40" x2="185" y2="150" stroke="#ef4444" stroke-width="3"/>
  <text x="202" y="101" fill="#ef4444" font-size="20" font-weight="bold">h</text>
  <text x="130" y="105" text-anchor="middle" fill="#6366f1" font-size="14" font-style="italic">A = b × h</text>
</svg>`,
  alt: 'Parallelogram diagram showing base and height',
  caption: 'A parallelogram shears into a rectangle of equal area — same formula A = b×h',
};

export const hexagonDiagram: EducationalSvgDiagram = {
  svg: `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style="max-width:240px;height:auto">
  <polygon points="120,20 195,58 195,132 120,170 45,132 45,58" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" stroke-width="2.5"/>
  <line x1="45" y1="185" x2="195" y2="185" stroke="#ef4444" stroke-width="3"/>
  <text x="120" y="200" text-anchor="middle" fill="#ef4444" font-size="20" font-weight="bold">side (s)</text>
  <line x1="120" y1="170" x2="170" y2="95" stroke="#f59e0b" stroke-width="3"/>
  <text x="178" y="101" fill="#f59e0b" font-size="20" font-weight="bold">a</text>
  <text x="120" y="100" text-anchor="middle" fill="#6366f1" font-size="13">A = 3√3/2 · s²</text>
</svg>`,
  alt: 'Regular hexagon diagram showing side length s and apothem a',
  caption: 'A regular hexagon tiles perfectly — it has 6 equal sides and 6 equal angles',
};

// ─── Shape-specific educational content ─────────────────────────────

export const circleEdu: EducationalContent = {
  formula: 'A = πr² | C = 2πr',
  diagram: circleDiagram,
  formulaDescription: 'A circle has the highest area-to-perimeter ratio of any 2D shape. Area grows with the square of the radius (doubling the radius quadruples the area). The circumference is the perimeter — the distance around the circle.',
  variables: [
    { symbol: 'r', name: 'Radius', description: 'Distance from center to the outer edge. All points on the circle are exactly radius r from center.' },
    { symbol: 'd', name: 'Diameter', description: 'Twice the radius: d = 2r. The longest distance across the circle.' },
    { symbol: 'π', name: 'Pi', description: 'A mathematical constant ~3.14159. The ratio of any circle\'s circumference to its diameter.' },
  ],
  howToUse: ['Select "Circle" from the shape tabs above.', 'Enter the radius of the circle.', 'View the area, circumference, and diameter.'],
  explanation: 'The circle is the most efficient 2D shape — for a given perimeter, it encloses the maximum possible area. This is why bubbles form spheres, why pizza pans are round, and why manhole covers are circular. The formula A = πr² was known to ancient mathematicians: Archimedes proved it by approximating circles with inscribed and circumscribed polygons with 96 sides each. The constant π (~3.14159) appears in both the area and circumference formulas because the circle is the same shape scaled — all circles are similar to each other.',
  faqs: [
    { question: 'Why is the area of a circle πr²?', answer: 'Imagine cutting a circle into many thin wedges and rearranging them into a shape close to a rectangle. The width of this rectangle is the radius (r) and the length is half the circumference (πr). So area = r × πr = πr².' },
    { question: 'What is the difference between circumference and area?', answer: 'Circumference is the distance around the circle (2πr) — like the length of string needed to wrap around it once. Area is the space inside (πr²) — like the number of square tiles needed to cover it.' },
    { question: 'Does doubling the radius double the area?', answer: 'No. Doubling the radius quadruples the area (since r is squared in A = πr²). A circle with radius 2 has area 4π, while radius 4 has area 16π — four times as much.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld', title: 'Circle', url: 'https://mathworld.wolfram.com/Circle.html' },
    { source: 'Wikipedia', title: 'Area of a Circle', url: 'https://en.wikipedia.org/wiki/Area_of_a_circle' },
  ],
};

export const rectangleEdu: EducationalContent = {
  formula: 'A = l × w | P = 2(l + w)',
  diagram: rectangleDiagram,
  formulaDescription: 'The rectangle is the most intuitive 2D shape — its area is simply length times width. The perimeter is twice the sum of length and width because opposite sides are equal. A rectangle\'s diagonal forms a right triangle with the sides.',
  variables: [
    { symbol: 'l', name: 'Length', description: 'The longer dimension of the rectangle.' },
    { symbol: 'w', name: 'Width', description: 'The shorter dimension of the rectangle.' },
    { symbol: 'd', name: 'Diagonal', description: 'The distance between opposite corners. Found using: d = √(l² + w²).' },
  ],
  howToUse: ['Select "Rectangle" from the shape tabs above.', 'Enter the length and width of the rectangle.', 'View the area, perimeter, and diagonal.'],
  explanation: 'The rectangle is the most fundamental 2D shape in construction and design — walls, floors, screens, doors, windows, and photos are all rectangular. Understanding rectangle area is the foundation for understanding area of any shape: a triangle is half a rectangle, a parallelogram can be sheared into a rectangle, and a trapezoid\'s area formula averages two rectangles. The diagonal uses the Pythagorean theorem (d² = l² + w²), which is one of the oldest and most important mathematical relationships, dating back over 3,500 years to Babylonian mathematicians.',
  faqs: [
    { question: 'What is the most area-efficient rectangle?', answer: 'For a fixed perimeter, a square maximizes the area. As the rectangle becomes longer and narrower, the area decreases while the perimeter stays the same. A square is the most "compact" rectangle.' },
    { question: 'How do I find the diagonal of a rectangle?', answer: 'Use the Pythagorean theorem: d = √(l² + w²). For a 3×4 rectangle, the diagonal is √(9 + 16) = √25 = 5. This is the 3-4-5 triangle, the most famous Pythagorean triple.' },
    { question: 'Is a square a rectangle?', answer: 'Yes. A square is a special case of a rectangle where all four sides are equal. Every square is a rectangle, but not every rectangle is a square. Squares inherit all rectangle properties plus additional symmetry.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld', title: 'Rectangle', url: 'https://mathworld.wolfram.com/Rectangle.html' },
    { source: 'Wikipedia', title: 'Rectangle', url: 'https://en.wikipedia.org/wiki/Rectangle' },
  ],
};

export const squareEdu: EducationalContent = {
  formula: 'A = s² | P = 4s',
  diagram: squareDiagram,
  formulaDescription: 'The square is a rectangle with all sides equal. Area grows with the square of the side — this is why raising a number to the second power is called "squaring." The diagonal of a square is s√2, forming a 45-45-90 right triangle.',
  variables: [
    { symbol: 's', name: 'Side', description: 'The length of any side. All four sides are equal.' },
    { symbol: 'd', name: 'Diagonal', description: 'The distance between opposite corners. d = s√2.' },
  ],
  howToUse: ['Select "Square" from the shape tabs above.', 'Enter the side length of the square.', 'View the area, perimeter, and diagonal.'],
  explanation: 'The square is the most symmetric 2D polygon — all four sides equal, all four angles 90°, and four lines of symmetry. This perfect symmetry makes squares extremely practical: tiles, screens, pixels, graph paper, QR codes, and city blocks are all based on squares. The term "square" as a power of two comes from the geometric meaning: a number multiplied by itself gives the area of a square with that side length. The square\'s diagonal (d = s√2) was a shocking discovery to ancient Greek mathematicians — it proved that some lengths cannot be expressed as a simple ratio of whole numbers.',
  faqs: [
    { question: 'Why is it called "squaring" a number?', answer: 'The area of a square is side × side = side². So 5² = 25 represents the area of a 5×5 square. This geometric meaning is why we call raising to the second power "squaring."' },
    { question: 'Why is √2 irrational?', answer: 'The diagonal of a unit square is √2. The ancient Greeks proved this number cannot be expressed as a fraction (a/b) — it is irrational. This discovery was so controversial that legend says the mathematician who proved it was thrown overboard.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld', title: 'Square', url: 'https://mathworld.wolfram.com/Square.html' },
    { source: 'Wikipedia', title: 'Square', url: 'https://en.wikipedia.org/wiki/Square' },
  ],
};

export const triangleEdu: EducationalContent = {
  formula: 'A = ½bh | P = a + b + c',
  diagram: triangleDiagram,
  formulaDescription: 'Any triangle has exactly half the area of a rectangle with the same base and height. This ½ factor is fundamental — it appears again in 3D as the ⅓ in cone volume. The perimeter is simply the sum of all three sides.',
  variables: [
    { symbol: 'b', name: 'Base', description: 'Any side of the triangle chosen as the base for area calculation.' },
    { symbol: 'h', name: 'Height', description: 'The perpendicular distance from the base to the opposite vertex.' },
    { symbol: 'a, b, c', name: 'Side Lengths', description: 'The three sides of the triangle. Their sum gives the perimeter.' },
  ],
  howToUse: ['Select "Triangle" from the shape tabs above.', 'Enter the base, height, and optionally the third side for perimeter.', 'View the area and perimeter.'],
  explanation: 'The triangle is the only rigid polygon — it does not deform under pressure because triangles distribute forces along their sides. This structural property makes triangles essential in bridges, roofs, trusses, bicycle frames, and Eiffel Tower-like structures. The area formula A = ½bh dates back to ancient Egypt (Rhind Papyrus, ~1550 BCE). The ½ comes from the fact that any triangle is exactly half of a parallelogram with the same base and height — this is easily seen with right triangles, but holds for all triangles regardless of shape. Triangles are also the basis of trigonometry, surveying, and navigation through the law of sines and law of cosines.',
  faqs: [
    { question: 'Why is the area of a triangle half of base × height?', answer: 'Any triangle can be placed inside a rectangle of the same base and height. The triangle fills exactly half the rectangle — two identical triangles make a parallelogram (or rectangle for right triangles) of the same base and height.' },
    { question: 'Why are triangles used in construction?', answer: 'Triangles are the only shape that does not change shape under force — they are "rigid." A rectangle can be pushed into a parallelogram, but a triangle always holds its angles. This is why bridges, cranes, and roof trusses use triangular frameworks.' },
    { question: 'What is the triangle inequality?', answer: 'The sum of any two sides of a triangle must be greater than the third side. If this is not true, a triangle with those side lengths cannot exist. For example, sides of 1, 2, and 4 cannot form a triangle because 1 + 2 < 4.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld', title: 'Triangle', url: 'https://mathworld.wolfram.com/Triangle.html' },
    { source: 'Wikipedia', title: 'Triangle', url: 'https://en.wikipedia.org/wiki/Triangle' },
  ],
};

export const trapezoidEdu: EducationalContent = {
  formula: 'A = ½(a + b)h | Midsegment = (a + b)/2',
  diagram: trapezoidDiagram,
  formulaDescription: 'The trapezoid has two parallel sides (bases). Its area is the average of the two bases times the height — this is the same as the area of a rectangle whose width equals the midsegment length. The midsegment (or median) connects the midpoints of the non-parallel sides.',
  variables: [
    { symbol: 'a', name: 'Top Base', description: 'The shorter parallel side of the trapezoid.' },
    { symbol: 'b', name: 'Bottom Base', description: 'The longer parallel side of the trapezoid.' },
    { symbol: 'h', name: 'Height', description: 'The perpendicular distance between the two parallel bases.' },
  ],
  howToUse: ['Select "Trapezoid" from the shape tabs above.', 'Enter the top base, bottom base, and height.', 'View the area and midsegment length.'],
  explanation: 'Trapezoids appear in many real-world contexts: the cross-section of a canal or earthwork, the gable end of a house, and the shape of a tapered shaft. The area formula A = ½(a + b)h is derived from dividing the trapezoid into a rectangle and two triangles, or by averaging the two bases. The midsegment (the line connecting the midpoints of the non-parallel sides) has length equal to the average of the two bases — it represents the average width of the trapezoid.',
  faqs: [
    { question: 'What is the midsegment of a trapezoid?', answer: 'The midsegment connects the midpoints of the two non-parallel sides. Its length equals (a + b)/2 — the average of the two bases. This is also the width of an equivalent rectangle with the same area and height.' },
    { question: 'Can a trapezoid have parallel sides that are vertical?', answer: 'Yes. The definition of a trapezoid requires at least one pair of parallel sides, but they can be horizontal, vertical, or at any angle. The height is always measured perpendicular to the parallel bases.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld', title: 'Trapezoid', url: 'https://mathworld.wolfram.com/Trapezoid.html' },
    { source: 'Wikipedia', title: 'Trapezoid', url: 'https://en.wikipedia.org/wiki/Trapezoid' },
  ],
};

export const parallelogramEdu: EducationalContent = {
  formula: 'A = b × h | P = 2(a + b)',
  diagram: parallelogramDiagram,
  formulaDescription: 'A parallelogram has the same area formula as a rectangle (base × height) because it is essentially a rectangle that has been sheared. The key insight: the height is measured perpendicular to the base, not along the sloping side. The perimeter uses both the base (b) and the sloping side (a).',
  variables: [
    { symbol: 'b', name: 'Base', description: 'The length of the bottom side. The top and bottom sides are parallel and equal.' },
    { symbol: 'h', name: 'Height', description: 'The perpendicular distance between the base and the opposite side. Always measured at a right angle to the base.' },
    { symbol: 'a', name: 'Sloping Side', description: 'The length of the non-vertical side. Determines the shear angle.' },
  ],
  howToUse: ['Select "Parallelogram" from the shape tabs above.', 'Enter the base, sloping side (a), and height (h).', 'View the area and perimeter.'],
  explanation: 'A parallelogram is a rectangle sheared sideways — the top slides relative to the bottom while staying parallel. This shear does not change the area, which is why a parallelogram has the same A = b×h formula as a rectangle. You can prove this by cutting off the triangular overhang on one side and moving it to the other side to form a rectangle. Parallelograms appear in mechanical linkages (like the pantograph), in vector addition (the parallelogram rule), and in the cross-section of extruded shapes.',
  faqs: [
    { question: 'Why does a parallelogram NOT use the sloping side for area?', answer: 'The area is base × perpendicular height, not base × sloping side. The sloping side is longer than the height (unless the parallelogram is a rectangle). The formula A = b × h works for ALL parallelograms regardless of how slanted they are.' },
    { question: 'What is the parallelogram law of vectors?', answer: 'When adding two vectors, the resultant is the diagonal of a parallelogram formed by the two vectors as adjacent sides. This is the fundamental rule of vector addition in physics and engineering.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld', title: 'Parallelogram', url: 'https://mathworld.wolfram.com/Parallelogram.html' },
    { source: 'Wikipedia', title: 'Parallelogram', url: 'https://en.wikipedia.org/wiki/Parallelogram' },
  ],
};

export const hexagonEdu: EducationalContent = {
  formula: 'A = (3√3/2)s² | P = 6s | Apothem = s√3/2',
  diagram: hexagonDiagram,
  formulaDescription: 'A regular hexagon has six equal sides and six equal angles. It can be divided into six equilateral triangles, each with side length s. The apothem (distance from center to the midpoint of any side) is s√3/2. The area formula combines the areas of all six triangles.',
  variables: [
    { symbol: 's', name: 'Side Length', description: 'The length of any of the six equal sides.' },
    { symbol: 'a', name: 'Apothem', description: 'Distance from center to the midpoint of any side. a = s√3/2.' },
  ],
  howToUse: ['Select "Regular Hexagon" from the shape tabs above.', 'Enter the side length of the hexagon.', 'View the area, perimeter, and apothem.'],
  explanation: 'The regular hexagon is one of only three regular polygons that can tile a plane without gaps (along with squares and triangles). This is why honeycombs are hexagonal — bees discovered the most efficient shape for storing honey using the least wax. A regular hexagon can be thought of as six equilateral triangles arranged around a central point. The hexagon\'s apothem and area formulas come from the geometry of these equilateral triangles, each with height equal to the apothem. Hexagons appear in nature (honeycombs, snowflakes, basalt columns), technology (bolts, nuts, and wrench design), and strategy games (hex-grid maps).',
  faqs: [
    { question: 'Why do bees use hexagons for honeycombs?', answer: 'Bees build hexagonal honeycomb cells. Of all tiling shapes (triangles, squares, hexagons), the hexagon encloses the most area for the same perimeter — meaning bees use the least wax to store the most honey. This was proven mathematically by Pappus of Alexandria around 300 CE.' },
    { question: 'How do you calculate the apothem?', answer: 'For a regular hexagon with side s, the apothem is a = s × √3 / 2 ≈ 0.866 × s. This is the height of each of the six equilateral triangles that make up the hexagon.' },
    { question: 'What is the radius of a regular hexagon?', answer: 'For a regular hexagon, the radius (distance from center to any vertex) equals the side length s. This is because a regular hexagon can be divided into 6 equilateral triangles, whose sides are all equal to s.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld', title: 'Hexagon', url: 'https://mathworld.wolfram.com/Hexagon.html' },
    { source: 'Wikipedia', title: 'Hexagon', url: 'https://en.wikipedia.org/wiki/Hexagon' },
  ],
};
