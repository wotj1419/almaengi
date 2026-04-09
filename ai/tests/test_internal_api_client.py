"""InternalAPIClient 통합 테스트.

실제 Spring Boot API를 호출하여 응답을 확인한다.
실행 전 .env에 INTERNAL_API_HOST, INTERNAL_API_PORT, INTERNAL_API_EMAIL, INTERNAL_API_PASSWORD 설정 필요.

실행 방법:
    cd ai
    python -m pytest tests/test_internal_api_client.py -v
    또는 직접 실행:
    python tests/test_internal_api_client.py
"""

import asyncio
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.config import get_settings
from app.service.internal_api_client import InternalAPIClient

STORE_ID = 2
TARGET_MONTH = "2026-03"


async def test_login() -> None:
    """로그인 → accessToken 발급 확인."""
    print("\n[TEST] 로그인 테스트")
    client = InternalAPIClient()
    await client._login()
    assert client._access_token is not None, "accessToken이 None"
    print(f"  ✅ 토큰 발급 성공: {client._access_token[:30]}...")


async def test_attendance_dashboard() -> None:
    """오늘 출퇴근 현황 API."""
    print("\n[TEST] 출퇴근 현황 (dashboard)")
    client = InternalAPIClient()
    data = await client.get_attendance_dashboard(STORE_ID)
    print(f"  ✅ 응답: {str(data)[:200]}")


async def test_attendance_report() -> None:
    """월별 근태 리포트 API."""
    print("\n[TEST] 근태 리포트 (report)")
    client = InternalAPIClient()
    data = await client.get_attendance_report(STORE_ID, TARGET_MONTH)
    print(f"  ✅ 응답: {str(data)[:200]}")


async def test_payroll_list() -> None:
    """전 직원 급여 목록 API."""
    print("\n[TEST] 급여 목록 (payrolls)")
    client = InternalAPIClient()
    data = await client.get_payroll_list(STORE_ID, TARGET_MONTH)
    print(f"  ✅ 응답: {str(data)[:200]}")


async def test_employee_schedules() -> None:
    """전체 직원 주간 스케줄 API."""
    print("\n[TEST] 주간 스케줄 (schedules)")
    client = InternalAPIClient()
    data = await client.get_employee_schedules(STORE_ID)
    print(f"  ✅ 응답: {str(data)[:200]}")


async def test_token_reuse() -> None:
    """같은 클라이언트 인스턴스로 여러 번 호출 시 토큰 재사용 확인."""
    print("\n[TEST] 토큰 재사용")
    client = InternalAPIClient()
    await client.get_attendance_dashboard(STORE_ID)
    token_first = client._access_token
    await client.get_employee_schedules(STORE_ID)
    token_second = client._access_token
    assert token_first == token_second, "불필요한 재로그인 발생"
    print("  ✅ 토큰 재사용 확인 (재로그인 없음)")


async def main() -> None:
    settings = get_settings()
    print(f"접속 대상: {settings.internal_api_url}")
    print(f"이메일: {settings.internal_api_email}")

    tests = [
        test_login,
        test_attendance_dashboard,
        test_attendance_report,
        test_payroll_list,
        test_employee_schedules,
        test_token_reuse,
    ]

    passed = 0
    failed = 0
    for test_fn in tests:
        try:
            await test_fn()
            passed += 1
        except Exception as e:
            print(f"  ❌ 실패: {e}")
            failed += 1

    print(f"\n결과: {passed}개 통과 / {failed}개 실패")


if __name__ == "__main__":
    asyncio.run(main())
