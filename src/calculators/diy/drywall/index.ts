import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import DrywallPanel from './DrywallPanel';

const drywallConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'length',
      label: 'Room Length',
      type: 'number',
      placeholder: '16',
      unit: 'ft',
      min: 0,
      step: 0.5,
      inputMode: 'decimal',
      required: true,
      helpText: 'Length of the room in feet. Measure wall-to-wall along the longest dimension.',
    },
    {
      id: 'width',
      label: 'Room Width',
      type: 'number',
      placeholder: '12',
      unit: 'ft',
      min: 0,
      step: 0.5,
      inputMode: 'decimal',
      required: true,
      helpText: 'Width of the room in feet. Measure wall-to-wall along the shorter dimension.',
    },
    {
      id: 'height',
      label: 'Ceiling Height',
      type: 'number',
      placeholder: '9',
      unit: 'ft',
      min: 0,
      step: 0.5,
      inputMode: 'decimal',
      required: true,
      helpText: 'Height from finished floor to ceiling in feet. Standard residential is 8 or 9 ft.',
    },
    {
      id: 'sheetSize',
      label: 'Drywall Sheet Size',
      type: 'select',
      helpText: '4x8 ft (32 sq ft) is standard and easiest to handle solo. 4x12 ft (48 sq ft) reduces seams on tall walls but requires two people to hang.',
      options: [
        { label: '4x8 ft (32 sq ft)', value: '32' },
        { label: '4x10 ft (40 sq ft)', value: '40' },
        { label: '4x12 ft (48 sq ft)', value: '48' },
      ],
    },
    {
      id: 'ceiling',
      label: 'Include Ceiling?',
      type: 'select',
      helpText: 'Include ceiling drywall. Ceiling sheets are hung perpendicular to joists. Use 5/8-inch type X for garage ceilings.',
      options: [
        { label: 'Yes -- include ceiling', value: 'yes' },
        { label: 'No -- walls only', value: 'no' },
      ],
    },
    {
      id: 'doors',
      label: 'Number of Doors',
      type: 'number',
      placeholder: '1',
      min: 0,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Standard interior door rough opening is approximately 20 sq ft. Enter the count of door openings.',
    },
    {
      id: 'windows',
      label: 'Number of Windows',
      type: 'number',
      placeholder: '2',
      min: 0,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Standard window rough opening is approximately 15 sq ft. Enter the count of window openings.',
    },
  ],
  calculate: (values) => {
    const length = parseFloat(values.length);
    const width = parseFloat(values.width);
    const height = parseFloat(values.height);
    const sheetSqFt = parseFloat(values.sheetSize || '32');
    const includeCeiling = values.ceiling !== 'no';
    const doors = parseFloat(values.doors) || 0;
    const windows = parseFloat(values.windows) || 0;

    if ([length, width, height].some(isNaN) || length <= 0 || width <= 0 || height <= 0) return [];

    const wallArea = 2 * (length + width) * height;
    const ceilingArea = includeCeiling ? length * width : 0;
    const totalArea = wallArea + ceilingArea;
    const doorArea = doors * 20;
    const windowArea = windows * 15;
    const netArea = totalArea - doorArea - windowArea;
    const withWaste = netArea * 1.1;
    const sheetsNeeded = Math.ceil(withWaste / sheetSqFt);
    const perimeterLinearFt = 2 * (length + width);
    const estimatedScrews = Math.ceil(sheetsNeeded * 32); // ~32 screws per 4x8 sheet
    const jointCompoundGals = Math.ceil((sheetsNeeded / 30) * 5) + 0.5; // ~5 gal per 30 sheets, keep as number

    return [
      {
        id: 'sheets',
        label: 'Drywall Sheets Needed',
        value: `${sheetsNeeded} sheets`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'netArea',
        label: 'Net Area (with 10% waste)',
        value: `${withWaste.toFixed(0)} sq ft`,
        color: 'neutral',
      },
      {
        id: 'wallArea',
        label: 'Wall Area',
        value: `${wallArea.toFixed(0)} sq ft`,
        color: 'neutral',
      },
      {
        id: 'ceilingArea',
        label: 'Ceiling Area',
        value: includeCeiling ? `${ceilingArea.toFixed(0)} sq ft` : 'Not included',
        color: 'neutral',
      },
      {
        id: 'screws',
        label: 'Drywall Screws (approx)',
        value: `${estimatedScrews} screws`,
        color: 'neutral',
      },
      {
        id: 'jointCompound',
        label: 'Joint Compound',
        value: `${jointCompoundGals.toFixed(1)} gallons`,
        color: 'neutral',
      },
      {
        id: 'tape',
        label: 'Joint Tape',
        value: `${Math.ceil(perimeterLinearFt / 50) * 2} rolls (250 ft each)`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DrywallPanel, { values, results });
  },
  educational: {
    formula: 'Sheets = ceil((Net Wall Area x 1.10) / Sheet Area)  |  Wall Area = 2 x (L + W) x H',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="100" y="60" width="240" height="200" fill="var(--svg-f8fafc)" stroke="var(--svg-94a3b8)" stroke-width="2" rx="2"/><line x1="100" y1="160" x2="340" y2="160" stroke="var(--svg-e2e8f0)" stroke-width="2" stroke-dasharray="5,5"/><line x1="220" y1="60" x2="220" y2="260" stroke="var(--svg-e2e8f0)" stroke-width="2" stroke-dasharray="5,5"/><circle cx="220" cy="160" r="4" fill="var(--svg-3b82f6)"/><line x1="220" y1="270" x2="220" y2="290" stroke="var(--svg-ef4444)" stroke-width="2"/><line x1="100" y1="290" x2="340" y2="290" stroke="var(--svg-ef4444)" stroke-width="2"/><polygon points="340,290 335,285 335,295" fill="var(--svg-ef4444)"/><text x="220" y="310" text-anchor="middle" font-size="13" fill="var(--svg-ef4444)">Length: 8 ft</text><line x1="80" y1="60" x2="80" y2="260" stroke="var(--svg-22c55e)" stroke-width="2"/><line x1="65" y1="60" x2="65" y2="260" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="67" y="165" text-anchor="middle" font-size="13" fill="var(--svg-22c55e)" transform="rotate(-90,67,165)">Width: 4 ft</text></svg>',
      alt: 'Drywall panel with length and width dimensions labeled with dashed center lines',
      caption: 'Drywall -- standard 4x8 ft sheet with 10% waste allowance for cuts',
    },
    formulaDescription:
      'Drywall sheet count is calculated from total wall and ceiling area (minus door and window openings), plus a 10% waste allowance. The calculator also estimates drywall screws, joint compound, and joint tape based on industry-standard installation rates.',
    variables: [
      { symbol: 'Wall Area', name: 'Total Wall Area', description: 'Perimeter (2 x length + 2 x width) multiplied by ceiling height. This is the surface area to be covered before subtracting openings.' },
      { symbol: 'Ceiling Area', name: 'Ceiling Area (optional)', description: 'Length x width of the room if ceiling drywall is included. Use 5/8-inch type X drywall for garage ceilings per fire code.' },
      { symbol: 'Net Area', name: 'Net Surface Area', description: 'Wall area + ceiling area minus standard door (20 sq ft each) and window (15 sq ft each) openings. For non-standard openings, measure the rough opening area exactly.' },
      { symbol: '1.10', name: '10% Waste Factor', description: 'Standard waste allowance for cuts around doors, windows, outlets, angles, and fitting errors. For rooms with many corners or complex angles, increase to 15%.' },
      { symbol: 'Sheet Area', name: 'Drywall Sheet Area', description: 'Area of one drywall sheet. Common sizes: 4x8 ft = 32 sq ft, 4x10 ft = 40 sq ft, 4x12 ft = 48 sq ft. 4x12 sheets reduce butt joints on 9 ft walls -- only one horizontal seam instead of two.' },
    ],
    howToUse: [
      'Measure room dimensions (length, width, ceiling height in feet) with a laser measure or tape. Measure each wall independently -- rooms are rarely perfectly square.',
      'Select the drywall sheet size you plan to use. 4x8 ft is easiest to handle alone. 4x12 ft reduces seams on 9 ft walls but needs two people for ceiling work.',
      'Choose whether to include the ceiling in the calculation. For garages, use 5/8-inch fire-rated type X drywall on the ceiling by code.',
      'Count the number of doors and windows to deduct from the total area. Standard rough openings are 20 sq ft per door and 15 sq ft per window.',
      'Review the material estimates: sheets, screws (approximately 32 per 4x8 sheet), joint compound, and joint tape.',
      'Add 1-2 extra sheets to your order for peace of mind -- having a spare sheet is far cheaper than a second trip to the lumber yard.',
    ],
    explanation:
      'Drywall (also called gypsum board, Sheetrock, or wallboard) is the standard interior wall and ceiling covering used in virtually every modern building. Invented in 1916 by the United States Gypsum Company (USG) as a fire-resistant alternative to lath-and-plaster, drywall transformed construction by reducing interior finishing time from weeks to days. A drywall panel consists of a gypsum plaster core (calcium sulfate dihydrate, a naturally fire-resistant mineral) sandwiched between two layers of heavy paper. The paper provides tensile strength while the gypsum core provides compressive strength and fire resistance. Standard 1/2-inch drywall can achieve a 30-minute fire rating; 5/8-inch type X drywall achieves a 1-hour fire rating due to glass fibers in the core. Drywall is manufactured in 4-foot widths (matching standard stud spacing of 16 or 24 inches on center) and lengths of 8, 10, 12, 14, and 16 feet. Hanging drywall is the first of four steps: (1) hanging the sheets with screws every 12 inches on edges and 16 inches in the field, (2) taping seams with paper or mesh tape embedded in joint compound, (3) applying 2-3 finish coats of compound, each wider than the last, and (4) sanding smooth before priming. This calculator estimates the sheet count and basic finishing materials. For a 16x12 room with 9 ft ceilings, including the ceiling, one door, and two windows: wall area = 2 x (16+12) x 9 = 504 sq ft, ceiling = 16 x 12 = 192 sq ft, total = 696 sq ft. After deducting one door (20 sq ft) and two windows (30 sq ft), net = 646 sq ft. With 10% waste: 710.6 sq ft. Using 4x8 sheets (32 sq ft each): ceil(710.6 / 32) = 23 sheets. Using 4x12 sheets (48 sq ft each) on 9 ft walls eliminates one horizontal seam: ceil(710.6 / 48) = 15 sheets -- fewer sheets, fewer seams, less taping. Always hang ceiling sheets first, then walls, so wall sheets support the ceiling sheet edges. Hang sheets horizontally on walls (perpendicular to studs) for the strongest installation -- horizontal hanging also puts the butt joint at a comfortable working height for taping. Stagger the end joints between rows so four corners never meet at one point, which prevents visible cracking. Pro tip: score the paper face with a utility knife along a straightedge, snap the board away from the cut, then cut the back paper -- produces a clean factory-style edge every time.',
    commonUses: [
      'Estimating drywall sheet quantity and material budget when finishing a basement, garage, or room addition',
      'Planning drywall layout to minimize waste by choosing between 4x8, 4x10, and 4x12 sheet sizes for different wall heights',
      'Calculating material needs for both walls and ceilings, accounting for door and window openings',
      'Budgeting screws, joint compound, and joint tape for a complete drywall finishing project',
    ],
    faqs: [
      {
        question: 'What thickness of drywall should I use for different applications?',
        answer: '1/2 inch (12.7mm) is standard for interior walls and ceilings in residential construction. It is the most common, least expensive, and easiest to work with for DIY projects. 5/8 inch (15.9mm) type X is required by code for garage ceilings (fire separation between garage and living space), furnace rooms, and between attached garages and living areas -- it achieves a 1-hour fire rating. 5/8 inch is also preferred for ceilings with 24-inch joist spacing because it resists sagging better than 1/2 inch. 1/4 inch (6.4mm) is a specialty product used exclusively as a second layer over existing drywall or for creating curved surfaces like archways and curved walls -- it is flexible when dampened. 3/8 inch is rarely used in modern construction but exists for repair work and double-layer applications. For soundproofing between rooms (e.g., home theater, bedroom adjacent to living room), use double layers of 5/8 inch drywall with Green Glue sound-dampening compound between layers, and decouple the framing with resilient channels or staggered studs -- this can achieve STC ratings above 55.',
      },
      {
        question: 'Do I need special moisture-resistant drywall for bathrooms and kitchens?',
        answer: 'Yes. Use moisture-resistant "green board" (the green paper-faced product) or preferably "purple board" (GP DensArmor Plus) for bathrooms, kitchens, laundry rooms, and any area with elevated humidity. Green board resists moisture better than standard drywall but is NOT waterproof -- it should NOT be used in wet areas like shower surrounds or behind tub enclosures. For shower enclosures, tub surrounds, and any area that gets direct water contact, use cement board (WonderBoard, HardieBacker, or Durock) or a foam backer board (Kerdi-Board, Wedi, GoBoard) with a waterproofing membrane. The IRC (International Residential Code) requires a waterproof membrane behind shower wall finishes (IRC R702.4). Cement board is heavy (a 3x5 ft sheet of 1/2-inch Durock weighs about 40 lbs) and requires special carbide-tipped cutting tools, but it will not degrade when wet. Foam backer boards are lighter and easier to cut but cost 2-3x more. Never install standard drywall in a shower -- it will absorb moisture, grow mold within months, and the tiles will eventually fall off as the gypsum core softens.',
      },
      {
        question: 'What drywall tools and materials do I need for a complete DIY job?',
        answer: 'Essential tools for hanging: utility knife with a 50-pack of replacement blades (change blades frequently -- a dull blade tears paper instead of cutting), 48-inch aluminum T-square for straight cuts, drywall saw (jab saw) for cutting around outlets, drywall screw gun or drill with a drywall dimpler bit ($8-$15, worth every penny), 6-foot step ladder, and safety glasses. Essential tools for finishing: taping knives in 4-inch, 6-inch, and 10-12 inch widths (stainless steel is worth the upgrade over blue steel -- it will not rust and leaves a smoother finish), 12-inch mud pan, corner trowel (inside 90-degree) or corner roller for inside corners, paper joint tape (preferred for strength on seams) and mesh tape (self-adhesive, good for patches), all-purpose joint compound (pre-mixed in 4.5-gallon buckets for large jobs), a mud mixer paddle for your drill if using setting-type compound (powder), sanding pole with 120-grit and 220-grit sanding screens, sanding sponge for corners, and a high-quality N95 dust mask (drywall dust is extremely fine silica dust -- a cheap paper mask is insufficient). For ceilings: rent a drywall lift ($35-$45/day from Home Depot or any equipment rental -- do not attempt ceiling drywall without one unless you have two strong helpers). Total tool investment for a first-time DIYer: approximately $150-$200 if starting from scratch, plus the lift rental. Joint compound coverage: approximately 1 gallon per 100-150 sq ft of finished wall for all three coats combined. A 4.5-gallon bucket covers approximately 450-675 sq ft of finished wall area.',
      },
      {
        question: 'How do I hang drywall on ceilings by myself?',
        answer: 'Hanging ceiling drywall solo requires a drywall lift (panel hoist) -- rent one for $35-$45 per day. It holds the sheet flat against the ceiling joists while you drive screws. Working procedure: (1) Mark joist locations on the wall top plates before lifting sheets so you can see where to screw from below. (2) Load the sheet face-down on the lift cradle, crank it up to the ceiling, and make fine adjustments until the sheet is tight against the joists. (3) Drive screws starting from the center of the sheet and working outward at 12-inch spacing on edges, 16 inches in the field (about 32 screws per 4x8 sheet). (4) For ceiling work, use 1-5/8 inch coarse-thread drywall screws (not fine-thread) -- coarse thread bites better into wood joists. (5) Stagger end joints between rows so that four corners never meet at a single point. (6) Always hang ceiling sheets perpendicular to the joists so the long edge is supported along its entire length. A common DIY mistake is running sheets parallel to joists -- this leaves long unsupported seams between joists that will sag and crack. For a single person, using 4x8 sheets (approximately 55 lbs for 1/2-inch drywall) rather than larger sizes makes ceiling installation manageable. A 4x12 sheet of 1/2-inch drywall weighs about 82 lbs -- too heavy for one person on a lift. Consider using ultra-light 1/2-inch drywall (approximately 20% lighter, around 44 lbs per 4x8 sheet) which is available from most home centers and significantly reduces fatigue. When working on ceilings, wear a hard hat or at minimum safety glasses -- drywall dust and joint compound drips will fall directly into your face.',
      },
      {
        question: 'How do I finish drywall seams for a smooth, professional-looking wall?',
        answer: 'The difference between a DIY job and a professional job is entirely in the finishing. The process has four stages: (1) Pre-fill: fill any gaps wider than 1/8 inch with setting-type compound (the powder you mix with water, sold as "Easy Sand" or "Durabond" in 5, 20, 45, or 90 minute set times) before taping. This prevents the tape from bridging gaps and cracking later. Setting compound hardens chemically (like concrete) and does not shrink, unlike pre-mixed compound which dries by evaporation. (2) Tape: apply a thin layer of all-purpose compound to the seam, embed paper tape firmly into it with a 4-inch knife, and wipe away excess. Paper tape is stronger than mesh for seams -- mesh tape is better for patches because it is self-adhesive and thinner. On inside corners, crease the paper tape before embedding (most rolls come pre-creased). Use a corner roller or corner trowel for sharp 90-degree corners. Metal-reinforced paper tape exists for outside corners and is far more durable than plain paper tape. (3) Coat: apply three coats of compound, each wider than the last. First coat (block coat): cover the tape with a 6-inch knife, feathering edges to zero. Let dry 24 hours. Second coat (fill coat): apply with a 10-inch knife, extending 6-8 inches beyond the joint on each side. Let dry 24 hours. Third coat (finish coat): thin the compound slightly with water (about the consistency of pancake batter), apply with a 12-inch knife extending 10-12 inches out, and focus on feathering edges perfectly smooth. Use a work light held at a low angle ("raking light") against the wall to highlight imperfections between coats. (4) Sand: use a sanding pole with 150-220 grit screens using light pressure. Over-sanding burns through the paper facing and creates fuzzy spots. Sand between coats only enough to knock off ridges and lap marks. After final sanding, wipe all surfaces with a damp sponge or microfiber cloth to remove dust before priming. A properly finished seam is invisible from 3 feet away under normal lighting -- if you can see the seam, you need another coat. Total time from hanging to paint-ready: approximately 3-4 days for a standard room, mostly waiting for compound to dry. Pro tip: use a setting-type compound (45- or 90-minute) for the first coat over tape to speed up the process -- you can apply the second coat the same day instead of waiting until tomorrow.',
      },
      {
        question: 'How do I calculate drywall for non-rectangular rooms with angled ceilings?',
        answer: 'For rooms with angled ceilings (vaulted, cathedral, shed, or A-frame), measure each wall as a trapezoid rather than a rectangle: area = (top width + bottom width) / 2 x height. For example, a gable end wall that is 20 ft wide at the base, 0 ft at the peak, and 10 ft tall: area = (20 + 0) / 2 x 10 = 100 sq ft -- this is the area of a triangle, since the top width is zero. Each sloping ceiling face on a vaulted ceiling room is a rectangle if you measure the actual sloped length (the hypotenuse), not the horizontal run. To find the sloped length, use the Pythagorean theorem: sloped length = sqrt(rise^2 + run^2). For a room that is 16 ft wide with a ridgeline running down the middle at 8 ft above the wall top plate, and the walls are 9 ft tall: each sloped ceiling face measures sloped-length x room-length. If the rise is 8 ft and the run is 8 ft (half of 16 ft), then sloped length = sqrt(8^2 + 8^2) = 11.3 ft for each side. Multiply by the room length to get each sloping face area. Add the triangular gable end wall area calculated above. Increase the waste factor to 15-20% for angled ceilings because every sheet requires an angled rip cut that cannot be used elsewhere. For dormers, bay windows, tray ceilings, and coffered ceilings, break the surfaces into individual rectangles and triangles, calculate each separately, and add 5% extra waste for each complex feature. When in doubt, sketch the room on graph paper, calculate each surface, and order 2-3 extra sheets.',
      },
      {
        question: 'What is the difference between joint compound types and when should I use each?',
        answer: 'There are three main types of joint compound. (1) All-purpose (pre-mixed, green lid): the most common and versatile. It has more adhesive (PVA glue) which makes it good for taping (it bonds paper tape to drywall securely) but it is harder to sand. Use for the first coat over tape. (2) Lightweight (pre-mixed, blue lid): about 25% lighter than all-purpose, sands much more easily, and shrinks less. Preferred for the second and third finish coats because it is easier to feather to a smooth edge. Some pros use lightweight for all three coats. (3) Setting-type (powder, sold as "Easy Sand" or "Durabond" in 5, 20, 45, 90 minute): you mix it with water and it hardens by a chemical reaction, not evaporation. It does not shrink and can be recoated in the time printed on the bag (e.g., 45-minute Easy Sand can be recoated in about 45 minutes, compared to 24 hours for pre-mixed). Setting compound is ideal for the pre-fill step (filling large gaps before taping), for the first coat when time is tight, and for patches where you want multiple coats in a single day. Durabond is much harder than Easy Sand and is nearly impossible to sand after it fully cures -- do not use Durabond for finish coats, only for pre-filling and bedding. Easy Sand is sandable and can be used for finish coats by experienced finishers who are fast enough to work with the short open time. For a beginner DIYer, stick with all-purpose (green lid) for taping and lightweight (blue lid) for finish coats. This gives you the working time to get it right without the compound hardening in your pan.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Finishing a Basement Recreation Room in Denver, CO',
        inputs: { length: '24', width: '16', height: '8', sheetSize: '32', ceiling: 'yes', doors: '1', windows: '3' },
        result: '33 sheets, 1,056 screws, 6.0 gal joint compound, 6 rolls joint tape. Materials ~$589 plus tax.',
        insight: 'A 24x16 ft basement with standard 8 ft ceilings, one door to the stairwell, and three small egress windows. Wall area = 2 x (24+16) x 8 = 640 sq ft. Ceiling area = 24 x 16 = 384 sq ft. Total before openings = 640 + 384 = 1,024 sq ft. Deduct 1 door (20 sq ft) and 3 windows (45 sq ft): net = 959 sq ft. With 10% waste: 1,054.9 sq ft. Using 4x8 ft sheets (32 sq ft each): ceil(1054.9 / 32) = 33 sheets. Material cost at Denver Home Depot prices (2025): 33 sheets of 1/2-inch lightweight drywall at ~$15/sheet = $495, screws ($8/box of 1 lb, need 3 boxes) = $24, joint compound (1 bucket of 4.5 gal + 1 box setting compound) = $40, tape (6 rolls) = $30, total materials ~$589 plus tax. Add $45/day drywall lift rental for ceiling work. Basement drywall has important moisture considerations. In Denver, basements experience significant humidity swings due to the semi-arid climate and clay soils that expand and contract. Always use a 6-mil polyethylene vapor barrier behind the drywall on basement foundation walls to prevent ground moisture from wicking through. Leave a 1/2-inch gap between the bottom edge of drywall and the basement floor -- this gap gets covered by baseboard and prevents wicking if the floor ever gets damp. For basement ceilings, consider using 5/8-inch type X drywall for the added fire protection between floors, and install access panels at plumbing cleanouts and HVAC dampers before drywalling the ceiling.',
      },
      {
        scenario: 'Garage Conversion to Home Office in Austin, TX',
        inputs: { length: '20', width: '20', height: '10', sheetSize: '48', ceiling: 'yes', doors: '1', windows: '2' },
        result: '27 sheets of 4x12 ft drywall, 864 screws, ~5.0 gal joint compound.',
        insight: 'A 20x20 ft two-car garage being converted to a home office, with 10 ft ceilings. Wall area = 2 x (20+20) x 10 = 800 sq ft. Ceiling area = 20 x 20 = 400 sq ft. Total = 1,200 sq ft before openings. Deduct 1 door (20 sq ft) and 2 windows (30 sq ft): net = 1,150 sq ft. With 10% waste: 1,265 sq ft. Using 4x12 ft sheets (48 sq ft each) for the 10 ft walls: ceil(1265 / 48) = 27 sheets. Using 4x12 sheets on 10 ft walls is ideal -- the 12 ft length covers the wall height with one horizontal seam instead of needing to stack 8 ft sheets with a 2 ft filler strip. Garage conversions in Austin have unique code requirements. Texas building codes require 5/8-inch type X fire-rated drywall on the ceiling if there is living space above. The garage slab likely slopes (1/4 inch per foot minimum by code for drainage), so you may need to fur out the bottom plate or use a leveling compound before framing walls. Austin is in IECC climate zone 2, so the garage walls must be insulated to R-13 before drywalling for a conditioned space permit.',
      },
      {
        scenario: 'Small Bathroom Remodel with Moisture Concerns in Portland, OR',
        inputs: { length: '8', width: '5', height: '9', sheetSize: '32', ceiling: 'yes', doors: '1', windows: '1' },
        result: '5 sheets purple moisture-resistant drywall + 8 sheets 1/2-inch cement board for tub surround.',
        insight: 'A compact 8x5 ft bathroom with 9 ft ceilings. Wall area = 2 x (8+5) x 9 = 234 sq ft. Ceiling = 8 x 5 = 40 sq ft. Total = 274 sq ft. Deduct 1 door (20 sq ft) and 1 window (15 sq ft): net = 239 sq ft. With 10% waste: 262.9 sq ft. The tub/shower surround walls need cement board, not drywall. Assume a standard 5 ft tub on the 5 ft wall: the surround covers 3 walls, 5 ft wide x 7 ft high = 35 sq ft + 2 side walls each 3 ft wide x 7 ft high = 42 sq ft each. Total cement board area = 119 sq ft (8 sheets of 3x5 ft). Remaining drywall area: ~143.9 sq ft, about 5 sheets of 4x8 drywall. Portland\'s rainy climate means bathroom moisture management is critical. Always install an exhaust fan vented to the outside rated at minimum 50 CFM. Use cement board with a liquid-applied waterproofing membrane (like RedGard or Hydro Ban) on all shower surround walls. The extra $100-$200 in moisture-proofing materials prevents $5,000-$15,000 in mold remediation down the road.',
      },
    ],
    proTips: [
      'Score, snap, cut: place the drywall sheet flat on the floor (good side down for cutting on the back), score the paper face firmly with a sharp utility knife guided by a T-square in one pass (do not saw back and forth), then snap the board upward by lifting the scored edge. Fold the two halves together and slice through the back paper from the inside. This method produces a clean, factory-quality edge every time. A dull blade tears paper instead of cutting -- replace the blade after every 4-5 sheets, or about every 100 linear feet of cutting. Snap-off blades are convenient but standard fixed blades are sharper and stiffer.',
      'Hang ceiling sheets first, then upper wall sheets, then lower wall sheets. Wall sheets support the outer edges of ceiling sheets (the "floating" edge between joists). This "ceiling first" method means wall sheet tops press against the ceiling, providing continuous support along the entire perimeter. Always hang sheets perpendicular to framing members (joists for ceilings, studs for walls) for maximum strength. Horizontal wall hanging puts the butt joint at approximately 48 inches from the floor, which is an ergonomic working height for taping.',
      'Stagger butt joints between rows. When hanging sheets horizontally, offset the vertical seams of adjacent rows by at least one stud bay (16-24 inches). Never allow four corners to meet at one point -- this creates a "cross" joint that is nearly impossible to tape flat and will crack within months. The ideal layout staggers end joints like bricks in a wall. Plan your sheet layout on paper before hanging the first sheet to minimize butt joints and avoid placing any joint directly above or below a door or window opening (these areas experience more movement and cracking).',
      'Use a rotozip or spiral saw to cut out outlet boxes, switch boxes, and light fixtures after the sheet is hung. Hold the sheet against the wall with 2-3 temporary screws, plunge the rotozip bit into the center of the box, and trace around the inside edge of the box. The bit follows the metal or plastic box edge and cuts a perfect opening in seconds. If using a drywall saw (jab saw), trace the box outline on the sheet face before hanging. Always turn off the circuit breaker for the room before cutting around electrical boxes.',
      'For outside corners, install metal or vinyl corner bead before taping. Nail or screw it every 8-12 inches on both flanges. Apply compound in three coats, each wider than the last, to feather the corner bead into the wall. Paper-faced metal corner bead (like Strait-Flex or No-Coat) is more durable than plain metal bead because the paper provides a better bond with the compound and resists cracking from impact damage. For bullnose (rounded) corners, use bullnose corner bead which comes in 3/4-inch and 1-1/4-inch radius profiles.',
      'Prime drywall with a high-quality PVA (polyvinyl acetate) drywall primer before painting. Do NOT use paint-and-primer-in-one products on fresh drywall. Drywall primer seals the porous paper face and joint compound so the finish paint goes on evenly without "flashing" (uneven sheen between the paper face and compound areas). A gallon of PVA primer costs about $15-$20 and covers approximately 400 sq ft. Skipping primer or using cheap primer is the most common DIY mistake -- the finish coat will look blotchy, and the paper will absorb paint unevenly, requiring an extra coat of expensive finish paint to correct. PVA primer dries in about 1 hour and is tintable to match your finish color for better coverage.',
      'When carrying 4x8 sheets, carry them on edge with the 8 ft dimension vertical, one hand on the bottom edge and one on the side about two-thirds up. In windy conditions outdoors, carry sheets flat (horizontal) because a vertical sheet catches wind like a sail. For 4x12 sheets, get a second person or use a drywall carrier ($15, two-handled clamp tool). Never carry drywall by the edges with gloves that have insufficient grip -- a dropped sheet not only breaks but can cause serious injury. At 55 lbs, a falling 4x8 sheet has enough momentum to break toes and crush fingers.',
    ],
    limitations: [
      'This calculator provides estimates for rectangular rooms with standard 90-degree corners. For rooms with angled walls (vaulted/tray/cathedral ceilings, bay windows, dormers, alcoves), arched openings, or curved walls, break the surfaces into smaller rectangles and triangles, calculate separately, and add them together. Increase the waste factor to 15-20% for complex room geometries because angled cuts on drywall sheets cannot always be reused.',
      'Door and window deductions use standard rough opening sizes: 20 sq ft per door (approximately 3 ft x 6 ft 8 in) and 15 sq ft per window (approximately 3 ft x 5 ft). For non-standard openings like French doors, sliding glass doors, picture windows, or garage doors, measure the actual rough opening area and subtract it manually from the total. A standard sliding glass patio door rough opening is approximately 6 ft wide x 6 ft 8 in tall = 40 sq ft, nearly twice the standard door deduction.',
      'Screw count is estimated at 32 screws per 4x8 sheet based on 12-inch spacing on edges and 16-inch spacing in the field. Actual screw count varies with stud spacing (16-inch vs 24-inch on center), sheet orientation (horizontal vs vertical), and local code requirements (high-wind and seismic zones may require closer screw spacing, typically 8 inches on edges and 12 inches in the field). For fire-rated assemblies, screws must be 12 inches on center on all framing members including the field.',
      'Joint compound estimates are approximate and based on three-coat finishing (tape coat + fill coat + finish coat) using pre-mixed compound. Skim-coating entire walls (applying a thin layer of compound over the entire surface for a level 5 finish) increases compound usage by approximately 1 gallon per 100 sq ft of wall. Level 5 finish (the highest drywall finish level per GA-214 standards) is specified for areas with critical lighting conditions like large windows, skylights, or wall-wash fixtures where even minor surface imperfections cast visible shadows.',
      'This calculator does not account for lead paint or asbestos abatement requirements. If your home was built before 1978, existing painted surfaces may contain lead paint. If it was built before 1980, existing drywall joint compound and texture may contain asbestos. Disturbing these materials during demolition or renovation requires EPA-certified procedures (RRP Rule) and may require licensed abatement contractors. Always test before demo. Fines for non-compliance with the EPA RRP Rule start at $37,500 per violation per day.',
      'The calculator is designed for standard 1/2-inch lightweight drywall (approximately 1.6 lbs per sq ft). Specialty drywall products -- such as 5/8-inch type X fire-rated (2.3 lbs/sq ft), sound-dampening drywall like QuietRock (2.1 lbs/sq ft), abuse-resistant drywall, shaft liner, or foil-backed drywall -- are available only in specific sizes and may not be stocked in all sheet lengths at local home centers. Confirm availability of specialty products before relying on the sheet count.',
    ],
    quickReference: [
      { label: '4x8 standard sheet', value: '32 sq ft, ~55 lbs' },
      { label: '4x10 sheet', value: '40 sq ft, ~69 lbs' },
      { label: '4x12 sheet', value: '48 sq ft, ~82 lbs' },
      { label: 'Screws per 4x8 sheet', value: '~32 screws' },
      { label: 'Screw spacing (edges)', value: '12 inches' },
      { label: 'Screw spacing (field)', value: '16 inches' },
      { label: 'Joint compound (approx)', value: '1 gal per 100-150 sq ft' },
      { label: '1/2-inch std weight', value: '~1.6 lbs per sq ft' },
      { label: '5/8-inch type X weight', value: '~2.3 lbs per sq ft' },
      { label: 'Std door rough opening', value: '~20 sq ft' },
      { label: 'Std window rough opening', value: '~15 sq ft' },
      { label: 'Standard waste factor', value: '10%' },
    ],
    citations: [
      { source: 'Gypsum Association', title: 'GA-214 Recommended Levels of Finish', url: 'https://www.gypsum.org/' },
      { source: 'USG Sheetrock Brand Gypsum Panels', title: 'Installation Guide', url: 'https://www.usg.com/' },
      { source: 'International Residential Code', title: 'IRC R702.4 Water-Resistive Barriers', url: 'https://codes.iccsafe.org/content/IRC2021P4' },
      { source: 'EPA Lead RRP Rule', title: 'Renovation, Repair and Painting Program', url: 'https://www.epa.gov/lead/renovation-repair-and-painting-program' },
    ],
  },
};

export default drywallConfig;
