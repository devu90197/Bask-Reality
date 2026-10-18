// `npm run seed`: replaces listings, agents and inquiries with the sample data.
// Registered users are kept. Restart the API afterwards (stop and re-run npm run dev) to load it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeed } from './seed.js';

const FILE = join(dirname(fileURLToPath(import.meta.url)), 'data', 'db.json');
const current = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {};
// Convert rupee prices at today's rate so they display exactly as written.
const inrPerUsd = await fetch('https://open.er-api.com/v6/latest/USD')
  .then((r) => r.json()).then((d) => d.rates.INR).catch(() => undefined);
const seed = buildSeed(inrPerUsd);

mkdirSync(dirname(FILE), { recursive: true });
writeFileSync(FILE, JSON.stringify({ ...seed, users: current.users || [] }, null, 2));
console.log(`Seeded ${seed.properties.length} listings, ${seed.agents.length} agents, ${seed.inquiries.length} inquiries (₹${inrPerUsd ?? 'fallback'} per USD).`);
