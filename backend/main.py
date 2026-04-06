from __future__ import annotations

import asyncio
import logging
import math
import os
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    import pyTigerGraph as tg  # type: ignore
except Exception:  # pragma: no cover
    tg = None


load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("setu-backend")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def zone_from_ratio(ratio: float) -> str:
    if ratio >= 0.7:
        return "red"
    if ratio >= 0.35:
        return "yellow"
    return "green"


def response_envelope(data: Any, zone: str = "green", status: str = "success") -> dict[str, Any]:
    return {
        "status": status,
        "zone": zone,
        "data": data,
        "ts": now_iso(),
    }


class RouteRequest(BaseModel):
    start: str
    end: str


class PriorityRouteRequest(BaseModel):
    start: str
    end: str
    priority: str = Field(pattern="^(medicine|food|blanket)$")


class BlockEdgeRequest(BaseModel):
    edge_id: str


class FloodRequest(BaseModel):
    region: str


class AirRouteRequest(BaseModel):
    start: str
    end: str


class Warehouse(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    capacity: int
    operational: bool
    stock_medicine: int
    stock_food: int
    stock_blanket: int


class Village(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    pop: int
    urgency_level: float
    request_type: str
    wait_time: float


class Supplier(BaseModel):
    id: str
    name: str


class Edge(BaseModel):
    id: str
    edge_type: str
    source: str
    target: str
    cost: float
    dist: float
    time: float
    isblocked: bool


class ConnectionManager:
    def __init__(self) -> None:
        self.active: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active.discard(websocket)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for ws in self.active:
            try:
                await ws.send_json(payload)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(ws)


class GraphService:
    def __init__(self) -> None:
        self.sim_blocks: set[str] = set()
        self._load_sample_data()
        self.tg_conn = self._init_tigergraph()

    def _init_tigergraph(self) -> Any:
        if tg is None:
            logger.warning("pyTigerGraph not installed, running in local simulation mode")
            return None

        host = os.getenv("TG_HOST")
        token = os.getenv("TG_TOKEN")
        graph_name = os.getenv("TG_GRAPHNAME")
        username = os.getenv("TG_USERNAME")
        password = os.getenv("TG_PASSWORD")
        if not host or not graph_name:
            logger.info("TigerGraph env vars not set, running in local simulation mode")
            return None

        try:
            # Support both token-based and username/password auth for TG Cloud/on-prem setups.
            if token:
                conn = tg.TigerGraphConnection(host=host, graphname=graph_name, apiToken=token)
            elif username and password:
                conn = tg.TigerGraphConnection(
                    host=host,
                    graphname=graph_name,
                    username=username,
                    password=password,
                )
            else:
                logger.info("TigerGraph credentials missing, running in local simulation mode")
                return None
            logger.info("TigerGraph connection established")
            return conn
        except Exception as exc:
            logger.exception("TigerGraph init failed, falling back to local mode: %s", exc)
            return None

    def _load_sample_data(self) -> None:
        self.warehouses: dict[str, Warehouse] = {
            "w1": Warehouse(
                id="w1",
                name="Dhubri Central Warehouse",
                lat=26.023,
                lng=89.987,
                capacity=800,
                operational=True,
                stock_medicine=500,
                stock_food=600,
                stock_blanket=300,
            ),
            "w2": Warehouse(
                id="w2",
                name="Bilasipara Relief Hub",
                lat=26.231,
                lng=90.232,
                capacity=500,
                operational=True,
                stock_medicine=250,
                stock_food=450,
                stock_blanket=350,
            ),
        }

        self.villages: dict[str, Village] = {
            "v1": Village(id="v1", name="Gauripur", lat=26.083, lng=89.967, pop=32100, urgency_level=0.35, request_type="medicine", wait_time=1.0),
            "v2": Village(id="v2", name="Golakganj", lat=26.102, lng=89.837, pop=25340, urgency_level=0.28, request_type="food", wait_time=1.5),
            "v3": Village(id="v3", name="South Salmara", lat=25.917, lng=90.033, pop=28900, urgency_level=0.55, request_type="blanket", wait_time=2.0),
            "v4": Village(id="v4", name="Agomoni", lat=26.150, lng=89.783, pop=12450, urgency_level=0.2, request_type="food", wait_time=0.8),
            "v5": Village(id="v5", name="Sapatgram", lat=26.333, lng=90.117, pop=15600, urgency_level=0.32, request_type="medicine", wait_time=1.1),
        }

        self.suppliers: dict[str, Supplier] = {
            "s1": Supplier(id="s1", name="Assam Medline"),
            "s2": Supplier(id="s2", name="Brahmaputra Foods"),
        }

        self.edges: dict[str, Edge] = {
            "road_1": Edge(id="road_1", edge_type="ROADCONNECTS", source="w1", target="v1", cost=10, dist=12, time=20, isblocked=False),
            "road_2": Edge(id="road_2", edge_type="ROADCONNECTS", source="w1", target="v2", cost=12, dist=14, time=23, isblocked=False),
            "road_3": Edge(id="road_3", edge_type="ROADCONNECTS", source="v2", target="v4", cost=8, dist=10, time=18, isblocked=False),
            "road_4": Edge(id="road_4", edge_type="ROADCONNECTS", source="w2", target="v5", cost=9, dist=11, time=19, isblocked=False),
            "road_5": Edge(id="road_5", edge_type="ROADCONNECTS", source="v1", target="v3", cost=14, dist=15, time=28, isblocked=False),
            "road_6": Edge(id="road_6", edge_type="ROADCONNECTS", source="v3", target="v5", cost=11, dist=13, time=24, isblocked=False),
            "air_1": Edge(id="air_1", edge_type="AIRCONNECTS", source="w1", target="v3", cost=20, dist=22, time=16, isblocked=False),
            "air_2": Edge(id="air_2", edge_type="AIRCONNECTS", source="w2", target="v1", cost=18, dist=20, time=15, isblocked=False),
            "sup_1": Edge(id="sup_1", edge_type="SUPPLIES", source="s1", target="w1", cost=5, dist=8, time=10, isblocked=False),
            "sup_2": Edge(id="sup_2", edge_type="SUPPLIES", source="s2", target="w2", cost=5, dist=9, time=11, isblocked=False),
        }

    def _node_name(self, node_id: str) -> str:
        if node_id in self.warehouses:
            return self.warehouses[node_id].name
        if node_id in self.villages:
            return self.villages[node_id].name
        if node_id in self.suppliers:
            return self.suppliers[node_id].name
        return node_id

    def resolve_node(self, node_ref: str) -> str | None:
        node_ref_l = node_ref.lower()
        for collection in (self.warehouses, self.villages, self.suppliers):
            for node_id, node in collection.items():
                if node_id.lower() == node_ref_l or node.name.lower() == node_ref_l:
                    return node_id
        return None

    def _edge_blocked(self, edge: Edge) -> bool:
        return edge.isblocked or edge.id in self.sim_blocks

    def get_nodes(self) -> dict[str, Any]:
        return {
            "warehouses": [w.model_dump() for w in self.warehouses.values()],
            "villages": [v.model_dump() for v in self.villages.values()],
            "suppliers": [s.model_dump() for s in self.suppliers.values()],
        }

    def get_edges(self) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        for edge in self.edges.values():
            e = edge.model_dump()
            e["isblocked"] = self._edge_blocked(edge)
            e["source_name"] = self._node_name(edge.source)
            e["target_name"] = self._node_name(edge.target)
            items.append(e)
        return items

    def _build_graph(self, edge_type: str, priority: str | None = None) -> dict[str, list[tuple[str, float, str]]]:
        mult = {"medicine": 1.0, "food": 2.0, "blanket": 1.5}
        priority_factor = mult.get(priority or "medicine", 1.0)
        graph: dict[str, list[tuple[str, float, str]]] = defaultdict(list)

        for edge in self.edges.values():
            if edge.edge_type != edge_type:
                continue
            if self._edge_blocked(edge):
                continue
            weight = edge.time * priority_factor
            graph[edge.source].append((edge.target, weight, edge.id))
            graph[edge.target].append((edge.source, weight, edge.id))
        return graph

    def _dijkstra(self, start: str, end: str, edge_type: str, priority: str | None = None) -> dict[str, Any]:
        graph = self._build_graph(edge_type=edge_type, priority=priority)
        dist: dict[str, float] = defaultdict(lambda: math.inf)
        prev: dict[str, tuple[str, str] | None] = {start: None}
        visited: set[str] = set()
        dist[start] = 0.0

        while True:
            current = None
            best = math.inf
            for node, d in dist.items():
                if node not in visited and d < best:
                    best = d
                    current = node
            if current is None:
                break
            if current == end:
                break

            visited.add(current)
            for nxt, w, edge_id in graph.get(current, []):
                nd = dist[current] + w
                if nd < dist[nxt]:
                    dist[nxt] = nd
                    prev[nxt] = (current, edge_id)

        if end not in prev and start != end:
            raise HTTPException(status_code=404, detail="No path found")

        # Reconstruct
        nodes = [end]
        edges: list[str] = []
        cur = end
        while cur != start:
            parent_info = prev.get(cur)
            if parent_info is None:
                break
            parent, edge_id = parent_info
            edges.append(edge_id)
            nodes.append(parent)
            cur = parent
        nodes.reverse()
        edges.reverse()

        total_time = 0.0
        total_dist = 0.0
        for edge_id in edges:
            edge = self.edges[edge_id]
            total_time += edge.time
            total_dist += edge.dist

        return {
            "start": self._node_name(start),
            "end": self._node_name(end),
            "path_node_ids": nodes,
            "path_nodes": [self._node_name(n) for n in nodes],
            "path_edges": edges,
            "total_time": round(total_time, 2),
            "total_distance": round(total_dist, 2),
            "priority": priority or "medicine",
            "edge_type": edge_type,
        }

    def shortest_route(self, start_ref: str, end_ref: str) -> dict[str, Any]:
        start = self.resolve_node(start_ref)
        end = self.resolve_node(end_ref)
        if not start or not end:
            raise HTTPException(status_code=404, detail="Start or end node not found")
        return self._dijkstra(start, end, edge_type="ROADCONNECTS")

    def priority_route(self, start_ref: str, end_ref: str, priority: str) -> dict[str, Any]:
        start = self.resolve_node(start_ref)
        end = self.resolve_node(end_ref)
        if not start or not end:
            raise HTTPException(status_code=404, detail="Start or end node not found")
        return self._dijkstra(start, end, edge_type="ROADCONNECTS", priority=priority)

    def air_route(self, start_ref: str, end_ref: str) -> dict[str, Any]:
        start = self.resolve_node(start_ref)
        end = self.resolve_node(end_ref)
        if not start or not end:
            raise HTTPException(status_code=404, detail="Start or end node not found")
        return self._dijkstra(start, end, edge_type="AIRCONNECTS", priority="medicine")

    def simulate_block(self, edge_id: str) -> dict[str, Any]:
        if edge_id not in self.edges:
            raise HTTPException(status_code=404, detail="Edge not found")
        self.sim_blocks.add(edge_id)
        edge = self.edges[edge_id]
        logger.info("Reroute saved %s! Blocked edge %s", self._node_name(edge.target), edge_id)
        return {
            "blocked_edge": edge_id,
            "source": self._node_name(edge.source),
            "target": self._node_name(edge.target),
            "rerun_required": True,
        }

    def simulate_flood(self, region: str) -> dict[str, Any]:
        region_l = region.lower()
        blocked: list[str] = []
        for edge_id, edge in self.edges.items():
            if edge.edge_type != "ROADCONNECTS":
                continue
            src = self._node_name(edge.source).lower()
            dst = self._node_name(edge.target).lower()
            if region_l in src or region_l in dst:
                self.sim_blocks.add(edge_id)
                blocked.append(edge_id)

        if not blocked:
            # Default to worst-case flood pulse: block two busiest roads.
            for edge_id in ["road_1", "road_5"]:
                if edge_id in self.edges:
                    self.sim_blocks.add(edge_id)
                    blocked.append(edge_id)

        return {
            "region": region,
            "blocked_edges": blocked,
            "count": len(blocked),
            "rerun_required": True,
        }

    def deadzone(self) -> dict[str, Any]:
        village_ids = set(self.villages.keys())
        warehouse_ids = set(self.warehouses.keys())
        graph = self._build_graph(edge_type="ROADCONNECTS", priority="medicine")

        reachable: set[str] = set()
        q: deque[str] = deque(warehouse_ids)
        while q:
            cur = q.popleft()
            if cur in reachable:
                continue
            reachable.add(cur)
            for nxt, _, _ in graph.get(cur, []):
                if nxt not in reachable:
                    q.append(nxt)

        isolated = [self.villages[v].model_dump() for v in village_ids if v not in reachable]

        # Connected components among villages
        components: list[list[str]] = []
        seen: set[str] = set()
        for v in village_ids:
            if v in seen:
                continue
            stack = [v]
            comp: list[str] = []
            while stack:
                cur = stack.pop()
                if cur in seen:
                    continue
                seen.add(cur)
                if cur in village_ids:
                    comp.append(self._node_name(cur))
                for nxt, _, _ in graph.get(cur, []):
                    if nxt in village_ids and nxt not in seen:
                        stack.append(nxt)
            if comp:
                components.append(comp)

        return {
            "isolated_villages": isolated,
            "connected_components": components,
            "unreachable_count": len(isolated),
        }

    def ripple(self, node_ref: str) -> dict[str, Any]:
        start = self.resolve_node(node_ref)
        if not start:
            raise HTTPException(status_code=404, detail="Node not found")

        graph = self._build_graph(edge_type="ROADCONNECTS", priority="medicine")
        q: deque[tuple[str, int]] = deque([(start, 0)])
        seen: set[str] = {start}
        affected: list[dict[str, Any]] = []

        while q:
            cur, depth = q.popleft()
            affected.append({"node_id": cur, "name": self._node_name(cur), "depth": depth})
            for nxt, _, _ in graph.get(cur, []):
                if nxt not in seen:
                    seen.add(nxt)
                    q.append((nxt, depth + 1))

        return {
            "source": self._node_name(start),
            "affected": affected,
            "count": len(affected),
        }

    def dashboard(self) -> dict[str, Any]:
        blocked = len([e for e in self.edges.values() if self._edge_blocked(e) and e.edge_type == "ROADCONNECTS"])
        affected = len([v for v in self.villages.values() if v.urgency_level >= 0.5])
        unreachable = self.deadzone()["unreachable_count"]

        total_routes = len([e for e in self.edges.values() if e.edge_type == "ROADCONNECTS"])
        success_routes = max(total_routes - blocked, 0)
        avg_delay = min(blocked / max(total_routes, 1), 1.0)
        efficiency = (success_routes / max(total_routes, 1)) * (1 - avg_delay)

        requests = [v.request_type for v in self.villages.values()]
        total_req = max(len(requests), 1)
        med_pct = round(100.0 * requests.count("medicine") / total_req, 2)
        food_pct = round(100.0 * requests.count("food") / total_req, 2)
        blanket_pct = round(100.0 * requests.count("blanket") / total_req, 2)

        return {
            "affected": affected,
            "blocked": blocked,
            "unreachable": unreachable,
            "efficiency": round(efficiency, 4),
            "prio_breakdown": {
                "med": med_pct,
                "food": food_pct,
                "blanket": blanket_pct,
            },
        }

    def apply_urgency_decay(self) -> dict[str, Any]:
        updates: list[dict[str, Any]] = []
        for village in self.villages.values():
            village.wait_time = round(village.wait_time + 0.5, 2)
            factor = 1 + (village.wait_time ** 1.5)
            village.urgency_level = round(min(village.urgency_level * factor, 9999), 4)
            if village.urgency_level > 2.5 and village.request_type != "medicine":
                village.request_type = "medicine"
            updates.append(
                {
                    "village_id": village.id,
                    "name": village.name,
                    "wait_time": village.wait_time,
                    "urgency_level": village.urgency_level,
                    "request_type": village.request_type,
                }
            )
        return {"updated": updates, "count": len(updates)}

    def predictions_cascade(self) -> dict[str, Any]:
        risky_edges = []
        for edge in self.edges.values():
            if edge.edge_type != "ROADCONNECTS":
                continue
            src_v = self.villages.get(edge.source)
            dst_v = self.villages.get(edge.target)
            urgency_score = 0.0
            if src_v:
                urgency_score += src_v.urgency_level
            if dst_v:
                urgency_score += dst_v.urgency_level
            risk = round((urgency_score / 2.0) + (edge.time / 30), 3)
            risky_edges.append({
                "edge_id": edge.id,
                "from": self._node_name(edge.source),
                "to": self._node_name(edge.target),
                "risk_score": risk,
            })

        risky_edges.sort(key=lambda x: x["risk_score"], reverse=True)
        return {"high_load_edges": risky_edges[:5]}

    def eta(self, route_id: str) -> dict[str, Any]:
        if route_id not in self.edges:
            raise HTTPException(status_code=404, detail="Route not found")
        edge = self.edges[route_id]
        blocked = self._edge_blocked(edge)
        eta_minutes = None if blocked else round(edge.time + (edge.dist * 0.2), 2)
        return {
            "route_id": route_id,
            "from": self._node_name(edge.source),
            "to": self._node_name(edge.target),
            "blocked": blocked,
            "eta_minutes": eta_minutes,
        }

    def urgency_list(self) -> list[dict[str, Any]]:
        out = [
            {
                "village": v.name,
                "urgency_level": v.urgency_level,
                "request_type": v.request_type,
                "wait_time": v.wait_time,
            }
            for v in self.villages.values()
        ]
        out.sort(key=lambda x: x["urgency_level"], reverse=True)
        return out

    def storage_status(self) -> dict[str, Any]:
        local_counts = {
            "warehouses": len(self.warehouses),
            "villages": len(self.villages),
            "suppliers": len(self.suppliers),
            "edges": len(self.edges),
        }

        status: dict[str, Any] = {
            "mode": "tigergraph" if self.tg_conn else "local",
            "tigergraph_connected": self.tg_conn is not None,
            "local_counts": local_counts,
        }

        if not self.tg_conn:
            return status

        tg_counts: dict[str, Any] = {}
        errors: list[str] = []

        try:
            tg_counts["warehouses"] = self.tg_conn.getVertexCount("Warehouse")
            tg_counts["villages"] = self.tg_conn.getVertexCount("Village")
            tg_counts["suppliers"] = self.tg_conn.getVertexCount("Supplier")
        except Exception as exc:
            errors.append(f"vertex_count_failed: {exc}")

        try:
            tg_counts["road_edges"] = self.tg_conn.getEdgeCount("ROADCONNECTS")
            tg_counts["air_edges"] = self.tg_conn.getEdgeCount("AIRCONNECTS")
            tg_counts["supply_edges"] = self.tg_conn.getEdgeCount("SUPPLIES")
        except Exception as exc:
            errors.append(f"edge_count_failed: {exc}")

        status["tigergraph_counts"] = tg_counts
        if errors:
            status["tigergraph_count_errors"] = errors
        return status


service = GraphService()
manager = ConnectionManager()
rate_bucket: dict[str, float] = {}
rate_lock = asyncio.Lock()


async def limit_sim_calls(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}:{request.url.path}"
    now = time.time()
    min_gap = float(os.getenv("SIM_RATE_LIMIT_SECONDS", "1.0"))

    async with rate_lock:
        last = rate_bucket.get(key, 0.0)
        if now - last < min_gap:
            raise HTTPException(status_code=429, detail="Simulation endpoint rate-limited")
        rate_bucket[key] = now


decay_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global decay_task

    async def periodic_decay() -> None:
        while True:
            await asyncio.sleep(30)
            payload = service.apply_urgency_decay()
            zone = zone_from_ratio(sum(v["urgency_level"] for v in payload["updated"]) / (len(payload["updated"]) * 5))
            await manager.broadcast(response_envelope(payload, zone=zone))

    decay_task = asyncio.create_task(periodic_decay())
    yield
    if decay_task:
        decay_task.cancel()
        try:
            await decay_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Setu TigerGraph Backend", version="1.0.0", lifespan=lifespan)

origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, Any]:
    return response_envelope({"service": "setu-backend", "ok": True}, zone="green")


@app.get("/nodes")
async def get_nodes() -> dict[str, Any]:
    nodes = service.get_nodes()
    risk = len([v for v in nodes["villages"] if v["urgency_level"] >= 1.0]) / max(len(nodes["villages"]), 1)
    return response_envelope(nodes, zone=zone_from_ratio(risk))


@app.get("/edges")
async def get_edges() -> dict[str, Any]:
    edges = service.get_edges()
    blocked_ratio = len([e for e in edges if e["isblocked"]]) / max(len(edges), 1)
    return response_envelope(edges, zone=zone_from_ratio(blocked_ratio))


@app.post("/routes/shortest")
async def post_shortest(req: RouteRequest) -> dict[str, Any]:
    path = service.shortest_route(req.start, req.end)
    zone = "green" if path["total_time"] <= 25 else "yellow" if path["total_time"] <= 45 else "red"
    return response_envelope(path, zone=zone)


@app.post("/routes/priority")
async def post_priority(req: PriorityRouteRequest) -> dict[str, Any]:
    path = service.priority_route(req.start, req.end, req.priority)
    zone = "green" if path["priority"] == "medicine" else "yellow"
    return response_envelope(path, zone=zone)


@app.post("/simulate/block", dependencies=[Depends(limit_sim_calls)])
async def post_simulate_block(req: BlockEdgeRequest) -> dict[str, Any]:
    data = service.simulate_block(req.edge_id)
    return response_envelope(data, zone="red")


@app.post("/simulate/flood", dependencies=[Depends(limit_sim_calls)])
async def post_simulate_flood(req: FloodRequest) -> dict[str, Any]:
    data = service.simulate_flood(req.region)
    return response_envelope(data, zone="red")


@app.post("/simulate/air", dependencies=[Depends(limit_sim_calls)])
async def post_simulate_air(req: AirRouteRequest) -> dict[str, Any]:
    data = service.air_route(req.start, req.end)
    return response_envelope(data, zone="yellow")


@app.get("/deadzone")
async def get_deadzone() -> dict[str, Any]:
    data = service.deadzone()
    zone = "red" if data["unreachable_count"] > 0 else "green"
    return response_envelope(data, zone=zone)


@app.get("/ripple/{node}")
async def get_ripple(node: str) -> dict[str, Any]:
    data = service.ripple(node)
    ratio = min(data["count"] / max(len(service.villages) + len(service.warehouses), 1), 1.0)
    return response_envelope(data, zone=zone_from_ratio(ratio))


@app.get("/dashboard")
async def get_dashboard() -> dict[str, Any]:
    data = service.dashboard()
    zone = "green" if data["efficiency"] >= 0.8 else "yellow" if data["efficiency"] >= 0.5 else "red"
    return response_envelope(data, zone=zone)


@app.post("/urgency/decay")
async def post_urgency_decay() -> dict[str, Any]:
    data = service.apply_urgency_decay()
    await manager.broadcast(response_envelope(data, zone="red"))
    return response_envelope(data, zone="red")


@app.get("/predictions/cascade")
async def get_predictions_cascade() -> dict[str, Any]:
    data = service.predictions_cascade()
    return response_envelope(data, zone="yellow")


@app.get("/eta/{route_id}")
async def get_eta(route_id: str) -> dict[str, Any]:
    data = service.eta(route_id)
    zone = "red" if data["blocked"] else "green"
    return response_envelope(data, zone=zone)


@app.get("/urgency")
async def get_urgency() -> dict[str, Any]:
    data = service.urgency_list()
    return response_envelope(data, zone="yellow")


@app.get("/storage/status")
async def get_storage_status() -> dict[str, Any]:
    data = service.storage_status()
    if data["mode"] == "local":
        return response_envelope(data, zone="yellow")
    if data.get("tigergraph_count_errors"):
        return response_envelope(data, zone="yellow")
    return response_envelope(data, zone="green")


@app.websocket("/ws/live")
async def ws_live(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        await websocket.send_json(response_envelope({"message": "Live stream connected"}, zone="green"))
        while True:
            await asyncio.sleep(30)
            snapshot = {
                "dashboard": service.dashboard(),
                "top_urgency": service.urgency_list()[:5],
                "pulse": "urgency_decay_tick",
            }
            await websocket.send_json(response_envelope(snapshot, zone="yellow"))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "true").lower() == "true",
    )
