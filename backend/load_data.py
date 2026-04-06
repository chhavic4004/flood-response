from __future__ import annotations

import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

try:
    import pyTigerGraph as tg  # type: ignore
except Exception:
    tg = None


load_dotenv()

DATA_DIR = Path(__file__).parent / "data"


def read_csv_or_fail(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Missing CSV file: {path}")
    return pd.read_csv(path)


def validate_columns(df: pd.DataFrame, expected: list[str], name: str) -> None:
    missing = [c for c in expected if c not in df.columns]
    if missing:
        raise ValueError(f"{name} missing columns: {missing}")


def parse_bool(value: object) -> bool:
    text = str(value).strip().lower()
    return text in {"1", "true", "yes", "y"}


def infer_vertex_type(vertex_id: str) -> str:
    prefix = vertex_id[:1].lower()
    if prefix == "w":
        return "Warehouse"
    if prefix == "v":
        return "Village"
    if prefix == "s":
        return "Supplier"
    raise ValueError(f"Cannot infer vertex type from id: {vertex_id}")


def main() -> None:
    files = {
        "warehouses": DATA_DIR / "warehouses.csv",
        "villages": DATA_DIR / "villages.csv",
        "suppliers": DATA_DIR / "suppliers.csv",
        "road_edges": DATA_DIR / "road_edges.csv",
        "air_edges": DATA_DIR / "air_edges.csv",
        "supplies_edges": DATA_DIR / "supplies_edges.csv",
    }

    warehouse_df = read_csv_or_fail(files["warehouses"])
    village_df = read_csv_or_fail(files["villages"])
    supplier_df = read_csv_or_fail(files["suppliers"])
    road_df = read_csv_or_fail(files["road_edges"])
    air_df = read_csv_or_fail(files["air_edges"])
    supplies_df = read_csv_or_fail(files["supplies_edges"])

    validate_columns(
        warehouse_df,
        ["id", "name", "lat", "lng", "capacity", "operational", "stock_medicine", "stock_food", "stock_blanket"],
        "warehouses.csv",
    )
    validate_columns(
        village_df,
        ["id", "name", "lat", "lng", "pop", "urgencylevel", "request_type", "wait_time"],
        "villages.csv",
    )
    validate_columns(supplier_df, ["id", "name"], "suppliers.csv")
    validate_columns(road_df, ["from_id", "to_id", "cost", "dist", "time", "isblocked"], "road_edges.csv")
    validate_columns(air_df, ["from_id", "to_id", "cost", "dist", "time", "isblocked"], "air_edges.csv")
    validate_columns(supplies_df, ["from_id", "to_id", "cost", "dist", "time", "isblocked"], "supplies_edges.csv")

    print("CSV validation passed")

    if tg is None:
        print("pyTigerGraph is not available. Skipping upload.")
        return

    host = os.getenv("TG_HOST")
    graph = os.getenv("TG_GRAPHNAME")
    token = os.getenv("TG_TOKEN")
    username = os.getenv("TG_USERNAME")
    password = os.getenv("TG_PASSWORD")

    if not host or not graph:
        print("TigerGraph env vars not configured. Skipping upload.")
        return

    if token:
        conn = tg.TigerGraphConnection(host=host, graphname=graph, apiToken=token)
    elif username and password:
        conn = tg.TigerGraphConnection(host=host, graphname=graph, username=username, password=password)
    else:
        print("No TigerGraph credentials found (set TG_TOKEN or TG_USERNAME/TG_PASSWORD). Skipping upload.")
        return

    # Upsert vertices
    warehouse_vertices = {
        row["id"]: {
            "name": {"value": row["name"]},
            "lat": {"value": float(row["lat"])},
            "lng": {"value": float(row["lng"])},
            "capacity": {"value": int(row["capacity"])},
            "operational": {"value": bool(row["operational"])},
            "stock_medicine": {"value": int(row["stock_medicine"])},
            "stock_food": {"value": int(row["stock_food"])},
            "stock_blanket": {"value": int(row["stock_blanket"])},
        }
        for _, row in warehouse_df.iterrows()
    }
    village_vertices = {
        row["id"]: {
            "name": {"value": row["name"]},
            "lat": {"value": float(row["lat"])},
            "lng": {"value": float(row["lng"])},
            "pop": {"value": int(row["pop"])},
            "urgencylevel": {"value": float(row["urgencylevel"])},
            "request_type": {"value": row["request_type"]},
            "wait_time": {"value": float(row["wait_time"])},
        }
        for _, row in village_df.iterrows()
    }
    supplier_vertices = {
        row["id"]: {"name": {"value": row["name"]}}
        for _, row in supplier_df.iterrows()
    }

    conn.upsertVertices("Warehouse", warehouse_vertices)
    conn.upsertVertices("Village", village_vertices)
    conn.upsertVertices("Supplier", supplier_vertices)

    def upsert_edge_rows(df: pd.DataFrame, edge_type: str) -> int:
        upserts = 0
        for _, row in df.iterrows():
            from_id = str(row["from_id"])
            to_id = str(row["to_id"])
            from_type = infer_vertex_type(from_id)
            to_type = infer_vertex_type(to_id)

            conn.upsertEdge(
                from_type,
                from_id,
                edge_type,
                to_type,
                to_id,
                attributes={
                    "cost": float(row["cost"]),
                    "dist": float(row["dist"]),
                    "time": float(row["time"]),
                    "isblocked": parse_bool(row["isblocked"]),
                },
            )
            upserts += 1
        return upserts

    road_count = upsert_edge_rows(road_df, "ROADCONNECTS")
    air_count = upsert_edge_rows(air_df, "AIRCONNECTS")
    supply_count = upsert_edge_rows(supplies_df, "SUPPLIES")

    print(
        "TigerGraph upsert complete | "
        f"Warehouses={len(warehouse_df)}, Villages={len(village_df)}, Suppliers={len(supplier_df)}, "
        f"RoadEdges={road_count}, AirEdges={air_count}, SupplyEdges={supply_count}"
    )


if __name__ == "__main__":
    main()
