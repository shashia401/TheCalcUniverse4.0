import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import FlowRatePanel from './FlowRatePanel';

const flowRateConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Calculate',
      type: 'select',
      required: true,
      helpText: 'Choose what to calculate — enter the other two known values',
      options: [
        { label: 'Flow Velocity — given pipe diameter and flow rate', value: 'velocity' },
        { label: 'Flow Rate — given pipe diameter and velocity', value: 'flowrate' },
        { label: 'Pipe Diameter — given flow rate and velocity', value: 'diameter' },
      ],
    },
    {
      id: 'pipeDiameter',
      label: 'Pipe Inside Diameter',
      type: 'number',
      placeholder: '2',
      unit: 'inches',
      inputMode: 'decimal',
      min: 0,
      step: 0.125,
      helpText: 'Inner diameter of the pipe — larger diameter allows more flow',
    },
    {
      id: 'flowRate',
      label: 'Flow Rate',
      type: 'number',
      placeholder: '25',
      unit: 'GPM',
      inputMode: 'decimal',
      min: 0,
      step: 0.1,
      helpText: 'Gallons per minute (US)',
    },
    {
      id: 'velocity',
      label: 'Flow Velocity',
      type: 'number',
      placeholder: '5',
      unit: 'ft/s',
      inputMode: 'decimal',
      min: 0,
      step: 0.1,
      helpText: 'Typical ranges: 1-4 ft/s suction, 5-12 ft/s discharge',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'velocity';
    const diamIn = parseFloat(values.pipeDiameter);
    const flowGPM = parseFloat(values.flowRate);
    const velocityFps = parseFloat(values.velocity);

    const fmt = (n: number) => parseFloat(n.toFixed(4)).toString();

    if (mode === 'velocity') {
      if (isNaN(diamIn) || isNaN(flowGPM) || diamIn <= 0) return [];
      const diamFt = diamIn / 12;
      const areaSqFt = Math.PI * Math.pow(diamFt / 2, 2);
      const flowCFS = flowGPM / 448.83;
      const velFps = flowCFS / areaSqFt;
      const velMps = velFps * 0.3048;
      const getVelColor = (v: number): 'positive' | 'neutral' | 'negative' => v <= 10 ? 'positive' : v <= 15 ? 'neutral' : 'negative';
      return [
        { id: 'velocity', label: 'Flow Velocity', value: `${fmt(velFps)} ft/s (${fmt(velMps)} m/s)`, highlight: true, color: getVelColor(velFps) },
        { id: 'area', label: 'Pipe Cross-Section Area', value: `${fmt(areaSqFt * 144)} in²`, color: 'neutral' },
        { id: 'flowCFS', label: 'Flow Rate (cu ft/s)', value: `${fmt(flowCFS)} ft³/s`, color: 'neutral' },
      ];
    }

    if (mode === 'flowrate') {
      if (isNaN(diamIn) || isNaN(velocityFps) || diamIn <= 0) return [];
      const diamFt = diamIn / 12;
      const areaSqFt = Math.PI * Math.pow(diamFt / 2, 2);
      const flowCFS = areaSqFt * velocityFps;
      const flowGPMCalc = flowCFS * 448.83;
      const flowLPM = flowGPMCalc * 3.78541;
      return [
        { id: 'flowGPM', label: 'Flow Rate', value: `${fmt(flowGPMCalc)} GPM`, highlight: true, color: 'positive' },
        { id: 'flowLPM', label: 'In Liters per Minute', value: `${fmt(flowLPM)} L/min`, color: 'neutral' },
        { id: 'flowCFS', label: 'In Cubic Feet per Second', value: `${fmt(flowCFS)} ft³/s`, color: 'neutral' },
      ];
    }

    if (mode === 'diameter') {
      if (isNaN(flowGPM) || isNaN(velocityFps) || velocityFps <= 0) return [];
      const flowCFS = flowGPM / 448.83;
      const areaSqFt = flowCFS / velocityFps;
      const diamFt = 2 * Math.sqrt(areaSqFt / Math.PI);
      const diamIn = diamFt * 12;
      return [
        { id: 'diameter', label: 'Required Pipe Diameter', value: `${fmt(diamIn)} inches`, highlight: true, color: 'positive' },
        { id: 'area', label: 'Required Cross-Section', value: `${fmt(areaSqFt * 144)} in²`, color: 'neutral' },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FlowRatePanel, { values, results });
  },
  educational: {
    formula: 'Q = A × V | V = Q ÷ A | A = π × (d/2)²',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="130" width="320" height="80" fill="var(--svg-e0f2fe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="40"/><line x1="60" y1="170" x2="380" y2="170" stroke="var(--svg-3b82f6)" stroke-width="2"/><polygon points="100,160 110,170 100,180" fill="var(--svg-3b82f6)"/><polygon points="160,160 170,170 160,180" fill="var(--svg-3b82f6)"/><polygon points="220,160 230,170 220,180" fill="var(--svg-3b82f6)"/><polygon points="280,160 290,170 280,180" fill="var(--svg-3b82f6)"/><polygon points="340,160 350,170 340,180" fill="var(--svg-3b82f6)"/><text x="220" y="115" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Flow Rate Q = A x V</text><text x="220" y="250" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Cross-section A = pi x d/2</text><text x="220" y="270" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Velocity V = Q / A</text></svg>',
      alt: 'Pipe cross-section with directional arrows showing fluid flow',
      caption: 'Flow rate is cross-sectional area times fluid velocity',
    },
    formulaDescription:
      'The continuity equation relates volumetric flow rate (Q), pipe cross-sectional area (A), and fluid velocity (V). Q = A × V. This is the fundamental relationship in pipe sizing and fluid mechanics.',
    variables: [
      { symbol: 'Q', name: 'Volumetric Flow Rate', description: 'Volume of fluid passing a point per unit time (GPM, ft³/s, L/min). In US plumbing, gallons per minute (GPM) is the standard unit.' },
      { symbol: 'A', name: 'Cross-Sectional Area', description: 'The interior area of the pipe, calculated from the inside diameter using A = π × (d/2)². Doubling the pipe diameter quadruples the area.' },
      { symbol: 'V', name: 'Flow Velocity', description: 'Average speed of fluid through the pipe in ft/s or m/s. Key design parameter with recommended ranges for different applications.' },
    ],
    howToUse: [
      'Select what you want to calculate: flow velocity, flow rate, or required pipe diameter.',
      'Enter the two known values.',
      'For velocity, recommended ranges are 1-4 ft/s for suction lines and 5-12 ft/s for discharge lines.',
      'If velocity is too high (above 10 ft/s), consider a larger pipe diameter.',
    ],
    explanation:
      'The continuity equation (Q = AV) is fundamental to fluid mechanics and pipe sizing. Velocity has practical limits: too slow causes sedimentation in slurries; too fast causes pipe erosion, noise, and pressure loss. For water systems, recommended velocities are 2 to 4 ft/s for suction (intake) lines and 5 to 10 ft/s for discharge (pressure) lines. Oversizing pipes reduces velocity and increases cost; undersizing increases velocity losses and erosion risk. A practical example: a 2-inch diameter pipe carrying 25 GPM has a velocity of approximately 2.6 ft/s — well within the discharge range. If you try to push 100 GPM through the same 2-inch pipe, velocity jumps to 10.4 ft/s, causing excessive noise, erosion risk, and pressure drop. The correct solution is to increase pipe diameter: 100 GPM at 6 ft/s requires approximately 3.5-inch diameter pipe. For HVAC chilled water systems, design velocity is typically kept between 2 and 8 ft/s to balance pump energy cost against pipe material cost. Oversizing pipes reduces pumping energy over the life of the building but increases upfront material cost — the economic pipe size is found by balancing these two factors, often called the life cycle cost analysis.',
    faqs: [
      {
        question: 'What are typical flow velocities for water systems?',
        answer: 'Residential plumbing: 4 to 8 ft/s. Suction lines: 1 to 4 ft/s. Pump discharge: 5 to 12 ft/s. Above 10 ft/s in rigid piping can cause noise, water hammer, and erosion over time. For fire sprinkler systems, velocities of 15 to 20 ft/s are acceptable for short durations during a fire event.',
      },
      {
        question: 'Does this calculator account for friction losses?',
        answer: 'No. This calculator finds velocity from flow rate and diameter using the continuity equation only. Friction losses (head loss) require the Darcy-Weisbach or Hazen-Williams equations, which account for pipe roughness, fittings, and fluid viscosity.',
      },
      {
        question: 'How does pipe diameter affect flow rate?',
        answer: 'Flow rate is proportional to the square of the pipe diameter (area = πr²). Doubling pipe diameter quadruples the cross-sectional area, allowing approximately 4x the flow at the same velocity. This is why upgrading from 1/2-inch to 3/4-inch plumbing can significantly improve water pressure and flow at fixtures.',
      },
      {
        question: 'What happens if flow velocity is too high?',
        answer: 'Excessive velocity causes several problems: pipe erosion (especially at bends and fittings), water hammer when valves close suddenly, cavitation in pumps, flow noise (whistling or banging in pipes), and excessive pressure drop that requires larger pumps. In copper piping, velocities above 8 ft/s accelerate erosion-corrosion. In PVC, velocities above 12 ft/s can cause fatigue failure at joints. The general engineering guideline is to keep water velocity below 10 ft/s in most systems.',
      },
      {
        question: 'What is the difference between flow rate and flow velocity?',
        answer: 'Flow rate (Q) is the volume of fluid passing a point per unit time, measured in GPM or ft³/s. Flow velocity (V) is the speed of the fluid, measured in ft/s or m/s. They are related by Q = A × V, where A is the cross-sectional area. A wide pipe can have a low velocity but still deliver a high flow rate, while a narrow pipe needs higher velocity to deliver the same flow. This is why garden hoses have restricted flow even though water comes out fast — the small diameter limits the total volume.',
      },
      {
        question: 'Why are there different velocity recommendations for suction vs. discharge?',
        answer: 'Suction lines carry fluid to the pump inlet. Excess velocity in the suction line can cause cavitation — the formation of vapor bubbles that collapse violently and damage the pump impeller. Suction velocity is therefore kept low (1-4 ft/s) to maintain positive pressure at the pump inlet. Discharge lines carry pressurized fluid away from the pump and can tolerate higher velocities (5-12 ft/s) since cavitation is not a concern. The pump\'s Net Positive Suction Head Required (NPSHR) dictates the minimum suction pipe size.',
      },
    ],
    quickReference: [
      { label: '1 GPM', value: '0.1337 ft³/min or 3.785 L/min' },
      { label: '1/2" pipe at 4 ft/s', value: '~4 GPM' },
      { label: '3/4" pipe at 6 ft/s', value: '~10 GPM' },
      { label: '1" pipe at 6 ft/s', value: '~15 GPM' },
      { label: '2" pipe at 6 ft/s', value: '~60 GPM' },
      { label: '4" pipe at 8 ft/s', value: '~310 GPM' },
      { label: 'Typical garden hose', value: '5-10 GPM at 40-60 PSI' },
      { label: 'Standard shower head', value: '1.5-2.5 GPM (flow-restricted)' },
    ],
    commonUses: [
      'Plumbing design — size pipes for residential and commercial water supply systems to ensure adequate flow at fixtures without excessive noise or pressure drop',
      'HVAC system engineering — calculate chilled water and condenser water flow rates through heat exchangers, cooling towers, and air handlers',
      'Fire sprinkler system design — determine pipe diameters and flow velocities that meet NFPA standards for adequate fire suppression coverage',
      'Irrigation planning — size mainlines, laterals, and drip tubing to deliver the required flow to sprinkler heads or drip emitters across a landscape',
      'Industrial process piping — design pump suction and discharge piping for chemical processing, wastewater treatment, and manufacturing fluid transport systems',
    ],
    citations: [
      { source: 'Wikipedia', title: 'Volumetric Flow Rate', url: 'https://en.wikipedia.org/wiki/Volumetric_flow_rate' },

    ],
  },
};

export default flowRateConfig;
