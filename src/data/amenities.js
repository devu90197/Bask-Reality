// Amenity catalog modeled on the categories used by major listing portals
// (Redfin/Zillow in the US, MagicBricks/99acres in India).
export const AMENITY_GROUPS = [
  {
    group: 'Interior',
    items: [
      ['Air conditioning', '❄️'], ['Central heating', '🔥'], ['Fireplace', '🪵'], ['Hardwood floors', '🪵'],
      ['Modular kitchen', '🍳'], ['Chef kitchen', '👨‍🍳'], ['Walk-in closet', '👗'], ['Home office', '💻'],
      ['Open floor plan', '📐'], ['Furnished', '🛋️'], ['Semi-furnished', '🪑'], ['Washer / dryer', '🧺'],
      ['Dishwasher', '🍽️'], ['High ceilings', '⬆️'], ['False ceiling', '🏛️'], ['Wardrobes', '🚪'],
    ],
  },
  {
    group: 'Outdoor',
    items: [
      ['Balcony', '🌇'], ['Terrace', '🏙️'], ['Private garden', '🌳'], ['Patio / deck', '🪴'],
      ['Private pool', '🏊'], ['Mountain view', '⛰️'], ['Waterfront', '🌊'], ['City view', '🌆'],
      ['Park facing', '🏞️'], ['Corner plot', '📍'], ['East facing', '🧭'], ['Vastu compliant', '🕉️'],
    ],
  },
  {
    group: 'Parking & access',
    items: [
      ['Covered parking', '🅿️'], ['Garage', '🚗'], ['Visitor parking', '🚙'], ['EV charging', '🔌'],
      ['Lift / elevator', '🛗'], ['Wheelchair access', '♿'],
    ],
  },
  {
    group: 'Community',
    items: [
      ['Gated community', '🏘️'], ['Clubhouse', '🏛️'], ['Swimming pool', '🏊'], ['Gym', '🏋️'],
      ['Kids play area', '🛝'], ['Jogging track', '🏃'], ['Tennis court', '🎾'], ['Sports court', '🏀'],
      ['Landscaped garden', '🌷'], ['Party hall', '🎉'], ['Indoor games', '🎱'], ['Pet friendly', '🐾'],
    ],
  },
  {
    group: 'Safety & utilities',
    items: [
      ['24/7 security', '🛡️'], ['CCTV', '📹'], ['Intercom', '📞'], ['Fire safety', '🧯'],
      ['Power backup', '⚡'], ['Solar panels', '☀️'], ['Rainwater harvesting', '💧'], ['24/7 water supply', '🚰'],
      ['Piped gas', '🔥'], ['Smart home', '📱'], ['High-speed internet', '📶'], ['Maintenance staff', '🧹'],
    ],
  },
  {
    group: 'Nearby',
    items: [
      ['Near metro', '🚇'], ['Near school', '🏫'], ['Near hospital', '🏥'], ['Near mall', '🛍️'],
      ['Near airport', '✈️'], ['Near IT park', '🏢'],
    ],
  },
];

const ICONS = Object.fromEntries(AMENITY_GROUPS.flatMap((g) => g.items));

export const amenityIcon = (name) => ICONS[name] || '✔️';
