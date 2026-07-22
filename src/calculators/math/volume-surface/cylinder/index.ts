import { createElement } from 'react';
import { CalculatorConfig } from '../../../../types/calculator';
import VolumeSurfacePanel from '../VolumeSurfacePanel';
import { calculate } from '../shared';

const cylinderConfig: CalculatorConfig = {
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
    { id: 'dim1', label: 'Radius', type: 'number', placeholder: '3', min: 0, step: 0.001, required: true, helpText: 'Radius of the circular base' },
    { id: 'dim2', label: 'Height', type: 'number', placeholder: '7', min: 0, step: 0.001, required: true, helpText: 'Height of the cylinder' },
    { id: 'dim3', label: 'Dimension 3 (Box height)', type: 'number', placeholder: '2', min: 0, step: 0.001, helpText: 'Box only: height' },
  ],
  calculate: (values) => calculate(values.shape || 'cylinder', parseFloat(values.dim1), parseFloat(values.dim2), parseFloat(values.dim3)),
  educational: {
    formula: 'V = pi * r^2 * h | SA = 2 * pi * r^2 + 2 * pi * r * h | Lateral = 2 * pi * r * h',
    diagram: { svg: '', alt: '', caption: '' },
    formulaDescription: 'A cylinder is essentially a stack of circles — the volume is the area of the circular base (pi*r^2) multiplied by the height (h). The total surface area has two components: the two circular ends (2*pi*r^2) and the lateral surface (2*pi*r*h). The lateral surface area is particularly interesting — if you cut a cylinder vertically and unroll it, you get a rectangle with width equal to the circumference (2*pi*r) and height (h). This rectangle is why the lateral area formula is circumference times height. Understanding the distinction between lateral and total surface area matters in engineering: when painting a pipe you care about lateral area; when manufacturing a sealed can you need total surface area.',
    variables: [
      { symbol: 'r', name: 'Radius', description: 'Radius of the circular base. Both bases are identical circles with this radius.' },
      { symbol: 'h', name: 'Height', description: 'Perpendicular distance between the two circular bases. The cylinder must be right (not slanted) for this formula.' },
      { symbol: 'V', name: 'Volume', description: 'Total 3D space inside the cylinder. A cylinder with radius 3 and height 7 has volume roughly 197.92 cubic units.' },
      { symbol: 'SA', name: 'Total Surface Area', description: 'Area of all surfaces: both circular ends plus the lateral curved surface. Same cylinder yields about 188.5 square units.' },
    ],
    howToUse: [
      'Select "Cylinder" from the shape dropdown to calculate cylinder properties.',
      'Enter the radius of the circular base and the height of the cylinder in consistent units.',
      'View the volume, total surface area, and lateral (side) surface area calculated for you.',
      'Lateral surface area excludes the two circular ends — useful when only the side material matters.',
    ],
    explanation: 'Cylinders are among the most common shapes in engineering and everyday life. From soda cans and food tins to pipes, pressure vessels, hydraulic pistons, and engine cylinders — the shape is ubiquitous. The volume formula V = pi*r^2*h tells you how much a cylinder can hold, which is critical for fuel tanks, water pipes, and storage drums. The surface area formula tells you how much material is needed to build the cylinder. A key insight: for a fixed volume, a taller, narrower cylinder has more surface area than a short, wide one — which is why soda cans are squat rather than tall: they use less aluminum per ounce of beverage. The lateral surface area (2*pi*r*h) appears in heat transfer calculations for pipes and in fluid dynamics for pipe flow friction.',
    faqs: [
      { question: 'What is the difference between lateral and total surface area?', answer: 'Lateral surface area is just the curved side of the cylinder — like the label on a soup can. Total surface area adds both circular ends — like the entire can including top and bottom. If you are wrapping a pipe with insulation, you only need the lateral area. If you are manufacturing a sealed container, you need the total surface area.' },
      { question: 'How is the cylinder volume formula used for engine displacement?', answer: 'Engine displacement is the total volume swept by all pistons in an engine. Each cylinder\'s displacement is pi*r^2*stroke (where stroke is the piston travel distance, equivalent to height). Multiply by the number of cylinders to get total displacement. A 4-cylinder engine with bore 80mm and stroke 90mm has displacement 4 * pi * 40^2 * 90 = roughly 1,810 cc or 1.8 liters.' },
      { question: 'Why does the surface area formula have two parts?', answer: 'The cylinder has two distinct surface types: flat circular ends and a curved lateral surface. These have different geometries and are calculated separately. The two ends contribute 2*pi*r^2 (two circles), and the lateral surface contributes 2*pi*r*h (a rectangle when unrolled). Adding them gives the total material required to build a closed cylinder.' },
      { question: 'What happens to volume and surface area when you double the radius vs doubling the height?', answer: 'Doubling the radius quadruples the volume (since r is squared) and changes surface area significantly. Doubling the height doubles the volume but has a smaller effect on surface area. This is why long, thin pipes are efficient for fluid transport — they maximize volume while minimizing material cost.' },
    ],
    citations: [
      { source: 'Wolfram MathWorld', title: 'Cylinder', url: 'https://mathworld.wolfram.com/Cylinder.html' },
      { source: 'Wikipedia', title: 'Cylinder', url: 'https://en.wikipedia.org/wiki/Cylinder' },
    ],
  },
  extraPanel: (values, results) => results.length ? createElement(VolumeSurfacePanel, { values, results }) : null,
};

export default cylinderConfig;
