from langchain_core.tools import tool

from app.common.logger import get_logger
from app.service.internal_api_client import InternalAPIClient
from app.service.rag_service import RagService

logger = get_logger(__name__)


def create_tools(store_id: int, api_client: InternalAPIClient, rag_service: RagService) -> list:
    """store_id가 고정된 LangChain Tool 목록 반환."""

    @tool
    async def search_labor_law(query: str) -> str:
        """노동법 조항을 검색합니다.
        주휴수당, 최저임금, 연차, 퇴직금, 4대보험, 해고, 근로계약 등
        법적 규정·조건·의무·처벌을 알아볼 때 사용하세요.
        """
        chunks = await rag_service.search(query, top_k=5)
        if not chunks:
            return "관련 법령을 찾을 수 없습니다."
        lines = []
        for c in chunks:
            lines.append(f"[{c['law_name']} 제{c['article']}조]\n{c['content']}")
        result = "\n\n---\n\n".join(lines)
        logger.info("tool_search_labor_law", query=query, chunks=len(chunks))
        return result

    @tool
    async def get_attendance_report(target_month: str) -> str:
        """매장 직원들의 월별 근태 리포트를 조회합니다.
        직원별 출근 횟수, 지각 횟수, 결근 횟수, 총 근무시간을 확인할 때 사용하세요.
        target_month 형식: YYYY-MM (예: 2026-03)
        """
        data = await api_client.get_attendance_report(store_id, target_month)
        logger.info("tool_get_attendance_report", store_id=store_id, target_month=target_month)
        if not data.get("employees"):
            return f"{target_month} 근태 데이터가 없습니다."
        lines = [f"[{target_month} 근태 리포트]"]
        for emp in data["employees"]:
            lines.append(
                f"- {emp['employeeName']}: 출근 {emp['attendanceCount']}회, "
                f"지각 {emp['lateCount']}회, 결근 {emp['absentCount']}회, "
                f"총 근무 {emp['totalWorkMinutes'] // 60}시간 {emp['totalWorkMinutes'] % 60}분"
            )
        return "\n".join(lines)

    @tool
    async def get_payroll_list(target_month: str) -> str:
        """매장 전 직원의 급여 목록을 조회합니다.
        시급, 총 근무시간, 연장근무, 야간근무, 급여액을 확인할 때 사용하세요.
        인건비 총액, 주휴수당 대상 여부 판단에도 활용하세요.
        target_month 형식: YYYY-MM (예: 2026-03)
        """
        data = await api_client.get_payroll_list(store_id, target_month)
        logger.info("tool_get_payroll_list", store_id=store_id, target_month=target_month)
        if not data.get("employees"):
            return f"{target_month} 급여 데이터가 없습니다."
        lines = [
            f"[{target_month} 급여 현황]",
            f"총 인건비: {data['totalLaborCost']:,}원 | 직원 수: {data['employeeCount']}명",
        ]
        for emp in data["employees"]:
            lines.append(
                f"- {emp['employeeName']}: 시급 {emp['hourlyWage']:,}원, "
                f"총 근무 {emp['totalWorkMinutes'] // 60}시간, "
                f"연장 {emp['overtimeMinutes'] // 60}시간, "
                f"야간 {emp['nightWorkMinutes'] // 60}시간, "
                f"급여 {emp['netPay']:,}원"
            )
        return "\n".join(lines)

    @tool
    async def get_employee_schedules(_dummy: str = "") -> str:
        """매장 전체 직원의 주간 스케줄을 조회합니다.
        직원별 근무 요일, 근무 시간, 주간 총 근무시간을 확인할 때 사용하세요.
        주휴수당 대상 판단(주 15시간 이상 여부), 4대보험 가입 대상 판단에 활용하세요.
        입력값은 아무 값이나 넣어도 됩니다. (예: "조회")
        """
        data = await api_client.get_employee_schedules(store_id)
        logger.info("tool_get_employee_schedules", store_id=store_id)
        if not data:
            return "등록된 스케줄이 없습니다."

        DAY_KO = {
            "MON": "월", "TUE": "화", "WED": "수",
            "THU": "목", "FRI": "금", "SAT": "토", "SUN": "일",
        }

        # employee_id 기준으로 그룹핑
        emp_map: dict[int, dict] = {}
        for s in data:
            eid = s["employeeId"]
            if eid not in emp_map:
                emp_map[eid] = {"name": s["employeeName"], "schedules": [], "total_minutes": 0}
            start_h, start_m = map(int, s["startTime"][:5].split(":"))
            end_h, end_m = map(int, s["endTime"][:5].split(":"))
            work_minutes = (end_h * 60 + end_m) - (start_h * 60 + start_m) - s["breakMinutes"]
            emp_map[eid]["schedules"].append(
                f"{DAY_KO.get(s['dayOfWeek'], s['dayOfWeek'])} {s['startTime'][:5]}~{s['endTime'][:5]}"
            )
            emp_map[eid]["total_minutes"] += work_minutes

        lines = ["[직원별 주간 스케줄]"]
        for info in emp_map.values():
            total_h = info["total_minutes"] // 60
            total_m = info["total_minutes"] % 60
            days = ", ".join(info["schedules"])
            weekly_flag = "✅ 주휴수당 대상" if info["total_minutes"] >= 15 * 60 else "❌ 주휴수당 미대상"
            lines.append(f"- {info['name']}: {days} → 주 {total_h}시간 {total_m}분 ({weekly_flag})")
        return "\n".join(lines)

    return [search_labor_law, get_attendance_report, get_payroll_list, get_employee_schedules]
