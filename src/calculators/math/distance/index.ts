import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import DistancePanel from './DistancePanel';

const distanceConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Dimension',
      type: 'select',
      required: true,
      options: [
        { label: '1D — Number Line', value: '1d' },
        { label: '2D — Cartesian Plane', value: '2d' },
        { label: '3D — Three-Dimensional Space', value: '3d' },
      ],
    },
    // 1D inputs
    {
      id: 'x1_1d',
      label: 'Point A',
      type: 'number',
      placeholder: '3',
      step: 0.1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Coordinate of the first point on the number line',
      showWhen: (v) => v.mode === '1d',
    },
    {
      id: 'x2_1d',
      label: 'Point B',
      type: 'number',
      placeholder: '7',
      step: 0.1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Coordinate of the second point on the number line',
      showWhen: (v) => v.mode === '1d',
    },
    // 2D inputs
    {
      id: 'x1',
      label: 'X₁',
      type: 'number',
      placeholder: '2',
      step: 0.1,
      required: true,
      inputMode: 'numeric',
      helpText: 'X-coordinate of first point',
      showWhen: (v) => v.mode === '2d' || v.mode === '3d',
    },
    {
      id: 'y1',
      label: 'Y₁',
      type: 'number',
      placeholder: '3',
      step: 0.1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Y-coordinate of first point',
      showWhen: (v) => v.mode === '2d' || v.mode === '3d',
    },
    {
      id: 'x2',
      label: 'X₂',
      type: 'number',
      placeholder: '5',
      step: 0.1,
      required: true,
      inputMode: 'numeric',
      helpText: 'X-coordinate of second point',
      showWhen: (v) => v.mode === '2d' || v.mode === '3d',
    },
    {
      id: 'y2',
      label: 'Y₂',
      type: 'number',
      placeholder: '7',
      step: 0.1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Y-coordinate of second point',
      showWhen: (v) => v.mode === '2d' || v.mode === '3d',
    },
    // 3D inputs
    {
      id: 'z1',
      label: 'Z₁',
      type: 'number',
      placeholder: '1',
      step: 0.1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Z-coordinate of first point',
      showWhen: (v) => v.mode === '3d',
    },
    {
      id: 'z2',
      label: 'Z₂',
      type: 'number',
      placeholder: '4',
      step: 0.1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Z-coordinate of second point',
      showWhen: (v) => v.mode === '3d',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || '2d';

    const fmt = (n: number) => {
      if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
      return parseFloat(n.toFixed(6)).toString();
    };

    if (mode === '1d') {
      const x1 = parseFloat(values.x1_1d);
      const x2 = parseFloat(values.x2_1d);
      if (isNaN(x1) || isNaN(x2)) return [];
      const dist = Math.abs(x2 - x1);

      const diff = x2 - x1;
      let stepStr: string;
      if (diff >= 0) {
        stepStr = `d = |${fmt(x2)} − ${fmt(x1)}| = |${fmt(diff)}| = ${fmt(dist)}`;
      } else {
        stepStr = `d = |${fmt(x2)} − ${fmt(x1)}| = |${fmt(diff)}| = ${fmt(dist)}`;
      }

      return [
        {
          id: 'distance',
          label: `Distance (${mode.toUpperCase()})`,
          value: fmt(dist),
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'formula',
          label: 'Distance Formula',
          value: 'd = |x₂ − x₁|',
          color: 'neutral' as const,
        },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: stepStr,
          color: 'neutral' as const,
        },
      ];
    }

    if (mode === '2d') {
      const x1 = parseFloat(values.x1);
      const y1 = parseFloat(values.y1);
      const x2 = parseFloat(values.x2);
      const y2 = parseFloat(values.y2);
      if ([x1, y1, x2, y2].some(isNaN)) return [];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);

      return [
        {
          id: 'distance',
          label: 'Distance (2D)',
          value: fmt(dist),
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'formula',
          label: 'Distance Formula',
          value: `d = √((${fmt(x2)}−${fmt(x1)})² + (${fmt(y2)}−${fmt(y1)})²)`,
          color: 'neutral' as const,
        },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `d = √(${fmt(dx)}² + ${fmt(dy)}²) = √(${fmt(dx * dx)} + ${fmt(dy * dy)}) = √${fmt(dx * dx + dy * dy)} = ${fmt(dist)}`,
          color: 'neutral' as const,
        },
        {
          id: 'midpoint',
          label: 'Midpoint',
          value: `(${fmt((x1 + x2) / 2)}, ${fmt((y1 + y2) / 2)})`,
          color: 'neutral' as const,
        },
        {
          id: 'slope',
          label: 'Slope',
          value: dx !== 0 ? fmt(dy / dx) : 'Undefined (vertical)',
          color: 'neutral' as const,
        },
      ];
    }

    if (mode === '3d') {
      const x1 = parseFloat(values.x1);
      const y1 = parseFloat(values.y1);
      const z1 = parseFloat(values.z1);
      const x2 = parseFloat(values.x2);
      const y2 = parseFloat(values.y2);
      const z2 = parseFloat(values.z2);
      if ([x1, y1, z1, x2, y2, z2].some(isNaN)) return [];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const dz = z2 - z1;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      return [
        {
          id: 'distance',
          label: 'Distance (3D)',
          value: fmt(dist),
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'formula',
          label: 'Distance Formula',
          value: `d = √((${fmt(x2)}−${fmt(x1)})² + (${fmt(y2)}−${fmt(y1)})² + (${fmt(z2)}−${fmt(z1)})²)`,
          color: 'neutral' as const,
        },
        {
          id: 'steps',
          label: 'Calculation Steps',
          value: `d = √(${fmt(dx)}² + ${fmt(dy)}² + ${fmt(dz)}²) = √(${fmt(dx * dx)} + ${fmt(dy * dy)} + ${fmt(dz * dz)}) = √${fmt(dx * dx + dy * dy + dz * dz)} = ${fmt(dist)}`,
          color: 'neutral' as const,
        },
        {
          id: 'midpoint',
          label: 'Midpoint',
          value: `(${fmt((x1 + x2) / 2)}, ${fmt((y1 + y2) / 2)}, ${fmt((z1 + z2) / 2)})`,
          color: 'neutral' as const,
        },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DistancePanel, { values, results });
  },
  educational: {
    formula: '1D: d = |x₂−x₁| | 2D: d = √((x₂−x₁)²+(y₂−y₁)²) | 3D: d = √((x₂−x₁)²+(y₂−y₁)²+(z₂−z₁)²)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Distance Between Points</text><line x1="40" y1="310" x2="400" y2="310" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="410" y="314" font-size="12" fill="var(--svg-666666)">x</text><line x1="60" y1="310" x2="60" y2="30" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="66" y="28" font-size="12" fill="var(--svg-666666)">y</text><circle cx="100" cy="240" r="5" fill="var(--svg-ef4444)"/><text x="88" y="228" text-anchor="end" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">(x&#8321;, y&#8321;)</text><circle cx="300" cy="80" r="5" fill="var(--svg-ef4444)"/><text x="288" y="68" text-anchor="end" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">(x&#8322;, y&#8322;)</text><line x1="100" y1="240" x2="300" y2="80" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linecap="round"/><text x="210" y="160" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)" transform="rotate(-38,210,160)">d = &radic;((&Delta;x)&sup2;+(&Delta;y)&sup2;)</text><line x1="100" y1="240" x2="300" y2="240" stroke="var(--svg-22c55e)" stroke-width="2" stroke-dasharray="6,3"/><text x="200" y="258" text-anchor="middle" font-size="13" fill="var(--svg-22c55e)" font-weight="bold">&Delta;x = x&#8322; &minus; x&#8321;</text><line x1="300" y1="240" x2="300" y2="80" stroke="var(--svg-8b5cf6)" stroke-width="2" stroke-dasharray="6,3"/><text x="315" y="165" text-anchor="start" font-size="13" fill="var(--svg-8b5cf6)" font-weight="bold">&Delta;y = y&#8322; &minus; y&#8321;</text><text x="220" y="295" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">d = &radic;((x&#8322;&minus;x&#8321;)&sup2; + (y&#8322;&minus;y&#8321;)&sup2;)</text></svg>',
      alt: 'Coordinate plane with two labeled points connected by a dashed line showing the distance, with delta-x and delta-y legs of the right triangle',
      caption: 'The distance formula derives from the Pythagorean theorem',
    },
    formulaDescription:
      'The distance formula measures the straight-line Euclidean distance between two points in space. In 1D it is simply the absolute difference on a number line. In 2D it derives directly from the Pythagorean theorem: projecting the points onto the X and Y axes creates a right triangle, and the distance between the points is the hypotenuse. In 3D the same principle extends naturally by adding the Z-dimension difference as a third squared term under the square root.',
    variables: [
      { symbol: '(x₁, y₁)', name: 'Point 1', description: 'Coordinates of the first point in 2D or 3D space.' },
      { symbol: '(x₂, y₂)', name: 'Point 2', description: 'Coordinates of the second point in 2D or 3D space.' },
      { symbol: 'd', name: 'Distance', description: 'The straight-line Euclidean distance between the two points. Always a non-negative value.' },
      { symbol: 'Δx, Δy, Δz', name: 'Coordinate Differences', description: 'The signed differences between point coordinates. In 2D: Δx = x₂ − x₁ and Δy = y₂ − y₁. These form the legs of the right triangle used in the Pythagorean theorem.' },
    ],
    howToUse: [
      'Select the dimensionality: 1D (number line), 2D (plane), or 3D (space).',
      'Enter the coordinates for both points. In 1D mode, only the X coordinate is needed.',
      'View the distance result, the formula with your values substituted, step-by-step calculation, and the midpoint between the points.',
    ],
    explanation:
      'The distance formula is a direct application of the Pythagorean theorem. In 2D, the horizontal difference (Δx = x₂ − x₁) and vertical difference (Δy = y₂ − y₁) form the two legs of a right triangle, and the distance between the points is the hypotenuse. This extends to 3D by adding the Z-dimension difference inside the square root. Distance calculations are fundamental in geometry, navigation (GPS uses 3D trilateration), physics (calculating displacement), computer graphics (rendering and collision detection), and GIS systems (geographic distance between coordinates). The formula can be further extended to higher dimensions for applications in data science, where Euclidean distance in n-dimensional space is used for clustering algorithms like k-means and for similarity measurements in recommendation systems.',
    quickReference: [
      { label: '1D: |3 - 7|', value: '4 (absolute difference on number line)' },
      { label: '2D: (0,0) to (3,4)', value: '5 (classic 3-4-5 right triangle)' },
      { label: '3D: (0,0,0) to (1,2,2)', value: '3 (√(1²+2²+2²) = √9)' },
      { label: 'Midpoint 2D', value: '((x₁+x₂)/2, (y₁+y₂)/2)' },
      { label: 'Slope (2D mode)', value: '(y₂-y₁)/(x₂-x₁) | undefined if vertical' },
      { label: 'Distance from origin', value: 'Use (0,0) or (0,0,0) as point 1' },
      { label: 'Negative coordinates', value: 'Works with any real numbers' },
      { label: 'Exact integer result', value: 'When Δx²+Δy² is a perfect square' },
    ],
    commonUses: [
      'Geometry and algebra homework — finding the distance between two points on a coordinate plane, verifying triangle side lengths, and checking collinearity by comparing distances.',
      'Computer graphics and game development — calculating distances between game objects for collision detection, proximity checks ("is the player within 5 units of the treasure?"), and camera positioning in 3D scenes.',
      'GPS and navigation — computing straight-line (as-the-crow-flies) distance between two points given their coordinates, used in mapping applications and delivery route estimation.',
      'Physics and engineering — calculating displacement (the vector distance between start and end positions), measuring separation between charged particles, and structural analysis of truss members in bridges and buildings.',
      'Data science and machine learning — computing Euclidean distance between data points for K-nearest neighbors (KNN) classification, K-means clustering, and similarity scoring in recommendation engines.',
    ],
    workedExamples: [
      {
        scenario: 'Elena, a high school geometry student, is solving a problem: find the distance between the points (2, 3) and (8, 11) on a coordinate plane. She needs to show her work step by step for the assignment.',
        inputs: { mode: '2d', x1: '2', y1: '3', x2: '8', y2: '11' },
        result: '10',
        insight: 'Δx = 8 − 2 = 6, Δy = 11 − 3 = 8. The distance d = √(6² + 8²) = √(36 + 64) = √100 = 10. This is a 3-4-5 scaled triangle (scaled by factor 2), so the distance is exactly 10 units — a clean integer result. The midpoint is ((2+8)/2, (3+11)/2) = (5, 7), which is exactly halfway between the two points. The slope is 8/6 = 4/3 ≈ 1.333, indicating the line rises 4 units for every 3 units of horizontal movement. Elena can use the step-by-step output to verify her handwritten work.',
      },
      {
        scenario: 'Kai, an indie game developer, is working on a 3D space shooter. He needs to calculate the distance between the player\'s ship at coordinates (10, 5, -3) and an enemy vessel at (25, -2, 7) to determine if the enemy is within weapon range of 20 units.',
        inputs: { mode: '3d', x1: '10', y1: '5', z1: '-3', x2: '25', y2: '-2', z2: '7' },
        result: '19.33908',
        insight: 'Δx = 25 − 10 = 15, Δy = −2 − 5 = −7, Δz = 7 − (−3) = 10. Distance d = √(15² + 7² + 10²) = √(225 + 49 + 100) = √374 ≈ 19.34 units. The enemy is approximately 19.34 units away — within the 20-unit weapon range, but barely! Kai can set the weapon activation threshold at d ≤ 20 and the enemy will be targetable. For optimization, Kai can avoid the expensive square root by comparing squared distances: 374 < 400 (20²), so the enemy IS in range. Game engines commonly use squared distance comparisons to avoid sqrt() calls in tight loops.',
      },
      {
        scenario: 'Dr. Nakamura, a climate scientist, is comparing temperature readings from two weather stations. Station Alpha recorded a high of 42.3°C and Station Beta recorded 38.7°C. She needs the 1D distance between these measurements to quantify the temperature difference.',
        inputs: { mode: '1d', x1_1d: '38.7', x2_1d: '42.3' },
        result: '3.6',
        insight: 'Using 1D mode: d = |42.3 − 38.7| = |3.6| = 3.6. The temperature difference between the two stations is 3.6°C. This might seem small, but in climate science, a persistent 3.6°C difference between nearby stations could indicate a significant microclimate effect such as an urban heat island, an elevation difference, or sensor calibration drift. Dr. Nakamura can use this 1D distance repeatedly to compare hundreds of station pairs, building a heat map of temperature gradients across the region. The 1D mode is also perfect for comparing financial data (price differences), altitude variations, or any single-axis measurements.',
      },
    ],
    proTips: [
      'For game development collision detection, compare squared distances (Δx² + Δy² + Δz²) against squared radius — this avoids the expensive square root operation and gives identical results for threshold checks.',
      'Use 1D mode for any single-axis comparison: temperature differences, price gaps between two products, time intervals, or altitude changes between two geographic points.',
      'The midpoint is the center of the line segment connecting two points — useful for finding the center of a rectangle from opposite corners, positioning UI elements between two anchors, or calculating the centroid of two data points.',
      'When the slope shows "undefined," it means the line is vertical (x₁ = x₂). This is a valid geometric case — the distance is simply |y₂ − y₁|, and you can verify this by using 1D mode along the Y axis.',
      'For the classic 3-4-5 triangle test (points (0,0) and (3,4)), expect distance = 5 exactly. If you get 4.999999 or 5.000001, this is normal floating-point rounding — the calculator formats to 6 significant figures for clean display.',
      'In 3D mode, the distance formula generalizes to any number of dimensions. For n-dimensional data (common in machine learning), just keep adding squared differences: d = √(Σ(Δxᵢ)²) for i = 1 to n.',
    ],
    limitations: [
      'This calculator computes Euclidean (straight-line) distance only. For geographic coordinates (latitude/longitude), use a great-circle distance calculator with the haversine formula instead — Euclidean distance on a flat plane does not account for Earth\'s curvature and becomes increasingly inaccurate over long distances.',
      'For path distance along roads or through obstacles, this calculator is not suitable — it assumes unobstructed straight-line travel. For Manhattan distance (grid-based movement where you can only travel along axes, like city blocks), the formula would be d = |Δx| + |Δy|, not Euclidean.',
      'For very large coordinate values (beyond 10¹⁵), floating-point precision may introduce rounding errors in intermediate calculations. The midpoint and slope outputs are only available in 2D and 3D modes, not 1D.',
      'When not to use this calculator: for surface distance on spheres or ellipsoids (use haversine), for distance along a path or through a network (use graph algorithms like Dijkstra\'s), or for relativistic distances in curved spacetime (use the metric tensor from general relativity).',
    ],
    faqs: [
      {
        question: 'How is the distance formula related to the Pythagorean theorem?',
        answer: 'The 2D distance formula is exactly the Pythagorean theorem: the difference in X (Δx) and difference in Y (Δy) form the legs of a right triangle. The distance between the points is the hypotenuse: d² = Δx² + Δy², so d = √(Δx² + Δy²). If you square the distance, you get the sum of the squared coordinate differences — this is the Pythagorean relationship in analytic geometry form.',
      },
      {
        question: 'Can I use this for 1D distance on a number line?',
        answer: 'Yes! 1D distance is simply the absolute difference between two numbers on a number line: d = |x₂ − x₁|. This is useful for finding the distance along a single axis, like temperature differences, time intervals, or positions on a line. The absolute value ensures distance is always non-negative, which matches our intuitive notion that distance cannot be negative.',
      },
      {
        question: 'What is the midpoint and how is it calculated?',
        answer: 'The midpoint is the point exactly halfway between the two input points. It is calculated by averaging each coordinate: ((x₁+x₂)/2, (y₁+y₂)/2) in 2D, with the same averaging applied to the Z coordinate in 3D. The midpoint is useful for finding center points of line segments, bisectors in geometry, and symmetry axes in design and graphics.',
      },
      {
        question: 'How is the distance formula extended to higher dimensions?',
        answer: 'The pattern is simple: for n-dimensional space, add the squared difference of each coordinate under the square root. In 4D: d = √((Δx)²+(Δy)²+(Δz)²+(Δw)²). This extension is used in data science for computing Euclidean distance between data points with many features, and in physics for spacetime intervals in special relativity (though with a sign difference for the time dimension).',
      },
      {
        question: 'What is the difference between Euclidean distance and Manhattan distance?',
        answer: 'Euclidean distance is the straight-line "as the crow flies" distance (the diagonal through space). Manhattan distance (also called L1 distance or taxicab distance) is the sum of the absolute differences along each axis: d = |Δx| + |Δy|. Manhattan distance represents the distance you would travel if you could only move along grid lines, like a taxicab navigating city blocks. In machine learning, Euclidean (L2) distance penalizes large differences more heavily due to squaring, while Manhattan (L1) distance treats all differences linearly.',
      },
      {
        question: 'Why might I get different results than expected from a GPS coordinate pair?',
        answer: 'GPS coordinates (latitude and longitude) are angular measurements on a sphere, not Cartesian coordinates on a flat plane. This calculator computes Euclidean distance on a flat plane, which works for small areas but becomes inaccurate over long distances due to Earth\'s curvature. For accurate geographic distance, use the haversine formula: d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat₁)cos(lat₂)sin²(Δlon/2))) where R is Earth\'s radius (approximately 6,371 km). The difference between Euclidean and great-circle distance becomes noticeable at about 100 km and significant beyond 500 km.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Distance', url: 'https://en.wikipedia.org/wiki/Distance' },
      { source: 'NIST - SI Units: Length', url: 'https://www.nist.gov/pml/owm/metric-si/length' },
      { source: 'Wikipedia - Euclidean Distance', url: 'https://en.wikipedia.org/wiki/Euclidean_distance' },
    ],
  },
};

export default distanceConfig;
