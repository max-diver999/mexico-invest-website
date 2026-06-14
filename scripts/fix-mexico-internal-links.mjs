#!/usr/bin/env node
/**
 * Mexico Invest — cross-link projects ↔ areas ↔ regional HUB guides.
 * Run: node scripts/fix-mexico-internal-links.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
const DRY = process.argv.includes('--dry-run');

/** project `area` frontmatter → area page + hubs */
const AREA_CONFIG = {
  tulum: { slug: 'tulum', label: 'Tulum', hub: 'invest-in-tulum', hub2: 'riviera-maya-property-investment-guide' },
  'aldea-zama-tulum': {
    slug: 'aldea-zama-tulum',
    label: 'Aldea Zama',
    hub: 'invest-in-tulum',
    hub2: 'riviera-maya-property-investment-guide',
    parent: 'tulum',
  },
  'playa-del-carmen': {
    slug: 'playa-del-carmen',
    label: 'Playa del Carmen',
    hub: 'invest-in-playa-del-carmen',
    hub2: 'riviera-maya-property-investment-guide',
  },
  'gonzalo-guerrero-playa': {
    slug: 'gonzalo-guerrero-playa',
    label: 'Gonzalo Guerrero',
    hub: 'invest-in-playa-del-carmen',
    hub2: 'riviera-maya-property-investment-guide',
    parent: 'playa-del-carmen',
  },
  'puerto-morelos': {
    slug: 'puerto-morelos',
    label: 'Puerto Morelos',
    hub: 'invest-in-riviera-maya',
    hub2: 'riviera-maya-property-investment-guide',
  },
  akumal: { slug: 'akumal', label: 'Akumal', hub: 'invest-in-riviera-maya', hub2: 'riviera-maya-property-investment-guide' },
  cozumel: {
    slug: 'playa-del-carmen',
    label: 'Playa del Carmen corridor',
    hub: 'invest-in-riviera-maya',
    hub2: 'riviera-maya-property-investment-guide',
    parent: 'playa-del-carmen',
  },
  holbox: { slug: 'tulum', label: 'Tulum corridor', hub: 'invest-in-tulum', hub2: 'riviera-maya-property-investment-guide', parent: 'tulum' },
  bacalar: { slug: 'tulum', label: 'Riviera Maya south', hub: 'invest-in-tulum', hub2: 'riviera-maya-property-investment-guide', parent: 'tulum' },
  cancun: { slug: 'cancun', label: 'Cancún', hub: 'invest-in-cancun', hub2: 'mexico-property-investment-guide' },
  campeche: { slug: 'merida', label: 'Mérida & Yucatán Gulf', hub: 'mexico-property-investment-guide', hub2: 'mexico-rental-yield-guide' },
  'cabo-corridor': {
    slug: 'cabo-corridor',
    label: 'Cabo Corridor',
    hub: 'los-cabos-property-investment-guide',
    hub2: 'invest-in-los-cabos',
  },
  'cabo-san-lucas': {
    slug: 'cabo-san-lucas',
    label: 'Cabo San Lucas',
    hub: 'los-cabos-property-investment-guide',
    hub2: 'invest-in-los-cabos',
  },
  'san-jose-del-cabo': {
    slug: 'san-jose-del-cabo',
    label: 'San José del Cabo',
    hub: 'los-cabos-property-investment-guide',
    hub2: 'invest-in-los-cabos',
  },
  'east-cape-baja': {
    slug: 'east-cape-baja',
    label: 'East Cape Baja',
    hub: 'los-cabos-property-investment-guide',
    hub2: 'invest-in-los-cabos',
    parent: 'cabo-corridor',
  },
  'puerto-vallarta': {
    slug: 'puerto-vallarta',
    label: 'Puerto Vallarta',
    hub: 'puerto-vallarta-property-investment-guide',
    hub2: 'invest-in-puerto-vallarta',
  },
  'nuevo-vallarta': {
    slug: 'nuevo-vallarta',
    label: 'Nuevo Vallarta',
    hub: 'puerto-vallarta-property-investment-guide',
    hub2: 'invest-in-puerto-vallarta',
  },
  'punta-mita': {
    slug: 'punta-de-mita',
    label: 'Punta Mita',
    hub: 'puerto-vallarta-property-investment-guide',
    hub2: 'invest-in-puerto-vallarta',
  },
  'punta-de-mita': {
    slug: 'punta-de-mita',
    label: 'Punta Mita',
    hub: 'puerto-vallarta-property-investment-guide',
    hub2: 'invest-in-puerto-vallarta',
  },
  'riviera-nayarit': {
    slug: 'nuevo-vallarta',
    label: 'Riviera Nayarit',
    hub: 'puerto-vallarta-property-investment-guide',
    hub2: 'invest-in-puerto-vallarta',
  },
};

const HUB_GUIDES = new Set([
  'invest-in-tulum',
  'invest-in-playa-del-carmen',
  'invest-in-riviera-maya',
  'invest-in-cancun',
  'invest-in-los-cabos',
  'invest-in-puerto-vallarta',
  'riviera-maya-property-investment-guide',
  'los-cabos-property-investment-guide',
  'puerto-vallarta-property-investment-guide',
  'mexico-property-investment-guide',
]);

const AREA_LABELS = Object.fromEntries(
  readdirSync(join(CONTENT, 'areas'))
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const raw = readFileSync(join(CONTENT, 'areas', f), 'utf8');
      const slug = f.replace(/\.mdx$/, '');
      const title = (raw.match(/^title:\s*["'](.+?)["']/m) || [])[1] || slug;
      const short = title.split(':')[0].trim();
      return [slug, short];
    }),
);

function parseMdx(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  return { fm: m[1], body: m[2] };
}

function getFmField(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?`, 'm'));
  return m ? m[1].trim() : null;
}

function titleAnchor(raw, slug) {
  const t = (raw.match(/^title:\s*["'](.+?)["']/m) || [])[1] || slug;
  const short = t.split(':')[0].trim().replace(/ Review$/, '');
  return short.length > 42 ? `${short.slice(0, 39)}…` : short;
}

function hasAreaLink(body, areaSlug) {
  return new RegExp(`\\]\\(/areas/${areaSlug}/\\)`, 'i').test(body);
}

function pickSiblings(slug, areaField, byArea) {
  const peers = (byArea.get(areaField) || []).filter((s) => s !== slug);
  const cfg = AREA_CONFIG[areaField];
  if (peers.length < 2 && cfg?.parent) {
    for (const [field, c] of Object.entries(AREA_CONFIG)) {
      if (c.slug === cfg.parent) {
        for (const s of byArea.get(field) || []) {
          if (s !== slug) peers.push(s);
        }
      }
    }
  }
  return [...new Set(peers)].slice(0, 2);
}

function buildProjectContextLine(slug, areaField, byArea, titles) {
  const cfg = AREA_CONFIG[areaField];
  if (!cfg) return null;
  const parts = [
    `[${cfg.label}](/areas/${cfg.slug}/)`,
    `[${cfg.hub === 'mexico-property-investment-guide' ? 'Mexico investment guide' : cfg.label + ' investment'}](/guides/${cfg.hub}/)`,
    `[${cfg.hub2.includes('riviera') || cfg.hub2.includes('cabos') || cfg.hub2.includes('vallarta') ? 'Regional guide' : 'Rental yields'}](/guides/${cfg.hub2}/)`,
    `[Due diligence](/guides/due-diligence-mexico-real-estate/)`,
  ];
  const siblings = pickSiblings(slug, areaField, byArea);
  let line = `Area & guides: ${parts.join(' · ')}.`;
  if (siblings.length) {
    const sibLinks = siblings.map((s) => `[${titleAnchor(titles.get(s), s)}](/projects/${s}/)`).join(' · ');
    line += ` Cluster: ${sibLinks}.`;
  }
  return line;
}

function insertAfterTldr(body, line) {
  if (body.includes(line)) return body;
  const m = body.match(/(<TldrBlock[^>]*\/>)\s*/);
  if (m) {
    const idx = m.index + m[0].length;
    return `${body.slice(0, idx)}\n${line}\n\n${body.slice(idx)}`;
  }
  const qm = body.match(/(Quick answer:[^\n]+\n\n)/);
  if (qm) {
    const idx = qm.index + qm[0].length;
    return `${body.slice(0, idx)}${line}\n\n${body.slice(idx)}`;
  }
  return body;
}

function projectsForAreaSlug(areaSlug) {
  const out = [];
  for (const [areaField, cfg] of Object.entries(AREA_CONFIG)) {
    if (cfg.slug === areaSlug || cfg.parent === areaSlug) {
      out.push(areaField);
    }
  }
  return out;
}

const ORPHAN_AREA_CROSS_LINKS = {
  bucerias: {
    areas: ['nuevo-vallarta', 'puerto-vallarta'],
    projects: ['vidanta-nuevo-vallarta', 'tao-blue-gardens-pv', 'garza-blanca-pv'],
  },
  'la-veleta-tulum': {
    areas: ['tulum', 'aldea-zama-tulum'],
    projects: ['amara-tulum', 'nhoa-aldea-zama', 'mistiq-tulum'],
  },
  playacar: {
    areas: ['playa-del-carmen', 'gonzalo-guerrero-playa'],
    projects: ['playacar-phase-ii', 'paravian-playa', 'distrito-xcalacoco-beach'],
  },
  'san-miguel-de-allende-property': {
    areas: ['merida'],
    projects: [],
    guides: ['mexico-property-investment-guide', 'can-foreigners-buy-property-mexico'],
  },
  sayulita: {
    areas: ['nuevo-vallarta', 'punta-de-mita'],
    projects: ['pendry-punta-mita', 'montage-punta-mita', 'tao-blue-gardens-pv'],
  },
  'zazil-ha-playa': {
    areas: ['playa-del-carmen', 'gonzalo-guerrero-playa'],
    projects: ['paravian-playa', 'it-building-playa', 'ocean-village-playa'],
  },
};

function buildOrphanAreaSection(areaSlug, spec, titles) {
  const label = AREA_LABELS[areaSlug] || areaSlug;
  const areaLinks = (spec.areas || [])
    .map((s) => `[${AREA_LABELS[s] || s}](/areas/${s}/)`)
    .join(' · ');
  const projectLinks = (spec.projects || [])
    .filter((s) => titles.has(s))
    .map((s) => `[${titleAnchor(titles.get(s), s)}](/projects/${s}/)`)
    .join(' · ');
  const guideLinks = (spec.guides || [])
    .filter((s) => existsSync(join(CONTENT, 'guides', `${s}.mdx`)))
    .map((s) => {
      const raw = readFileSync(join(CONTENT, 'guides', `${s}.mdx`), 'utf8');
      return `[${titleAnchor(raw, s)}](/guides/${s}/)`;
    })
    .join(' · ');
  const related = [projectLinks, guideLinks].filter(Boolean).join(' · ');
  return `---

## Nearby corridors and listings

${label} is a micro-market without dedicated project inventory on Mexico Invest yet. Start with adjacent area guides: ${areaLinks}.

Related reading: ${related}.

`;
}

function buildAreaProjectSection(areaSlug, projectSlugs, titles) {
  const label = AREA_LABELS[areaSlug] || areaSlug;
  const links = projectSlugs
    .slice(0, 8)
    .map((s) => `[${titleAnchor(titles.get(s), s)}](/projects/${s}/)`)
    .join(' · ');
  return `---

## Project reviews in ${label}

Browse off-plan and resale listings we cover in this corridor: ${links}.

Regional hubs: [Area guide](/areas/${areaSlug}/) pairs with investment guides linked from each project page.

`;
}

function buildHubProjectSection(hubSlug, projectSlugs, areaSlugs, titles) {
  const areaLinks = [...areaSlugs]
    .slice(0, 4)
    .map((s) => `[${AREA_LABELS[s] || s}](/areas/${s}/)`)
    .join(' · ');
  const projectLinks = projectSlugs
    .slice(0, 6)
    .map((s) => `[${titleAnchor(titles.get(s), s)}](/projects/${s}/)`)
    .join(' · ');
  return `---

## Areas and project reviews

Key markets: ${areaLinks}.

Featured projects: ${projectLinks}.

`;
}

// Index projects
const projectDir = join(CONTENT, 'projects');
const projectFiles = readdirSync(projectDir).filter((f) => f.endsWith('.mdx'));
const titles = new Map();
const byAreaField = new Map();
const byAreaSlug = new Map();

for (const f of projectFiles) {
  const slug = f.replace(/\.mdx$/, '');
  const raw = readFileSync(join(projectDir, f), 'utf8');
  titles.set(slug, raw);
  const parsed = parseMdx(raw);
  if (!parsed) continue;
  const areaField = getFmField(parsed.fm, 'area');
  if (!areaField) continue;
  if (!byAreaField.has(areaField)) byAreaField.set(areaField, []);
  byAreaField.get(areaField).push(slug);
  const cfg = AREA_CONFIG[areaField];
  if (cfg) {
    if (!byAreaSlug.has(cfg.slug)) byAreaSlug.set(cfg.slug, []);
    byAreaSlug.get(cfg.slug).push(slug);
    if (cfg.parent) {
      if (!byAreaSlug.has(cfg.parent)) byAreaSlug.set(cfg.parent, []);
      byAreaSlug.get(cfg.parent).push(slug);
    }
  }
}

for (const [, list] of byAreaSlug) {
  list.sort();
}

let changedProjects = 0;
let changedAreas = 0;
let changedHubs = 0;

// --- Projects ---
for (const f of projectFiles) {
  const path = join(projectDir, f);
  const slug = f.replace(/\.mdx$/, '');
  const raw = readFileSync(path, 'utf8');
  const parsed = parseMdx(raw);
  if (!parsed) continue;
  const areaField = getFmField(parsed.fm, 'area');
  const cfg = AREA_CONFIG[areaField];
  if (!cfg) continue;
  if (hasAreaLink(parsed.body, cfg.slug) && parsed.body.includes(`/guides/${cfg.hub}/`)) continue;

  let body = parsed.body;
  if (!hasAreaLink(body, cfg.slug) || !body.includes(`/guides/${cfg.hub}/`)) {
    const line = buildProjectContextLine(slug, areaField, byAreaField, titles);
    if (line) body = insertAfterTldr(body, line);
  }
  if (body !== parsed.body) {
    changedProjects++;
    if (!DRY) writeFileSync(path, `---\n${parsed.fm}\n---\n${body}`);
  }
}

// --- Areas ---
const areaDir = join(CONTENT, 'areas');
for (const f of readdirSync(areaDir).filter((x) => x.endsWith('.mdx'))) {
  const path = join(areaDir, f);
  const areaSlug = f.replace(/\.mdx$/, '');
  const raw = readFileSync(path, 'utf8');
  const parsed = parseMdx(raw);
  if (!parsed) continue;
  if (parsed.body.includes('/projects/') || parsed.body.includes('## Project reviews in') || parsed.body.includes('## Nearby corridors')) continue;

  const slugs = [...new Set(byAreaSlug.get(areaSlug) || [])].sort();
  if (!slugs.length) continue;

  const section = buildAreaProjectSection(areaSlug, slugs, titles);
  let body = parsed.body;
  const faqIdx = body.indexOf('<FaqBlock');
  if (faqIdx === -1) continue;
  body = body.slice(0, faqIdx) + section + body.slice(faqIdx);
  changedAreas++;
  if (!DRY) writeFileSync(path, `---\n${parsed.fm}\n---\n${body}`);
}

for (const [areaSlug, spec] of Object.entries(ORPHAN_AREA_CROSS_LINKS)) {
  const path = join(areaDir, `${areaSlug}.mdx`);
  if (!existsSync(path)) continue;
  const raw = readFileSync(path, 'utf8');
  const parsed = parseMdx(raw);
  if (!parsed) continue;
  if (parsed.body.includes('/projects/') || parsed.body.includes('## Nearby corridors')) continue;
  const section = buildOrphanAreaSection(areaSlug, spec, titles);
  let body = parsed.body;
  const faqIdx = body.indexOf('<FaqBlock');
  if (faqIdx === -1) continue;
  body = body.slice(0, faqIdx) + section + body.slice(faqIdx);
  changedAreas++;
  if (!DRY) writeFileSync(path, `---\n${parsed.fm}\n---\n${body}`);
}

// --- Regional hub guides ---
const HUB_TO_AREAS = {
  'invest-in-tulum': ['tulum', 'aldea-zama-tulum', 'la-veleta-tulum'],
  'riviera-maya-property-investment-guide': ['tulum', 'playa-del-carmen', 'puerto-morelos', 'akumal'],
  'invest-in-playa-del-carmen': ['playa-del-carmen', 'gonzalo-guerrero-playa', 'playacar'],
  'invest-in-riviera-maya': ['playa-del-carmen', 'puerto-morelos', 'tulum'],
  'invest-in-cancun': ['cancun'],
  'los-cabos-property-investment-guide': ['cabo-corridor', 'san-jose-del-cabo', 'cabo-san-lucas', 'east-cape-baja'],
  'invest-in-los-cabos': ['cabo-corridor', 'san-jose-del-cabo', 'cabo-san-lucas'],
  'puerto-vallarta-property-investment-guide': ['puerto-vallarta', 'nuevo-vallarta', 'punta-de-mita'],
  'invest-in-puerto-vallarta': ['puerto-vallarta', 'nuevo-vallarta', 'punta-de-mita'],
  'mexico-property-investment-guide': ['tulum', 'playa-del-carmen', 'cancun', 'merida'],
};

const guideDir = join(CONTENT, 'guides');
for (const hubSlug of HUB_GUIDES) {
  const guidePath = join(guideDir, `${hubSlug}.mdx`);
  if (!existsSync(guidePath)) continue;
  const raw = readFileSync(guidePath, 'utf8');
  const parsed = parseMdx(raw);
  if (!parsed) continue;
  if (parsed.body.includes('## Areas and project reviews')) continue;

  const areaSlugs = HUB_TO_AREAS[hubSlug] || [];
  const projectSlugs = [
    ...new Set(areaSlugs.flatMap((a) => byAreaSlug.get(a) || [])),
  ].sort();
  if (!projectSlugs.length) continue;

  const section = buildHubProjectSection(hubSlug, projectSlugs, areaSlugs, titles);
  let body = parsed.body;
  const faqIdx = body.indexOf('<FaqBlock');
  if (faqIdx === -1) continue;
  body = body.slice(0, faqIdx) + section + body.slice(faqIdx);
  changedHubs++;
  if (!DRY) writeFileSync(guidePath, `---\n${parsed.fm}\n---\n${body}`);
}

console.log(
  `${DRY ? '[dry-run] ' : ''}Projects: ${changedProjects} · Areas: ${changedAreas} · Hub guides: ${changedHubs}`,
);
