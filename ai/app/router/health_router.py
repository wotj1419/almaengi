from typing import Any

from fastapi import APIRouter
from qdrant_client import QdrantClient
from redis.asyncio import Redis

from app.config import get_settings

router = APIRouter()


async def _check_qdrant() -> str:
    settings = get_settings()
    try:
        client = QdrantClient(url=settings.qdrant_url, timeout=3)
        client.get_collections()
        return "connected"
    except Exception:
        return "disconnected"


async def _check_redis() -> str:
    settings = get_settings()
    try:
        client = Redis.from_url(settings.redis_url, socket_connect_timeout=3)
        await client.ping()
        await client.aclose()
        return "connected"
    except Exception:
        return "disconnected"


@router.get("/health")
async def health_check() -> dict[str, Any]:
    qdrant_status = await _check_qdrant()
    redis_status = await _check_redis()

    status = "healthy" if qdrant_status == "connected" and redis_status == "connected" else "degraded"

    return {
        "status": status,
        "qdrant": qdrant_status,
        "redis": redis_status,
    }
