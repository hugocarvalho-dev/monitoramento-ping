from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import subprocess
import re
from datetime import datetime, timezone
from pymongo import MongoClient
import os
from collections import deque

app = FastAPI()

# Configurações
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:8001")
PING_INTERVAL = 0.3

# Conexão com MongoDB
client = MongoClient(MONGO_URI)
db = client["monitoramento"]
devices_collection = db["devices"]

# Estado dos dispositivos
device_status = {}

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def check_device(ip: str) -> dict:
    """Verifica status do dispositivo via ping"""
    try:
        result = subprocess.run(
            ["ping", "-c", "3", "-W", "2", ip],
            capture_output=True, text=True, timeout=5
        )
        is_online = result.returncode == 0
        return {"online": is_online, "latency": None}
    except:
        return {"online": False, "latency": None}

async def monitor_device(ip: str):
    """Monitora dispositivo em tempo real"""
    while True:
        try:
            device = devices_collection.find_one({"ip": ip}) or {"ip": ip}
            status = await asyncio.to_thread(check_device, ip)
            
            # Atualiza status
            device_status[ip] = {
                **status,
                "last_check": datetime.now(timezone.utc),
                "name": device.get("name", ip)
            }
            
        except Exception as e:
            device_status[ip] = {
                "online": False,
                "error": str(e),
                "last_check": datetime.now(timezone.utc)
            }
        
        await asyncio.sleep(PING_INTERVAL)

@app.get("/status")
async def get_status():
    """Retorna status de todos os dispositivos"""
    return {
        "devices": device_status,
        "timestamp": datetime.now(timezone.utc)
    }

@app.get("/devices")
async def get_devices():
    """Lista dispositivos cadastrados"""
    devices = list(devices_collection.find({}, {"_id": 0}))
    return {"devices": devices}

# Inicia monitoramento quando app inicia
@app.on_event("startup")
async def startup_event():
    devices = devices_collection.find({})
    for device in devices:
        asyncio.create_task(monitor_device(device["ip"]))