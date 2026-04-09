package com.almaengi.be.domain.attendance.controller;

import com.almaengi.be.domain.attendance.dto.AttendanceLogResponseDto;
import com.almaengi.be.domain.attendance.dto.AttendanceRequestDto;
import com.almaengi.be.domain.attendance.dto.AttendanceResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardDetailResponseDto;
import com.almaengi.be.domain.attendance.dto.DashboardSummaryResponseDto;
import com.almaengi.be.domain.attendance.dto.MonthlyAttendanceReportResponseDto;
import com.almaengi.be.domain.attendance.dto.MyAttendanceLogResponseDto;
import com.almaengi.be.domain.attendance.scheduler.AttendanceScheduler;
import com.almaengi.be.domain.attendance.service.AttendanceService;
import com.almaengi.be.domain.attendance.type.AttendanceResultType;
import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.test.util.ReflectionTestUtils;

@WebMvcTest(controllers = AttendanceController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
})
@DisplayName("AttendanceController 단위 테스트")
class AttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AttendanceService attendanceService;

    /** 테스트용 엔드포인트가 주입하는 빈 — @WebMvcTest에서 자동 로드 불가하므로 Mock 처리 */
    @MockitoBean
    private AttendanceScheduler attendanceScheduler;

    @MockitoBean
    private StringRedisTemplate redisTemplate;

    /** JwtAuthenticationFilter가 @Component로 스캔되므로 의존성 Mock 처리 */
    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private RedisTokenRepository redisTokenRepository;

    @Nested
    @DisplayName("POST /api/v1/attendances 출퇴근 기록 API")
    class RecordAttendanceTest {

        @Test
        @DisplayName("성공: 출근 요청 시 CLOCK_IN 응답을 반환한다")
        void clockInSuccess() throws Exception {
            // given
            Long userId = 100L;
            AttendanceRequestDto req = new AttendanceRequestDto();
            ReflectionTestUtils.setField(req, "qrToken", "almaengi_store_test123");
            ReflectionTestUtils.setField(req, "latitude", 37.5665);
            ReflectionTestUtils.setField(req, "longitude", 126.9780);

            AttendanceResponseDto mockResponse = AttendanceResponseDto.builder()
                    .type(AttendanceResultType.CLOCK_IN)
                    .attendanceId(1L)
                    .clockIn(LocalDateTime.of(2026, 3, 16, 9, 0, 0))
                    .clockOut(null)
                    .status(AttendanceStatus.WORKING)
                    .overtime(false)
                    .message("출근이 기록되었습니다.")
                    .build();

            Mockito.when(attendanceService.recordAttendance(any(), any(AttendanceRequestDto.class)))
                    .thenReturn(mockResponse);

            // when & then
            mockMvc.perform(post("/api/v1/attendances")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.type").value("CLOCK_IN"))
                    .andExpect(jsonPath("$.data.status").value("WORKING"))
                    .andExpect(jsonPath("$.data.message").value("출근이 기록되었습니다."));

            Mockito.verify(attendanceService, Mockito.times(1))
                    .recordAttendance(any(), any(AttendanceRequestDto.class));
        }

        @Test
        @DisplayName("성공: 퇴근 요청 시 CLOCK_OUT 응답을 반환한다")
        void clockOutSuccess() throws Exception {
            // given
            Long userId = 100L;
            AttendanceRequestDto req = new AttendanceRequestDto();
            ReflectionTestUtils.setField(req, "qrToken", "almaengi_store_test123");
            ReflectionTestUtils.setField(req, "latitude", 37.5665);
            ReflectionTestUtils.setField(req, "longitude", 126.9780);
            ReflectionTestUtils.setField(req, "overtimeConfirm", false);

            AttendanceResponseDto mockResponse = AttendanceResponseDto.builder()
                    .type(AttendanceResultType.CLOCK_OUT)
                    .attendanceId(1L)
                    .clockIn(LocalDateTime.of(2026, 3, 16, 9, 0, 0))
                    .clockOut(LocalDateTime.of(2026, 3, 16, 18, 0, 0))
                    .status(AttendanceStatus.WORKING)
                    .overtime(false)
                    .message("퇴근이 기록되었습니다.")
                    .build();

            Mockito.when(attendanceService.recordAttendance(any(), any(AttendanceRequestDto.class)))
                    .thenReturn(mockResponse);

            // when & then
            mockMvc.perform(post("/api/v1/attendances")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.type").value("CLOCK_OUT"))
                    .andExpect(jsonPath("$.data.overtime").value(false))
                    .andExpect(jsonPath("$.data.message").value("퇴근이 기록되었습니다."));
        }

        @Test
        @DisplayName("실패: QR 토큰 없이 요청하면 400 Bad Request")
        void failWithoutQrToken() throws Exception {
            // given
            AttendanceRequestDto req = new AttendanceRequestDto();
            ReflectionTestUtils.setField(req, "latitude", 37.5665);
            ReflectionTestUtils.setField(req, "longitude", 126.9780);

            // when & then
            mockMvc.perform(post("/api/v1/attendances")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/attendances/dashboard/{storeId} 대시보드 요약 API")
    class DashboardSummaryApiTest {

        @Test
        @DisplayName("성공: 매장별 working/late/absent 카운트를 ApiResponse로 반환한다")
        void dashboardSummarySuccess() throws Exception {
            // given
            DashboardSummaryResponseDto mockResponse = DashboardSummaryResponseDto.builder()
                    .working(5L)
                    .late(2L)
                    .absent(1L)
                    .build();

            Mockito.when(attendanceService.getDashboardSummary(any(), eq(1L))).thenReturn(mockResponse);

            // when & then
            mockMvc.perform(get("/api/v1/attendances/dashboard/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.working").value(5))
                    .andExpect(jsonPath("$.data.late").value(2))
                    .andExpect(jsonPath("$.data.absent").value(1));

            Mockito.verify(attendanceService, Mockito.times(1)).getDashboardSummary(any(), eq(1L));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/attendances/dashboard/{storeId}/{status} 상태별 직원 목록 API")
    class DashboardDetailApiTest {

        @Test
        @DisplayName("성공: 특정 상태의 직원 목록을 ApiResponse로 반환한다")
        void dashboardDetailSuccess() throws Exception {
            // given
            DashboardDetailResponseDto.DashboardEmployeeDto emp = DashboardDetailResponseDto.DashboardEmployeeDto.builder()
                    .employeeId(10L)
                    .userName("김알바")
                    .phone("010-1234-5678")
                    .scheduledStartTime(LocalTime.of(9, 0))
                    .scheduledEndTime(LocalTime.of(18, 0))
                    .build();

            DashboardDetailResponseDto mockResponse = DashboardDetailResponseDto.builder()
                    .status("WORKING")
                    .employees(List.of(emp))
                    .build();

            Mockito.when(attendanceService.getDashboardDetail(any(), eq(1L), eq("working"))).thenReturn(mockResponse);

            // when & then
            mockMvc.perform(get("/api/v1/attendances/dashboard/1/working"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.status").value("WORKING"))
                    .andExpect(jsonPath("$.data.employees").isArray())
                    .andExpect(jsonPath("$.data.employees[0].employeeId").value(10))
                    .andExpect(jsonPath("$.data.employees[0].userName").value("김알바"))
                    .andExpect(jsonPath("$.data.employees[0].phone").value("010-1234-5678"));

            Mockito.verify(attendanceService, Mockito.times(1)).getDashboardDetail(any(), eq(1L), eq("working"));
        }

        @Test
        @DisplayName("성공: 해당 상태의 직원이 없으면 빈 리스트를 반환한다")
        void dashboardDetailEmpty() throws Exception {
            // given
            DashboardDetailResponseDto mockResponse = DashboardDetailResponseDto.builder()
                    .status("ABSENT")
                    .employees(List.of())
                    .build();

            Mockito.when(attendanceService.getDashboardDetail(any(), eq(1L), eq("absent"))).thenReturn(mockResponse);

            // when & then
            mockMvc.perform(get("/api/v1/attendances/dashboard/1/absent"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.status").value("ABSENT"))
                    .andExpect(jsonPath("$.data.employees").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/attendances/log/{storeId} 근태 로그 API")
    class AttendanceLogApiTest {

        @Test
        @DisplayName("성공: 근태 로그를 ApiResponse로 반환한다")
        void getAttendanceLogSuccess() throws Exception {
            // given
            LocalDate yesterday = LocalDate.now().minusDays(1);

            AttendanceLogResponseDto.AttendanceLogDto log = AttendanceLogResponseDto.AttendanceLogDto.builder()
                    .employeeId(10L)
                    .employeeName("김알바")
                    .scheduledStartTime(LocalTime.of(9, 0))
                    .scheduledEndTime(LocalTime.of(18, 0))
                    .clockIn(yesterday.atTime(9, 5))
                    .clockOut(yesterday.atTime(18, 0))
                    .status("WORKING")
                    .overtime(false)
                    .build();

            AttendanceLogResponseDto mockResponse = AttendanceLogResponseDto.builder()
                    .storeId(1L)
                    .date(yesterday)
                    .attendances(List.of(log))
                    .build();

            Mockito.when(attendanceService.getAttendanceLog(any(), eq(1L), eq(yesterday))).thenReturn(mockResponse);

            // when & then
            mockMvc.perform(get("/api/v1/attendances/log/1")
                            .param("date", yesterday.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.storeId").value(1))
                    .andExpect(jsonPath("$.data.date").value(yesterday.toString()))
                    .andExpect(jsonPath("$.data.attendances").isArray())
                    .andExpect(jsonPath("$.data.attendances[0].employeeId").value(10))
                    .andExpect(jsonPath("$.data.attendances[0].employeeName").value("김알바"))
                    .andExpect(jsonPath("$.data.attendances[0].status").value("WORKING"))
                    .andExpect(jsonPath("$.data.attendances[0].overtime").value(false));

            Mockito.verify(attendanceService, Mockito.times(1)).getAttendanceLog(any(), eq(1L), eq(yesterday));
        }

        @Test
        @DisplayName("성공: 기록이 없으면 빈 리스트를 반환한다")
        void getAttendanceLogEmpty() throws Exception {
            // given
            LocalDate yesterday = LocalDate.now().minusDays(1);

            AttendanceLogResponseDto mockResponse = AttendanceLogResponseDto.builder()
                    .storeId(1L)
                    .date(yesterday)
                    .attendances(List.of())
                    .build();

            Mockito.when(attendanceService.getAttendanceLog(any(), eq(1L), eq(yesterday))).thenReturn(mockResponse);

            // when & then
            mockMvc.perform(get("/api/v1/attendances/log/1")
                            .param("date", yesterday.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.storeId").value(1))
                    .andExpect(jsonPath("$.data.attendances").isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/attendances/me/log 알바생 본인 일별 근태 상세 API")
    class MyAttendanceLogApiTest {

        @Test
        @DisplayName("성공: 근태 기록이 있으면 상세 정보를 반환한다")
        void getMyAttendanceLogSuccess() throws Exception {
            // given
            LocalDate targetDate = LocalDate.now().minusDays(1);
            MyAttendanceLogResponseDto mockResponse = MyAttendanceLogResponseDto.builder()
                    .storeId(1L)
                    .employeeId(10L)
                    .employeeName("김알바")
                    .date(targetDate)
                    .scheduledStartTime(LocalTime.of(9, 0))
                    .scheduledEndTime(LocalTime.of(18, 0))
                    .clockIn(targetDate.atTime(9, 0))
                    .clockOut(targetDate.atTime(18, 0))
                    .status(AttendanceStatus.WORKING)
                    .overtime(false)
                    .breakMinutes(30)
                    .workedMinutes(510)
                    .exists(true)
                    .build();

            Mockito.when(attendanceService.getMyAttendanceLog(any(), eq(1L), eq(targetDate)))
                    .thenReturn(mockResponse);

            // when & then
            mockMvc.perform(get("/api/v1/attendances/me/log")
                            .param("storeId", "1")
                            .param("date", targetDate.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.storeId").value(1))
                    .andExpect(jsonPath("$.data.employeeId").value(10))
                    .andExpect(jsonPath("$.data.employeeName").value("김알바"))
                    .andExpect(jsonPath("$.data.status").value("WORKING"))
                    .andExpect(jsonPath("$.data.workedMinutes").value(510))
                    .andExpect(jsonPath("$.data.exists").value(true));

            Mockito.verify(attendanceService, Mockito.times(1)).getMyAttendanceLog(any(), eq(1L), eq(targetDate));
        }

        @Test
        @DisplayName("성공: 근태 기록이 없으면 exists=false를 반환한다")
        void getMyAttendanceLogEmpty() throws Exception {
            // given
            LocalDate targetDate = LocalDate.now().minusDays(2);
            MyAttendanceLogResponseDto mockResponse = MyAttendanceLogResponseDto.builder()
                    .storeId(1L)
                    .employeeId(10L)
                    .employeeName("김알바")
                    .date(targetDate)
                    .workedMinutes(0)
                    .exists(false)
                    .build();

            Mockito.when(attendanceService.getMyAttendanceLog(any(), eq(1L), eq(targetDate)))
                    .thenReturn(mockResponse);

            // when & then
            mockMvc.perform(get("/api/v1/attendances/me/log")
                            .param("storeId", "1")
                            .param("date", targetDate.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.exists").value(false))
                    .andExpect(jsonPath("$.data.workedMinutes").value(0));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/attendances/report/{storeId} 월별 근태 리포트 API")
    class MonthlyReportApiTest {

        @Test
        @DisplayName("성공: 직원별 근태 집계와 성실왕/지각왕을 반환한다")
        void getMonthlyReportSuccess() throws Exception {
            // given
            MonthlyAttendanceReportResponseDto.EmployeeAttendanceSummary emp1 =
                    MonthlyAttendanceReportResponseDto.EmployeeAttendanceSummary.builder()
                            .employeeId(10L)
                            .employeeName("김알바")
                            .attendanceCount(20)
                            .lateCount(2)
                            .absentCount(0)
                            .totalWorkMinutes(9600)
                            .build();

            MonthlyAttendanceReportResponseDto.EmployeeAttendanceSummary emp2 =
                    MonthlyAttendanceReportResponseDto.EmployeeAttendanceSummary.builder()
                            .employeeId(11L)
                            .employeeName("이알바")
                            .attendanceCount(18)
                            .lateCount(5)
                            .absentCount(2)
                            .totalWorkMinutes(8640)
                            .build();

            MonthlyAttendanceReportResponseDto.EmployeeInfo diligent =
                    MonthlyAttendanceReportResponseDto.EmployeeInfo.builder()
                            .employeeId(10L)
                            .employeeName("김알바")
                            .build();

            MonthlyAttendanceReportResponseDto.EmployeeInfo lateChampion =
                    MonthlyAttendanceReportResponseDto.EmployeeInfo.builder()
                            .employeeId(11L)
                            .employeeName("이알바")
                            .build();

            MonthlyAttendanceReportResponseDto mockResponse = MonthlyAttendanceReportResponseDto.builder()
                    .targetMonth("2026-03")
                    .employees(List.of(emp1, emp2))
                    .diligentEmployees(List.of(diligent))
                    .lateChampions(List.of(lateChampion))
                    .build();

            Mockito.when(attendanceService.getMonthlyReport(any(), eq(1L), any())).thenReturn(mockResponse);

            // when & then
            mockMvc.perform(get("/api/v1/attendances/report/1")
                            .param("targetMonth", "2026-03"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.targetMonth").value("2026-03"))
                    .andExpect(jsonPath("$.data.employees").isArray())
                    .andExpect(jsonPath("$.data.employees[0].employeeId").value(10))
                    .andExpect(jsonPath("$.data.employees[0].attendanceCount").value(20))
                    .andExpect(jsonPath("$.data.employees[0].lateCount").value(2))
                    .andExpect(jsonPath("$.data.employees[0].absentCount").value(0))
                    .andExpect(jsonPath("$.data.employees[0].totalWorkMinutes").value(9600))
                    .andExpect(jsonPath("$.data.diligentEmployees[0].employeeName").value("김알바"))
                    .andExpect(jsonPath("$.data.lateChampions[0].employeeName").value("이알바"));

            Mockito.verify(attendanceService, Mockito.times(1)).getMonthlyReport(any(), eq(1L), any());
        }

        @Test
        @DisplayName("성공: 근태 기록이 없으면 빈 리스트를 반환한다")
        void getMonthlyReportEmpty() throws Exception {
            // given
            MonthlyAttendanceReportResponseDto mockResponse = MonthlyAttendanceReportResponseDto.builder()
                    .targetMonth("2026-03")
                    .employees(List.of())
                    .diligentEmployees(List.of())
                    .lateChampions(List.of())
                    .build();

            Mockito.when(attendanceService.getMonthlyReport(any(), eq(1L), any())).thenReturn(mockResponse);

            // when & then
            mockMvc.perform(get("/api/v1/attendances/report/1")
                            .param("targetMonth", "2026-03"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.employees").isEmpty())
                    .andExpect(jsonPath("$.data.diligentEmployees").isEmpty())
                    .andExpect(jsonPath("$.data.lateChampions").isEmpty());
        }
    }
}
