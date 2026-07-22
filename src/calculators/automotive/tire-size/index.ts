import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import TireSizePanel from './TireSizePanel';

const tireSizeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'origWidth',
      label: 'Original Tire Width',
      type: 'number',
      placeholder: '225',
      unit: 'mm',
      min: 100,
      max: 400,
      step: 5,
      inputMode: 'decimal',
      required: true,
      helpText: 'The first number in a tire size (e.g., 225/50R17). Section width in millimeters from sidewall to sidewall.',
    },
    {
      id: 'origAspect',
      label: 'Original Aspect Ratio',
      type: 'number',
      placeholder: '50',
      unit: '%',
      min: 20,
      max: 100,
      step: 5,
      inputMode: 'decimal',
      required: true,
      helpText: 'The second number — sidewall height as a percentage of the section width (e.g., 50 means sidewall height = 50% of 225mm = 112.5mm).',
    },
    {
      id: 'origRim',
      label: 'Original Rim Diameter',
      type: 'number',
      placeholder: '17',
      unit: 'inches',
      min: 10,
      max: 30,
      step: 1,
      inputMode: 'decimal',
      required: true,
      helpText: 'Diameter of your current wheel rim in inches. This is the R-number (e.g., the 17 in 225/50R17).',
    },
    {
      id: 'newWidth',
      label: 'New Tire Width',
      type: 'number',
      placeholder: '235',
      unit: 'mm',
      min: 100,
      max: 400,
      step: 5,
      inputMode: 'decimal',
      required: true,
      helpText: 'Section width of the new tire in millimeters. Wider tires improve cornering grip but may reduce fuel economy and clearance.',
    },
    {
      id: 'newAspect',
      label: 'New Aspect Ratio',
      type: 'number',
      placeholder: '45',
      unit: '%',
      min: 20,
      max: 100,
      step: 5,
      inputMode: 'decimal',
      required: true,
      helpText: 'Sidewall height as a percentage of the new tire width. Lower aspect ratio (e.g., 35-45) = shorter sidewall, better cornering, harsher ride.',
    },
    {
      id: 'newRim',
      label: 'New Rim Diameter',
      type: 'number',
      placeholder: '18',
      unit: 'inches',
      min: 10,
      max: 30,
      step: 1,
      inputMode: 'decimal',
      required: true,
      helpText: 'Diameter of your new wheel rim in inches. Must match the tire\'s rim diameter code (e.g., a 235/45R18 tire fits an 18-inch rim).',
    },
  ],
  calculate: (values) => {
    const ow = parseFloat(values.origWidth);
    const oa = parseFloat(values.origAspect) / 100;
    const or_ = parseFloat(values.origRim);
    const nw = parseFloat(values.newWidth);
    const na = parseFloat(values.newAspect) / 100;
    const nr = parseFloat(values.newRim);

    if ([ow, oa, or_, nw, na, nr].some(isNaN)) return [];

    const origSidewall = ow * oa;
    const newSidewall = nw * na;
    const origDiamMm = or_ * 25.4 + 2 * origSidewall;
    const newDiamMm = nr * 25.4 + 2 * newSidewall;
    const origCircumMm = Math.PI * origDiamMm;
    const newCircumMm = Math.PI * newDiamMm;

    const diamDiffPct = ((newDiamMm - origDiamMm) / origDiamMm) * 100;
    const circumDiffPct = ((newCircumMm - origCircumMm) / origCircumMm) * 100;
    const speedError = circumDiffPct;

    const fmt = (n: number) => parseFloat(n.toFixed(2)).toString();

    return [
      {
        id: 'diamDiff',
        label: 'Overall Diameter Difference',
        value: `${fmt(diamDiffPct)}%`,
        highlight: true,
        color: Math.abs(diamDiffPct) <= 3 ? 'positive' : Math.abs(diamDiffPct) <= 5 ? 'neutral' : 'negative',
      },
      {
        id: 'speedError',
        label: 'Speedometer Error',
        value: `${speedError > 0 ? '+' : ''}${fmt(speedError)}% (reads ${speedError > 0 ? 'lower' : 'higher'} than actual)`,
        color: Math.abs(speedError) <= 3 ? 'positive' : 'negative',
      },
      {
        id: 'origDiam',
        label: 'Original Tire Diameter',
        value: `${fmt(origDiamMm / 25.4)}" (${fmt(origDiamMm)} mm)`,
        color: 'neutral',
      },
      {
        id: 'newDiam',
        label: 'New Tire Diameter',
        value: `${fmt(newDiamMm / 25.4)}" (${fmt(newDiamMm)} mm)`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TireSizePanel, { values, results });
  },
  educational: {
    formula: 'Overall Diameter = Rim Diameter + 2 × (Width × Aspect Ratio / 100)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><circle cx="220" cy="170" r="100" fill="var(--svg-1e293b)" stroke="var(--svg-333333)" stroke-width="3"/><circle cx="220" cy="170" r="35" fill="var(--svg-cbd5e1)" stroke="var(--svg-94a3b8)" stroke-width="2"/><circle cx="220" cy="170" r="12" fill="var(--svg-64748b)"/><line x1="220" y1="70" x2="220" y2="30" stroke="var(--svg-ef4444)" stroke-width="2"/><polygon points="220,30 215,40 225,40" fill="var(--svg-ef4444)"/><text x="255" y="34" font-size="11" fill="var(--svg-ef4444)">Diameter</text><line x1="120" y1="170" x2="80" y2="170" stroke="var(--svg-3b82f6)" stroke-width="2"/><polygon points="80,170 90,165 90,175" fill="var(--svg-3b82f6)"/><text x="55" y="174" font-size="11" fill="var(--svg-3b82f6)">Width</text><line x1="220" y1="170" x2="255" y2="120" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="265" y="135" font-size="11" fill="var(--svg-22c55e)">Sidewall</text></svg>',
      alt: 'Tire cross-section with diameter, width, and sidewall height labeled',
      caption: 'Tire dimensions — overall diameter equals rim diameter plus twice the sidewall height',
    },
    formulaDescription:
      'Tire overall diameter is calculated by adding twice the sidewall height to the rim diameter. The speedometer reads based on the original tire circumference, so any change in diameter introduces a speedometer error.',
    variables: [
      { symbol: 'Sidewall Height', name: 'Sidewall Height (mm)', description: 'Width × Aspect Ratio / 100. The height of the tire above the rim. A 225/50 tire has a sidewall height of 225 × 0.50 = 112.5 mm.' },
      { symbol: 'Diameter', name: 'Overall Tire Diameter', description: 'Total height of the tire from top to bottom. Rim diameter (inches × 25.4) plus twice the sidewall height.' },
      { symbol: 'Speedo Error', name: 'Speedometer Error', description: 'The percentage difference between indicated speed and actual speed caused by the tire diameter change. Positive = speedometer reads lower than actual.' },
    ],
    howToUse: [
      'Enter your original tire size (the three numbers from your tire\'s sidewall, e.g., 225/50R17).',
      'Enter the new tire size you are considering.',
      'The calculator shows diameter difference and speedometer error.',
      'A diameter difference within ±3% is generally acceptable for street use.',
      'If the difference exceeds 3%, consider a different tire size to maintain safety and accuracy.',
    ],
    explanation:
      'When you change tire sizes, the overall diameter changes — which means the number of revolutions per mile changes. Your speedometer is calibrated to your original tire diameter, so a larger tire makes the speedometer read lower than your actual speed. A difference of ±3% is generally within acceptable limits and may not require speedometer recalibration. Larger differences can also affect ABS, traction control, and odometer accuracy. Real-world example: upgrading from 225/50R17 to 235/45R18 (a common plus-one size). Original diameter = 17 × 25.4 + 2 × (225 × 0.50) = 656.8 mm. New diameter = 18 × 25.4 + 2 × (235 × 0.45) = 668.7 mm. Difference = 1.8% — within the safe 3% range. However, changing to 245/40R19 (plus-two) gives a diameter of 678.6 mm, a 3.3% difference — potentially large enough to trigger ABS and traction control issues on some vehicles. For off-road vehicles, increasing tire diameter is common for ground clearance, but the speedometer error can be significant: going from 31-inch to 33-inch tires (6.5% increase) means at an indicated 60 mph you are actually traveling at 64 mph, which could attract speeding tickets on highways.',
    commonUses: [
      'Checking if a new tire size will fit your vehicle without rubbing fenders or suspension components',
      'Determining speedometer error when upgrading to larger or smaller tires for off-road or aesthetic purposes',
      'Comparing plus-size tire and wheel combinations to maintain safe handling, ABS function, and traction control accuracy',
    ],
    faqs: [
      {
        question: 'Will changing tire sizes affect my speedometer?',
        answer: 'Yes. A larger tire travels farther per revolution, so your speedometer (which counts wheel revolutions) will read lower than your actual speed. A 3% diameter increase means your actual speed is 3% higher than indicated. For example, at an indicated 60 mph, you would actually be traveling at 61.8 mph. Some modern vehicles can recalibrate the speedometer via the OBD-II port or dealership software — but most cannot. In many jurisdictions, a speedometer inaccuracy of more than ±5% is a legal violation during vehicle inspections.',
      },
      {
        question: 'What is "plus sizing"?',
        answer: 'Plus sizing is increasing wheel diameter while using shorter sidewall tires to maintain the same overall diameter. A "plus one" means going from, e.g., 17-inch to 18-inch wheels, with a lower-profile tire to keep the total height similar. Plus two goes to 19-inch, and so on. This improves handling and steering response due to a shorter, stiffer sidewall, at the cost of ride comfort and increased vulnerability to pothole damage. For example, 225/50R17 (diameter ~25.9") upgrades to 235/45R18 (~26.3", +1.8% difference — safe). But going plus-two to 245/40R19 (~26.7", +3.3% difference) may exceed the 3% safe threshold on some vehicles.',
      },
      {
        question: 'What happens if the diameter difference is too large?',
        answer: 'Beyond ±3%, you risk: speedometer inaccuracy exceeding legal limits (±5% in many jurisdictions), ABS and traction control system malfunctions (these systems compare individual wheel speeds and may trigger false activation or system shutdown), physical clearance issues (tire rubbing on fenders, fender liners, brake calipers, or suspension components at full steering lock or over bumps), increased stress on wheel bearings, ball joints, and drivetrain components, and altered gear ratios that can affect fuel economy and acceleration. An excessively large diameter tire also changes the scrub radius and steering geometry, which can cause torque steer on FWD vehicles and unpredictable handling in emergency maneuvers. In some states and countries, tire sizes beyond 3% from OEM specifications can cause mandatory vehicle inspection failures.',
      },
      {
        question: 'What do the three numbers in a tire size mean (e.g., 225/50R17)?',
        answer: '225 is the section width in millimeters — the width of the tire from sidewall to sidewall (not tread width). 50 is the aspect ratio — the sidewall height expressed as a percentage of the section width. A 50 aspect ratio means the sidewall height is 50% of 225mm = 112.5mm. Lower aspect ratios (35, 40, 45) mean shorter, stiffer sidewalls for sportier handling; higher ratios (60, 65, 70) mean taller, more compliant sidewalls for comfort and off-road use. R stands for Radial construction (belted plies run radially at 90 degrees to the direction of travel) — virtually all modern passenger tires are radial. 17 is the rim diameter in inches that the tire mounts onto. The R designation is followed by the rim diameter, and these must match exactly — you cannot mount a 17-inch tire on an 18-inch rim or vice versa.',
      },
      {
        question: 'Can I put wider tires on my stock rims?',
        answer: 'Yes, within limits. Each rim width has an approved tire width range specified by the Tire and Rim Association. For example, a 7-inch wide rim typically accepts tires from 195mm to 225mm section width. A 7.5-inch rim accepts 205mm to 235mm. Going too wide on a narrow rim causes the tread to bulge (called "pinching"), reducing contact patch area and causing uneven center wear. Going too narrow on a wide rim stretches the sidewall (called "stretching"), which is dangerous and reduces load capacity. Always check the tire manufacturer\'s specification sheet for the approved rim width range for any tire you are considering. As a rough rule, the rim width should be approximately 70-75% of the tire section width (in inches). So a 225mm tire (8.86 inches) pairs best with a rim width of roughly 6.5 to 8 inches.',
      },
      {
        question: 'Will changing tire sizes void my vehicle warranty?',
        answer: 'Generally no — the Magnuson-Moss Warranty Act in the US prevents manufacturers from voiding your entire warranty due to aftermarket parts, including non-OEM tire sizes. However, if a warranty claim is directly attributable to the tire size change (e.g., a wheel bearing fails prematurely due to the extra load from oversized tires, or a fender liner is damaged by rubbing), the manufacturer can deny that specific claim. Dealerships may also flag modified tire sizes during warranty inspections. For leased vehicles, the lease agreement typically requires returning the vehicle with OEM-specification tires. Always keep your original wheels and tires for lease return or warranty service visits. Some manufacturers (particularly German brands like BMW, Audi, and Mercedes) are more strict about documenting tire modifications.',
      },
      {
        question: 'How does changing tire size affect fuel economy?',
        answer: 'Larger, wider, and heavier tires typically reduce fuel economy through three mechanisms: (1) increased rolling resistance from a wider contact patch, (2) increased rotational inertia from more mass farther from the center of rotation (heavier tires at a larger diameter), and (3) increased aerodynamic drag from wider tires protruding into the airflow. Going from a 17-inch to a 19-inch wheel-tire package can add 5-10 lbs per corner (20-40 lbs total), which is rotating unsprung mass — approximately 3-4x more detrimental to acceleration and fuel economy than sprung weight. A typical upgrade from 225/50R17 to 245/40R19 might reduce fuel economy by 1-3 MPG on the highway. Conversely, downsizing to narrower tires (e.g., for winter use) can improve fuel economy slightly due to reduced rolling resistance, though the effect is modest compared to driving habits. For EVs, tire choice has an even larger impact on range — Tesla reports up to 10% range difference between the most efficient and least efficient tire options.',
      },
      {
        question: 'What tire size change is safest for my vehicle?',
        answer: 'The safest practice is to stay within ±3% of the original overall diameter. This is the industry-standard threshold accepted by most tire shops and vehicle manufacturers. Within this range, speedometer error is minimal (under 2 mph at highway speeds), ABS and traction control function normally, and the spare tire (which is the original size) remains compatible. If you are only changing tire width and not rim diameter, you can use a simple rule: for every 10mm increase in width, drop the aspect ratio by 5 to maintain similar diameter. For example, 225/50R17 → 235/45R17 (width +10mm, aspect ratio -5) yields nearly identical diameter. For vehicles with staggered setups (wider rear tires on RWD sports cars), maintain the same overall diameter front and rear. For AWD/4WD vehicles, all four tires must be within 1% of each other in diameter, or the center differential and transfer case will bind and can be destroyed — this is critical on Subaru, Audi Quattro, BMW xDrive, Mercedes 4MATIC, and similar full-time AWD systems.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Plus-One Upgrade: 2018 Honda Civic Si from 235/40R18 to 245/35R19',
        inputs: { origWidth: '235', origAspect: '40', origRim: '18', newWidth: '245', newAspect: '35', newRim: '19' },
        result: 'Original diameter: 235 × 0.40 = 94mm sidewall. 18" × 25.4 + 2 × 94 = 645.2mm (25.4"). New diameter: 245 × 0.35 = 85.75mm sidewall. 19" × 25.4 + 2 × 85.75 = 654.1mm (25.8"). Difference = +1.38% — safely within the 3% threshold. Speedometer at 60 mph reads approximately 60.8 mph actual.',
        insight: 'This is a textbook plus-one upgrade. The diameter stays nearly identical because the aspect ratio drops from 40 to 35 to compensate for the larger rim. The 10mm wider tire provides more cornering grip, and the 1-inch larger rim with 35-series sidewall gives sharper steering response. Ride quality will be noticeably firmer — the sidewall drops from 94mm to 85.75mm, a 9% reduction in sidewall height. Real-world fuel economy impact is typically -0.5 to -1 MPG. Before purchasing, verify that the 19-inch wheel\'s offset keeps the tire within the fender well at full steering lock.',
      },
      {
        scenario: 'Off-Road Tire Upgrade: Jeep Wrangler from 245/75R17 to 285/70R17 (33-Inch Tires)',
        inputs: { origWidth: '245', origAspect: '75', origRim: '17', newWidth: '285', newAspect: '70', newRim: '17' },
        result: 'Original diameter: 245 × 0.75 = 183.75mm sidewall. 17" × 25.4 + 2 × 183.75 = 431.8 + 367.5 = 799.3mm (31.5"). New diameter: 285 × 0.70 = 199.5mm sidewall. 17" × 25.4 + 2 × 199.5 = 431.8 + 399 = 830.8mm (32.7"). Difference = +3.94% — exceeds the 3% safe threshold for street driving.',
        insight: 'This is a common off-road upgrade ("going to 33s") that adds 1.2 inches of ground clearance. The 3.94% diameter increase means at an indicated 60 mph, actual speed is 62.4 mph. On a lifted Wrangler, this is generally acceptable because: (a) clearance is addressed by the lift kit, (b) the speedometer can be recalibrated with a programmer like the AEV ProCal or JScan app via OBD-II, and (c) off-road vehicles typically see lower speeds where the speedometer error is less dangerous. However, the 40mm wider tire (245 to 285) adds significant unsprung rotating mass — each 285/70R17 mud-terrain tire weighs 15-20 lbs more than the stock 245/75R17. This will reduce fuel economy by 2-4 MPG and increase braking distances. A re-gear (changing differential ring and pinion ratios from 3.21 to 4.10 or similar) is recommended to restore drivability.',
      },
      {
        scenario: 'Winter Tire Downsizing: BMW 3 Series from 225/45R18 to 205/55R17',
        inputs: { origWidth: '225', origAspect: '45', origRim: '18', newWidth: '205', newAspect: '55', newRim: '17' },
        result: 'Original diameter: 225 × 0.45 = 101.25mm sidewall. 18" × 25.4 + 2 × 101.25 = 457.2 + 202.5 = 659.7mm (26.0"). New diameter: 205 × 0.55 = 112.75mm sidewall. 17" × 25.4 + 2 × 112.75 = 431.8 + 225.5 = 657.3mm (25.9"). Difference = -0.36% — nearly identical diameter, well within the 3% threshold.',
        insight: 'Winter tire downsizing is standard practice in snow-belt regions. The narrower 205mm tire (20mm narrower than stock) cuts through snow more effectively by concentrating vehicle weight on a smaller contact patch — like a pizza cutter through snow. The smaller 17-inch rim allows a taller 55-series sidewall, providing better impact protection against potholes hidden under snow and a more compliant ride in cold temperatures when suspension bushings stiffen. The reduced unsprung weight improves acceleration and braking on slippery surfaces. The steel 17-inch winter rims cost approximately $60-80 each vs $300+ for 18-inch alloy wheels, and if a rim gets damaged by a curb hidden under snow, replacement is far cheaper. Always use dedicated winter tires (three-peak mountain snowflake symbol), not all-seasons marketed as "all-weather." The 0.36% diameter difference is negligible — your speedometer reads 60 mph when you are actually traveling at 59.8 mph.',
      },
    ],
    proTips: [
      'Stay within ±3% of your original overall diameter for street vehicles. This is the industry standard that ensures speedometer accuracy, ABS/TCS compatibility, and physical clearance. Most tire shops will refuse to mount a tire that deviates more than 3% from the OEM specification unless you sign a liability waiver. If you must exceed 3% (off-road vehicles, show cars), budget for a speedometer recalibration tool ($100-$300) and verify clearance at full steering lock and full suspension compression before driving.',
      'Always check your tire manufacturer\'s specifications for the approved rim width range. Mounting a tire on a rim that is too narrow or too wide voids the tire warranty and can cause catastrophic bead failure during cornering. The rim width range is published on every tire manufacturer\'s website. For example, a 245/40R18 tire typically requires a rim width between 8.0 and 9.5 inches. Never trust a tire shop that says "it\'ll stretch" or "it\'ll fit" without checking the spec sheet yourself.',
      'When comparing tire sizes, use this calculator to get the speedometer error percentage, then multiply your typical highway speed by that percentage. A 2% error at 70 mph means you are actually doing 71.4 mph — within tolerance. A 5% error means 73.5 mph — you may get a speeding ticket at "indicated 70." Program this into your mental speed buffer. Many modern GPS apps (Waze, Google Maps) show GPS-calibrated speed, which is accurate regardless of tire size.',
      'For AWD and 4WD vehicles (Subaru, Audi Quattro, BMW xDrive, Mercedes 4MATIC, etc.), all four tires must be within 1% of each other in overall diameter. If one tire is significantly different (e.g., replacing only two tires on an AWD vehicle), the drivetrain will bind because the different-sized tires rotate at different speeds, and the center differential or transfer case will try to compensate continuously — which can destroy it within a few hundred miles. Some vehicles have a tighter tolerance — Subaru specifies within 1/4-inch circumference (approximately 0.25% diameter difference). When replacing tires on an AWD vehicle, always replace all four, or have the new tires shaved to match the existing tire diameter by a specialty tire shop (Tire Rack offers this service).',
      'Plus sizing more than +2 (going up 3 or more inches in rim diameter) is rarely worth the trade-offs on a street car. Beyond +2, the sidewall becomes extremely short (30 or 25 series), which means: (a) pothole impacts transmit directly to the rim — bent rims are common and expensive ($300-$800 each), (b) ride quality degrades significantly because there is insufficient sidewall to absorb road imperfections, and (c) tire cost increases sharply — a 255/25R20 tire can cost $250-$400 each vs $150-$200 for a 225/50R17. The marginal improvement in steering response from +2 to +3 is imperceptible on the street and only meaningful on a racetrack with smooth asphalt.',
      'Larger diameter tires effectively raise your final drive ratio (numerically lower), which can hurt acceleration. A 3% larger diameter tire makes your 3.73 axle ratio perform like a 3.62 — you will notice slower acceleration from a stop and more downshifting on hills. This is especially noticeable on vehicles with small engines (under 2.5L) or vehicles already geared tall for highway fuel economy. If you are upsizing tires on a truck or SUV for off-road use, budget for a re-gear (approximately $1,500-$2,500 per axle) to restore performance.',
      'Do not forget your spare tire. If you upgrade from a 26-inch diameter tire to a 28-inch tire, your original spare (assuming full-size) is now 7% smaller in diameter. Driving on a mismatched spare — even on a 2WD vehicle — for more than a few miles can damage the differential because the two driven wheels rotate at different speeds continuously. For AWD vehicles, a mismatched spare can destroy the center differential. If your new tire package has a significantly different diameter, either: (a) buy a matching spare in the new size, (b) carry a tire plug kit and portable compressor instead of relying on the spare (acceptable for on-road use only), or (c) accept that the spare is for emergency low-speed use only (under 50 mph, under 50 miles per most owner\'s manuals).',
    ],
    limitations: [
      'This calculator calculates overall tire diameter and speedometer error from the published tire size specifications. It does NOT account for real-world manufacturing tolerances. Tires of the same nominal size from different manufacturers can vary in actual diameter by 0.5-1.5% due to differences in tread depth (new tire tread is 10/32" to 15/32" deep) and casing construction. When comparing tires across brands, the actual measured diameter may differ from the calculated value by up to 0.4 inches on a typical passenger tire.',
      'The speedometer error calculation assumes the speedometer was perfectly calibrated for the original tire diameter. In reality, most factory speedometers read 1-3% high deliberately (showing a slightly higher speed than actual) to ensure the manufacturer never under-reports speed, which would create legal liability. This means your "new" speedometer reading may actually be more accurate than your original one in some cases. Always verify with a GPS speed reading rather than trusting the calculation absolutely.',
      'Wheel offset and width are NOT accounted for in this calculator. Even if the tire diameter fits, the wheel\'s offset determines where the tire sits in the wheel well. A wheel with insufficient offset (too far inboard) may cause the tire to rub on the inner fender liner, suspension components, or brake lines at full steering lock. A wheel with too much offset (too far outboard, "poke" stance) may cause the tire to contact the outer fender lip during suspension compression. Wheel offset is measured in millimeters (e.g., ET45 means the mounting surface is 45mm outboard of the wheel centerline) and is just as critical as tire diameter for fitment.',
      'Load rating changes are not checked. When you change tire sizes, the load index (the number after the size, e.g., "225/50R17 94V" where 94 = 1,477 lbs per tire) may change. Your new tires must meet or exceed the vehicle manufacturer\'s minimum load rating, which is listed on the tire placard in your driver\'s door jamb. Installing tires with a lower load index than specified is both illegal (DOT violation) and dangerous — it can cause tire failure under load, especially when fully loaded with passengers and cargo. For trucks and SUVs that tow, the load rating is even more critical.',
      'This calculator does not consider local vehicle regulations. In some US states (e.g., Pennsylvania, Virginia) and many countries (Germany, Australia, Japan), tire sizes that deviate more than a specified percentage from OEM require an engineering certification, speedometer recalibration, and notation on the vehicle registration. In Germany, any tire not listed on the vehicle\'s "Certificate of Conformity" requires TUV approval. In Australia, tires more than 7% larger in diameter than the largest tire listed on the placard are illegal without engineering certification. Always check your local regulations before purchasing non-standard tire sizes.',
    ],
    quickReference: [
      { label: 'Diameter diff threshold (safe)', value: '±3%' },
      { label: 'Diameter diff threshold (caution)', value: '3-5%' },
      { label: 'Diameter diff threshold (unsafe)', value: '>5%' },
      { label: 'Common aspect ratio (comfort)', value: '60-75 series' },
      { label: 'Common aspect ratio (standard)', value: '50-55 series' },
      { label: 'Common aspect ratio (sport)', value: '35-45 series' },
      { label: 'Common aspect ratio (ultra-low)', value: '25-30 series' },
      { label: '1 inch = mm', value: '25.4 mm' },
      { label: 'Typical passenger tire diameter', value: '24 to 29 inches' },
      { label: 'Typical truck/SUV tire diameter', value: '29 to 35 inches' },
      { label: 'Speedo reads low (larger diam)', value: 'Actual speed > indicated' },
      { label: 'Speedo reads high (smaller diam)', value: 'Actual speed < indicated' },
    ],
    citations: [
      { source: 'Tire and Rim Association', url: 'https://www.us-tra.org/' },
      { source: 'NHTSA Tire Safety', url: 'https://www.nhtsa.gov/equipment/tires' },
      { source: 'Tire Rack Tech Article: Plus Sizing', url: 'https://www.tirerack.com/upgrade-garage/what-is-plus-sizing' },
      { source: 'SAE J2452 — Stepwise Coastdown Methodology for Measuring Tire Rolling Resistance', url: 'https://www.sae.org/standards/content/j2452/' },
    ],
  },
};

export default tireSizeConfig;
