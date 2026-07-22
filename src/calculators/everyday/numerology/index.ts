import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import NumerologyPanel from './NumerologyPanel';

const MONTHS = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => ({
  label: `${i + 1}`,
  value: `${i + 1}`,
}));

interface ZodiacInfo {
  sign: string;
  symbol: string;
  element: string;
  rulingPlanet: string;
}

function getZodiac(month: number, day: number): ZodiacInfo | null {
  const zodiacs: { sign: string; symbol: string; element: string; rulingPlanet: string; month: number; startDay: number; endDay: number }[] = [
    { sign: 'Capricorn', symbol: 'Sea-Goat', element: 'Earth', rulingPlanet: 'Saturn', month: 12, startDay: 22, endDay: 31 },
    { sign: 'Capricorn', symbol: 'Sea-Goat', element: 'Earth', rulingPlanet: 'Saturn', month: 1, startDay: 1, endDay: 19 },
    { sign: 'Aquarius', symbol: 'Water Bearer', element: 'Air', rulingPlanet: 'Uranus', month: 1, startDay: 20, endDay: 31 },
    { sign: 'Aquarius', symbol: 'Water Bearer', element: 'Air', rulingPlanet: 'Uranus', month: 2, startDay: 1, endDay: 18 },
    { sign: 'Pisces', symbol: 'Fishes', element: 'Water', rulingPlanet: 'Neptune', month: 2, startDay: 19, endDay: 29 },
    { sign: 'Pisces', symbol: 'Fishes', element: 'Water', rulingPlanet: 'Neptune', month: 3, startDay: 1, endDay: 20 },
    { sign: 'Aries', symbol: 'Ram', element: 'Fire', rulingPlanet: 'Mars', month: 3, startDay: 21, endDay: 31 },
    { sign: 'Aries', symbol: 'Ram', element: 'Fire', rulingPlanet: 'Mars', month: 4, startDay: 1, endDay: 19 },
    { sign: 'Taurus', symbol: 'Bull', element: 'Earth', rulingPlanet: 'Venus', month: 4, startDay: 20, endDay: 30 },
    { sign: 'Taurus', symbol: 'Bull', element: 'Earth', rulingPlanet: 'Venus', month: 5, startDay: 1, endDay: 20 },
    { sign: 'Gemini', symbol: 'Twins', element: 'Air', rulingPlanet: 'Mercury', month: 5, startDay: 21, endDay: 31 },
    { sign: 'Gemini', symbol: 'Twins', element: 'Air', rulingPlanet: 'Mercury', month: 6, startDay: 1, endDay: 20 },
    { sign: 'Cancer', symbol: 'Crab', element: 'Water', rulingPlanet: 'Moon', month: 6, startDay: 21, endDay: 30 },
    { sign: 'Cancer', symbol: 'Crab', element: 'Water', rulingPlanet: 'Moon', month: 7, startDay: 1, endDay: 22 },
    { sign: 'Leo', symbol: 'Lion', element: 'Fire', rulingPlanet: 'Sun', month: 7, startDay: 23, endDay: 31 },
    { sign: 'Leo', symbol: 'Lion', element: 'Fire', rulingPlanet: 'Sun', month: 8, startDay: 1, endDay: 22 },
    { sign: 'Virgo', symbol: 'Virgin', element: 'Earth', rulingPlanet: 'Mercury', month: 8, startDay: 23, endDay: 31 },
    { sign: 'Virgo', symbol: 'Virgin', element: 'Earth', rulingPlanet: 'Mercury', month: 9, startDay: 1, endDay: 22 },
    { sign: 'Libra', symbol: 'Scales', element: 'Air', rulingPlanet: 'Venus', month: 9, startDay: 23, endDay: 30 },
    { sign: 'Libra', symbol: 'Scales', element: 'Air', rulingPlanet: 'Venus', month: 10, startDay: 1, endDay: 22 },
    { sign: 'Scorpio', symbol: 'Scorpion', element: 'Water', rulingPlanet: 'Pluto', month: 10, startDay: 23, endDay: 31 },
    { sign: 'Scorpio', symbol: 'Scorpion', element: 'Water', rulingPlanet: 'Pluto', month: 11, startDay: 1, endDay: 21 },
    { sign: 'Sagittarius', symbol: 'Archer', element: 'Fire', rulingPlanet: 'Jupiter', month: 11, startDay: 22, endDay: 30 },
    { sign: 'Sagittarius', symbol: 'Archer', element: 'Fire', rulingPlanet: 'Jupiter', month: 12, startDay: 1, endDay: 21 },
  ];

  for (const z of zodiacs) {
    if (month === z.month && day >= z.startDay && day <= z.endDay) {
      return { sign: z.sign, symbol: z.symbol, element: z.element, rulingPlanet: z.rulingPlanet };
    }
  }
  return null;
}

function sumDigits(n: number): number {
  return String(n).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
}

function reduceToSingleDigit(value: number): number {
  let result = value;
  while (result > 9 && result !== 11 && result !== 22 && result !== 33) {
    result = sumDigits(result);
  }
  return result;
}

function getSteps(value: number): number[] {
  const steps: number[] = [value];
  let current = value;
  while (current > 9 && current !== 11 && current !== 22 && current !== 33) {
    current = sumDigits(current);
    steps.push(current);
  }
  return steps;
}

interface LifePathDescription {
  number: string;
  title: string;
  personality: string;
  strengths: string[];
  weaknesses: string[];
}

const LIFE_PATH_DESCRIPTIONS: Record<string, LifePathDescription> = {
  '1': {
    number: '1',
    title: 'The Leader',
    personality: 'Life Path 1 individuals are natural-born leaders with an independent and pioneering spirit. You possess a strong drive to carve your own path and are not content to follow the crowd. Your innovative thinking and determination allow you to break new ground in any field you choose. You have an innate confidence that inspires others to follow your vision, and you thrive when you are in positions of authority where you can make decisions and take action. Independence is central to your identity — you value your freedom and resist any attempt to control or limit you. Your creative potential is immense, and you have the ability to turn your ideas into reality through sheer force of will. However, your strong personality can sometimes come across as domineering, and you may struggle with patience when others do not share your vision or pace. Learning to collaborate and listen to different perspectives will be key to your growth. In relationships, you need a partner who respects your independence while also providing emotional support. Your life journey is about learning to balance your innate leadership with humility and compassion for others.',
    strengths: ['Independent and self-reliant', 'Natural leadership abilities', 'Creative and innovative', 'Determined and ambitious'],
    weaknesses: ['Can be domineering or bossy', 'Impatient with others', 'Tendency toward stubbornness', 'May struggle with collaboration'],
  },
  '2': {
    number: '2',
    title: 'The Peacemaker',
    personality: 'Life Path 2 individuals are sensitive, diplomatic, and deeply attuned to the needs and emotions of others. You possess a remarkable ability to see both sides of any situation, making you an exceptional mediator and peacemaker. Your gentle and considerate nature draws people to you, and you excel in partnerships and collaborative environments where your diplomatic skills can shine. You have a natural eye for detail and balance, often noticing nuances that others overlook. Your intuitive understanding of human nature allows you to navigate complex social dynamics with grace and tact. You value harmony above all else and will go to great lengths to avoid conflict and create a peaceful environment. Your sensitivity is both your greatest gift and your biggest challenge — you can absorb the emotions of those around you, which can be overwhelming at times. You may struggle with indecisiveness, as your ability to see all sides can make it difficult to choose a path. Building self-confidence and learning to assert your own needs will be important themes in your life. You thrive in supportive roles where you can nurture and uplift others, and your gentle strength makes the world a more harmonious place.',
    strengths: ['Diplomatic and tactful', 'Intuitive and empathetic', 'Excellent collaborator', 'Detail-oriented and balanced'],
    weaknesses: ['Can be overly sensitive', 'Indecisive under pressure', 'Tendency to avoid conflict', 'May neglect personal needs'],
  },
  '3': {
    number: '3',
    title: 'The Creative Communicator',
    personality: 'Life Path 3 individuals are gifted with extraordinary creative expression and natural charisma. You possess a vibrant energy that lights up any room, and your ability to communicate through words, art, music, or performance is truly exceptional. Your optimistic outlook and infectious enthusiasm inspire those around you, and you have a remarkable talent for finding joy and beauty in everyday life. You are a natural storyteller, able to weave words and ideas into compelling narratives that captivate audiences. Your social nature means you thrive on interaction and connection with others, and you often serve as the social glue that brings groups together. Your creative mind is constantly generating new ideas and possibilities, making you an innovative problem-solver and visionary. However, your sensitivity to criticism can sometimes hold you back from sharing your gifts with the world. You may also struggle with focus and follow-through, as your brilliant ideas can be many and scattered. Learning to channel your creative energy into disciplined practice and completion will unlock your full potential. Your life path is about using your creative gifts to bring joy, inspiration, and beauty to others while learning to believe in your own worth.',
    strengths: ['Highly creative and artistic', 'Excellent communicator', 'Optimistic and charismatic', 'Social and engaging'],
    weaknesses: ['Can be scattered or unfocused', 'Oversensitive to criticism', 'Tendency toward drama', 'May struggle with discipline'],
  },
  '4': {
    number: '4',
    title: 'The Builder',
    personality: 'Life Path 4 individuals are the solid, dependable foundations upon which great achievements are built. You possess an unwavering work ethic and a practical, methodical approach to life that allows you to turn dreams into tangible reality. Your strength lies in your ability to create order from chaos, establishing systems and structures that stand the test of time. You are deeply committed to your responsibilities and take pride in doing things the right way, no matter how long it takes. Your reliability and trustworthiness make you an invaluable team member and leader, as people know they can count on you to deliver. You have a natural talent for organization and management, and you excel in roles that require patience, persistence, and attention to detail. Your practical nature means you are not easily swayed by trends or fleeting fancies — you build for permanence and substance. However, your love of structure can sometimes become rigidity, and you may resist necessary change or new ways of thinking. You can also be overly cautious, missing opportunities because they feel too risky. Learning to embrace flexibility and spontaneity while maintaining your grounded nature will bring greater balance to your life. Your legacy is one of lasting value and meaningful contribution.',
    strengths: ['Hardworking and reliable', 'Practical and methodical', 'Exceptional organizational skills', 'Patient and persistent'],
    weaknesses: ['Can be rigid or inflexible', 'Resistant to change', 'Tendency toward workaholism', 'May be overly cautious'],
  },
  '5': {
    number: '5',
    title: 'The Adventurer',
    personality: 'Life Path 5 individuals are freedom-loving adventurers with an insatiable curiosity about the world. You possess a magnetic personality and an infectious enthusiasm for life that draws people and experiences toward you. Change and variety are essential to your well-being — you thrive on new experiences, travel, and the thrill of the unknown. Your versatile mind adapts quickly to new situations, and you have a natural talent for learning through direct experience. You are a sensualist who appreciates life\'s pleasures — good food, travel, music, and meaningful connections. Your progressive thinking makes you a natural innovator, always looking for better ways to do things. You have a gift for communication and persuasion, able to sell ideas and inspire others with your vision. Your love of freedom means you resist constraints and routine, preferring a life of flexibility and spontaneity. However, your desire for constant stimulation can lead to restlessness and a tendency to avoid commitment. You may struggle with consistency and follow-through, always chasing the next exciting thing. Learning to balance your need for freedom with the responsibilities of committed relationships and long-term goals is your life challenge. Your journey is about experiencing all that life has to offer while finding meaning and depth beyond the surface adventure.',
    strengths: ['Adaptable and versatile', 'Charismatic and persuasive', 'Progressive and innovative', 'Adventurous and curious'],
    weaknesses: ['Can be restless and impulsive', 'May avoid commitment', 'Tendency toward overindulgence', 'Struggles with consistency'],
  },
  '6': {
    number: '6',
    title: 'The Nurturer',
    personality: 'Life Path 6 individuals are deeply compassionate souls who find their greatest fulfillment in serving and nurturing others. You possess a profound sense of responsibility toward your family, community, and the world at large. Your loving and protective nature makes you the person others turn to for support, guidance, and unconditional love. You have a natural talent for creating harmony and beauty in your environment, and your home is often a sanctuary for those you love. Your strong sense of justice and fairness drives you to stand up for those who cannot stand up for themselves. You are a natural counselor and healer, able to provide wise advice and emotional support with genuine empathy. Your artistic sensibilities mean you appreciate beauty in all forms, and you often express your nurturing nature through creative pursuits like cooking, gardening, decorating, or the arts. However, your desire to help others can sometimes become overbearing, and you may take on responsibilities that are not yours to carry. You can struggle with setting boundaries, giving too much of yourself until you are depleted. Learning that true care includes caring for yourself and allowing others to solve their own problems is essential. Your life path is about finding the balance between giving and receiving, nurturing others while honoring your own needs and limitations.',
    strengths: ['Compassionate and nurturing', 'Responsible and reliable', 'Strong sense of justice', 'Artistic and beauty-loving'],
    weaknesses: ['Can be meddling or overprotective', 'Tendency to martyrdom', 'Difficulty setting boundaries', 'May be judgmental of others'],
  },
  '7': {
    number: '7',
    title: 'The Seeker',
    personality: 'Life Path 7 individuals are deep thinkers with an insatiable thirst for knowledge, truth, and spiritual understanding. You possess a brilliant analytical mind and an intuitive depth that allows you to penetrate the surface of things and uncover hidden truths. Your introspective nature means you spend considerable time in contemplation, seeking to understand the fundamental nature of reality, consciousness, and existence. You are naturally drawn to philosophy, science, spirituality, and the mysteries of life. Your analytical abilities are exceptional — you can process complex information and see patterns that others miss. You value your solitude and need regular time alone to recharge and process your thoughts. Your discerning nature means you are not easily impressed; you require evidence and depth before you commit to ideas or relationships. You possess a dry wit and a subtle sense of humor that those close to you appreciate. However, your analytical mind can sometimes lead to overthinking and analysis paralysis. You may struggle with social situations, finding small talk tedious and preferring deep, meaningful conversations. Your tendency toward isolation can lead to loneliness if not balanced with meaningful connections. Learning to trust your intuition as much as your intellect and to share your wisdom with others is your life journey.',
    strengths: ['Analytical and intellectual', 'Deeply intuitive and wise', 'Excellent researcher', 'Spiritually inclined'],
    weaknesses: ['Can be overly analytical', 'Tendency toward isolation', 'May be socially awkward', 'Struggles with trust and openness'],
  },
  '8': {
    number: '8',
    title: 'The Achiever',
    personality: 'Life Path 8 individuals are powerful, ambitious, and driven to achieve material success and recognition. You possess strong executive abilities and a natural talent for business, finance, and leadership on a large scale. Your organizational skills and strategic mind allow you to build successful enterprises and manage complex projects with confidence. You have a keen understanding of the relationship between effort and reward, and you are willing to work hard and take calculated risks to achieve your goals. Your natural authority and presence command respect, and you have the ability to influence and motivate others toward a common vision. You are goal-oriented and results-driven, always measuring your progress and seeking ways to improve your position. Your material success is not just for personal gain — you have a deep desire to make a significant impact on the world. However, your drive for success can sometimes overshadow other important aspects of life. You may become overly focused on material wealth and status, neglecting relationships and personal well-being. Your powerful nature can be intimidating to others, and you may struggle with vulnerability and emotional intimacy. Learning to use your power and influence for the greater good while maintaining balance in your personal life is your highest calling. Your journey is about mastering the material world while developing your spiritual and emotional depth.',
    strengths: ['Ambitious and driven', 'Natural executive ability', 'Strategic thinker', 'Powerful and authoritative'],
    weaknesses: ['Can be materialistic', 'May be work-obsessed', 'Tendency to be domineering', 'Struggles with vulnerability'],
  },
  '9': {
    number: '9',
    title: 'The Humanitarian',
    personality: 'Life Path 9 individuals are compassionate humanitarians with a global perspective and a deep desire to make the world a better place. You possess remarkable emotional depth and a universal love that extends beyond your immediate circle to encompass all of humanity. Your wisdom comes from a combination of life experience, empathy, and a profound understanding of the human condition. You are naturally drawn to causes that serve the greater good, and you have the ability to inspire others through your selfless dedication and visionary ideals. Your creative and artistic talents are often channeled into work that has meaning and purpose. You are a natural philanthropist who finds joy in giving without expectation of return. Your tolerance and acceptance of all people, regardless of their background or beliefs, is truly inspiring. However, your sensitivity to the suffering of the world can sometimes overwhelm you, leading to feelings of sadness or hopelessness. You may struggle with letting go of the past and moving forward, holding onto people or situations longer than is healthy. Your tendency to put others first can lead to self-neglect and burnout. Learning to balance your humanitarian ideals with practical self-care and healthy boundaries is essential. Your life path is about using your compassion and wisdom to serve humanity while finding personal fulfillment in the journey.',
    strengths: ['Compassionate and humanitarian', 'Wise and broad-minded', 'Artistic and creative', 'Tolerant and accepting'],
    weaknesses: ['Can be overly emotional', 'Tendency to self-sacrifice', 'May struggle with letting go', 'Can feel overwhelmed by world issues'],
  },
  '11': {
    number: '11',
    title: 'The Intuitive (Master Number)',
    personality: 'Life Path 11 is a master number that carries the highest spiritual vibration of all the life paths. As an 11, you are a highly intuitive, visionary soul with access to profound spiritual insight and inspiration. You are essentially a Life Path 2 (The Peacemaker) amplified to a higher octave — your sensitivity, intuition, and spiritual awareness are far more intense and developed. You possess a natural ability to inspire others through your words, art, and presence, often serving as a channel for creative and spiritual energy that transcends ordinary understanding. You have a deep connection to the unseen realms and may experience vivid dreams, psychic impressions, and moments of profound clarity. Your purpose is to use your heightened awareness and inspirational gifts to uplift humanity and bring higher wisdom into the material world. You are a natural healer and teacher, though you often teach through your example and presence rather than traditional instruction. However, the intensity of your gifts can be overwhelming. You may struggle with anxiety, nervous energy, and the weight of your sensitivity. Learning to ground yourself and manage the flow of spiritual energy is essential for your well-being. Your path requires you to transform your nervous system from a liability into an asset, learning to harness your sensitivity as a source of strength rather than vulnerability. The challenge of the 11 is to bridge the gap between the spiritual and physical worlds, bringing your visions into practical reality without losing their essence.',
    strengths: ['Highly intuitive and visionary', 'Spiritually gifted and inspirational', 'Deeply empathic and sensitive', 'Natural healer and teacher'],
    weaknesses: ['Can be overwhelmed by sensitivity', 'Tendency toward anxiety', 'May struggle with grounding', 'Can feel misunderstood or isolated'],
  },
  '22': {
    number: '22',
    title: 'The Master Builder (Master Number)',
    personality: 'Life Path 22 is the most powerful of all the master numbers, combining the visionary intuition of 11 with the practical building ability of 4. As a 22, you have the rare ability to turn the most ambitious dreams into concrete, lasting realities that benefit humanity on a large scale. You possess both the spiritual vision to see what is needed in the world and the practical skills to make it happen. Your potential for achievement is virtually unlimited — you are a true Master Builder with the capacity to create institutions, systems, and structures that transform society. You have a unique gift for understanding complex systems and seeing how all the pieces fit together to create something greater than the sum of its parts. Your organizational abilities are extraordinary, and you can manage large-scale projects with remarkable efficiency. People are drawn to your vision and your ability to make the impossible seem achievable. However, the weight of your potential can be crushing. You may feel the pressure of your gifts and struggle with the responsibility of your abilities. The gap between your vision and what you have actually manifested can cause frustration and self-doubt. Learning to pace yourself, delegate, and trust the process is crucial. Your path requires you to stay grounded while reaching for the stars, building your dreams step by step without being overwhelmed by their magnitude. Your greatest challenge is believing in your own capacity for greatness and committing fully to your mission without succumbing to fear or procrastination.',
    strengths: ['Visionary with practical skills', 'Exceptional organizational ability', 'Can manifest large-scale dreams', 'Natural leader and builder'],
    weaknesses: ['Can feel burdened by potential', 'Tendency toward overwhelm', 'May procrastinate from fear of failure', 'Struggles with self-doubt'],
  },
  '33': {
    number: '33',
    title: 'The Master Teacher (Master Number)',
    personality: 'Life Path 33 is the rarest and most evolved of the master numbers, representing the pinnacle of spiritual evolution and selfless service. As a 33, you are a Master Teacher, combining the nurturing compassion of 6 with the spiritual inspiration of 11 and the manifesting power of 22. Your purpose is to uplift humanity through unconditional love, profound wisdom, and selfless service. You possess an extraordinary capacity for compassion that extends beyond your immediate circle to encompass all living beings. Your presence alone can heal and inspire those around you, and you have a natural gift for teaching through love rather than force. You understand deeply that true teaching comes not from instruction but from embodying the wisdom you wish to share. Your creative and artistic gifts are often channeled into work that heals and transforms others. You carry a vibration of pure love that has the power to elevate collective consciousness. However, the path of the 33 is one of tremendous responsibility and sacrifice. You may feel the weight of humanity\'s suffering and your mission to help heal it. Your giving nature can lead to burnout if you do not learn to nurture yourself as deeply as you nurture others. The expectations placed on you, both internally and externally, can feel overwhelming. Your path requires you to embody the highest principles of love, service, and sacrifice while maintaining your own spiritual and emotional health. Learning that self-care is not selfish but essential to your mission is one of your most important lessons.',
    strengths: ['Profoundly compassionate', 'Exceptional teacher and healer', 'Spiritually evolved and wise', 'Selfless and dedicated to service'],
    weaknesses: ['May neglect self-care', 'Can feel burdened by responsibility', 'Tendency toward self-sacrifice', 'May struggle with feeling misunderstood'],
  },
};

const numerologyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'birthMonth',
      label: 'Birth Month',
      type: 'select',
      helpText: 'Select your birth month',
      options: MONTHS,
    },
    {
      id: 'birthDay',
      label: 'Birth Day',
      type: 'select',
      helpText: 'Select your birth day of the month',
      options: DAYS,
    },
    {
      id: 'birthYear',
      label: 'Birth Year',
      type: 'number',
      inputMode: 'numeric',
      placeholder: '1990',
      min: 1900,
      max: 2030,
      step: 1,
      required: true,
      helpText: 'Your four-digit birth year',
    },
  ],
  calculate: (values) => {
    const monthStr = values.birthMonth;
    const dayStr = values.birthDay;
    const yearStr = values.birthYear;

    if (!monthStr || !dayStr || !yearStr) return [];

    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(month) || isNaN(day) || isNaN(year)) return [];

    const monthReduced = reduceToSingleDigit(month);
    const dayReduced = reduceToSingleDigit(day);
    const yearReduced = reduceToSingleDigit(year);

    const monthSteps = getSteps(month);
    const daySteps = getSteps(day);
    const yearSteps = getSteps(year);

    const sum = monthReduced + dayReduced + yearReduced;
    const lifePathNumber = reduceToSingleDigit(sum);
    const sumSteps = getSteps(sum);

    const isMasterNumber = lifePathNumber === 11 || lifePathNumber === 22 || lifePathNumber === 33;
    const description = LIFE_PATH_DESCRIPTIONS[String(lifePathNumber)];

    const monthName = MONTHS[month - 1]?.label || `Month ${month}`;
    const zodiac = getZodiac(month, day);

    const formatSteps = (steps: number[]): string => {
      if (steps.length <= 1) return `${steps[0]}`;
      return steps.join(' → ');
    };

    const results = [
      {
        id: 'lifePathNumber',
        label: 'Life Path Number',
        value: `${lifePathNumber}${isMasterNumber ? ` (Master Number ${lifePathNumber})` : ''}`,
        highlight: true,
        color: isMasterNumber ? 'positive' : 'neutral',
      },
      {
        id: 'lifePathTitle',
        label: 'Archetype',
        value: description?.title || '',
        color: 'neutral',
      },
      {
        id: 'monthReduction',
        label: `Month (${monthName})`,
        value: formatSteps(monthSteps),
        color: 'neutral',
      },
      {
        id: 'dayReduction',
        label: `Day (${day})`,
        value: formatSteps(daySteps),
        color: 'neutral',
      },
      {
        id: 'yearReduction',
        label: `Year (${year})`,
        value: formatSteps(yearSteps),
        color: 'neutral',
      },
      {
        id: 'totalSum',
        label: 'Sum of Reduced Values',
        value: `${monthReduced} + ${dayReduced} + ${yearReduced} = ${sum} → ${formatSteps(sumSteps)}`,
        color: 'neutral',
      },
      {
        id: 'personality',
        label: 'Personality Profile',
        value: description?.personality || '',
        color: 'neutral',
      },
    ] as CalculatorResult[];

    if (zodiac) {
      results.push({
        id: 'zodiacSign',
        label: 'Zodiac Sign',
        value: `${zodiac.sign} (${zodiac.symbol}) — ${zodiac.element} sign ruled by ${zodiac.rulingPlanet}`,
        color: 'neutral',
      });
    }

    if (description?.strengths) {
      results.push({
        id: 'strengths',
        label: 'Key Strengths',
        value: description.strengths.join(' • '),
        color: 'positive',
      });
    }

    if (description?.weaknesses) {
      results.push({
        id: 'weaknesses',
        label: 'Growth Areas',
        value: description.weaknesses.join(' • '),
        color: 'negative',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(NumerologyPanel, { values, results });
  },
  educational: {
    formula: 'Life Path = reduce(MM) + reduce(DD) + reduce(YYYY) → single digit (except 11, 22, 33)',
    formulaDescription:
      'The Life Path Number is calculated by reducing the birth month, day, and year to single digits (or master numbers), summing them, and reducing the sum again to a single digit unless it is a master number (11, 22, or 33). This system is based on the Pythagorean method of numerology, the most widely practiced numerological system in the Western world.',
    diagram: {
      svg: '<svg viewBox="0 0 460 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="230" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Life Path Number Calculation — July 4, 1990</text><!-- Month --><rect x="15" y="32" width="80" height="55" rx="6" fill="var(--svg-3b82f6)" opacity="0.12" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="55" y="52" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-3b82f6)" font-weight="700" text-anchor="middle">Month</text><text x="55" y="68" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">07</text><text x="55" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">→ 7</text><!-- Day --><rect x="115" y="32" width="80" height="55" rx="6" fill="var(--svg-22c55e)" opacity="0.12" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="155" y="52" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-22c55e)" font-weight="700" text-anchor="middle">Day</text><text x="155" y="68" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">04</text><text x="155" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">→ 4</text><!-- Year --><rect x="215" y="32" width="90" height="55" rx="6" fill="var(--svg-f59e0b)" opacity="0.12" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="260" y="52" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-f59e0b)" font-weight="700" text-anchor="middle">Year</text><text x="260" y="68" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">1990</text><text x="260" y="82" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">→ 1+9+9+0 = 19 → 10 → 1</text><!-- Plus arrows --><text x="98" y="62" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-94a3b8)">+</text><text x="198" y="62" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-94a3b8)">+</text><!-- Sum --><rect x="315" y="38" width="55" height="44" rx="8" fill="var(--svg-8b5cf6)" opacity="0.9"/><text x="342" y="58" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">Sum</text><text x="342" y="74" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">12</text><!-- Equal --><text x="373" y="62" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-94a3b8)">→</text><!-- Result --><rect x="393" y="38" width="50" height="44" rx="25" fill="var(--svg-22c55e)"/><text x="418" y="64" font-family="system-ui,sans-serif" font-size="16" fill="var(--svg-ffffff)" font-weight="800" text-anchor="middle">3</text><text x="418" y="115" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-22c55e)" font-weight="600" text-anchor="middle">Life Path 3</text><text x="230" y="118" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-94a3b8)" text-anchor="middle">Master numbers 11, 22, and 33 are NOT reduced further</text></svg>',
      alt: 'Step-by-step calculation of Life Path Number showing month (7) + day (4) + year (1990→1) = 12 → reduced to 3',
      caption: 'Life Path = reduce(month) + reduce(day) + reduce(year), then reduce sum to a single digit. Master numbers 11, 22, and 33 are exceptions.',
    },
    variables: [
      {
        symbol: 'Life Path Number',
        name: 'Life Path Number',
        description: 'The most important number in a numerology chart, representing your life\'s purpose, natural talents, and the challenges you will face. It is derived from your complete birth date and remains constant throughout your life.',
      },
      {
        symbol: 'Master Numbers (11, 22, 33)',
        name: 'Master Numbers',
        description: 'Special numbers in numerology that carry higher spiritual vibrations and greater potential — but also greater challenges. They are not reduced to a single digit. 11 is the Intuitive, 22 is the Master Builder, and 33 is the Master Teacher.',
      },
      {
        symbol: 'Reduction',
        name: 'Digit Sum Reduction',
        description: 'The process of adding the digits of a number repeatedly until a single digit (1–9) or master number (11, 22, 33) is obtained. For example, 1990 = 1+9+9+0 = 19 = 1+9 = 10 = 1+0 = 1.',
      },
      {
        symbol: 'Zodiac Sign',
        name: 'Zodiac Sign',
        description: 'The astrological sign corresponding to your birth date. While separate from numerology, it provides additional insight into your personality and is included as a complementary reference.',
      },
    ],
    commonUses: [
      'Discovering your Life Path Number and its associated personality archetype for self-reflection and personal growth',
      'Exploring the numerological significance of master numbers (11, 22, 33) and whether they apply to your birth date',
      'Reading detailed strengths, weaknesses, and life purpose descriptions tied to your numerological profile',
      'Using numerology alongside zodiac sign information as a complementary self-discovery tool',
    ],
    howToUse: [
      'Select your birth month from the dropdown menu.',
      'Select your birth day from the dropdown menu.',
      'Enter your birth year (four digits).',
      'Your Life Path number will be calculated automatically with full step-by-step reduction shown.',
      'Read your detailed personality profile and discover your key strengths and growth areas.',
    ],
    explanation:
      'Numerology is the ancient study of the mystical relationships between numbers and events in human life. Its origins can be traced back thousands of years to the Greek philosopher Pythagoras, who believed that numbers were the fundamental building blocks of the universe. The Pythagorean system, which is the most widely used system in Western numerology today, assigns specific meanings to numbers 1 through 9, as well as the master numbers 11, 22, and 33. The Life Path Number is the most significant number in a numerology reading — it reveals your natural talents, inherent challenges, and the overall purpose of your life journey. Think of it as your spiritual DNA or your cosmic blueprint. It is calculated using your full birth date and does not change throughout your life, providing a constant reference point for understanding your personality and life trajectory. Master numbers (11, 22, 33) are considered to carry higher spiritual potential but also greater challenges. People with master numbers in their charts are believed to have more intense life experiences and greater responsibilities. An 11 has the intuitive gifts of a 2 amplified to a higher level, a 22 has the building capacity of a 4 magnified, and a 33 has the nurturing qualities of a 6 elevated to a universal scale. While numerology offers fascinating insights into personality and life patterns, it is best used as a tool for self-reflection and personal growth rather than as a deterministic prediction system. Understanding your Life Path Number can help you recognize your natural strengths, be aware of your potential challenges, and make choices that align with your authentic self. The zodiac sign lookup is provided as an additional complementary reference — while astrology and numerology are different systems, they both offer valuable perspectives on character and life purpose.',
    faqs: [
      {
        question: 'What is the difference between a Life Path Number and a master number?',
        answer: 'Life Path Numbers range from 1 to 9, each representing a distinct archetype and set of characteristics. Master numbers (11, 22, 33) are the exceptions — they carry the qualities of their base numbers (2, 4, and 6 respectively) but at a much higher spiritual intensity. People with master numbers are believed to have greater potential and greater challenges, often feeling a strong sense of purpose or destiny from an early age.',
      },
      {
        question: 'Why are master numbers 11, 22, and 33 not reduced further?',
        answer: 'In Pythagorean numerology, master numbers are considered to carry a higher spiritual vibration and are not reduced because doing so would diminish their significance. The repetition of the same digit (11, 22, 33) amplifies the energy of that number. However, if 11, 22, or 33 appear only as intermediate steps (not the final result), they are reduced further. Only the final Life Path Number can be a master number.',
      },
      {
        question: 'Is numerology scientifically proven?',
        answer: 'Numerology is considered a metaphysical or esoteric practice, not a science. There is no empirical scientific evidence that numbers influence personality or life events. Many people find value in numerology as a tool for introspection, self-discovery, and personal growth — similar to how personality tests like the Enneagram or Myers-Briggs can provide useful frameworks for self-understanding even without scientific validation.',
      },
      {
        question: 'Can my Life Path Number change over time?',
        answer: 'No, your Life Path Number is calculated from your birth date and remains the same throughout your life. However, numerology includes other numbers that do change, such as your Personal Year Number (which changes annually) and your Expression Number (based on your full name at birth). The Life Path Number is your fundamental, unchanging spiritual blueprint.',
      },
      {
        question: 'How is numerology different from astrology, and can they be used together?',
        answer: 'Numerology is the study of the mystical significance of numbers and their influence on human life, tracing its Western roots to Pythagoras (6th century BC). Astrology correlates celestial body positions at birth with personality and events. While they are different systems with different methods, they are often used together as complementary self-discovery tools. Many practitioners find that the Life Path Number and zodiac sign offer different but reinforcing perspectives — for example, a Life Path 1 (The Leader) who is also an Aries (naturally assertive) may feel particularly aligned with leadership roles. Our calculator provides both your Life Path Number and zodiac sign for this reason, allowing you to explore both frameworks.',
      },
    ],
    quickReference: [
      { label: 'Numbers 1-9', value: 'Single-digit Life Paths: Leader, Peacemaker, Creative, Builder, Adventurer, Nurturer, Seeker, Achiever, Humanitarian' },
      { label: 'Master Number 11', value: 'The Intuitive — amplified spiritual vibration of 2' },
      { label: 'Master Number 22', value: 'The Master Builder — amplified practical power of 4' },
      { label: 'Master Number 33', value: 'The Master Teacher — amplified nurturing of 6' },
      { label: 'Reduction Method', value: 'Sum digits repeatedly until single digit or master number (11/22/33)' },
      { label: 'Zodiac Overlap', value: '12 signs with element (Fire/Earth/Air/Water) and ruling planet' },
    ],
    proTips: [
      'Your Life Path Number is just one piece of your numerology chart. For a fuller picture, also calculate your Expression Number (from your full birth name) and your Soul Urge Number (from the vowels in your name). These three numbers together form your core numerology profile.',
      'Master numbers (11, 22, 33) are considered to carry both higher potential and higher challenges. If your Life Path is a master number, you may feel intense pressure to live up to your potential. Many numerologists suggest you can also work with the reduced number (2, 4, or 6) during stressful periods for a more grounded experience.',
      'Use your Life Path insights as a tool for self-reflection, not as a rigid box. Your Life Path describes tendencies and potentials — you have free will to develop traits beyond your number\'s description. A Life Path 4 (The Builder) can absolutely be creative; a Life Path 3 (The Creative Communicator) can absolutely be disciplined.',
      'For relationship compatibility, compare Life Path Numbers: complementary pairs include 1 and 5 (Leader + Adventurer), 2 and 8 (Peacemaker + Achiever), and 6 and 9 (Nurturer + Humanitarian). No pairing is inherently incompatible — differences can create growth opportunities.',
      'If you feel your Life Path description does not resonate, check whether you made an error in digit reduction. Master numbers (11, 22, 33) should NOT be reduced further even when they appear as the final sum. A common mistake is reducing 11 to 2, which would give you a completely different reading.',
    ],
    limitations: [
      'Numerology is a metaphysical belief system, not a scientifically validated personality assessment. The Life Path Number descriptions represent archetypal patterns and should be viewed as tools for personal reflection.',
      'The personality descriptions are generalized — individual life experiences, upbringing, environment, and personal choices play a far greater role in shaping who you are than your birth date numbers.',
      'This calculator uses the Pythagorean (Western) system of numerology, which differs from Chaldean numerology (different letter-to-number values) and Chinese numerology (based on different principles entirely).',
      'The zodiac sign detection uses standard tropical zodiac date ranges, which may differ by 1-2 days from sidereal (Vedic) astrology and from year to year due to the precession of equinoxes.',
    ],
    workedExamples: [
      {
        scenario: 'Calculating Life Path for July 4, 1990 (Independence Day)',
        inputs: { birthMonth: '7', birthDay: '4', birthYear: '1990' },
        result: 'Life Path 3 (The Creative Communicator). Zodiac: Cancer (Crab) — Water sign ruled by Moon.',
        insight:
          'Month 7 → 7 (already single digit). Day 4 → 4 (already single digit). Year 1990 → 1+9+9+0 = 19 → 1+9 = 10 → 1+0 = 1. Sum: 7 + 4 + 1 = 12 → 1+2 = 3. Life Path 3: The Creative Communicator — a natural storyteller with charismatic energy, creativity, and social magnetism. This result includes the zodiac sign Cancer (June 21 - July 22), which adds emotional depth and nurturing tendencies to the expressive Life Path 3 personality.',
      },
      {
        scenario: 'Master Number 22 — The Master Builder (November 2, 1998)',
        inputs: { birthMonth: '11', birthDay: '2', birthYear: '1998' },
        result: 'Life Path 22 — Master Number (The Master Builder). Zodiac: Scorpio (Scorpion) — Water sign ruled by Pluto.',
        insight:
          'Month 11 → 11 (preserved as master number). Day 2 → 2. Year 1998 → 1+9+9+8 = 27 → 2+7 = 9. Sum: 11 + 2 + 9 = 22. Since 22 is a master number, it is NOT reduced to 4. Life Path 22: The Master Builder — a rare and powerful number combining the visionary intuition of 11 with the practical building ability of 4. People with this Life Path have the potential to turn ambitious dreams into concrete realities that benefit humanity on a large scale. This person also has Scorpio as their zodiac sign, which adds intensity and determination.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Numerology', url: 'https://en.wikipedia.org/wiki/Numerology' },
      { source: 'Wolfram MathWorld', title: 'Numerology', url: 'https://mathworld.wolfram.com/Numerology.html' },
    ],
  },
};

export default numerologyConfig;
