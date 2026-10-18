import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = join(dirname(fileURLToPath(import.meta.url)), 'data', 'db.json');

const EMPTY = {
  properties: [],
  agents: [],
  inquiries: [],
  users: [],
  settings: { currency: 'USD', rates: {}, autoRates: true, mortgageRate: null },
};

let data = load();

function load() {
  if (!existsSync(FILE)) return structuredClone(EMPTY);
  try {
    return { ...structuredClone(EMPTY), ...JSON.parse(readFileSync(FILE, 'utf8')) };
  } catch {
    return structuredClone(EMPTY);
  }
}

// Writes atomically so a crash mid-write never corrupts the database.
function save() {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(`${FILE}.tmp`, JSON.stringify(data, null, 2));
  renameSync(`${FILE}.tmp`, FILE);
}

export const db = {
  get: (key) => data[key],
  set: (key, value) => { data[key] = value; save(); },
};
