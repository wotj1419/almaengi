from fastapi import Depends, FastAPI

from app.repository.data_service import DataService, MockDataService
from app.router import health_router
from app.router.ask_router import create_router
from app.service.chat_service import ChatService
from app.service.rag_service import RagService
from app.service.router_service import RouterService

app = FastAPI(
    title="알맹이 AI Service",
    description="노동법 AI 챗봇 서비스",
    version="0.1.0",
)

# 앱 시작 시 1번만 초기화 (BGE-M3 모델 중복 로드 방지)
_rag_service = RagService()
_router_service = RouterService()
_chat_service = ChatService(_rag_service, _router_service)

app.include_router(health_router.router, tags=["health"])
app.include_router(create_router(_chat_service))


def get_data_service() -> DataService:
    return MockDataService()


@app.get("/mock/store/{store_id}")
async def get_store(store_id: int, ds: DataService = Depends(get_data_service)):  # type: ignore[type-abstract]  # noqa: B008
    return await ds.get_store_summary(store_id)


@app.get("/mock/store/{store_id}/employees")
async def get_employees(store_id: int, ds: DataService = Depends(get_data_service)):  # type: ignore[type-abstract]  # noqa: B008
    return await ds.get_all_employees(store_id)


@app.get("/mock/store/{store_id}/employee/{employee_id}/attendance")
async def get_attendance(
    store_id: int,
    employee_id: int,
    period: str = "4w",
    ds: DataService = Depends(get_data_service),  # type: ignore[type-abstract]  # noqa: B008
):
    return await ds.get_employee_attendance(store_id, employee_id, period)


@app.get("/mock/store/{store_id}/employee/{employee_id}/schedules")
async def get_schedules(
    store_id: int,
    employee_id: int,
    ds: DataService = Depends(get_data_service),  # type: ignore[type-abstract]  # noqa: B008
):
    return await ds.get_work_schedules(store_id, employee_id)
