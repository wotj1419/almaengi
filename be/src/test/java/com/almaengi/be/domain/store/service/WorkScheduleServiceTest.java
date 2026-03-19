package com.almaengi.be.domain.store.service;
import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.store.dto.WorkScheduleRequestDto;
import com.almaengi.be.domain.store.dto.WorkScheduleResponseDto;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.entity.WorkSchedule;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.repository.WorkScheduleRepository;
import com.almaengi.be.domain.store.type.DayOfWeek;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
@DisplayName("WorkScheduleService 단위 테스트")
class WorkScheduleServiceTest {
    @InjectMocks
    private WorkScheduleService workScheduleService;
    @Mock
    private WorkScheduleRepository workScheduleRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    private static final Long OWNER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;
    private static final Long EMPLOYEE_USER_ID = 3L;
    private static final Long STORE_ID = 10L;
    private static final Long EMPLOYEE_ID = 100L;
    private static final Long SCHEDULE_ID = 1000L;
    private User owner;
    private User otherUser;
    private User employeeUser;
    private Store store;
    private StoreEmployee employee;
    private WorkSchedule existingSchedule;
    @BeforeEach
    void setUp() {
        owner = createUser(OWNER_ID, "사장님", Role.OWNER);
        otherUser = createUser(OTHER_USER_ID, "다른유저", Role.OWNER);
        employeeUser = createUser(EMPLOYEE_USER_ID, "김알바", Role.EMPLOYEE);
        store = Store.builder()
                .owner(owner)
                .name("알맹이 카페")
                .address("서울")
                .phone("010-1111-2222")
                .isOver5Employees(false)
                .qrCode("qr")
                .build();
        ReflectionTestUtils.setField(store, "id", STORE_ID);
        ReflectionTestUtils.setField(store, "isClosed", false);
        employee = StoreEmployee.builder()
                .store(store)
                .user(employeeUser)
                .status(StoreEmployeeStatus.WORKING)
                .hourlyWage(11000)
                .dependentsCount(0)
                .includeHolidayPay(false)
                .build();
        ReflectionTestUtils.setField(employee, "id", EMPLOYEE_ID);
        existingSchedule = WorkSchedule.builder()
                .employee(employee)
                .dayOfWeek(DayOfWeek.MON)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(13, 0))
                .breakMinutes(30)
                .build();
        ReflectionTestUtils.setField(existingSchedule, "id", SCHEDULE_ID);
    }
    @Nested
    @DisplayName("addSchedule 테스트")
    class AddScheduleTest {
        @Test
        @DisplayName("성공: 사장님이 유효한 스케줄을 등록한다")
        void addScheduleSuccess() {
            // given
            WorkScheduleRequestDto.Create request = createCreateRequest(DayOfWeek.MON, "09:00", "13:00", 30);
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee));
            when(workScheduleRepository.existsTimeOverlapping(EMPLOYEE_ID, DayOfWeek.MON,
                    LocalTime.of(9, 0), LocalTime.of(13, 0))).thenReturn(false);
            when(workScheduleRepository.save(any(WorkSchedule.class))).thenAnswer(invocation -> {
                WorkSchedule arg = invocation.getArgument(0);
                ReflectionTestUtils.setField(arg, "id", SCHEDULE_ID);
                return arg;
            });
            // when
            WorkScheduleResponseDto.ScheduleInfo result =
                    workScheduleService.addSchedule(OWNER_ID, STORE_ID, EMPLOYEE_ID, request);
            // then
            assertThat(result.getScheduleId()).isEqualTo(SCHEDULE_ID);
            assertThat(result.getEmployeeId()).isEqualTo(EMPLOYEE_ID);
            assertThat(result.getEmployeeName()).isEqualTo("김알바");
            assertThat(result.getDayOfWeek()).isEqualTo(DayOfWeek.MON);
            assertThat(result.getStartTime()).isEqualTo(LocalTime.of(9, 0));
            assertThat(result.getEndTime()).isEqualTo(LocalTime.of(13, 0));
            assertThat(result.getBreakMinutes()).isEqualTo(30);
            verify(workScheduleRepository, times(1)).save(any(WorkSchedule.class));
        }
        @Test
        @DisplayName("성공: 휴게시간이 null이면 0으로 저장한다")
        void addScheduleDefaultBreakMinutesToZero() {
            // given
            WorkScheduleRequestDto.Create request = createCreateRequest(DayOfWeek.TUE, "10:00", "14:00", null);
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee));
            when(workScheduleRepository.existsTimeOverlapping(anyLong(), any(), any(), any())).thenReturn(false);
            when(workScheduleRepository.save(any(WorkSchedule.class))).thenAnswer(invocation -> {
                WorkSchedule arg = invocation.getArgument(0);
                ReflectionTestUtils.setField(arg, "id", SCHEDULE_ID + 1);
                return arg;
            });
            // when
            WorkScheduleResponseDto.ScheduleInfo result =
                    workScheduleService.addSchedule(OWNER_ID, STORE_ID, EMPLOYEE_ID, request);
            // then
            assertThat(result.getBreakMinutes()).isEqualTo(0);
        }
        @Test
        @DisplayName("실패: 시간 충돌이 있으면 DUPLICATE_SCHEDULE 예외 발생")
        void addScheduleFailDuplicate() {
            // given
            WorkScheduleRequestDto.Create request = createCreateRequest(DayOfWeek.MON, "09:00", "13:00", 10);
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee));
            when(workScheduleRepository.existsTimeOverlapping(anyLong(), any(), any(), any())).thenReturn(true);
            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.addSchedule(OWNER_ID, STORE_ID, EMPLOYEE_ID, request));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.DUPLICATE_SCHEDULE);
            verify(workScheduleRepository, never()).save(any());
        }
        @Test
        @DisplayName("실패: 매장이 없으면 STORE_NOT_FOUND")
        void addScheduleFailStoreNotFound() {
            // given
            WorkScheduleRequestDto.Create request = createCreateRequest(DayOfWeek.MON, "09:00", "13:00", 10);
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.empty());
            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.addSchedule(OWNER_ID, STORE_ID, EMPLOYEE_ID, request));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.STORE_NOT_FOUND);
        }
        @Test
        @DisplayName("실패: 사장님 권한이 아니면 UNAUTHORIZED_USER")
        void addScheduleFailUnauthorizedOwner() {
            // given
            WorkScheduleRequestDto.Create request = createCreateRequest(DayOfWeek.MON, "09:00", "13:00", 10);
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.addSchedule(OTHER_USER_ID, STORE_ID, EMPLOYEE_ID, request));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED_USER);
        }
        @Test
        @DisplayName("실패: 직원이 없으면 STORE_EMPLOYEE_NOT_FOUND")
        void addScheduleFailEmployeeNotFound() {
            // given
            WorkScheduleRequestDto.Create request = createCreateRequest(DayOfWeek.MON, "09:00", "13:00", 10);
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.empty());
            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.addSchedule(OWNER_ID, STORE_ID, EMPLOYEE_ID, request));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.STORE_EMPLOYEE_NOT_FOUND);
        }
    }
    @Nested
    @DisplayName("addSchedules 테스트")
    class AddSchedulesTest {
        @Test
        @DisplayName("성공: 충돌 없는 건은 생성되고 충돌 건은 conflicts에 담긴다")
        void addSchedulesMixedSuccessAndConflict() {
            // given
            WorkScheduleRequestDto.Create req1 = createCreateRequest(DayOfWeek.MON, "09:00", "12:00", 10);
            WorkScheduleRequestDto.Create req2 = createCreateRequest(DayOfWeek.MON, "11:00", "13:00", 0);
            WorkScheduleRequestDto.CreateBulk bulk = createBulkRequest(List.of(req1, req2));
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee));
            when(workScheduleRepository.existsTimeOverlapping(anyLong(), any(), any(), any()))
                    .thenReturn(false, true);
            AtomicLong seq = new AtomicLong(2000L);
            when(workScheduleRepository.save(any(WorkSchedule.class))).thenAnswer(invocation -> {
                WorkSchedule arg = invocation.getArgument(0);
                ReflectionTestUtils.setField(arg, "id", seq.getAndIncrement());
                return arg;
            });
            // when
            WorkScheduleResponseDto.BulkResult result =
                    workScheduleService.addSchedules(OWNER_ID, STORE_ID, EMPLOYEE_ID, bulk);
            // then
            assertThat(result.getCreated()).hasSize(1);
            assertThat(result.getCreated().get(0).getScheduleId()).isEqualTo(2000L);
            assertThat(result.getConflicts()).hasSize(1);
            assertThat(result.getConflicts().get(0)).doesNotContain("월요일09:00 ~ 12:00");
            assertThat(result.getConflicts().get(0)).contains("월요일11:00 ~ 13:00");
            verify(workScheduleRepository, times(1)).save(any(WorkSchedule.class));
        }
        @Test
        @DisplayName("성공: 전부 충돌이면 created는 비고 save는 호출되지 않는다")
        void addSchedulesAllConflicts() {
            // given
            WorkScheduleRequestDto.Create req1 = createCreateRequest(DayOfWeek.MON, "09:00", "12:00", 10);
            WorkScheduleRequestDto.Create req2 = createCreateRequest(DayOfWeek.TUE, "10:00", "13:00", 10);
            WorkScheduleRequestDto.CreateBulk bulk = createBulkRequest(List.of(req1, req2));
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee));
            when(workScheduleRepository.existsTimeOverlapping(anyLong(), any(), any(), any())).thenReturn(true);
            // when
            WorkScheduleResponseDto.BulkResult result =
                    workScheduleService.addSchedules(OWNER_ID, STORE_ID, EMPLOYEE_ID, bulk);
            // then
            assertThat(result.getCreated()).isEmpty();
            assertThat(result.getConflicts()).hasSize(2);
            verify(workScheduleRepository, never()).save(any(WorkSchedule.class));
        }
    }
    @Nested
    @DisplayName("getSchedules 테스트")
    class GetSchedulesTest {
        @Test
        @DisplayName("성공: 사장님은 직원 스케줄을 조회할 수 있다")
        void getSchedulesByOwnerSuccess() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee));
            when(workScheduleRepository.findByEmployeeId(EMPLOYEE_ID)).thenReturn(List.of(existingSchedule));
            // when
            List<WorkScheduleResponseDto.ScheduleInfo> result =
                    workScheduleService.getSchedules(OWNER_ID, STORE_ID, EMPLOYEE_ID);
            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getScheduleId()).isEqualTo(SCHEDULE_ID);
            assertThat(result.get(0).getEmployeeName()).isEqualTo("김알바");
        }
        @Test
        @DisplayName("성공: 직원 본인도 자신의 스케줄을 조회할 수 있다")
        void getSchedulesBySelfSuccess() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee));
            when(workScheduleRepository.findByEmployeeId(EMPLOYEE_ID)).thenReturn(List.of(existingSchedule));
            // when
            List<WorkScheduleResponseDto.ScheduleInfo> result =
                    workScheduleService.getSchedules(EMPLOYEE_USER_ID, STORE_ID, EMPLOYEE_ID);
            // then
            assertThat(result).hasSize(1);
        }
        @Test
        @DisplayName("실패: 사장님도 본인도 아니면 UNAUTHORIZED_ROLE")
        void getSchedulesFailUnauthorizedRole() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(storeEmployeeRepository.findById(EMPLOYEE_ID)).thenReturn(Optional.of(employee));
            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.getSchedules(OTHER_USER_ID, STORE_ID, EMPLOYEE_ID));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED_ROLE);
        }
    }

    @Nested
    @DisplayName("getStoreSchedules 테스트")
    class GetStoreSchedulesTest {
        @Test
        @DisplayName("성공: 사장님은 매장 전체 직원 스케줄을 조회할 수 있다")
        void getStoreSchedulesSuccess() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(workScheduleRepository.findByEmployee_StoreId(STORE_ID)).thenReturn(List.of(existingSchedule));

            // when
            List<WorkScheduleResponseDto.ScheduleInfo> result =
                    workScheduleService.getStoreSchedules(OWNER_ID, STORE_ID);

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getScheduleId()).isEqualTo(SCHEDULE_ID);
            assertThat(result.get(0).getEmployeeId()).isEqualTo(EMPLOYEE_ID);
            assertThat(result.get(0).getEmployeeName()).isEqualTo("김알바");
        }

        @Test
        @DisplayName("실패: 사장님이 아니면 UNAUTHORIZED_USER")
        void getStoreSchedulesFailUnauthorized() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.getStoreSchedules(OTHER_USER_ID, STORE_ID));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED_USER);
        }
    }

    @Nested
    @DisplayName("getStoreSchedulesByDay 테스트")
    class GetStoreSchedulesByDayTest {
        @Test
        @DisplayName("성공: 사장님은 특정 요일의 매장 전체 직원 스케줄을 조회할 수 있다")
        void getStoreSchedulesByDaySuccess() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(workScheduleRepository.findByEmployee_StoreIdAndDayOfWeek(STORE_ID, DayOfWeek.MON))
                    .thenReturn(List.of(existingSchedule));

            // when
            List<WorkScheduleResponseDto.ScheduleInfo> result =
                    workScheduleService.getStoreSchedulesByDay(OWNER_ID, STORE_ID, DayOfWeek.MON);

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getDayOfWeek()).isEqualTo(DayOfWeek.MON);
        }

        @Test
        @DisplayName("실패: 사장님이 아니면 UNAUTHORIZED_USER")
        void getStoreSchedulesByDayFailUnauthorized() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.getStoreSchedulesByDay(OTHER_USER_ID, STORE_ID, DayOfWeek.MON));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED_USER);
        }
    }

    @Nested
    @DisplayName("updateSchedule 테스트")
    class UpdateScheduleTest {
        @Test
        @DisplayName("성공: 휴게시간만 수정할 수 있다")
        void updateScheduleOnlyBreakMinutesSuccess() {
            // given
            WorkScheduleRequestDto.Update request = createUpdateRequest(null, null, null, 45);
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(workScheduleRepository.findById(SCHEDULE_ID)).thenReturn(Optional.of(existingSchedule));
            // when
            WorkScheduleResponseDto.ScheduleInfo result =
                    workScheduleService.updateSchedule(OWNER_ID, STORE_ID, SCHEDULE_ID, request);
            // then
            assertThat(result.getBreakMinutes()).isEqualTo(45);
            assertThat(existingSchedule.getBreakMinutes()).isEqualTo(45);
            verify(workScheduleRepository, never()).save(any());
        }
        @Test
        @DisplayName("성공: 요일/시간을 변경한다")
        void updateScheduleTimeSuccess() {
            // given
            WorkScheduleRequestDto.Update request = createUpdateRequest(DayOfWeek.TUE, "10:00", "14:00", 20);
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(workScheduleRepository.findById(SCHEDULE_ID)).thenReturn(Optional.of(existingSchedule));
            when(workScheduleRepository.existsTimeOverlapping(EMPLOYEE_ID, DayOfWeek.TUE,
                    LocalTime.of(10, 0), LocalTime.of(14, 0))).thenReturn(false);
            // when
            WorkScheduleResponseDto.ScheduleInfo result =
                    workScheduleService.updateSchedule(OWNER_ID, STORE_ID, SCHEDULE_ID, request);
            // then
            assertThat(result.getDayOfWeek()).isEqualTo(DayOfWeek.TUE);
            assertThat(result.getStartTime()).isEqualTo(LocalTime.of(10, 0));
            assertThat(result.getEndTime()).isEqualTo(LocalTime.of(14, 0));
            assertThat(result.getBreakMinutes()).isEqualTo(20);
        }
        @Test
        @DisplayName("실패: 시간 충돌이면 DUPLICATE_SCHEDULE")
        void updateScheduleFailDuplicate() {
            // given
            WorkScheduleRequestDto.Update request = createUpdateRequest(DayOfWeek.MON, "09:30", "12:00", 10);
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(workScheduleRepository.findById(SCHEDULE_ID)).thenReturn(Optional.of(existingSchedule));
            when(workScheduleRepository.existsTimeOverlapping(anyLong(), any(), any(), any())).thenReturn(true);
            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.updateSchedule(OWNER_ID, STORE_ID, SCHEDULE_ID, request));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.DUPLICATE_SCHEDULE);
        }
        @Test
        @DisplayName("실패: 스케줄이 없으면 SCHEDULE_NOT_FOUND")
        void updateScheduleFailScheduleNotFound() {
            // given
            WorkScheduleRequestDto.Update request = createUpdateRequest(DayOfWeek.MON, "09:00", "12:00", 10);
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(workScheduleRepository.findById(SCHEDULE_ID)).thenReturn(Optional.empty());
            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.updateSchedule(OWNER_ID, STORE_ID, SCHEDULE_ID, request));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.SCHEDULE_NOT_FOUND);
        }
    }
    @Nested
    @DisplayName("deleteSchedule 테스트")
    class DeleteScheduleTest {
        @Test
        @DisplayName("성공: 스케줄을 삭제한다")
        void deleteScheduleSuccess() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(workScheduleRepository.findById(SCHEDULE_ID)).thenReturn(Optional.of(existingSchedule));
            // when
            workScheduleService.deleteSchedule(OWNER_ID, STORE_ID, SCHEDULE_ID);
            // then
            verify(workScheduleRepository, times(1)).delete(existingSchedule);
        }
        @Test
        @DisplayName("실패: 사장님 권한이 아니면 UNAUTHORIZED_USER")
        void deleteScheduleFailUnauthorizedOwner() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.deleteSchedule(OTHER_USER_ID, STORE_ID, SCHEDULE_ID));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED_USER);
        }
        @Test
        @DisplayName("실패: 스케줄이 없으면 SCHEDULE_NOT_FOUND")
        void deleteScheduleFailScheduleNotFound() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));
            when(workScheduleRepository.findById(SCHEDULE_ID)).thenReturn(Optional.empty());
            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> workScheduleService.deleteSchedule(OWNER_ID, STORE_ID, SCHEDULE_ID));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.SCHEDULE_NOT_FOUND);
        }
    }
    // ===== helper =====
    private User createUser(Long id, String name, Role role) {
        User user = User.builder()
                .loginType(LoginType.LOCAL)
                .email(name + "@test.com")
                .password("pw")
                .name(name)
                .role(role)
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
    private WorkScheduleRequestDto.Create createCreateRequest(
            DayOfWeek dayOfWeek, String startTime, String endTime, Integer breakMinutes) {
        WorkScheduleRequestDto.Create request = new WorkScheduleRequestDto.Create();
        ReflectionTestUtils.setField(request, "dayOfWeek", dayOfWeek);
        ReflectionTestUtils.setField(request, "startTime", startTime);
        ReflectionTestUtils.setField(request, "endTime", endTime);
        ReflectionTestUtils.setField(request, "breakMinutes", breakMinutes);
        return request;
    }
    private WorkScheduleRequestDto.Update createUpdateRequest(
            DayOfWeek dayOfWeek, String startTime, String endTime, Integer breakMinutes) {
        WorkScheduleRequestDto.Update request = new WorkScheduleRequestDto.Update();
        ReflectionTestUtils.setField(request, "dayOfWeek", dayOfWeek);
        ReflectionTestUtils.setField(request, "startTime", startTime);
        ReflectionTestUtils.setField(request, "endTime", endTime);
        ReflectionTestUtils.setField(request, "breakMinutes", breakMinutes);
        return request;
    }
    private WorkScheduleRequestDto.CreateBulk createBulkRequest(List<WorkScheduleRequestDto.Create> schedules) {
        WorkScheduleRequestDto.CreateBulk request = new WorkScheduleRequestDto.CreateBulk();
        ReflectionTestUtils.setField(request, "schedules", schedules);
        return request;
    }
}
