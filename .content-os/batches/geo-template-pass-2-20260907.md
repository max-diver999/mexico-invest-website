# GEO template-family, second pass, 2026-09-07

Continues `geo-template-pass-20260907.md`. Starting point for this pass:
1,281 points across 176 files.

## What was fixed

**69 more call-to-action blocks.** The first pass caught the two blocks used on
93 and 66 pages. Profiling again found seven smaller duplicated `CtaBox` blocks
covering another 69 placements: 18 tax guides sharing "Need this run against
your actual numbers?", 10 short-term rental guides, 9 developer pages, 9
financing guides, 8 process guides, 8 risk guides and 7 trust guides. Each now
carries copy written for its own subject. **No `CtaBox` title now appears in
three or more files anywhere in the corpus.**

**33 instances of one templated prose sentence.** "Foreigners buy via
fideicomiso." sat identically in the quick answer and TldrBlock of 33 project
and area pages. Each now states the same fact in its own terms, several of them
naming why the restricted zone applies to that specific location.

**25 files carrying a stray double period.** `](/areas/tulum/)..` was left by
the link-relabelling in the previous pass. Corrected.

## Result across both passes

| Measure | Start | After pass 1 | After pass 2 |
|---|---:|---:|---:|
| Files penalised | 247 | 176 | **111** |
| Penalty points | 2,511 | 1,281 | **822** |
| Distinct families | 127 | 118 | **96** |

**67 % of the template-family debt is gone**, and the number of affected files
has more than halved.

## An intervention that failed, and was reverted

The remaining large families are navigation rows: `Hub: [Some Guide].`,
`Area context: [Some Page].` and about sixteen other prefixes, roughly 767 rows
across 235 files. These are bare link labels rendered as sentences, which is the
slug-as-link-text pattern the content contract bans elsewhere.

The attempted fix replaced each row with a sentence drawn from a pool of 60
frames, assigned deterministically per file. The result:

| | Before | After |
|---|---:|---:|
| Penalty points | 909 | 897 |
| Distinct families | 97 | **135** |

Twelve points gained and thirty-eight new families created. Sentences like
"The wider market this sits in is covered on Mexico Capital Gains Tax Foreign
Seller." landed in ten files apiece. That is machine-generated text, which is
precisely what the scorer exists to detect, and it detected it. **Reverted in
full.**

The lesson is worth keeping: a frame pool is not variation. Below roughly one
distinct frame per two uses, mechanical reframing rebuilds the family it was
meant to remove and degrades the prose on the way.

## What is left, and why it was not touched

**Navigation rows, roughly 767 across 235 files.** Fixing these properly means
writing a real sentence per row that says why the reader should follow the link.
That is an editorial pass, not a script, and the failed attempt above is the
evidence for why.

**Legal disclaimers, four families across roughly 50 files.**
"*Indicative ranges from 2026 market observation, not quotes.",
"Pricing, fees and tax treatment move and are set per transaction...",
"Verify before you commit: USD/MXN exposure · HOA fees · closing costs...".
These are deliberately identical. The `legal-fact-consistency` policy requires
one wording per site for exactly this kind of statement, so varying them to
improve a score would trade a real editorial principle for points. Left alone.

**The other penalties.** `template-family` was the largest cap but not the only
one. `hedging` affects 75 files and `duplicated-text` 67; neither was addressed
here. No page in the corpus reaches 70 of 75; the best is 63.

## Gates

| Gate | Result |
|---|---|
| `validate:content`, full corpus | PASS, 0 issues on 352 |
| `qa:originality:fail`, full corpus | PASS |
| `npm run build` | PASS, 352 pages, 0 rendered issues |
| Link-count failures caused by this pass | **0** (38 pre-existing) |
