#!/usr/bin/env python3
"""Merge mexico-phase-bc-images.json into area + guide master manifests."""
from __future__ import annotations

import json
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
BC = SCRIPTS / "mexico-phase-bc-images.json"
AREA_MANIFEST = SCRIPTS / "mexico-area-images-all.json"
GUIDE_MANIFEST = SCRIPTS / "mexico-guide-images-all.json"

AREA_SLUGS = {
    "region-15-tulum", "region-8-tulum", "holistika-tulum", "tulum-pueblo-east",
    "tankah-bay", "tulum-beach-zone", "tulum-country-club", "puerto-aventuras",
    "cozumel-investment", "bacalar-investment", "north-shore-xcalacoco",
}


def merge(path: Path, new_articles: list[dict], slug_set: set[str]) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    existing = {a["slug"] for a in data["articles"]}
    added = 0
    for a in new_articles:
        if a["slug"] not in slug_set:
            continue
        if a["slug"] in existing:
            data["articles"] = [x for x in data["articles"] if x["slug"] != a["slug"]]
        data["articles"].append(a)
        added += 1
    data["rollout"] = data.get("rollout", "") + "+phase-bc"
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return added


def main() -> None:
    bc = json.loads(BC.read_text(encoding="utf-8"))
    articles = bc["articles"]
    na = merge(AREA_MANIFEST, articles, AREA_SLUGS)
    ng = merge(GUIDE_MANIFEST, articles, {a["slug"] for a in articles} - AREA_SLUGS)
    print(f"Merged areas: {na}, guides: {ng}")


if __name__ == "__main__":
    main()
