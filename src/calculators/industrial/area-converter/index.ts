import { createConverter, type UnitDef } from '../unit-converter';
import { FT_M, IN_M, MI_M, YD_M } from '../../../utils/unitConvert';

export const UNITS: UnitDef[] = [
  { value: 'mm2', label: 'Square Millimeter (mm²)', shortLabel: 'mm²', factor: 1e-6 },
  { value: 'cm2', label: 'Square Centimeter (cm²)', shortLabel: 'cm²', factor: 1e-4 },
  { value: 'm2', label: 'Square Meter (m²)', shortLabel: 'm²', factor: 1 },
  { value: 'ha', label: 'Hectare (ha)', shortLabel: 'ha', factor: 1e4 },
  { value: 'km2', label: 'Square Kilometer (km²)', shortLabel: 'km²', factor: 1e6 },
  { value: 'in2', label: 'Square Inch (in²)', shortLabel: 'in²', factor: IN_M ** 2 },
  { value: 'ft2', label: 'Square Foot (ft²)', shortLabel: 'ft²', factor: FT_M ** 2 },
  { value: 'yd2', label: 'Square Yard (yd²)', shortLabel: 'yd²', factor: YD_M ** 2 },
  { value: 'ac', label: 'Acre (ac, international)', shortLabel: 'ac', factor: 43560 * FT_M ** 2 },
  { value: 'mi2', label: 'Square Mile (mi²)', shortLabel: 'mi²', factor: MI_M ** 2 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Area conversion uses linear scaling factors relative to the square meter, the SI unit of area. Each unit has a fixed conversion factor to square meters. To convert from unit A to unit B, multiply the input value by the ratio of the two factors.',
  formulaSource: 'The square meter (m²) was adopted by the CGPM in 1960 as the SI derived unit of area. The acre was standardized in medieval England around 1300 (Statute for Measuring Land, attributed to Edward I or II) as 4 rods × 40 rods (66 ft × 660 ft = 43,560 ft²). The hectare was introduced in France in 1795 as part of the metric system as 100 ares, where 1 are = 100 m². The international foot (1959) fixed the relationship 1 ft = 0.3048 m exactly, thereby fixing 1 ft² = 0.09290304 m² and all derived area units. The square mile (1 mi² = 640 acres) was fundamental to the US Public Land Survey System (PLSS) established by the Land Ordinance of 1785.',
  variables: [
    { symbol: 'm²', name: 'Square Meter', description: 'The SI unit of area. The area of a square measuring one meter on each side. Used worldwide for room sizes, construction, and land measurement. A typical parking space is about 12.5 m² (2.5 m × 5 m).' },
    { symbol: 'ft²', name: 'Square Foot', description: 'The US customary unit of area. The area of a square measuring one foot on each side (144 in²). Used for real estate, construction, and HVAC in the US. A typical American house is 1,500-2,500 ft².' },
    { symbol: 'ac', name: 'Acre', description: 'The traditional US/UK land unit: exactly 43,560 ft² = 4,046.8564 m² = 0.40468564 ha (the international acre; the old US survey acre is about 2 ppm larger). Originally the area a yoke of oxen could plow in one day. Still used for US real estate, agriculture, and land surveying.' },
    { symbol: 'ha', name: 'Hectare', description: 'The metric land unit: exactly 10,000 m² = 100 m × 100 m = 2.471 acres. Used worldwide for agriculture, forestry, and land management. Roughly the size of a rugby pitch or international soccer field.' },
    { symbol: 'km²', name: 'Square Kilometer', description: 'One million square meters (1,000 m × 1,000 m). Used for city sizes, national parks, and country areas. Manhattan is 59.1 km². The smallest country, Vatican City, is 0.44 km².' },
    { symbol: 'mi²', name: 'Square Mile', description: 'Exactly 640 acres = 2.59 km². Used for large land areas in the US. A US "township" in the PLSS is 36 mi² (6 mi × 6 mi), divided into 36 sections of 1 mi² each.' },
  ],
  howToUse: [
    'Enter the area value you want to convert in the "Value" field (e.g., 1500 for 1,500 ft² or 10 for 10 hectares).',
    'Select the current area unit from the "From" dropdown — choose from m², ft², acres, hectares, km², mi², and more.',
    'Select the desired area unit from the "To" dropdown — the target unit for your calculation.',
    'The converted value appears instantly with the mathematical formula. Use the quick reference table to verify common area conversions.',
  ],
  quickReference: [
    { label: '1 m²', value: '10.764 ft² / 1,550 in² / 0.0001 ha' },
    { label: '1 ft²', value: '0.0929 m² / 144 in² / 0.00002296 ac' },
    { label: '1 acre', value: '43,560 ft² / 4,047 m² / 0.405 ha / 0.00156 mi²' },
    { label: '1 hectare', value: '10,000 m² / 107,639 ft² / 2.471 ac / 0.01 km²' },
    { label: '1 km²', value: '1,000,000 m² / 247.1 ac / 0.386 mi² / 100 ha' },
    { label: '1 mi²', value: '640 ac / 2.59 km² / 27,878,400 ft²' },
    { label: '1 in²', value: '6.452 cm² / 645.16 mm² / 0.00694 ft²' },
    { label: '1 cm²', value: '0.155 in² / 100 mm² / 0.001076 ft²' },
  ],
  commonUses: [
    'Real estate: converting between m² and ft² for property listings when comparing homes across countries (a 200 m² apartment = ~2,153 ft²)',
    'Construction: calculating floor area, wall area, roofing area, and flooring material quantities in m² or ft² — knowing both units prevents ordering errors with international suppliers',
    'Land measurement: converting between acres, hectares, and square miles for farms, development parcels, and conservation land — USDA reports in acres, FAO uses hectares',
    'Geography: comparing country and city sizes in km² or mi² — Russia is 17.1 million km², the US is 9.83 million km², and the EU is 4.23 million km²',
    'HVAC engineering: sizing heating and cooling systems based on floor area — US Manual J calculations use ft², European standards use m²',
    'Agriculture: crop yield is measured in bushels/acre (US) or tonnes/hectare (metric), requiring both area unit and weight unit conversion for international commodity trading',
  ],
  workedExamples: [
    {
      scenario: 'A family from London is looking at a vacation home listing in Florida. The listing says 2,400 ft². They want to compare it to their London flat, which is 85 m². How big is the Florida house in m², and how does it compare?',
      inputs: { value: '2400', from: 'ft2', to: 'm2' },
      result: '2,400 ft² × 0.092903 = 222.97 m². The Florida house is about 223 m² — roughly 2.6 times larger than their 85 m² London flat. A typical UK 3-bedroom house is 90-110 m², while a typical US 3-bedroom is 1,500-2,000 ft² (139-186 m²). The Florida house at 2,400 ft² is a spacious 4-bedroom family home.',
      insight: 'US real estate listings use ft² exclusively, while UK listings use m² for new builds but often use number of bedrooms as the primary measure for older homes. When comparing international real estate, always convert to the same unit — a "large" apartment means very different things in Tokyo (60 m²) vs. Houston (200 m²).',
    },
    {
      scenario: 'A farmer in Iowa is negotiating to buy an adjacent 80-acre field to expand their corn operation. Their European equipment supplier quotes seeding rates in kg per hectare. The farmer needs to know: how many hectares is 80 acres, and how much total seed is needed at 25 kg/ha?',
      inputs: { value: '80', from: 'ac', to: 'ha' },
      result: '80 acres × 0.404686 = 32.37 hectares. At 25 kg/ha, total seed needed = 32.37 × 25 = 809 kg. In PLSS terminology, 80 acres is two "quarter-quarter sections" (a section = 640 acres, quarter-section = 160 acres, quarter-quarter = 40 acres).',
      insight: 'The US agricultural sector operates in acres but trades commodities globally in metric tonnes per hectare. An Iowa cornfield yielding 200 bushels/acre is roughly 12.6 tonnes/hectare. The acre-to-hectare ratio (1:0.405) is essential for any farmer participating in international grain markets. Most modern combine yield monitors can display both units.',
    },
    {
      scenario: 'A landscape architect in Sydney is designing a public park on a 15-hectare site. The client (a US-based foundation) wants to understand the park size in acres and compare it to famous parks. They also need the irrigation system spec\'d in gallons per ft² for the American contractor.',
      inputs: { value: '15', from: 'ha', to: 'ac' },
      result: '15 ha × 2.471 = 37.07 acres. For reference: Central Park NYC = 843 acres (341 ha), Hyde Park London = 350 acres (142 ha). The 15 ha park at 37 acres is a substantial urban park — roughly 28 football fields (1.32 acres each), a square ~387 m per side, about a 4-minute walk to cross.',
      insight: 'Large parks are typically measured in hectares internationally but in acres in the US and UK. A useful landmark: 100 ha ≈ 247 acres ≈ 0.39 mi². When designing for international stakeholders, provide both units and a relatable comparison (football fields, city blocks, or well-known parks) — area numbers alone are hard to visualize.',
    },
  ],
  proTips: [
    'For real estate comparisons: 1 m² ≈ 10.764 ft². The quick mental math is: m² × 10.76 = ft² (or roughly m² × 11, then subtract 2%). A 100 m² apartment ≈ 1,076 ft². The reverse: ft² ÷ 10.764 = m² (or roughly divide by 11 and add a bit).',
    'When buying land in the US, always convert acres to a recognizable measure: 1 acre = 43,560 ft² — roughly a football field without the end zones (a football field is 57,600 ft² including end zones). An acre is about 209 ft × 209 ft, or a square about 63.6 m per side. A "40-acre" farm is a 1/16 section square roughly 1/4 mile per side.',
    'For roofing estimates: roofers quote in "squares" (1 square = 100 ft² = 9.29 m²). When converting from the house floor area, remember the roof area is larger due to pitch. A 30° roof pitch adds about 15% area. Always get the actual roof dimensions rather than estimating from floor area alone.',
    'When reading international construction specs: US rebar spacing is in inches, concrete volume in cubic yards (1 yd³ = 27 ft³), and formwork in ft². European specs are all metric. A common error is converting the area but forgetting the thickness when computing volume — double-check your dimensional analysis.',
    'For gardens and landscaping: soil, mulch, and gravel are sold by the cubic yard in the US (1 yd³ covers ~100 ft² at 3" depth), but by the cubic meter in metric countries (1 m³ covers ~10 m² at 10 cm depth). The area converter handles the m²↔ft² step, but you will need a separate volume calculation for material quantities.',
    'Use the "acre foot" concept for large-scale water management: 1 acre-foot = the water volume covering 1 acre to a depth of 1 foot = 43,560 ft³ = 325,851 gallons = 1,233.5 m³. This is the standard unit for reservoir capacity, irrigation water rights, and annual water consumption in the Western US.',
  ],
  limitations: [
    'This calculator performs linear unit conversion for area only. It does not calculate the area of irregular shapes — you need survey data or a planimeter for that. For rectangular areas, multiply length × width in consistent units first, then convert the result.',
    'Area unit conversion involves squared conversion factors. When converting linear units to area units: 1 m = 3.28084 ft, but 1 m² = 10.7639 ft² (not 3.28084 ft²). The factor is squared. This calculator handles this correctly through the factor system, but be careful when doing mental conversions — squaring errors are the most common area conversion mistake.',
    'Real estate "area" definitions vary by country and purpose: Gross Floor Area (GFA), Net Internal Area (NIA), Gross Leasable Area (GLA), and living area all measure different things. US listings typically use "finished living area" which excludes garages, basements, and unfinished spaces. European listings may use "usable floor area" which differs from US definitions. This converter handles the units, not the measurement methodology.',
    'For agricultural land, "arable acres" may differ from "total acres" due to ponds, woodlots, buildings, and roads. When converting farm sizes for crop planning, use the actual cultivable area, not the deed acreage. Similarly, land slope means the surface area is larger than the map (planar) area — a 30° slope increases surface area by about 15%.',
    'Square mile and square kilometer conversions at very large scales (state, country) use the same factors but may have rounding differences from official statistics due to coastline paradox effects (coastline length depends on measurement scale). Official country areas from the CIA World Factbook or UN Statistics Division should be used for formal comparisons.',
  ],
  diagram: {
    svg: '<svg viewBox="0 0 480 170" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Area Units Visual Comparison</text>' +
      '<rect x="20" y="35" width="50" height="50" rx="3" fill="var(--svg-3b82f6)" opacity="0.3" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>' +
      '<text x="45" y="65" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-3b82f6)" font-weight="600" text-anchor="middle">1 m²</text>' +
      '<rect x="90" y="35" width="15" height="15" rx="1" fill="var(--svg-ef4444)" opacity="0.3" stroke="var(--svg-ef4444)" stroke-width="1.5"/>' +
      '<text x="97" y="65" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-ef4444)" font-weight="600" text-anchor="middle">1 ft²</text>' +
      '<rect x="130" y="35" width="150" height="50" rx="3" fill="var(--svg-22c55e)" opacity="0.3" stroke="var(--svg-22c55e)" stroke-width="1.5"/>' +
      '<text x="205" y="65" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-22c55e)" font-weight="600" text-anchor="middle">1 Acre (4,047 m² / 43,560 ft²)</text>' +
      '<rect x="20" y="100" width="234" height="40" rx="3" fill="var(--svg-8b5cf6)" opacity="0.3" stroke="var(--svg-8b5cf6)" stroke-width="1.5"/>' +
      '<text x="137" y="126" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-8b5cf6)" font-weight="600" text-anchor="middle">1 Hectare (2.471 ac / 10,000 m²)</text>' +
      '<text x="240" y="160" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">Sizes not to exact scale; acre/hectare are very large units</text>' +
      '</svg>',
    alt: 'Visual comparison of square meter, square foot, acre, and hectare shown as proportional rectangles',
    caption: 'Common land and building area units compared visually. A hectare is roughly 2.5 acres — about the size of an international rugby pitch.',
  },
  explanation:
    'Area measurement is fundamental to real estate, construction, agriculture, and geography. The square meter (m²) is the SI unit of area, defined as the area of a square with sides of one meter. The concept of measuring land area dates back to ancient civilizations: the Egyptians resurveyed fields after each Nile flood, the Romans used the "iugerum" (about 0.25 hectare), and medieval England developed the acre. The acre was originally defined as the area a yoke of oxen could plow in a single day — a practical, if imprecise, measurement. It was later standardized by King Edward I as a rectangle 4 rods (66 ft) wide by 40 rods (660 ft, or 1 furlong) long, totaling 43,560 ft². The hectare (100 m × 100 m = 10,000 m²) was introduced with the metric system in France in 1795. Today, different regions use different units: US real estate uses ft² for buildings and acres for land; UK uses m² for new buildings but acres for land; most of the world uses m² and hectares. The US Public Land Survey System (PLSS), established by Thomas Jefferson in 1785, divided much of the US into a grid of townships (6 mi × 6 mi = 36 mi²), each divided into 36 sections of 1 mi² (640 acres). This grid is visible from airplanes across the Midwest and Western states. For very large areas, square kilometers or square miles are used — Alaska alone is 1.72 million km² (665,000 mi²), making it larger than the next three largest US states combined. Understanding area unit conversions is essential for international property investment, cross-border construction projects, global agriculture, and geographic education.',
  faqs: [
    {
      question: 'How do I quickly convert between square meters and square feet?',
      answer: 'Multiply m² by 10.764 to get ft². Multiply ft² by 0.0929 to get m². For rough mental estimation: 1 m² ≈ 10.8 ft². A 100 m² apartment ≈ 1,076 ft². A 2,000 ft² house ≈ 186 m². Important: do NOT use the same conversion factor as linear feet-to-meters (3.28) — area factors must be squared. The exact factor 10.76391 comes from (1 meter / 0.3048)², as 1 international foot = 0.3048 m exactly since 1959. For land: 1 acre = 4,046.86 m² ≈ 0.405 ha. 1 hectare = 2.471 acres.',
    },
    {
      question: 'Why does the US use acres instead of hectares?',
      answer: 'The acre has been used in English-speaking countries since the Middle Ages. It was standardized as 43,560 ft² around 1300 in the Statute for Measuring Land. The US inherited the acre from British colonial practice and embedded it deeply into the Public Land Survey System of 1785, which divided the western US into townships (36 mi²) and sections (1 mi² = 640 acres). This grid became the basis for all US land ownership, with property deeds referencing aliquot parts of sections (e.g., "the NW quarter of the SE quarter of Section 15"). Changing to hectares would require re-surveying the entire country. The US has not adopted the hectare for land records, and the PLSS legacy makes a change unlikely. The acre persists in US real estate, agriculture (USDA reports), and land management (National Park Service, BLM).',
    },
    {
      question: 'How is area measured for irregular-shaped properties?',
      answer: 'For irregular properties, surveyors use coordinate geometry. The property boundary is surveyed as a series of vertices (corners) with precise GPS or total station measurements, and the area is calculated using the Shoelace formula (also called the surveyor\'s formula). This formula works for any simple polygon: Area = ½ |Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)|. Modern GIS software and CAD programs can also calculate areas from satellite imagery or digital maps. For practical real estate purposes, listings often use approximate rectangular dimensions (e.g., "100 ft × 150 ft lot"), but the legal property description in the deed is based on the surveyed boundary. For curved boundaries, approximations using many short line segments are used.',
    },
    {
      question: 'What is the difference between gross area, net area, and livable area?',
      answer: 'Gross Floor Area (GFA) includes everything within the exterior walls: all rooms, hallways, closets, staircases, wall thicknesses, and mechanical spaces. Net Internal Area (NIA) excludes walls, columns, elevators, and common areas. Living Area (or finished area) excludes garages, basements (unless finished), attics, and unheated spaces. Different countries and purposes use different standards: US residential listings use "finished living area" per ANSI Z765. US commercial uses BOMA standards (Gross Leasable Area). The UK uses RICS standards (Net Internal Area for residential, Gross Internal Area for commercial). Europe uses various national standards, typically "usable floor area" (Wohnfläche in Germany, superficie utile in France). This means the same house can have a different advertised area in different countries even after unit conversion, because the measurement rules differ.',
    },
    {
      question: 'How do acres, hectares and square miles relate?',
      answer: 'Exact relations: 1 international acre = 43,560 ft² = 4,046.8564224 m² (0.40468564 ha); 1 hectare = 10,000 m² = 2.4710538 acres; 1 square mile = 640 acres = 2.5899881 km² = 258.99881 ha; 1 km² = 100 ha = 0.3861022 mi². Because all of them derive from the international foot (0.3048 m exactly), every conversion on this page is exact up to display rounding.',
    },
    {
      question: 'How do I calculate carpet or flooring area from room dimensions?',
      answer: 'Multiply room length × width in consistent units (feet or meters), then sum all rooms. Add 5-10% for waste (cutting and pattern matching). Convert the total to the unit your flooring is sold in: US flooring is sold by the ft² or yd² (1 yd² = 9 ft²), while metric flooring is sold by the m². Example: a 12 ft × 15 ft living room = 180 ft², with 10% waste = 198 ft². In m²: the same room is 3.66 m × 4.57 m = 16.7 m², plus 10% = 18.4 m². For stairs, measure each tread and riser separately — stairs typically add 20-30% to the floor area of the room they connect. Always buy an extra box — dye lots change between production runs.',
    },
  ],
  citations: [

    { source: 'NIST SP 811 Appendix B - Conversion Factors', url: 'https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors' },
    { source: 'RICS - Code of Measuring Practice', url: 'https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/real-estate-standards/code-of-measuring-practice' },
  ],
};

export default createConverter({ units: UNITS, label: 'Area Conversion', quantity: 'area', defaultFrom: 'm2', defaultTo: 'ft2', educational: EDUCATIONAL });
