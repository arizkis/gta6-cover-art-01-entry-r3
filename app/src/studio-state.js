export const cast = [
  [
    'hero-boss',
    'THE BOSS',
    'PALM ROYAL ROOFTOP · 8:05 PM · OWNS THE SKYLINE'
  ],
  [
    'driver',
    'THE DRIVER',
    'OCEAN DRIVE · 6:42 PM · LOOKING FOR TROUBLE'
  ],
  [
    'mechanic',
    'THE MECHANIC',
    'NEON GARAGE · 9:40 PM · CLOSES LATE'
  ],
  [
    'captain',
    'THE CAPTAIN',
    'BAY THIRTEEN · 7:15 AM · READS THE WATER'
  ],
  [
    'rider',
    'THE RIDER',
    'COAST HIGHWAY · 7:03 PM · FULL THROTTLE'
  ],
  [
    'fixer',
    'THE FIXER',
    'MARINA DEL SOL · 11:20 PM · ALWAYS ON TIME'
  ],
  [
    'lookout',
    'THE LOOKOUT',
    'BONFIRE BEACH · 6:15 PM · SEES EVERYTHING'
  ],
  [
    'wheelman',
    'THE WHEELMAN',
    'NEON ROW · 1:48 AM · NO WITNESSES'
  ]
];

export const grades = {
  sundown: {
    name: 'Sundown',
    filter: 'saturate(1.25) contrast(1.13) brightness(1.07) sepia(.12)',
    colors: ['#ffb357', '#ef497b', '#063f4f']
  },
  'neon-night': {
    name: 'Neon Night',
    filter: 'saturate(1.4) contrast(1.15) brightness(.96) hue-rotate(8deg)',
    colors: ['#58258d', '#eb247e', '#006e8e']
  },
  'golden-hour': {
    name: 'Golden Hour',
    filter: 'saturate(1.2) contrast(1.08) brightness(1.12) sepia(.27)',
    colors: ['#ffe39a', '#e78a36', '#315a4f']
  },
  'tropic-teal': {
    name: 'Tropic Teal',
    filter: 'saturate(1.25) contrast(1.15) hue-rotate(335deg)',
    colors: ['#ffe69b', '#00ae9f', '#073a55']
  },
  heatwave: {
    name: 'Heatwave',
    filter: 'saturate(1.5) contrast(1.17) sepia(.18)',
    colors: ['#ffc05b', '#ef493c', '#642b66']
  },
  ultraviolet: {
    name: 'Ultraviolet',
    filter: 'saturate(1.4) contrast(1.15) hue-rotate(25deg)',
    colors: ['#9c6dff', '#e644ac', '#14256b']
  }
};

export async function loadStudioAssets() {
  await Promise.all(
    ['Anton', 'Pacifico', 'Bebas'].map(font => document.fonts.load(`20px ${font}`))
  );

  const castPhotos = cast.map(([id, name, bio]) => ({
    id,
    name,
    bio,
    src: `./samples/cast-${id}.jpg`
  }));

  const locationPhotos = ['boulevard', 'pier'].map(id => ({
    id,
    name: id.toUpperCase(),
    bio: 'THE COAST IS CALLING',
    src: `./samples/${id}.jpg`
  }));

  return Promise.all([...castPhotos, ...locationPhotos].map(async photo => {
    photo.image = new Image();
    photo.image.src = photo.src;
    await photo.image.decode();
    return photo;
  }));
}

export function createCoverState(castId = 'A') {
  let order = [0, 1, 2, 3, 4, 5, 6];
  if (castId === 'B') order = [7, 2, 5, 6, 0, 4, 3];
  if (castId === 'C') order = [1, 0, 3, 4, 5, 6, 7];

  const afterDark = castId === 'B';
  const goldenHour = castId === 'C';

  return {
    title: afterDark ? 'MIDNIGHT LEDGER' : 'VELVET HOUR',
    subtitle: afterDark ? 'neon confessions' : 'the city pays in sunsets',
    tagline: 'EIGHT LIVES · ONE COASTLINE · NO KINGS',
    quote: afterDark ? 'THE CITY KEEPS ITS BOOKS IN NEON' : 'A SUNSET WITH TEETH',
    newspaper: afterDark ? 'THE VELVET GAZETTE' : 'THE CORAL COURIER',
    grade: afterDark ? 'neon-night' : goldenHour ? 'golden-hour' : 'sundown',
    layout: 'Syndicate 7',
    strength: 65,
    grain: 24,
    glow: 60,
    vignette: 40,
    panels: order.map(index => ({
      photo: cast[index][0],
      name: cast[index][1],
      bio: cast[index][2],
      x: goldenHour && index === 7 ? .85 : 0,
      y: 0,
      zoom: 1
    }))
  };
}
