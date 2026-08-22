# Corpus cleanup roadmap — mexico-invest.com

Date: **2026-08-21** · Source: `.content-os/reports/AUDIT-REPORT-2026-08-21.md`
Branch prefix for execution: `cc/mexico-wave{N}-{topic}` (this audit sits on `claude/mexico-invest-audit-uulcad`)
Batch size: ≤25 slugs per PR, per `corpus-cleanup-mode.md`.

> **Awaiting «ок» from Maxim.** Nothing below has been executed. No MDX has been modified.

---

## The one-line strategy

**De-template before you publish.** 39% of the corpus's prose is duplicated filler and 82% of files contain a numerically impossible claim. Every new article added on top of that substrate inherits the site-level quality signal. Waves 1–4 fix the substrate; the 50-article plan (`content-roadmap-2026-08-21.md`) starts after Wave 4 lands, and Waves 5–7 can run in parallel with it.

**Do not run a mass regex over the corpus.** `corpus-cleanup-mode.md` forbids it and it would be wrong here anyway: the template sentences are interleaved with genuinely good paragraphs. Removal is per-file with a human-readable diff.

---

## Sequencing at a glance

| Wave | Name | Files | Gate | Blocks |
|---|---|---|---|---|
| **0** | Code unblocks | 0 MDX | see code roadmap | everything |
| **1** | Kill the boilerplate blocks | 337 (14 PRs) | dup-sentence check | 2, 3, 4 |
| **2** | Tier A rewrite — the 18 pages that carry the site | 18 (2 PRs) | manual + GEO | — |
| **3** | Numeric truth pass | 276 (12 PRs) | unit-coherence check | — |
| **4** | Tier B/C de-bloat | 319 (14 PRs) | dup-sentence check | — |
| **5** | Lead bridges | ~120 (5 PRs) | manual | — |
| **6** | Consolidation + redirects | ~18 (2 PRs) | link check | — |
| **7** | Images, alts, news decision | 337 / 28 | image audit | — |

Waves 1–4 are ~42 PRs of real editorial work. That is the honest number. Waves 1 and 3 are largely scripted-with-review; 2 and 4 are not.

---

## Wave 0 — Code unblocks (must land first)

Not corpus work, but Waves 1–4 cannot be verified without it. From `code-improvements-roadmap-2026-08-21.md`, batch CR-1:

1. Fix `scripts/lib/more-content-gate.mjs:13` import → `validate:content` runs for the first time.
2. Add the **duplicate-sentence** and **unit-coherence** checks (CODE-AUDIT §C3). Without these, Waves 1/3/4 have no gate and will regress.
3. Fix `projects/[...slug].astro` `hasInlineFaqBlock` → removes 100 duplicate FAQ blocks.
4. Conditional title suffix in `BaseLayout` → un-truncates 333 titles immediately.

Items 3 and 4 are one-line changes that fix 433 pages before any content is touched. **Do these first regardless of what happens to the rest of the plan.**

---

## Wave 1 — Kill the boilerplate blocks (337 files, 14 PRs)

**Goal:** remove the ~13,000 template sentence instances and the 337 `underwriting show` H2s. Nothing else. Keep it mechanical so it can move fast and be reviewed by diff.

### 1a — Delete outright

These carry zero information. Remove the sentence, keep surrounding paragraphs intact, never strip newlines with a regex.

| Pattern | Instances | Files |
|---|---|---|
| `Mexico investors typically require {X} carry proof, {Y} ISR withholding awareness, and {Z} net yield modeling before contingencies lapse, because Mexico Invest files average {W} turnaround…` | 4,899 | 337 |
| `Insider tip: On {truncated-slug}, Mexico Invest requests {X} HOA proof in writing before deposit; refusal is a walk-away signal.` | 2,839 | 336 |
| `Mexico Invest reviewed {X} benchmarks on {H2 text} files in Q2 2026 before buyers waived contingencies.` | 790 | 314 |
| `Mexico Invest buyer desk flags {X} carry lines on {H2 text} underwriting packs when agents quote gross yield…` | 688 | 314 |
| `Buyers researching {H2 text} should treat {X} closing costs, {Y} gross ISR option, and {Z} net rental bands as fixed lines…` | 348 | 196 |
| `Foreign buyers need fideicomiso trust setup and SAT CFDI trails recorded before the first SWIFT clears.` | 1,677 | 330 |
| `Mexico Invest buyer desk treats missing HOA STR minutes as a hard stop before any deposit clears.` | 1,603 | 332 |
| `MODELED net yield must include HOA, fideicomiso, and 25% to 35% PM fees before you compare gross claims.` | 1,603 | 328 |

The last three say something true. Keep **one** instance each, on the page where it is actually load-bearing (`mexico-rental-yield-guide`, `short-term-rental-rules-riviera-maya`, `gross-vs-net-yield-mexico`), phrased in that page's own voice. Delete the other ~4,800.

Also delete: the `| Benchmark | Figure | DD use |` table (482 instances, 218 files) — its three rows are `Entry / carry`, `ISR / withholding`, `Net yield band`, all randomly filled (§Wave 3). Where a page genuinely needs a benchmark table, Wave 2/3 writes a real one.

Also: `MODELED` in caps (2,792 instances) — sentence-case it.

### 1b — Rewrite the `underwriting show` H2 (337 files)

`## What does Mexico Invest underwriting show for {slug-as-words}?` → a **direct-answer H2 in the page's own language**, followed by two to four sentences that actually answer it.

The GEO/AEO value of a question-H2 comes from it matching a real query. `"What does Mexico Invest underwriting show for ampi license verify guide?"` matches nothing. Replace with the query the section serves:

| Page | From | To |
|---|---|---|
| `fideicomiso-mexico-explained` | `…underwriting show for fideicomiso mexico explained?` | `What does a fideicomiso actually cost in year one?` |
| `earthquake-risk-mexico-property` | `…for earthquake risk mexico property?` | `Which Mexican property markets sit in the highest seismic zones?` |
| `ampi-license-verify-guide` | `…for ampi license verify guide?` | `How do you verify an AMPI licence before you sign?` |
| `chileno-bay-residences` | `…for chileno bay residences?` | `What do Chileno Bay resale numbers show against the developer pitch?` |

**89% of H2s are already questions.** While rewriting, convert roughly a third of each page's H2s to declarative statements. A page where every heading is a question reads as generated, and the question-format signal is diluted to nothing.

### 1c — Fix the broken-English H2 family (~250 instances)

`What should buyers verify on summary?` / `on related guides?` / `on bottom line?` / `on related reading?` — the generator turned a section label into a question. These are section labels; make them labels again: `Summary`, `Related guides`, `The bottom line`, `Further reading`.

### 1d — Fix table-glued-to-heading (81 files, 239 instances)

A table's last row immediately followed by `## Heading` with no blank line. `more-content-gate.mjs:127` has a glued-table check that never runs (Wave 0 fixes that). Detectable and safe to auto-fix; verify visually after.

### PR split (14 PRs × ~25 files)

Order by traffic risk, lowest first — the mechanics get proven on pages nobody reads:

| PR | Files |
|---|---|
| W1-01…04 | `news` (28) + `developers` (9) + `compare` orphans (5) + lowest-inbound `projects` (~58) |
| W1-05…08 | remaining `projects` (42) + `areas` (32) + `compare` (31) |
| W1-09…12 | `guides` Tier C (85) |
| W1-13 | Tier B (50) — split across two PRs if preflight times out |
| W1-14 | Tier A (18) — **last**, and hand-reviewed |

**Gate per PR:** `npm run validate:content:changed` + the new dup-sentence check (0 sentences repeated ≥3× corpus-wide) + `npm run fix:markdown-glue -- --dry` clean + build.

**Expected outcome:** ~453,000 words removed, average article drops from 4,786 to ~2,900 words, corpus template share from 39% to <8%.

---

## Wave 2 — Tier A rewrite (18 files, 2 PRs)

The 18 pages that either earn GSC impressions or receive ≥99 internal links. These get **human-grade rewriting**, not cleanup. Post-Wave-1 they will be structurally sound but thin in places — that thinness is where real research goes.

| Page | inbound | tmpl% | words | Job |
|---|---|---|---|---|
| `guides/due-diligence-mexico-real-estate` | 439 | 28% | 6,791 | The site's most-linked page. Make it the canonical DD checklist: escritura chain, ejido check, HOA minutes, permits, notario sequencing. Downloadable checklist = link bait. |
| `guides/mexico-rental-yield-guide` | 296 | 45% | 9,758 | Real net-yield model with a worked example per market. This is the page that justifies "we do the maths". |
| `guides/riviera-maya-property-investment-guide` | 196 | 29% | 9,655 | Market pillar. Cut to ~5,000, push depth down into `/areas/`. |
| `guides/fideicomiso-mexico-explained` | 187 | 32% | **10,599 / 30 H2** | **P0.** See §D1 below. |
| `guides/mexico-property-investment-guide` | 185 | 47% | 10,802 | Top-of-funnel pillar. Cut to ~4,500 and make it a routing page into the clusters. |
| `areas/playa-del-carmen` | 165 | **57%** | 8,894 | Worst-templated Tier A page. Full rewrite. |
| `guides/cost-of-buying-property-mexico` | 159 | 29% | 6,524 | Closing-cost table by state (ISAI varies 2–5%). Currently generic. |
| `areas/tulum` | 138 | **53%** | 9,614 | Full rewrite. |
| `guides/buy-property-mexico-foreigner` | 130 | 20% | 7,261 | Already among the cleanest. Absorb `how-to-buy-mexico-property-step-by-step` (Wave 6). |
| `guides/los-cabos-property-investment-guide` | 128 | 36% | 6,886 | |
| `guides/developer-due-diligence-mexico` | 102 | **53%** | 5,779 | Full rewrite; it is the credibility page for 100 project reviews. |
| `guides/short-term-rental-rules-riviera-maya` | 99 | 38% | 5,487 | **Add RETUR-Q + Licencia de Funcionamiento + SATQ** — the 2026 process competitors cover and this page does not. |
| `guides/vat-mexico-property-rental` | GSC | 38% | 4,865 | IVA vs ISR vs 4% lodging tax, cleanly separated. |
| `guides/repatriate-sale-proceeds-mexico` | GSC #1 clicks | 23% | 5,321 | Best-performing page on the site. Protect it. Light touch + bridge to the CFDI/1116 cluster. |
| `guides/fideicomiso-bank-fees-comparison-2026` | GSC | **18%** | 5,608 | Cleanest page in Tier A. Bank-by-bank table is the asset — verify and date every figure. |
| `guides/earthquake-risk-mexico-property` | GSC 359 imp | 24% | 5,535 | Add the seismic-zone-by-market table. |
| `projects/chileno-bay-residences` | GSC pos 16 | **54%** | 3,642 | Worst-templated GSC page. Rewrite + spec table + comparables. |
| `projects/vidanta-nuevo-vallarta` | GSC 5.63% CTR | 41% | 3,961 | Best CTR on the site — find out why and replicate the pattern. |

### The fideicomiso hub (the single highest-value page in the plan)

542 impressions, position 12, **0.37% CTR**. Four fixes, in order:

1. **Title → ≤46 chars** so nothing truncates: `Fideicomiso Mexico 2026: Real Costs & Rights` (44).
2. **Cut 10,599 → ~4,500 words, 30 H2 → ~10.** The `Quick answer` + `TldrBlock` opening is genuinely good — keep it exactly. Everything after H2 #12 belongs on the cluster pages.
3. **Break out the cost stack.** The page says "$2,500–4,000 setup". Ranking competitors separate *bank setup fee* ($500–1,000), *SRE permit* ($1,200–1,700), *notario integration*, and *annual maintenance* ($500–800). Mexico Invest may be right on the total and still lose the snippet by not itemising. **Fact-check against Banorte/Intercam/Monex published schedules + SRE fee tables, cite `as_of`, then decide.** Do not change a number to match a competitor.
4. **Build the cluster** with real anchor text down to `fideicomiso-bank-fees-comparison-2026`, `mexico-restricted-zone-explained`, `bank-trust-renewal-mexico`, `fideicomiso-vs-mexican-corporation`, `can-foreigners-buy-property-mexico`.

**Gate:** manual review of every diff + GEO ≥90 + rendered title ≤60 chars + at least 3 externally verifiable figures with sources in `market-stats.json`.

---

## Wave 3 — Numeric truth pass (276 files, 12 PRs)

Wave 1 deletes most incoherent numbers with the sentences containing them. Wave 3 catches the survivors in tables and hand-written prose.

**Rule: every number either gets a source and an `as_of`, or it gets a band, or it goes.**

| Class | Files | Action |
|---|---|---|
| `$X turnaround` (money where a duration belongs) | 240 | delete or replace with real day-counts |
| `$X net yield modeling` (money where a % belongs) | 145 | delete or restate as a % band |
| `$X ISR withholding awareness` (money where a % belongs) | 164 | replace with the actual rule: **25% of gross** or **35% of net gain**, non-resident |
| table row `Net yield band` holding a USD price (e.g. `$265,000`) | 28 | replace with a real yield band or drop the row |
| Bare `$` figures with no date or source | corpus-wide | move to `market-stats.json` with `owner_slug`, `source`, `as_of`; cite inline |

**Registry work (autonomous per `claude-autonomous-decisions.md` — do not escalate):** build `market-stats.json` entries for the recurring facts: fideicomiso setup/annual/assignment fees by bank; ISAI by state (2–5%); ISR non-resident 25% gross / 35% net; the 700,000-UDI primary-residence exemption; predial by municipality; Quintana Roo 4% lodging tax; typical PM fees 25–35%; typical closing costs 5–8%.

Two figures to reconcile explicitly during this wave:

- **Fideicomiso setup $2,500–4,000** (site) vs $500–1,000 / $2,000–3,000 + $1,200–1,700 SRE permit (competitors).
- **`isr-exemption-5-year-rule`** — the statutory exemption is bounded by 700,000 UDIs and a 3-year prior-sale test, and there is a separate 5-year holding consideration. Confirm the page is not conflating two rules.

**Gate:** the new unit-coherence check at 0, plus `batch-fact-check.mjs`.

---

## Wave 4 — Tier B / C de-bloat (319 files, 14 PRs)

Post-Wave-1 these are clean but generic. Goal is not length — it is **one specific, verifiable thing per page that no competitor has.**

- **Projects (100):** each needs the spec table the schema already supports (`priceFromUsd`, `developer`, `propertyType`, `status`, `area`) plus 3 comparables and one honest negative. A project review with no negative is a brochure. `chileno-bay-residences` at position 16 with 201 impressions is the proof this collection can rank.
- **Areas (32):** one price-per-m² figure, one occupancy figure, one HOA range, one STR-permit status. Sourced.
- **Compare (36):** the 170× `How does this comparison stack up for Mexico investors?` H2 goes; a real decision table takes its place. Compare pages exist to be a decision aid, not an essay.
- **Guides Tier C (85):** hold the line at ~2,000–2,500 focused words. Resist re-inflating.
- **Developers (9):** track record, delivery history, disputes. This is the collection that most justifies "independent".

Batch by cluster, not alphabetically, so each PR reads coherently.

---

## Wave 5 — Lead bridges (~120 files, 5 PRs)

**Zero in-body links to `/get-shortlist/` or `/contact/` across 337 files.** Only 7 files use `<CtaBox />`.

Not a CTA-stuffing exercise. One contextual bridge per page, placed **at the moment of intent** — where the reader has just learned something that creates a next step:

| Page type | Bridge point | Wording direction |
|---|---|---|
| Tax guides | after the "you will owe X" section | "We can line up a cross-border CPA who has filed this before." → `/contact/` |
| Fideicomiso cluster | after the cost table | "Want the bank-fee quote for your specific purchase?" → `/get-shortlist/` |
| Project reviews | after the negatives | "Want three comparable buildings with the same numbers run?" → `/get-shortlist/` |
| Area pages | after yields | "Send us your budget, we'll send what actually trades there." → `/get-shortlist/` |
| STR guides | after the permit section | "Need a PM who files RETUR-Q correctly?" → `/contact/` |

Priority order: Tier A (18) → Tier B (50) → projects (100) → the rest as Wave 4 touches them.

**Also fix (code, but conversion-critical):** the `LeadForm` budget dropdown starts at "Under $300k" while the homepage sells "from $130K". Add `under-150k` and `150-300k` buckets.

---

## Wave 6 — Consolidation and redirects (~18 files, 2 PRs)

**Same-entity duplicates — one URL each:**

| Entity | URLs today | Keep | Action |
|---|---|---|---|
| Holistika Tulum | `/projects/` + `/areas/` | `/projects/` | 301 area → project, or re-scope the area page to the surrounding micro-market |
| Tankah Bay | `/projects/` + `/areas/` | `/areas/` (it is a bay, not a building) | 301 project → area |
| Tulum Country Club | `/projects/` + `/areas/` | `/projects/` | 301 |
| Vidanta Nuevo Vallarta | `/projects/` + `/developers/` | both | differentiate hard — developer = corporate record, project = the asset. **Do not 301; this one earns clicks.** |

**Near-duplicate merges:**

| Merge | Into | 301 |
|---|---|---|
| `how-to-buy-mexico-property-step-by-step` | `buy-property-mexico-foreigner` | ✓ |
| `invest-in-riviera-maya` | `riviera-maya-property-investment-guide` | ✓ (or keep as the commercial landing — decide, don't leave both generic) |
| `budget-investor-mexico-under-200k` | `tier-entry` | ✓ |
| `can-foreigners-buy-property-mexico` | keep, but re-scope to the *yes/no* query only; the mechanism lives on `fideicomiso-mexico-explained` | — |

**Slug renames (301):** `tier-entry` → `mexico-property-under-250k` · `tier-mid` → `mexico-property-300k-budget` · `tier-luxury` → `luxury-mexico-property-500k-plus`.

**Also:** fix the one broken body link — `projects/aldea-tulum` → `/guides/pre-construction-vs-resale-tulum/` should be `/compare/pre-construction-vs-resale-tulum/`.

**Redirects go in `vercel.json`**, not client-side. Verify each with `curl -I` post-deploy.

---

## Wave 7 — Images, alts, and the news decision

**Images (624 inline + 337 heroes):**

- 183 alts (29%) end in `"… market context"` / `"… buyer context"`; many carry raw filenames (`Suite Ocean Vibes.Jpg Inlbc5, …`). Rewrite descriptively.
- **Topic mismatch is the real problem.** `fideicomiso-mexico-explained` — a guide about coastal bank-trust law — illustrates itself with two Mérida restaurant photos. Audit relevance per page as Waves 2/4 touch it; reshoot from Cloudinary where the library allows, drop the image where it does not. A missing image beats a wrong one.
- Hero `alt=""` on 337 pages is a **code** fix (`heroAlt` in schema + layout, CODE-AUDIT §C12); the per-page alt text is content work that rides along with Waves 2/4.

**News (28 files) — decide, don't drift:**

Newest item is 2 July; all 28 carry an identical bulk-stamped `updatedDate: 2026-07-09`; 15 of 28 are orphans; the `/news/` hub has no inbound link. Three honest options:

1. **Commit** — weekly cadence tied to Diario Oficial / SAT / SEDETUR / Banxico. 300–600 words, one fact, a link up to the evergreen guide. Add `/news/` to nav and footer. *This is the right answer if anyone will actually do it weekly.*
2. **Retire** — `noindex` the collection, fold the durable facts into the evergreen guides, keep the URLs alive. Costs nothing, removes a negative signal.
3. **Convert** — turn `/news/` into `/market-updates/`, one dated update per market per quarter. Lower cadence, still credible.

**Do not leave it as-is.** A visibly abandoned news section on an 11-week-old site reads as a dead site, and the bulk `updatedDate` stamp is a pattern raters are trained to flag. Also remove the identical stamp regardless of which option wins — a `updatedDate` that did not correspond to an edit should not exist.

---

## What "done" looks like

| Metric | Now | After Waves 1–4 |
|---|---|---|
| Duplicated prose | **39%** | **<8%** |
| Files with a unit-incoherent claim | **276 / 337** | **0** |
| `underwriting show` H2s | 337 | 0 |
| Avg article length | 4,786w | ~2,900w |
| Rendered titles >62 chars | 333 | <20 |
| Duplicate FAQ blocks | 100 | 0 |
| Rendered `relatedSlugs` links | 0 | 1,746 |
| Orphans | 57 | <10 |
| Pages with an in-body lead bridge | 0 | ~120 |
| Same-entity duplicate URLs | 4 | 0 |

---

## Rules of engagement (from `corpus-cleanup-mode.md`)

- ≤25 slugs per PR. Individual edits or small scripted fixes with a **human-readable diff**. Never a mass `sed`, never `geo-fix-corpus-all.mjs`, never a regex that strips newlines.
- Per PR: `npm run fix:markdown-glue -- --dry` → 0 · `npm run validate:content:changed` · new dup-sentence + unit-coherence checks · `npm run build`.
- Read `legal-core.json` before any legal-phrase edit.
- Tier A pages: extra care on CTAs, hero URLs and any figure with a source.
- Cannibalization on an edited page is fixed **in the same PR** — H2/FAQ, no new slug.
- Broken links to not-yet-published slugs are fine when the target ships in the same PR.

## Escalate only if

1. Wave not approved in `pilot-lock.json` / `STATUS.md`
2. Strategy change — dropping a wave, mass `noindex`, a new content line
3. Preflight/validate ERROR surviving two fix rounds
4. Cloudinary env missing after `verify-cloudinary-env.mjs`

---

**STOP.** Awaiting «ок» from Maxim on this roadmap before any MDX is written.
