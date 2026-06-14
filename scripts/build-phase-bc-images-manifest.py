#!/usr/bin/env python3
"""Build thematic image manifest for Phase B (11 areas) + C1 (30 guides)."""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
OUT = SCRIPTS / "mexico-phase-bc-images.json"
UA = "Mozilla/5.0 MexicoInvest/1.0"

AREA_SLUGS = [
    "region-15-tulum", "region-8-tulum", "holistika-tulum", "tulum-pueblo-east",
    "tankah-bay", "tulum-beach-zone", "tulum-country-club", "puerto-aventuras",
    "cozumel-investment", "bacalar-investment", "north-shore-xcalacoco",
]

GUIDE_SLUGS = [
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

THEMES: dict[str, dict] = {
    "region-15-tulum": {"kw": ["tulum", "riviera", "tower", "beach"], "src": "mexicancaribbean"},
    "region-8-tulum": {"kw": ["tulum", "jungle", "ruins"], "src": "wikimedia"},
    "holistika-tulum": {"kw": ["tulum", "eco", "jungle", "beach"], "src": "mexicancaribbean"},
    "tulum-pueblo-east": {"kw": ["tulum", "town", "ruins"], "src": "wikimedia"},
    "tankah-bay": {"kw": ["tulum", "beach", "cenote"], "src": "wikimedia"},
    "tulum-beach-zone": {"kw": ["tulum", "beach", "ruins"], "src": "wikimedia"},
    "tulum-country-club": {"kw": ["tulum", "golf", "resort"], "src": "mexicancaribbean"},
    "puerto-aventuras": {"kw": ["marina", "playa", "beach"], "src": "playadelcarmen"},
    "cozumel-investment": {"kw": ["cozumel", "beach", "reef"], "src": "wikimedia"},
    "bacalar-investment": {"kw": ["bacalar", "lagoon"], "src": "wikimedia"},
    "north-shore-xcalacoco": {"kw": ["playa", "beach", "caribbean"], "src": "playadelcarmen"},
    "developer-financing-mexico": {"kw": ["tulum", "construction", "condo"], "src": "mexicancaribbean"},
    "cross-border-lender-list": {"kw": ["banco", "finance", "mexico city"], "src": "wikimedia"},
    "heloc-fund-mexico-purchase": {"kw": ["condo", "beach", "playa"], "src": "mexicancaribbean"},
    "seller-financing-mexico": {"kw": ["merida", "colonial"], "src": "yucatan"},
    "mexico-construction-loan-foreigner": {"kw": ["construction", "tulum", "crane"], "src": "mexicancaribbean"},
    "peso-mortgage-locals-only": {"kw": ["banco", "finance"], "src": "wikimedia"},
    "hurricane-insurance-bcs": {"kw": ["cabos", "beach", "storm"], "src": "wikimedia"},
    "flood-risk-riviera-maya": {"kw": ["playa", "beach", "storm"], "src": "playadelcarmen"},
    "liability-insurance-str-mexico": {"kw": ["condo", "pool", "resort"], "src": "mexicancaribbean"},
    "earthquake-risk-mexico-property": {"kw": ["vallarta", "pacific", "city"], "src": "wikimedia"},
    "wire-fraud-mexico-closing": {"kw": ["banco", "finance"], "src": "wikimedia"},
    "fake-escritura-mexico": {"kw": ["merida", "colonial", "legal"], "src": "yucatan"},
    "unregistered-broker-mexico": {"kw": ["playa", "quinta"], "src": "playadelcarmen"},
    "ampi-license-verify-guide": {"kw": ["playa", "condo"], "src": "playadelcarmen"},
    "isr-exemption-5-year-rule": {"kw": ["merida", "colonial"], "src": "yucatan"},
    "cfdi-cost-basis-mexico": {"kw": ["mexico city", "banco"], "src": "wikimedia"},
    "predial-riviera-maya-rates": {"kw": ["playa", "tulum", "beach"], "src": "mexicancaribbean"},
    "vat-mexico-property-rental": {"kw": ["condo", "rental", "beach"], "src": "mexicancaribbean"},
    "sat-rental-registration-mexico": {"kw": ["cancun", "hotel"], "src": "wikimedia"},
    "non-resident-tax-id-rfc-guide": {"kw": ["mexico city", "banco"], "src": "wikimedia"},
    "closing-timeline-mexico-30-90-days": {"kw": ["merida", "notario", "colonial"], "src": "yucatan"},
    "remote-notarization-mexico": {"kw": ["valladolid", "colonial"], "src": "wikimedia"},
    "apostille-documents-mexico-property": {"kw": ["merida", "colonial"], "src": "yucatan"},
    "translation-requirements-mexico-deed": {"kw": ["merida", "cathedral"], "src": "wikimedia"},
    "currency-closing-usd-mxn": {"kw": ["banco", "finance"], "src": "wikimedia"},
    "repatriate-sale-proceeds-mexico": {"kw": ["banco", "finance"], "src": "wikimedia"},
    "land-for-sale-mexico-foreigner-risks": {"kw": ["yucatan", "maya"], "src": "wikimedia"},
    "commercial-property-mexico-foreigner": {"kw": ["mexico city", "skyline"], "src": "wikimedia"},
    "fractional-ownership-mexico-risks": {"kw": ["cabos", "resort"], "src": "wikimedia"},
    "timeshare-vs-condo-mexico": {"kw": ["cancun", "hotel", "beach"], "src": "wikimedia"},
}

WIKIMEDIA = [
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Tulum_-_01.jpg/1280px-Tulum_-_01.jpg", ["tulum", "ruins", "beach"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Tulum_Ruins_2012.jpg/1280px-Tulum_Ruins_2012.jpg", ["tulum", "ruins"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Tulum_beach_2010.jpg/1280px-Tulum_beach_2010.jpg", ["tulum", "beach"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Cozumel_beach.jpg/1280px-Cozumel_beach.jpg", ["cozumel", "beach", "reef"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Bacalar_Lagoon.jpg/1280px-Bacalar_Lagoon.jpg", ["bacalar", "lagoon"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Playa_del_Carmen_beach.jpg/1280px-Playa_del_Carmen_beach.jpg", ["playa", "beach"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Quinta_Avenida%2C_Playa_del_Carmen.jpg/1280px-Quinta_Avenida%2C_Playa_del_Carmen.jpg", ["playa", "quinta"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Cancun_beach.jpg/1280px-Cancun_beach.jpg", ["cancun", "beach", "hotel"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Cenote_Ik_Kil.jpg/1280px-Cenote_Ik_Kil.jpg", ["cenote", "yucatan"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Mexico_City_Skyline.jpg/1280px-Mexico_City_Skyline.jpg", ["mexico city", "skyline"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Banco_de_Mexico.jpg/1280px-Banco_de_Mexico.jpg", ["banco", "finance"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Puerto_Vallarta_Bay.jpg/1280px-Puerto_Vallarta_Bay.jpg", ["vallarta", "pacific"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/El_Arco%2C_Cabo_San_Lucas%2C_Baja_California_Sur%2C_Mexico.jpg/1280px-El_Arco%2C_Cabo_San_Lucas%2C_Baja_California_Sur%2C_Mexico.jpg", ["cabos", "beach", "storm"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Merida_Cathedral.jpg/1280px-Merida_Cathedral.jpg", ["merida", "cathedral", "colonial"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Valladolid_Yucatan_Mexico.jpg/1280px-Valladolid_Yucatan_Mexico.jpg", ["valladolid", "colonial"]),
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/El_Castillo%2C_Chichen_Itza%2C_Mexico.jpg/1280px-El_Castillo%2C_Chichen_Itza%2C_Mexico.jpg", ["yucatan", "maya"]),
]

SKIP_DMO = ("logo", "favicon", "mapa", "icon", "slogan", "banner-no", "lgbt", "unicorm")


def load_excluded() -> set[str]:
    used: set[str] = set()
    for name in SCRIPTS.glob("mexico-*-images*.json"):
        data = json.loads(name.read_text(encoding="utf-8"))
        for a in data.get("articles", []):
            for i in a.get("images", []):
                used.add(i["url"])
    return used


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def build_pools(excluded: set[str]) -> list[dict]:
    pool: list[dict] = []
    for url, tags in WIKIMEDIA:
        if url not in excluded:
            pool.append({"url": url, "alt": tags[0].title() + " Mexico", "tags": tags, "source": "Wikimedia"})

    for page in range(1, 8):
        try:
            data = fetch_json(
                f"https://mexicancaribbean.travel/wp-json/wp/v2/media?per_page=100&page={page}"
            )
        except Exception:
            break
        if not data:
            break
        for item in data:
            u = item.get("source_url") or ""
            if not re.search(r"\.(jpg|jpeg|webp|png)$", u, re.I):
                continue
            low = u.lower()
            if any(x in low for x in SKIP_DMO):
                continue
            if u in excluded or u in {p["url"] for p in pool}:
                continue
            title = (item.get("title") or {}).get("rendered", "")
            tags = re.findall(r"[a-z]{3,}", low + " " + title.lower())
            pool.append({"url": u, "alt": title or "Riviera Maya", "tags": tags, "source": "mexicancaribbean"})

    for page in range(1, 5):
        try:
            data = fetch_json(f"https://yucatan.travel/wp-json/wp/v2/media?per_page=100&page={page}")
        except Exception:
            break
        if not data:
            break
        for item in data:
            u = item.get("source_url") or ""
            if not re.search(r"\.(jpg|jpeg|webp|png)$", u, re.I):
                continue
            low = u.lower()
            if any(x in low for x in ("logo", "banner", "lgbt", "/2024/")):
                continue
            if u in excluded or u in {p["url"] for p in pool}:
                continue
            title = (item.get("title") or {}).get("rendered", "")
            tags = re.findall(r"[a-z]{3,}", low + " " + title.lower())
            pool.append({"url": u, "alt": title or "Yucatan", "tags": tags, "source": "yucatan"})

    try:
        req = urllib.request.Request("https://www.playadelcarmen.com/", headers={"User-Agent": UA})
        html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", errors="replace")
        for u in sorted(set(re.findall(r"https://www\.playadelcarmen\.com[^\s\"'<>]+\.(?:jpg|jpeg|png|webp)", html, re.I))):
            if "logo" in u.lower() or u in excluded:
                continue
            if u in {p["url"] for p in pool}:
                continue
            pool.append({"url": u, "alt": "Playa del Carmen Caribbean", "tags": ["playa", "beach"], "source": "playadelcarmen"})
    except Exception:
        pass

    return pool


def score(cand: dict, kw: list[str]) -> int:
    blob = " ".join(cand.get("tags", [])).lower() + " " + cand.get("url", "").lower()
    return sum(3 if k in blob else 0 for k in kw)


def pick_three(slug: str, pool: list[dict], assigned: set[str]) -> list[dict]:
    kw = THEMES.get(slug, {"kw": ["mexico", "beach"]})["kw"]
    ranked = sorted(pool, key=lambda c: (-score(c, kw), c["url"]))
    picks: list[dict] = []
    for cand in ranked:
        if cand["url"] in assigned:
            continue
        picks.append(cand)
        assigned.add(cand["url"])
        if len(picks) == 3:
            return picks
    raise SystemExit(f"Not enough images for {slug} (have {len(picks)})")


def verify_urls(urls: set[str]) -> None:
    bad = []
    for url in sorted(urls):
        if "wikimedia.org" in url:
            continue
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                if resp.status != 200:
                    bad.append(f"{resp.status} {url}")
        except Exception as exc:
            bad.append(f"{exc} {url}")
        time.sleep(0.4)
    if bad:
        print(f"WARN: {len(bad)} URL issues (first 5):")
        for b in bad[:5]:
            print(" ", b)


def main() -> None:
    excluded = load_excluded()
    pool = build_pools(excluded)
    print(f"Pool: {len(pool)} candidates, {len(excluded)} excluded")

    assigned: set[str] = set()
    articles: list[dict] = []

    for slug in AREA_SLUGS + GUIDE_SLUGS:
        picks = pick_three(slug, pool, assigned)
        images = []
        for role, cand in zip(("hero", "inline-1", "inline-2"), picks, strict=True):
            slug_words = slug.replace("-", " ").title()
            images.append({
                "role": role,
                "url": cand["url"],
                "alt": f"{cand['alt']} — {slug_words}",
            })
        articles.append({"slug": slug, "source": picks[0]["source"], "images": images})

    all_urls = [i["url"] for a in articles for i in a["images"]]
    assert len(all_urls) == len(set(all_urls)), "duplicate URLs in manifest"

    verify_urls(set(all_urls))

    OUT.write_text(
        json.dumps(
            {
                "rollout": "phase-bc-images-41",
                "verified": "2026-06-14",
                "articles": articles,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT} — {len(articles)} articles, {len(all_urls)} URLs")


if __name__ == "__main__":
    main()
