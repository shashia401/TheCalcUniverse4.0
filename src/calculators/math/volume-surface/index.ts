import { createElement } from 'react';
import { CalculatorConfig, EducationalContent } from '../../../types/calculator';
import VolumeSurfacePanel from './VolumeSurfacePanel';
import { calculate } from './shared';
import { sphereDiagram, cubeDiagram, cylinderDiagram, coneDiagram, boxDiagram, pyramidDiagram } from './diagrams';

const sphereEdu: EducationalContent = {
  formula: 'V = 4/3 × π × r³ | SA = 4 × π × r²',
  diagram: sphereDiagram,
  formulaDescription: 'The sphere is the most geometrically efficient shape — it contains the maximum volume for a given surface area. Volume grows with the cube of the radius (double the radius, multiply volume by 8). Surface area grows with the square (double the radius, multiply area by 4).',
  variables: [
    { symbol: 'r', name: 'Radius', description: 'Distance from the center to the outer surface. All points on the surface are exactly radius r from center.' },
    { symbol: 'V', name: 'Volume', description: 'Total 3D space enclosed by the sphere. A sphere with radius 5 has volume 523.6 cubic units.' },
    { symbol: 'SA', name: 'Surface Area', description: 'Total area of the outer surface. A sphere with radius 5 has surface area 314.16 square units.' },
  ],
  howToUse: ['Select "Sphere" from the shape tabs above.', 'Enter the radius of the sphere.', 'View the volume, surface area, and diameter.'],
  explanation: 'Spheres appear everywhere: planets, bubbles, droplets, ball bearings. The sphere is the most efficient shape for containing volume with minimal material — which is why soap bubbles form spheres. The formulas were discovered by ancient Greek mathematicians. Archimedes was so proud of proving that a sphere has 2/3 the volume of its circumscribed cylinder that he requested it be carved on his tombstone.',
  faqs: [
    { question: 'Why is the sphere the most efficient shape?', answer: 'The sphere encloses the maximum volume for a given surface area of any 3D shape. Nature exploits this: cells are spherical to maximize nutrient exchange, water droplets form spheres to minimize surface energy, and planets are spherical because gravity pulls matter equally in all directions.' },
    { question: 'What is the surface-area-to-volume ratio?', answer: 'SA/V = 3/r for a sphere. As radius increases, this ratio decreases. A small sphere has high SA/V (good for heat exchange), while a large sphere has low SA/V (good for heat retention).' },
    { question: 'What units should I use?', answer: 'Any consistent unit works. If you enter radius in inches, volume is in cubic inches and surface area in square inches. The calculator does not convert between units.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld - Sphere', url: 'https://mathworld.wolfram.com/Sphere.html' },
    { source: 'Wikipedia - Sphere', url: 'https://en.wikipedia.org/wiki/Sphere' },
  ],
};

const cubeEdu: EducationalContent = {
  formula: 'V = s³ | SA = 6s² | Diagonal = s√3',
  diagram: cubeDiagram,
  formulaDescription: 'The cube is the simplest 3D shape — all edges equal, all angles right angles. Volume grows with the cube of the side length, surface area with the square. The space diagonal is the longest distance inside the cube, from one corner to the opposite corner.',
  variables: [
    { symbol: 's', name: 'Side Length', description: 'Length of any edge. All 12 edges are equal.' },
    { symbol: 'V', name: 'Volume', description: 'Total 3D space inside the cube. A cube with side 5 has volume 125 cubic units.' },
    { symbol: 'SA', name: 'Surface Area', description: 'Total area of all 6 square faces. A cube with side 5 has surface area 150 square units.' },
  ],
  howToUse: ['Select "Cube" from the shape tabs above.', 'Enter the side length of the cube.', 'View the volume, surface area, and space diagonal.'],
  explanation: 'The cube is the most intuitive 3D shape because of its perfect symmetry — all sides, angles, and faces are identical. This is why we call it "cubing" a number. A cube with side 2 has volume 8 (2³ = 8), and doubling the side to 4 multiplies the volume by 8 (4³ = 64). Cubes are everywhere: dice, shipping containers, building blocks.',
  faqs: [
    { question: 'How do you find the space diagonal of a cube?', answer: 'Use d = s√3. For a cube with side 5, the space diagonal is 5 × 1.732 = 8.66 units. This is the longest distance inside the cube.' },
    { question: 'What happens to volume when you double the side?', answer: 'Doubling the side multiplies volume by 8 (2³ = 8). Tripling it multiplies volume by 27 (3³ = 27). This is cubic scaling.' },
    { question: 'Is a cube a rectangular prism?', answer: 'Yes. A cube is a rectangular prism where length = width = height. The formula V = s³ is just a special case of V = l × w × h.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld - Cube', url: 'https://mathworld.wolfram.com/Cube.html' },
    { source: 'Wikipedia - Cube', url: 'https://en.wikipedia.org/wiki/Cube' },
  ],
};

const cylinderEdu: EducationalContent = {
  formula: 'V = πr²h | SA = 2πr² + 2πrh',
  diagram: cylinderDiagram,
  formulaDescription: 'A cylinder is essentially a stack of circles — its volume is the area of the circular base (πr²) multiplied by the height (h). The surface area has two parts: the two circular ends (2πr²) and the curved side (2πrh, which is the circumference times height — like a rectangle wrapped around).',
  variables: [
    { symbol: 'r', name: 'Radius', description: 'Radius of the circular base.' },
    { symbol: 'h', name: 'Height', description: 'Height of the cylinder.' },
    { symbol: 'V', name: 'Volume', description: 'Total 3D space inside. A cylinder with r=3, h=5 has volume 141.37 cubic units.' },
  ],
  howToUse: ['Select "Cylinder" from the shape tabs above.', 'Enter the radius and height of the cylinder.', 'View the volume, total surface area, and lateral surface area.'],
  explanation: 'Cylinders are everywhere in engineering: pipes, tanks, cans, engines, columns. The lateral surface area formula (2πrh) is just the circumference times the height — imagine peeling the label off a soup can and laying it flat as a rectangle. Understanding cylinder volume is essential for fluid capacity, engine displacement, and material estimation.',
  faqs: [
    { question: 'What is the difference between total and lateral surface area?', answer: 'Total surface area includes both circular ends plus the curved side. Lateral surface area includes only the curved side (the rectangle). For a paint can, you need total area. For a pipe, you need lateral area (the ends are open).' },
    { question: 'How is cylinder volume used in engines?', answer: 'Engine displacement is calculated using the cylinder volume formula: V = πr²h × number of cylinders. This tells you the total volume of air-fuel mixture an engine can draw in.' },
    { question: 'Does doubling the radius or height affect volume more?', answer: 'Doubling the radius quadruples the volume (since r is squared in V = πr²h). Doubling the height only doubles the volume. So radius has a much bigger effect.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld - Cylinder', url: 'https://mathworld.wolfram.com/Cylinder.html' },
    { source: 'Wikipedia - Cylinder', url: 'https://en.wikipedia.org/wiki/Cylinder' },
  ],
};

const coneEdu: EducationalContent = {
  formula: 'V = ⅓πr²h | SA = πr² + πrs | s = √(r² + h²)',
  diagram: coneDiagram,
  formulaDescription: 'A cone has exactly one-third the volume of a cylinder with the same base and height. This 1/3 factor comes from integral calculus — it is the 3D analogue of a triangle having half the area of a rectangle. The slant height (s) is the distance along the surface from the apex to the base edge.',
  variables: [
    { symbol: 'r', name: 'Radius', description: 'Radius of the circular base.' },
    { symbol: 'h', name: 'Height', description: 'Perpendicular height from base to apex.' },
    { symbol: 's', name: 'Slant Height', description: 'Distance along the surface from apex to base edge. s = √(r² + h²).' },
  ],
  howToUse: ['Select "Cone" from the shape tabs above.', 'Enter the radius of the base and the height of the cone.', 'View the volume, total surface area, and slant height.'],
  explanation: 'The 1/3 factor in the cone volume formula was discovered by Eudoxus around 370 BC using the method of exhaustion — an ancient form of calculus. It is one of the most important constants in geometry because the same 1/3 applies to any pyramid (a cone is a pyramid with a circular base). Cones appear in traffic cones, ice cream cones, speaker cones, megaphones, and conical tanks.',
  faqs: [
    { question: 'Why is the volume exactly one-third of a cylinder?', answer: 'A cone with the same base and height as a cylinder has exactly one-third the volume. You can prove this by filling a cone with water and pouring it into the cylinder — exactly three cone-fulls fill the cylinder.' },
    { question: 'What is the slant height?', answer: 'The slant height (s) is the distance along the cone surface from the tip to the edge of the base. It is found using the Pythagorean theorem: s = √(r² + h²). It is used for surface area calculations and is the length you would measure if you rolled the cone flat.' },
    { question: 'How do conical tanks differ from cylindrical tanks?', answer: 'Conical tanks hold one-third the volume of cylindrical tanks with the same base and height, but their shape allows for complete drainage without a flat bottom. They are commonly used for water treatment, food processing, and storage of granular materials.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld - Cone', url: 'https://mathworld.wolfram.com/Cone.html' },
    { source: 'Wikipedia - Cone', url: 'https://en.wikipedia.org/wiki/Cone' },
  ],
};

const boxEdu: EducationalContent = {
  formula: 'V = lwh | SA = 2(lw + lh + wh) | d = √(l² + w² + h²)',
  diagram: boxDiagram,
  formulaDescription: 'A rectangular prism (box) has three dimensions: length, width, and height. Volume is simply the product of all three. Surface area is the sum of three pairs of identical rectangular faces, each pair calculated and doubled.',
  variables: [
    { symbol: 'l', name: 'Length', description: 'The longest dimension of the box.' },
    { symbol: 'w', name: 'Width', description: 'The second dimension of the box.' },
    { symbol: 'h', name: 'Height', description: 'The third dimension of the box.' },
  ],
  howToUse: ['Select "Rectangular Prism" from the shape tabs above.', 'Enter the length, width, and height of the box.', 'View the volume, surface area, and space diagonal.'],
  explanation: 'Boxes are the most common 3D shape in everyday life — rooms, shipping boxes, buildings, aquariums, and books are all rectangular prisms. The space diagonal formula (d = √(l² + w² + h²)) extends the Pythagorean theorem into three dimensions and gives the longest distance inside the box. This is useful for determining whether a long object (like a golf club or a piece of lumber) will fit diagonally inside a box.',
  faqs: [
    { question: 'What is DIM weight in shipping?', answer: 'Shipping companies use DIM (dimensional) weight, which is the volume of the package divided by a factor (typically 139 for domestic). If DIM weight exceeds actual weight, you pay for DIM weight. This is why reducing box size matters.' },
    { question: 'How does the space diagonal work?', answer: 'The space diagonal is the longest distance inside the box. It is the 3D application of the Pythagorean theorem: first find the diagonal of the base (√(l² + w²)), then use that with the height to find the space diagonal (√(d_base² + h²)).' },
    { question: 'Why does the surface area formula have three parts?', answer: 'A box has 6 faces in 3 pairs: front/back (l × h), top/bottom (l × w), and left/right (w × h). Each pair has two identical faces, so SA = 2lw + 2lh + 2wh.' },
  ],
  citations: [

    { source: 'Wikipedia - Cuboid', url: 'https://en.wikipedia.org/wiki/Cuboid' },
  ],
};

const pyramidEdu: EducationalContent = {
  formula: 'V = ⅓b²h | SA = b² + 2bs | s = √((b/2)² + h²)',
  diagram: pyramidDiagram,
  formulaDescription: 'A square pyramid has exactly one-third the volume of a prism with the same base and height — the same 1/3 factor as a cone (a cone is a pyramid with a circular base). The slant height (s) is the distance from the apex to the midpoint of a base edge.',
  variables: [
    { symbol: 'b', name: 'Base Side', description: 'Length of one side of the square base.' },
    { symbol: 'h', name: 'Height', description: 'Perpendicular height from base center to apex.' },
    { symbol: 's', name: 'Slant Height', description: 'Distance from apex to the midpoint of a base edge. s = √((b/2)² + h²).' },
  ],
  howToUse: ['Select "Pyramid" from the shape tabs above.', 'Enter the base side length and height of the pyramid.', 'View the volume, total surface area, and slant height.'],
  explanation: 'The Great Pyramid of Giza, one of the Seven Wonders of the Ancient World, was the tallest man-made structure for over 3,800 years. Its base is a nearly perfect square measuring about 230 meters per side, and its original height was about 146 meters. Using the pyramid formula V = ⅓b²h, its volume is approximately 2.6 million cubic meters. The 1/3 factor has been known since ancient Egypt, though the formal proof came later through integral calculus.',
  faqs: [
    { question: 'Why does a pyramid have 1/3 the volume of a prism?', answer: 'A pyramid with the same base and height as a prism has exactly one-third the volume. This is the 3D version of a triangle having half the area of a rectangle. The 1/3 factor comes from integration — the cross-sectional area decreases linearly from base to apex.' },
    { question: 'What is the slant height used for?', answer: 'The slant height is used to calculate the surface area of the triangular faces. Each face is a triangle with base b and height s (the slant height), so the area of one face is ½bs. The total lateral surface area is 2bs (four triangular faces).' },
    { question: 'How accurate is the Great Pyramid as a geometric shape?', answer: 'The Great Pyramid of Giza is remarkably precise — its base is square to within 58mm of perfect, and its sides align to true north within 3 minutes of arc. The original casing stones fit together with gaps of less than 0.5mm.' },
  ],
  citations: [
    { source: 'Wolfram MathWorld - Pyramid', url: 'https://mathworld.wolfram.com/Pyramid.html' },
    { source: 'Wikipedia - Pyramid', url: 'https://en.wikipedia.org/wiki/Pyramid_(geometry)' },
  ],
};

const shapeTabs = [
  { label: 'Sphere', value: 'sphere', slug: 'sphere' },
  { label: 'Cube', value: 'cube', slug: 'cube' },
  { label: 'Cylinder', value: 'cylinder', slug: 'cylinder' },
  { label: 'Cone', value: 'cone', slug: 'cone' },
  { label: 'Box', value: 'box', slug: 'box' },
  { label: 'Pyramid', value: 'pyramid', slug: 'pyramid' },
];

const volumeSurfaceConfig: CalculatorConfig = {
  shapeTabs,
  educationalByShape: {
    sphere: sphereEdu,
    cube: cubeEdu,
    cylinder: cylinderEdu,
    cone: coneEdu,
    box: boxEdu,
    pyramid: pyramidEdu,
  },
  inputs: [
    {
      id: 'dim1',
      label: 'Radius',
      type: 'number',
      placeholder: '5',
      min: 0,
      step: 0.001,
      required: true,
      helpText: 'Sphere/Cylinder/Cone: radius | Cube/Box: length | Pyramid: base side',
    },
    {
      id: 'dim2',
      label: 'Height',
      type: 'number',
      placeholder: '3',
      min: 0,
      step: 0.001,
      showWhen: (v) => !['sphere', 'cube'].includes(v.shape || ''),
      helpText: 'Cylinder/Cone/Pyramid: height | Box: width',
    },
    {
      id: 'dim3',
      label: 'Box Height',
      type: 'number',
      placeholder: '2',
      min: 0,
      step: 0.001,
      showWhen: (v) => v.shape === 'box',
      helpText: 'Box only: height',
    },
  ],
  calculate: (values) => calculate(values.shape || 'sphere', parseFloat(values.dim1), parseFloat(values.dim2), parseFloat(values.dim3)),
  educational: sphereEdu,
  extraPanel: (values, results) => results.length ? createElement(VolumeSurfacePanel, { values, results }) : null,
};

export default volumeSurfaceConfig;
