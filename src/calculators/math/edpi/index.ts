import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { hasAnswer, resultValue } from '../../../utils/explainResults';
import EdpiPanel from './EdpiPanel';
import { parseNonNegative } from '../../../utils/parseNumber';

// Degrees turned per mouse count at in-game sensitivity 1.0 (the game's "yaw"). Everything else follows from it:
// cm/360 = 360 x 2.54 / (DPI x sens x yaw), and two sensitivities feel identical when DPI x sens x yaw matches.
const GAME_YAW: Record<string, number> = {
  'CS:GO': 0.022,
  Valorant: 0.07,
  Overwatch: 0.0066,
  'Apex Legends': 0.022,
  'Rainbow Six Siege': 0.00572957795,
};

/** Sensitivity scale relative to CS:GO = 1 (Valorant = 0.3143, Overwatch = 3.333, R6 = 3.840). */
const GAME_MULTIPLIERS: Record<string, number> = Object.fromEntries(
  Object.entries(GAME_YAW).map(([game, yaw]) => [game, GAME_YAW['CS:GO'] / yaw]),
);

const edpiConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mouseDpi',
      label: 'Mouse DPI',
      type: 'number',
      placeholder: '800',
      min: 1,
      max: 32000,
      step: 50,
      required: true,
      helpText: 'Your mouse dots per inch setting',
    },
    {
      id: 'sensitivity',
      label: 'In-Game Sensitivity',
      type: 'number',
      placeholder: '2.0',
      min: 0.001,
      max: 100,
      step: 0.1,
      required: true,
      helpText: 'Your sensitivity setting in the current game',
    },
    {
      id: 'currentGame',
      label: 'Current Game',
      type: 'select',
      required: true,
      options: [
        { label: 'CS:GO / CS2', value: 'CS:GO' },
        { label: 'Valorant', value: 'Valorant' },
        { label: 'Overwatch 2', value: 'Overwatch' },
        { label: 'Apex Legends', value: 'Apex Legends' },
        { label: 'Rainbow Six Siege', value: 'Rainbow Six Siege' },
      ],
    },
    {
      id: 'targetGame',
      label: 'Convert To (optional)',
      type: 'select',
      options: [
        { label: 'No conversion', value: '' },
        { label: 'CS:GO / CS2', value: 'CS:GO' },
        { label: 'Valorant', value: 'Valorant' },
        { label: 'Overwatch 2', value: 'Overwatch' },
        { label: 'Apex Legends', value: 'Apex Legends' },
        { label: 'Rainbow Six Siege', value: 'Rainbow Six Siege' },
      ],
    },
  ],
  calculate: (values) => {
    const dpi = parseNonNegative(values.mouseDpi, 1e6);
    const sens = parseNonNegative(values.sensitivity, 1e6);
    const currentGame = values.currentGame || 'CS:GO';
    const targetGame = values.targetGame || '';

    if (isNaN(dpi) || isNaN(sens) || dpi <= 0 || sens <= 0) return [];

    const currentMult = GAME_MULTIPLIERS[currentGame] || 1;
    const edpi = dpi * sens;

    // Distance for a full turn, using THIS game's yaw (the old code used the CS value 0.022 for every game, which
    // overstated Valorant's cm/360 by 3.2x and understated Overwatch's by 3.3x).
    const yaw = GAME_YAW[currentGame] ?? GAME_YAW['CS:GO'];
    const cmPer360 = (360 * 2.54) / (dpi * sens * yaw);
    const degPerCm = cmPer360 > 0 ? 360 / cmPer360 : 0;

    // Typical pro-player eDPI bands per game (sensitivity scales differ per engine)
    const PRO_BANDS: Record<string, [number, number]> = {
      'CS:GO': [600, 1200],
      Valorant: [150, 350],
      Overwatch: [3000, 6000],
      'Apex Legends': [1000, 2000],
      'Rainbow Six Siege': [2500, 6000],
    };
    const [proLo, proHi] = PRO_BANDS[currentGame] ?? [600, 1600];
    const band = edpi < proLo ? 'below' : edpi > proHi ? 'above' : 'within';

    const results: CalculatorResult[] = [
      {
        id: 'edpi', label: 'Effective DPI (eDPI)', value: Math.round(edpi).toString(), highlight: true, color: 'positive' as const,
        interpretation: `An eDPI of ${Math.round(edpi)} in ${currentGame} means a full 360° turn takes ${cmPer360.toFixed(1)} cm of mouse movement. That is ${band === 'within' ? `inside the typical pro range for ${currentGame} (${proLo}–${proHi})` : band === 'below' ? `below the typical ${currentGame} pro range (${proLo}–${proHi}) — slower, more precise "arm aiming" that needs desk space` : `above the typical ${currentGame} pro range (${proLo}–${proHi}) — fast wrist aiming that can cost micro-adjustment precision`}. If your aim feels ${band === 'above' ? 'twitchy, try lowering sensitivity ~10–20% and retraining for a week' : 'fine, don’t chase pro settings — consistency beats copying'}.`,
      },
      { id: 'cmPer360', label: `Distance per 360° (${currentGame})`, value: `${cmPer360.toFixed(1)} cm (${(cmPer360 / 2.54).toFixed(1)} in)`, color: 'neutral' as const },
      { id: 'mouseDpi', label: 'Mouse DPI', value: dpi.toString() },
      { id: 'sensitivity', label: `Sensitivity (${currentGame})`, value: sens.toString() },
      {
        id: 'currentSensitivity360',
        label: `360° Sensitivity (${currentGame})`,
        value: `${degPerCm.toFixed(2)} deg/cm`,
        color: 'neutral' as const,
      },
    ];

    if (targetGame && targetGame !== currentGame) {
      const targetMult = GAME_MULTIPLIERS[targetGame] || 1;
      // Each game's multiplier is its sensitivity scale relative to CS:GO=1
      // (e.g. Valorant=0.314 means the same physical aim feel needs a raw
      // sens value ~0.314x as large as CS:GO's). To convert while preserving
      // feel: targetSens * currentMult = sens * targetMult is wrong framing —
      // the correct relation is targetSens = sens * (targetMult / currentMult),
      // confirmed against this file's own workedExamples (1.1 CS:GO -> 0.3454
      // Valorant) and the documented quickReference ("CS -> Valorant: x0.314").
      const targetSens = (sens * targetMult) / currentMult;
      results.push({
        id: 'targetSensitivity',
        label: `Converted Sensitivity (${targetGame})`,
        value: targetSens.toFixed(4),
        color: 'positive' as const,
      });
      results.push({
        id: 'targetGameName',
        label: 'Target Game',
        value: targetGame,
      });
    }

    return results;
  },
  explainSteps: (values) => {
    const rows = edpiConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const dpi = parseNonNegative(values.mouseDpi, 1e6);
    const sens = parseNonNegative(values.sensitivity, 1e6);
    const game = values.currentGame || 'CS:GO';
    const target = values.targetGame || '';
    const yaw = GAME_YAW[game] ?? GAME_YAW['CS:GO'];
    const raw = String(parseFloat((dpi * sens).toPrecision(12)));
    const edpi = resultValue(rows, 'edpi')!;
    const f4 = (n: number) => String(parseFloat(n.toFixed(4)));
    const steps = [
      {
        label: 'eDPI = mouse DPI × in-game sensitivity',
        expr: `${dpi} × ${sens} = ${raw}${raw === edpi ? '' : ` → ${edpi}`}`,
        ...(raw === edpi ? {} : { note: 'The answer is rounded to a whole number.' }),
      },
      {
        label: `Mouse travel for a full 360° turn in ${game}`,
        expr: `360 × 2.54 ÷ (${dpi} × ${sens} × ${yaw}) = ${resultValue(rows, 'cmPer360')}`,
        note: `${yaw} is how many degrees ${game} turns per mouse count at sensitivity 1.`,
      },
      { label: 'Turn speed', expr: `360° ÷ cm per turn = ${resultValue(rows, 'currentSensitivity360')}` },
    ];
    if (target && target !== game) {
      steps.push({
        label: `Match the same feel in ${target}`,
        expr: `${sens} × ${f4(GAME_MULTIPLIERS[target])} ÷ ${f4(GAME_MULTIPLIERS[game])} = ${resultValue(rows, 'targetSensitivity')}`,
        note: 'Each multiplier compares the game yaw with CS:GO (0.022 ÷ yaw).',
      });
    }
    return steps;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(EdpiPanel, { values, results });
  },
  educational: {
    formula: 'eDPI = DPI × Sensitivity  |  Sensₒ = (Sens₁ × Mult₁) ÷ Mult₂',
    formulaDescription:
      'Effective DPI (eDPI) standardizes mouse sensitivity across different DPI settings by multiplying your mouse DPI by your in-game sensitivity. For cross-game conversion, each game has a unique multiplier that accounts for differences in how the game engine interprets sensitivity values.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">eDPI &amp; Cross-Game Conversion</text><rect x="25" y="35" width="90" height="30" rx="5" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="70" y="53" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">Mouse DPI</text><text x="122" y="53" font-size="12" fill="var(--svg-333333)">×</text><rect x="135" y="35" width="90" height="30" rx="5" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="180" y="53" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">Sensitivity</text><text x="232" y="53" font-size="12" fill="var(--svg-333333)">=</text><rect x="245" y="35" width="55" height="30" rx="5" fill="var(--svg-ef4444)" opacity="0.8"/><text x="272" y="53" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)">eDPI</text><line x1="20" y1="75" x2="300" y2="75" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-555555)">Same eDPI = Same Muscle Memory</text><rect x="20" y="105" width="135" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="87" y="121" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">400 DPI × 4.0 = 1600 eDPI</text><rect x="165" y="105" width="135" height="24" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="232" y="121" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">800 DPI × 2.0 = 1600 eDPI</text><line x1="20" y1="139" x2="300" y2="139" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="158" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-555555)">Cross-Game: Sens₂ = (Sens₁ × Mult₁) / Mult₂</text><rect x="15" y="167" width="290" height="28" rx="5" fill="var(--svg-f0f9ff)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="183" text-anchor="middle" font-size="9" fill="var(--svg-555555)">Pro range: 800-1600 eDPI. Low = arm aim, High = wrist</text></svg>',
      alt: 'Formula diagram showing eDPI calculation and cross-game sensitivity conversion',
      caption: 'eDPI = DPI × Sensitivity standardizes cursor speed. Different DPI/sensitivity combinations can produce the same eDPI.',
    },
    variables: [
      { symbol: 'DPI, Sens', name: 'DPI & In-Game Sensitivity', description: 'Mouse DPI is hardware sensitivity. In-game sensitivity is the software multiplier. Together they determine cursor speed.' },
      { symbol: 'eDPI', name: 'Effective DPI', description: 'The product of DPI and sensitivity, providing a standardized measure of cursor speed.' },
      { symbol: 'Game Multiplier', name: 'Game Engine Multiplier', description: 'A conversion factor unique to each game that scales sensitivity for cross-game matching.' },
    ],
    howToUse: [
      'Enter your mouse DPI (usually found in your mouse software or settings).',
      'Enter your in-game sensitivity from your current game.',
      'Select which game you are currently playing.',
      'Optionally select a target game to convert your sensitivity.',
      'Use the eDPI value to match sensitivity across different games and settings.',
    ],
    explanation:
      'eDPI (Effective Dots Per Inch) is the universal standard for comparing mouse sensitivity across different games and DPI settings. By multiplying your mouse DPI by your in-game sensitivity, you get a single number that represents your true cursor speed. Two players with the same eDPI will have the same muscle memory, even if one uses 400 DPI at 4 sensitivity (eDPI = 1600) and the other uses 800 DPI at 2 sensitivity (eDPI = 1600). Cross-game conversion adjusts for the different sensitivity scales each game uses. For example, Valorant uses a more sensitive scale than CS:GO, so a Valorant sensitivity of 0.314 feels equivalent to a CS:GO sensitivity of 1.0. Practical example: if you play CS:GO at 800 DPI with 2.5 sensitivity, your eDPI is 800 × 2.5 = 2000. Dividing by the Valorant multiplier instead of multiplying by it gives 2.5 / 0.314 = 7.96 sensitivity — implausibly high, a sign the formula is inverted. The correct conversion multiplies by the target game\'s multiplier and divides by the current game\'s: Valorant sensitivity = (CS:GO sens × Valorant multiplier) / CS:GO multiplier = (2.5 × 0.3143) / 1 = 0.786. So your Valorant equivalent is 800 DPI at 0.786 sensitivity. Edge cases: raw input vs. mouse acceleration — this calculator assumes raw input with no acceleration. If Windows pointer speed is not at the default (6/11), or if "Enhance pointer precision" is enabled, the effective sensitivity changes unpredictably. For games with separate ADS (aim down sights) sensitivity multipliers, the eDPI changes when scoped. For tracking-heavy games like Overwatch and Apex, a slightly lower eDPI (1200-1600) is common for precise tracking, while for flick-heavy games like Valorant and CS:GO, a higher eDPI (1600-2400) is more typical. Pro players generally range from 400 eDPI (very low, arm aimers) to 3200 eDPI (high, wrist aimers).',
    faqs: [
      {
        question: 'Why does eDPI matter for muscle memory?',
        answer: 'Muscle memory in aim is built around the physical distance your hand moves to achieve a specific rotation in-game. eDPI normalizes this so that regardless of DPI or sensitivity settings, the same hand movement produces the same in-game rotation. Pro players track their eDPI carefully to maintain consistency.',
      },
      {
        question: 'How do I find my mouse DPI?',
        answer: 'Check your mouse manufacturer\'s software (Logitech G Hub, Razer Synapse, SteelSeries GG, etc.). Most gaming mice have on-the-fly DPI adjustment buttons. You can also measure your DPI using online DPI analyzers.',
      },
      {
        question: 'Why does Valorant use a 0.314 multiplier?',
        answer: 'Valorant uses a different sensitivity calculation than Source engine games like CS:GO. The 0.314 multiplier means Valorant sensitivity values are roughly 1/3 of CS:GO values for the same effective feel. This is because Valorant\'s engine interprets sensitivity differently at the code level.',
      },
      {
        question: 'What is a good eDPI for FPS games?',
        answer: 'Most professional FPS players use an eDPI between 800 and 1600. Low eDPI (400-800) gives more precise aiming but requires larger hand movements. High eDPI (1600-3200) allows faster turning but can feel twitchy. Experiment to find what feels comfortable for you.',
      },
      {
        question: 'Is CPI the same as DPI for mouse sensitivity?',
        answer: 'Yes. CPI (counts per inch) is the technically accurate term for what mouse sensors actually measure, while DPI (dots per inch) is the marketing term manufacturers use for the same spec — they describe the identical value and can be entered interchangeably in this calculator. A mouse listed at "800 DPI" reports 800 counts per inch of physical movement. There is no conversion needed between them; if a product page or software shows CPI instead of DPI, use that same number directly as the Mouse DPI input above.',
      },
      {
        question: 'How do I match my sensitivity between different games that are not in this list?',
        answer: 'For games not in the built-in list, you can use the 360-degree turn method. First, measure how many inches or centimeters your mouse moves to perform a full 360-degree turn in your current game at your current settings. In the new game, adjust the sensitivity until a mouse movement of the same distance produces exactly one 360-degree turn. Most Source engine games (Counter-Strike, Team Fortress, Left 4 Dead) use the same sensitivity scale, so the same numeric value gives the same cm/360. Unreal Engine games generally use a different scale and may need the sensitivity multiplied by a conversion factor. For games without raw input support, ensure your Windows mouse settings are consistent (default pointer speed at 6/11, enhance pointer precision disabled). Using a uniform cm/360 measurement across all games is the most reliable method for maintaining consistency. You can verify your cm/360 using online tools by entering your DPI and game sensitivity. For Battle Royale games (Apex, Fortnite, PUBG), consider that ADS (aim down sights) sensitivity is often set separately and should be matched as well.',
      },
    ],
    formulaSource: 'The cm/360 formula uses each game\'s yaw constant, the degrees turned per mouse count at sensitivity 1: 0.022 for CS and Apex (Source engine), 0.07 for Valorant, 0.0066 for Overwatch and 0.00573 for Rainbow Six Siege. Game multipliers are the ratios of those constants to CS\'s 0.022 (Valorant 0.3143, Overwatch 3.333, Rainbow Six Siege 3.840).',
    quickReference: [
      { label: 'CS2 / CS:GO pro range', value: '600–1200 eDPI' },
      { label: 'Valorant pro range', value: '150–350 eDPI' },
      { label: 'Apex Legends pro range', value: '1000–2000 eDPI' },
      { label: 'Overwatch 2 pro range', value: '3000–6000 eDPI' },
      { label: '400 DPI × 2.0 sens', value: '800 eDPI' },
      { label: 'CS → Valorant sens', value: 'multiply by 0.314' },
      { label: 'Valorant → CS sens', value: 'multiply by 3.18' },
      { label: 'CS → Overwatch sens', value: 'multiply by 3.33' },
      { label: 'CS → Apex sens', value: 'same number (both 0.022)' },
      { label: 'CS → Rainbow Six sens', value: 'multiply by 3.84' },
    ],
    workedExamples: [
      {
        scenario: 'A CS2 player at 800 DPI, 1.1 sensitivity switches to Valorant',
        inputs: { mouseDpi: '800', sensitivity: '1.1', currentGame: 'CS:GO', targetGame: 'Valorant' },
        result: 'eDPI 880 → Valorant sensitivity 0.3457',
        insight: 'Multiplying CS sensitivity by 0.314 preserves your exact cm/360 (≈47 cm), so years of muscle memory transfer instantly instead of rebuilding from scratch.',
      },
      {
        scenario: 'Two friends argue whose sensitivity is "faster": 400 DPI × 3.0 vs 1600 DPI × 0.75',
        inputs: { mouseDpi: '400', sensitivity: '3.0', currentGame: 'CS:GO' },
        result: 'Both are 1200 eDPI — identical speed',
        insight: 'DPI and in-game sensitivity are interchangeable multipliers. The only real difference: higher DPI with lower sens gives smoother low-speed tracking on most sensors.',
      },
      {
        scenario: 'An Overwatch player at 800 DPI, 6.0 sensitivity wonders if they are an outlier',
        inputs: { mouseDpi: '800', sensitivity: '6.0', currentGame: 'Overwatch' },
        result: 'eDPI 4800 — mid pro range for Overwatch',
        insight: 'Overwatch sensitivity numbers run about 3.3× larger than CS for the same physical speed (its yaw is 0.0066 against 0.022 for CS) — comparing raw eDPI across games is meaningless without the game multiplier. Here 800 DPI × 6.0 turns a full circle in about 28.9 cm.',
      },
    ],
    proTips: [
      'Set your mouse to a native DPI step (400/800/1600) — odd values like 1350 are interpolated on some sensors and add jitter.',
      'Disable "Enhance pointer precision" in Windows and keep pointer speed at 6/11, or your real sensitivity will drift from the math.',
      'When lowering your eDPI, change it once and commit for at least a week — constant tweaking destroys the muscle memory you are trying to build.',
      'Match your ADS/scope multiplier separately when switching games; the hipfire conversion alone does not carry it over.',
      'Use cm/360 (shown in your results) as your portable number — it is hardware- and game-independent.',
    ],
    limitations: [
      'Game multipliers assume default FOV and raw input; some games scale sensitivity with FOV, which changes the effective feel even at identical cm/360.',
      'cm/360 uses each game\'s published yaw constant (CS and Apex 0.022, Valorant 0.07, Overwatch 0.0066, Rainbow Six Siege 0.00573); other games are not covered, and some scale yaw with FOV.',
      'Console and controller sensitivities use entirely different (aim-acceleration) systems and cannot be converted with eDPI.',
      'Pro ranges shown are descriptive statistics, not recommendations — comfortable and consistent beats copying any specific player.',
    ],
    citations: [
      { source: 'Wikipedia', title: 'Dots Per Inch', url: 'https://en.wikipedia.org/wiki/Dots_per_inch' },
      { source: 'ProSettings — Pro Player Sensitivity Database', url: 'https://prosettings.net/' },
      { source: 'Liquipedia — Mouse Settings', url: 'https://liquipedia.net/counterstrike/Mouse_settings' },
    ],
  },
};

export default edpiConfig;
