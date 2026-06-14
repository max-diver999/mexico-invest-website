#!/usr/bin/env python3
"""
Replace watermarked / broker-listing image URLs in mexico-project-images-all.json.

Blocked: easybroker, topmexico Listings/, spark resize, broker junk, stock airport.
Clean pool: developer CDNs, projects.topmexicorealestate marketing pages, existing clean manifest URLs.
"""
from __future__ import annotations

import json
import re
import ssl
import subprocess
import urllib.request
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote, unquote, urlparse, urlunparse

ssl._create_default_https_context = ssl._create_unverified_context

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
MANIFEST = SCRIPTS / "mexico-project-images-all.json"
SCRAPED = ROOT.parent / "08_Идеи/mexico-re-projects/catalog-scraped.json"
ROLES = ("hero", "inline-1", "inline-2")

BLOCKED_FRAGMENTS = (
    "assets.easybroker.com",
    "photos.topmexicorealestate.com/listings/",
    "cdn.resize.sparkplatform.com",
    "topmexicorealestate.com/1-images/brokers/",
    "mexicancaribbean.travel",
    "lloyd-team.com",
    "thomas-lloyd",
    "/check.png",
    "/checkm.png",
)

JUNK_FRAGMENTS = (
    "chicxulub",
    "mapacrater",
    "mapa",
    "dino1",
    "imagenfondo",
    "galery",
    "brokers/",
    "leadconnectorhq.com",
    "/js/webflow",
    "/css/",
    ".js",
    ".css",
    "webflow.schunk",
    "webflow.shared",
)

CLEAN_HOST_BONUS = (
    "assets.cdn.filesafe.space",
    "cdn.prod.website-files.com",
    "grantulum.mx",
    "owninmayanriviera.com",
    "proyectos-inmobiliarios.com",
    "images.squarespace-cdn.com",
    "framerusercontent.com",
    "symphony.cdn.tambourine.com",
    "simca.mx",
    "rivieramayacozy.com",
    "kabana.mx",
    "play-investments.com",
    "nalu.mx",
    "taomexico.com",
    "hotel.hardrock.com",
    "a.storyblok.com",
)

OVERRIDES: dict[str, list[str]] = {
    "zen-tulum": [
        "https://images.squarespace-cdn.com/content/v1/60c795169c2d5c30f8b7834e/de23d154-2aee-4875-8c08-f2d7a356318e/Imagen1.png?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/60c795169c2d5c30f8b7834e/451d648a-9976-4359-997f-ddaa102a7542/5.+Studio+Tulum+46.jpg?format=2500w",
        "https://images.squarespace-cdn.com/content/v1/60c795169c2d5c30f8b7834e/87a54f28-7548-495e-a96e-8f083a842622/Imagen4.png?format=2500w",
    ],
    "essentials-tulum": [
        "https://framerusercontent.com/images/wL0Z8oUuR75JN1na7j60zBUr200.png?lossless=1&width=2048",
        "https://framerusercontent.com/images/0jCs9OLhxSP1xSRjP6S3GcFadDk.png?width=4096",
        "https://framerusercontent.com/images/AsVZ9JMSJPdZnsz9bCetJ49fVI.png?width=1536",
    ],
    "olea-luxury-beach-campeche": [
        "https://www.topmexicorealestate.com/1-images/olea-luxury-beach-condos/portada.webp",
        "https://www.topmexicorealestate.com/1-images/olea-luxury-beach-condos/amenidades1.webp",
        "https://www.topmexicorealestate.com/1-images/olea-luxury-beach-condos/location1.webp",
    ],
}

LISTING_HINTS: dict[str, str] = {
    "corasol, playa": "corasol-playa",
    "stunning villa in a beachfront community, corasol": "corasol-playa",
    "huayacan, cancun": "cancun-huayacan-condos",
    "cancun downtown": "cancun-downtown-lofts",
    "corredor laguna cancun": "cancun-lagoon-lofts",
    "puerto cancun, cancun": "puerto-cancun-marina",
    "one bedroom condo in mayakoba": "mayakoba-residences-playa",
    "studio for sale in new development in playa del carmen, zona esmeralda": "riviera-maya-mayakoba-studio",
    "studio for sale in the heart of cocobeach": "playa-emerald-studio",
    "lerma campeche": "lerma-beach-condos-campeche",
    "ikuku": "ikuku-condos-campeche",
    "olea luxury beach": "olea-luxury-beach-campeche",
    "nara condos": "nara-condos-campeche",
    "torremar": "torremar-country-club-campeche",
    "bao luxury": "bao-luxury-condos-campeche",
    "vidanta": "vidanta-nuevo-vallarta",
    "playa mujeres": "costa-mujeres-cancun",
}

SLUG_GEO: dict[str, str] = {
    "zen-tulum": "tulum",
    "essentials-tulum": "tulum",
    "duna-tulum": "tulum",
    "sak-tulum": "tulum",
    "mistiq-tulum": "tulum",
    "anah-tulum": "tulum",
    "aldea-tulum": "tulum",
    "bardo-tulum": "tulum",
    "tulum-jungle-lofts": "tulum",
    "coralina-tulum": "tulum",
    "holistika-tulum": "tulum",
    "tankah-bay": "tulum",
    "tulum-country-club": "tulum",
    "costa-mujeres-cancun": "cancun",
    "puerto-cancun-marina": "cancun",
    "cancun-huayacan-condos": "cancun",
    "cancun-lagoon-lofts": "cancun",
    "cancun-downtown-lofts": "cancun",
    "corasol-playa": "playa",
    "ocean-village-playa": "playa",
    "the-city-playa": "playa",
    "it-building-playa": "playa",
    "tres-patios-playa": "playa",
    "the-fives-playa": "playa",
    "playacar-phase-ii": "playa",
    "mayakoba-residences-playa": "playa",
    "riviera-maya-mayakoba-studio": "playa",
    "playa-emerald-studio": "playa",
    "puerto-aventuras-marina": "playa",
    "pedregal-cabo": "cabo",
    "palmilla-san-jose": "cabo",
    "hacienda-encantada": "cabo",
    "puerto-los-cabos-marina": "cabo",
    "east-cape-villa-cabo": "cabo",
    "cabo-corridor-vista": "cabo",
    "vidanta-nuevo-vallarta": "vallarta",
    "nuevo-vallarta-bungalows": "vallarta",
    "garza-blanca-pv": "vallarta",
    "ikuku-condos-campeche": "campeche",
    "lerma-beach-condos-campeche": "campeche",
    "torremar-country-club-campeche": "campeche",
    "las-lupitas-campeche": "campeche",
    "bao-luxury-condos-campeche": "campeche",
    "progreso-beach-campeche": "campeche",
    "campeche-city-lofts": "campeche",
    "campeche-gulf-villas": "campeche",
    "olea-luxury-beach-campeche": "campeche",
    "nara-condos-campeche": "campeche",
    "bacalar-lagoon-homes": "bacalar",
    "bacalar-mia-suites": "bacalar",
    "cozumel-beach-condos": "cozumel",
    "holbox-lagoon-homes": "holbox",
    "sian-kaan-biosphere-homes": "sian-kaan",
    "hard-rock-riviera-maya": "riviera",
}


def is_blocked(url: str) -> bool:
    u = url.lower()
    return any(b in u for b in BLOCKED_FRAGMENTS)


def is_junk(url: str) -> bool:
    u = url.lower()
    return any(j in u for j in JUNK_FRAGMENTS)


def unwrap_leadconnector(url: str) -> str:
    m = re.search(r"u_(https?://[^\"\s]+)", url, re.I)
    return unquote(m.group(1)) if m else url


def norm_url(url: str) -> str:
    return unwrap_leadconnector(url).split("?")[0]


def score(url: str) -> int:
    if is_blocked(url) or is_junk(url):
        return -100
    u = url.lower()
    s = 10
    for i, host in enumerate(CLEAN_HOST_BONUS):
        if host in u:
            s += 90 - i
    if "topmexicorealestate.com/1-images/" in u:
        s += 40
    if "cdn.photos.sparkplatform.com" in u:
        s -= 20
    return s


def scrape_page(url: str) -> list[str]:
    try:
        html = subprocess.check_output(
            ["curl", "-sL", "-A", "Mozilla/5.0", url],
            stderr=subprocess.DEVNULL,
            timeout=25,
        ).decode("utf-8", "replace")
    except Exception:
        return []
    found = re.findall(
        r"https://(?:assets\.cdn\.filesafe\.space|cdn\.prod\.website-files\.com|"
        r"grantulum\.mx|owninmayanriviera\.com|framerusercontent\.com|"
        r"images\.squarespace-cdn\.com|simca\.mx|symphony\.cdn\.tambourine\.com|"
        r"rivieramayacozy\.com|kabana\.mx|play-investments\.com|nalu\.mx|taomexico\.com|"
        r"www\.topmexicorealestate\.com/1-images/)[^\"'\s<>]+?\.(?:jpg|jpeg|png|webp|gif)",
        html,
        flags=re.I,
    )
    out: list[str] = []
    for raw in found:
        u = raw.rstrip(");,]\\")
        u = unwrap_leadconnector(u)
        if is_blocked(u) or is_junk(u):
            continue
        if u not in out:
            out.append(u)
    return out


def encode_spaces(url: str) -> str:
    pr = urlparse(url)
    if " " not in pr.path:
        return url
    return urlunparse(
        (pr.scheme, pr.netloc, quote(pr.path, safe="/"), pr.params, pr.query, pr.fragment)
    )


def pick_three(candidates: list[str], used: set[str]) -> list[str] | None:
    ranked = sorted(candidates, key=score, reverse=True)
    uniq: list[str] = []
    for u in ranked:
        if u not in uniq:
            uniq.append(u)
    for i in range(max(0, len(uniq) - 2)):
        trio = uniq[i : i + 3]
        if len(set(trio)) == 3 and not any(u in used for u in trio):
            return [encode_spaces(u) for u in trio]
    return None


def urls_of(article: dict) -> list[str]:
    return [im["url"] for im in article["images"]]


def set_urls(article: dict, urls: list[str], source: str) -> None:
    article["source"] = source
    for role, url in zip(ROLES, urls):
        for im in article["images"]:
            if im["role"] == role:
                im["url"] = url


def load_scraped_maps() -> tuple[dict[str, list[str]], dict[str, list[str]], list[str]]:
    by_slug: dict[str, list[str]] = {}
    by_geo: dict[str, list[str]] = defaultdict(list)
    scrape_targets: list[str] = []
    if not SCRAPED.exists():
        return by_slug, by_geo, scrape_targets
    for p in json.loads(SCRAPED.read_text()).get("projects", []):
        name = (p.get("name") or "").lower()
        blob = name + " " + (p.get("sourceUrl") or "").lower()
        imgs: list[str] = []
        for u in p.get("images", []):
            inner = unwrap_leadconnector(u)
            if is_blocked(inner) or is_junk(inner):
                continue
            if inner not in imgs:
                imgs.append(inner)
        src = p.get("sourceUrl") or ""
        if src and "property-detail" not in src and "propid=" not in src.lower():
            scrape_targets.append(src.split("?")[0])
        if len(imgs) >= 3:
            for hint, slug in LISTING_HINTS.items():
                if hint in blob:
                    by_slug.setdefault(slug, imgs[:12])
        geo = p.get("geo") or "riviera-maya"
        if "cancun" in blob:
            geo = "cancun"
        elif "playa" in blob or "mayakoba" in blob:
            geo = "playa"
        elif "tulum" in blob:
            geo = "tulum"
        elif geo == "campeche":
            geo = "campeche"
        elif geo == "los-cabos" or "cabo" in blob:
            geo = "cabo"
        elif "vallarta" in blob:
            geo = "vallarta"
        by_geo[geo].extend(imgs)
    return by_slug, by_geo, sorted(set(scrape_targets))


def main() -> None:
    data = json.loads(MANIFEST.read_text())
    articles = {a["slug"]: a for a in data["articles"]}
    scraped_slug, scraped_geo, scrape_targets = load_scraped_maps()
    for a in data["articles"]:
        src = a.get("source") or ""
        if src.startswith("http") and "property-detail" not in src and "propid=" not in src.lower():
            scrape_targets.append(src.split("?")[0])
    scrape_targets = sorted(set(scrape_targets))

    print(f"Scraping {len(scrape_targets)} marketing pages for clean CDN images…")
    scraped_pages: list[str] = []
    for url in scrape_targets:
        imgs = scrape_page(url)
        if imgs:
            scraped_pages.extend(imgs)
        print(f"  {len(imgs):2d} imgs  {url}")

    pool: list[str] = []
    for lst in scraped_pages, *scraped_slug.values(), *scraped_geo.values():
        pool.extend(lst)
    for a in data["articles"]:
        for im in a["images"]:
            if not is_blocked(im["url"]) and not is_junk(im["url"]):
                pool.append(im["url"])
    for lst in OVERRIDES.values():
        pool.extend(lst)

    seen: set[str] = set()
    pool_unique: list[str] = []
    for u in sorted(pool, key=score, reverse=True):
        if u not in seen:
            seen.add(u)
            pool_unique.append(u)

    used: set[str] = set()
    changed: list[str] = []

    # Reserve URLs from slugs that are already fully clean and unique
    for slug, article in sorted(articles.items()):
        cur = urls_of(article)
        if (
            len(set(cur)) == 3
            and all(not is_blocked(u) and not is_junk(u) for u in cur)
            and not any(u in used for u in cur)
        ):
            used.update(cur)

    order = sorted(
        articles.keys(),
        key=lambda s: (
            0 if s in OVERRIDES else 1,
            0 if s in scraped_slug else 1,
            0 if any(is_blocked(u) or is_junk(u) for u in urls_of(articles[s])) else 1,
        ),
    )

    def take_from_pool(slug: str) -> list[str]:
        geo = SLUG_GEO.get(slug, "riviera-maya")
        local = list(scraped_slug.get(slug, [])) + scraped_geo.get(geo, []) + pool_unique
        trio = pick_three(local, used)
        if trio:
            return trio
        trio = pick_three(pool_unique, used)
        if trio:
            return trio
        raise SystemExit(f"Pool exhausted for {slug} (used={len(used)} pool={len(pool_unique)})")

    for slug in order:
        article = articles[slug]
        cur = urls_of(article)
        clean_cur = [
            u
            for u in cur
            if not is_blocked(u) and not is_junk(u) and u not in used
        ]
        if len(set(clean_cur)) == 3 and len(clean_cur) == 3:
            # keep but normalize order to roles
            by_role = {im["role"]: im["url"] for im in article["images"]}
            if all(not is_blocked(by_role[r]) and not is_junk(by_role[r]) for r in ROLES):
                trio = [by_role[r] for r in ROLES]
                if len(set(trio)) == 3 and not any(u in used for u in trio):
                    used.update(trio)
                    continue

        if slug in OVERRIDES:
            trio = pick_three(OVERRIDES[slug], used)
            if trio:
                set_urls(article, trio, "override-clean")
                used.update(trio)
                changed.append(slug)
                continue

        if slug in scraped_slug:
            trio = pick_three(scraped_slug[slug], used)
            if trio:
                set_urls(article, trio, "scraped-clean")
                used.update(trio)
                changed.append(slug)
                continue

        trio = take_from_pool(slug)
        set_urls(article, trio, "clean-pool")
        used.update(trio)
        changed.append(slug)

    all_urls = [u for a in data["articles"] for u in urls_of(a)]
    assert len(all_urls) == 300, len(all_urls)
    dup = len(all_urls) - len(set(all_urls))
    assert dup == 0, f"duplicate URLs: {dup}"

    blocked_left = [u for u in all_urls if is_blocked(u)]
    assert not blocked_left, f"still blocked: {blocked_left[:5]}"

    data["rule"] = "300 unique URLs — no broker watermarks (clean sources 2026-06-11)"
    data["verified"] = "2026-06-11"

    for a in data["articles"]:
        for im in a["images"]:
            im["url"] = encode_spaces(im["url"])

    MANIFEST.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n✅ 300/300 unique, 0 blocked | changed {len(set(changed))} slugs")
    print("essentials-tulum:", urls_of(articles["essentials-tulum"]))


if __name__ == "__main__":
    main()
