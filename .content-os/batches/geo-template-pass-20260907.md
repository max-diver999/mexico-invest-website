# GEO template-family pass, 2026-09-07

## What the debt actually was

The audit reported legacy pages scoring 34 to 46 out of 75 on
`scripts/geo-score.mjs`, capped by `template-family`: sentences whose first
twelve tokens, with numbers reduced to `#` and capitalised words to `X`, are
shared with three or more other articles.

Profiling the whole corpus found **247 of 352 files penalised, 2,511 points,
127 distinct families**. The diagnosis in the audit was that the prose was
generated. That was wrong. The families are overwhelmingly **call-to-action copy
and link rows**, not editorial writing.

The six largest families were two `CtaBox` blocks:

| Sentence | Files |
|---|---:|
| "Want three options here with the numbers run?" | 93 |
| "Tell us the budget and what the money is for." | 93 |
| "We come back with three to five properties in this market..." | 93 |
| "Want three comparable buildings run the same way?" | 66 |
| "One project only means something next to its alternatives." | 66 |
| "Tell us the budget and we will come back with comparable stock..." | 66 |

One CTA block sat byte-identical on 93 areas, comparison and guide pages;
another on 66 project cards.

## What was done

**159 call-to-action blocks rewritten**, one per page, each grounded in what
actually decides that page's purchase. No variant is used more than once, since
three uses would recreate the family.

Examples of the shift: the Holbox card now asks whether every structure on the
property is permitted inside the biosphere; the Lake Chapala page asks for the
water source and drainage; the marina project cards ask whether a berth is
owned, leased or merely nearby; the Vidanta card asks whether the paperwork
offers title, a membership or a use right.

## Result

| Measure | Before | After |
|---|---:|---:|
| Files carrying a template-family penalty | 247 | **176** |
| Penalty points across the corpus | 2,511 | **1,281** |
| Distinct shared families | 127 | 118 |

A 49 % reduction from rewriting 159 blocks. Because the families were shared,
files that were never edited improved too.

## A defect found and fixed while doing it

Wave 6 rewrote 374 internal links mechanically when their targets were merged.
That left **247 misleading labels across 159 files**: text reading
`[Aldea Zama Tulum](/areas/tulum/)` or `[Invest in Playa del Carmen](/areas/playa-del-carmen/)`,
where the label named a page that no longer exists and the link went to its
parent. It also produced **76 lines carrying two links to the same URL**.

Both are corrected: 265 labels now name their destination, and 79 duplicate
links were collapsed. Zero lines now carry two links to one address.

## Honest limits

**The remaining 1,281 points are link rows, not prose.** The top families left
are `National: Mexico Property Investment Guide.` (51 files),
`Mexico Capital Gains Tax Foreign Seller.` (46) and
`Non-Resident Mortgage Mexico.` (26). These are bare link labels rendered as
sentences, which is the slug-as-link-text antipattern the content contract bans
elsewhere. Clearing them is a further pass across roughly 120 files.

**Single-file before-and-after comparison is misleading here.** `geo-score`
builds its index from the corpus on disk, so swapping one old file into an
improved corpus scores it against the improved index. The corpus-level figures
above are the honest measure; per-file deltas are not.

**No page reaches 70 of 75.** The ceiling in the machine stage is 75 and the
best page in the corpus is 63. `template-family` was the largest single cap,
not the only one: `hedging` affects 75 files and `duplicated-text` 67.

## Gates

| Gate | Result |
|---|---|
| `validate:content`, full corpus | PASS, 0 issues on 352 |
| `qa:originality:fail`, full corpus | PASS |
| `npm run build` | PASS, 352 pages, 0 rendered issues |
| Link-count failures caused by this pass | **0** (41 pre-existing, unchanged) |
