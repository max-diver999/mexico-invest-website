# Content quality audit checklist — mexico-invest.com

Phase 0 corpus pass. Large mature corpus — prioritize clusters and GEO blocks, not blanket rewrites.

## Baseline (2026-08-21)

- `npm run validate:content -- --all` — **337/337 clean**
- `npm run geo:audit` — commercial **90/100**, grade **A**
- **17 files** with block-level GEO issues (site still grade A at file level)
- Rubric: answer 99 · self 83 · structure 84 · stats 100 · unique 81

## Corpus checks (all 337 MDX)

- [ ] Fideicomiso cluster consistency (explained, bank fees, renewal, restricted zone)
- [ ] STR stack alignment (VAT, occupancy, liability insurance, RFC withholding mentions)
- [ ] Repatriation / CFDI / Form 1116 cross-links
- [ ] Projects (100) ↔ areas (32) ↔ compare (36) graph — orphans
- [ ] Cannibalization: multiple Cancun/Tulum/PV entry guides
- [ ] Boilerplate **«Mexico Invest underwriting show»** H2 blocks — list all 17+ and plan rewrite
- [ ] News (28) — freshness dates, link to evergreen guides
- [ ] Lead paths: get-shortlist + contact from commercial pages
- [ ] www vs apex URL consistency in internal links

## Rendered HTML (after build)

- [ ] Hero images + alt on guides/projects/areas
- [ ] JSON-LD Article/FAQ
- [ ] Lead forms render and POST to API
- [ ] `audit:rendered:fail` zero errors

## Code / UX (compare Florida pilot)

- [ ] Collection hub pages (guides, projects, areas, compare) — depth vs flat lists
- [ ] Header nav / breadcrumbs / related links
- [ ] content-graph or equivalent internal linking
- [ ] site-report counts match corpus
- [ ] llms.txt not stale scaffold

## Output

`AUDIT-REPORT-{date}.md` with P0/P1/P2, waves ~25 files. Separate `CODE-AUDIT` for Astro/components.
