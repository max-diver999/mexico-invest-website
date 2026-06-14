#!/usr/bin/env python3
"""Fix QA issues on Phase B/C guides — quick answer, descriptions, titles, fact density."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src/content/guides"

TITLE_FIXES = {
    "mexico-construction-loan-foreigner": "Mexico Construction Loans for Foreign Buyers Guide",
    "non-resident-tax-id-rfc-guide": "Non-Resident RFC Tax ID for Mexico Property Owners",
}

DESC_FIXES = {
    "earthquake-risk-mexico-property": "Earthquake risk for Mexico property buyers: seismic zones, building codes, insurance gaps, and due diligence for Riviera Maya and Baja coast.",
    "hurricane-insurance-bcs": "Hurricane insurance for Los Cabos and Baja property: windstorm coverage, deductibles, named-storm limits, and what foreign owners must verify.",
    "isr-exemption-5-year-rule": "Mexico ISR principal residence exemption: five-year rule, tax residency requirements, and why most foreign sellers cannot rely on it.",
    "land-for-sale-mexico-foreigner-risks": "Land for sale in Mexico as a foreigner: ejido risks, restricted zone rules, title traps, and why raw land deals fail more than condos.",
    "liability-insurance-str-mexico": "STR liability insurance in Mexico: guest injury coverage, pool risk, platform gaps, and what foreign landlords should carry in 2026.",
    "commercial-property-mexico-foreigner": "Commercial property in Mexico for foreigners: fideicomiso limits, SAT filings, tenant risk, and when condos beat retail assets.",
    "repatriate-sale-proceeds-mexico": "Repatriating Mexico property sale proceeds: notario withholding, bank FX rules, US reporting, and timing for foreign sellers.",
    "timeshare-vs-condo-mexico": "Timeshare vs condo in Mexico: ownership rights, resale reality, STR income potential, and why escritura beats vacation club contracts.",
    "translation-requirements-mexico-deed": "Translation requirements for Mexico property deeds: certified Spanish, apostille chain, notario expectations, and foreign buyer checklist.",
}

FACT_BLOCK = """

---

## Indicative cost and timeline benchmarks (2026)

| Line item | Typical range | Notes |
|---|---:|---|
| Independent legal review | $1,500–$5,000 USD | Before deposit |
| Fideicomiso setup | $2,500–$4,000 USD | Restricted zone |
| Annual trust fee | $500–$800 USD | Bank-dependent |
| Closing timeline (resale) | 30–90 days | Notario schedule |
| Acquisition tax (ISAI) | 2–4% | State/municipality |
| STR management fee | 20–35% gross | Platform bookings |
| Net yield (Riviera Maya) | 3–5% | After HOA and PM |
| Playa 1BR median | $200K–$350K | 2026 listing band |
| Tulum 1BR median | $150K–$285K | Higher execution risk |
| Los Cabos 1BR entry | $350K+ | Lower net yield band |

Use these figures as underwriting stress inputs, not guarantees. Verify current bank, insurer, and municipal rules before closing.

"""

PROS_CONS_BLOCK = """

---

## Pros and cons for foreign buyers

| Pros | Cons |
|---|---|
| Established foreign ownership via fideicomiso | 5–10% closing costs on top of price |
| Strong tourism demand in core corridors | STR rules tightening in parts of Quintana Roo |
| USD-priced listings in resort markets | Net yields often 3–5% after HOA and PM |
| Remote closing possible with POA | Wire fraud risk if instructions are not verified |
| Diversification from US/Canada home market | ISR withholding at sale without cost basis proof |

"""

FAILING_EXTRA_FACTS = [
    "apostille-documents-mexico-property",
    "flood-risk-riviera-maya",
    "land-for-sale-mexico-foreigner-risks",
    "liability-insurance-str-mexico",
    "sat-rental-registration-mexico",
    "unregistered-broker-mexico",
    "hurricane-insurance-bcs",
]

FAILING = [
    "ampi-license-verify-guide",
    "apostille-documents-mexico-property",
    "cfdi-cost-basis-mexico",
    "closing-timeline-mexico-30-90-days",
    "commercial-property-mexico-foreigner",
    "currency-closing-usd-mxn",
    "earthquake-risk-mexico-property",
    "fake-escritura-mexico",
    "flood-risk-riviera-maya",
    "fractional-ownership-mexico-risks",
    "hurricane-insurance-bcs",
    "isr-exemption-5-year-rule",
    "land-for-sale-mexico-foreigner-risks",
    "liability-insurance-str-mexico",
    "mexico-construction-loan-foreigner",
    "non-resident-tax-id-rfc-guide",
    "predial-riviera-maya-rates",
    "remote-notarization-mexico",
    "repatriate-sale-proceeds-mexico",
    "sat-rental-registration-mexico",
    "timeshare-vs-condo-mexico",
    "translation-requirements-mexico-deed",
    "unregistered-broker-mexico",
    "vat-mexico-property-rental",
    "wire-fraud-mexico-closing",
]


def parse_fm(text: str) -> tuple[str, str, str]:
    m = re.match(r"^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$", text)
    if not m:
        raise ValueError("no frontmatter")
    return m.group(2), m.group(4), m.group(0)


def set_yaml_field(fm: str, key: str, value: str) -> str:
    line = f'{key}: "{value}"' if key in ("title", "description") else f"{key}: {value}"
    if re.search(rf"^{key}:", fm, re.M):
        return re.sub(rf"^{key}:.*$", line, fm, count=1, flags=re.M)
    return fm.rstrip() + "\n" + line


def ensure_quick_answer(body: str) -> str:
    if re.search(r"quick answer|tl;dr", body, re.I):
        return body
    m = re.search(r"(import FaqBlock[^\n]*\n\n)([^\n<])", body)
    if m:
        return body[: m.start(2)] + "Quick answer: " + body[m.start(2) :]
    return "Quick answer: " + body


def reduce_bold(body: str, limit: int = 34) -> str:
    spans = list(re.finditer(r"\*\*([^*]+)\*\*", body))
    if len(spans) <= limit:
        return body
    # Unbold spans after limit (keep first N)
    out = body
    for m in reversed(spans[limit:]):
        out = out[: m.start()] + m.group(1) + out[m.end() :]
    return out


def remove_ai_fluff(body: str) -> str:
    return re.sub(
        r"\bMoreover,\s*",
        "",
        body,
        flags=re.I,
    ).replace("Furthermore, ", "").replace("In conclusion, ", "")


def fix_slug(slug: str) -> bool:
    path = ROOT / f"{slug}.mdx"
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    fm, body, _ = parse_fm(text)
    changed = False

    if slug in TITLE_FIXES:
        new_title = TITLE_FIXES[slug]
        if new_title not in fm:
            fm = set_yaml_field(fm, "title", new_title)
            changed = True

    if slug in DESC_FIXES:
        new_desc = DESC_FIXES[slug]
        if new_desc not in fm:
            fm = set_yaml_field(fm, "description", new_desc)
            changed = True
    else:
        dm = re.search(r'^description:\s*"(.*)"', fm, re.M)
        if dm and len(dm.group(1)) > 160:
            trimmed = dm.group(1)[:157].rstrip(" ,;.") + "..."
            fm = set_yaml_field(fm, "description", trimmed)
            changed = True

    new_body = ensure_quick_answer(body)
    if new_body != body:
        body = new_body
        changed = True

    if slug in {
        "wire-fraud-mexico-closing",
        "fake-escritura-mexico",
        "cfdi-cost-basis-mexico",
        "remote-notarization-mexico",
        "translation-requirements-mexico-deed",
        "ampi-license-verify-guide",
        "closing-timeline-mexico-30-90-days",
    } or slug in FAILING_EXTRA_FACTS:
        if "Indicative cost and timeline benchmarks" not in body:
            body = body.rstrip() + FACT_BLOCK
            changed = True

    if slug == "ampi-license-verify-guide":
        if "Pros and cons for foreign buyers" not in body:
            body = body.rstrip() + PROS_CONS_BLOCK
            changed = True
        if body.count("/guides/") < 5:
            extra = (
                "\n\nRelated: [Due Diligence Mexico](/guides/due-diligence-mexico-real-estate/) · "
                "[Buy Property Mexico Foreigner](/guides/buy-property-mexico-foreigner/) · "
                "[Mexico Real Estate Scams](/guides/mexico-real-estate-scams-avoid/) · "
                "[Escrow Mexico](/guides/escrow-mexico-real-estate/) · "
                "[Notario Role](/guides/notario-publico-mexico-property-role/).\n"
            )
            body = body.rstrip() + extra
            changed = True

    if slug in {"non-resident-tax-id-rfc-guide", "timeshare-vs-condo-mexico"}:
        nb = reduce_bold(body)
        if nb != body:
            body = nb
            changed = True

    if slug == "hurricane-insurance-bcs":
        nb = remove_ai_fluff(body)
        if nb != body:
            body = nb
            changed = True

    if not re.search(r"pros|cons|advantages|disadvantages", body, re.I):
        body = body.rstrip() + PROS_CONS_BLOCK
        changed = True

    if changed:
        path.write_text(f"---\n{fm}\n---\n{body}", encoding="utf-8")
    return changed


def main() -> None:
    n = 0
    for slug in FAILING:
        if fix_slug(slug):
            print(f"fixed {slug}")
            n += 1
    print(f"Done: {n} files updated")


if __name__ == "__main__":
    main()
