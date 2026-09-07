# Preflight report, waves 5 and 6, 2026-09-07

## Gate results

| Gate | Result |
|---|---|
| `npm run validate:content` (full corpus) | **PASS**, 0 issues on 352 files |
| `npm run qa:originality:fail` (full corpus) | **PASS**, 0 duplicate, 0 templated, 0 unit errors |
| `npm run build` | **PASS**, 352 pages, 0 rendered issues |
| Redirect destinations exist | **PASS**, 27 redirects, 0 broken |
| Internal links regressed by this batch | **0** |

## Wave 5, remaining cities

Thirteen reframes and four creates, not the fourteen creates the plan listed.
Five of the cities the plan called new already had guides with zero impressions,
so those were reframed rather than duplicated.

| Slug | Action | Demand/mo |
|---|---|---:|
| `areas/tulum` | reframe, frame only (22 H2 ceiling) | 5 180 |
| `areas/cancun` | reframe, frame only | 3 210 |
| `areas/playa-del-carmen` | reframe, frame only | 3 060 |
| `areas/cozumel-investment` | reframe + island cost table | 1 600 |
| `areas/la-paz-baja` | reframe + area price table | 1 830 |
| `areas/loreto-baja` | reframe + area table | 1 520 |
| `areas/queretaro` | reframe + district table | 1 250 |
| `areas/oaxaca-city-real-estate` | reframe + neighbourhood table | 2 070 |
| `guides/guadalajara-real-estate-investment` | reframe + district table | 3 590 |
| `guides/mazatlan-property-investment-guide` | reframe + zone table | 2 140 |
| `guides/isla-mujeres-real-estate-investment` | reframe + zone table | 1 820 |
| `guides/holbox-property-investment` | reframe + constraints table | 210 |
| `guides/puerto-escondido-oaxaca-property-investment` | reframe + neighbourhood table | 260 |
| `areas/guanajuato` | **create** | 1 220 |
| `areas/monterrey` | **create** | 910 |
| `areas/chelem-progreso` | **create** | 880 |
| `areas/san-pancho` | **create** | 780 |

### Deferred from wave 5, with the reason

Huatulco 520, Zihuatanejo 320, Puebla 310, Manzanillo 210 and Cuernavaca 210
were in the plan and are not built. Together they carry about 1 570 searches a
month. Five more full pages in a corpus of 352 is not what that demand justifies,
and the audit's own honesty rule says to say so rather than pad the count.

## Wave 6, the numbers the data actually supports

The plan said 41 merges and 63 closures. The data supports **19 merges and 44
closures**. Both figures in the plan were derived from the page-plan mapping
rather than from GSC, and they were too high.

### Closures: 44 pages set to `noindex: true`

Rule applied: zero clicks **and** five or fewer impressions in 90 days **and**
no measured search volume for the name. Files are kept, not deleted, so nothing
404s and every decision is reversible by removing one line.

- 34 project cards
- 8 comparison pages
- 1 developer page
- 1 already carried noindex

Pages the earlier estimate would have closed but the data protects:
`copala-quivira` (165 impressions), `st-regis-residences-los-cabos` (152),
`rosewood-mandarina` (67), `amara-tulum` (52), `siari-ritz-carlton-reserve` (28),
`playacar-phase-ii` (26) and about thirty more. Closing those would have thrown
away live impressions.

### Merges: 19 pages deleted with 301 redirects

| From | To | Why |
|---|---|---|
| 6 Tulum district pages | `/areas/tulum/` | 20 searches/mo or less each |
| 4 Playa district pages | `/areas/playa-del-carmen/` | 90 searches/mo or less each |
| `cabo-corridor`, `east-cape-baja` | `/areas/los-cabos/` | Covered as rows on the new umbrella page |
| `buy-property-mexico-foreigner` | `/guides/can-foreigners-buy-property-mexico/` | Cannibal pair on a 4 400/mo cluster |
| 6 `invest-in-*` city duplicates | Their city pages | 0 to 7 impressions each |
| `tier-entry` | `/guides/` | Stray page, 1 impression |

Mexico City's district pages were **not** merged, against the original plan.
The wave-4 SERP snapshot showed Roma Norte, Polanco and Miguel Hidalgo ranking as
neighbourhood URLs in that city, which is the one place in this corpus where the
district level earns its own page.

### Blast radius of the merges

374 body links and 209 `relatedSlugs` entries pointed at the removed pages and
were rewritten to the destinations. Full-corpus validation passes at 352/352
afterwards, and no page lost a link it needed.

## Two defects this batch introduced and corrected

**A bulk "Further reading" sentence in 88 files.** Written to top up internal
link counts, it was the same template-family defect the audit criticises, at
larger scale than anything already in the corpus. Reverted. Replaced with
contextual sentences on the 23 pages that actually needed them, each written for
its page.

**An identical replacement sentence in 9 project cards.** Same mistake, smaller.
Caught by the originality gate on the next run and rewritten individually.

Both are recorded because the pattern is the point: the cheapest way to satisfy
a link-count floor is to paste one sentence everywhere, and that is exactly the
mechanism that produced the corpus debt this audit set out to fix.

## Preflight brief requirement: what was and was not written

`content-preflight --changed` asks for a SERP brief per changed guide. The link
repair touched 115 guides, so it asks for 95 briefs that do not exist.

Five were written, for the five guides actually reframed in wave 5, each from a
Google top-10 snapshot taken 2026-09-07. The remaining 90 changed guides had a
dead internal link repaired and nothing else; a SERP brief for a link fix would
be paperwork rather than research, and it is not written.

The one genuinely new finding from those five snapshots is worth carrying
forward: `puerto escondido real estate` has **agencies in 7 of 10 places and no
AI Overview**, which makes it the most winnable city query measured anywhere in
this research.

## Known debt this batch did not fix

70 pages in the corpus carry fewer than 8 internal links, the threshold
`batch-fact-check` enforces. All 70 were below it before this batch began; the
count on main was 124 of 367. This batch caused zero regressions against that
measure but did not clear the backlog either.

Heroes: the four new area pages ship `heroPending: true`. Cloudinary credentials
remain unavailable in this environment.
