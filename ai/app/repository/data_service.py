"""DataService 인터페이스 및 MockDataService 구현."""

import json
from pathlib import Path
from typing import Protocol

from app.schema.internal_schema import (
    AttendanceRecord,
    EmployeeInfo,
    StoreSummary,
    WorkSchedule,
)

MOCK_DIR = Path(__file__).resolve().parent.parent.parent / "mock"


class DataService(Protocol):
    """매장 데이터 접근 인터페이스. Mock/Real 교체 가능."""

    async def get_store_summary(self, store_id: int) -> StoreSummary: ...

    async def get_employee_info(self, store_id: int, employee_id: int) -> EmployeeInfo | None: ...

    async def get_all_employees(self, store_id: int) -> list[EmployeeInfo]: ...

    async def get_employee_attendance(
        self, store_id: int, employee_id: int, period: str
    ) -> list[AttendanceRecord]: ...

    async def get_work_schedules(self, store_id: int, employee_id: int) -> list[WorkSchedule]: ...


class MockDataService:
    """Mock JSON 파일 기반 DataService 구현."""

    def __init__(self) -> None:
        self._store: dict = json.loads((MOCK_DIR / "store.json").read_text(encoding="utf-8"))
        self._employees: list[dict] = json.loads(
            (MOCK_DIR / "employees.json").read_text(encoding="utf-8")
        )
        self._attendance: list[dict] = json.loads(
            (MOCK_DIR / "attendance.json").read_text(encoding="utf-8")
        )
        self._schedules: list[dict] = json.loads(
            (MOCK_DIR / "work_schedules.json").read_text(encoding="utf-8")
        )

    async def get_store_summary(self, store_id: int) -> StoreSummary:
        return StoreSummary(**self._store)

    async def get_employee_info(self, store_id: int, employee_id: int) -> EmployeeInfo | None:
        for emp in self._employees:
            if emp["store_id"] == store_id and emp["employee_id"] == employee_id:
                return EmployeeInfo(**emp)
        return None

    async def get_all_employees(self, store_id: int) -> list[EmployeeInfo]:
        return [
            EmployeeInfo(**emp) for emp in self._employees if emp["store_id"] == store_id
        ]

    async def get_employee_attendance(
        self, store_id: int, employee_id: int, period: str
    ) -> list[AttendanceRecord]:
        return [
            AttendanceRecord(**rec)
            for rec in self._attendance
            if rec["employee_id"] == employee_id
        ]

    async def get_work_schedules(self, store_id: int, employee_id: int) -> list[WorkSchedule]:
        return [
            WorkSchedule(**sch)
            for sch in self._schedules
            if sch["employee_id"] == employee_id
        ]
