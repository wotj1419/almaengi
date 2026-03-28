package com.almaengi.be.domain.store.service;

import com.almaengi.be.domain.chat.service.ChatRoomService;
import com.almaengi.be.domain.store.dto.StoreEmployeeRequestDto;
import com.almaengi.be.domain.store.dto.StoreEmployeeResponseDto;
import com.almaengi.be.domain.store.dto.StoreResponseDto;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.util.RedisUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class StoreEmployeeServiceTest {

    @InjectMocks
    private StoreEmployeeService storeEmployeeService;

    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ChatRoomService chatRoomService;
    @Mock
    private RedisUtil redisUtil;

    @Test
    @DisplayName("초대 코드 발급 성공 - 사장님 정상 요청")
    void generateInviteCodeSuccess() {
        Long ownerId = 1L;
        Long storeId = 10L;

        User owner = createUser(ownerId, "사장님");
        Store store = createStore(storeId, owner);
        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));

        StoreEmployeeResponseDto.InviteCodeInfo response = storeEmployeeService.generateInviteCode(ownerId, storeId);

        assertThat(response.getInviteCode()).hasSize(6);
        verify(redisUtil).setDataExpire(any(String.class), eq(String.valueOf(storeId)), eq(10800L), eq(TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("초대 코드 발급 실패 - 사장님이 아닌 사용자")
    void generateInviteCodeFailUnauthorized() {
        Long ownerId = 1L;
        Long requestUserId = 2L;
        Long storeId = 10L;

        User owner = createUser(ownerId, "사장님");
        Store store = createStore(storeId, owner);
        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));

        assertThatThrownBy(() -> storeEmployeeService.generateInviteCode(requestUserId, storeId))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.UNAUTHORIZED_USER.getMessage());
    }

    @Test
    @DisplayName("매장 합류 신청 성공 - WAITING 상태로 저장하고 초대 코드는 유지")
    void joinStoreSuccess() {
        Long userId = 2L;
        Long storeId = 10L;
        String inviteCode = "A1B2C3";
        String redisKey = "STORE_INVITE:" + inviteCode;

        User employee = createUser(userId, "직원");
        User owner = createUser(1L, "사장님");
        Store store = createStore(storeId, owner);

        StoreEmployeeRequestDto.Join request = new StoreEmployeeRequestDto.Join();
        ReflectionTestUtils.setField(request, "inviteCode", inviteCode);

        given(userRepository.findById(userId)).willReturn(Optional.of(employee));
        given(redisUtil.getData(redisKey)).willReturn(String.valueOf(storeId));
        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
        given(storeEmployeeRepository.existsByStoreIdAndUserId(storeId, userId)).willReturn(false);

        StoreEmployee savedEmployee = createEmployee(100L, store, employee, StoreEmployeeStatus.WAITING);
        ReflectionTestUtils.setField(savedEmployee, "hireDate", null);
        given(storeEmployeeRepository.save(any(StoreEmployee.class))).willReturn(savedEmployee);

        StoreEmployeeResponseDto.EmployeeInfo response = storeEmployeeService.joinStore(userId, request);

        ArgumentCaptor<StoreEmployee> captor = ArgumentCaptor.forClass(StoreEmployee.class);
        verify(storeEmployeeRepository).save(captor.capture());
        StoreEmployee toSave = captor.getValue();

        assertThat(toSave.getStatus()).isEqualTo(StoreEmployeeStatus.WAITING);
        assertThat(toSave.getHireDate()).isNull();
        assertThat(response.getEmployeeId()).isEqualTo(100L);
        assertThat(response.getStatus()).isEqualTo(StoreEmployeeStatus.WAITING);
        verify(redisUtil).getData(redisKey);
        verify(chatRoomService, never()).ensurePersonalBotRoomWithWelcome(any(Long.class), any(Long.class));
    }

    @Test
    @DisplayName("매장 합류 신청 실패 - 유효하지 않은 초대 코드")
    void joinStoreFailInvalidInviteCode() {
        Long userId = 2L;
        String inviteCode = "XXXXXX";
        String redisKey = "STORE_INVITE:" + inviteCode;

        User employee = createUser(userId, "직원");
        StoreEmployeeRequestDto.Join request = new StoreEmployeeRequestDto.Join();
        ReflectionTestUtils.setField(request, "inviteCode", inviteCode);

        given(userRepository.findById(userId)).willReturn(Optional.of(employee));
        given(redisUtil.getData(redisKey)).willReturn(null);

        assertThatThrownBy(() -> storeEmployeeService.joinStore(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.INVALID_INVITE_CODE.getMessage());
    }

    @Test
    @DisplayName("직원 합류 승인 성공 - WAITING에서 WORKING으로 전환")
    void approveEmployeeSuccess() {
        Long ownerId = 1L;
        Long storeId = 10L;
        Long employeeId = 100L;

        User owner = createUser(ownerId, "사장님");
        User employeeUser = createUser(2L, "직원");
        Store store = createStore(storeId, owner);
        StoreEmployee employee = createEmployee(employeeId, store, employeeUser, StoreEmployeeStatus.WAITING);
        ReflectionTestUtils.setField(employee, "hireDate", null);

        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
        given(storeEmployeeRepository.findById(employeeId)).willReturn(Optional.of(employee));

        StoreEmployeeResponseDto.EmployeeInfo response = storeEmployeeService.approveEmployee(ownerId, storeId, employeeId);

        assertThat(employee.getStatus()).isEqualTo(StoreEmployeeStatus.WORKING);
        assertThat(employee.getHireDate()).isEqualTo(LocalDate.now());
        assertThat(response.getStatus()).isEqualTo(StoreEmployeeStatus.WORKING);
        verify(chatRoomService).ensurePersonalBotRoomWithWelcome(employeeUser.getId(), storeId);
    }

    @Test
    @DisplayName("직원 합류 승인 실패 - WAITING 상태가 아님")
    void approveEmployeeFailInvalidStatus() {
        Long ownerId = 1L;
        Long storeId = 10L;
        Long employeeId = 100L;

        User owner = createUser(ownerId, "사장님");
        User employeeUser = createUser(2L, "직원");
        Store store = createStore(storeId, owner);
        StoreEmployee employee = createEmployee(employeeId, store, employeeUser, StoreEmployeeStatus.WORKING);

        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
        given(storeEmployeeRepository.findById(employeeId)).willReturn(Optional.of(employee));

        assertThatThrownBy(() -> storeEmployeeService.approveEmployee(ownerId, storeId, employeeId))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.INVALID_EMPLOYEE_STATUS.getMessage());

        verify(chatRoomService, never()).ensurePersonalBotRoomWithWelcome(any(Long.class), any(Long.class));
    }

    @Test
    @DisplayName("내 소속 매장 목록 조회 - RESIGNED, WAITING, INVITED, 폐업 매장 제외")
    void getMyStoresFiltersStatusesAndClosedStores() {
        Long userId = 2L;
        User owner = createUser(1L, "사장님");
        User employee = createUser(userId, "직원");

        Store workingStore = createStore(10L, owner);
        ReflectionTestUtils.setField(workingStore, "name", "영업중 매장");
        Store waitingStore = createStore(11L, owner);
        Store invitedStore = createStore(12L, owner);
        Store resignedStore = createStore(13L, owner);
        Store closedStore = createStore(14L, owner);
        closedStore.closeStore();

        List<StoreEmployee> employees = List.of(
                createEmployee(1001L, workingStore, employee, StoreEmployeeStatus.WORKING),
                createEmployee(1002L, waitingStore, employee, StoreEmployeeStatus.WAITING),
                createEmployee(1003L, invitedStore, employee, StoreEmployeeStatus.INVITED),
                createEmployee(1004L, resignedStore, employee, StoreEmployeeStatus.RESIGNED),
                createEmployee(1005L, closedStore, employee, StoreEmployeeStatus.WORKING)
        );
        given(storeEmployeeRepository.findByUserId(userId)).willReturn(employees);

        List<StoreResponseDto.StoreInfo> result = storeEmployeeService.getMyStores(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStoreId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("매장 직원 목록 조회 - 직원 요청 시 사장 포함, 본인/WAITING/INVITED/RESIGNED 제외")
    void getStoreEmployeesByEmployeeFiltersResults() {
        Long ownerId = 1L;
        Long requesterId = 101L;
        Long storeId = 10L;

        User owner = createUser(ownerId, "사장님");
        User requester = createUser(requesterId, "요청직원");
        User activeUser = createUser(102L, "활성직원");
        User waitingUser = createUser(103L, "대기직원");
        User invitedUser = createUser(104L, "초대직원");
        User resignedUser = createUser(105L, "퇴사직원");
        User leaveUser = createUser(106L, "휴직직원");

        Store store = createStore(storeId, owner);
        StoreEmployee requesterEmployee = createEmployee(2001L, store, requester, StoreEmployeeStatus.WORKING);

        List<StoreEmployee> employees = List.of(
                requesterEmployee,
                createEmployee(2002L, store, activeUser, StoreEmployeeStatus.WORKING),
                createEmployee(2003L, store, waitingUser, StoreEmployeeStatus.WAITING),
                createEmployee(2004L, store, invitedUser, StoreEmployeeStatus.INVITED),
                createEmployee(2005L, store, resignedUser, StoreEmployeeStatus.RESIGNED),
                createEmployee(2006L, store, leaveUser, StoreEmployeeStatus.ON_LEAVE)
        );

        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
        given(storeEmployeeRepository.findByStoreIdAndUserId(storeId, requesterId)).willReturn(Optional.of(requesterEmployee));
        given(storeEmployeeRepository.findByStoreId(storeId)).willReturn(employees);

        List<StoreEmployeeResponseDto.EmployeeInfo> result = storeEmployeeService.getStoreEmployees(requesterId, storeId);

        assertThat(result).extracting(StoreEmployeeResponseDto.EmployeeInfo::getUserId)
                .containsExactlyInAnyOrder(ownerId, activeUser.getId(), leaveUser.getId());
        assertThat(result).noneMatch(info -> info.getUserId().equals(requesterId));
        assertThat(result).noneMatch(info -> info.getUserId().equals(waitingUser.getId()));
        assertThat(result).noneMatch(info -> info.getUserId().equals(invitedUser.getId()));
        assertThat(result).noneMatch(info -> info.getUserId().equals(resignedUser.getId()));
    }

    @Test
    @DisplayName("매장 직원 목록 조회 실패 - WAITING 상태 직원은 조회 불가")
    void getStoreEmployeesFailWhenRequesterIsWaiting() {
        Long ownerId = 1L;
        Long requesterId = 101L;
        Long storeId = 10L;

        User owner = createUser(ownerId, "사장님");
        User requester = createUser(requesterId, "요청직원");
        Store store = createStore(storeId, owner);
        StoreEmployee requesterEmployee = createEmployee(2001L, store, requester, StoreEmployeeStatus.WAITING);

        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
        given(storeEmployeeRepository.findByStoreIdAndUserId(storeId, requesterId)).willReturn(Optional.of(requesterEmployee));

        assertThatThrownBy(() -> storeEmployeeService.getStoreEmployees(requesterId, storeId))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.UNAUTHORIZED_USER.getMessage());
    }

    @Test
    @DisplayName("상태별 직원 목록 조회 성공 - 사장님은 enum 전체 상태로 조회 가능")
    void getStatusEmployeesSuccessForAnyEnumStatus() {
        Long ownerId = 1L;
        Long storeId = 10L;

        User owner = createUser(ownerId, "사장님");
        User bestEmployeeUser = createUser(2L, "우수직원");
        User workingEmployeeUser = createUser(3L, "재직직원");
        Store store = createStore(storeId, owner);

        StoreEmployee bestEmployee = createEmployee(3001L, store, bestEmployeeUser, StoreEmployeeStatus.BEST);
        StoreEmployee workingEmployee = createEmployee(3002L, store, workingEmployeeUser, StoreEmployeeStatus.WORKING);

        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
        given(storeEmployeeRepository.findByStoreId(storeId)).willReturn(List.of(bestEmployee, workingEmployee));

        List<StoreEmployeeResponseDto.EmployeeInfo> result =
                storeEmployeeService.getStatusEmployees(ownerId, storeId, StoreEmployeeStatus.BEST);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(StoreEmployeeStatus.BEST);
    }

    @Test
    @DisplayName("상태별 직원 목록 조회 실패 - 사장님이 아닌 사용자는 조회 불가")
    void getStatusEmployeesFailUnauthorized() {
        Long ownerId = 1L;
        Long requestUserId = 2L;
        Long storeId = 10L;

        User owner = createUser(ownerId, "사장님");
        Store store = createStore(storeId, owner);
        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));

        assertThatThrownBy(() -> storeEmployeeService.getStatusEmployees(requestUserId, storeId, StoreEmployeeStatus.WAITING))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.UNAUTHORIZED_USER.getMessage());
    }

    private User createUser(Long id, String name) {
        User user = User.builder().name(name).build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Store createStore(Long id, User owner) {
        Store store = Store.builder()
                .owner(owner)
                .name("테스트 매장")
                .address("서울")
                .phone("010-0000-0000")
                .qrCode("qr")
                .isOver5Employees(false)
                .build();
        ReflectionTestUtils.setField(store, "id", id);
        return store;
    }

    private StoreEmployee createEmployee(Long employeeId, Store store, User user, StoreEmployeeStatus status) {
        StoreEmployee employee = StoreEmployee.builder()
                .store(store)
                .user(user)
                .status(status)
                .position("직원")
                .hourlyWage(10000)
                .taxType(TaxType.NONE)
                .workedMinutes(0)
                .willWorkingMinutes(0)
                .hireDate(LocalDate.now())
                .dependentsCount(0)
                .includeHolidayPay(false)
                .build();
        ReflectionTestUtils.setField(employee, "id", employeeId);
        return employee;
    }
}
