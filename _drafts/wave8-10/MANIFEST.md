# Wave 8–10 Drafts — 50 articles (NOT published)

> **Created:** 2026-06-08  
> **Status:** Draft only — files in `_drafts/wave8-10/`, NOT in `src/content/`  
> **QA scan:** 50/50 Tier A PASS — `node scripts/qa-audit-drafts.mjs` (links, slop, YAML, word floors)

## Totals

| Collection | Count | Avg words |
|---|---:|---:|
| projects | 16 | ~1,850 |
| compare | 11 | ~2,200 |
| guides | 10 | ~2,500 |
| developers | 9 | ~2,100 |
| news | 4 | ~880 |
| **TOTAL** | **50** | **~2,057** |

**Total body words:** ~102,831

## Before publish (production checklist)

1. Scaffold `/developers/` and `/news/` in `content.config.ts` + Astro pages
2. Move files: `_drafts/wave8-10/{coll}/*.mdx` → `src/content/{coll}/`
3. `npm run validate:content -- --changed` (extend validator for developers/news)
4. `npm run build` → commit → push
5. Indexing only after explicit «отправляй»

## Wave 8 tail — projects (10)

- montage-punta-mita, pendry-punta-mita, rosewood-mandarina, four-seasons-punta-mita, alvar-quivira
- ritz-carlton-puerto-los-cabos, fundadores-puerto-los-cabos, el-lago-querencia, coronado-quivira, siari-ritz-carlton-reserve

## Wave 9 — developers + compares + projects (20)

**Developers:** grupo-emerita, simca-desarrollos, zama-desarrollos, quivira-los-cabos, querencia-los-cabos, tao-mexico, tm-real-estate-group, dine-montage-punta-mita

**Guide HUB:** branded-residences-mexico-guide

**Compares:** amara-vs-nhoa-tulum, gran-tulum-vs-101-park, distrito-xcalacoco-vs-paravian, copala-quivira-vs-mavila-quivira, tao-blue-gardens-vs-marina-vallarta, st-regis-vs-chileno-bay-residences, montage-vs-pendry-punta-mita

**Projects:** selva-zama-mondo, junglar-kaybe

## Wave 10 — freshness + tail (20)

**News:** quintana-roo-price-growth-2026, tulum-inventory-2026, tren-maya-property-impact, mexico-str-tax-reporting-2026

**Commercial guides:** mexico-off-plan-investment, mexico-villa-investment, mexico-branded-residences-investment, mexico-turnkey-rental-property, mexico-golf-course-property, mexico-marina-property-investment

**Compares:** akumal-vs-tulum-investment, punta-mita-vs-los-cabos-luxury, mexico-vs-arizona-retirement, mexico-vs-texas-no-state-tax

**Segment guides:** luxury-investor-cabos-branded, cash-buyer-mexico-advantages, portfolio-diversification-mexico-re

**Projects:** amaru-inka, one-only-mandarina, ceiba-25-condo-paradise, saint-marine

**Developer:** vidanta-nuevo-vallarta (membership disclaimer included)
