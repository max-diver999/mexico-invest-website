# Preflight report, wave 1, 2026-09-06

## Gate results

| Gate | Result |
|---|---|
| `npm run validate:content:changed` | **PASS**, 0 issues on 9 files |
| `npm run qa:originality:changed` | **PASS**, 0 duplicate, 0 templated, 0 unit errors |
| `content-preflight.mjs --changed` | **0 errors**, 16 warnings |
| `batch-fact-check.mjs --changed` | **0 errors**, 9 warnings |
| `npm run build` | **PASS**, 744 pages, 0 rendered issues |
| `geo:audit` | **PASS**, corpus 74/100 against min 60 |

## Files in the batch

| Slug | Action | Words | Status |
|---|---|---:|---|
| `homes-for-sale-mexico` | create | 2 740 | clean |
| `property-for-sale-mexico` | create | 2 395 | clean |
| `mexico-property-investment-guide` | reframe | 5 316 | clean |
| `mexico-condo-investment-foreigners` | reframe + new section | 3 600 | clean |
| `mexico-beachfront-property-investment` | reframe + new section | 3 460 | clean |
| `budget-investor-mexico-under-200k` | reframe + new section | 4 000 | clean |
| `can-foreigners-buy-property-mexico` | inbound link only | unchanged | clean |
| `cost-of-buying-property-mexico` | inbound link only | unchanged | clean |
| `mexico-restricted-zone-explained` | inbound link only | unchanged | clean |

## Warnings accepted, with reasons

**No heroImage on the two new pages.** Cloudinary credentials are not present in
this environment, so uploading a hero was not possible. Both pages carry
`heroPending: true`, which the content schema documents as the honest state for
a page whose art is not ready. This is a tracked debt for the hero pass, not a
defect papered over.

**heroImage missing w_1200 transform** on the four reframed pages. Pre-existing
on all four; this batch did not touch the hero URLs.

**Title overlap warnings** on `mexico-property-investment-guide` (60 to 67
percent against four slugs) and `mexico-beachfront-property-investment` (75
percent against two). The checker measures token overlap, and in a corpus where
almost every title contains "Mexico" and "real estate" or "property" the metric
saturates. Checked by hand: the four flagged pairs target different query
families and none is a genuine cannibal.

## Tooling defect found

`content-preflight.mjs` derives the site id from `basename(siteRoot)`, so in a
git worktree named anything other than `mexico-invest-website` it looks for SERP
briefs under the wrong site folder and reports every brief as missing. Run it as:

```
node more-group-content-os/scripts/content-preflight.mjs --site /path/named/mexico-invest-website --changed
```

or from the main checkout. Worth fixing upstream in content-os.

## Known debt this batch did not fix

`geo-score.mjs` scores the four reframed pages at 34 to 46 out of 75, against 63
and 67 for the two new pages. The cap is `template-family`: sentences sharing a
skeleton with three or more other articles, for example "Want three options here
with the numbers run?". Scores before and after this batch: 35 to 35, 46 to 46,
41 to 44, 32 to 34. The reframe did not cause it and improved two of four.
Fixing it is a corpus-wide pass, not a wave-1 item.
