export const ACTIVITIES: { category: string; items: { id: string; label: string; met: number }[] }[] = [
  {
    category: 'Running & Walking',
    items: [
      { id: 'run_5mph', label: 'Running 5 mph (12 min/mile)', met: 8.3 },
      { id: 'run_6mph', label: 'Running 6 mph (10 min/mile)', met: 9.8 },
      { id: 'run_7mph', label: 'Running 7 mph (8:34 min/mile)', met: 11.0 },
      { id: 'run_8mph', label: 'Running 8 mph (7:30 min/mile)', met: 11.8 },
      { id: 'run_10mph', label: 'Running 10 mph (6 min/mile)', met: 14.5 },
      { id: 'jogging', label: 'Jogging (general)', met: 7.0 },
      { id: 'walk_slow', label: 'Walking 2 mph', met: 2.8 },
      { id: 'walk_mod', label: 'Walking 3 mph', met: 3.5 }, // 17190: 2.8-3.2 mph, level, moderate pace
      { id: 'walk_35', label: 'Walking 3.5 mph (brisk)', met: 4.3 }, // 17200
      { id: 'walk_fast', label: 'Walking 4 mph (very brisk)', met: 5.0 }, // 17220
      { id: 'hiking', label: 'Hiking (moderate terrain)', met: 5.3 },
      { id: 'hiking_stEEP', label: 'Hiking (backpacking / daypack)', met: 7.8 }, // 17012
    ],
  },
  {
    category: 'Cycling',
    items: [
      { id: 'cycle_leisure', label: 'Cycling < 10 mph (leisure)', met: 4.0 },
      { id: 'cycle_mod', label: 'Cycling 10–12 mph (moderate)', met: 6.8 },
      { id: 'cycle_fast', label: 'Cycling 12–14 mph (moderate effort)', met: 8.0 }, // 01030
      { id: 'cycle_race', label: 'Cycling 14–16 mph (very vigorous)', met: 10.0 },
      { id: 'cycle_16', label: 'Cycling > 16 mph (racing)', met: 12.0 },
      { id: 'stationary_mod', label: 'Stationary bike (moderate, ~90–100 W)', met: 6.8 }, // 02012
      { id: 'stationary_vig', label: 'Stationary bike (vigorous / spin class)', met: 8.5 }, // 02019
    ],
  },
  {
    category: 'Strength Training',
    items: [
      { id: 'strength_light', label: 'Weight lifting (light/moderate)', met: 3.5 },
      { id: 'strength_vig', label: 'Weight lifting (vigorous)', met: 6.0 },
      { id: 'calisthenics', label: 'Calisthenics (push-ups, pull-ups)', met: 3.8 },
      { id: 'crossfit', label: 'Circuit training / CrossFit', met: 8.0 },
      { id: 'plyometrics', label: 'Plyometrics (jump training)', met: 7.0 }, // no 2011 Compendium entry (estimate)
    ],
  },
  {
    category: 'Swimming & Water Sports',
    items: [
      { id: 'swim_leisure', label: 'Swimming (leisurely)', met: 6.0 },
      { id: 'swim_mod', label: 'Swimming laps (slow to moderate effort)', met: 5.8 }, // 18240
      { id: 'swim_vig', label: 'Swimming (vigorous laps)', met: 9.8 },
      { id: 'water_aerobics', label: 'Water aerobics', met: 5.3 },
      { id: 'surfing', label: 'Surfing (body surfing / board)', met: 3.0 }, // 18220 general
      { id: 'kayaking', label: 'Kayaking (moderate)', met: 5.0 },
    ],
  },
  {
    category: 'Sports & Recreation',
    items: [
      { id: 'basketball', label: 'Basketball (game)', met: 8.0 }, // 15040
      { id: 'basketball_shoot', label: 'Basketball (shooting around)', met: 4.5 },
      { id: 'soccer', label: 'Soccer (competitive game)', met: 10.0 }, // 15605
      { id: 'soccer_rec', label: 'Soccer (casual / recreational)', met: 7.0 }, // 15610
      { id: 'tennis_singles', label: 'Tennis (singles)', met: 8.0 }, // 15690
      { id: 'tennis_doubles', label: 'Tennis (doubles)', met: 6.0 }, // 15680
      { id: 'volleyball', label: 'Volleyball (game)', met: 4.0 },
      { id: 'golf_walk', label: 'Golf (walking, carrying clubs)', met: 4.3 },
      { id: 'golf_cart', label: 'Golf (riding cart)', met: 3.5 }, // 15290
      { id: 'martial_arts', label: 'Martial arts (judo, karate, kickboxing — moderate pace)', met: 10.3 }, // 15430
      { id: 'boxing_bag', label: 'Boxing (punching bag)', met: 5.5 },
      { id: 'boxing_spar', label: 'Boxing (sparring)', met: 7.8 }, // 15120
      { id: 'yoga_hatha', label: 'Yoga (Hatha)', met: 2.5 },
      { id: 'yoga_power', label: 'Yoga (Power/Vinyasa)', met: 4.0 },
      { id: 'pilates', label: 'Pilates (general)', met: 3.0 },
      { id: 'dance_ballroom', label: 'Dance (ballroom, slow — waltz/foxtrot)', met: 3.0 }, // 03040
      { id: 'dance_hiphop', label: 'Dance (aerobic / hip-hop)', met: 7.3 }, // 03015
    ],
  },
  {
    category: 'Cardio Machines',
    items: [
      { id: 'elliptical', label: 'Elliptical trainer (moderate)', met: 5.0 },
      { id: 'elliptical_vig', label: 'Elliptical trainer (vigorous)', met: 7.0 }, // 2011 Compendium lists only 'moderate effort' (5.0); this is an estimate
      { id: 'rowing_mod', label: 'Rowing machine (moderate)', met: 4.8 }, // 02071
      { id: 'rowing_vig', label: 'Rowing machine (vigorous)', met: 8.5 },
      { id: 'stairmaster', label: 'StairMaster / stair climber', met: 9.0 }, // 02065
      { id: 'ski_erg', label: 'SkiErg / NordicTrack', met: 6.8 }, // 02080 ski machine
    ],
  },
  {
    category: 'Outdoor & Adventure',
    items: [
      { id: 'ski_downhill', label: 'Downhill skiing (moderate)', met: 5.3 },
      { id: 'ski_crosscountry', label: 'Cross-country skiing (moderate, 4–5 mph)', met: 9.0 }, // 19090
      { id: 'snowboarding', label: 'Snowboarding', met: 5.3 },
      { id: 'ice_skating', label: 'Ice skating (9 mph or less)', met: 5.5 }, // 19020
      { id: 'rock_climbing', label: 'Rock climbing (ascending, high difficulty)', met: 7.5 }, // 15535
      { id: 'horseback', label: 'Horseback riding (trotting)', met: 5.8 }, // 15390
      { id: 'fishing', label: 'Fishing (bank/shore)', met: 3.5 }, // 04040
    ],
  },
  {
    category: 'Daily Living & Household',
    items: [
      { id: 'cleaning_light', label: 'House cleaning (light)', met: 2.5 }, // 05040
      { id: 'cleaning_heavy', label: 'House cleaning (heavy, scrubbing)', met: 3.5 }, // 05020
      { id: 'gardening', label: 'Gardening (general)', met: 3.8 }, // 08245
      { id: 'mowing_push', label: 'Mowing lawn (push mower)', met: 4.5 },
      { id: 'shoveling', label: 'Shoveling snow', met: 5.3 }, // 08195
      { id: 'walking_dog', label: 'Walking the dog', met: 3.0 },
      { id: 'childcare', label: 'Childcare (active care)', met: 3.5 },
    ],
  },
];
