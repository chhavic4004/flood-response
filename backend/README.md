# Setu TigerGraph FastAPI Backend

Production-ready MVP backend for Assam flood response routing and simulation.

## Stack
- FastAPI
- pyTigerGraph
- Pandas
- asyncio WebSockets
- dotenv secrets

## Features
- Red-yellow-green response envelope:
  - `status`: `success|error`
  - `zone`: `red|yellow|green`
  - `data`: payload
  - `ts`: timestamp
- TigerGraph-ready schema and loading job script
- Local simulation fallback when TigerGraph is unavailable
- Real-time `/ws/live` pulses every 30s
- Urgency decay engine (`wait_time ** 1.5` escalation)
- Rate-limited simulation endpoints

## Endpoints
- `GET /nodes`
- `GET /edges`
- `POST /routes/shortest`
- `POST /routes/priority`
- `POST /simulate/block`
- `POST /simulate/flood`
- `POST /simulate/air`
- `GET /deadzone`
- `GET /ripple/{node}`
- `GET /dashboard`
- `WS /ws/live`
- `POST /urgency/decay`
- `GET /predictions/cascade`
- `GET /eta/{route_id}`
- `GET /urgency` (frontend helper)
- `GET /storage/status` (connection + persisted count check)

## Quick Start (Local)
1. Copy `.env.example` to `.env`
2. Install deps:
   - `pip install -r requirements.txt`
3. Run API:
   - `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

## Use Actual Assam Datasets
Generate TigerGraph-ready CSVs from your Kamrup village dataset + Assam highway shapefile:

`python prepare_assam_data.py --village-csv "C:\Users\hp\Downloads\DCHB_Village_Amenities-ASSAM-Kamrup-321.csv" --highway-shp "C:\Users\hp\Downloads\assam_highway.shp" --sample-size 50`

This writes:
- `data/villages.csv`
- `data/road_edges.csv`
- `data/air_edges.csv`
- `data/warehouses.csv` (includes `Guwahati_Camp1`, `Dibrugarh_Camp`)
- `data/suppliers.csv`
- `data/supplies_edges.csv`

Then load into TigerGraph:
- `python load_data.py`

## Quick Start (Docker)
- `docker compose up --build`

## Deploy Helpers
- Railway deploy helper:
   - `./deploy.ps1 -Railway`
- Docker helper:
   - `./deploy.ps1 -Docker`

## TigerGraph Setup
1. Open TigerGraph GSQL shell.
2. Run commands from `schema.sql`.
3. Update `.env` with TG connection values.
4. Load sample CSV data:
   - `python load_data.py`

## Frontend Integration
- Priority Queue can pull `GET /urgency`
- Flood Map can use `POST /routes/shortest`, `POST /simulate/block`, `POST /simulate/flood`
- Dashboard cards can use `GET /dashboard`
- Live updates via `WS /ws/live`

## How To Verify It Is Working Behind The Scenes
1. Start backend and open:
   - `GET /health`
2. Check storage mode and counts:
   - `GET /storage/status`
3. Read the response:
   - `mode=local` means backend is using in-memory sample data only.
   - `mode=tigergraph` with `tigergraph_counts` means DB is connected and counts are read from TigerGraph.
4. Load data to TigerGraph:
   - `python load_data.py`
5. Recheck `GET /storage/status` and verify non-zero `tigergraph_counts`.

## Demo Note
When a route is blocked, logs emit cinematic messages like:
- `Reroute saved VillageX!`
