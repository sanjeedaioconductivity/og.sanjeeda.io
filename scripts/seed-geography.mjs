#!/usr/bin/env node
/**
 * Seeds OgGeography with every country and its major cities.
 *
 * Run with:  node scripts/seed-geography.mjs
 * Requires MONGODB_URI in the environment (same convention as dbConnect.js).
 *
 * WHY SEPARATE FROM seed-offerguide.js
 * That script rebuilds every OfferGuide collection and is destructive by design
 * (deleteMany + insertMany). Geography is the one collection admins edit through
 * the admin config routes, so it needs a loader that can be re-run safely on its
 * own without taking the scored question bank down with it.
 *
 * NON-DESTRUCTIVE BY DESIGN
 * A city already in the database is left exactly as it is — including a manually
 * set `active: false`. Re-running this therefore adds what is missing and never
 * silently resurrects a city an admin deliberately switched off, nor drops one
 * they added by hand that this file does not know about. Country `active` flags
 * are likewise preserved for countries that already exist.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseGeoData } from '../src/lib/offerguide/geoData.js';
import { OgGeography } from '../src/lib/db/mongo/models/index.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

if (!process.env.MONGODB_URI) {
  console.error('[seed-geography] ERROR: MONGODB_URI is not set.');
  process.exit(1);
}

const countries = parseGeoData();

await mongoose.connect(process.env.MONGODB_URI);
console.log(`[seed-geography] Connected. Seeding ${countries.length} countries…`);

let created = 0;
let updated = 0;
let citiesAdded = 0;

for (const country of countries) {
  const existing = await OgGeography.findOne({ countryCode: country.countryCode });

  if (!existing) {
    await OgGeography.create(country);
    created += 1;
    citiesAdded += country.cities.length;
    continue;
  }

  // Merge: keep every city already stored (and its active flag), append new ones.
  const seen = new Set(existing.cities.map((c) => c.cityId));
  const additions = country.cities.filter((c) => !seen.has(c.cityId));

  if (additions.length > 0) {
    existing.cities.push(...additions);
    citiesAdded += additions.length;
  }

  // Backfill the display name if it was missing, but never override an edit.
  if (!existing.countryName) existing.countryName = country.countryName;

  if (additions.length > 0 || existing.isModified()) {
    await existing.save();
    updated += 1;
  }
}

const totalCities = countries.reduce((n, c) => n + c.cities.length, 0);
console.log(
  `[seed-geography] Done. ${created} countries created, ${updated} updated, ` +
    `${citiesAdded} cities added (${totalCities} in this dataset).`
);

await mongoose.disconnect();
process.exit(0);
