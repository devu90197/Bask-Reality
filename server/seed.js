// Sample data so every part of the site has something to show: listings for sale, rent and lease
// across Bengaluru, agents, and a few inquiries. Prices are written in rupees and stored in USD,
// converted at the rate passed in (the live rate when run via `npm run seed`).
export const FALLBACK_INR_PER_USD = 83;
const DAY = 86400000;

const img = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

const PHOTOS = {
  villa: ['1613490493576-7fde63acd811', '1600596542815-ffad4c1539a9', '1613977257363-707ba9348227', '1600585154340-be6161a56a0c', '1512917774080-9991f1c4c750', '1580587771525-78b9dba3b914'],
  house: ['1568605114967-8130f3a36994', '1570129477492-45c003edd2be', '1564013799919-ab600027ffc6', '1605276374104-dee2a0ed3cd6', '1599809275671-b5942cabc7a2'],
  tower: ['1545324418-cc1a3fa10c00', '1574362848149-11496d93a7c7', '1460317442991-0ec209397118'],
  living: ['1600210492486-724fe5c67fb0', '1600573472550-8090b5e0745e', '1493809842364-78817add7ffb', '1522708323590-d24dbb6b0267', '1502672260266-1c1ef2d93688', '1560448204-e02f11c3d0e2'],
  kitchen: ['1600566753190-17f0baa2a6c3', '1484154218962-a197022b5858', '1600607687939-ce8a6c25118c'],
  bedroom: ['1505691938895-1758d7feb511', '1560185007-cde436f6a4d0'],
  office: ['1486406146926-c627a92ad1ab', '1497366216548-37526070297c', '1497366811353-6870744d04b2'],
};

const pick = (list, i) => list[i % list.length];

// Cover photo from the building type, then interiors.
const gallery = (kind, i) => {
  if (kind === 'office') return PHOTOS.office.map((_, k) => img(pick(PHOTOS.office, i + k)));
  const exterior = kind === 'villa' ? PHOTOS.villa : kind === 'house' ? PHOTOS.house : PHOTOS.tower;
  return [pick(exterior, i), pick(exterior, i + 1), pick(PHOTOS.living, i), pick(PHOTOS.kitchen, i), pick(PHOTOS.bedroom, i), pick(PHOTOS.living, i + 3)].map((id) => img(id));
};

const AGENTS = [
  { id: 'ag1', name: 'Ananya Rao', phone: '+91 98450 11234', email: 'ananya@baskreality.com', city: 'Whitefield, Bengaluru', photo: img('1494790108377-be9c29b29330', 400) },
  { id: 'ag2', name: 'Rohan Mehta', phone: '+91 98860 22345', email: 'rohan@baskreality.com', city: 'Koramangala, Bengaluru', photo: img('1507003211169-0a1dd7228f2d', 400) },
  { id: 'ag3', name: 'Priya Sharma', phone: '+91 99001 33456', email: 'priya@baskreality.com', city: 'Indiranagar, Bengaluru', photo: img('1438761681033-6461ffad8d80', 400) },
  { id: 'ag4', name: 'Arjun Nair', phone: '+91 97400 44567', email: 'arjun@baskreality.com', city: 'Hebbal, Bengaluru', photo: img('1500648767791-00dcc994a43e', 400) },
  { id: 'ag5', name: 'Kavya Iyer', phone: '+91 96320 55678', email: 'kavya@baskreality.com', city: 'HSR Layout, Bengaluru', photo: img('1544005313-94ddf0286df2', 400) },
  { id: 'ag6', name: 'Vikram Reddy', phone: '+91 95910 66789', email: 'vikram@baskreality.com', city: 'MG Road, Bengaluru', photo: img('1472099645785-5658abf4ff4e', 400) },
];

// [title, address, locality, pin, status, type, kind, beds, baths, sqft, year, lot, priceINR, amenities, description]
const LISTINGS = [
  ['Prestige Lakeside 4 BHK Villa', 'Plot 18, Prestige Lakeside Habitat', 'Whitefield', '560066', 'sale', 'Villa', 'villa', 4, 4.5, 4200, 2021, '0.12 acres', 48500000,
    ['Private garden', 'Private pool', 'Modular kitchen', 'Gated community', 'Clubhouse', 'Power backup', '24/7 security', 'Covered parking', 'Vastu compliant', 'Near IT park'],
    'Contemporary lake-facing villa in a gated community with a private plunge pool, landscaped garden and double-height living room. Walking distance to ITPL and top international schools.'],
  ['Sobha Indraprastha 3 BHK Apartment', 'Tower B, Sobha Indraprastha, Rajajinagar', 'Rajajinagar', '560010', 'sale', 'Apartment', 'tower', 3, 3, 2150, 2019, '—', 32000000,
    ['Lift / elevator', 'Swimming pool', 'Gym', 'Clubhouse', 'Kids play area', 'CCTV', 'Power backup', 'Near metro', 'Covered parking', 'Semi-furnished'],
    'Premium high-rise apartment on a high floor with city views, connected to the Orion Mall complex and minutes from the Rajajinagar metro station.'],
  ['Independent 4 BHK House, Indiranagar', '12th Main, HAL 2nd Stage', 'Indiranagar', '560038', 'sale', 'House', 'house', 4, 4, 3200, 2014, '0.07 acres', 62000000,
    ['Terrace', 'Modular kitchen', 'Covered parking', 'Wardrobes', 'Power backup', '24/7 water supply', 'East facing', 'Near metro'],
    'Rare independent home on a quiet tree-lined street off 100 Feet Road with a rooftop terrace, home office and parking for two cars.'],
  ['Brigade Gateway 2 BHK', 'Brigade Gateway, Malleshwaram West', 'Malleshwaram', '560055', 'sale', 'Apartment', 'tower', 2, 2, 1340, 2012, '—', 17500000,
    ['Lift / elevator', 'Swimming pool', 'Gym', 'Tennis court', 'Jogging track', '24/7 security', 'Near mall', 'Near hospital'],
    'Well-kept two-bedroom home in an integrated township with a mall, hospital and five-star hotel inside the campus.'],
  ['Embassy Lake Terraces 4 BHK Penthouse', 'Embassy Lake Terraces, Hebbal', 'Hebbal', '560024', 'sale', 'Condo', 'tower', 4, 5, 5800, 2020, '—', 135000000,
    ['Terrace', 'City view', 'Private pool', 'Smart home', 'Clubhouse', 'Swimming pool', 'Gym', 'Lift / elevator', 'EV charging', 'Near airport'],
    'Ultra-luxury duplex penthouse overlooking Hebbal Lake with a private sky pool, smart-home automation and direct access to the airport road.'],
  ['Koramangala 3 BHK Apartment', '5th Block, 80 Feet Road', 'Koramangala', '560095', 'sale', 'Apartment', 'tower', 3, 3, 1780, 2016, '—', 24500000,
    ['Lift / elevator', 'Gym', 'Power backup', 'Covered parking', 'CCTV', 'Intercom', 'Near mall', 'Pet friendly'],
    'Bright corner apartment in the heart of Koramangala, surrounded by cafés, startups and the Forum mall.'],
  ['Devanahalli Villa Plot', 'Sy. No. 42, Airport Road', 'Devanahalli', '562110', 'sale', 'Land', 'villa', 0, 0, 2400, 0, '0.06 acres', 7800000,
    ['Gated community', 'Corner plot', 'East facing', 'Near airport', 'Landscaped garden'],
    'BMRDA-approved corner plot in a gated layout ten minutes from Kempegowda International Airport, ready for construction.'],
  ['Sarjapur Road 3 BHK Row House', 'Adarsh Palm Retreat, Bellandur', 'Bellandur', '560103', 'sale', 'Townhouse', 'house', 3, 3.5, 2600, 2018, '0.04 acres', 29500000,
    ['Private garden', 'Clubhouse', 'Swimming pool', 'Kids play area', 'Jogging track', '24/7 security', 'Pet friendly', 'Near IT park'],
    'Three-level row house with a private garden in one of Sarjapur Road’s most popular gated communities.'],

  ['Furnished 2 BHK near Manyata Tech Park', 'L&T Raintree Boulevard, Hebbal', 'Hebbal', '560092', 'rent', 'Apartment', 'tower', 2, 2, 1250, 2017, '—', 48000,
    ['Furnished', 'Air conditioning', 'Washer / dryer', 'Lift / elevator', 'Gym', 'Swimming pool', 'Power backup', 'Near IT park'],
    'Fully furnished two-bedroom flat, five minutes from Manyata Tech Park. Ideal for working professionals.'],
  ['HSR Layout 3 BHK Family Home', 'Sector 2, 27th Main', 'HSR Layout', '560102', 'rent', 'Apartment', 'tower', 3, 3, 1650, 2015, '—', 65000,
    ['Semi-furnished', 'Modular kitchen', 'Covered parking', 'Lift / elevator', 'Kids play area', 'Near school', 'Pet friendly'],
    'Spacious semi-furnished apartment on a quiet street, close to schools, parks and the Outer Ring Road.'],
  ['Jayanagar Independent 2 BHK', '4th T Block, 36th Cross', 'Jayanagar', '560041', 'rent', 'House', 'house', 2, 2, 1100, 2010, '0.03 acres', 35000,
    ['Terrace', 'Covered parking', '24/7 water supply', 'Near metro', 'Near hospital', 'Vastu compliant'],
    'Ground-floor independent home with a private terrace in leafy Jayanagar, walking distance to the shopping complex.'],
  ['Whitefield Studio Apartment', 'Prestige Shantiniketan, ITPL Road', 'Whitefield', '560048', 'rent', 'Condo', 'tower', 1, 1, 620, 2013, '—', 24000,
    ['Furnished', 'Air conditioning', 'High-speed internet', 'Gym', 'Swimming pool', 'Clubhouse', 'Near IT park'],
    'Compact fully furnished studio inside a large township with tech parks, a mall and a hotel on campus.'],
  ['Luxury 4 BHK Villa, Yelahanka', 'Total Environment Windmills of Your Mind', 'Yelahanka', '560064', 'rent', 'Villa', 'villa', 4, 4, 3800, 2019, '0.1 acres', 180000,
    ['Private garden', 'Private pool', 'Furnished', 'Smart home', 'Fireplace', 'Gated community', 'Near airport'],
    'Architect-designed villa with lush gardens and a private pool, on the airport side of the city.'],

  ['Grade-A Office Floor, Outer Ring Road', 'Embassy Tech Village, Devarabeesanahalli', 'Bellandur', '560103', 'lease', 'Multi-family', 'office', 0, 4, 18000, 2019, '—', 1620000,
    ['Lift / elevator', 'Power backup', 'Visitor parking', 'CCTV', 'Fire safety', 'High-speed internet', 'Near IT park', 'EV charging'],
    'Plug-and-play office floor with 220 workstations, meeting rooms and a cafeteria, on the Outer Ring Road tech corridor.'],
  ['MG Road Retail Showroom', 'Church Street junction', 'MG Road', '560001', 'lease', 'Multi-family', 'office', 0, 2, 3500, 2015, '—', 650000,
    ['Visitor parking', 'Power backup', 'CCTV', 'Fire safety', 'Near metro', 'Near mall'],
    'High-street showroom with a 40-foot glass frontage at one of Bengaluru’s busiest retail junctions.'],
  ['Electronic City Warehouse', 'Phase 2, Hosur Road', 'Electronic City', '560100', 'lease', 'Land', 'office', 0, 2, 25000, 2018, '0.8 acres', 900000,
    ['Visitor parking', 'Power backup', '24/7 security', 'CCTV', 'Fire safety'],
    'Ready-to-use warehouse with 32-foot clear height, three loading docks and easy access to NICE Road.'],
  ['Corporate Lease 3 BHK, Koramangala', '6th Block, 17th Main', 'Koramangala', '560095', 'lease', 'Apartment', 'tower', 3, 3, 1900, 2018, '—', 95000,
    ['Furnished', 'Air conditioning', 'Washer / dryer', 'Lift / elevator', 'Gym', 'Power backup', 'Maintenance staff'],
    'Fully furnished executive apartment offered on an 11-month corporate lease with housekeeping included.'],
  ['JP Nagar Co-working Space', '15th Cross, JP Nagar 6th Phase', 'JP Nagar', '560078', 'lease', 'Multi-family', 'office', 0, 3, 6500, 2021, '—', 420000,
    ['High-speed internet', 'Air conditioning', 'Power backup', 'Lift / elevator', 'Visitor parking', 'CCTV'],
    'Modern co-working floor with private cabins, phone booths and a terrace café, ready for immediate move-in.'],
];

const INQUIRIES = [
  ['Sneha Kulkarni', 'sneha.k@example.com', '+91 98765 43210', 'tour', 0, 'Can I schedule a site visit this Saturday morning?'],
  ['Rahul Verma', 'rahul.v@example.com', '+91 91234 56789', 'tour', 4, 'Is the price negotiable for a quick close?'],
  ['Meera Pillai', 'meera.p@example.com', '+91 99887 76655', 'tour', 8, 'Looking to move in by the 1st. Are pets allowed?'],
  ['TechNova Pvt Ltd', 'facilities@technova.example.com', '+91 80 4123 4567', 'tour', 13, 'We need 200 seats from next quarter. Please share the lease terms.'],
  ['Aditya Joshi', 'aditya.j@example.com', '+91 90080 11223', 'valuation', null, 'I want to sell my 3 BHK in Marathahalli.', { address: 'Marathahalli, Bengaluru', timeline: '1–3 months' }],
  ['Fatima Khan', 'fatima.k@example.com', '+91 97311 44556', 'contact', null, 'Do you help NRIs buy property remotely?'],
];

export function buildSeed(inrPerUsd = FALLBACK_INR_PER_USD, now = Date.now()) {
  const properties = LISTINGS.map(([title, address, locality, zip, status, type, kind, beds, baths, sqft, yearBuilt, lot, priceINR, features, description], i) => ({
    id: `seed${i + 1}`,
    title,
    address,
    city: `${locality}, Bengaluru`,
    state: 'KA',
    zip,
    price: Math.round(priceINR / inrPerUsd),
    status,
    type,
    beds: beds || '',
    baths: baths || '',
    sqft,
    yearBuilt: yearBuilt || '',
    lot,
    images: gallery(kind, i),
    features,
    description,
    featured: i % 3 === 0,
    hot: i % 4 === 1,
    agentId: AGENTS[i % AGENTS.length].id,
    createdAt: now - i * DAY * 0.7,
  }));

  const inquiries = INQUIRIES.map(([name, email, phone, type, listing, message, extra = {}], i) => {
    const p = listing == null ? null : properties[listing];
    return {
      id: `seedq${i + 1}`,
      name, email, phone, type, message, ...extra,
      propertyId: p?.id,
      subject: p ? `${p.address}, ${p.city}` : '',
      status: i < 3 ? 'new' : i < 5 ? 'contacted' : 'closed',
      createdAt: now - i * DAY * 0.4,
    };
  });

  return {
    properties,
    agents: AGENTS.map((a, i) => ({ ...a, createdAt: now - i * DAY })),
    inquiries,
    users: [],
    settings: { currency: 'INR', rates: {}, autoRates: true, mortgageRate: 8.5 },
  };
}
