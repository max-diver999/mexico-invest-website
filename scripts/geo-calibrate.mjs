#!/usr/bin/env node
/**
 * Calibration harness for the GEO scorer.
 *
 * The point of this file is that a scoring rubric is a hypothesis, and a
 * hypothesis needs a test set. Ours is labelled by history:
 *
 *   bad/  152 files as they stood at commit 9cda569, where an agent was told
 *         "lift the corpus to 90+" and did it by injecting ~5,400 generated
 *         blocks. The old rubric scored these 90/100.
 *   good/ articles written by hand, section by section, in August 2026.
 *   mid/  honest prose rebuilt semi-automatically: should sit between.
 *
 * A rubric is only worth shipping if it separates bad from good. Run:
 *   node scripts/geo-calibrate.mjs --prepare      # rebuild the labelled sets
 *   node scripts/geo-calibrate.mjs                # score them and report separation
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const LAB = '/tmp/geo-lab';
/**
 * bad/: the corpus as it stood at 5a8d980 ("careful mexico-invest corpus lift —
 * 337/337 >=90", 10 Jul 2026, +26,819 lines on top of 190be90's +53,336).
 * The lift was mechanical: "Insider tip:" stamps, "Mexico Invest reviewed N%
 * benchmarks on <heading> files" blocks, headings pasted into their own openers.
 * Commit be71edd later stripped 51,500 lines of it, which is the label.
 */
const GARBAGE_COMMIT = '5a8d980';
/** Written by hand, section by section, in August 2026 (waves 1-2 of new content). */
const HANDWRITTEN = [
  'areas/valle-de-bravo',
  'areas/mexico-city-roma-condesa',
  'areas/oaxaca-city-real-estate',
  'areas/la-paz-baja',
  'areas/todos-santos',
  'guides/uk-buyers-mexico-property',
  'guides/retire-in-mexico-on-2000-month',
  'guides/mexico-property-self-directed-ira',
  'guides/snowbird-mexico-property-guide',
  'guides/dual-citizen-mexico-property',
  'guides/crypto-to-mexico-real-estate',
  'guides/first-million-mexico-real-estate',
];
/**
 * mid/: honest prose that survived the July garbage strip (967bfdf, be71edd)
 * and was then patched semi-automatically — real content, machine-assembled
 * seams. Should land between bad and good if the scale is not binary.
 */
const MIDDLE = [
  'guides/invest-in-tulum',
  'guides/mexico-rental-yield-guide',
  'guides/ejido-land-risks-mexico',
  'guides/lake-chapala-real-estate-americans',
  'guides/digital-nomad-mexico-property',
  'guides/str-occupancy-by-month-riviera-maya',
  'guides/hurricane-insurance-bcs',
];
function prepare() {
  for (const d of ['bad', 'good', 'mid']) {
    fs.rmSync(path.join(LAB, d), { recursive: true, force: true });
    fs.mkdirSync(path.join(LAB, d), { recursive: true });
  }
  const listed = execFileSync('git', ['ls-tree', '-r', '--name-only', GARBAGE_COMMIT, 'src/content/guides'])
    .toString().trim().split('\n').filter(Boolean);
  let n = 0;
  for (const f of listed) {
    try {
      const content = execFileSync('git', ['show', `${GARBAGE_COMMIT}:${f}`], { maxBuffer: 32e6 }).toString();
      fs.writeFileSync(path.join(LAB, 'bad', path.basename(f)), content);
      n += 1;
    } catch { /* file did not exist at that commit */ }
  }
  for (const [dir, slugs] of [['good', HANDWRITTEN], ['mid', MIDDLE]]) {
    for (const s of slugs) {
      const src = `src/content/${s}.mdx`;
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(LAB, dir, `${s.replace(/\//g, '__')}.mdx`));
      else console.error(`missing labelled file: ${src}`);
    }
  }
  console.log(`prepared: bad=${n} good=${HANDWRITTEN.length} mid=${MIDDLE.length} in ${LAB}`);
}

function stats(xs) {
  if (!xs.length) return { n: 0, mean: 0, min: 0, max: 0, p90: 0 };
  const s = [...xs].sort((a, b) => a - b);
  return {
    n: xs.length,
    mean: xs.reduce((a, b) => a + b, 0) / xs.length,
    min: s[0],
    max: s[s.length - 1],
    p90: s[Math.floor(s.length * 0.9)] ?? s[s.length - 1],
  };
}

async function scoreSet(dir, scorer) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).map((f) => path.join(dir, f));
  if (!files.length) throw new Error(`labelled set ${dir} is empty; run --prepare`);
  const out = [];
  for (const f of files) out.push({ file: f, ...(await scorer(f, files)) });
  return out;
}

async function main() {
  if (process.argv.includes('--prepare')) return prepare();
  if (!fs.existsSync(path.join(LAB, 'bad'))) prepare();

  const which = process.argv.includes('--old') ? 'old' : 'new';
  let scorer;
  if (which === 'old') {
    const { scorePage } = await import('./lib/geo-citability-scorer.mjs');
    scorer = async (f) => {
      const raw = fs.readFileSync(f, 'utf8');
      const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
      const r = scorePage(body, { collection: 'guides' });
      return { score: r.score };
    };
  } else {
    const mod = await import('./lib/geo/score.mjs').catch(() => null);
    if (!mod) {
      console.error('scripts/lib/geo/score.mjs not implemented yet; run with --old to see the baseline');
      process.exit(2);
    }
    scorer = mod.scoreFileForCalibration;
  }

  const sets = {};
  for (const d of ['bad', 'good', 'mid']) sets[d] = await scoreSet(path.join(LAB, d), scorer);

  console.log(`\n=== GEO calibration (${which} scorer) ===`);
  const summary = {};
  for (const [k, rows] of Object.entries(sets)) {
    const st = stats(rows.map((r) => r.score));
    summary[k] = st;
    console.log(
      `${k.padEnd(5)} n=${String(st.n).padStart(3)}  mean=${st.mean.toFixed(1)}  min=${st.min}  p90=${st.p90}  max=${st.max}`,
    );
  }
  const sep = summary.good.mean - summary.bad.mean;
  console.log(`\nseparation (good.mean - bad.mean) = ${sep.toFixed(1)} points`);
  const overlap = sets.bad.filter((r) => r.score >= Math.min(...sets.good.map((g) => g.score))).length;
  console.log(`garbage files scoring at or above the worst hand-written file: ${overlap}/${sets.bad.length}`);

  // Targets are set against the deterministic stage, which tops out at 75.
  // The remaining twenty points to the 95 ceiling are only reachable through
  // the judge stage, so a deterministic 60 is a good article, not a mediocre one.
  const TARGETS = { badMax: 25, goodMin: 55, separation: 35 };
  const fails = [];
  if (summary.bad.max > TARGETS.badMax) fails.push(`bad.max ${summary.bad.max} > ${TARGETS.badMax}`);
  if (summary.good.min < TARGETS.goodMin) fails.push(`good.min ${summary.good.min} < ${TARGETS.goodMin}`);
  if (sep < TARGETS.separation) fails.push(`separation ${sep.toFixed(1)} < ${TARGETS.separation}`);
  if (which === 'new') {
    console.log(fails.length ? `\n❌ calibration FAILED\n  ${fails.join('\n  ')}` : '\n✅ calibration passed');
    if (fails.length) process.exit(1);
  }
}

main();
