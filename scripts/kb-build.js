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

const INS_SQL = path.join(DB_DIR, 'seed_insurance_companies.sql');
const OUT_INS = path.join(PUBLIC, 'offline-insurance.json');
const INTEL_SQL = path.join(DB_DIR, 'migrations', '002_populate_intelligence_data.sql');
const OUT_KB = path.join(PUBLIC, 'offline-kb.json');
const DOC_DIRS = [
  path.join(ROOT, 'docs_archive'),
  ROOT,
];

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
  // Slice to the VALUES section and extract row tuples reliably
  const tailFull = sqlText.slice(insertIdx);
  const valuesIdx = tailFull.toUpperCase().indexOf('VALUES');
  if (valuesIdx === -1) return [];
  let tail = tailFull.slice(valuesIdx + 'VALUES'.length);
  const stopIdx = tail.toUpperCase().indexOf('ON CONFLICT');
  if (stopIdx !== -1) tail = tail.slice(0, stopIdx);

  const rowStrings = extractParenRows(tail);
  const rows = [];
  for (const raw of rowStrings) {
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

function extractParenRows(s) {
  const res = [];
  let depth = 0, inQuote = false, buf = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "'") inQuote = !inQuote;
    if (!inQuote) {
      if (ch === '(') {
        if (depth === 0) buf = '';
        depth++;
        continue;
      } else if (ch === ')') {
        depth--;
        if (depth === 0) {
          res.push(buf);
          buf = '';
          continue;
        }
        continue;
      }
    }
    if (depth > 0) buf += ch;
  }
  return res;
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
    // Try to augment with intelligence updates
    try {
      const intelText = fs.readFileSync(INTEL_SQL, 'utf-8');
      const intelMap = parseInsuranceIntel(intelText);
      if (Object.keys(intelMap).length) {
        for (const c of companies) {
          const name = c.name;
          if (intelMap[name]) {
            c.intel = intelMap[name];
          }
        }
      }
    } catch (e) {
      // optional
    }
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

function parseInsuranceIntel(text) {
  // Parse UPDATE insurance_companies SET ... WHERE name = 'X'; blocks
  const updates = {};
  const blocks = text.split(/UPDATE\s+insurance_companies\s+SET/gi).slice(1);
  for (const block of blocks) {
    const whereIdx = block.toUpperCase().lastIndexOf('WHERE NAME');
    if (whereIdx === -1) continue;
    const setPart = block.slice(0, whereIdx);
    const wherePart = block.slice(whereIdx);
    const nameMatch = wherePart.match(/WHERE\s+name\s*=\s*'([^']+)'/i);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const fields = {};
    // Split by commas not inside quotes
    const parts = splitSqlAssignments(setPart);
    for (const p of parts) {
      const m = p.match(/([a-zA-Z_]+)\s*=\s*(.+)/);
      if (!m) continue;
      const key = m[1];
      const raw = m[2].trim().replace(/,$/, '');
      fields[key] = stripQuotes(raw);
    }
    updates[name] = fields;
  }
  return updates;
}

function splitSqlAssignments(s) {
  const out = [];
  let buf = '';
  let inQuote = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "'") inQuote = !inQuote;
    if (ch === ',' && !inQuote) { out.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function ensureKBBase() {
  const base = readOrDefault(OUT_KB, { version: 1, entries: [] });
  // Ensure structure
  if (!base.version) base.version = 1;
  if (!Array.isArray(base.entries)) base.entries = [];
  // Merge extracted doc entries
  try {
    const docEntries = extractFromDocs();
    const merged = mergeEntries(base.entries, docEntries);
    base.entries = merged;
    base.builtAt = new Date().toISOString();
  } catch (e) {
    console.log('[KB] Doc extraction skipped:', e.message);
  }
  writeJSON(OUT_KB, base);
  console.log(`[KB] Ensured base KB at public/offline-kb.json (${base.entries.length} entries)`);
}

function main() {
  ensureDir(PUBLIC);
  buildInsurance();
  ensureKBBase();
}

main();

// -------------------------
// Doc extraction utilities
// -------------------------

function extractFromDocs() {
  const files = collectMarkdownFiles(DOC_DIRS);
  const entries = [];
  const KEYWORDS = [
    'code', 'gaf', 'maryland', 'matching', 'storm', 'noaa', 'approval', 'denial', 'rebuttal', 'script',
    'adjuster', 'wind', 'hail', 'slope', 'double layer', 'overlay', 'warranty'
  ];
  for (const file of files) {
    let text = '';
    try { text = fs.readFileSync(file, 'utf-8'); } catch { continue; }
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^#{2,3}\s+/.test(line)) {
        const heading = line.replace(/^#+\s+/, '').trim();
        // Collect the paragraph below the heading
        let para = '';
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const l = lines[j].trim();
          if (l.startsWith('#')) break;
          if (l.length === 0) { if (para) break; else continue; }
          para += (para ? ' ' : '') + l;
        }
        const lc = (heading + ' ' + para).toLowerCase();
        if (KEYWORDS.some(k => lc.includes(k))) {
          const kws = KEYWORDS.filter(k => lc.includes(k));
          entries.push({ keywords: uniqueKeywords(kws), answer: trimAnswer(heading + ': ' + para) });
        }
      }
    }
  }
  return entries.slice(0, 200); // keep conservative size
}

function collectMarkdownFiles(dirs) {
  const acc = [];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    const items = fs.readdirSync(d);
    for (const it of items) {
      const p = path.join(d, it);
      try {
        const st = fs.statSync(p);
        if (st.isDirectory()) {
          // only scan shallow docs dir
          if (path.basename(d) === 'docs_archive') continue;
        } else if (/\.(md|markdown|mdx)$/i.test(it)) {
          acc.push(p);
        }
      } catch {}
    }
  }
  return acc;
}

function mergeEntries(base, extra) {
  const merged = base.slice();
  const seen = new Set(merged.map(e => JSON.stringify(e)));
  for (const e of extra) {
    const s = JSON.stringify(e);
    if (!seen.has(s)) { seen.add(s); merged.push(e); }
  }
  return merged;
}

function uniqueKeywords(arr) {
  const set = new Set(arr.map(a => String(a).toLowerCase()));
  return Array.from(set);
}

function trimAnswer(s) {
  if (!s) return s;
  return s.replace(/\s+/g, ' ').trim().slice(0, 1200);
}
