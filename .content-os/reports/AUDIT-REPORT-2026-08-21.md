# Phase 0 audit — mexico-invest.com

Date: **2026-08-21** · Branch: `claude/mexico-invest-audit-uulcad` · Auditor: Claude Code
Scope: all **337 MDX** (6 collections) + **352 rendered HTML** pages from a clean `npm run build` + code comparison vs `florida-estate-website`.

> **Branch note.** The pilot prompt asks for `cc/mexico-audit-*`. This session is pinned by the harness to `claude/mexico-invest-audit-uulcad`, so the artifacts land there. Rename or cherry-pick on merge if the `cc/` prefix matters for Cursor tooling.

---

## 0. Verdict in one paragraph

The corpus is not "large and mature". It is **large and machine-templated**. 337 files were published in ~7 weeks (launch 5 June 2026) from a generator that padded every article with the same 8–10 filler sentences and filled the numbers in those sentences from a shared pool at random. **39% of all prose words in the corpus (453,116 of 1,150,982) are sentences that appear verbatim elsewhere on the same site**, and **276 of 337 files (82%) contain at least one numerically impossible claim** — a turnaround time quoted in dollars, an ISR withholding rate quoted as `$200K`, a net yield quoted as `$265,000`. On a YMYL topic (foreign property law, cross-border tax) published by a site whose entire positioning is *"independent research, not a developer brochure"*, this is the single thing capping the site. Every other finding in this report — titles, breadcrumbs, hubs, the unrendered link graph — is worth real traffic, but none of it will move rankings while the body copy reads like this to a quality rater or an LLM.

The good news: **topic selection, slug architecture, the internal link graph, FAQ uniqueness and schema plumbing are genuinely good.** 5,596 body links with 1 broken. 2,473 distinct FAQ questions out of 2,556. 337/337 hero images. The skeleton is right. The flesh is synthetic.

**Recommended sequencing:** de-templating the corpus (Wave 1–4) before writing a single new article. Publishing 50 new pieces on top of this substrate compounds the problem.

---

## 1. What was actually run

| Gate | Result | Note |
|---|---|---|
| `npm run build` | **PASS** (90.9s, 337 content pages + 15 static) | clean |
| `npm run audit:rendered:fail` | **PASS** — 337 scanned, 0 errors | 10 regression checks only |
| `npm run geo:audit` | avg **90/100 grade A**, 17 below min | exit 1 |
| `npm run validate:content -- --all` | **CRASHES** — `ERR_MODULE_NOT_FOUND` | see §6.1 |
| `npm run qa:full:quick` | **4/6** | 2 failures, 1 is environment |
| `npm run audit:images` (via qa:full) | PASS — all image URLs HTTP 200 | |
| Florida `audit-site-html.mjs` run against Mexico `dist` | **1 P0 + 1,147 P1** | Mexico has no equivalent gate |

**Live site was unreachable from this environment** — the session's network policy blocks `mexico-invest.com` (`CONNECT 403`), and the `qa:full:quick` HTTP smoke 403s for the same reason, not because production is down. Everything below is measured against the **built `dist/`**, which for a `output: 'static'` Astro build is byte-identical to what Vercel serves. The one thing I could not verify first-hand is production headers/redirects (§5.3).

---

## 2. BLOCK A — Corpus (all 337 MDX)

### A0 · P0 — The corpus is a template with the numbers randomised

This is the headline finding and it was not visible to any existing gate.

**Duplication.** Sentences of ≥8 words, normalised by replacing every number with a token:

| Metric | Value |
|---|---|
| Qualifying sentences in corpus | 53,350 |
| Distinct sentence shapes | 32,404 |
| Sentences that are a repeat of another | **21,958 (41.2%)** |
| Shapes appearing in ≥20 distinct files | 97 |
| Prose words that are duplicated template | **453,116 / 1,150,982 (39%)** |

Top offenders:

| Occurrences | Files | Sentence |
|---|---|---|
| 1,759 | 294 | `Mexico investors typically require {X} carry proof, {Y} ISR withholding awareness, and {Z} net yield modeling before contingencies lapse, because Mexico Invest files average {W} turnaround…` |
| 1,677 | 330 | `Foreign buyers need fideicomiso trust setup and SAT CFDI trails recorded before the first SWIFT clears.` |
| 1,603 | 332 | `Mexico Invest buyer desk treats missing HOA STR minutes as a hard stop before any deposit clears.` |
| 1,603 | 328 | `MODELED net yield must include HOA, fideicomiso, and 25% to 35% PM fees before you compare gross claims.` |
| 421 | 322 | `Closing costs near 5% to 10% added five figures beside fideicomiso setup near $500 to $800 annually in the same cohort.` |
| 415 | 316 | `Net yield rebuilt with three building-specific rentals often landed 2 to 3 percentage points below developer gross claims…` |

Per-collection template share of prose:

| Collection | Files | Avg templated |
|---|---|---|
| news | 28 | **48%** |
| projects | 100 | **46%** |
| developers | 9 | 45% |
| areas | 32 | 44% |
| compare | 36 | 43% |
| guides | 132 | 34% |

**65 files are ≥50% template. 258 of 337 are ≥35%. Only 13 are under 20%.**

**Numeric incoherence.** The template slots are filled from one shared pool of tokens, so units are scrambled. Distinct values observed per slot:

| Template slot | Occurrences | Distinct fillers | Sample fillers |
|---|---|---|---|
| `requests {X} HOA proof in writing` | 4,636 | 411 | `$280,000` (×1,167), `5%`, `$2,500`, `30%` |
| `and {X} net yield modeling` | 4,532 | 438 | `5%` (×1,988), `$200K`, `$350K`, `$250K` |
| `, {X} ISR withholding awareness` | 4,544 | 385 | `25%` (×1,670), `$200K`, `$500`, `8%` |
| `files average {X} turnaround` | 2,193 | 459 | `10%`, `$250K`, `35%`, `4.5%`, `$200K` |
| `require {X} carry proof` | 3,315 | 366 | `5%`, `$200K`, `$500K`, `35%` |
| table row `Net yield band` | 486 | 151 | `5%`, **`$265,000`**, `$130,000`, `$275K` |

Real published sentences:

> *"Mexico investors typically require **$470,000 carry proof**, **$320,000 ISR withholding awareness**, and **$28,000 net yield modeling** before contingencies lapse, because Mexico Invest files average **$326,000 turnaround**…"* — appears 755× across 247 files

> *"Insider tip: On **how does the fideicomiso structure actua**, Mexico Invest requests **$2,500 HOA proof** in writing before deposit."* — `guides/fideicomiso-mexico-explained.mdx`

> *"Mexico Invest **requests $280,000 HOA proof** in writing before deposit; refusal is a walk-away signal."* — 1,167 occurrences

| Incoherence class | Files affected |
|---|---|
| `$X turnaround` (money where a duration belongs) | 240 |
| `$X net yield modeling` (money where a % belongs) | 145 |
| `$X ISR withholding awareness` (money where a % belongs) | 164 |
| table row `Net yield band` holding a USD price | 28 |
| **Any of the above** | **276 / 337 (82%)** |

**Why this matters, concretely.** Google's spam policy on *scaled content abuse* and the helpful-content signals target exactly this shape: many pages, generated at scale, low added value, boilerplate repetition. For an LLM answering "what does a fideicomiso cost", these pages are un-citable — the model would emit `$326,000 turnaround`. This is the mechanism behind **`fideicomiso-mexico-explained`: 542 impressions, position 12, 0.37% CTR** — Google is testing the page and the quality signals are holding it below the fold.

### A1 · P0 — The `Mexico Invest underwriting show` H2, and its siblings

The passport says "17 files with block-level GEO issues". The real count:

- **`## What does Mexico Invest underwriting show for {slug-as-words}?` — 337 files, 482 occurrences.** Every single page. The slug is lowercased and de-hyphenated raw: `"…underwriting show for 1031 exchange mexico property us seller?"`, `"…for ampi license verify guide?"`.
- The GEO audit only flags 17 because it scores the *block*, not the *repetition*. The boilerplate is universal.

Other generated H2s, corpus-wide (6,162 H2s, 4,939 distinct):

| Count | H2 |
|---|---|
| 337 | `What does Mexico Invest underwriting show for {slug}?` |
| 170 | `How does this comparison stack up for Mexico investors?` |
| 168 | `What checklist should run before you sign?` |
| 105 | `What risks should buyers plan for before they commit?` |
| 68 | `What should buyers verify on summary?` ← ungrammatical |
| 50 | `What should buyers verify on related guides?` ← ungrammatical |
| 41 | `What red flags should pause this Mexico purchase?` |
| 27 | `What should buyers verify on related reading?` ← ungrammatical |
| 26 | `What should buyers verify on bottom line?` ← ungrammatical |

The `What should buyers verify on {section name}?` family (≈250 occurrences) is a generator turning a section label into a question and producing broken English.

**89% of H2s are questions.** That is over-optimised even for AEO — real question-shaped headings lose their signal when every heading is one.

### A2 · P1 — Bloat without substance

| Metric | Value |
|---|---|
| Avg MDX body words | 4,786 |
| Files > 6,000 words | 68 |
| Longest | `off-plan-vs-ready-mexico` 8,014w; `areas/playa-del-carmen` 8,894w; `fideicomiso-mexico-explained` **10,599w / 30 H2s** |

The fideicomiso hub is 10,599 words across 30 H2 sections for a query with one dominant intent ("what is it / what does it cost"). Length is being used as a proxy for depth. Strip the 32% template and the real article is ~7,000 words — still 3× what the SERP rewards for this query. **Dilution is a ranking factor here, not an advantage.**

### A3 · P0 — 1,746 curated internal links exist and render nowhere

Every one of the 337 files has `relatedSlugs` in frontmatter. **1,746 entries. 0 broken. 0 rendered.**

There is no `RelatedGuides` / `RelatedLinks` component in `src/components/`, and no layout reads `relatedSlugs`. `scripts/fix-placeholder-related-guides.mjs:4` even asserts *"ArticleLayout already renders RelatedGuides from relatedSlugs"* — it does not.

Florida hit the identical bug and fixed it; `src/lib/content-graph.ts` in that repo opens with:

> *"the hand-curated `relatedSlugs` frontmatter that was populated across 295 files and rendered nowhere."*

This is the cheapest large win available: one component + one layout block turns 1,746 dead frontmatter entries into 1,746 crawlable, topically-curated internal links. See CODE-AUDIT §C1.

### A4 · P1 — 57 orphan pages

Pages with **zero** inbound links from body copy *and* zero from `relatedSlugs`:

| Collection | Orphans | Of |
|---|---|---|
| projects | **18** | 100 |
| news | **15** | 28 |
| areas | 9 | 32 |
| guides | 5 | 132 |
| compare | 5 | 36 |
| developers | 5 | 9 |
| **Total** | **57** | 337 |

Full list in §A4-list below. Note `/developers/` and `/news/` **hub pages themselves** have no inbound links either — they are missing from both header nav and footer (§C4).

<details>
<summary>A4-list — all 57 orphans</summary>

**guides (5):** `commercial-property-mexico-foreigner`, `fake-escritura-mexico`, `land-for-sale-mexico-foreigner-risks`, `liability-insurance-str-mexico`, `mexico-construction-loan-foreigner`

**projects (18):** `holbox-lagoon-homes`, `holistika-tulum`, `junglar-kaybe`, `mayakoba-residences-playa`, `omara-tulum`, `playa-emerald-studio`, `progreso-beach-campeche`, `riviera-maya-mayakoba-studio`, `saint-marine`, `selva-zama-mondo`, `sian-kaan-biosphere-homes`, `tankah-bay`, `the-city-playa`, `the-fives-playa`, `tres-patios-playa`, `tulum-country-club`, `tulum-jungle-lofts`, `zen-tulum`

**areas (9):** `bacalar-investment`, `holistika-tulum`, `north-shore-xcalacoco`, `puerto-aventuras`, `region-8-tulum`, `sayulita`, `tankah-bay`, `tulum-country-club`, `tulum-pueblo-east`

**compare (5):** `amara-vs-nhoa-tulum`, `copala-quivira-vs-mavila-quivira`, `gran-tulum-vs-101-park`, `mexico-vs-arizona-retirement`, `mexico-vs-texas-no-state-tax`

**news (15):** `airbnb-withholding-rates-july-2026-update`, `holbox-str-capacity-debate-july-2026`, `isla-mujeres-condo-prices-july-2026`, `los-cabos-luxury-inventory-june-2026`, `mazatlan-condo-prices-july-2026`, `playa-property-manager-fees-survey-june-2026`, `portugal-golden-visa-housing-routes-july-2026`, `puerto-escondido-nomad-demand-july-2026`, `puerto-vallarta-resale-liquidity-july-2026`, `quintana-roo-hurricane-insurance-season-2026`, `riviera-maya-summer-occupancy-june-2026`, `sat-playa-rfc-appointment-backlog-june-2026`, `spain-golden-visa-end-mexico-alt-july-2026`, `temporary-resident-visa-property-july-2026`, `tulum-buyer-discounts-july-2026`

**developers (5):** `dine-montage-punta-mita`, `querencia-los-cabos`, `tao-mexico`, `vidanta-nuevo-vallarta`, `zama-desarrollos`
</details>

### A5 · P0 — Zero contextual lead bridges

| Signal | Count |
|---|---|
| In-body links to `/get-shortlist/` across 337 files | **0** |
| In-body links to `/contact/` across 337 files | **0** |
| Files using `<CtaBox />` | **7 / 337** |

Every CTA on an article is layout furniture: one `LeadForm` above the content, one footer box, one sticky bar. **330 pages carry no CTA anywhere inside the argument** — no "you'll need an RFC before you sell, we can line up the advisor" moment at the point of intent. For a lead-gen site this is the largest conversion gap in the audit, and it costs nothing structural to fix (§Wave 5).

Related: the `LeadForm` budget dropdown starts at **"Under $300k"**, while the homepage H1 sells *"from $130K"* and `tier-entry` targets $150–250K. The entry-level segment lands on a form whose lowest bucket does not describe them.

### A6 · P1 — Cannibalization

77 candidate pairs at title+slug Jaccard ≥0.42. The ones that are real:

**Same-entity duplicates (two URLs, one thing) — must be consolidated:**

| Slug | Collections | Action |
|---|---|---|
| `holistika-tulum` | projects + areas | keep `projects/`, 301 the area, or re-scope the area page to the surrounding micro-market |
| `tankah-bay` | projects + areas | same |
| `tulum-country-club` | projects + areas | same |
| `vidanta-nuevo-vallarta` | projects + developers | keep both but differentiate hard: developer = corporate track record, project = the asset |

**Near-duplicate guides:**

| Pair | Jaccard | Action |
|---|---|---|
| `buy-property-mexico-foreigner` ↔ `how-to-buy-mexico-property-step-by-step` | 0.75 | merge into the first; 301 the second |
| `invest-in-riviera-maya` ↔ `riviera-maya-property-investment-guide` | 0.56 | merge; `invest-in-*` becomes the commercial landing, `*-investment-guide` the reference |
| `tier-entry` ↔ `budget-investor-mexico-under-200k` | — | merge |
| `tier-luxury` ↔ `luxury-investor-cabos-branded` | — | differentiate (national tier vs Cabos-specific) |
| `can-foreigners-buy-property-mexico` ↔ `mexico-restricted-zone-explained` ↔ `fideicomiso-mexico-explained` | — | three pages answering one question; make `fideicomiso-*` the hub, the others feed it |

**News duplicating evergreen (systematic — 5 pairs found):** `fideicomiso-bank-fees-july-2026` vs `fideicomiso-bank-fees-comparison-2026`; `temporary-resident-visa-property-july-2026` vs `temporary-resident-visa-buy-property-mexico`; `quintana-roo-hurricane-insurance-season-2026` vs `hurricane-flood-insurance-quintana-roo`. Every news item should be a short dated delta that **links up to** the evergreen guide, not a 1,700-word restatement of it.

### A7 · P1 — Slugs that throw away the keyword

`/guides/tier-entry/`, `/guides/tier-mid/`, `/guides/tier-luxury/` — internal taxonomy leaked into public URLs. Titles are fine (*"Entry-Level Mexico Property: Budget Guide from $150K"*); the URLs carry no keyword. Rename to `mexico-property-under-250k` / `mexico-property-300k-budget` / `luxury-mexico-property-500k-plus` with 301s.

### A8 · P1 — Image relevance and alt text

| Signal | Value |
|---|---|
| Inline images | 624 |
| Empty alt | 0 ✓ |
| Alts ending in generic `"… market context"` / `"… buyer context"` | **183 (29%)** |
| Alts containing a raw filename | many |

Real alts in production:

- `Xela-26_11zon: US capital gains Mexico sale context`
- `Suite Ocean Vibes.Jpg Inlbc5, Airbnb Investment Mexico Guide buyer context`
- `Mérida - Gastronomía, Fideicomiso Mexico Explained market context`

The last one is on `fideicomiso-mexico-explained` — **a food photo from Mérida illustrating a guide about coastal bank-trust law.** Both inline images on that page are Mérida restaurant/hotel shots. Image-topic mismatch at this scale is a visible quality tell.

### A9 · P1 — News section is 7 weeks stale and bulk-stamped

- Newest news item: **2026-07-02**. Today: 2026-08-21.
- **All 28 news items carry the identical `updatedDate: 2026-07-09`** — a bulk stamp, not real revision. This is the freshness-faking pattern raters are trained to spot.
- `solidaridad-ish-registration-september-2026` has `pubDate: 2026-06-29` — a September-titled item published in June.
- 15 of 28 are orphans, and the `/news/` hub has no inbound link.

Either commit to a real weekly cadence tied to Diario Oficial / SAT / SEDETUR announcements, or retire the collection to `noindex` and fold the durable facts into the evergreen guides. A dead news section on a 2-month-old site is a negative signal.

### A10 · ✓ What is genuinely good

Worth protecting through the cleanup:

- **Topic architecture.** 132 guides covering fideicomiso, restricted zone, ISR/IVA/RFC/CFDI, FATCA/FBAR/Form 1116/Schedule E/1031, STR permits, ejido, escrow, wire fraud, notario, apostille, POA, inheritance, insurance, financing. This is a genuinely expert keyword map — better than most of the SERP.
- **Link graph.** 5,596 body links, **1 broken** (`/guides/pre-construction-vs-resale-tulum/` from `projects/aldea-tulum` — the page lives at `/compare/`, not `/guides/`).
- **FAQ uniqueness.** 2,556 items, 2,473 distinct, avg 7.6/page, 0 pages without FAQ.
- **Images.** 337/337 heroes, all Cloudinary, all HTTP 200 (`audit:images` passes).
- **Descriptions.** 337/337 within 123–160 chars, and genuinely unique — no boilerplate tail. (Contrast the body copy.)
- **Schema plumbing.** Organization + Article + BreadcrumbList + FAQPage on every article, 0 invalid JSON-LD.
- **Sitemap hygiene.** 348 URLs, `noindex` pages correctly excluded.

---

## 3. BLOCK B — Rendered HTML (352 pages from `dist/`)

`audit:rendered:fail` passes with 0 errors because it only checks 10 named past incidents (`lead-form-top`, `multi-lead-form`, `draft-marker`, …). Running Florida's whole-site gate against the same `dist` found **1 P0 and 1,147 P1**.

| Severity | Issue | Pages |
|---|---|---|
| **P0** | `broken-internal-link` → `/guides/pre-construction-vs-resale-tulum/` | 1 (`projects/aldea-tulum`) |
| **P0*** | duplicate `<h2>Frequently Asked Questions</h2>` | **100** (all projects) |
| P1 | `img-alt-empty` | 683 imgs (337 heroes + 337 logos + 9) |
| P1 | `title-too-long` (>62 rendered chars) | **333** |
| P1 | `raw-markdown-visible` | 15 |
| P1 | `og-image-svg` | 13 |
| P1 | `orphan-page` (hub level) | 2 — `/developers/`, `/news/` |
| P1 | `description-too-short` | 1 — `/privacy-policy/` |
| ✓ | `h1-count`, `jsonld-invalid`, `canonical-missing`, `duplicate-title` | 0 |

\* Florida's gate grades repeated H2 as P1; on 100 pages of a 337-page site it is P0 here.

### B1 · P0 — All 100 project pages render their FAQ twice

`src/pages/projects/[...slug].astro:41` hard-codes `hasInlineFaqBlock={false}`. Every project MDX contains `<FaqBlock …/>` inline (100/100), so `ArticleLayout` renders a **second** FAQ block from frontmatter below it. Verified in `dist`:

```
dist/client/projects/vidanta-nuevo-vallarta/index.html  → 2× "Frequently Asked Questions"
dist/client/guides/fideicomiso-mexico-explained/index.html → 1×
```

`compare`, `news`, `developers` all compute `hasInlineFaqBlock` correctly from `entry.body`. `areas` and `guides` too. **Only `projects` is wrong** — a copy-paste regression. One-line fix, 100 pages of duplicated on-page content.

### B2 · P0 for CTR — 333 of 348 indexable titles are truncated in the SERP

`BaseLayout.astro:31` appends `" | Mexico Invest"` (**+16 chars**) to every title that does not already contain the brand — which is 336 of 337.

| Metric | Value |
|---|---|
| Frontmatter title length | min 45, avg **55**, max 63 |
| Rendered `<title>` length | avg **71** |
| Rendered > 62 chars | **335 / 352** |

Google truncates around 580px ≈ 55–60 characters. Examples:

- `Aldea Zama Tulum Investment Guide: Prices, Yields, HOA 2026 | Mexico Invest` — **75 chars**
- `Cancún Real Estate: Hotel Zone, Downtown, Investor Guide | Mexico Invest` — 72
- `Fideicomiso Mexico: Costs and Rights for Foreign Buyers | Mexico Invest` — 70 ← *the 0.37% CTR page*
- `Mexico Real Estate for Foreign Buyers: From $130K 2026 | Mexico Invest` — 69 ← homepage

**Two gates disagree and neither accounts for the suffix:** `qa-audit.mjs:148` wants 45–65; `more-content-gate.mjs:98` wants 50–60. Both measure the *frontmatter* title. The rendered title is what ranks.

This is the highest-leverage CTR fix in the audit and it is mechanical: budget 46 chars for the title, or drop the suffix on long titles. At 3,202 impressions/month and a realistic move from ~1.4% to ~3% CTR, that alone roughly doubles current clicks.

### B3 · P1 — 337 hero images ship with `alt=""`

`ArticleLayout.astro` line ~137: `<img src={optimizedHeroImage} alt="" …>`. Empty alt declares an image decorative. These are the topical hero of the page, are used as `og:image`, and are the only image candidate for Google Images / Discover. Florida solved it with a `heroAlt` prop plus a descriptive fallback built from the entry. Mexico has no `heroAlt` in the schema at all.

### B4 · P1 — 15 pages print raw markdown to the reader

`<TldrBlock text="… [Playa del Carmen](/areas/playa-del-carmen/) …" />` — `TldrBlock` renders `{text}` as a plain string, so the markdown link is printed literally in the "Key Takeaway" box, and the link is not crawlable.

Affected: `areas/cancun`, `compare/los-cabos-vs-riviera-maya`, `compare/mexico-vs-panama-real-estate`, `guides/us-capital-gains-mexico-sale`, `guides/us-wire-transfer-mexico-property`, `projects/aldea-thai`, `projects/distrito-xcalacoco-beach`, `projects/maresol-downtown-studios`, +7.

Florida ships `src/lib/md-inline.ts` (`mdInlineToHtml`) for exactly this and applies it to both `TldrBlock` and FAQ answers. Direct port.

### B5 · P1 — `og:image` is an SVG on 13 pages

`BaseLayout.astro:26` defaults `ogImage` to `${SITE.url}/favicon.svg`. Facebook, LinkedIn, X, WhatsApp and Slack do not render SVG previews. Affects homepage, all 6 collection hubs, `/about/`, `/contact/`, `/get-shortlist/`, `/methodology/`, `/terms/`, `/privacy-policy/` — i.e. **every page anyone would actually share**. Needs a 1200×630 PNG/JPG default.

### B6 · P1 — Sitemap has no `lastmod`

348 URLs, **0 `lastmod` elements**, despite `updatedDate` being present in every frontmatter. For a site this size with news + regularly-revised tax guides, that is a real crawl-budget and freshness signal left on the table. `@astrojs/sitemap` supports it via `serialize`.

### B7 · P1 — FAQPage schema is doing almost nothing

All 337 articles emit `FAQPage`. The site-report itself records *"0 FAQ rich results GSC"* for W30. That is expected — since 2023 Google restricts FAQ rich results to authoritative government and health sites. **Keep the markup** (it still helps AI Overviews / LLM extraction) but stop counting it as a SERP feature, and do not let it justify the 7.6-question-per-page FAQ tax on every project page.

Minor: `FaqBlock` answers use `max-height: 500px` when open (`global.css:252`) — long answers will clip visually. Content is in the DOM either way, so no crawl impact.

---

## 4. BLOCK D — GSC and search-side findings

Context that reframes every number: **the site launched 5 June 2026.** It is ~11 weeks old with 46 lifetime clicks. Rankings at position 9–12 on a corpus this young are not a failure — they are Google testing it. What happens next depends entirely on whether the quality signals resolve up or down.

### D1 · `/guides/fideicomiso-mexico-explained/` — 542 imp, 0.37% CTR, pos 12

Diagnosed, not guessed. Four compounding causes:

1. **Truncated title** (70 chars) — `…for Foreign Buy…`. No year, no price anchor, brand eats the tail.
2. **10,599 words across 30 H2s** for a single-intent query. The direct answer is present (`Quick answer:` + `TldrBlock`, both good) but buried under 30 sections of which several are template.
3. **32% templated prose** including `Insider tip: On how does the fideicomiso structure actua,` and `$2,500 HOA proof` — visible to a rater sampling the page.
4. **Cost claim is out of step with the SERP.** The page states **$2,500–4,000 setup**. Competitors ranking above it state $500–1,000 (setup) or $2,000–3,000, plus an SRE permit at $1,200–1,700. The site may be right — but it never breaks out *bank fee vs SRE permit vs notario integration*, which is precisely the distinction the top results make. **Fact-check task, not a rewrite-to-match task.**

**Fix order:** title → 46 chars with year (`Fideicomiso Mexico 2026: Real Costs & Buyer Rights`) → split the cost breakdown into its components → cut to ~4,500 words → link down to `fideicomiso-bank-fees-comparison-2026`, `mexico-restricted-zone-explained`, `bank-trust-renewal-mexico`, `fideicomiso-vs-mexican-corporation` as a real cluster.

### D2 · `/guides/earthquake-risk-mexico-property/` — 359 imp, 1.39% CTR

72-char title, 24% templated, unit-incoherent numbers present. Same title fix. Add a seismic-zone table by market (CDMX vs Cabo vs Riviera Maya are wildly different risks) — that is the snippet-winning asset and it does not exist yet.

### D3 · Projects cluster

`vidanta-nuevo-vallarta` is the only project earning clicks (4 clicks / 71 imp / **5.63% CTR** — the best CTR on the site, at 67 chars). `chileno-bay-residences` sits at position ~16 with 201 impressions and is **54% templated** — the second-worst-templated page in the priority set. `distrito-xcalacoco-beach` 47%, `pendry-punta-mita` 42% (76-char title), `four-seasons-costa-palmas` 53%.

Project pages also carry **no price/developer/status data on the page itself** — `priceFromUsd`, `developer`, `propertyType`, `status` exist in the schema and are rendered *only on cards*, never on the detail page, and never as schema. Adding a spec table + `Product`/`Offer` or `ApartmentComplex` markup is a straight port from Florida's `buildings` treatment.

### D4 · www vs apex canonical — **verified correct in config, unverified in production**

- `astro.config.mjs` → `site: 'https://mexico-invest.com'`, `trailingSlash: 'always'` ✓
- Every article passes an explicit apex canonical (`canonical={`${SITE.url}/guides/${entry.id}/`}`) ✓ — 0 pages missing canonical, 0 pointing at www.
- `vercel.json` has a **308 host redirect** `www.mexico-invest.com/(.*)` → `https://mexico-invest.com/$1` ✓
- Sitemap emits apex only ✓

**The configuration is right.** GSC showing both hostnames is consistent with historical URLs discovered before the redirect landed, plus `sc-domain:` property behaviour (a domain property reports both by design). I could not confirm the 308 fires in production because the environment blocks the host. **Action: one manual `curl -I https://www.mexico-invest.com/guides/fideicomiso-mexico-explained/` from an unblocked machine** — expect `308` + apex `Location`. If it returns 200, that is a P0; if 308, close the item.

### D5 · Robots / AI crawlers · ✓

`robots.txt` explicitly allows `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, disallows `/api/`, `/thanks/`, `/site-report/`, and points at the sitemap index. Correct and better than most competitors. No change needed.

### D6 · P1 — `llms.txt` is a stale scaffold

`public/llms.txt` is **617 bytes** listing 3 guides, and points to `public/llms-full.txt` which is **386 bytes**. For a 337-page corpus this actively misrepresents the site to the AI crawlers robots.txt just invited in. Florida generates both from the corpus (`npm run gen:llms` → `scripts/generate-llms-full.mjs`, wired into `prebuild`). Direct port; see CODE-AUDIT §C7.

---

## 5. Assumptions and open items

Documented rather than escalated, per `corpus-cleanup-mode.md`.

1. **Live production not reachable** from this environment. All rendered findings come from `dist/`, which for a static build equals production HTML. Headers, redirects and the live lead API are the only things unverified — see D4 and the one manual curl requested there.
2. **`validate:content` has never actually run in this repo** (§6.1). To produce a real baseline I stubbed the missing module **outside the repo** at `/home/user/scripts/lib/cloudinary-gate.mjs` — no repository files were modified. With the stub, the gate reports 337/337 clean, which is the point: *the gate is blind to every finding in this report.*
3. **Fideicomiso cost figures flagged, not corrected.** I did not change any number. §D1 is a fact-check task for Wave 3 with named sources to reconcile against.
4. **I have not touched a single MDX file, layout, or component.** No mass edits, no Astro changes, no push to main, no indexing — per the Phase 0 stop.
5. **`.content-os/pilot-lock.json`** still reads `phase: audit_phase_0`, unchanged. It should gain `approved_wave` when Maxim signs off.

---

## 6. Priority summary

| # | Finding | Sev | Scale | Effort |
|---|---|---|---|---|
| A0 | 39% of prose is duplicated template; 82% of files have unit-incoherent numbers | **P0** | 337 files | Waves 1–4, large |
| A1 | `underwriting show` + generated H2 boilerplate | **P0** | 337 files | Wave 1, scripted+review |
| B1 | Duplicate FAQ on all project pages | **P0** | 100 pages | 1 line |
| B2 | 333 titles truncated in SERP (`+16` brand suffix) | **P0** | 348 pages | 1 layout change + retitle wave |
| A5 | Zero in-body lead bridges | **P0** | 330 pages | Wave 5 |
| A3 | 1,746 `relatedSlugs` rendered nowhere | **P0** | 337 pages | 1 component + 1 layout block |
| C1 | `validate:content` crashes — baseline is fiction | **P0** | repo | 1 line |
| B4 | Raw markdown printed to readers | P1 | 15 pages | port `md-inline.ts` |
| B3 | 337 hero images with `alt=""` | P1 | 337 pages | schema + layout |
| A6 | 4 same-entity duplicate URLs + 5 near-duplicate guides | P1 | ~18 pages | Wave 6 |
| A4 | 57 orphans, 2 orphan hubs | P1 | 59 pages | resolved largely by A3 + nav |
| B5 | `og:image` is SVG on every shareable page | P1 | 13 pages | 1 asset + 1 line |
| A9 | News 7 weeks stale, bulk-stamped `updatedDate` | P1 | 28 pages | decision needed |
| A8 | 183 generic/filename alts; off-topic images | P1 | 624 imgs | Wave 7 |
| B6 | No `lastmod` in sitemap | P1 | 348 URLs | config |
| D6 | `llms.txt` stale scaffold | P1 | 2 files | port generator |
| A7 | `tier-*` slugs throw away the keyword | P2 | 3 pages | 3 renames + 301 |
| A2 | Bloat: 68 files >6,000w | P2 | 68 files | folded into Waves 2–4 |

---

## 7. Where this goes next

- Corpus work → `.content-os/batches/corpus-cleanup-roadmap-2026-08-21.md` (7 waves)
- Code work → `.content-os/reports/CODE-AUDIT-2026-08-21.md` + `.content-os/batches/code-improvements-roadmap-2026-08-21.md`
- New content → `.content-os/batches/content-roadmap-2026-08-21.md` + `.content-os/batches/topics-proposal.json` (50 articles)

**STOP.** No MDX written, no Astro touched, no PR, no push to main, no indexing. Awaiting «ок» from Maxim on the roadmaps.
