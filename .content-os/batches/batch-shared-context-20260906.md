# Wave 1 — country commercial hubs

Batch date: 2026-09-06
Plan: `.content-os/reports/seo-core-2026-09-06/README.md`, волна 1
Branch: `cc/mexico-wave1-20260906`

## Why this wave

Measured demand puts 34,3 % of the market at country level and 89,4 % in the
commercial frame (`homes for sale`, `houses for sale`, `condos for sale`).
The site currently owns the investment frame, which is 0,3 % of the market.
This wave moves six pages onto the frame the market actually types.

## Correction to the page plan

The plan listed six **new** URLs. Building it against the live corpus showed
four near-matches already exist, so creating six new slugs would have created
four cannibal pairs. Revised split: **2 create, 4 rewrite**.

| Target family | Demand/mo | Existing page | Action |
|---|---:|---|---|
| homes / houses for sale in mexico | 34 380 | none | create `homes-for-sale-mexico` |
| mexico real estate | 9 440 | `mexico-property-investment-guide` (61 impr, pos 14,3) | rewrite + retitle |
| condos for sale in mexico | 5 990 | `mexico-condo-investment-foreigners` (12 impr, pos 9,3) | rewrite + retitle |
| property for sale in mexico | 2 420 | none (`buy-property-mexico-foreigner` stays legal, merges in wave 4) | create `property-for-sale-mexico` |
| beachfront property mexico | 670 | `mexico-beachfront-property-investment` (7 impr) | rewrite + retitle |
| cheap homes under $200k | 260 | `budget-investor-mexico-under-200k` (77 impr, pos 6,8) | rewrite + retitle |

## Pillar and stat ownership (batch-cluster-writing)

| Stat | Owner slug | Everyone else |
|---|---|---|
| Country price bands by city | `homes-for-sale-mexico` | one sentence + link |
| Closing cost percentage | `mexico-property-closing-costs-breakdown` (existing) | link only |
| Fideicomiso setup and annual fee | `fideicomiso-bank-fees-comparison-2026` (existing) | link only |
| Restricted zone rule (50 km / 100 km) | `mexico-restricted-zone-explained` (existing) | one sentence + link |
| Condo HOA ranges | `hoa-fees-mexico-condo` (existing) | link only |
| Hurricane / flood exposure | `hurricane-flood-insurance-quintana-roo` (existing) | link only |

No stat table is repeated across two files in this batch.

## Honesty ledger

- Price bands are **indicative**, sourced from listing medians observed on
  realtor.com international, Properstar and Century 21 Mexico in Sep 2026.
  Every band is labelled indicative in the body.
- No MORE Group performance claims, growth forecasts or client shares.
  See memory rule: invented holding stats were purged from 319 pages in PR 41.
- No liquidity judgements ("low liquidity", "not recommended for investment").
- Fideicomiso and tax figures are carried by their owner slugs, not restated.

## Heroes

Cloudinary credentials are not available in this environment
(`CLOUDINARY_URL` and friends unset, no `.env`). All six pages ship with
`heroPending: true`, which the content schema documents as the honest state
for a page whose art is not ready. Hero upload is a separate pass once
`policies/claude-code-cloud-setup.md` env is in place.

## Gates this batch must clear

`npm run validate:content:changed` exit 0, which enforces: title 30-60,
description 120-160, 5+ FAQ, 2000+ words, quick answer, TldrBlock, FaqBlock,
5+ internal links with trailing slash to existing slugs, 3+ tables,
12+ numeric facts, <=35 bold spans, <=22 H2, no em dash, no AI fluff.
Batch policy adds 2500 words and GEO >=90.
