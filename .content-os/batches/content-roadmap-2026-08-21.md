# Content roadmap — 50 new articles

Date: **2026-08-21** · mexico-invest.com · Machine-readable version: `topics-proposal.json`
Goal: qualified purchase-intent leads from US and Canadian buyers.

> **Awaiting «ок» from Maxim.** Proposal only. Per `publishing-gates.md`, topic discovery alone is not approval to write.
>
> **Hard precondition: do not start Wave A until corpus Waves 1–4 have landed.** Publishing 50 pieces onto a corpus where 39% of prose is duplicated boilerplate spreads the site-level quality problem to the new pages. The existing 337 pages are the substrate every new page inherits from. Fix the substrate first — that is the fastest route to rankings, not the slowest.

---

## Where the opportunity actually is

The existing keyword map is **good**. 132 guides already cover fideicomiso, restricted zone, ISR/IVA/RFC/CFDI, FATCA/FBAR/Form 1116/Schedule E/1031, ejido, escrow, wire fraud, notario, apostille, POA, inheritance, insurance and financing. That is a better topic list than most of the SERP. There is very little low-hanging *topic* gap.

What competitors ranking above mexico-invest.com actually have is **procedural specificity** — the named form, the named agency, the fee schedule, the state-by-state number — and mexico-invest.com has **prose about** those things. Compare:

| The SERP rewards | The corpus currently has |
|---|---|
| "RETUR-Q registration via the SEDETUR platform, renewed annually, plus a Licencia de Funcionamiento through SATQ" | "municipal STR permits" |
| "ISAI ranges 2–5% depending on state" | "ISAI tax at closing" |
| "700,000 UDIs ≈ 4.5M pesos, no prior sale in 3 years, proof of residence" | "exemptions may apply" |
| "$500–1,000 bank setup + $1,200–1,700 SRE permit" | "$2,500–4,000 setup" (unitemised) |

So the 50 topics below are weighted heavily toward **named-procedure and named-number pages** — the kind that win featured snippets, get cited by AI Overviews, and attract someone who is 30 days from wiring money. Geographic expansion is present but deliberately the smaller half.

**Second structural observation:** the passport lists *CDMX corridor* as a target market and there are **zero** CDMX pages. Monterrey, Guadalajara and Querétaro — the nearshoring corridor — have one industrial guide between them and no residential coverage. That is the one genuine topical hole.

### Competitive set

Ranking above mexico-invest.com on the money queries: `mexperience.com`, `thelatinvestor.com`, `homia.mx`, `mexhome.com`, `liveandinvestoverseas.com`, plus broker blogs (`rivieramayacozy.com`, `caribeluxuryhomes.com`, `mexicolaw.com.mx`, `caboclosingservices.com`) and specialists (`ibg.legal`, `taxesforexpats.com`, `internationaltaxreview.com`). Notably, `rivieramayarealestate.com` publishes at the **identical slug** `/guides/fideicomiso-mexico-explained`.

The brokers win on freshness and specificity but are transparently selling. The expat-media sites win on authority but are shallow on numbers. **The open position is "independent, procedurally exact, shows its sources" — which is precisely mexico-invest.com's stated positioning and precisely what the current body copy fails to deliver.**

---

## Publishing rules for every one of the 50

Non-negotiable, derived from the audit:

1. **Rendered title ≤60 chars including `" | Mexico Invest"`** → frontmatter title ≤46, or the suffix is suppressed (CODE-AUDIT §C6). Every title below is already within budget.
2. **1,800–2,600 words.** Not 4,800. The corpus average of 4,786 is the problem, not the standard.
3. **Zero shared sentences.** The new dup-sentence gate (CR-2) blocks any ≥8-word sentence repeating ≥3× corpus-wide.
4. **Every number carries a source and an `as_of`**, registered in `market-stats.json`. No unsourced `$` figures.
5. **One contextual lead bridge**, placed at the point of intent, not a CTA block bolted on.
6. **`relatedSlugs` populated** — and it now actually renders (CR-3).
7. **H2s: a mix.** Roughly half question-form, half declarative. 89% questions reads as generated.
8. **Direct answer in the first 60 words**, then `TldrBlock`. This is the one pattern the corpus already gets right — keep it.
9. **A named negative on every commercial page.** The differentiator against broker content is being willing to say "don't buy this".

---

## Cluster A — Money and decision pages (10) · highest lead intent

Bottom-of-funnel. Someone reading these has a property in mind and is costing the transaction. Lead value is highest here and competition is broker-dominated, which means it is beatable on independence.

| # | Slug | Title (chars) | Primary query |
|---|---|---|---|
| A1 | `isai-transfer-tax-by-state-mexico` | ISAI Transfer Tax by Mexican State (34) | isai tax mexico by state |
| A2 | `notario-fees-mexico-what-you-pay` | Notario Fees in Mexico: What You Pay (36) | notario fees mexico property |
| A3 | `mexico-closing-costs-calculator-2026` | Mexico Closing Costs: Worked Examples 2026 (42) | mexico closing costs calculator |
| A4 | `title-insurance-mexico-providers-compared` | Title Insurance Mexico: Providers Compared (42) | title insurance mexico worth it |
| A5 | `escrow-companies-mexico-compared` | Escrow Companies for Mexico Property (36) | escrow mexico real estate companies |
| A6 | `mexican-banks-foreign-buyers-2026` | Mexican Banks for Foreign Buyers 2026 (37) | best mexican bank for foreigners |
| A7 | `cross-border-cpa-mexico-checklist` | Choosing a Cross-Border CPA for Mexico (38) | us cpa mexico rental property |
| A8 | `mexico-property-lawyer-cost-choose` | Mexico Property Lawyer: Cost and Choice (39) | do i need a lawyer to buy in mexico |
| A9 | `negotiating-mexico-property-price-2026` | Negotiating a Mexico Property Price 2026 (40) | how to negotiate mexico property |
| A10 | `preconstruction-payment-schedules-mexico` | Pre-Construction Payment Schedules Mexico (41) | mexico preconstruction payment plan |

**A1 and A3 are the flagship assets.** No independent site publishes a clean ISAI-by-state table; the rate genuinely varies 2–5% and buyers get surprised at closing by five figures. A1 is a table page that will be cited, embedded and snippet-captured. A3 turns it into three worked examples ($150K Playa condo / $400K Cabo villa / $1.2M Punta Mita), each summing every real line: ISAI, notario, registry, fideicomiso setup, SRE permit, appraisal, legal, escrow. That is the page that converts.

**A4–A8 are "who should I hire" pages** — the highest-intent queries in the whole space and the ones brokers cannot write honestly. Each ends naturally at `/contact/`.

Links up to: `cost-of-buying-property-mexico`, `due-diligence-mexico-real-estate`, `escrow-mexico-real-estate`, `notario-publico-mexico-property-role`, `title-insurance-mexico`.

---

## Cluster B — Fideicomiso and ownership law depth (7) · defends the hub

`fideicomiso-mexico-explained` sits at position 12 with 542 impressions — the best-positioned asset on the site. Post-Wave-2 it becomes a tight ~4,500-word hub. These seven are the spokes it needs, each owning a long-tail query the hub currently tries to absorb.

| # | Slug | Title (chars) | Primary query |
|---|---|---|---|
| B1 | `sre-permit-mexico-property-guide` | SRE Permit for Mexico Property: Cost & Time (43) | sre permit mexico cost |
| B2 | `fideicomiso-beneficiary-change-cost` | Changing Fideicomiso Beneficiaries (34) | change fideicomiso beneficiary |
| B3 | `restricted-zone-map-by-state-mexico` | Mexico Restricted Zone: Map and States (38) | mexico restricted zone map |
| B4 | `direct-title-outside-restricted-zone` | Direct Title Outside Mexico's Zone (34) | buy property mexico without fideicomiso |
| B5 | `fideicomiso-inheritance-when-you-die` | Fideicomiso Inheritance: When You Die (37) | fideicomiso after death |
| B6 | `mexican-corporation-property-setup` | Mexican Corporation for Property: Setup (39) | sociedad anonima buy property mexico |
| B7 | `regimen-condominio-what-buyers-check` | Régimen de Condominio: What to Check (36) | regimen de condominio mexico |

**B1 is the single most under-served query in the cluster.** Every competitor mentions "SRE permit"; almost none publish the fee, the form, or the timeline. It is also the missing piece of the fideicomiso cost breakdown (AUDIT §D1) — the reason the hub's $2,500–4,000 looks out of step with competitors quoting $500–1,000 is that the two are measuring different things. B1 makes the site the place that explains the difference.

**B7 matters more than its search volume suggests.** The condominium regime is what actually bans or permits short-term rental in a given building, and it is the reason `Mexico Invest buyer desk treats missing HOA STR minutes as a hard stop` was worth saying once (before it got said 1,603 times). It is a genuine due-diligence differentiator.

---

## Cluster C — Tax depth, both sides of the border (9)

Highest AEO value in the plan. Tax questions are the ones people ask an LLM before they ask a human, and the answers are specific enough to be verifiably right or wrong. The corpus has good coverage of *which* taxes exist; these nine cover *how you actually comply*.

| # | Slug | Title (chars) | Primary query |
|---|---|---|---|
| C1 | `isr-700000-udi-exemption-explained` | Mexico's 700,000 UDI Capital Gains Break (40) | udi exemption mexico capital gains |
| C2 | `mexico-tax-residency-183-day-rule` | Mexico Tax Residency: The 183-Day Rule (38) | 183 days mexico tax resident |
| C3 | `efirma-mexico-foreign-property-owner` | e.firma for Foreign Property Owners (35) | efirma mexico foreigner |
| C4 | `cfdi-4-0-rental-invoicing-mexico` | CFDI 4.0 Rental Invoicing for Owners (36) | cfdi 4.0 rental income mexico |
| C5 | `us-mexico-tax-treaty-property-owners` | US–Mexico Tax Treaty for Owners (31) | us mexico tax treaty real estate |
| C6 | `canada-mexico-tax-treaty-property` | Canada–Mexico Tax Treaty for Owners (35) | canadian buying property in mexico tax |
| C7 | `depreciating-mexico-rental-us-return` | Depreciating a Mexico Rental (US Return) (40) | depreciate foreign rental property |
| C8 | `predial-property-tax-by-mexican-city` | Predial Property Tax by Mexican City (36) | predial tax mexico how much |
| C9 | `mexico-property-sale-tax-checklist` | Mexico Property Sale Tax Checklist (34) | selling property in mexico taxes |

**C1 is a correction opportunity as much as a new page.** The existing `isr-exemption-5-year-rule` risks conflating two distinct rules — the 700,000-UDI primary-residence exemption (bounded by a 3-year prior-sale test) and separate holding-period considerations. C1 disentangles them and the existing page links to it. Getting this right, publicly, while competitors blur it, is exactly the E-E-A-T play.

**C6 is the biggest untapped audience segment on the site.** One guide (`mexico-property-for-canadians`) serves what is, by the site's own homepage claim, roughly 35% of foreign buyers. Canadians have a genuinely different tax position — no FBAR, different treaty articles, T1135 reporting. Under-served by every competitor, all of whom write for Americans.

**C2 catches people before they create a problem.** "Spend 183 days and you may become a Mexican tax resident on worldwide income" is the sentence that makes a snowbird call an advisor. Natural bridge to `/contact/`.

---

## Cluster D — STR compliance and operations (8)

The corpus has `short-term-rental-rules-riviera-maya`, `quintana-roo-lodging-tax-registration-guide`, `sat-airbnb-withholding-mexico-2026`, `str-occupancy-by-month-riviera-maya`, `liability-insurance-str-mexico`. Solid coverage of the *concepts*, and it stops short of the *named procedures* competitors now rank for.

| # | Slug | Title (chars) | Primary query |
|---|---|---|---|
| D1 | `retur-q-registration-quintana-roo` | RETUR-Q Registration for Quintana Roo (37) | retur-q registration tulum |
| D2 | `licencia-funcionamiento-str-mexico` | Licencia de Funcionamiento for Rentals (38) | licencia de funcionamiento airbnb mexico |
| D3 | `ish-lodging-tax-by-state-mexico` | Lodging Tax (ISH) by Mexican State (34) | ish tax mexico rate |
| D4 | `reading-hoa-minutes-before-str-buy` | Reading HOA Minutes Before an STR Buy (37) | condo rules airbnb mexico |
| D5 | `mexico-str-management-agreements` | Mexico STR Management Agreements (32) | property management contract mexico |
| D6 | `modelling-mexico-str-revenue` | Modelling Mexico STR Revenue (28) | airbnb income calculator mexico |
| D7 | `los-cabos-str-rules-bcs-permits` | Los Cabos STR Rules: BCS Permits (32) | airbnb rules cabo san lucas |
| D8 | `puerto-vallarta-str-rules-jalisco` | Puerto Vallarta STR Rules Explained (35) | airbnb rules puerto vallarta |

**D1 + D2 together are the highest-confidence ranking bet in the entire plan.** The 2026 Quintana Roo process — RETUR-Q via the SEDETUR platform, annual renewal, plus a Licencia de Funcionamiento through SATQ — is named specifically by competitors ranking today and appears nowhere on mexico-invest.com. Add the enforcement reality (reporting suggests a very large share of Tulum listings operate unregistered) and it is a page people bookmark.

**D7 and D8 fill an obvious asymmetry:** STR rules are covered for Riviera Maya and for nowhere else, while Los Cabos and Puerto Vallarta together carry 26 project pages and 6 area pages. Different states, genuinely different rules.

**D6 is the lead magnet.** A transparent revenue model — ADR × occupancy × seasonality, minus PM 25–35%, HOA, fideicomiso, ISH, ISR — with the assumptions exposed. It is the honest version of what every developer's projection hides, it is the site's positioning in one artefact, and it ends at `/get-shortlist/` more naturally than any CTA copy could.

---

## Cluster E — New geographic markets (10)

The only real topical hole. Riviera Maya, Los Cabos and Puerto Vallarta are covered deeply. Everything inland and everything Pacific is not.

| # | Slug | Title (chars) | Primary query |
|---|---|---|---|
| E1 | `mexico-city-property-investment-guide` | Mexico City Property Investment 2026 (36) | invest in mexico city real estate |
| E2 | `polanco-vs-condesa-vs-roma-norte` | Polanco vs Condesa vs Roma Norte (32) | best neighbourhood mexico city investment |
| E3 | `monterrey-property-nearshoring-2026` | Monterrey Property and Nearshoring (34) | monterrey real estate investment |
| E4 | `guadalajara-property-investment-guide` | Guadalajara Property Investment Guide (37) | guadalajara real estate investment |
| E5 | `queretaro-property-investment-guide` | Querétaro Property Investment Guide (35) | queretaro real estate investment |
| E6 | `la-paz-baja-property-investment` | La Paz Baja Property Investment (31) | la paz mexico real estate |
| E7 | `todos-santos-property-investment` | Todos Santos Property Investment (32) | todos santos real estate |
| E8 | `huatulco-property-investment-guide` | Huatulco Property Investment Guide (34) | huatulco real estate investment |
| E9 | `zihuatanejo-ixtapa-property-guide` | Zihuatanejo and Ixtapa Property Guide (37) | zihuatanejo real estate |
| E10 | `valle-de-bravo-property-investment` | Valle de Bravo Property Investment (34) | valle de bravo real estate |

**E1–E2 close the passport's own gap.** `site-passport.yaml` lists "CDMX corridor" as a target market; there are zero CDMX pages. Roma Norte, Condesa, Polanco and the newer gentrification fronts (Santa María la Ribera, San Rafael, Cuauhtémoc) are high-volume, high-value queries, and — critically — **Mexico City is outside the restricted zone**, so foreigners take direct title. That is a genuinely different buyer journey the site can own, and it links straight into B4.

**E3–E5 are the nearshoring residential play.** The corpus has one industrial guide and no residential coverage of Monterrey, Guadalajara or Querétaro — the three markets nearshoring capital actually lands in. Different buyer (yield and rental demand, not lifestyle), different price point, essentially no independent English-language competition.

**E6–E10 are cheaper bets:** lower volume, much lower competition, and each becomes a hub for future project pages. Prioritise E6 (La Paz — named in 2026 market commentary alongside Tulum and Holbox) and E8 (Huatulco — sustained federal tourism investment).

---

## Cluster F — Data assets and trust (6)

These earn links and citations rather than direct leads. They are also what makes an LLM cite mexico-invest.com by name instead of paraphrasing a broker.

| # | Slug | Title (chars) | Primary query |
|---|---|---|---|
| F1 | `mexico-price-per-sqm-by-market-2026` | Mexico Price per m² by Market 2026 (34) | price per square meter mexico |
| F2 | `mexico-str-occupancy-adr-by-market` | Mexico STR Occupancy and ADR by Market (38) | airbnb occupancy rate mexico |
| F3 | `mexico-net-yield-benchmarks-2026` | Mexico Net Rental Yield Benchmarks 2026 (39) | rental yield mexico by city |
| F4 | `mexico-purchase-timeline-week-by-week` | Mexico Purchase Timeline, Week by Week (38) | how long to buy property in mexico |
| F5 | `mexico-closing-document-checklist` | Mexico Closing Document Checklist (33) | documents needed to buy property mexico |
| F6 | `mexico-developer-delivery-records-2026` | Mexico Developer Delivery Records 2026 (38) | mexico developer reliability |

**F1–F3 are the "cite us" assets.** Data tables, updated quarterly, with methodology and `as_of` on every cell. They also give the 100 project pages and 32 area pages a shared factual spine — right now each carries its own randomly-generated numbers, which is how the corpus got into this state.

**F6 is the boldest page in the plan and the most on-brand.** Delivery track record across the 9 developers already covered plus the majors: promised vs actual handover, disputes, completions. It is the page a broker cannot publish. It is also the page that makes "independent" mean something, and it will draw links.

---

## Publishing sequence

Batches of 5, per `topic_discovery.batch_size_default`. One wave ≈ one PR pair (content-os briefs first, then site repo).

| Wave | Topics | Rationale |
|---|---|---|
| **1** | A1, A3, B1, D1, D2 | The five highest-confidence wins. Two flagship data pages, the missing piece of the fideicomiso cost story, and the two STR-registration pages competitors already rank for. |
| **2** | C1, C2, C6, A2, A4 | Tax correctness + the Canadian audience + the two "who do I hire" pages with clearest lead intent. |
| **3** | E1, E2, B3, B4, F4 | Opens CDMX. B3/B4 pair with it — CDMX is outside the restricted zone, which is the hook. |
| **4** | D3, D6, D7, D8, F2 | Completes STR: taxes, the revenue model, and the two uncovered coastal states. |
| **5** | A5, A6, A7, A8, F5 | The rest of the "who do I hire" set plus the closing checklist. |
| **6** | C3, C4, C5, C7, C9 | Compliance mechanics, both sides of the border. |
| **7** | E3, E4, E5, F1, F3 | Nearshoring corridor + the two remaining data assets. |
| **8** | B2, B5, B6, B7, C8 | Fideicomiso long-tail + predial. |
| **9** | E6, E7, E8, E9, E10 | Secondary markets. Lowest volume, lowest competition, cheapest to write. |
| **10** | A9, A10, D4, D5, F6 | Negotiation, HOA minutes, management agreements, and the developer-records page. |

**Waves 1–4 (20 articles) are where the traffic is.** If only half the plan ships, ship these.

---

## Per-article production checklist

Follows `content-quality-10.md` and `geo-aeo-writing-gates.md`, tightened for the findings in this audit:

- [ ] SERP brief in `content-engine/serp-briefs/mexico-invest-website/{slug}.md`
- [ ] Every figure in `market-stats.json` with `owner_slug`, `source`, `as_of`
- [ ] Frontmatter title ≤46 chars · description 120–160
- [ ] Direct answer in first 60 words, then `TldrBlock`
- [ ] 1,800–2,600 words · 6–12 H2s · roughly half declarative
- [ ] 5–8 FAQ items, all unique corpus-wide
- [ ] `relatedSlugs` — 4–6 real targets, plus the reciprocal link added to the hub page **in the same PR**
- [ ] One contextual lead bridge at the point of intent
- [ ] One named negative on any commercial page
- [ ] Hero + inline images **topically relevant** — descriptive alt, no filenames, no `"… context"` suffix
- [ ] Gates: `validate:content:changed` · `geo:audit` · dup-sentence 0 · unit-coherence 0 · `fix:markdown-glue --dry` 0 · `audit:site`
- [ ] Cannibalization preflight against the existing 337 — fix the incumbent page in the same PR, never with a new slug

---

## Expected outcome

Honest framing: the site is 11 weeks old with 46 lifetime clicks and 3,202 monthly impressions. Nothing here produces a step change in 30 days.

| Horizon | If corpus Waves 1–4 land first | If new content ships onto the current corpus |
|---|---|---|
| 30 days | Title fix alone (333 pages) roughly doubles CTR on existing impressions | Same CTR gain, no ranking change |
| 90 days | De-templated corpus + 20 procedurally-specific pages; snippet capture on A1/A3/D1/D3 plausible | 20 more pages inheriting a suppressed site-level quality signal |
| 180 days | Fideicomiso and STR clusters competitive at page 1; CDMX and nearshoring uncontested | Unclear |

The ordering is the whole strategy. **Substrate, then volume.**

---

**STOP.** Proposal only. No MDX written. Awaiting «ок» from Maxim on this roadmap and on wave selection.
