# Preflight report, waves 2 to 4, 2026-09-06

## Gate results

| Gate | Result |
|---|---|
| `npm run validate:content:changed` | **PASS**, 0 issues on 17 files |
| `npm run qa:originality:changed` | **PASS**, 0 duplicate, 0 templated, 0 unit errors |
| `content-preflight.mjs --changed` | **0 errors**, 62 warnings |
| `batch-fact-check.mjs --changed` | **0 errors**, 0 warnings |
| `npm run build` | **PASS**, 367 pages, 0 rendered issues |

## Wave 2, six city heavyweights, 61 910 searches/mo

| Slug | Action | Demand/mo |
|---|---|---:|
| `areas/puerto-vallarta` | reframe + neighbourhood price table | 17 670 |
| `areas/merida` | reframe + neighbourhood price table | 12 020 |
| `areas/mexico-city` | **create** | 11 000 |
| `areas/san-miguel-de-allende-property` | reframe + zone price table | 9 180 |
| `areas/lake-chapala-ajijic` | **create** | 6 450 |
| `areas/los-cabos` | **create**, umbrella over three existing district pages | 5 590 |

## Wave 3, the Baja and Sonora corridor, 15 300 searches/mo

Six markets that had no page of any kind. All six SERPs are agency-held rather
than portal-held, five to eight of ten results, which is why this wave went in
ahead of larger but harder targets.

| Slug | Demand/mo | Agencies in US top 10 |
|---|---:|---:|
| `areas/rosarito` | 5 070 | 7 |
| `areas/puerto-penasco` | 2 860 | 5 |
| `areas/ensenada` | 2 050 | 5 |
| `areas/tijuana` | 1 590 | 3 |
| `areas/san-felipe` | 1 560 | 5 |
| `areas/san-carlos-sonora` | 1 170 | 3 |

## Wave 4, legal and life hubs, 21 060 searches/mo

| Slug | Action | Demand/mo |
|---|---|---:|
| `guides/retire-in-mexico` | **create**, hub above three existing retiree guides | 6 290 |
| `guides/cost-of-living-mexico` | **create** | 5 760 |
| `guides/can-foreigners-buy-property-mexico` | retitle to the "Americans" head term | 4 400 |
| `guides/fideicomiso-mexico-explained` | retitle to the definition frame | 1 090 |
| `guides/mexico-property-taxes-explained` | retitle to the "vs the US" frame | 840 |
| `guides/how-to-buy-mexico-property-step-by-step` | **no change** | 2 640 |

The last row is deliberate. Its title already reads "How to Buy Property in
Mexico: Step-by-Step 2026", which is the head term. Changing it would have been
motion without benefit.

## A defect this batch introduced and then fixed

The originality gate caught seven files carrying the sentence "Bands below are
indicative asking observations from public listings in September 2026" word for
word. That is the same template-family defect the audit criticised in the
existing corpus, reproduced by the same mechanism: one useful disclaimer written
once and pasted. Each of the seven now carries its own wording. Recorded here
because the failure mode is worth naming rather than quietly correcting.

## Warnings accepted

62 preflight warnings, all in two categories. Nine new pages carry
`heroPending: true` because Cloudinary credentials are not available in this
environment. The remainder are title-overlap warnings from a token-similarity
check that saturates in a corpus where nearly every title contains "Mexico" and
either "real estate" or "property". Spot-checked by hand; no genuine cannibal
pairs among the flagged sets.

## Corrections to the published plan

The plan called `areas/mexico-city` and `areas/lake-chapala-ajijic` new, which is
right, but it also missed that `guides/mexico-city-real-estate-foreigner-guide`,
`guides/guadalajara-real-estate-investment`, `guides/invest-in-cancun`,
`guides/invest-in-tulum`, `guides/invest-in-puerto-vallarta` and
`guides/invest-in-los-cabos` already exist. None of them holds a single GSC
impression, so they are reframe candidates for wave 5 rather than gaps.
