from fastapi import APIRouter

from app.api import admin, admin_operations, auth, config, deposits, health, health_ops, internal, internal_operations, money, payments

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(health_ops.router)
api_router.include_router(config.router)
api_router.include_router(auth.router)
api_router.include_router(money.router)
api_router.include_router(deposits.router)
api_router.include_router(payments.router)
api_router.include_router(admin.router)
api_router.include_router(admin_operations.router)
api_router.include_router(internal.router)
api_router.include_router(internal_operations.router)
