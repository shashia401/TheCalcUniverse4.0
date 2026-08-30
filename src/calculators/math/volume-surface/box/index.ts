import { createElement } from 'react';
import { CalculatorConfig } from '../../../../types/calculator';
import VolumeSurfacePanel from '../VolumeSurfacePanel';
import { calculate } from '../shared';

const boxConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'shape', label: '3D Shape', type: 'select', required: true,
      options: [
        { label: 'Sphere', value: 'sphere' },
        { label: 'Cube', value: 'cube' },
        { label: 'Rectangular Prism (Box)', value: 'box' },
        { label: 'Cylinder', value: 'cylinder' },
        { label: 'Cone', value: 'cone' },
        { label: 'Pyramid (Square Base)', value: 'pyramid' },
      ],
    },
    { id: 'dim1', label: 'Length', type: 'number', placeholder: '8', min: 0, step: 0.001, required: true, helpText: 'Length of the rectangular prism' },
    { id: 'dim2', label: 'Width', type: 'number', placeholder: '5', min: 0, step: 0.001, required: true, helpText: 'Width of the rectangular prism' },
    { id: 'dim3', label: 'Height', type: 'number', placeholder: '3', min: 0, step: 0.001, required: true, helpText: 'Height of the rectangular prism' },
  ],
  calculate: (values) => calculate(values.shape || 'box', parseFloat(values.dim1), parseFloat(values.dim2), parseFloat(values.dim3)),
  educational: {
    formula: 'V = l * w * h | SA = 2(lw + lh + wh) | Diagonal = sqrt(l^2 + w^2 + h^2)',
    diagram: { svg: '', alt: '', caption: '' },
    formulaDescription: 'A rectangular prism (box) is the most intuitive 3D shape for everyday use — it is simply a rectangle extended into the third dimension. Volume is the product of the three perpendicular dimensions: length, width, and height. Surface area has six rectangular faces that come in three identical pairs: top and bottom (l*w each), front and back (l*h each), and left and right sides (w*h each). The factor of 2 in the formula accounts for these pairs. The space diagonal (the longest distance between opposite corners, passing through the interior) is found by applying the Pythagorean theorem twice: first across a face to get the face diagonal, then through space to get the space diagonal.',
    variables: [
      { symbol: 'l', name: 'Length', description: 'The longest horizontal dimension of the rectangular prism.' },
      { symbol: 'w', name: 'Width', description: 'The shorter horizontal dimension, perpendicular to length.' },
      { symbol: 'h', name: 'Height', description: 'The vertical dimension from bottom to top.' },
      { symbol: 'V', name: 'Volume', description: 'Total 3D space inside the box. A box with dimensions 8 x 5 x 3 has volume 120 cubic units.' },
      { symbol: 'SA', name: 'Surface Area', description: 'Total area of all six faces. The same box has surface area 158 square units.' },
    ],
    howToUse: [
      'Select "Rectangular Prism (Box)" from the shape dropdown to calculate box properties.',
      'Enter the length, width, and height of the box in any consistent unit.',
      'All three dimensions are required — a box needs length, width, and height.',
      'View the volume, total surface area, and interior space diagonal in the results.',
    ],
    explanation: 'Rectangular prisms are the most common 3D shape in human-made environments. Buildings are rectangular prisms. Shipping boxes, cargo containers, rooms, aquariums, books, bricks, and furniture all approximate this shape. The formulas are straightforward because all angles are right angles, but they are powerful: knowing the volume of a shipping container tells you how many boxes fit; knowing the surface area tells you how much wrapping paper or paint you need. The space diagonal is critical for determining whether a long object (like a curtain rod or a piece of lumber) will fit inside a box when placed diagonally. For a box with dimensions 8 x 5 x 3, the space diagonal is sqrt(64 + 25 + 9) = sqrt(98) = 9.9 units — meaning a rod up to that length can be packed diagonally.',
    faqs: [
      { question: 'How is a box different from a cube?', answer: 'A box (rectangular prism) can have different measurements for length, width, and height. A cube is a special case where all three dimensions are equal. The cube is to the box what the square is to the rectangle. All cube formulas can be derived from the box formulas by setting l = w = h = s.' },
      { question: 'How do I calculate the volume of a room for HVAC sizing?', answer: 'Room volume is length * width * height. For a 12 ft x 14 ft room with 8 ft ceilings, volume is 12 * 14 * 8 = 1,344 cubic feet. HVAC systems are often rated by the volume they can heat or cool. A general rule: you need roughly 20 BTU per square foot of floor area, but knowing the volume helps account for ceiling height variations.' },
      { question: 'Can I use this for shipping cost calculations?', answer: 'Shipping carriers often use the greater of actual weight and dimensional weight (DIM weight). DIM weight = (length * width * height) / DIM factor, where the DIM factor depends on the carrier (typically 139 for domestic UPS/FedEx). If your box is 20 x 15 x 10 inches, the DIM weight is (3000) / 139 = 21.6 lbs. If the actual weight is 15 lbs, you pay for 22 lbs. This calculator gives you the raw volume — apply the DIM factor separately for shipping estimates.' },
      { question: 'What is the surface area formula telling me?', answer: 'The formula SA = 2(lw + lh + wh) breaks down as: lw is the area of the bottom (and top), lh is the area of the front (and back), wh is the area of each side. The factor 2 accounts for opposite faces being identical. For a 8 x 5 x 3 box: bottom and top are 40 each (80 total), front and back are 24 each (48 total), sides are 15 each (30 total) — sum is 158 square units. This is exactly how much material you need to build the box.' },
    ],
    citations: [

      { source: 'Wikipedia', title: 'Cuboid', url: 'https://en.wikipedia.org/wiki/Cuboid' },
    ],
  },
  extraPanel: (values, results) => results.length ? createElement(VolumeSurfacePanel, { values, results }) : null,
};

export default boxConfig;
