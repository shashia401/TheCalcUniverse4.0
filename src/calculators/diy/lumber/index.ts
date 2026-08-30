import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import LumberPanel from './LumberPanel';

const lumberConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'thickness',
      label: 'Nominal Thickness',
      type: 'number',
      placeholder: '2',
      unit: 'inches',
      min: 0.5,
      step: 0.5,
      inputMode: 'decimal',
      required: true,
      helpText: 'Nominal thickness in inches. For a 2x4, enter 2. For a 1x6, enter 1. Use nominal (not actual) dimensions for dimensional lumber pricing.',
    },
    {
      id: 'width',
      label: 'Nominal Width',
      type: 'number',
      placeholder: '4',
      unit: 'inches',
      min: 0.5,
      step: 0.5,
      inputMode: 'decimal',
      required: true,
      helpText: 'Nominal width in inches. For a 2x4, enter 4. For a 2x6, enter 6. Hardwood is often sold by actual measured dimensions, not nominal.',
    },
    {
      id: 'length',
      label: 'Length of Each Board',
      type: 'number',
      placeholder: '8',
      unit: 'feet',
      min: 0,
      step: 0.5,
      inputMode: 'decimal',
      required: true,
      helpText: 'Length of each individual board in feet. Common lengths: 6, 8, 10, 12, 14, 16, 20 ft. Longer boards command a premium price.',
    },
    {
      id: 'quantity',
      label: 'Number of Boards',
      type: 'number',
      placeholder: '20',
      unit: 'boards',
      min: 1,
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: 'Total number of boards needed for your project. Add an extra 10-15% for cut-off waste, defects, and mistakes.',
    },
    {
      id: 'pricePerBdFt',
      label: 'Price per Board Foot (optional)',
      type: 'number',
      placeholder: '2.50',
      prefix: '$',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Optional: enter the price per board foot to calculate total lumber cost. Construction-grade softwood is typically $0.50-2.00/bf, hardwood $3-15/bf.',
    },
  ],
  calculate: (values) => {
    const thickness = parseFloat(values.thickness);
    const width = parseFloat(values.width);
    const length = parseFloat(values.length);
    const quantity = parseFloat(values.quantity);
    const pricePerBdFt = parseFloat(values.pricePerBdFt);

    if ([thickness, width, length, quantity].some(isNaN) || length <= 0 || quantity <= 0) return [];

    const boardFeetPerBoard = (thickness * width * length) / 12;
    const totalBoardFeet = boardFeetPerBoard * quantity;
    const totalLinearFeet = length * quantity;
    // Approximate actual dimensions (subtract 0.5-inch from nominal for surfaced lumber)
    const actualThickness = thickness >= 2 ? thickness - 0.5 : thickness - 0.25;
    const actualWidth = width >= 4 ? width - 0.5 : width - 0.25;
    const actualBoardFeetPerBoard = (actualThickness * actualWidth * length) / 12;
    const actualTotalBoardFeet = actualBoardFeetPerBoard * quantity;

    const results: Array<{ id: string; label: string; value: string; highlight?: boolean; color: 'positive' | 'neutral' }> = [
      {
        id: 'totalBdFt',
        label: 'Total Board Feet (Nominal)',
        value: `${totalBoardFeet.toFixed(2)} bd ft`,
        highlight: true,
        color: 'positive' as const,
      },
      { id: 'perBoard', label: 'Board Feet per Board (Nominal)', value: `${boardFeetPerBoard.toFixed(2)} bd ft`, color: 'neutral' as const },
      { id: 'linearFt', label: 'Total Linear Feet', value: `${totalLinearFeet.toFixed(0)} ft`, color: 'neutral' as const },
      { id: 'actualBdFt', label: 'Total Board Feet (Actual)', value: `${actualTotalBoardFeet.toFixed(2)} bd ft`, color: 'neutral' as const },
      { id: 'actualDimensions', label: 'Actual Dimensions (approx)', value: `${actualThickness.toFixed(1)}" x ${actualWidth.toFixed(1)}"`, color: 'neutral' as const },
    ];

    if (!isNaN(pricePerBdFt) && pricePerBdFt > 0) {
      results.push({
        id: 'totalCost',
        label: 'Estimated Lumber Cost (Nominal)',
        value: `$${(totalBoardFeet * pricePerBdFt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        color: 'neutral' as const,
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LumberPanel, { values, results });
  },
  educational: {
    formula: 'Board Feet = (Nominal Thickness x Nominal Width x Length in Feet) / 12',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="80" y="140" width="300" height="40" fill="var(--svg-d4a574)" stroke="var(--svg-8b6914)" stroke-width="2" rx="2"/><line x1="80" y1="190" x2="80" y2="210" stroke="var(--svg-ef4444)" stroke-width="2"/><line x1="380" y1="190" x2="380" y2="210" stroke="var(--svg-ef4444)" stroke-width="2"/><line x1="80" y1="205" x2="380" y2="205" stroke="var(--svg-ef4444)" stroke-width="2"/><polygon points="380,205 375,200 375,210" fill="var(--svg-ef4444)"/><text x="230" y="225" text-anchor="middle" font-size="13" fill="var(--svg-ef4444)">Length: 8 ft</text><line x1="60" y1="140" x2="60" y2="180" stroke="var(--svg-22c55e)" stroke-width="2"/><line x1="45" y1="140" x2="45" y2="180" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="47" y="163" text-anchor="middle" font-size="13" fill="var(--svg-22c55e)" transform="rotate(-90,47,163)">Width: 6 in</text><line x1="390" y1="140" x2="390" y2="180" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="405" y1="140" x2="405" y2="180" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="403" y="163" text-anchor="middle" font-size="13" fill="var(--svg-3b82f6)" transform="rotate(-90,403,163)">Thickness: 2 in</text></svg>',
      alt: 'Lumber board with length, width, and thickness dimensions labeled',
      caption: 'Board feet = thickness (in) x width (in) x length (ft) divided by 12',
    },
    formulaDescription:
      'A board foot (bd ft or BF) is a unit of lumber volume equal to a board 1 inch thick, 12 inches wide, and 12 inches long (144 cubic inches). The formula is (Thickness in inches x Width in inches x Length in feet) / 12. For dimensional lumber like 2x4s, use nominal dimensions. For hardwoods sold at retail lumberyards, the dimensions are typically actual (measured) dimensions. One board foot of hardwood is a piece 1 inch thick by 12 inches wide by 12 inches long, but if the same volume is 2 inches thick and 6 inches wide, it is still 1 board foot as long as it is 12 inches long.',
    variables: [
      { symbol: 'T', name: 'Nominal Thickness (inches)', description: 'The stated thickness of the lumber (e.g., 2 for a 2x4). For dimensional lumber, the actual thickness is 0.5 inches less (a 2x4 is actually 1.5 inches thick). For hardwoods sold at retail, the stated thickness may be the actual sawn thickness (rough lumber) which will be planed down further, losing approximately 1/8 to 1/4 inch per face.' },
      { symbol: 'W', name: 'Nominal Width (inches)', description: 'The stated width of the lumber (e.g., 4 for a 2x4). Actual width is 0.5 inches less for widths 4 inches and above (a 2x4 is actually 3.5 inches wide). A 1x6 is actually 0.75 x 5.5 inches. For boards wider than 6 inches (1x8, 1x10, 1x12), the actual width is 0.75 inches less than nominal.' },
      { symbol: 'L', name: 'Length (feet)', description: 'The length of each board in feet. Common dimensional lumber lengths: 6, 8, 10, 12, 14, 16, 20, and 24 ft, typically in 2-foot increments for lengths above 8 ft. Stud-length 2x4s are pre-cut to 92-5/8 inches (for 8 ft walls with a double top plate and single bottom plate).' },
      { symbol: '12', name: 'Divisor (12)', description: 'Converts cubic inch-feet to board feet. Since a board foot is 144 cubic inches (12 x 12 x 1), and the formula multiplies thickness (in) x width (in) x length (ft), the divisor 12 accounts for the unit mismatch between inch dimensions and foot length.' },
      { symbol: 'Q', name: 'Quantity', description: 'The total number of boards at the given dimensions. Always order more than the exact calculated quantity to allow for cut-off waste (10-15%), knots and defects (especially in construction-grade lumber), and boards that warp during acclimation.' },
    ],
    howToUse: [
      'Enter the nominal thickness and width of the lumber (e.g., 2 and 4 for a 2x4). Use nominal dimensions for construction lumber; use actual dimensions for hardwood.',
      'Enter the length of each board in feet. Common lengths are 8, 10, and 12 ft. Longer boards (16+ ft) are more expensive per board foot.',
      'Enter the total number of boards needed for your project.',
      'Optionally enter the price per board foot to calculate total lumber cost. Check current prices at your local lumberyard -- prices fluctuate significantly with market conditions.',
      'Review the actual dimensions output to understand the true size of your lumber for precise construction planning.',
    ],
    explanation:
      'Board feet (bd ft or BF) is the standard unit for pricing and selling lumber in North America, dating back to the 19th century when the timber industry needed a standardized volume measurement that was easy to compute from the rough-sawn dimensions at the mill. One board foot equals 144 cubic inches of wood -- a board 1 inch thick, 12 inches wide, and 12 inches long. The formula (T x W x L) / 12 arises because thickness and width are in inches but length is in feet -- the divisor 12 corrects for the unit mismatch. This is a unique quirk of the imperial system: you are multiplying two inch dimensions by a foot dimension and correcting the result. Understanding the difference between nominal and actual lumber dimensions is essential for any construction project. When a tree is sawn into lumber at the mill, the rough-sawn dimensions are the "nominal" size (e.g., a 2x4 was originally sawn to approximately 2 inches by 4 inches). The lumber is then kiln-dried to reduce moisture content (from roughly 30% down to 15-19% for construction lumber), which causes shrinkage. Finally, the board is surfaced (planed) on all four sides to create smooth, consistent faces, removing additional material. The result: a nominal 2x4 is actually 1.5 x 3.5 inches. Common nominal-to-actual conversions: 1x4 = 0.75 x 3.5, 1x6 = 0.75 x 5.5, 1x8 = 0.75 x 7.25, 1x10 = 0.75 x 9.25, 1x12 = 0.75 x 11.25, 2x4 = 1.5 x 3.5, 2x6 = 1.5 x 5.5, 2x8 = 1.5 x 7.25, 2x10 = 1.5 x 9.25, 2x12 = 1.5 x 11.25, 4x4 = 3.5 x 3.5 (actual post), 6x6 = 5.5 x 5.5 (actual). Note that the reduction is 0.5 inches for thicknesses 2 inches and above, and 0.25 inches for thicknesses below 2 inches (like 1x material which starts at 1 inch nominal and finishes at 3/4 inch). For widths, the reduction is 0.5 inches for widths 2-6 inches and 0.75 inches for widths 8 inches and above. This is not a manufacturing defect -- it is the industry standard per the American Softwood Lumber Standard (PS 20). Lumber is priced by the board foot based on nominal dimensions, so a 2x4x8 costs the same whether it is 1.5 x 3.5 inches (standard) or 1.5 x 3.5 inches (the only option). However, hardwoods at specialty lumberyards are typically sold by the board foot measured from the actual rough-sawn dimensions (or sometimes the surfaced dimensions), not nominal, which makes hardwood pricing appear more expensive per board foot than it actually is compared to softwood.',
    commonUses: [
      'Estimating board feet and total cost when buying hardwood for furniture projects like tables, cabinets, or shelves from a specialty lumberyard',
      'Calculating lumber needs for framing a wall, deck, shed, or floor system using dimensional lumber like 2x4s, 2x6s, and 2x10s',
      'Comparing costs between different lumber sizes, species, and grades for a construction or renovation project budget',
      'Converting between nominal and actual lumber dimensions for precise construction planning and material takeoffs',
      'Verifying lumberyard invoices by calculating board foot totals from quantity takeoffs',
    ],
    faqs: [
      {
        question: 'Why is a 2x4 not actually 2 inches by 4 inches?',
        answer: 'The nominal dimension (2x4) refers to the rough-cut size at the sawmill before the wood is dried and planed. After kiln-drying (which causes shrinkage) and surfacing on all four sides to produce smooth, consistent faces (called S4S -- surfaced four sides), the actual finished dimension is 1.5 x 3.5 inches. This has been the industry standard since the early 20th century and is governed by the American Softwood Lumber Standard (PS 20). The same applies across all dimensional lumber: a 2x6 is actually 1.5 x 5.5 inches, a 2x8 is 1.5 x 7.25 inches, a 2x10 is 1.5 x 9.25 inches, and a 2x12 is 1.5 x 11.25 inches. For 1x material (boards), a 1x4 is 0.75 x 3.5 inches, a 1x6 is 0.75 x 5.5 inches, and a 1x12 is 0.75 x 11.25 inches. The reduction for 1x material is 0.25 inches in thickness instead of 0.5 inches because 1x starts thinner. This dimensional difference matters significantly in construction: when framing a 20-foot wall, 10 studs (2x4s placed with the 3.5-inch face against the drywall) occupy 10 x 1.5 = 15 inches of wall length, not 10 x 2 = 20 inches. The 5-inch discrepancy must be accounted for in the wall layout. The nominal system originated when lumber was sold rough-sawn and full-dimension (a true 2x4) -- the modern actual dimensions were standardized in the 1920s-1960s as milling technology improved and the industry agreed on consistent planing and drying standards.',
      },
      {
        question: 'What is the difference between linear feet and board feet, and when should I use each?',
        answer: 'Linear feet measures only the length of a board, ignoring its thickness and width entirely. Board feet measures the volume of wood, accounting for all three dimensions. Use linear feet when you need a specific length regardless of size (e.g., "I need 100 linear feet of 2x4 for wall plates") and when the lumber dimension is fixed. Use board feet when comparing costs between different sizes of lumber (e.g., "should I use 2x6 or 2x8 joists?") or when buying hardwood where the boards are random widths and you pay for the actual wood volume. A 2x4 that is 8 feet long is 8 linear feet but only (2 x 4 x 8) / 12 = 5.33 board feet. A 2x12 that is 8 feet long is also 8 linear feet but (2 x 12 x 8) / 12 = 16 board feet -- three times the wood volume for the same length. This is why wider lumber costs more per linear foot (it contains more wood), but should cost roughly the same per board foot for the same species and grade. The conversion factor: for any given lumber size, board feet per linear foot = (nominal thickness x nominal width) / 12. For example, 2x6 = (2 x 6) / 12 = 1.0 board feet per linear foot. A 2x8 = (2 x 8) / 12 = 1.33 board feet per linear foot. Knowing this conversion allows you to quickly compare prices: if 2x6 costs $1.20 per linear foot, that is $1.20 per board foot (since 1 LF of 2x6 = 1 BF). If 2x8 costs $1.60 per linear foot, that is $1.60 / 1.33 = $1.20 per board foot -- the same unit price, just more wood per foot.',
      },
      {
        question: 'How do I choose the right lumber grade for my project?',
        answer: 'Lumber grades determine the quality, appearance, and structural properties of wood. For softwood construction lumber, the key grades are: (1) Select Structural (SS) -- the highest grade, nearly clear of knots, used for critical structural applications where maximum strength is required. Rarely needed for residential DIY projects. (2) No. 1 (Construction) -- allows some tight knots but is structurally sound. Use for visible beams, exposed rafters, and high-quality framing where appearance matters. (3) No. 2 (Standard) -- the most common grade for residential framing. Allows more and larger knots than No. 1 but is perfectly adequate for wall studs, joists, rafters, and other concealed framing members. This is what you find in the standard lumber aisle at Home Depot and Lowe\'s. (4) No. 3 (Utility) -- allows large knots and defects. Suitable only for temporary construction, concrete forms, blocking, and bracing. (5) Stud grade -- specifically graded for vertical wall studs in load-bearing walls, sized at 92-5/8 inches pre-cut length. For hardwood (used in furniture, cabinetry, flooring, and trim), the grading is different and based on the percentage of clear cuttings a board will yield: FAS (Firsts and Seconds) -- the highest grade, yielding 83.3% or more clear-face cuttings, ideal for fine furniture where long clear pieces are needed. Select -- similar to FAS but for smaller boards (minimum 4 inches wide vs 6 inches for FAS). No. 1 Common -- yields 66.7% clear-face cuttings, good for kitchen cabinets and painted furniture where small knots and color variation are acceptable. No. 2 Common -- yields 50% clear cuttings, suitable for rustic furniture and projects where knots and character are desired. For visible projects like furniture or trim, use select or clear grade. For framing and structural work, No. 2 Standard grade is cost-effective and perfectly adequate. Check the grade stamp on each board -- it includes the species, grade, moisture content (KD for kiln-dried, S-GRN for green/unseasoned), and mill identification number.',
      },
      {
        question: 'How should I store lumber on a job site to prevent warping and damage?',
        answer: 'Proper lumber storage is critical -- improperly stored lumber will warp, twist, cup, or bow, making it unusable for precise construction. (1) Store lumber flat and level, elevated off the ground on sleepers, stickers, or pallets (at least 4 inches above soil or concrete) to prevent moisture wicking from the ground. (2) Use stickers (1x1 or 2x2 dry wood strips) between layers of boards, placed every 16-24 inches and aligned vertically through the stack to allow airflow on all sides of every board. This prevents moisture trapping between boards. (3) Cover the top of the stack with a waterproof tarp or plastic sheeting, but leave the sides open for airflow. A fully wrapped stack traps moisture inside and promotes mold and rot. The tarp should extend over the top and hang down 12-18 inches on each side like a tent, not wrap around the entire stack. (4) For pressure-treated lumber (the green-tinted stuff used for decks, fences, and ground-contact applications), allow it to dry for 2-4 weeks (or until the surface feels dry and the color lightens) before painting or staining. Wet PT lumber will not accept paint or stain. PT lumber also shrinks as it dries, so if you build a deck with soaking-wet PT lumber, expect gaps to open up between boards as they dry. (5) Acclimate interior-grade lumber (hardwood flooring, trim, cabinet lumber) to the room environment where it will be installed for at least 48-72 hours before installation. The room should be at normal living temperature (65-75 degrees F) and humidity (35-55%). Open the packaging and spread boards out with spacers for airflow. Skipping acclimation is the most common cause of hardwood floor gaps and trim joints opening up after installation. (6) Never store lumber directly on concrete without a moisture barrier (6-mil polyethylene sheet) between the concrete and the wood. Concrete is porous and continuously releases moisture that will wick into the bottom boards. (7) For valuable hardwood for furniture projects, store indoors in the shop, stickered, and preferably in the same room where you will work it. Hardwood that moves after jointing and planing will ruin a furniture project.',
      },
      {
        question: 'What does "dimensional lumber" mean and what sizes are available?',
        answer: 'Dimensional lumber refers to softwood lumber (typically pine, spruce, fir, or hemlock -- collectively called SPF, or Southern Yellow Pine) cut to standardized cross-sectional dimensions (2x4, 2x6, 2x8, etc.) and sold in standard lengths. The "nominal" sizes are in 2-inch increments: 2x2, 2x3, 2x4, 2x6, 2x8, 2x10, 2x12 (and less commonly 2x14). The actual dimensions are 0.5 inches less in thickness and 0.5 to 0.75 inches less in width. Common lengths: 6, 8, 10, 12, 14, 16, 18, 20, 22, and 24 ft in 2-foot increments. Pre-cut studs are available in 92-5/8 inches (for standard 8 ft walls) and 104-5/8 inches (for 9 ft walls) to account for the thickness of the double top plate and single bottom plate (3 plates x 1.5 inches = 4.5 inches, so 96 - 4.5 + 1.125 = 92.625 inches for the stud plus some room for variation). Dimensional lumber is typically Spruce-Pine-Fir (SPF) in the northern US and Canada, or Southern Yellow Pine (SYP) in the southeastern US. SPF is lighter and easier to work but less strong; SYP is denser, stronger, and harder to drive nails into, but better for structural applications. Douglas Fir is common in the western US and is prized for its strength-to-weight ratio. For engineered lumber alternatives: LVL (Laminated Veneer Lumber) is used for beams and headers where dimensional lumber is not strong enough; PSL (Parallel Strand Lumber) for posts and columns; and I-joists (TJI) for floor joists that span longer distances than dimensional lumber can at the same depth. I-joists consist of a top and bottom flange (typically LVL or solid sawn lumber) connected by an OSB (oriented strand board) web, creating a lightweight and dimensionally stable joist that can span up to 32 ft.',
      },
      {
        question: 'How do I calculate board feet for irregular or rough-sawn hardwood?',
        answer: 'Hardwood at specialty lumberyards is sold differently from construction lumber. The boards are typically random widths and random lengths, and you select individual boards from a rack. The lumberyard measures each board and charges by the board foot based on the actual measured dimensions (not nominal). For rough-sawn hardwood (the wood as it comes off the sawmill, with a rough texture), the yard measures the actual thickness and width and calculates board feet from those rough dimensions. You then lose approximately 1/8 to 1/4 inch per face when you plane and joint the board to a smooth, flat surface at home. For surfaced hardwood (S2S = surfaced two sides, meaning the faces are planed smooth but the edges are rough; S4S = surfaced four sides, all faces smooth), the yard measures from the surfaced dimensions. A common hardwood retail practice: a board labeled "4/4" (spoken as "four-quarter") means it is 1 inch thick rough-sawn and will finish to approximately 3/4 inch after planing. "5/4" ("five-quarter") is 1-1/4 inches rough, finishing to about 1 inch. "6/4" is 1-1/2 inches rough, finishing to about 1-1/4 inches. "8/4" is 2 inches rough, finishing to about 1-3/4 inches. Hardwood widths vary from about 4 inches to 12+ inches, and wider boards command premium prices (a 12-inch wide walnut board costs significantly more per board foot than a 6-inch wide board because wide, clear boards are rarer). When calculating board feet for hardwood with random widths and lengths, measure each board individually: board feet = (thickness in inches x width in inches x length in feet) / 12. Sum the board feet for all boards, then multiply by the per-board-foot price. Always buy 20-30% more hardwood than your project plans call for -- you will lose material to planing, jointing, cutting around defects, and saw kerf waste. The offcuts from high-quality hardwood are valuable for small projects like cutting boards, jewelry boxes, and shop jigs.',
      },
      {
        question: 'What is the difference between softwood and hardwood, and when should I use each?',
        answer: 'The terms softwood and hardwood are botanical distinctions based on tree type, not actual wood hardness. Softwoods come from coniferous (cone-bearing) trees like pine, spruce, fir, cedar, and redwood. Hardwoods come from deciduous (leaf-shedding) trees like oak, maple, walnut, cherry, and mahogany. However, balsa wood (used for model airplanes) is botanically a hardwood despite being one of the softest woods available, while Southern Yellow Pine (a softwood) is harder than some hardwoods like poplar. For construction (framing, joists, rafters, sheathing): use softwood dimensional lumber (SPF or SYP). It is strong, abundant, and affordable. Most building codes specify visually graded softwood for structural framing. For decking: use pressure-treated Southern Yellow Pine (the green stuff, most economical), cedar (natural rot resistance, more expensive), redwood (even more expensive but beautiful), or tropical hardwood like Ipe (extremely dense and durable but hard on tools and very expensive at $8-$15 per board foot). For furniture: use hardwoods. Oak is the workhorse of furniture making -- strong, widely available, moderately priced ($3-$7/bf for red oak, $5-$10/bf for white oak), and takes stain well. Maple is harder than oak, very pale in color, excellent for butcher blocks, cutting boards, and painted furniture ($4-$8/bf). Walnut is the premium choice -- rich dark brown, easy to work with hand tools, expensive ($8-$18/bf depending on width and figure). Cherry is medium-hard, reddish-brown that darkens beautifully with age, prized for fine furniture ($5-$12/bf). For trim and molding: use softwoods (pine for painted trim, clear pine or poplar for stained trim) or MDF (medium-density fiberboard) for painted trim where cost is a concern. Poplar paints beautifully (smooth, minimal grain) and is cheaper than pine for painted applications ($2-$4/bf). For outdoor projects like garden beds and fences: use cedar or pressure-treated pine. Cedar is naturally rot-resistant without chemicals and has a pleasant aroma, but costs 2-3x more than PT pine. For ground-contact posts in fences and decks, pressure-treated lumber rated for ground contact (marked "UC4A" or "UC4B" per AWPA standards) is required by code and will last 20-30 years in soil.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Framing a 12x16 ft Deck in Portland, OR',
        inputs: { thickness: '2', width: '8', length: '16', quantity: '8', pricePerBdFt: '1.85' },
        result: 'Total 170.67 bd ft. At $1.85/bf: $315.74 for joists. Full framing ~400 bd ft (~$740).',
        insight: 'A deck frame using 2x8 pressure-treated Southern Yellow Pine joists spanning 16 ft. Eight joists at 16 ft each. Board feet per joist: (2 x 8 x 16) / 12 = 21.33 bd ft. Total board feet: 21.33 x 8 = 170.67 bd ft. Total linear feet: 16 x 8 = 128 ft. At $1.85/bf for pressure-treated SYP 2x8 (typical 2025 pricing in Portland): 170.67 x $1.85 = $315.74 for the joists. Adding the ledger board, rim joists, and blocking brings total framing lumber needs to approximately 400 board feet or roughly $740. In Portland, deck lumber must be pressure-treated for ground contact (UC4A or UC4B) for any wood within 6 inches of soil. The rainy climate means all deck fasteners should be hot-dipped galvanized or stainless steel -- standard electroplated screws will rust within 2-3 years. For the deck boards themselves, budget additional material: a 12x16 deck with 5/4 x 6 inch deck boards needs approximately 28 boards at 16 ft each = about 280 board feet for the decking alone. Total project lumber: framing (400 bf) + decking (280 bf) + railing posts and balusters (~150 bf) = approximately 830 board feet.',
      },
      {
        scenario: 'Building a Walnut Dining Table in Chicago, IL',
        inputs: { thickness: '1', width: '8', length: '10', quantity: '6', pricePerBdFt: '12.00' },
        result: '40.0 bd ft rough. At $12/bf: $480 for tabletop lumber. 27.2 bd ft finished after surfacing.',
        insight: 'A hardwood dining table from 4/4 (1-inch rough) black walnut, surfaced to 3/4 inch finished thickness. The tabletop needs six boards, each approximately 8 inches wide by 10 ft long. Board feet per board (rough dimensions): (1 x 8 x 10) / 12 = 6.67 bd ft. Total rough board feet: 6.67 x 6 = 40.0 bd ft. At $12/bf for FAS black walnut at a Chicago hardwood dealer (Owl Hardwood or similar): 40.0 x $12 = $480 for the tabletop lumber. Actual finished dimensions after jointing and planing: 0.75 x 7.25 x 10 ft = 4.53 bd ft per board, 27.2 bd ft total finished. The 40 board feet of rough lumber yields only about 27 board feet of finished lumber -- a 32% loss to planing, jointing, cutting off checks at board ends, and removing sapwood edges. For the table base, budget an additional 15-20 board feet of 8/4 walnut at $14-$16/bf. Total hardwood cost for the complete table: approximately $700-$900 in lumber alone. Chicago\'s seasonal humidity swings mean you must account for wood movement in the table design -- use figure-8 fasteners or Z-clips to attach the tabletop to the base.',
      },
      {
        scenario: 'Building Raised Garden Beds in Atlanta, GA',
        inputs: { thickness: '2', width: '12', length: '12', quantity: '4', pricePerBdFt: '0.95' },
        result: '96 bd ft with 4 boards ($91.20). More accurate: 192 bd ft with 8 boards ($182.40).',
        insight: 'Three raised garden beds, each 4x8 ft, using 2x12 untreated pine (do not use pressure-treated lumber for vegetable gardens -- the copper-based preservatives can leach into soil). Each bed needs two 8 ft sides and two 4 ft ends, total 24 linear feet of 2x12 per bed. Three beds = 72 linear feet. With 12 ft boards: 72 / 12 = 6 boards, plus 2 extra for corner posts and reinforcement = 8 boards total. Board feet per board: (2 x 12 x 12) / 12 = 24 bd ft. At $0.95/bf for untreated Southern Yellow Pine 2x12 in Atlanta: $91.20 for 4 boards, $182.40 for 8 boards. In Atlanta\'s hot, humid climate (zone 7b/8a), untreated pine raised beds will last approximately 3-5 years before rotting. For longer life (10-15 years), use naturally rot-resistant cedar or redwood at 3-4x the cost. Do NOT use pressure-treated lumber for vegetable gardens -- even modern copper-based treatments can leach small amounts of copper into soil. Cedar 2x12 in Atlanta runs about $4-5/bf, making the same three beds cost roughly $768-$960 in cedar versus $182 in untreated pine -- the cedar will last 3-4x longer, making the annualized cost roughly equivalent.',
      },
    ],
    proTips: [
      'Check the grade stamp on every board before loading it onto your cart. The stamp tells you the species (SPF, SYP, DF, etc.), grade (No. 1, No. 2, Stud, etc.), moisture content (KD = kiln-dried, S-GRN = surfaced green/unseasoned, KD-HT = kiln-dried heat-treated for export), and the mill identification number. Look for KD (kiln-dried) lumber for interior projects -- green (unseasoned) lumber will shrink and warp significantly as it dries. KD19 means the lumber was dried to 19% moisture content or less, which is standard for construction lumber. For furniture-grade hardwood, look for KD to 6-8% moisture content.',
      'When selecting boards at the lumberyard, sight down the length of each board like you are aiming a rifle. This reveals bows (curvature along the face), crooks (curvature along the edge), twists (spiral warping), and cups (curvature across the width). Reject any board with more than 1/4 inch of twist or bow over an 8 ft length. For structural framing, minor bows can be straightened when the board is nailed in place (the "crown" goes up for joists and rafters so gravity and load flatten it). For visible trim and furniture, only accept straight, flat boards. This takes extra time at the lumberyard but saves hours of frustration on the job site.',
      'For pressure-treated lumber, use hot-dipped galvanized fasteners (not electroplated) or stainless steel. The copper-based preservatives in modern PT lumber (ACQ -- Alkaline Copper Quaternary, or CA -- Copper Azole) are corrosive to standard steel fasteners and will cause them to rust through within 2-3 years. Look for fasteners labeled "ACQ-approved" or "for use with treated lumber." Stainless steel (304 or 316 grade) is required for coastal environments within 3 miles of salt water. Also, PT lumber is typically sold wet from the treatment process -- expect it to be heavy, wet to the touch, and have a greenish tint. As it dries over several weeks, it will shrink and may twist, so use it promptly after purchase or sticker it for drying.',
      'Dimensional lumber lengths follow a standard pattern: from 6 ft to 16 ft, boards come in 2-foot increments (6, 8, 10, 12, 14, 16). Boards 18 ft and longer are special-order at most home centers and significantly more expensive per board foot due to the rarity of trees that yield long, straight, clear logs. Pre-cut studs (92-5/8 inches) are cheaper per board than buying 8 ft boards and cutting them down because studs are graded specifically for vertical load-bearing and can come from smaller logs. When your project plan calls for specific lengths, calculate whether longer or shorter boards minimize waste. For example, if you need 18 pieces at 4 ft each, buy nine 8 ft boards (1 cut each, zero waste) or six 12 ft boards (2 cuts each, zero waste) -- the 12 ft option requires fewer boards to handle but more cuts.',
      'When calculating board feet for a framing takeoff (material quantity list), add 10% for cut-off waste and defects for construction-grade lumber, and 15-20% for hardwood where you are cutting around knots and defects for clear pieces. For pressure-treated deck framing, add 15% because PT lumber tends to have more defects (wane, large knots, splits at ends) than kiln-dried framing lumber. Keep cut-off pieces longer than 16 inches -- they are useful for blocking between joists, fire blocking in walls, and bracing. Pieces shorter than 16 inches are typically scrap unless you have a specific use for them (shims, stakes, etc.).',
      'Buying lumber by the unit (full bundle/pallet) rather than individual boards typically saves 10-20% at real lumberyards. A full unit of 2x4x8 contains approximately 294 boards (about 1,568 board feet). This is more than most DIY projects need, but for large projects like framing a garage, finishing a basement, or building a deck, buying by the unit can save hundreds of dollars. Most lumberyards will deliver a full unit for free within their local delivery area. Ask for a quantity discount if you are buying more than 500 board feet -- many yards will knock 5-10% off the per-board price for large orders.',
      'Use the correct nail size for dimensional lumber: for 2x4 framing, use 16d common nails (3-1/2 inches) or 3-inch framing nails in a nail gun. For 2x6 and wider, step up to 16d or 20d nails to ensure adequate penetration. The general rule is that the nail should penetrate at least 1-1/2 times the thickness of the thinner member being fastened. For toenailing (driving nails at an angle through the end of a stud into a plate), use 8d or 10d nails to avoid splitting the wood. For structural connectors (joist hangers, hurricane ties, post bases), use the manufacturer-specified fasteners -- typically 1-1/2 inch Simpson Strong-Drive structural screws or 10d joist hanger nails. Do NOT substitute drywall screws or deck screws for structural connectors; they lack the shear strength and are brittle compared to structural fasteners.',
    ],
    limitations: [
      'This calculator uses nominal dimensions for board foot calculation, consistent with how softwood construction lumber is priced. For hardwood sold at retail lumberyards by actual (measured) dimensions, you must enter the actual dimensions, not nominal. A piece of 4/4 walnut that is actually 0.875 inches thick by 7.25 inches wide by 10 ft long contains (0.875 x 7.25 x 10) / 12 = 5.29 board feet, but if you enter the nominal 1 x 8 x 10, the calculator gives (1 x 8 x 10) / 12 = 6.67 board feet, a 26% over-estimate of the wood volume you are paying for (since hardwood is priced by actual volume).',
      'The actual dimensions shown are approximate for standard surfaced (S4S) softwood dimensional lumber. For rough-sawn lumber, the actual and nominal dimensions are very close (within 1/8 inch). For engineered lumber products (LVL, PSL, LSL, glulam, I-joists), dimensions differ from dimensional lumber and these products are typically sold by the linear foot, not board foot, because they are manufactured products with specific structural properties rather than commodity lumber.',
      'Price estimates are only as accurate as the per-board-foot price entered. Lumber is a commodity with prices that fluctuate weekly based on supply, demand, tariffs, transportation costs, and seasonal factors. The price you see at the store today may differ from what you budgeted last month. Southern Yellow Pine prices typically rise in spring (construction season) and fall in winter. For accurate budgeting, check current prices at your local supplier on the day you plan to purchase. Also, the per-board-foot price for wider and longer boards is typically higher than for standard boards (a 2x12 costs more per board foot than a 2x4 due to the larger, rarer logs required).',
      'The calculator does not account for species-specific weight or structural properties. Different wood species have vastly different strength, stiffness, and density properties. For structural applications (joists, rafters, beams, headers), consult a span table or structural engineer -- the board foot calculator tells you how much wood to buy, not whether it is strong enough for the load. Southern Yellow Pine No. 2 can span significantly farther than SPF No. 2 at the same dimension. For example, a 2x8 SYP No. 2 floor joist at 16-inch spacing can span approximately 12 ft 8 inches, while an SPF No. 2 joist of the same size can span only about 11 ft 9 inches.',
      'Board foot calculations assume rectangular, straight boards. Live-edge slabs (wood slabs with the natural edge of the tree still present, popular for tables and countertops) are measured and priced differently -- typically by the board foot using the widest dimension of the irregular slab, which overstates the usable wood area. Slabs are usually priced at a significant premium (2-5x the per-board-foot price of dimensional lumber from the same species) due to their size, figure, and uniqueness.',
    ],
    quickReference: [
      { label: '1 board foot', value: '144 cubic inches' },
      { label: '2x4 actual size', value: '1.5 x 3.5 inches' },
      { label: '2x6 actual size', value: '1.5 x 5.5 inches' },
      { label: '2x8 actual size', value: '1.5 x 7.25 inches' },
      { label: '2x10 actual size', value: '1.5 x 9.25 inches' },
      { label: '2x12 actual size', value: '1.5 x 11.25 inches' },
      { label: '1x6 actual size', value: '0.75 x 5.5 inches' },
      { label: '4x4 actual size', value: '3.5 x 3.5 inches' },
      { label: '2x4x8 board feet', value: '5.33 bd ft' },
      { label: '2x6x8 board feet', value: '8.00 bd ft' },
      { label: '2x8x8 board feet', value: '10.67 bd ft' },
      { label: 'Pre-cut stud length', value: '92-5/8 inches' },
      { label: 'Softwood framing price', value: '$0.50-2.00/bf' },
      { label: 'Hardwood price range', value: '$3-18/bf' },
      { label: 'Waste allowance (framing)', value: '10%' },
      { label: 'Waste allowance (hardwood)', value: '20-30%' },
    ],
    citations: [
      { source: 'American Wood Council', title: 'Design Tools and Span Tables', url: 'https://www.awc.org/design-tools' },

      { source: 'International Residential Code', title: 'IRC 2021 -- Wood Framing', url: 'https://codes.iccsafe.org/content/IRC2021P4/chapter-6-wall-construction' },
      { source: 'National Hardwood Lumber Association', title: 'NHLA Grading Rules', url: 'https://www.nhla.com/' },
      { source: 'Wikipedia', title: 'Board Foot', url: 'https://en.wikipedia.org/wiki/Board_foot' },
    ],
  },
};

export default lumberConfig;
