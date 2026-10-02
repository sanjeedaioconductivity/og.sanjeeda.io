#!/usr/bin/env node
/**
 * Sprint 10, Story 10.6.1 — pre-flight before removing the `yesno` scoreType.
 *
 * Removing "yesno" from the OgQuestions enum is safe ONLY if no document uses
 * it. Mongoose enum validation runs on write, not read, so a stray yesno
 * document would not error on load — it would sit there until something re-saved
 * it and then fail. So this must be confirmed 0 in EVERY environment before the
 * schema narrows, not just locally.
 *
 *   node scripts/check-yesno-count.mjs            # local  (MONGODB_URI)
 *   node scripts/check-yesno-count.mjs --prod     # production (MONGODB_URI_PROD or MONGODB_URI)
 *
 * Read-only. Exits non-zero if any yesno document exists, so it can gate a
 * deploy step.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env.local", ".env"]) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const prod = process.argv.includes("--prod");
const uri = prod ? process.env.MONGODB_URI_PROD || process.env.MONGODB_URI : process.env.MONGODB_URI;

if (!uri) {
  console.error(`[check-yesno] No Mongo URI for ${prod ? "production" : "local"}.`);
  process.exit(1);
}

const conn = await mongoose.createConnection(uri).asPromise();
try {
  // Query the raw collection so this does not depend on the model (whose enum
  // we are about to change).
  const n = await conn.db.collection("og_questions").countDocuments({ scoreType: "yesno" });
  console.log(`[check-yesno] ${prod ? "PRODUCTION" : "local"}: ${n} document(s) with scoreType "yesno".`);

  if (n > 0) {
    const docs = await conn.db
      .collection("og_questions")
      .find({ scoreType: "yesno" }, { projection: { fieldId: 1 } })
      .toArray();
    console.error(`[check-yesno] STOP — do not narrow the enum. Offending fieldIds:`);
    for (const d of docs) console.error(`  - ${d.fieldId}`);
    process.exit(2);
  }
  console.log("[check-yesno] Safe to remove the yesno scoreType in this environment.");
} finally {
  await conn.close();
}
