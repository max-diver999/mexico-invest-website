# Mexico Invest — Wave 6 + 7 + 8 (50 articles)

**DRAFT ONLY — do NOT commit, build, deploy, or index.**

## QA hard gates (qa-audit.mjs)
- **guides:** 2000+ body words
- **compare / areas:** 1800+ body words
- **projects:** 1200+ body words
- title: 45–65 chars | description: 120–160 chars
- **Quick answer** in first 100 words (`**Quick answer:**` — NO duplicate H1 in body; layout renders title)
- Every H2 opens with **40–60 word direct answer** before tables/lists
- 5+ FAQ in frontmatter only (NO `<FaqBlock>` or `<LeadForm>` in body — layout auto-inserts)
- 5+ internal links with **trailing slashes** (`/guides/slug/`)
- 3+ table lines | no `<5`, `>10`, `faqs={`, banned AI phrases
- pubDate/updatedDate: 2026-06-07 | author: `Mexico Invest Editorial`
- relatedSlugs: only existing slugs (see list) or siblings in same batch

## Banned phrases
sophisticated investors, operational excellence, comprehensive framework, future outlook, evolving landscape, robust framework, advanced investment strategies, extended due diligence checklist

## Facts sources
- `08_Идеи/MEXICO_RE_KNOWLEDGE_BASE_2026.md`
- `08_Идеи/MEXICO_RE_KNOWLEDGE_BASE_DEEPENING.md`
- `08_Идеи/MEXICO_RE_PROJECTS_PORTFOLIO_2026.md`

## Template references
- Guide: `src/content/guides/invest-in-tulum.mdx`
- Compare: `src/content/compare/playa-del-carmen-vs-tulum-investment.mdx`
- Area: `src/content/areas/tulum.mdx`
- Project: structure like guide + project frontmatter fields

## Project frontmatter (required extras)
```yaml
priceFromUsd: 147000
priceToUsd: 340000  # optional
area: "tulum"       # area slug
developer: "Grupo Emerita"
propertyType: "apartment"
status: "off-plan"  # off-plan | completed | delivering
```

heroImage optional for projects if no verified developer CDN URL.

---

## WAVE 6 (20) — Market intel + strategy

| slug | coll | keyword | min |
|---|---|---|---|
| nearshoring-mexico-industrial-real-estate | guides | nearshoring mexico real estate | 2000 |
| mexico-vs-panama-real-estate | compare | mexico vs panama real estate | 1800 |
| mexico-vs-colombia-investment | compare | mexico vs colombia real estate | 1800 |
| mexico-vs-thailand-property | compare | mexico vs thailand property | 1800 |
| condo-vs-villa-mexico-investment | compare | condo vs villa mexico investment | 1800 |
| cash-vs-mortgage-mexico-foreigner | compare | cash vs mortgage mexico foreigner | 1800 |
| branded-residence-vs-standard-condo-mexico | compare | branded residence vs condo mexico | 1800 |
| vacation-home-vs-pure-rental-mexico | compare | vacation home vs rental mexico | 1800 |
| pre-construction-vs-resale-tulum | compare | pre construction vs resale tulum | 1800 |
| centro-playa-vs-playacar | compare | centro playa vs playacar | 1800 |
| cabo-san-lucas-vs-san-jose-del-cabo | compare | cabo san lucas vs san jose del cabo | 1800 |
| nuevo-vallarta-vs-puerto-vallarta | compare | nuevo vallarta vs puerto vallarta | 1800 |
| us-capital-gains-mexico-sale | guides | us capital gains mexico property sale | 2000 |
| schedule-e-mexico-rental | guides | schedule e mexico rental income | 2000 |
| us-wire-transfer-mexico-property | guides | wire transfer mexico property purchase | 2000 |
| first-time-foreign-buyer-mexico | guides | first time foreign buyer mexico | 2000 |
| conservative-investor-mexico-playa | guides | conservative investor mexico playa | 2000 |
| aggressive-investor-tulum-precon | guides | aggressive investor tulum pre construction | 2000 |
| budget-investor-mexico-under-200k | guides | mexico property under 200000 | 2000 |
| developer-due-diligence-mexico | guides | developer due diligence mexico | 2000 |

---

## WAVE 7 (20) — Projects P0 Riviera Maya

| slug | area | developer | USD from |
|---|---|---|---|
| gran-tulum | tulum | SIMCA | 395000 |
| 101-park-tulum | tulum | 101 Tulum / SIMCA | 290000 |
| amara-tulum | tulum | DK del Caribe / Emerita | 147000 |
| kabana-aldea-zama | aldea-zama-tulum | Tresor | 202000 |
| nhoa-aldea-zama | aldea-zama-tulum | Grupo Emerita | 236000 |
| luum-zama | aldea-zama-tulum | Zamá Desarrollos | 450000 |
| distrito-xcalacoco-beach | playa-del-carmen | TM Group | 179000 |
| paravian-playa | gonzalo-guerrero-playa | Grupo Emerita | 175000 |
| oceana-residences | gonzalo-guerrero-playa | Private | 500000 |
| aldea-thai | playa-del-carmen | Condo-hotel | 400000 |
| inna-beach-condos | puerto-morelos | Lavalle-Peniche | 544000 |
| sole-blu-ocean-living | puerto-morelos | Eleva Capital | premium |
| mukta-369 | puerto-morelos | Mukta Residential | 130000 |
| tao-santamar-akumal | akumal | TAO Mexico | 300000 |
| constelada-tulum | tulum | Grupo Emerita | 169000 |
| omara-tulum | tulum | Grupo Emerita | mid |
| maresol-downtown-studios | playa-del-carmen | SIMCA | entry |
| solar-midtown | playa-del-carmen | SIMCA | entry |
| piedra-de-mar | puerto-morelos | Local | 145000 |
| nalu-sea-living | puerto-morelos | Local | mid |

---

## WAVE 8 tail (10) — Projects P0 Cabos + PV

| slug | area | developer | USD from |
|---|---|---|---|
| tao-monte-rocella | cabo-san-lucas | TAO Mexico | 299000 |
| copala-quivira | cabo-corridor | Quivira | 610000 |
| mavila-quivira | cabo-corridor | Quivira | 329000 |
| st-regis-residences-los-cabos | cabo-corridor | Quivira/Marriott | 4500000 |
| la-reserva-querencia | san-jose-del-cabo | Tempo Development | 2400000 |
| hideaways-los-cabos | san-jose-del-cabo | Cabo Blanco RE | mid |
| chileno-bay-residences | cabo-corridor | Auberge | 6000000 |
| diamante-ocean-club | cabo-san-lucas | Diamante | 1350000 |
| four-seasons-costa-palmas | east-cape-baja | Costa Palmas | 4000000 |
| tao-blue-gardens-pv | puerto-vallarta | TAO Mexico | 183000 |
