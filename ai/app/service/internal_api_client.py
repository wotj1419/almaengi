"""Spring Boot 내부 API 클라이언트.

로그인으로 accessToken 발급 후 4개 API를 호출한다.
토큰 만료(401) 시 자동으로 재로그인한다.
"""

import httpx

from app.common.logger import get_logger
from app.config import get_settings

logger = get_logger(__name__)
settings = get_settings()


class InternalAPIClient:
    """Spring Boot API 비동기 클라이언트."""

    def __init__(self) -> None:
        self._base_url = settings.internal_api_url
        self._email = settings.internal_api_email
        self._password = settings.internal_api_password
        self._access_token: str | None = None

    async def _login(self) -> None:
        """로그인하여 accessToken 발급."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self._base_url}/api/v1/auth/login",
                json={"email": self._email, "password": self._password},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            self._access_token = data["data"]["accessToken"]
            logger.info("internal_api_login_success")

    def _auth_headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._access_token}"}

    async def _get(self, path: str, params: dict | None = None) -> dict:
        """GET 요청. 401 시 재로그인 후 1회 재시도."""
        if self._access_token is None:
            await self._login()

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self._base_url}{path}",
                headers=self._auth_headers(),
                params=params,
                timeout=10,
            )

            if resp.status_code == 401:
                logger.info("internal_api_token_expired_retry")
                await self._login()
                resp = await client.get(
                    f"{self._base_url}{path}",
                    headers=self._auth_headers(),
                    params=params,
                    timeout=10,
                )

            resp.raise_for_status()
            return resp.json()["data"]

    async def get_attendance_dashboard(self, store_id: int) -> dict:
        """오늘 출퇴근 현황.

        GET /api/v1/attendances/dashboard/{storeId}
        """
        data = await self._get(f"/api/v1/attendances/dashboard/{store_id}")
        logger.info("internal_api_attendance_dashboard", store_id=store_id)
        return data

    async def get_attendance_report(self, store_id: int, target_month: str) -> dict:
        """월별 근태 리포트 (출근수/지각수/결근수/근무시간).

        GET /api/v1/attendances/report/{storeId}?targetMonth=YYYY-MM
        """
        data = await self._get(
            f"/api/v1/attendances/report/{store_id}",
            params={"targetMonth": target_month},
        )
        logger.info("internal_api_attendance_report", store_id=store_id, target_month=target_month)
        return data

    async def get_payroll_list(self, store_id: int, target_month: str) -> dict:
        """전 직원 급여 목록 (시급/총근무/연장/야간/급여액).

        GET /api/v1/stores/{storeId}/payrolls?targetMonth=YYYY-MM
        """
        data = await self._get(
            f"/api/v1/stores/{store_id}/payrolls",
            params={"targetMonth": target_month},
        )
        logger.info("internal_api_payroll_list", store_id=store_id, target_month=target_month)
        return data

    async def get_employee_schedules(self, store_id: int) -> dict:
        """전체 직원 주간 스케줄.

        GET /api/v1/stores/{storeId}/employees/schedules
        """
        data = await self._get(f"/api/v1/stores/{store_id}/employees/schedules")
        logger.info("internal_api_employee_schedules", store_id=store_id)
        return data
