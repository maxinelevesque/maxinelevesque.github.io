#!/usr/bin/env node
// Generate src/content/{writing,dialogues,research}/*.md from the canonical content repo
// `maxinelevesque/writing` (pieces/**), merged with presentation.json.
//
//   - semantic frontmatter (title, subtitle, date, updated, kind, coauthor,
//     formerName, summary, canonical) comes from each pieces/<slug>/index.md
//   - presentation (system index, readTime) comes from presentation.json, keyed
//     by slug — this is the build-time merge that keeps those fields in the
//     generated frontmatter where the Astro pages/OG routes already read them
//   - routing: kind dialogue -> dialogues, report -> research, else -> writing
//
// Source resolution:
//   WRITING_SRC=/path/to/writing   use a local checkout (no clone) — used in dev
//   otherwise                      shallow-clone $WRITING_REPO_URL @ $WRITING_REF
//
// Slugs present in the site but NOT in pieces/ (e.g. the straw-holes stub) are
// left untouched. Dep-free by design (mirrors writing/scripts/validate).

import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, rmSync, cpSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_URL = process.env.WRITING_REPO_URL || 'https://github.com/maxinelevesque/writing.git';
const REF = process.env.WRITING_REF || 'main';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function die(msg) { console.error(`generate-content: ${msg}`); process.exit(1); }

// --- resolve the writing source (local dir or shallow clone) ---
let src = process.env.WRITING_SRC;
let cleanup = null;
if (src) {
  if (!existsSync(join(src, 'pieces'))) die(`WRITING_SRC=${src} has no pieces/ dir`);
  console.log(`generate-content: using local writing source ${src}`);
} else {
  const tmp = mkdtempSync(join(tmpdir(), 'writing-'));
  console.log(`generate-content: cloning ${REPO_URL} @ ${REF}`);
  execSync(`git clone --depth 1 --branch ${REF} ${REPO_URL} ${tmp}`, { stdio: 'inherit' });
  src = tmp;
  cleanup = () => rmSync(tmp, { recursive: true, force: true });
}

// --- presentation sidecar ---
const presentation = JSON.parse(readFileSync(join(ROOT, 'presentation.json'), 'utf8'));

// --- minimal frontmatter split + parse (flat key: value, values may be quoted) ---
function splitFrontmatter(raw, where) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) die(`${where}: missing or malformed frontmatter`);
  return { fm: m[1], body: m[2] };
}
function parseFrontmatter(fm) {
  const out = {};
  for (const line of fm.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

// Flow sequence `[a, "b, c", d]` -> ['a', 'b, c', 'd'], splitting on commas
// outside double quotes (mirrors writing/scripts/lib/frontmatter.mjs).
function parseFlowList(val, where) {
  if (val === undefined) return [];
  const v = val.trim();
  if (!v.startsWith('[') || !v.endsWith(']')) die(`${where}: expected a [flow, list] (got ${v})`);
  const parts = [];
  let cur = '';
  let quoted = false;
  const inner = v.slice(1, -1);
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (quoted && ch === '\\' && i + 1 < inner.length) { cur += inner[++i]; continue; }
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === ',' && !quoted) { parts.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur.trim());
  return parts.filter(Boolean);
}

// Contributor entries are persona keys, optionally "key: role" (writing SCHEMA.md).
// Resolved against the writing repo's personas.json for the display name; the
// piece's role overrides the persona's default role.
let personas = {};
function resolveContributors(list, slug) {
  return list.map((entry) => {
    const i = entry.indexOf(':');
    const key = (i === -1 ? entry : entry.slice(0, i)).trim();
    const role = i === -1 ? '' : entry.slice(i + 1).trim();
    const p = personas[key];
    if (!p) die(`${slug}: unknown contributor persona "${key}"`);
    const out = { name: p.displayName || key };
    if (role || p.role) out.role = role || p.role;
    return out;
  });
}

// kind -> site collection. Mirrors writing/scripts/validate's SEGMENT table.
const COLLECTION = { essay: 'writing', fiction: 'writing', note: 'writing', dialogue: 'dialogues', report: 'research' };
const REGISTER = { writing: 'writing', dialogues: 'dialogue', research: 'research' };
const DEFAULT_SYSTEM = { writing: 0, dialogues: 2, research: 9 };

function humanDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso; // already human, or non-ISO — pass through
  const [, y, mo, d] = m;
  return `${MONTHS[Number(mo) - 1]} ${Number(d)}, ${y}`;
}

const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// --- generate ---
const piecesDir = join(src, 'pieces');
const slugs = readdirSync(piecesDir).filter((n) => statSync(join(piecesDir, n)).isDirectory()).sort();
if (slugs.length === 0) die(`no pieces found in ${piecesDir}`);

// Wipe previously-generated content before regenerating so a slug removed or
// renamed upstream disappears (GitHub Pages deploys the whole dist, and a stale
// committed .md would otherwise resurrect a dead URL). SITE_LOCAL lists any
// content files that are NOT generated from pieces/** and must be preserved.
// (Empty now that straw-holes has been promoted into pieces/ upstream.)
const SITE_LOCAL = new Set();
for (const coll of ['writing', 'dialogues', 'research']) {
  const dir = join(ROOT, 'src', 'content', coll);
  mkdirSync(dir, { recursive: true }); // may not exist on a fresh clone (generated dirs are gitignored)
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.md') && !SITE_LOCAL.has(`${coll}/${f.replace(/\.md$/, '')}`)) rmSync(join(dir, f));
  }
}

try { personas = JSON.parse(readFileSync(join(src, 'personas.json'), 'utf8')); } catch {}

// Per-piece static files (the read-aloud companion) are copied to
// public/<collection>/<slug>/; the whole tree is regenerated each run.
const PIECE_PUBLIC = join(ROOT, 'public', 'research');
rmSync(PIECE_PUBLIC, { recursive: true, force: true });

const written = [];
for (const slug of slugs) {
  const file = join(piecesDir, slug, 'index.md');
  if (!existsSync(file)) die(`${slug}: no index.md`);
  const { body } = splitFrontmatter(readFileSync(file, 'utf8'), slug);
  const fmParsed = parseFrontmatter(splitFrontmatter(readFileSync(file, 'utf8'), slug).fm);

  const kind = fmParsed.kind;
  if (!kind) die(`${slug}: missing kind`);

  // Authorship / register distinction. This site has three registers:
  //   solo     (warm, burgundy)  -> writing collection,   byline = formerName?
  //   co-write (cool, midnight)  -> dialogues collection, byline = "× {coauthor}"
  //   research (ochre)           -> research collection,  byline = "× {coauthor}"?
  // Per the upstream schema (writing/scripts/validate rule 6), dialogues must
  // name a coauthor, reports may, and other kinds may not. We assert that here
  // so a mis-tagged piece FAILS loudly instead of silently rendering in the
  // wrong register or losing its coauthor byline.
  const collection = COLLECTION[kind];
  if (!collection) die(`${slug}: unknown kind "${kind}"`);
  const isCoWrite = Boolean(fmParsed.coauthor);
  if (kind === 'dialogue' && !isCoWrite) {
    die(`${slug}: kind: dialogue but no coauthor — a co-write must name its coauthor.`);
  }
  if (collection === 'writing' && isCoWrite) {
    die(`${slug}: coauthor present on kind: ${kind}. Only dialogues and reports carry a coauthor byline. ` +
        `Mark it kind: dialogue or kind: report upstream.`);
  }

  const expectedRegister = REGISTER[collection];
  let pres = presentation[slug];
  if (pres) {
    // Curated entry present: its values win, but must agree with the routing.
    if (pres.collection && pres.collection !== collection) {
      die(`${slug}: presentation collection "${pres.collection}" disagrees with kind "${kind}" -> ${collection}`);
    }
    if (pres.register && pres.register !== expectedRegister) {
      die(`${slug}: presentation register "${pres.register}" disagrees with collection "${collection}" (expected "${expectedRegister}")`);
    }
  } else {
    // No curated presentation yet — default so a brand-new upstream piece still
    // auto-publishes (this is the whole point of the content-updated rebuild).
    // system falls back to the collection's default background; readTime is
    // estimated from body length (~200 wpm). Curate later by adding an entry to
    // presentation.json — an explicit entry always overrides these defaults.
    const words = body.trim().split(/\s+/).filter(Boolean).length;
    const readMin = Math.max(1, Math.round(words / 200));
    pres = { collection, register: expectedRegister, system: DEFAULT_SYSTEM[collection], readTime: `${readMin} min` };
    console.warn(`generate-content: ${slug} has no presentation.json entry — defaulting system=${pres.system}, readTime="${pres.readTime}". Add an entry to curate.`);
  }

  // Compose the site's frontmatter: semantic fields + injected presentation.
  const lines = ['---', `title: ${q(fmParsed.title)}`];
  if (fmParsed.subtitle) lines.push(`subtitle: ${q(fmParsed.subtitle)}`);
  lines.push(`date: ${q(humanDate(fmParsed.date))}`);
  if (fmParsed.updated) lines.push(`updated: ${q(humanDate(fmParsed.updated))}`);
  lines.push(`kind: ${kind}`);
  lines.push(`readTime: ${q(pres.readTime)}`);
  if (collection === 'writing' && fmParsed.formerName) lines.push(`formerName: ${q(fmParsed.formerName)}`);
  if (collection !== 'writing' && fmParsed.coauthor) lines.push(`coauthor: ${q(fmParsed.coauthor)}`);
  if (collection !== 'writing' && fmParsed.coauthorNote) lines.push(`coauthorNote: ${q(fmParsed.coauthorNote)}`);
  if (collection === 'research') {
    const contributors = resolveContributors(parseFlowList(fmParsed.contributors, slug), slug);
    if (contributors.length) lines.push(`contributors: ${JSON.stringify(contributors)}`);
    if (fmParsed.readAloud) {
      // The upstream validator guarantees a contained relative .txt path.
      const from = join(piecesDir, slug, fmParsed.readAloud);
      if (!existsSync(from)) die(`${slug}: readAloud file not found: ${fmParsed.readAloud}`);
      const name = fmParsed.readAloud.split('/').pop();
      mkdirSync(join(PIECE_PUBLIC, slug), { recursive: true });
      cpSync(from, join(PIECE_PUBLIC, slug, name));
      lines.push(`readAloud: ${q(`/research/${slug}/${name}`)}`);
    }
  }
  if (fmParsed.summary) lines.push(`summary: ${q(fmParsed.summary)}`);
  lines.push(`system: ${Number(pres.system)}`);
  lines.push('---');

  // One blank line between frontmatter and body; single trailing newline.
  const out = lines.join('\n') + '\n\n' + body.replace(/^\n+/, '').replace(/\s*$/, '') + '\n';
  const dest = join(ROOT, 'src', 'content', collection, `${slug}.md`);
  writeFileSync(dest, out);
  written.push(`${collection}/${slug}.md`);
}

// standard.site domain verification: /.well-known/site.standard.publication must
// contain the publication record's AT-URI so clients can verify the
// domain <-> publication link (https://standard.site/docs/verification/). Generated
// from the writing repo's records.json so it self-updates if the rkey ever changes.
const recordsPath = join(src, 'records.json');
if (existsSync(recordsPath)) {
  try {
    const records = JSON.parse(readFileSync(recordsPath, 'utf8'));
    const pubUri = records?.publication?.uri;
    if (pubUri) {
      const wellKnown = join(ROOT, 'public', '.well-known');
      mkdirSync(wellKnown, { recursive: true });
      writeFileSync(join(wellKnown, 'site.standard.publication'), pubUri); // plain text, no trailing newline
      console.log(`generate-content: wrote public/.well-known/site.standard.publication -> ${pubUri}`);
    } else {
      console.warn('generate-content: records.json has no publication.uri — skipping .well-known verification file');
    }
    // Per-page atproto link data, consumed by Base.astro to emit
    // <link rel="site.standard.document"> (per slug) + <link rel="site.standard.publication">
    // tags that Bluesky's crawler reads to render the enhanced link card.
    const documents = {};
    for (const [slug, rec] of Object.entries(records?.documents ?? {})) {
      if (rec?.uri) documents[slug] = rec.uri;
    }
    const dataDir = join(ROOT, 'src', 'data');
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(join(dataDir, 'atproto.json'), JSON.stringify({ publication: pubUri ?? '', documents }, null, 2) + '\n');
    console.log(`generate-content: wrote src/data/atproto.json (${Object.keys(documents).length} documents + publication)`);
  } catch (e) {
    console.warn(`generate-content: could not read records.json (${e.message}) — skipping .well-known + atproto.json`);
  }
} else {
  console.warn('generate-content: no records.json in source — skipping .well-known + atproto.json');
}

// Persona did:web documents: serve the writing repo's did-docs/personas/** at
// /personas/<key>/did.json so did:web:maxine.science:personas:<key> resolves.
// GitHub Pages serves .json as application/json; server-side atproto resolvers
// need no CORS. Wiped + recopied each run so removed personas don't linger.
const didSrc = join(src, 'did-docs', 'personas');
const didDest = join(ROOT, 'public', 'personas');
if (existsSync(didSrc)) {
  rmSync(didDest, { recursive: true, force: true });
  cpSync(didSrc, didDest, { recursive: true });
  const keys = readdirSync(didDest).filter((n) => existsSync(join(didDest, n, 'did.json')));
  console.log(`generate-content: copied ${keys.length} persona did:web doc(s) to public/personas/ (${keys.join(', ')})`);
} else {
  console.warn('generate-content: no did-docs/personas in source — skipping persona DID docs');
}

if (cleanup) cleanup();
console.log(`generate-content: wrote ${written.length} files:\n  ${written.join('\n  ')}`);
