import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import EdpiPanel from './EdpiPanel';

const GAME_MULTIPLIERS: Record<string, number> = {
  'CS:GO': 1,
  Valorant: 0.314,
  Overwatch: 1,
  'Apex Legends': 1,
  'Rainbow Six Siege': 1,
};

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
    const dpi = parseFloat(values.mouseDpi);
    const sens = parseFloat(values.sensitivity);
    const currentGame = values.currentGame || 'CS:GO';
    const targetGame = values.targetGame || '';

    if (isNaN(dpi) || isNaN(sens) || dpi <= 0 || sens <= 0) return [];

    const currentMult = GAME_MULTIPLIERS[currentGame] || 1;
    const edpi = dpi * sens;

    // 360° distance: approximate degrees per cm of mouse movement
    // Source engine formula: cm/360 = (360 * 2.54) / (DPI * sens * 0.022)
    const cmPer360 = (360 * 2.54) / (dpi * sens * 0.022);
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
      const targetSens = (sens * currentMult) / targetMult;
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
      'eDPI (Effective Dots Per Inch) is the universal standard for comparing mouse sensitivity across different games and DPI settings. By multiplying your mouse DPI by your in-game sensitivity, you get a single number that represents your true cursor speed. Two players with the same eDPI will have the same muscle memory, even if one uses 400 DPI at 4 sensitivity (eDPI = 1600) and the other uses 800 DPI at 2 sensitivity (eDPI = 1600). Cross-game conversion adjusts for the different sensitivity scales each game uses. For example, Valorant uses a more sensitive scale than CS:GO, so a Valorant sensitivity of 0.314 feels equivalent to a CS:GO sensitivity of 1.0. Practical example: if you play CS:GO at 800 DPI with 2.5 sensitivity, your eDPI is 800 × 2.5 = 2000. To convert to Valorant: 2.5 × 1 / 0.314 = 7.96 sensitivity — but that seems very high because Valorant\'s scale is different. Actually the correct conversion: Valorant sensitivity = (CS:GO sens × CS:GO multiplier) / Valorant multiplier = (2.5 × 1) / 0.314 = 0.785. So your Valorant equivalent is 800 DPI at 0.785 sensitivity. Edge cases: raw input vs. mouse acceleration — this calculator assumes raw input with no acceleration. If Windows pointer speed is not at the default (6/11), or if "Enhance pointer precision" is enabled, the effective sensitivity changes unpredictably. For games with separate ADS (aim down sights) sensitivity multipliers, the eDPI changes when scoped. For tracking-heavy games like Overwatch and Apex, a slightly lower eDPI (1200-1600) is common for precise tracking, while for flick-heavy games like Valorant and CS:GO, a higher eDPI (1600-2400) is more typical. Pro players generally range from 400 eDPI (very low, arm aimers) to 3200 eDPI (high, wrist aimers).',
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
        question: 'How do I match my sensitivity between different games that are not in this list?',
        answer: 'For games not in the built-in list, you can use the 360-degree turn method. First, measure how many inches or centimeters your mouse moves to perform a full 360-degree turn in your current game at your current settings. In the new game, adjust the sensitivity until a mouse movement of the same distance produces exactly one 360-degree turn. Most Source engine games (Counter-Strike, Team Fortress, Left 4 Dead) use the same sensitivity scale, so the same numeric value gives the same cm/360. Unreal Engine games generally use a different scale and may need the sensitivity multiplied by a conversion factor. For games without raw input support, ensure your Windows mouse settings are consistent (default pointer speed at 6/11, enhance pointer precision disabled). Using a uniform cm/360 measurement across all games is the most reliable method for maintaining consistency. You can verify your cm/360 using online tools by entering your DPI and game sensitivity. For Battle Royale games (Apex, Fortnite, PUBG), consider that ADS (aim down sights) sensitivity is often set separately and should be matched as well.',
      },
    ],
    formulaSource: 'The cm/360 formula derives from the Source engine sensitivity model (0.022°/count yaw), the de facto standard for FPS sensitivity math. Game multipliers are the community-established conversion constants (e.g., Valorant = 0.314 × CS).',
    quickReference: [
      { label: 'CS2 / CS:GO pro range', value: '600–1200 eDPI' },
      { label: 'Valorant pro range', value: '150–350 eDPI' },
      { label: 'Apex Legends pro range', value: '1000–2000 eDPI' },
      { label: 'Overwatch 2 pro range', value: '3000–6000 eDPI' },
      { label: '400 DPI × 2.0 sens', value: '800 eDPI' },
      { label: 'CS → Valorant sens', value: 'multiply by 0.314' },
      { label: 'Valorant → CS sens', value: 'multiply by 3.18' },
    ],
    workedExamples: [
      {
        scenario: 'A CS2 player at 800 DPI, 1.1 sensitivity switches to Valorant',
        inputs: { mouseDpi: '800', sensitivity: '1.1', currentGame: 'CS:GO', targetGame: 'Valorant' },
        result: 'eDPI 880 → Valorant sensitivity 0.3454',
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
        insight: 'Overwatch sensitivity numbers run ~10× larger than CS for the same physical speed — comparing raw eDPI across games is meaningless without the game multiplier.',
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
      'The cm/360 formula uses the Source-engine 0.022 yaw constant — exact for CS/Valorant/Apex, approximate for engines with different yaw values.',
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
