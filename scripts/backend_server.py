import asyncio
import json
import logging
from datetime import datetime
from typing import Set
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Jarvis Robot Assistant Backend")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CommandRequest(BaseModel):
    command: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_command(self, command: str):
        if self.active_connections:
            message = {"command": command, "timestamp": datetime.now().isoformat()}
            logger.info(f"Sending command: {command} to {len(self.active_connections)} clients")
            
            disconnected = set()
            for connection in self.active_connections:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending to client: {e}")
                    disconnected.add(connection)
            
            for connection in disconnected:
                self.disconnect(connection)
        else:
            logger.warning(f"No clients connected to receive command: {command}")

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/send-command")
async def send_command(request: CommandRequest):
    """REST endpoint to send commands to connected WebSocket clients"""
    await manager.send_command(request.command)
    return {"status": "success", "command": request.command, "timestamp": datetime.now().isoformat()}

@app.get("/")
async def root():
    return {"message": "Jarvis Robot Assistant Backend", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "connections": len(manager.active_connections),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    logger.info("Starting Jarvis Backend Server on http://localhost:8000")
    uvicorn.run(
        "backend_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
