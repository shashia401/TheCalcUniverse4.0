import { createElement } from 'react';
import { CalculatorConfig } from '../../../../types/calculator';
import VolumeSurfacePanel from '../VolumeSurfacePanel';
import { calculate } from '../shared';

const cubeConfig: CalculatorConfig = {
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
    { id: 'dim1', label: 'Side Length', type: 'number', placeholder: '5', min: 0, step: 0.001, required: true, helpText: 'Length of one side of the cube' },
    { id: 'dim2', label: 'Dimension 2', type: 'number', placeholder: '3', min: 0, step: 0.001, helpText: 'Box: width | Cylinder/Cone/Pyramid: height' },
    { id: 'dim3', label: 'Dimension 3 (Box height)', type: 'number', placeholder: '2', min: 0, step: 0.001, helpText: 'Box only: height' },
  ],
  calculate: (values) => calculate(values.shape || 'cube', parseFloat(values.dim1), parseFloat(values.dim2), parseFloat(values.dim3)),
  educational: {
    formula: 'V = s³ | SA = 6 × s² | Diagonal = s × √3',
    diagram: { svg: '', alt: '', caption: '' },
    formulaDescription: 'A cube is the simplest 3D shape — all edges equal, all angles right angles. Volume grows with the cube of the side length (s³), surface area with the square (6s²). The space diagonal (the longest distance inside the cube, from one corner to the opposite corner) is s√3, derived from the Pythagorean theorem applied twice: first across a face (s√2), then through space (√((s√2)² + s²) = s√3).',
    variables: [
      { symbol: 's', name: 'Side Length', description: 'Length of any edge of the cube. All 12 edges are equal.' },
      { symbol: 'V', name: 'Volume', description: 'The total 3D space inside the cube. A cube with side 5 has volume 125 cubic units.' },
      { symbol: 'SA', name: 'Surface Area', description: 'Total area of all 6 square faces. A cube with side 5 has surface area 150 square units.' },
    ],
    howToUse: [
      'Select "Cube" from the shape dropdown to calculate cube properties.',
      'Enter the side length of the cube in any consistent unit.',
      'View the volume, total surface area, and space diagonal calculated instantly.',
    ],
    explanation: 'The cube is the most intuitive 3D shape because of its perfect symmetry — all sides, angles, and faces are identical. This makes it the fundamental building block of 3D space. Volume is calculated by cubing the side length (s³), which is why we call it "cubing" a number. A cube with side 2 has volume 8 (2³ = 8), and doubling the side to 4 multiplies the volume by 8 (4³ = 64). This cubic scaling is why a 10cm cube holds 1,000 times more than a 1cm cube. Cubes are everywhere in everyday life: dice, shipping containers, building blocks, and sugar cubes. In mathematics, the cube is a special case of a rectangular prism where all dimensions are equal.',
    faqs: [
      { question: 'How do you find the space diagonal of a cube?', answer: 'The space diagonal runs from one corner to the opposite corner through the interior. Use the formula d = s√3. For a cube with side 5, the space diagonal is 5 × 1.732 = 8.66 units. This is useful for finding the longest object that can fit inside a cube-shaped box.' },
      { question: 'What happens to volume when you double the side?', answer: 'Doubling the side length multiplies volume by 8 (2³ = 8). Tripling the side multiplies volume by 27 (3³ = 27). This is called cubic scaling — volume grows with the cube of linear dimension.' },
      { question: 'Is a cube a rectangular prism?', answer: 'Yes. A cube is a rectangular prism (box) where length = width = height. All cube formulas can be derived from the box formulas by substituting l = w = h = s. The volume s³ is just a special case of l × w × h.' },
    ],
    citations: [
      { source: 'Wolfram MathWorld', title: 'Cube', url: 'https://mathworld.wolfram.com/Cube.html' },
      { source: 'Wikipedia', title: 'Cube', url: 'https://en.wikipedia.org/wiki/Cube' },
    ],
  },
  extraPanel: (values, results) => results.length ? createElement(VolumeSurfacePanel, { values, results }) : null,
};

export default cubeConfig;
