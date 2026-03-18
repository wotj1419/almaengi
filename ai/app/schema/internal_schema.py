"""Spring Boot 내부 API 연동용 스키마 (Mock/Real 공통)."""

from datetime import date, datetime, time

from pydantic import BaseModel


class Insurance(BaseModel):
    national_pension: bool
    health_insurance: bool
    employment_insurance: bool
    industrial_accident: bool


class EmployeeInfo(BaseModel):
    employee_id: int
    store_id: int
    user_id: int
    name: str
    phone: str | None = None
    birth_date: date | None = None
    status: str
    position: str | None = None
    hourly_wage: int
    tax_type: str = "NONE"
    worked_minutes: int = 0
    will_working_minutes: int = 0
    hire_date: date | None = None
    dependents_count: int = 0
    include_holiday_pay: bool = False
    insurance: Insurance | None = None


class AttendanceRecord(BaseModel):
    attendance_id: int
    employee_id: int
    target_date: date
    scheduled_start_time: time | None = None
    scheduled_end_time: time | None = None
    clock_in: datetime | None = None
    clock_out: datetime | None = None
    status: str = "SCHEDULED"
    overtime: bool = False
    break_minutes: int = 0


class WorkSchedule(BaseModel):
    schedule_id: int
    employee_id: int
    day_of_week: int
    start_time: time
    end_time: time
    break_minutes: int = 0


class StoreSummary(BaseModel):
    store_id: int
    owner_id: int
    store_name: str
    address: str
    phone: str | None = None
    is_over_5_employees: bool = False
    is_closed: bool = False
