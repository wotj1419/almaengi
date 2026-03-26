from fastapi import Depends, FastAPI

from app.repository.data_service import DataService, MockDataService
from app.router import ask_router, chat_router, health_router

app = FastAPI(
    title="알맹이 AI Service",
    description="노동법 AI 챗봇 서비스",
    version="0.1.0",
)

app.include_router(health_router.router, tags=["health"])
app.include_router(chat_router.router)
app.include_router(ask_router.router)


def get_data_service() -> DataService:
    """DataService DI 팩토리. 추후 RealDataService로 교체 가능."""
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
