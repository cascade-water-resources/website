import csv
from collections import Counter
from pathlib import Path


def main() -> None:
    p = Path(__file__).resolve().parents[1] / "data" / "content_metadata.csv"
    with p.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    c = Counter()
    for r in rows:
        if (r.get("highlight", "") or "").strip().upper() == "TRUE":
            c[r.get("site_section", "")] += 1

    print(dict(c))


if __name__ == "__main__":
    main()

