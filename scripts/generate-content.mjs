#!/usr/bin/env node
// Generate src/content/{writing,dialogues}/*.md from the canonical content repo
// `maxinelevesque/writing` (pieces/**), merged with presentation.json.
//
//   - semantic frontmatter (title, subtitle, date, updated, kind, coauthor,
//     formerName, summary, canonical) comes from each pieces/<slug>/index.md
//   - presentation (system index, readTime) comes from presentation.json, keyed
//     by slug — this is the build-time merge that keeps those fields in the
//     generated frontmatter where the Astro pages/OG routes already read them
//   - routing: kind === 'dialogue' -> dialogues, else -> writing
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
// committed .md would otherwise resurrect a dead URL). Site-local files that are
// NOT generated from pieces/** are preserved — currently just the straw-holes
// stub, until it's promoted upstream.
const SITE_LOCAL = new Set(['dialogues/straw-holes']);
for (const coll of ['writing', 'dialogues']) {
  const dir = join(ROOT, 'src', 'content', coll);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.md') && !SITE_LOCAL.has(`${coll}/${f.replace(/\.md$/, '')}`)) rmSync(join(dir, f));
  }
}

const written = [];
for (const slug of slugs) {
  const file = join(piecesDir, slug, 'index.md');
  if (!existsSync(file)) die(`${slug}: no index.md`);
  const { body } = splitFrontmatter(readFileSync(file, 'utf8'), slug);
  const fmParsed = parseFrontmatter(splitFrontmatter(readFileSync(file, 'utf8'), slug).fm);

  const kind = fmParsed.kind;
  if (!kind) die(`${slug}: missing kind`);

  // Authorship / register distinction. This site has exactly two registers:
  //   solo  (warm) -> writing collection,  byline = formerName?
  //   co-write (cool) -> dialogues collection, byline = "× {coauthor}"
  // Co-authorship is signalled by the semantic `coauthor` field, and — per the
  // upstream schema (writing/scripts/validate rule 6) — is fused with
  // kind: dialogue. We assert that invariant here so a mis-tagged piece FAILS
  // loudly instead of silently rendering in the wrong register / losing its
  // co-write byline. (If we ever want co-written essays/fiction, this is the
  // single place that has to change, alongside a coauthor byline in Writing.astro.)
  const isCoWrite = Boolean(fmParsed.coauthor);
  if (kind === 'dialogue' && !isCoWrite) {
    die(`${slug}: kind: dialogue but no coauthor — a co-write must name its coauthor.`);
  }
  if (kind !== 'dialogue' && isCoWrite) {
    die(`${slug}: coauthor present on kind: ${kind}. This site renders a co-write byline only in the dialogues collection. ` +
        `Mark it kind: dialogue upstream, or if it should be a co-written ${kind} we need the orthogonal-authorship change first.`);
  }
  const collection = kind === 'dialogue' ? 'dialogues' : 'writing';

  const expectedRegister = collection === 'dialogues' ? 'dialogue' : 'writing';
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
    pres = { collection, register: expectedRegister, system: collection === 'dialogues' ? 2 : 0, readTime: `${readMin} min` };
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
  if (collection === 'dialogues') lines.push(`coauthor: ${q(fmParsed.coauthor)}`);
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
    const pubUri = JSON.parse(readFileSync(recordsPath, 'utf8'))?.publication?.uri;
    if (pubUri) {
      const wellKnown = join(ROOT, 'public', '.well-known');
      mkdirSync(wellKnown, { recursive: true });
      writeFileSync(join(wellKnown, 'site.standard.publication'), pubUri); // plain text, no trailing newline
      console.log(`generate-content: wrote public/.well-known/site.standard.publication -> ${pubUri}`);
    } else {
      console.warn('generate-content: records.json has no publication.uri — skipping .well-known verification file');
    }
  } catch (e) {
    console.warn(`generate-content: could not read records.json (${e.message}) — skipping .well-known verification file`);
  }
} else {
  console.warn('generate-content: no records.json in source — skipping .well-known verification file');
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
