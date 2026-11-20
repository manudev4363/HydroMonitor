from fastapi import FastAPI
from app.api.routes import stations

app = FastAPI(
    title="HydroMonitor API",
    description="API de supervision hydrologique",
    version="1.0.0"
)

app.include_router(
    stations.router,
    prefix="/api/v1"
)

@app.get("/")
async def root():
    return {
        "application":"HydroMonitor",
        "status":"running",
        "version":"1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }