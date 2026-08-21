# Code improvements roadmap — mexico-invest.com

Date: **2026-08-21** · Source: `.content-os/reports/CODE-AUDIT-2026-08-21.md`
Reference: `florida-estate-website` @ `d0f003c` (patterns only)
Branch prefix for execution: `cc/mexico-code{N}-{topic}`

> **Awaiting «ок» from Maxim.** `CLAUDE.md` forbids Astro/layout refactors without approval. Nothing below has been executed.

---

## Why this ships before the content roadmap

Four one-line changes fix **433 pages** with no editorial work at all, and two of them are the gates that make the corpus waves verifiable. Everything in `corpus-cleanup-roadmap` assumes CR-1 has landed.

Effort estimates assume someone who knows Astro. "S" ≈ under an hour, "M" ≈ half a day, "L" ≈ a day or more.

---

## CR-1 — Unblock (P0, do first, S)

Branch: `cc/mexico-code1-unblock`

| # | Change | File | Impact |
|---|---|---|---|
| 1 | Fix the out-of-repo import — restore `scripts/lib/cloudinary-gate.mjs` or make it optional (`try { await import('./cloudinary-gate.mjs') } catch {}`) | `scripts/lib/more-content-gate.mjs:13` | `validate:content` runs for the first time. Every "337/337 clean" claim becomes real or gets corrected. |
| 2 | `const hasInlineFaqBlock = entry.body?.includes('<FaqBlock') ?? false;` (copy the line the other five routes already use) | `src/pages/projects/[...slug].astro:41` | **100 pages** stop rendering a duplicate FAQ block |
| 3 | Append the brand suffix only when it fits: `title.length <= 46 ? \`${title} \| Mexico Invest\` : title` | `src/layouts/BaseLayout.astro:31` | **333 titles** stop truncating in the SERP |
| 4 | Align the two title gates and measure the **rendered** length (`title.length + 16 <= 60`) | `scripts/qa-audit.mjs:148`, `scripts/lib/more-content-gate.mjs:98` | stops the regression re-entering |
| 5 | Add `/news/` and `/developers/` to header nav and expand the footer to all six collections + `/get-shortlist/` + `/about/` + `/methodology/` | `Header.astro`, `Footer.astro` | de-orphans 2 hubs, 20 pages |

**Gate:** `npm run validate:content -- --all` (now actually running) · `npm run build` · re-run `audit-site-html` → `duplicate-h2` 0, `title-too-long` <20.

**Note on #1:** whatever the gate reports once it runs is the true baseline. If it reports errors, that is not a regression — it is the first real measurement. Update `STATUS.md`, `site-passport.yaml` and `programs/mexico-invest.yaml` with the real number.

---

## CR-2 — The gate that would have caught the corpus problem (P0, M)

Branch: `cc/mexico-code2-site-audit`

Port `scripts/audit-site-html.mjs` from Florida verbatim — it takes no Florida-specific configuration beyond `dist/client`. Wire as:

```json
"audit:site": "node scripts/audit-site-html.mjs --fail",
"qa:site": "npm run build && node scripts/audit-site-html.mjs --fail"
```

It already checks: `h1-count`, `title-duplicate-suffix`, `title-too-long`, `description-missing/too-long/too-short`, `canonical-missing`, `og-image-svg`, `img-alt-missing`, `img-alt-empty`, `duplicate-h2`, `jsonld-invalid`, `raw-markdown-visible`, `broken-internal-link`, `duplicate-title`, `orphan-page`.

**Then add two Mexico-specific checks** — these are the ones that would have prevented the entire corpus problem:

```
duplicate-sentence   any ≥8-word sentence whose number-normalised shape
                     (every \$?\d[\d,.]*%? → '#') appears in ≥3 other files
unit-coherence       '$' adjacent to turnaround|yield|withholding|rate|days
                     '%' adjacent to price|entry ticket|carry|budget
```

Run both against `src/content` (source, not `dist`) so they can gate a PR before build. Add to `qa:full`.

**Also add to `more-content-gate.mjs`: upper bounds.** It currently enforces minimum H2s, tables and numeric facts with no ceiling — which is precisely what the generator optimised against. Cap H2 count (~18), word count (~6,000) and numeric density.

**Gate:** run against current `dist` → expect 1 P0 + ~1,147 P1 as the recorded baseline, then watch it fall wave by wave.

---

## CR-3 — Content graph: 1,746 dead links (P0, M)

Branch: `cc/mexico-code3-content-graph`

The largest single win in the audit. All 337 files already carry `relatedSlugs` (1,746 entries, 0 broken); nothing renders them.

**Port:**
- `src/lib/content-graph.ts` — `resolveRelatedSlugs()` (layer 1, works immediately, no new data) + `resolveRelatedEntities()` (layer 2)
- `src/components/RelatedLinks.astro` — self-contained, scoped styles
- New `src/data/geo.ts` for layer 2:
  - `AREA → MARKET` (Riviera Maya · Los Cabos · Puerto Vallarta/Riviera Nayarit · Yucatán · Pacific · Baja Sur)
  - `PROJECT → AREA` — `projectSchema.area` already exists
  - `PROJECT → DEVELOPER` — `projectSchema.developer` already exists
  - `AREA → COMPARE`

**Wire into `ArticleLayout`** exactly as Florida does — curated first, entity-derived second, deduped:

```astro
const curated  = await resolveRelatedSlugs(relatedSlugs, slug);
const entities = await resolveRelatedEntities(collection, slug, data, curated);
```

Requires threading `collection`, `slug`, `data` and `relatedSlugs` from each `[...slug].astro` into the layout (six routes, mechanical).

**Impact:** 1,746 curated links rendered, plus auto-derived project↔area↔developer↔compare edges. Resolves most of the 57 orphans — all 18 orphan projects and 9 orphan areas carry the metadata needed to link them.

**Gate:** `audit-site-html` `orphan-page` drops to <10 · build time stays sane (`content-graph.ts` caches the index once per build).

---

## CR-4 — Breadcrumbs (P1, S)

Branch: `cc/mexico-code4-breadcrumbs`

352/352 pages have `BreadcrumbList` schema and **no breadcrumb UI**.

- Port `src/components/Breadcrumbs.astro`.
- Adopt Florida's single-source pattern: build one `crumbs` array, feed **both** the schema and the visible nav so they cannot drift.
- Add an explicit `SECTION_LABEL` map. Today the label is derived from the path (`pathParts[0].charAt(0).toUpperCase()`), producing `Compare` where the UI wants `Comparisons` and `News` where it wants `Market notes`.
- Add breadcrumbs to hub pages too (via CR-6).

---

## CR-5 — Rendering correctness (P1, S)

Branch: `cc/mexico-code5-rendering`

| # | Change | Impact |
|---|---|---|
| 1 | Port `src/lib/md-inline.ts`; apply `mdInlineToHtml` to `TldrBlock.text` and `FaqBlock` answers (rendered **and** in `FAQPage` schema) | 15 pages stop printing `[text](/url)` to readers; those links become crawlable |
| 2 | Add `heroAlt?: string` to `articleSchema`; use it in `ArticleLayout` with a fallback built from `title` + `data.area` (`"Chileno Bay Residences, Los Cabos, Mexico property research"`) | 337 heroes stop shipping `alt=""` |
| 3 | Add a 1200×630 PNG/JPG to `public/`; make it the `ogImage` default | 13 shareable pages get a working social preview |
| 4 | Emit `article:published_time` / `article:modified_time` OG tags for `type="article"` | — |
| 5 | Raise `.faq-answer` open `max-height` from `500px` to a value that cannot clip (`global.css:252`) | long FAQ answers stop being visually truncated |

---

## CR-6 — Collection hubs (P1, L)

Branch: `cc/mexico-code6-hubs`

Port `src/layouts/HubLayout.astro` and rebuild all six index pages on it.

Florida's `HubLayout` props: `title` (keyword-carrying `<title>`) · `heading` (`<h1>`, deliberately separate) · `intro: string[]` (2–4 paragraphs of unique hub copy) · `groups: HubGroup[]` (labelled clusters, each with an editorial note) · `faq` · `lastUpdated` (schema freshness) · lead form config.

**`/guides/` (132 → clusters):**

`Start here` · `Fideicomiso & restricted zone` · `Buying process & due diligence` · `Mexican tax (ISR / IVA / RFC / CFDI / predial)` · `US & Canadian tax (FATCA / FBAR / 1116 / Schedule E / 1031)` · `Short-term rental & STR permits` · `Financing & currency` · `Risk (seismic / hurricane / flood / ejido / fraud)` · `Selling & repatriation` · `Markets & budget tiers` · `Buyer profiles`

**`/projects/` (100):** group by market, then price band. Add filter chips (area / price / status — all three fields already exist in `projectSchema`). Currently a flat 100-card grid with H1 "Project reviews" and no hub copy.

**`/areas/` (32):** group by region.
**`/compare/` (36):** group by comparison type (market vs market · project vs project · Mexico vs country · strategy vs strategy).
**`/news/`, `/developers/`:** simpler, but they need to exist properly given CR-1 #5 now links to them.

Add `ItemList` schema to each hub.

**Also:** `Header.astro`'s `<nav>` is `hidden md:flex` with **no mobile menu** — on a phone the only navigation is the logo and the shortlist button. Add a disclosure menu in this batch.

---

## CR-7 — `llms.txt` generation (P1, S)

Branch: `cc/mexico-code7-llms`

`public/llms.txt` is 617 bytes listing 3 guides; `llms-full.txt` is 386 bytes — for a 337-page corpus, behind a `robots.txt` that explicitly invites GPTBot, OAI-SearchBot, ClaudeBot and PerplexityBot.

Port `scripts/generate-llms-full.mjs`, expose as `gen:llms`, wire into `prebuild` so it cannot go stale.

Per entry emit: URL · title · description · `updatedDate` · collection · and for projects `priceFromUsd` / `area` / `developer` / `status`. That inventory is the cheapest GEO asset available and directly serves the pilot goal.

---

## CR-8 — Lead pipeline (P1, S)

Branch: `cc/mexico-code8-leads`

| # | Change | Why |
|---|---|---|
| 1 | Port `src/lib/lead-spam-gate.ts`, apply in `src/pages/api/lead.ts` | endpoint currently has no honeypot, rate limit, timing check or field validation |
| 2 | Add `under-150k` and `150-300k` to the `LeadForm` budget select | homepage sells "from $130K"; the form's floor is "Under $300k" |
| 3 | Reconsider `SITE.whatsapp` — `+66` (Thailand) on a Mexico site for US/Canadian buyers | trust/conversion |
| 4 | Move the article `LeadForm` from above the content to below it (Florida's placement), keeping `StickyCta` for the always-available path | lets the answer lead; supports the Wave 5 contextual bridges |

**#4 is an A/B decision, not a certainty** — measure before and after. Everything else here is unambiguous.

---

## CR-9 — Sitemap, schema depth, authorship (P1–P2, M)

Branch: `cc/mexico-code9-schema`

| # | Change |
|---|---|
| 1 | Emit `lastmod` from `updatedDate` in the sitemap `serialize()` — 348 URLs currently ship without it |
| 2 | Project detail pages: render the spec table from `priceFromUsd` / `priceToUsd` / `developer` / `propertyType` / `status` / `area` (schema fields that today reach cards only) and emit `ApartmentComplex` or `Product`+`Offer`, following Florida's `buildings` treatment |
| 3 | Area pages: emit `Place` alongside `Article` |
| 4 | News: emit `NewsArticle` instead of `Article` (Florida branches on `collection === 'news'`) |
| 5 | Add `inLanguage: 'en-US'` and `isAccessibleForFree: true` to `articleSchema` |
| 6 | Port `src/data/author.ts`, leave `USE_PERSON = false`. For YMYL a named Person is materially stronger — but only with a real person behind it. The file makes the switch a one-line change when that person exists. |
| 7 | Article badge is hard-coded `"Research guide"` on all 337 pages including projects and areas — drive it from the collection (`kicker ?? sectionLabel`) |

---

## CR-10 — Housekeeping (P2, S)

Branch: `cc/mexico-code10-housekeeping`

- `src/pages/site-report/index.astro`: derive `contentBreakdown` counts from `getCollection().length` instead of hard-coded literals; refresh `reportDate` / `dataThrough` (currently 27 July / 24 July against an 18 August snapshot); correct `geoSnapshot.validateContentPass` once CR-1 gives a real number.
- Port `scripts/deep-audit-report.mjs` as `qa:deep-audit`.
- Decide on `SITE.sameAs` → `moregroup.estate` in `Organization` schema for a brand positioned as independent. Deliberate call, either way.
- `public/design-preview.html` and `public/logo-preview.html` (33KB combined) are served publicly and crawlable — move out of `public/` or disallow.

---

## Order and dependencies

```
CR-1  Unblock ─────────────┬──> CR-2  Site audit gate ──> [corpus Waves 1-4]
                           ├──> CR-3  Content graph ────> resolves orphans
                           ├──> CR-4  Breadcrumbs
                           ├──> CR-5  Rendering fixes
                           └──> CR-8  Lead pipeline ────> [corpus Wave 5]

CR-6  Hubs        (after CR-4 — hubs want breadcrumbs)
CR-7  llms.txt    (independent)
CR-9  Schema      (after CR-3 — project spec table pairs with entity links)
CR-10 Housekeeping(any time)
```

**Minimum viable first PR — CR-1 alone.** Five changes, no new files, fixes 433 pages and turns the QA gates on.

---

## Verification per batch

```bash
npm run validate:content -- --all     # works only after CR-1
npm run geo:audit
npm run build && npm run audit:rendered:fail
npm run audit:site                    # exists after CR-2
npm run qa:full:quick
```

`qa:full:quick`'s HTTP-smoke step will keep failing inside the Claude Code cloud environment — the network policy blocks `mexico-invest.com`. That is environmental, not a site defect. Run the live smoke from Cursor.

---

**STOP.** No Astro, layout, component, script or config file modified. Awaiting «ок» from Maxim.
