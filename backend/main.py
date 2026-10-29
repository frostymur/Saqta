import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.database import engine, Base, ensure_schema
from backend.seed import seed_database
from backend.services.websocket_manager import ws_manager
from backend.services.mqtt_bridge import start_mqtt_bridge, stop_mqtt_bridge
from backend.routers import (
    auth,
    stations,
    telemetry,
    alerts,
    ml_predict,
    simulation,
    weather,
    reports,
    geo,
    demo,
)

DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("saqta")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Saqta.kz database and seed data...")
    Base.metadata.create_all(bind=engine)
    ensure_schema()
    seed_database()
    start_mqtt_bridge()
    logger.info("Saqta.kz backend successfully initialized.")
    yield
    stop_mqtt_bridge()
    logger.info("Shutting down Saqta.kz backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Государственная платформа мониторинга и прогнозирования чрезвычайных ситуаций Saqta.kz (Фокус: р. Есиль, г. Петропавловск)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение API роутеров
app.include_router(auth.router)
app.include_router(stations.router)
app.include_router(telemetry.router)
app.include_router(alerts.router)
app.include_router(ml_predict.router)
app.include_router(simulation.router)
app.include_router(weather.router)
app.include_router(reports.router)
app.include_router(geo.router)
app.include_router(demo.router)


@app.get("/")
def root():
    index = DIST_DIR / "index.html"
    if index.is_file():
        return FileResponse(index)
    return {
        "service": "Saqta.kz Emergency Flood Monitoring Platform",
        "status": "online",
        "target_basin": "р. Есиль (Петропавловск, СКО, Казахстан)",
        "docs": "/docs",
        "websocket": "/ws"
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": "Saqta.kz DChS SKO"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Ждем входящих пингов или команд от клиента
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)


# Production/combined deployment: serve the Vite build from the same origin.
if (DIST_DIR / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    candidate = (DIST_DIR / full_path).resolve()
    dist_root = DIST_DIR.resolve()
    if candidate.is_file() and candidate.is_relative_to(dist_root):
        return FileResponse(candidate)
    index = DIST_DIR / "index.html"
    if index.is_file():
        return FileResponse(index)
    raise HTTPException(status_code=404, detail="Not found")
