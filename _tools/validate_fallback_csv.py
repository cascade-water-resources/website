"""validate_fallback_csv.py

Small dev helper:
- Imports the embedded CSV fallback in js/content_loader.js
- Extracts the CSV string
- Runs a simple CSV parse to ensure headers and row counts look reasonable

This doesn't affect the static website. It's just a safety check.

Run:
  python validate_fallback_csv.py
"""

from __future__ import annotations

import csv
import re
from pathlib import Path


def main() -> None:
    js_path = Path(__file__).resolve().parents[1] / "js" / "content_loader.js"
    text = js_path.read_text(encoding="utf-8")

    # Find the return ("...") block inside getEmbeddedCsvFallback.
    m = re.search(r"function getEmbeddedCsvFallback\(\)\s*\{[\s\S]*?return\s*\((?P<body>[\s\S]*?)\);\s*\}\)\(\);", text)
    if not m:
        raise SystemExit("Could not locate embedded CSV fallback.")

    body = m.group("body")

    # Convert the JS string concatenation into a Python string.
    # We'll pull out each quoted string, unescape \n, then join.
    parts = re.findall(r"\"((?:\\\\.|[^\"])*)\"\s*\+?", body)
    if not parts:
        raise SystemExit("No string parts found in embedded fallback.")

    csv_text = "".join(p.encode("utf-8").decode("unicode_escape") for p in parts)

    # Parse CSV
    rows = list(csv.DictReader(csv_text.splitlines()))
    print("embedded rows:", len(rows))
    print("headers:", rows[0].keys() if rows else "(none)")

    sections = sorted({r.get("site_section", "") for r in rows})
    print("sections:", sections)


if __name__ == "__main__":
    main()

