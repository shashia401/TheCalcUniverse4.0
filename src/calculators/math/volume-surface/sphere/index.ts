import { createElement } from 'react';
import { CalculatorConfig } from '../../../../types/calculator';
import VolumeSurfacePanel from '../VolumeSurfacePanel';
import { calculate } from '../shared';

const sphereConfig: CalculatorConfig = {
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
    { id: 'dim1', label: 'Radius', type: 'number', placeholder: '5', min: 0, step: 0.001, required: true, helpText: 'Distance from center to surface' },
    { id: 'dim2', label: 'Dimension 2', type: 'number', placeholder: '3', min: 0, step: 0.001, helpText: 'Box: width | Cylinder/Cone/Pyramid: height' },
    { id: 'dim3', label: 'Dimension 3 (Box height)', type: 'number', placeholder: '2', min: 0, step: 0.001, helpText: 'Box only: height' },
  ],
  calculate: (values) => calculate(values.shape || 'sphere', parseFloat(values.dim1), parseFloat(values.dim2), parseFloat(values.dim3)),
  educational: {
    formula: 'V = 4/3 × π × r³ | SA = 4 × π × r²',
    diagram: { svg: '', alt: '', caption: '' },
    formulaDescription: 'The sphere is the most geometrically efficient shape — it contains the maximum volume for a given surface area. The volume formula V = 4/3πr³ shows volume grows with the cube of the radius (double the radius, multiply volume by 8). Surface area grows with the square (double the radius, multiply area by 4). This is why larger objects have a lower surface-area-to-volume ratio — a principle that explains everything from cell biology (cells need high surface area for nutrient exchange) to animal physiology (elephants need large ears to radiate heat).',
    variables: [
      { symbol: 'r', name: 'Radius', description: 'Distance from the center of the sphere to its outer surface. All points on the surface are exactly radius r from center.' },
      { symbol: 'V', name: 'Volume', description: 'The total 3D space enclosed by the sphere. Measured in cubic units. A sphere with radius 5 has volume 523.6 cubic units.' },
      { symbol: 'SA', name: 'Surface Area', description: 'The total area of the outer surface. Measured in square units. A sphere with radius 5 has surface area 314.16 square units.' },
    ],
    howToUse: [
      'Select "Sphere" from the shape dropdown to calculate sphere properties.',
      'Enter the radius of the sphere — any unit is fine, just be consistent.',
      'View the volume, total surface area, and diameter calculated automatically.',
    ],
    explanation: 'Spheres appear everywhere in nature and engineering: planets, bubbles, droplets, ball bearings, and pressure vessels. The sphere is the most efficient shape for containing volume with minimal material — which is why soap bubbles form spheres and why water droplets in freefall are spherical. The formulas V = 4/3πr³ and A = 4πr² were discovered by ancient Greek mathematicians. Archimedes was so proud of proving that a sphere has 2/3 the volume of its circumscribed cylinder that he requested the proof be carved on his tombstone. In modern engineering, understanding sphere volume is critical for tank design, while surface area matters for heat transfer calculations and chemical reaction rates.',
    faqs: [
      { question: 'Why is the sphere the most efficient shape?', answer: 'The sphere encloses the maximum volume for a given surface area of any 3D shape. This is known as the isoperimetric inequality in 3D. Nature exploits this: cells are spherical to maximize nutrient exchange, water droplets form spheres to minimize surface energy, and planets are spherical because gravity pulls matter equally in all directions.' },
      { question: 'What units should I use?', answer: 'Any consistent unit works. If you enter the radius in inches, volume is in cubic inches and surface area in square inches. For meters, volume is in cubic meters and surface area in square meters. The calculator does not convert between units.' },
      { question: 'What is the surface-area-to-volume ratio?', answer: 'SA/V = 3/r for a sphere. As radius increases, this ratio decreases. A small sphere has high SA/V (good for heat exchange), while a large sphere has low SA/V (good for heat retention). This is why small animals lose body heat faster than large ones, and why radiators use thin pipes (high surface area per volume).' },
    ],
    citations: [
      { source: 'Wolfram MathWorld', title: 'Sphere', url: 'https://mathworld.wolfram.com/Sphere.html' },
      { source: 'Wikipedia', title: 'Sphere', url: 'https://en.wikipedia.org/wiki/Sphere' },
    ],
  },
  extraPanel: (values, results) => results.length ? createElement(VolumeSurfacePanel, { values, results }) : null,
};

export default sphereConfig;
