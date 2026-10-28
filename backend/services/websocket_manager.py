import json
import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger("saqta.ws")

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WS client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WS client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: dict):
        if not self.active_connections:
            return
        payload = json.dumps({"type": event_type, "data": data}, default=str)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending to WS client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

ws_manager = WebSocketManager()
