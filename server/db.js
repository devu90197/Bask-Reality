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
  settings: { currency: 'USD', rates: {}, autoRates: true, mortgageRate: null },
};

let data = load();

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
