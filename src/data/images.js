const u = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

export const IMAGES = [
  u('1600596542815-ffad4c1539a9'),
  u('1600585154340-be6161a56a0c'),
  u('1512917774080-9991f1c4c750'),
  u('1568605114967-8130f3a36994'),
  u('1570129477492-45c003edd2be'),
  u('1580587771525-78b9dba3b914'),
  u('1564013799919-ab600027ffc6'),
  u('1600607687939-ce8a6c25118c'),
  u('1613490493576-7fde63acd811'),
  u('1599809275671-b5942cabc7a2'),
];

// Drone view of Kingfisher Towers and UB City, Bengaluru (photo supplied by the site owner),
// graded and upscaled to 4K. Large screens get the 3840px file.
export const HERO_IMAGE = '/images/hero-ubcity-drone-1920.jpg';
export const HERO_IMAGE_LARGE = '/images/hero-ubcity-drone-3840.jpg';
// Set to { text, url } if the photographer needs to be credited.
export const HERO_CREDIT = null;
