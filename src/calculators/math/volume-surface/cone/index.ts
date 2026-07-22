import { createElement } from 'react';
import { CalculatorConfig } from '../../../../types/calculator';
import VolumeSurfacePanel from '../VolumeSurfacePanel';
import { calculate } from '../shared';

const coneConfig: CalculatorConfig = {
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
    { id: 'dim1', label: 'Radius', type: 'number', placeholder: '4', min: 0, step: 0.001, required: true, helpText: 'Radius of the circular base' },
    { id: 'dim2', label: 'Height', type: 'number', placeholder: '9', min: 0, step: 0.001, required: true, helpText: 'Vertical height from base to apex (not slant height)' },
    { id: 'dim3', label: 'Dimension 3 (Box height)', type: 'number', placeholder: '2', min: 0, step: 0.001, helpText: 'Box only: height' },
  ],
  calculate: (values) => calculate(values.shape || 'cone', parseFloat(values.dim1), parseFloat(values.dim2), parseFloat(values.dim3)),
  educational: {
    formula: 'V = (1/3) * pi * r^2 * h | SA = pi * r^2 + pi * r * s (s = slant height)',
    diagram: { svg: '', alt: '', caption: '' },
    formulaDescription: 'A cone is like a cylinder that tapers to a point — and the 1/3 factor reflects exactly this relationship. The volume of a cone is exactly one-third the volume of a cylinder with the same base and height. This 1/3 factor appears because the cross-sectional area shrinks linearly from the base to the apex. Calculus confirms this: integrating pi*r^2 from 0 to h (for a cylinder) gives pi*r^2*h, but integrating pi*(r*x/h)^2 from 0 to h (for a cone, where radius tapers linearly) gives (1/3)*pi*r^2*h. The surface area formula adds the circular base (pi*r^2) to the lateral conical surface (pi*r*s), where s is the slant height — the distance from the apex to the edge of the base along the surface.',
    variables: [
      { symbol: 'r', name: 'Base Radius', description: 'Radius of the circular base of the cone.' },
      { symbol: 'h', name: 'Height', description: 'Perpendicular distance from the center of the base to the apex (tip). Not the slant height.' },
      { symbol: 's', name: 'Slant Height', description: 'Distance from the apex to any point on the edge of the base, measured along the lateral surface. Calculated as sqrt(r^2 + h^2).' },
      { symbol: 'V', name: 'Volume', description: 'Total 3D space inside the cone. A cone with radius 4 and height 9 has volume roughly 150.8 cubic units.' },
    ],
    howToUse: [
      'Select "Cone" from the shape dropdown to calculate cone properties.',
      'Enter the base radius and the vertical height of the cone (not the slant height).',
      'The calculator computes the slant height automatically using the Pythagorean theorem.',
      'Review the volume, total surface area, and slant height in the results panel.',
    ],
    explanation: 'Cones appear throughout the natural and built world. The 1/3 factor in the volume formula is a fundamental geometric constant that appears whenever a shape tapers to a point — for cones, pyramids, and any pointed solid. This relationship was known to Euclid and rigorously proven by Eudoxus using the method of exhaustion, an ancient precursor to modern calculus. In practical terms, the cone\'s shape is efficient for directing flow: traffic cones guide vehicles, speaker cones focus sound, megaphones amplify voices, and conical tanks allow sediment to settle at the bottom for easy drainage. The slant height s = sqrt(r^2 + h^2) follows directly from the Pythagorean theorem — imagine a right triangle where the base is the radius, the height is the vertical rise, and the hypotenuse is the slant distance along the cone\'s surface.',
    faqs: [
      { question: 'Why does the volume formula have a 1/3 factor?', answer: 'The 1/3 comes from the fact that a cone is a "pointed" version of a cylinder. As you move up from the base, the cross-sectional area shrinks linearly to zero at the apex. Calculus shows that integrating these shrinking areas gives exactly one-third the volume of a cylinder with the same base and height. The same 1/3 factor applies to pyramids. You can also demonstrate this physically: a cone and cylinder with equal base and height — the cone holds exactly one-third as much water.' },
      { question: 'How are ice cream cones and waffle cones different?', answer: 'A standard ice cream cone is approximately a right circular cone. The volume determines how much ice cream it can hold. A typical waffle cone has a base diameter of about 6 cm and a height of about 12 cm, giving a volume of roughly 113 mL — similar to a standard scoop. The surface area determines how much chocolate coating you would need to line the inside, though in practice cones are dipped rather than coated.' },
      { question: 'What is slant height and how is it different from height?', answer: 'Height (h) is the perpendicular vertical distance from base center to apex — the straight-up measurement. Slant height (s) is the distance along the cone\'s sloping surface from apex to base edge. They are related by the Pythagorean theorem: s = sqrt(r^2 + h^2). The slant height is what you measure if you run a tape measure along the outside of a traffic cone from tip to bottom edge. It is needed for surface area because the lateral surface is a sector of a circle, not a rectangle.' },
      { question: 'Why might a conical tank be preferred over a cylindrical one?', answer: 'Conical tanks are often used for liquids containing solids or sludge because the sloping bottom allows sediment to settle and be drained from the apex. The cone shape also provides natural self-cleaning flow. In industrial settings, conical-bottom tanks are standard for mixing, separation, and drainage applications. The trade-off is that for the same height and base radius, a conical tank holds only one-third the volume of a cylindrical one.' },
    ],
    citations: [
      { source: 'Wolfram MathWorld', title: 'Cone', url: 'https://mathworld.wolfram.com/Cone.html' },
      { source: 'Wikipedia', title: 'Cone', url: 'https://en.wikipedia.org/wiki/Cone' },
    ],
  },
  extraPanel: (values, results) => results.length ? createElement(VolumeSurfacePanel, { values, results }) : null,
};

export default coneConfig;
