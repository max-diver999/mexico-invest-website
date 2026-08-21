/**
 * Topical grouping for the /guides/ hub.
 *
 * 132 guides in one flat grid is 132 links diluting each other and no signal about
 * what the site actually covers. These clusters are how a buyer's questions arrive —
 * "can I even own this", "what will it cost me", "what do I owe, and to whom" — not
 * how the files happen to be named.
 *
 * Any slug not listed here falls into `More research`, so a new guide never
 * disappears from the hub while it waits to be filed.
 */

export interface GuideCluster {
  label: string;
  note: string;
  slugs: string[];
}

export const GUIDE_CLUSTERS: GuideCluster[] = [
  {
    label: 'Start here',
    note: 'The framework most foreign buyers need before anything else.',
    slugs: [
      'mexico-property-investment-guide',
      'buy-property-mexico-foreigner',
      'fideicomiso-mexico-explained',
      'cost-of-buying-property-mexico',
      'due-diligence-mexico-real-estate',
      'mexico-rental-yield-guide',
      'is-mexico-real-estate-good-investment-2026',
      'mistakes-foreign-buyers-mexico',
      'mexico-real-estate-glossary',
    ],
  },
  {
    label: 'Fideicomiso and the restricted zone',
    note: 'What a foreigner can own on the coast, through what structure, at what cost.',
    slugs: [
      'mexico-restricted-zone-explained',
      'can-foreigners-buy-property-mexico',
      'fideicomiso-bank-fees-comparison-2026',
      'bank-trust-renewal-mexico',
      'fideicomiso-vs-mexican-corporation',
      'co-ownership-mexico-property',
      'fractional-ownership-mexico-risks',
      'timeshare-vs-condo-mexico',
    ],
  },
  {
    label: 'The buying process',
    note: 'Escrow, notario, powers of attorney, translation, and what happens in what order.',
    slugs: [
      'how-to-buy-mexico-property-step-by-step',
      'closing-timeline-mexico-30-90-days',
      'notario-publico-mexico-property-role',
      'escrow-mexico-real-estate',
      'how-to-buy-mexico-property-remotely',
      'power-of-attorney-property-mexico',
      'remote-notarization-mexico',
      'apostille-documents-mexico-property',
      'translation-requirements-mexico-deed',
      'us-wire-transfer-mexico-property',
      'title-insurance-mexico',
      'ampi-license-verify-guide',
      'developer-due-diligence-mexico',
      'first-time-foreign-buyer-mexico',
    ],
  },
  {
    label: 'Mexican tax: ISR, IVA, RFC, CFDI, predial',
    note: 'What Mexico charges you on purchase, on rental income, and on the way out.',
    slugs: [
      'mexico-property-taxes-explained',
      'mexico-capital-gains-tax-foreign-seller',
      'isr-exemption-5-year-rule',
      'vat-mexico-property-rental',
      'non-resident-tax-id-rfc-guide',
      'rfc-registration-playa-del-carmen-foreigner',
      'cfdi-cost-basis-mexico',
      'sat-rental-registration-mexico',
      'predial-riviera-maya-rates',
    ],
  },
  {
    label: 'US and Canadian tax on a Mexican property',
    note: 'The half of the bill your home country sends. FATCA, FBAR, Form 1116, Schedule E, 1031.',
    slugs: [
      'us-taxes-mexico-rental-property',
      'us-capital-gains-mexico-sale',
      'form-1116-foreign-tax-credit-mexico-rental',
      'schedule-e-mexico-rental',
      'fbar-mexico-real-estate',
      'fatca-mexico-property-owners',
      '1031-exchange-mexico-property-us-seller',
      'estate-planning-will-mexico-property-us-citizen',
      'inheritance-property-mexico-foreigner',
    ],
  },
  {
    label: 'Short-term rental: permits, tax, operations',
    note: 'Whether you can rent it nightly, what that costs to run, and who files what.',
    slugs: [
      'short-term-rental-rules-riviera-maya',
      'airbnb-investment-mexico-guide',
      'quintana-roo-lodging-tax-registration-guide',
      'sat-airbnb-withholding-mexico-2026',
      'str-occupancy-by-month-riviera-maya',
      'property-management-riviera-maya-cost',
      'property-managers-playa-del-carmen-compared',
      'rental-contract-mexico-foreign-landlord',
      'liability-insurance-str-mexico',
      'mexico-turnkey-rental-property',
    ],
  },
  {
    label: 'Yield, costs and carrying',
    note: 'What turns a developer’s gross quote into a number you can bank.',
    slugs: [
      'gross-vs-net-yield-mexico',
      'how-to-calculate-rental-yield-mexico',
      'hoa-fees-mexico-condo',
      'mexico-property-insurance-foreigners',
    ],
  },
  {
    label: 'Financing and currency',
    note: 'How non-residents actually fund a purchase, and what the peso does to the maths.',
    slugs: [
      'non-resident-mortgage-mexico',
      'cross-border-lender-list',
      'developer-financing-mexico',
      'seller-financing-mexico',
      'heloc-fund-mexico-purchase',
      'mexico-construction-loan-foreigner',
      'cash-buyer-mexico-advantages',
      'peso-mortgage-locals-only',
      'currency-risk-mexico-property-usd',
      'currency-closing-usd-mxn',
      'banxico-rates-mexico-property-impact',
      'mexican-bank-account-foreign-property-owner',
    ],
  },
  {
    label: 'Risk: title, hazard, fraud',
    note: 'The failure modes. Ejido title, seismic and hurricane exposure, and the scams that recur.',
    slugs: [
      'ejido-land-risks-mexico',
      'fake-escritura-mexico',
      'land-for-sale-mexico-foreigner-risks',
      'mexico-real-estate-scams-avoid',
      'unregistered-broker-mexico',
      'wire-fraud-mexico-closing',
      'earthquake-risk-mexico-property',
      'hurricane-flood-insurance-quintana-roo',
      'hurricane-insurance-bcs',
      'flood-risk-riviera-maya',
      'pre-construction-mexico-risks',
    ],
  },
  {
    label: 'Selling and getting paid',
    note: 'The exit: ISR at the notario, cost basis, and moving the proceeds home.',
    slugs: [
      'how-to-sell-mexico-property-from-abroad',
      'repatriate-sale-proceeds-mexico',
    ],
  },
  {
    label: 'Markets and property types',
    note: 'Where to buy, and what kind of asset to buy there.',
    slugs: [
      'best-areas-invest-mexico-2026',
      'riviera-maya-property-investment-guide',
      'los-cabos-property-investment-guide',
      'puerto-vallarta-property-investment-guide',
      'invest-in-tulum',
      'invest-in-playa-del-carmen',
      'invest-in-cancun',
      'invest-in-riviera-maya',
      'invest-in-puerto-vallarta',
      'mazatlan-property-investment-guide',
      'puerto-escondido-oaxaca-property-investment',
      'isla-mujeres-real-estate-investment',
      'holbox-property-investment',
      'lake-chapala-real-estate-americans',
      'nearshoring-mexico-industrial-real-estate',
      'mexico-real-estate-market-forecast-2026',
      'mexico-property-market-buyer-friendly-2026',
      'world-cup-2026-mexico-property-impact',
      'mexico-beachfront-property-investment',
      'mexico-condo-investment-foreigners',
      'mexico-villa-investment',
      'mexico-off-plan-investment',
      'off-plan-vs-ready-mexico',
      'branded-residences-mexico-guide',
      'mexico-branded-residences-investment',
      'mexico-golf-course-property',
      'mexico-marina-property-investment',
      'commercial-property-mexico-foreigner',
    ],
  },
  {
    label: 'Buyer profiles and budgets',
    note: 'The same market looks different depending on who is buying and with how much.',
    slugs: [
      'tier-entry',
      'tier-mid',
      'tier-luxury',
      'budget-investor-mexico-under-200k',
      'conservative-investor-mexico-playa',
      'aggressive-investor-tulum-precon',
      'luxury-investor-cabos-branded',
      'mexico-property-for-americans',
      'mexico-property-for-canadians',
      'american-retiree-mexico-real-estate',
      'mexico-real-estate-for-retirees',
      'digital-nomad-mexico-property',
      'temporary-resident-visa-buy-property-mexico',
      'portfolio-diversification-mexico-re',
    ],
  },
];

/** Slugs that carry the hub's own topic and are promoted on the homepage. */
export const PILLAR_SLUGS = new Set(GUIDE_CLUSTERS[0].slugs);
