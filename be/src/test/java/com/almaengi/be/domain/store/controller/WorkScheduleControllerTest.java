package com.almaengi.be.domain.store.controller;
import com.almaengi.be.domain.store.dto.WorkScheduleRequestDto;
import com.almaengi.be.domain.store.dto.WorkScheduleResponseDto;
import com.almaengi.be.domain.store.service.WorkScheduleService;
import com.almaengi.be.domain.store.type.DayOfWeek;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import java.time.LocalTime;
import java.util.List;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@WebMvcTest(controllers = WorkScheduleController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
})
@DisplayName("WorkScheduleController 단위 테스트")
class WorkScheduleControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @MockitoBean
    private WorkScheduleService workScheduleService;
    @MockitoBean
    private JwtProvider jwtProvider;
    @MockitoBean
    private RedisTokenRepository redisTokenRepository;
    private static final Long STORE_ID = 10L;
    private static final Long EMPLOYEE_ID = 100L;
    private static final Long SCHEDULE_ID = 1000L;

    @Nested
    @DisplayName("스케줄 단건 등록 API")
    class AddScheduleApiTest {
        @Test
        @DisplayName("성공: 200과 SUCCESS 응답을 반환한다")
        void addScheduleSuccess() throws Exception {
            // given
            WorkScheduleRequestDto.Create request = new WorkScheduleRequestDto.Create();
            ReflectionTestUtils.setField(request, "dayOfWeek", DayOfWeek.MON);
            ReflectionTestUtils.setField(request, "startTime", "09:00");
            ReflectionTestUtils.setField(request, "endTime", "13:00");
            ReflectionTestUtils.setField(request, "breakMinutes", 30);
            WorkScheduleResponseDto.ScheduleInfo response = WorkScheduleResponseDto.ScheduleInfo.builder()
                    .scheduleId(SCHEDULE_ID)
                    .employeeId(EMPLOYEE_ID)
                    .employeeName("김알바")
                    .dayOfWeek(DayOfWeek.MON)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(13, 0))
                    .breakMinutes(30)
                    .build();
            given(workScheduleService.addSchedule(any(), eq(STORE_ID), eq(EMPLOYEE_ID), any(WorkScheduleRequestDto.Create.class)))
                    .willReturn(response);
            // when & then
            mockMvc.perform(post("/api/v1/stores/{storeId}/employees/{employeeId}/schedules", STORE_ID, EMPLOYEE_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.scheduleId").value(1000))
                    .andExpect(jsonPath("$.data.employeeName").value("김알바"))
                    .andExpect(jsonPath("$.data.dayOfWeek").value("MON"));
            verify(workScheduleService).addSchedule(any(), eq(STORE_ID), eq(EMPLOYEE_ID), any(WorkScheduleRequestDto.Create.class));
        }
        @Test
        @DisplayName("실패: 요청값 검증 실패 시 400(G002)")
        void addScheduleValidationFail() throws Exception {
            // given: startTime 누락
            WorkScheduleRequestDto.Create request = new WorkScheduleRequestDto.Create();
            ReflectionTestUtils.setField(request, "dayOfWeek", DayOfWeek.MON);
            ReflectionTestUtils.setField(request, "endTime", "13:00");
            // when & then
            mockMvc.perform(post("/api/v1/stores/{storeId}/employees/{employeeId}/schedules", STORE_ID, EMPLOYEE_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("G002"));
        }
        @Test
        @DisplayName("실패: 서비스에서 DUPLICATE_SCHEDULE 발생 시 409(S102)")
        void addScheduleBusinessFail() throws Exception {
            // given
            WorkScheduleRequestDto.Create request = new WorkScheduleRequestDto.Create();
            ReflectionTestUtils.setField(request, "dayOfWeek", DayOfWeek.MON);
            ReflectionTestUtils.setField(request, "startTime", "09:00");
            ReflectionTestUtils.setField(request, "endTime", "13:00");
            given(workScheduleService.addSchedule(any(), eq(STORE_ID), eq(EMPLOYEE_ID), any(WorkScheduleRequestDto.Create.class)))
                    .willThrow(new BusinessException(ErrorCode.DUPLICATE_SCHEDULE));
            // when & then
            mockMvc.perform(post("/api/v1/stores/{storeId}/employees/{employeeId}/schedules", STORE_ID, EMPLOYEE_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status").value("S102"));
        }
    }
    @Nested
    @DisplayName("스케줄 일괄 등록 API")
    class AddSchedulesApiTest {
        @Test
        @DisplayName("성공: created/conflicts를 반환한다")
        void addSchedulesSuccess() throws Exception {
            // given
            WorkScheduleRequestDto.Create req1 = new WorkScheduleRequestDto.Create();
            ReflectionTestUtils.setField(req1, "dayOfWeek", DayOfWeek.MON);
            ReflectionTestUtils.setField(req1, "startTime", "09:00");
            ReflectionTestUtils.setField(req1, "endTime", "12:00");
            ReflectionTestUtils.setField(req1, "breakMinutes", 10);
            WorkScheduleRequestDto.Create req2 = new WorkScheduleRequestDto.Create();
            ReflectionTestUtils.setField(req2, "dayOfWeek", DayOfWeek.MON);
            ReflectionTestUtils.setField(req2, "startTime", "11:00");
            ReflectionTestUtils.setField(req2, "endTime", "13:00");
            ReflectionTestUtils.setField(req2, "breakMinutes", 0);
            WorkScheduleRequestDto.CreateBulk bulk = new WorkScheduleRequestDto.CreateBulk();
            ReflectionTestUtils.setField(bulk, "schedules", List.of(req1, req2));
            WorkScheduleResponseDto.ScheduleInfo created = WorkScheduleResponseDto.ScheduleInfo.builder()
                    .scheduleId(2000L)
                    .employeeId(EMPLOYEE_ID)
                    .employeeName("김알바")
                    .dayOfWeek(DayOfWeek.MON)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(12, 0))
                    .breakMinutes(10)
                    .build();
            WorkScheduleResponseDto.BulkResult response = WorkScheduleResponseDto.BulkResult.builder()
                    .created(List.of(created))
                    .conflicts(List.of("월요일11:00 ~ 13:00"))
                    .build();
            given(workScheduleService.addSchedules(any(), eq(STORE_ID), eq(EMPLOYEE_ID), any(WorkScheduleRequestDto.CreateBulk.class)))
                    .willReturn(response);
            // when & then
            mockMvc.perform(post("/api/v1/stores/{storeId}/employees/{employeeId}/schedules/bulk", STORE_ID, EMPLOYEE_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bulk)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.created[0].scheduleId").value(2000))
                    .andExpect(jsonPath("$.data.conflicts[0]").value("월요일11:00 ~ 13:00"));
        }
    }
    @Nested
    @DisplayName("스케줄 조회 API")
    class GetSchedulesApiTest {
        @Test
        @DisplayName("성공: 리스트를 반환한다")
        void getSchedulesSuccess() throws Exception {
            // given
            WorkScheduleResponseDto.ScheduleInfo schedule1 = WorkScheduleResponseDto.ScheduleInfo.builder()
                    .scheduleId(1000L)
                    .employeeId(EMPLOYEE_ID)
                    .employeeName("김알바")
                    .dayOfWeek(DayOfWeek.MON)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(13, 0))
                    .breakMinutes(30)
                    .build();
            given(workScheduleService.getSchedules(any(), eq(STORE_ID), eq(EMPLOYEE_ID)))
                    .willReturn(List.of(schedule1));
            // when & then
            mockMvc.perform(get("/api/v1/stores/{storeId}/employees/{employeeId}/schedules", STORE_ID, EMPLOYEE_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data[0].scheduleId").value(1000))
                    .andExpect(jsonPath("$.data[0].dayOfWeek").value("MON"));
        }
    }

    @Nested
    @DisplayName("매장 전체 직원 스케줄 조회 API")
    class GetStoreSchedulesApiTest {
        @Test
        @DisplayName("성공: 매장 전체 직원 스케줄 리스트를 반환한다")
        void getStoreSchedulesSuccess() throws Exception {
            // given
            WorkScheduleResponseDto.ScheduleInfo schedule1 = WorkScheduleResponseDto.ScheduleInfo.builder()
                    .scheduleId(1001L)
                    .employeeId(EMPLOYEE_ID)
                    .employeeName("김알바")
                    .dayOfWeek(DayOfWeek.MON)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(13, 0))
                    .breakMinutes(30)
                    .build();

            given(workScheduleService.getStoreSchedules(any(), eq(STORE_ID)))
                    .willReturn(List.of(schedule1));

            // when & then
            mockMvc.perform(get("/api/v1/stores/{storeId}/employees/schedules", STORE_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data[0].scheduleId").value(1001))
                    .andExpect(jsonPath("$.data[0].dayOfWeek").value("MON"));

            verify(workScheduleService).getStoreSchedules(any(), eq(STORE_ID));
        }
    }

    @Nested
    @DisplayName("매장 특정 요일 전체 직원 스케줄 조회 API")
    class GetStoreSchedulesByDayApiTest {
        @Test
        @DisplayName("성공: 특정 요일 스케줄 리스트를 반환한다")
        void getStoreSchedulesByDaySuccess() throws Exception {
            // given
            WorkScheduleResponseDto.ScheduleInfo schedule1 = WorkScheduleResponseDto.ScheduleInfo.builder()
                    .scheduleId(1002L)
                    .employeeId(EMPLOYEE_ID)
                    .employeeName("김알바")
                    .dayOfWeek(DayOfWeek.MON)
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(14, 0))
                    .breakMinutes(20)
                    .build();

            given(workScheduleService.getStoreSchedulesByDay(any(), eq(STORE_ID), eq(DayOfWeek.MON)))
                    .willReturn(List.of(schedule1));

            // when & then
            mockMvc.perform(get("/api/v1/stores/{storeId}/employees/schedules/{dayOfWeek}", STORE_ID, "MON"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data[0].scheduleId").value(1002))
                    .andExpect(jsonPath("$.data[0].dayOfWeek").value("MON"));

            verify(workScheduleService).getStoreSchedulesByDay(any(), eq(STORE_ID), eq(DayOfWeek.MON));
        }
    }

    @Nested
    @DisplayName("스케줄 수정 API")
    class UpdateScheduleApiTest {
        @Test
        @DisplayName("성공: 수정 결과를 반환한다")
        void updateScheduleSuccess() throws Exception {
            // given
            WorkScheduleRequestDto.Update request = new WorkScheduleRequestDto.Update();
            ReflectionTestUtils.setField(request, "dayOfWeek", DayOfWeek.TUE);
            ReflectionTestUtils.setField(request, "startTime", "10:00");
            ReflectionTestUtils.setField(request, "endTime", "14:00");
            ReflectionTestUtils.setField(request, "breakMinutes", 20);
            WorkScheduleResponseDto.ScheduleInfo response = WorkScheduleResponseDto.ScheduleInfo.builder()
                    .scheduleId(SCHEDULE_ID)
                    .employeeId(EMPLOYEE_ID)
                    .employeeName("김알바")
                    .dayOfWeek(DayOfWeek.TUE)
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(14, 0))
                    .breakMinutes(20)
                    .build();
            given(workScheduleService.updateSchedule(any(), eq(STORE_ID), eq(SCHEDULE_ID), any(WorkScheduleRequestDto.Update.class)))
                    .willReturn(response);
            // when & then
            mockMvc.perform(patch("/api/v1/stores/{storeId}/employees/{employeeId}/schedules/{scheduleId}",
                            STORE_ID, EMPLOYEE_ID, SCHEDULE_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.dayOfWeek").value("TUE"))
                    .andExpect(jsonPath("$.data.breakMinutes").value(20));
        }
        @Test
        @DisplayName("실패: 권한 오류면 403(U004)")
        void updateScheduleUnauthorizedFail() throws Exception {
            // given
            WorkScheduleRequestDto.Update request = new WorkScheduleRequestDto.Update();
            ReflectionTestUtils.setField(request, "breakMinutes", 10);
            given(workScheduleService.updateSchedule(any(), eq(STORE_ID), eq(SCHEDULE_ID), any(WorkScheduleRequestDto.Update.class)))
                    .willThrow(new BusinessException(ErrorCode.UNAUTHORIZED_USER));
            // when & then
            mockMvc.perform(patch("/api/v1/stores/{storeId}/employees/{employeeId}/schedules/{scheduleId}",
                            STORE_ID, EMPLOYEE_ID, SCHEDULE_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("U004"));
        }
    }
    @Nested
    @DisplayName("스케줄 삭제 API")
    class DeleteScheduleApiTest {
        @Test
        @DisplayName("성공: SUCCESS 응답을 반환한다")
        void deleteScheduleSuccess() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/stores/{storeId}/employees/{employeeId}/schedules/{scheduleId}",
                            STORE_ID, EMPLOYEE_ID, SCHEDULE_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"));
            verify(workScheduleService).deleteSchedule(any(), eq(STORE_ID), eq(SCHEDULE_ID));
        }
    }
}
