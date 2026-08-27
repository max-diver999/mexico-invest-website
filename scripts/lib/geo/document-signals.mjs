/**
 * Single-document signals.
 *
 * Every signal here earned its place on the labelled sets. Candidates that
 * sounded right and failed are recorded in docs/GEO-SCORING.md rather than
 * quietly dropped, because the previous rubric was built entirely out of
 * plausible-sounding rules that nobody ever tested.
 *
 * Measured (machine-injected corpus vs hand-written):
 *   malformed tokens per file    13.1  vs  0.0
 *   heading-echo openers         10.5  vs  0.6
 *   most-repeated opener shape   0.69  vs  0.16
 *   hedge words per 1000 words    5.9  vs  1.9
 */

import { plainText, words, sentences } from './corpus-signals.mjs';

/** Wreckage left by string-templating: "r," and "undefined" reached production in July. */
const MALFORMED_RE = /\bundefined\b|\bNaN\b|\bR\s*,|\s,\s|\b(\w+)\s+\1\b(?!\s*(?:street|road|bay))/gi;

// "may" is matched lowercase only, deliberately. Case-insensitively it also
// matches the month, and a news article quoting MPC meeting dates was charged
// 12 points for writing "May 2026" seven times. The month is always
// capitalised and hedging "may" is almost always mid-sentence, so lowercase is
// a near-perfect discriminator: on the labelled sets the change moves the
// machine corpus from 5.83 to 5.77 hedges per 1000 and leaves the
// hand-written set at 1.87 exactly.
const HEDGE_RE_I = /\b(might|could|generally|typically|usually|often|tends? to|somewhat|relatively)\b/gi;
const HEDGE_RE_MAY = /\bmay\b/g;

export function sections(raw) {
  const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
  const parts = body.split(/^## /m).slice(1);
  return parts.map((part) => {
    const nl = part.indexOf('\n');
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    const section = nl === -1 ? '' : part.slice(nl + 1);
    const text = plainText(section);
    return { heading, section, text, firstSentence: sentences(text)[0] || '' };
  });
}

export function malformedTokens(raw) {
  const found = plainText(raw).match(MALFORMED_RE) || [];
  return { count: found.length, samples: [...new Set(found)].slice(0, 5) };
}

/**
 * An opener that just restates its own heading answers nothing. The generator
 * produced these by construction; a writer answering the question does not.
 */
export function headingEchoes(raw) {
  const norm = (t) => words(t.toLowerCase()).join(' ');
  const hits = [];
  for (const s of sections(raw)) {
    const h = words(s.heading.toLowerCase());
    const opener = norm(s.firstSentence);
    if (h.length < 4 || !opener) continue;

    // An answer naturally reuses its question's nouns, so bag-of-words overlap
    // flags good writing. What the generator did instead was paste the heading
    // in verbatim behind a template, which shows up as a long contiguous run.
    let longestRun = 0;
    for (let i = 0; i < h.length; i += 1) {
      for (let n = h.length - i; n >= 4; n -= 1) {
        if (opener.includes(h.slice(i, i + n).join(' '))) {
          longestRun = Math.max(longestRun, n);
          break;
        }
      }
    }
    if (longestRun >= 5) hits.push({ heading: s.heading, run: longestRun });
  }
  return hits;
}

/** If every section opens with the same four-word shape, one template wrote them all. */
export function openerTemplateShare(raw) {
  const keys = sections(raw)
    .map((s) => words(s.firstSentence).slice(0, 4).map((w) => (/^\d/.test(w) ? '#' : w.toLowerCase())).join(' '))
    .filter(Boolean);
  if (keys.length < 3) return { share: 0, shape: null, sections: keys.length };
  const counts = new Map();
  for (const k of keys) counts.set(k, (counts.get(k) || 0) + 1);
  const [shape, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { share: n / keys.length, shape, sections: keys.length };
}

export function hedgeDensity(raw) {
  const text = plainText(raw);
  const w = words(text).length || 1;
  const hits = (text.match(HEDGE_RE_I) || []).length + (text.match(HEDGE_RE_MAY) || []).length;
  return (hits / w) * 1000;
}

/**
 * Figures that appear once, in prose, and never again anywhere on the page.
 * Not a defect on its own (hand-written articles carry more prose figures than
 * the generated ones did), so this is reported for review, never scored.
 */
export function orphanFigures(raw) {
  const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
  const re = /(?:(?:MXN\s?|US\$\s?|\$\s?)\d[\d,]*(?:\.\d+)?(?:\s*(?:million|bn|k))?|\d+(?:\.\d+)?%)/gi;
  const counts = new Map();
  for (const m of body.match(re) || []) {
    const k = m.trim().replace(/\s+/g, ' ').toLowerCase();
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n === 1).map(([k]) => k);
}

/**
 * Repetition between sections of one article.
 *
 * The cross-file detector misses a file that repeats itself, which is what a
 * generator does when it fills every section from one template. Measured over
 * the labelled sets this separates perfectly: machine files average 0.27, and
 * all ten hand-written articles score exactly 0.
 */
export function crossSectionEcho(raw) {
  const secs = sections(raw);
  if (secs.length < 2) return { score: 0, worst: null };
  const grams = secs.map((s) => {
    const w = words(s.text).map((x) => x.toLowerCase());
    const set = new Set();
    for (let i = 0; i + 8 <= w.length; i += 1) set.add(w.slice(i, i + 8).join(' '));
    return set;
  });
  let shared = 0;
  let total = 0;
  let worst = null;
  for (let i = 0; i < grams.length; i += 1) {
    let mine = 0;
    for (const g of grams[i]) {
      const elsewhere = grams.some((other, j) => j !== i && other.has(g));
      if (elsewhere) { shared += 1; mine += 1; }
      total += 1;
    }
    const share = grams[i].size ? mine / grams[i].size : 0;
    if (!worst || share > worst.share) worst = { heading: secs[i].heading, share: Number(share.toFixed(3)) };
  }
  return { score: total ? shared / total : 0, worst };
}

/**
 * A currency amount bolted to a noun that cannot carry one. The July generator
 * produced "R450,000 turnaround" and "R2,000,000 withholding awareness" by
 * slotting a number into a template that never asked what the number measured.
 * These rules are deliberately narrow; they fire zero times on hand-written text.
 */
/*
 * Rewritten for this site's own July 2026 garbage (commits 190be90 / 5a8d980).
 * The lift stamped two figure-to-noun weldings across the corpus, and both are
 * things a number cannot be: "$1,500 benchmarks on <heading>" (100+ instances)
 * and "$280,000 HOA proof" / "35% HOA proof" (541 and dozens). Neither string
 * appears once in the hand-written set or the cleaned corpus.
 */
const UNIT_TYPE_RULES = [
  /(?:MXN\s?|US\$\s?|\$\s?)[\d,]+(?:\.\d+)?\s*(?:million|bn|[km])?\s+(benchmarks?\s+on|HOA\s+proof|awareness|confirmation|carry\s+proof)\b/gi,
  /\b\d+(?:\.\d+)?%\s+(benchmarks?\s+on|HOA\s+proof|carry\s+proof|withholding\s+awareness)\b/gi,
];

// A currency amount followed by a bare duration ("R135,000 months") reads as a
// generator slip but is also ordinary compressed English, so it is not a rule:
// it fired on a hand-written sentence about nightly rates stacking into monthly
// revenue. Precision matters more than recall for a check that caps a score.

export function unitTypeViolations(raw) {
  const text = plainText(raw);
  const hits = [];
  for (const re of UNIT_TYPE_RULES) {
    for (const m of text.match(new RegExp(re.source, re.flags)) || []) hits.push(m.trim());
  }
  return [...new Set(hits)];
}

export function documentSignals(raw) {
  return {
    malformed: malformedTokens(raw),
    headingEchoes: headingEchoes(raw),
    openerTemplate: openerTemplateShare(raw),
    hedgePer1000: hedgeDensity(raw),
    crossSectionEcho: crossSectionEcho(raw),
    unitTypeViolations: unitTypeViolations(raw),
    sectionCount: sections(raw).length,
    wordCount: words(plainText(raw)).length,
  };
}
