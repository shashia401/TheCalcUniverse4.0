import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import WeddingAlcoholPanel from './WeddingAlcoholPanel';
import { BEER_PER_HOUR, COCKTAILS_PER_HOUR, GLASSES_PER_WINE_BOTTLE, SHOTS_PER_LIQUOR_BOTTLE, WINE_PER_HOUR, alcoholPlan } from './weddingMath';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';

const weddingAlcoholConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'guests',
      label: 'Total Guests',
      type: 'number',
      required: true,
      min: 1,
      max: 5000,
      inputMode: 'numeric',
      helpText: 'Total number of guests attending your event',
    },
    {
      id: 'drinkersPct',
      label: 'Drinking Guests %',
      type: 'number',
      defaultValue: '80',
      min: 0,
      max: 100,
      step: 5,
      inputMode: 'numeric',
      helpText: 'Percentage of guests who will drink alcohol. Typical weddings: 75-85%. Daytime events: 50-70%. Dry weddings: 0%.',
    },
    {
      id: 'duration',
      label: 'Event Duration (hours)',
      type: 'number',
      defaultValue: '4',
      min: 1,
      max: 12,
      step: 0.5,
      inputMode: 'decimal',
      helpText: 'How long the event or bar service will last. Count from bar open to bar close, not the entire event.',
    },
    {
      id: 'beerPct',
      label: 'Beer Drinkers %',
      type: 'number',
      defaultValue: '40',
      min: 0,
      max: 100,
      step: 5,
      inputMode: 'numeric',
      helpText: 'Percentage of drinking guests who prefer beer. Younger casual crowds: 50%+. Formal evening: 30%.',
    },
    {
      id: 'winePct',
      label: 'Wine Drinkers %',
      type: 'number',
      defaultValue: '30',
      min: 0,
      max: 100,
      step: 5,
      inputMode: 'numeric',
      helpText: 'Percentage of drinking guests who prefer wine. Formal evening: 40%+. Casual BBQs: 20%.',
    },
    {
      id: 'liquorPct',
      label: 'Cocktail Drinkers %',
      type: 'number',
      defaultValue: '30',
      min: 0,
      max: 100,
      step: 5,
      inputMode: 'numeric',
      helpText: 'Percentage of drinking guests who prefer cocktails. Full open bar: 30-35%. Beer-and-wine only: 0%.',
    },
  ],
  calculate: (values) => {
    const p = alcoholPlan(values);
    if (!p) return [];
    const fmt = (n: number) => Math.max(0, Math.ceil(n - 1e-9)).toLocaleString('en-US');
    const splitOk = Math.abs(p.splitTotal - 100) < 0.5;

    return [
      {
        id: 'drinkingGuests',
        label: 'Drinking Guests',
        value: fmt(p.drinkingGuests),
        color: 'neutral',
        warning: splitOk ? undefined : `The beer, wine and cocktail percentages add up to ${p.splitTotal}%, not 100%. Quantities scale with whatever you entered, so adjust them to total 100% for a sensible plan.`,
      },
      {
        id: 'beerTotal',
        label: 'Beer (cans/bottles)',
        value: fmt(p.beer),
        highlight: true,
        color: 'positive',
        interpretation: 'Rule of thumb, not measured data: 1.5 beers per beer drinker per hour of bar service. Rounded up.',
      },
      {
        id: 'wineBottles',
        label: 'Wine (750ml bottles)',
        value: fmt(p.wineBottles),
        highlight: true,
        color: 'positive',
        interpretation: 'Assumes 1 glass per wine drinker per hour and 5 glasses per 750 ml bottle. Rounded up.',
      },
      { id: 'wineGlasses', label: 'Wine Glasses Served', value: fmt(p.wineGlasses), color: 'neutral' },
      {
        id: 'liquorBottles',
        label: 'Liquor (750ml bottles)',
        value: fmt(p.liquorBottles),
        highlight: true,
        color: 'positive',
        interpretation: 'Assumes 0.75 cocktails per cocktail drinker per hour and 1.5 oz of spirit per cocktail (about 17 per 750 ml bottle). Rounded up; mixers, ice and champagne for a toast are not included.',
      },
      { id: 'liquorDrinks', label: 'Cocktails Served', value: fmt(p.liquorDrinks), color: 'neutral' },
      { id: 'beerPctDisplay', label: 'Beer', value: `${p.beerPct.toFixed(0)}% of alcohol`, color: 'neutral' },
      { id: 'winePctDisplay', label: 'Wine', value: `${p.winePct.toFixed(0)}% of alcohol`, color: 'neutral' },
      { id: 'liquorPctDisplay', label: 'Cocktails', value: `${p.liquorPct.toFixed(0)}% of alcohol`, color: 'neutral' },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(WeddingAlcoholPanel, { values, results });
  },
  explainSteps: (values) => {
    const p = alcoholPlan(values);
    if (!p) return [];
    const results = weddingAlcoholConfig.calculate(values);
    const val = (id: string) => resultValue(results, id) ?? '';
    const n = (x: number) => x.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return finiteSteps([
      {
        label: 'Drinking guests',
        expr: `${n(p.guests)} guests × ${n(p.drinkersPct)}% = ${n(p.drinkingGuests)} (shown rounded up as ${val('drinkingGuests')})`,
        note: results.find((r) => r.id === 'drinkingGuests')?.warning,
      },
      {
        label: 'Beer',
        expr: `${n(p.drinkingGuests)} × ${n(p.beerPct)}% × ${n(p.duration)} h × ${BEER_PER_HOUR} beers/h = ${n(p.beer)} → ${val('beerTotal')}`,
        note: 'Rule of thumb, not measured data; rounded up.',
      },
      {
        label: 'Wine',
        expr: `${n(p.drinkingGuests)} × ${n(p.winePct)}% × ${n(p.duration)} h × ${WINE_PER_HOUR} glass/h = ${n(p.wineGlasses)} glasses; ÷ ${GLASSES_PER_WINE_BOTTLE} per bottle = ${n(p.wineBottles)} → ${val('wineBottles')}`,
        note: 'Rule of thumb, not measured data; rounded up.',
      },
      {
        label: 'Liquor',
        expr: `${n(p.drinkingGuests)} × ${n(p.liquorPct)}% × ${n(p.duration)} h × ${COCKTAILS_PER_HOUR} cocktails/h = ${n(p.liquorDrinks)} cocktails; ÷ ${SHOTS_PER_LIQUOR_BOTTLE} per bottle = ${n(p.liquorBottles)} → ${val('liquorBottles')}`,
        note: 'Rule of thumb, not measured data; rounded up.',
      },
    ]);
  },
  educational: {
    formula: 'Drinking Guests = Total Guests x (Drinkers % / 100) | Beer = Drinking Guests x (Beer % / 100) x Hours x 1.5/hr | Wine (bottles) = (Drinking Guests x Wine % / 100 x Hours x 1.0/hr) / 5 | Liquor (bottles) = (Drinking Guests x Liquor % / 100 x Hours x 0.75/hr) / 17',
    formulaDescription:
      'Total alcohol needed is calculated by determining the number of drinking guests, then estimating consumption per hour per category. The rates used are rules of thumb: 1.5 beers per hour for beer drinkers, 1.0 glasses per hour for wine drinkers and 0.75 cocktails per hour for cocktail drinkers. Wine bottles (750ml) yield 5 glasses each. Liquor bottles (750ml) yield approximately 17 shots (1.5 oz) each.',
    diagram: {
      svg: '<svg viewBox="0 0 440 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Per-Person Drink Estimate (4-Hour Event)</text><!-- Beer --><rect x="20" y="35" width="120" height="55" rx="6" fill="var(--svg-f59e0b)" opacity="0.12" stroke="var(--svg-f59e0b)" stroke-width="2"/><text x="80" y="55" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Beer</text><text x="80" y="70" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" text-anchor="middle">1.5 / hr</text><text x="80" y="84" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">6 beers / 4 hrs</text><!-- Wine --><rect x="160" y="35" width="120" height="55" rx="6" fill="var(--svg-8b5cf6)" opacity="0.12" stroke="var(--svg-8b5cf6)" stroke-width="2"/><text x="220" y="55" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Wine</text><text x="220" y="70" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" text-anchor="middle">1.0 / hr</text><text x="220" y="84" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">4 glasses / 4 hrs</text><text x="220" y="96" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">~1 bottle</text><!-- Liquor --><rect x="300" y="35" width="120" height="55" rx="6" fill="var(--svg-3b82f6)" opacity="0.12" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="360" y="55" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Liquor</text><text x="360" y="70" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" text-anchor="middle">0.75 / hr</text><text x="360" y="84" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">3 drinks / 4 hrs</text><text x="360" y="96" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">~⅙ bottle</text><text x="220" y="120" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">For 100 guests (80% drinkers): ~60 beers, 50 glasses wine (10 bottles), 60 cocktails (4 bottles liquor)</text></svg>',
      alt: 'Breakdown of per-person alcohol consumption rates for beer, wine, and liquor at a 4-hour event',
      caption: 'Beer: 1.5 drinks/hr/person. Wine: 1.0 glasses/hr/person (5 glasses per bottle). Liquor: 0.75 drinks/hr/person (17 shots per 750ml bottle).',
    },
    variables: [
      { symbol: 'Total Guests', name: 'Guest Count', description: 'The total number of guests attending the event.' },
      { symbol: 'Drinking %', name: 'Percentage of Guests Who Drink', description: 'The estimated percentage of guests who will consume alcohol. Typically 75-85% for wedding receptions.' },
      { symbol: 'Duration', name: 'Event Duration', description: 'The length of the event in hours. Count from the start of bar service to the end of the reception.' },
      { symbol: 'Beer/Wine/Liquor %', name: 'Beverage Preference Distribution', description: 'The percentage breakdown of what drinking guests prefer. These should generally add up to 100%.' },
    ],
    workedExamples: [
      {
        scenario: '100-Guest Wedding Reception (4 hours, standard mix)',
        inputs: {
          guests: '100',
          drinkersPct: '80',
          duration: '4',
          beerPct: '40',
          winePct: '30',
          liquorPct: '30',
        },
        result: '80 drinking guests. Stock 192 beers (8 cases), 20 bottles of wine, and 5 bottles of liquor (about 72 cocktails).',
        insight:
          'For a 100-guest wedding with 80% drinkers (80 drinking guests), a 4-hour reception, and a balanced 40/30/30 beer-to-wine-to-spirits split, the calculator recommends approximately 192 beers (8 cases of 24), 20 bottles of wine, and 5 bottles of liquor (about 72 cocktails). This assumes average drinking rates of 1.5 beers/hour, 1.0 wine glasses/hour, and 0.75 cocktails/hour. Add 17-20 bottles of champagne for a toast (not included in the calculator). Most liquor stores accept returns on unopened cases, so rounding up provides a safety margin.',
      },
      {
        scenario: '50-Guest Backyard Summer BBQ (6 hours, beer-heavy)',
        inputs: {
          guests: '50',
          drinkersPct: '90',
          duration: '6',
          beerPct: '60',
          winePct: '15',
          liquorPct: '25',
        },
        result: '45 drinking guests. Stock 243 beers (11 cases), 9 bottles of wine, and 3 bottles of liquor (about 51 cocktails).',
        insight:
          'For a 50-guest summer BBQ with 90% drinkers (45 drinking guests), 6 hours, and a beer-heavy crowd (60% beer), the calculator recommends approximately 243 beers (11 cases of 24), 9 bottles of wine, and 3 bottles of liquor (about 51 cocktails). Hot weather tends to increase beer consumption, so the 1.5 beers/hour rate is reasonable here. The longer duration (6 hours) significantly increases totals compared to a 4-hour event. Stock extra ice, water, and non-alcoholic drinks: about 2-3 per guest for the full 6 hours.',
      },
    ],
    quickReference: [
      { label: 'Beer consumption rate', value: '1.5 drinks per person per hour' },
      { label: 'Wine consumption rate', value: '1.0 glasses per person per hour' },
      { label: 'Liquor consumption rate', value: '0.75 cocktails per person per hour' },
      { label: 'Wine bottle yield', value: '5 glasses per 750ml bottle' },
      { label: 'Liquor bottle yield', value: '17 shots (1.5 oz) per 750ml bottle' },
      { label: 'Champagne bottle yield', value: '5-6 flutes per 750ml bottle' },
      { label: 'Beer per case', value: '24 cans/bottles per standard case' },
    ],
    proTips: [
      'Buy from a liquor store with a return policy — most will accept unopened cases and bottles. Order ~10% more than the estimate and return what you do not open.',
      'If you are serving a signature cocktail, adjust the liquor percentage UP (to 35-40%) because guests gravitate toward the novelty drink, increasing spirit consumption beyond the standard 0.75 drinks/hour rate.',
      'For outdoor summer events, raise beer and white wine somewhat because of the heat; for winter indoor events, raise red wine and whiskey a little.',
      'Do NOT forget the non-alcoholic drinks. Plan 2-3 servings per guest (water, soda, juice). A common mistake is ordering enough alcohol but running out of mixers, ice, and water.',
      'For multi-day events or weddings with a welcome party + reception + farewell brunch, run the calculator separately for each event with the appropriate duration and crowd composition — a rehearsal dinner crowd drinks differently than a reception crowd.',
    ],
    limitations: [
      'These are rule-of-thumb estimates, not measured data. Actual consumption varies significantly with crowd demographics (a young crowd may drink more; a family-heavy crowd with children less), weather (hot days tend to increase beer and light cocktail consumption), food service (heavy food tends to reduce consumption) and bar type (an open bar usually increases consumption compared with a cash bar). The calculator does not account for champagne toasts, welcome drinks, after-party consumption, or vendor meals. It assumes continuous bar service for the full duration — if your bar closes during dinner, reduce the effective duration. Always use these numbers as a starting point and adjust based on your specific crowd and venue policies.',
    ],
    commonUses: [
      'Planning how much beer, wine, and liquor to buy for a wedding reception based on guest count',
      'Adjusting alcohol quantities for a party or event where the drink preferences of the crowd are known',
      'Estimating bar costs before an event by calculating how many total bottles and cases are needed',
      'Determining whether an open bar, beer-and-wine bar, or limited bar fits your event budget and crowd',
    ],
    howToUse: [
      'Enter the total number of guests attending your event.',
      'Adjust the percentage of guests who will drink alcohol (typically 80% for weddings).',
      'Set the event duration in hours (usually 4-6 hours for a wedding reception).',
      'Adjust the drink preference percentages to match your crowd. Beer-heavy crowds may prefer 50%+ beer; wine-centric events may want 50% wine.',
      'View the recommended quantities of beer, wine, and liquor to purchase.',
    ],
    explanation:
      'Planning the right amount of alcohol for a wedding or party is a classic estimation problem: too little and guests go thirsty, too much and you are stuck with hundreds of dollars in unused bottles. The standard industry formula used by event planners accounts for three key factors: the number of drinking guests, the duration of the event, and the consumption rate per hour. This calculator uses simple planning rules of thumb rather than measured data: 1.5 beers, 1 glass of wine or 0.75 cocktails per drinker per hour of bar service. Many planners start from about one drink per drinking guest per hour, so treat these rates as adjustable assumptions. The distribution between beer, wine, and liquor depends heavily on your crowd. A younger, more casual group may lean 50% beer, 25% wine, 25% liquor. A formal evening wedding often shifts toward 30% beer, 40% wine, 30% liquor. For mixed crowds, equal thirds is a safe starting point. Wine is typically sold in 750 ml bottles, each yielding approximately 5 standard glasses. Liquor is also sold in 750 ml bottles, each yielding about 17 standard 1.5 oz shots. Beer is easiest to estimate since each can or bottle is a single serving. Many hosts also include a champagne toast, which adds roughly one additional glass per guest (one 750ml bottle of champagne serves about 5-6 flutes). Remember that these are estimates, and actual consumption varies based on weather (hot days increase drinking), event energy, and whether food is served throughout. When in doubt, many liquor stores accept returns on unopened cases, so buying slightly more than the estimate gives you a comfortable buffer.',
    faqs: [
      {
        question: 'How much champagne do I need for a toast?',
        answer: 'For a champagne toast, plan on one glass per guest. A standard 750 ml bottle of champagne serves 5-6 flutes. For 100 guests, you would need approximately 17-20 bottles of champagne. Some guests may decline the toast, but it is better to have extra. Many caterers include the toast pour in their bar package.',
      },
      {
        question: 'Should I have an open bar or a limited bar?',
        answer: 'An open bar where guests drink freely usually increases consumption compared with a cash bar or ticket system. Many couples opt for beer and wine only with a signature cocktail to control costs while still offering variety, which also reduces the number of different bottles you need to buy.',
      },
      {
        question: 'How many kegs should I get instead of bottles/cans?',
        answer: 'A standard half-barrel keg (15.5 gallons) serves approximately 165 12-oz beers. A quarter-barrel keg (7.75 gallons) serves about 82 beers. A sixth-barrel keg (5.16 gallons) serves about 55 beers. Divide your total beer estimate by these numbers to find the keg count. For 192 beers (as in the 100-guest example), one half-barrel keg (165 beers) plus one case (24 beers) provides a comfortable total. Kegs are cheaper per ounce than bottles/cans but require a tap system and refrigeration. If you are serving craft beer, smaller kegs offer more variety — consider two sixth-barrel kegs of different styles.',
      },
      {
        question: 'What about non-alcoholic beverages?',
        answer: 'Plan for about 2-3 non-alcoholic drinks per guest over a 4-hour reception. This includes water, soda, juice, and coffee. A good rule is 1.5 liters of water per person (including in meals), 2 servings of soda per drinking guest, and 1 cup of coffee per guest if serving with dessert. For the non-drinking guests, have sparkling cider or non-alcoholic champagne options available.',
      },
      {
        question: 'How do weather and season affect alcohol consumption?',
        answer: 'Hot weather tends to increase beer and light cocktail consumption while reducing heavy liquor and red wine. Summer weddings often need somewhat more beer and white wine; adjust the beer and wine percentages to reflect that. Winter weddings see higher demand for red wine, whiskey, and warm cocktails like hot toddies or mulled wine. Outdoor events in warm weather also increase overall hydration needs, so stock extra water and non-alcoholic options.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Wedding Reception', url: 'https://en.wikipedia.org/wiki/Wedding_reception' },

    ],
  },
};

export default weddingAlcoholConfig;
