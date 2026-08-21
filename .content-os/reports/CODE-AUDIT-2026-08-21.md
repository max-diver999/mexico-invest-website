# Code audit — mexico-invest.com vs florida-estate-website

Date: **2026-08-21** · Branch: `claude/mexico-invest-audit-uulcad`
Reference: `max-diver999/florida-estate-website` @ `d0f003c` (patterns only — Mexico brand stays independent)

Scope: `src/layouts`, `src/components`, `src/pages`, `src/lib`, `src/data`, `astro.config.mjs`, `vercel.json`, `public/`, `scripts/`.

---

## Executive summary

Mexico's stack is a **subset of Florida's, frozen at an earlier point**. Same Astro 6 + Tailwind 4 + Vercel base, same `BaseLayout`/`ArticleLayout` shape, same lead pipeline — but Florida has since shipped the exact post-audit layer Mexico now needs, and shipped it **against the same bugs Mexico still has**. Florida's `src/lib/content-graph.ts` opens by naming the `relatedSlugs`-rendered-nowhere bug verbatim. Its `scripts/audit-site-html.mjs` checks precisely the defect classes Mexico's gate misses. This is not a redesign — it is a port of work already done and proven once.

Three things are broken today, independent of Florida:

1. **`npm run validate:content` cannot run.** It throws `ERR_MODULE_NOT_FOUND` on every invocation. The "337/337 clean" baseline in `STATUS.md` and `site-passport.yaml` is not a measurement.
2. **`src/pages/projects/[...slug].astro` hard-codes `hasInlineFaqBlock={false}`**, duplicating the FAQ on 100 pages.
3. **`BaseLayout` appends 16 characters to every title**, truncating 333 of 348 SERP entries, and neither content gate measures the rendered title.

---

## Side-by-side

| Capability | Florida | Mexico | Gap |
|---|---|---|---|
| `BaseLayout` / `ArticleLayout` | ✓ | ✓ | parity |
| `HubLayout` (grouped collection hubs) | ✓ | ✗ | **missing** |
| `Breadcrumbs.astro` (visible) | ✓ | ✗ | **missing** — schema only |
| `RelatedLinks.astro` | ✓ | ✗ | **missing** |
| `lib/content-graph.ts` | ✓ | ✗ | **missing** — 1,746 dead links |
| `lib/md-inline.ts` | ✓ | ✗ | **missing** — raw markdown on 15 pages |
| `lib/lead-spam-gate.ts` | ✓ | ✗ | **missing** — `/api/lead` unprotected |
| `data/author.ts` (E-E-A-T authorship) | ✓ | ✗ | missing |
| `LandingContent.astro` + city landings | ✓ (`/invest-in-miami/` …) | ✗ | missing |
| Collections | 12 (+`glossary`, `regulations`, `segment`, `landing`, `buildings`, `communities`) | 6 | structural |
| `scripts/audit-site-html.mjs` | ✓ | ✗ | **missing** — found 1 P0 + 1,147 P1 on Mexico |
| `scripts/generate-llms-full.mjs` (`gen:llms`, wired to `prebuild`) | ✓ | ✗ | **missing** — llms.txt is a 617-byte stub |
| `scripts/deep-audit-report.mjs` (`qa:deep-audit`) | ✓ | ✗ | missing |
| `lib/lead-attribution.ts`, `whatsapp-intent.ts`, `lead-notify-email.ts` | ✓ | ✓ | parity |
| `ProjectCard`, `ContentCard`, `StickyCta`, `CtaBox` | partial | ✓ | Mexico ahead here |

Mexico is **ahead** on: `ProjectCard` + `homeProjects.ts` (a real homepage curation layer Florida lacks), `StickyCta`, `CtaBox`, `cardImage.ts` Cloudinary transform helper, and a much richer `site-report`.

---

## C1 · P0 — `validate:content` has never run in this repo

```
scripts/lib/more-content-gate.mjs:13
import { runCloudinaryDeliveryChecks } from '../../../scripts/lib/cloudinary-gate.mjs';
```

From `/home/user/mexico-invest-website/scripts/lib/`, `../../../scripts/lib/` resolves to **`/home/user/scripts/lib/cloudinary-gate.mjs`** — outside the repository. The file does not exist anywhere in `mexico-invest-website` or in the `more-group-content-os` submodule. It is a leftover from a monorepo layout.

Every invocation dies:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/home/user/scripts/lib/cloudinary-gate.mjs'
  imported from .../scripts/lib/more-content-gate.mjs
```

This kills `validate:content`, `validate:content:changed`, `validate:strict`, and the `Content validate` step of `qa:full` — and it is why `qa:full:quick` reports 4/6.

**Consequence:** `.content-os/STATUS.md`, `site-passport.yaml` and `programs/mexico-invest.yaml` all record `validate:content --all → 337/337 clean` as a baseline fact. It is not a measurement; the command exits 1 before reading a file. The pre-push hook (`.githooks/pre-push` → `prepush:gate`) is presumably failing open or being skipped.

**Fix:** either restore `scripts/lib/cloudinary-gate.mjs` from Florida/`more-group-content-os`, or make the import optional:

```js
let runCloudinaryDeliveryChecks = () => [];
try { ({ runCloudinaryDeliveryChecks } = await import('./cloudinary-gate.mjs')); } catch {}
```

**Then re-run and treat whatever it reports as the true baseline.** (With the module stubbed out-of-repo purely to observe behaviour, the rest of the gate does pass 337/337 — which is itself the §C2 finding.)

---

## C2 · P0 — The content gate rewards exactly the behaviour that produced the garbage

`scripts/lib/more-content-gate.mjs` enforces, per commercial article:

| Rule | Line |
|---|---|
| `low fact density: {n} numeric facts, need >= {min} (GEO)` | 179 |
| `needs 3+ tables` | 167 |
| `fewer than 4 H2 sections` | 165 |
| missing `<TldrBlock />` | 163 |
| missing `<FaqBlock items={…} />` | 182 |
| missing pros/cons (PLEADA) | 169 |
| missing risks / red flags / **insider tip** block | 172 |
| missing buyer scenarios or decision framework | 175 |

A generator satisfies all eight by injecting numbers, tables, question-H2s and an "Insider tip:" line into every section. **That is exactly what the corpus contains** (AUDIT-REPORT §A0/§A1). The gate has:

- **no cross-file duplication check** — 41% of sentences repeat and it reports clean;
- **no unit/plausibility check** — `files average $326,000 turnaround` passes `low fact density` with flying colours, because it *is* a numeric fact;
- **no upper bound** on H2 count, word count, or numeric density.

Quantity thresholds without a quality counterweight are a generation target. The fix is not to loosen them — it is to add the counterweights (C3).

---

## C3 · P0 — Missing gate: whole-site rendered audit

Mexico's `scripts/audit-rendered-live.mjs` checks **10 named past incidents** (`lead-form-top`, `multi-lead-form`, `draft-marker`, `holding-exit-boilerplate`, …). It scans only pages derived from `src/content` — hubs and static pages are invisible to it. It reports `0 errors`.

Florida's `scripts/audit-site-html.mjs` walks **every** built HTML file. Run unmodified against Mexico's `dist/`:

```
=== SITE HTML AUDIT ===
Pages scanned: 354 | indexable: 348
[P1] img-alt-empty        — 683
[P1] title-too-long       — 333
[P1] duplicate-h2         — 100
[P1] raw-markdown-visible —  15
[P1] og-image-svg         —  13
[P1] orphan-page          —   2   (/developers/, /news/)
[P1] description-too-short—   1
[P0] broken-internal-link —   1
P0: 1 | P1: 1147
```

Zero on `h1-count`, `jsonld-invalid`, `canonical-missing`, `duplicate-title` — those are genuinely healthy.

**Port `audit-site-html.mjs` verbatim** (it takes no Florida-specific config beyond `dist/client`), wire as `audit:site` / `qa:site`, and add two Mexico-specific checks the corpus needs:

- **cross-file sentence duplication** — flag any ≥8-word sentence whose number-normalised shape appears in ≥3 other files;
- **unit coherence** — flag `$` adjacent to `turnaround`/`yield`/`withholding`/`rate`, and `%` adjacent to `price`/`entry ticket`/`carry`.

Those two checks alone would have caught A0 at generation time.

---

## C4 · P0 — Nav and footer strand two collections

`src/components/Header.astro` nav: Guides, Projects, Areas, Compare, About, Contact.
`src/components/Footer.astro` "Explore": Guides, Comparisons, Methodology.

**`/news/` and `/developers/` appear in neither** — which is why Florida's orphan check flags both hub pages as having zero inbound internal links, and why 15 of 28 news items and 5 of 9 developer pages are orphans (AUDIT-REPORT §A4).

The footer is also carrying three links on a 348-page site. Florida uses the footer as a second link surface. Mexico should list all six collections plus `/get-shortlist/`, `/about/`, `/methodology/`.

Also in `Header.astro`: no mobile nav. The `<nav>` is `hidden md:flex` with no hamburger — **on mobile the only navigation is the logo and the "Free shortlist" button.** For a site whose audience browses on phones from the US, that is both a UX and an internal-linking problem.

---

## C5 · P0 — `projects/[...slug].astro` duplicates the FAQ on 100 pages

```astro
// src/pages/projects/[...slug].astro:41
hasInlineFaqBlock={false}          // hard-coded
```

`guides`, `areas`, `compare`, `news`, `developers` all do the right thing:

```astro
const hasInlineFaqBlock = entry.body?.includes('<FaqBlock') ?? false;
```

All 100 project MDX files contain `<FaqBlock`. Result: inline block + a second layout-rendered block. Confirmed in `dist`. **One-line fix.**

---

## C6 · P0 — Title suffix is applied blind

```astro
// src/layouts/BaseLayout.astro:31
const fullTitle = title.includes('Mexico Invest') ? title : `${title} | Mexico Invest`;
```

336 of 337 frontmatter titles do not contain the brand, so 336 get **+16 chars**. Frontmatter titles average 55; rendered average **71**; **333 exceed 62**.

Both gates measure the wrong string and disagree with each other:

- `scripts/qa-audit.mjs:148` → `titleLen` outside 45–65 is a problem
- `scripts/lib/more-content-gate.mjs:98` → `expected 50-60 chars`

Neither knows about the suffix. Options, in order of preference:

1. Append the suffix only when `title.length <= 46`; otherwise ship the bare title. Zero content churn, fixes 333 pages immediately.
2. Change the gates to validate `title.length + 16 <= 60` and retitle in a wave (better long-term, needed anyway for D1/D2 CTR work).

Do **both** — (1) as the immediate unblock, (2) as the wave.

---

## C7 · P1 — `llms.txt` misrepresents a 337-page corpus

`public/llms.txt` — 617 bytes, 3 guides listed. `public/llms-full.txt` — 386 bytes. `robots.txt` explicitly invites GPTBot, OAI-SearchBot, ClaudeBot and PerplexityBot, and then hands them a stub.

Florida: `scripts/generate-llms-full.mjs`, exposed as `gen:llms`, wired into `prebuild` so it can never go stale. Direct port — the script reads collections generically.

For Mexico the generated `llms-full.txt` should carry, per entry: URL, title, description, `updatedDate`, collection, and (for projects) `priceFromUsd` / `area` / `developer` / `status`. That is the machine-readable inventory an LLM needs to cite the site correctly, and it is the single cheapest GEO asset available.

---

## C8 · P1 — Collection hubs are flat dumps

`src/pages/guides/index.astro` renders a "Start here" strip from `FEATURED_GUIDE_SLUGS` and then **all 132 guides in one flat grid** — 132 lazy-loaded images, no topical grouping, no pagination, and 132 links diluting each other's weight.
`src/pages/projects/index.astro` — all 100, sorted by price, no filters, H1 = "Project reviews" (no keyword), no hub copy, no `ItemList` schema.

Florida's `HubLayout.astro` takes `groups: HubGroup[]` — labelled clusters with an editorial note each — plus `intro: string[]` (2–4 paragraphs of unique hub copy), `faq`, and `lastUpdated` for schema freshness. Its `guides/index.astro` declares clusters explicitly ("Start here", "Foreign buyers: tax, title and entry", "Financing", "Yield, costs and carrying", "Condo safety and HOA risk", "Short-term rental strategy", …).

Mexico's 132 guides map onto clusters cleanly and the taxonomy is already implied by the slugs:

`Start here` · `Fideicomiso & restricted zone` · `Buying process & due diligence` · `Mexican tax (ISR / IVA / RFC / CFDI / predial)` · `US & Canadian tax (FATCA / FBAR / 1116 / Schedule E / 1031)` · `Short-term rental & STR permits` · `Financing & currency` · `Risk (seismic / hurricane / flood / ejido / fraud)` · `Selling & repatriation` · `Markets & budget tiers` · `Buyer profiles`

Same treatment for `/projects/` (by market, then price band), `/areas/` (by region), `/compare/` (by comparison type).

**This is also the fix for the guides hub's H1**, which is currently the bare noun "Investment guides" — Florida's `HubLayout` separates `title` (keyword-carrying `<title>`) from `heading` (`<h1>`) deliberately.

---

## C9 · P1 — No visible breadcrumbs anywhere (352/352 pages)

`ArticleLayout.astro` builds a `BreadcrumbList` schema from `Astro.url.pathname` but renders **no breadcrumb UI**. Florida generates schema *and* nav from **one** `crumbs` array so they cannot drift, and ships `Breadcrumbs.astro` (self-contained, scoped styles, `aria-label="Breadcrumb"`, `aria-current="page"`).

Mexico's schema also derives the section name from the path (`pathParts[0].charAt(0).toUpperCase()`), giving `Compare` where the UI would want `Comparisons` and `News` where it should be `Market notes`. Florida maps this through an explicit `SECTION_LABEL` record.

Direct port of `Breadcrumbs.astro` + the `crumbs`-as-single-source pattern.

---

## C10 · P0 — `content-graph.ts` and `RelatedLinks.astro`: 1,746 dead links

The biggest single-file win in the audit. Florida's `src/lib/content-graph.ts` exposes two layers:

- `resolveRelatedSlugs(slugs, selfSlug)` — resolves the curated `relatedSlugs` frontmatter (slugs are unique corpus-wide, so no collection needed);
- `resolveRelatedEntities(collection, slug, data, alreadyLinked)` — deterministic cross-collection siblings from a geo taxonomy, closing the gaps body copy never bridges.

Mexico has **1,746 curated `relatedSlugs` entries across all 337 files, 0 broken, 0 rendered** — layer 1 is pure upside with no content work at all.

Layer 2 needs a Mexico `src/data/geo.ts`: `AREA → MARKET` (Riviera Maya, Los Cabos, Puerto Vallarta/Riviera Nayarit, Yucatán, Pacific), `PROJECT → AREA` (`projectSchema.area` already exists), `PROJECT → DEVELOPER` (`projectSchema.developer` already exists), `AREA → COMPARE`. That is enough to auto-link:

- project → its area, its developer, comparable projects in the same area, the relevant compare page;
- area → projects in it, the market guide, comparisons involving it, recent news for it;
- developer → its projects;
- guide → the areas and projects its cluster covers.

**This alone resolves most of the 57 orphans** — 18 orphan projects and 9 orphan areas all have `area`/`developer` metadata to link from.

Note: Mexico's `content.config.ts` also carries `projectSchema` fields (`priceFromUsd`, `priceToUsd`, `area`, `developer`, `propertyType`, `status`) that **never reach the detail page** — only cards. A spec table on the project page plus `ApartmentComplex`/`Product` schema (Florida does this for `buildings`) is the natural companion change.

---

## C11 · P1 — `TldrBlock` and FAQ answers need `md-inline.ts`

```astro
<!-- src/components/TldrBlock.astro -->
<p>{text}</p>
```

`text` frequently contains markdown links, which print literally (15 pages, AUDIT-REPORT §B4). `FaqBlock` uses `set:html` on answers but never converts markdown, so any link written in an answer has the same fate.

Florida ships `src/lib/md-inline.ts` and applies `mdInlineToHtml` to FAQ answers in both the rendered block *and* the `FAQPage` schema. Port it and apply to `TldrBlock.text` and `FaqBlock` answers.

---

## C12 · P1 — Hero images: no `heroAlt`, `alt=""` on 337 pages

```astro
<!-- src/layouts/ArticleLayout.astro -->
<img src={optimizedHeroImage} alt="" … />
```

`content.config.ts` has no `heroAlt` field. Florida:

```astro
const heroAltText = heroAlt ||
  (data.neighborhood
    ? `${title.split(':')[0].trim()}, ${data.neighborhood}, Florida`
    : `${title.split(':')[0].trim()}, Florida property research`);
```

Port: add optional `heroAlt` to the schema, and a Mexico fallback using `data.area` where present (`"Chileno Bay Residences, Los Cabos, Mexico property research"`).

---

## C13 · P1 — `og:image` default is an SVG

```astro
// src/layouts/BaseLayout.astro:26
ogImage = `${SITE.url}/favicon.svg`
```

Articles override it with the Cloudinary hero, so this only bites the 13 pages people actually share — homepage, all six hubs, `/about/`, `/contact/`, `/get-shortlist/`, `/methodology/`, `/terms/`, `/privacy-policy/`. Needs a 1200×630 PNG/JPG in `public/` and a one-line default change.

Related, in the same block: `type = 'website'` is passed correctly, but **no `article:published_time` / `article:modified_time` OG tags** are emitted for articles. Cheap addition alongside.

---

## C14 · P1 — `/api/lead` has no spam gate

`src/pages/api/lead.ts` parses JSON and forwards to Telegram + Resend with **no honeypot, no rate limit, no timing check, no field validation beyond presence**. Florida ships `src/lib/lead-spam-gate.ts`. On a site actively inviting form fills from paid and organic traffic, this will be found. Direct port.

---

## C15 · P1 — Sitemap has no `lastmod`

`astro.config.mjs`'s `sitemap()` `serialize()` sets `priority` and `changefreq` but never `lastmod`, so 348 URLs ship without one — while `updatedDate` sits in every frontmatter. `changefreq`/`priority` are largely ignored by Google; `lastmod` is not.

Requires threading collection dates into `serialize` (a small map built at config time, or a custom sitemap route).

---

## C16 · P2 — `site-report` is hard-coded and 4 weeks stale

`src/pages/site-report/index.astro` (1,014 lines) hard-codes:

- `reportDate = '27 July 2026'`, `dataThrough = '24 July 2026'` — today is 21 August; the analytics snapshot runs to 18 August;
- `contentBreakdown` counts (132/100/36/32/9/28) as literals rather than `getCollection().length`;
- `geoSnapshot.validateContentPass: 337` — the metric §C1 shows was never measured.

At minimum, derive the counts from the collections so they cannot drift. The page is `noindex` + sitemap-excluded, so this is internal-credibility, not SEO.

---

## C17 · P2 — Brand and trust details

- `src/data/site.ts` → `whatsapp: 'https://wa.me/66651195327'` — **a Thai (+66) number** on a Mexico site targeting US/Canadian buyers, surfaced in `LeadForm` as the "Prefer WhatsApp?" path and tracked by `WhatsAppIntentTracker`. A +52 or +1 number would convert better; at minimum it should not read as Thailand.
- `SITE.sameAs` includes `https://moregroup.estate/about/`. Fine as a corporate link, but it ties an "independent research" brand to a group site in `Organization` schema — worth a deliberate decision rather than an inherited default.
- **No `data/author.ts`.** Article `author` is the `Organization` `Mexico Invest Editorial`. For YMYL (foreign property law, cross-border tax) a named `Person` with real credentials is a materially stronger E-E-A-T signal. Florida's `author.ts` is built for exactly this transition and its docstring is the right policy: *"Inventing an expert would be worse than the Organization byline, not better."* Port the file, leave `USE_PERSON = false` until a real person stands behind it.

---

## C18 · ✓ Verified healthy — do not touch

- `astro.config.mjs`: `site` apex, `trailingSlash: 'always'`, `output: 'static'`, sitemap excludes `noindex` slugs correctly.
- `vercel.json`: 308 www→apex host redirect, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Robots-Tag: noindex` on `/api/*`.
- `robots.txt`: AI crawlers explicitly allowed, `/api/`, `/thanks/`, `/site-report/` disallowed, sitemap declared.
- Canonicals: every `[...slug].astro` passes an explicit apex canonical. 0 pages missing, 0 pointing at www.
- JSON-LD: 0 invalid across 352 pages. Organization + Article + BreadcrumbList + FAQPage.
- `<h1>`: exactly one on all 352 pages.
- Fonts preconnected; hero uses `loading="eager"` + `fetchpriority="high"` + explicit `width`/`height`; cards use `loading="lazy"` + `decoding="async"` + dimensions. LCP hygiene is correct.
- `lib/cardImage.ts` + `optimizeHeroImage()` inject Cloudinary `w_/q_/f_webp` transforms. Good.
- `.githooks/pre-push` → `prepush:gate` exists (currently defeated by C1).

---

## Port list, in dependency order

| # | From Florida | To Mexico | Unblocks |
|---|---|---|---|
| 1 | — | fix `more-content-gate.mjs:13` import | C1 — everything else is unmeasurable without this |
| 2 | — | `hasInlineFaqBlock` in `projects/[...slug].astro` | C5 — 100 pages |
| 3 | — | conditional title suffix in `BaseLayout` | C6 — 333 pages |
| 4 | `scripts/audit-site-html.mjs` | + 2 Mexico checks (dup-sentence, unit-coherence) | C3 — the gate that would have caught A0 |
| 5 | `lib/content-graph.ts` + `RelatedLinks.astro` + new `data/geo.ts` | `ArticleLayout` | C10 — 1,746 links, 57 orphans |
| 6 | `Breadcrumbs.astro` + single-source `crumbs` | `ArticleLayout` | C9 — 352 pages |
| 7 | `lib/md-inline.ts` | `TldrBlock`, `FaqBlock` | C11 — 15 pages |
| 8 | `HubLayout.astro` | 6 collection index pages | C8 |
| 9 | `scripts/generate-llms-full.mjs` + `prebuild` | `gen:llms` | C7 |
| 10 | `lib/lead-spam-gate.ts` | `api/lead.ts` | C14 |
| 11 | `data/author.ts` | `ArticleLayout` schema | C17 |
| 12 | — | `heroAlt` in schema + layout | C12 |
| 13 | — | OG PNG + `article:*` meta | C13 |
| 14 | — | sitemap `lastmod` | C15 |
| 15 | — | nav/footer: add News + Developers, add mobile nav | C4 |

Sequenced with owners and gates in `.content-os/batches/code-improvements-roadmap-2026-08-21.md`.

---

**STOP.** No Astro, layout, component, script or config file was modified in this audit. Awaiting «ок» from Maxim.
