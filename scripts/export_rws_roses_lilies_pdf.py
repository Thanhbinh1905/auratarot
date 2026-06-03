#!/usr/bin/env python3
"""Export the Wikimedia Commons Rider-Waite Roses & Lilies deck to a PDF.

This script downloads the provenance-safe Commons files from
Category:Rider-Waite tarot deck (Roses & Lilies), stores the 78 fronts plus
the cropped card back, writes a provenance manifest, and creates a local PDF.
"""

from __future__ import annotations

import hashlib
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps


REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = REPO_ROOT / "public" / "cards" / "rws-roses-lilies"
MANIFEST_PATH = REPO_ROOT / "docs" / "assets" / "rws-roses-lilies-provenance.json"
PDF_PATH = OUTPUT_DIR / "rws-roses-lilies-deck.pdf"

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
CATEGORY_TITLE = "Category:Rider-Waite tarot deck (Roses & Lilies)"
CARD_BACK_TITLE = "File:Waite–Smith Tarot Roses and Lilies cropped.jpg"
USER_AGENT = "AuraTarotPDFExporter/1.0 (local artifact generation; provenance manifest)"

CARD_ORDER_PREFIXES = [
    "File:RWS1909 - 00 Fool.jpeg",
    "File:RWS1909 - 01 Magician.jpeg",
    "File:RWS1909 - 02 High Priestess.jpeg",
    "File:RWS1909 - 03 Empress.jpeg",
    "File:RWS1909 - 04 Emperor.jpeg",
    "File:RWS1909 - 05 Hierophant.jpeg",
    "File:RWS1909 - 06 Lovers.jpeg",
    "File:RWS1909 - 07 Chariot.jpeg",
    "File:RWS1909 - 08 Strength.jpeg",
    "File:RWS1909 - 09 Hermit.jpeg",
    "File:RWS1909 - 10 Wheel of Fortune.jpeg",
    "File:RWS1909 - 11 Justice.jpeg",
    "File:RWS1909 - 12 Hanged Man.jpeg",
    "File:RWS1909 - 13 Death.jpeg",
    "File:RWS1909 - 14 Temperance.jpeg",
    "File:RWS1909 - 15 Devil.jpeg",
    "File:RWS1909 - 16 Tower.jpeg",
    "File:RWS1909 - 17 Star.jpeg",
    "File:RWS1909 - 18 Moon.jpeg",
    "File:RWS1909 - 19 Sun.jpeg",
    "File:RWS1909 - 20 Judgement.jpeg",
    "File:RWS1909 - 21 World.jpeg",
]
SUIT_ORDER = ["Wands", "Cups", "Swords", "Pentacles"]


@dataclass(frozen=True)
class CommonsFile:
    title: str
    original_url: str
    thumb_url: str | None
    sha1: str | None
    mime: str | None
    size: int | None
    width: int | None
    height: int | None
    description_url: str | None
    metadata: dict[str, str]


def request_json(params: dict[str, str]) -> dict[str, Any]:
    encoded = urllib.parse.urlencode(params)
    request = urllib.request.Request(f"{COMMONS_API}?{encoded}", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def category_members() -> list[str]:
    titles: list[str] = []
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": CATEGORY_TITLE,
        "cmnamespace": "6",
        "cmlimit": "500",
        "format": "json",
    }
    while True:
        data = request_json(params)
        titles.extend(item["title"] for item in data["query"]["categorymembers"])
        cont = data.get("continue", {}).get("cmcontinue")
        if not cont:
            return titles
        params["cmcontinue"] = cont


def file_info(titles: list[str]) -> dict[str, CommonsFile]:
    result: dict[str, CommonsFile] = {}
    for index in range(0, len(titles), 50):
        batch = titles[index : index + 50]
        data = request_json(
            {
                "action": "query",
                "titles": "|".join(batch),
                "prop": "imageinfo",
                "iiprop": "url|sha1|mime|size|extmetadata",
                "iiurlwidth": "400",
                "format": "json",
            }
        )
        pages = data["query"]["pages"].values()
        for page in pages:
            infos = page.get("imageinfo") or []
            if not infos:
                continue
            info = infos[0]
            raw_metadata = info.get("extmetadata", {})
            metadata = {
                key: str(value.get("value", ""))
                for key, value in raw_metadata.items()
                if key in {"LicenseShortName", "LicenseUrl", "UsageTerms", "Artist", "Credit", "AttributionRequired"}
            }
            result[page["title"]] = CommonsFile(
                title=page["title"],
                original_url=info["url"],
                thumb_url=info.get("thumburl"),
                sha1=info.get("sha1"),
                mime=info.get("mime"),
                size=info.get("size"),
                width=info.get("width"),
                height=info.get("height"),
                description_url=info.get("descriptionurl"),
                metadata=metadata,
            )
        time.sleep(0.5)
    return result


def minor_title(suit: str, rank: int) -> str:
    return f"File:RWS1909 - {suit} {rank:02d}.jpeg"


def ordered_card_titles(all_titles: list[str]) -> list[str]:
    expected = CARD_ORDER_PREFIXES + [minor_title(suit, rank) for suit in SUIT_ORDER for rank in range(1, 15)]
    title_set = set(all_titles)
    missing = [title for title in expected if title not in title_set]
    if missing:
        raise RuntimeError(f"Missing expected tarot fronts from Commons category: {missing}")
    if CARD_BACK_TITLE not in title_set:
        raise RuntimeError(f"Missing expected card back from Commons category: {CARD_BACK_TITLE}")
    return expected + [CARD_BACK_TITLE]


def slug_for_title(title: str) -> str:
    name = title.removeprefix("File:").rsplit(".", 1)[0]
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
    return f"{slug}.jpg"


def download(url: str, path: Path) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                data = response.read()
            break
        except urllib.error.HTTPError as error:
            if error.code not in {429, 500, 502, 503, 504} or attempt == 5:
                raise
            time.sleep(2 ** attempt)
    else:
        raise RuntimeError(f"Unable to download {url}")
    path.write_bytes(data)
    return data


def load_or_download(info: CommonsFile, path: Path) -> tuple[bytes, str]:
    if path.exists():
        existing = path.read_bytes()
        if info.sha1 is None or hashlib.sha1(existing).hexdigest() == info.sha1:
            return existing, "existing_original_sha1_match"
    # Wikimedia may rate-limit bulk original downloads. Use API-provided thumbnails
    # for the local PDF artifact while preserving original URLs/SHA-1 in manifest.
    url = info.thumb_url or info.original_url
    return download(url, path), "commons_thumb" if info.thumb_url else "commons_original"


def build_pdf(image_paths: list[Path], pdf_path: Path) -> None:
    pages: list[Image.Image] = []
    # 300 DPI poker/tarot-ish portrait page: card centered on white canvas.
    page_size = (900, 1500)
    margin = 60
    max_size = (page_size[0] - margin * 2, page_size[1] - margin * 2)
    for path in image_paths:
        with Image.open(path) as image:
            normalized = ImageOps.exif_transpose(image).convert("RGB")
            normalized.thumbnail(max_size, Image.Resampling.LANCZOS)
            page = Image.new("RGB", page_size, "white")
            x = (page_size[0] - normalized.width) // 2
            y = (page_size[1] - normalized.height) // 2
            page.paste(normalized, (x, y))
            pages.append(page)
    if not pages:
        raise RuntimeError("No pages generated for PDF")
    first, rest = pages[0], pages[1:]
    first.save(pdf_path, "PDF", resolution=300.0, save_all=True, append_images=rest)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)

    titles = category_members()
    selected_titles = ordered_card_titles(titles)
    infos = file_info(selected_titles)

    downloaded: list[dict[str, Any]] = []
    image_paths: list[Path] = []
    for position, title in enumerate(selected_titles, start=1):
        info = infos[title]
        local_path = OUTPUT_DIR / slug_for_title(title)
        data, download_kind = load_or_download(info, local_path)
        local_sha256 = hashlib.sha256(data).hexdigest()
        local_sha1 = hashlib.sha1(data).hexdigest()
        image_paths.append(local_path)
        downloaded.append(
            {
                "position": position,
                "role": "back" if title == CARD_BACK_TITLE else "front",
                "commons_title": title,
                "source_original_url": info.original_url,
                "source_download_url": info.thumb_url or info.original_url,
                "source_download_kind": download_kind,
                "source_description_url": info.description_url,
                "commons_sha1": info.sha1,
                "local_path": str(local_path.relative_to(REPO_ROOT)),
                "local_sha1": local_sha1,
                "local_sha256": local_sha256,
                "bytes": len(data),
                "mime": info.mime,
                "width": info.width,
                "height": info.height,
                "license_metadata": info.metadata,
            }
        )
        time.sleep(0.1)

    build_pdf(image_paths, PDF_PATH)
    pdf_bytes = PDF_PATH.read_bytes()
    manifest = {
        "artifact": "Rider-Waite tarot deck (Roses & Lilies) PDF export",
        "source_category": CATEGORY_TITLE,
        "source_category_url": "https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)",
        "generated_by": "scripts/export_rws_roses_lilies_pdf.py",
        "generated_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "legal_note": "Provenance metadata only; this manifest is not legal approval.",
        "counts": {
            "front_cards": sum(1 for item in downloaded if item["role"] == "front"),
            "card_backs": sum(1 for item in downloaded if item["role"] == "back"),
            "pdf_pages": len(downloaded),
        },
        "pdf": {
            "path": str(PDF_PATH.relative_to(REPO_ROOT)),
            "bytes": len(pdf_bytes),
            "sha256": hashlib.sha256(pdf_bytes).hexdigest(),
        },
        "files": downloaded,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"pdf": manifest["pdf"], "counts": manifest["counts"], "manifest": str(MANIFEST_PATH.relative_to(REPO_ROOT))}, indent=2))


if __name__ == "__main__":
    main()
