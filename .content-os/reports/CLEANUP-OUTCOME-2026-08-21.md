# Cleanup outcome — mexico-invest.com

Date: **2026-08-21** · Branch: `claude/mexico-invest-audit-uulcad`
Follows: `AUDIT-REPORT-2026-08-21.md` · `CODE-AUDIT-2026-08-21.md`

Everything in the corpus and code roadmaps was executed. This records what changed, what the numbers are now, and what is deliberately still open.

---

## Headline

**Three separate quality gates were all measuring the boilerplate**, which is why a machine-templated corpus reported 337/337 clean and GEO grade A while 39% of its prose was duplicated and 82% of its files carried a numerically impossible claim.

| Gate | What it actually rewarded |
|---|---|
| `validate:content` | Nothing — it crashed on every invocation and had never run |
| `more-content-gate.mjs` | Floors with no ceilings: ≥N numeric facts, ≥3 tables, ≥4 H2s, a required "insider tip" block. Half the file (`runStructuralChecks`) has no caller and never ran at all |
| `geo-citability-scorer.mjs` | **+45 points for the literal phrase "insider tip"**, +20 for any question-shaped heading, and a "citability block" defined as a paragraph of 130–170 words |
| `geo-citability-audit.mjs` | Hard-failed any commercial page **not containing the string "insider tip"** |

The generator was, in effect, written against these gates. "Insider tip:" appears 2,839 times across 336 of 337 files; every file carried exactly one `## What does Mexico Invest underwriting show for {slug}?` heading; 89% of all H2s were questions. All three gates are now fixed, and the reported scores changed accordingly — see §Numbers.

---

## Numbers

### Corpus

| Metric | Before | After |
|---|---|---|
| Prose words | 1,250,943 | 556,773 |
| Duplicated share of prose | **39%** | **1%** |
| Files ≥50% templated | 65 | **0** |
| Files with a unit-incoherent claim | 276 / 337 (82%) | **0** |
| `duplicate-sentence` + `unit-coherence` flags | 11,842 | **0** |
| `underwriting show` boilerplate H2s | 337 | **0** |
| Average article length | 4,786w | 2,692w |
| H2s phrased as questions | 89% | **18%** |
| Pages | 337 | 334 (3 duplicate entities consolidated) |

### Rendered

| Metric | Before | After |
|---|---|---|
| Whole-site audit | 1 P0 + 1,147 P1 | **clean** |
| Rendered titles > 60 chars | 333 | **0** |
| Duplicate FAQ blocks | 100 pages | **0** |
| Orphan pages | 57 | **0** |
| Rendered `relatedSlugs` links | 0 of 1,746 | **all** |
| Pages with visible breadcrumbs | 0 | **all** |
| Pages printing raw markdown to readers | 15 | **0** |
| Hero images with `alt=""` | 337 | **0** |
| `og:image` as SVG | 13 | **0** |
| Sitemap URLs with `lastmod` | 0 | **345** |
| Pages with an in-body lead bridge | **0** | **301** |
| Alt texts ending "… market/buyer context" | 183 | **0** |
| `llms.txt` / `llms-full.txt` | 617 B / 386 B stubs | 4.4 KB / 107 KB, generated at build |

### GEO score — read this before reacting to it

| Run | Score | `unique` rubric |
|---|---|---|
| Before cleanup, original scorer | 90 / grade A | 81 |
| After cleanup, original scorer | 60 / grade C | 26 |
| After cleanup, **fixed** scorer | **64 / grade C** | 50 |

The A was inflated by the +45 "insider tip" bonus. The drop to 60 is the metric registering its own removal, not a quality regression — the same corpus, cleaned, scores lower on a rubric that was paying for the padding.

**64 is the honest baseline.** The remaining gap is real work, not an artefact: `answer 62` and `self-containment 60` mean many H2 sections no longer open with a self-contained answer, because the paragraph that used to do that was generated filler. Restoring answer-first openings page by page is the largest remaining content task.

---

## What was done

### Corpus

- **Boilerplate removal** (`scripts/fix-corpus-boilerplate.mjs`) — 27 padded sentence families (~13,000 instances), the randomly-filled `| Benchmark | Figure | DD use |` table, 2,839 `Insider tip:` lines, 530 appended GEO sections, and the nine-sentence "shared facts" block that was pasted into 30–40 files and wrong in place on many of them (the Riviera Maya lodging-tax line landed on Los Cabos pages). Replaced with links to the canonical guide for each fact.
- **3,996 headings restored** from `What should buyers verify on {x}?` to `{x}`, with proper-noun casing rebuilt from a corpus-derived dictionary and truncated payloads cut back at the preposition.
- **549 headings demoted** H2→H3 across 70 files (`scripts/fix-heading-depth.mjs`). `areas/tulum` had 45 top-level sections across 2,820 words — a list of paragraphs with headings on them.
- **68 titles de-duplicated** (`… Cost Guide 2026 2026 Guide 2026`); 10 rewritten by hand where stripping left a dangling adjective; 290 mid-heading function-word capitals lowered.
- **19 kept "underwriting show" sections rewritten by hand.** Each opened `Mexico Invest {x} desk reviewed N files in Q2 2026` — a caseload claim about a quarter this site barely existed for, having launched 5 June 2026. Every figure kept, framing corrected.
- **Fideicomiso hub rebuilt** — 29 H2s to 21, four duplicate sections merged, title cut to 44 chars, and a new section explaining why published fideicomiso costs disagree (definitional, not factual: some quote the bank fee, some add the SRE permit, some include legal review). No figure was changed to match a competitor.
- **301 lead bridges** placed at the point of intent, worded per cluster (`scripts/fix-lead-bridges.mjs`).
- **Image alts** — 146 recovered automatically from filenames, 41 rewritten by hand, 9 anonymous camera-filename images removed rather than captioned.
- **News dates** — all 28 items carried an identical bulk-stamped `updatedDate`; each now carries its real publication date.
- **Internal SEO instruction removed from published copy**: five guides ended a buyer scenario with "…and avoid noindex duplicate guides when building internal funnels".

### Code

CR-1 through CR-10 from the code roadmap, all shipped. New: `content-graph.ts`, `geo.ts`, `RelatedLinks.astro`, `Breadcrumbs.astro`, `HubLayout.astro`, `md-inline.ts`, `lead-spam-gate.ts`, `author.ts`, `guide-clusters.ts`, `cloudinary-gate.mjs`, `audit-site-html.mjs`, `qa-corpus-originality.mjs`, `generate-llms.mjs`.

All six collection hubs rebuilt on grouped `HubLayout` with unique hub copy and an FAQ. Schema deepened: `NewsArticle`, `ApartmentComplex` + `AggregateOffer`, `Place`, `CollectionPage` + `ItemList`. Header gained a mobile menu — there was none, so a phone had no navigation at all.

---

## Deliberately still open

1. **Answer-first openings** — the largest remaining content task, and the whole of the current GEO gap. Roughly 250 pages have sections that open with a lead-in rather than an answer. This wants writing, not a script.
2. **Fideicomiso cost fact-check.** The page states $2,500–4,000 setup; competitors ranking above it state $500–1,000 for the bank fee plus $1,200–1,700 for the SRE permit. The page now explains that the spread is definitional and tells the reader to demand a four-line itemisation. **No figure was changed.** Reconciling against published Banorte/Intercam/Monex schedules and the SRE fee table is a research task, not an editing one.
3. **`isr-exemption-5-year-rule`** may conflate the 700,000-UDI primary-residence exemption (bounded by a 3-year prior-sale test) with a separate holding-period consideration. Flagged, not changed.
4. **News section** — dates are honest now, but the newest item is 2 July and 15 of 28 were orphans before the content graph landed. Commit to a cadence, retire to `noindex`, or convert to quarterly market updates. That is a strategy call.
5. **`www` → apex 308.** Configured correctly in `vercel.json` and verified in every canonical, but unverifiable from this environment because the network policy blocks the host. One manual check: `curl -I https://www.mexico-invest.com/guides/fideicomiso-mexico-explained/` — expect `308` to apex.
6. **`SITE.whatsapp` is a +66 Thai number** on a Mexico site selling to US and Canadian buyers. Left alone: changing a contact channel is the owner's call.
7. **Redirects need a post-deploy check.** Six 301s added (3 consolidated entities, 3 tier-slug renames). Verify each with `curl -I` after deploy.
8. **The 50-article content plan has not started**, by design. `content-roadmap-2026-08-21.md` requires the substrate to be fixed first — which it now is.

---

## Verification

```
npm run validate:content -- --all   334/334 clean
npm run qa:originality              PASS — 0 duplicated boilerplate, 0 unit errors
npm run build                       exit 0
npm run audit:site                  PASS — 0 P0, 0 P1 across 351 pages
npm run geo:audit                   64/100 grade C (honest baseline, see above)
```

`qa:full:quick`'s HTTP smoke step still fails inside this environment — the network policy blocks `mexico-invest.com`. Environmental, not a site defect. Run it from Cursor.
