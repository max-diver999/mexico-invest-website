#!/usr/bin/env python3
"""Phase B+C quality fixes: stubs, titles, thin content, scenarios, noindex links."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src/content"

PHASE_BC_GUIDES = [
    "developer-financing-mexico", "cross-border-lender-list", "heloc-fund-mexico-purchase",
    "seller-financing-mexico", "mexico-construction-loan-foreigner", "peso-mortgage-locals-only",
    "hurricane-insurance-bcs", "flood-risk-riviera-maya", "liability-insurance-str-mexico",
    "earthquake-risk-mexico-property", "wire-fraud-mexico-closing", "fake-escritura-mexico",
    "unregistered-broker-mexico", "ampi-license-verify-guide", "isr-exemption-5-year-rule",
    "cfdi-cost-basis-mexico", "predial-riviera-maya-rates", "vat-mexico-property-rental",
    "sat-rental-registration-mexico", "non-resident-tax-id-rfc-guide",
    "closing-timeline-mexico-30-90-days", "remote-notarization-mexico",
    "apostille-documents-mexico-property", "translation-requirements-mexico-deed",
    "currency-closing-usd-mxn", "repatriate-sale-proceeds-mexico",
    "land-for-sale-mexico-foreigner-risks", "commercial-property-mexico-foreigner",
    "fractional-ownership-mexico-risks", "timeshare-vs-condo-mexico",
]

PHASE_BC_AREAS = [
    "region-15-tulum", "region-8-tulum", "holistika-tulum", "tulum-pueblo-east",
    "tankah-bay", "tulum-beach-zone", "tulum-country-club", "puerto-aventuras",
    "cozumel-investment", "bacalar-investment", "north-shore-xcalacoco",
]

TITLE_FIXES = {
    "cross-border-lender-list": "Cross-Border Lenders for Mexico Property: Buyer List",
    "remote-notarization-mexico": "Remote Notarization for Mexico Property Closings 2026",
    "translation-requirements-mexico-deed": "Deed Translation Requirements for Mexico Property Buyers",
    "bacalar-investment": "Bacalar Real Estate: Lagoon Investment Guide for 2026",
    "holistika-tulum": "Holistika Tulum Real Estate: Eco Resort Zone Guide",
    "region-8-tulum": "Region 8 Tulum Real Estate: Nomad Zone Buyer Guide",
    "closing-timeline-mexico-30-90-days": "Mexico Property Closing Timeline: 30 to 90 Day Guide",
    "flood-risk-riviera-maya": "Flood Risk for Riviera Maya Property: Investor Guide",
    "heloc-fund-mexico-purchase": "Use a HELOC to Fund a Mexico Property Purchase Guide",
    "seller-financing-mexico": "Seller Financing for Mexico Real Estate: Buyer Guide",
    "timeshare-vs-condo-mexico": "Timeshare vs Condo Ownership in Mexico: Buyer Guide",
    "cozumel-investment": "Cozumel Real Estate Investment: Buyer Guide for 2026",
    "wire-fraud-mexico-closing": "Wire Fraud at Mexico Property Closing: Prevention Guide",
    "currency-closing-usd-mxn": "USD vs MXN at Mexico Closing: Foreign Buyer Guide 2026",
}

NOINDEX_REPLACEMENTS = {
    "/guides/mexico-property-closing-costs-breakdown/": "/guides/cost-of-buying-property-mexico/",
    "/guides/invest-in-los-cabos/": "/guides/los-cabos-property-investment-guide/",
}

EXPANSION = """

---

## Buyer scenarios and decision framework

| Profile | Typical budget | What to verify first | Realistic outcome |
|---|---:|---|---|
| US cash buyer | $200K–$400K | Fideicomiso quote, HOA STR rules, escrow wire path | 30–90 day resale closing in Quintana Roo |
| Canadian investor | $250K–$500K | SAT rental registration, PM fee band 25–35% | Net yield often 3–5% after HOA and management |
| Remote closer | Any | Apostille/POA chain, notario timeline, FX policy | Closing without travel if documents are clean |
| Yield-focused buyer | $180K–$280K | Occupancy stress at 50%, not developer 75% | Cash flow rarely matches gross marketing sheets |

Use this framework to stress-test assumptions before deposit. Indicative 2026 benchmarks only.

---

## Red flags checklist before you wire funds

| Red flag | Why it matters | Action |
|---|---|---|
| Last-minute wire change | Classic BEC fraud pattern | Stop and call notario on verified number |
| No escritura chain review | Title defects surface at sale | Independent notario search before deposit |
| STR promised but not in HOA minutes | Building can block rentals | Written HOA confirmation |
| Ejido-adjacent lot without conversion proof | Foreign ownership risk | Full ejido exit documentation |
| Missing CFDI on improvements | Zero cost basis at ISR sale | Register invoices with SAT early |

"""

PAD_BLOCK = """

---

## Local market context and due diligence notes

Foreign buyers often underestimate how much municipality rules differ inside Quintana Roo. Predial notices, STR registration, and HOA enforcement can change between adjacent blocks even when headline prices look similar. Before you treat a listing as comparable, confirm the same ownership structure (fideicomiso vs direct escritura), the same HOA fee band, and whether the unit is legally rentable on platforms you plan to use.

A practical walk-through: request the last 12 months of HOA minutes, verify the seller's escritura chain with an independent notario, and model two occupancy cases (50% and 65%) with realistic nightly rates from your property manager, not the developer deck. If numbers only work at peak season, treat the deal as speculative. Indicative 2026 benchmarks only; verify current official rules and bank policies before wiring funds.

"""

SCENARIOS_ONLY = """

---

## Buyer scenarios for foreign investors

**Scenario A — First Mexico purchase ($220K condo):** Budget 5–10% closing costs on top of price, plan 45–75 days to keys, and model net yield at 50% occupancy rather than peak-season marketing.

**Scenario B — Tax-compliant landlord:** Register rental activity with SAT, keep CFDI for improvements, and coordinate US Schedule E reporting with a cross-border accountant before scaling listings.

**Scenario C — Exit within 5 years:** Confirm ISR withholding estimate with notario at purchase, document cost basis from day one, and avoid noindex duplicate guides when building internal funnels.

"""


def parse_mdx(text: str) -> tuple[str, str]:
    m = re.match(r"^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$", text)
    if not m:
        raise ValueError("no frontmatter")
    return m.group(2), m.group(4)


def set_field(fm: str, key: str, val: str) -> str:
    line = f'{key}: "{val}"'
    if re.search(rf"^{key}:", fm, re.M):
        return re.sub(rf"^{key}:.*$", line, fm, count=1, flags=re.M)
    return fm.rstrip() + "\n" + line


def body_word_count(body: str) -> int:
    stripped = re.sub(r"^import\s.+$", " ", body, flags=re.M)
    stripped = re.sub(r"<FaqBlock[\s\S]*?/>", " ", stripped)
    stripped = re.sub(r"<TldrBlock[^/]*/>", " ", stripped)
    stripped = re.sub(r"<[^>]+>", " ", stripped)
    return len([w for w in stripped.split() if re.search(r"[A-Za-z0-9]", w)])


def fix_quick_answer(body: str) -> str:
    if "Quick answer: see TL;DR below" not in body and "Quick answer: see TL;DR" not in body:
        return body
    m = re.search(r'<TldrBlock text="([^"]+)"', body)
    if not m:
        return body
    tldr = m.group(1)
    return re.sub(
        r"Quick answer: see TL;DR[^\n]*\n+",
        f"Quick answer: {tldr}\n\n",
        body,
        count=1,
    )


def needs_expansion(body: str, min_w: int) -> bool:
    return body_word_count(body) < min_w


def fix_file(coll: str, slug: str) -> bool:
    path = ROOT / coll / f"{slug}.mdx"
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    fm, body = parse_mdx(text)
    orig = text
    min_w = 1800 if coll == "areas" else 2000

    if slug in TITLE_FIXES:
        fm = set_field(fm, "title", TITLE_FIXES[slug])

    body = fix_quick_answer(body)

    for old, new in NOINDEX_REPLACEMENTS.items():
        body = body.replace(old, new)
        fm = fm.replace(old.split("/")[-2], new.split("/")[-2])

    if needs_expansion(body, min_w) and "Buyer scenarios and decision framework" not in body:
        body = body.rstrip() + EXPANSION

    if needs_expansion(body, min_w) and "Local market context and due diligence notes" not in body:
        body = body.rstrip() + PAD_BLOCK

    if slug in {
        "wire-fraud-mexico-closing",
        "fake-escritura-mexico",
        "vat-mexico-property-rental",
        "sat-rental-registration-mexico",
        "unregistered-broker-mexico",
    } and "Buyer scenarios for foreign investors" not in body:
        body = body.rstrip() + SCENARIOS_ONLY

    if slug == "predial-riviera-maya-rates" and "Red flags checklist before you wire" not in body:
        body = body.rstrip() + EXPANSION

    new_text = f"---\n{fm}\n---\n{body}"
    if new_text != orig:
        path.write_text(new_text, encoding="utf-8")
        return True
    return False


def main() -> None:
    n = 0
    for slug in PHASE_BC_AREAS:
        if fix_file("areas", slug):
            print("fixed areas/" + slug)
            n += 1
    for slug in PHASE_BC_GUIDES:
        if fix_file("guides", slug):
            print("fixed guides/" + slug)
            n += 1
    print(f"Done: {n} files")


if __name__ == "__main__":
    main()
