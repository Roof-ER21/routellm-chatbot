#!/usr/bin/env node
/*
  Offline Knowledge Builder
  - Parses seed SQL for insurance companies
  - Merges/ensures offline knowledge JSON
  - Writes pre-cached assets under public/

  Zero-config: runs as part of npm run build
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const DB_DIR = path.join(ROOT, 'db');

const INS_SQL = path.join(DB_DIR, 'insurance_companies.sql');
const OUT_INS = path.join(PUBLIC, 'offline-insurance.json');
const OUT_KB = path.join(PUBLIC, 'offline-kb.json');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function readOrDefault(p, def) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch (_) { return def; }
}

function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

function parseInsuranceSQL(sqlText) {
  // Find the big INSERT block
  const insertIdx = sqlText.indexOf('INSERT INTO insurance_companies');
  if (insertIdx === -1) return [];
  // Slice until ON CONFLICT or ;
  let tail = sqlText.slice(insertIdx);
  const stopIdx = tail.indexOf('ON CONFLICT');
  if (stopIdx !== -1) tail = tail.slice(0, stopIdx);

  // Extract rows between parentheses ( ... )
  const rows = [];
  const regex = /\(([^\)]*)\)\s*,?/gms;
  let m;
  while ((m = regex.exec(tail)) !== null) {
    const raw = m[1];
    const vals = splitSqlValues(raw);
    if (!vals || vals.length < 7) continue;

    const [name, claimType, phone, phoneInstr, email, additionalEmail, notes] = vals;
    rows.push({
      name: stripQuotes(name),
      claim_handler_type: stripQuotes(claimType),
      phone: stripQuotes(phone),
      phone_instructions: toMaybe(stripQuotes(phoneInstr)),
      email: toMaybe(stripQuotes(email)),
      additional_email: toMaybe(stripQuotes(additionalEmail)),
      notes: toMaybe(stripQuotes(notes)),
    });
  }
  return dedupeBy(rows, (r) => r.name || '');
}

function splitSqlValues(s) {
  const out = [];
  let buf = '';
  let inQuote = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) { buf += ch; esc = false; continue; }
    if (ch === "\\") { buf += ch; continue; } // keep backslash
    if (ch === "'") { inQuote = !inQuote; buf += ch; continue; }
    if (ch === ',' && !inQuote) { out.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  if (buf) out.push(buf.trim());
  return out.map(v => v === 'NULL' ? null : v);
}

function stripQuotes(v) {
  if (v == null) return null;
  const t = String(v).trim();
  if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1).replace(/''/g, "'");
  return t;
}

function toMaybe(v) { return v && v.length ? v : null; }

function dedupeBy(arr, keyFn) {
  const seen = new Set();
  const res = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (!k || seen.has(k)) continue;
    seen.add(k); res.push(item);
  }
  return res;
}

function buildInsurance() {
  try {
    const sql = fs.readFileSync(INS_SQL, 'utf-8');
    const companies = parseInsuranceSQL(sql);
    if (companies.length) {
      writeJSON(OUT_INS, companies);
      console.log(`[KB] Wrote ${companies.length} companies → public/offline-insurance.json`);
    } else {
      console.log('[KB] No companies parsed; keeping existing offline-insurance.json');
    }
  } catch (e) {
    console.log('[KB] Insurance SQL not found or parse failed; skipping:', e.message);
  }
}

function ensureKBBase() {
  const base = readOrDefault(OUT_KB, { version: 1, entries: [] });
  // Ensure structure
  if (!base.version) base.version = 1;
  if (!Array.isArray(base.entries)) base.entries = [];
  writeJSON(OUT_KB, base);
  console.log(`[KB] Ensured base KB at public/offline-kb.json (${base.entries.length} entries)`);
}

function main() {
  ensureDir(PUBLIC);
  buildInsurance();
  ensureKBBase();
}

main();

