import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeed } from './seed.js';

const FILE = join(dirname(fileURLToPath(import.meta.url)), 'data', 'db.json');

const EMPTY = {
  properties: [],
  agents: [],
  inquiries: [],
  users: [],
  settings: { currency: 'INR', priceBase: 'INR', rates: {}, autoRates: true, mortgageRate: null },
  sessions: {},
};

let data = await migrateToInr(load());

// Prices used to be stored in USD. Move them to INR once: sample listings get their original rupee
// price back exactly; anything added since is converted at today's reference rate.
async function migrateToInr(value) {
  if (value.settings?.priceBase === 'INR') return value;
  const seedPrices = new Map(buildSeed().properties.map((p) => [p.id, p.price]));
  const inrPerUsd = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR')
    .then((r) => r.json()).then((d) => d.rates.INR).catch(() => 95);
  const migrated = {
    ...value,
    properties: value.properties.map((p) => ({
      ...p,
      price: seedPrices.get(p.id) ?? Math.round(Number(p.price || 0) * inrPerUsd),
    })),
    settings: { ...value.settings, priceBase: 'INR', rates: {} },
  };
  save(migrated);
  console.log(`Migrated ${migrated.properties.length} listing prices from USD to INR (1 USD = ₹${inrPerUsd}).`);
  return migrated;
}

// A fresh install starts with the sample data from seed.js.
function load() {
  if (!existsSync(FILE)) {
    const seeded = { ...structuredClone(EMPTY), ...buildSeed() };
    save(seeded);
    return seeded;
  }
  try {
    return { ...structuredClone(EMPTY), ...JSON.parse(readFileSync(FILE, 'utf8')) };
  } catch {
    return structuredClone(EMPTY);
  }
}

// Writes atomically so a crash mid-write never corrupts the database.
function save(value = data) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(`${FILE}.tmp`, JSON.stringify(value, null, 2));
  renameSync(`${FILE}.tmp`, FILE);
}

export const db = {
  get: (key) => data[key],
  set: (key, value) => { data[key] = value; save(); },
};
