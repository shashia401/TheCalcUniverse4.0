import { createElement } from 'react';
import { CalculatorConfig } from '../../../../types/calculator';
import VolumeSurfacePanel from '../VolumeSurfacePanel';
import { calculate } from '../shared';

const pyramidConfig: CalculatorConfig = {
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
    { id: 'dim1', label: 'Base Side Length', type: 'number', placeholder: '6', min: 0, step: 0.001, required: true, helpText: 'Length of one side of the square base' },
    { id: 'dim2', label: 'Height', type: 'number', placeholder: '10', min: 0, step: 0.001, required: true, helpText: 'Vertical height from center of base to apex' },
    { id: 'dim3', label: 'Dimension 3 (Box height)', type: 'number', placeholder: '2', min: 0, step: 0.001, helpText: 'Box only: height' },
  ],
  calculate: (values) => calculate(values.shape || 'pyramid', parseFloat(values.dim1), parseFloat(values.dim2), parseFloat(values.dim3)),
  educational: {
    formula: 'V = (1/3) * b^2 * h | SA = b^2 + 2*b*s (s = slant height)',
    diagram: { svg: '', alt: '', caption: '' },
    formulaDescription: 'A square pyramid is the 3D analog of a triangle — a square base that tapers to a single point (apex). The 1/3 factor in the volume formula is the same fundamental constant found in cones: any shape that tapers to a point has exactly one-third the volume of its prism counterpart with the same base and height. The base area is b^2 (a square of side b), giving V = (1/3)*b^2*h. The surface area formula has two parts: the square base (b^2) and four triangular faces. Each triangular face has base b and height equal to the slant height s, calculated as sqrt((b/2)^2 + h^2) — applying the Pythagorean theorem with half the base width and the vertical height. The total lateral area is 4 * (1/2 * b * s) = 2*b*s.',
    variables: [
      { symbol: 'b', name: 'Base Side', description: 'Length of one side of the square base. All four base edges are equal.' },
      { symbol: 'h', name: 'Height', description: 'Vertical distance from the center of the square base to the apex, measured perpendicular to the base.' },
      { symbol: 's', name: 'Slant Height', description: 'Height of each triangular face — the distance from the apex to the midpoint of a base edge, measured along the face.' },
      { symbol: 'V', name: 'Volume', description: 'Total 3D space inside the pyramid. A pyramid with base 6 and height 10 has volume 120 cubic units.' },
    ],
    howToUse: [
      'Select "Pyramid (Square Base)" from the shape dropdown to calculate pyramid properties.',
      'Enter the base side length and the vertical height of the pyramid.',
      'The calculator computes the slant height automatically — you do not need to enter it separately.',
      'View the volume, total surface area including the base, and slant height in the results panel.',
    ],
    explanation: 'The square pyramid is one of the most historically significant geometric shapes. The Great Pyramid of Giza, built around 2560 BCE, is a square pyramid with an original base side of about 230 meters and height of about 146 meters, giving it a volume of roughly 2.6 million cubic meters. The ancient Egyptians achieved remarkable precision: the base is nearly a perfect square with sides differing by only a few centimeters. The pyramid shape is structurally efficient — the sloping sides distribute weight downward, which is why pyramids are among the oldest surviving large structures. In modern contexts, pyramid volume calculations apply to roof structures, decorative garden features, certain types of tents, and geometric architecture. The slant height is critical for construction: it determines the length of the sloping edges and the area of each triangular face, which translates directly to building materials for the sides.',
    faqs: [
      { question: 'Why does the pyramid volume formula also have a 1/3 factor, like the cone?', answer: 'Both pyramids and cones are "pointed" solids — their cross-sectional area shrinks linearly from the base to the apex. The same calculus principle applies: integrating the area of horizontal slices from base to apex gives exactly one-third the volume of the corresponding prism (a rectangular prism for pyramids, a cylinder for cones). In fact, a cone is just a pyramid with a circular base — the geometry of tapering to a point is the same regardless of base shape.' },
      { question: 'How do we know the Great Pyramid of Giza\'s original dimensions?', answer: 'Historical records and archaeological measurements indicate the original base side was approximately 230 meters (756 feet) and the original height was about 146.6 meters (481 feet). Over millennia, the outer casing stones were removed, reducing the height to about 139 meters today. Using V = (1/3)*b^2*h, its original volume was roughly (1/3) * 230^2 * 146.6 = 2.58 million cubic meters — enough stone to build over 30 Empire State Buildings.' },
      { question: 'What is slant height and why does it matter?', answer: 'Slant height is the length of the triangular face from the apex down to the midpoint of a base edge. It is longer than the vertical height because it follows the slope. You calculate it as s = sqrt((b/2)^2 + h^2). Slant height is crucial for construction — it determines how much material you need for each face. For a pyramid with base 6 and height 10, the slant height is sqrt(9 + 100) = sqrt(109) = 10.44 units. The four triangular faces together have area 2*b*s = 2 * 6 * 10.44 = 125.28 square units.' },
      { question: 'How does pyramid volume compare to a prism with the same base?', answer: 'A prism with base b^2 and height h has volume b^2*h. A pyramid with the same base and height has one-third that volume. This means you could fit exactly three identical pyramids inside a prism with the same base and height. This can be demonstrated physically: a hollow prism and a hollow pyramid with matching bases and heights — the pyramid fills exactly one-third when poured.' },
    ],
    citations: [
      { source: 'Wolfram MathWorld', title: 'Pyramid', url: 'https://mathworld.wolfram.com/Pyramid.html' },
      { source: 'Wikipedia', title: 'Pyramid (geometry)', url: 'https://en.wikipedia.org/wiki/Pyramid_(geometry)' },
    ],
  },
  extraPanel: (values, results) => results.length ? createElement(VolumeSurfacePanel, { values, results }) : null,
};

export default pyramidConfig;
