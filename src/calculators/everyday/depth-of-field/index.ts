import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import DepthOfFieldPanel from './DepthOfFieldPanel';
import { FT_PER_M, dofInfo } from './dofMath';

const depthOfFieldConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sensorSize',
      label: 'Sensor Size',
      type: 'select',
      helpText: 'Your camera sensor size affects depth of field',
      options: [
        { label: 'Full Frame (35mm)', value: 'Full Frame (35mm)' },
        { label: 'APS-C (1.5x)', value: 'APS-C (1.5x)' },
        { label: 'APS-C (1.6x)', value: 'APS-C (1.6x)' },
        { label: 'Micro 4/3', value: 'Micro 4/3' },
        { label: '1"', value: '1"' },
        { label: '1/1.7"', value: '1/1.7"' },
        { label: 'Medium Format', value: 'Medium Format' },
      ],
    },
    {
      id: 'focalLength',
      label: 'Focal Length (mm)',
      type: 'number',
      inputMode: 'decimal',
      placeholder: '50',
      min: 1,
      max: 2000,
      required: true,
      helpText: 'Lens focal length determines field of view and DOF',
    },
    {
      id: 'aperture',
      label: 'Aperture (f/)',
      type: 'number',
      inputMode: 'decimal',
      placeholder: '2.8',
      min: 0.95,
      max: 64,
      step: 0.1,
      required: true,
      helpText: 'Lower f-number = wider aperture = shallower DOF',
    },
    {
      id: 'subjectDistance',
      label: 'Subject Distance',
      type: 'number',
      inputMode: 'decimal',
      placeholder: '10',
      min: 0.01,
      max: 100000,
      required: true,
      helpText: 'Distance from camera to the subject',
    },
    {
      id: 'distanceUnit',
      label: 'Distance Unit',
      type: 'select',
      helpText: 'Choose feet or meters for subject distance',
      options: [
        { label: 'feet', value: 'feet' },
        { label: 'meters', value: 'meters' },
      ],
    },
  ],
  calculate: (values) => {
    const d = dofInfo(values);
    if (!d) return [];
    if (d.tooClose) {
      return [
        {
          id: 'tooClose',
          label: 'Subject Distance',
          value: 'Closer than the focal length',
          color: 'negative',
          warning: 'A lens cannot focus on a subject closer than its focal length. Enter a larger subject distance.',
        },
      ];
    }
    const feet = d.unit === 'feet';

    // Show distances in the unit the user chose; very long ones as miles / km.
    const fmtDist = (m: number): string => {
      if (feet) {
        const ft = m * FT_PER_M;
        return ft >= 5280 ? `${(ft / 5280).toFixed(2)} miles` : `${ft.toFixed(2)} ft`;
      }
      return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(2)} m`;
    };

    const infinite = d.far === null;
    const totalDOF = infinite
      ? 'Infinite (subject at or beyond hyperfocal distance)'
      : feet
        ? `${((d.dof as number) * FT_PER_M).toFixed(2)} ft`
        : `${(d.dof as number).toFixed(2)} m`;

    return [
      {
        id: 'hyperfocalDistance',
        label: 'Hyperfocal Distance',
        value: fmtDist(d.hyperfocal),
        highlight: true,
        color: 'neutral',
        interpretation: `Focus at ${fmtDist(d.hyperfocal)} and everything from about ${fmtDist(d.hyperfocal / 2)} to infinity is acceptably sharp.`,
      },
      { id: 'nearLimit', label: 'Near Focus Limit', value: fmtDist(d.near), color: 'neutral' },
      {
        id: 'farLimit',
        label: 'Far Focus Limit',
        value: infinite ? 'Infinite (at or beyond hyperfocal)' : fmtDist(d.far as number),
        color: 'neutral',
      },
      { id: 'totalDOF', label: 'Total Depth of Field', value: totalDOF, highlight: !infinite, color: infinite ? 'neutral' : 'positive' },
      { id: 'cropFactor', label: 'Crop Factor', value: `${d.crop}x`, color: 'neutral' },
      {
        id: 'cocValue',
        label: 'Circle of Confusion',
        value: `${d.coc.toFixed(3)} mm`,
        color: 'neutral',
        interpretation: 'Sensor diagonal / 1500 (8x10 print viewed at 25 cm). Pixel-peeping needs a smaller value.',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DepthOfFieldPanel, { values, results });
  },
  educational: {
    formula: 'H = f² ÷ (N × c) + f  |  Near = s(H − f) ÷ (H + s − 2f)  |  Far = s(H − f) ÷ (H − s) when s < H',
    formulaDescription:
      'Depth of field is calculated using the hyperfocal distance formula. The hyperfocal distance (H) is the closest distance at which a lens can be focused while keeping objects at infinity acceptably sharp. From H and the focus distance s, the near and far limits of acceptable sharpness follow (f = focal length, N = f-number, c = circle of confusion, all in the same unit). When s is at or beyond H the far limit is infinity. The circle of confusion is the sensor diagonal divided by 1500.',
    diagram: {
      svg: '<svg viewBox="0 0 460 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Depth of Field — Focus Zones</text><!-- Camera body --><rect x="10" y="35" width="40" height="35" rx="4" fill="var(--svg-475569)"/><rect x="50" y="40" width="30" height="25" rx="2" fill="var(--svg-64748b)"/><text x="20" y="85" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">Camera</text><circle cx="80" cy="52" r="4" fill="var(--svg-94a3b8)"/><line x1="84" y1="52" x2="440" y2="52" stroke="var(--svg-94a3b8)" stroke-width="1.5" stroke-dasharray="4,4"/><text x="440" y="50" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-94a3b8)" text-anchor="end">Optical axis</text><!-- Focus plane --><line x1="170" y1="25" x2="170" y2="80" stroke="var(--svg-22c55e)" stroke-width="2.5"/><text x="170" y="22" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-22c55e)" font-weight="600" text-anchor="middle">Focus</text><!-- In focus zone (shaded) --><rect x="130" y="42" width="120" height="20" rx="3" fill="var(--svg-22c55e)" opacity="0.15"/><text x="190" y="55" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-22c55e)" font-weight="600" text-anchor="middle">In Focus Zone</text><!-- Near limit --><line x1="130" y1="25" x2="130" y2="80" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="130" y="22" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-f59e0b)" text-anchor="middle">Near</text><!-- Far limit --><line x1="250" y1="25" x2="250" y2="80" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="250" y="22" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-f59e0b)" text-anchor="middle">Far</text><!-- DOF bracket --><line x1="110" y1="95" x2="110" y2="50" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="270" y1="95" x2="270" y2="50" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="110" y1="95" x2="270" y2="95" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="190" y="108" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-3b82f6)" font-weight="600" text-anchor="middle">Depth of Field = Far − Near</text><text x="190" y="120" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">H = f² ÷ (A × CoC) | Smaller aperture = deeper DOF</text></svg>',
      alt: 'Diagram showing a camera lens, optical axis, focus plane, near and far limits, and the depth of field zone between them',
      caption: 'DOF is the zone of acceptable sharpness between the near and far limits. Smaller apertures (higher f-numbers) increase DOF; longer focal lengths reduce it.',
    },
    variables: [
      {
        symbol: 'H',
        name: 'Hyperfocal Distance',
        description: 'The distance at which everything from half that distance to infinity appears acceptably sharp. Focusing at this distance maximizes depth of field for landscape photography.',
      },
      {
        symbol: 'f',
        name: 'Focal Length',
        description: 'The focal length of the lens in millimeters. Longer focal lengths produce shallower depth of field at the same aperture and subject distance.',
      },
      {
        symbol: 'A',
        name: 'Aperture (f-number)',
        description: 'The lens aperture setting. Smaller f-numbers (wider apertures like f/1.4) produce shallower depth of field. Larger f-numbers (narrower apertures like f/16) increase depth of field.',
      },
      {
        symbol: 'CoC',
        name: 'Circle of Confusion',
        description: 'The maximum allowable blur spot size that appears sharp to the human eye at a given viewing distance and print size. CoC varies by sensor size — larger sensors have larger CoC values.',
      },
      {
        symbol: 'D',
        name: 'Subject Distance',
        description: 'The distance from the camera sensor plane to the subject being focused on.',
      },
    ],
    commonUses: [
      'Planning a portrait shot by choosing the right aperture and distance for subject-background separation',
      'Determining the hyperfocal distance for landscape photography to maximize front-to-back sharpness',
      'Comparing depth of field across different sensor sizes (full-frame vs. APS-C vs. Micro 4/3) before buying gear',
      'Checking whether your entire group will be in focus at a given aperture and distance for event photography',
    ],
    howToUse: [
      'Select your camera\'s sensor size from the dropdown for accurate circle of confusion values.',
      'Enter your lens focal length (e.g., 50mm for a standard prime lens).',
      'Set the aperture (f-number) you plan to use. Wider apertures (lower f-numbers) give shallower DOF.',
      'Enter the distance to your subject and choose feet or meters.',
      'Review the near and far focus limits to see what range will appear sharp in your photo.',
    ],
    explanation:
      'Depth of field (DOF) is one of the most important creative tools in photography. It refers to the zone of acceptable sharpness in front of and behind the focus point. A shallow DOF isolates the subject from the background, ideal for portraits and macro photography. A deep DOF keeps everything sharp from foreground to infinity, essential for landscape photography. Four primary factors influence depth of field: aperture, focal length, subject distance, and sensor size. Wider apertures (smaller f-numbers like f/1.4) produce shallower DOF, while narrower apertures (larger f-numbers like f/16) increase DOF. Longer focal lengths compress perspective and reduce DOF, while shorter focal lengths increase it. Getting closer to your subject reduces DOF, and moving farther away increases it. Sensor size also plays a critical role: at the same framing and distance, a full-frame camera needs a longer focal length than a crop-sensor camera, which is why it gives shallower DOF at the same f-number (the larger sensor\'s larger circle of confusion alone would give deeper DOF at identical focal length and aperture). The hyperfocal distance is a key concept for landscape photographers: by focusing at the hyperfocal distance, you maximize DOF from half that distance all the way to infinity. This technique is widely used to ensure foreground-to-background sharpness in landscape images. Understanding these relationships allows photographers to pre-visualize their images and choose the right settings to achieve their creative vision without trial and error.',
    faqs: [
      {
        question: 'What is the circle of confusion and why does it matter?',
        answer: 'The circle of confusion (CoC) is the maximum diameter of a blurred point that appears sharp to the human eye under normal viewing conditions. It varies by sensor size because larger sensors require less magnification to produce a standard print; it is taken as the sensor diagonal divided by 1500. Full-frame cameras have a larger CoC (0.029mm) than Micro 4/3 cameras (0.015mm). At the same focal length, f-number and distance, a larger CoC gives deeper depth of field; full-frame still looks shallower in practice because you use a longer focal length (or stand closer) to get the same framing.',
      },
      {
        question: 'What happens when my subject is at or beyond the hyperfocal distance?',
        answer: 'When your subject is exactly at the hyperfocal distance, everything from half that distance to infinity is acceptably sharp. When the subject is beyond the hyperfocal distance, the far limit of focus extends to infinity (displayed as "Infinite" in our results). This is common in landscape photography when focusing on distant mountains or horizons.',
      },
      {
        question: 'Why does depth of field change with sensor size?',
        answer: 'Depth of field depends on the circle of confusion, which scales with sensor size. A full-frame sensor has a larger CoC than an APS-C sensor, because it needs less enlargement to reach the same print size. For the same framing and subject distance, though, the full-frame camera uses a longer focal length, and that more than cancels the larger CoC: DOF is roughly one stop shallower than APS-C 1.5x at the same f-number (equivalent aperture = f-number x crop factor). That is why full-frame is popular for portraits.',
      },
      {
        question: 'How do I get maximum depth of field in my landscape photos?',
        answer: 'To maximize depth of field: use a narrow aperture like f/11 to f/16, focus at the hyperfocal distance (displayed in our results), use a wide-angle lens (shorter focal length), and stand farther from your nearest foreground element. Be aware that very narrow apertures (f/22+) can actually reduce sharpness due to diffraction, so f/11 to f/16 is typically the sweet spot for landscape photography.',
      },
      {
        question: 'What is the relationship between aperture, shutter speed, and ISO when adjusting depth of field?',
        answer: 'When you change aperture for creative DOF control, you must compensate with shutter speed or ISO to maintain proper exposure. Narrowing the aperture from f/2.8 to f/8 (for deeper DOF) reduces light by 3 stops, requiring either a slower shutter speed (increasing risk of camera shake or motion blur) or a higher ISO (increasing noise). Conversely, opening up from f/8 to f/2.8 (for shallower DOF) gains 3 stops of light, allowing faster shutter speeds or lower ISO. This is why fast lenses (f/1.4, f/1.8) are valued for low-light photography — they allow shallow DOF while maintaining manageable shutter speeds. In bright sunlight, neutral density (ND) filters are often needed when shooting wide open at f/1.4 because even the fastest shutter speed may not prevent overexposure.',
      },
    ],
    quickReference: [
      { label: 'Portrait (f/1.4–f/2.8)', value: 'Shallow DOF — subject sharp, background blur' },
      { label: 'Street/Event (f/4–f/5.6)', value: 'Moderate DOF — subject + some context in focus' },
      { label: 'Landscape (f/8–f/16)', value: 'Deep DOF — near to far in acceptable focus' },
      { label: 'Full Frame CoC', value: '0.029 mm' },
      { label: 'APS-C CoC', value: '0.019 mm' },
      { label: 'Micro 4/3 CoC', value: '0.015 mm' },
    ],
    proTips: [
      'For portraits, position your subject at least 3-5x the focal length from the background. A 50mm lens at f/2.8 with the subject at 10 feet and the background at 30+ feet will produce beautifully smooth bokeh.',
      'Use the hyperfocal distance technique for landscape focusing: instead of focusing at infinity, focus at the hyperfocal distance to get everything from half that distance to infinity in acceptable sharpness. Our calculator gives you the exact hyperfocal distance for your setup.',
      'Diffraction softening becomes visible at roughly f/11 and narrower on full-frame (earlier on smaller sensors and high-megapixel bodies), so avoid going narrower than you need to unless the extra depth of field matters more than critical sharpness.',
      'When shooting groups, use the depth of field calculator to verify that everyone from the front row to the back row falls within the near and far limits. For a group at 15 feet with a 35mm lens at f/5.6 on full frame, everything from 9.4 to 37.6 feet is acceptably sharp (about 28 feet), which is plenty for several rows.',
      'Remember that at moderate distances DOF is roughly 1/3 in front of the focus point and 2/3 behind it (the split approaches 1:1 as you get close, and the far side becomes infinite at the hyperfocal distance). If you need maximum sharpness on a subject, focus about 1/3 of the way into the zone you want sharp rather than on the closest or farthest point.',
    ],
    limitations: [
      'The depth of field calculations assume standard viewing conditions: an 8x10 inch print viewed from 25 cm (about 10 inches) by a person with normal visual acuity, which gives a circle of confusion of sensor diagonal / 1500. Larger sizes, closer distances, or high-resolution screens at 100% zoom will produce a narrower perceived DOF.',
      'The circle of confusion values used are industry-standard for print viewing and may not reflect the stricter sharpness requirements of high-megapixel digital sensors (45+ MP) where pixel-level sharpness demands a smaller CoC.',
      'This calculator uses a simplified thin-lens model that does not account for lens-specific factors like field curvature, focus breathing, or asymmetrical pupil magnification of telephoto and retrofocus designs.',
      'Macro photography at magnifications above 1:4 (0.25x) requires a different DOF formula — this calculator is not suitable for macro work.',
      'The calculator assumes unit focusing (moving the entire optical assembly), which is typical for prime lenses; some zoom lenses use internal focusing that changes the effective focal length at close distances.',
    ],
    workedExamples: [
      {
        scenario: 'Planning a Portrait Session with an 85mm Lens',
        inputs: {
          sensorSize: 'Full Frame (35mm)',
          focalLength: '85',
          aperture: '2.8',
          subjectDistance: '10',
          distanceUnit: 'feet',
        },
        result: 'Hyperfocal: 292.21 ft | Near: 9.68 ft | Far: 10.34 ft | Total DOF: 0.67 ft (8 inches).',
        insight:
          'With an 85mm f/2.8 on full frame at 10 feet, the hyperfocal distance is about 292 feet — far beyond your subject. The near focus limit is approximately 9.7 feet and the far limit about 10.3 feet, giving a total DOF of only ~0.67 feet (about 8 inches). This very shallow DOF means only your subject\'s face will be in focus if you focus on the eyes — the ears and hair may already be slightly soft. This is ideal for portrait isolation. If you want the entire head in sharp focus, consider stopping down to f/5.6, which doubles the DOF to about 1.3 feet; f/8 gives about 1.9 feet.',
      },
      {
        scenario: 'Landscape Photography — Maximizing Front-to-Back Sharpness',
        inputs: {
          sensorSize: 'Full Frame (35mm)',
          focalLength: '24',
          aperture: '11',
          subjectDistance: '15',
          distanceUnit: 'feet',
        },
        result: 'Hyperfocal: 6.00 ft | Near: 4.26 ft | Far: Infinite | Total DOF: Infinite.',
        insight:
          'With a 24mm lens at f/11 on full frame, the hyperfocal distance is about 6.0 feet. Since your subject distance of 15 feet is beyond the hyperfocal distance, the far focus limit extends to infinity — everything from about 4.3 feet (near limit) to infinity will be acceptably sharp. This is excellent for landscape photography where you have foreground elements (flowers at 5-6 feet) and distant mountains. If you instead focused at exactly the hyperfocal distance (6.0 feet), the near limit would extend to about 3.0 feet, giving you even more foreground sharpness while keeping infinity in focus. At f/11, diffraction is minimal on full frame so sharpness will be excellent throughout.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Depth of Field', url: 'https://en.wikipedia.org/wiki/Depth_of_field' },

    ],
  },
};

export default depthOfFieldConfig;
