from __future__ import annotations

import argparse
import math
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd

try:
    import shapefile  # pyshp
except Exception:  # pragma: no cover
    shapefile = None


DEFAULT_VILLAGE_CSV = Path(r"C:\Users\hp\Downloads\DCHB_Village_Amenities-ASSAM-Kamrup-321.csv")
DEFAULT_HIGHWAY_SHP = Path(r"C:\Users\hp\Downloads\assam_highway.shp")


def safe_num(value: object, fallback: float = 0.0) -> float:
    try:
        if value is None:
            return fallback
        text = str(value).strip().replace("'", "")
        if text in {"", "NA", "N/A", "nan"}:
            return fallback
        return float(text)
    except Exception:
        return fallback


def normalize_name(name: object) -> str:
    text = str(name or "").strip()
    return " ".join(text.split()) or "Unknown"


def request_type_for_row(row: pd.Series) -> str:
    # Use amenity hints when available, else fallback by household/population patterns.
    pop = safe_num(row.get("Total Population of Village"), 0)
    has_phc = safe_num(row.get("Primary Health Centre (Numbers)"), 0) > 0
    has_water = safe_num(row.get("Tap Water-Treated (Status A(1)/NA(2))"), 2) == 2

    if not has_phc or pop > 5000:
        return "medicine"
    if has_water:
        return "food"
    return "blanket"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def nearest_node(lat: float, lng: float, nodes: list[dict[str, float]]) -> str:
    best_id = nodes[0]["id"]
    best_d = float("inf")
    for node in nodes:
        d = haversine_km(lat, lng, node["lat"], node["lng"])
        if d < best_d:
            best_d = d
            best_id = node["id"]
    return str(best_id)


def generate_villages(df: pd.DataFrame, sample_size: int, seed: int) -> pd.DataFrame:
    np.random.seed(seed)
    sample = df.head(sample_size).copy()

    sample["Village Name"] = sample["Village Name"].map(normalize_name)

    # The source file has no lat/lng, so generate realistic local offsets around Kamrup.
    sample["lat"] = 26.2 + np.random.normal(0, 0.1, len(sample))
    sample["lng"] = 91.7 + np.random.normal(0, 0.1, len(sample))

    villages = pd.DataFrame(
        {
            "id": [f"v{i+1}" for i in range(len(sample))],
            "name": sample["Village Name"].values,
            "lat": sample["lat"].round(6).values,
            "lng": sample["lng"].round(6).values,
            "pop": sample["Total Population of Village"].map(lambda x: int(max(safe_num(x, 0), 0))).values,
            "urgencylevel": sample["Total  Households "].map(lambda x: round(min(0.95, max(0.1, safe_num(x, 0) / 1000.0)), 4)).values,
            "request_type": sample.apply(request_type_for_row, axis=1).values,
            "wait_time": sample["Nearest Town Distance from Village (in Km.)"].map(lambda x: round(max(0.5, min(3.0, safe_num(x, 1) / 20.0)), 3)).values,
        }
    )

    return villages


def generate_warehouses() -> pd.DataFrame:
    # User-provided camps integrated directly.
    return pd.DataFrame(
        [
            {
                "id": "w1",
                "name": "Guwahati_Camp1",
                "lat": 26.1445,
                "lng": 91.7362,
                "capacity": 1000,
                "operational": True,
                "stock_medicine": 700,
                "stock_food": 900,
                "stock_blanket": 500,
            },
            {
                "id": "w2",
                "name": "Dibrugarh_Camp",
                "lat": 27.4734,
                "lng": 94.9186,
                "capacity": 800,
                "operational": True,
                "stock_medicine": 500,
                "stock_food": 600,
                "stock_blanket": 400,
            },
        ]
    )


def generate_suppliers() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {"id": "s1", "name": "Assam Medline"},
            {"id": "s2", "name": "Brahmaputra Foods"},
            {"id": "s3", "name": "NorthEast Relief Logistics"},
        ]
    )


def generate_supply_edges(warehouses: pd.DataFrame, suppliers: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for i, sup in suppliers.iterrows():
        wh = warehouses.iloc[i % len(warehouses)]
        rows.append(
            {
                "from_id": sup["id"],
                "to_id": wh["id"],
                "cost": 5 + i,
                "dist": 8 + i,
                "time": 10 + i,
                "isblocked": False,
            }
        )
    return pd.DataFrame(rows)


def generate_air_edges(warehouses: pd.DataFrame, villages: pd.DataFrame, k: int = 8) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for _, wh in warehouses.iterrows():
        for _, v in villages.head(k).iterrows():
            dist = haversine_km(float(wh["lat"]), float(wh["lng"]), float(v["lat"]), float(v["lng"]))
            rows.append(
                {
                    "from_id": wh["id"],
                    "to_id": v["id"],
                    "cost": round(max(10, dist * 0.8), 3),
                    "dist": round(dist, 3),
                    "time": round(max(12, dist * 0.4), 3),
                    "isblocked": False,
                }
            )
    return pd.DataFrame(rows)


def unique_undirected_edges(rows: Iterable[dict[str, object]]) -> list[dict[str, object]]:
    seen: set[tuple[str, str]] = set()
    out: list[dict[str, object]] = []
    for row in rows:
        a = str(row["from_id"])
        b = str(row["to_id"])
        if a == b:
            continue
        key = tuple(sorted((a, b)))
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def generate_road_edges_from_shapefile(
    shp_path: Path,
    warehouses: pd.DataFrame,
    villages: pd.DataFrame,
    max_roads: int,
) -> pd.DataFrame:
    if shapefile is None or not shp_path.exists():
        return pd.DataFrame()

    nodes = [
        {"id": str(r["id"]), "lat": float(r["lat"]), "lng": float(r["lng"])}
        for _, r in pd.concat([warehouses[["id", "lat", "lng"]], villages[["id", "lat", "lng"]]], ignore_index=True).iterrows()
    ]

    reader = shapefile.Reader(str(shp_path))
    rows: list[dict[str, object]] = []

    for shape in reader.shapes()[: max_roads * 3]:
        points = shape.points
        if len(points) < 2:
            continue
        start_lng, start_lat = points[0]
        end_lng, end_lat = points[-1]

        src = nearest_node(start_lat, start_lng, nodes)
        dst = nearest_node(end_lat, end_lng, nodes)
        if src == dst:
            continue

        dist = haversine_km(start_lat, start_lng, end_lat, end_lng)
        rows.append(
            {
                "from_id": src,
                "to_id": dst,
                "cost": round(max(4, dist * 0.9), 3),
                "dist": round(max(0.5, dist), 3),
                "time": round(max(6, dist * 1.4), 3),
                "isblocked": False,
            }
        )

        if len(rows) >= max_roads:
            break

    return pd.DataFrame(unique_undirected_edges(rows))


def generate_fallback_road_edges(warehouses: pd.DataFrame, villages: pd.DataFrame, k_per_node: int = 2) -> pd.DataFrame:
    node_df = pd.concat([warehouses[["id", "lat", "lng"]], villages[["id", "lat", "lng"]]], ignore_index=True)
    rows: list[dict[str, object]] = []

    for i, src in node_df.iterrows():
        dists: list[tuple[float, str]] = []
        for j, dst in node_df.iterrows():
            if i == j:
                continue
            dist = haversine_km(float(src["lat"]), float(src["lng"]), float(dst["lat"]), float(dst["lng"]))
            dists.append((dist, str(dst["id"])))
        dists.sort(key=lambda x: x[0])

        for dist, dst_id in dists[:k_per_node]:
            rows.append(
                {
                    "from_id": str(src["id"]),
                    "to_id": dst_id,
                    "cost": round(max(4, dist * 0.9), 3),
                    "dist": round(max(0.5, dist), 3),
                    "time": round(max(6, dist * 1.4), 3),
                    "isblocked": False,
                }
            )

    return pd.DataFrame(unique_undirected_edges(rows))


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare TigerGraph-ready Assam disaster datasets")
    parser.add_argument("--village-csv", default=str(DEFAULT_VILLAGE_CSV))
    parser.add_argument("--highway-shp", default=str(DEFAULT_HIGHWAY_SHP))
    parser.add_argument("--sample-size", type=int, default=50)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--max-road-edges", type=int, default=160)
    parser.add_argument("--output-dir", default=str(Path(__file__).parent / "data"))
    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    src_df = pd.read_csv(args.village_csv)
    villages = generate_villages(src_df, sample_size=min(args.sample_size, len(src_df)), seed=args.seed)
    warehouses = generate_warehouses()
    suppliers = generate_suppliers()

    road_edges = generate_road_edges_from_shapefile(Path(args.highway_shp), warehouses, villages, args.max_road_edges)
    if road_edges.empty:
        road_edges = generate_fallback_road_edges(warehouses, villages, k_per_node=2)

    air_edges = generate_air_edges(warehouses, villages)
    supplies_edges = generate_supply_edges(warehouses, suppliers)

    warehouses.to_csv(out_dir / "warehouses.csv", index=False)
    villages.to_csv(out_dir / "villages.csv", index=False)
    suppliers.to_csv(out_dir / "suppliers.csv", index=False)
    road_edges.to_csv(out_dir / "road_edges.csv", index=False)
    air_edges.to_csv(out_dir / "air_edges.csv", index=False)
    supplies_edges.to_csv(out_dir / "supplies_edges.csv", index=False)

    print(f"Prepared Assam dataset in: {out_dir}")
    print(f"Villages: {len(villages)} | Warehouses: {len(warehouses)} | Roads: {len(road_edges)} | Air: {len(air_edges)}")


if __name__ == "__main__":
    main()
