import { createElement } from 'react';
import { createConverter, type UnitDef } from '../unit-converter';
import { CalculatorResult } from '../../../types/calculator';
import ConverterPanel from '../ConverterPanel';

const UNITS: UnitDef[] = [
  { value: 'hz', label: 'Hertz (Hz)', shortLabel: 'Hz', factor: 1 },
  { value: 'khz', label: 'Kilohertz (kHz)', shortLabel: 'kHz', factor: 1000 },
  { value: 'mhz', label: 'Megahertz (MHz)', shortLabel: 'MHz', factor: 1_000_000 },
  { value: 'ghz', label: 'Gigahertz (GHz)', shortLabel: 'GHz', factor: 1_000_000_000 },
  { value: 'thz', label: 'Terahertz (THz)', shortLabel: 'THz', factor: 1_000_000_000_000 },
  { value: 'rpm', label: 'Revolutions per Minute (RPM)', shortLabel: 'RPM', factor: 1 / 60 },
  { value: 'rads', label: 'Radians per Second (rad/s)', shortLabel: 'rad/s', factor: 1 / (2 * Math.PI) },
  { value: 'dps', label: 'Degrees per Second (°/s)', shortLabel: '°/s', factor: 1 / 360 },
  { value: 'bpm', label: 'Beats per Minute (BPM)', shortLabel: 'BPM', factor: 1 / 60 },
];

const EDUCATIONAL = {
  formula: 'result = value × (factor_from ÷ factor_to)',
  formulaDescription:
    'Frequency conversion measures how often a periodic event occurs per second. The hertz (Hz) is the SI base unit — 1 Hz equals one cycle per second. RPM (revolutions per minute) is commonly used for rotating machinery and engines: 1 RPM = 1/60 Hz. Radians per second (rad/s) is used in physics and engineering: 2π rad/s = 1 Hz. BPM (beats per minute) is used for music tempo.',
  variables: [
    { symbol: 'f', name: 'Frequency', description: 'Number of occurrences of a repeating event per unit of time, measured in hertz (Hz) or cycles per second.' },
    { symbol: '1 Hz', name: 'One Hertz', description: 'One cycle per second. The standard household electrical frequency is 50 Hz (Europe) or 60 Hz (Americas).' },
    { symbol: '1 RPM & 1 GHz', name: 'Real-World Frequency References', description: '1 RPM = 1/60 Hz. An engine idles at ~700 RPM (≈11.7 Hz). 1 GHz = 1 billion Hz. Modern CPU clocks run at 2-5 GHz. WiFi operates at 2.4 or 5 GHz.' },
  ],
  howToUse: [
    'Enter the frequency value you want to convert in the "Value" field.',
    'Select the current frequency unit from the "From" dropdown.',
    'Select the desired frequency unit from the "To" dropdown.',
    'The converted value is displayed instantly. Use this to compare rotational speeds, sound frequencies, radio bands, or processor clock rates.',
    'Check the quick reference for common frequency equivalents like 60 Hz to RPM, radio band ranges, and audio frequencies.',
  ],
  quickReference: [
    { label: '60 Hz', value: '3,600 RPM (US power grid)' },
    { label: '50 Hz', value: '3,000 RPM (EU power grid)' },
    { label: '1 RPM', value: '0.0167 Hz / 6°/s' },
    { label: '1 MHz', value: '1,000 kHz / 0.001 GHz' },
    { label: '1 GHz', value: '1,000 MHz / 0.001 THz' },
    { label: '440 Hz', value: 'musical note A₄ (concert pitch)' },
    { label: '1 rad/s', value: '0.159 Hz / 9.55 RPM / 57.3°/s' },
    { label: '1 BPM', value: '0.0167 Hz (music tempo)' },
  ],
  commonUses: [
    'US household electrical: 60 Hz (cycles per second)',
    'European electrical: 50 Hz',
    'FM radio: 88–108 MHz band',
    'WiFi: 2.4 GHz and 5 GHz bands',
    'Human hearing: 20 Hz to 20,000 Hz (20 kHz)',
    'Aircraft power: 400 Hz (lighter transformers)',
  ],

  diagram: {
    svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
      '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Frequency = Wave Cycles per Second (1 Hz = 1 cycle/s)</text>' +
      '<path d="M 20 50 Q 40 30 60 50 Q 80 70 100 50 Q 120 30 140 50 Q 160 70 180 50" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
      '<line x1="20" y1="50" x2="180" y2="50" stroke="var(--svg-e2e8f0)" stroke-width="0.5" stroke-dasharray="4,2"/>' +
      '<line x1="20" y1="60" x2="100" y2="60" stroke="var(--svg-ef4444)" stroke-width="1"/>' +
      '<polygon points="25,57 20,60 25,63" fill="var(--svg-ef4444)"/>' +
      '<polygon points="95,57 100,60 95,63" fill="var(--svg-ef4444)"/>' +
      '<text x="60" y="70" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-ef4444)" text-anchor="middle">1 cycle</text>' +
      '<text x="100" y="80" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle" font-weight="600">Low Frequency (Long &lambda;)</text>' +
      '<path d="M 20 90 Q 30 75 40 90 Q 50 105 60 90 Q 70 75 80 90 Q 90 105 100 90 Q 110 75 120 90 Q 130 105 140 90 Q 150 75 160 90 Q 170 105 180 90 Q 190 75 200 90 Q 210 105 220 90 Q 230 75 240 90 Q 250 105 260 90" fill="none" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>' +
      '<text x="140" y="108" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle" font-weight="600">High Frequency (Short &lambda;)</text>' +
      '<rect x="285" y="40" width="175" height="65" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>' +
      '<text x="372" y="58" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle">1 Hz = 1 cycle/sec</text>' +
      '<text x="372" y="72" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">60 RPM = 1 Hz</text>' +
      '<text x="372" y="86" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">1 MHz = 1,000,000 Hz</text>' +
      '<text x="372" y="100" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">1 GHz = 1,000 MHz</text>' +
      '</svg>',
    alt: 'Wave diagram comparing low frequency (long wavelength) and high frequency (short wavelength)',
    caption: 'Higher frequency = shorter wavelength; 1 Hz = 1 complete cycle per second',
  },
  explanation:
    'Frequency measures how often something happens per unit of time. The hertz (Hz) — one cycle per second — is the standard unit. Our world runs on frequencies: the electrical grid hums at 50 or 60 Hz depending on your country, a piano\'s middle A vibrates at 440 Hz, WiFi signals oscillate at billions of cycles per second (2.4 or 5 GHz), and visible light vibrates at hundreds of terahertz. Radio spectrum is divided into frequency bands: AM radio (530-1700 kHz), FM radio (88-108 MHz), cellular (700 MHz to 6 GHz), and millimeter wave (24-100 GHz). Engineers and technicians frequently convert between Hz, RPM, and rad/s. A motor spinning at 1,800 RPM operates at 30 Hz (1800 ÷ 60). An engine at 6,000 RPM runs at 100 Hz. Audio frequencies range from 20 Hz (low bass) to 20,000 Hz (high treble). Understanding frequency units is essential for music production, electrical engineering, radio communications, audio system design, and machinery diagnostics.',
  faqs: [
    {
      question: 'How do I convert between Hz and RPM?',
      answer: 'Divide RPM by 60 to get Hz. Multiply Hz by 60 to get RPM. Examples: 3,600 RPM ÷ 60 = 60 Hz. 50 Hz × 60 = 3,000 RPM. Common motor speeds: 1,800 RPM (30 Hz) for 4-pole motors on 60 Hz power, 1,500 RPM (25 Hz) for 4-pole motors on 50 Hz power. This relationship is fundamental for electric motor selection, pump sizing, and conveyor belt design.',
    },
    {
      question: 'Why is US power 60 Hz but Europe uses 50 Hz?',
      answer: 'The choice is historical — Westinghouse/Tesla standardized 60 Hz in the US for better lighting performance (less visible flicker), while AEG/European systems adopted 50 Hz for metric convenience (50 Hz aligns well with 1,500 RPM synchronous motors). 60 Hz provides about 20% more power delivery for the same transformer size but results in slightly higher transmission losses. Aircraft use 400 Hz because it allows dramatically smaller and lighter transformers and motors — a 400 Hz transformer is about 1/8 the weight of a 60 Hz unit. Both 50 Hz and 60 Hz work fine for most applications, but 50 Hz equipment run on 60 Hz power (or vice versa) will operate at the wrong speed.',
    },
    {
      question: 'What frequencies does WiFi use?',
      answer: 'WiFi primarily uses the 2.4 GHz and 5 GHz bands. 2.4 GHz (2,400 MHz) penetrates walls better and has longer range but is more congested — shared with Bluetooth, microwaves, and cordless phones. 5 GHz (5,150-5,850 MHz) offers faster speeds and less interference but shorter range and poorer wall penetration. The newer 6 GHz band (WiFi 6E/7) adds more spectrum for extremely fast, low-latency connections. Each band is divided into channels — 2.4 GHz has 14 channels of 20 MHz each (with only 3 non-overlapping). 5 GHz offers more channels with 20, 40, 80, or 160 MHz width for higher speeds.',
    },
    {
      question: 'What is the frequency range of human hearing?',
      answer: 'A healthy young human can hear approximately 20 Hz to 20,000 Hz (20 kHz). With age, the upper limit typically drops to 15-17 kHz by age 40, and 12-14 kHz by age 60. Sub-bass (20-60 Hz) is felt more than heard — this is the range of kick drums and explosions. Midrange (250-4,000 Hz) contains most speech and instrument fundamentals — the most critical range for hearing. The highest octave (10-20 kHz) contains harmonics and "air" in audio but is the first range lost with age or hearing damage. Professional audio equipment typically operates at sample rates of 44.1 kHz (CD quality) or 48 kHz, capturing frequencies up to about 22-24 kHz.',
    },
    {
      question: 'How are radio frequencies divided into bands?',
      answer: 'The radio spectrum is divided into bands by frequency: VLF (3-30 kHz) for submarine communication. LF (30-300 kHz) for navigation beacons and time signals. MF (300-3,000 kHz) for AM radio (530-1,700 kHz). HF (3-30 MHz) for international shortwave broadcasting, amateur radio, and aviation. VHF (30-300 MHz) for FM radio (88-108 MHz), broadcast TV, and air traffic control. UHF (300-3,000 MHz) for cellular, WiFi, Bluetooth, GPS, and TV. SHF (3-30 GHz) for satellite, 5G mmWave, and radar. EHF (30-300 GHz) for high-speed communications and radio astronomy. Each band has different propagation characteristics — lower frequencies travel farther and penetrate buildings better, while higher frequencies carry more data.',
    },
  ],

  citations: [
    { source: 'IEEE - Frequency Standards', url: 'https://www.ieee.org/standards/' },
    { source: 'NIST - Time and Frequency', url: 'https://www.nist.gov/pml/time-and-frequency-division' },
  ],
};

const converterConfig = createConverter({ units: UNITS, educational: EDUCATIONAL });
const configWithPanel = {
  ...converterConfig,
  calculate: (values: Record<string, string>) => {
    if (values.value !== undefined && values.value !== '') {
      const val = parseFloat(values.value);
      if (!isNaN(val) && val < 0) return [];
    }
    return converterConfig.calculate(values);
  },
  extraPanel: (values: Record<string, string>, results: CalculatorResult[]) => {
    if (!results.length) return null;
    return createElement(ConverterPanel, { values, results, label: 'Frequency Conversion' });
  },
};
export default configWithPanel;
