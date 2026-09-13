from fastapi import APIRouter

from app.api import config, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(config.router)
