import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ChocolateToxicityPanel from './ChocolateToxicityPanel';

interface ChocolateTypeInfo {
  label: string;
  theobrominePerGram: number; // mg/g
  caffeinePerGram: number; // mg/g
}

const CHOCOLATE_TYPES: Record<string, ChocolateTypeInfo> = {
  White: { label: 'White Chocolate', theobrominePerGram: 0.01, caffeinePerGram: 0 },
  Milk: { label: 'Milk Chocolate', theobrominePerGram: 2.4, caffeinePerGram: 0.2 },
  Dark: { label: 'Dark Chocolate', theobrominePerGram: 5.5, caffeinePerGram: 0.7 },
  'Cocoa Powder': { label: 'Cocoa Powder', theobrominePerGram: 8.5, caffeinePerGram: 0.3 },
  'Baking Chocolate': { label: 'Baking Chocolate', theobrominePerGram: 14, caffeinePerGram: 1.5 },
};

// Weight conversions
const LB_TO_KG = 2.205;
const OZ_TO_G = 28.3495;

const chocolateConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'dogWeight',
      label: 'Dog Weight',
      type: 'number',
      placeholder: '25',
      min: 0.5,
      max: 300,
      step: 0.5,
      required: true,
      helpText: 'How much does your dog weigh?',
    },
    {
      id: 'weightUnit',
      label: 'Weight Unit',
      type: 'select',
      required: true,
      helpText: 'Choose pounds (lbs) or kilograms (kg) for your dog\'s weight',
      options: [
        { label: 'Pounds (lbs)', value: 'lbs' },
        { label: 'Kilograms (kg)', value: 'kg' },
      ],
    },
    {
      id: 'chocolateType',
      label: 'Type of Chocolate',
      type: 'select',
      required: true,
      helpText: 'Different chocolates have vastly different theobromine levels — baking chocolate is most dangerous',
      options: [
        { label: 'White Chocolate', value: 'White' },
        { label: 'Milk Chocolate', value: 'Milk' },
        { label: 'Dark Chocolate', value: 'Dark' },
        { label: 'Cocoa Powder', value: 'Cocoa Powder' },
        { label: 'Baking Chocolate', value: 'Baking Chocolate' },
      ],
    },
    {
      id: 'amountEaten',
      label: 'Amount Eaten',
      type: 'number',
      placeholder: '50',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'How much chocolate did the dog eat?',
    },
    {
      id: 'amountUnit',
      label: 'Amount Unit',
      type: 'select',
      required: true,
      helpText: 'Measure the chocolate amount in grams (g) or ounces (oz)',
      options: [
        { label: 'Grams (g)', value: 'g' },
        { label: 'Ounces (oz)', value: 'oz' },
      ],
    },
  ],
  calculate: (values) => {
    const dogWeight = parseFloat(values.dogWeight);
    const weightUnit = values.weightUnit || 'lbs';
    const chocolateType = values.chocolateType || 'Milk';
    const amountEaten = parseFloat(values.amountEaten);
    const amountUnit = values.amountUnit || 'g';

    if (isNaN(dogWeight) || isNaN(amountEaten) || dogWeight <= 0 || amountEaten <= 0) return [];

    const typeInfo = CHOCOLATE_TYPES[chocolateType] || CHOCOLATE_TYPES.Milk;

    // Convert weight to kg
    const dogWeightKg = weightUnit === 'lbs' ? dogWeight / LB_TO_KG : dogWeight;
    const dogWeightLbs = weightUnit === 'lbs' ? dogWeight : dogWeight * LB_TO_KG;

    // Convert amount to grams
    const amountGrams = amountUnit === 'oz' ? amountEaten * OZ_TO_G : amountEaten;

    // Calculate total methylxanthines
    const theobromineMg = typeInfo.theobrominePerGram * amountGrams;
    const caffeineMg = typeInfo.caffeinePerGram * amountGrams;
    const totalMethylxanthines = theobromineMg + caffeineMg;
    const mgPerKg = dogWeightKg > 0 ? totalMethylxanthines / dogWeightKg : 0;

    // Severity
    let severity: string;
    let severityColor: string;
    if (mgPerKg >= 60) {
      severity = 'EMERGENCY — Immediate veterinary attention required!';
      severityColor = 'red';
    } else if (mgPerKg >= 40) {
      severity = 'SERIOUS — Call your veterinarian now!';
      severityColor = 'red';
    } else if (mgPerKg >= 20) {
      severity = 'MILD TOXICITY — Monitor closely and call your vet for advice.';
      severityColor = 'yellow';
    } else {
      severity = 'LOW RISK — Unlikely to cause toxicity, but monitor for symptoms.';
      severityColor = 'green';
    }

    // Thresholds
    const vomitingThreshold = 20 * dogWeightKg;
    const seizureThreshold = 60 * dogWeightKg;

    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 1 });

    return [
      { id: 'severity', label: 'Toxicity Level', value: severity, highlight: true, color: severityColor === 'red' ? 'negative' : severityColor === 'yellow' ? 'neutral' : 'positive', interpretation: `This estimates toxicity from theobromine and caffeine at ${mgPerKg.toFixed(1)} mg/kg of body weight — darker, more concentrated chocolate (baking chocolate, cocoa powder) is far more dangerous per ounce than milk chocolate. This tool is not a substitute for veterinary advice; if you're at all unsure, call your vet or the ASPCA Poison Control line below rather than waiting to see symptoms.` },
      { id: 'severityColor', label: 'Severity Color', value: severityColor },
      { id: 'theobromineMg', label: 'Theobromine Consumed', value: `${fmt(theobromineMg)} mg`, color: 'neutral' },
      { id: 'caffeineMg', label: 'Caffeine Consumed', value: `${fmt(caffeineMg)} mg`, color: 'neutral' },
      { id: 'totalMethylxanthines', label: 'Total Methylxanthines', value: `${fmt(totalMethylxanthines)} mg`, highlight: true, color: 'neutral' },
      { id: 'mgPerKg', label: 'Methylxanthines per kg', value: `${fmt(mgPerKg)} mg/kg`, highlight: true },
      { id: 'dogWeightKg', label: 'Dog Weight (kg)', value: `${fmt(dogWeightKg)} kg` },
      { id: 'dogWeightLbs', label: 'Dog Weight (lbs)', value: `${fmt(dogWeightLbs)} lbs` },
      { id: 'vetPhone', label: 'ASPCA Poison Control', value: '(888) 426-4435', highlight: true },
      { id: 'vomitingThreshold', label: 'Vomiting Threshold', value: `${fmt(vomitingThreshold)} mg` },
      { id: 'seizureThreshold', label: 'Seizure Threshold', value: `${fmt(seizureThreshold)} mg` },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ChocolateToxicityPanel, { values, results });
  },
  educational: {
    formula: 'Methylxanthines = (Theobromine × Amount) + (Caffeine × Amount)  |  mg/kg = Total ÷ Dog Weight (kg)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Chocolate Toxicity (mg/kg)</text><rect x="30" y="65" width="380" height="40" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="65" width="95" height="40" rx="4" fill="var(--svg-22c55e)" opacity=".4"/><text x="77" y="90" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-22c55e)">Low &lt; 20</text><rect x="125" y="65" width="95" height="40" fill="var(--svg-f59e0b)" opacity=".4"/><text x="172" y="90" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-f59e0b)">Mild 20-39</text><rect x="220" y="65" width="95" height="40" fill="var(--svg-ef4444)" opacity=".4"/><text x="267" y="90" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ef4444)">Serious 40-59</text><rect x="315" y="65" width="95" height="40" rx="4" fill="var(--svg-8b5cf6)" opacity=".4"/><text x="362" y="90" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-8b5cf6)">Emergency 60+</text><text x="220" y="145" text-anchor="middle" font-size="11" fill="var(--svg-8b5cf6)">Dark &amp; baking chocolate most dangerous</text></svg>',
      alt: 'Four-segment toxicity scale for chocolate in dogs: Low under 20, Mild 20-39, Serious 40-59, Emergency 60+ mg/kg',
      caption: 'Dark and baking chocolate contain the highest theobromine levels and are most dangerous to dogs',
    },
    formulaDescription:
      'Chocolate toxicity is determined by the total methylxanthines (theobromine + caffeine) consumed per kilogram of the dog\'s body weight. Different chocolate types contain vastly different amounts of theobromine, with baking chocolate being the most dangerous.',
    variables: [
      { symbol: 'Theobromine', name: 'Theobromine Content', description: 'The primary toxic compound in chocolate. Dark and baking chocolate have the highest levels.' },
      { symbol: 'Caffeine', name: 'Caffeine Content', description: 'A secondary stimulant that adds to toxicity. Present in smaller amounts than theobromine.' },
      { symbol: 'mg/kg', name: 'Milligrams per Kilogram', description: 'The dose of methylxanthines relative to the dog\'s weight. This determines toxicity severity.' },
      { symbol: '20 mg/kg', name: 'Mild Toxicity Threshold', description: 'At this level, dogs may experience vomiting, diarrhea, and restlessness.' },
      { symbol: '40 mg/kg', name: 'Serious Toxicity Threshold', description: 'Cardiac effects, tremors, and hyperthermia may occur.' },
      { symbol: '60 mg/kg', name: 'Emergency Threshold', description: 'Seizures, coma, and potentially fatal cardiac arrhythmias.' },
    ],
    howToUse: [
      'Enter your dog\'s weight and select the unit (lbs or kg).',
      'Select the type of chocolate your dog ate.',
      'Enter the amount eaten and select the unit (grams or ounces).',
      'Review the toxicity level and severity indicator.',
      'Call your veterinarian or ASPCA Poison Control immediately if the result shows Yellow or Red.',
    ],
    explanation:
      'Chocolate is toxic to dogs because it contains methylxanthines (theobromine and caffeine), compounds that dogs cannot metabolize efficiently. The severity of poisoning depends on the type of chocolate, the amount consumed, and the dog\'s weight. Baking chocolate and dark chocolate are the most dangerous because they contain the highest concentrations of theobromine at 14 mg/g and 5.5 mg/g, respectively. White chocolate has very low levels (0.01 mg/g) and rarely causes toxicity, though the fat and sugar can still cause gastrointestinal upset. The half-life of theobromine in dogs is 17.5 hours — much longer than in humans (6-10 hours) — meaning the toxic compounds stay in the dog\'s system much longer and accumulate to dangerous levels more easily. Symptoms of chocolate poisoning include vomiting, diarrhea, restlessness, increased heart rate, muscle tremors, seizures, and in severe cases, death. Symptoms typically appear within 6-12 hours of ingestion and can last up to 72 hours. Dogs with pre-existing heart conditions, epilepsy, or kidney disease are at higher risk even at lower doses. Small breeds are disproportionately affected because a tiny amount of dark chocolate can exceed the toxicity threshold — a 10 lb dog eating just 1 oz of dark chocolate (roughly two squares of a dark chocolate bar) may reach the mild toxicity threshold. If your dog has eaten chocolate, contact your veterinarian or the ASPCA Animal Poison Control Center immediately at (888) 426-4435. Do not induce vomiting unless specifically instructed by a veterinary professional, as this can cause additional complications.',
    faqs: [
      {
        question: 'What should I do if my dog eats chocolate?',
        answer: 'Stay calm and calculate the toxicity using this tool. If the result shows Yellow (mild) or Red (serious/emergency), call your veterinarian or the ASPCA Poison Control Center at (888) 426-4435 immediately. Have the chocolate wrapper and estimated amount eaten ready. Do not induce vomiting unless instructed by a veterinarian.',
      },
      {
        question: 'How much chocolate is dangerous for my dog?',
        answer: 'It depends on the type and your dog\'s weight. As a rule of thumb, 20 mg of methylxanthines per kg of body weight is the threshold for mild symptoms. For a 25 lb (11.3 kg) dog, that\'s about 1 oz of milk chocolate or just 0.2 oz of baking chocolate. Always use this calculator for an accurate assessment.',
      },
      {
        question: 'What are the symptoms of chocolate poisoning?',
        answer: 'Mild: vomiting, diarrhea, increased thirst, restlessness. Moderate: hyperactivity, rapid heart rate, high blood pressure, muscle tremors. Severe: seizures, irregular heart rhythm, hyperthermia, coma, potentially death. Symptoms typically appear within 6-12 hours of ingestion and can last up to 72 hours.',
      },
      {
        question: 'Is white chocolate dangerous for dogs?',
        answer: 'White chocolate contains very little theobromine (0.01 mg/g) and no caffeine, making it unlikely to cause methylxanthine toxicity. However, the high fat and sugar content can still cause gastrointestinal upset (vomiting, diarrhea, pancreatitis). It is not recommended but rarely life-threatening.',
      },
      {
        question: 'Can dogs eat carob as a chocolate substitute?',
        answer: 'Yes! Carob is naturally sweet and chocolate-like but contains no theobromine or caffeine. It is completely safe for dogs and is often used in dog-friendly treats. Many pet stores sell carob-based "chocolate" treats for dogs.',
      },
    ],
    commonUses: [
      'Emergency pet care — assess whether a dog needs immediate veterinary attention after eating chocolate based on chocolate type, amount eaten, and dog weight',
      'Pet owner education — learn which chocolate types are most dangerous (baking > dark > milk > white) and the methylxanthine dose thresholds for toxicity symptoms',
      'Veterinary triage support — provide an initial mg/kg estimate to help pet owners communicate severity to their veterinarian or poison control',
      'Household safety planning — understand the relative danger of different chocolate types to prevent accidental ingestion and store chocolate safely away from pets'
    ],
  
    citations: [
      { source: 'ASPCA - Chocolate Toxicity', url: 'https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/chocolate' },
      { source: 'Merck Veterinary Manual', url: 'https://www.merckvetmanual.com/toxicology/food-hazards/theobromine-poisoning' },
    ],
  },
};

export default chocolateConfig;
